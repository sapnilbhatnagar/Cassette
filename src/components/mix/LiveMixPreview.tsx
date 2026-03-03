"use client";

import React, { useState, useCallback } from "react";
import Icon from "@/components/ui/Icon";
import MultiTrackTimeline from "./MultiTrackTimeline";

interface LiveMixPreviewProps {
  isMixing: boolean;
  voiceAudioUrl: string;
  voice2AudioUrl?: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  hasMix: boolean;
  onPlayPause: () => void;
  onSkip: (seconds: number) => void;
}

export default function LiveMixPreview({
  isMixing,
  voiceAudioUrl,
  voice2AudioUrl = "",
  isPlaying,
  currentTime,
  duration,
  hasMix,
  onPlayPause,
  onSkip,
}: LiveMixPreviewProps) {
  const [voiceOffset, setVoiceOffset] = useState(0);
  const [musicOffset, setMusicOffset] = useState(0);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleTrackOffsetChange = useCallback((trackId: string, newOffset: number) => {
    if (trackId === "voice-1") setVoiceOffset(newOffset);
    if (trackId === "music-1") setMusicOffset(newOffset);
  }, []);

  const hasVoice = !!voiceAudioUrl;
  const hasVoice2 = !!voice2AudioUrl;

  const totalDur = duration || 30;
  const tracks = [
    { id: "voice-1", label: "Voice 1", color: "#8b5cf6", duration: duration || 30, startOffset: voiceOffset, active: hasVoice },
    { id: "voice-2", label: "Voice 2", color: "#6d28d9", duration: duration || 30, startOffset: 0, active: hasVoice2 },
    { id: "voice-3", label: "Voice 3", color: "#5b21b6", duration: 0, startOffset: 0, active: false },
    { id: "music-1", label: "Music 1", color: "#a78bfa", duration: duration || 30, startOffset: musicOffset, active: true },
    { id: "music-2", label: "Music 2", color: "#7c3aed", duration: 0, startOffset: 0, active: false },
    { id: "music-3", label: "Music 3", color: "#6d28d9", duration: 0, startOffset: 0, active: false },
  ];

  return (
    <div
      className="h-full flex flex-col relative overflow-hidden"
      style={{ backgroundColor: "#0f0f12" }}
    >
      {/* Grid dot background pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          opacity: 0.2,
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full px-6 pb-6 gap-6" style={{ paddingTop: "calc(1.5rem + 68px)" }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#27272a] flex items-center justify-center">
              <Icon name="equalizer" className="text-base text-[#a78bfa]" />
            </div>
            <h2 className="text-base font-bold text-white">Live Mix Preview</h2>
          </div>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Realtime
          </span>
        </div>

        {/* Multi-Track Timeline */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4">
          <MultiTrackTimeline
            tracks={tracks}
            totalDuration={totalDur}
            currentTime={currentTime}
            isPlaying={isPlaying}
            onTrackOffsetChange={handleTrackOffsetChange}
          />
        </div>

        {/* Transport controls */}
        <div className="flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={() => onSkip(-10)}
            disabled={!hasMix}
            className="w-10 h-10 rounded-full bg-[#18181b] border border-[#27272a] hover:border-[#3f3f46] flex items-center justify-center text-gray-400 hover:text-white transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Skip back 10 seconds"
          >
            <Icon name="replay_10" className="text-lg" />
          </button>

          <button
            type="button"
            onClick={onPlayPause}
            disabled={!hasMix}
            className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-black transition-all duration-150 shadow-[0_0_24px_rgba(255,255,255,0.15)] hover:shadow-[0_0_32px_rgba(255,255,255,0.25)] disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            <Icon
              name={isPlaying ? "pause" : "play_arrow"}
              filled
              className="text-3xl text-black"
            />
          </button>

          <button
            type="button"
            onClick={() => onSkip(10)}
            disabled={!hasMix}
            className="w-10 h-10 rounded-full bg-[#18181b] border border-[#27272a] hover:border-[#3f3f46] flex items-center justify-center text-gray-400 hover:text-white transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Skip forward 10 seconds"
          >
            <Icon name="forward_10" className="text-lg" />
          </button>
        </div>

        {/* Progress bar + time display */}
        {hasMix && (
          <div className="space-y-2 -mt-3">
            {/* Scrubber bar */}
            <div
              className="h-1.5 rounded-full bg-[#27272a] cursor-pointer group relative overflow-hidden"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                const targetTime = pct * totalDur;
                onSkip(targetTime - currentTime);
              }}
            >
              <div
                className="h-full rounded-full bg-[#8B5CF6] transition-all duration-150"
                style={{ width: `${Math.min(100, (currentTime / totalDur) * 100)}%` }}
              />
            </div>
            {/* Time labels */}
            <div className="flex items-center justify-center gap-1 text-xs font-mono text-gray-500">
              <span className="text-gray-300">{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        )}

        {/* Mixing status overlay */}
        {isMixing && (
          <div className="flex items-center justify-center gap-2 text-sm text-[#a78bfa] -mt-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="font-medium">Mixing audio...</span>
          </div>
        )}

        <div className="flex-1" />

        {/* Footer stats */}
        <div className="border-t border-white/5 pt-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Master Mix Settings
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-[#7c3aed]/10 text-[#a78bfa] border border-[#7c3aed]/20">
              Lossless
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Sample Rate
              </p>
              <p className="text-base font-mono font-bold text-cyan-400">48.0 kHz</p>
            </div>
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Bit Depth
              </p>
              <p className="text-base font-mono font-bold text-white">24-bit</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
