"use client";
import React, { useEffect, useRef, useState } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const GRID_CELL = 120;   // must match the CSS repeating-gradient cell size
const CHAR_HEIGHT = 48;  // video element height — straddles the 1px grid line
const CHAR_WIDTH = 72;   // video element width
const SPEED = 80;        // px / second
const GAP_LEAD = 24;     // how many px "ahead" of the character centre the gap extends

const BACK_SRCS = ["/backeater.mp4", "/backeater1.mp4"];
const FRONT_SRCS = ["/fronteater.mp4", "/fronteater1.mp4"];

// Random tints via CSS hue-rotate — gives each critter a unique colour
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
  row: number;                     // y coord of the grid line being crawled
  x: number;                       // left edge of the video element
  phase: "back" | "front";
  src: string;
  tint: string;
  gap: [number, number] | null;    // [gapStart, gapEnd] in px, null = no gap
  containerWidth: number;
}

// ─── Helpers (pure, no side-effects) ─────────────────────────────────────────
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRow(h: number): number {
  const max = Math.floor(h / GRID_CELL);
  return (1 + Math.floor(Math.random() * Math.max(1, max - 1))) * GRID_CELL;
}

// ─── Gap mask — paint over the 1px CSS grid line in the eaten segment ─────────
function GridGap({ gap, row }: { gap: [number, number]; row: number }) {
  const w = Math.max(0, gap[1] - gap[0]);
  if (w <= 0) return null;
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        // top of the 1px grid line = (row - 1); cover it with 3px
        top: row - 1,
        left: gap[0],
        width: w,
        height: 3,
        backgroundColor: "#fafaf9",   // Warm Bone — hides the #e7e5e4 grid line
      }}
    />
  );
}

// ─── Video character ──────────────────────────────────────────────────────────
function Crawler({ state }: { state: CrawlerState }) {
  const { row, x, phase, src, tint } = state;
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        top: row - CHAR_HEIGHT / 2,   // vertically centre on the grid line
        left: x,
        width: CHAR_WIDTH,
        height: CHAR_HEIGHT,
        filter: tint,
        zIndex: 2,
        // fronteater is mirrored so it always faces its travel direction (right→left)
        transform: phase === "back" ? "none" : "scaleX(-1)",
      }}
    >
      <video
        key={src}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function GridEater() {
  const containerRef = useRef<HTMLDivElement>(null);
  // All state is initialised empty — nothing runs until client useEffect
  const [crawlers, setCrawlers] = useState<CrawlerState[]>([]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let mounted = true;
    let activeCount = 0;
    const MAX_CONCURRENT = 2;
    // Map from animation-id → rAF handle
    const rafMap = new Map<number, number>();
    let idCounter = 0;
    // Capture el as non-null so nested functions can access it safely
    const container: HTMLDivElement = el;

    // ── Spawn one full lifecycle (back-pass then front-pass) ──────────────────
    function spawnOne(onFinished: () => void) {
      const id = idCounter++;
      const w = container.offsetWidth;
      const h = container.offsetHeight;
      if (w === 0 || h === 0) { onFinished(); return; }

      const row = pickRow(h);
      const tint = pick(TINTS);
      const backSrc = pick(BACK_SRCS);

      // Add crawler to state
      setCrawlers(prev => [...prev, {
        id, row, x: -CHAR_WIDTH, phase: "back",
        src: backSrc, tint, gap: null, containerWidth: w,
      }]);

      // ── Back pass: left → right ───────────────────────────────────────────
      let xPos = -CHAR_WIDTH;
      let lastT: number | null = null;

      function animBack(ts: number) {
        if (!mounted) return;
        if (lastT === null) lastT = ts;
        xPos += SPEED * ((ts - lastT) / 1000);
        lastT = ts;

        const centre = xPos + CHAR_WIDTH / 2;
        // gap goes from x=0 to just behind the character (leave a lead gap in front)
        const gapEnd = Math.max(0, centre - GAP_LEAD);
        const gap: [number, number] = [0, gapEnd];

        setCrawlers(prev => prev.map(c =>
          c.id === id ? { ...c, x: xPos, gap } : c
        ));

        if (xPos < w + CHAR_WIDTH) {
          rafMap.set(id, requestAnimationFrame(animBack));
        } else {
          rafMap.delete(id);
          // Short pause before front eater appears
          setTimeout(() => mounted && startFront(), 400);
        }
      }

      rafMap.set(id, requestAnimationFrame(animBack));

      // ── Front pass: right → left ──────────────────────────────────────────
      function startFront() {
        const frontSrc = pick(FRONT_SRCS);
        let fx = w + CHAR_WIDTH;
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

          const centre2 = fx + CHAR_WIDTH / 2;
          // Gap shrinks from the right: the segment to the right of fronteater is healed
          const remainingEnd = Math.max(0, centre2 + GAP_LEAD);
          const gap2: [number, number] = [0, remainingEnd];

          setCrawlers(prev => prev.map(c =>
            c.id === id ? { ...c, x: fx, gap: gap2 } : c
          ));

          if (fx > -CHAR_WIDTH * 2) {
            rafMap.set(id, requestAnimationFrame(animFront));
          } else {
            rafMap.delete(id);
            // Remove crawler from state and notify scheduler
            setCrawlers(prev => prev.filter(c => c.id !== id));
            onFinished();
          }
        }

        rafMap.set(id, requestAnimationFrame(animFront));
      }
    }

    // ── Scheduler: keep MAX_CONCURRENT crawlers alive ─────────────────────────
    function trySpawn() {
      if (!mounted || activeCount >= MAX_CONCURRENT) return;
      activeCount++;
      spawnOne(() => {
        activeCount--;
        if (mounted) {
          // Random quiet gap before respawning (2–7 s)
          const delay = 2000 + Math.random() * 5000;
          setTimeout(() => trySpawn(), delay);
        }
      });
    }

    // Stagger the initial two crawlers
    const t1 = setTimeout(() => trySpawn(), 600);
    const t2 = setTimeout(() => trySpawn(), 3200);

    return () => {
      mounted = false;
      clearTimeout(t1);
      clearTimeout(t2);
      rafMap.forEach(h => cancelAnimationFrame(h));
      rafMap.clear();
      // Clear all crawlers on unmount
      setCrawlers([]);
    };
  }, []);   // ← empty deps: runs once, client-only, no SSR

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 1 }}
    >
      {/* Gap masks — erases the CSS grid line over the eaten segment */}
      {crawlers.map(c =>
        c.gap ? <GridGap key={`gap-${c.id}`} gap={c.gap} row={c.row} /> : null
      )}

      {/* Character videos */}
      {crawlers.map(c => (
        <Crawler key={c.id} state={c} />
      ))}
    </div>
  );
}
