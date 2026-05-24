import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface McpResource {
  name: string;
  description?: string;
  inputSchema?: any;
  enabled?: boolean;
}

export interface McpConnection {
  id: string;
  name: string;
  type: "Stdio" | "SSE" | "Streamable HTTP";
  commandOrUrl: string;
  env?: Record<string, string>; // Stored encrypted
  allowedPermissions: ("Read" | "Write" | "Execute")[];
  autoSync: boolean;
  status: "Connected" | "Disconnected" | "Error";
  lastSynced?: string;
  errorMessage?: string;
  resources: McpResource[];
}

const STORE_PATH = path.join(process.cwd(), "lib", "mcp_connections_store.json");

// Direct Symmetric Crypto
const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = process.env.ENCRYPTION_SECRET || 'viztr-default-model-router-super-key-32b-length';
const KEY = crypto.scryptSync(SECRET_KEY, 'salt', 32);

export function encryptValue(text: string): string {
  if (!text) return "";
  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error("Encryption failed:", err);
    return text;
  }
}

export function decryptValue(text: string): string {
  if (!text) return "";
  if (!text.includes(':')) return text;
  try {
    const parts = text.split(':');
    if (parts.length !== 3) return text;
    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.warn("Decryption failed:", err);
    return text;
  }
}

export function maskMcpValue(val: string): string {
  if (!val) return "";
  const decrypted = decryptValue(val);
  if (decrypted.length <= 6) return "****";
  return `${decrypted.slice(0, 3)}...****`;
}

let mcpMemoryStore: McpConnection[] | null = null;

export async function readMcpConnectionsStore(): Promise<McpConnection[]> {
  if (mcpMemoryStore) {
    return mcpMemoryStore;
  }
  try {
    if (fs.existsSync(STORE_PATH)) {
      const data = await fs.promises.readFile(STORE_PATH, "utf-8");
      try {
        const parsed = JSON.parse(data) as McpConnection[];
        mcpMemoryStore = parsed;
        return parsed;
      } catch (err) {
        console.error("JSON parsing of MCP connections store failed, using empty list:", err);
        return [];
      }
    } else {
      const initial: McpConnection[] = [];
      await writeMcpConnectionsStore(initial);
      mcpMemoryStore = initial;
      return initial;
    }
  } catch (err) {
    console.error("Error reading MCP store:", err);
    return [];
  }
}

export async function writeMcpConnectionsStore(data: McpConnection[]): Promise<boolean> {
  mcpMemoryStore = data;
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
    await fs.promises.writeFile(STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error writing MCP connections store:", err);
    return false;
  }
}
