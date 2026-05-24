import { NextRequest, NextResponse } from "next/server";
import { readMcpConnectionsStore, writeMcpConnectionsStore, encryptValue, decryptValue, maskMcpValue, McpConnection } from "@/lib/mcpConnectionsStore";
import { logAIRouting } from "@/lib/auditLogger";

export async function GET() {
  try {
    const list = await readMcpConnectionsStore();
    const sanitizedList = list.map((item) => {
      const sanitizedEnv: Record<string, string> = {};
      if (item.env) {
        Object.entries(item.env).forEach(([k, v]) => {
          sanitizedEnv[k] = maskMcpValue(v);
        });
      }
      return {
        ...item,
        env: sanitizedEnv
      };
    });
    return NextResponse.json({ success: true, data: sanitizedList });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, type, commandOrUrl, env, allowedPermissions, autoSync, resources } = body;

    if (!name || !type || !commandOrUrl) {
      return NextResponse.json({ success: false, error: "Name, type, and commandOrUrl are required" }, { status: 400 });
    }

    const list = await readMcpConnectionsStore();
    
    // Encrypt incoming env variables
    const encryptedEnv: Record<string, string> = {};
    if (env && typeof env === "object") {
      Object.entries(env as Record<string, string>).forEach(([k, v]) => {
        if (v && !v.includes("...****")) {
          encryptedEnv[k] = encryptValue(v);
        } else {
          encryptedEnv[k] = v; // If it's empty or already masked
        }
      });
    }

    const newConnection: McpConnection = {
      id: "mcp_" + Math.random().toString(36).substring(2, 9),
      name,
      type,
      commandOrUrl,
      env: encryptedEnv,
      allowedPermissions: allowedPermissions || ["Read"],
      autoSync: autoSync !== undefined ? autoSync : true,
      status: "Disconnected",
      resources: resources || [],
    };

    list.push(newConnection);
    await writeMcpConnectionsStore(list);

    await logAIRouting({
      timestamp: new Date().toISOString(),
      model: "MCP Client Manager",
      task: `Register MCP server: ${name}`,
      status: "SUCCESS",
      details: `Created connection ID: ${newConnection.id} [${type}] with URL/Command: ${commandOrUrl}`
    });

    // Mask env for returning to client
    const returnedEnv: Record<string, string> = {};
    Object.entries(newConnection.env || {}).forEach(([k, v]) => {
      returnedEnv[k] = maskMcpValue(v);
    });

    return NextResponse.json({
      success: true,
      data: {
        ...newConnection,
        env: returnedEnv
      }
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
