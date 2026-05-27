"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Download, 
  RotateCcw, 
  Image as ImageIcon, 
  Sliders, 
  Type as TypeIcon, 
  FaceSmile, 
  Layers, 
  RefreshCw, 
  Eye, 
  Palette, 
  Info,
  HelpCircle,
  Video,
  Upload,
  Bot,
  Flame,
  MousePointerClick,
  Trash2,
  Check,
  User,
  Crown,
  Search,
  Filter
} from "lucide-react";
import { ThumbnailPillar, ThumbnailResolution, FaceType } from "@/types/thumbnail";
import { useThumbnailGenerator } from "@/hooks/useThumbnailGenerator";
import { renderThumbnail, loadImage } from "@/lib/thumbnail/canvasRenderer";
import { PILLAR_PRESETS } from "@/lib/thumbnail/stylePresets";
import { PILLAR_TEMPLATES } from "@/lib/thumbnail/pillarTemplates";
import { getPhotos, savePhoto, deletePhoto, incrementUsageCount, RahulPhoto } from "@/lib/thumbnail/indexedDB";

interface ThumbnailViewProps {
  activePillar?: string;
  onNavigate?: (view: string) => void;
  isDarkMode?: boolean;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
  activeConfig?: any;
}

const STOCK_CREATIVES: Record<ThumbnailPillar, string[]> = {
  "Archviz + AI": [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"
  ],
  "Trading + Systems": [
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80"
  ],
  "Vibe Coding": [
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80"
  ],
  "Builder Journey": [
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=800&q=80"
  ]
};

export function ThumbnailView({
  activePillar = "Archviz + AI",
  onNavigate,
  isDarkMode = true,
  showToast = () => {},
  activeConfig
}: ThumbnailViewProps) {
  const verifiedPillar = (["Archviz + AI", "Trading + Systems", "Vibe Coding", "Builder Journey"].includes(activePillar)
    ? activePillar
    : "Archviz + AI") as ThumbnailPillar;

  const {
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
  } = useThumbnailGenerator(verifiedPillar);

  // Layout selection tabs
  const [activeTab, setActiveTab] = useState<"ai" | "text" | "face" | "layers">("ai");

  // Input for AI concept generator
  const [topicInput, setTopicInput] = useState<string>("");
  const [customImagePrompt, setCustomImagePrompt] = useState<string>("");
  const [isConceptGenerating, setIsConceptGenerating] = useState<boolean>(false);
  const [isBgGenerating, setIsBgGenerating] = useState<boolean>(false);
  const [bgImageElement, setBgImageElement] = useState<HTMLImageElement | null>(null);

  // Stored Photos and Custom Face state variables
  const [storedPhotos, setStoredPhotos] = useState<RahulPhoto[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [autoRemoveBg, setAutoRemoveBg] = useState<boolean>(true);
  const [photoExpression, setPhotoExpression] = useState<string>("excited");
  const [photoOrientation, setPhotoOrientation] = useState<string>("right");
  const [faceImageElement, setFaceImageElement] = useState<HTMLImageElement | null>(null);

  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load photos from IndexedDB
  const loadStoredPhotos = async () => {
    try {
      const list = await getPhotos();
      setStoredPhotos(list);
    } catch (e) {
      console.error("Photos library fetch error:", e);
    }
  };

  useEffect(() => {
    loadStoredPhotos();
  }, []);

  // Pre-load and cache face image element
  useEffect(() => {
    let active = true;

    if (!state.face.customBase64) {
      setTimeout(() => {
        if (active) setFaceImageElement(null);
      }, 0);
      return;
    }

    loadImage(state.face.customBase64)
      .then((img) => {
        if (active) {
          setFaceImageElement(img);
        }
      })
      .catch((err) => {
        if (active) {
          console.error("Custom face image load exception:", err);
          setFaceImageElement(null);
        }
      });

    return () => {
      active = false;
    };
  }, [state.face.customBase64]);

  // Pillar configurations coordinates with brand styling
  const presetConfig = PILLAR_PRESETS[state.pillar];

  // Dynamic colors based on active theme & state pillar accent
  const activeAccentColor = state.concept?.primaryColor || presetConfig.primaryColor;

  // React to parent pillar changes if any
  useEffect(() => {
    setPillar(verifiedPillar);
  }, [activePillar]);

  // Load and cache background image whenever Url updates
  useEffect(() => {
    let active = true;

    if (state.useGradientOnly || !state.backgroundImageUrl) {
      setTimeout(() => {
        if (active) setBgImageElement(null);
      }, 0);
      return;
    }

    loadImage(state.backgroundImageUrl)
      .then((img) => {
        if (active) {
          setBgImageElement(img);
          showToast("New background successfully fitted on canvas!", "success");
        }
      })
      .catch((err) => {
        if (active) {
          console.error("Background load error: ", err);
          setBgImageElement(null);
          showToast("Failed to load background image. Standard gradient will display.", "error");
        }
      });

    return () => {
      active = false;
    };
  }, [state.backgroundImageUrl, state.useGradientOnly]);

  // Render trigger whenever state changes
  useEffect(() => {
    if (canvasRef.current) {
      renderThumbnail(canvasRef.current, state, bgImageElement, faceImageElement);
    }
  }, [state, bgImageElement, faceImageElement]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    showToast("Processing personal image. Reading bytes...", "info");

    const reader = new FileReader();
    reader.onload = async () => {
      let base64 = reader.result as string;

      if (autoRemoveBg) {
        showToast("Engaging background-removal algorithm...", "info");
        try {
          const res = await fetch("/api/thumbnail", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "remove-bg", imageBase64: base64 })
          });
          const data = await res.json();
          if (data.success && data.transparentImageBase64) {
            base64 = data.transparentImageBase64;
            showToast("Success! Background extracted successfully.", "success");
          } else {
            showToast("Background removal skipped, utilizing file outline.", "info");
          }
        } catch (err) {
          showToast("Failed removing background, loading original.", "info");
        }
      }

      try {
        const newPhoto: RahulPhoto = {
          id: Date.now().toString(),
          base64: base64,
          thumbnailBase64: base64,
          expression: photoExpression,
          orientation: photoOrientation,
          hasBgRemoved: autoRemoveBg,
          uploadedAt: new Date().toISOString(),
          usageCount: 0
        };

        await savePhoto(newPhoto);
        await loadStoredPhotos();
        showToast("Photo successfully saved in your personal library!", "success");
      } catch (err) {
        showToast("Error saving in database.", "error");
      } finally {
        setIsUploadingPhoto(false);
      }
    };
    reader.onerror = () => {
      showToast("Failed reading file.", "error");
      setIsUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPhoto = async (photo: RahulPhoto) => {
    try {
      updateCustomFace(photo.id, photo.base64, photo.orientation, photo.expression);
      await incrementUsageCount(photo.id);
      await loadStoredPhotos();
      showToast(`Selected photo library avatar! Orientation is ${photo.orientation || 'right'}.`, "success");
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePhoto = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deletePhoto(id);
      await loadStoredPhotos();
      showToast("Removed photo from personal library.", "info");
      if (state.face.customPhotoId === id) {
        updateCustomFace("", "", "", "");
      }
    } catch (err) {
      showToast("Deleter operation failed.", "error");
    }
  };

  const handleCreateConcept = async () => {
    if (!topicInput.trim()) {
      showToast("Please write a topic or script concept outline first.", "info");
      return;
    }
    setIsConceptGenerating(true);
    showToast("Evaluating thumbnail strategy concept with Gemini...", "info");
    const result = await generateConcept(topicInput);
    setIsConceptGenerating(false);

    if (result.success) {
      showToast("1. High-CTR Concept Created! Now configure image.", "success");
      setCustomImagePrompt(result.concept?.suggestedPrompt || "");
    } else {
      showToast("Concept creation error: " + result.error, "error");
    }
  };

  const handleSynthesizeImage = async () => {
    setIsBgGenerating(true);
    showToast("Compiling optimized image prompt. Synthesizing background...", "info");
    const result = await generateBackground(customImagePrompt);
    setIsBgGenerating(false);

    if (result.success) {
      showToast(`2. Background generated successfully via ${result.routedVia}!`, "success");
    } else {
      showToast("Background synthesis failed. Try choosing from stock catalog below.", "error");
    }
  };

  // HTML5 Export Canvas to PNG
  const handleExportPNG = () => {
    if (!canvasRef.current) return;
    
    try {
      const dataUrl = canvasRef.current.toDataURL("image/png");
      const link = document.createElement("a");
      const filename = `thumbnail_copilot_${state.pillar.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${state.resolution}.png`;
      link.download = filename;
      link.href = dataUrl;
      link.click();
      showToast("Success! Render exported high resolution PNG. 🚀", "success");
    } catch (err) {
      console.error(err);
      showToast("Canvas protection error. Opened fallback render view.", "info");
    }
  };

  return (
    <section 
      id="thumbnail-generator"
      className={`p-4 sm:p-6 lg:p-8 rounded-2xl border transition-all duration-300 shadow-xl ${
        isDarkMode 
          ? "bg-[#0E0E11]/90 border-white/[0.04]" 
          : "bg-white border-gray-200/80"
      }`}
    >
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b border-white/[0.06] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1.5 rounded-md bg-stone-900 border border-white/10">
              <Bot className="w-4 h-4" style={{ color: activeAccentColor }} />
            </span>
            <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#FFB800]">
              PRO THUMBNAIL COPILOT PIPELINE
            </span>
          </div>
          <h2 className={`text-2xl font-black uppercase tracking-tight ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Dual-Format Canvas Compositor
          </h2>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed max-w-2xl">
            Fully autonomous high-CTR visual synthesis suite. Generate customized concepts, prompt vector face silhouettes, layer rich biophilic / grid masks, and export ultra-sharp PNG layouts in real-time.
          </p>
        </div>

        {/* TOP COMPOSITOR QUICK ACTION SETS */}
        <div className="flex items-center gap-3">
          {/* RESOLUTION SELECT TABS */}
          <div className="flex bg-stone-900/60 p-1 rounded-lg border border-white/[0.04]">
            <button
              onClick={() => setResolution("1280x720")}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md tracking-wider transition-all cursor-pointer ${
                state.resolution === "1280x720"
                  ? "bg-[#FFB800] text-black shadow-[0_0_12px_rgba(255,184,0,0.25)]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              16:9 Landscape
            </button>
            <button
              onClick={() => setResolution("720x1280")}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md tracking-wider transition-all cursor-pointer ${
                state.resolution === "720x1280"
                  ? "bg-[#FFB800] text-black shadow-[0_0_12px_rgba(255,184,0,0.25)]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              9:16 vertical
            </button>
          </div>

          <button
            onClick={handleExportPNG}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-black font-extrabold text-xs uppercase tracking-wider rounded-lg shadow-md transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export PNG</span>
          </button>
        </div>
      </div>

      {/* 3-PANEL COMPOSE MATRIX GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* PANEL 1: CONTROL CENTER (Column span 4) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* VIEW CONTROLLER TABS */}
          <div className="flex bg-stone-950/80 p-1.5 rounded-xl border border-white/[0.03]">
            {[
              { id: "ai", label: "AI Pipeline", icon: Sparkles },
              { id: "text", label: "Typography", icon: TypeIcon },
              { id: "face", label: "Avatar Mask", icon: Sliders },
              { id: "layers", label: "Fx Overlays", icon: Layers }
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isTabActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                    isTabActive
                      ? "bg-stone-900 border border-white/[0.06] text-white"
                      : "text-white/40 hover:text-white/70"
                  }`}
                  style={isTabActive ? { color: activeAccentColor } : undefined}
                >
                  <TabIcon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* DYNAMIC CONTROLLER CARD WITH ACCENT TOP BORDER */}
          <div className="p-5 bg-stone-950/40 rounded-xl border border-white/[0.04] space-y-4 shadow-inner relative overflow-hidden">
            <div 
              className="absolute top-0 left-0 right-0 h-1 transition-all duration-300" 
              style={{ backgroundColor: activeAccentColor }}
            />

            {/* TAB CONTENT IS RENDERED DYNAMICALLY */}
            <AnimatePresence mode="wait">
              
              {/* TAB 1: AI GENERATOR FLOW */}
              {activeTab === "ai" && (
                <motion.div
                  key="ai-panel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4.5"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold font-mono uppercase tracking-widest text-white/50 block">
                      STEP 1: Define Topic Outline / Script
                    </label>
                    <textarea
                      placeholder="Write a clear script description or topic (e.g., 'A modern designer showing off interior architectural renderings using the biophilic designer tools in unreal engine 5.')"
                      value={topicInput}
                      onChange={(e) => setTopicInput(e.target.value)}
                      className="w-full h-24 p-3 text-xs bg-stone-950 text-white rounded-lg border border-white/10 focus:ring-1 focus:ring-amber-500/50 outline-none leading-relaxed font-sans placeholder-gray-600 resize-none"
                    />

                    <button
                      onClick={handleCreateConcept}
                      disabled={isConceptGenerating}
                      className="w-full flex items-center justify-center gap-2.5 py-3 rounded-lg border border-[#FFB800]/20 bg-stone-900 hover:bg-stone-850/80 hover:border-[#FFB800]/40 transition-all font-bold text-xs uppercase tracking-wider cursor-pointer"
                      style={{ color: activeAccentColor }}
                    >
                      {isConceptGenerating ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Generating Strategy...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4.5 h-4.5" />
                          <span>1. Draft AI Concept</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* STEP 2 & 3: OPTIMIZE IMAGE SYNTHESIS */}
                  <div className="space-y-2 pt-2 border-t border-white/[0.04]">
                    <label className="text-[10px] font-bold font-mono uppercase tracking-widest text-white/50 block">
                      STEP 2 & 3: Image Synth Prompt (for FLUX / SD / Gemini)
                    </label>
                    <textarea
                      placeholder="Optimized AI Background scenic representation prompt prompt layout fits..."
                      value={customImagePrompt}
                      onChange={(e) => setCustomImagePrompt(e.target.value)}
                      className="w-full h-20 p-3 text-[11px] bg-stone-950 text-white rounded-lg border border-white/10 focus:ring-1 focus:ring-amber-500/50 outline-none leading-relaxed font-mono placeholder-gray-700 resize-none"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleSynthesizeImage}
                        disabled={isBgGenerating || !customImagePrompt.trim()}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white hover:bg-gray-100 text-black font-extrabold text-[11px] uppercase tracking-wide shadow-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isBgGenerating ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Bot className="w-3.5 h-3.5" />
                        )}
                        <span>2. Synthesize base</span>
                      </button>

                      <button
                        onClick={() => setGradientOnly(!state.useGradientOnly)}
                        className={`flex-1 py-2.5 border text-center font-bold text-[11px] uppercase tracking-wide rounded-lg transition-all cursor-pointer ${
                          state.useGradientOnly
                            ? "bg-stone-900 border-[#FFB800]/40 text-[#FFB800]"
                            : "border-white/10 hover:bg-white/5 text-white/75"
                        }`}
                      >
                        Gradient Base Mode
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: TYPOGRAPHY LAYOUT TOOLS */}
              {activeTab === "text" && (
                <motion.div
                  key="text-panel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  {/* TITLE WRITER CONTROLS */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#FFB800] block">
                      Primary Bold Text Overlay
                    </label>
                    <textarea
                      placeholder="ENTER IMPACT HOOK TEXT"
                      value={state.title.text}
                      onChange={(e) => updateTitleText(e.target.value)}
                      className="w-full h-16 p-3 text-xs bg-stone-950 text-white rounded-lg border border-white/10 font-black outline-none focus:ring-1 focus:ring-amber-500/50 resize-none"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="text-[9px] text-white/50 block font-mono">Font Size</span>
                        <input
                          type="range"
                          min="35"
                          max="110"
                          value={state.title.fontSize}
                          onChange={(e) => updateTitleSize(Number(e.target.value))}
                          className="w-full h-1 bg-stone-950 rounded-lg appearance-none cursor-pointer accent-[#FFB800]"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-white/50 block font-mono">Accent Color</span>
                        <div className="flex items-center gap-1.5 bg-stone-950 p-1.5 rounded-lg border border-white/10">
                          <input
                            type="color"
                            value={state.title.color}
                            onChange={(e) => updateTitleColor(e.target.value)}
                            className="w-6 h-6 border-none bg-transparent cursor-pointer rounded"
                          />
                          <span className="text-[10px] text-white font-mono">{state.title.color}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SUBTITLE CO-WRITER CONTROLS */}
                  <div className="space-y-2 pt-2 border-t border-white/[0.04]">
                    <label className="text-[10px] font-bold font-mono uppercase tracking-widest text-white/50 block">
                      Sub-heading Callout
                    </label>
                    <input
                      type="text"
                      placeholder="ENTER SUBTITLE TEXT"
                      value={state.subtitle.text}
                      onChange={(e) => updateSubtitleText(e.target.value)}
                      className="w-full p-2.5 text-xs bg-stone-950 text-white rounded-lg border border-white/10 font-bold outline-none focus:ring-1 focus:ring-amber-500/50"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="text-[9px] text-white/50 block font-mono">Font Size</span>
                        <input
                          type="range"
                          min="18"
                          max="60"
                          value={state.subtitle.fontSize}
                          onChange={(e) => updateSubtitleSize(Number(e.target.value))}
                          className="w-full h-1 bg-stone-950 rounded-lg appearance-none cursor-pointer accent-[#FFB800]"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-white/50 block font-mono">Accent Color</span>
                        <div className="flex items-center gap-1.5 bg-stone-950 p-1.5 rounded-lg border border-white/10">
                          <input
                            type="color"
                            value={state.subtitle.color}
                            onChange={(e) => updateSubtitleColor(e.target.value)}
                            className="w-6 h-6 border-none bg-transparent cursor-pointer rounded"
                          />
                          <span className="text-[10px] text-white font-mono">{state.subtitle.color}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 3: SIGNATURE TEMPLATES & PERSONAL PHOTO PORTRAITS */}
              {activeTab === "face" && (
                <motion.div
                  key="face-panel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-4"
                >
                  {/* --- SECTION 1: SIGNATURE TEMPLATES --- */}
                  <div className="space-y-2 pb-3 border-b border-white/[0.04]">
                    <div className="flex items-center gap-1.5 justify-between">
                      <label className="text-[10px] font-bold font-mono uppercase tracking-widest text-white/50 block">
                        Locked Signature System
                      </label>
                      <span className="text-[9px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded border border-amber-500/20 flex items-center gap-1 font-mono">
                        <Crown className="w-2.5 h-2.5" /> THEMED RECALL
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.keys(PILLAR_TEMPLATES).map((pillarName) => {
                        const tmpl = PILLAR_TEMPLATES[pillarName as ThumbnailPillar];
                        const isCurrentPillar = state.pillar === pillarName;
                        return (
                          <button
                            key={pillarName}
                            onClick={() => {
                              applyLockTemplate(tmpl);
                              showToast(`Applied ${tmpl.name} Locked Template for ${pillarName}!`, "success");
                            }}
                            className={`p-2.5 text-left rounded-lg border transition-all hover:bg-white/[0.02] cursor-pointer group relative overflow-hidden`}
                            style={{
                              backgroundColor: "rgba(5, 5, 5, 0.9)",
                              borderColor: isCurrentPillar ? tmpl.primaryColor : "rgba(255,255,255,0.06)",
                            }}
                          >
                            <div className="text-[10px] font-bold text-white group-hover:text-amber-400 transition-colors">
                              {tmpl.name}
                            </div>
                            <div className="text-[8px] font-mono text-white/40 mt-1 uppercase">
                              {pillarName.split(" ")[0]} Style
                            </div>
                            <div className="text-[8px] font-mono mt-1.5 flex items-center gap-1" style={{ color: tmpl.primaryColor }}>
                              <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tmpl.primaryColor }}></span>
                              {tmpl.faceExpression.toUpperCase()} • {tmpl.titleFontSize}px
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* --- SECTION 2: RAHUL'S PERSONAL PHOTO LIBRARY (INDEXEDDB) --- */}
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-bold font-mono uppercase tracking-widest text-white/50 block">
                      Rahul's Photo Library (IndexedDB)
                    </label>

                    {/* PHOTO UPLOAD AND CONFIGURATION BOX */}
                    <div className="p-3 bg-stone-950 border border-white/[0.04] rounded-lg space-y-2.5">
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-1.5 text-[10px] text-white/60">
                          <input
                            type="checkbox"
                            id="autoRemoveCheckbox"
                            checked={autoRemoveBg}
                            onChange={(e) => setAutoRemoveBg(e.target.checked)}
                            className="rounded bg-black border-white/20 text-amber-500 accent-amber-500 focus:ring-0"
                          />
                          <label htmlFor="autoRemoveCheckbox" className="font-mono cursor-pointer select-none">
                            Auto-remove bg via API
                          </label>
                        </div>

                        {/* TAG INPUTS */}
                        <div className="flex items-center gap-1">
                          <select
                            value={photoExpression}
                            onChange={(e) => setPhotoExpression(e.target.value)}
                            className="bg-stone-900 border border-white/10 text-[9px] rounded font-mono p-1 text-white outline-none cursor-pointer"
                          >
                            <option value="excited">⚡ Excited</option>
                            <option value="shocked">🤯 Shocked</option>
                            <option value="serious">🧠 Serious</option>
                            <option value="smiling">😊 Smiling</option>
                            <option value="pointing">👉 Pointing</option>
                            <option value="confident">🔥 Confident</option>
                          </select>
                          <select
                            value={photoOrientation}
                            onChange={(e) => setPhotoOrientation(e.target.value)}
                            className="bg-stone-900 border border-white/10 text-[9px] rounded font-mono p-1 text-white outline-none cursor-pointer"
                          >
                            <option value="right">Face Right</option>
                            <option value="left">Face Left</option>
                            <option value="forward">Forward</option>
                          </select>
                        </div>
                      </div>

                      {/* DRAG / DROP UPLOAD ELEMENT */}
                      <label className="border border-dashed border-white/10 hover:border-amber-500/40 rounded-lg p-3 text-center block cursor-pointer bg-stone-900/40 hover:bg-stone-900/80 transition-all">
                        {isUploadingPhoto ? (
                          <div className="flex flex-col items-center justify-center py-1">
                            <RefreshCw className="w-5 h-5 text-amber-500 animate-spin" />
                            <span className="text-[10px] text-white/70 font-mono mt-1">Processing Transparent Silhouette...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-1">
                            <Upload className="w-5 h-5 text-white/40 group-hover:text-amber-500 transition-colors" />
                            <span className="text-[10px] text-white/80 font-bold mt-1">Upload Rahul Portrait Portrait</span>
                            <span className="text-[8px] text-white/40 font-mono mt-0.5">JPG/PNG with auto background removal</span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          disabled={isUploadingPhoto}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* PHOTO LIBRARY GRID */}
                    {storedPhotos.length > 0 ? (
                      <div className="space-y-2">
                        <span className="text-[8px] font-mono text-white/40 uppercase block">Stored Portraits ({storedPhotos.length})</span>
                        <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto pr-1">
                          {storedPhotos.map((photo) => {
                            const isSelected = state.face.customPhotoId === photo.id;
                            return (
                              <div
                                key={photo.id}
                                onClick={() => handleSelectPhoto(photo)}
                                className={`group p-1 bg-stone-950 border rounded-lg cursor-pointer relative overflow-hidden aspect-square flex flex-col items-center justify-center transition-all ${
                                  isSelected ? "border-amber-500 bg-amber-500/5 shadow-md" : "border-white/5 hover:border-white/20"
                                }`}
                              >
                                {/* IMAGE BACKGROUND WITH TRANSPARENT GRAPHIC VIEW */}
                                <img
                                  src={photo.thumbnailBase64}
                                  alt="Rahul portrait"
                                  className="w-10 h-10 object-contain drop-shadow"
                                />

                                {/* TRASH TRIGGER */}
                                <button
                                  onClick={(e) => handleDeletePhoto(photo.id, e)}
                                  className="absolute top-1 right-1 p-1 bg-stone-900/95 hover:bg-red-500/90 hover:text-white rounded border border-white/15 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                >
                                  <Trash2 className="w-2.5 h-2.5 text-red-500 group-hover:text-white" />
                                </button>

                                {/* SELECT TAG */}
                                {isSelected && (
                                  <div className="absolute bottom-1 right-1 bg-amber-500 text-black p-0.5 rounded font-mono font-bold text-[6px]">
                                    <Check className="w-2.5 h-2.5 text-black" />
                                  </div>
                                )}

                                {/* TAG BADGES */}
                                <div className="absolute bottom-0 text-center w-full bg-black/75 py-0.5 text-[7px] font-mono text-white/70 truncate uppercase">
                                  {photo.expression}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-stone-950 border border-white/[0.03] text-center">
                        <User className="w-6 h-6 text-white/20 mx-auto" />
                        <div className="text-[9px] font-mono text-white/40 mt-1 uppercase">Personal asset catalog currently empty.</div>
                      </div>
                    )}
                  </div>

                  {/* COORDS ADJUSTERS */}
                  <div className="space-y-3.5 pt-3 border-t border-white/[0.04]">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-mono text-white/50">
                        <span>Horizontal Position (X)</span>
                        <span>{state.face.x}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={state.resolution === "1280x720" ? 1280 : 720}
                        value={state.face.x}
                        onChange={(e) => updateFacePosition(Number(e.target.value), state.face.y)}
                        className="w-full h-1 bg-stone-950 rounded-lg appearance-none cursor-pointer accent-[#FFB800]"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-mono text-white/50">
                        <span>Vertical Position (Y)</span>
                        <span>{state.face.y}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={state.resolution === "1280x720" ? 720 : 1280}
                        value={state.face.y}
                        onChange={(e) => updateFacePosition(state.face.x, Number(e.target.value))}
                        className="w-full h-1 bg-stone-950 rounded-lg appearance-none cursor-pointer accent-[#FFB800]"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-mono text-white/50">
                        <span>Scale multiplier</span>
                        <span>{state.face.scale.toFixed(1)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.4"
                        max="2.5"
                        step="0.1"
                        value={state.face.scale}
                        onChange={(e) => updateFaceScale(Number(e.target.value))}
                        className="w-full h-1 bg-stone-950 rounded-lg appearance-none cursor-pointer accent-[#FFB800]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="space-y-1">
                        <span className="text-[9px] text-white/50 block font-mono">Neon Glow</span>
                        <input
                          type="color"
                          value={state.face.glowColor}
                          onChange={(e) => updateFaceGlow(e.target.value, state.face.glowWidth)}
                          className="w-full h-7 border-none bg-stone-950 cursor-pointer rounded animate-pulse"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-white/50 block font-mono">Glow width</span>
                        <input
                          type="range"
                          min="0"
                          max="15"
                          value={state.face.glowWidth}
                          onChange={(e) => updateFaceGlow(state.face.glowColor, Number(e.target.value))}
                          className="w-full h-1 mt-3 bg-stone-950 rounded-lg appearance-none cursor-pointer accent-[#FFB800]"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 4: MASK LAYERS AND CHROMATIC FX */}
              {activeTab === "layers" && (
                <motion.div
                  key="layers-panel"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-3.5"
                >
                  <label className="text-[10px] font-bold font-mono uppercase tracking-widest text-white/50 block">
                    Vivid FX Overlay Masks
                  </label>

                  <div className="flex flex-col gap-2.5">
                    {/* MATRIX CYBER GRID SWITCH */}
                    <button
                      onClick={() => toggleNeonGrid(!state.neonGrid)}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                        state.neonGrid
                          ? "bg-stone-900 border-[#FFB800]/50 text-[#FFB800]"
                          : "border-white/[0.04] bg-stone-950 hover:bg-stone-900 text-white/60"
                      }`}
                    >
                      <span className="text-xs font-bold uppercase tracking-wider">Neon grid matrix</span>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-black/40 text-white">
                        {state.neonGrid ? "On" : "Off"}
                      </span>
                    </button>

                    {/* VIGNETTE SHADOW SHIELD */}
                    <button
                      onClick={() => toggleVignette(!state.vignette)}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                        state.vignette
                          ? "bg-stone-900 border-[#FFB800]/50 text-[#FFB800]"
                          : "border-white/[0.04] bg-stone-950 hover:bg-stone-900 text-white/60"
                      }`}
                    >
                      <span className="text-xs font-bold uppercase tracking-wider">Vignette shadow framing</span>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-black/40 text-white">
                        {state.vignette ? "On" : "Off"}
                      </span>
                    </button>
                  </div>

                  {/* OVERLAY COLOR SHADE FILTER */}
                  <div className="space-y-2.5 pt-3 border-t border-white/[0.04]">
                    <div className="flex justify-between text-[9px] font-mono text-white/50 mb-1">
                      <span>Screen Overlay Filter Density</span>
                      <span>{(state.overlayOpacity * 100).toFixed(0)}%</span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="0.8"
                      step="0.05"
                      value={state.overlayOpacity}
                      onChange={(e) => updateOverlay(state.overlayColor, Number(e.target.value))}
                      className="w-full h-1 bg-stone-950 rounded-lg appearance-none cursor-pointer accent-[#FFB800]"
                    />

                    <div className="flex items-center gap-2">
                      <span className="text-[9px] tracking-wide uppercase text-white/40 block font-mono">Color</span>
                      <input
                        type="color"
                        value={state.overlayColor}
                        onChange={(e) => updateOverlay(e.target.value, state.overlayOpacity)}
                        className="w-10 h-6 border-none bg-stone-950 cursor-pointer rounded"
                      />
                      <span className="text-[10px] text-white/60 font-mono">{state.overlayColor}</span>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>

        {/* PANEL 2: INTERACTIVE HTML5 CANVAS PREVIEW (Column span 5) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          
          {/* THE CANVAS CONTAINER FRAME WITH DYNAMIC RATIO */}
          <div 
            className="w-full rounded-2xl overflow-hidden bg-zinc-950 border border-white/[0.06] shadow-2xl relative flex items-center justify-center p-2 group transition-all"
            style={{ 
              aspectRatio: state.resolution === "1280x720" ? "16/9" : "9/16",
              maxWidth: state.resolution === "1280x720" ? "100%" : "380px"
            }}
          >
            {/* CANVAS OBJECT DYNAMICALLY REDRAWN */}
            <canvas
              ref={canvasRef}
              className="w-full h-full object-contain rounded-xl select-none"
              style={{
                filter: state.isLoading ? "blur(4px) opacity(0.6)" : "none",
                transition: "filter 0.3s ease"
              }}
            />

            {/* PREVIEW STATUS LABELS */}
            {state.isLoading && (
              <div className="absolute inset-x-0 inset-y-0 bg-black/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 text-[#FFB800] animate-spin" />
                <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#FFB800]">
                  SYNTHESIZING MATRIX CANVAS...
                </span>
              </div>
            )}

            {/* QUICK PREVIEW GLASS FLAG */}
            <div className="absolute top-4 left-4 bg-black/85 backdrop-blur border border-white/10 px-3 py-1.5 rounded-md flex items-center gap-2 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] font-bold text-white uppercase tracking-widest font-mono">
                {state.resolution} Live Preview
              </span>
            </div>
          </div>

          {/* DRAGGABLE INSTRUCTIONS Gimmick bar */}
          <div className="mt-3 text-center flex items-center gap-1 bg-stone-950/40 border border-white/[0.03] px-3.5 py-1.5 rounded-full">
            <MousePointerClick className="w-3.5 h-3.5 text-[#FFB800]" />
            <span className="text-[9px] text-[#FFB800] tracking-wide font-black uppercase font-mono">
              Compositor is pixel-perfect at native download specs
            </span>
          </div>
        </div>

        {/* PANEL 3: CONCEPT OVERVIEW & DESIGN CATALOG (Column span 3) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* COMPLEMENTARY BRAND PILLARS CONFIGS QUICK SELECT */}
          <div className="p-4 bg-stone-950/40 rounded-xl border border-white/[0.04]">
            <span className="text-[9px] text-white/40 font-bold font-mono tracking-widest block uppercase mb-2.5">
              Select Pillar Presets
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {(["Archviz + AI", "Trading + Systems", "Vibe Coding", "Builder Journey"] as ThumbnailPillar[]).map((p) => {
                const config = PILLAR_PRESETS[p];
                const isActive = state.pillar === p;
                return (
                  <button
                    key={p}
                    onClick={() => {
                      setPillar(p);
                      showToast(`Loaded signature theme preset for: ${p}`, "success");
                    }}
                    className={`p-2.5 rounded-lg border text-left flex flex-col gap-0.5 transition-all text-xs cursor-pointer truncate ${
                      isActive
                        ? "bg-stone-900 border-white/15 text-white shadow-inner scale-[0.98]"
                        : "border-white/[0.04] bg-stone-950 hover:bg-stone-900 text-white/50"
                    }`}
                    style={isActive ? { borderLeft: `3px solid ${config.primaryColor}` } : undefined}
                  >
                    <span className="font-mono text-[9px] uppercase font-bold" style={{ color: isActive ? config.primaryColor : "inherit" }}>
                      {p.split(" ")[0]}
                    </span>
                    <span className="text-[8px] text-white/30 truncate block">
                      {config.fontFamily.replace("var(", "").replace(")", "").split("-")[2] || "mono"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACCENT PRESET STOCK IMAGE CATALOG */}
          <div className="p-4 bg-stone-950/40 rounded-xl border border-white/[0.04] space-y-2">
            <span className="text-[9px] text-white/40 font-bold font-mono tracking-widest block uppercase">
              High-Fidelity Stock Backdrop Assets
            </span>
            <p className="text-[8px] text-gray-500 italic leading-none mb-1">
              Double-click any matched catalog tile to apply instantly.
            </p>

            <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1">
              {STOCK_CREATIVES[state.pillar].map((url, idx) => (
                <div
                  key={idx}
                  onDoubleClick={() => {
                    setManualBackground(url);
                  }}
                  className={`relative aspect-video rounded-md border border-white/10 overflow-hidden cursor-pointer group hover:scale-[1.03] transition-all ${
                    state.backgroundImageUrl === url ? "ring-1 ring-amber-500" : ""
                  }`}
                >
                  <img
                    src={url}
                    alt={`Stock background ${idx}`}
                    className="w-full h-full object-cover rounded-md"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-[8px] font-mono uppercase bg-black px-1.5 py-0.5 rounded text-[#FFB800] scale-90">
                      Apply Tile
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PIPELINE DETAILED MATRIX INFORMATION CARD */}
          <div className="p-4 bg-stone-950/60 rounded-xl border border-white/[0.04] space-y-2.5 font-mono text-[9px]">
            <span className="text-white/40 font-bold tracking-widest block uppercase">
              Pipeline Representation Logs
            </span>
            
            <div className="space-y-1 text-white/50 select-text leading-relaxed">
              <div className="flex justify-between">
                <span>Pillar Theme:</span>
                <span style={{ color: activeAccentColor }}>{state.pillar}</span>
              </div>
              <div className="flex justify-between">
                <span>Resolution:</span>
                <span className="text-white">{state.resolution} (PNG)</span>
              </div>
              {state.concept && (
                <>
                  <div className="flex justify-between border-t border-white/[0.04] pt-1">
                    <span>Layout Gen:</span>
                    <span className="text-amber-500 truncate max-w-[120px] text-right block">{state.concept.layoutType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Title Accent:</span>
                    <span className="text-white font-bold">{state.concept.primaryColor}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between border-t border-white/[0.04] pt-1 leading-tighter">
                <span>Base engine:</span>
                <span className="text-gray-400 capitalize">{state.useGradientOnly ? "Vector gradient preset" : state.backgroundImageUrl ? "Cloud dynamic texture image" : "Unset background"}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
