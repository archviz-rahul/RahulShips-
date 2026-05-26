import React, { useState, useEffect, useRef } from "react";
import { VaultLink, LinkAnalysis, LinkPriority } from "@/types/linkVault";
import { PILLAR_CONFIG, Pillar } from "@/lib/pillarConfig";
import { db } from "@/lib/storage/indexedDB";
import { StorageManager } from "@/lib/storage/storageManager";
import { 
  X, 
  Star, 
  Archive, 
  ExternalLink, 
  Sparkles, 
  Brain, 
  Lightbulb, 
  Youtube, 
  FileText, 
  Loader2, 
  Edit3, 
  TrendingUp, 
  ChevronRight, 
  Copy, 
  Check, 
  Save,
  MessageSquare,
  Sparkle
} from "lucide-react";

interface LinkAnalysisDrawerProps {
  link: VaultLink | null;
  onClose: () => void;
  onUpdateLink: (id: string, updates: Partial<VaultLink>) => void;
  onToggleFavourite: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onTriggerAnalysis: (id: string) => void;
}

export default function LinkAnalysisDrawer({
  link,
  onClose,
  onUpdateLink,
  onToggleFavourite,
  onToggleArchive,
  onTriggerAnalysis
}: LinkAnalysisDrawerProps) {
  
  const [activeTab, setActiveTab] = useState<"analysis" | "scripts" | "youtube">("analysis");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<LinkAnalysis | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [savedIdeas, setSavedIdeas] = useState<Record<string, boolean>>({});

  // Notes state
  const [notes, setNotes] = useState("");
  const initialLinkRef = useRef<string | null>(null);

  // Synchronize state on prop change during the render phase
  const [prevLink, setPrevLink] = useState<VaultLink | null>(null);
  if (link !== prevLink) {
    setPrevLink(link);
    if (!link) {
      setAnalysis(null);
      setNotes("");
    } else {
      setNotes(link.notes || "");
    }
  }

  // Load analysis and synchronise notes whenever link changes
  useEffect(() => {
    if (!link) {
      initialLinkRef.current = null;
      return;
    }

    initialLinkRef.current = link.id;

    const loadAnalysis = async () => {
      try {
        setLoading(true);
        const records = await db.getAnalysis(link.id);
        setAnalysis(records);
        
        // Auto-select third tab for YouTube resources if available
        if (link.linkType?.startsWith("youtube") && records?.youtube) {
          setActiveTab("youtube");
        } else {
          setActiveTab("analysis");
        }
      } catch (err) {
        console.error("Failed to load link analysis:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAnalysis();
  }, [link]);

  // Handle note auto-saving on blur
  const handleNotesBlur = () => {
    if (!link || notes === link.notes) return;
    onUpdateLink(link.id, { notes });
  };

  const handleCopyText = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  // Saves generated AI scripts to the Content HQ Hook Bank natively for seamless interaction
  const handleSaveToHookBank = async (idea: any, idx: number) => {
    try {
      // Load current Hook Bank list via storageManager
      const currentHooks = await StorageManager.getHooks();
      
      const newHookEntry = {
        id: `hook_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
        title: idea.title,
        pillar: idea.pillar || link?.pillar || "vibe-coding",
        style: idea.format || "reel",
        hookValue: idea.hook,
        conceptText: idea.angle,
        viralScore: idea.estimatedViralScore || 8,
        createdAt: new Date().toISOString(),
        isSynced: false
      };

      const updated = [newHookEntry, ...currentHooks];
      await StorageManager.saveHooks(updated);

      // Track saved status locally
      setSavedIdeas((prev) => ({ ...prev, [idx]: true }));
      
      // Update linked parameters inside Link Vault record as well 
      if (link) {
        const savedIds = [...(link.savedHookIds || []), newHookEntry.id];
        onUpdateLink(link.id, { savedHookIds: savedIds });
      }
      
    } catch (err) {
      console.error("Failed to save script to Hook Bank:", err);
    }
  };

  if (!link) return null;

  const pConfig = link.pillar ? PILLAR_CONFIG[link.pillar] : null;

  return (
    <div className="w-[450px] max-w-full bg-[#111114] border-l border-[#1E1E24] shadow-[-10px_0_30px_rgba(0,0,0,0.5)] flex flex-col h-full overflow-hidden select-none">
      
      {/* DRAWER TITLE HERO (With glowing thumbnail backdrop) */}
      <div className="relative h-44 flex-shrink-0 flex flex-col justify-end p-5 overflow-hidden border-b border-[#1E1E24] select-text">
        <div className="absolute inset-0 z-0 bg-neutral-900">
          {link.thumbnailUrl ? (
            <img
              src={link.thumbnailUrl}
              alt=""
              className="w-full h-full object-cover opacity-25 filter blur-xs scale-105"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-[#0F0C20] to-[#15101A] opacity-60" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#111114] via-[#111114]/80 to-transparent z-10" />
        </div>

        {/* TOP ROW INTERACTIVE TOOLBAR */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onToggleFavourite(link.id)}
            className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer ${
              link.isFavourited ? "text-yellow-500 bg-yellow-500/10" : "text-[#6B6B7B]"
            }`}
            title="Favorite Link"
          >
            <Star className={`w-4 h-4 ${link.isFavourited ? "fill-yellow-500" : ""}`} />
          </button>

          <button
            onClick={() => onToggleArchive(link.id)}
            className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer ${
              link.isArchived ? "text-purple-400 bg-[#A855F7]/10" : "text-[#6B6B7B]"
            }`}
            title="Archive Link"
          >
            <Archive className="w-4 h-4" />
          </button>

          <a
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-lg text-[#6B6B7B] hover:text-white hover:bg-white/10 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MAIN TITLE BLOCK */}
        <div className="z-10 flex flex-col gap-1.5 max-w-full">
          <div className="flex gap-1.5 items-center">
            {/* Quick pillar dropdown picker */}
            <select
              value={link.pillar || "unassigned"}
              onChange={(e) => onUpdateLink(link.id, { pillar: e.target.value === "unassigned" ? null : e.target.value as Pillar })}
              className="bg-[#0A0A0B]/80 text-[#FAC505] border border-white/10 hover:border-white/20 text-[10px] uppercase font-bold px-2 py-0.5 rounded cursor-pointer max-w-[150px] outline-none"
            >
              <option value="unassigned">⚪ Unassigned</option>
              {Object.entries(PILLAR_CONFIG).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.emoji} {item.shortLabel}
                </option>
              ))}
            </select>

            {/* Quick priority picker */}
            <select
              value={link.priority}
              onChange={(e) => onUpdateLink(link.id, { priority: e.target.value as LinkPriority })}
              className="bg-[#0A0A0B]/80 text-neutral-400 border border-white/10 text-[10px] uppercase font-bold px-2 py-0.5 rounded cursor-pointer outline-none"
            >
              <option value="high">🔴 High</option>
              <option value="medium">🟡 Med</option>
              <option value="low">🟢 Low</option>
            </select>
          </div>

          <h3 className="text-sm font-bold font-display text-white line-clamp-2 leading-snug">
            {link.title || "Untitled draft URL metadata"}
          </h3>
          <p className="text-[10px] text-neutral-500 font-mono tracking-wide flex items-center gap-1">
            <span>{link.domain}</span>
            <span>·</span>
            <span className="capitalize">{link.linkType?.replace("-", " ") || "Draft"}</span>
          </p>
        </div>
      </div>

      {/* DRAWER TABS SELECTOR */}
      <div className="flex bg-[#0A0A0B]/30 border-b border-[#1E1E24] text-xs font-semibold uppercase tracking-wider text-[#6B6B7B]">
        <button
          onClick={() => setActiveTab("analysis")}
          className={`flex-1 py-3 text-center border-b-2 cursor-pointer flex justify-center items-center gap-1.5 transition-colors ${
            activeTab === "analysis" ? "border-[#F59E0B] text-white bg-white/[0.02]" : "border-transparent hover:text-white"
          }`}
        >
          <Brain className="w-3.5 h-3.5 text-orange-400" />
          <span>Analysis</span>
        </button>

        <button
          onClick={() => setActiveTab("scripts")}
          className={`flex-1 py-3 text-center border-b-2 cursor-pointer flex justify-center items-center gap-1.5 transition-colors ${
            activeTab === "scripts" ? "border-[#F59E0B] text-white bg-white/[0.02]" : "border-transparent hover:text-white"
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <span>Ideas Hub</span>
        </button>

        {link.linkType?.startsWith("youtube") && (
          <button
            onClick={() => setActiveTab("youtube")}
            className={`flex-1 py-3 text-center border-b-2 cursor-pointer flex justify-center items-center gap-1.5 transition-colors ${
              activeTab === "youtube" ? "border-[#F59E0B] text-white bg-white/[0.02]" : "border-transparent hover:text-white"
            }`}
          >
            <Youtube className="w-3.5 h-3.5 text-red-500" />
            <span>YT Video</span>
          </button>
        )}
      </div>

      {/* BODY WORKSPACE AREA */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6 custom-scrollbar select-text leading-relaxed">
        
        {/* LOADING SHIM */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center select-none">
            <Loader2 className="w-8 h-8 text-[#F59E0B] animate-spin" />
            <p className="text-xs text-neutral-500 font-mono">Loading content metrics...</p>
          </div>
        ) : !analysis ? (
          // NO ANALYSIS RETAINED
          <div className="flex flex-col items-center justify-center p-6 text-center select-none bg-white/[0.01] border border-dashed border-[#1E1E24] rounded-xl py-12 gap-4">
            <Sparkles className="w-8 h-8 text-neutral-600 animate-pulse" />
            <div>
              <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wide">Analysis Needed</h4>
              <p className="text-xs text-[#6B6B7B] max-w-[240px] mt-1.5">This resource haven&apos;t been processed by Gemini content engine yet.</p>
            </div>
            <button
              onClick={() => onTriggerAnalysis(link.id)}
              className="bg-[#1E1E24] hover:bg-[#2A2A33] font-bold text-white max-w-sm px-4 py-2 text-xs rounded-xl flex items-center gap-2 cursor-pointer border border-[#1E1E24]"
            >
              <Brain className="w-4 h-4 text-[#F59E0B]" />
              <span>Analyse Resource now</span>
            </button>
          </div>
        ) : (
          // ACTIVE ANALYSIS VIEW WORKSPACES
          <div className="flex flex-col gap-6">

            {/* TAB 1: AI GENERAL ANALYSIS OVERVIEW */}
            {activeTab === "analysis" && (
              <div className="flex flex-col gap-5 text-xs">
                
                {/* Visual score pills grid */}
                <div className="grid grid-cols-3 gap-3 font-display text-center select-none">
                  <div className="bg-[#0D0D10] border border-[#1E1E24/60] p-2 rounded-xl">
                    <div className="text-[10px] tracking-wider text-[#6B6B7B] uppercase font-sans">Pillar Score</div>
                    <div className="text-lg font-bold text-[#FAC505] mt-1">{analysis.pillarScore || 0}/10</div>
                  </div>
                  <div className="bg-[#0D0D10] border border-[#1E1E24/60] p-2 rounded-xl">
                    <div className="text-[10px] tracking-wider text-[#6B6B7B] uppercase font-sans">Value Metric</div>
                    <div className="text-lg font-bold text-green-400 mt-1">{analysis.contentValue || 0}/10</div>
                  </div>
                  <div className="bg-[#0D0D10] border border-[#1E1E24/60] p-2 rounded-xl">
                    <div className="text-[10px] tracking-wider text-[#6B6B7B] uppercase font-sans">Virality</div>
                    <div className="text-lg font-bold text-cyan-400 mt-1">{analysis.virality || 0}/10</div>
                  </div>
                </div>

                {/* Summary */}
                <div className="flex flex-col gap-1.5">
                  <div className="font-bold text-white text-[11px] uppercase tracking-wider text-[#6B6B7B]">3-Sentence Summary</div>
                  <p className="text-neutral-300 font-sans text-xs bg-white/[0.01] border border-[#1E1E24]/60 p-3 rounded-xl leading-relaxed">
                    {analysis.summary}
                  </p>
                </div>

                {/* Key takeaways */}
                <div className="flex flex-col gap-1.5">
                  <div className="font-bold text-white text-[11px] uppercase tracking-wider text-[#6B6B7B]">Key Takeaways</div>
                  <ul className="flex flex-col gap-2 bg-[#0D0D10]/50 border border-[#1E1E24]/60 p-3.5 rounded-xl text-neutral-300 font-sans text-xs">
                    {analysis.keyInsights?.map((ins, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-[#F59E0B] font-bold">✓</span>
                        <span>{ins}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Stats metadata */}
                {analysis.statistics && analysis.statistics.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <div className="font-bold text-white text-[11px] uppercase tracking-wider text-[#6B6B7B]">Identified Statistics & Bounds</div>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.statistics.map((st, i) => (
                        <div key={i} className="bg-neutral-900 border border-[#1E1E24] px-2.5 py-1 rounded-lg font-mono text-[10px] text-amber-500/85">
                          {st}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quotable lines */}
                {analysis.quotableLines && analysis.quotableLines.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <div className="font-bold text-white text-[11px] uppercase tracking-wider text-[#6B6B7B]">Hook Quotes</div>
                    <div className="flex flex-col gap-2 font-mono text-neutral-400 italic text-[11px]">
                      {analysis.quotableLines.map((qt, i) => (
                        <div key={i} className="border-l border-amber-500/40 pl-3 leading-relaxed">
                          {"\""}{qt}{"\""}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* TAB 2: TAILORED VIDEO SCRIPTS IDEAS */}
            {activeTab === "scripts" && (
              <div className="flex flex-col gap-5 text-xs">
                <div className="flex items-center justify-between text-[#6B6B7B] px-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Tailored scripts for @RahulShips</span>
                  <span className="text-[10px] bg-amber-500/10 text-amber-500 font-mono flex items-center gap-1 px-2 py-0.5 rounded-full select-none">
                    <Sparkle className="w-3 h-3 animate-pulse" />
                    <span>Hinglish creator mode</span>
                  </span>
                </div>

                <div className="flex flex-col gap-4">
                  {analysis.contentIdeas?.map((idea, idx) => (
                    <div key={idx} className="bg-[#0D0D10] border border-[#1E1E24] rounded-xl overflow-hidden p-4 flex flex-col gap-3">
                      
                      {/* Title block */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center select-none">
                          <span className="bg-[#FAC505]/10 border border-[#FAC505]/20 text-[#FAC505] text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded font-sans leading-none">{idea.format}</span>
                          <span className="text-[10px] font-semibold font-mono text-cyan-400">Potential: {idea.estimatedViralScore || 8}/10</span>
                        </div>
                        <h4 className="text-xs font-bold font-display text-white">{idea.title}</h4>
                      </div>

                      {/* Hinglish Opening hook line */}
                      <div className="bg-[#111114] border-l-2 border-l-[#F59E0B] p-2.5 rounded-r-lg">
                        <div className="text-[9px] text-[#6B6B7B] uppercase font-bold tracking-wider select-none mb-1">Hinglish Opening Pitch:</div>
                        <p className="font-sans text-xs text-neutral-200 font-medium italic select-text leading-relaxed">
                          {"\""}{idea.hook}{"\""}
                        </p>
                      </div>

                      {/* Unique Angle commentary */}
                      <div className="text-[11px] text-[#6B6B7B] leading-relaxed">
                        <span className="font-semibold text-neutral-400">Angle:</span> {idea.angle}
                      </div>

                      {/* Quick tool buttons */}
                      <div className="flex gap-2 border-t border-[#1E1E24] pt-3 mt-1 select-none">
                        <button
                          onClick={() => handleCopyText(`Title: ${idea.title}\nHook: ${idea.hook}\nAngle: ${idea.angle}`, idx)}
                          className="flex-1 py-1 px-2.5 bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-lg text-neutral-400 hover:text-white flex items-center justify-center gap-1 border border-[#1E1E24] cursor-pointer font-sans"
                        >
                          {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedIndex === idx ? "Copied" : "Copy details"}</span>
                        </button>

                        <button
                          onClick={() => handleSaveToHookBank(idea, idx)}
                          disabled={savedIdeas[idx]}
                          className="flex-1 py-1 px-2.5 bg-[#FAC505]/10 hover:bg-[#FAC505]/20 disabled:bg-neutral-900 disabled:opacity-50 transition-colors rounded-lg text-[#FAC505] disabled:text-[#6B6B7B] flex items-center justify-center gap-1 border border-[#FAC505]/15 disabled:border-transparent cursor-pointer font-sans"
                        >
                          {savedIdeas[idx] ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                          <span>{savedIdeas[idx] ? "Saved to Bank" : "Save script idea"}</span>
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: YOUTUBE SPECIFIC VIDEO RESEARCH CONTEXTS */}
            {activeTab === "youtube" && analysis.youtube && (
              <div className="flex flex-col gap-5 text-xs">
                
                {/* Channel / view metadata context in case video is scanned */}
                <div className="flex flex-col gap-1.5">
                  <div className="font-bold text-white text-[11px] uppercase tracking-wider text-[#6B6B7B]">Opening Hook Line Used</div>
                  <p className="text-neutral-300 font-sans text-xs bg-white/[0.01] border border-[#1E1E24]/60 p-3 rounded-xl leading-relaxed italic">
                    {"\""}{analysis.youtube.openingHook || "Analyzing timestamps..."}{"\""}
                  </p>
                </div>

                {/* Structural timestamps */}
                {analysis.youtube.structure && (
                  <div className="flex flex-col gap-1.5">
                    <div className="font-bold text-white text-[11px] uppercase tracking-wider text-[#6B6B7B]">Video Structure / Timestamps</div>
                    <div className="flex flex-col divide-y divide-[#1E1E24]/65 bg-[#0D0D10] border border-[#1E1E24] rounded-xl overflow-hidden font-mono text-[11px]">
                      {analysis.youtube.structure.map((part, i) => {
                        const parts = part.split("-");
                        const time = parts[0]?.trim();
                        const taskDesc = parts.slice(1).join("-")?.trim();
                        return (
                          <div key={i} className="flex px-3.5 py-2.5 align-middle">
                            <span className="text-[#FAC505] w-16 font-bold flex-shrink-0">{time || "0:00"}</span>
                            <span className="text-neutral-300 truncate">{taskDesc || "Introduction Scene"}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Thumbnail Insight */}
                {analysis.youtube.thumbnailAnalysis && (
                  <div className="flex flex-col gap-1.5">
                    <div className="font-bold text-white text-[11px] uppercase tracking-wider text-[#6B6B7B]">Thumbnail Psychological Insight</div>
                    <p className="text-neutral-400 font-sans text-xs bg-neutral-900 border border-[#1E1E24] p-3 rounded-xl leading-relaxed">
                      {analysis.youtube.thumbnailAnalysis}
                    </p>
                  </div>
                )}

                {/* Pitch CTA hook used */}
                {analysis.youtube.ctaUsed && (
                  <div className="flex flex-col gap-1.5">
                    <div className="font-bold text-white text-[11px] uppercase tracking-wider text-[#6B6B7B]">Audience Call-to-Action</div>
                    <p className="text-neutral-300 font-mono text-[11px] bg-white/[0.01] border border-dashed border-[#1E1E24] p-3 rounded-xl leading-relaxed">
                      {analysis.youtube.ctaUsed}
                    </p>
                  </div>
                )}

              </div>
            )}

          </div>
        )}

      </div>

      {/* FOOTER COLLAPSIBLE NOTES PANEL (Dynamic Auto Saving) */}
      <div className="border-t border-[#1E1E24] p-5 bg-[#0D0D10]/40 flex flex-col gap-2 flex-shrink-0 select-text">
        <div className="flex justify-between items-center text-[#6B6B7B] text-[10px] uppercase font-bold tracking-wider select-none">
          <div className="flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5 text-neutral-500" />
            <span>Link Notes & Context</span>
          </div>
          <span className="text-[9px] bg-green-500/10 text-green-400 px-1.5 py-0.2 rounded font-mono">Auto-saving</span>
        </div>
        
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleNotesBlur}
          placeholder="Type custom thoughts, visual hooks, script guidelines, video comments to preserve on this link..."
          className="w-full bg-[#0A0A0B] border border-[#1E1E24] rounded-lg p-2.5 min-h-[70px] max-h-[140px] text-xs font-sans text-white outline-none resize-none focus:border-white/20"
        />
      </div>

    </div>
  );
}
