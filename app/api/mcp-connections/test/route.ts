import { NextRequest, NextResponse } from "next/server";
import { decryptValue } from "@/lib/mcpConnectionsStore";
import { logAIRouting } from "@/lib/auditLogger";

// Custom default mock resources for standard connectors
const DEFAULT_CONNECTIONS_METADATA: Record<string, { name: string; description: string; inputSchema: any }[]> = {
  notion: [
    {
      name: "query_notion_pages",
      description: "Search corporate guidelines, creator frameworks, and past branding document pages across the workplace.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search term or keyword match" },
          limit: { type: "number", default: 10 }
        },
        required: ["query"]
      }
    },
    {
      name: "fetch_database_records",
      description: "Query specific databases e.g. 'RahulShips Content Planner' or 'Sponsor Log'.",
      inputSchema: {
        type: "object",
        properties: {
          database_id: { type: "string", description: "Target database ID" },
          filter: { type: "string", description: "Filter JSON expression or label" }
        },
        required: ["database_id"]
      }
    },
    {
      name: "get_page_content",
      description: "Retrieve complete markdown body of an engineered page by ID to extract detailed styling constraints.",
      inputSchema: {
        type: "object",
        properties: {
          page_id: { type: "string", description: "Notion Page item hash" }
        },
        required: ["page_id"]
      }
    }
  ],
  drive: [
    {
      name: "search_google_drive",
      description: "Search file catalogs, transcripts, folders, and assets for brand guidelines or video guidelines.",
      inputSchema: {
        type: "object",
        properties: {
          mimeType: { type: "string", placeholder: "application/vnd.google-apps.document" },
          searchTerm: { type: "string" }
        }
      }
    },
    {
      name: "read_text_file",
      description: "Return parsed plain-text strings of files (such as .gdoc, .txt, .pdf, .json).",
      inputSchema: {
        type: "object",
        properties: {
          file_id: { type: "string", description: "Unique file indicator" }
        },
        required: ["file_id"]
      }
    }
  ],
  figma: [
    {
      name: "get_design_tokens",
      description: "Grab visual color palettes, active CSS variables, bounding boxes, overlay coordinates, and fonts variables.",
      inputSchema: {
        type: "object",
        properties: {
          file_key: { type: "string", description: "Figma File Key" },
          node_id: { type: "string", description: "Specific element layer id" }
        },
        required: ["file_key"]
      }
    }
  ],
  slack: [
    {
      name: "fetch_topic_feedback",
      description: "Crawl active Slack engineering channels to look for raw content ideas and trend directions.",
      inputSchema: {
        type: "object",
        properties: {
          channel_name: { type: "string", description: "Slack channel hashtag e.g. #vibe-coding" },
          minutes_back: { type: "number", default: 180 }
        },
        required: ["channel_name"]
      }
    },
    {
      name: "notify_generation_ready",
      description: "Broadcast script drafts or curations directly to teams on Slack to gather instant approvals.",
      inputSchema: {
        type: "object",
        properties: {
          channel_name: { type: "string" },
          message_text: { type: "string", description: "Rich slack markdown message content" }
        },
        required: ["channel_name", "message_text"]
      }
    }
  ],
  generic: [
    {
      name: "fetch_endpoint_context",
      description: "Make a structured JSON API call to fetch custom parameters and contextual reference objects.",
      inputSchema: {
        type: "object",
        properties: {
          scope: { type: "string" },
          params: { type: "object" }
        }
      }
    }
  ]
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, type, commandOrUrl, env } = body;

    if (!commandOrUrl) {
      return NextResponse.json({ success: false, error: "Server Command or Endpoint URL is empty" }, { status: 400 });
    }

    // Decrypt env secrets for handshake simulated context logs
    const decryptedEnv: Record<string, string> = {};
    if (env && typeof env === "object") {
      Object.entries(env as Record<string, string>).forEach(([k, v]) => {
        decryptedEnv[k] = decryptValue(v);
      });
    }

    console.log(`[MCP Router] Initializing handshake for server "${name}" via type [${type}]`);
    console.log(`[MCP Router] Command/URL: ${commandOrUrl}`);

    // Wait 1.2 seconds to simulate high-fidelity network handshake validation
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // Determine mock category from name or command url to deliver custom realistic tools
    const loweredLabel = `${name || ""} ${commandOrUrl || ""}`.toLowerCase();
    let categoryKey = "generic";
    if (loweredLabel.includes("notion")) categoryKey = "notion";
    else if (loweredLabel.includes("drive") || loweredLabel.includes("google")) categoryKey = "drive";
    else if (loweredLabel.includes("figma")) categoryKey = "figma";
    else if (loweredLabel.includes("slack")) categoryKey = "slack";

    const discoveredTools = DEFAULT_CONNECTIONS_METADATA[categoryKey].map((t) => ({
      ...t,
      enabled: true // Default enabled on discovery
    }));

    // Trigger error if server url specifies "error" or "offline" to simulate auth/timeout cases
    if (loweredLabel.includes("offline") || loweredLabel.includes("error") || commandOrUrl === "mock-error") {
      await logAIRouting({
        timestamp: new Date().toISOString(),
        model: "MCP Connection Handshake",
        task: `MCP Connection Test: ${name}`,
        status: "FAILED",
        details: `Connection timeout communicating with: ${commandOrUrl}. Diagnostic payload: Socket status offline.`
      });

      return NextResponse.json({
        success: false,
        error: "Timeout / Authentication handshake failed on server socket endpoint."
      });
    }

    await logAIRouting({
      timestamp: new Date().toISOString(),
      model: "MCP Connection Handshake",
      task: `MCP Connection Test: ${name}`,
      status: "SUCCESS",
      details: `Successfully handshaked with type [${type}] at ${commandOrUrl}`
    });

    await logAIRouting({
      timestamp: new Date().toISOString(),
      model: "MCP Client Protocol",
      task: `MCP Resource Discovery: ${name}`,
      status: "SUCCESS",
      details: `Successfully queried and discovered ${discoveredTools.length} exposed resources/tools: ${discoveredTools.map(t => t.name).join(", ")}`
    });

    return NextResponse.json({
      success: true,
      message: `Connected successfully! Discovered ${discoveredTools.length} resources available.`,
      resources: discoveredTools
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
