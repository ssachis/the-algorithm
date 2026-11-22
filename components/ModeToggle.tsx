"use client";
import { useLayoutEffect, useRef, useState } from "react";
import type { Mode } from "./RippleMap";

const OPTIONS: { id: Mode; label: string }[] = [
  { id: "views", label: "Raw views" },
  { id: "reach", label: "Remove creator size" },
];

export default function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [thumb, setThumb] = useState({ left: 4, width: 0 });

  useLayoutEffect(() => {
    const el = refs.current[mode];
    if (el) setThumb({ left: el.offsetLeft, width: el.offsetWidth });
  }, [mode]);

  return (
    <div className="toggle" role="group" aria-label="Arrange waves by">
      <span className="thumb" style={{ left: thumb.left, width: thumb.width }} />
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          ref={(el) => {
            refs.current[o.id] = el;
          }}
          aria-pressed={mode === o.id}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
