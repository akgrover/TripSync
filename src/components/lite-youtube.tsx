"use client";

import { useState } from "react";
import { Play } from "lucide-react";

// Lightweight click-to-play YouTube embed ("facade" pattern). Until the viewer clicks, we render
// only a poster image + a play button — none of YouTube's ~1MB player JS loads, so it never slows
// the hero's first paint. On click we swap in the real embed (via youtube-nocookie.com, so no
// cookies are set and no request hits Google until the viewer chooses to watch).
export function LiteYouTube({
  id,
  title,
  className = "",
}: {
  id: string;
  title: string;
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);

  return (
    <div
      className={`relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-900 shadow-xl ring-1 ring-black/5 ${className}`}
    >
      {playing ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Play video: ${title}`}
          className="group absolute inset-0 h-full w-full cursor-pointer"
        >
          {/* YouTube's own thumbnail. maxres isn't generated for every video, so fall back to the
              always-present hqdefault if it 404s. Plain <img> (not next/image) keeps it off the
              remote-image allowlist and loads the poster directly. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => {
              const img = e.currentTarget;
              if (!img.src.endsWith("hqdefault.jpg")) {
                img.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
              }
            }}
          />
          <span className="absolute inset-0 bg-black/15 transition group-hover:bg-black/25" />
          <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-lg ring-1 ring-black/5 transition group-hover:scale-105">
            <Play className="h-7 w-7 translate-x-0.5 fill-teal-600 text-teal-600" />
          </span>
        </button>
      )}
    </div>
  );
}
