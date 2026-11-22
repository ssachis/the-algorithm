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
      <h3 className="serif pb-title">What the breakouts did that you can try.</h3>
      <p className="pb-basis">{pb.basis}</p>

      {pb.hooks.length > 0 && (
        <section className="pb-item">
          <span className="pb-n">{num()}</span>
          <div>
            <h4>Borrow the hook</h4>
            <ul className="pb-hooks">
              {pb.hooks.map((h) => (
                <li key={h.v.id}>
                  <button onClick={() => onPick(h.v.id)}>
                    <span className="serif">&ldquo;{h.text}&rdquo;</span>
                    <small>{formatX(h.v.outperformance)} their usual · {h.v.channelTitle}</small>
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
            <h4>{diff > 0 ? "Give it more room" : "Get to the point faster"}</h4>
            <p>
              Breakouts run about <b>{pb.length.theirs}s</b>. Yours is {pb.length.yours}s, so try{" "}
              {diff > 0 ? `adding ~${diff}s of payoff` : `cutting ~${-diff}s`}.
            </p>
          </div>
        </section>
      )}

      {pb.timing && (
        <section className="pb-item">
          <span className="pb-n">{num()}</span>
          <div>
            <h4>Post when they posted</h4>
            <p>{pb.timing}</p>
          </div>
        </section>
      )}

      {pb.hashtags.length > 0 && (
        <section className="pb-item">
          <span className="pb-n">{num()}</span>
          <div>
            <h4>Tags they share that you skipped</h4>
            <p className="pb-tags">{pb.hashtags.map((h) => <span key={h}>{h}</span>)}</p>
          </div>
        </section>
      )}

      {pb.experiment && (
        <section className="pb-next">
          <span className="eyebrow">Your next Short</span>
          <p className="serif">{pb.experiment}</p>
        </section>
      )}

      <p className="pb-foot">Patterns, not guarantees: public numbers can&apos;t see retention or impressions.</p>
      <button className="fs-close" onClick={onClose} aria-label="Hide playbook">×</button>
    </div>
  );
}
