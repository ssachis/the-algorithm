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
      `Your Short's views are ${formatX(original.outperformance)} its channel's subscribers. The median similar Short sits at ${formatX(median(ops))}.`
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
