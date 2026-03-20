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

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={[
        "relative flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all duration-150 group",
        selected
          ? "border-[#8B5CF6] bg-[#8B5CF6]/10"
          : "border-[#27272a] bg-[#18181b] hover:border-[#3f3f46]",
      ].join(" ")}
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
      <audio
        ref={audioRef}
        src={`/music-beds/${bed.filename}`}
        preload="none"
        onError={handleAudioError}
        onEnded={handleAudioEnded}
      />

      {/* Play button */}
      <button
        type="button"
        onClick={handleTogglePlay}
        aria-label={isPlaying ? `Stop ${bed.name}` : `Preview ${bed.name}`}
        disabled={isUnavailable}
        className={[
          "w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-150 relative z-10",
          isUnavailable
            ? "bg-[#27272a] text-gray-600 cursor-default"
            : isPlaying
              ? "bg-[#8B5CF6] text-white shadow-lg shadow-[#8B5CF6]/30"
              : selected
                ? "bg-[#8B5CF6]/20 text-[#a78bfa] hover:bg-[#8B5CF6]/30"
                : "bg-[#27272a] text-gray-400 hover:text-white hover:bg-[#3f3f46]",
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
          className="text-base"
        />
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={[
            "font-semibold text-[13px] leading-tight truncate",
            selected ? "text-white" : "text-gray-200",
          ].join(" ")}>
            {bed.name}
          </p>
          {selected && (
            <Icon name="check_circle" filled className="text-sm text-[#8B5CF6] shrink-0" />
          )}
          {recommended && !selected && (
            <span className="text-[7px] font-bold text-[#a78bfa] bg-[#7c3aed]/15 px-1 py-px rounded shrink-0">
              REC
            </span>
          )}
        </div>

        {/* Progress bar when playing, metadata when not */}
        {isPlaying ? (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1 rounded-full bg-[#27272a] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#8B5CF6] transition-all duration-100"
                style={{ width: `${previewProgress * 100}%` }}
              />
            </div>
            <span className="text-[8px] font-mono text-gray-500 shrink-0">
              {formatTime(previewCurrentTime)}
            </span>
          </div>
        ) : (
          <p className="text-[10px] text-gray-500 mt-0.5 truncate capitalize">
            {bed.genre} &middot; {bed.bpm} &middot; {formatDuration(bed.durationSeconds)}
          </p>
        )}
      </div>
    </div>
  );
}
