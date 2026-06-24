import { CURRENT_CHANNEL_STORAGE_KEY } from "./config";

/**
 * 現在チャネル id を保持する非Reactなストア。
 * apiFetch（書き込み時の X-Line-Channel-Id）と AuthProvider の双方が参照する。
 * 真実の源は AuthProvider だが、リクエスト時に同期的に読めるようにここにも置く。
 */
let currentChannelId: string | null = null;
const listeners = new Set<(id: string | null) => void>();

export function getCurrentChannelId(): string | null {
  if (currentChannelId !== null) return currentChannelId;
  if (typeof window !== "undefined") {
    currentChannelId = window.localStorage.getItem(CURRENT_CHANNEL_STORAGE_KEY);
  }
  return currentChannelId;
}

export function setCurrentChannelId(id: string | null): void {
  currentChannelId = id;
  if (typeof window !== "undefined") {
    if (id) window.localStorage.setItem(CURRENT_CHANNEL_STORAGE_KEY, id);
    else window.localStorage.removeItem(CURRENT_CHANNEL_STORAGE_KEY);
  }
  listeners.forEach((fn) => fn(id));
}

export function subscribeChannel(fn: (id: string | null) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
