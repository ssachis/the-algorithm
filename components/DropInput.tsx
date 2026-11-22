"use client";
import { useState } from "react";

export default function DropInput({
  onSubmit,
  disabled,
}: {
  onSubmit: (url: string) => void;
  disabled?: boolean;
}) {
  const [url, setUrl] = useState("");
  return (
    <form
      className="drop"
      onSubmit={(e) => {
        e.preventDefault();
        if (url.trim()) onSubmit(url.trim());
      }}
    >
      <input
        aria-label="YouTube Short URL"
        placeholder="Paste a YouTube Short link…"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        disabled={disabled}
        inputMode="url"
        autoFocus
      />
      <button
        className="btn btn-icon"
        type="submit"
        disabled={disabled || !url.trim()}
        aria-label="Explore similar videos"
        title="Explore similar videos"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
          <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </form>
  );
}
