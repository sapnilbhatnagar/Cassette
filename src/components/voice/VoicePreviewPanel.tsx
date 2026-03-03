"use client";

import React, { useState, useEffect } from "react";
import Icon from "@/components/ui/Icon";
import AudioPlayer from "@/components/voice/AudioPlayer";
import SynthesisVisualizer from "@/components/voice/SynthesisVisualizer";
import type { VoiceOption } from "@/constants/voices";
import type { ScriptVariant } from "@/types/ad-brief";

export interface VoiceSettings {
  stability: number;
  similarityBoost: number;
  style: number;
  useSpeakerBoost: boolean;
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  stability: 0.5,
  similarityBoost: 0.8,
  style: 0.3,
  useSpeakerBoost: true,
};

// ---- Presets ----
interface Preset {
  id: string;
  label: string;
  description: string;
  icon: string;
  settings: VoiceSettings;
}

const PRESETS: Preset[] = [
  {
    id: "radio",
    label: "Radio Presenter",
    description: "Broadcast-ready, polished & confident",
    icon: "radio",
    settings: { stability: 0.5, similarityBoost: 0.8, style: 0.3, useSpeakerBoost: true },
  },
  {
    id: "natural",
    label: "Natural & Warm",
    description: "Conversational, human, not robotic",
    icon: "sentiment_satisfied",
    settings: { stability: 0.3, similarityBoost: 0.75, style: 0.1, useSpeakerBoost: true },
  },
  {
    id: "energetic",
    label: "Energetic DJ",
    description: "High energy, enthusiastic, punchy",
    icon: "bolt",
    settings: { stability: 0.2, similarityBoost: 0.7, style: 0.65, useSpeakerBoost: true },
  },
  {
    id: "narrator",
    label: "Professional",
    description: "Calm, authoritative, trustworthy",
    icon: "record_voice_over",
    settings: { stability: 0.78, similarityBoost: 0.9, style: 0.0, useSpeakerBoost: true },
  },
];

interface VoicePreviewPanelProps {
  selectedVoice: VoiceOption | null;
  confirmedScript: ScriptVariant | null;
  isSynthesizing: boolean;
  audioUrl: string;
  onGenerateAudio: () => void;
  onSettingsChange: (settings: VoiceSettings) => void;
}

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function FriendlySlider({
  label,
  leftLabel,
  rightLabel,
  value,
  onChange,
}: {
  label: string;
  leftLabel: string;
  rightLabel: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-gray-300">{label}</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#8B5CF6]"
        style={{ backgroundColor: "#27272a" }}
      />
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-gray-600">{leftLabel}</span>
        <span className="text-[10px] text-gray-600">{rightLabel}</span>
      </div>
    </div>
  );
}

export default function VoicePreviewPanel({
  selectedVoice,
  confirmedScript,
  isSynthesizing,
  audioUrl,
  onGenerateAudio,
  onSettingsChange,
}: VoicePreviewPanelProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<VoiceSettings>(DEFAULT_VOICE_SETTINGS);
  const [activePresetId, setActivePresetId] = useState<string>("radio");
  const [settingsChanged, setSettingsChanged] = useState(false);

  useEffect(() => {
    if (!isSynthesizing) { setElapsedSeconds(0); return; }
    // Synthesis started — settings are being applied
    setSettingsChanged(false);
    const interval = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isSynthesizing]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const applyPreset = (preset: Preset) => {
    setActivePresetId(preset.id);
    setSettings(preset.settings);
    onSettingsChange(preset.settings);
    if (audioUrl) setSettingsChanged(true);
  };

  const updateSetting = <K extends keyof VoiceSettings>(key: K, value: VoiceSettings[K]) => {
    setActivePresetId("custom");
    const next = { ...settings, [key]: value };
    setSettings(next);
    onSettingsChange(next);
    if (audioUrl) setSettingsChanged(true);
  };

  // Waveform progress — rough 30s estimated total
  const synthProgress = isSynthesizing
    ? Math.min(100, (elapsedSeconds / 30) * 100)
    : audioUrl
    ? 100
    : 0;

  return (
    <div
      className="flex flex-col gap-4 p-5 rounded-xl border"
      style={{ backgroundColor: "#161821", borderColor: "rgba(255,255,255,0.05)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Preview &amp; Analysis</h2>
          <p className="text-sm text-gray-500 mt-0.5">Real-time synthesis monitor</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
            aria-label="Microphone settings"
          >
            <Icon name="mic" className="text-lg" />
          </button>
          <button
            type="button"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
            aria-label="Share"
          >
            <Icon name="ios_share" className="text-lg" />
          </button>
        </div>
      </div>

      {!selectedVoice ? (
        /* Empty state */
        <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
          >
            <Icon name="record_voice_over" className="text-3xl text-gray-600" />
          </div>
          <p className="text-gray-400 font-medium text-sm">Select a voice to preview</p>
          <p className="text-gray-600 text-xs mt-1">Choose from the voice library on the left</p>
        </div>
      ) : (
        <>
          {/* Active voice card */}
          <div
            className="flex items-center gap-3 p-4 rounded-lg border"
            style={{ backgroundColor: "#11131A", borderColor: "rgba(255,255,255,0.05)" }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(139,92,246,0.3) 0%, rgba(59,130,246,0.3) 100%)",
                border: "1px solid rgba(139,92,246,0.2)",
              }}
            >
              {getInitials(selectedVoice.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">{selectedVoice.name}</p>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{ backgroundColor: "rgba(139,92,246,0.15)", color: "#A78BFA" }}
                >
                  {selectedVoice.accent}
                </span>
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{ backgroundColor: "#27272a", color: "#A1A1AA" }}
                >
                  {selectedVoice.tone}
                </span>
              </div>
            </div>
            <span
              className={[
                "shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                audioUrl
                  ? "border-green-800 text-green-400"
                  : "border-amber-800 text-amber-400",
              ].join(" ")}
              style={{
                backgroundColor: audioUrl ? "rgba(34,197,94,0.08)" : "rgba(251,191,36,0.08)",
              }}
            >
              <span
                className={[
                  "w-1.5 h-1.5 rounded-full",
                  audioUrl ? "bg-green-500" : "bg-amber-400 animate-pulse",
                ].join(" ")}
              />
              {audioUrl ? "Ready" : "Standby"}
            </span>
          </div>

          {/* Synthesis status + waveform */}
          <div
            className="p-5 rounded-lg border"
            style={{ backgroundColor: "#11131A", borderColor: "rgba(255,255,255,0.05)" }}
          >
            {/* Status label */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span
                  className={[
                    "w-2 h-2 rounded-full",
                    isSynthesizing
                      ? "bg-[#8B5CF6] animate-pulse"
                      : audioUrl
                      ? "bg-green-500"
                      : "bg-gray-600",
                  ].join(" ")}
                />
                <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                  {isSynthesizing
                    ? "Synthesis Active"
                    : audioUrl
                    ? "Audio Ready"
                    : "Awaiting Synthesis"}
                </span>
              </div>
              <span className="text-xs font-mono text-gray-500">
                {formatTimer(elapsedSeconds)} / 00:30
              </span>
            </div>

            {/* Waveform bars */}
            <SynthesisVisualizer active={isSynthesizing || !!audioUrl} />

            {/* Progress bar */}
            <div
              className="h-1 rounded-full mt-3 overflow-hidden"
              style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${synthProgress}%`,
                  backgroundColor: "#8B5CF6",
                }}
              />
            </div>
          </div>

          {/* Audio player after synthesis */}
          {audioUrl && !isSynthesizing && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-2">
                Your Ad Audio
              </p>
              <AudioPlayer src={audioUrl} />
            </div>
          )}

          {/* Generate button — no audio yet */}
          {!audioUrl && !isSynthesizing && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={onGenerateAudio}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-white text-sm font-semibold transition-all hover:scale-105 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)",
                  boxShadow: "0 4px 16px rgba(139,92,246,0.3)",
                }}
              >
                <Icon name="graphic_eq" className="text-base" filled />
                Synthesise · {selectedVoice.name}
              </button>
            </div>
          )}

          {/* Settings changed banner */}
          {settingsChanged && audioUrl && !isSynthesizing && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <p className="text-xs text-amber-300 flex-1">Style settings changed. Re-generate to hear the difference.</p>
            </div>
          )}

          {/* Re-generate after audio ready */}
          {audioUrl && !isSynthesizing && (
            <button
              type="button"
              onClick={onGenerateAudio}
              className="w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all border"
              style={settingsChanged ? {
                background: "linear-gradient(135deg, #8B5CF6 0%, #6d28d9 100%)",
                borderColor: "#8B5CF6",
                color: "#fff",
              } : {
                backgroundColor: "rgba(255,255,255,0.03)",
                borderColor: "#2A2B35",
                color: "#A1A1AA",
              }}
            >
              <Icon name="refresh" className="text-sm" />
              Re-generate with current style
            </button>
          )}

          {/* Script preview */}
          {confirmedScript && (
            <div
              className="rounded-lg border border-dashed p-4"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Script Preview
              </p>
              <p className={`text-xs text-gray-500 italic leading-relaxed ${audioUrl ? "" : "line-clamp-3"}`}>
                {confirmedScript.body}
              </p>
            </div>
          )}

          {/* Voice Style Settings */}
          <div
            className="rounded-lg border"
            style={{ borderColor: "#2A2B35" }}
          >
            <button
              type="button"
              onClick={() => setShowSettings((s) => !s)}
              className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-gray-400 hover:text-gray-200 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Icon name="tune" className="text-sm" />
                Voice Style Settings
                {activePresetId !== "custom" && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold capitalize"
                    style={{
                      backgroundColor: "rgba(139,92,246,0.15)",
                      color: "#A78BFA",
                    }}
                  >
                    {PRESETS.find((p) => p.id === activePresetId)?.label ?? ""}
                  </span>
                )}
              </span>
              <Icon name={showSettings ? "expand_less" : "expand_more"} className="text-base" />
            </button>

            {showSettings && (
              <div
                className="px-4 pb-4 space-y-4 overflow-y-auto"
                style={{ borderTop: "1px solid #2A2B35", maxHeight: "340px" }}
              >
                {/* Presets */}
                <div className="pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-2">
                    Quick Presets
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className={[
                          "text-left p-2.5 rounded-xl border transition-all duration-150",
                          activePresetId === preset.id
                            ? "border-[#8B5CF6]/50"
                            : "hover:border-[#8B5CF6]/20",
                        ].join(" ")}
                        style={{
                          backgroundColor:
                            activePresetId === preset.id
                              ? "rgba(139,92,246,0.1)"
                              : "rgba(255,255,255,0.02)",
                          borderColor:
                            activePresetId === preset.id
                              ? "rgba(139,92,246,0.4)"
                              : "#27272a",
                        }}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Icon
                            name={preset.icon}
                            className={[
                              "text-sm",
                              activePresetId === preset.id
                                ? "text-[#A78BFA]"
                                : "text-gray-500",
                            ].join(" ")}
                          />
                          <span
                            className={[
                              "text-[11px] font-bold",
                              activePresetId === preset.id
                                ? "text-[#A78BFA]"
                                : "text-gray-400",
                            ].join(" ")}
                          >
                            {preset.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-600 leading-tight">
                          {preset.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fine-tune sliders */}
                <div
                  className="p-3 rounded-xl border space-y-4"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.02)",
                    borderColor: "#27272a",
                  }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                    Fine-tune
                  </p>

                  <FriendlySlider
                    label="Enthusiasm"
                    leftLabel="Calm"
                    rightLabel="Enthusiastic"
                    value={settings.style}
                    onChange={(v) => updateSetting("style", v)}
                  />
                  <FriendlySlider
                    label="Consistency"
                    leftLabel="Expressive & Varied"
                    rightLabel="Stable & Consistent"
                    value={settings.stability}
                    onChange={(v) => updateSetting("stability", v)}
                  />
                  <FriendlySlider
                    label="Voice Clarity"
                    leftLabel="More Flexible"
                    rightLabel="Faithful to Voice"
                    value={settings.similarityBoost}
                    onChange={(v) => updateSetting("similarityBoost", v)}
                  />

                  {/* Vocal Boost toggle */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <p className="text-xs font-semibold text-gray-300">Vocal Boost</p>
                      <p className="text-[10px] text-gray-600">Enhances vocal presence</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateSetting("useSpeakerBoost", !settings.useSpeakerBoost)
                      }
                      className={[
                        "relative w-10 h-5 rounded-full transition-colors duration-200",
                        settings.useSpeakerBoost ? "bg-[#8B5CF6]" : "bg-[#27272a]",
                      ].join(" ")}
                      aria-label="Toggle vocal boost"
                    >
                      <span
                        className={[
                          "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200",
                          settings.useSpeakerBoost ? "translate-x-5" : "translate-x-0",
                        ].join(" ")}
                      />
                    </button>
                  </div>
                </div>

                {/* Apply button */}
                {audioUrl && (
                  <button
                    type="button"
                    onClick={onGenerateAudio}
                    className="w-full py-2 rounded-xl text-white text-xs font-bold transition-colors hover:opacity-90"
                    style={{ backgroundColor: "#8B5CF6" }}
                  >
                    Apply Style &amp; Re-generate
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
