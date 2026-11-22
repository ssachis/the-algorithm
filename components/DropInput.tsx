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
      <button className="btn" type="submit" disabled={disabled || !url.trim()}>
        Explore similar videos
      </button>
    </form>
  );
}
