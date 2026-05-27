// Signature design templates for each content pillar.
// These are locked configs that determine the exact visual layout.

import { ThumbnailPillar, FaceType } from "@/types/thumbnail";

export interface PillarTemplate {
  name: string;
  pillar: ThumbnailPillar;
  primaryColor: string;
  secondaryColor: string;
  badgeText: string;
  badgeBgColor: string;
  badgeTextColor: string;
  vignetteStrength: number;
  neonGrid: boolean;
  colorTemp: number; // warm/cool boost
  colorSat: number;
  faceExpression: FaceType;
  faceSize: number; // e.g., 0.70 of screen height
  faceXPercent: number; // e.g., 0.85 (85% from left)
  faceYPercent: number; // e.g., 1.0 (bottom-aligned)
  faceGlowWidth: number;
  faceGlowColor: string;
  textZoneXPercent: number; // left aligned text position
  textZoneYPercent: number;
  titleFontSize: number;
  titleColor: string;
  titleShadowColor: string;
  subtitleFontSize: number;
  subtitleColor: string;
  overlays: {
    radialGlowColor?: string;
    horizontalLineY?: number; // Y coordinate for decorative lines
    scanlines?: boolean;
    cornerBrackets?: boolean;
    dataTicker?: boolean;
    spaceStars?: boolean;
  };
}

export const PILLAR_TEMPLATES: Record<ThumbnailPillar, PillarTemplate> = {
  "Archviz + AI": {
    name: "GOLD REVEAL",
    pillar: "Archviz + AI",
    primaryColor: "#F59E0B", // warm gold
    secondaryColor: "#000000",
    badgeText: "ARCHVIZ",
    badgeBgColor: "#F59E0B",
    badgeTextColor: "#000000",
    vignetteStrength: 0.4,
    neonGrid: false,
    colorTemp: 15,
    colorSat: 10,
    faceExpression: "pointing", // pointing or shocked/surprised
    faceSize: 0.70,
    faceXPercent: 0.85, // RIGHT side (85% from left edge)
    faceYPercent: 1.0, // bottom-aligned
    faceGlowWidth: 10,
    faceGlowColor: "#F59E0B",
    textZoneXPercent: 0.10, // LEFT side (10% from left edge)
    textZoneYPercent: 0.50, // vertically centered
    titleFontSize: 96,
    titleColor: "#FFFFFF",
    titleShadowColor: "#F59E0B",
    subtitleFontSize: 48,
    subtitleColor: "#F59E0B",
    overlays: {
      radialGlowColor: "#F59E0B33", // gold behind Rahul
      horizontalLineY: 600, // 2px line at bottom
    }
  },
  "Trading + Systems": {
    name: "GREEN MATRIX",
    pillar: "Trading + Systems",
    primaryColor: "#22C55E", // matrix green
    secondaryColor: "#050B05",
    badgeText: "TRADING",
    badgeBgColor: "#22C55E",
    badgeTextColor: "#000000",
    vignetteStrength: 0.5,
    neonGrid: true,
    colorTemp: -10, // cool
    colorSat: 20,
    faceExpression: "neutral", // serious / thinking expression
    faceSize: 0.75,
    faceXPercent: 0.35, // LEFT biased position (35%)
    faceYPercent: 1.0,  // bottom aligned
    faceGlowWidth: 8,
    faceGlowColor: "#22C55E",
    textZoneXPercent: 0.65, // RIGHT side (65%)
    textZoneYPercent: 0.50,
    titleFontSize: 88,
    titleColor: "#22C55E",
    titleShadowColor: "#22C55E",
    subtitleFontSize: 44,
    subtitleColor: "#FFFFFF",
    overlays: {
      scanlines: true,
      dataTicker: true,
    }
  },
  "Vibe Coding": {
    name: "CYAN TERMINAL",
    pillar: "Vibe Coding",
    primaryColor: "#06B6D4", // terminal cyan
    secondaryColor: "#0B0F19",
    badgeText: "VIBE CODE",
    badgeBgColor: "#06B6D4",
    badgeTextColor: "#000000",
    vignetteStrength: 0.35,
    neonGrid: true,
    colorTemp: -15, // cool desaturated
    colorSat: -5,
    faceExpression: "pointing", // excited / pointing up (pointing)
    faceSize: 0.80,
    faceXPercent: 0.75, // RIGHT side (75%)
    faceYPercent: 1.0,
    faceGlowWidth: 12,
    faceGlowColor: "#06B6D4",
    textZoneXPercent: 0.10, // LEFT side (10%)
    textZoneYPercent: 0.50,
    titleFontSize: 92,
    titleColor: "#FFFFFF",
    titleShadowColor: "#06B6D4",
    subtitleFontSize: 40,
    subtitleColor: "#06B6D4",
    overlays: {
      scanlines: true,
      radialGlowColor: "#06B6D433",
      cornerBrackets: true,
    }
  },
  "Builder Journey": {
    name: "PURPLE COSMIC",
    pillar: "Builder Journey",
    primaryColor: "#A855F7", // cosmic purple
    secondaryColor: "#11001C",
    badgeText: "🚢 BUILDER",
    badgeBgColor: "#A855F7",
    badgeTextColor: "#FFFFFF",
    vignetteStrength: 0.45,
    neonGrid: false,
    colorTemp: 10, // purple boost, warm shadow
    colorSat: 25,
    faceExpression: "happy", // smiling / confident
    faceSize: 0.85,
    faceXPercent: 0.60, // Center-right biased (60%)
    faceYPercent: 1.0,
    faceGlowWidth: 10,
    faceGlowColor: "#C084FC",
    textZoneXPercent: 0.10, // LEFT side
    textZoneYPercent: 0.35, // top-aligned text zone
    titleFontSize: 100,
    titleColor: "#FFFFFF",
    titleShadowColor: "#A855F7",
    subtitleFontSize: 46,
    subtitleColor: "#C084FC",
    overlays: {
      spaceStars: true,
      radialGlowColor: "#A855F722",
      horizontalLineY: 680,
    }
  }
};
