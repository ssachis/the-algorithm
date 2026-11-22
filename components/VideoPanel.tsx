import type { Video } from "@/lib/types";
import { formatCount, formatX, perfDefinition, perfLevel, perfUnit, PERF_LABEL } from "@/lib/score";
import { sharedTerms, versusYours } from "@/lib/insights";
import ShortPlayer from "./ShortPlayer";

function ago(iso: string) {
  const d = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return d <= 0 ? "today" : d === 1 ? "1 day ago" : `${d} days ago`;
}

export default function VideoPanel({ video, original }: { video: Video; original: Video }) {
  const isOriginal = video.id === original.id;
  const lvl = perfLevel(video.outperformance);
  const why = isOriginal ? null : sharedTerms(original, video);
  const vs = isOriginal ? [] : versusYours(original, video);
  const title = video.title.replace(/#\w+/g, "").trim();

  return (
    <aside className="card card-pad panel rise d1" aria-live="polite">

      <ShortPlayer key={video.id} video={video} title={title} />

      <h3 className="serif">{title}</h3>
      <div className="faint" style={{ fontSize: 13 }}>
        {video.channelTitle} · {ago(video.publishedAt)} · {video.durationSec}s
      </div>

      <div style={{ marginTop: 14 }}>
        <span className={`perf ${lvl}`}>{PERF_LABEL[lvl]}</span>
      </div>

      <div className="stats">
        <div className="stat hero-stat" title={perfDefinition(video)}>
          {/* Hidden subscriber counts show as "hidden", never as a dash or a crash. */}
          <div className="v">{video.outperformance == null ? "hidden" : formatX(video.outperformance)}</div>
          <div className="k">{perfUnit(video)}</div>
        </div>
        <div className="stat">
          <div className="v">{formatCount(video.views)}</div>
          <div className="k">views</div>
        </div>
        <div className="stat">
          <div className="v">{formatCount(video.subscribers)}</div>
          <div className="k">subscribers</div>
        </div>
        <div className="stat">
          <div className="v">{formatCount(video.viewsPerDay)}</div>
          <div className="k">views / day</div>
        </div>
      </div>

      {why && (
        <div className="why">
          <b>Why it's here:</b> {Math.round(video.similarity * 100)}% similarity
          {why.tags.length > 0 && <> · shares {why.tags.join(" ")}</>}
          {why.words.length > 0 && <> · title words &ldquo;{why.words.slice(0, 4).join(", ")}&rdquo;</>}
        </div>
      )}

      {vs.length > 0 && (
        <div className="why">
          <b>Vs yours</b>
          {vs.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <a className="linkbtn" href={video.url} target="_blank" rel="noreferrer">
          Open on YouTube ↗
        </a>
      </div>
    </aside>
  );
}
