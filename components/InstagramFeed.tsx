"use client";

import { useEffect, useState } from "react";
import { Instagram, Play } from "lucide-react";

type Tile = {
  id: string;
  image: string;
  permalink: string;
  isVideo: boolean;
  caption: string;
};

const COPY = {
  en: { loading: "Loading the latest from Instagram…", view: "View on Instagram", reel: "Reel" },
  es: { loading: "Cargando lo último de Instagram…", view: "Ver en Instagram", reel: "Reel" },
};

// Instagram serves originals at full resolution; run them through the Netlify
// Image CDN so each square is a small, correctly-cropped thumbnail.
function thumb(url: string) {
  return `/.netlify/images?url=${encodeURIComponent(url)}&w=480&h=480&fit=cover`;
}

export default function InstagramFeed({ lang = "en" }: { lang?: "en" | "es" }) {
  const t = COPY[lang] ?? COPY.en;
  const [posts, setPosts] = useState<Tile[] | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/instagram")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active) setPosts(Array.isArray(d?.posts) ? d.posts.slice(0, 4) : []);
      })
      .catch(() => {
        if (active) setPosts([]);
      });
    return () => {
      active = false;
    };
  }, []);

  // Still loading — show the four squares gently pulsing so the layout never jumps.
  if (posts === null) {
    return (
      <div className="ml-ig-tiles" aria-busy="true" aria-label={t.loading}>
        <span className="ml-ig-skeleton" />
        <span className="ml-ig-skeleton" />
        <span className="ml-ig-skeleton" />
        <span className="ml-ig-skeleton" />
      </div>
    );
  }

  // No feed connected yet (or Instagram is unreachable) — keep the original
  // brand-coloured squares linking through to the profile.
  if (!posts.length) {
    return (
      <a
        className="ml-ig-tiles ml-ig-tiles--placeholder"
        href="https://instagram.com/mundolingu"
        target="_blank"
        rel="noreferrer"
        aria-label={t.view}
      >
        <span />
        <span />
        <span />
        <span />
      </a>
    );
  }

  return (
    <div className="ml-ig-tiles">
      {posts.map((p) => (
        <a
          key={p.id}
          className="ml-ig-tile"
          href={p.permalink}
          target="_blank"
          rel="noreferrer"
          aria-label={p.caption || t.view}
        >
          <img
            src={thumb(p.image)}
            alt={p.caption || t.view}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              // If the image proxy can't reach Instagram's CDN, use the
              // original URL rather than showing a broken square.
              const img = e.currentTarget;
              if (img.src !== p.image) img.src = p.image;
            }}
          />
          {p.isVideo && (
            <span className="ml-ig-reel" aria-label={t.reel}>
              <Play size={13} fill="currentColor" />
            </span>
          )}
          <span className="ml-ig-hover">
            <Instagram size={20} />
          </span>
        </a>
      ))}
    </div>
  );
}
