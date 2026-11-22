"use client";
import { useEffect, useState } from "react";
import DropInput from "@/components/DropInput";
import { WaveLoader, WaveMotif } from "@/components/WaveMotif";
import { type Mode } from "@/components/RippleMap";
import CurrentCanvas, { ShortCard } from "@/components/CurrentCanvas";
import ModeToggle from "@/components/ModeToggle";
import VideoPanel from "@/components/VideoPanel";
import VideoList, { SORTS, type Sort } from "@/components/VideoList";
import Verdict from "@/components/Verdict";
import HowItWorks from "@/components/HowItWorks";
import Logo from "@/components/Logo";
import ShareCard from "@/components/ShareCard";
import { TwinCard } from "@/components/Sources";
import type { AnalyzeResponse } from "@/lib/types";

type Phase = "idle" | "loading" | "done";

const LOADING_LINES = [
  "Reading the original video…",
  "Looking for related videos…",
  "Comparing creator baselines…",
  "Laying out your content landscape…",
];

const DEMO_URL = "https://youtube.com/shorts/demo";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [data, setData] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("views");
  const [view, setView] = useState<"waves" | "grid" | "list">("waves");
  const [sort, setSort] = useState<Sort>("similar");
  const [selectedId, setSelectedId] = useState<string>("");
  const [showWhy, setShowWhy] = useState(false);
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
      setSelectedId(""); // nothing selected by default: the canvas uses the full width
      setShowWhy(false);
      setMode("views");
      setView("waves");
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setPhase("idle");
    }
  }

  const all = data ? [data.original, ...data.similar] : [];
  const selected = all.find((v) => v.id === selectedId) ?? null;

  // Esc closes the inspector.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedId("");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main className="shell">
      {phase !== "done" && (
      <header className="topbar">
        <a
          href="/"
          className="wordmark"
          onClick={(e) => {
            e.preventDefault();
            setPhase("idle");
            setData(null);
          }}
        >
          <Logo />
        </a>
        <span className="eyebrow">Creator intelligence</span>
      </header>
      )}

      {phase === "idle" && (
        <section className="hero">
          <div className="hero-rings">
            <WaveMotif width={980} height={420} />
          </div>
          <div className="hero-inner rise">
            <span className="eyebrow">Every idea makes waves.</span>
            <h1 className="serif">
              See where your idea
              <br />
              <em>travels.</em>
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
      {phase === "idle" && <HowItWorks />}

      {phase === "loading" && (
        <section className="loading">
          <div>
            <WaveLoader width={260} />
            <p className="serif" style={{ fontSize: 24 }}>{LOADING_LINES[line]}</p>
          </div>
        </section>
      )}

      {phase === "done" && data && (
        <div className="fs">
          <header className="fs-top">
            <a
              href="/"
              className="wordmark"
              onClick={(e) => {
                e.preventDefault();
                setPhase("idle");
                setData(null);
              }}
            >
              <Logo />
            </a>
            <span className="fs-query" />
            <nav className="fs-actions">
              <button className="ghost" aria-pressed={showWhy} onClick={() => setShowWhy((v) => !v)}>
                Why
              </button>
              <ShareCard data={data} mode={mode} />
              <button
                className="ghost"
                onClick={() => {
                  setPhase("idle");
                  setData(null);
                }}
              >
                New
              </button>
            </nav>
          </header>

          <div className={`fs-body ${selected ? "with-inspector" : ""}`}>
            <div className="fs-canvas">
              {view === "waves" ? (
                <CurrentCanvas
                  original={data.original}
                  videos={data.similar}
                  mode={mode}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              ) : view === "grid" ? (
                <div className="waves-grid">
                  {[data.original, ...data.similar].map((v) => (
                    <ShortCard
                      key={v.id}
                      v={v}
                      mode={mode}
                      selected={selectedId === v.id}
                      isOrigin={v.id === data.original.id}
                      onClick={() => setSelectedId(v.id)}
                    />
                  ))}
                </div>
              ) : (
                <VideoList videos={data.similar} sort={sort} selectedId={selectedId} onSelect={setSelectedId} />
              )}


              <div className="dock" role="toolbar" aria-label="View options">
                <div className="dock-seg">
                  {(["waves", "grid", "list"] as const).map((v) => (
                    <button key={v} aria-pressed={view === v} onClick={() => setView(v)}>
                      {v[0].toUpperCase() + v.slice(1)}
                    </button>
                  ))}
                </div>
                <span className="dock-sep" />
                {view !== "list" ? (
                  <ModeToggle mode={mode} onChange={setMode} />
                ) : (
                  <div className="dock-seg">
                    {SORTS.map((s) => (
                      <button key={s.id} aria-pressed={sort === s.id} onClick={() => setSort(s.id)}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {selected && (
              <aside className="fs-inspector" aria-label="Selected Short">
                <button className="fs-close" onClick={() => setSelectedId("")} aria-label="Close inspector">
                  ×
                </button>
                <VideoPanel key={selected.id} video={selected} original={data.original} />
              </aside>
            )}
          </div>

          {showWhy && (
            <div className="sheet" role="dialog" aria-label="Why these outcomes differ">
              <button className="fs-close" onClick={() => setShowWhy(false)} aria-label="Close">
                ×
              </button>
              <TwinCard twins={data.elsewhere} />
              <Verdict verdict={data.verdict} original={data.original} videos={data.similar} />
              <p className="footer">
                Public metrics only. We never claim to know YouTube&apos;s internal ranking. Trend context powered by
                You.com.
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
