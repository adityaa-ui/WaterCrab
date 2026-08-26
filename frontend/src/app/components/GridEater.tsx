"use client";
import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "@/lib/theme";

// ─── Constants ────────────────────────────────────────────────────────────────
const GRID_CELL = 120;    // must match the CSS repeating-gradient cell size
const CHAR_H = 56;        // display height
const CHAR_W = 84;        // display width  — 3:2 aspect ratio
const SPEED = 80;         // px / second
const GAP_LEAD = 28;      // px ahead of char centre where gap extends

const BACK_SRCS  = ["/backeater.mp4",  "/backeater1.mp4"];
const FRONT_SRCS = ["/fronteater.mp4", "/fronteater1.mp4"];

// Subtle colour tints per critter
const TINTS = [
  "hue-rotate(0deg)",
  "hue-rotate(55deg)",
  "hue-rotate(140deg)",
  "hue-rotate(215deg)",
  "hue-rotate(290deg)",
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface CrawlerState {
  id: number;
  row: number;
  x: number;
  phase: "back" | "front";
  src: string;
  tint: string;
  gap: [number, number] | null;
  containerWidth: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function pickRow(h: number): number {
  const max = Math.floor(h / GRID_CELL);
  return (1 + Math.floor(Math.random() * Math.max(1, max - 1))) * GRID_CELL;
}

// ─── Gap mask ─────────────────────────────────────────────────────────────────
function GridGap({ gap, row }: { gap: [number, number]; row: number }) {
  const w = Math.max(0, gap[1] - gap[0]);
  if (w <= 0) return null;
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        top: row - 1,
        left: gap[0],
        width: w,
        height: 3,
        backgroundColor: "var(--color-warm-bone)",
      }}
    />
  );
}

// ─── HD Canvas Crawler ────────────────────────────────────────────────────────
// Renders video frames into a DPR-scaled canvas with chroma-key compositing
// so the white MP4 background is removed pixel-perfectly on any theme colour.
function Crawler({ state, isDark }: { state: CrawlerState; isDark: boolean }) {
  const { row, x, phase, src, tint } = state;
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Store the rAF id so cleanup is reliable
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // ── DPR-aware canvas sizing ───────────────────────────────────────────
    const dpr = typeof window !== "undefined" ? (window.devicePixelRatio || 1) : 1;
    const bufW = Math.round(CHAR_W * dpr);
    const bufH = Math.round(CHAR_H * dpr);
    canvas.width  = bufW;
    canvas.height = bufH;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    // Scale all draw calls by DPR so 1 CSS pixel = 1 physical pixel on Retina
    ctx.scale(dpr, dpr);

    // ── Chroma-key constants ──────────────────────────────────────────────
    // White threshold: pixels above this brightness are background (remove them)
    const WHITE_THRESHOLD = 200;
    // Feather range: pixels in [WHITE_THRESHOLD - FEATHER, WHITE_THRESHOLD]
    // get a graduated alpha for anti-aliased edges
    const FEATHER = 40;

    let running = true;

    const renderFrame = () => {
      if (!running) return;

      if (video.readyState >= 2) {
        // Draw the video frame at the logical size — DPR scaling handles the rest
        ctx.clearRect(0, 0, CHAR_W, CHAR_H);
        ctx.drawImage(video, 0, 0, CHAR_W, CHAR_H);

        const imgData = ctx.getImageData(0, 0, bufW, bufH);
        const d = imgData.data;
        const len = d.length;

        for (let i = 0; i < len; i += 4) {
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];

          // Luminance-weighted brightness (perceptual)
          const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;

          if (lum > WHITE_THRESHOLD) {
            // Fully transparent — this IS the background
            d[i + 3] = 0;
          } else if (lum > WHITE_THRESHOLD - FEATHER) {
            // Soft-edge feathering: partial alpha for anti-aliased borders
            const t = (lum - (WHITE_THRESHOLD - FEATHER)) / FEATHER; // 0→1 toward bg
            d[i + 3] = Math.round(d[i + 3] * (1 - t * t)); // quadratic falloff
          } else if (isDark) {
            // In dark mode: invert near-black ink pixels → near-white so
            // they read clearly against the dark background.
            // Uses per-channel inversion so coloured details stay vibrant.
            const darknessRatio = 1 - lum / (WHITE_THRESHOLD - FEATHER);
            if (darknessRatio > 0.55) {
              const lift = Math.round(180 * darknessRatio);
              d[i]     = Math.min(255, r + lift);
              d[i + 1] = Math.min(255, g + lift);
              d[i + 2] = Math.min(255, b + lift);
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
      }

      rafRef.current = requestAnimationFrame(renderFrame);
    };

    rafRef.current = requestAnimationFrame(renderFrame);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [isDark, src]);

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        top:    row - CHAR_H / 2,
        left:   x,
        width:  CHAR_W,
        height: CHAR_H,
        zIndex: 2,
        transform: phase === "back" ? "none" : "scaleX(-1)",
        // Crisp scaling — the canvas buffer is already at native resolution
        imageRendering: "auto",
      }}
    >
      {/* Hidden source video — we never display this directly */}
      <video
        ref={videoRef}
        key={src}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        style={{ display: "none" }}
      />
      {/* HD canvas output — CSS size = logical size, buffer size = physical pixels */}
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width:   "100%",
          height:  "100%",
          filter:  tint,
          // Prevent browser from blurring the already-sharp canvas pixels
          imageRendering: "auto",
        }}
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function GridEater() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const containerRef = useRef<HTMLDivElement>(null);
  const [crawlers, setCrawlers] = useState<CrawlerState[]>([]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let mounted    = true;
    let activeCount = 0;
    const MAX_CONCURRENT = 2;
    const rafMap   = new Map<number, number>();
    let idCounter  = 0;
    const container = el;

    function spawnOne(onFinished: () => void) {
      const id = idCounter++;
      const w  = container.offsetWidth;
      const h  = container.offsetHeight;
      if (w === 0 || h === 0) { onFinished(); return; }

      const row     = pickRow(h);
      const tint    = pick(TINTS);
      const backSrc = pick(BACK_SRCS);

      setCrawlers(prev => [...prev, {
        id, row, x: -CHAR_W, phase: "back",
        src: backSrc, tint, gap: null, containerWidth: w,
      }]);

      // ── Back pass: left → right ───────────────────────────────────────────
      let xPos  = -CHAR_W;
      let lastT: number | null = null;

      function animBack(ts: number) {
        if (!mounted) return;
        if (lastT === null) lastT = ts;
        xPos += SPEED * ((ts - lastT) / 1000);
        lastT = ts;

        const centre = xPos + CHAR_W / 2;
        const gapEnd = Math.max(0, centre - GAP_LEAD);
        const gap: [number, number] = [0, gapEnd];

        setCrawlers(prev => prev.map(c =>
          c.id === id ? { ...c, x: xPos, gap } : c
        ));

        if (xPos < w + CHAR_W) {
          rafMap.set(id, requestAnimationFrame(animBack));
        } else {
          rafMap.delete(id);
          setTimeout(() => mounted && startFront(), 400);
        }
      }

      rafMap.set(id, requestAnimationFrame(animBack));

      // ── Front pass: right → left ──────────────────────────────────────────
      function startFront() {
        const frontSrc = pick(FRONT_SRCS);
        let fx = w + CHAR_W;
        let lastFt: number | null = null;

        setCrawlers(prev => prev.map(c =>
          c.id === id
            ? { ...c, x: fx, phase: "front" as const, src: frontSrc, gap: [0, w] as [number, number] }
            : c
        ));

        function animFront(ts: number) {
          if (!mounted) return;
          if (lastFt === null) lastFt = ts;
          fx -= SPEED * ((ts - lastFt) / 1000);
          lastFt = ts;

          const centre2 = fx + CHAR_W / 2;
          const remainingEnd = Math.max(0, centre2 + GAP_LEAD);
          const gap2: [number, number] = [0, remainingEnd];

          setCrawlers(prev => prev.map(c =>
            c.id === id ? { ...c, x: fx, gap: gap2 } : c
          ));

          if (fx > -CHAR_W * 2) {
            rafMap.set(id, requestAnimationFrame(animFront));
          } else {
            rafMap.delete(id);
            setCrawlers(prev => prev.filter(c => c.id !== id));
            onFinished();
          }
        }

        rafMap.set(id, requestAnimationFrame(animFront));
      }
    }

    function trySpawn() {
      if (!mounted || activeCount >= MAX_CONCURRENT) return;
      activeCount++;
      spawnOne(() => {
        activeCount--;
        if (mounted) {
          const delay = 2000 + Math.random() * 5000;
          setTimeout(() => trySpawn(), delay);
        }
      });
    }

    const t1 = setTimeout(() => trySpawn(), 600);
    const t2 = setTimeout(() => trySpawn(), 3200);

    return () => {
      mounted = false;
      clearTimeout(t1);
      clearTimeout(t2);
      rafMap.forEach(h => cancelAnimationFrame(h));
      rafMap.clear();
      setCrawlers([]);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 1 }}
    >
      {crawlers.map(c =>
        c.gap ? <GridGap key={`gap-${c.id}`} gap={c.gap} row={c.row} /> : null
      )}
      {crawlers.map(c => (
        <Crawler key={c.id} state={c} isDark={isDark} />
      ))}
    </div>
  );
}
