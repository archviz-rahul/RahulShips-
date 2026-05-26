import React, { useMemo, useState } from "react";
import { LinkType, LinkPriority, AnalysisStatus, VaultLink } from "@/types/linkVault";
import { Pillar, PILLAR_CONFIG } from "@/lib/pillarConfig";
import { 
  Compass, 
  Youtube, 
  Instagram, 
  MessageSquare, 
  FileText, 
  Rss, 
  Globe, 
  Star, 
  Archive, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  ArrowUpRight, 
  FilterX,
  FileIcon,
  HelpCircle,
  Twitter,
  Linkedin
} from "lucide-react";

interface LinkVaultFiltersProps {
  links: VaultLink[];
  totalCount: number;
  filteredCount: number;

  // Selected filters from useLinkVault hook
  filterPillar: Pillar | "All" | "Unassigned";
  setFilterPillar: (val: any) => void;
  filterType: LinkType | "All";
  setFilterType: (val: any) => void;
  filterStatus: AnalysisStatus | "All";
  setFilterStatus: (val: any) => void;
  filterPriority: LinkPriority | "All";
  setFilterPriority: (val: any) => void;
  filterAddedFrom: string;
  setFilterAddedFrom: (val: string) => void;
  filterFavourited: boolean | "All";
  setFilterFavourited: (val: any) => void;
  filterArchived: boolean;
  setFilterArchived: (val: boolean) => void;

  // Clear handler
  onClearFilters: () => void;
}

export default function LinkVaultFilters({
  links,
  totalCount,
  filteredCount,
  filterPillar,
  setFilterPillar,
  filterType,
  setFilterType,
  filterStatus,
  setFilterStatus,
  filterPriority,
  setFilterPriority,
  filterAddedFrom,
  setFilterAddedFrom,
  filterFavourited,
  setFilterFavourited,
  filterArchived,
  setFilterArchived,
  onClearFilters
}: LinkVaultFiltersProps) {
  
  const [domainSearch, setDomainSearch] = useState("");

  // Segment dynamic counts per key from master links
  const counts = useMemo(() => {
    const pCounts: Record<string, number> = { All: 0, Unassigned: 0 };
    const tCounts: Record<string, number> = { All: 0 };
    const sCounts: Record<string, number> = { All: 0 };
    const prCounts: Record<string, number> = { All: 0 };
    const domainCounts: Record<string, number> = {};

    links.forEach((link) => {
      // Archive filter isolation respects active count displays
      if (link.isArchived !== filterArchived) return;

      // Pillar counts
      if (link.pillar) {
        pCounts[link.pillar] = (pCounts[link.pillar] || 0) + 1;
      } else {
        pCounts.Unassigned = (pCounts.Unassigned || 0) + 1;
      }
      pCounts.All = (pCounts.All || 0) + 1;

      // Type counts
      tCounts[link.linkType] = (tCounts[link.linkType] || 0) + 1;
      tCounts.All = (tCounts.All || 0) + 1;

      // Status counts
      sCounts[link.analysisStatus] = (sCounts[link.analysisStatus] || 0) + 1;
      sCounts.All = (sCounts.All || 0) + 1;

      // Priority counts
      prCounts[link.priority] = (prCounts[link.priority] || 0) + 1;
      prCounts.All = (prCounts.All || 0) + 1;

      // Domain tracking
      if (link.domain) {
        domainCounts[link.domain] = (domainCounts[link.domain] || 0) + 1;
      }
    });

    return { pCounts, tCounts, sCounts, prCounts, domainCounts };
  }, [links, filterArchived]);

  // Sort domains by quantity
  const topDomains = useMemo(() => {
    return Object.entries(counts.domainCounts)
      .map(([domain, count]) => ({ domain, count }))
      .filter(({ domain }) => domain.toLowerCase().includes(domainSearch.toLowerCase()))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [counts.domainCounts, domainSearch]);

  const getDomainColor = (domainName: string) => {
    const d = domainName.toLowerCase();
    if (d.includes("youtube.com") || d.includes("youtu.be")) return "#FF0000";
    if (d.includes("instagram.com")) return "#E1306C";
    if (d.includes("reddit.com")) return "#FF4500";
    if (d.includes("twitter.com") || d.includes("x.com")) return "#6B6B7B"; // Muted neutral
    if (d.includes("linkedin.com")) return "#0A66C2";
    if (d.includes("substack.com") || d.includes("beehiiv.com")) return "#F59E0B";
    return "#06B6D4"; // Default cosmic cyan
  };

  const linkTypesDef: { id: LinkType; label: string; icon: any; color: string }[] = [
    { id: "youtube-video", label: "YouTube Video", icon: Youtube, color: "text-red-500" },
    { id: "youtube-short", label: "YouTube Short", icon: Youtube, color: "text-red-500" },
    { id: "youtube-channel", label: "YouTube Channel", icon: Youtube, color: "text-red-500" },
    { id: "instagram-reel", label: "Instagram Reel", icon: Instagram, color: "text-pink-500" },
    { id: "instagram-post", label: "Instagram Post", icon: Instagram, color: "text-pink-500" },
    { id: "reddit-thread", label: "Reddit Thread", icon: MessageSquare, color: "text-orange-500" },
    { id: "reddit-post", label: "Reddit Post", icon: MessageSquare, color: "text-orange-500" },
    { id: "substack", label: "Substack Feed", icon: Rss, color: "text-amber-500" },
    { id: "newsletter", label: "Newsletter Link", icon: Rss, color: "text-amber-500" },
    { id: "twitter-post", label: "Twitter Post", icon: Twitter, color: "text-neutral-300" },
    { id: "linkedin-post", label: "LinkedIn Post", icon: Linkedin, color: "text-blue-500" },
    { id: "pdf", label: "PDF Document", icon: FileIcon, color: "text-red-600" },
    { id: "unknown", label: "Unknown Resource", icon: HelpCircle, color: "text-gray-500" }
  ];

  const analysisStatusesDef: { id: AnalysisStatus; label: string; dotColor: string }[] = [
    { id: "done", label: "Done ✅", dotColor: "bg-green-500" },
    { id: "pending", label: "Pending ⏳", dotColor: "bg-gray-500" },
    { id: "queued", label: "Queued 🔄", dotColor: "bg-amber-500 animate-pulse" },
    { id: "analysing", label: "Analysing ⚡", dotColor: "bg-cyan-500 animate-pulse" },
    { id: "error", label: "Error ❌", dotColor: "bg-red-500" },
    { id: "skipped", label: "Skipped —", dotColor: "bg-neutral-600" }
  ];

  return (
    <div className="w-full flex flex-col gap-6 text-sm overflow-y-auto max-h-[calc(100vh-220px)] pr-2 custom-scrollbar">
      
      {/* ── PILLAR FILTER ── */}
      <div>
        <h4 className="text-xs font-semibold tracking-wider text-[#6B6B7B] uppercase mb-3">Pillars</h4>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => setFilterPillar("All")}
            className={`w-full text-left px-3 py-1.5 rounded-lg flex justify-between items-center transition-colors cursor-pointer ${
              filterPillar === "All" ? "bg-white/5 text-white font-medium" : "text-[#6B6B7B] hover:text-white"
            }`}
          >
            <span>● All Pillars</span>
            <span className="text-xs font-mono text-neutral-400">{counts.pCounts.All || 0}</span>
          </button>
          
          {(Object.keys(PILLAR_CONFIG) as Pillar[]).map((pillKey) => {
            const config = PILLAR_CONFIG[pillKey];
            return (
              <button
                key={pillKey}
                onClick={() => setFilterPillar(pillKey)}
                style={{
                  borderLeft: filterPillar === pillKey ? `3px solid ${config.color}` : "none"
                }}
                className={`w-full text-left px-3 py-1.5 rounded-lg flex justify-between items-center transition-colors cursor-pointer ${
                  filterPillar === pillKey 
                    ? "bg-white/5 text-white font-medium pl-2.5" 
                    : "text-[#6B6B7B] hover:text-white"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>{config.emoji}</span>
                  <span>{config.shortLabel}</span>
                </span>
                <span className="text-xs font-mono text-neutral-400">{counts.pCounts[pillKey] || 0}</span>
              </button>
            );
          })}

          <button
            onClick={() => setFilterPillar("Unassigned")}
            className={`w-full text-left px-3 py-1.5 rounded-lg flex justify-between items-center transition-colors cursor-pointer ${
              filterPillar === "Unassigned" ? "bg-white/5 text-white font-medium" : "text-[#6B6B7B] hover:text-white"
            }`}
          >
            <span>⚪ Unassigned</span>
            <span className="text-xs font-mono text-neutral-400">{counts.pCounts.Unassigned || 0}</span>
          </button>
        </div>
      </div>

      <div className="border-t border-[#1E1E24] my-1" />

      {/* ── LINK TYPE FILTER ── */}
      <div>
        <h4 className="text-xs font-semibold tracking-wider text-[#6B6B7B] uppercase mb-3">Link Type</h4>
        <div className="grid grid-cols-1 gap-0.5">
          <button
            onClick={() => setFilterType("All")}
            className={`w-full text-left px-3 py-1.5 rounded-lg flex justify-between items-center transition-colors cursor-pointer ${
              filterType === "All" ? "bg-white/5 text-white font-medium" : "text-[#6B6B7B] hover:text-white"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Compass className="w-4 h-4" />
              <span>All Types</span>
            </span>
            <span className="text-xs font-mono text-neutral-400">{counts.tCounts.All || 0}</span>
          </button>

          {linkTypesDef.map((typeDef) => {
            const count = counts.tCounts[typeDef.id] || 0;
            // Only render if count > 0 to save space, or if active
            if (count === 0 && filterType !== typeDef.id) return null;
            
            const IconComp = typeDef.icon;
            return (
              <button
                key={typeDef.id}
                onClick={() => setFilterType(typeDef.id)}
                className={`w-full text-left px-3 py-1.5 rounded-lg flex justify-between items-center transition-colors cursor-pointer ${
                  filterType === typeDef.id ? "bg-white/5 text-white font-medium" : "text-[#6B6B7B] hover:text-white"
                }`}
              >
                <span className="flex items-center gap-1.5 truncate">
                  <IconComp className={`w-4 h-4 flex-shrink-0 ${typeDef.color}`} />
                  <span className="truncate">{typeDef.label}</span>
                </span>
                <span className="text-xs font-mono text-neutral-400">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-[#1E1E24] my-1" />

      {/* ── ANALYSIS STATUS ── */}
      <div>
        <h4 className="text-xs font-semibold tracking-wider text-[#6B6B7B] uppercase mb-3">Analysis Status</h4>
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => setFilterStatus("All")}
            className={`w-full text-left px-3 py-1.5 rounded-lg flex justify-between items-center transition-colors cursor-pointer ${
              filterStatus === "All" ? "bg-white/5 text-white font-medium" : "text-[#6B6B7B] hover:text-white"
            }`}
          >
            <span>All Statuses</span>
            <span className="text-xs font-mono text-neutral-400">{counts.sCounts.All || 0}</span>
          </button>

          {analysisStatusesDef.map((sDef) => {
            const count = counts.sCounts[sDef.id] || 0;
            if (count === 0 && filterStatus !== sDef.id) return null;

            return (
              <button
                key={sDef.id}
                onClick={() => setFilterStatus(sDef.id)}
                className={`w-full text-left px-3 py-1.5 rounded-lg flex justify-between items-center transition-colors cursor-pointer ${
                  filterStatus === sDef.id ? "bg-white/5 text-white font-medium" : "text-[#6B6B7B] hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${sDef.dotColor}`} />
                  <span>{sDef.label}</span>
                </div>
                <span className="text-xs font-mono text-neutral-400">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-[#1E1E24] my-1" />

      {/* ── PRIORITY ── */}
      <div>
        <h4 className="text-xs font-semibold tracking-wider text-[#6B6B7B] uppercase mb-3">Priority</h4>
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => setFilterPriority("All")}
            className={`w-full text-left px-3 py-1.5 rounded-lg flex justify-between items-center transition-colors cursor-pointer ${
              filterPriority === "All" ? "bg-white/5 text-white font-medium" : "text-[#6B6B7B] hover:text-white"
            }`}
          >
            <span>All Priorities</span>
            <span className="text-xs font-mono text-neutral-400">{counts.prCounts.All || 0}</span>
          </button>
          {[
            { id: "high", icon: "🔴", label: "High" },
            { id: "medium", icon: "🟡", label: "Medium" },
            { id: "low", icon: "🟢", label: "Low" }
          ].map((pr) => {
            const count = counts.prCounts[pr.id] || 0;
            return (
              <button
                key={pr.id}
                onClick={() => setFilterPriority(pr.id as any)}
                className={`w-full text-left px-3 py-1.5 rounded-lg flex justify-between items-center transition-colors cursor-pointer ${
                  filterPriority === pr.id ? "bg-white/5 text-white font-medium" : "text-[#6B6B7B] hover:text-white"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span>{pr.icon}</span>
                  <span>{pr.label}</span>
                </span>
                <span className="text-xs font-mono text-neutral-400">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-[#1E1E24] my-1" />

      {/* ── ADDED FROM ── */}
      <div>
        <h4 className="text-xs font-semibold tracking-wider text-[#6B6B7B] uppercase mb-3">Added From</h4>
        <select
          value={filterAddedFrom}
          onChange={(e) => setFilterAddedFrom(e.target.value)}
          className="w-full bg-[#111114] border border-[#1E1E24] text-[#F59E0B] rounded-lg px-2 py-1.5 outline-none font-sans cursor-pointer focus:border-[#F59E0B]/50"
        >
          <option value="All">All Sources</option>
          <option value="paste">📋 Pasted manually</option>
          <option value="youtube-channel">▶️ YouTube channel import</option>
          <option value="bulk-import">📁 Bulk CSV import</option>
          <option value="competitor">👥 Competitors Hub</option>
          <option value="rss-feed">🔌 RSS Feeds</option>
          <option value="manual">🧱 Manual individual adding</option>
        </select>
      </div>

      <div className="border-t border-[#1E1E24] my-1" />

      {/* ── DOMAIN SEARCH ── */}
      <div>
        <h4 className="text-xs font-semibold tracking-wider text-[#6B6B7B] uppercase mb-2">Domains</h4>
        <input
          type="text"
          placeholder="Filter by domain..."
          value={domainSearch}
          onChange={(e) => setDomainSearch(e.target.value)}
          className="w-full bg-[#0A0A0B] border border-[#1E1E24] text-xs text-white rounded-lg px-2.5 py-1.5 outline-none font-sans mb-2 focus:border-white/20"
        />
        <div className="flex flex-col gap-3">
          {(() => {
            const maxVal = Math.max(...topDomains.map(d => d.count), 1);
            return topDomains.map(({ domain, count }) => {
              const percentage = (count / maxVal) * 100;
              const barColor = getDomainColor(domain);
              return (
                <div key={domain} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-xs text-[#F5F5F7] group">
                    <span className="truncate flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#6B6B7B] group-hover:text-white transition-colors" />
                      <span className="truncate text-[#F5F5F7] hover:text-white transition-colors capitalize">{domain}</span>
                    </span>
                    <span className="font-mono text-xs text-[#6B6B7B] bg-white/5 px-2 py-0.5 rounded-md">{count}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#1E1E24] rounded-full overflow-hidden">
                    <div
                      style={{ width: `${percentage}%`, backgroundColor: barColor }}
                      className="h-full rounded-full transition-all duration-500 ease-out"
                    />
                  </div>
                </div>
              );
            });
          })()}
          {topDomains.length === 0 && (
            <div className="text-xs text-neutral-600 text-center py-2">No active domains found</div>
          )}
        </div>
      </div>

      <div className="border-t border-[#1E1E24] my-1" />

      {/* ── SPECIAL FILTERS ── */}
      <div>
        <h4 className="text-xs font-semibold tracking-wider text-[#6B6B7B] uppercase mb-2">Special Filters</h4>
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 text-xs text-[#6B6B7B] hover:text-white cursor-pointer px-1 py-0.5">
            <input
              type="checkbox"
              checked={filterFavourited === true}
              onChange={(e) => setFilterFavourited(e.target.checked ? true : "All")}
              className="rounded accent-[#F59E0B] sm:w-4 sm:h-4 w-3.5 h-3.5 text-xs bg-slate-400"
            />
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
              <span>Favourited Only</span>
            </span>
          </label>

          <label className="flex items-center gap-2 text-xs text-[#6B6B7B] hover:text-white cursor-pointer px-1 py-0.5">
            <input
              type="checkbox"
              checked={filterArchived}
              onChange={(e) => setFilterArchived(e.target.checked)}
              className="rounded accent-purple-500 sm:w-4 sm:h-4 w-3.5 h-3.5 text-xs bg-slate-400"
            />
            <span className="flex items-center gap-1">
              <Archive className="w-3.5 h-3.5 text-purple-400" />
              <span>Show Archived</span>
            </span>
          </label>
        </div>
      </div>

      <div className="border-t border-[#1E1E24] mt-2 pt-4" />

      {/* FOOTER */}
      <div className="flex flex-col gap-2 mt-auto">
        <div className="text-xs text-[#6B6B7B] font-mono">
          Showing <span className="text-white font-medium">{filteredCount}</span> of <span className="text-white">{totalCount}</span> links
        </div>
        <button
          onClick={onClearFilters}
          className="w-full flex items-center justify-center gap-2 py-2 border border-[#1E1E24] hover:bg-neutral-800 text-[#FAC505] rounded-xl text-xs font-medium cursor-pointer transition-all"
        >
          <FilterX className="w-4 h-4" />
          <span>Clear All Filters</span>
        </button>
      </div>

    </div>
  );
}
