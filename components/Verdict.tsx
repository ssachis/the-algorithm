import type { Verdict as V, Video } from "@/lib/types";
import Timeline from "./Timeline";

export default function Verdict({ verdict, original, videos }: { verdict: V; original: Video; videos: Video[] }) {
  return (
    <section className="verdict">
      <div className="verdict-grid">
        <div className="card card-pad rise d1">
          <span className="eyebrow">Why it's moving</span>
          <h4 className="serif">The current</h4>
          <p className="muted" style={{ margin: 0 }}>{verdict.trend.summary}</p>
          {verdict.trend.sources.length > 0 && (
            <div className="sources">
              {verdict.trend.sources.map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noreferrer" title={s.snippet}>
                  {s.title}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="card card-pad rise d2">
          <span className="eyebrow">What made waves</span>
          <h4 className="serif">The breakouts</h4>
          <ul>
            {verdict.breakoutPatterns.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>

        <div className="card card-pad rise d3">
          <span className="eyebrow">Timing</span>
          <h4 className="serif">When it landed</h4>
          <p className="muted" style={{ marginTop: 0 }}>{verdict.timing}</p>
          <Timeline original={original} videos={videos} />
        </div>
      </div>

      <div className="card card-pad rise" style={{ marginTop: 20 }}>
        <span className="eyebrow">Honest about the gaps</span>
        <h4 className="serif">What public data can't tell us</h4>
        <ul>
          {verdict.unknowns.map((u, i) => (
            <li key={i}>{u}</li>
          ))}
        </ul>
      </div>

      <div className="next rise">
        <span className="eyebrow">Your next experiment</span>
        <h4 className="serif">Make a bigger wave</h4>
        <p>{verdict.nextExperiment}</p>
      </div>
    </section>
  );
}
