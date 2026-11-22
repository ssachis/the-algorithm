import type { Video } from "./types";

/** Floor small channels at 100 subs so tiny accounts don't explode the scale. */
export const SUB_FLOOR = 100;

export function outperformance(views: number, subscribers: number | null): number | null {
  if (subscribers == null) return null;
  return views / Math.max(subscribers, SUB_FLOOR);
}

export function viewsPerDay(views: number, publishedAt: string, now = Date.now()): number {
  const days = Math.max((now - new Date(publishedAt).getTime()) / 86_400_000, 1);
  return views / days;
}

const STOP = new Set(
  "the a an and or of to in on for with my your i me is are this that it at by from how what why shorts short".split(" ")
);

export function keywords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/#\w+/g, " ")
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP.has(w))
  );
}

/** Hashtags that say nothing about the idea; ignored for similarity. */
const GENERIC_TAGS = new Set([
  "#shorts", "#short", "#youtubeshorts", "#ytshorts", "#viral", "#viralshorts", "#viralvideo", "#fyp", "#foryou",
  "#foryoupage", "#trending", "#trend", "#explore", "#explorepage", "#reels", "#subscribe", "#youtube", "#tiktok",
]);

export function extractHashtags(text: string): string[] {
  return Array.from(new Set((text.match(/#\w+/g) ?? []).map((h) => h.toLowerCase()))).filter(
    (h) => !GENERIC_TAGS.has(h)
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size && !b.size) return 0;
  let inter = 0;
  a.forEach((x) => b.has(x) && inter++);
  return inter / (a.size + b.size - inter);
}

/** 0.5 title keywords + 0.3 hashtags + 0.2 length closeness. */
export function similarity(
  a: Pick<Video, "title" | "hashtags" | "durationSec">,
  b: Pick<Video, "title" | "hashtags" | "durationSec">
): number {
  const k = jaccard(keywords(a.title), keywords(b.title));
  const h = jaccard(new Set(a.hashtags), new Set(b.hashtags));
  const d = 1 - Math.min(Math.abs(a.durationSec - b.durationSec) / 60, 1);
  return Math.round((0.5 * k + 0.3 * h + 0.2 * d) * 1000) / 1000;
}

/** ISO 8601 duration (PT1M5S) → seconds. */
export function parseDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}

export function formatCount(n: number | null): string {
  if (n == null) return "hidden";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, "") + "K";
  return String(Math.round(n));
}

export function formatX(x: number | null): string {
  if (x == null) return "—";
  if (x >= 10) return `${Math.round(x)}×`;
  return `${x.toFixed(1)}×`;
}

/** Project-defined labels (not YouTube categories). */
export type PerfLevel = "below" | "around" | "strong" | "outlier" | "na";
export function perfLevel(x: number | null): PerfLevel {
  if (x == null) return "na";
  if (x < 0.5) return "below";
  if (x < 1.5) return "around";
  if (x <= 3) return "strong";
  return "outlier";
}
export const PERF_LABEL: Record<PerfLevel, string> = {
  below: "Below usual",
  around: "Around usual",
  strong: "Strong",
  outlier: "Outlier",
  na: "No baseline",
};
export const PERF_DEFINITION =
  "Relative performance = views ÷ the creator's median views on their recent Shorts (or ÷ subscribers when that isn't available). A rough comparison, not a ranking signal.";

/** Short label for what the relative number is measured against. */
export function perfUnit(v: { baselineMedian?: number | null }): string {
  return v.baselineMedian ? "vs. their usual" : "views ÷ subscribers";
}
export function perfDefinition(v: { baselineMedian?: number | null; baselineN?: number }): string {
  return v.baselineMedian
    ? `Views ÷ this creator's median (${formatCount(v.baselineMedian)}) across their last ${v.baselineN} Shorts. A rough comparison, not a ranking signal.`
    : "Views ÷ subscribers (we couldn't get enough recent Shorts for this creator). A rough comparison, not a ranking signal.";
}
