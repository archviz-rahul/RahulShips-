// IndexedDB helper for managing Rahul's personal photos for thumbnails.

export interface RahulPhoto {
  id: string;
  base64: string;
  thumbnailBase64: string;  // small preview
  expression: string;        // tag e.g. shocked, serious, excited, pointing, smiling, thinking, confident
  orientation: string;       // tag e.g. left, right, forward
  hasBgRemoved: boolean;
  uploadedAt: string;
  usageCount: number;
}

const DB_NAME = "rahul_photos_db";
const STORE_NAME = "rahul_photos";
const DB_VERSION = 1;

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("IndexedDB is only available in browser environments"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      reject(new Error("Failed to open IndexedDB database"));
    };

    request.onsuccess = (event) => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

export async function savePhoto(photo: RahulPhoto): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(photo);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error("Failed to save photo inside store"));
  });
}

export async function getPhotos(): Promise<RahulPhoto[]> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error("Failed to load photos from store"));
    });
  } catch (err) {
    console.warn("IndexedDB getPhotos failed, returning empty list:", err);
    return [];
  }
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error("Failed to delete photo from store"));
  });
}

export async function incrementUsageCount(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const photo = getRequest.result as RahulPhoto | undefined;
      if (photo) {
        photo.usageCount += 1;
        const updateRequest = store.put(photo);
        updateRequest.onsuccess = () => resolve();
        updateRequest.onerror = () => reject(new Error("Failed to update usage count"));
      } else {
        resolve();
      }
    };
    getRequest.onerror = () => reject(new Error("Failed to fetch photo for usage count"));
  });
}
