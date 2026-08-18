"use client";
import React, { useEffect, useState } from "react";
import GridEater from "./GridEater";

const POSITIONS = [
  { left: "24%", top: "36%" },
  { left: "68%", top: "72%" },
  { left: "84%", top: "18%" },
  { left: "16%", top: "60%" },
  { left: "52%", top: "44%" }
];

const TAGS = ["[ .JSON ]", "[ SCRAPE ]", "[ 200 OK ]", "[ .MD ]"];

export default function HeroBackground() {
  const [posIndex, setPosIndex] = useState(0);
  const [roamingVisible, setRoamingVisible] = useState(false);

  // Roaming cell animation loop
  useEffect(() => {
    let active = true;
    const run = async () => {
      while (active) {
        // Hold for 1.5s visible
        setRoamingVisible(true);
        await new Promise((r) => setTimeout(r, 1500));
        if (!active) break;

        // Fade out
        setRoamingVisible(false);
        await new Promise((r) => setTimeout(r, 3000));
        if (!active) break;

        // Move to next position
        setPosIndex((prev) => (prev + 1) % POSITIONS.length);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Grid Layer */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundColor: "var(--color-warm-bone)",
          backgroundImage: `
            repeating-linear-gradient(to right, var(--color-stone-mist) 0px, var(--color-stone-mist) 1px, transparent 1px, transparent 120px),
            repeating-linear-gradient(to bottom, var(--color-stone-mist) 0px, var(--color-stone-mist) 1px, transparent 1px, transparent 120px)
          `
        }}
      />

      {/* Grid-line eater characters */}
      <GridEater />

      {/* Breathing Sparkle Markers */}
      {/* Star 1 at roughly 27% across, 29% down */}
      <div 
        className="absolute w-[18px] h-[18px] text-[var(--color-electric-indigo)]"
        style={{
          left: "27%",
          top: "29%",
          transform: "translate(-50%, -50%)",
          animation: "sparkle-pulse 3s ease-in-out infinite",
        }}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
          <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
        </svg>
      </div>

      {/* Star 2 at roughly 73% across, 29% down (1.4s delay) */}
      <div 
        className="absolute w-[18px] h-[18px] text-[var(--color-electric-indigo)]"
        style={{
          left: "73%",
          top: "29%",
          transform: "translate(-50%, -50%)",
          animation: "sparkle-pulse 3s ease-in-out infinite",
          animationDelay: "1.4s",
        }}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
          <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
        </svg>
      </div>

      {/* Materializing Pixel Clusters */}
      {/* Cluster 1: top-left area */}
      <PixelCluster left="120px" top="120px" delayOffset={0} />
      
      {/* Cluster 2: bottom-right area */}
      <PixelCluster right="120px" bottom="240px" delayOffset={2} />
      
      {/* Cluster 3: middle-bottom area */}
      <PixelCluster left="360px" bottom="120px" delayOffset={4} />

      {/* Cluster 4: top-right area */}
      <PixelCluster right="240px" top="120px" delayOffset={1.5} />

      {/* Roaming Highlight Cell */}
      <div
        className="absolute w-[12px] h-[12px] bg-[var(--color-stone-mist)] transition-all duration-500 ease-in-out"
        style={{
          left: POSITIONS[posIndex].left,
          top: POSITIONS[posIndex].top,
          opacity: roamingVisible ? 1 : 0,
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Corner Status Tags */}
      {/* Top Left Corner */}
      <div className="absolute left-6 top-6">
        <CornerTag cornerOffset={0} />
      </div>

      {/* Top Right Corner */}
      <div className="absolute right-6 top-6">
        <CornerTag cornerOffset={2.5} />
      </div>

      {/* Bottom Left Corner */}
      <div className="absolute left-6 bottom-6">
        <CornerTag cornerOffset={7.5} />
      </div>

      {/* Bottom Right Corner */}
      <div className="absolute right-6 bottom-6">
        <CornerTag cornerOffset={5.0} />
      </div>
    </div>
  );
}

// Sub-component for a pixel cluster
interface PixelClusterProps {
  left?: string;
  right?: string;
  top?: string;
  bottom?: string;
  delayOffset: number;
}

function PixelCluster({ left, right, top, bottom, delayOffset }: PixelClusterProps) {
  // A 3x4 grid of small squares.
  // 3 squares are always visible.
  // 9 squares animate on a cycle, staggered by 80ms.
  const cellPositions = [
    { r: 0, c: 0, animate: false },
    { r: 0, c: 1, animate: true, index: 0 },
    { r: 0, c: 2, animate: true, index: 1 },
    { r: 0, c: 3, animate: true, index: 2 },
    { r: 1, c: 0, animate: true, index: 3 },
    { r: 1, c: 1, animate: false },
    { r: 1, c: 2, animate: true, index: 4 },
    { r: 1, c: 3, animate: true, index: 5 },
    { r: 2, c: 0, animate: true, index: 6 },
    { r: 2, c: 1, animate: true, index: 7 },
    { r: 2, c: 2, animate: false },
    { r: 2, c: 3, animate: true, index: 8 },
  ];

  return (
    <div
      className="absolute grid grid-cols-4 gap-[4px] w-[52px] h-[38px]"
      style={{ left, right, top, bottom }}
    >
      {cellPositions.map((cell, idx) => {
        const style: React.CSSProperties = {
          width: "10px",
          height: "10px",
          backgroundColor: "var(--color-pebble)", // Pebble
        };

        if (cell.animate && cell.index !== undefined) {
          style.animation = "pixel-cycle 6s infinite";
          style.animationDelay = `${delayOffset + cell.index * 0.08}s`;
        } else {
          // Always visible cells (sparse state)
          style.opacity = 0.5;
        }

        return <div key={idx} style={style} className="rounded-[1px]" />;
      })}
    </div>
  );
}

// Sub-component for a corner tag cycling its state
interface CornerTagProps {
  cornerOffset: number; // Staggers the 10s loop between corners
}

function CornerTag({ cornerOffset }: CornerTagProps) {
  return (
    <div className="relative font-mono text-[11px] tracking-[0.04em] text-[var(--color-bark-grey)] font-medium uppercase h-[18px] w-[80px]">
      {TAGS.map((tag, idx) => (
        <span
          key={tag}
          className="absolute inset-0"
          style={{
            animation: `corner-cycle 10s ${cornerOffset + idx * 2.5}s infinite`,
            opacity: 0,
          }}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
