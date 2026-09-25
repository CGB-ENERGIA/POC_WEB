const DB_NAME = "cgb-pwa-offline";
const STORE = "kv";
const VERSION = 1;
// iOS às vezes deixa indexedDB.open pendurado na primeira abertura do PWA.
const OPEN_TIMEOUT_MS = 3000;

let dbPromise: Promise<IDBDatabase> | null = null;

function abrirDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB indisponível"));
      return;
    }
    const timer = setTimeout(() => reject(new Error("IndexedDB não respondeu")), OPEN_TIMEOUT_MS);
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => {
      clearTimeout(timer);
      const db = req.result;
      db.onclose = () => { dbPromise = null; };
      resolve(db);
    };
    req.onerror = () => { clearTimeout(timer); reject(req.error); };
  }).catch((err) => {
    dbPromise = null;
    throw err;
  });
  return dbPromise;
}

export async function kvGet<T>(key: string): Promise<T | undefined> {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("Gravação abortada"));
  });
}

/** Pede ao navegador para não apagar os dados do app sob pressão de espaço. */
export function requestPersistentStorage(): void {
  void navigator.storage?.persist?.().catch(() => false);
}
