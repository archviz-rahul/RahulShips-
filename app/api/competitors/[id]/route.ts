import { NextRequest, NextResponse } from "next/server";
import { readStore, writeStore, Competitor } from "@/lib/competitorsStore";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Competitor ID is required" }, { status: 400 });
    }

    const body = await req.json();
    const { name, platform, username, profileUrl, focus, status, notes, notesHistory, likes, hook, cta, lastScraped, videoDuration } = body;

    const list = await readStore();
    const index = list.findIndex((comp) => comp.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, error: "Competitor not found" }, { status: 404 });
    }

    // Validation
    if (name !== undefined && (!name || typeof name !== "string" || !name.trim())) {
      return NextResponse.json({ success: false, error: "Competitor Name cannot be empty" }, { status: 400 });
    }

    const allowedPlatforms = ["Instagram", "YouTube", "Substack", "X/Twitter", "LinkedIn", "Other"];
    if (platform !== undefined && (!platform || !allowedPlatforms.includes(platform))) {
      return NextResponse.json({ success: false, error: "Invalid platform specified." }, { status: 400 });
    }

    if (username !== undefined && (!username || typeof username !== "string" || !username.trim())) {
      return NextResponse.json({ success: false, error: "Handle / Username cannot be empty" }, { status: 400 });
    }

    if (profileUrl !== undefined) {
      if (!profileUrl || typeof profileUrl !== "string" || !profileUrl.trim()) {
        return NextResponse.json({ success: false, error: "Profile URL is required" }, { status: 400 });
      }
      try {
        new URL(profileUrl);
      } catch {
        return NextResponse.json({ success: false, error: "Profile URL must be a valid absolute URL." }, { status: 400 });
      }
    }

    const currentComp = list[index];
    const finalPlatform = platform !== undefined ? platform : currentComp.platform;
    const finalUsername = username !== undefined ? username.trim() : currentComp.username;

    // Check duplicate handle + platform (excluding current item)
    if (platform !== undefined || username !== undefined) {
      const normalizedUsername = finalUsername.toLowerCase();
      const isDuplicate = list.some(
        (comp) =>
          comp.id !== id &&
          comp.platform === finalPlatform &&
          comp.username.trim().toLowerCase() === normalizedUsername
      );

      if (isDuplicate) {
        return NextResponse.json(
          { success: false, error: `A competitor with username @${finalUsername} on ${finalPlatform} already exists.` },
          { status: 400 }
        );
      }
    }

    // Parse duration 
    const finalVideoDuration = videoDuration !== undefined 
      ? ((videoDuration !== null && videoDuration !== "") ? Number(videoDuration) : undefined) 
      : currentComp.videoDuration;

    // Merge modifications
    const updatedCompetitor: Competitor = {
      ...currentComp,
      name: name !== undefined ? name.trim() : currentComp.name,
      platform: finalPlatform as Competitor["platform"],
      username: finalUsername,
      profileUrl: profileUrl !== undefined ? profileUrl.trim() : currentComp.profileUrl,
      focus: focus !== undefined ? focus.trim() : currentComp.focus,
      status: status !== undefined ? (status === "Inactive" ? "Inactive" : "Active") : currentComp.status,
      notes: notes !== undefined ? notes.trim() : currentComp.notes,
      notesHistory: notesHistory !== undefined ? notesHistory : currentComp.notesHistory,
      likes: likes !== undefined ? likes.trim() : currentComp.likes,
      hook: hook !== undefined ? hook.trim() : currentComp.hook,
      cta: cta !== undefined ? cta.trim() : currentComp.cta,
      lastScraped: lastScraped !== undefined ? lastScraped : currentComp.lastScraped,
      videoDuration: finalVideoDuration,
    };

    list[index] = updatedCompetitor;
    const successWrite = await writeStore(list);

    if (!successWrite) {
      throw new Error("Unable to save updated competitor to store database");
    }

    return NextResponse.json({ success: true, data: updatedCompetitor });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to edit competitor" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Competitor ID is required" }, { status: 400 });
    }

    const list = await readStore();
    const index = list.findIndex((comp) => comp.id === id);

    if (index === -1) {
      return NextResponse.json({ success: false, error: "Competitor not found" }, { status: 404 });
    }

    const removedItem = list[index];
    const updatedList = list.filter((comp) => comp.id !== id);
    const successWrite = await writeStore(updatedList);

    if (!successWrite) {
      throw new Error("Unable to save deleted changes to store database");
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${removedItem.name}`,
      id
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete competitor" },
      { status: 500 }
    );
  }
}
