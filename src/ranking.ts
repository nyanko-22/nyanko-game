import { fetchTopScores, type ScoreEntry } from './firebase';
import { MAX_RANKING_ENTRIES } from './constants';

let cachedScores: ScoreEntry[] = [];
let loading = false;
let error = false;
let scrollOffset = 0;
let selectedScreenshot: { url: string; img: HTMLImageElement | null } | null = null;

// Thumbnail cache
const thumbnailCache = new Map<string, HTMLImageElement>();

export function getRankingData() {
  return { scores: cachedScores, loading, error, scrollOffset, selectedScreenshot };
}

export async function loadRanking(): Promise<void> {
  if (loading) return;
  loading = true;
  error = false;
  scrollOffset = 0;
  selectedScreenshot = null;

  try {
    cachedScores = await fetchTopScores(MAX_RANKING_ENTRIES);
    // Start loading thumbnails
    for (const entry of cachedScores) {
      if (!thumbnailCache.has(entry.screenshotUrl)) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = entry.screenshotUrl;
        thumbnailCache.set(entry.screenshotUrl, img);
      }
    }
  } catch {
    error = true;
    cachedScores = [];
  } finally {
    loading = false;
  }
}

export function getThumbnail(url: string): HTMLImageElement | null {
  const img = thumbnailCache.get(url);
  if (img && img.complete && img.naturalWidth > 0) return img;
  return null;
}

export function scrollRanking(delta: number): void {
  const maxScroll = Math.max(0, cachedScores.length * 50 - 350);
  scrollOffset = Math.max(0, Math.min(maxScroll, scrollOffset + delta));
}

export function selectScreenshot(url: string): void {
  const img = thumbnailCache.get(url) ?? null;
  selectedScreenshot = { url, img };
}

export function closeScreenshot(): void {
  selectedScreenshot = null;
}

export function resetRanking(): void {
  scrollOffset = 0;
  selectedScreenshot = null;
}
