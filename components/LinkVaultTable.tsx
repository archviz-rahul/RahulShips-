import React, { Set, useMemo } from "react";
import { useVirtualScroll } from "@/hooks/useVirtualScroll";
import { VaultLink, LinkType, LinkPriority, AnalysisStatus } from "@/types/linkVault";
import { PILLAR_CONFIG } from "@/lib/pillarConfig";
import { 
  Star, 
  Compass,
  Archive, 
  Trash2, 
  Copy, 
  ExternalLink, 
  Play, 
  RotateCw, 
  Youtube, 
  Instagram, 
  MessageSquare, 
  Rss, 
  FileText,
  FileIcon,
  HelpCircle,
  Twitter,
  Linkedin,
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

interface LinkVaultTableProps {
  links: VaultLink[];
  selectedIds: Set<string>;
  activeLinkId: string | null;
  onSelectLink: (link: VaultLink) => void;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onToggleFavourite: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onTriggerAnalysis: (id: string) => void;
}

export default function LinkVaultTable({
  links,
  selectedIds,
  activeLinkId,
  onSelectLink,
  onToggleSelect,
  onToggleSelectAll,
  onToggleFavourite,
  onToggleArchive,
  onDelete,
  onTriggerAnalysis
}: LinkVaultTableProps) {
  
  const ROW_HEIGHT = 58; // consistent row height matching useVirtualScroll

  const { containerRef, startIndex, endIndex, offsetY, totalHeight } = useVirtualScroll({
    itemCount: links.length,
    itemHeight: ROW_HEIGHT,
    buffer: 10
  });

  const visibleLinks = useMemo(() => {
    return links.slice(startIndex, endIndex);
  }, [links, startIndex, endIndex]);

  const isAllSelected = links.length > 0 && selectedIds.size === links.length;

  const getPriorityBadge = (priority: LinkPriority) => {
    switch (priority) {
      case "high":
        return <span className="bg-red-500/10 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded border border-red-500/20 uppercase tracking-wider font-sans">High</span>;
      case "medium":
        return <span className="bg-amber-500/10 text-[#FAC505] text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-wider font-sans">Med</span>;
      case "low":
        return <span className="bg-green-500/10 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded border border-green-500/20 uppercase tracking-wider font-sans">Low</span>;
    }
  };

  const getStatusBadge = (status: AnalysisStatus) => {
    switch (status) {
      case "done":
        return (
          <span className="flex items-center gap-1 bg-green-500/10 text-green-500 text-[10px] font-medium px-2 py-0.5 rounded border border-green-500/20 font-sans">
            <CheckCircle className="w-2.5 h-2.5" />
            <span>Done</span>
          </span>
        );
      case "pending":
        return (
          <span className="flex items-center gap-1 bg-neutral-800 text-neutral-400 text-[10px] font-medium px-2 py-0.5 rounded border border-[#1E1E24] font-sans">
            <Clock className="w-2.5 h-2.5" />
            <span>Pending</span>
          </span>
        );
      case "queued":
        return (
          <span className="flex items-center gap-1 bg-amber-500/10 text-amber-500 text-[10px] font-medium px-2 py-0.5 rounded border border-amber-500/20 font-sans animate-pulse">
            <RotateCw className="w-2.5 h-2.5 animate-spin" style={{ animationDuration: "3s" }} />
            <span>Queued</span>
          </span>
        );
      case "analysing":
        return (
          <span className="flex items-center gap-1 bg-cyan-500/10 text-cyan-400 text-[10px] font-medium px-2 py-0.5 rounded border border-cyan-500/20 font-sans animate-pulse">
            <RotateCw className="w-2.5 h-2.5 animate-spin" />
            <span>Analysing</span>
          </span>
        );
      case "error":
        return (
          <span className="flex items-center gap-1 bg-red-400/15 text-red-400 text-[10px] font-medium px-2 py-0.5 rounded border border-red-500/25 font-sans">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span>Error</span>
          </span>
        );
      case "skipped":
        return (
          <span className="flex items-center gap-1 bg-neutral-900 text-neutral-500 text-[10px] font-medium px-2 py-0.5 rounded font-sans">
            <span>Skipped</span>
          </span>
        );
    }
  };

  const getTypeIcon = (type: LinkType) => {
    switch (type) {
      case "youtube-video":
      case "youtube-short":
      case "youtube-channel":
        return <Youtube className="w-4 h-4 text-red-500" />;
      case "instagram-reel":
      case "instagram-post":
        return <Instagram className="w-4 h-4 text-pink-500" />;
      case "reddit-thread":
      case "reddit-post":
        return <MessageSquare className="w-4 h-4 text-orange-500" />;
      case "substack":
      case "newsletter":
        return <Rss className="w-4 h-4 text-amber-500" />;
      case "twitter-post":
        return <Twitter className="w-4 h-4 text-neutral-200" />;
      case "linkedin-post":
        return <Linkedin className="w-4 h-4 text-blue-500" />;
      case "pdf":
        return <FileIcon className="w-4 h-4 text-red-600" />;
      default:
        return <HelpCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleCopyLink = (event: React.MouseEvent, url: string) => {
    event.stopPropagation();
    navigator.clipboard.writeText(url);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0D0D10] border border-[#1E1E24] rounded-2xl overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
      
      {/* STATIC HEADER BAR */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#111114] border-b border-[#1E1E24] text-xs font-semibold uppercase tracking-wider text-[#6B6B7B] z-10 select-none">
        <label className="flex items-center justify-center cursor-pointer w-5">
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={onToggleSelectAll}
            className="rounded accent-orange-500 sm:w-4 sm:h-4 w-3.5 h-3.5 bg-[#0D0D10] border-[#1E1E24]"
          />
        </label>
        
        <div className="flex-1 md:flex-[0.45] lg:flex-[0.5] truncate">Title / Resource Details</div>
        <div className="hidden md:block md:w-32 lg:w-40 text-left">Pillar</div>
        <div className="hidden lg:block lg:w-28 text-left">Type</div>
        <div className="hidden xl:block xl:w-28 text-left">Added Date</div>
        <div className="w-24 text-left">Status</div>
        <div className="hidden sm:block sm:w-16 text-center">Priority</div>
        <div className="w-28 text-right pr-2">Actions</div>
      </div>

      {/* VIRTUAL SCROLLBODY VIEWPORT */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto relative custom-scrollbar bg-[#0D0D10]"
      >
        {links.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 gap-3 bg-[#0D0D10]">
            <Compass className="w-10 h-10 text-neutral-600 animate-pulse" />
            <div>
              <h4 className="text-sm font-semibold text-neutral-300 font-display">No matches found</h4>
              <p className="text-xs text-neutral-500 max-w-[280px] mt-1">Try clearing filters or adding high-impact resource links to start caching metadata.</p>
            </div>
          </div>
        ) : (
          <div style={{ height: `${totalHeight}px` }} className="relative w-full">
            <div
              style={{ transform: `translateY(${offsetY}px)` }}
              className="absolute left-0 right-0 flex flex-col w-full divide-y divide-[#1E1E24]/45"
            >
              {visibleLinks.map((link) => {
                const isSelected = selectedIds.has(link.id);
                const isActive = activeLinkId === link.id;
                const pConfig = link.pillar ? PILLAR_CONFIG[link.pillar] : null;

                const formattedDate = new Date(link.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "2-digit"
                });

                return (
                  <div
                    key={link.id}
                    onClick={() => onSelectLink(link)}
                    style={{ height: `${ROW_HEIGHT}px` }}
                    className={`group w-full flex items-center gap-3 px-4 hover:bg-white/[0.02] cursor-pointer transition-colors ${
                      isActive ? "bg-white/[0.03] border-l-2 border-l-[#F59E0B]" : ""
                    }`}
                  >
                    
                    {/* Select box */}
                    <label
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-center cursor-pointer w-5"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(link.id)}
                        className="rounded accent-[#F59E0B] sm:w-4 sm:h-4 w-3.5 h-3.5 bg-slate-500 border border-[#1E1E24]"
                      />
                    </label>

                    {/* Meta info column */}
                    <div className="flex-1 md:flex-[0.45] lg:flex-[0.5] flex items-center gap-2.5 truncate">
                      <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-900 border border-[#1E1E24] flex items-center justify-center relative">
                        {link.thumbnailUrl ? (
                          // Render remote or fallback picsum
                          <img
                            src={link.thumbnailUrl}
                            alt=""
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          // Type Icon fallback
                          getTypeIcon(link.linkType)
                        )}
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="text-xs font-semibold text-neutral-200 truncate font-sans group-hover:text-white group-hover:underline decoration-[#FAC505]/40 decoration-2 underline-offset-2">
                          {link.title || "Untitled Draft"}
                        </span>
                        <span className="text-[10px] text-neutral-500 font-mono flex items-center gap-1 mt-0.5 truncate">
                          {getTypeIcon(link.linkType)}
                          <span className="truncate">{link.domain}</span>
                        </span>
                      </div>
                    </div>

                    {/* Pillar Column */}
                    <div className="hidden md:block md:w-32 lg:w-40 font-semibold font-sans text-xs truncate">
                      {pConfig ? (
                        <span className="flex items-center gap-1.5" style={{ color: pConfig.color }}>
                          <span>{pConfig.emoji}</span>
                          <span className="truncate">{pConfig.shortLabel}</span>
                        </span>
                      ) : (
                        <span className="text-neutral-500">⚪ Unassigned</span>
                      )}
                    </div>

                    {/* Link Type Name */}
                    <div className="hidden lg:block lg:w-28 text-xs text-neutral-400 font-sans capitalize">
                      {link.linkType?.replace("-", " ") || "Draft"}
                    </div>

                    {/* Date Column */}
                    <div className="hidden xl:block xl:w-28 text-xs font-mono text-neutral-500">
                      {formattedDate}
                    </div>

                    {/* Analysis badge */}
                    <div className="w-24 text-left">
                      {getStatusBadge(link.analysisStatus)}
                    </div>

                    {/* Priority Badge */}
                    <div className="hidden sm:block sm:w-16 text-center select-none">
                      {getPriorityBadge(link.priority)}
                    </div>

                    {/* Actions cell */}
                    <div className="w-28 flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      
                      {/* Interactive hover action quick toolbar */}
                      <button
                        onClick={() => onToggleFavourite(link.id)}
                        className={`p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer ${
                          link.isFavourited ? "text-yellow-500" : "text-[#6B6B7B] md:opacity-0 group-hover:opacity-100"
                        }`}
                        title="Favorite"
                      >
                        <Star className={`w-3.5 h-3.5 ${link.isFavourited ? "fill-yellow-500" : ""}`} />
                      </button>

                      {/* Trigger run analysis */}
                      {(link.analysisStatus === "pending" || link.analysisStatus === "error") && (
                        <button
                          onClick={() => onTriggerAnalysis(link.id)}
                          className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-colors cursor-pointer md:opacity-0 group-hover:opacity-100"
                          title="Analyse link"
                        >
                          <Play className="w-3.5 h-3.5 fill-emerald-500" />
                        </button>
                      )}

                      {/* External redirect */}
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer md:opacity-0 group-hover:opacity-100"
                        title="Visit Link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      {/* Copy link */}
                      <button
                        onClick={(e) => handleCopyLink(e, link.url)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer md:opacity-0 group-hover:opacity-100"
                        title="Copy URL"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Archive toggle */}
                      <button
                        onClick={() => onToggleArchive(link.id)}
                        className={`p-1.5 rounded-lg hover:bg-purple-500/15 transition-colors cursor-pointer ${
                          link.isArchived ? "text-purple-400" : "text-[#6B6B7B] md:opacity-0 group-hover:opacity-100"
                        }`}
                        title={link.isArchived ? "Unarchive" : "Archive"}
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => onDelete(link.id)}
                        className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer md:opacity-0 group-hover:opacity-100"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
