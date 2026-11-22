import type { Verdict as V, Video } from "@/lib/types";
import { observedFacts } from "@/lib/insights";
import Timeline from "./Timeline";

// Evidence discipline: observed (computed from numbers) / might explain (hypotheses) / can't know.
export default function Verdict({ verdict, original, videos }: { verdict: V; original: Video; videos: Video[] }) {
  const facts = observedFacts(original, videos);
  return (
    <section className="verdict">
      <div className="results-head" style={{ marginTop: 56 }}>
        <div>
          <span className="eyebrow">The comparison</span>
          <h2 className="serif">What changed between similar videos.</h2>
        </div>
      </div>

      <div className="buckets">
        <div className="card card-pad rise d1">
          <span className="bucket-tag observed">Observed</span>
          <h4 className="serif">What we measured</h4>
          <ul>
            {facts.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>

        <div className="card card-pad rise d2">
          <span className="bucket-tag hypothesis">Hypotheses</span>
          <h4 className="serif">What might explain it</h4>
          <ul>
            {verdict.breakoutPatterns.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
            <li>{verdict.timing}</li>
          </ul>
        </div>

        <div className="card card-pad rise d3">
          <span className="bucket-tag unknown">Unknown</span>
          <h4 className="serif">What public data can't tell us</h4>
          <ul>
            {verdict.unknowns.map((u, i) => (
              <li key={i}>{u}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="trend">
        <div className="card card-pad rise">
          <span className="eyebrow">Why it's moving now · via You.com</span>
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
        <div className="card card-pad rise">
          <span className="eyebrow">Timing</span>
          <h4 className="serif">When each version landed</h4>
          <Timeline original={original} videos={videos} />
          <div className="definition">Dot size = views ÷ subscribers. Outlined dot = your Short.</div>
        </div>
      </div>

      <div className="next rise">
        <span className="eyebrow">One next experiment</span>
        <h4 className="serif">Make a bigger wave</h4>
        <p>{verdict.nextExperiment}</p>
      </div>
    </section>
  );
}
