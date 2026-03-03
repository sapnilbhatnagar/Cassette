"use client";

import React, { useRef, useState, useCallback } from "react";
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

  const handleTogglePlay = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      const audio = audioRef.current;
      if (!audio) return;

      if (isPlaying) {
        audio.pause();
        audio.currentTime = 0;
        setIsPlaying(false);
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
  }, []);

  return (
    <div
      onClick={onSelect}
      className={[
        "relative flex flex-col gap-2 p-2.5 rounded-xl border cursor-pointer transition-all duration-150",
        selected
          ? "border-transparent text-white"
          : "bg-[#1f2937] border-[#27272a] hover:bg-[#27272a] hover:border-[#3f3f46]",
      ].join(" ")}
      style={
        selected
          ? { background: "linear-gradient(135deg, #6d28d9, #8b5cf6)" }
          : undefined
      }
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

      {/* Top row: icon + checkmark/play button */}
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
            className={["text-base", selected ? "text-white" : "text-[#a78bfa]"].join(" ")}
          />
        </div>

        {selected ? (
          /* White checkmark circle for selected state */
          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md">
            <Icon name="check" className="text-sm text-[#7c3aed]" />
          </div>
        ) : (
          /* Play/Pause toggle for unselected state */
          <button
            type="button"
            onClick={handleTogglePlay}
            aria-label={isPlaying ? `Pause ${bed.name}` : `Play ${bed.name}`}
            disabled={isUnavailable}
            className={[
              "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150",
              isUnavailable
                ? "bg-[#3f3f46] text-gray-500 cursor-default"
                : isPlaying
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-[#7c3aed] hover:bg-[#6d28d9] text-white",
            ].join(" ")}
          >
            <Icon
              name={isUnavailable ? "remove" : isPlaying ? "pause" : "play_arrow"}
              filled
              className="text-sm"
            />
          </button>
        )}
      </div>

      {/* Track info */}
      <div className="min-w-0">
        <p
          className={[
            "font-bold text-sm leading-tight truncate",
            selected ? "text-white" : "text-white",
          ].join(" ")}
        >
          {bed.name}
        </p>
        <p
          className={[
            "text-[11px] mt-0.5 capitalize truncate",
            selected ? "text-white/70" : "text-gray-400",
          ].join(" ")}
        >
          {bed.genre}&nbsp;&middot;&nbsp;{formatDuration(bed.durationSeconds)}
        </p>
      </div>

      {/* Recommended badge */}
      {recommended && !selected && (
        <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider text-[#a78bfa] bg-[#7c3aed]/20 border border-[#7c3aed]/30 rounded px-1.5 py-0.5">
          Rec
        </span>
      )}
    </div>
  );
}
