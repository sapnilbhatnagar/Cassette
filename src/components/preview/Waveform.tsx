"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";

interface WaveformProps {
  src: string;
  currentTime?: number;
  duration?: number;
  onSeek?: (time: number) => void;
  playing?: boolean;
}

const BAR_COLOR_PLAYED = "#8B5CF6";
const BAR_COLOR_UNPLAYED = "#27272a";
const CURSOR_COLOR = "#8B5CF6";
const BAR_WIDTH = 3;
const BAR_GAP = 2;

export default function Waveform({
  src,
  currentTime = 0,
  duration = 0,
  onSeek,
  playing = false,
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [amplitudes, setAmplitudes] = useState<Float32Array | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Decode audio and extract amplitude data
  useEffect(() => {
    if (!src) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setAmplitudes(null);

    (async () => {
      try {
        const response = await fetch(src);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();

        if (cancelled) return;

        const ctx = new AudioContext();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        await ctx.close();

        if (cancelled) return;

        // Mix all channels down to mono for visualization
        const length = audioBuffer.length;
        const numChannels = audioBuffer.numberOfChannels;
        const mixed = new Float32Array(length);

        for (let c = 0; c < numChannels; c++) {
          const channelData = audioBuffer.getChannelData(c);
          for (let i = 0; i < length; i++) {
            mixed[i] += channelData[i] / numChannels;
          }
        }

        // Downsample to one amplitude value per bar
        const canvas = canvasRef.current;
        const numBars = canvas
          ? Math.floor(canvas.offsetWidth / (BAR_WIDTH + BAR_GAP))
          : 100;

        const samplesPerBar = Math.max(1, Math.floor(length / numBars));
        const barAmplitudes = new Float32Array(numBars);

        for (let b = 0; b < numBars; b++) {
          const start = b * samplesPerBar;
          const end = Math.min(start + samplesPerBar, length);
          let rms = 0;
          for (let i = start; i < end; i++) {
            rms += mixed[i] * mixed[i];
          }
          barAmplitudes[b] = Math.sqrt(rms / (end - start));
        }

        if (!cancelled) {
          setAmplitudes(barAmplitudes);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load waveform");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [src]);

  // Draw the waveform on canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    if (!amplitudes) {
      // Draw empty placeholder bars
      const numBars = Math.floor(width / (BAR_WIDTH + BAR_GAP));
      for (let b = 0; b < numBars; b++) {
        const x = b * (BAR_WIDTH + BAR_GAP);
        const barH = height * 0.08;
        const y = (height - barH) / 2;
        ctx.fillStyle = BAR_COLOR_UNPLAYED;
        ctx.beginPath();
        ctx.roundRect(x, y, BAR_WIDTH, barH, 1);
        ctx.fill();
      }
      return;
    }

    const numBars = amplitudes.length;
    const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;
    const playedBars = Math.floor(progress * numBars);

    // Normalize amplitudes
    let maxAmp = 0;
    for (let b = 0; b < numBars; b++) {
      if (amplitudes[b] > maxAmp) maxAmp = amplitudes[b];
    }
    if (maxAmp === 0) maxAmp = 1;

    for (let b = 0; b < numBars; b++) {
      const x = b * (BAR_WIDTH + BAR_GAP);
      const normalised = amplitudes[b] / maxAmp;
      // Min bar height of 4px, max is 90% of canvas height
      const barH = Math.max(4, normalised * height * 0.9);
      const y = (height - barH) / 2;

      ctx.fillStyle = b < playedBars ? BAR_COLOR_PLAYED : BAR_COLOR_UNPLAYED;
      ctx.beginPath();
      ctx.roundRect(x, y, BAR_WIDTH, barH, 1);
      ctx.fill();
    }

    // Draw playback cursor
    if (duration > 0) {
      const cursorX = progress * width;
      ctx.strokeStyle = CURSOR_COLOR;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 6;
      ctx.shadowColor = CURSOR_COLOR;
      ctx.beginPath();
      ctx.moveTo(cursorX, 0);
      ctx.lineTo(cursorX, height);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }, [amplitudes, currentTime, duration]);

  // Redraw whenever relevant props change
  useEffect(() => {
    draw();
  }, [draw, playing]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      draw();
    });

    observer.observe(canvas);

    // Initial size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    draw();

    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Click to seek
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!onSeek || duration <= 0) return;
      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));
      onSeek(ratio * duration);
    },
    [onSeek, duration]
  );

  return (
    <div className="relative w-full" style={{ height: 120 }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="animate-spin h-5 w-5 text-[#8B5CF6]"
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
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-xs text-gray-500">Waveform unavailable</p>
        </div>
      )}
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="w-full h-full"
        style={{
          cursor: onSeek && duration > 0 ? "pointer" : "default",
          display: "block",
        }}
        aria-label="Audio waveform visualization"
      />
    </div>
  );
}
