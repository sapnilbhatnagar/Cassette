"use client";

import React, { useState, useRef, useCallback } from "react";
import Icon from "@/components/ui/Icon";

interface Track {
  id: string;
  label: string;
  color: string;
  duration: number;
  startOffset: number;
  active: boolean;
  volume?: number;
  muted?: boolean;
  solo?: boolean;
}

interface MultiTrackTimelineProps {
  tracks: Track[];
  totalDuration: number;
  currentTime: number;
  isPlaying: boolean;
  onTrackOffsetChange?: (trackId: string, newOffset: number) => void;
  onTrackVolumeChange?: (trackId: string, volume: number) => void;
  onTrackMuteToggle?: (trackId: string) => void;
  onTrackSoloToggle?: (trackId: string) => void;
  onSeek?: (time: number) => void;
}

const LANE_HEIGHT = 48;
const RULER_HEIGHT = 28;
const LANE_GAP = 3;
const LABEL_WIDTH = 120;

export default function MultiTrackTimeline({
  tracks,
  totalDuration,
  currentTime,
  isPlaying,
  onTrackOffsetChange,
  onTrackVolumeChange,
  onTrackMuteToggle,
  onTrackSoloToggle,
  onSeek,
}: MultiTrackTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{
    trackId: string;
    startX: number;
    startOffset: number;
  } | null>(null);
  const [hoveredTrack, setHoveredTrack] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const timeToPercent = (t: number) =>
    totalDuration > 0 ? (t / totalDuration) * 100 : 0;

  // Generate ruler ticks - adaptive based on zoom and duration
  const tickInterval = totalDuration > 60 ? 10 : 5;
  const ticks: number[] = [];
  for (let t = 0; t <= totalDuration; t += tickInterval) {
    ticks.push(t);
  }

  // Sub-ticks for finer granularity
  const subTickInterval = tickInterval / 5;
  const subTicks: number[] = [];
  if (zoom >= 1) {
    for (let t = 0; t <= totalDuration; t += subTickInterval) {
      if (t % tickInterval !== 0) subTicks.push(t);
    }
  }

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, track: Track) => {
      if (!track.active) return;
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDragging({
        trackId: track.id,
        startX: e.clientX,
        startOffset: track.startOffset,
      });
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging || !timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragging.startX;
      const deltaPct = deltaX / rect.width;
      const deltaTime = deltaPct * totalDuration;
      const newOffset = Math.max(
        0,
        Math.min(totalDuration - 1, dragging.startOffset + deltaTime)
      );
      onTrackOffsetChange?.(dragging.trackId, newOffset);
    },
    [dragging, totalDuration, onTrackOffsetChange]
  );

  const handlePointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  const handleRulerClick = useCallback(
    (e: React.MouseEvent) => {
      if (!timelineRef.current || !onSeek) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const pct = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width)
      );
      onSeek(pct * totalDuration);
    },
    [totalDuration, onSeek]
  );

  const formatRulerTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Generate pseudo-waveform data for each track
  const getWaveformBars = useCallback(
    (track: Track, barCount: number) => {
      const bars: number[] = [];
      const seed = track.id.charCodeAt(0) + track.id.charCodeAt(track.id.length - 1);
      for (let i = 0; i < barCount; i++) {
        const x = (i / barCount) * Math.PI * 4 + seed;
        const h =
          25 +
          Math.sin(x * 1.3) * 30 +
          Math.cos(x * 2.7) * 15 +
          Math.sin(x * 0.5 + seed) * 10;
        bars.push(Math.max(8, Math.min(90, h)));
      }
      return bars;
    },
    []
  );

  const activeTrackCount = tracks.filter((t) => t.active).length;

  return (
    <div
      ref={containerRef}
      className="relative select-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Zoom controls */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
            Timeline
          </span>
          <span className="text-[9px] text-gray-600 font-mono">
            {activeTrackCount} active track{activeTrackCount !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
            className="w-5 h-5 rounded flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Icon name="remove" className="text-xs" />
          </button>
          <span className="text-[9px] font-mono text-gray-500 w-8 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom(Math.min(3, zoom + 0.25))}
            className="w-5 h-5 rounded flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Icon name="add" className="text-xs" />
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Track labels column */}
        <div
          className="shrink-0 hidden sm:block"
          style={{ width: LABEL_WIDTH }}
        >
          {/* Ruler spacer */}
          <div style={{ height: RULER_HEIGHT }} />
          {/* Track labels */}
          <div className="flex flex-col" style={{ gap: LANE_GAP }}>
            {tracks.map((track) => (
              <div
                key={`label-${track.id}`}
                className="flex items-center gap-1.5 px-1"
                style={{ height: LANE_HEIGHT }}
              >
                {/* Color dot */}
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: track.active
                      ? track.color
                      : "rgba(63,63,70,0.5)",
                  }}
                />
                {/* Label */}
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider truncate ${
                    track.active ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {track.label}
                </span>
                {/* Mute/Solo buttons */}
                {track.active && (
                  <div className="flex items-center gap-0.5 ml-auto">
                    <button
                      type="button"
                      onClick={() => onTrackMuteToggle?.(track.id)}
                      className={`w-4 h-4 rounded text-[7px] font-black flex items-center justify-center transition-colors ${
                        track.muted
                          ? "bg-red-500/20 text-red-400"
                          : "text-gray-600 hover:text-gray-400"
                      }`}
                      title="Mute"
                    >
                      M
                    </button>
                    <button
                      type="button"
                      onClick={() => onTrackSoloToggle?.(track.id)}
                      className={`w-4 h-4 rounded text-[7px] font-black flex items-center justify-center transition-colors ${
                        track.solo
                          ? "bg-amber-500/20 text-amber-400"
                          : "text-gray-600 hover:text-gray-400"
                      }`}
                      title="Solo"
                    >
                      S
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Timeline area */}
        <div className="flex-1 min-w-0" ref={timelineRef}>
          {/* Time ruler */}
          <div
            className="relative border-b border-[#27272a] cursor-pointer"
            style={{ height: RULER_HEIGHT }}
            onClick={handleRulerClick}
          >
            {ticks.map((t) => (
              <div
                key={t}
                className="absolute top-0 flex flex-col items-center"
                style={{ left: `${timeToPercent(t)}%` }}
              >
                <div className="w-px h-3 bg-[#3f3f46]" />
                <span className="text-[8px] text-gray-500 font-mono mt-0.5">
                  {formatRulerTime(t)}
                </span>
              </div>
            ))}
            {subTicks.map((t) => (
              <div
                key={`sub-${t}`}
                className="absolute top-0"
                style={{ left: `${timeToPercent(t)}%` }}
              >
                <div className="w-px h-1.5 bg-[#27272a]" />
              </div>
            ))}
          </div>

          {/* Track lanes */}
          <div className="flex flex-col" style={{ gap: LANE_GAP }}>
            {tracks.map((track) => (
              <div
                key={track.id}
                className={`relative rounded-md overflow-hidden transition-all duration-150 ${
                  hoveredTrack === track.id ? "ring-1 ring-white/10" : ""
                }`}
                style={{
                  height: LANE_HEIGHT,
                  backgroundColor: track.active
                    ? "rgba(39,39,42,0.4)"
                    : "rgba(39,39,42,0.15)",
                }}
                onMouseEnter={() => setHoveredTrack(track.id)}
                onMouseLeave={() => setHoveredTrack(null)}
              >
                {/* Mobile track label (shown inline on small screens) */}
                <span className="sm:hidden absolute left-1.5 top-1 text-[7px] font-bold uppercase tracking-wider text-gray-600 z-10 pointer-events-none">
                  {track.label}
                </span>

                {track.active ? (
                  /* Active track bar */
                  <div
                    className={`absolute top-1 bottom-1 rounded cursor-grab active:cursor-grabbing transition-all duration-100 group ${
                      dragging?.trackId === track.id
                        ? "opacity-90 scale-y-[1.02]"
                        : "opacity-100"
                    } ${track.muted ? "opacity-30" : ""}`}
                    style={{
                      left: `${timeToPercent(track.startOffset)}%`,
                      width: `${Math.min(
                        timeToPercent(track.duration),
                        100 - timeToPercent(track.startOffset)
                      )}%`,
                      backgroundColor: track.color,
                      minWidth: 24,
                      boxShadow: `0 2px 8px ${track.color}33`,
                    }}
                    onPointerDown={(e) => handlePointerDown(e, track)}
                  >
                    {/* Waveform visualization */}
                    <div className="absolute inset-0 flex items-center gap-[1px] px-1 overflow-hidden">
                      {getWaveformBars(track, 50).map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-[1px] min-w-[1px] transition-all"
                          style={{
                            height: `${h}%`,
                            backgroundColor: "rgba(255,255,255,0.25)",
                          }}
                        />
                      ))}
                    </div>

                    {/* Drag handle indicators at edges */}
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 rounded-l" />
                    <div className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 rounded-r" />

                    {/* Volume indicator */}
                    {track.volume !== undefined && (
                      <div className="absolute bottom-0.5 right-1.5 text-[7px] font-mono text-white/50 pointer-events-none">
                        {Math.round((track.volume ?? 1) * 100)}%
                      </div>
                    )}
                  </div>
                ) : (
                  /* Empty placeholder */
                  <div className="absolute inset-1 rounded border border-dashed border-[#27272a] flex items-center justify-center">
                    <span className="text-[8px] text-gray-600">Empty</span>
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
                height:
                  RULER_HEIGHT + tracks.length * (LANE_HEIGHT + LANE_GAP),
                transition: isPlaying ? "left 100ms linear" : undefined,
              }}
            >
              {/* Playhead triangle */}
              <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-red-500" />
              {/* Time tooltip */}
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-red-500 rounded text-[7px] font-mono text-white whitespace-nowrap">
                {formatRulerTime(currentTime)}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
