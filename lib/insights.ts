// Plain-language facts computed ONLY from returned numbers. No guessing.
import type { Video } from "./types";
import { extractHashtags, formatCount, formatX, keywords } from "./score";

const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = xs.slice().sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const days = (a: string, b: string) => Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86_400_000);

export function topOutperformers(videos: Video[], n = 5): Video[] {
  return videos
    .filter((v) => v.outperformance != null)
    .sort((a, b) => (b.outperformance ?? 0) - (a.outperformance ?? 0))
    .slice(0, n);
}

export function observedFacts(original: Video, similar: Video[]): string[] {
  const facts: string[] = [];
  const top = topOutperformers(similar);
  const ops = similar.map((v) => v.outperformance).filter((x): x is number => x != null);
  if (original.outperformance != null && ops.length) {
    facts.push(
      `Your Short got ${formatX(original.outperformance)} ${original.baselineMedian ? "your usual views" : "your subscriber count"}. The median similar Short got ${formatX(median(ops))} its creator's usual.`
    );
  }
  if (top.length >= 3) {
    const d = Math.round(median(top.map((v) => v.durationSec)));
    facts.push(`The ${top.length} strongest relative performers run a median of ${d}s. Yours runs ${original.durationSec}s.`);
    const gap = Math.round(median(top.map((v) => days(original.publishedAt, v.publishedAt))));
    if (gap !== 0) {
      facts.push(
        gap > 0
          ? `You posted about ${gap} days after the median top performer.`
          : `You posted about ${-gap} days before the median top performer.`
      );
    }
    facts.push(
      `Top performers gain a median of ${formatCount(median(top.map((v) => v.viewsPerDay)))} views a day; yours gains ${formatCount(original.viewsPerDay)}.`
    );
  }
  facts.push(`Compared against ${similar.length} similar Shorts found by title and hashtag overlap.`);
  return facts;
}

/** Why a video was picked as similar: shared hashtags and title words. */
export function sharedTerms(a: Video, b: Video): { tags: string[]; words: string[] } {
  const ta = new Set(a.hashtags.length ? a.hashtags : extractHashtags(a.title));
  const tags = (b.hashtags.length ? b.hashtags : extractHashtags(b.title)).filter(
    (t) => ta.has(t) && extractHashtags(t).length > 0
  );
  const ka = keywords(a.title);
  const words = Array.from(keywords(b.title)).filter((w) => ka.has(w));
  return { tags, words };
}

/** "Vs yours": a few factual differences between a similar Short and the creator's own. Observed only. */
export function versusYours(original: Video, v: Video): string[] {
  const out: string[] = [];

  if (Math.abs(v.durationSec - original.durationSec) >= 3) {
    out.push(`${v.durationSec}s long, yours is ${original.durationSec}s`);
  }

  const when = (iso: string) => {
    const d = new Date(iso);
    const day = d.toLocaleString("en-US", { timeZone: "America/New_York", weekday: "short" });
    const h = Number(d.toLocaleString("en-US", { timeZone: "America/New_York", hour: "numeric", hour12: false })) % 24;
    const part = h >= 5 && h < 12 ? "morning" : h >= 12 && h < 17 ? "afternoon" : h >= 17 && h < 22 ? "evening" : "night";
    return `${day} ${part}`;
  };
  const theirs = when(v.publishedAt);
  const yours = when(original.publishedAt);
  if (theirs !== yours) out.push(`Posted ${theirs}, yours ${yours} (ET)`);

  const mine = new Set(original.hashtags.length ? original.hashtags : extractHashtags(original.title));
  const extra = (v.hashtags.length ? v.hashtags : extractHashtags(v.title)).filter((t) => !mine.has(t)).slice(0, 3);
  if (extra.length) out.push(`Tags you didn't use: ${extra.join(" ")}`);

  const rate = (x: Video) => (x.likes != null && x.views > 0 ? (x.likes / x.views) * 100 : null);
  const r1 = rate(v);
  const r2 = rate(original);
  if (r1 != null && r2 != null) out.push(`${r1.toFixed(1)}% likes per view, yours ${r2.toFixed(1)}%`);

  return out;
}
