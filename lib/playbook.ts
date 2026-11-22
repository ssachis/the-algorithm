// "Your playbook": concrete, computed-only advice from the Shorts that broke out.
import type { AnalyzeResponse, Video } from "./types";
import { extractHashtags, formatX } from "./score";

export type Playbook = {
  breakouts: Video[];
  hooks: { text: string; v: Video }[];
  length: { theirs: number; yours: number } | null;
  timing: string | null;
  hashtags: string[];
  experiment: string;
  basis: string;
};

const median = (xs: number[]) => {
  const s = xs.slice().sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : 0;
};

export function buildPlaybook(data: AnalyzeResponse): Playbook {
  const { original, similar, verdict } = data;
  const ranked = similar
    .filter((v) => v.outperformance != null)
    .sort((a, b) => (b.outperformance ?? 0) - (a.outperformance ?? 0));
  let breakouts = ranked.filter((v) => (v.outperformance ?? 0) >= 1.5).slice(0, 5);
  if (breakouts.length < 2) breakouts = ranked.slice(0, 3);

  const hooks = breakouts.slice(0, 3).map((v) => {
    const clean = v.title.replace(/#\w+/g, "").replace(/\s+/g, " ").trim();
    const words = clean.split(" ");
    return { text: words.slice(0, 7).join(" ") + (words.length > 7 ? "…" : ""), v };
  });

  const length =
    breakouts.length >= 2
      ? { theirs: Math.round(median(breakouts.map((v) => v.durationSec))), yours: original.durationSec }
      : null;

  // Posting day/time in New York time (where we're demoing); only if the breakouts agree.
  let timing: string | null = null;
  if (breakouts.length >= 3) {
    const parts = breakouts.map((v) => {
      const d = new Date(v.publishedAt);
      const day = d.toLocaleString("en-US", { timeZone: "America/New_York", weekday: "short" });
      const hour = Number(d.toLocaleString("en-US", { timeZone: "America/New_York", hour: "numeric", hour12: false }));
      return { day, hour };
    });
    const weekend = parts.filter((p) => p.day === "Sat" || p.day === "Sun").length;
    const evening = parts.filter((p) => p.hour >= 16 && p.hour <= 22).length;
    const morning = parts.filter((p) => p.hour >= 5 && p.hour < 12).length;
    const n = parts.length;
    const when =
      evening / n >= 0.6 ? "in the late afternoon or evening" : morning / n >= 0.6 ? "in the morning" : null;
    const days = weekend / n >= 0.6 ? "on weekends" : weekend === 0 ? "on weekdays" : null;
    if (when || days) timing = `${parts.length >= 4 ? "Most" : "These"} breakouts went up ${[days, when].filter(Boolean).join(", ")} (ET).`;
  }

  const mine = new Set(original.hashtags);
  const counts = new Map<string, number>();
  breakouts.forEach((v) =>
    (v.hashtags.length ? v.hashtags : extractHashtags(v.title)).forEach((h) => counts.set(h, (counts.get(h) ?? 0) + 1))
  );
  const hashtags = Array.from(counts.entries())
    .filter(([h, c]) => !mine.has(h) && c >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([h]) => h)
    .slice(0, 4);

  const basis = `Based on ${breakouts.length} Shorts that did ${formatX(
    breakouts[breakouts.length - 1]?.outperformance ?? null
  )} or more of their creator's usual.`;

  return { breakouts, hooks, length, timing, hashtags, experiment: verdict.nextExperiment, basis };
}
