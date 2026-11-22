"use client";
import type { AnalyzeResponse } from "@/lib/types";
import { buildPlaybook } from "@/lib/playbook";
import { formatX } from "@/lib/score";

// Default right column: what to actually do next, computed from the breakouts.
export default function Playbook({
  data,
  onPick,
  onClose,
}: {
  data: AnalyzeResponse;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const pb = buildPlaybook(data);
  const diff = pb.length ? pb.length.theirs - pb.length.yours : 0;
  let n = 0;
  const num = () => String(++n).padStart(2, "0");

  return (
    <div className="pb">
      <span className="eyebrow">Your playbook</span>
      <h3 className="serif pb-title">Try this next.</h3>

      {pb.hooks.length > 0 && (
        <section className="pb-item">
          <span className="pb-n">{num()}</span>
          <div>
            <h4>Hooks that worked</h4>
            <ul className="pb-hooks">
              {pb.hooks.map((h) => (
                <li key={h.v.id}>
                  <button onClick={() => onPick(h.v.id)}>
                    <span className="serif">&ldquo;{h.text}&rdquo;</span>
                    <small>{formatX(h.v.outperformance)}</small>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {pb.length && Math.abs(diff) >= 3 && (
        <section className="pb-item">
          <span className="pb-n">{num()}</span>
          <div>
            <h4>Length</h4>
            <p>
              <b>{pb.length.theirs}s</b> vs your {pb.length.yours}s
            </p>
          </div>
        </section>
      )}

      {pb.timing && (
        <section className="pb-item">
          <span className="pb-n">{num()}</span>
          <div>
            <h4>Timing</h4>
            <p>{pb.timing}</p>
          </div>
        </section>
      )}

      {pb.hashtags.length > 0 && (
        <section className="pb-item">
          <span className="pb-n">{num()}</span>
          <div>
            <h4>Tags you skipped</h4>
            <p className="pb-tags">{pb.hashtags.map((h) => <span key={h}>{h}</span>)}</p>
          </div>
        </section>
      )}

      {pb.experiment && (
        <section className="pb-next">
          <span className="eyebrow">Next Short</span>
          <p className="serif">{pb.experiment}</p>
        </section>
      )}

      <button className="fs-close" onClick={onClose} aria-label="Hide playbook">×</button>
    </div>
  );
}
