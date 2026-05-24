import { NextRequest, NextResponse } from "next/server";
import { readStore, writeStore, MediaSource } from "@/lib/mediaSourcesStore";

// GET /api/media-sources
export async function GET(req: NextRequest) {
  try {
    const list = await readStore();
    
    // Parse query params for filtering
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    
    let filteredList = [...list];
    
    if (category) {
      filteredList = filteredList.filter(
        (src) => src.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    if (status) {
      filteredList = filteredList.filter((src) => {
        if (status.toLowerCase() === "active") {
          return src.isActive;
        }
        if (status.toLowerCase() === "paused") {
          return !src.isActive || src.status === "PAUSED";
        }
        return src.status.toLowerCase() === status.toLowerCase();
      });
    }
    
    return NextResponse.json({ success: true, data: filteredList });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve media sources" },
      { status: 500 }
    );
  }
}

// POST /api/media-sources
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, url, category, fetchFrequency, isActive, filters } = body;

    // Validate URL
    if (!url || typeof url !== "string" || !url.trim()) {
      return NextResponse.json({ success: false, error: "Feed URL is required" }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ success: false, error: "Must be a valid HTTP or HTTPS URL." }, { status: 400 });
    }

    const currentList = await readStore();

    // Check Duplicate
    const normalizedUrl = url.trim().toLowerCase();
    const isDuplicate = currentList.some((src) => src.url.trim().toLowerCase() === normalizedUrl);
    if (isDuplicate) {
      return NextResponse.json(
        { success: false, error: `A feed source with URL ${url} is already registered.` },
        { status: 400 }
      );
    }

    // Category Validation
    if (!category || typeof category !== "string" || !category.trim()) {
      return NextResponse.json({ success: false, error: "Category is required" }, { status: 400 });
    }

    // Name Validation & Auto-Extraction
    let finalName = name;
    if (!finalName || typeof finalName !== "string" || !finalName.trim()) {
      // Auto-extract feed title from domain
      try {
        const u = new URL(url);
        const hostParts = u.hostname.replace("www.", "").split(".");
        finalName = hostParts[0].charAt(0).toUpperCase() + hostParts[0].slice(1) + " Feed";
      } catch {
        finalName = "Extracted Feed Endpoint";
      }
    }

    if (finalName.length < 3 || finalName.length > 100) {
      return NextResponse.json({ success: false, error: "Feed Display Name must be 3-100 characters long" }, { status: 400 });
    }

    const newId = String(Date.now() + Math.random().toString(36).substring(2, 5));

    const newSource: MediaSource = {
      id: newId,
      name: finalName.trim(),
      url: url.trim(),
      category: category.trim(),
      fetchFrequency: fetchFrequency || "Hourly",
      isActive: isActive !== undefined ? !!isActive : true,
      status: isActive === false ? "PAUSED" : "ALIVE",
      lastFetchedAt: "Just added - pending crawl",
      itemCount: 0,
      averageFetchDuration: 1.2,
      successRate: 100.0,
      filters: {
        include: filters?.include || [],
        exclude: filters?.exclude || []
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedList = [...currentList, newSource];
    const successWrite = await writeStore(updatedList);

    if (!successWrite) {
      throw new Error("Unable to save updated media source to cache store schema");
    }

    return NextResponse.json({ success: true, data: newSource });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create media source" },
      { status: 500 }
    );
  }
}
