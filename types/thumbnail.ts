export type ThumbnailPillar = "Archviz + AI" | "Trading + Systems" | "Vibe Coding" | "Builder Journey";

export type ThumbnailResolution = "1280x720" | "720x1280";

export interface TextLayer {
  text: string;
  color: string;
  fontSize: number;
  fontFamily: string;
  x: number;
  y: number;
  shadowColor: string;
  shadowBlur: number;
  backgroundColor?: string;
  isCustomPosition: boolean;
}

export interface ThumbnailConcept {
  layoutType: string;
  titleText: string;
  subtitleText: string;
  overlayStyle: string;
  suggestedPrompt: string;
  primaryColor: string;
  secondaryColor: string;
}

export type FaceType = "none" | "surprised" | "neutral" | "happy" | "pointing";

export interface FacePlaceholderConfig {
  type: FaceType;
  x: number;
  y: number;
  scale: number;
  url?: string;
  glowColor: string;
  glowWidth: number;
}

export interface ThumbnailState {
  pillar: ThumbnailPillar;
  resolution: ThumbnailResolution;
  title: TextLayer;
  subtitle: TextLayer;
  backgroundImageUrl: string;
  backgroundImagePrompt: string;
  isLoading: boolean;
  concept: ThumbnailConcept | null;
  face: FacePlaceholderConfig;
  overlayColor: string;
  overlayOpacity: number;
  vignette: boolean;
  neonGrid: boolean;
  gradientBackground: string;
  useGradientOnly: boolean;
}
