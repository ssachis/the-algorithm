"use client";
import { useEffect, useState } from "react";
import DropInput from "@/components/DropInput";
import Rings from "@/components/Rings";
import RippleMap, { type Mode } from "@/components/RippleMap";
import ModeToggle from "@/components/ModeToggle";
import VideoPanel from "@/components/VideoPanel";
import VideoList, { SORTS, type Sort } from "@/components/VideoList";
import Verdict from "@/components/Verdict";
import type { AnalyzeResponse } from "@/lib/types";

type Phase = "idle" | "loading" | "done";

const LOADING_LINES = [
  "Reading the original video…",
  "Looking for related videos…",
  "Comparing creator baselines…",
  "Preparing your comparison…",
];

const DEMO_URL = "https://youtube.com/shorts/demo";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("views");
  const [view, setView] = useState<"map" | "list">("map");
  const [sort, setSort] = useState<Sort>("similar");
  const [selectedId, setSelectedId] = useState<string>("");
  const [line, setLine] = useState(0);

  useEffect(() => {
    if (phase !== "loading") return;
    const t = setInterval(() => setLine((l) => (l + 1) % LOADING_LINES.length), 1400);
    return () => clearInterval(t);
  }, [phase]);

  async function analyze(url: string) {
    setError(null);
    setPhase("loading");
    setLine(0);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong.");
      const d = json as AnalyzeResponse;
      setData(d);
      setSelectedId(d.original.id);
      setMode("views");
      setView("map");
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setPhase("idle");
    }
  }

  const all = data ? [data.original, ...data.similar] : [];
  const selected = all.find((v) => v.id === selectedId) ?? data?.original;

  return (
    <main className="shell">
      <header className="topbar">
        <a
          href="/"
          className="wordmark serif"
          onClick={(e) => {
            e.preventDefault();
            setPhase("idle");
            setData(null);
          }}
        >
          wave<span>.</span>
        </a>
        <span className="eyebrow">Creator intelligence</span>
      </header>

      {phase === "idle" && (
        <section className="hero">
          <div className="hero-rings">
            <Rings size={980} />
          </div>
          <div className="hero-inner rise">
            <span className="eyebrow">Same idea. Different outcomes.</span>
            <h1 className="serif">
              Your idea didn&apos;t
              <br />
              <em>stop with you.</em>
            </h1>
            <p className="lede">
              Find Shorts built around a similar idea, compare how they performed against their creators&apos;
              usual reach, and see what the public data can actually tell you.
            </p>
            <DropInput onSubmit={analyze} />
            {error && <div className="error">{error}</div>}
            <div style={{ marginTop: 18 }}>
              <button className="linkbtn" onClick={() => analyze(DEMO_URL)}>
                or see an example
              </button>
            </div>
          </div>
        </section>
      )}

      {phase === "loading" && (
        <section className="loading">
          <div>
            <Rings size={260} />
            <p className="serif" style={{ fontSize: 24 }}>{LOADING_LINES[line]}</p>
          </div>
        </section>
      )}

      {phase === "done" && data && selected && (
        <>
          <div className="results-head rise">
            <div>
              <span className="eyebrow">
                {data.similar.length} Shorts on &ldquo;{data.query}&rdquo;
                {data.source === "mock" ? " · illustrative demo data" : ""}
              </span>
              <h2 className="serif">
                Your idea made waves.
                <br />
                <span className="faint">Here&apos;s where it travelled.</span>
              </h2>
            </div>
          </div>

          <div className="grid">
            <div className="card map-wrap rise">
              <div className="controls">
                <div className="chips">
                  <button className="chip" aria-pressed={view === "map"} onClick={() => setView("map")}>
                    Ripples
                  </button>
                  <button className="chip" aria-pressed={view === "list"} onClick={() => setView("list")}>
                    List
                  </button>
                </div>
                {view === "map" ? (
                  <ModeToggle mode={mode} onChange={setMode} />
                ) : (
                  <div className="chips">
                    {SORTS.map((s) => (
                      <button key={s.id} className="chip" aria-pressed={sort === s.id} onClick={() => setSort(s.id)}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {view === "map" ? (
                <RippleMap
                  original={data.original}
                  videos={data.similar}
                  mode={mode}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              ) : (
                <VideoList videos={data.similar} sort={sort} selectedId={selectedId} onSelect={setSelectedId} />
              )}
            </div>
            <VideoPanel key={selected.id} video={selected} original={data.original} />
          </div>

          <Verdict verdict={data.verdict} original={data.original} videos={data.similar} />

          <p className="footer">
            Public metrics only. We never claim to know YouTube&apos;s internal ranking. Trend context powered by
            You.com.
          </p>
        </>
      )}
    </main>
  );
}
