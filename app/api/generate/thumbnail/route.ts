import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { readAISettingsStore, decryptKey } from "@/lib/aiSettingsStore";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { countRateLimit } from "@/lib/rateLimiter";
import { logAIRouting } from "@/lib/auditLogger";
import { loadActiveMcpContext } from "@/lib/mcpContextFetcher";

// Default curated fallback images matching the content dynamic
const fallbackGems = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
];

const thumbnailRequestSchema = z.object({
  concept: z.object({
    overlayText: z.string().optional(),
    text: z.string().optional(),
    expression: z.string().optional(),
    backgroundDesc: z.string().optional(),
    style: z.string().optional(),
  }).optional(),
  platform: z.string().optional(),
  modelConfig: z.any().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Slid-window rate limiter check
    const rateLimit = countRateLimit(req);
    if (!rateLimit.isAllowed) {
      return NextResponse.json({ 
        success: false, 
        error: `Rate limit exceeded. Please wait ${rateLimit.reset}s.` 
      }, { status: 429 });
    }

    const body = await req.json();
    
    // Zod verification
    const validation = thumbnailRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        error: "Validation error: " + validation.error.issues.map(i => i.message).join(", ")
      }, { status: 400 });
    }

    const { concept, platform, modelConfig } = validation.data;

    const overlayText = concept?.overlayText || concept?.text || "Design Insights";
    const expression = concept?.expression || "Focused professional sketch designer";
    const backgroundDesc = concept?.backgroundDesc || "Vivid high contrast design showroom";
    const style = concept?.style || "Cinematic 3D Render style";

    // Format presets resolution mapping
    let resolution = "1080x1080";
    let aspect = "1:1";
    let safeZone = "None";

    const plat = (platform || "reels").toLowerCase();
    let loadedFromStore = false;

    try {
      const PRESET_PATH = path.join(process.cwd(), "lib", "platform_presets_store.json");
      if (fs.existsSync(PRESET_PATH)) {
        const fileContent = fs.readFileSync(PRESET_PATH, "utf-8");
        const parsed = JSON.parse(fileContent);
        if (parsed && parsed.presets) {
          const matchedPreset = parsed.presets.find(
            (p: any) => p.id === plat || p.name.toLowerCase().includes(plat) || p.id.toLowerCase() === plat
          );
          if (matchedPreset) {
            resolution = matchedPreset.resolution || resolution;
            aspect = matchedPreset.aspect || aspect;
            safeZone = matchedPreset.safeZone || safeZone;
            loadedFromStore = true;
            console.log(`[Thumbnail API] Dynamic Preset matched: id=${matchedPreset.id}, res=${resolution}, aspect=${aspect}`);
          }
        }
      }
    } catch (err) {
      console.warn("[Thumbnail API] Could not read user presets, falling back to defaults:", err);
    }

    if (!loadedFromStore) {
      if (plat === "reels" || plat === "shorts" || plat === "tiktok" || plat === "vertical") {
        resolution = "1080x1920";
        aspect = "9:16";
        safeZone = "IG Reels safe boundaries enabled";
      } else if (plat === "youtube" || plat === "tutorial" || plat === "horizontal") {
        resolution = "1920x1080";
        aspect = "16:9";
        safeZone = "YouTube banner margins enabled";
      } else if (plat === "carousel" || plat === "post" || plat === "square") {
        resolution = "1080x1080";
        aspect = "1:1";
        safeZone = "IG feed guidelines enabled";
      } else if (plat === "thumbnail") {
        resolution = "1280x720";
        aspect = "16:9";
        safeZone = "Logo clear space margins enabled";
      }
    }

    // Fetch active MCP context if configured
    const mcpCtrl = await loadActiveMcpContext("thumbnail");
    let backgroundDescWithMcp = backgroundDesc;
    if (mcpCtrl.contextPrompt) {
      backgroundDescWithMcp = `${backgroundDesc}. Custom Guidelines: ${mcpCtrl.contextPrompt}`;
    }

    // Prompt Construction
    const constructedPrompt = `${expression}, ${backgroundDescWithMcp}, ${style}, text overlay: '${overlayText}', high-quality render, platform-safe composition, no clutter, aspect ratio ${aspect}, cinematic lighting`;

    // Load active settings from store or use passed config
    const configs = await readAISettingsStore().catch(() => []);
    const storedImageConfig = configs.find((c: any) => c.id === "image");
    
    const activeImageConfig = modelConfig || storedImageConfig || {
      connectionType: "cloud",
      provider: "Google Gemini",
      model: "gemini-2.5-flash-image",
      apiKey: ""
    } as any;

    const isCloud = activeImageConfig.connectionType === "cloud";
    const provider = activeImageConfig.provider;
    const modelName = activeImageConfig.model || "gemini-2.5-flash-image";
    const rawKey = activeImageConfig.apiKey ? decryptKey(activeImageConfig.apiKey) : "";
    const finalApiKey = rawKey || process.env.GEMINI_API_KEY || "";

    // 1. --- LOCAL CONNECTION ROUTING ---
    if (!isCloud) {
       const endpoint = activeImageConfig.localEndpoint || "http://localhost:7860";
       try {
        console.log(`[Thumbnail API] Routing locally to endpoint ${endpoint}`);
        const res = await fetch(`${endpoint}/sdapi/v1/txt2img`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: constructedPrompt,
            steps: 20,
            width: aspect === "9:16" ? 512 : aspect === "16:9" ? 768 : 512,
            height: aspect === "9:16" ? 912 : aspect === "16:9" ? 432 : 512,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.images && data.images[0]) {
            await logAIRouting({
              timestamp: new Date().toISOString(),
              model: modelName,
              task: "Image Generation",
              status: "SUCCESS",
              details: `Routed through local API endpoint: ${endpoint}`
            });

            return NextResponse.json({
              success: true,
              imageUrl: `data:image/png;base64,${data.images[0]}`,
              aspectRatio: aspect,
              resolution,
              safeZone,
              routedVia: `local-engine (${modelName})`
            });
          }
        }
      } catch (err: any) {
        console.warn("[Thumbnail API] Local image generation failed. Proceeding with fallbacks.", err?.message);
        
        await logAIRouting({
          timestamp: new Date().toISOString(),
          model: modelName,
          task: "Image Generation",
          status: "FAILED",
          details: `Local layout endpoint contact failed at ${endpoint}: ${err.message}`
        });
      }
    }

    // 2. --- OPENAI DALL-E ROUTING ---
    if (isCloud && provider === "DALL-E 3" && finalApiKey) {
      try {
        console.log(`[Thumbnail API] Routing to DALL-E 3...`);
        const res = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${finalApiKey}`
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: constructedPrompt,
            n: 1,
            size: aspect === "9:16" ? "1024x1792" : "1024x1024" // DALL-E vertical format support
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.data && data.data[0]?.url) {
            await logAIRouting({
              timestamp: new Date().toISOString(),
              model: "DALL-E 3",
              task: "Image Generation",
              status: "SUCCESS",
              details: "Cloud thumbnail generation succeeded via OpenAI pipeline"
            });

            return NextResponse.json({
              success: true,
              imageUrl: data.data[0].url,
              aspectRatio: aspect,
              resolution,
              safeZone,
              routedVia: "openai-cloud (DALL-E 3)"
            });
          }
        }
      } catch (err: any) {
        console.error("[Thumbnail API] DALL-E 3 Cloud route exception: ", err?.message);
        
        await logAIRouting({
          timestamp: new Date().toISOString(),
          model: "DALL-E 3",
          task: "Image Generation",
          status: "FAILED",
          details: `OpenAI DALL-E exception triggered: ${err.message}`
        });
      }
    }

    // 3. --- GOOGLE GEMINI ROUTING ---
    // Make sure we have a valid key to run Gemini
    const hasGoogleRoutes = provider === "Google Gemini" || (!provider && finalApiKey);
    if (isCloud && hasGoogleRoutes && finalApiKey && finalApiKey !== "MOCK_KEY" && !finalApiKey.includes("...****")) {
      try {
        console.log(`[Thumbnail API] Routing to Gemini Image Generator...`);
        const ai = new GoogleGenAI({
          apiKey: finalApiKey,
          httpOptions: { headers: { "User-Agent": "aistudio-build" } }
        });

        const imageModel = (modelName === "custom" || !modelName) ? "gemini-2.5-flash-image" : modelName;

        // Try dual models fallback if one fails (e.g. quota limits)
        const modelsToTry = [imageModel, "gemini-2.5-flash-image", "gemini-3.1-flash-image-preview"];
        let base64Image = "";
        let finalModelUsed = "";

        for (const currentModel of modelsToTry) {
          try {
            console.log(`[Thumbnail API] Trying Gemini model: ${currentModel}`);
            const response = await ai.models.generateContent({
              model: currentModel,
              contents: {
                parts: [{ text: constructedPrompt }],
              },
              config: {
                imageConfig: {
                  aspectRatio: aspect as any,
                },
              },
            });

            if (response.candidates?.[0]?.content?.parts) {
              for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                  base64Image = part.inlineData.data || "";
                  break;
                }
              }
            }

            if (base64Image) {
              finalModelUsed = currentModel;
              break;
            }
          } catch (modelErr: any) {
            console.warn(`[Thumbnail API] Model ${currentModel} failed or quota hit:`, modelErr?.message);
          }
        }

        if (base64Image) {
          await logAIRouting({
            timestamp: new Date().toISOString(),
            model: finalModelUsed,
            task: "Image Generation",
            status: "SUCCESS",
            details: "Cloud thumbnail generation succeeded via Google Gemini Imagen route"
          });

          return NextResponse.json({
            success: true,
            imageUrl: `data:image/png;base64,${base64Image}`,
            aspectRatio: aspect,
            resolution,
            safeZone,
            routedVia: `google-cloud-image (${finalModelUsed})`
          });
        }
      } catch (err: any) {
        console.error("[Thumbnail API] Gemini route exception:", err?.message);
        
        await logAIRouting({
          timestamp: new Date().toISOString(),
          model: modelName,
          task: "Image Generation",
          status: "FAILED",
          details: `Google Gemini image exception: ${err.message}`
        });
      }
    }

    // 4. --- HIGH FIDELITY Fallback (Unsplash / Stock) ---
    const hash = Math.abs((overlayText + expression).split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0));
    const finalUrl = fallbackGems[hash % fallbackGems.length];

    await logAIRouting({
      timestamp: new Date().toISOString(),
      model: "Ambient Stock Catalogs",
      task: "Image Generation",
      status: "FALLBACK",
      details: "Configured cloud engines are unreached/unauthenticated. Emitting fallbacks from premium catalog."
    });

    return NextResponse.json({
      success: true,
      imageUrl: finalUrl,
      aspectRatio: aspect,
      resolution,
      safeZone,
      fallbackUsed: true,
      routedVia: "high-fidelity stock fallback",
      note: "Route completed via high-fidelity stock backup catalog because generator endpoints were unreachable or rate-limited."
    });

  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || "Failed to process representation"
    }, { status: 500 });
  }
}
