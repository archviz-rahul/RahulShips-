export type Pillar =
  | 'archviz'
  | 'trading'
  | 'vibe-coding'
  | 'builder'

export type DayOfWeek =
  | 'monday' | 'tuesday' | 'wednesday'
  | 'thursday' | 'friday' | 'saturday'
  | 'sunday'

export interface PillarConfig {
  id: Pillar
  label: string           // "Archviz + AI"
  shortLabel: string      // "Archviz"
  emoji: string           // "🏛️"
  color: string           // "#F59E0B"
  colorMuted: string      // "#F59E0B1A" (10% opacity)
  colorBorder: string     // "#F59E0B66" (40% opacity)
  bgClass: string         // Tailwind bg class
  textClass: string       // Tailwind text class
  borderClass: string     // Tailwind border class
  glowClass: string       // box-shadow glow style
  description: string     // one line description
  weeklyTarget: {
    reels: number         // 6 per pillar per week
    longVideo: number     // 2 per pillar per week
    newsletter: number    // 1 per pillar per week
  }
  subreddits: string[]
  hashtags: string[]
  rssFeeds: string[]
}

export const PILLAR_CONFIG: Record<Pillar, PillarConfig> = {
  archviz: {
    id: 'archviz',
    label: 'Archviz + AI',
    shortLabel: 'Archviz',
    emoji: '🏛️',
    color: '#F59E0B',
    colorMuted: '#F59E0B1A',
    colorBorder: '#F59E0B66',
    bgClass: 'bg-amber-500',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500',
    glowClass: '0 0 20px #F59E0B44',
    description: 'Architecture Visualization + AI Tools',
    weeklyTarget: {
      reels: 6,
      longVideo: 2,
      newsletter: 1
    },
    subreddits: ['archviz', 'blender', 'unrealengine', 'SketchUp'],
    hashtags: ['#archviz', '#unrealengine', '#archvisualization', '#3drender'],
    rssFeeds: ['chaos.com/blog/feed', 'archdaily.com/feed']
  },
  trading: {
    id: 'trading',
    label: 'Trading + Systems',
    shortLabel: 'Trading',
    emoji: '📈',
    color: '#22C55E',
    colorMuted: '#22C55E1A',
    colorBorder: '#22C55E66',
    bgClass: 'bg-green-500',
    textClass: 'text-green-400',
    borderClass: 'border-green-500',
    glowClass: '0 0 20px #22C55E44',
    description: 'Trading Systems + Algo + Finance',
    weeklyTarget: {
      reels: 6,
      longVideo: 2,
      newsletter: 1
    },
    subreddits: ['IndiaInvestments', 'algotrading', 'stocks', 'IndianStockMarket'],
    hashtags: ['#algotrading', '#nifty50', '#optionstrading', '#trading'],
    rssFeeds: ['zerodha.com/varsity/feed', 'moneycontrol.com/rss/']
  },
  'vibe-coding': {
    id: 'vibe-coding',
    label: 'Vibe Coding',
    shortLabel: 'Vibe Code',
    emoji: '💻',
    color: '#06B6D4',
    colorMuted: '#06B6D41A',
    colorBorder: '#06B6D466',
    bgClass: 'bg-cyan-500',
    textClass: 'text-cyan-400',
    borderClass: 'border-cyan-500',
    glowClass: '0 0 20px #06B6D444',
    description: 'AI-Powered Coding + SaaS Building',
    weeklyTarget: {
      reels: 6,
      longVideo: 2,
      newsletter: 1
    },
    subreddits: ['webdev', 'artificial', 'SideProject', 'nextjs'],
    hashtags: ['#vibecoding', '#buildinpublic', '#nextjs', '#AI'],
    rssFeeds: ['nextjs.org/feed.xml', 'vercel.com/blog/feed', 'dev.to/feed']
  },
  builder: {
    id: 'builder',
    label: 'Builder Journey',
    shortLabel: 'Builder',
    emoji: '🚢',
    color: '#A855F7',
    colorMuted: '#A855F71A',
    colorBorder: '#A855F766',
    bgClass: 'bg-purple-500',
    textClass: 'text-purple-400',
    borderClass: 'border-purple-500',
    glowClass: '0 0 20px #A855F744',
    description: 'Build in Public + Creator Journey',
    weeklyTarget: {
      reels: 6,
      longVideo: 2,
      newsletter: 1
    },
    subreddits: ['Entrepreneur', 'startups', 'indiehackers', 'SaaS'],
    hashtags: ['#buildinpublic', '#indiehackers', '#solofounder'],
    rssFeeds: ['indiehackers.com/feed', 'producthunt.com/feed']
  }
}

// Day → Pillar rotation map
export const DAY_PILLAR_MAP: Record<DayOfWeek, Pillar> = {
  monday:    'archviz',
  tuesday:   'trading',
  wednesday: 'vibe-coding',
  thursday:  'archviz',
  friday:    'trading',
  saturday:  'vibe-coding',
  sunday:    'builder'
}

// Helper: get today's pillar
export function getTodayPillar(): Pillar {
  const days: DayOfWeek[] = [
    'sunday', 'monday', 'tuesday',
    'wednesday', 'thursday', 'friday', 'saturday'
  ]
  const today = days[new Date().getDay()]
  return DAY_PILLAR_MAP[today]
}

// Helper: get pillar for any JS Date
export function getPillarForDate(date: Date): Pillar {
  const days: DayOfWeek[] = [
    'sunday', 'monday', 'tuesday',
    'wednesday', 'thursday', 'friday', 'saturday'
  ]
  const day = days[date.getDay()]
  return DAY_PILLAR_MAP[day]
}

// Helper: get config for a pillar
export function getPillarConfig(pillar: Pillar): PillarConfig {
  return PILLAR_CONFIG[pillar]
}
