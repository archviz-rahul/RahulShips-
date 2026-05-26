import { Pillar } from "@/lib/pillarConfig";

export type LinkType =
  | 'youtube-video'
  | 'youtube-short'
  | 'youtube-channel'
  | 'instagram-post'
  | 'instagram-reel'
  | 'instagram-profile'
  | 'reddit-post'
  | 'reddit-thread'
  | 'article'
  | 'newsletter'
  | 'substack'
  | 'twitter-post'
  | 'linkedin-post'
  | 'pdf'
  | 'unknown';

export type AnalysisStatus =
  | 'pending'
  | 'queued'
  | 'analysing'
  | 'done'
  | 'error'
  | 'skipped';

export type LinkPriority =
  | 'high'
  | 'medium'
  | 'low';

export interface VaultLink {
  id: string;                    // uuid
  url: string;                   // original URL
  cleanUrl: string;              // normalised URL
  domain: string;                // e.g. "youtube.com"
  linkType: LinkType;
  title: string;                 // extracted or manual
  description: string;           // first 200 chars
  thumbnailUrl: string | null;
  favicon: string | null;

  // Classification
  pillar: Pillar | null;         // from pillarConfig
  pillarAutoDetected: boolean;   // true if AI-detected
  tags: string[];
  priority: LinkPriority;

  // Source tracking
  addedFrom: 'paste' | 'youtube-channel' | 'bulk-import' | 'competitor' | 'rss-feed' | 'manual';

  // Analysis
  analysisStatus: AnalysisStatus;
  analysisError: string | null;
  analysedAt: string | null;

  // Content metadata (YouTube-specific)
  youtube?: {
    videoId: string | null;
    channelId: string | null;
    channelName: string | null;
    duration: string | null;       // "12:34"
    viewCount: number | null;
    likeCount: number | null;
    commentCount: number | null;
    publishedAt: string | null;
    isShort: boolean;
  };

  // Usage tracking
  usedInBrief: boolean;
  usedInHookBank: boolean;
  savedHookIds: string[];          // Hook IDs
  savedIdeaIds: string[];          // Brief idea IDs

  // Meta
  createdAt: string;               // ISO
  updatedAt: string;               // ISO
  lastViewedAt: string | null;
  isArchived: boolean;
  isFavourited: boolean;
  notes: string;
}

export interface LinkAnalysis {
  linkId: string;
  url: string;
  analysedAt: string;

  // Core analysis
  summary: string;               // 3 sentences max
  mainTopic: string;             // one phrase
  pillarMatch: Pillar;           // best pillar match
  pillarScore: number;           // 0-10
  contentValue: number;          // 0-10
  virality: number;              // 0-10 potential

  // Extracted content
  hooks: ExtractedHook[];        // 1-5 hooks found
  keyInsights: string[];         // 3-5 bullet points
  quotableLines: string[];       // memorable lines
  statistics: string[];          // any stats/numbers

  // Content ideas
  contentIdeas: ContentIdea[];   // 3 ideas for Rahul

  // For YouTube specifically
  youtube?: {
    openingHook: string;         // first 30 seconds
    structure: string[];         // section breakdown
    ctaUsed: string;             // their CTA
    thumbnailAnalysis: string;   // what makes it work
    bestMomentTimestamp: string; // e.g. "4:32"
  };

  // Pillar-specific insights
  archvizInsights?: string[];
  tradingInsights?: string[];
  vibeCodingInsights?: string[];
  builderInsights?: string[];
}

export interface ContentIdea {
  id: string;
  title: string;                 // video/reel title
  format: 'reel' | 'longvideo' | 'newsletter';
  pillar: Pillar;
  hook: string;                  // suggested hook
  angle: string;                 // unique angle
  estimatedViralScore: number;   // 0-10
  savedToBrief: boolean;
}

export interface ExtractedHook {
  text: string;
  type: string;                  // hook type
  savedToBank: boolean;
}

export interface LinkFilter {
  pillar?: Pillar | null;
  linkType?: LinkType | null;
  analysisStatus?: AnalysisStatus | null;
  priority?: LinkPriority | null;
  addedFrom?: string | null;
  search?: string;
  isFavourited?: boolean;
  isArchived?: boolean;
  dateFrom?: string;
  dateTo?: string;
  domain?: string;
  hasAnalysis?: boolean;
  usedInBrief?: boolean;
}
