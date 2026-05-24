import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface AIConfig {
  id: string; // e.g., "content", "image", "audio", "video"
  task: 'content' | 'image' | 'audio' | 'video';
  connectionType: 'cloud' | 'local';
  provider: string;
  model: string;
  apiKey?: string;
  localEndpoint?: string;
  isActive: boolean;
  status: 'connected' | 'partial' | 'unconfigured';
  lastTested?: string;
}

const STORE_PATH = path.join(process.cwd(), "lib", "ai_settings_store.json");

// Security - AES-256-GCM Key derivation
const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = process.env.ENCRYPTION_SECRET || 'viztr-default-model-router-super-key-32b-length';
const KEY = crypto.scryptSync(SECRET_KEY, 'salt', 32);

export function encryptKey(text: string): string {
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

export function decryptKey(text: string): string {
  if (!text) return "";
  // Check if it's plaintext or encrypted structure (contains colons)
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
    console.warn("Decryption failed (treating as plaintext/corrupt):", err);
    return text;
  }
}

export function maskKey(key: string | undefined): string {
  if (!key) return "";
  const decrypted = decryptKey(key);
  if (!decrypted) return "";
  if (decrypted.length <= 10) return "sk-...****";
  return `${decrypted.slice(0, 6)}...****...${decrypted.slice(-4)}`;
}

const DEFAULT_SETTINGS: AIConfig[] = [
  {
    id: "content",
    task: "content",
    connectionType: "cloud",
    provider: "Google Gemini",
    model: "gemini-3.5-flash",
    apiKey: "",
    localEndpoint: "http://localhost:11434",
    isActive: true,
    status: "unconfigured"
  },
  {
    id: "image",
    task: "image",
    connectionType: "cloud",
    provider: "DALL-E 3",
    model: "dall-e-3",
    apiKey: "",
    localEndpoint: "http://localhost:7860",
    isActive: true,
    status: "unconfigured"
  },
  {
    id: "audio",
    task: "audio",
    connectionType: "cloud",
    provider: "OpenAI TTS",
    model: "tts-1",
    apiKey: "",
    localEndpoint: "http://localhost:5002",
    isActive: true,
    status: "unconfigured"
  },
  {
    id: "video",
    task: "video",
    connectionType: "cloud",
    provider: "Runway ML",
    model: "gen-3-alpha",
    apiKey: "",
    localEndpoint: "http://localhost:8000",
    isActive: true,
    status: "unconfigured"
  }
];

let memoryStore: AIConfig[] | null = null;

export async function readAISettingsStore(): Promise<AIConfig[]> {
  if (memoryStore) {
    return memoryStore;
  }
  try {
    if (fs.existsSync(STORE_PATH)) {
      const data = await fs.promises.readFile(STORE_PATH, "utf-8");
      const parsed = JSON.parse(data) as AIConfig[];
      memoryStore = parsed;
      return parsed;
    } else {
      await writeAISettingsStore(DEFAULT_SETTINGS);
      memoryStore = DEFAULT_SETTINGS;
      return DEFAULT_SETTINGS;
    }
  } catch (err) {
    console.error("Error reading AI settings store, using defaults:", err);
    return DEFAULT_SETTINGS;
  }
}

export async function writeAISettingsStore(data: AIConfig[]): Promise<boolean> {
  memoryStore = data;
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
    await fs.promises.writeFile(STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error writing AI settings store:", err);
    return false;
  }
}
