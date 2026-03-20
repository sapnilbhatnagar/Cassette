"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import Icon from "@/components/ui/Icon";
import type { MusicBed } from "@/constants/music-beds";

interface MusicBedCardProps {
  bed: MusicBed;
  selected?: boolean;
  onSelect: () => void;
  recommended?: boolean;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MusicBedCard({
  bed,
  selected = false,
  onSelect,
  recommended = false,
}: MusicBedCardProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const animRef = useRef<number>(0);

  // Poll progress while playing
  useEffect(() => {
    if (!isPlaying) {
      cancelAnimationFrame(animRef.current);
      return;
    }
    let active = true;
    function tick() {
      if (!active) return;
      const audio = audioRef.current;
      if (audio && audio.duration > 0) {
        setPreviewProgress(audio.currentTime / audio.duration);
        setPreviewCurrentTime(audio.currentTime);
      }
      animRef.current = requestAnimationFrame(tick);
    }
    animRef.current = requestAnimationFrame(tick);
    return () => {
      active = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying]);

  const handleTogglePlay = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const audio = audioRef.current;
      if (!audio) return;

      if (isPlaying) {
        audio.pause();
        audio.currentTime = 0;
        setIsPlaying(false);
        setPreviewProgress(0);
        setPreviewCurrentTime(0);
        return;
      }

      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsUnavailable(true);
        setIsPlaying(false);
      }
    },
    [isPlaying]
  );

  const handleAudioError = useCallback(() => {
    setIsUnavailable(true);
    setIsPlaying(false);
  }, []);

  const handleAudioEnded = useCallback(() => {
    setIsPlaying(false);
    setPreviewProgress(0);
    setPreviewCurrentTime(0);
  }, []);

  const formatPreviewTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={[
        "relative flex flex-col gap-2 p-3 rounded-xl border cursor-pointer transition-all duration-150 group",
        selected
          ? "border-transparent text-white"
          : "bg-[#1f2937] border-[#27272a] hover:bg-[#27272a] hover:border-[#3f3f46]",
      ].join(" ")}
      style={
        selected
          ? { background: "linear-gradient(135deg, #6d28d9, #8b5cf6)" }
          : undefined
      }
      onClick={onSelect}
      role="button"
      aria-pressed={selected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={`/music-beds/${bed.filename}`}
        preload="none"
        onError={handleAudioError}
        onEnded={handleAudioEnded}
      />

      {/* Top row: icon + play button + checkmark */}
      <div className="flex items-center justify-between">
        {/* Music note icon */}
        <div
          className={[
            "w-7 h-7 rounded-lg flex items-center justify-center",
            selected ? "bg-white/20" : "bg-[#27272a]",
          ].join(" ")}
        >
          <Icon
            name="music_note"
            filled
            className={[
              "text-base",
              selected ? "text-white" : "text-[#a78bfa]",
            ].join(" ")}
          />
        </div>

        <div className="flex items-center gap-1.5">
          {/* Play/Pause button — always visible */}
          <button
            type="button"
            onClick={handleTogglePlay}
            aria-label={isPlaying ? `Stop ${bed.name}` : `Preview ${bed.name}`}
            disabled={isUnavailable}
            className={[
              "w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 relative z-10",
              isUnavailable
                ? "bg-[#3f3f46] text-gray-500 cursor-default"
                : isPlaying
                  ? selected
                    ? "bg-white/30 hover:bg-white/40 text-white"
                    : "bg-red-500 hover:bg-red-600 text-white"
                  : selected
                    ? "bg-white/20 hover:bg-white/30 text-white"
                    : "bg-[#27272a] hover:bg-[#3f3f46] text-gray-400 hover:text-white",
            ].join(" ")}
          >
            <Icon
              name={
                isUnavailable
                  ? "volume_off"
                  : isPlaying
                    ? "stop"
                    : "play_arrow"
              }
              filled
              className="text-sm"
            />
          </button>

          {/* Selected checkmark */}
          {selected && (
            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md">
              <Icon name="check" className="text-sm text-[#7c3aed]" />
            </div>
          )}
        </div>
      </div>

      {/* Track info */}
      <div className="min-w-0">
        <p className="font-bold text-sm leading-tight truncate text-white">
          {bed.name}
        </p>
        <p
          className={[
            "text-[11px] mt-0.5 capitalize truncate",
            selected ? "text-white/70" : "text-gray-400",
          ].join(" ")}
        >
          {bed.genre}&nbsp;&middot;&nbsp;{bed.bpm} BPM&nbsp;&middot;&nbsp;
          {formatDuration(bed.durationSeconds)}
        </p>
      </div>

      {/* Preview progress bar — shown when playing */}
      {isPlaying && (
        <div className="mt-1">
          <div
            className={[
              "h-1 rounded-full overflow-hidden",
              selected ? "bg-white/20" : "bg-[#27272a]",
            ].join(" ")}
          >
            <div
              className={[
                "h-full rounded-full transition-all duration-100",
                selected ? "bg-white/60" : "bg-[#8B5CF6]",
              ].join(" ")}
              style={{ width: `${previewProgress * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span
              className={[
                "text-[8px] font-mono",
                selected ? "text-white/50" : "text-gray-600",
              ].join(" ")}
            >
              {formatPreviewTime(previewCurrentTime)}
            </span>
            <span
              className={[
                "text-[8px] font-mono",
                selected ? "text-white/50" : "text-gray-600",
              ].join(" ")}
            >
              {formatDuration(bed.durationSeconds)}
            </span>
          </div>
        </div>
      )}

      {/* Recommended badge */}
      {recommended && !selected && (
        <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider text-[#a78bfa] bg-[#7c3aed]/20 border border-[#7c3aed]/30 rounded px-1.5 py-0.5 pointer-events-none">
          Rec
        </span>
      )}
    </div>
  );
}
