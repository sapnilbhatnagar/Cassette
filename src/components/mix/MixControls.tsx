"use client";

import React, { useId, useCallback } from "react";
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
  onDownload?: (format: OutputFormat) => void;
  loading: boolean;
  disabled?: boolean;
  mixedAudioUrl?: string;
  isMixing?: boolean;
  mixLog?: string;
  mixError?: string | null;
  onDismissError?: () => void;
}

/* --------------- Channel Strip --------------- */
function ChannelStrip({
  label,
  icon,
  volume,
  effectiveVolume,
  onChange,
  color,
  muted,
  onMuteToggle,
  badge,
}: {
  label: string;
  icon: string;
  volume: number;
  effectiveVolume?: number;
  onChange: (v: number) => void;
  color: string;
  muted?: boolean;
  onMuteToggle?: () => void;
  badge?: React.ReactNode;
}) {
  const displayVol = effectiveVolume ?? volume;
  const pct = volume / 100;

  // dB display: -inf at 0, 0dB at 100
  const db =
    volume === 0
      ? "-inf"
      : `${(20 * Math.log10(volume / 100)).toFixed(1)}`;

  const handleDoubleClick = useCallback(() => {
    onChange(100);
  }, [onChange]);

  return (
    <div
      className={`rounded-xl p-3 transition-all duration-200 ${
        muted ? "opacity-40" : ""
      }`}
      style={{
        background: `linear-gradient(135deg, ${color}08, ${color}03)`,
        border: `1px solid ${color}15`,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon name={icon} className="text-xs" style={{ color }} />
        </div>
        <span className="text-[11px] font-semibold text-gray-300 flex-1">
          {label}
        </span>
        {badge}
        {onMuteToggle && (
          <button
            type="button"
            onClick={onMuteToggle}
            className={`w-5 h-5 rounded text-[7px] font-black flex items-center justify-center transition-all ${
              muted
                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                : "text-gray-600 hover:text-gray-400 border border-transparent hover:border-[#3f3f46]"
            }`}
            title={muted ? "Unmute" : "Mute"}
          >
            M
          </button>
        )}
      </div>

      {/* Fader + meter */}
      <div className="flex items-center gap-3">
        {/* Level meter (vertical bar) */}
        <div className="w-2 h-10 rounded-full bg-[#131316] overflow-hidden flex flex-col-reverse shrink-0">
          <div
            className="w-full rounded-full transition-all duration-200"
            style={{
              height: `${displayVol}%`,
              background: `linear-gradient(to top, ${color}, ${color}99)`,
            }}
          />
        </div>

        {/* Slider area */}
        <div className="flex-1 min-w-0">
          {/* Custom styled range */}
          <div className="relative">
            <div className="h-2 rounded-full bg-[#131316] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-100"
                style={{
                  width: `${pct * 100}%`,
                  background: `linear-gradient(to right, ${color}80, ${color})`,
                }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => onChange(Number(e.target.value))}
              onDoubleClick={handleDoubleClick}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              title={`${label}: ${volume}%`}
            />
          </div>

          {/* Scale markers */}
          <div className="flex items-center justify-between mt-1.5 px-0.5">
            {[0, 25, 50, 75, 100].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onChange(v)}
                className={`text-[7px] font-mono transition-colors ${
                  volume === v
                    ? "text-gray-300"
                    : "text-gray-700 hover:text-gray-500"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* dB readout */}
        <div className="text-right shrink-0 w-12">
          <p
            className="text-sm font-mono font-bold tabular-nums"
            style={{ color }}
          >
            {displayVol}
            <span className="text-[8px] text-gray-600">%</span>
          </p>
          <p className="text-[8px] font-mono text-gray-600 tabular-nums">
            {db} dB
          </p>
        </div>
      </div>
    </div>
  );
}

/* --------------- Main Component --------------- */
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
  const effectiveMusicVol = ducking
    ? Math.round(musicVolume * 0.4)
    : musicVolume;

  return (
    <div className="space-y-3">
      {/* Channel strips */}
      <ChannelStrip
        label="Voice"
        icon="mic"
        volume={voiceVolume}
        onChange={onVoiceVolumeChange}
        color="#8B5CF6"
        muted={voiceVolume === 0}
        onMuteToggle={() =>
          onVoiceVolumeChange(voiceVolume === 0 ? 100 : 0)
        }
      />

      <ChannelStrip
        label="Music"
        icon="music_note"
        volume={musicVolume}
        effectiveVolume={effectiveMusicVol}
        onChange={onMusicVolumeChange}
        color="#a78bfa"
        muted={musicVolume === 0}
        onMuteToggle={() =>
          onMusicVolumeChange(musicVolume === 0 ? 40 : 0)
        }
        badge={
          ducking ? (
            <span className="text-[7px] font-bold text-amber-400/80 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              DUCK -8dB
            </span>
          ) : undefined
        }
      />

      {/* Master section */}
      <div className="rounded-xl bg-[#131316] border border-[#27272a] p-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Auto-Ducking */}
          <label
            htmlFor={duckingId}
            className="flex items-center gap-2.5 cursor-pointer group flex-1 min-w-[140px]"
          >
            <div
              className={[
                "w-9 h-5 rounded-full border transition-all duration-200 cursor-pointer flex items-center px-0.5",
                ducking
                  ? "bg-[#7c3aed] border-[#7c3aed]"
                  : "bg-[#27272a] border-[#3f3f46]",
              ].join(" ")}
              onClick={() => onDuckingChange(!ducking)}
            >
              <div
                className={[
                  "w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-200",
                  ducking ? "translate-x-[16px]" : "translate-x-0",
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
            <span className="text-[10px] font-semibold text-gray-300">
              Auto-Duck
            </span>
          </label>

          <div className="w-px h-8 bg-[#27272a] hidden sm:block" />

          {/* Output format */}
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-bold text-gray-600 uppercase tracking-wider">
              Out
            </span>
            <div className="flex items-center gap-1 bg-[#18181b] rounded-lg p-0.5">
              {(["wav", "mp3"] as OutputFormat[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => onFormatChange(f)}
                  className={[
                    "px-3 py-1 rounded-md text-[9px] font-bold uppercase transition-all duration-150",
                    format === f
                      ? "bg-[#7c3aed] text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-300",
                  ].join(" ")}
                >
                  {f}
                </button>
              ))}
            </div>
            <span className="text-[8px] text-gray-600 font-mono hidden sm:inline">
              {format === "wav" ? "44.1kHz 16-bit" : "192kbps"}
            </span>
          </div>
        </div>
      </div>

      {/* Status */}
      {mixLog && !mixError && (
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#131316] border border-[#27272a]">
          {isMixing ? (
            <div className="relative w-4 h-4 shrink-0">
              <svg
                className="animate-spin h-4 w-4 text-[#8b5cf6]"
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
          ) : (
            <Icon name="check_circle" className="text-sm text-green-500 shrink-0" />
          )}
          <span className="text-[10px] text-gray-400 flex-1">{mixLog}</span>
        </div>
      )}

      {mixError && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
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
      <div className="flex items-center gap-2 flex-wrap pt-1">
        {/* Primary: Mix button */}
        <button
          type="button"
          onClick={onMix}
          disabled={disabled || loading}
          className="flex-1 min-w-[120px] py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background:
              disabled || loading
                ? "#27272a"
                : "linear-gradient(135deg, #7c3aed, #a78bfa)",
            boxShadow:
              disabled || loading
                ? "none"
                : "0 4px 20px rgba(124,58,237,0.35)",
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
              Render Mix
            </>
          )}
        </button>

        {mixedAudioUrl && (
          <>
            <div className="w-px h-6 bg-[#27272a]" />
            <button
              type="button"
              onClick={() => onDownload?.("wav")}
              className="h-[44px] px-3 rounded-xl text-[10px] font-bold text-gray-500 border border-[#27272a] hover:border-green-500/30 hover:text-green-400 hover:bg-green-500/5 flex items-center gap-1.5 transition-all"
            >
              <Icon name="download" className="text-xs" />
              WAV
            </button>
            <button
              type="button"
              onClick={() => onDownload?.("mp3")}
              className="h-[44px] px-3 rounded-xl text-[10px] font-bold text-gray-500 border border-[#27272a] hover:border-green-500/30 hover:text-green-400 hover:bg-green-500/5 flex items-center gap-1.5 transition-all"
            >
              <Icon name="download" className="text-xs" />
              MP3
            </button>
          </>
        )}
      </div>
    </div>
  );
}
