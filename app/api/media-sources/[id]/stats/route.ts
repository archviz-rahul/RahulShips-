import { NextRequest, NextResponse } from "next/server";
import { readStore } from "@/lib/mediaSourcesStore";

interface RouteParams {
  params: Promise<{ id: string }>;
}

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

    // Generate simulated detailed historical crawl data for stats
    const fetchHistory = [
      { timestamp: "OCT 24, 2026 | 09:00 AM", durationSec: item.averageFetchDuration, status: "SUCCESS", itemsFetched: Math.floor(item.itemCount / 4) },
      { timestamp: "OCT 24, 2026 | 08:00 AM", durationSec: item.averageFetchDuration - 0.1, status: "SUCCESS", itemsFetched: Math.floor(item.itemCount / 5) },
      { timestamp: "OCT 24, 2026 | 07:00 AM", durationSec: item.averageFetchDuration + 0.2, status: "SUCCESS", itemsFetched: Math.floor(item.itemCount / 6) },
      { timestamp: "OCT 24, 2026 | 06:00 AM", durationSec: item.averageFetchDuration + 0.05, status: "SUCCESS", itemsFetched: Math.floor(item.itemCount / 5) },
      { timestamp: "OCT 24, 2026 | 05:00 AM", durationSec: item.averageFetchDuration - 0.05, status: "SUCCESS", itemsFetched: Math.floor(item.itemCount / 4) }
    ];

    return NextResponse.json({
      success: true,
      data: {
        id: item.id,
        name: item.name,
        totalItems: item.itemCount,
        lastFetched: item.lastFetchedAt || "Never",
        successRate: item.successRate,
        averageResponseTime: item.averageFetchDuration,
        fetchHistory
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve source statistics" },
      { status: 500 }
    );
  }
}
