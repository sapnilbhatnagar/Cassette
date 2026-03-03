"use client";

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import Waveform from "./Waveform";
import DownloadButton from "./DownloadButton";

interface PreviewPlayerProps {
  src: string;
  businessName?: string;
  duration?: string;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function PreviewPlayer({ src, businessName, duration: durationLabel }: PreviewPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Wire up audio element events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => {
      if (isFinite(audio.duration)) setDuration(audio.duration);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("loadedmetadata", onDurationChange);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("loadedmetadata", onDurationChange);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, []);

  // Reset when src changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [src]);

  const togglePlayPause = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      await audio.play().catch((err) =>
        console.error("[PreviewPlayer] play error:", err)
      );
    }
  }, [isPlaying]);

  const handleSeek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const rewind10 = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = Math.max(0, audio.currentTime - 10);
    handleSeek(t);
  }, [handleSeek]);

  const forward10 = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const t = Math.min(duration, audio.currentTime + 10);
    handleSeek(t);
  }, [handleSeek, duration]);

  return (
    <>
      {/* Card header */}
      <div className="px-5 py-4 flex items-center gap-3 border-b border-white/10">
        {/* Wave icon */}
        <div className="w-9 h-9 rounded-lg bg-[#27272a] flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-white">Final Master</h3>
          <p className="text-[10px] text-[#6b7280] uppercase tracking-wider font-semibold mt-0.5">
            WAV &bull; 48kHz &bull; 24-BIT
          </p>
        </div>
        <DownloadButton
          audioUrl={src}
          businessName={businessName}
          duration={durationLabel}
        />
      </div>

      {/* Body */}
      <div className="p-5">
        <audio ref={audioRef} src={src} preload="auto" />

        {/* Time display */}
        <div className="flex items-baseline justify-center mb-6 mt-2 gap-2">
          <span className="text-4xl font-mono font-bold text-white tracking-tight">
            {formatTime(currentTime)}
          </span>
          <span className="text-sm text-[#6b7280] font-mono">
            / {formatTime(duration)}
          </span>
        </div>

        {/* Waveform */}
        <div className="mb-4">
          <Waveform
            src={src}
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
            playing={isPlaying}
          />
        </div>

        {/* Transport controls */}
        <div className="flex items-center justify-center gap-5 mt-2">
          {/* Rewind 10 */}
          <button
            type="button"
            onClick={rewind10}
            className="h-10 w-10 rounded-full bg-[#27272a] hover:bg-[#3a3a3a] flex items-center justify-center transition-colors text-[#A1A1AA] hover:text-white"
            aria-label="Rewind 10 seconds"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
              <text x="7.5" y="16" fontSize="5.5" fontWeight="bold" fill="currentColor">10</text>
            </svg>
          </button>

          {/* Play / Pause */}
          <button
            type="button"
            onClick={togglePlayPause}
            className="h-16 w-16 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#7c3aed] hover:from-[#7c3aed] hover:to-[#6d28d9] flex items-center justify-center transition-all shadow-lg shadow-[#8B5CF6]/30 active:scale-95"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Forward 10 */}
          <button
            type="button"
            onClick={forward10}
            className="h-10 w-10 rounded-full bg-[#27272a] hover:bg-[#3a3a3a] flex items-center justify-center transition-colors text-[#A1A1AA] hover:text-white"
            aria-label="Forward 10 seconds"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 13c0 3.31-2.69 6-6 6s-6-2.69-6-6 2.69-6 6-6v4l5-5-5-5v4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8h-2z" />
              <text x="7.5" y="16" fontSize="5.5" fontWeight="bold" fill="currentColor">10</text>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
