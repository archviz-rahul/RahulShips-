import { NextRequest, NextResponse } from "next/server";
import { readStore, writeStore, Competitor } from "@/lib/competitorsStore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { competitors } = body;

    if (!competitors || !Array.isArray(competitors)) {
      return NextResponse.json(
        { success: false, error: "Competitors key must be an array of creator items." },
        { status: 400 }
      );
    }

    const currentList = await readStore();
    const allowedPlatforms = ["Instagram", "YouTube", "Substack", "X/Twitter", "LinkedIn", "Other"];

    let addedCount = 0;
    let duplicateCount = 0;
    let invalidCount = 0;
    const addedEntries: Competitor[] = [];
    const errorDetails: string[] = [];

    // Helper to extract username from URL if username is empty
    const extractUsername = (urlStr: string, platform: string): string => {
      try {
        const parsed = new URL(urlStr.trim().startsWith("http") ? urlStr.trim() : `https://${urlStr.trim()}`);
        const parts = parsed.pathname.split("/").filter(Boolean);
        
        if (platform === "Substack" && parsed.hostname.includes(".substack.com")) {
          return parsed.hostname.split(".")[0];
        }
        
        if (parts.length > 0) {
          const first = parts[0];
          return first.startsWith("@") ? first.substring(1) : first;
        }
      } catch {
        // failed parse
      }
      return "";
    };

    for (let i = 0; i < competitors.length; i++) {
      const item = competitors[i];
      const rowNum = i + 1;

      let name = (item.name || "").trim();
      let platform = (item.platform || "Instagram").trim();
      let username = (item.username || "").trim();
      let profileUrl = (item.profileUrl || "").trim();
      let focus = (item.focus || "").trim() || "General Strategy";
      let status = (item.status === "Inactive" ? "Inactive" : "Active");
      let notes = (item.notes || "").trim();
      let likes = (item.likes || "").trim() || "15K avg";
      let hook = (item.hook || "").trim() || "Dynamic storytelling";
      let cta = (item.cta || "").trim() || "Comment 'INFO'";

      // Match platform name variations nicely (case-insensitive)
      const matchedPlatform = allowedPlatforms.find(
        p => p.toLowerCase() === platform.toLowerCase()
      ) || "Other";

      // If username is empty but URL is provided, try auto-extract
      if (!username && profileUrl) {
        username = extractUsername(profileUrl, matchedPlatform);
      }

      // Check required fields
      if (!name) {
        invalidCount++;
        errorDetails.push(`Row ${rowNum}: Creator Name is missing.`);
        continue;
      }
      if (!username) {
        invalidCount++;
        errorDetails.push(`Row ${rowNum}: Username / Handle is missing.`);
        continue;
      }
      if (!profileUrl) {
        invalidCount++;
        errorDetails.push(`Row ${rowNum}: Profile URL is missing.`);
        continue;
      }

      // Quick validate URL
      try {
        new URL(profileUrl.startsWith("http") ? profileUrl : `https://${profileUrl}`);
      } catch {
        invalidCount++;
        errorDetails.push(`Row ${rowNum}: Invalid profile URL format (${profileUrl}).`);
        continue;
      }

      // Ensure platform URL check if possible
      try {
        const urlObj = new URL(profileUrl.startsWith("http") ? profileUrl : `https://${profileUrl}`);
        const host = urlObj.hostname.toLowerCase();
        if (matchedPlatform === "Instagram" && !host.includes("instagram.com")) {
          invalidCount++;
          errorDetails.push(`Row ${rowNum}: URL does not match selected platform Instagram.`);
          continue;
        }
        if (matchedPlatform === "YouTube" && !host.includes("youtube.com") && !host.includes("youtu.be")) {
          invalidCount++;
          errorDetails.push(`Row ${rowNum}: URL does not match selected platform YouTube.`);
          continue;
        }
        if (matchedPlatform === "Substack" && !host.includes("substack.com")) {
          invalidCount++;
          errorDetails.push(`Row ${rowNum}: URL does not match selected platform Substack.`);
          continue;
        }
        if (matchedPlatform === "X/Twitter" && !host.includes("twitter.com") && !host.includes("x.com")) {
          invalidCount++;
          errorDetails.push(`Row ${rowNum}: URL does not match selected platform X/Twitter.`);
          continue;
        }
        if (matchedPlatform === "LinkedIn" && !host.includes("linkedin.com")) {
          invalidCount++;
          errorDetails.push(`Row ${rowNum}: URL does not match selected platform LinkedIn.`);
          continue;
        }
      } catch {
        // safe ignore, general URL syntax already captured
      }

      // Check duplicate handle + platform against existing list
      const normUsername = username.toLowerCase();
      const isExistingDuplicate = currentList.some(
        c => c.platform === matchedPlatform && c.username.toLowerCase() === normUsername
      );

      // Check duplicate within the current import array as well
      const isBatchDuplicate = addedEntries.some(
        c => c.platform === matchedPlatform && c.username.toLowerCase() === normUsername
      );

      if (isExistingDuplicate || isBatchDuplicate) {
        duplicateCount++;
        errorDetails.push(`Row ${rowNum}: Duplicate skipped. @${username} on ${matchedPlatform} is already registered.`);
        continue;
      }

      // Formulate competitor schema
      const newId = String(Date.now() + Math.random().toString(36).substring(2, 5)) + i;
      const parsedComp: Competitor = {
        id: newId,
        name,
        platform: matchedPlatform as Competitor["platform"],
        username,
        profileUrl,
        focus,
        status: status as Competitor["status"],
        notes,
        likes,
        hook,
        cta,
        lastScraped: "Idle",
        createdAt: new Date().toISOString()
      };

      addedEntries.push(parsedComp);
      addedCount++;
    }

    if (addedCount > 0) {
      const updatedList = [...currentList, ...addedEntries];
      const successSave = await writeStore(updatedList);
      if (!successSave) {
        throw new Error("Unable to save compiled competitor records to the store database");
      }
    }

    return NextResponse.json({
      success: true,
      addedCount,
      duplicateCount,
      invalidCount,
      errorDetails
    });

  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process bulk import sequence" },
      { status: 500 }
    );
  }
}
