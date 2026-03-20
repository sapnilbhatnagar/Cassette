// IndexedDB-backed audio history store.
// Persists voice and mix audio across browser sessions as raw ArrayBuffers.
// Each user gets their own database, keyed by user ID.

import type { ScriptVariant } from "@/types/ad-brief";
import { getCurrentUser } from "@/lib/auth";

const DB_PREFIX = "cassette-history";
const DB_VERSION = 1;
const STORE_NAME = "entries";

export interface HistoryEntry {
  id: string;
  createdAt: number;
  entryType: "voice" | "mix";
  scriptTitle: string;
  voiceId: string;
  voiceName: string;
  bedId?: string;
  bedName?: string;
  audioData: ArrayBuffer;
  durationSeconds?: number;
  /** Full script stored so history entries can restore the entire workflow state. */
  scriptVariant?: ScriptVariant;
}

function getDBName(): string {
  const user = getCurrentUser();
  if (user) return `${DB_PREFIX}-${user.id}`;
  return DB_PREFIX;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(getDBName(), DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveHistoryEntry(entry: HistoryEntry): Promise<void> {
  if (typeof window === "undefined") return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllHistoryEntries(): Promise<HistoryEntry[]> {
  if (typeof window === "undefined") return [];
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).index("createdAt").getAll();
    req.onsuccess = () => {
      const sorted = (req.result as HistoryEntry[]).sort((a, b) => b.createdAt - a.createdAt);
      resolve(sorted);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getHistoryEntry(id: string): Promise<HistoryEntry | undefined> {
  if (typeof window === "undefined") return undefined;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = () => resolve(req.result as HistoryEntry | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  if (typeof window === "undefined") return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Fetch a blob URL and persist it as an ArrayBuffer in the history store. */
export async function saveBlobUrlToHistory(
  blobUrl: string,
  meta: Omit<HistoryEntry, "id" | "createdAt" | "audioData">
): Promise<string> {
  const res = await fetch(blobUrl);
  const audioData = await res.arrayBuffer();
  const id = crypto.randomUUID();
  await saveHistoryEntry({ id, createdAt: Date.now(), audioData, ...meta });
  return id;
}

/** Load a history entry's audio as a temporary blob URL (caller must revoke when done). */
export function createBlobUrlFromEntry(entry: HistoryEntry): string {
  const mimeType = entry.entryType === "mix" ? "audio/wav" : "audio/mpeg";
  const blob = new Blob([entry.audioData], { type: mimeType });
  return URL.createObjectURL(blob);
}
