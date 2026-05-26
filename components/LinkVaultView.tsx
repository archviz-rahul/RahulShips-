"use client";

import React, { useState, useMemo } from "react";
import { useLinkVault } from "@/hooks/useLinkVault";
import { Pillar, PILLAR_CONFIG } from "@/lib/pillarConfig";
import { LinkPriority, VaultLink } from "@/types/linkVault";
import LinkVaultFilters from "./LinkVaultFilters";
import LinkVaultTable from "./LinkVaultTable";
import LinkAnalysisDrawer from "./LinkAnalysisDrawer";
import AddLinksModal from "./AddLinksModal";

import { 
  Plus, 
  Play, 
  Trash2, 
  Archive, 
  Star,
  Grid, 
  List, 
  Search, 
  Sparkles, 
  PlayCircle,
  Pause,
  RotateCw,
  X,
  Database,
  Grid3X3,
  ExternalLink,
  Download,
  Filter,
  Check
} from "lucide-react";

export default function LinkVaultView() {
  const {
    links,
    filteredAndSortedLinks,
    loading,
    error,
    refreshLinks,

    // Filters / Sorters
    search,
    setSearch,
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
    sortBy,
    setSortBy,

    // Operations
    addPasteLinks,
    importYouTubeChannel,
    addBulkImportLinks,
    updateLink,
    deleteLink,
    toggleFavourite,
    toggleArchive,

    // Bulk Ops
    bulkDelete,
    bulkArchive,
    bulkSetPillar,
    bulkSetPriority,

    // Queue API
    queueState,
    triggerAnalysis,
    triggerAnalysisAllPending,
    pauseQueue,
    resumeQueue,
    cancelQueue
  } = useLinkVault();

  // Primary layouts & selections states
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeLink, setActiveLink] = useState<VaultLink | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Auto Reset bulk selections upon filter modifications
  const handleToggleSelect = (id: string) => {
    const updated = new Set(selectedIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedIds(updated);
  };

  const handleToggleSelectAll = () => {
    const isAllSelected = filteredAndSortedLinks.length > 0 && selectedIds.size === filteredAndSortedLinks.length;
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSortedLinks.map((l) => l.id)));
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setFilterPillar("All");
    setFilterType("All");
    setFilterStatus("All");
    setFilterPriority("All");
    setFilterAddedFrom("All");
    setFilterFavourited("All");
    setFilterArchived(false);
  };

  // Bulk execution routing
  const handleBulkAction = async (action: string, value?: any) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    if (action === "delete") {
      if (confirm(`Are you sure you want to delete ${ids.length} links from your vault?`)) {
        await bulkDelete(ids);
        setSelectedIds(new Set());
      }
    } else if (action === "archive") {
      await bulkArchive(ids, true);
      setSelectedIds(new Set());
    } else if (action === "unarchive") {
      await bulkArchive(ids, false);
      setSelectedIds(new Set());
    } else if (action === "set-pillar") {
      await bulkSetPillar(ids, value);
      setSelectedIds(new Set());
    } else if (action === "set-priority") {
      await bulkSetPriority(ids, value);
      setSelectedIds(new Set());
    }
    setShowBulkActions(false);
  };

  // CSV metadata export
  const handleExportCSV = () => {
    if (links.length === 0) return;
    const headers = ["ID", "URL", "Title", "Pillar", "Link Type", "Priority", "Status", "Date Added"];
    const rows = links.map((l) => [
      l.id,
      l.url,
      `"${(l.title || "").replace(/"/g, '""')}"`,
      l.pillar || "unassigned",
      l.linkType,
      l.priority,
      l.analysisStatus,
      l.createdAt
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", encodedUri);
    linkElement.setAttribute("download", `rahulships_link_vault_${Date.now()}.csv`);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
  };

  // Performance calculations
  const stats = useMemo(() => {
    const total = links.length;
    const done = links.filter((l) => l.analysisStatus === "done").length;
    const pending = links.filter((l) => l.analysisStatus === "pending" || l.analysisStatus === "error").length;
    
    // Auto-analysis progress ratio
    const ratio = total > 0 ? Math.round((done / total) * 100) : 0;
    
    return { total, done, pending, ratio };
  }, [links]);

  return (
    <div className="flex-1 flex gap-5 p-6 overflow-hidden max-h-[calc(100vh-140px)] bg-[#0A0A0B] relative select-none">
      
      {/* LEFT FILTER CONTROL PANEL */}
      <div className="hidden md:flex flex-col gap-4 w-60 flex-shrink-0 border-r border-[#1E1E24] pr-4 select-none">
        <div className="flex items-center gap-2 font-display text-xs text-neutral-400 font-bold tracking-wider uppercase mb-1">
          <Filter className="w-4 h-4 text-[#F59E0B]" />
          <span>Filters & Vault Segments</span>
        </div>
        
        <LinkVaultFilters
          links={links}
          totalCount={stats.total}
          filteredCount={filteredAndSortedLinks.length}
          filterPillar={filterPillar}
          setFilterPillar={setFilterPillar}
          filterType={filterType}
          setFilterType={setFilterType}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterPriority={filterPriority}
          setFilterPriority={setFilterPriority}
          filterAddedFrom={filterAddedFrom}
          setFilterAddedFrom={setFilterAddedFrom}
          filterFavourited={filterFavourited}
          setFilterFavourited={setFilterFavourited}
          filterArchived={filterArchived}
          setFilterArchived={setFilterArchived}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* CENTRAL AREA WORKSPACE */}
      <div className="flex-1 flex flex-col gap-5 overflow-hidden">
        
        {/* TOP ROW CORE METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-shrink-0 select-none">
          <div className="bg-[#0D0D10] border border-[#1E1E24] rounded-2xl p-4 flex justify-between items-center relative overflow-hidden">
            <div>
              <div className="text-xs text-[#6B6B7B] font-semibold uppercase tracking-wider font-sans">Ingested Resources</div>
              <div className="text-2xl font-bold font-display text-white mt-1">{stats.total} <span className="text-xs font-normal text-neutral-400">items</span></div>
            </div>
            <div className="bg-[#F59E0B]/5 p-2.5 rounded-xl border border-[#F59E0B]/10 text-[#FAC505]">
              <Database className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-[#0D0D10] border border-[#1E1E24] rounded-2xl p-4 col-span-2 flex flex-col justify-center gap-2">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs text-[#6B6B7B] font-semibold uppercase tracking-wider font-sans">Content AI Analysis Engine</span>
                <span className="ml-2 text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded font-mono font-bold tracking-wide">AUTO ROTATE PILLARS</span>
              </div>
              <span className="text-xs font-mono font-bold text-[#FAC505]">{stats.done}/{stats.total} Analysed ({stats.ratio}%)</span>
            </div>
            
            {/* Custom progress indicators bar */}
            <div className="w-full bg-[#111114] border border-[#1E1E24] rounded-full h-2.5 overflow-hidden">
              <div
                style={{ width: `${stats.ratio}%` }}
                className="bg-gradient-to-r from-[#F59E0B] to-emerald-500 h-full rounded-full transition-all duration-500"
              />
            </div>
          </div>
        </div>

        {/* INTERACTIVE TOOLBAR MODULES */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0D0D10] border border-[#1E1E24]/65 p-3 rounded-2xl flex-shrink-0">
          
          <div className="flex items-center gap-2 select-none">
            <button
              onClick={() => setAddModalOpen(true)}
              className="bg-[#F59E0B] hover:bg-[#D98206] text-[#0A0A0B] font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-[0_0_15px_#F59E0B22] cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3.5px]" />
              <span>Add Resource</span>
            </button>

            {stats.pending > 0 && (
              <button
                onClick={triggerAnalysisAllPending}
                disabled={queueState.pending.length > 0}
                className="bg-[#1E1E24] hover:bg-[#2A2A33] border border-[#1E1E24] text-white font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <PlayCircle className="w-4 h-4 text-[#F59E0B]" />
                <span>Analyse All Pending ({stats.pending})</span>
              </button>
            )}

            {/* Micro Multi-select Action Module Popup trigger */}
            {selectedIds.size > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="bg-purple-900/15 border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 font-bold text-[11px] px-3.5 py-2 rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>Bulk Actions ({selectedIds.size})</span>
                </button>

                {showBulkActions && (
                  <div className="absolute left-0 mt-2 w-48 bg-[#111114] border border-[#1E1E24] rounded-xl overflow-hidden shadow-2xl z-50 py-1 flex flex-col font-sans text-xs">
                    <button
                      onClick={() => handleBulkAction("archive")}
                      className="w-full text-left px-4 py-2 hover:bg-white/5 text-neutral-300 flex items-center gap-2"
                    >
                      <Archive className="w-4 h-4 text-purple-400" />
                      <span>Archive Selected</span>
                    </button>
                    <button
                      onClick={() => handleBulkAction("unarchive")}
                      className="w-full text-left px-4 py-2 hover:bg-white/5 text-neutral-300 flex items-center gap-2"
                    >
                      <Archive className="w-4 h-4 text-neutral-500" />
                      <span>Unarchive Selected</span>
                    </button>
                    <button
                      onClick={() => handleBulkAction("delete")}
                      className="w-full text-left px-4 py-2 hover:bg-red-500/10 text-red-400 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Selected</span>
                    </button>

                    <div className="border-t border-[#1E1E24] my-1" />
                    <div className="px-4 py-1.5 text-[10px] text-neutral-500 uppercase font-bold select-none tracking-wider">Assign Pillar</div>
                    {Object.entries(PILLAR_CONFIG).map(([key, item]) => (
                      <button
                        key={key}
                        onClick={() => handleBulkAction("set-pillar", key)}
                        className="w-full text-left px-4 py-1.5 hover:bg-white/5 text-neutral-300 flex items-center gap-2 font-medium"
                        style={{ color: item.color }}
                      >
                        <span>{item.emoji}</span>
                        <span>{item.shortLabel}</span>
                      </button>
                    ))}

                    <div className="border-t border-[#1E1E24] my-1" />
                    <div className="px-4 py-1.5 text-[10px] text-neutral-500 uppercase font-bold select-none tracking-wider">Set Priority</div>
                    <button
                      onClick={() => handleBulkAction("set-priority", "high")}
                      className="w-full text-left px-4 py-1.5 hover:bg-white/5 text-red-500 flex items-center gap-2 font-medium"
                    >
                      <span>🔴 High</span>
                    </button>
                    <button
                      onClick={() => handleBulkAction("set-priority", "medium")}
                      className="w-full text-left px-4 py-1.5 hover:bg-white/5 text-amber-500 flex items-center gap-2 font-medium"
                    >
                      <span>🟡 Medium</span>
                    </button>
                    <button
                      onClick={() => handleBulkAction("set-priority", "low")}
                      className="w-full text-left px-4 py-1.5 hover:bg-white/5 text-green-500 flex items-center gap-2 font-medium"
                    >
                      <span>🟢 Low</span>
                    </button>

                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            
            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <span className="absolute left-3 top-2.5 text-neutral-500"><Search className="w-4 h-4" /></span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search resources keywords..."
                className="w-full bg-[#0A0A0B] border border-[#1E1E24] text-xs text-white rounded-xl pl-9 pr-3 py-2 outline-none focus:border-white/20"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-2 text-neutral-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Layout switch buttons */}
            <div className="flex bg-[#0A0A0B] border border-[#1E1E24] rounded-xl p-1 shrink-0 select-none">
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "table" ? "bg-white/10 text-white" : "text-neutral-500 hover:text-white"
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === "grid" ? "bg-white/10 text-white" : "text-neutral-500 hover:text-white"
                }`}
                title="Grid / Cards Gallery"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>

            {/* Export data button */}
            <button
              onClick={handleExportCSV}
              disabled={links.length === 0}
              className="p-2 border border-[#1E1E24] bg-[#0A0A0B] hover:bg-white/5 text-[#FAC505] rounded-xl cursor-pointer disabled:opacity-50"
              title="Export Full CSV"
            >
              <Download className="w-4 h-4" />
            </button>

          </div>

        </div>

        {/* ACTIVE RUNNING QUEUE FLOATING BANNER */}
        {queueState.pending.length > 0 && (
          <div className="flex items-center justify-between bg-gradient-to-r from-[#170C0D] to-[#12130F] border border-[#EF4444]/25 p-3.5 rounded-2xl select-none relative overflow-hidden">
            <div className="absolute inset-0 bg-red-500/5 animate-pulse z-0" style={{ animationDuration: "2s" }} />
            <div className="z-10 flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-red-400 font-bold uppercase tracking-wider font-sans">Gemini Queue Processing Active</span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  Running batch {queueState.currentBatch}/{queueState.totalBatches} ({queueState.pending.length} links pending in sequence)
                </span>
              </div>
            </div>

            <div className="z-10 flex items-center gap-2">
              <button
                onClick={queueState.isPaused ? resumeQueue : pauseQueue}
                className="p-1.5 rounded-xl border border-white/10 text-neutral-300 bg-white/5 hover:bg-white/10 text-[11px] font-sans px-3 py-1 flex items-center gap-1 cursor-pointer"
              >
                {queueState.isPaused ? <Play className="w-3 h-3 text-green-400 fill-green-400" /> : <Pause className="w-3 h-3 text-neutral-300" />}
                <span>{queueState.isPaused ? "Resume" : "Pause Queue"}</span>
              </button>
              <button
                onClick={cancelQueue}
                className="p-1.5 rounded-xl border border-red-500/20 text-red-400 bg-red-950/20 hover:bg-neutral-800 text-[11px] font-sans px-3 py-1 flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Cancel Queue</span>
              </button>
            </div>
          </div>
        )}

        {/* RENDER VIEWWORKSPACES */}
        <div className="flex-1 flex min-h-0 select-none">
          {viewMode === "table" ? (
            <LinkVaultTable
              links={filteredAndSortedLinks}
              selectedIds={selectedIds}
              activeLinkId={activeLink?.id || null}
              onSelectLink={(l) => setActiveLink(link => link?.id === l.id ? null : l)}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
              onToggleFavourite={toggleFavourite}
              onToggleArchive={toggleArchive}
              onDelete={deleteLink}
              onTriggerAnalysis={triggerAnalysis}
            />
          ) : (
            // GRID CARD TILES VIEWPORT
            <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-6 custom-scrollbar pr-2 select-text">
              {filteredAndSortedLinks.map((link) => {
                const isSelected = selectedIds.has(link.id);
                const isActive = activeLink?.id === link.id;
                const pConfig = link.pillar ? PILLAR_CONFIG[link.pillar] : null;

                return (
                  <div
                    key={link.id}
                    onClick={() => setActiveLink(link => link?.id === link.id ? null : link)}
                    className={`bg-[#0D0D10] border rounded-2xl overflow-hidden p-4 flex flex-col gap-3 group relative cursor-pointer hover:border-[#F59E0B]/30 hover:bg-white/[0.01] transition-all ${
                      isActive ? "border-[#F59E0B]" : "border-[#1E1E24]"
                    }`}
                  >
                    
                    {/* Top row */}
                    <div className="flex justify-between items-start gap-4">
                      {/* Image Thumbnail */}
                      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-[#1E1E24] bg-[#111114] flex items-center justify-center relative">
                        {link.thumbnailUrl ? (
                          <img src={link.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Database className="w-6 h-6 text-neutral-700" />
                        )}
                      </div>

                      {/* Select indicator */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleToggleSelect(link.id);
                        }}
                        className="rounded accent-[#F59E0B] sm:w-4 sm:h-4 w-3.5 h-3.5 mt-0.5 border border-[#1E1E24]"
                      />
                    </div>

                    {/* Details block */}
                    <div className="flex flex-col gap-1 select-text">
                      <h4 className="text-xs font-bold text-neutral-200 line-clamp-2 leading-snug group-hover:text-white group-hover:underline decoration-[#FAC505]/40 decoration-2 underline-offset-2">
                        {link.title || "Untitled Draft URL"}
                      </h4>
                      <div className="text-[10px] text-neutral-500 font-mono truncate">{link.domain}</div>
                    </div>

                    {/* Tags pillar metadata layout and parameters updates footer */}
                    <div className="flex justify-between items-center mt-auto border-t border-[#1E1E24]/60 pt-3 select-none">
                      {pConfig ? (
                        <div className="text-[11px] font-semibold" style={{ color: pConfig.color }}>
                          {pConfig.emoji} {pConfig.shortLabel}
                        </div>
                      ) : (
                        <div className="text-[#6B6B7B] text-[10px]">⚪ Unassigned</div>
                      )}

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleFavourite(link.id)}
                          className={`p-1 flex items-center rounded ${link.isFavourited ? "text-yellow-500" : "text-neutral-600"}`}
                        >
                          <Star className={`w-3.5 h-3.5 ${link.isFavourited ? "fill-yellow-500" : ""}`} />
                        </button>

                        <button
                          onClick={() => toggleArchive(link.id)}
                          className={`p-1 rounded ${link.isArchived ? "text-purple-400" : "text-neutral-600"}`}
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
              {filteredAndSortedLinks.length === 0 && (
                <div className="col-span-full py-20 text-center text-xs text-neutral-500">
                  No active visual grid matches found
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      {/* RIGHT SIDE EXPANDABLE ANALYSIS DRAWER */}
      {activeLink && (
        <LinkAnalysisDrawer
          link={activeLink}
          onClose={() => setActiveLink(null)}
          onUpdateLink={updateLink}
          onToggleFavourite={toggleFavourite}
          onToggleArchive={toggleArchive}
          onTriggerAnalysis={triggerAnalysis}
        />
      )}

      {/* DISPATCH IMPORT MODAL SELECTION */}
      <AddLinksModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onPasteSubmit={addPasteLinks}
        onYouTubeChannelSubmit={importYouTubeChannel}
        onBulkSubmit={addBulkImportLinks}
      />

    </div>
  );
}
