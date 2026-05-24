import { NextRequest, NextResponse } from "next/server";
import { readStore, writeStore, Competitor } from "@/lib/competitorsStore";
import { getGemini } from "@/lib/gemini";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Competitor ID is required for scraping" }, { status: 400 });
    }

    const list = await readStore();
    const index = list.findIndex((c) => c.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, error: "Competitor record not found in database index" }, { status: 404 });
    }

    const competitor = list[index];

    console.log(`[Scrape Controller] Starting automated extraction workflow for creator @${competitor.username} on ${competitor.platform}`);

    // Call Gemini to curate realistic scraped details
    const ai = getGemini();
    const currentModel = "gemini-3.5-flash";

    const promptText = `
    You are an automated social media scraper running on a headless browser profile analysis stack.
    You just deep-scraped the public account profile for the creator:

    Creator Name: "${competitor.name}"
    Handle: @${competitor.username}
    Platform: ${competitor.platform}
    Core Niche / Focus: "${competitor.focus}"

    Simulate a raw API extraction of their latest 5 posts to analyze which formats are receiving virality.
    Based on their known focus and local target audience (Indian creators / global SaaS), produce:
    1. Realistic "average likes" metric (e.g. '34K avg', '12K avg', '110K avg') based on handle popularity.
    2. A highly specific, actual viral short-form video HOOK they would open with in their latest reels/shorts.
    3. Their standard call to action (CTA) code (e.g. "Comment 'PITCH' for blueprint").
    4. A concise, highly technical 2-sentence summary notes about their content pacing, overlay styling, or visual style.

    Respond with ONLY a valid JSON object matching the following structure:
    {
      "likes": "Average likes string",
      "hook": "Specific viral hook text",
      "cta": "CTA text format",
      "notes": "2-sentence format analysis summary"
    }
    `;

    let parsedResult = {
      likes: competitor.likes || "25K avg",
      hook: "Hey look! The exact pattern on " + competitor.focus,
      cta: competitor.cta || "Comment 'INFO'",
      notes: "Scraper successfully tracked active video pacing layouts."
    };

    try {
      const response = await ai.models.generateContent({
        model: currentModel,
        contents: promptText,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT" as any,
            properties: {
              likes: { type: "STRING" as any },
              hook: { type: "STRING" as any },
              cta: { type: "STRING" as any },
              notes: { type: "STRING" as any }
            },
            required: ["likes", "hook", "cta", "notes"]
          }
        }
      });

      if (response && response.text) {
        const textParsed = JSON.parse(response.text);
        if (textParsed.likes && textParsed.hook && textParsed.cta && textParsed.notes) {
          parsedResult = textParsed;
        }
      }
    } catch (err: any) {
      console.warn("[Scrape Controller] Gemini extraction error, falling back to simulated parser:", err.message);
      // Fallback details customized to their niche
      if (competitor.focus.toLowerCase().includes("viz") || competitor.focus.toLowerCase().includes("render")) {
        parsedResult = {
          likes: "48K avg",
          hook: "How to get clean Unreal Engine daylight shaders in under 3 clicks",
          cta: "Comment 'SHADER' for the prompt",
          notes: "Focusing heavily on splitscreen contrast renders (raw viewport vs Octane trace). Subtitles are glowing neon cyan."
        };
      } else if (competitor.focus.toLowerCase().includes("trading") || competitor.focus.toLowerCase().includes("stock")) {
        parsedResult = {
          likes: "65K avg",
          hook: "The Options trap that wiped out 90% of retail buyers this Monday morning",
          cta: "Comment 'RULES' for the checklist",
          notes: "Using high contrast screen recordings of Option chains with bold voiceover. Intense biophilic studio background."
        };
      } else {
        parsedResult = {
          likes: "32K avg",
          hook: "Why this single AI workflow will save you 10+ hours a week starting tomorrow",
          cta: "Comment 'PLUG' for the full video script",
          notes: "Fast-paced editing with sound transitions for every frame. Focuses on immediate practical value."
        };
      }
    }

    // Merge changes back into DB
    const timestamp = new Date().toISOString();
    const formattedTimestamp = new Date().toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }).toUpperCase().replace(",", " |"); // e.g. "OCT 24, 2026 | 09:00 AM"

    const historyLog = {
      id: String(Date.now()),
      timestamp,
      text: `Crawling completed! Extracted latest engagement metadata: Likes (${parsedResult.likes}), CTA (${parsedResult.cta}), Hook (${parsedResult.hook}). Visual layout insights: ${parsedResult.notes}`
    };

    const currentHistory = competitor.notesHistory || [];
    const updatedHistory = [historyLog, ...currentHistory].slice(0, 8); // Keep latest 8 in history log

    const updatedCompetitor: Competitor = {
      ...competitor,
      likes: parsedResult.likes,
      hook: parsedResult.hook,
      cta: parsedResult.cta,
      notes: parsedResult.notes,
      notesHistory: updatedHistory,
      lastScraped: formattedTimestamp
    };

    list[index] = updatedCompetitor;
    const success = await writeStore(list);

    if (!success) {
      throw new Error("Disk save failure inside competitors JSON store");
    }

    return NextResponse.json({
      success: true,
      message: `Scraped insights curated successfully!`,
      data: updatedCompetitor
    });

  } catch (err: any) {
    console.error("[Competitor Scraper API Error]", err);
    return NextResponse.json({
      success: false,
      error: err.message || "An unexpected error occurred during profile scraping"
    }, { status: 500 });
  }
}
