"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hue: number;
}

/**
 * Full-viewport animated particle network background.
 * Large visible particles in Local Launch green tones with connecting lines.
 * Pure Canvas 2D — zero dependencies, 60fps.
 * Renders fixed behind everything. Glass cards sit on top via z-10+.
 */
export function MotionBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const c = canvas;
    const cx = ctx;

    let particles: Particle[] = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let animId = 0;

    function particleCount() {
      const area = width * height;
      return Math.max(40, Math.min(100, Math.floor(area / 6000)));
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      c.width = width * dpr;
      c.height = height * dpr;
      c.style.width = `${width}px`;
      c.style.height = `${height}px`;
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles();
    }

    function initParticles() {
      const count = particleCount();
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 3 + 2.5,
        hue: 200 + Math.random() * 40, // gray-blue range
      }));
    }

    function draw() {
      // Semi-transparent clear for trail effect
      cx.fillStyle = "rgba(241, 245, 249, 0.25)";
      cx.fillRect(0, 0, width, height);

      // Draw connecting lines
      const maxDist = 140;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.18;
            cx.beginPath();
            cx.moveTo(particles[i].x, particles[i].y);
            cx.lineTo(particles[j].x, particles[j].y);
            cx.strokeStyle = `hsla(${particles[i].hue}, 70%, 55%, ${alpha})`;
            cx.lineWidth = 0.8;
            cx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -30) p.x = width + 30;
        if (p.x > width + 30) p.x = -30;
        if (p.y < -30) p.y = height + 30;
        if (p.y > height + 30) p.y = -30;

        // Glow effect
        const gradient = cx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3);
        gradient.addColorStop(0, `hsla(${p.hue}, 70%, 55%, 0.5)`);
        gradient.addColorStop(0.4, `hsla(${p.hue}, 70%, 55%, 0.15)`);
        gradient.addColorStop(1, `hsla(${p.hue}, 70%, 55%, 0)`);

        cx.beginPath();
        cx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
        cx.fillStyle = gradient;
        cx.fill();

        // Solid core
        cx.beginPath();
        cx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        cx.fillStyle = `hsla(${p.hue}, 70%, 55%, 0.7)`;
        cx.fill();
      }

      animId = requestAnimationFrame(draw);
    }

    resize();
    draw();

    window.addEventListener("resize", resize);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) cancelAnimationFrame(animId);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      {/* CSS animated gradient — always visible, no JS needed */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          zIndex: 0,
          background: `
            radial-gradient(ellipse 80% 60% at 20% 30%, rgba(100,116,139,0.12) 0%, transparent 50%),
            radial-gradient(ellipse 60% 80% at 80% 70%, rgba(71,85,105,0.10) 0%, transparent 50%),
            radial-gradient(ellipse 50% 50% at 50% 50%, rgba(148,163,184,0.06) 0%, transparent 60%),
            #F1F5F9
          `,
          animation: "gradient-shift 8s ease-in-out infinite alternate",
        }}
      />
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{ zIndex: 1, background: "transparent" }}
      />
      {/* Frosted grey scrim — sits above the animated background (z-1) and
          below all content (z-10) so the bright moving particles are muted
          and defocused, keeping card text legible everywhere. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          zIndex: 2,
          background: "rgba(226, 232, 240, 0.55)",
          backdropFilter: "blur(6px) saturate(0.9)",
          WebkitBackdropFilter: "blur(6px) saturate(0.9)",
        }}
      />
    </>
  );
}
