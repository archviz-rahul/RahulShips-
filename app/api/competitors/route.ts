import { NextRequest, NextResponse } from "next/server";
import { readStore, writeStore, Competitor } from "@/lib/competitorsStore";

export async function GET() {
  try {
    const list = await readStore();
    return NextResponse.json({ success: true, data: list });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve competitors" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, platform, username, profileUrl, focus, status, notes, likes, hook, cta, videoDuration } = body;

    // Validation
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ success: false, error: "Competitor Name is required" }, { status: 400 });
    }
    const allowedPlatforms = ["Instagram", "YouTube", "Substack", "X/Twitter", "LinkedIn", "Other"];
    if (!platform || !allowedPlatforms.includes(platform)) {
      return NextResponse.json({ success: false, error: "Invalid platform specified." }, { status: 400 });
    }
    if (!username || typeof username !== "string" || !username.trim()) {
      return NextResponse.json({ success: false, error: "Handle / Username is required" }, { status: 400 });
    }
    if (!profileUrl || typeof profileUrl !== "string" || !profileUrl.trim()) {
      return NextResponse.json({ success: false, error: "Profile URL is required" }, { status: 400 });
    }

    // URL validation
    try {
      new URL(profileUrl);
    } catch {
      return NextResponse.json({ success: false, error: "Profile URL must be a valid absolute URL." }, { status: 400 });
    }

    const currentList = await readStore();

    // Check for duplicate username + platform combo (case-insensitive)
    const normalizedUsername = username.trim().toLowerCase();
    const isDuplicate = currentList.some(
      (comp) => comp.platform === platform && comp.username.trim().toLowerCase() === normalizedUsername
    );

    if (isDuplicate) {
      return NextResponse.json(
        { success: false, error: `A competitor with username @${username} on ${platform} already exists.` },
        { status: 400 }
      );
    }

    // Add new competitor details
    const newId = String(Date.now() + Math.random().toString(36).substring(2, 5));
    
    // Parse duration 
    const parsedDuration = (videoDuration !== undefined && videoDuration !== null && videoDuration !== "") 
      ? Number(videoDuration) 
      : undefined;

    const newCompetitor: Competitor = {
      id: newId,
      name: name.trim(),
      platform: platform as Competitor["platform"],
      username: username.trim(),
      profileUrl: profileUrl.trim(),
      focus: (focus || "General Content").trim(),
      status: (status === "Inactive" ? "Inactive" : "Active") as Competitor["status"],
      notes: (notes || "").trim(),
      notesHistory: notes ? [{ id: "init", timestamp: new Date().toISOString(), text: notes.trim() }] : [],
      likes: (likes || "0 avg").trim(),
      hook: (hook || "Dynamic hooks").trim(),
      cta: (cta || "Comment 'INFO'").trim(),
      lastScraped: "Idle",
      createdAt: new Date().toISOString(),
      videoDuration: parsedDuration
    };

    const updatedList = [...currentList, newCompetitor];
    const successWrite = await writeStore(updatedList);

    if (!successWrite) {
      throw new Error("Unable to save competitor to store database");
    }

    return NextResponse.json({ success: true, data: newCompetitor });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create competitor" },
      { status: 500 }
    );
  }
}
