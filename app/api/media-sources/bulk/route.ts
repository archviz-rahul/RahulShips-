import { NextRequest, NextResponse } from "next/server";
import { readStore, writeStore, MediaSource } from "@/lib/mediaSourcesStore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ids, action } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: "An array of non-empty ids is required" }, { status: 400 });
    }

    const allowedActions = ["activate", "pause", "delete", "refresh"];
    if (!action || !allowedActions.includes(action)) {
      return NextResponse.json({ success: false, error: "Invalid action. Supported actions: activate, pause, delete, refresh" }, { status: 400 });
    }

    const list = await readStore();
    let updatedList: MediaSource[] = [];
    let modifiedCount = 0;

    if (action === "delete") {
      // Retain only those not specified in our selection
      updatedList = list.filter((src) => !ids.includes(src.id));
      modifiedCount = list.length - updatedList.length;
    } else {
      updatedList = list.map((src) => {
        if (ids.includes(src.id)) {
          modifiedCount++;
          const nowText = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
          const todayDate = "OCT 24, 2026"; // Consistent placeholder date matching workspace context
          if (action === "activate") {
            return {
              ...src,
              isActive: true,
              status: "ALIVE" as const,
              updatedAt: new Date().toISOString()
            };
          } else if (action === "pause") {
            return {
              ...src,
              isActive: false,
              status: "PAUSED" as const,
              updatedAt: new Date().toISOString()
            };
          } else if (action === "refresh") {
            return {
              ...src,
              lastFetchedAt: `${todayDate} | ${nowText}`,
              itemCount: src.itemCount + Math.floor(Math.random() * 8) + 1,
              status: "ALIVE" as const,
              averageFetchDuration: Number((1.0 + Math.random() * 0.4).toFixed(2)),
              successRate: Number((98.0 + Math.random() * 2.0).toFixed(1)),
              updatedAt: new Date().toISOString()
            };
          }
        }
        return src;
      });
    }

    const successWrite = await writeStore(updatedList);
    if (!successWrite) {
      throw new Error(`Unable to execute bulk ${action} in store database.`);
    }

    return NextResponse.json({
      success: true,
      modifiedCount,
      message: `Completed bulk execution: ${action} successfully processed for ${modifiedCount} item(s).`
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Bulk action failed" },
      { status: 500 }
    );
  }
}
