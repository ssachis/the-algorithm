// FICTIONAL demo data so the UI works before the APIs are wired.
// Shape matches lib/types.ts exactly. Replace with live data from /api/analyze.
import type { AnalyzeResponse, Video } from "./types";
import { outperformance, similarity, viewsPerDay } from "./score";

type Raw = Omit<Video, "similarity" | "outperformance" | "viewsPerDay" | "url" | "thumbnail">;

const NOW = new Date("2026-11-22T12:00:00Z").getTime();
const daysAgo = (d: number) => new Date(NOW - d * 86_400_000).toISOString();

const original: Raw = {
  id: "demo-original",
  title: "My 5AM morning routine as a broke grad student #5amclub #morningroutine",
  channelTitle: "you",
  channelId: "c0",
  publishedAt: daysAgo(6),
  durationSec: 34,
  views: 842,
  likes: 61,
  comments: 4,
  subscribers: 310,
  hashtags: ["#5amclub", "#morningroutine"],
};

const raw: Raw[] = [
  ["5AM morning routine that actually works #5amclub #morningroutine", "Ria Builds", 920, 48_200, 3_900, 9, 31],
  ["My realistic 5AM routine (no cold plunge) #morningroutine", "Dev & Coffee", 2_400, 31_500, 2_100, 12, 41],
  ["5am club for one week — honest results #5amclub", "Noor Daily", 180_000, 210_000, 9_800, 20, 58],
  ["That girl 5AM morning routine #thatgirl #morningroutine", "Aesthetic Ana", 640_000, 390_000, 21_000, 15, 27],
  ["Waking up at 5AM as a student #studentlife #5amclub", "Kofi Studies", 1_100, 14_800, 1_350, 8, 36],
  ["5AM routine but I'm a night owl #morningroutine #comedy", "Sam Sketches", 4_800, 96_000, 11_200, 10, 22],
  ["Productive 5AM morning in NYC #nyc #morningroutine", "Lena in NYC", 22_000, 18_400, 1_100, 25, 45],
  ["5AM morning routine for founders #5amclub #startup", "Arjun Ships", 7_600, 6_100, 380, 31, 52],
  ["The 5AM club ruined my life #5amclub", "Mia Talks", 51_000, 402_000, 28_500, 18, 39],
  ["Slow 5AM morning routine #slowliving #morningroutine", "Quiet Hours", 13_000, 9_200, 640, 40, 47],
  ["5AM gym routine before work #5amclub #gym", "Lift with Leo", 88_000, 44_000, 2_300, 5, 29],
  ["Morning routine 5AM edition #morningroutine", "Priya Plans", 640, 2_900, 210, 3, 33],
  ["I tried the 5AM club for 30 days #5amclub", "Ben Experiments", 310_000, 280_000, 15_400, 45, 59],
  ["5AM routine in a tiny apartment #morningroutine #nyc", "Small Space Sofi", 3_300, 27_800, 2_600, 14, 30],
  ["Why I quit waking up at 5AM #5amclub", "Jules Rethinks", 9_400, 5_800, 520, 7, 51],
].map(([title, channelTitle, subscribers, views, likes, days, dur], i) => ({
  id: `demo-${i + 1}`,
  title: title as string,
  channelTitle: channelTitle as string,
  channelId: `c${i + 1}`,
  publishedAt: daysAgo(days as number),
  durationSec: dur as number,
  views: views as number,
  likes: likes as number,
  comments: Math.round((likes as number) / 18),
  subscribers: subscribers as number,
  hashtags: ((title as string).match(/#\w+/g) ?? []).map((h) => h.toLowerCase()),
}));

function enrich(v: Raw, ref: Raw): Video {
  return {
    ...v,
    url: `https://youtube.com/shorts/${v.id}`,
    thumbnail: null,
    similarity: v.id === ref.id ? 1 : similarity(ref, v),
    outperformance: outperformance(v.views, v.subscribers),
    viewsPerDay: viewsPerDay(v.views, v.publishedAt, NOW),
  };
}

export const mockResponse: AnalyzeResponse = {
  query: "5AM morning routine",
  original: enrich(original, original),
  similar: raw.map((v) => enrich(v, original)),
  verdict: {
    trend: {
      summary:
        "Demo text: 5AM-routine videos keep resurfacing every November as people reset habits before the new year, and the 'honest results' / 'I quit' counter-takes are currently outperforming the aesthetic versions.",
      sources: [
        { title: "Example source (replace with You.com citation)", url: "https://you.com" },
        { title: "Example source two", url: "https://you.com" },
      ],
    },
    breakoutPatterns: [
      "Top outperformers open with a result or a twist in the first line (\"ruined my life\", \"for one week\").",
      "They frame it as an experiment with a verdict, not a routine to copy.",
      "Most run 45–60s — longer than the aesthetic versions — because the story needs a payoff.",
    ],
    timing:
      "Your Short landed in the middle of the wave: early enough, but after the 'experiment' angle had already taken over.",
    unknowns: [
      "Retention, impressions and traffic sources are private to each creator.",
      "We can't see audience demographics or how YouTube distributed each Short.",
      "Some of the gap is unexplained variation — we don't call it luck.",
    ],
    nextExperiment:
      "Re-cut the same footage as a 7-day experiment with a verdict in the first two seconds, and post it within the next week while the counter-take wave is still rising.",
  },
  generatedAt: new Date(NOW).toISOString(),
  source: "mock",
};
