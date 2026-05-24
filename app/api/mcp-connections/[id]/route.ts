import { NextRequest, NextResponse } from "next/server";
import { readMcpConnectionsStore, writeMcpConnectionsStore, encryptValue, decryptValue, maskMcpValue, McpConnection } from "@/lib/mcpConnectionsStore";
import { logAIRouting } from "@/lib/auditLogger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const list = await readMcpConnectionsStore();
    const idx = list.findIndex((x) => x.id === id);

    if (idx === -1) {
      return NextResponse.json({ success: false, error: "Connection not found" }, { status: 404 });
    }

    const current = list[idx];
    const { name, type, commandOrUrl, env, allowedPermissions, autoSync, resources, status, lastSynced } = body;

    // Encrypt updated env variables if modified
    const updatedEnv: Record<string, string> = { ...(current.env || {}) };
    if (env && typeof env === "object") {
      Object.entries(env as Record<string, string>).forEach(([k, v]) => {
        // If empty, clear it
        if (!v) {
          delete updatedEnv[k];
        } else if (!v.includes("...****") && v !== "****") {
          // If it is not a masked string, encrypt and save
          updatedEnv[k] = encryptValue(v);
        }
        // If it is "****", we don't change the encrypted secret stored in updatedEnv[k]
      });
    }

    const updatedConnection: McpConnection = {
      ...current,
      name: name !== undefined ? name : current.name,
      type: type !== undefined ? type : current.type,
      commandOrUrl: commandOrUrl !== undefined ? commandOrUrl : current.commandOrUrl,
      env: updatedEnv,
      allowedPermissions: allowedPermissions !== undefined ? allowedPermissions : current.allowedPermissions,
      autoSync: autoSync !== undefined ? autoSync : current.autoSync,
      resources: resources !== undefined ? resources : current.resources,
      status: status !== undefined ? status : current.status,
      lastSynced: lastSynced !== undefined ? lastSynced : current.lastSynced,
    };

    list[idx] = updatedConnection;
    await writeMcpConnectionsStore(list);

    await logAIRouting({
      timestamp: new Date().toISOString(),
      model: "MCP Client Manager",
      task: `Update MCP connection: ${updatedConnection.name}`,
      status: "SUCCESS",
      details: `Modified connection ID: ${id}. Status: ${updatedConnection.status}. Enabled resources count: ${updatedConnection.resources?.filter(r => r.enabled).length || 0}`
    });

    // Make encrypted values safe for return
    const returnedEnv: Record<string, string> = {};
    Object.entries(updatedConnection.env || {}).forEach(([k, v]) => {
      returnedEnv[k] = maskMcpValue(v);
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updatedConnection,
        env: returnedEnv
      }
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const list = await readMcpConnectionsStore();
    const target = list.find((x) => x.id === id);

    if (!target) {
      return NextResponse.json({ success: false, error: "Connection not found" }, { status: 404 });
    }

    const filtered = list.filter((x) => x.id !== id);
    await writeMcpConnectionsStore(filtered);

    await logAIRouting({
      timestamp: new Date().toISOString(),
      model: "MCP Client Manager",
      task: `Wipe single connection: ${target.name}`,
      status: "SUCCESS",
      details: `Removed connection ID: ${id}`
    });

    return NextResponse.json({ success: true, message: "Connection removed successfully" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
