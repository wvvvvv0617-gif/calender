// Storage Backup & Persistence Helper for ShiftMate

const DB_NAME = 'shiftmate_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'app_snapshot';

/**
 * Request persistent storage permission from the browser/PWA engine
 * This prevents Chrome/Chromium from automatically evicting data under low-storage conditions.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    if (navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persist();
      console.log('ShiftMate persistent storage status:', isPersisted);
      return isPersisted;
    }
  } catch (err) {
    console.warn('Persistent storage request failed:', err);
  }
  return false;
}

/**
 * Open or initialize IndexedDB for snapshot backup
 */
function openIndexedDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Save snapshot to IndexedDB
 */
export async function saveSnapshotToIndexedDB(data: Record<string, any>): Promise<void> {
  const db = await openIndexedDB();
  if (!db) return;
  try {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ id: 'latest_backup', data, timestamp: new Date().toISOString() });
  } catch (err) {
    console.warn('Failed to save to IndexedDB:', err);
  }
}

/**
 * Load latest snapshot from IndexedDB
 */
export async function loadSnapshotFromIndexedDB(): Promise<Record<string, any> | null> {
  const db = await openIndexedDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get('latest_backup');
      req.onsuccess = () => {
        if (req.result && req.result.data) {
          resolve(req.result.data);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Trigger download of complete JSON backup
 */
export function downloadBackupFile(data: Record<string, any>, fileNamePrefix = 'ShiftMate_데이터백업'): void {
  try {
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `${fileNamePrefix}_${dateStr}.json`;
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Download backup failed:', err);
    throw err;
  }
}

/**
 * Save backup file directly using native File System Access API where supported,
 * or fall back seamlessly to download.
 */
export async function saveToFileWithPicker(data: Record<string, any>, fileNamePrefix = 'ShiftMate_데이터백업'): Promise<boolean> {
  if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    try {
      const dateStr = new Date().toISOString().slice(0, 10);
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: `${fileNamePrefix}_${dateStr}.json`,
        types: [{
          description: 'JSON Backup File',
          accept: { 'application/json': ['.json'] },
        }],
      });
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
      return true;
    } catch (err: any) {
      if (err.name === 'AbortError') return false;
      console.warn('Native file picker failed, falling back to download:', err);
    }
  }
  downloadBackupFile(data, fileNamePrefix);
  return true;
}

