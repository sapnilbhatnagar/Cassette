"use client";

import React, { useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import type { VoiceOption } from "@/constants/voices";

interface VoiceCardProps {
  voice: VoiceOption;
  selected?: boolean;
  onSelect: () => void;
  onTryScript?: () => void;
  tryScriptLoading?: boolean;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function VoiceCard({
  voice,
  selected = false,
  onSelect,
  onTryScript,
  tryScriptLoading = false,
}: VoiceCardProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
    } else {
      setAudioError(false);
      audio.play().catch(() => {
        setAudioError(true);
        setIsPlaying(false);
      });
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); } }}
      className={[
        "relative text-left rounded-xl border p-3 transition-all duration-150 cursor-pointer group w-full",
        selected
          ? "bg-[#8B5CF6]/10 border-[#8B5CF6]/40 shadow-[0_0_12px_rgba(139,92,246,0.12)]"
          : "bg-[#18181b] border-[#27272a] hover:border-[#3f3f46] hover:bg-[#1f1f22]",
      ].join(" ")}
    >
      {/* Checkmark / play — top right */}
      <div className="absolute top-2.5 right-2.5">
        {selected ? (
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#8B5CF6]">
            <Icon name="check" className="text-[10px] text-white" />
          </span>
        ) : (
          <button
            type="button"
            onClick={handlePreview}
            className={[
              "flex items-center justify-center w-5 h-5 rounded-full transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100",
              isPlaying
                ? "bg-[#8B5CF6] text-white"
                : "bg-[#27272a] border border-[#3f3f46] text-gray-400 hover:text-white hover:border-[#8B5CF6]/40",
            ].join(" ")}
            aria-label={isPlaying ? "Stop" : "Preview"}
          >
            <Icon name={isPlaying ? "stop" : "play_arrow"} className="text-[10px]" filled />
          </button>
        )}
      </div>

      {/* Top row: avatar + name */}
      <div className="flex items-center gap-2.5 mb-1.5 pr-6">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0"
          style={{
            background: "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.3))",
            border: "1px solid rgba(139,92,246,0.2)",
          }}
        >
          {getInitials(voice.name)}
        </div>
        <div className="min-w-0">
          <p className={["text-xs font-bold truncate", selected ? "text-white" : "text-gray-300"].join(" ")}>
            {voice.name}
          </p>
          <p className="text-[10px] text-gray-500">{voice.gender === "female" ? "Female" : "Male"} · {voice.accent}</p>
        </div>
      </div>

      {/* Tone + style pills */}
      <div className="flex flex-wrap gap-1">
        <span
          className={[
            "inline-block px-1.5 py-0.5 rounded text-[9px] font-medium border",
            selected
              ? "bg-[#8B5CF6]/10 text-[#a78bfa] border-[#8B5CF6]/20"
              : "bg-[#27272a] text-gray-500 border-[#3f3f46]",
          ].join(" ")}
        >
          {voice.tone}
        </span>
      </div>

      {audioError && (
        <p className="text-[9px] text-red-400 mt-1">Preview unavailable</p>
      )}

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={voice.previewUrl}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onError={() => {
          setAudioError(true);
          setIsPlaying(false);
        }}
        preload="none"
      />
    </div>
  );
}
