import { NextRequest, NextResponse } from "next/server";
import { getGemini } from "@/lib/gemini";
import { Type } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const { url, name } = await req.json();

    if (!url || typeof url !== "string" || !url.trim()) {
      return NextResponse.json(
        { success: false, error: "Feed URL is required for auto-categorization." },
        { status: 400 }
      );
    }

    // Attempt to do a quick preview fetch of the feed to get contextual content
    let snippet = "";
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 seconds timeout
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        const text = await response.text();
        snippet = text.slice(0, 1500); // Get first 1500 chars to extract structure/metadata
      }
    } catch (e) {
      console.warn("Could not fetch remote feed URL for inline snippet extraction:", e);
    }

    // Category suggestions
    const validCategories = ["Archviz", "Trading", "AI Tools", "General", "News"];

    const ai = getGemini();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are an expert Content Curation Categorization AI.
Analyze the following RSS feed / website feed media source details and suggest:
1. The most appropriate category from this exact list: ${JSON.stringify(validCategories)}.
2. A polished, friendly feed display name if the current one is empty or generic.

Feed URL: ${url}
User-provided Name: ${name || "None"}
Fetched snippet/sample of source:
"""
${snippet}
"""

You MUST select one of the following exact categories: "Archviz", "Trading", "AI Tools", "General", "News".
Analyze the topics, themes, and content from the URL/snippet. For example:
- Archviz: architecture, interior design, 3D viz, renderings.
- Trading: Forex, stock market, crypto, trading systems, financial models.
- AI Tools: artificial intelligence, ChatGPT, Claude, prompt engineering, SaaS hacks.
- General: general business, standard operations, consulting (non-AI, non-design).
- News: global headlines, breaking world news.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              description: "The matched category name. Must be exactly one of: Archviz, Trading, AI Tools, General, News."
            },
            name: {
              type: Type.STRING,
              description: "A professional, cleaned up title/name for this feed source if appropriate (e.g. 'Daily ArchDev Feed')."
            }
          },
          required: ["category", "name"]
        }
      }
    });

    const bodyText = response.text ? response.text.trim() : "";
    if (!bodyText) {
      throw new Error("No response text from Gemini API.");
    }

    const aiResult = JSON.parse(bodyText);

    // Ensure the category is normalized to one of the valid options
    let resolvedCategory = "General";
    const foundCategory = validCategories.find(
      (cat) => cat.toLowerCase() === aiResult.category?.trim().toLowerCase()
    );
    if (foundCategory) {
      resolvedCategory = foundCategory;
    }

    return NextResponse.json({
      success: true,
      category: resolvedCategory,
      name: aiResult.name || name || "Extracted Feed"
    });

  } catch (err: any) {
    console.error("Error in AI Feed Categorization:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to analyze and categorize content using AI" },
      { status: 500 }
    );
  }
}
