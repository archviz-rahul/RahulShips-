import fs from "fs";
import path from "path";

export interface MediaSourceFilter {
  include?: string[];
  exclude?: string[];
}

export interface MediaSource {
  id: string;
  name: string;
  url: string;
  category: string;
  fetchFrequency: string; // e.g. "Every 15min", "Hourly", "Every 6 hours", "Daily"
  isActive: boolean;
  status: "ALIVE" | "DEAD" | "PAUSED";
  lastFetchedAt?: string;
  itemCount: number;
  averageFetchDuration: number; // in seconds, e.g. 1.2
  successRate: number; // e.g. 99.8
  filters: MediaSourceFilter;
  createdAt: string;
  updatedAt: string;
}

const STORE_PATH = path.join(process.cwd(), "lib", "media_sources_store.json");

const SEED_SOURCES: MediaSource[] = [
  {
    id: "1",
    name: "ArchDaily Architecture Feed",
    url: "https://www.archdaily.com/feed",
    category: "Archviz",
    fetchFrequency: "Hourly",
    isActive: true,
    status: "ALIVE",
    lastFetchedAt: "OCT 24, 2026 | 09:00 AM",
    itemCount: 156,
    averageFetchDuration: 1.1,
    successRate: 100,
    filters: { include: [], exclude: [] },
    createdAt: new Date("2026-05-22T02:00:00Z").toISOString(),
    updatedAt: new Date("2026-05-22T02:00:00Z").toISOString()
  },
  {
    id: "2",
    name: "Behance Interior Inspiration Feed",
    url: "https://www.behance.net/feed",
    category: "Archviz",
    fetchFrequency: "Every 6 hours",
    isActive: true,
    status: "ALIVE",
    lastFetchedAt: "OCT 24, 2026 | 08:30 AM",
    itemCount: 82,
    averageFetchDuration: 1.4,
    successRate: 99.5,
    filters: { include: [], exclude: [] },
    createdAt: new Date("2026-05-22T02:01:00Z").toISOString(),
    updatedAt: new Date("2026-05-22T02:01:00Z").toISOString()
  },
  {
    id: "3",
    name: "Alpha Systems Trading Journal Feed",
    url: "https://alpha.systems/rss",
    category: "Trading",
    fetchFrequency: "Every 15min",
    isActive: true,
    status: "ALIVE",
    lastFetchedAt: "OCT 24, 2026 | 09:12 AM",
    itemCount: 312,
    averageFetchDuration: 0.8,
    successRate: 99.9,
    filters: { include: [], exclude: [] },
    createdAt: new Date("2026-05-22T02:02:00Z").toISOString(),
    updatedAt: new Date("2026-05-22T02:02:00Z").toISOString()
  },
  {
    id: "4",
    name: "Prompt Engineers Hub",
    url: "https://promptengineers.org/feed",
    category: "AI Tools",
    fetchFrequency: "Daily",
    isActive: true,
    status: "ALIVE",
    lastFetchedAt: "OCT 23, 2026 | 11:45 PM",
    itemCount: 47,
    averageFetchDuration: 1.5,
    successRate: 98.7,
    filters: { include: [], exclude: [] },
    createdAt: new Date("2026-05-22T02:03:00Z").toISOString(),
    updatedAt: new Date("2026-05-22T02:03:00Z").toISOString()
  }
];

let memoryStore: MediaSource[] | null = null;

export async function readStore(): Promise<MediaSource[]> {
  if (memoryStore) {
    return memoryStore;
  }
  try {
    if (fs.existsSync(STORE_PATH)) {
      const data = await fs.promises.readFile(STORE_PATH, "utf-8");
      const parsed = JSON.parse(data) as MediaSource[];
      memoryStore = parsed;
      return parsed;
    } else {
      await writeStore(SEED_SOURCES);
      memoryStore = SEED_SOURCES;
      return SEED_SOURCES;
    }
  } catch (err) {
    console.error("Error reading media sources store file, using fallback:", err);
    return SEED_SOURCES;
  }
}

export async function writeStore(data: MediaSource[]): Promise<boolean> {
  memoryStore = data;
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
    await fs.promises.writeFile(STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error writing media sources store file:", err);
    return false;
  }
}
