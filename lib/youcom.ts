// You.com integration: trend context + grounded verdict.
// Server-only. Reads YOUCOM_API_KEY from the environment; never import this in a client component.
// Owner: Khyati (issue #4). Pure interface so Melody can call it from /api/analyze.
import type { Source, Verdict, Video } from "./types";
import { formatX } from "./score";

const SEARCH_URL = "https://ydc-index.io/v1/search";
const RESEARCH_URL = "https://api.you.com/v1/research";
const TIMEOUT_MS = 12_000;
const MAX_INPUT_CHARS = 40_000;

const EMPTY_TREND: { summary: string; sources: Source[] } = { summary: "", sources: [] };

const UNKNOWNS_FALLBACK = [
  "Retention, impressions and traffic sources are private to each creator.",
  "We can't see audience demographics or how YouTube distributed each Short.",
  "Some of the gap is unexplained variation; we don't call it luck.",
];

export type VerdictInput = { query: string; original: Video; similar: Video[] };

// ---------- public API ----------

/** Why the idea is moving right now: a 2–3 sentence summary plus up to 4 cited sources. */
export async function trendContext(query: string): Promise<{ summary: string; sources: Source[] }> {
  const key = apiKey();
  if (!key) return EMPTY_TREND;

  const [searchJson, answer] = await Promise.all([
    post(SEARCH_URL, key, { query: `${query} trend news`, count: 5 }),
    post(RESEARCH_URL, key, {
      input: clip(
        `In 2–3 plain sentences, explain why the short-video idea "${query}" is getting attention right now. ` +
          `Only state what sources say. Do not speculate about YouTube's algorithm.`
      ),
      research_effort: "lite",
    }),
  ]);

  const sources = dedupe([...asSources(pickHits(searchJson)), ...asSources(answer?.output?.sources)]).slice(0, 4);
  const summary = typeof answer?.output?.content === "string" ? answer.output.content.trim() : "";

  if (!summary || sources.length === 0) return EMPTY_TREND;
  return { summary, sources };
}

/** Builds the Verdict from computed numbers. Falls back to a numbers-only verdict on any failure. */
export async function buildVerdict(input: VerdictInput): Promise<Verdict> {
  const stats = computeStats(input);
  const fallback = fallbackVerdict(input, stats);
  const key = apiKey();

  const [trend, answer] = await Promise.all([
    trendContext(input.query),
    key ? post(RESEARCH_URL, key, { input: clip(verdictPrompt(input, stats)), research_effort: "standard" }) : null,
  ]);

  const parsed = parseVerdict(answer?.output?.content);
  if (!parsed) return { ...fallback, trend };

  return {
    trend,
    breakoutPatterns: fit(parsed.breakoutPatterns, fallback.breakoutPatterns, 3),
    timing: parsed.timing ?? fallback.timing,
    unknowns: fit(parsed.unknowns, UNKNOWNS_FALLBACK, 3, 2),
    nextExperiment: parsed.nextExperiment ?? fallback.nextExperiment,
  };
}

/** Where the same idea is showing up outside YouTube right now (TikTok, Instagram, Reddit, news). */
export async function elsewhere(
  query: string
): Promise<{ platform: string; title: string; url: string; snippet?: string }[]> {
  const key = apiKey();
  if (!key) return [];
  const json = await post(SEARCH_URL, key, {
    query: `${query} tiktok OR instagram reels OR reddit trend`,
    count: 10,
  });
  const platformOf = (u: string) => {
    const h = new URL(u).hostname.replace(/^www\./, "");
    if (h.includes("tiktok")) return "TikTok";
    if (h.includes("instagram")) return "Instagram";
    if (h.includes("reddit")) return "Reddit";
    if (h.includes("x.com") || h.includes("twitter")) return "X";
    if (h.includes("pinterest")) return "Pinterest";
    return "Web";
  };
  const seen = new Set<string>();
  return asSources([...pickHits(json), ...pickHits(json?.results?.news ? { results: json.results.news } : null)])
    .filter((s) => !/youtube\.com|youtu\.be/.test(s.url))
    .map((s) => ({ ...s, platform: platformOf(s.url) }))
    .filter((s) => (seen.has(s.url) ? false : (seen.add(s.url), true)))
    .sort((a, b) => (a.platform === "Web" ? 1 : 0) - (b.platform === "Web" ? 1 : 0))
    .slice(0, 6);
}

// ---------- numbers (shared by prompt and fallback) ----------

type Stats = {
  top: Video[];
  bottom: Video[];
  topMedianOp: number | null;
  bottomMedianOp: number | null;
  topMedianDuration: number | null;
  bottomMedianDuration: number | null;
  topMedianViewsPerDay: number | null;
  bottomMedianViewsPerDay: number | null;
  topMedianPublished: number | null;
};

function computeStats({ similar }: VerdictInput): Stats {
  const ranked = similar.filter((v) => v.outperformance != null).sort((a, b) => (b.outperformance ?? 0) - (a.outperformance ?? 0));
  const top = ranked.slice(0, 5);
  const bottom = ranked.slice(-5).reverse();
  const ops = (vs: Video[]) => median(vs.map((v) => v.outperformance ?? 0));
  return {
    top,
    bottom,
    topMedianOp: ops(top),
    bottomMedianOp: ops(bottom),
    topMedianDuration: median(top.map((v) => v.durationSec)),
    bottomMedianDuration: median(bottom.map((v) => v.durationSec)),
    topMedianViewsPerDay: median(top.map((v) => v.viewsPerDay)),
    bottomMedianViewsPerDay: median(bottom.map((v) => v.viewsPerDay)),
    topMedianPublished: median(top.map((v) => new Date(v.publishedAt).getTime())),
  };
}

function fallbackVerdict(input: VerdictInput, s: Stats): Verdict {
  const { original } = input;
  const patterns: string[] = [];

  if (s.topMedianOp != null) {
    patterns.push(
      `The top ${s.top.length} outperformers beat their creators' usual reach by a median of ${formatX(s.topMedianOp)}.`
    );
  }
  if (s.topMedianDuration != null && s.bottomMedianDuration != null) {
    patterns.push(
      `Top outperformers' median length is ${Math.round(s.topMedianDuration)}s, against ${Math.round(s.bottomMedianDuration)}s for the bottom ${s.bottom.length}.`
    );
  }
  if (s.topMedianViewsPerDay != null && s.bottomMedianViewsPerDay != null) {
    patterns.push(
      `Top outperformers collect about ${Math.round(s.topMedianViewsPerDay)} views a day, against ${Math.round(s.bottomMedianViewsPerDay)} for the bottom ${s.bottom.length}.`
    );
  }

  return {
    trend: EMPTY_TREND,
    breakoutPatterns: fit(patterns, ["Not enough outperformance data to compare breakouts yet."], 3),
    timing: timingLine(original, s),
    unknowns: UNKNOWNS_FALLBACK,
    nextExperiment: `Re-cut your idea at about ${Math.round(s.topMedianDuration ?? original.durationSec)} seconds, post it this week, and compare its reach with these numbers after seven days.`,
  };
}

/** Early / peak / late, by where the original's post date falls against the top five breakouts. */
function timingLine(original: Video, s: Stats): string {
  if (s.topMedianPublished == null) {
    return "Not enough dated outperformers to say where your Short landed.";
  }
  const t0 = new Date(original.publishedAt).getTime();
  const weekMs = 7 * 86_400_000;
  const label = t0 < s.topMedianPublished - weekMs ? "early" : t0 > s.topMedianPublished + weekMs ? "late" : "peak";
  const date = new Date(s.topMedianPublished).toISOString().slice(0, 10);
  return `${cap(label)}: your Short went up ${label === "peak" ? "around" : label === "early" ? "before" : "after"} the median breakout (${date}).`;
}

// ---------- prompt ----------

function verdictPrompt(input: VerdictInput, s: Stats): string {
  const row = (v: Video) => ({
    title: v.title.replace(/#\w+/g, "").trim(),
    channel: v.channelTitle,
    durationSec: v.durationSec,
    publishedAt: v.publishedAt.slice(0, 10),
    outperformance: v.outperformance == null ? null : Number(v.outperformance.toFixed(2)),
  });
  const data = {
    idea: input.query,
    original: { ...row(input.original), views: input.original.views },
    topFive: s.top.map(row),
    bottomFive: s.bottom.map(row),
  };
  return [
    "You are writing a short creator briefing about one YouTube Shorts idea.",
    "Use ONLY the numbers in the data below. Outperformance = views divided by the creator's median views on their recent Shorts (or by subscribers when unavailable).",
    "Separate observed facts from possible explanations. Never invent retention, impressions or audience data.",
    "Never claim to know YouTube's internal algorithm. If something cannot be known from public data, say so under unknowns.",
    "Return ONLY a JSON object with these keys:",
    '  "breakoutPatterns": exactly 3 short strings (what the top five share),',
    '  "timing": one sentence: "early", "peak" or "late" and why,',
    '  "unknowns": 2 or 3 short strings,',
    '  "nextExperiment": one concrete, testable sentence.',
    "",
    "DATA:",
    JSON.stringify(data),
  ].join("\n");
}

function parseVerdict(content: unknown): {
  breakoutPatterns: string[];
  timing?: string;
  unknowns: string[];
  nextExperiment?: string;
} | null {
  if (typeof content !== "string") return null;
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const j = JSON.parse(content.slice(start, end + 1)) as Record<string, unknown>;
    return {
      breakoutPatterns: strings(j.breakoutPatterns),
      timing: nonEmpty(j.timing),
      unknowns: strings(j.unknowns),
      nextExperiment: nonEmpty(j.nextExperiment),
    };
  } catch {
    return null;
  }
}

// ---------- You.com HTTP ----------

function apiKey(): string | null {
  return process.env.YOUCOM_API_KEY?.trim() || null;
}

/** POST a JSON body. Returns parsed JSON, or null on any failure, timeout or non-2xx status. */
async function post(url: string, key: string, body: unknown): Promise<any | null> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "X-API-Key": key, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function pickHits(json: any): unknown[] {
  const r = json?.results;
  if (Array.isArray(r)) return r;
  if (Array.isArray(r?.web)) return r.web;
  if (Array.isArray(json?.hits)) return json.hits;
  if (Array.isArray(json?.web?.results)) return json.web.results;
  return [];
}

/** Keeps only entries with real http(s) URLs. Never invents a source. */
function asSources(raw: unknown): Source[] {
  if (!Array.isArray(raw)) return [];
  const out: Source[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const url = typeof o.url === "string" ? o.url.trim() : "";
    if (!isHttpUrl(url)) continue;
    const title = nonEmpty(o.title) ?? new URL(url).hostname;
    const snippet = nonEmpty(o.snippet) ?? nonEmpty(o.description);
    out.push(snippet ? { title, url, snippet } : { title, url });
  }
  return out;
}

function dedupe(sources: Source[]): Source[] {
  const seen = new Set<string>();
  return sources.filter((s) => (seen.has(s.url) ? false : (seen.add(s.url), true)));
}

// ---------- small helpers ----------

function isHttpUrl(u: string): boolean {
  try {
    const p = new URL(u);
    return p.protocol === "https:" || p.protocol === "http:";
  } catch {
    return false;
  }
}

function strings(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "").map((x) => x.trim()) : [];
}

function nonEmpty(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

/** Use the model's items first, then pad from the fallback, up to `max` (and at least `min`). */
function fit(items: string[], fallback: string[], max: number, min = max): string[] {
  const out = items.slice(0, max);
  for (const f of fallback) {
    if (out.length >= min) break;
    out.push(f);
  }
  return out;
}

function median(xs: number[]): number | null {
  const v = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

function clip(s: string): string {
  return s.length > MAX_INPUT_CHARS ? s.slice(0, MAX_INPUT_CHARS) : s;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
