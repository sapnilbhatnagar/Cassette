"use client";

import React, { useId } from "react";
import Icon from "@/components/ui/Icon";

export type OutputFormat = "mp3" | "wav";

interface MixControlsProps {
  voiceVolume: number;
  musicVolume: number;
  ducking: boolean;
  format: OutputFormat;
  onVoiceVolumeChange: (v: number) => void;
  onMusicVolumeChange: (v: number) => void;
  onDuckingChange: (v: boolean) => void;
  onFormatChange: (f: OutputFormat) => void;
  onMix: () => void;
  onSaveDraft?: () => void;
  onDownload?: (format: OutputFormat) => void;
  loading: boolean;
  disabled?: boolean;
  mixedAudioUrl?: string;
  isMixing?: boolean;
  mixLog?: string;
  mixError?: string | null;
  onDismissError?: () => void;
}

function VolumeIcon({ level, className }: { level: number; className?: string }) {
  const name = level === 0 ? "volume_off" : level < 50 ? "volume_down" : "volume_up";
  return <Icon name={name} className={className} />;
}

export default function MixControls({
  voiceVolume,
  musicVolume,
  ducking,
  format,
  onVoiceVolumeChange,
  onMusicVolumeChange,
  onDuckingChange,
  onFormatChange,
  onMix,
  onSaveDraft,
  onDownload,
  loading,
  disabled,
  mixedAudioUrl,
  isMixing,
  mixLog,
  mixError,
  onDismissError,
}: MixControlsProps) {
  const duckingId = useId();

  // Calculate effective music volume for display
  const effectiveMusicVol = ducking ? Math.round(musicVolume * 0.4) : musicVolume;

  return (
    <div className="space-y-4">
      {/* Volume controls */}
      <div className="space-y-3">
        {/* Voice volume */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <VolumeIcon level={voiceVolume} className="text-sm text-[#a78bfa] shrink-0" />
              <span className="text-[10px] font-semibold text-gray-400">Voice Level</span>
            </div>
            <span className="text-[10px] font-mono text-gray-500 tabular-nums">
              {voiceVolume}%
            </span>
          </div>
          <div className="relative">
            <input
              type="range"
              min={0}
              max={100}
              value={voiceVolume}
              onChange={(e) => onVoiceVolumeChange(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#8B5CF6]"
              style={{ backgroundColor: "#27272a" }}
            />
            {/* Volume markers */}
            <div className="flex items-center justify-between mt-1 px-0.5">
              {[0, 25, 50, 75, 100].map((v) => (
                <div
                  key={v}
                  className={`w-0.5 h-1 rounded-full ${
                    voiceVolume >= v ? "bg-[#8B5CF6]/40" : "bg-[#27272a]"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Music volume */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <VolumeIcon level={musicVolume} className="text-sm text-[#a78bfa] shrink-0" />
              <span className="text-[10px] font-semibold text-gray-400">Music Level</span>
              {ducking && (
                <span className="text-[8px] font-bold text-amber-400/70 bg-amber-500/10 px-1.5 py-0.5 rounded">
                  DUCKED
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {ducking && musicVolume !== effectiveMusicVol && (
                <span className="text-[9px] font-mono text-gray-600 line-through">
                  {musicVolume}%
                </span>
              )}
              <span className="text-[10px] font-mono text-gray-500 tabular-nums">
                {effectiveMusicVol}%
              </span>
            </div>
          </div>
          <div className="relative">
            <input
              type="range"
              min={0}
              max={100}
              value={musicVolume}
              onChange={(e) => onMusicVolumeChange(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#8B5CF6]"
              style={{ backgroundColor: "#27272a" }}
            />
            <div className="flex items-center justify-between mt-1 px-0.5">
              {[0, 25, 50, 75, 100].map((v) => (
                <div
                  key={v}
                  className={`w-0.5 h-1 rounded-full ${
                    musicVolume >= v ? "bg-[#8B5CF6]/40" : "bg-[#27272a]"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Settings row */}
      <div className="flex items-center gap-4 pt-3 border-t border-[#27272a]">
        {/* Auto-Ducking toggle */}
        <label
          htmlFor={duckingId}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div
            className={[
              "w-8 h-4 rounded-full border transition-all duration-200 cursor-pointer flex items-center px-0.5",
              ducking
                ? "bg-[#7c3aed] border-[#7c3aed]"
                : "bg-[#27272a] border-[#3f3f46]",
            ].join(" ")}
            onClick={() => onDuckingChange(!ducking)}
          >
            <div
              className={[
                "w-3 h-3 rounded-full bg-white shadow transition-transform duration-200",
                ducking ? "translate-x-4" : "translate-x-0",
              ].join(" ")}
            />
          </div>
          <input
            id={duckingId}
            type="checkbox"
            checked={ducking}
            onChange={(e) => onDuckingChange(e.target.checked)}
            className="sr-only"
          />
          <div>
            <span className="text-[10px] font-medium text-gray-400 block">
              Auto-Ducking
            </span>
            <span className="text-[8px] text-gray-600 block">
              Lowers music behind voice
            </span>
          </div>
        </label>

        <div className="w-px h-8 bg-[#27272a]" />

        {/* Output format */}
        <div>
          <span className="text-[8px] font-bold text-gray-600 uppercase tracking-wider block mb-1">
            Format
          </span>
          <div className="flex items-center gap-1">
            {(["wav", "mp3"] as OutputFormat[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => onFormatChange(f)}
                className={[
                  "px-2.5 py-1 rounded text-[9px] font-bold uppercase border transition-all",
                  format === f
                    ? "bg-[#7c3aed] text-white border-[#7c3aed]"
                    : "bg-transparent text-gray-500 border-[#27272a] hover:text-gray-300",
                ].join(" ")}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Status */}
      {mixLog && !mixError && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#131316] border border-[#27272a]">
          {isMixing ? (
            <svg
              className="animate-spin h-3.5 w-3.5 text-[#8b5cf6] shrink-0"
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
          ) : (
            <Icon name="check_circle" className="text-sm text-green-500" />
          )}
          <span className="text-[10px] text-gray-400">{mixLog}</span>
        </div>
      )}

      {mixError && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
          <Icon
            name="error"
            className="text-sm text-red-400 shrink-0 mt-0.5"
          />
          <p className="text-[10px] text-red-400 flex-1">{mixError}</p>
          {onDismissError && (
            <button
              onClick={onDismissError}
              className="text-red-400/60 hover:text-red-400 shrink-0"
              aria-label="Dismiss"
            >
              <Icon name="close" className="text-sm" />
            </button>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={onMix}
          disabled={disabled || loading}
          className="px-5 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
          style={{
            background:
              disabled || loading
                ? "#27272a"
                : "linear-gradient(135deg, #7c3aed, #a78bfa)",
            boxShadow:
              disabled || loading
                ? "none"
                : "0 4px 14px rgba(124,58,237,0.4)",
          }}
        >
          {loading ? (
            <>
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
              Rendering...
            </>
          ) : (
            <>
              <Icon name="merge" className="text-base" />
              Mix
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onSaveDraft}
          className="px-3 py-2 rounded-lg text-[10px] font-bold text-gray-400 border border-[#27272a] hover:border-[#3f3f46] hover:text-white flex items-center gap-1.5 transition-all"
        >
          <Icon name="save" className="text-xs" />
          Save Draft
        </button>

        {mixedAudioUrl && (
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              type="button"
              onClick={() => onDownload?.("wav")}
              className="px-3 py-2 rounded-lg text-[10px] font-bold text-gray-400 border border-[#27272a] hover:border-[#3f3f46] hover:text-white flex items-center gap-1.5 transition-all"
            >
              <Icon name="download" className="text-xs" />
              WAV
            </button>
            <button
              type="button"
              onClick={() => onDownload?.("mp3")}
              className="px-3 py-2 rounded-lg text-[10px] font-bold text-gray-400 border border-[#27272a] hover:border-[#3f3f46] hover:text-white flex items-center gap-1.5 transition-all"
            >
              <Icon name="download" className="text-xs" />
              MP3
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
