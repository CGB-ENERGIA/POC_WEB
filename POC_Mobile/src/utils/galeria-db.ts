const DB_NAME = "cgb-pwa-galeria";
const STORE   = "fotos";
const VERSION = 1;

export interface FotoEntry {
  id: string;
  matricula: string;
  dataHora: string;   // ISO 8601
  blob?: Blob;        // ausente em entradas cloud-only (outros dispositivos)
  tamanho: number;    // bytes
  cloudUrl: string | null;  // URL pública no Supabase Storage (null = ainda não sincronizado)
}

function abrirDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = (ev) => {
      const db = (ev.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("matricula", "matricula");
        store.createIndex("dataHora",  "dataHora");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

export async function dbSalvarFoto(entry: FotoEntry): Promise<void> {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

export async function dbListarFotos(): Promise<FotoEntry[]> {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as FotoEntry[]);
    req.onerror   = () => reject(req.error);
  });
}

export async function dbExcluirFoto(id: string): Promise<void> {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}

/** Remove fotos com mais de 3 meses — chamado ao carregar a galeria. */
export async function dbLimparExpirados(): Promise<number> {
  const limite = new Date();
  limite.setMonth(limite.getMonth() - 3);
  const limiteISO = limite.toISOString();

  const db = await abrirDB();
  const fotos: FotoEntry[] = await new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as FotoEntry[]);
    req.onerror   = () => reject(req.error);
  });

  const expiradas = fotos.filter(f => f.dataHora < limiteISO);
  if (expiradas.length === 0) return 0;

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const os = tx.objectStore(STORE);
    expiradas.forEach(f => os.delete(f.id));
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });

  return expiradas.length;
}
