import { db } from "./storage/indexedDB";
import { VaultLink, LinkAnalysis } from "@/types/linkVault";

export interface QueueState {
  pending: string[];      // Link IDs waiting
  processing: string[];   // Currently running
  completed: string[];   // Done this session
  failed: string[];      // Errored out
  isPaused: boolean;
  currentBatch: number;
  totalBatches: number;
}

type QueueListener = (state: QueueState) => void;

class LinkAnalysisQueue {
  private state: QueueState = {
    pending: [],
    processing: [],
    completed: [],
    failed: [],
    isPaused: false,
    currentBatch: 0,
    totalBatches: 0
  };

  private listeners = new Set<QueueListener>();
  private activePromise: Promise<void> | null = null;
  private retryMap: Record<string, number> = {};

  subscribe(listener: QueueListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    this.listeners.forEach((l) => l({ ...this.state }));
  }

  getState(): QueueState {
    return { ...this.state };
  }

  // Add multiple links to the queue
  async addToQueue(ids: string[]): Promise<void> {
    const validIds: string[] = [];
    for (const id of ids) {
      const link = await db.getLink(id);
      if (link && !this.state.pending.includes(id) && !this.state.processing.includes(id)) {
        validIds.push(id);
        // Mark as queued in indexedDB
        await db.updateLink(id, { analysisStatus: "queued", analysisError: null });
      }
    }

    if (validIds.length === 0) return;

    this.state.pending = [...this.state.pending, ...validIds];
    this.state.totalBatches = Math.ceil(this.state.pending.length / 10);
    this.emit();

    // Proactively start processing if not running
    if (!this.activePromise) {
      this.activePromise = this.processQueue();
    }
  }

  pause() {
    this.state.isPaused = true;
    this.emit();
  }

  resume() {
    this.state.isPaused = false;
    this.emit();
    if (!this.activePromise) {
      this.activePromise = this.processQueue();
    }
  }

  cancel() {
    // Clear pending queue and revert status to pending
    const remaining = [...this.state.pending];
    this.state.pending = [];
    this.state.processing = [];
    this.state.currentBatch = 0;
    this.state.totalBatches = 0;
    this.emit();

    this.activePromise = null;

    // Reset remaining in background to 'pending' from 'queued' to clear UI states
    remaining.forEach((id) => {
      db.updateLink(id, { analysisStatus: "pending" }).catch(console.error);
    });
  }

  private async processQueue(): Promise<void> {
    while (this.state.pending.length > 0 && !this.state.isPaused) {
      // Get next batch of 10 links
      const currentBatchIds = this.state.pending.slice(0, 10);
      this.state.pending = this.state.pending.slice(10);
      this.state.processing = currentBatchIds;
      this.state.currentBatch += 1;
      this.emit();

      // Process batch items sequentially
      for (const id of currentBatchIds) {
        if (this.state.isPaused) {
          // Put remaining items back in pending
          this.state.pending = [...this.state.processing.slice(this.state.processing.indexOf(id)), ...this.state.pending];
          this.state.processing = [];
          this.state.currentBatch = Math.max(0, this.state.currentBatch - 1);
          this.emit();
          this.activePromise = null;
          return;
        }

        await this.analyseSingleWithRetry(id);
        
        // Rate-limit spacer delay (500ms)
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      this.state.processing = [];
      this.emit();
    }

    this.activePromise = null;
    if (!this.state.isPaused) {
      // Reset batch index if fully complete
      this.state.currentBatch = 0;
      this.state.totalBatches = 0;
      this.emit();
    }
  }

  private async analyseSingleWithRetry(id: string): Promise<void> {
    const link = await db.getLink(id);
    if (!link) {
      this.state.failed.push(id);
      return;
    }

    // Mark as active analysis
    await db.updateLink(id, { analysisStatus: "analysing" });
    this.emit();

    const attempts = this.retryMap[id] || 0;

    try {
      // Trigger backend analysis
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyse-link",
          url: link.url,
          linkType: link.linkType,
          pillarContext: link.pillar
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned status code ${res.status}`);
      }

      const resData = await res.json();
      if (!resData.success || !resData.data) {
        throw new Error(resData.error || "Failed link analysis response structure");
      }

      const analysis: LinkAnalysis = {
        ...resData.data,
        linkId: id,
        url: link.url,
        analysedAt: new Date().toISOString()
      };

      // Save analysis results
      await db.saveAnalysis(analysis);

      // Auto-assign matching pillar if available
      const pillarMatch = analysis.pillarMatch || link.pillar;

      // Update source status & indices
      await db.updateLink(id, {
        analysisStatus: "done",
        analysisError: null,
        analysedAt: new Date().toISOString(),
        pillar: pillarMatch,
        pillarAutoDetected: analysis.pillarMatch ? true : link.pillarAutoDetected
      });

      this.state.completed.push(id);
      this.emit();
    } catch (e: any) {
      console.error(`[Queue] Failed attempt ${attempts + 1} for link ${id}:`, e);
      const nextAttempt = attempts + 1;
      this.retryMap[id] = nextAttempt;

      if (nextAttempt <= 2) {
        // Retry sequentially after a short delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await this.analyseSingleWithRetry(id);
      } else {
        // Exceeded retries, mark as permanent failure
        await db.updateLink(id, {
          analysisStatus: "error",
          analysisError: e.message || "Failed after 2 retries"
        });
        this.state.failed.push(id);
        this.emit();
      }
    }
  }
}

export const analysisQueue = new LinkAnalysisQueue();
