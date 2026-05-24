import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { decryptKey } from "./aiSettingsStore";

export function getGemini(): GoogleGenAI {
  let finalKey = process.env.GEMINI_API_KEY || "";

  try {
    const STORE_PATH = path.join(process.cwd(), "lib", "ai_settings_store.json");
    if (fs.existsSync(STORE_PATH)) {
      const data = fs.readFileSync(STORE_PATH, "utf-8");
      const config = JSON.parse(data);
      const contentConfig = config.find((item: any) => item.id === "content");
      if (
        contentConfig &&
        contentConfig.connectionType === "cloud" &&
        contentConfig.provider === "Google Gemini" &&
        contentConfig.apiKey
      ) {
        const decryptedKey = decryptKey(contentConfig.apiKey);
        if (decryptedKey && !decryptedKey.includes("...****") && decryptedKey.length >= 10) {
          finalKey = decryptedKey;
        }
      }
    }
  } catch (err) {
    console.error("Error dynamically resolving custom Gemini API key from ai_settings_store:", err);
  }

  return new GoogleGenAI({
    apiKey: finalKey || "MOCK_KEY",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

export function getGeminiModel(task: string = "content", defaultModel: string = "gemini-3.5-flash"): string {
  try {
    const STORE_PATH = path.join(process.cwd(), "lib", "ai_settings_store.json");
    if (fs.existsSync(STORE_PATH)) {
      const data = fs.readFileSync(STORE_PATH, "utf-8");
      const config = JSON.parse(data);
      const contentConfig = config.find((item: any) => item.id === task);
      if (contentConfig && contentConfig.model && contentConfig.model !== "custom") {
        return contentConfig.model;
      }
    }
  } catch (err) {
    console.error("Error dynamically resolving custom Gemini model from ai_settings_store:", err);
  }
  return defaultModel;
}

