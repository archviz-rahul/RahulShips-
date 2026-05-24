import { NextRequest, NextResponse } from "next/server";
import { writeMcpConnectionsStore } from "@/lib/mcpConnectionsStore";
import { logAIRouting } from "@/lib/auditLogger";

export async function POST() {
  try {
    // Write empty array to completely wipe out connections
    await writeMcpConnectionsStore([]);

    await logAIRouting({
      timestamp: new Date().toISOString(),
      model: "MCP Client Manager",
      task: "Revoke All Credentials",
      status: "SUCCESS",
      details: "Wiped out all registered Model Context Protocol connections and variables instantly."
    });

    return NextResponse.json({
      success: true,
      message: "All registered MCP connection credentials and context channels have been severed and wiped."
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
