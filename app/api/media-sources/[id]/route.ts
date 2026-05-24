import { NextRequest, NextResponse } from "next/server";
import { readStore, writeStore, MediaSource } from "@/lib/mediaSourcesStore";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/media-sources/[id]
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Media source ID is required" }, { status: 400 });
    }

    const list = await readStore();
    const item = list.find((src) => src.id === id);

    if (!item) {
      return NextResponse.json({ success: false, error: "Media source not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: item });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve media source" },
      { status: 500 }
    );
  }
}

// PUT /api/media-sources/[id] (or PATCH) Let's make PUT and PATCH both supported.
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Media source ID is required" }, { status: 400 });
    }

    const body = await req.json();
    const { name, url, category, fetchFrequency, isActive, status, filters, itemCount } = body;

    const list = await readStore();
    const index = list.findIndex((src) => src.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, error: "Media source not found" }, { status: 404 });
    }

    const currentSource = list[index];

    // URL validation if modifying URL
    if (url !== undefined) {
      if (!url || typeof url !== "string" || !url.trim()) {
        return NextResponse.json({ success: false, error: "Feed URL can't be empty" }, { status: 400 });
      }
      try {
        new URL(url);
      } catch {
        return NextResponse.json({ success: false, error: "Must be a valid HTTP or HTTPS URL." }, { status: 400 });
      }

      // Check Duplicates
      const normalizedUrl = url.trim().toLowerCase();
      const isDuplicate = list.some(
        (src) => src.id !== id && src.url.trim().toLowerCase() === normalizedUrl
      );
      if (isDuplicate) {
        return NextResponse.json(
          { success: false, error: `A feed source with URL ${url} is already registered.` },
          { status: 400 }
        );
      }
    }

    // Name Validation
    if (name !== undefined) {
      if (!name || typeof name !== "string" || !name.trim()) {
        return NextResponse.json({ success: false, error: "Feed Name is required" }, { status: 400 });
      }
      if (name.length < 3 || name.length > 100) {
        return NextResponse.json({ success: false, error: "Feed Display Name must be 3-100 characters long" }, { status: 400 });
      }
    }

    // Category Validation
    if (category !== undefined) {
      if (!category || typeof category !== "string" || !category.trim()) {
        return NextResponse.json({ success: false, error: "Category is required" }, { status: 400 });
      }
    }

    // Prepare updated object
    const updatedSource: MediaSource = {
      ...currentSource,
      name: name !== undefined ? name.trim() : currentSource.name,
      url: url !== undefined ? url.trim() : currentSource.url,
      category: category !== undefined ? category.trim() : currentSource.category,
      fetchFrequency: fetchFrequency !== undefined ? fetchFrequency : currentSource.fetchFrequency,
      isActive: isActive !== undefined ? !!isActive : currentSource.isActive,
      status: status !== undefined ? status : (isActive === false ? "PAUSED" : (currentSource.status === "PAUSED" ? "ALIVE" : currentSource.status)),
      itemCount: itemCount !== undefined ? Number(itemCount) : currentSource.itemCount,
      filters: filters !== undefined ? {
        include: filters.include || currentSource.filters.include || [],
        exclude: filters.exclude || currentSource.filters.exclude || []
      } : currentSource.filters,
      updatedAt: new Date().toISOString()
    };

    list[index] = updatedSource;
    const successWrite = await writeStore(list);

    if (!successWrite) {
      throw new Error("Unable to save updated media source to local cache store");
    }

    return NextResponse.json({ success: true, data: updatedSource });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update media source" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  return PUT(req, { params });
}

// DELETE /api/media-sources/[id]
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Media source ID is required" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const cascade = searchParams.get("cascade") === "true";

    const list = await readStore();
    const index = list.findIndex((src) => src.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, error: "Media source not found" }, { status: 404 });
    }

    const removedItem = list[index];
    const updatedList = list.filter((src) => src.id !== id);
    const successWrite = await writeStore(updatedList);

    if (!successWrite) {
      throw new Error("Unable to delete media source from cache store");
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${removedItem.name}. Cascade option: ${cascade ? "hard delete cache" : "keep cached items"}.`,
      id
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete media source" },
      { status: 500 }
    );
  }
}
