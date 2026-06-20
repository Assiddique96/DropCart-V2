// lib/recentlyViewed.js
const KEY = "shpinx_recently_viewed";

export function addRecentlyViewed(id) {
  if (typeof window === "undefined") return;
  const existing = JSON.parse(localStorage.getItem(KEY) || "[]");
  const filtered = existing.filter((x) => x !== id);
  const updated = [id, ...filtered].slice(0, 10);
  localStorage.setItem(KEY, JSON.stringify(updated));
}

export function getRecentlyViewed() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}
