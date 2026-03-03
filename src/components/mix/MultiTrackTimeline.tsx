"use client";

import React, { useState, useRef, useCallback } from "react";

interface Track {
  id: string;
  label: string;
  color: string;
  duration: number; // seconds
  startOffset: number; // seconds
  active: boolean;
}

interface MultiTrackTimelineProps {
  tracks: Track[];
  totalDuration: number; // seconds
  currentTime: number;
  isPlaying: boolean;
  onTrackOffsetChange?: (trackId: string, newOffset: number) => void;
}

const LANE_HEIGHT = 40;
const RULER_HEIGHT = 28;
const LANE_GAP = 4;

export default function MultiTrackTimeline({
  tracks,
  totalDuration,
  currentTime,
  isPlaying,
  onTrackOffsetChange,
}: MultiTrackTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{ trackId: string; startX: number; startOffset: number } | null>(null);

  const timeToPercent = (t: number) => totalDuration > 0 ? (t / totalDuration) * 100 : 0;

  // Generate ruler ticks every 5 seconds
  const ticks: number[] = [];
  for (let t = 0; t <= totalDuration; t += 5) {
    ticks.push(t);
  }

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, track: Track) => {
      if (!track.active) return;
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDragging({ trackId: track.id, startX: e.clientX, startOffset: track.startOffset });
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragging.startX;
      const deltaPct = deltaX / rect.width;
      const deltaTime = deltaPct * totalDuration;
      const newOffset = Math.max(0, Math.min(totalDuration - 1, dragging.startOffset + deltaTime));
      onTrackOffsetChange?.(dragging.trackId, newOffset);
    },
    [dragging, totalDuration, onTrackOffsetChange]
  );

  const handlePointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  const formatRulerTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={containerRef}
      className="relative select-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Time ruler */}
      <div
        className="relative border-b border-[#27272a] mb-1"
        style={{ height: RULER_HEIGHT }}
      >
        {ticks.map((t) => (
          <div
            key={t}
            className="absolute top-0 flex flex-col items-center"
            style={{ left: `${timeToPercent(t)}%` }}
          >
            <div className="w-px h-2.5 bg-[#3f3f46]" />
            <span className="text-[8px] text-gray-600 font-mono mt-0.5">
              {formatRulerTime(t)}
            </span>
          </div>
        ))}
      </div>

      {/* Track lanes */}
      <div className="flex flex-col" style={{ gap: LANE_GAP }}>
        {tracks.map((track) => (
          <div
            key={track.id}
            className="relative rounded-lg overflow-hidden"
            style={{
              height: LANE_HEIGHT,
              backgroundColor: track.active ? "rgba(39,39,42,0.5)" : "rgba(39,39,42,0.2)",
            }}
          >
            {/* Track label */}
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-bold uppercase tracking-wider text-gray-500 z-10 pointer-events-none">
              {track.label}
            </span>

            {track.active ? (
              /* Active track bar */
              <div
                className={`absolute top-1 bottom-1 rounded-md cursor-grab active:cursor-grabbing transition-opacity ${dragging?.trackId === track.id ? "opacity-90" : "opacity-100"}`}
                style={{
                  left: `${timeToPercent(track.startOffset)}%`,
                  width: `${Math.min(timeToPercent(track.duration), 100 - timeToPercent(track.startOffset))}%`,
                  backgroundColor: track.color,
                  minWidth: 20,
                }}
                onPointerDown={(e) => handlePointerDown(e, track)}
              >
                {/* Inner waveform pattern */}
                <div className="absolute inset-0 flex items-center gap-[1px] px-1 overflow-hidden">
                  {Array.from({ length: 30 }, (_, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm min-w-[1px]"
                      style={{
                        height: `${20 + Math.sin(i * 0.8) * 60 + Math.cos(i * 1.5) * 20}%`,
                        backgroundColor: "rgba(255,255,255,0.3)",
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              /* Empty placeholder */
              <div className="absolute inset-1 rounded-md border border-dashed border-[#27272a] flex items-center justify-center">
                <span className="text-[8px] text-gray-600">Drop track here</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Red playhead */}
      {totalDuration > 0 && (
        <div
          className="absolute top-0 w-[2px] bg-red-500 z-20 pointer-events-none"
          style={{
            left: `${timeToPercent(currentTime)}%`,
            height: RULER_HEIGHT + tracks.length * (LANE_HEIGHT + LANE_GAP),
            transition: isPlaying ? "left 100ms linear" : undefined,
          }}
        >
          {/* Playhead triangle */}
          <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-l-transparent border-r-transparent border-t-red-500" />
        </div>
      )}
    </div>
  );
}
