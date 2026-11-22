"use client";
import { useState } from "react";
import type { Video } from "@/lib/types";

// Plays the Short inside the panel (YouTube embed, no API quota). Poster first, iframe on tap.
export default function ShortPlayer({ video, title }: { video: Video; title: string }) {
  const [playing, setPlaying] = useState(false);
  const real = !video.id.startsWith("demo");

  return (
    <div className="player">
      {playing && real ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&playsinline=1&rel=0&modestbranding=1`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <>
          {video.thumbnail ? (
            <img className="poster" src={video.thumbnail} alt={title} />
          ) : (
            <div className="ph">{real ? "No preview" : "Example Short"}</div>
          )}
          {real && (
            <button className="play" onClick={() => setPlaying(true)} aria-label={`Play ${title}`}>
              <span>▶</span>
            </button>
          )}
        </>
      )}
    </div>
  );
}
