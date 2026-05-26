import { VaultLink, LinkAnalysis, LinkFilter } from "@/types/linkVault";

class RahulShipsDB {
  private db: IDBDatabase | null = null;
  private isFallback = false;
  private fallbackStore: Record<string, Record<string, any>> = {
    links: {},
    link_analysis: {},
    hook_bank: {},
    competitors: {},
    calendar: {},
    history: {}
  };

  constructor() {
    if (typeof window !== "undefined") {
      // Try to prepare fallback in localStorage initially
      try {
        const stored = localStorage.getItem("rahulships_indexeddb_fallback");
        if (stored) {
          this.fallbackStore = JSON.parse(stored);
        }
      } catch (e) {
        console.warn("Storage limited in private mode. Fallback state strictly in memory.", e);
      }
    }
  }

  private saveFallbackToLocalStorage() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("rahulships_indexeddb_fallback", JSON.stringify(this.fallbackStore));
    } catch (e) {
      console.warn("Quota exceeded or localStorage unavailable during private mode fallback save.", e);
    }
  }

  async init(): Promise<void> {
    if (typeof window === "undefined") return;

    return new Promise((resolve) => {
      try {
        if (!window.indexedDB) {
          console.warn("IndexedDB not available, falling back to localStorage.");
          this.isFallback = true;
          resolve();
          return;
        }

        const request = window.indexedDB.open("rahulships_db", 1);

        request.onerror = (event) => {
          console.error("IndexedDB open error, falling back to memory/localStorage.", event);
          this.isFallback = true;
          resolve();
        };

        request.onsuccess = (event: any) => {
          this.db = event.target.result;
          resolve();
        };

        request.onupgradeneeded = (event: any) => {
          const dbInstance = event.target.result;

          // 'links' Store with index definitions
          if (!dbInstance.objectStoreNames.contains("links")) {
            const linkStore = dbInstance.createObjectStore("links", { keyPath: "id" });
            linkStore.createIndex("by_pillar", "pillar", { unique: false });
            linkStore.createIndex("by_type", "linkType", { unique: false });
            linkStore.createIndex("by_status", "analysisStatus", { unique: false });
            linkStore.createIndex("by_date", "createdAt", { unique: false });
            linkStore.createIndex("by_priority", "priority", { unique: false });
            linkStore.createIndex("by_domain", "domain", { unique: false });
          }

          // 'link_analysis' Store
          if (!dbInstance.objectStoreNames.contains("link_analysis")) {
            dbInstance.createObjectStore("link_analysis", { keyPath: "linkId" });
          }

          // Others (Migrated items)
          const stores = ["hook_bank", "competitors", "calendar", "history"];
          stores.forEach((storeName) => {
            if (!dbInstance.objectStoreNames.contains(storeName)) {
              dbInstance.createObjectStore(storeName);
            }
          });
        };
      } catch (e) {
        console.error("Critical error dual initializing IndexedDB:", e);
        this.isFallback = true;
        resolve();
      }
    });
  }

  private getStore(storeName: string, mode: IDBTransactionMode = "readonly"): IDBObjectStore | null {
    if (!this.db) return null;
    try {
      const transaction = this.db.transaction(storeName, mode);
      return transaction.objectStore = transaction.objectStore(storeName);
    } catch (e) {
      console.error(`Error opening transaction store: ${storeName}`, e);
      return null;
    }
  }

  // --- LINKS store wrapper operations ---

  async addLink(link: VaultLink): Promise<string> {
    if (this.isFallback || !this.db) {
      this.fallbackStore.links[link.id] = link;
      this.saveFallbackToLocalStorage();
      return link.id;
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db!.transaction("links", "readwrite");
        const store = tx.objectStore("links");
        const req = store.put(link);
        req.onsuccess = () => resolve(link.id);
        req.onerror = () => reject(req.error);
      } catch (e) {
        reject(e);
      }
    });
  }

  async addLinks(links: VaultLink[]): Promise<string[]> {
    if (this.isFallback || !this.db) {
      links.forEach((l) => {
        this.fallbackStore.links[l.id] = l;
      });
      this.saveFallbackToLocalStorage();
      return links.map((l) => l.id);
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db!.transaction("links", "readwrite");
        const store = tx.objectStore("links");
        const ids: string[] = [];

        links.forEach((link) => {
          store.put(link);
          ids.push(link.id);
        });

        tx.oncomplete = () => resolve(ids);
        tx.onerror = () => reject(tx.error);
      } catch (e) {
        reject(e);
      }
    });
  }

  async getLink(id: string): Promise<VaultLink | null> {
    if (this.isFallback || !this.db) {
      return this.fallbackStore.links[id] || null;
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction("links", "readonly");
        const store = tx.objectStore("links");
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  }

  async getLinks(filter?: LinkFilter): Promise<VaultLink[]> {
    let allLinks: VaultLink[] = [];

    if (this.isFallback || !this.db) {
      allLinks = Object.values(this.fallbackStore.links) as VaultLink[];
    } else {
      allLinks = await new Promise<VaultLink[]>((resolve) => {
        try {
          const tx = this.db!.transaction("links", "readonly");
          const store = tx.objectStore("links");
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve([]);
        } catch (e) {
          resolve([]);
        }
      });
    }

    // Filter results programmatically for absolute precision & compatibility
    if (filter) {
      allLinks = allLinks.filter((link) => {
        if (filter.pillar !== undefined && link.pillar !== filter.pillar) return false;
        if (filter.linkType !== undefined && filter.linkType !== null && link.linkType !== filter.linkType) return false;
        if (filter.analysisStatus !== undefined && filter.analysisStatus !== null && link.analysisStatus !== filter.analysisStatus) return false;
        if (filter.priority !== undefined && filter.priority !== null && link.priority !== filter.priority) return false;
        if (filter.addedFrom !== undefined && filter.addedFrom !== null && link.addedFrom !== filter.addedFrom) return false;
        if (filter.isFavourited !== undefined && link.isFavourited !== filter.isFavourited) return false;
        if (filter.isArchived !== undefined && link.isArchived !== filter.isArchived) return false;
        if (filter.usedInBrief !== undefined && link.usedInBrief !== filter.usedInBrief) return false;
        if (filter.domain !== undefined && filter.domain !== null && link.domain !== filter.domain) return false;

        if (filter.hasAnalysis !== undefined) {
          const has = link.analysisStatus === "done";
          if (filter.hasAnalysis !== has) return false;
        }

        if (filter.search) {
          const cleanQuery = filter.search.toLowerCase();
          const matchTitle = link.title?.toLowerCase().includes(cleanQuery);
          const matchUrl = link.url?.toLowerCase().includes(cleanQuery);
          const matchNotes = link.notes?.toLowerCase().includes(cleanQuery);
          if (!matchTitle && !matchUrl && !matchNotes) return false;
        }

        if (filter.dateFrom && new Date(link.createdAt) < new Date(filter.dateFrom)) return false;
        if (filter.dateTo && new Date(link.createdAt) > new Date(filter.dateTo)) return false;

        return true;
      });
    }

    return allLinks;
  }

  async updateLink(id: string, updates: Partial<VaultLink>): Promise<void> {
    if (this.isFallback || !this.db) {
      if (this.fallbackStore.links[id]) {
        this.fallbackStore.links[id] = { ...this.fallbackStore.links[id], ...updates, updatedAt: new Date().toISOString() };
        this.saveFallbackToLocalStorage();
      }
      return;
    }

    const current = await this.getLink(id);
    if (!current) return;

    const merged = { ...current, ...updates, updatedAt: new Date().toISOString() };

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db!.transaction("links", "readwrite");
        const store = tx.objectStore("links");
        const req = store.put(merged);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (e) {
        reject(e);
      }
    });
  }

  async deleteLink(id: string): Promise<void> {
    if (this.isFallback || !this.db) {
      delete this.fallbackStore.links[id];
      this.saveFallbackToLocalStorage();
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db!.transaction("links", "readwrite");
        const store = tx.objectStore("links");
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (e) {
        reject(e);
      }
    });
  }

  async deleteLinks(ids: string[]): Promise<void> {
    if (this.isFallback || !this.db) {
      ids.forEach((id) => delete this.fallbackStore.links[id]);
      this.saveFallbackToLocalStorage();
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db!.transaction("links", "readwrite");
        const store = tx.objectStore("links");
        ids.forEach((id) => store.delete(id));
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      } catch (e) {
        reject(e);
      }
    });
  }

  async getLinkCount(): Promise<number> {
    if (this.isFallback || !this.db) {
      return Object.keys(this.fallbackStore.links).length;
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction("links", "readonly");
        const store = tx.objectStore("links");
        const req = store.count();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(0);
      } catch (e) {
        resolve(0);
      }
    });
  }

  // --- ANALYSIS store wrapper operations ---

  async saveAnalysis(analysis: LinkAnalysis): Promise<void> {
    if (this.isFallback || !this.db) {
      this.fallbackStore.link_analysis[analysis.linkId] = analysis;
      this.saveFallbackToLocalStorage();
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db!.transaction("link_analysis", "readwrite");
        const store = tx.objectStore("link_analysis");
        const req = store.put(analysis);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (e) {
        reject(e);
      }
    });
  }

  async getAnalysis(linkId: string): Promise<LinkAnalysis | null> {
    if (this.isFallback || !this.db) {
      return this.fallbackStore.link_analysis[linkId] || null;
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction("link_analysis", "readonly");
        const store = tx.objectStore("link_analysis");
        const req = store.get(linkId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  }

  // --- GENERIC KEY/VALUE STORAGE FOR OTHER STORES (Backwards compatibility migration) ---

  async get<T>(storeName: string, key: string): Promise<T | null> {
    if (this.isFallback || !this.db) {
      if (!this.fallbackStore[storeName]) this.fallbackStore[storeName] = {};
      return (this.fallbackStore[storeName][key] as T) || null;
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  }

  async set<T>(storeName: string, key: string, value: T): Promise<void> {
    if (this.isFallback || !this.db) {
      if (!this.fallbackStore[storeName]) this.fallbackStore[storeName] = {};
      this.fallbackStore[storeName][key] = value;
      this.saveFallbackToLocalStorage();
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db!.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const req = store.put(value, key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (e) {
        reject(e);
      }
    });
  }

  async delete(storeName: string, key: string): Promise<void> {
    if (this.isFallback || !this.db) {
      if (this.fallbackStore[storeName]) {
        delete this.fallbackStore[storeName][key];
        this.saveFallbackToLocalStorage();
      }
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const tx = this.db!.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (e) {
        reject(e);
      }
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    if (this.isFallback || !this.db) {
      if (!this.fallbackStore[storeName]) this.fallbackStore[storeName] = {};
      return Object.values(this.fallbackStore[storeName]) as T[];
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction(storeName, "readonly");
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch (e) {
        resolve([]);
      }
    });
  }

  getIsFallback(): boolean {
    return this.isFallback;
  }
}

export const db = new RahulShipsDB();
