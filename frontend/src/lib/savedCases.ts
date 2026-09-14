function savedStorageKey(username: string) {
  return `mycases:saved:${username}`;
}

export function loadSavedIds(username: string): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(savedStorageKey(username));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function saveSavedIds(username: string, ids: Set<number>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(savedStorageKey(username), JSON.stringify(Array.from(ids)));
  } catch {
    // Storage full/unavailable — saving just won't persist across reloads.
  }
}