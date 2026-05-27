import { useState, useEffect } from "react";
import { ThumbnailState, ThumbnailPillar, ThumbnailResolution, ThumbnailConcept, FaceType } from "@/types/thumbnail";
import { DEFAULT_STATE, PILLAR_PRESETS } from "@/lib/thumbnail/stylePresets";

export function useThumbnailGenerator(initialPillar: ThumbnailPillar = "Archviz + AI") {
  const [state, setState] = useState<ThumbnailState>(() => DEFAULT_STATE(initialPillar));

  // Handle pillar change and apply presets
  const setPillar = (pillar: ThumbnailPillar) => {
    setState((prev) => {
      const defaultForPillar = DEFAULT_STATE(pillar);
      return {
        ...defaultForPillar,
        resolution: prev.resolution, // Keep currently selected resolution
      };
    });
  };

  // Adjust coordinates based on selected aspect ratio/resolution
  const setResolution = (resolution: ThumbnailResolution) => {
    setState((prev) => {
      const width = resolution === "1280x720" ? 1280 : 720;
      const height = resolution === "1280x720" ? 720 : 1280;

      // Adjust text placements based on resolution change (landscape vs portrait)
      const isVert = resolution === "720x1280";
      
      return {
        ...prev,
        resolution,
        title: {
          ...prev.title,
          x: isVert ? width / 2 : 80,
          y: isVert ? height * 0.60 : 350,
        },
        subtitle: {
          ...prev.subtitle,
          x: isVert ? width / 2 : 86,
          y: isVert ? height * 0.75 : 430,
        },
        face: {
          ...prev.face,
          x: isVert ? width / 2 : 950,
          y: isVert ? height * 0.35 : 400,
          scale: isVert ? 1.0 : 1.0
        }
      };
    });
  };

  const updateTitleText = (text: string) => {
    setState((prev) => ({
      ...prev,
      title: { ...prev.title, text },
    }));
  };

  const updateTitleSize = (fontSize: number) => {
    setState((prev) => ({
      ...prev,
      title: { ...prev.title, fontSize },
    }));
  };

  const updateTitleColor = (color: string) => {
    setState((prev) => ({
      ...prev,
      title: { ...prev.title, color },
    }));
  };

  const updateSubtitleText = (text: string) => {
    setState((prev) => ({
      ...prev,
      subtitle: { ...prev.subtitle, text },
    }));
  };

  const updateSubtitleSize = (fontSize: number) => {
    setState((prev) => ({
      ...prev,
      subtitle: { ...prev.subtitle, fontSize },
    }));
  };

  const updateSubtitleColor = (color: string) => {
    setState((prev) => ({
      ...prev,
      subtitle: { ...prev.subtitle, color },
    }));
  };

  const updateFaceType = (type: FaceType) => {
    setState((prev) => ({
      ...prev,
      face: { ...prev.face, type },
    }));
  };

  const updateFaceScale = (scale: number) => {
    setState((prev) => ({
      ...prev,
      face: { ...prev.face, scale },
    }));
  };

  const updateFacePosition = (x: number, y: number) => {
    setState((prev) => ({
      ...prev,
      face: { ...prev.face, x, y },
    }));
  };

  const updateFaceGlow = (color: string, width: number) => {
    setState((prev) => ({
      ...prev,
      face: { ...prev.face, glowColor: color, glowWidth: width },
    }));
  };

  const updateOverlay = (color: string, opacity: number) => {
    setState((prev) => ({
      ...prev,
      overlayColor: color,
      overlayOpacity: opacity,
    }));
  };

  const toggleVignette = (vignette: boolean) => {
    setState((prev) => ({ ...prev, vignette }));
  };

  const toggleNeonGrid = (neonGrid: boolean) => {
    setState((prev) => ({ ...prev, neonGrid }));
  };

  const setGradientOnly = (useGradientOnly: boolean) => {
    setState((prev) => ({ ...prev, useGradientOnly }));
  };

  const setManualBackground = (url: string) => {
    setState((prev) => ({
      ...prev,
      backgroundImageUrl: url,
      useGradientOnly: false,
    }));
  };

  // STEP 1: Generate AI thumbnail concept from content description
  const generateConcept = async (topic: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-concept",
          topic,
          pillar: state.pillar,
        }),
      });

      const data = await response.json();
      if (data.success && data.concept) {
        const concept: ThumbnailConcept = data.concept;
        
        setState((prev) => {
          // Keep font style but update values from the generated concept
          return {
            ...prev,
            isLoading: false,
            concept,
            backgroundImagePrompt: concept.suggestedPrompt,
            title: {
              ...prev.title,
              text: concept.titleText,
            },
            subtitle: {
              ...prev.subtitle,
              text: concept.subtitleText,
              color: concept.primaryColor,
            },
            face: {
              ...prev.face,
              glowColor: concept.primaryColor,
              type: prev.face.type === "none" ? "pointing" : prev.face.type
            },
            overlayColor: concept.secondaryColor,
          };
        });
        return { success: true, concept };
      } else {
        throw new Error(data.error || "Failed to generate thumbnail concept");
      }
    } catch (err: any) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return { success: false, error: err.message };
    }
  };

  // STEP 2 & 3: Generate Background Image based on scenic prompt
  const generateBackground = async (customPrompt?: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    const promptToUse = customPrompt || state.backgroundImagePrompt || state.concept?.suggestedPrompt || state.title.text;

    try {
      // Clean request representation for image backend
      const response = await fetch("/api/generate/thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept: {
            overlayText: state.title.text,
            backgroundDesc: promptToUse,
            style: `${state.pillar} High quality detailed scenic digital illustration background. Cinematic lighting.`
          },
          platform: state.resolution === "1280x720" ? "youtube" : "vertical"
        })
      });

      const data = await response.json();
      if (data.success && data.imageUrl) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          backgroundImageUrl: data.imageUrl,
          useGradientOnly: false,
        }));
        return { success: true, imageUrl: data.imageUrl, routedVia: data.routedVia };
      } else {
        throw new Error(data.error || "Failed to generate background image");
      }
    } catch (err: any) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return { success: false, error: err.message };
    }
  };

  const updateCustomFace = (customPhotoId?: string, customBase64?: string, orientation?: string, expression?: string) => {
    setState((prev) => ({
      ...prev,
      face: {
        ...prev.face,
        customPhotoId,
        customBase64,
        orientation: orientation || prev.face.orientation || "forward",
        expression: expression || prev.face.expression || "neutral"
      }
    }));
  };

  const applyLockTemplate = (template: any) => {
    setState((prev) => {
      const width = prev.resolution === "1280x720" ? 1280 : 720;
      const height = prev.resolution === "1280x720" ? 720 : 1280;
      return {
        ...prev,
        vignette: template.vignetteStrength > 0.1,
        neonGrid: template.neonGrid,
        overlayColor: template.secondaryColor,
        overlayOpacity: template.vignetteStrength,
        title: {
          ...prev.title,
          fontSize: template.titleFontSize,
          color: template.titleColor,
          shadowColor: template.titleShadowColor,
          x: Math.round(width * template.textZoneXPercent),
          y: Math.round(height * template.textZoneYPercent)
        },
        subtitle: {
          ...prev.subtitle,
          fontSize: template.subtitleFontSize,
          color: template.subtitleColor,
          x: Math.round(width * template.textZoneXPercent),
          y: Math.round(height * template.textZoneYPercent) + template.titleFontSize + 20
        },
        face: {
          ...prev.face,
          type: template.faceExpression,
          scale: template.faceSize,
          x: Math.round(width * template.faceXPercent),
          y: Math.round(height * template.faceYPercent),
          glowWidth: template.faceGlowWidth,
          glowColor: template.faceGlowColor
        }
      };
    });
  };

  return {
    state,
    setPillar,
    setResolution,
    updateTitleText,
    updateTitleSize,
    updateTitleColor,
    updateSubtitleText,
    updateSubtitleSize,
    updateSubtitleColor,
    updateFaceType,
    updateFaceScale,
    updateFacePosition,
    updateFaceGlow,
    updateOverlay,
    toggleVignette,
    toggleNeonGrid,
    setGradientOnly,
    setManualBackground,
    generateConcept,
    generateBackground,
    updateCustomFace,
    applyLockTemplate,
  };
}
