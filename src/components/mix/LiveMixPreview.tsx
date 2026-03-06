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
  onSeek?: (time: number) => void;
  voiceVolume?: number;
  voice2Volume?: number;
  musicVolume?: number;
  onTrackOffsetChange?: (trackId: string, offset: number) => void;
  /** When true, renders compact for mobile inline use */
  compact?: boolean;
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
  onSeek,
  voiceVolume = 1,
  voice2Volume = 0.8,
  musicVolume = 0.4,
  onTrackOffsetChange,
  compact = false,
}: LiveMixPreviewProps) {
  const [voiceOffset, setVoiceOffset] = useState(0);
  const [musicOffset, setMusicOffset] = useState(0);
  const [trackStates, setTrackStates] = useState<
    Record<string, { muted: boolean; solo: boolean }>
  >({});

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleTrackOffsetChange = useCallback(
    (trackId: string, newOffset: number) => {
      if (trackId === "voice-1") setVoiceOffset(newOffset);
      if (trackId === "music-1") setMusicOffset(newOffset);
      onTrackOffsetChange?.(trackId, newOffset);
    },
    [onTrackOffsetChange]
  );

  const handleMuteToggle = useCallback((trackId: string) => {
    setTrackStates((prev) => ({
      ...prev,
      [trackId]: {
        muted: !prev[trackId]?.muted,
        solo: prev[trackId]?.solo ?? false,
      },
    }));
  }, []);

  const handleSoloToggle = useCallback((trackId: string) => {
    setTrackStates((prev) => ({
      ...prev,
      [trackId]: {
        muted: prev[trackId]?.muted ?? false,
        solo: !prev[trackId]?.solo,
      },
    }));
  }, []);

  const handleSeek = useCallback(
    (time: number) => {
      if (onSeek) {
        onSeek(time);
      } else {
        const delta = time - currentTime;
        onSkip(delta);
      }
    },
    [onSeek, onSkip, currentTime]
  );

  const hasVoice = !!voiceAudioUrl;
  const hasVoice2 = !!voice2AudioUrl;

  const totalDur = duration || 30;
  const tracks = [
    {
      id: "voice-1",
      label: "Voice 1",
      color: "#8b5cf6",
      duration: duration || 30,
      startOffset: voiceOffset,
      active: hasVoice,
      volume: voiceVolume,
      muted: trackStates["voice-1"]?.muted ?? false,
      solo: trackStates["voice-1"]?.solo ?? false,
    },
    {
      id: "voice-2",
      label: "Voice 2",
      color: "#6d28d9",
      duration: duration || 30,
      startOffset: 0,
      active: hasVoice2,
      volume: voice2Volume,
      muted: trackStates["voice-2"]?.muted ?? false,
      solo: trackStates["voice-2"]?.solo ?? false,
    },
    {
      id: "voice-3",
      label: "Voice 3",
      color: "#5b21b6",
      duration: 0,
      startOffset: 0,
      active: false,
    },
    {
      id: "music-1",
      label: "Music",
      color: "#a78bfa",
      duration: duration || 30,
      startOffset: musicOffset,
      active: true,
      volume: musicVolume,
      muted: trackStates["music-1"]?.muted ?? false,
      solo: trackStates["music-1"]?.solo ?? false,
    },
    {
      id: "music-2",
      label: "Music 2",
      color: "#7c3aed",
      duration: 0,
      startOffset: 0,
      active: false,
    },
    {
      id: "sfx-1",
      label: "SFX",
      color: "#4ade80",
      duration: 0,
      startOffset: 0,
      active: false,
    },
  ];

  if (compact) {
    return (
      <div className="space-y-3">
        {/* Compact timeline */}
        <div className="bg-[#131316] border border-[#27272a] rounded-xl p-3">
          <MultiTrackTimeline
            tracks={tracks}
            totalDuration={totalDur}
            currentTime={currentTime}
            isPlaying={isPlaying}
            onTrackOffsetChange={handleTrackOffsetChange}
            onTrackMuteToggle={handleMuteToggle}
            onTrackSoloToggle={handleSoloToggle}
            onSeek={handleSeek}
          />
        </div>

        {/* Compact transport */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-mono text-gray-500">
            {formatTime(currentTime)}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSkip(-5)}
              disabled={!hasMix}
              className="w-8 h-8 rounded-full bg-[#18181b] border border-[#27272a] flex items-center justify-center text-gray-400 hover:text-white transition-all disabled:opacity-30"
            >
              <Icon name="replay_5" className="text-sm" />
            </button>
            <button
              type="button"
              onClick={onPlayPause}
              disabled={!hasMix}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black transition-all disabled:opacity-30"
            >
              <Icon
                name={isPlaying ? "pause" : "play_arrow"}
                filled
                className="text-xl"
              />
            </button>
            <button
              type="button"
              onClick={() => onSkip(5)}
              disabled={!hasMix}
              className="w-8 h-8 rounded-full bg-[#18181b] border border-[#27272a] flex items-center justify-center text-gray-400 hover:text-white transition-all disabled:opacity-30"
            >
              <Icon name="forward_5" className="text-sm" />
            </button>
          </div>
          <span className="text-[10px] font-mono text-gray-500">
            {formatTime(duration)}
          </span>
        </div>

        {/* Progress scrubber */}
        {hasMix && (
          <div
            className="h-1 rounded-full bg-[#27272a] cursor-pointer overflow-hidden"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = Math.max(
                0,
                Math.min(1, (e.clientX - rect.left) / rect.width)
              );
              handleSeek(pct * totalDur);
            }}
          >
            <div
              className="h-full rounded-full bg-[#8B5CF6] transition-all duration-100"
              style={{
                width: `${Math.min(100, (currentTime / totalDur) * 100)}%`,
              }}
            />
          </div>
        )}
      </div>
    );
  }

  // Full desktop version
  return (
    <div
      className="h-full flex flex-col relative overflow-hidden"
      style={{ backgroundColor: "#0f0f12" }}
    >
      {/* Grid dot background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          opacity: 0.3,
        }}
      />

      {/* Content */}
      <div
        className="relative z-10 flex flex-col h-full px-6 pb-6 gap-5"
        style={{ paddingTop: "calc(1.5rem + 68px)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#27272a] flex items-center justify-center">
              <Icon name="equalizer" className="text-base text-[#a78bfa]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Live Mix Preview
              </h2>
              <p className="text-[10px] text-gray-500">
                Drag tracks to adjust timing
              </p>
            </div>
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
            onTrackMuteToggle={handleMuteToggle}
            onTrackSoloToggle={handleSoloToggle}
            onSeek={handleSeek}
          />
        </div>

        {/* Transport controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => handleSeek(0)}
            disabled={!hasMix}
            className="w-9 h-9 rounded-full bg-[#18181b] border border-[#27272a] hover:border-[#3f3f46] flex items-center justify-center text-gray-400 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Go to start"
          >
            <Icon name="skip_previous" className="text-base" />
          </button>

          <button
            type="button"
            onClick={() => onSkip(-10)}
            disabled={!hasMix}
            className="w-9 h-9 rounded-full bg-[#18181b] border border-[#27272a] hover:border-[#3f3f46] flex items-center justify-center text-gray-400 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Skip back 10 seconds"
          >
            <Icon name="replay_10" className="text-base" />
          </button>

          <button
            type="button"
            onClick={onPlayPause}
            disabled={!hasMix}
            className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-black transition-all shadow-[0_0_20px_rgba(255,255,255,0.12)] hover:shadow-[0_0_28px_rgba(255,255,255,0.2)] disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            <Icon
              name={isPlaying ? "pause" : "play_arrow"}
              filled
              className="text-2xl text-black"
            />
          </button>

          <button
            type="button"
            onClick={() => onSkip(10)}
            disabled={!hasMix}
            className="w-9 h-9 rounded-full bg-[#18181b] border border-[#27272a] hover:border-[#3f3f46] flex items-center justify-center text-gray-400 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Skip forward 10 seconds"
          >
            <Icon name="forward_10" className="text-base" />
          </button>

          <button
            type="button"
            onClick={() => handleSeek(duration)}
            disabled={!hasMix}
            className="w-9 h-9 rounded-full bg-[#18181b] border border-[#27272a] hover:border-[#3f3f46] flex items-center justify-center text-gray-400 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Go to end"
          >
            <Icon name="skip_next" className="text-base" />
          </button>
        </div>

        {/* Progress bar + time */}
        {hasMix && (
          <div className="space-y-2 -mt-1">
            <div
              className="h-1.5 rounded-full bg-[#27272a] cursor-pointer group relative overflow-hidden"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = Math.max(
                  0,
                  Math.min(1, (e.clientX - rect.left) / rect.width)
                );
                handleSeek(pct * totalDur);
              }}
            >
              <div
                className="h-full rounded-full bg-[#8B5CF6] transition-all duration-150"
                style={{
                  width: `${Math.min(100, (currentTime / totalDur) * 100)}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-gray-500">
              <span className="text-gray-300">{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        )}

        {/* Mixing status */}
        {isMixing && (
          <div className="flex items-center justify-center gap-2 text-sm text-[#a78bfa]">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span className="font-medium">Rendering mix...</span>
          </div>
        )}

        <div className="flex-1" />

        {/* Footer stats */}
        <div className="border-t border-white/5 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Master Output
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-[#7c3aed]/10 text-[#a78bfa] border border-[#7c3aed]/20">
              Lossless
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-3 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">
                Sample Rate
              </p>
              <p className="text-sm font-mono font-bold text-cyan-400">
                48 kHz
              </p>
            </div>
            <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-3 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">
                Bit Depth
              </p>
              <p className="text-sm font-mono font-bold text-white">24-bit</p>
            </div>
            <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-3 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">
                Duration
              </p>
              <p className="text-sm font-mono font-bold text-white">
                {formatTime(duration)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
