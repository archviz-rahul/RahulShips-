import { NextRequest, NextResponse } from "next/server";
import { readAISettingsStore, writeAISettingsStore, encryptKey, decryptKey, maskKey, AIConfig } from "@/lib/aiSettingsStore";

// GET /api/ai-settings - Fetch all configs with masked keys
export async function GET() {
  try {
    const list = await readAISettingsStore();
    const sanitisedList = list.map((item) => {
      // Return masked key if present
      const key = item.apiKey ? decryptKey(item.apiKey) : "";
      return {
        ...item,
        apiKey: key ? maskKey(item.apiKey) : ""
      };
    });
    return NextResponse.json({ success: true, data: sanitisedList });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch AI Settings" },
      { status: 500 }
    );
  }
}

// PUT /api/ai-settings - Update all configs
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const newConfigs: AIConfig[] = body.configs;

    if (!Array.isArray(newConfigs)) {
      return NextResponse.json({ success: false, error: "Configs must be an array" }, { status: 400 });
    }

    const currentConfigs = await readAISettingsStore();

    const updatedConfigs = currentConfigs.map((current) => {
      const match = newConfigs.find((c) => c.id === current.id);
      if (!match) return current;

      let keyToStore = current.apiKey; // default to existing API Key

      // If the incoming key is not empty and is not the masked key placeholder, encrypt it!
      const incomingKey = match.apiKey?.trim() || "";
      if (incomingKey && !incomingKey.includes("...****")) {
        keyToStore = encryptKey(incomingKey);
      } else if (incomingKey === "") {
        keyToStore = ""; // user intentionally cleared the key
      }

      // Local Endpoint validation
      let normalizedEndpoint = match.localEndpoint?.trim() || "";
      if (match.connectionType === "local" && normalizedEndpoint) {
        try {
          const url = new URL(normalizedEndpoint);
          const isAllowedHost = ["localhost", "127.0.0.1", "0.0.0.0"].some(
            (host) => url.hostname === host || url.hostname.endsWith(host)
          );
          if (!isAllowedHost) {
            // Warn or restrict but let it save
            console.log("Local host restriction validation warning for hostname:", url.hostname);
          }
        } catch {
          // If URL parsing fails, throw error
          throw new Error(`Invalid local URL endpoint format for task ${match.task}`);
        }
      }

      return {
        ...current,
        connectionType: match.connectionType,
        provider: match.provider,
        model: match.model,
        apiKey: keyToStore,
        localEndpoint: normalizedEndpoint,
        isActive: match.isActive !== undefined ? match.isActive : current.isActive,
        status: match.status || current.status,
        lastTested: match.lastTested || current.lastTested
      } as AIConfig;
    });

    await writeAISettingsStore(updatedConfigs);

    // Return masked version
    const sanitisedList = updatedConfigs.map((item) => ({
      ...item,
      apiKey: item.apiKey ? maskKey(item.apiKey) : ""
    }));

    return NextResponse.json({ success: true, data: sanitisedList });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update AI Settings" },
      { status: 500 }
    );
  }
}
