// Shared data contract between backend (app/api/analyze) and the UI.
// Change this file only after telling the whole team.

export type Video = {
  id: string; // YouTube video id
  url: string;
  title: string;
  channelTitle: string;
  channelId: string;
  thumbnail: string | null;
  publishedAt: string; // ISO date
  durationSec: number;
  views: number;
  likes: number | null; // null when hidden
  comments: number | null; // null when disabled
  subscribers: number | null; // null when hidden
  hashtags: string[];
  // Computed by lib/score.ts
  similarity: number; // 0..1, 1 = the original video
  outperformance: number | null; // views / creator's median recent Short (fallback: views / max(subs, 100))
  baselineMedian?: number | null; // median views of the creator's recent Shorts
  baselineN?: number; // how many recent Shorts that median is based on
  viewsPerDay: number;
};

export type Source = {
  title: string;
  url: string;
  snippet?: string;
};

export type Verdict = {
  trend: {
    summary: string; // why this idea is moving right now (You.com)
    sources: Source[];
  };
  breakoutPatterns: string[]; // what the top outperformers share
  timing: string; // early / peak / late read
  unknowns: string[]; // what public data cannot tell us
  nextExperiment: string; // one concrete thing to try
};

// Optional (added for #33): the same idea found on other platforms, via You.com.
// Missing or empty means the card is hidden. Readers must not assume it is present.
export type Twin = {
  platform: string; // "TikTok" | "Instagram" | "Reddit" | "News" | "Web"
  title: string;
  url: string;
  snippet?: string;
};

export type AnalyzeResponse = {
  query: string; // the trend/idea we searched for
  original: Video;
  similar: Video[];
  verdict: Verdict;
  elsewhere?: Twin[]; // optional, up to 4 (see Twin)
  generatedAt: string;
  source: "live" | "cache" | "mock";
};
