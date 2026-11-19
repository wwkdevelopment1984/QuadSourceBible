import { ChapterData } from '../types/scripture';
import { PRELOADED_CHAPTERS } from '../data/scriptureData';

const DB_NAME = 'QuadScriptureOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'chapters';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export async function saveChapterOffline(bookId: string, chapterNum: number, data: ChapterData): Promise<void> {
  const key = `${bookId.toUpperCase()}_${chapterNum}`;
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(data, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Fallback to localStorage for environments without IndexedDB
    try {
      localStorage.setItem(`offline_chap_${key}`, JSON.stringify(data));
    } catch {
      // Ignore quota exceeded
    }
  }
}

export async function getChapterOffline(bookId: string, chapterNum: number): Promise<ChapterData | null> {
  const key = `${bookId.toUpperCase()}_${chapterNum}`;
  // Check bundled chapters first
  if (PRELOADED_CHAPTERS[key]) {
    return PRELOADED_CHAPTERS[key];
  }

  try {
    const db = await openDatabase();
    const result = await new Promise<ChapterData | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as ChapterData) || null);
      req.onerror = () => reject(req.error);
    });
    if (result) return result;
  } catch {
    // Fallback to localStorage
  }

  try {
    const raw = localStorage.getItem(`offline_chap_${key}`);
    return raw ? (JSON.parse(raw) as ChapterData) : null;
  } catch {
    return null;
  }
}

export async function getOfflineCachedCount(): Promise<number> {
  const bundledCount = Object.keys(PRELOADED_CHAPTERS).length;
  try {
    const db = await openDatabase();
    const keys = await new Promise<string[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAllKeys();
      req.onsuccess = () => resolve((req.result as string[]) || []);
      req.onerror = () => reject(req.error);
    });
    const unique = new Set([...Object.keys(PRELOADED_CHAPTERS), ...keys]);
    return unique.size;
  } catch {
    return bundledCount;
  }
}

export async function getOfflineCachedKeys(): Promise<string[]> {
  const bundled = Object.keys(PRELOADED_CHAPTERS);
  try {
    const db = await openDatabase();
    const keys = await new Promise<string[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAllKeys();
      req.onsuccess = () => resolve((req.result as string[]) || []);
      req.onerror = () => reject(req.error);
    });
    return Array.from(new Set([...bundled, ...keys]));
  } catch {
    return bundled;
  }
}
