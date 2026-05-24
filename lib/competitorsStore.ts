import fs from "fs";
import path from "path";

export interface CompetitorNoteLog {
  id: string;
  timestamp: string;
  text: string;
}

export interface Competitor {
  id: string;
  name: string;
  platform: "Instagram" | "YouTube" | "Substack" | "X/Twitter" | "LinkedIn" | "Other";
  username: string;
  profileUrl: string;
  focus: string;
  status: "Active" | "Inactive";
  notes?: string;
  notesHistory?: CompetitorNoteLog[];
  likes?: string;
  hook?: string;
  cta?: string;
  lastScraped?: string;
  createdAt: string;
  videoDuration?: number;
}

const STORE_PATH = path.join(process.cwd(), "lib", "competitors_store.json");

const SEED_COMPETITORS: Competitor[] = [
  {
    id: "1",
    name: "Vaibhivi Sinty",
    platform: "Instagram",
    username: "vaibhavisinty",
    profileUrl: "https://www.instagram.com/vaibhavisinty/",
    focus: "Interior & Architecture Renders",
    hook: "Contrast splits & rapid daylight walk",
    cta: "Comment 'DESIGN' for catalog",
    likes: "42K avg",
    status: "Active",
    notes: "Excellent viz inspiration for mid-journey content structure",
    lastScraped: "OCT 24, 2026 | 09:00 AM",
    createdAt: new Date("2026-05-22T02:00:00Z").toISOString(),
    videoDuration: 45
  },
  {
    id: "2",
    name: "Dan Martell",
    platform: "Instagram",
    username: "danmartell",
    profileUrl: "https://www.instagram.com/danmartell/",
    focus: "Scaling & Business Systems",
    hook: "Hard truth statement regarding burnout",
    cta: "Comment 'MAP' for framework",
    likes: "15K avg",
    status: "Active",
    notes: "SaaS and operations coaching frameworks in 60s formats",
    lastScraped: "OCT 24, 2026 | 09:00 AM",
    createdAt: new Date("2026-05-22T02:00:01Z").toISOString(),
    videoDuration: 60
  },
  {
    id: "3",
    name: "Ishan Sharma",
    platform: "Instagram",
    username: "ishansharma7390",
    profileUrl: "https://www.instagram.com/ishansharma7390/",
    focus: "Indian Freelancing & Hustle",
    hook: "Hinglish client-landing screen demo",
    cta: "Comment 'EMAIL' for pitch deck",
    likes: "21K avg",
    status: "Active",
    notes: "Excellent hook triggers for Indian freelance creator market",
    lastScraped: "OCT 24, 2026 | 09:00 AM",
    createdAt: new Date("2026-05-22T02:00:02Z").toISOString(),
    videoDuration: 55
  },
  {
    id: "4",
    name: "Raj Shamani",
    platform: "Instagram",
    username: "rajshamani",
    profileUrl: "https://www.instagram.com/rajshamani/",
    focus: "Indian Entrepreneurship Secrets",
    hook: "High-adrenaline operator traps reveal",
    cta: "Comment 'INVEST' for report",
    likes: "110K avg",
    status: "Active",
    notes: "High engagement hooks showing bold podcast soundbites",
    lastScraped: "OCT 24, 2026 | 09:00 AM",
    createdAt: new Date("2026-05-22T02:00:03Z").toISOString(),
    videoDuration: 90
  },
  {
    id: "5",
    name: "GrowthSchool",
    platform: "Instagram",
    username: "growthschoolio",
    profileUrl: "https://www.instagram.com/growthschoolio/",
    focus: "Generative AI workshops",
    hook: "Practical boilerplate speed-coding hack",
    cta: "Comment 'WORKSHOP' for setup",
    likes: "35K avg",
    status: "Active",
    notes: "AI workshops tools hacks marketing copy",
    lastScraped: "OCT 24, 2026 | 09:00 AM",
    createdAt: new Date("2026-05-22T02:00:04Z").toISOString(),
    videoDuration: 30
  }
];

// Simple in-memory fallback cache to ensure it works even if disk becomes read-only
let memoryStore: Competitor[] | null = null;

export async function readStore(): Promise<Competitor[]> {
  if (memoryStore) {
    return memoryStore;
  }
  try {
    if (fs.existsSync(STORE_PATH)) {
      const data = await fs.promises.readFile(STORE_PATH, "utf-8");
      const parsed = JSON.parse(data) as Competitor[];
      memoryStore = parsed;
      return parsed;
    } else {
      // Initialize with seed data
      await writeStore(SEED_COMPETITORS);
      memoryStore = SEED_COMPETITORS;
      return SEED_COMPETITORS;
    }
  } catch (err) {
    console.error("Error reading competitors store file, using fallback:", err);
    return SEED_COMPETITORS;
  }
}

export async function writeStore(data: Competitor[]): Promise<boolean> {
  memoryStore = data;
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
    await fs.promises.writeFile(STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error writing competitors store file:", err);
    return false;
  }
}
