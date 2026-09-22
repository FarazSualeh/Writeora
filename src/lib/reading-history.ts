export type ReadEntry = {
  slug: string;
  title: string;
  category: string;
  cover_image_url: string | null;
  author_name: string;
  read_at: string;
};

const KEY = "writeora:reading-history";
const LIMIT = 24;

export function getReadingHistory(): ReadEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as ReadEntry[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordRead(entry: Omit<ReadEntry, "read_at">) {
  if (typeof window === "undefined") return;
  const next = [
    { ...entry, read_at: new Date().toISOString() },
    ...getReadingHistory().filter((item) => item.slug !== entry.slug),
  ].slice(0, LIMIT);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
}

export function clearReadingHistory() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
