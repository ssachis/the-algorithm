import type { Video } from "@/lib/types";
import { formatCount, formatX } from "@/lib/score";

function ago(iso: string) {
  const d = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return d <= 0 ? "today" : d === 1 ? "1 day ago" : `${d} days ago`;
}

export default function VideoPanel({ video, isOriginal }: { video: Video; isOriginal: boolean }) {
  // Hidden subscriber or like counts show as "hidden", never as a crash or a zero.
  const reach = video.outperformance == null ? "hidden" : formatX(video.outperformance);

  return (
    <aside className="card card-pad panel rise d1" aria-live="polite">
      <span className="eyebrow">{isOriginal ? "Your Short" : "Similar Short"}</span>

      {video.thumbnail ? (
        <div className="thumb-box">
          {/* Plain img: thumbnails come from YouTube's CDN, not from a Next image config. */}
          <img src={video.thumbnail} alt={video.title.replace(/#\w+/g, "").trim()} loading="lazy" />
        </div>
      ) : (
        <div className="thumb-box" aria-hidden="true">
          <span>No thumbnail</span>
        </div>
      )}

      <h3 className="serif">{video.title.replace(/#\w+/g, "").trim()}</h3>
      <div className="faint" style={{ fontSize: 13 }}>
        {video.channelTitle} · {ago(video.publishedAt)} · {video.durationSec}s
      </div>

      <div className="stats">
        <div className="stat hero-stat">
          <div className="v">{reach}</div>
          <div className="k">vs. their reach</div>
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
        <div className="stat full">
          <div className="v">{formatCount(video.likes)}</div>
          <div className="k">likes</div>
        </div>
      </div>

      {!isOriginal && (
        <span className="pill">{Math.round(video.similarity * 100)}% similar to yours</span>
      )}
      {video.hashtags.length > 0 && (
        <div className="faint" style={{ fontSize: 12, marginTop: 12, wordBreak: "break-word" }}>
          {video.hashtags.join("  ")}
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
