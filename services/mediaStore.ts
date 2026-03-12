
import { MediaItem } from '../types';

const DB_NAME = 'replicai_db';
const STORE_NAME = 'media';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

const openDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject('IndexedDB not supported');
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB Error:", event);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });

  return dbPromise;
};

// --- API ---

export const addMediaItem = async (item: MediaItem): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn("IndexedDB failed, falling back to LocalStorage for Add", e);
    // Fallback: LocalStorage (Not recommended for images, but functional for small test cases)
    try {
      const existing = JSON.parse(localStorage.getItem(STORE_NAME) || '[]');
      existing.unshift(item); // Add to beginning
      localStorage.setItem(STORE_NAME, JSON.stringify(existing));
    } catch (lsError) {
      console.error("LocalStorage failed (likely quota exceeded)", lsError);
    }
  }
};

export const listMediaItems = async (): Promise<MediaItem[]> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        // Sort by date descending (newest first)
        const items = request.result as MediaItem[];
        items.sort((a, b) => new Date(b.createdAtISO).getTime() - new Date(a.createdAtISO).getTime());
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn("IndexedDB failed, falling back to LocalStorage for List", e);
    return JSON.parse(localStorage.getItem(STORE_NAME) || '[]');
  }
};

export const deleteMediaItem = async (id: string): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    // Fallback LocalStorage
    const existing = JSON.parse(localStorage.getItem(STORE_NAME) || '[]');
    const filtered = existing.filter((i: MediaItem) => i.id !== id);
    localStorage.setItem(STORE_NAME, JSON.stringify(filtered));
  }
};
