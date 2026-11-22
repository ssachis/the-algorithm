"use client";
import type { Video } from "@/lib/types";
import { formatCount, perfLevel, PERF_LABEL } from "@/lib/score";

export type Sort = "similar" | "relative" | "newest";

export const SORTS: { id: Sort; label: string }[] = [
  { id: "similar", label: "Similar" },
  { id: "relative", label: "Performance" },
  { id: "newest", label: "Newest" },
];

export function sortVideos(videos: Video[], sort: Sort): Video[] {
  const v = videos.slice();
  if (sort === "similar") return v.sort((a, b) => b.similarity - a.similarity);
  if (sort === "relative") return v.sort((a, b) => (b.outperformance ?? -1) - (a.outperformance ?? -1));
  return v.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

const date = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export default function VideoList({
  videos,
  sort,
  selectedId,
  onSelect,
}: {
  videos: Video[];
  sort: Sort;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="list">
      {sortVideos(videos, sort).map((v, i) => {
        const lvl = perfLevel(v.outperformance);
        return (
          <button
            key={v.id}
            className={`row rise ${selectedId === v.id ? "selected" : ""}`}
            style={{ animationDelay: `${i * 30}ms` }}
            onClick={() => onSelect(v.id)}
          >
            <div className="mini-thumb">{v.thumbnail && <img src={v.thumbnail} alt="" />}</div>
            <div style={{ minWidth: 0 }}>
              <div className="t">{v.title.replace(/#\w+/g, "").trim()}</div>
              <div className="m">
                {v.channelTitle} · {formatCount(v.views)} views · {date(v.publishedAt)}
              </div>
            </div>
            <span className={`perf ${lvl}`}>{PERF_LABEL[lvl]}</span>
          </button>
        );
      })}
    </div>
  );
}
