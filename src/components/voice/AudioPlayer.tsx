"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";

interface AudioPlayerProps {
  src: string;
  onEnded?: () => void;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AudioPlayer({ src, onEnded }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (!isDragging) setCurrentTime(audio.currentTime);
    };
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onEnded?.();
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("loadedmetadata", handleDurationChange);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("loadedmetadata", handleDurationChange);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [isDragging, onEnded]);

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
      await audio.play().catch((err) => console.error("[AudioPlayer] play error:", err));
    }
  }, [isPlaying]);

  const handleSeekChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
  }, []);

  const handleSeekMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleSeekMouseUp = useCallback((e: React.MouseEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    const val = parseFloat((e.target as HTMLInputElement).value);
    if (audio) {
      audio.currentTime = val;
    }
    setIsDragging(false);
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    const audio = audioRef.current;
    if (audio) {
      audio.volume = val;
      audio.muted = val === 0;
      setIsMuted(val === 0);
    }
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = !isMuted;
    audio.muted = next;
    setIsMuted(next);
  }, [isMuted]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="rounded-xl p-4 bg-[#18181b] border border-[#27272a]">
      <audio ref={audioRef} src={src} preload="auto" />

      {/* Play/Pause button */}
      <div className="flex justify-center mb-4">
        <button
          type="button"
          onClick={togglePlayPause}
          className="h-12 w-12 rounded-full bg-[#8B5CF6] hover:bg-[#7c3aed] flex items-center justify-center transition-all duration-150 shadow-lg shadow-[#8B5CF6]/25"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Seek bar */}
      <div className="mb-2">
        <div className="relative w-full h-1.5 bg-[#27272a] rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-[#8B5CF6] rounded-full transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.01}
          value={currentTime}
          onChange={handleSeekChange}
          onMouseDown={handleSeekMouseDown}
          onMouseUp={handleSeekMouseUp}
          className="absolute w-full opacity-0 h-1.5 cursor-pointer"
          style={{ marginTop: "-6px", position: "relative" }}
          aria-label="Seek"
        />
      </div>

      {/* Time display */}
      <div className="flex justify-between text-xs text-gray-400 mb-4 font-mono">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Volume control */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleMute}
          className="text-gray-400 hover:text-white transition-colors shrink-0"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted || volume === 0 ? (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
            </svg>
          ) : volume < 0.5 ? (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          )}
        </button>

        {/* Volume track */}
        <div className="flex-1 relative h-1.5 bg-[#27272a] rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-[#8B5CF6] rounded-full"
            style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className="absolute opacity-0 w-24 h-1.5 cursor-pointer"
          style={{ position: "relative", marginTop: "-6px" }}
          aria-label="Volume"
        />
      </div>
    </div>
  );
}
