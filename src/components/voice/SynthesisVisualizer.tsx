"use client";

import React from "react";

interface SynthesisVisualizerProps {
  active?: boolean;
}

export default function SynthesisVisualizer({ active = true }: SynthesisVisualizerProps) {
  const barCount = 20;

  return (
    <div className="flex items-end justify-center gap-[3px] h-16">
      {Array.from({ length: barCount }).map((_, i) => {
        // Natural waveform shape — taller in centre, shorter at edges
        const center = barCount / 2;
        const distFromCenter = Math.abs(i - center) / center;
        const baseHeight = 18 + (1 - distFromCenter) * 62;
        const randomOffset = ((i * 17 + 7) % 13) * 2; // deterministic pseudo-random
        const height = Math.max(10, Math.min(80, baseHeight + randomOffset));
        const delay = (i * 0.08).toFixed(2);

        return (
          <div
            key={i}
            className="rounded-full"
            style={{
              width: 4,
              height: `${height}%`,
              background: active
                ? "linear-gradient(to top, #8B5CF6, #C4B5FD)"
                : "rgba(139,92,246,0.25)",
              opacity: active ? 1 : 0.4,
              animation: active
                ? `synthBar 1.2s ease-in-out ${delay}s infinite alternate`
                : "none",
              transition: "opacity 0.3s ease",
            }}
          />
        );
      })}
    </div>
  );
}
