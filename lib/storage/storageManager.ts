import { db } from "./indexedDB";

export class StorageManager {
  private static isInitialized = false;

  static async init(): Promise<void> {
    if (this.isInitialized) return;
    
    // Initialise underlying IndexedDB
    await db.init();
    this.isInitialized = true;

    if (typeof window !== "undefined") {
      // Migrate Hook Bank ("viztr_hooks_library_v1")
      try {
        const storedHooks = localStorage.getItem("viztr_hooks_library_v1");
        if (storedHooks) {
          const hooks = JSON.parse(storedHooks);
          if (Array.isArray(hooks) && hooks.length > 0) {
            const hasIndexed = await db.get("hook_bank", "hooks");
            if (!hasIndexed) {
              console.log(`[StorageManager] Migrating ${hooks.length} legacy hooks to IndexedDB`);
              await db.set("hook_bank", "hooks", hooks);
            }
          }
        }
      } catch (e) {
        console.error("Migration error for hooks:", e);
      }

      // Migrate History ("viztr_brief_history_v1")
      try {
        const storedHistory = localStorage.getItem("viztr_brief_history_v1");
        if (storedHistory) {
          const history = JSON.parse(storedHistory);
          if (Array.isArray(history) && history.length > 0) {
            const hasIndexed = await db.get("history", "history");
            if (!hasIndexed) {
              console.log(`[StorageManager] Migrating ${history.length} legacy history items to IndexedDB`);
              await db.set("history", "history", history);
            }
          }
        }
      } catch (e) {
        console.error("Migration error for history:", e);
      }

      // Migrate Calendar ("viztr_scheduled_content")
      try {
        const storedCalendar = localStorage.getItem("viztr_scheduled_content");
        if (storedCalendar) {
          const calendar = JSON.parse(storedCalendar);
          if (Array.isArray(calendar) && calendar.length > 0) {
            const hasIndexed = await db.get("calendar", "calendar");
            if (!hasIndexed) {
              console.log(`[StorageManager] Migrating ${calendar.length} legacy calendar schedules to IndexedDB`);
              await db.set("calendar", "calendar", calendar);
            }
          }
        }
      } catch (e) {
        console.error("Migration error for calendar:", e);
      }
    }
  }

  // --- HOOKS ---
  static async getHooks(): Promise<any[]> {
    await this.init();
    const hooks = await db.get<any[]>("hook_bank", "hooks");
    if (!hooks && typeof window !== "undefined") {
      const stored = localStorage.getItem("viztr_hooks_library_v1");
      return stored ? JSON.parse(stored) : [];
    }
    return hooks || [];
  }

  static async saveHooks(hooks: any[]): Promise<void> {
    await this.init();
    await db.set("hook_bank", "hooks", hooks);
    if (typeof window !== "undefined") {
      localStorage.setItem("viztr_hooks_library_v1", JSON.stringify(hooks));
    }
  }

  // --- BRIEF HISTORY ---
  static async getHistory(): Promise<any[]> {
    await this.init();
    const history = await db.get<any[]>("history", "history");
    if (!history && typeof window !== "undefined") {
      const stored = localStorage.getItem("viztr_brief_history_v1");
      return stored ? JSON.parse(stored) : [];
    }
    return history || [];
  }

  static async saveHistory(history: any[]): Promise<void> {
    await this.init();
    await db.set("history", "history", history);
    if (typeof window !== "undefined") {
      localStorage.setItem("viztr_brief_history_v1", JSON.stringify(history));
    }
  }

  static async removeHistory(): Promise<void> {
    await this.init();
    await db.delete("history", "history");
    if (typeof window !== "undefined") {
      localStorage.removeItem("viztr_brief_history_v1");
    }
  }

  // --- CALENDAR SCHEDULES ---
  static async getCalendar(): Promise<any[]> {
    await this.init();
    const calendar = await db.get<any[]>("calendar", "calendar");
    if (!calendar && typeof window !== "undefined") {
      const stored = localStorage.getItem("viztr_scheduled_content");
      return stored ? JSON.parse(stored) : [];
    }
    return calendar || [];
  }

  static async saveCalendar(calendar: any[]): Promise<void> {
    await this.init();
    await db.set("calendar", "calendar", calendar);
    if (typeof window !== "undefined") {
      localStorage.setItem("viztr_scheduled_content", JSON.stringify(calendar));
    }
  }
}
