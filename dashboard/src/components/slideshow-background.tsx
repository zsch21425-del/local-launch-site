"use client";

import { useEffect, useState } from "react";

/**
 * Ambient full-screen HD photo slideshow — crossfades through the HD image set
 * with a subtle Ken Burns pan/zoom, fixed behind ALL content (z-0).
 *
 * Blends real imagery into the dashboard so the operator has a living, impressive
 * background while working. A heavy scrim keeps card text legible; the photos
 * are ambient atmosphere, not content.
 *
 * Zero dependencies. Preloads every image before the first crossfade so no
 * blank frame flashes. Honors prefers-reduced-motion (single static image).
 */

const DEFAULT_SLIDES = [
  "/art/slides/01-tech-circuit.jpg",
  "/art/slides/02-skyscraper.jpg",
  "/art/slides/03-mountains.jpg",
  "/art/slides/04-data-center.jpg",
  "/art/slides/05-ocean.jpg",
  "/art/slides/06-architecture.jpg",
  "/art/slides/07-nebula.jpg",
  "/art/slides/08-forest.jpg",
];

interface SlideshowBackgroundProps {
  images?: string[];
  intervalMs?: number;
  fadeMs?: number;
  /** Scrim opacity multiplier (0-1). Higher = darker = more legible, less image. */
  scrimStrength?: number;
}

export function SlideshowBackground({
  images = DEFAULT_SLIDES,
  intervalMs = 9000,
  fadeMs = 2200,
  scrimStrength = 0.65,
}: SlideshowBackgroundProps) {
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Preload all images so the first crossfade never flashes a blank frame.
  useEffect(() => {
    if (!images.length) return;
    let alive = true;
    let pending = images.length;
    images.forEach((src) => {
      const img = new Image();
      img.onload = img.onerror = () => {
        pending -= 1;
        if (alive && pending <= 0) setLoaded(true);
      };
      img.src = src;
    });
    return () => {
      alive = false;
    };
  }, [images]);

  // Advance on a timer (skip if reduced motion).
  useEffect(() => {
    if (reducedMotion || images.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [reducedMotion, images.length, intervalMs]);

  if (!images.length) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-opacity ${
            reducedMotion ? "" : "animate-kenburns"
          }`}
          style={{
            opacity: i === index && loaded ? 1 : 0,
            transitionDuration: `${fadeMs}ms`,
            transitionTimingFunction: "ease-in-out",
            animationDelay: `${(i % 4) * -6}s`,
          }}
        />
      ))}
      {/* Scrim — darkens the photos so content stays legible. Strength blends the
          image "into the right spots" without washing out cards. */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, rgba(10,14,20,${0.55 * scrimStrength}) 0%, rgba(10,14,20,${0.78 * scrimStrength}) 55%, rgba(10,14,20,${0.9 * scrimStrength}) 100%)`,
        }}
      />
    </div>
  );
}
