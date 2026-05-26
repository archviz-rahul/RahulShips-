import { useState, useEffect, useCallback, useMemo } from "react";
import { db } from "@/lib/storage/indexedDB";
import { VaultLink, LinkAnalysis, LinkFilter, LinkType, LinkPriority, AnalysisStatus } from "@/types/linkVault";
import { analysisQueue, QueueState } from "@/lib/analysisQueue";
import { detectLinkType, extractDomain, parseUrlsFromText } from "@/lib/linkParser";
import { Pillar } from "@/lib/pillarConfig";

export function useLinkVault() {
  const [links, setLinks] = useState<VaultLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Sort state variables
  const [search, setSearch] = useState("");
  const [filterPillar, setFilterPillar] = useState<Pillar | "All" | "Unassigned">("All");
  const [filterType, setFilterType] = useState<LinkType | "All">("All");
  const [filterStatus, setFilterStatus] = useState<AnalysisStatus | "All">("All");
  const [filterPriority, setFilterPriority] = useState<LinkPriority | "All">("All");
  const [filterAddedFrom, setFilterAddedFrom] = useState<string>("All");
  const [filterFavourited, setFilterFavourited] = useState<boolean | "All">("All");
  const [filterArchived, setFilterArchived] = useState<boolean>(false); // default archive filtered out
  const [sortBy, setSortBy] = useState<
    | "newest"
    | "oldest"
    | "contentValue"
    | "virality"
    | "lastViewed"
    | "alphabetical"
    | "domain"
    | "pillar"
  >("newest");

  // Queue state tracking
  const [queueState, setQueueState] = useState<QueueState>(() => analysisQueue.getState());

  // Sync / Load operations
  const refreshLinks = useCallback(async () => {
    try {
      setLoading(true);
      const fetched = await db.getLinks();
      setLinks(fetched);
    } catch (e: any) {
      setError(e.message || "Failed to retrieve Link Vault records.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Listen to queue state updates reactively
  useEffect(() => {
    const unsubscribe = analysisQueue.subscribe((state) => {
      setQueueState(state);
      // Trigger list refresh on queue completion status updates to ensure reactive UI
      if (state.completed.length > 0 || state.failed.length > 0) {
        refreshLinks();
      }
    });
    return unsubscribe;
  }, [refreshLinks]);

  // Fetch on mount
  useEffect(() => {
    queueMicrotask(() => {
      refreshLinks();
    });
  }, [refreshLinks]);

  // Derived filtered & sorted links arrays
  const filteredAndSortedLinks = useMemo(() => {
    let result = [...links];

    // Filter by Archive (strictly separate toggle)
    result = result.filter((l) => l.isArchived === filterArchived);

    // Apply Filters
    if (filterPillar !== "All") {
      if (filterPillar === "Unassigned") {
        result = result.filter((l) => l.pillar === null);
      } else {
        result = result.filter((l) => l.pillar === filterPillar);
      }
    }

    if (filterType !== "All") {
      result = result.filter((l) => l.linkType === filterType);
    }

    if (filterStatus !== "All") {
      result = result.filter((l) => l.analysisStatus === filterStatus);
    }

    if (filterPriority !== "All") {
      result = result.filter((l) => l.priority === filterPriority);
    }

    if (filterAddedFrom !== "All") {
      result = result.filter((l) => l.addedFrom === filterAddedFrom);
    }

    if (filterFavourited !== "All") {
      result = result.filter((l) => l.isFavourited === filterFavourited);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.title?.toLowerCase().includes(q) ||
          l.url?.toLowerCase().includes(q) ||
          l.domain?.toLowerCase().includes(q) ||
          l.notes?.toLowerCase().includes(q)
      );
    }

    // Secondary load of analyses for numerical sort metrics in parallel memory is highly optimized
    // Let's sort
    return result.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === "alphabetical") {
        return (a.title || "").localeCompare(b.title || "");
      }
      if (sortBy === "domain") {
        return a.domain.localeCompare(b.domain);
      }
      if (sortBy === "pillar") {
        return (a.pillar || "").localeCompare(b.pillar || "");
      }
      if (sortBy === "lastViewed") {
        const timeA = a.lastViewedAt ? new Date(a.lastViewedAt).getTime() : 0;
        const timeB = b.lastViewedAt ? new Date(b.lastViewedAt).getTime() : 0;
        return timeB - timeA;
      }
      // Analysis numerical items fall back
      return 0; // handled dynamically outside if analysis scores aren't pre-loaded on general link index records
    });
  }, [links, search, filterPillar, filterType, filterStatus, filterPriority, filterAddedFrom, filterFavourited, filterArchived, sortBy]);

  // CRUD API
  const addPasteLinks = useCallback(async (
    rawText: string,
    pillar: Pillar | null,
    priority: LinkPriority,
    autoAnalyse: boolean,
    autoDetect: boolean
  ) => {
    const urls = parseUrlsFromText(rawText);
    if (urls.length === 0) return 0;

    const newLinks: VaultLink[] = [];

    for (const url of urls) {
      const type = detectLinkType(url);
      const domain = extractDomain(url);

      const link: VaultLink = {
        id: `link_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
        url,
        cleanUrl: url,
        domain,
        linkType: type,
        title: `Draft: ${domain}`,
        description: "",
        thumbnailUrl: null,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
        pillar: autoDetect ? null : pillar,
        pillarAutoDetected: autoDetect,
        tags: [],
        priority,
        addedFrom: "paste",
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
      };

      newLinks.push(link);
    }

    await db.addLinks(newLinks);
    await refreshLinks();

    // Trigger auto-fetch metadata for the links in the background asynchronously
    newLinks.forEach((item) => {
      fetch(`/api/links`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fetch-metadata", url: item.url })
      })
        .then((res) => res.json())
        .then((resData) => {
          if (resData.success && resData.data) {
            const up = resData.data;
            db.updateLink(item.id, {
              title: up.title || item.title,
              description: up.description || item.description,
              thumbnailUrl: up.thumbnailUrl || item.thumbnailUrl,
              youtube: up.youtube ? { ...item.youtube, ...up.youtube } : undefined
            }).then(() => refreshLinks());
          }
        })
        .catch(console.error);
    });

    if (autoAnalyse) {
      const ids = newLinks.map((l) => l.id);
      analysisQueue.addToQueue(ids);
    }

    return newLinks.length;
  }, [refreshLinks]);

  const importYouTubeChannel = useCallback(async (
    linksList: VaultLink[],
    autoAnalyse: boolean
  ) => {
    if (linksList.length === 0) return;
    await db.addLinks(linksList);
    await refreshLinks();

    if (autoAnalyse) {
      const ids = linksList.map((l) => l.id);
      analysisQueue.addToQueue(ids);
    }
  }, [refreshLinks]);

  const addBulkImportLinks = useCallback(async (
    linksList: VaultLink[],
    autoAnalyse: boolean
  ) => {
    if (linksList.length === 0) return;
    await db.addLinks(linksList);
    await refreshLinks();

    if (autoAnalyse) {
      const ids = linksList.map((l) => l.id);
      analysisQueue.addToQueue(ids);
    }
  }, [refreshLinks]);

  const updateLink = useCallback(async (id: string, updates: Partial<VaultLink>) => {
    await db.updateLink(id, updates);
    await refreshLinks();
  }, [refreshLinks]);

  const deleteLink = useCallback(async (id: string) => {
    await db.deleteLink(id);
    await refreshLinks();
  }, [refreshLinks]);

  const toggleFavourite = useCallback(async (id: string) => {
    const link = await db.getLink(id);
    if (!link) return;
    await db.updateLink(id, { isFavourited: !link.isFavourited });
    await refreshLinks();
  }, [refreshLinks]);

  const toggleArchive = useCallback(async (id: string) => {
    const link = await db.getLink(id);
    if (!link) return;
    await db.updateLink(id, { isArchived: !link.isArchived });
    await refreshLinks();
  }, [refreshLinks]);

  // Bulk actions
  const bulkDelete = useCallback(async (ids: string[]) => {
    await db.deleteLinks(ids);
    await refreshLinks();
  }, [refreshLinks]);

  const bulkArchive = useCallback(async (ids: string[], archiveState = true) => {
    for (const id of ids) {
      await db.updateLink(id, { isArchived: archiveState });
    }
    await refreshLinks();
  }, [refreshLinks]);

  const bulkSetPillar = useCallback(async (ids: string[], pillar: Pillar | null) => {
    for (const id of ids) {
      await db.updateLink(id, { pillar });
    }
    await refreshLinks();
  }, [refreshLinks]);

  const bulkSetPriority = useCallback(async (ids: string[], priority: LinkPriority) => {
    for (const id of ids) {
      await db.updateLink(id, { priority });
    }
    await refreshLinks();
  }, [refreshLinks]);

  const triggerAnalysis = useCallback(async (id: string) => {
    await analysisQueue.addToQueue([id]);
  }, []);

  const triggerAnalysisAllPending = useCallback(async () => {
    const pendingLinks = links.filter((l) => l.analysisStatus === "pending" || l.analysisStatus === "error");
    const ids = pendingLinks.map((l) => l.id);
    if (ids.length > 0) {
      await analysisQueue.addToQueue(ids);
    }
  }, [links]);

  return {
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
    pauseQueue: () => analysisQueue.pause(),
    resumeQueue: () => analysisQueue.resume(),
    cancelQueue: () => analysisQueue.cancel()
  };
}
