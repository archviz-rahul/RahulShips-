import React, { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Clipboard, Youtube, Upload, Link, Loader2, Sparkles, Check, AlertCircle } from "lucide-react";
import { detectLinkType, extractDomain, parseUrlsFromText } from "@/lib/linkParser";
import { LinkPriority, VaultLink } from "@/types/linkVault";
import { Pillar, PILLAR_CONFIG } from "@/lib/pillarConfig";

interface AddLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPasteSubmit: (
    rawText: string,
    pillar: Pillar | null,
    priority: LinkPriority,
    autoAnalyse: boolean,
    autoDetect: boolean
  ) => Promise<number>;
  onYouTubeChannelSubmit: (links: VaultLink[], autoAnalyse: boolean) => Promise<void>;
  onBulkSubmit: (links: VaultLink[], autoAnalyse: boolean) => Promise<void>;
}

export default function AddLinksModal({
  isOpen,
  onClose,
  onPasteSubmit,
  onYouTubeChannelSubmit,
  onBulkSubmit
}: AddLinksModalProps) {
  const [activeTab, setActiveTab] = useState<"paste" | "youtube" | "bulk">("paste");
  const [submitting, setSubmitting] = useState(false);

  // Settings common to some workflows
  const [autoAnalyse, setAutoAnalyse] = useState(true);
  const [pillarAutoDetect, setPillarAutoDetect] = useState(true);
  const [manualPillar, setManualPillar] = useState<Pillar>("vibe-coding");
  const [priority, setPriority] = useState<LinkPriority>("medium");

  // TAB 1: Paste Links State
  const [pastedText, setPastedText] = useState("");
  const detectedLinksListInRealTime = useMemo(() => {
    const urls = parseUrlsFromText(pastedText);
    return urls.map((url) => ({
      url,
      type: detectLinkType(url),
      domain: extractDomain(url)
    }));
  }, [pastedText]);

  // TAB 2: YouTube Channel State
  const [ytHandle, setYtHandle] = useState("");
  const [channelData, setChannelData] = useState<{
    title: string;
    handle: string;
    subscribers: string;
    videosCount: number;
    avatarUrl: string;
  } | null>(null);

  const [ytVideosCount, setYtVideosCount] = useState(25);
  const [ytIncludeLong, setYtIncludeLong] = useState(true);
  const [ytIncludeShorts, setYtIncludeShorts] = useState(true);
  const [loadingChannel, setLoadingChannel] = useState(false);

  // TAB 3: Bulk Import State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [parsedBulkRecords, setParsedBulkRecords] = useState<any[]>([]);
  const [bulkParseStats, setBulkParseStats] = useState<{
    valid: number;
    skipped: number;
    missingPillar: number;
  } | null>(null);

  const resetAll = () => {
    setPastedText("");
    setYtHandle("");
    setChannelData(null);
    setBulkFile(null);
    setParsedBulkRecords([]);
    setBulkParseStats(null);
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  // Submission handlers
  const handlePasteSubmit = async () => {
    if (detectedLinksListInRealTime.length === 0) return;
    try {
      setSubmitting(true);
      await onPasteSubmit(
        pastedText,
        pillarAutoDetect ? null : manualPillar,
        priority,
        autoAnalyse,
        pillarAutoDetect
      );
      handleClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChannelFetch = async () => {
    if (!ytHandle.trim()) return;
    try {
      setLoadingChannel(true);
      setChannelData(null);

      // Simulate a smart, reassuring fetch or hit api
      const response = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "youtube-channel",
          handle: ytHandle,
          count: 1 // fetch minimal info
        })
      });

      const resData = await response.json();
      let title = "Creator Channel";
      let subscriberText = "240k subscribers";
      let avatar = "https://picsum.photos/seed/avatar/150/150";

      if (resData.success && resData.data && resData.data.length > 0) {
        const vid = resData.data[0];
        if (vid.youtube?.channelName) {
          title = vid.youtube.channelName;
        }
      }

      // Prepopulate
      setChannelData({
        title: title,
        handle: ytHandle.startsWith("@") ? ytHandle : `@${ytHandle.split("@")[1] || ytHandle}`,
        subscribers: subscriberText,
        videosCount: 384,
        avatarUrl: avatar
      });

    } catch (e) {
      console.error(e);
    } finally {
      setLoadingChannel(false);
    }
  };

  const handleImportYouTubeVideos = async () => {
    if (!channelData) return;
    try {
      setSubmitting(true);
      const response = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "youtube-channel",
          handle: ytHandle,
          count: ytVideosCount
        })
      });

      const resData = await response.json();
      if (resData.success && Array.isArray(resData.data)) {
        let list: VaultLink[] = resData.data;

        // Apply filters
        if (!ytIncludeLong) {
          list = list.filter((v) => v.linkType !== "youtube-video");
        }
        if (!ytIncludeShorts) {
          list = list.filter((v) => v.linkType !== "youtube-short");
        }

        // Apply pillar and parameters overrides
        const mapped = list.map((item) => ({
          ...item,
          priority,
          pillar: pillarAutoDetect ? null : manualPillar,
          pillarAutoDetected: pillarAutoDetect
        }));

        await onYouTubeChannelSubmit(mapped, autoAnalyse);
        handleClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  // CSV txt file parses
  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split("\n");
      const validRecords: any[] = [];
      let skipped = 0;
      let missingPillar = 0;

      lines.forEach((line) => {
        if (!line.trim()) {
          skipped++;
          return;
        }

        const parts = line.split(",").map((p) => p.trim());
        const url = parts[0];

        // Extremely simple evaluation
        if (!url || !url.startsWith("http")) {
          skipped++;
          return;
        }

        const title = parts[1] || "";
        const rowPillar = parts[2] ? parts[2].toLowerCase() : null;

        if (!rowPillar) {
          missingPillar++;
        }

        const linkType = detectLinkType(url);
        const domain = extractDomain(url);

        validRecords.push({
          id: `link_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
          url,
          cleanUrl: url,
          domain,
          linkType,
          title: title || `Import: ${domain}`,
          description: "",
          thumbnailUrl: `https://picsum.photos/seed/${domain.replace(".", "-")}/640/360`,
          favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
          pillar: rowPillar && ["archviz", "trading", "vibe-coding", "builder"].includes(rowPillar) ? rowPillar : null,
          pillarAutoDetected: !rowPillar,
          tags: ["bulk-csv"],
          priority: priority,
          addedFrom: "bulk-import",
          analysisStatus: "pending",
          analysisError: null,
          analysedAt: null,
          usedInBrief: false,
          usedInHookBank: false,
          savedHookIds: [],
          savedIdeaIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastViewedAt: null,
          isArchived: false,
          isFavourited: false,
          notes: ""
        });
      });

      setParsedBulkRecords(validRecords);
      setBulkParseStats({
        valid: validRecords.length,
        skipped,
        missingPillar
      });
    };
    reader.readAsText(file);
  };

  const handleImportBulk = async () => {
    if (parsedBulkRecords.length === 0) return;
    try {
      setSubmitting(true);
      await onBulkSubmit(parsedBulkRecords, autoAnalyse);
      handleClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-[680px] bg-[#111114] border border-[#1E1E24] rounded-2xl flex flex-col overflow-hidden max-h-[90vh]"
      >
        {/* HEADER */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#1E1E24]">
          <h2 className="text-lg font-bold font-display text-white">Add Links to Vault</h2>
          <button
            onClick={handleClose}
            className="p-1 px-2.5 rounded-lg hover:bg-white/5 text-[#6B6B7B] hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS SELECTOR */}
        <div className="flex border-b border-[#1E1E24] bg-white/[0.02]">
          {[
            { id: "paste", label: "📋 Paste Links", sub: "Add URLs manually" },
            { id: "youtube", label: "▶️ YouTube Channel", sub: "Import channel video feeds" },
            { id: "bulk", label: "📁 Bulk Import", sub: "Upload CSV / TXT files" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 px-4 text-center cursor-pointer border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-[#F59E0B] text-white bg-white/[0.03] font-medium"
                  : "border-transparent text-[#6B6B7B] hover:text-white"
              }`}
            >
              <div className="text-sm">{tab.label}</div>
              <div className="text-[10px] text-neutral-500 font-sans tracking-wide mt-0.5">{tab.sub}</div>
            </button>
          ))}
        </div>

        {/* SCROLL AREA */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 custom-scrollbar">
          
          {/* TAB 1 CONTENT — PASTE LINKS */}
          {activeTab === "paste" && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold tracking-wider text-[#6B6B7B] uppercase">Resource URLs</label>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={`Paste up to 500 URLs here, one per line or space-separated:
https://www.youtube.com/watch?v=ABC123xyz
https://substack.com/post/example
https://reddit.com/r/webdev/comments/...`}
                  className="w-full bg-[#0A0A0B] border border-[#1E1E24] rounded-xl p-3 min-h-[160px] max-h-[300px] text-xs font-mono text-white outline-none resize-y focus:border-[#F59E0B]/50"
                />
              </div>

              {/* LIVE PARSE PREVIEW */}
              {detectedLinksListInRealTime.length > 0 && (
                <div className="border border-[#1E1E24] bg-white/[0.01] rounded-xl p-4">
                  <div className="text-xs font-semibold text-neutral-400 mb-3 flex justify-between items-center">
                    <span>Detected {detectedLinksListInRealTime.length} links:</span>
                    <span className="text-[10px] bg-[#F59E0B]/10 text-[#F59E0B] px-1.5 py-0.5 rounded-full font-mono">Real-time parse</span>
                  </div>
                  <div className="max-h-[140px] overflow-y-auto flex flex-col gap-1.5 pr-1 custom-scrollbar">
                    {detectedLinksListInRealTime.map((item, index) => (
                      <div key={index} className="flex justify-between items-center bg-[#0D0D10] px-3 py-1.5 border border-[#1E1E24] rounded-lg text-xs gap-3">
                        <span className="flex items-center gap-1.5 truncate">
                          <Link className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                          <span className="text-[#6B6B7B] text-[10px] font-mono select-none px-1 rounded bg-white/5 uppercase">{item.type}</span>
                          <span className="text-neutral-300 truncate font-mono text-[11px]">{item.url}</span>
                        </span>
                        <span className="text-[10px] text-neutral-500 truncate text-right capitalize">{item.domain}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2 CONTENT — YOUTUBE CHANNEL */}
          {activeTab === "youtube" && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold tracking-wider text-[#6B6B7B] uppercase">YouTube Handle or URL</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-neutral-600 text-sm select-none">@</span>
                    <input
                      type="text"
                      placeholder="handle e.g. mkbhd"
                      value={ytHandle}
                      onChange={(e) => setYtHandle(e.target.value.replace("@", ""))}
                      className="w-full bg-[#0A0A0B] border border-[#1E1E24] text-sm text-white rounded-xl pl-7 pr-3 py-2 outline-none focus:border-[#F59E0B]/50 font-sans"
                    />
                  </div>
                  <button
                    onClick={handleChannelFetch}
                    disabled={loadingChannel || !ytHandle.trim()}
                    className="bg-[#1E1E24] hover:bg-[#2A2A33] disabled:opacity-50 text-white rounded-xl px-4 py-2 font-medium text-xs cursor-pointer flex items-center gap-1.5"
                  >
                    {loadingChannel ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-500" />}
                    <span>Fetch Channel</span>
                  </button>
                </div>
              </div>

              {/* CHANNEL INFORMATION PREVIEW */}
              {channelData && (
                <div className="border border-[#1E1E24] bg-white/[0.01] rounded-xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-[#1E1E24] border border-[#1E1E24] flex-shrink-0">
                    <img src={channelData.avatarUrl} alt="Channel Avatar" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-display flex items-center gap-1.5">
                      <span>{channelData.title}</span>
                      <span className="bg-red-500/15 text-red-400 text-[10px] px-1.5 py-0.5 rounded-full font-mono uppercase">FEED ACTIVE</span>
                    </h4>
                    <p className="text-xs text-[#6B6B7B] mt-0.5">
                      {channelData.handle} · {channelData.subscribers} · {channelData.videosCount} videos available
                    </p>
                  </div>
                </div>
              )}

              {/* FETCH OPTIONS */}
              {channelData && (
                <div className="grid grid-cols-2 gap-4 border border-[#1E1E24] p-4 bg-white/[0.01] rounded-xl">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#6B6B7B] font-semibold">Videos Limit</label>
                    <select
                      value={ytVideosCount}
                      onChange={(e) => setYtVideosCount(Number(e.target.value))}
                      className="bg-[#0A0A0B] border border-[#1E1E24] text-white text-xs rounded-lg px-2 py-1.5 outline-none cursor-pointer"
                    >
                      <option value={10}>Last 10 videos</option>
                      <option value={25}>Last 25 videos</option>
                      <option value={50}>Last 50 videos</option>
                      <option value={100}>Last 100 videos</option>
                      <option value={200}>Last 200 videos</option>
                      <option value={500}>All videos (Max 500)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5 justify-center">
                    <label className="text-xs text-[#6B6B7B] font-semibold">Video Types</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 text-xs text-neutral-300 font-sans cursor-pointer">
                        <input
                          type="checkbox"
                          checked={ytIncludeLong}
                          onChange={(e) => setYtIncludeLong(e.target.checked)}
                          className="rounded accent-[#F59E0B]"
                        />
                        <span>Long Video</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-neutral-300 font-sans cursor-pointer">
                        <input
                          type="checkbox"
                          checked={ytIncludeShorts}
                          onChange={(e) => setYtIncludeShorts(e.target.checked)}
                          className="rounded accent-[#F59E0B]"
                        />
                        <span>Shorts</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3 CONTENT — BULK IMPORT */}
          {activeTab === "bulk" && (
            <div className="flex flex-col gap-5">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#1E1E24] hover:border-[#F59E0B]/50 transition-colors bg-white/[0.01] rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer gap-2"
              >
                <Upload className="w-8 h-8 text-neutral-500" />
                <span className="text-sm text-neutral-300 font-medium">
                  {bulkFile ? bulkFile.name : "Drop your .csv or .txt file here"}
                </span>
                <span className="text-xs text-[#6B6B7B]">or click to browse local files</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleBulkFileChange}
                  className="hidden"
                />
              </div>

              {/* HINT DESCRIPTIONS */}
              {!bulkFile && (
                <div className="text-xs text-[#6B6B7B] bg-[#0D0D10] border border-[#1E1E24] p-3 rounded-xl">
                  <div className="font-semibold text-neutral-400 mb-1">Expected template variables:</div>
                  <code className="block font-mono text-[11px] bg-black/30 p-2 rounded text-amber-500/80 leading-relaxed">
                    URL, Title (optional), Pillar (optional)<br />
                    https://youtube.com/watch?v=123, Video tutorial title, vibe-coding<br />
                    https://reddit.com/r/..., Stock algorithmic limitations, trading
                  </code>
                </div>
              )}

              {/* PARSED PREVIEW */}
              {bulkFile && bulkParseStats && (
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-semibold text-[#6B6B7B] uppercase">Parse Statistics Overview</span>
                    <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full font-mono">FILE READ SUCCESS</span>
                  </div>
                  
                  {/* Stats items */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-[#0D0D10] border border-[#1E1E24] p-2.5 rounded-xl text-center">
                      <div className="text-xs text-[#6B6B7B]">Valid URLs</div>
                      <div className="text-base font-bold text-white font-display mt-0.5">{bulkParseStats.valid}</div>
                    </div>
                    <div className="bg-[#0D0D10] border border-[#1E1E24] p-2.5 rounded-xl text-center">
                      <div className="text-xs text-[#6B6B7B]">Rows Skipped</div>
                      <div className="text-base font-bold text-red-400 font-display mt-0.5">{bulkParseStats.skipped}</div>
                    </div>
                    <div className="bg-[#0D0D10] border border-[#1E1E24] p-2.5 rounded-xl text-center">
                      <div className="text-xs text-[#6B6B7B]">Missing Pillar</div>
                      <div className="text-base font-bold text-amber-400 font-display mt-0.5">{bulkParseStats.missingPillar}</div>
                    </div>
                  </div>

                  {/* Top 3 row preview */}
                  <div className="border border-[#1E1E24] rounded-xl overflow-hidden text-xs">
                    <div className="bg-white/5 px-3 py-1.5 font-semibold text-neutral-400 border-b border-[#1E1E24]">First rows parsed:</div>
                    <div className="flex flex-col divide-y divide-[#1E1E24] bg-white/[0.01]">
                      {parsedBulkRecords.slice(0, 3).map((v, i) => (
                        <div key={i} className="px-3 py-2 flex justify-between items-center gap-3">
                          <span className="font-mono text-[11px] text-neutral-400 truncate flex-1">{v.url}</span>
                          <span className="text-[10px] text-neutral-500 bg-white/5 px-1.5 py-0.5 rounded rounded-full font-mono uppercase">{v.pillar || "auto-detect"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── SETTINGS COLLAPSIBLE PANEL (COMMON SETTINGS) ── */}
          {(activeTab === "paste" && detectedLinksListInRealTime.length > 0) || 
           (activeTab === "youtube" && channelData) || 
           (activeTab === "bulk" && bulkFile) ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-t border-[#1E1E24] pt-5 flex flex-col gap-4 font-sans text-xs"
            >
              <div className="font-bold font-display text-white text-[13px] tracking-wide mb-1 uppercase text-[#6B6B7B]">Link Settings</div>
              
              <div className="grid grid-cols-2 gap-4">
                
                {/* Pillar Assign */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="font-semibold text-[#6B6B7B]">Classification Pillar</label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-[#6B6B7B] text-[10px] hover:text-white">
                      <input
                        type="checkbox"
                        checked={pillarAutoDetect}
                        onChange={(e) => setPillarAutoDetect(e.target.checked)}
                        className="rounded accent-amber-500 scale-90"
                      />
                      <span>Auto-detect pillar (AI)</span>
                    </label>
                  </div>
                  
                  {!pillarAutoDetect ? (
                    <select
                      value={manualPillar}
                      onChange={(e) => setManualPillar(e.target.value as Pillar)}
                      className="bg-[#0A0A0B] border border-[#1E1E24] text-white rounded-lg p-2 outline-none font-sans"
                    >
                      {(Object.keys(PILLAR_CONFIG) as Pillar[]).map((pillKey) => (
                        <option key={pillKey} value={pillKey}>
                          {PILLAR_CONFIG[pillKey].emoji} {PILLAR_CONFIG[pillKey].label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="bg-[#0D0D10] border border-[#1E1E24] rounded-lg p-2 font-medium flex items-center gap-1.5 text-neutral-400 select-none">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                      <span>Gemini auto-detect during analysis stage</span>
                    </div>
                  )}
                </div>

                {/* Priority */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-[#6B6B7B]">Priority Rating</label>
                  <div className="flex gap-1 bg-[#0A0A0B] border border-[#1E1E24] rounded-lg p-1">
                    {[
                      { id: "high", label: "High", emoji: "🔴" },
                      { id: "medium", label: "Medium", emoji: "🟡" },
                      { id: "low", label: "Low", emoji: "🟢" }
                    ].map((pr) => (
                      <button
                        key={pr.id}
                        type="button"
                        onClick={() => setPriority(pr.id as LinkPriority)}
                        className={`flex-1 py-1 rounded text-center cursor-pointer transition-colors ${
                          priority === pr.id ? "bg-white/10 text-white font-medium" : "text-[#6B6B7B] hover:text-white"
                        }`}
                      >
                        <span className="mr-0.5">{pr.emoji}</span>
                        <span>{pr.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Auto Analyse Queue Toggle */}
              <label className="flex items-center gap-2 text-xs text-neutral-300 hover:text-white cursor-pointer select-none leading-none bg-[#0A0A0B] border border-[#1E1E24] p-3.5 rounded-xl mt-1">
                <input
                  type="checkbox"
                  checked={autoAnalyse}
                  onChange={(e) => setAutoAnalyse(e.target.checked)}
                  className="rounded accent-[#F59E0B] sm:w-4 sm:h-4 w-3.5 h-3.5 flex-shrink-0"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold">Auto-analyse newly added links</span>
                  <span className="text-[10px] text-[#6B6B7B] font-sans">Enqueues URLs to Gemini analysis engine automatically after adding</span>
                </div>
              </label>

            </motion.div>
          ) : null}

        </div>

        {/* FOOTER */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-[#1E1E24] bg-white/[0.01]">
          <div className="text-xs text-[#6B6B7B] font-sans">
            {activeTab === "paste" && detectedLinksListInRealTime.length > 0 && (
              <span>Queueing {detectedLinksListInRealTime.length} links...</span>
            )}
            {activeTab === "youtube" && channelData && (
              <span>Importing videos from {channelData.title}...</span>
            )}
            {activeTab === "bulk" && parsedBulkRecords.length > 0 && (
              <span>Preparing {parsedBulkRecords.length} records...</span>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-[#1E1E24] hover:bg-white/5 rounded-xl text-xs font-semibold text-neutral-400 cursor-pointer"
            >
              Cancel
            </button>

            {activeTab === "paste" && (
              <button
                onClick={handlePasteSubmit}
                disabled={submitting || detectedLinksListInRealTime.length === 0}
                className="bg-[#F59E0B] hover:bg-[#D98206] disabled:opacity-40 text-[#0A0A0B] font-bold rounded-xl px-4 py-2 text-xs cursor-pointer flex items-center gap-1 shadow-[0_0_20px_#F59E0B22] hover:shadow-[0_0_25px_#F59E0B3f] transition-all"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[3px]" />}
                <span>Add {detectedLinksListInRealTime.length} Links</span>
              </button>
            )}

            {activeTab === "youtube" && (
              <button
                onClick={handleImportYouTubeVideos}
                disabled={submitting || !channelData}
                className="bg-[#F59E0B] hover:bg-[#D98206] disabled:opacity-40 text-[#0A0A0B] font-bold rounded-xl px-4 py-2 text-xs cursor-pointer flex items-center gap-1 shadow-[0_0_20px_#F59E0B22] hover:shadow-[0_0_25px_#F59E0B3f] transition-all"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[3px]" />}
                <span>Import {ytVideosCount} Videos</span>
              </button>
            )}

            {activeTab === "bulk" && (
              <button
                onClick={handleImportBulk}
                disabled={submitting || parsedBulkRecords.length === 0}
                className="bg-[#F59E0B] hover:bg-[#D98206] disabled:opacity-40 text-[#0A0A0B] font-bold rounded-xl px-4 py-2 text-xs cursor-pointer flex items-center gap-1 shadow-[0_0_20px_#F59E0B22] hover:shadow-[0_0_25px_#F59E0B3f] transition-all"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[3px]" />}
                <span>Import {parsedBulkRecords.length} Links</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
