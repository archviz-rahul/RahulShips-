import { ThumbnailPillar, ThumbnailState, FacePlaceholderConfig, TextLayer } from "@/types/thumbnail";

export interface StylePreset {
  pillar: ThumbnailPillar;
  primaryColor: string;
  secondaryColor: string;
  gradientFrom: string;
  gradientTo: string;
  fontFamily: string;
  vignette: boolean;
  neonGrid: boolean;
  textColor: string;
  defaultTitle: string;
  defaultSubtitle: string;
  sampleBackgrounds: string[];
}

export const PILLAR_PRESETS: Record<ThumbnailPillar, StylePreset> = {
  "Archviz + AI": {
    pillar: "Archviz + AI",
    primaryColor: "#FFB800", // warm gold
    secondaryColor: "#1A1A1A",
    gradientFrom: "#FFB800",
    gradientTo: "#78350F",
    fontFamily: "var(--font-sans, serif)", // Cinematic serif/Outfit style
    vignette: true,
    neonGrid: false,
    textColor: "#FFFFFF",
    defaultTitle: "CINEMATIC RENDERS",
    defaultSubtitle: "Next-Gen AI Workflows",
    sampleBackgrounds: [
      "https://picsum.photos/seed/arch1/1280/720",
      "https://picsum.photos/seed/arch2/1280/720",
      "https://picsum.photos/seed/arch3/1280/720"
    ]
  },
  "Trading + Systems": {
    pillar: "Trading + Systems",
    primaryColor: "#39FF14", // green matrix
    secondaryColor: "#050B05",
    gradientFrom: "#39FF14",
    gradientTo: "#064E3B",
    fontFamily: "var(--font-mono, monospace)", // Monospace matrix
    vignette: true,
    neonGrid: true,
    textColor: "#39FF14",
    defaultTitle: "ALGORITHMIC ALPHA",
    defaultSubtitle: "High-Frequency System Logs",
    sampleBackgrounds: [
      "https://picsum.photos/seed/trading1/1280/720",
      "https://picsum.photos/seed/trading2/1280/720",
      "https://picsum.photos/seed/trading3/1280/720"
    ]
  },
  "Vibe Coding": {
    pillar: "Vibe Coding",
    primaryColor: "#00E5FF", // cyan neon
    secondaryColor: "#0B0F19",
    gradientFrom: "#00E5FF",
    gradientTo: "#1E3A8A",
    fontFamily: "var(--font-mono, monospace)", // Fira Code terminal
    vignette: false,
    neonGrid: true,
    textColor: "#FFFFFF",
    defaultTitle: "$ npm run vibe:build",
    defaultSubtitle: "Build Complete in 42ms",
    sampleBackgrounds: [
      "https://picsum.photos/seed/coding1/1280/720",
      "https://picsum.photos/seed/coding2/1280/720",
      "https://picsum.photos/seed/coding3/1280/720"
    ]
  },
  "Builder Journey": {
    pillar: "Builder Journey",
    primaryColor: "#FF6B35", // cosmic purple-orange
    secondaryColor: "#11001C",
    gradientFrom: "#7B2CBF", // cosmic purple
    gradientTo: "#FF6B35", // journey orange
    fontFamily: "var(--font-sans, sans-serif)", // Outfit / Inter Extra Bold
    vignette: true,
    neonGrid: false,
    textColor: "#FFFFFF",
    defaultTitle: "BUILDING IN PUBLIC",
    defaultSubtitle: "How We Scaled to $10k MRR",
    sampleBackgrounds: [
      "https://picsum.photos/seed/cosmic1/1280/720",
      "https://picsum.photos/seed/cosmic2/1280/720",
      "https://picsum.photos/seed/cosmic3/1280/720"
    ]
  }
};

export const DEFAULT_STATE = (pillar: ThumbnailPillar): ThumbnailState => {
  const preset = PILLAR_PRESETS[pillar];
  return {
    pillar,
    resolution: "1280x720",
    title: {
      text: preset.defaultTitle,
      color: "#FFFFFF",
      fontSize: 70,
      fontFamily: preset.fontFamily,
      x: 80,
      y: 350,
      shadowColor: "#000000",
      shadowBlur: 15,
      isCustomPosition: false
    },
    subtitle: {
      text: preset.defaultSubtitle,
      color: preset.primaryColor,
      fontSize: 32,
      fontFamily: preset.fontFamily,
      x: 86,
      y: 430,
      shadowColor: "#000000",
      shadowBlur: 10,
      isCustomPosition: false
    },
    backgroundImageUrl: "",
    backgroundImagePrompt: "",
    isLoading: false,
    concept: null,
    face: {
      type: "pointing",
      x: 950,
      y: 400,
      scale: 1.0,
      glowColor: preset.primaryColor,
      glowWidth: 6
    },
    overlayColor: "#000000",
    overlayOpacity: 0.25,
    vignette: preset.vignette,
    neonGrid: preset.neonGrid,
    gradientBackground: `linear-gradient(135deg, ${preset.gradientFrom}, ${preset.gradientTo})`,
    useGradientOnly: false
  };
};
