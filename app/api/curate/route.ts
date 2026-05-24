import { NextRequest, NextResponse } from "next/server";
export const revalidate = 300; // ISR cache route for 5 minutes (300 seconds)
import { getGemini } from "@/lib/gemini";
import { Type } from "@google/genai";
import { readStore } from "@/lib/competitorsStore";
import { loadActiveMcpContext } from "@/lib/mcpContextFetcher";

// Curated Instagram competitor posts for instant high-quality fallback or quick loading
const CURATED_COMPETITORS = [
  {
    username: "vaibhavisinty",
    postUrl: "https://www.instagram.com/vaibhavisinty/",
    likes: 42100,
    comments: 890,
    topic: "3D Render vs Real Walkthrough - Luxury Living Gurgaon",
    hookStyle: "Shocking visual transition from white clay model to realistic gold accent lighting.",
    caption: "Yaar, screen pe jo dikhta hai, kya wo sach mein ban sakta hai? Swipe left to see the final flat! ✨ Designing list of luxury and comfort in India.",
    cta: "Comment 'LIGHTS' and I'll send you the smart-luminaire catalog with Indian budget alternatives!",
    pillar: "Archviz + AI"
  },
  {
    username: "growthschoolio",
    postUrl: "https://www.instagram.com/growthschoolio/",
    likes: 31200,
    comments: 1420,
    topic: "Vibe Coding with AI: Build a full Chrome Extension in 10 mins",
    hookStyle: "Secret knowledge + FOMO - No coding required, just telling AI what to do.",
    caption: "Bhai coding nahi aati? Sharam chhodo aur AI se app banwao! No visual Studio, just plain English prompts to build custom calculators or tools.",
    cta: "Comment 'VIBE' and I'll DM our secret cheat sheet of 15 system-prompts!",
    pillar: "Vibe Coding"
  },
  {
    username: "rajshamani",
    postUrl: "https://www.instagram.com/rajshamani/",
    likes: 125000,
    comments: 2430,
    topic: "The Ultimate India Growth Engine for Next 10 Years",
    hookStyle: "High-contrast hook highlighting why keeping money in bank accounts is a trap.",
    caption: "Dekho, India agle 10 saal mein completely badal raha hai. Freelancing, solo-agency, and trading are creating young crores-makers.",
    cta: "Comment 'STOCKS' for my exclusive podcast summary with India's top retail trader!",
    pillar: "Trading + Systems"
  },
  {
    username: "ishansharma7390",
    postUrl: "https://www.instagram.com/ishansharma7390/",
    likes: 18500,
    comments: 650,
    topic: "How I land freelance design clients in Western Europe from Delhi",
    hookStyle: "Step-by-step cold email breakdown using Indian conversational style.",
    caption: "Suno yaar, Upwork pe bid marna band karo. Seedha founders ke LinkedIn pe reachout karo in Hinglish style with clean renders.",
    cta: "Comment 'CLIENTS' and I'll send you my exact 3-line cold outreach template.",
    pillar: "Builder Journey"
  },
  {
    username: "danmartell",
    postUrl: "https://www.instagram.com/danmartell/",
    likes: 8900,
    comments: 310,
    topic: "Say 'NO' to 10-hour workdays using systemized delegation",
    hookStyle: "Hard-hitting productivity truth highlighting burnout among modern developers.",
    caption: "If you are the only one writing code in your business, you don't own a business. You bought a job from yourself.",
    cta: "Comment 'WORKOUT' for my 1-page delegation master guide.",
    pillar: "Builder Journey"
  }
];

// Curated RSS Substack feed items for fallback in case feeds time out or have connection errors
const CURATED_NEWS_FALLBACK = [
  {
    title: "Google Gemini 1.5 & Next-Gen Architecture Visualisation Flows Launched",
    link: "https://fnstoryai.substack.com/p/gemini-architecture-viz",
    source: "fnstoryai.substack.com",
    pillar: "Archviz + AI"
  },
  {
    title: "How Indian Pro-Traders use Real-Time AI agents for technical options analysis",
    link: "https://getmarketingwithai.substack.com/p/trading-ai-options",
    source: "getmarketingwithai.substack.com",
    pillar: "Trading + Systems"
  },
  {
    title: "The Rise of 'Vibe Coding': How Cursor and Claude are killing boilerplate",
    link: "https://www.understandingai.org/p/rise-of-vibe-coding-cursor",
    source: "understandingai.org",
    pillar: "Vibe Coding"
  },
  {
    title: "How solopreneurs are building micro-SaaS products on weekends in India",
    link: "https://tylerfolkman.substack.com/p/solopreneuring-micro-saas-apps",
    source: "tylerfolkman.substack.com",
    pillar: "Builder Journey"
  },
  {
    title: "OpenAI GPT-4o Real-time Audio triggers trading signals in seconds",
    link: "https://www.thisweekinai.ai/p/gpt4o-audio-trading-signals",
    source: "thisweekinai.ai",
    pillar: "Trading + Systems"
  },
  {
    title: "Render-to-Video AI: Luma Dream Machine & Sora for interior arch-walkthroughs",
    link: "https://claudefornoncoders.substack.com/p/render-to-video-arch-ai",
    source: "claudefornoncoders.substack.com",
    pillar: "Archviz + AI"
  }
];

// Helper to crawl a Substack RSS feed
async function fetchFeed(url: string, sourceName: string) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept': 'application/xml, text/xml, */*'
      },
      signal: AbortSignal.timeout(4000) // 4 second timeout per feed
    });
    if (!res.ok) {
      console.warn(`Feed HTTP status error ${res.status} for ${url}`);
      return [];
    }
    const xml = await res.text();
    const items: { title: string; link: string; source: string }[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < 3) {
      const itemContent = match[1];
      const titleMatch = itemContent.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || itemContent.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/);
      if (titleMatch) {
         let title = titleMatch[1].trim();
         title = title.replace(/<!\[CDATA\[|\]\]>/g, '').trim();
         const link = linkMatch ? linkMatch[1].trim() : url;
         items.push({ title, link, source: sourceName });
      }
    }
    return items;
  } catch (err) {
    console.warn(`Failed parsing RSS feed pointer ${url}:`, err);
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const { pillar, liveScrape, customTarget } = await req.json();

    if (!pillar) {
      return NextResponse.json({ success: false, error: "Pillar is required" }, { status: 400 });
    }

    const consoleLogs: string[] = [];
    consoleLogs.push(`[${new Date().toISOString()}] Starting curation routing for Pillar: ${pillar}`);

    // Query active MCP Context for scripts / content generation
    consoleLogs.push(`Scanning active MCP servers for script and tone directives...`);
    const mcpContext = await loadActiveMcpContext("script");
    if (mcpContext.sourcesUsed.length > 0) {
      consoleLogs.push(`✦ Successfully retrieved custom guidelines from: ${mcpContext.sourcesUsed.join(", ")}`);
    }

    let scrapedCompetitors = CURATED_COMPETITORS;
    let scrapedSubstackNews = CURATED_NEWS_FALLBACK;

    // STEP 1 & 2: Real Scrape if requested and possible
    if (liveScrape) {
      consoleLogs.push(`Live Scraping requested. Running parallel crawler...`);
      // Crawling RSS feeds
      const rssUrls = [
        { name: "fnstoryai", url: "https://fnstoryai.substack.com/feed" },
        { name: "getmarketingwithai", url: "https://getmarketingwithai.substack.com/feed" },
        { name: "understandingai", url: "https://www.understandingai.org/feed" },
        { name: "thisweekinai", url: "https://www.thisweekinai.ai/feed" },
        { name: "tylerfolkman", url: "https://tylerfolkman.substack.com/feed" },
        { name: "excellentsprompts", url: "https://excellentsprompts.substack.com/feed" },
        { name: "claudefornoncoders", url: "https://claudefornoncoders.substack.com/feed" },
        { name: "aieworks", url: "https://aieworks.substack.com/feed" }
      ];

      consoleLogs.push(`Fetching Substack RSS contents in parallel...`);
      const rssPromises = rssUrls.map(f => fetchFeed(f.url, f.name));
      try {
        const rssResults = await Promise.all(rssPromises);
        const aggregatedNews = rssResults.flat();
        if (aggregatedNews.length > 0) {
          scrapedSubstackNews = aggregatedNews.map(item => {
            // Map to corresponding pillar dynamically
            let matchedPillar = "Vibe Coding";
            const titleLower = item.title.toLowerCase();
            if (titleLower.includes("render") || titleLower.includes("architecture") || titleLower.includes("design") || titleLower.includes("luma") || titleLower.includes("visual")) {
              matchedPillar = "Archviz + AI";
            } else if (titleLower.includes("trading") || titleLower.includes("option") || titleLower.includes("stock") || titleLower.includes("market") || titleLower.includes("finance") || titleLower.includes("signal")) {
              matchedPillar = "Trading + Systems";
            } else if (titleLower.includes("bootstrap") || titleLower.includes("solopreneur") || titleLower.includes("saas") || titleLower.includes("indie hack") || titleLower.includes("founder")) {
              matchedPillar = "Builder Journey";
            }
            return {
              ...item,
              pillar: matchedPillar
            };
          });
          consoleLogs.push(`Successfully fetched and parsed ${aggregatedNews.length} news articles live from Substack.`);
        } else {
          consoleLogs.push(`No live articles found or feeds timed out. Utilizing curated high-performance fallback set.`);
        }
      } catch (rssErr) {
        consoleLogs.push(`RSS collection error. Safe state: falling back to curated news.`);
      }

      // Live Apify Instagram Scraping Call
      consoleLogs.push(`Triggering Apify Instagram Scraper run sync...`);
      try {
        const storedCompetitors = await readStore();
        const activeInstaUsernames = storedCompetitors
          .filter(c => c.status === "Active" && c.platform === "Instagram")
          .map(c => c.username);

        const scrapeUsernames = activeInstaUsernames.length > 0
          ? activeInstaUsernames
          : ["vaibhavisinty", "danmartell", "ishansharma7390", "rajshamani", "growthschoolio"];

        consoleLogs.push(`Scraping active handles: ${scrapeUsernames.join(", ")}`);

        const apifyRes = await fetch("https://api.apify.com/v2/acts/instagram-scraper-fast-instagram-post-scraper/run-sync-get-dataset-items?token=apify_ap_ponka&timeout=15", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instagramUsernames: scrapeUsernames,
            postsPerProfile: 5
          }),
          signal: AbortSignal.timeout(8000) // strict timeout so Next route doesn't hang
        });

        if (apifyRes.ok) {
          const rawItems = await apifyRes.json();
          if (Array.isArray(rawItems) && rawItems.length > 0) {
            // Sort top posts by likes or comments and map to schema
            const sorted = rawItems
              .filter(p => p && p.ownerUsername)
              .map(p => {
                const compMatch = storedCompetitors.find(c => c.username.toLowerCase() === p.ownerUsername.toLowerCase());
                let matchedPillar = "Trading + Systems";
                if (compMatch) {
                  if (compMatch.username === "vaibhavisinty") matchedPillar = "Archviz + AI";
                  else if (compMatch.username === "growthschoolio") matchedPillar = "Vibe Coding";
                  else if (["danmartell", "ishansharma7390"].includes(compMatch.username)) matchedPillar = "Builder Journey";
                  else if (compMatch.username === "rajshamani") matchedPillar = "Trading + Systems";
                  else {
                    const focusLower = compMatch.focus.toLowerCase();
                    if (focusLower.includes("render") || focusLower.includes("arch") || focusLower.includes("interior") || focusLower.includes("design")) matchedPillar = "Archviz + AI";
                    else if (focusLower.includes("vibe") || focusLower.includes("code") || focusLower.includes("ai") || focusLower.includes("workshop")) matchedPillar = "Vibe Coding";
                    else if (focusLower.includes("trade") || focusLower.includes("market") || focusLower.includes("option") || focusLower.includes("system")) matchedPillar = "Trading + Systems";
                    else matchedPillar = "Builder Journey";
                  }
                } else {
                  if (["vaibhavisinty"].includes(p.ownerUsername)) matchedPillar = "Archviz + AI";
                  if (["growthschoolio"].includes(p.ownerUsername)) matchedPillar = "Vibe Coding";
                  if (["danmartell", "ishansharma7390"].includes(p.ownerUsername)) matchedPillar = "Builder Journey";
                }

                return {
                  username: p.ownerUsername,
                  postUrl: p.url || `https://instagram.com/p/${p.shortCode || ''}`,
                  likes: p.likesCount || 0,
                  comments: p.commentsCount || 0,
                  topic: p.caption ? p.caption.split('\n')[0].substring(0, 100) : "No Title",
                  hookStyle: "Extracted dynamic hook: " + (p.caption ? p.caption.split('\n')[0] : "Engaging statement"),
                  caption: p.caption || "",
                  cta: "Explore the link in bio",
                  pillar: matchedPillar
                };
              })
              .sort((a, b) => b.likes - a.likes);

            if (sorted.length > 5) {
              scrapedCompetitors = sorted.slice(0, 8);
              consoleLogs.push(`Successfully scraped ${scrapedCompetitors.length} live posts via Apify Instagram scraper!`);
            }
          }
        } else {
          consoleLogs.push(`Apify returned status ${apifyRes.status}. Using high-engagement fallback competitor indices.`);
        }
      } catch (apifyErr) {
        consoleLogs.push(`Apify timeout or authorization limit. Safely fell back to local curated competitor profiles.`);
      }
    } else {
      consoleLogs.push(`Using high-performance cache and curated intelligence metrics for instant load.`);
    }

    // Filter news items related to selected pillar
    const pillarNews = scrapedSubstackNews.filter(n => n.pillar === pillar);
    // If none match, grab some of general news
    const finalNewsToUse = pillarNews.length > 0 ? pillarNews.slice(0, 3) : scrapedSubstackNews.slice(0, 3);

    consoleLogs.push(`Selected Trending Feed for Content Prompt: ${JSON.stringify(finalNewsToUse)}`);

    // Prepare prompt to Gemini for brief generation
    const gemini = getGemini();
    
    // Check if GEMINI_API_KEY is dummy
    const isMockModel = !process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY" || process.env.GEMINI_API_KEY === "MOCK_KEY";
    
    let contentBriefResult: any = null;

    if (isMockModel) {
      consoleLogs.push(`Using custom simulated high-fidelity Hinglish generation engine (AI key not set).`);
      
      // We will generate the mock response in high fidelity based on Selected Pillar so that the app works instantly and beautifully
      const formattedDate = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
      
      contentBriefResult = getCuratedMockBrief(pillar, formattedDate, finalNewsToUse, customTarget);
    } else {
      consoleLogs.push(`Querying high-performance gemini-3.5-flash with custom Hinglish system instructions...`);
      
      const feedContext = finalNewsToUse.map(f => `- [Title]: ${f.title} (Source: ${f.source}, URL: ${f.link})`).join("\n");
      const competitorContext = scrapedCompetitors.map(c => `- @${c.username} in [${c.pillar}]: "${c.topic}" hook structure, CTA: "${c.cta}"`).join("\n");
      
      const systemInstruction = `You are a professional content strategist and genius viral scriptwriter for @RahulShips - an Indian creator.
Your goal is to output a single JSON document matching the exact schema specified.

THE CONTENT STYLE GUIDE (CRITICAL MEASURE OF PERFORMANCE):
- Tone: Extremely personal, high-energy, excited, conversational - like a friend telling you some insane secret he discovered at 2am.
- Language: Conversational Hinglish (Blend of colloquial Hindi and English tech terms).
- Signature words to integrate naturally: 'yaar', 'bhai', 'dekho', 'suno', 'ek second ruk'
- Storytelling: Build suspense like a thriller, hook in the first 5 seconds. Avoid dry introductions!
- Analogies: Explain tech concepts using everyday Indian life (WhatsApp, local chai stalls, local autorickshaws, household jugaad).
- Ending: Always emotional, punchy, or hype-driven, never flat.
- Write actual dialogue for Rahul in the scripts and outlines - do not be formal or generic.

${mcpContext.contextPrompt}

Pilar Context:
- Archviz + AI: 3D render, Twinmotion, Unreal Engine, Lumion, blending realistic Indian daylighting, interior walk-throughs.
- Trading + Systems: Crypto, Stock Market, Scalping, Option Buying vs Selling, Indian trading mindset, volume analysis.
- Vibe Coding: AI coding agents, Bolt.new, Cursor, v0, making complex apps with just prompts, no boilerplate.
- Builder Journey: Starting micro-SaaS, shipping products, building in public, growing audience, startup indie lifestyle in India, monetising skills.

Strictly adhere to the specific JSON Schema requested to ensure the frontend loads correctly.`;

      const promptMsg = `Generate today's structured Daily Content Brief for @RahulShips.
Pillar of the Day: ${pillar}
Date Context: Today's date is ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
Custom Topic Input / Refinement from user (if any): "${customTarget || 'None. Focus on the hottest trending AI news for this pillar.'}"

Here is the current trending research you MUST analyze and build upon:
--- SUBSTACK ARTICLES SCRAPED ---
${feedContext}

--- COMPETITOR INSTAGRAM CRAWLER METRICS ---
${competitorContext}

JSON SCHEMA REQUIREMENT:
You must respond with a strictly valid JSON object having the following keys:
{
  "date": "Today's date",
  "pillar": "${pillar}",
  "trendingToday": [
    { "topic": "Name of trending topic", "whyItMatters": "Explain in exactly 1 line", "sourceName": "Substack URL or name", "sourceUrl": "Source link URL" },
    ... exactly 3 topics ...
  ],
  "reel1": {
    "topic": "Colloquial news topic name",
    "hookStrategy": "Shock + Curiosity Gap description in 1 line",
    "thumbnail": {
      "overlayText": "Giant Hinglish text overlay",
      "expression": "Rahul's face expression (e.g. mindblown, shocked grin)",
      "backgroundDesc": "Visual scene behind him"
    },
    "caption": "Excited Hinglish caption in 3-5 lines ending with a comment-trigger CTA and 15 relevant hashtags",
    "script": "Full video script in Hinglish (200-300 words). Use [PAUSE], [SCREEN: show X], [ZOOM IN] stage directions naturally. Explain with an Indian everyday analogy like chai, autorickshaws or WhatsApp. Integrate 'bhai', 'yaar', 'suno', 'dekho'. Ensure a gripping 3s hook."
  },
  "reel2": {
    "topic": "Colloquial tool/technique topic name",
    "hookStrategy": "Secret Knowledge + FOMO description in 1 line",
    "thumbnail": {
      "overlayText": "FOMO trigger overlay",
      "expression": " राहुल's devious smirk or pointing finger",
      "backgroundDesc": "App screen or interface in background"
    },
    "caption": "Excited Hinglish caption in 3-5 lines ending with comment-trigger CTA and 15 hashtags",
    "script": "Full tool video script in Hinglish (200-300 words). Same storytelling format. Focus on demo workflow. Use stage directions."
  },
  "youtube": {
    "title": "Insanely engaging clickable Hindi Title (clickbait-but-honest)",
    "subtitle": "English subtitle for SEO searchability",
    "category": "AI News Deep-Dive OR Tutorial",
    "pillar": "${pillar}",
    "thumbnail": {
      "overlayText": "High-contrast text under 5 words",
      "expression": "Aesthetic look of Rahul with cool physical props or split screen Renders vs Reality",
      "background": "Cyberpunk styling with neon glow accents cyan/dark"
    },
    "outline": {
      "intro": {
        "content": "Description of the hook, visual cues, graphics in the first 90 seconds",
        "dialogue": "ACTUAL exact Hinglish dialogue lines Rahul says to open the video. Gripping, high-energy."
      },
      "section1": {
        "title": "Introducing the Tech / Concept (1:30-5:00)",
        "content": "Hindi-first explanation of the tech",
        "analogy": "Detailed Indian everyday analogy to make it land perfectly"
      },
      "section2": {
        "title": "Step-by-Step Live Practice/Walkthrough (5:00-10:00)",
        "content": "Technical instructions and visual stages",
        "demoActions": ["Stage 1 action", "Stage 2 action", "Stage 3 action"]
      },
      "section3": {
        "title": "Real-World Indian Case Study (10:00-15:00)",
        "content": "Story of an actual creator or freelancer using this to earn or save hours.",
        "story": "Creative narrative of a freelance architect/trader named Karan or Priya who did something crazy."
      },
      "outro": {
        "content": "Hype close, final message, emotional challenge",
        "dialogue": "Exact dialogue lines Rahul says to inspire and trigger subscriptions."
      }
    }
  },
  "newsletter": {
    "title": "Catchy bilingual Substack Newsletter title",
    "platform": "Substack",
    "readingTime": "5 min read",
    "openingHook": "First paragraph of newsletter: highly personal, story-driven, grabs attention instantly in Hinglish style.",
    "sections": [
      "Key section 1 description of coverage",
      "Key section 2 description of coverage",
      "Key section 3 description of coverage",
      "Key section 4 description of coverage"
    ],
    "closingLine": "Punchy final thought or call-to-action that leaves readers inspired."
  },
  "backups": {
    "architecture": ["Visual backup 1", "Visual backup 2", "Visual backup 3"],
    "trading": ["Trading backup 1", "Trading backup 2", "Trading backup 3"],
    "vibeCoding": ["Vibe Coding backup 1", "Vibe Coding backup 2", "Vibe Coding backup 3"]
  }
}

Do not return any markdown codeblocks or extra text. Return ONLY the stringified JSON.`;

      try {
        const response = await gemini.models.generateContent({
          model: "gemini-3.5-flash",
          contents: promptMsg,
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            temperature: 0.9,
          }
        });
        
        const text = response.text ? response.text.trim() : "";
        contentBriefResult = JSON.parse(text);
        consoleLogs.push(`Successfully generated response from Gemini 3.5. Parse successful.`);
      } catch (geminiErr: any) {
        consoleLogs.push(`Gemini Generation error: ${geminiErr.message || geminiErr}. Initiating recovery state.`);
        // Fallback to custom simulated brief
        const formattedDate = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
        contentBriefResult = getCuratedMockBrief(pillar, formattedDate, finalNewsToUse, customTarget);
      }
    }

    return NextResponse.json({
      success: true,
      logs: consoleLogs,
      data: contentBriefResult,
      mcpSources: mcpContext.sourcesUsed
    });

  } catch (error: any) {
    console.error("Endpoint controller crash:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Internal Server Error"
    }, { status: 500 });
  }
}

// Simulated data rendering function reflecting the exact user instructions & style guide
function getCuratedMockBrief(pillar: string, date: string, sourceArticles: any[], customTarget?: string) {
  const isCustom = !!customTarget;

  if (pillar === "Architecture Visualisation" || pillar === "Archviz + AI") {
    return {
      date: date,
      pillar: pillar,
      trendingToday: [
        {
          topic: isCustom ? `Dynamic Indian Daylight: ${customTarget}` : "Render-to-Video Lumon AI release",
          whyItMatters: "Architects can now convert their 3D static rendering into photorealistic dynamic interior walks in 30 seconds.",
          sourceName: "claudefornoncoders.substack.com",
          sourceUrl: "https://claudefornoncoders.substack.com/p/render-to-video-arch-ai"
        },
        {
          topic: "Twinmotion cloud rendering pricing updates in Asia",
          whyItMatters: "Twinmotion becomes free for designers under $10K freelance earnings, boosting young developers in India.",
          sourceName: "fnstoryai.substack.com",
          sourceUrl: "https://fnstoryai.substack.com/p/gemini-architecture-viz"
        },
        {
          topic: "AI Daylighting & Shadow synthesis on Google Maps 3D Tiles",
          whyItMatters: "Direct integration of real geographical shadows inside Unreal Engine designs for Indian urban hubs.",
          sourceName: "aieworks.substack.com",
          sourceUrl: "https://aieworks.substack.com/feed"
        }
      ],
      reel1: {
        topic: "AI Daylight cheat code for gorgeous 3D Renders",
        hookStrategy: "Shock + Curiosity Gap",
        thumbnail: {
          overlayText: "Renders REJECTED? Ek secret trick suno!",
          expression: "Rahul's head held in frustration, showing a rendering client message: 'This looks fake!'",
          backgroundDesc: "Grey white clay render morphing into a warm, sun-kissed Indian living room with gold shafts."
        },
        caption: "Yaar, client ko realistic design kaise dikhaye? 🤫 No complicated V-Ray settings, screen pe natural and dynamic daylight in one tap! Comment 'RENDER' aur main tools direct link send karunga! \n\n#archviz #designindia #interiorrender #3dsmax #twinmotion #lumion #rahulships #jugaadhacks #mumbaiarchitects #coronarenderer #reelsindia #unrealengine #aitools #freelancearchitect #interiordoctors",
        script: `[SCREEN: Show Rahul looking extremely stressed, holding his phone]
Suno yaar, client bol raha hai "Ye render thoda fake lag raha hai, isme maza nahi aa raha." Aur tumne pichle teen din se computer pe apni aankhein ghis di hain! 

[ZOOM IN on Rahul smiling with a smirk]
Bhai, ek second ruk! Google ka ye naya architectural AI check out kiya tumne? 

[SCREEN: Show side-by-side comparison of dull 3D grey model versus breathtaking gold daylight shafts]
Dekho, Twinmotion ka 3D layout select kiya, map se Delhi ke coordinates dale aur real shadows background se synched ho gai! 

[PAUSE]
Matlab, tumhare render mein wahi ambient light aayegi jo real building mein aane wali hai. Jaise ek normal tapri pe chai banti hai na - perfect ratio of doodh, paani aur chai patti - waise hi is AI ne ambient light aur geo-location ko mix kar diya hai! Ekdum perfect jugaad!

[ZOOM IN]
Client do minute mein bolega, "Bhai, design sign kar, check kaat raha hu!" 

Agar tumko is dynamic AI rendering pipeline ki direct video tutorial chahiye, toh comment karo "RENDER", aur main tumhare inbox mein direct link bhej dunga. Abhi save karlo, baad mein bohot kaam aayega, chalo milte hain! 👋`
      },
      reel2: {
        topic: "Convert rough iPad sketches to photorealistic 3D interior walks",
        hookStrategy: "Secret Knowledge + FOMO",
        thumbnail: {
          overlayText: "Pencil Sketch to 4K Interior Video? 🤯",
          expression: "Rahul pointing with wide excited eyes at a rough black-and-white hand sketch.",
          backgroundDesc: "Luxurious bathroom with glowing LED mirrors and marble walls."
        },
        caption: "Bhai, client ko whiteboard sketch dikhana band karo! This AI lets you turn any hand-drawn room outline into a photorealistic 3D walkthrough video in minutes. Comment 'SKETCH' and I'll DM you the engine details. \n\n#interiordesign #ipadsketch #reelsindia #conceptrender #lumion3d #sketches #unrealengine5 #designerlife #interiordoctors #mumbairunway #freelancerindia #creativemind #hacksindia #architectindia #vibecodes",
        script: `[SCREEN: Shows a hand sketching a bedroom on an iPad, very messy lines]
Yaar, client ko apne haath se banaye sketches dikhao, unhe samajh hi nahi aata! Phir tum baithe rehte ho 3D modeling karne teen ghante...

[ZOOM IN on Rahul, shaking his finger]
Bhai, sharam karo! Ye dekho, maine is rough sketch ko upload kiya ek free AI tool pe, aur isne automatic sun-light trace karke pooray room ko photorealistic luxury interior mein badal diya!

[SCREEN: Smooth fade transition to a spinning 3D rendering showing modern marble walls and lighting]
Ekdm insane, hai na? Jaise hamare yahan naye ghar bante waqt mistri ko samajhne ke liye hum rough sketches banate hai, ye tool bilkul wahi kaam karta hai par look 5-star hotel jaisa deta hai! 

[PAUSE]
Agar tum freelance interior design kar rahe ho, toh ye tool tumhare liye cheat-code hai. Client instantly bolega, "Bhai, tu toh jadugar hai!"

Comment karo 'SKETCH', click-by-click video guides bhejunga. Share with your architect friends right now!`
      },
      youtube: {
        title: "Maine Client Ko 3D Render Dekhakar Shock Kar Diya! (Twinmotion + AI Tutorial) 🤫",
        subtitle: "How to use Geo-spatial AI daylight in Unreal Engine for 10x Faster Architectural Renders",
        category: "Tutorial",
        pillar: "Architecture Visualisation",
        thumbnail: {
          overlayText: "AI + Twinmotion 3D Render Hacks!",
          expression: "Stunned expression holding a tablet rendering an ultra-realistic Indian bungalow.",
          background: "Bright warm glow of golden hours hitting a modern sleek glass villa facade."
        },
        outline: {
          intro: {
            content: "Rahul starts with an interactive sequence showing his own laptop workspace. He has his Unreal Engine viewport loaded and shows how flat lighting ruins a layout.",
            dialogue: "Kya hoga agar main tumse kahun ki render mein light set karne ke liye tumhe 10 saal tak course karne ki zaroorat nahi hai? Ruko yaar! Dekho, ek second mein, lighting flat se seedha dynamic Delhi golden-hour ho jayegi. Ek click. Kaise? Aaj tumhara bhai poori rendering industry ka sabse bada secret kholne wala hai. Suno, skip mat karna, warna bad mein pachhtayoge bhot zyada!"
          },
          section1: {
            title: "The Geo-Location Shadows Concept (1:30-5:00)",
            content: "Explaining how traditional rendering takes hours of sky dome mapping and portal light configuration. Introduce the geo-coordinate API which reads Latitude and Longitude to calculate precise real-world sun angle.",
            analogy: "Explain it like matching the time of a train arrival. If you are standing at the Pune station at 4:30 PM, the tea vendor's shadows fall exactly on the platform at 35 degrees. This AI does exactly that for your 3D luxury buildings."
          },
          section2: {
            title: "Step-by-Step Live Practice (5:00-10:00)",
            content: "Open Twinmotion, import a basic SketchUp file of a modular kitchen or house exterior. Go to Settings > Location, insert custom coordinates, and run the lighting bake tool.",
            demoActions: [
              "Drag and Drop SketchUp modular villa layout",
              "Access Dynamic Weather and Sky Maps inside UE5",
              "Bake the ambient lighting cache with high lumen output"
            ]
          },
          section3: {
            title: "Making 50K INR a Month in India from this (10:00-15:00)",
            content: "Detailed steps on how to pitch this realistic visual to local construction companies or clients who are currently building houses in smaller Indian cities (Tier-2/Tier-3 hubs) like Indore, Pune, or Patna.",
            story: "Imagine Karan, a freelance architect in Pune. Work wasn't picking up. He started pitching 'dynamic video walkthroughs based on actual sunlight analysis' to local builders. Within 1 month, he secured 3 projects charging 20K per render because his lighting looked unbelievably real!"
          },
          outro: {
            content: "Highlighting the future of virtual reality and spatial design in India. Emotional call to subscribe. Hype background audio.",
            dialogue: "Doston, din raat mehnat karo, par smart work ke sath. AI humein replace nahi karega, balki AI ka jugaad seekhne wala designer replace karega! Subscribe ka button tod do yaar, aur niche comment mein batao aur kya seekhna hai! Chalo, see you in the next epic video!"
          }
        }
      },
      newsletter: {
        title: "Renders in the Age of Spatial Intelligence: Are We Done with Poly-counts?",
        platform: "Substack",
        readingTime: "5 min read",
        openingHook: "Bhai, think about this: We spent fifteen years learning polygonal alignment, edge loops, and UV packing in 3ds Max. Yesterday, I uploaded a raw geometry block to a dynamic spatial diffusion engine, typed 'warm afternoon lighting in Jaipur courtyard', and it spit out a render that would take a high-end workstation 12 hours to ray-trace. Let that sink in. The visual bar is dropping to zero, which means your actual aesthetic vision and storytelling is the ONLY thing that protects your job now.",
        sections: [
          "The Death of Ray-trace times: Why server-side dynamic light maps are rendering traditional baking pipelines obsolete.",
          "Case Study: Leveraging real geolocation data APIs within Unreal Engine to pitch client projects with solar shadow physics.",
          "How to transition from a technical 3D labor worker to a Visual Storyteller for luxury developers in developing economies.",
          "A curated toolbox list: 5 free AI-native interior synthesis software you can experiment with today."
        ],
        closingLine: "India's builders are no longer just exporting layout drawings; we are exporting high-fidelity dreams. Make sure you are the one designing them. See you next Thursday!"
      },
      backups: {
        architecture: [
          "Twinmotion free cloud rendering for designers making less than 10K.",
          "How to fix dull wall textures using custom AI displacement map generators.",
          "Speedrunning a 4-bedroom villa exterior design in Unreal Engine under 1 hour."
        ],
        trading: [
          "Using volume-profile indicators to predict Nifty 50 key breakouts.",
          "Option buying vs option selling: My 2am revelation on delta decays.",
          "How to build a personal automated backtesting bot with ChatGPT in Hinglish."
        ],
        vibeCoding: [
          "Bolt.new is insane: Building a multi-tiered SAAS landing page in 5 min.",
          "Why you'll never write a CSS flexbox statement from scratch again.",
          "How to create a functional web app in Hindi voice prompts using AI agents."
        ]
      }
    };
  } else if (pillar === "Trading" || pillar === "Trading + Systems") {
    return {
      date: date,
      pillar: pillar,
      trendingToday: [
        {
          topic: isCustom ? `Delta Hedging: ${customTarget}` : "Nifty Option Chain Trading AI Agents",
          whyItMatters: "Retail traders are adopting local voice-activated trading bots that calculate option delta decay levels in seconds.",
          sourceName: "getmarketingwithai.substack.com",
          sourceUrl: "https://getmarketingwithai.substack.com/p/trading-ai-options"
        },
        {
          topic: "OpenAI GPT-4o trading signals framework launch",
          whyItMatters: "Real-time audio feeds analysis allows matching live CEO comments to instant order executions on global markets.",
          sourceName: "thisweekinai.ai",
          sourceUrl: "https://www.thisweekinai.ai/p/gpt4o-audio-trading-signals"
        },
        {
          topic: "Technical delta Hedging tools for Crypto on Binance Indian Gateway",
          whyItMatters: "Zero transaction fee bots become available for scalp traders using automated grid APIs.",
          sourceName: "understandingai.org",
          sourceUrl: "https://www.understandingai.org/feed"
        }
      ],
      reel1: {
        topic: "The Option-Chain strategy that professional operators hide from you",
        hookStrategy: "Shock + Curiosity Gap",
        thumbnail: {
          overlayText: "Operators ka secret stock pattern leak?! 🤫",
          expression: "Rahul with a deep intense look, finger on lips, red/green candlestick chart graphics in the background.",
          backgroundDesc: "Multiple high-tech screens showing volume profiles and massive order blocks in Nifty index."
        },
        caption: "Bhai, Option Chain to sab dekhte hain, par delta divergence aur open interest trap kisi ko nahi dikhta! 📈 Operator kaise humko fasaate hain, aur hum kaise unki ride pe baith sakte hain? Comment 'DELTA' aur main is backtesting bot ka script aapko bhejunga! \n\n#tradingindia #nifty50 #niftyoptions #banknifty #stockmarketguide #daytraderlife #puneinvestors #delhiretails #optiontrading #scalpingcharts #isb #hacksforlife #chartsanalysis #nseindia #sharemarket",
        script: `[SCREEN: Show huge red candlestick crashing down on a stock chart background, with red alarm light flashing]
Suno yaar, Nifty mein green candle dekhte hi tum option buy karlete ho, aur do minute mein pure trade ka kachra ban jata hai! Loss ho jata hai!

[ZOOM IN on Rahul looking excited]
Bhai, operator ne tumhara stop-loss kha liya aur market wapas upar bhag gaya! Unki sabse badi trick samajh lo aaj.

[SCREEN: Show chart screen zooming into 'Open Interest divergence']
Dekho, jab heavy open interest put options pe built-up hai, and call options pe price decrease ho raha hai - toh ye retail traders ka trap hai! Operator chahta hai ki tum darr ke bech do!

[PAUSE]
Markets ko aise samjho jaise hum Nifty mein local wholesale market ki sabji kharidte hain - jab supply zyada dikhai jati hai taaki rate saste ho jaye, aur operators chupke se sara maal utha lete hain! 

[ZOOM IN]
Jaise hi operators buy karte hain, market boom! Ab hume trap nahi hona, operator ki piche baith ke profit banana hai!

Comment karo 'DELTA', aur main is strategy ko automatically check karne wale python script bhejunga. Save karlo aur lose mat karna!`
      },
      reel2: {
        topic: "Build a Scalping analysis dashboard with Google Sheets in 3 mins",
        hookStrategy: "Secret Knowledge + FOMO",
        thumbnail: {
          overlayText: "Google Sheets banega automatic Scalping System!",
          expression: "Rahul grin, hands pointing at a beautiful spreadsheet that is auto-colouring cells green and red.",
          backgroundDesc: "Bright cyan-glowing spreadsheet cells updating Nifty options data in real-time."
        },
        caption: "Yaar, costly terminal premium softwares pe paise kyun phoonk rahe ho?! 🤯 Google sheets ko static data se real-time analysis engine mein badalo. Comment 'SHEETS' aur main direct tutorial link DMs mein share karunga. \n\n#scalping #daytrading #stockanalysis #niftytips #bankniftyweekly #financialhacks #jugaadtraders #mumbaiinvests #nseindia #reelsindia #wealthdesign #cryptoscalping #optionbuyer #excelhacks #rahulships",
        script: `[SCREEN: Showing a standard, plain Google sheets sheet suddenly updating numbers super fast with glowing red/green cells]
Bhai, costly trading terminals ke liye mahine ka paanch-paanch hazar kharch karne ki bilkul zaroorat nahi hai yaar! 

[ZOOM IN on Rahul smiling with a coffee mug]
Main tumhe bilkul free mein Google Sheets pe ek dynamic scalping trigger dashboard banana sikhata hu. Dekho!

[SCREEN: Shows Rahul typing a script and using imported API link to pull live NSE option stock chain]
Google finance dynamic link se hum direct live option premium, theta decays aur volume pulls ko update karenge. 

[PAUSE]
Jaise hum local local shopkeepers se live wholesale update lete hain na ki aaj aalu ka bhav kya chal raha hai - ye sheet automatic wahi dynamic data update karti hai har 5 seconds mein! Indicator red par, sell. Green par, buy. Short, sweet aur high-accuracy.

Comment karo 'SHEETS' aur main is full workflow templates ka download link direct bhej dunga. Chalo trade control karo, safe raho!`
      },
      youtube: {
        title: "Maine Nifty Options Trading AI Bot Banaya! (Only Option Buying Scalping) 📈",
        subtitle: "How to program a custom volume-divergence option scraper with zero coding experience",
        category: "Tutorial",
        pillar: "Trading",
        thumbnail: {
          overlayText: "Trading AI Bot Tutorial!",
          expression: "Astonished expression on split screen showing safe green trades checklist vs messy chart.",
          background: "Deep dark tech background, neon red/green candles illuminated by cyan accents."
        },
        outline: {
          intro: {
            content: "Rahul sits in front of a multi-monitor trading desk. He plays with a physical LED candlestick widget on his desk.",
            dialogue: "Doston, hum sabko pata hai retail trading mein 90% log loss karte hain. Kyun? Kyunki unka dimaag emotion pe chalta hai, aur operator ka computer computer code pe chalta hai. Par kya hoga agar tumbhi bina koi language seekhe, AI se ek scalping signal system banwa lo? Aaj ka video tumhari trading journey ko badalne wala hai. Ekdum dhyan se suno, end tak!"
          },
          section1: {
            title: "The Delta Decay and Trap Theory (1:30-5:00)",
            content: "Explain option buying mechanics in simple terms. Indian retail traders often fall into 'fading momentum' trap where they buy premium right before option volume collapses.",
            analogy: "Explain it like ice melting. Buying options is like buying an ice cream brick in North India's hot summer heat. If you don't eat it in 10 minutes (fast momentum), it completely melts (theta decay). The operator sells you the ice-cream and makes profit off the puddle!"
          },
          section2: {
            title: "Building the AI Coder Prompt Engine (5:00-10:00)",
            content: "Open ChatGPT/Gemini, feed options parameters and request pine-script for TradingView that highlights volume breakthroughs and prints signals.",
            demoActions: [
              "Write plain English instructions detailing TradingView criteria",
              "Compile code without errors and load Pine Editor in TradingView",
              "Set custom alerts that send alerts instantly to WhatsApp"
            ]
          },
          section3: {
            title: "Simulating Safe Risk Management in India (10:00-15:00)",
            content: "Show the results of backtesting over Nifty data. Focus on strictly taking only 1:2 risk ratio trades, and cutting losses immediately.",
            story: "Let's imagine Priya, ek junior operations manager in Delhi with a capital of 25K. She used to randomly trade in office lunch break. Unka balance was zero in 2 weeks. She shifted to our AI volume indicator, restricted trades strictly to Nifty morning break-out, and is now consistently making 8K to 12K extra per month keeping risk fully locked."
          },
          outro: {
            content: "Emotional conclusion about financial liberation, why self-control is the greatest technical indicator of all. CTA to subscribe.",
            dialogue: "Bhai, market tumse bada hai, main aur tum chote hain. Market ki respect karo, systematic bano. Agar systematic banna hai, toh subscribe banta hai yaar! Comment mein likho 'SURAJ' agar tum discipline se trade karoge kal se. Chalo, bye byte traders!"
          }
        }
      },
      newsletter: {
        title: "The Silent Option Buyer Tax: Why Relying on Indicators is Destitution",
        platform: "Substack",
        readingTime: "5 min read",
        openingHook: "Suno yaar, let's have an honest conversation. Almost every Indian trader has loaded 5 indicators - RSI, MACD, Bollinger Bands, EMA, and Pivot Points. Your chart looks like a modern art painting in a Jaipur museum. But here is the brutal cold truth: All these are lagging derivatives of current price actions. If you buy when all 5 green-light, you are entering right at the peak exhaustion point of the operators. You are essentially paying the operator's exit liquidity tax.",
        sections: [
          "The Anatomy of Delta: How option pricing really behaves when Nifty indices shift sideways.",
          "Building an automated Pine Script alert system to catch retail traps before they clear key resistance markers.",
          "Ditching indicator noise: Transitioning strictly to Volume Profile and order-block footprint charts.",
          "My simple 3-rule backtesting workflow for option buying on Nifty and Bank Nifty morning sessions."
        ],
        closingLine: "Trading isn't about being right 90% of the time; it's about making sure your wins are 3x bigger than your losses. Stop gambling, become a system manager today!"
      },
      backups: {
        architecture: [
          "Twinmotion free cloud rendering for designers making less than 10K.",
          "How to fix dull wall textures using custom AI displacement map generators.",
          "Speedrunning a 4-bedroom villa exterior design in Unreal Engine under 1 hour."
        ],
        trading: [
          "Using volume-profile indicators to predict Nifty 50 key breakouts.",
          "Option buying vs option selling: My 2am revelation on delta decays.",
          "How to build a personal automated backtesting bot with ChatGPT in Hinglish."
        ],
        vibeCoding: [
          "Bolt.new is insane: Building a multi-tiered SAAS landing page in 5 min.",
          "Why you'll never write a CSS flexbox statement from scratch again.",
          "How to create a functional web app in Hindi voice prompts using AI agents."
        ]
      }
    };
  } else if (pillar === "Vibe Coding") {
    // Vibe Coding
    return {
      date: date,
      pillar: pillar,
      trendingToday: [
        {
          topic: isCustom ? `Bolt.new Prompts: ${customTarget}` : "The Rise of 'Vibe Coding' in modern React development",
          whyItMatters: "Software developers can now bypass traditional environment setup and build complex, responsive full-stack SaaS apps strictly using prompts.",
          sourceName: "understandingai.org",
          sourceUrl: "https://www.understandingai.org/p/rise-of-vibe-coding-cursor"
        },
        {
          topic: "Cursor AI editor custom system-prompts workflow",
          whyItMatters: "Pro-developers are reducing boilerplate generation by up to 90%, allowing designers to build apps immediately.",
          sourceName: "aieworks.substack.com",
          sourceUrl: "https://aieworks.substack.com/feed"
        },
        {
          topic: "AI Agents for Chrome Extensions & micro-SaaS creation on Bolt.new",
          whyItMatters: "Indian freelancers can build and launch operational tools on GitHub without installing Node locally.",
          sourceName: "claudefornoncoders.substack.com",
          sourceUrl: "https://claudefornoncoders.substack.com/p/render-to-video-arch-ai"
        }
      ],
      reel1: {
        topic: "Vibe Coding is here and it is killing boilerplate coding!",
        hookStrategy: "Shock + Curiosity Gap",
        thumbnail: {
          overlayText: "Flexbox bhool jao! AI hi coder hai! 🤖",
          expression: "Rahul with hands thrown up in complete excitement, laptop running Cursor editor on screen.",
          backgroundDesc: "Neon-cyan matrix text cascading behind a glowing modern vscode terminal workspace."
        },
        caption: "Bhai coding ab ek superpower ban chuki hai! 🤫 Bolt.new aur Cursor use karke bina setup ke micro-SaaS banao in 5 minutes! Software projects in Hinglish chat structure. Comment 'VIBE' bhejunga guide direct DM mein! \n\n#vibecoding #cursorai #boltnew #nocodeindia #programmerlife #chatgptai #generativeai #delhihackers #indiatech #aisystems #hacksforlife #mumbaicreators #softwaredevelopers #youngindia #jugaadcoder",
        script: `[SCREEN: Show Rahul closing his eyes, leaning back from his keyboard as code writes itself at lightning speed]
Bhai, agar tum abhi bhi VS Code pe ghanton tak React boilerplate aur syntax seekh rahe ho na - toh suno, tum bohot bada mazaak kar rahe ho apne saath!

[ZOOM IN on Rahul looking excited]
"Vibe Coding" ka zamaana aa chuka hai, yaar! Coder ka dimaag, AI ke haath. Dekho!

[SCREEN: Shows a clean responsive web layout building live in the browser sidebar from simple words]
Bina terminal setup ke, maine likha, "Mujhe ek automated daily billing tracker chahiye with glassmorphism UI." Aur do minute ke andar code, database aur responsive layouts ban ke live ho gaye!

[PAUSE]
Ye bilkul waise hai jaise hum local dukan pe jaakar order dete hain ki 'bhai ek mast adrak wali chai banana, thodi mitti ke kuullhad mein' - aur hume kitchen ke pipe connection se koi matlab nahi hota. Hum bas 'vibe' kar rahe hain, and chai ready hai! Coding ab bilkul waisi hi ban chuki hai.

[ZOOM IN]
Bina software license khareede freelancing deals crack karo abhi se!

Comment karo 'VIBE', aur main is Cursor pro guide ka access DM karunga. Save karna seekho, leak mat hone देना!`
      },
      reel2: {
        topic: "Build a complete SaaS landing page in 5 mins using Bolt.new",
        hookStrategy: "Secret Knowledge + FOMO",
        thumbnail: {
          overlayText: "Bina setup SaaS landing page instant live! 🤯",
          expression: "Rahul matching a funny face pointing with complete energy at a futuristic pricing page.",
          backgroundDesc: "Beautiful modern landing page glowing on a dark chrome tab."
        },
        caption: "Yaar, hostinger aur node-modules installation ka rona band karo! Bolt.new pe simple description dalo, page live ho jayega automatic. Comment 'LANDING' aur main top vibe prompts guide details bhejunga! \n\n#boltdev #websitedesign #reelsindia #saasindia #vibeprogramming #reactdeveloper #jugaadi #bangalorecreators #delhitechies #indiatech #startupideas #freelancersdelhi #creativecoder #v0 #shadcn",
        script: `[SCREEN: Close up of a laptop screen where interactive card elements are sliding beautifully into place]
Yaar, ek sundar dashboard website banani hoti hai toh hum package install karte karte thak jate hain. "This package has 15 security warnings..." Rona aa jata hai!

[ZOOM IN on Rahul smiling deviously]
Bhai, is website ko dekho. Bolt.new pe humne bas plain Hinglish chatbot pe prompt bhej diya: "Build me a Nifty profit analyzer dashboard with neon glow theme."

[SCREEN: Show the fully complete responsive dashboard with dynamic charts and dark background]
Do minute ke andar code likh ke, build run karke, live preview provide kar diya! Node setup, GitHub push sab background mein ho gaya automatically!

[PAUSE]
Matlab humein bas focus karna hai client requirements aur pure visual layout par. Baaki computer architecture code AI agent swayam sabhal lega! Indian Freelancers ke liye sach mein kuber ka khazana hai ye technology!

Comment karo 'LANDING', live workspace link setup share karunga. Chalo coding band, vibe shuru karo!`
      },
      youtube: {
        title: "Maine Bina Code Likhe Ek Full SaaS App Banaya! (Cursor + Bolt.new) 🤖",
        subtitle: "The complete guide to AI Vibe Coding for absolute non-tech beginners in Hindi",
        category: "Tutorial",
        pillar: "Vibe Coding",
        thumbnail: {
          overlayText: "Bina Code Likhe SaaS App! 🤫",
          expression: "Pointing excitedly with a glowing digital brain symbol floating nearby.",
          background: "Deep dark canvas, code editor on one side, clean vibrant mobile web app on other."
        },
        outline: {
          intro: {
            content: "Rahul starts with a funny clip of himself tearing a React textbook and tossing it away.",
            dialogue: "Doston, syntax seekhna, loops likhna, brackets laggayi toh check karna - ye sab purane zamane ki baat ho gayi hai. Aaj ke time pe agar tumhare paas bas ek business idea hai, toh tum Cursor aur Bolt.new se bol kar ek ghante mein working software launch kar sakte ho. Aaj tumhara bhai bilkul live tumhare samne ek app banakar launch karke dikhayega. Ruko ek second, skip mat karna!"
          },
          section1: {
            title: "What is the Vibe Coding Revolution (1:30-5:00)",
            content: "Explain the philosophy of vibe coding. The transition from active syntax writing to abstract high-level structural prompt engineering.",
            analogy: "Think of it like driving an automatic luxury car. You don't need to know how the gears, pistons, or internal combustion engine works. You just steer and tap the pedal. Vibe coding runs vscode on autopilot while you are the navigator."
          },
          section2: {
            title: "Building the AI App Live in Cursor (5:00-10:00)",
            content: "Create a complete React project based on custom user request (such as a budget calculator with charts using Recharts). Show prompt instructions, code review, iterative debug, and styling with Tailwind v4.",
            demoActions: [
              "Write the master system-prompt in Cursor composer",
              "Iterate through feedback on chart layouts",
              "Fix typescript build warnings in seconds using AI prompt composer"
            ]
          },
          section3: {
            title: "How to Sell this Service on Upwork / Fiverr (10:00-15:00)",
            content: "Explain how Indian youth who don't have CS degrees can sell design-to-app development services to international clients on Upwork.",
            story: "Suno, Sunny, ek second-year commerce student hai Bihar se. He learned vibe coding last month. Upwork pe local business ke liye booking management custom app develop karne ka client pitch kiya. With Bolt.new, he built the portal in 1 single day and delivered it. Earned $400 for a weekend's work! This is the power of prompt jugaad!"
          },
          outro: {
            content: "Inspirational close about building real products, rising above job scarcity. Sub scribe call with dynamic audio.",
            dialogue: "Bhaiya, India coding mein dunya ka capital hai, aur hum peechhe nahi rahenge. Ideas lao, app banao, launch karo! Niche description mein templates links hain, check out jarur karna. Subscribe ka link daba dena yaar, see you in the coding future!"
          }
        }
      },
      newsletter: {
        title: "The Death of Software Engineering as We Know It (And How We Survive)",
        platform: "Substack",
        readingTime: "5 min read",
        openingHook: "Bhai, look at the panic on developer Twitter. AI coding agents are replacing traditional junior developers at a rate never seen before. But is this actually the end of coders? Far from it. It is the end of high-paid typists. If your daily job is translating a fully designed spec document into boilerplaced React divs and Axios calls, you are in trouble. But if you are a builder who understands what makes product markets move, how users flow, and how databases hold state, you have just been handed a fleet of 50 free engineers working for you 24/7.",
        sections: [
          "Understanding Vibe Coding: The shift from micro-tasks (syntax, linting, imports) to high-level system routing.",
          "SaaS speedrunning: Why static prototypes are dead and live interactive apps are the new standard.",
          "How Cursor Composer is redefining standard developer operations and code reviews for solo product creators.",
          "Our list of 5 pro prompt templates that force any LLM to write clean, type-safe Next.js code without breaking."
        ],
        closingLine: "The future isn't designed by those who write the perfect syntax; it is built by those who vibe with the vision. Grab your keyboard, shift your posture, let's build something today."
      },
      backups: {
        architecture: [
          "Twinmotion free cloud rendering for designers making less than 10K.",
          "How to fix dull wall textures using custom AI displacement map generators.",
          "Speedrunning a 4-bedroom villa exterior design in Unreal Engine under 1 hour."
        ],
        trading: [
          "Using volume-profile indicators to predict Nifty 50 key breakouts.",
          "Option buying vs option selling: My 2am revelation on delta decays.",
          "How to build a personal automated backtesting bot with ChatGPT in Hinglish."
        ],
        vibeCoding: [
          "Bolt.new is insane: Building a multi-tiered SAAS landing page in 5 min.",
          "Why you'll never write a CSS flexbox statement from scratch again.",
          "How to create a functional web app in Hindi voice prompts using AI agents."
        ]
      }
    };
  } else {
    // Builder Journey
    return {
      date: date,
      pillar: pillar,
      trendingToday: [
        {
          topic: isCustom ? `Indie Creator: ${customTarget}` : "Building in Public is India's next freelancing golden egg",
          whyItMatters: "Solopreneurs are generating massive inbound client leads on Twitter & LinkedIn by simply sharing their daily coding logs.",
          sourceName: "tylerfolkman.substack.com",
          sourceUrl: "https://tylerfolkman.substack.com/p/solopreneuring-micro-saas-apps"
        },
        {
          topic: "The 24-Hour Micro-SaaS development blueprint",
          whyItMatters: "Solo indie founders are using dynamic templates and AI prompts to launch payments-ready web tools in under 1 day.",
          sourceName: "aieworks.substack.com",
          sourceUrl: "https://aieworks.substack.com/feed"
        },
        {
          topic: "Solopreneur tools list: Supabase & Stripe rapid deployment",
          whyItMatters: "Young creators in smaller Indian towns are setting up global payment gateways instantly without traditional VC backing.",
          sourceName: "claudefornoncoders.substack.com",
          sourceUrl: "https://claudefornoncoders.substack.com/p/render-to-video-arch-ai"
        }
      ],
      reel1: {
        topic: "How I shipped a product and got 100 users under 24 hours",
        hookStrategy: "Shock + Curiosity Gap",
        thumbnail: {
          overlayText: "Bina setup SaaS launch in 24 hours! 🚀",
          expression: "Rahul pointing with extreme energy at a stripe notification dashboard showing live transactions",
          backgroundDesc: "Sleek SaaS landing page displaying positive user analytics"
        },
        caption: "Yaar, indie hacking in India is blowing up! 🤫 Shram chhodo aur real products ship karo. If you have an idea, turn it into a reality today. Comment 'BUILD' and I'll send you my exact 24-hr launch boilerplate. \n\n#indiehackers #buildinpublic #solopreneur #saaslife #bootstrap #indiafounders #techhacks #productivityhacks #punecreators #vibecheck #microSaaS #launchday #rahulships #jugaadlife",
        script: `[SCREEN: Show Rahul smiling and tapping his credit card on his desk]
Bhai, agar tum abhi bhi lagatar do mahine se bas planning kar rahe ho aur code base setup mein phase hue ho na - toh suno, tum bohot galti kar rahe ho apne saath!

[ZOOM IN with a direct gaze]
Indie hacking ka zamaana hai, yaar! Ideas are cheap, execution and shipping fast is everything. Dekho!

[SCREEN: Show a live Stripe dashboard updating with payment alerts]
Kal raat ko 2 baje ek idea aaya, Cursor aur templates uthaye, and subah tak payment link live ho gayi! Aur dopahar tak 100 beta-users registered!

[PAUSE]
Matlab, tumhe perfect code nahi likhna hai. Jaise ek normal roadside cart pe paratha milta hain na - fast, tasty aur instant hunger killer - waise hi tumhara Product MVP hona chahiye! Pehle product market mein dalo, customer se review lo, and then modify karo!

[ZOOM IN]
Bina bade-bade servers aur VC funds ke apna khud ka digital cashflow chalu karo abhi se!

Comment karo 'BUILD', aur main is elite 24-hr shipping pipeline and structure guide ka access DM karunga. Abhi save karlo, kal kaam aayega. Chalo milte hain! 👋`
      },
      reel2: {
        topic: "Why sharing your coding failures makes you a millionaire creator",
        hookStrategy: "Secret Knowledge + FOMO",
        thumbnail: {
          overlayText: "Failures share karo, audience bulao! 📈",
          expression: "Rahul devious smile, holding a screenshot of a funny runtime bug",
          backgroundDesc: "A Twitter thread with 500K impressions and massive engagement"
        },
        caption: "Yaar, perfect life dikhana band karo. People buy authenticity! When you build in public, you create a trust pipeline that converts faster than any paid ad. Comment 'PUBLIC' and I'll DM our content templates. \n\n#buildinpublic #creatoreconomy #startupindia #freelancedeveloper #indiehackers #jugaadhacks #delhistartups #authenticity #reelsindia #contentstrategy #financialfreedom #rahulships #softwarebuilders",
        script: `[SCREEN: Show Rahul looking disappointed next to a giant red build error on screen]
Yaar, log perfect design, perfect office aur perfect lifestyle dikhate hain reels par. Sab fake hai bhai!

[ZOOM IN on Rahul smiling with a coffee mug]
Suno! Sacchi baat toh ye hai ki people relate with struggle. Maine kal apna server crash showcase kiya LinkedIn par, and guess what?

[SCREEN: Shows beautiful analytics graphs highlighting continuous user acquisition from social media]
Us struggle thread ko dekh kar teen foreign clients ne custom products development ke liye reach out kiya! Building in public is a marketing cheat-code!

[PAUSE]
Matlab jab tum complex system breakdowns, buggy code drafts aur daily learnings live share karte ho na, log tumhari journey ke sath emotional invest ho jate hain! Jaise local match chal raha ho aur stadium ka har banda chilla raha ho - waisa support milta hai!

Comment karo 'PUBLIC' aur main dynamic storybook prompts structure share karunga. Apna startup live build karo dosto!`
      },
      youtube: {
        title: "Maine 24 Hour Mein SaaS Banakar Monetize Kiya! (Hindi Guide) 🚀",
        subtitle: "Step-by-Step Solopreneur Launch Playbook using AI, Stripe and Cursor",
        category: "Tutorial",
        pillar: "Builder Journey",
        thumbnail: {
          overlayText: "AI Solopreneur Success Plan!",
          expression: "Highly focused and aggressive developer pose, overlay of Stripe earnings card",
          background: "Futuristic neon-orange ambient workspace, rich split interface"
        },
        outline: {
          intro: {
            content: "Rahul shows a list of discarded domain names on his registrar's account, then highlights the single domain that generated cash within 24 hours.",
            dialogue: "Doston, syntax seekhna, loops likhna, brackets laggayi toh check karna - ye sab purane zamane ki baat ho gayi hai. Aaj ke time pe agar tumhare paas bas ek business idea hai, toh tum Cursor aur Bolt.new se bol kar ek ghante mein working software launch kar sakte ho. Aaj tumhara bhai bilkul live tumhare samne ek app banakar launch karke dikhayega. Ruko ek second, skip mat karna!"
          },
          section1: {
            title: "The Build-In-Public Mindset (1:30-5:00)",
            content: "Explain why silent execution is a massive mistake in 2026. Explain how creating a direct relationship with your audience makes marketing free.",
            analogy: "Imagine you start a tea shop inside a deep silent cave. Even if it's the finest tea in India, nobody buys. But if you brew it right at the busy traffic light and scream 'bhai adrak wali', everyone grabs a cup! Building in public is exactly that."
          },
          section2: {
            title: "Assembling the Rapid Stack (5:00-10:00)",
            content: "Integrating next-generation boilers: Next.js App router, Tailwind CSS, Supabase local DB, and Razorpay/Stripe billing buttons in 20 minutes.",
            demoActions: [
              "Clone ready-made template repo with auth mapped",
              "Use AI to adjust prompt widgets and metadata definitions",
              "Set up live stripe checkout sessions inside route handler"
            ]
          },
          section3: {
            title: "The Story of an Indian Indie Maker (10:00-15:00)",
            content: "A deep dive into how young students and creators are launching micro startups from tier-3 Indian towns without high-end equipment.",
            story: "Think of Sameer from Indore. He built a small prompt utility for architectural renders, posted daily dev logs on Twitter, and made 1.5 Lakhs within 3 weeks of launching. Sameer didn't have VC funding; he just had a builder vibe."
          },
          outro: {
            content: "Hype closure about why perfect timelines don't exist and taking immediate action is the core superpower.",
            dialogue: "Doston, perfect moment ke liye wait mat karo yaaro. Shuruat karo, fail ho, par ship karo. Duniya unhe yaad rakhti hai jo enter karte hain cricket ground mein, seat pe baithne walo ko nahi! Subscribe karlo, and start building. Love you all, chalo bye!"
          }
        }
      },
      newsletter: {
        title: "The Indie Hacking Playbook: Why You've Planned Envy and Not Shipping",
        platform: "Substack",
        readingTime: "5 min read",
        openingHook: "Bhai, deep down inside, we all suffer from the 'planning trap'. We buy domains, we sketch database relationships on blank paper tabs, we read hacker news posts and we feel incredibly productive. But the actual shipping index? Zero. Yesterday, I met an old friend who spent 6 months writing beautiful, clean, perfectly test-covered architecture for his SAAS. While he was polishing his custom ESLint configurations, three different 19-year-old high-schoolers released raw MVPs of other tools and made their first sales. Shipping is the only validation cycle that matters.",
        sections: [
          "The trap of polished features: Why your first launch should feel incredibly embarrassing.",
          "Assembling your micro stack: Why standard old boilerplates are a direct investment into delivery speed.",
          "Building in Public: Converting raw buggy logs on public streams into unpaid premium users.",
          "Monetization focus: How card payment routers help you find actual customer validators instantly."
        ],
        closingLine: "Stop configuring your compiler configurations and let your product breathe. Take your domain, hook it up, hit deploy, and send it to your first 5 users right now."
      },
      backups: {
        architecture: [
          "Twinmotion free cloud rendering for designers making less than 10K.",
          "How to fix dull wall textures using custom AI displacement map generators.",
          "Speedrunning a 4-bedroom villa exterior design in Unreal Engine under 1 hour."
        ],
        trading: [
          "Using volume-profile indicators to predict Nifty 50 key breakouts.",
          "Option buying vs option selling: My 2am revelation on delta decays.",
          "How to build a personal automated backtesting bot with ChatGPT in Hinglish."
        ],
        vibeCoding: [
          "Bolt.new is insane: Building a multi-tiered SAAS landing page in 5 min.",
          "Why you'll never write a CSS flexbox statement from scratch again.",
          "How to create a functional web app in Hindi voice prompts using AI agents."
        ]
      }
    };
  }
}
