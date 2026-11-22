"use client";
import { useState } from "react";
import type { Source, Twin } from "@/lib/types";

// Source chips: where the trend summary came from (You.com).
export function SourceChips({ sources }: { sources: Source[] }) {
  const shown = sources.slice(0, 3);
  if (shown.length === 0) return null;
  return (
    <div className="src-chips" aria-label="Trend sources">
      <span className="src-label">Why it's moving · via You.com</span>
      {shown.map((s, i) => (
        <a key={`${i}-${s.url}`} className="src-chip" href={s.url} target="_blank" rel="noreferrer" title={s.title}>
          {s.title || new URL(s.url).hostname}
        </a>
      ))}
    </div>
  );
}

// "Meet your twin": the same idea showing up on other platforms. Hidden when empty.
export function TwinCard({ twins, live }: { twins?: Twin[]; live: boolean }) {
  const items = (twins ?? []).slice(0, 4);
  if (items.length === 0) return null;
  return (
    <section className="twin-card" aria-label="Meet your twin">
      <h3 className="serif twin-title">Meet your twin</h3>
      <p className="twin-sub">Same idea, other platforms. {live ? "Live from You.com." : "Example data."}</p>
      <ul className="twin-list">
        {items.map((t, i) => (
          <li key={`${i}-${t.url}`}>
            <span className="twin-tag">{t.platform}</span>
            <a href={t.url} target="_blank" rel="noreferrer" className="twin-link">
              {t.title}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Floating You.com panel, top-right of the canvas (the least-similar corner, so it never covers
// your own Short). Collapses to a small pill so it can't block cards during a demo.
export function YouPanel({ sources, twins, live }: { sources: Source[]; twins?: Twin[]; live: boolean }) {
  const [open, setOpen] = useState(true);
  if (sources.length === 0 && (twins ?? []).length === 0) return null;
  if (!open) {
    return (
      <button className="you-pill" onClick={() => setOpen(true)}>
        via You.com · {sources.length + (twins?.length ?? 0)} sources
      </button>
    );
  }
  return (
    <div className="you-panel">
      <button className="you-hide" onClick={() => setOpen(false)} aria-label="Hide You.com panel">
        ×
      </button>
      <SourceChips sources={sources} />
      <TwinCard twins={twins} live={live} />
    </div>
  );
}
