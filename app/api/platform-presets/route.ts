import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const PRESET_PATH = path.join(process.cwd(), "lib", "platform_presets_store.json");

const DEFAULT_PRESETS = {
  presets: [
    { id: "reels", name: "Vertical Video (Instagram/TikTok/Shorts)", resolution: "1080x1920", aspect: "9:16", safeZone: "IG/TikTok UI Safe overlay", quality: "High" },
    { id: "youtube", name: "Horizontal Video (YouTube Long/Tutorial)", resolution: "1920x1080", aspect: "16:9", safeZone: "YouTube watermark margin", quality: "Full HD" },
    { id: "carousel", name: "Square Post (Instagram Carousel/Portrait)", resolution: "1080x1080", aspect: "1:1", safeZone: "IG feed safe rules", quality: "Standard" },
    { id: "thumbnail", name: "Visual Thumbnail (IG/YouTube)", resolution: "1280x720", aspect: "16:9", safeZone: "Logo clear space", quality: "Premium" }
  ],
  autoDetectRules: [
    { trigger: "REEL", preset: "reels" },
    { trigger: "SHORTS", preset: "reels" },
    { trigger: "TIKTOK", preset: "reels" },
    { trigger: "YOUTUBE LONG", preset: "youtube" },
    { trigger: "TUTORIAL", preset: "youtube" },
    { trigger: "CAROUSEL", preset: "carousel" },
    { trigger: "POST", preset: "carousel" },
    { trigger: "THUMBNAIL", preset: "thumbnail" }
  ]
};

async function readPresets() {
  try {
    if (fs.existsSync(PRESET_PATH)) {
      const data = await fs.promises.readFile(PRESET_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.warn("Could not read presets store, using defaults.", err);
  }
  return DEFAULT_PRESETS;
}

async function writePresets(data: any) {
  try {
    const dir = path.dirname(PRESET_PATH);
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
    await fs.promises.writeFile(PRESET_PATH, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Failed to write platform presets:", err);
    return false;
  }
}

export async function GET() {
  const presets = await readPresets();
  return NextResponse.json(presets);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const current = await readPresets();
    
    // Merge or save changes
    if (body.presets) {
      current.presets = body.presets;
    }
    if (body.autoDetectRules) {
      current.autoDetectRules = body.autoDetectRules;
    }
    
    await writePresets(current);
    return NextResponse.json({ success: true, count: current.presets.length });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
