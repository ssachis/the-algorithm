"use client";
// "The Current": a pan/zoom canvas of Short cards in lanes.
//   x = similarity (left = closest to your idea), lanes = raw views or creator-relative performance.
//   Semantic zoom: far = thumbnails only, mid = + creator/title, near = full card.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Video } from "@/lib/types";
import { formatCount, formatX, perfLevel, PERF_LABEL } from "@/lib/score";
import type { Mode } from "./RippleMap";

// Card size = views (the bigger the Short, the more people watched it).
const MIN_W = 66;
const MAX_W = 138;
const CARD_W = MAX_W; // largest card (used for spacing / focus)
const THUMB_H = (CARD_W * 16) / 9; // Shorts are vertical
const CARD_H = THUMB_H;
const LANE_H = CARD_H + 44;
const LABEL_W = 150;
const ORIGIN_X = LABEL_W + 20;
const FIRST_X = ORIGIN_X + CARD_W + 120;
const SPREAD = 820;
const GAP = 30;
const TOP = 24;

type Lane = { key: string; label: string; test: (v: Video) => boolean };

const REACH_LANES: Lane[] = [
  { key: "outlier", label: "Outlier", test: (v) => perfLevel(v.outperformance) === "outlier" },
  { key: "strong", label: "Strong", test: (v) => perfLevel(v.outperformance) === "strong" },
  { key: "around", label: "Usual", test: (v) => perfLevel(v.outperformance) === "around" },
  { key: "below", label: "Below", test: (v) => perfLevel(v.outperformance) === "below" },
  { key: "na", label: "Unknown", test: (v) => v.outperformance == null },
];
const VIEW_LANES: Lane[] = [
  { key: "1m", label: "1M+", test: (v) => v.views >= 1_000_000 },
  { key: "100k", label: "100K+", test: (v) => v.views >= 100_000 && v.views < 1_000_000 },
  { key: "10k", label: "10K+", test: (v) => v.views >= 10_000 && v.views < 100_000 },
  { key: "lt10k", label: "Under 10K", test: (v) => v.views < 10_000 },
];

const ago = (iso: string) => {
  const d = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return d <= 0 ? "today" : d < 30 ? `${d}d` : d < 365 ? `${Math.round(d / 30)}mo` : `${Math.round(d / 365)}y`;
};

export function ShortCard({
  v,
  mode,
  selected,
  dim,
  isOrigin,
  compare,
  minimal,
  onClick,
}: {
  v: Video;
  mode: Mode;
  selected: boolean;
  dim?: boolean;
  isOrigin?: boolean;
  compare?: boolean;
  minimal?: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  const lvl = perfLevel(v.outperformance);
  const breakout = mode === "reach" && (lvl === "outlier" || lvl === "strong");
  const title = v.title.replace(/#\w+/g, "").trim();
  return (
    <button
      className={`cc-card ${selected ? "selected" : ""} ${dim ? "dim" : ""} ${breakout ? "glow" : ""} ${isOrigin ? "origin" : ""} ${compare ? "compare" : ""}`}
      onClick={onClick}
      aria-label={`${title} by ${v.channelTitle}`}
    >
      <div className="cc-thumb">
        {v.thumbnail ? <img src={v.thumbnail} alt="" loading="lazy" draggable={false} /> : <div className="cc-ph" />}
        {isOrigin && <span className="cc-badge you">yours</span>}
        {!isOrigin && breakout && <span className={`cc-badge ${lvl}`}>{formatX(v.outperformance)}</span>}
        {minimal && (
          <span className="cc-tip">
            <b>{v.channelTitle}</b>
            {formatCount(v.views)} views · {ago(v.publishedAt)}
          </span>
        )}
      </div>
      {!minimal && <div className="cc-meta">
        <div className="cc-creator">{v.channelTitle}</div>
        <div className="cc-title">{title}</div>
        <div className="cc-line">
          {formatCount(v.views)} · {ago(v.publishedAt)}
          {!isOrigin && ` · ${Math.round(v.similarity * 100)}%`}
        </div>
      </div>}
    </button>
  );
}

export default function CurrentCanvas({
  original,
  videos,
  mode,
  selectedId,
  onSelect,
  onMoved,
}: {
  original: Video;
  videos: Video[];
  mode: Mode;
  selectedId: string;
  onSelect: (id: string) => void;
  /** true once the user pans/zooms/focuses away from the fitted overview; false after Fit */
  onMoved?: (moved: boolean) => void;
}) {
  const movedRef = useRef(onMoved);
  movedRef.current = onMoved;
  const moved = (m: boolean) => movedRef.current?.(m);
  const boxRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 800, h: 600 });
  const [view, setView] = useState({ x: 0, y: 0, k: 0.6 });
  const [animate, setAnimate] = useState(true);
  const drag = useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean } | null>(null);
  const fitted = useRef(false);
  const [compareId, setCompareId] = useState<string | null>(null);

  // ---- layout (world coordinates) ----
  const layout = useMemo(() => {
    const lanes = (mode === "reach" ? REACH_LANES : VIEW_LANES).filter(
      (l) => l.key !== "na" || [original, ...videos].some(l.test)
    );
    const laneOf = (v: Video) => Math.max(0, lanes.findIndex((l) => l.test(v)));
    const sims = videos.map((v) => v.similarity);
    const lo = Math.min(...sims);
    const hi = Math.max(...sims);

    const logs = [original, ...videos].map((v) => Math.log10(v.views + 1));
    const vlo = Math.min(...logs);
    const vhi = Math.max(...logs);
    const sizeOf = (v: Video) => {
      const t = vhi > vlo ? (Math.log10(v.views + 1) - vlo) / (vhi - vlo) : 0.5;
      const w = MIN_W + (MAX_W - MIN_W) * t;
      return { w, h: (w * 16) / 9 };
    };

    const pos: Record<string, { x: number; y: number; w: number; h: number; lane: number }> = {};
    const byLane: Video[][] = lanes.map(() => []);
    videos.forEach((v) => byLane[laneOf(v)].push(v));
    let maxX = FIRST_X + SPREAD;
    byLane.forEach((list, li) => {
      let prevEnd = -Infinity;
      list
        .map((v) => ({ v, tx: FIRST_X + (1 - (hi > lo ? (v.similarity - lo) / (hi - lo) : 0.5)) * SPREAD }))
        .sort((a, b) => a.tx - b.tx)
        .forEach(({ v, tx }) => {
          const { w, h } = sizeOf(v);
          const x = Math.max(tx, prevEnd + GAP);
          prevEnd = x + w;
          pos[v.id] = { x, y: TOP + li * LANE_H + (LANE_H - h) / 2, w, h, lane: li };
          maxX = Math.max(maxX, x + w);
        });
    });
    const oLane = laneOf(original);
    const os = sizeOf(original);
    pos[original.id] = { x: ORIGIN_X, y: TOP + oLane * LANE_H + (LANE_H - os.h) / 2, ...os, lane: oLane };
    return { lanes, pos, W: maxX + 60, H: TOP * 2 + lanes.length * LANE_H };
  }, [videos, original, mode]);

  // ---- size + fit ----
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setBox({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const fit = useCallback(() => {
    // Fit the lanes to the height (cards stay readable); if the current is wider than the
    // screen, start at the left (your Short) and let people drag sideways instead of shrinking.
    // Leave the top band for the editorial headline.
    const RESERVE = box.h > 640 ? 230 : 150;
    const avail = box.h - RESERVE - 70; // and room for the dock
    const k = Math.min(Math.max((avail / layout.H) * 0.98, 0.42), 1.1);
    const w = layout.W * k;
    setAnimate(true);
    moved(false);
    setView({ k, x: w <= box.w ? (box.w - w) / 2 : 8, y: RESERVE + (avail - layout.H * k) / 2 });
  }, [box, layout]);

  const focusOn = useCallback(
    (id: string, k = view.k) => {
      const p = layout.pos[id];
      if (!p) return;
      setAnimate(true);
      moved(true);
      setView({ k, x: box.w / 2 - (p.x + p.w / 2) * k, y: box.h / 2 - (p.y + p.h / 2) * k });
    },
    [box, layout, view.k]
  );

  useEffect(() => {
    if (!fitted.current && box.w > 0) {
      fitted.current = true;
      fit();
    }
  }, [box, fit]);
  // Breakout spotlight: flipping to "Remove creator size" re-fits, then the biggest
  // outlier pops out, glows and opens in the inspector.
  const [spot, setSpot] = useState<string | null>(null);
  useEffect(() => {
    if (!fitted.current) return;
    fit(); // re-fit when lanes change (mode toggle)
    if (mode !== "reach") {
      setSpot(null);
      return;
    }
    const top = videos
      .filter((v) => v.outperformance != null)
      .sort((a, b) => (b.outperformance ?? 0) - (a.outperformance ?? 0))[0];
    if (!top) return;
    const t1 = setTimeout(() => {
      setSpot(top.id);
      onSelect(top.id);
    }, 900); // after the cards have slid into their new lanes
    const t2 = setTimeout(() => setSpot(null), 4200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);
  // Re-fit when the canvas is resized (inspector opens or closes, window resizes).
  useEffect(() => {
    if (fitted.current && box.w > 0) fit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [box.w, box.h]);

  const zoomAt = useCallback((factor: number, cx: number, cy: number, anim: boolean) => {
    setAnimate(anim);
    moved(true);
    setView((v) => {
      const k = Math.min(Math.max(v.k * factor, 0.25), 2.4);
      const f = k / v.k;
      return { k, x: cx - (cx - v.x) * f, y: cy - (cy - v.y) * f };
    });
  }, []);

  // wheel zoom around pointer (non-passive so the page doesn't scroll)
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      if (e.ctrlKey || Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        zoomAt(Math.exp(-e.deltaY * 0.0018), e.clientX - r.left, e.clientY - r.top, false);
      } else {
        setAnimate(false);
        movedRef.current?.(true);
        setView((v) => ({ ...v, x: v.x - e.deltaX }));
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 4) return;
    if (!d.moved) (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    d.moved = true;
    moved(true);
    setAnimate(false);
    setView((v) => ({ ...v, x: d.vx + dx, y: d.vy + dy }));
  };
  const onPointerUp = () => {
    setTimeout(() => (drag.current = null), 0);
  };
  const click = (id: string, e?: React.MouseEvent) => {
    if (drag.current?.moved) return;
    if (e?.shiftKey && selectedId && id !== selectedId) {
      setCompareId(id);
      return;
    }
    onSelect(id);
    focusOn(id);
  };

  // Keyboard: arrows move the selection to the nearest card in that direction (same lane for
  // left/right; the lane above/below for up/down). +/− zoom. Selection recenters, as with a click.
  const neighbour = (fromId: string, dir: "left" | "right" | "up" | "down"): string | null => {
    const from = layout.pos[fromId];
    if (!from) return null;
    let best: { id: string; score: number } | null = null;
    for (const v of [original, ...videos]) {
      if (v.id === fromId) continue;
      const p = layout.pos[v.id];
      const dx = p.x - from.x;
      const sameLane = p.lane === from.lane;
      let ok = false;
      let score = 0;
      if (dir === "left" || dir === "right") {
        ok = sameLane && (dir === "right" ? dx > 0 : dx < 0);
        score = Math.abs(dx);
      } else {
        const wantDown = dir === "down";
        const laneGap = p.lane - from.lane;
        ok = !sameLane && (wantDown ? laneGap > 0 : laneGap < 0);
        // Adjacent lane first, then the horizontally closest card in it.
        score = Math.abs(laneGap) * 100000 + Math.abs(dx);
      }
      if (ok && (!best || score < best.score)) best = { id: v.id, score };
    }
    return best?.id ?? null;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      zoomAt(1.25, box.w / 2, box.h / 2, true);
      return;
    }
    if (e.key === "-" || e.key === "_") {
      e.preventDefault();
      zoomAt(1 / 1.25, box.w / 2, box.h / 2, true);
      return;
    }
    const dir = ({ ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" } as const)[
      e.key as "ArrowLeft"
    ];
    if (!dir) return;
    e.preventDefault();
    const next = neighbour(selectedId || original.id, dir);
    if (next) {
      onSelect(next);
      focusOn(next);
    }
  };

  // Ambient: every 3s a different Short "makes a wave" (its current lights up), until you pick one.
  const order = useMemo(
    () =>
      videos
        .slice()
        .sort((a, b) =>
          mode === "reach" ? (b.outperformance ?? 0) - (a.outperformance ?? 0) : b.views - a.views
        )
        .slice(0, 8)
        .map((v) => v.id),
    [videos, mode]
  );
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (selectedId) return;
    const t = setInterval(() => setPulse((n) => n + 1), 3000);
    return () => clearInterval(t);
  }, [selectedId]);
  const pulseId = !selectedId && order.length ? order[pulse % order.length] : null;

  // Arrow keys work anywhere on the page (not only when the canvas has focus).
  const keyRef = useRef(onKeyDown);
  keyRef.current = onKeyDown;
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (t && boxRef.current?.contains(t)) return; // the canvas' own handler already ran
      keyRef.current(e as unknown as React.KeyboardEvent);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const zoomClass = view.k < 0.55 ? "z-far" : view.k < 0.95 ? "z-mid" : "z-near";
  const focused = selectedId && selectedId !== original.id;
  const o = layout.pos[original.id];

  return (
    <div className="cc">
      <div
        ref={boxRef}
        tabIndex={0}
        role="application"
        aria-label="Similar Shorts canvas. Arrow keys move between Shorts; plus and minus zoom."
        onKeyDown={onKeyDown}
        className={`cc-box ${drag.current?.moved ? "grabbing" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div
          className={`cc-world ${zoomClass} ${animate ? "anim" : ""}`}
          style={{
            width: layout.W,
            height: layout.H,
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`,
          }}
        >
          {/* lanes */}
          {layout.lanes.map((l, i) => (
            <div key={`${mode}-${l.key}`} className="cc-lane" style={{ top: TOP + i * LANE_H, height: LANE_H }} />
          ))}

          {/* currents: fine wave paths from your Short to each similar Short */}
          <svg className="cc-paths" width={layout.W} height={layout.H} key={`paths-${mode}`}>
            {layout.lanes.map((l, i) => {
              const y = TOP + i * LANE_H + LANE_H / 2;
              const seg = 120;
              const d =
                `M-${seg * 2},${y} ` +
                Array.from(
                  { length: Math.ceil(layout.W / seg) + 4 },
                  (_, k) => `Q${-seg * 2 + k * seg + seg / 2},${y + (k % 2 ? 10 : -10)} ${-seg * 2 + (k + 1) * seg},${y}`
                ).join(" ");
              return <path key={`field-${l.key}`} d={d} className="cc-field" style={{ animationDelay: `${i * -1.3}s` }} />;
            })}
            {videos.map((v) => {
              const p = layout.pos[v.id];
              const x1 = o.x + o.w;
              const y1 = o.y + o.h / 2;
              const x2 = p.x;
              const y2 = p.y + p.h / 2;
              const dx = Math.max((x2 - x1) * 0.5, 40);
              return (
                <path
                  key={v.id}
                  d={`M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`}
                  className={`cc-path ${selectedId === v.id ? "on" : ""} ${pulseId === v.id ? "pulse" : ""}`}
                />
              );
            })}
            <path
              className="cc-reveal"
              d={`M0,${layout.H / 2} ${Array.from({ length: Math.ceil(layout.W / 80) }, (_, i) => `Q${i * 80 + 40},${layout.H / 2 + (i % 2 ? 14 : -14)} ${i * 80 + 80},${layout.H / 2}`).join(" ")}`}
            />
          </svg>

          {/* cards */}
          {[original, ...videos].map((v, i) => {
            const p = layout.pos[v.id];
            return (
              <div
                key={v.id}
                className={`cc-pos ${spot === v.id ? "on-top" : ""}`}
                style={{
                  transform: `translate(${p.x}px, ${p.y}px)`,
                  width: p.w,
                }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div className={`cc-in ${spot === v.id ? "cc-spot" : ""} ${pulseId === v.id ? "cc-pulse" : ""}`} style={{ animationDelay: `${200 + i * 40}ms` }}>
                  <ShortCard
                    v={v}
                    mode={mode}
                    selected={selectedId === v.id}
                    dim={!!focused && selectedId !== v.id && v.id !== original.id}
                    isOrigin={v.id === original.id}
                    compare={compareId === v.id}
                    minimal
                    onClick={(e) => click(v.id, e)}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Lane labels stay readable at every zoom: fixed size, pinned to the left, following the lane's height. */}
        <div className="cc-labels" aria-hidden>
          {layout.lanes.map((l, i) => (
            <span
              key={`${mode}-lbl-${l.key}`}
              className={`cc-lane-tag ${layout.lanes.length > 1 && i / (layout.lanes.length - 1) > 0.45 ? "deep" : ""}`}
              style={{ top: view.y + (TOP + i * LANE_H + LANE_H / 2) * view.k }}
            >
              {l.label}
            </span>
          ))}
        </div>

        <div className="cc-hint" aria-hidden>
          {mode === "reach" ? "↑ beat their usual" : "↑ more views"} · → less similar
        </div>
      </div>

      <div className="cc-toolbar" onPointerDown={(e) => e.stopPropagation()}>
        <button onClick={() => zoomAt(1 / 1.25, box.w / 2, box.h / 2, true)} aria-label="Zoom out">−</button>
        <span className="cc-pct">{Math.round(view.k * 100)}%</span>
        <button onClick={() => zoomAt(1.25, box.w / 2, box.h / 2, true)} aria-label="Zoom in">+</button>
        <span className="cc-sep" />
        <button onClick={fit} aria-label="Fit to screen" title="Fit">⤢</button>
      </div>
      {compareId && (
        <CompareTray
          a={[original, ...videos].find((v) => v.id === (selectedId || original.id)) ?? original}
          b={[original, ...videos].find((v) => v.id === compareId)!}
          onClose={() => setCompareId(null)}
        />
      )}
    </div>
  );
}

/** Measured differences only. No interpretation: each row is a number we have, compared. */
export function CompareTray({ a, b, onClose }: { a: Video; b: Video; onClose: () => void }) {
  const views = b.views - a.views;
  const days = Math.round((new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()) / 86_400_000);
  const dur = b.durationSec - a.durationSec;
  const signed = (n: number, f: (x: number) => string) => `${n >= 0 ? "+" : "−"}${f(Math.abs(n))}`;
  const opA = a.outperformance;
  const opB = b.outperformance;

  const rows: { k: string; a: string; b: string; diff: string }[] = [
    { k: "Views", a: formatCount(a.views), b: formatCount(b.views), diff: signed(views, formatCount) },
    {
      k: "vs. their usual",
      a: opA == null ? "hidden" : formatX(opA),
      b: opB == null ? "hidden" : formatX(opB),
      diff: opA == null || opB == null ? "not comparable (hidden)" : `${opB >= opA ? "+" : "−"}${Math.abs(opB - opA).toFixed(1)}×`,
    },
    { k: "Length", a: `${a.durationSec}s`, b: `${b.durationSec}s`, diff: `${dur >= 0 ? "+" : "−"}${Math.abs(dur)}s` },
    { k: "Posted", a: new Date(a.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }), b: new Date(b.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }), diff: `${Math.abs(days)} days ${days >= 0 ? "later" : "earlier"}` },
  ];

  return (
    <aside className="cc-tray" aria-label="Compare two Shorts">
      <div className="cc-tray-head">
        <span className="eyebrow">Compare · measured differences</span>
        <button className="linkbtn" onClick={onClose}>Close</button>
      </div>
      <div className="cc-tray-names">
        <span><b>A:</b> {a.channelTitle}</span>
        <span><b>B:</b> {b.channelTitle}</span>
      </div>
      <table className="cc-tray-table">
        <thead>
          <tr><th />
            <th>A</th><th>B</th><th>B − A</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.k}>
              <th scope="row">{r.k}</th>
              <td>{r.a}</td>
              <td>{r.b}</td>
              <td>{r.diff}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </aside>
  );
}
