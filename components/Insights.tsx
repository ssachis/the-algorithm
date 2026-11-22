"use client";
import type { Video } from "@/lib/types";
import { formatCount, formatX, perfLevel, PERF_LABEL } from "@/lib/score";

const DAY = 86_400_000;
const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = xs.slice().sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// Separate "Insights" view: is the idea rising or crowded, and how do creators your size do with it.
// Observed counts only; no guesses about YouTube's ranking.
export default function Insights({
  original,
  videos,
  selectedId,
  onSelect,
}: {
  original: Video;
  videos: Video[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const now = Date.now();
  const age = (v: Video) => (now - new Date(v.publishedAt).getTime()) / DAY;

  // --- Rising or crowded
  const last30 = videos.filter((v) => age(v) <= 30).length;
  const prev30 = videos.filter((v) => age(v) > 30 && age(v) <= 60).length;
  const old = videos.filter((v) => age(v) > 180).length;
  const pace =
    last30 >= 3 && last30 >= prev30 * 1.5
      ? "More of these were posted recently."
      : prev30 >= 3 && last30 <= prev30 * 0.5
        ? "Fewer of these were posted recently."
        : "Posting on this idea looks steady.";

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const n = videos.filter((v) => {
      const p = new Date(v.publishedAt);
      return `${p.getFullYear()}-${p.getMonth()}` === key;
    }).length;
    return { label: d.toLocaleString("en-US", { month: "short" }), n };
  });
  const peak = Math.max(1, ...months.map((m) => m.n));

  // --- Creators your size
  const subs = original.subscribers;
  const lo = subs != null ? Math.max(100, Math.round(subs * 0.3)) : 0;
  const hi = subs != null ? Math.round(subs * 3) : 0;
  const peers =
    subs == null
      ? []
      : videos
          .filter((v) => v.subscribers != null && v.subscribers >= lo && v.subscribers <= hi)
          .sort((a, b) => (b.outperformance ?? -1) - (a.outperformance ?? -1));
  const peerOps = peers.map((v) => v.outperformance).filter((x): x is number => x != null);

  return (
    <div className="insights">
      <section className="ins-sec rise">
        <span className="eyebrow">Rising or crowded</span>
        <h3 className="serif">{pace}</h3>
        <p className="ins-p">
          {last30} of {videos.length} similar Shorts were posted in the last 30 days, {prev30} in the 30 days before.
          {old > 0 && <> {old} are over 6 months old, so they may reflect an earlier wave.</>}
        </p>
        <div className="ins-bars" aria-label="Similar Shorts posted per month">
          {months.map((m) => (
            <div key={m.label} className="ins-bar">
              <span className="ins-n">{m.n}</span>
              <span className="ins-fill" style={{ height: `${(m.n / peak) * 100}%` }} />
              <span className="ins-m">{m.label}</span>
            </div>
          ))}
        </div>
        <p className="ins-note">Counts only the Shorts we found for this idea, not every upload on YouTube.</p>
      </section>

      <section className="ins-sec rise d1">
        <span className="eyebrow">Creators your size</span>
        {subs == null ? (
          <p className="ins-p">Your subscriber count is hidden, so we can&apos;t match you with creators your size.</p>
        ) : peers.length === 0 ? (
          <p className="ins-p">
            None of the similar Shorts come from channels near your size ({formatCount(lo)}–{formatCount(hi)}{" "}
            subscribers).
          </p>
        ) : (
          <>
            <h3 className="serif">
              {peers.length} {peers.length === 1 ? "creator" : "creators"} with {formatCount(lo)}–{formatCount(hi)}{" "}
              subscribers made this.
            </h3>
            <p className="ins-p">
              {peerOps.length > 0 && (
                <>
                  {peerOps.length === 1 ? "Theirs got" : "Their median result was"} {formatX(median(peerOps))} their
                  usual.{" "}
                </>
              )}
              {original.outperformance != null && <>Yours was {formatX(original.outperformance)}.</>}
            </p>
            <div className="list">
              {peers.map((v) => {
                const lvl = perfLevel(v.outperformance);
                return (
                  <button
                    key={v.id}
                    className={`row ${selectedId === v.id ? "selected" : ""}`}
                    onClick={() => onSelect(v.id)}
                  >
                    <div className="mini-thumb">{v.thumbnail && <img src={v.thumbnail} alt="" />}</div>
                    <div style={{ minWidth: 0 }}>
                      <div className="t">{v.title.replace(/#\w+/g, "").trim()}</div>
                      <div className="m">
                        {v.channelTitle} · {formatCount(v.subscribers)} subscribers · {formatCount(v.views)} views
                      </div>
                    </div>
                    <span className={`perf ${lvl}`}>{PERF_LABEL[lvl]}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
