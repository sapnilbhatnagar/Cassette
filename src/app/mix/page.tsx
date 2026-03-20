"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import MusicBedSelector from "@/components/mix/MusicBedSelector";
import MixControls, { type OutputFormat } from "@/components/mix/MixControls";
import LiveMixPreview from "@/components/mix/LiveMixPreview";
import type { ScriptVariant } from "@/types/ad-brief";
import { MUSIC_BEDS } from "@/constants/music-beds";
import { VOICES } from "@/constants/voices";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import { matchMusicToTone } from "@/lib/audio/match-music";
import { RealtimeMixer } from "@/lib/audio/realtime-mixer";
import { saveBlobUrlToHistory } from "@/lib/audio/history-store";

interface MixState {
  voiceVolume: number;
  voice2Volume: number;
  musicVolume: number;
  ducking: boolean;
  format: OutputFormat;
}

export default function MixPage() {
  const [loaded, setLoaded] = useState(false);
  const [confirmedScript, setConfirmedScript] =
    useState<ScriptVariant | null>(null);
  const [voiceAudioUrl, setVoiceAudioUrl] = useState<string>("");
  const [voiceAudioUnavailable, setVoiceAudioUnavailable] = useState(false);
  const [selectedBedId, setSelectedBedId] = useState<string>("");
  const [recommendedIds, setRecommendedIds] = useState<string[]>([]);
  const [mixState, setMixState] = useState<MixState>({
    voiceVolume: 100,
    voice2Volume: 80,
    musicVolume: 40,
    ducking: true,
    format: "wav",
  });
  const [isMixing, setIsMixing] = useState(false);
  const [mixedAudioUrl, setMixedAudioUrl] = useState<string>("");
  const [mixError, setMixError] = useState<string | null>(null);
  const [mixLog, setMixLog] = useState<string>("");

  // Voice overlays
  const [voice2Id, setVoice2Id] = useState<string>("");
  const [voice2AudioUrl, setVoice2AudioUrl] = useState<string>("");
  const [isSynthesisingVoice2, setIsSynthesisingVoice2] = useState(false);
  const [voice2Error, setVoice2Error] = useState<string | null>(null);
  const primaryVoiceId =
    typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEYS.SELECTED_VOICE) ?? ""
      : "";

  // Realtime mixer
  const mixerRef = useRef<RealtimeMixer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mixCurrentTime, setMixCurrentTime] = useState(0);
  const [mixDuration, setMixDuration] = useState(0);
  const animRef = useRef<number>(0);

  useEffect(() => {
    mixerRef.current = new RealtimeMixer();
    return () => {
      mixerRef.current?.dispose();
    };
  }, []);

  // Poll mixer currentTime via rAF while playing
  useEffect(() => {
    if (!isPlaying) return;
    let active = true;
    function tick() {
      if (!active || !mixerRef.current) return;
      if (!mixerRef.current.playing) {
        setIsPlaying(false);
        setMixCurrentTime(0);
        return;
      }
      setMixCurrentTime(mixerRef.current.currentTime);
      animRef.current = requestAnimationFrame(tick);
    }
    animRef.current = requestAnimationFrame(tick);
    return () => {
      active = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying]);

  useEffect(() => {
    const rawScript = localStorage.getItem(STORAGE_KEYS.CONFIRMED_SCRIPT);
    if (rawScript) {
      try {
        const parsed = JSON.parse(rawScript) as ScriptVariant;
        setConfirmedScript(parsed);
        const recommended = matchMusicToTone(parsed.tone);
        setRecommendedIds(recommended);
        if (recommended.length > 0 && !selectedBedId)
          setSelectedBedId(recommended[0]);
      } catch {
        /* malformed */
      }
    }
    // Restore previously selected music bed (e.g. loaded from history)
    const savedBed = localStorage.getItem(STORAGE_KEYS.SELECTED_BED);
    if (savedBed && MUSIC_BEDS.find((b) => b.id === savedBed)) {
      setSelectedBedId(savedBed);
    }
    const savedAudioUrl = localStorage.getItem(STORAGE_KEYS.GENERATED_AUDIO);
    const validateAndSet = async () => {
      if (savedAudioUrl && savedAudioUrl.startsWith("blob:")) {
        try {
          const res = await fetch(savedAudioUrl);
          res.body?.cancel();
          if (res.ok) setVoiceAudioUrl(savedAudioUrl);
          else setVoiceAudioUnavailable(true);
        } catch {
          setVoiceAudioUnavailable(true);
        }
      } else {
        setVoiceAudioUnavailable(true);
      }
      const savedMix = localStorage.getItem(STORAGE_KEYS.GENERATED_MIX);
      if (savedMix && savedMix.startsWith("blob:")) {
        try {
          const res = await fetch(savedMix);
          res.body?.cancel();
          if (res.ok) setMixedAudioUrl(savedMix);
        } catch {
          /* stale */
        }
      }
      setLoaded(true);
    };
    validateAndSet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (voiceAudioUrl && mixerRef.current) {
      mixerRef.current
        .loadVoice(voiceAudioUrl)
        .then(() => {
          setMixDuration(mixerRef.current?.duration ?? 0);
        })
        .catch(() => {});
    }
  }, [voiceAudioUrl]);

  useEffect(() => {
    const bed = MUSIC_BEDS.find((b) => b.id === selectedBedId);
    if (bed && mixerRef.current) {
      mixerRef.current
        .loadMusic(`/music-beds/${bed.filename}`)
        .then(() => {
          setMixDuration(mixerRef.current?.duration ?? 0);
        })
        .catch(() => {});
    }
  }, [selectedBedId]);

  const handleVoiceVolumeChange = useCallback((v: number) => {
    setMixState((s) => ({ ...s, voiceVolume: v }));
    mixerRef.current?.setVoiceVolume(v / 100);
  }, []);
  const handleVoice2VolumeChange = useCallback((v: number) => {
    setMixState((s) => ({ ...s, voice2Volume: v }));
    mixerRef.current?.setVoice2Volume(v / 100);
  }, []);
  const handleMusicVolumeChange = useCallback(
    (v: number) => {
      setMixState((s) => ({ ...s, musicVolume: v }));
      const effective = mixState.ducking ? (v / 100) * 0.4 : v / 100;
      mixerRef.current?.setMusicVolume(effective);
    },
    [mixState.ducking]
  );

  const handleSynthesiseVoice2 = useCallback(async () => {
    if (!confirmedScript || !voice2Id) return;
    setIsSynthesisingVoice2(true);
    setVoice2Error(null);
    try {
      const res = await fetch("/api/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scriptText: confirmedScript.body,
          voiceId: voice2Id,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(
          (d as { error?: string }).error ?? "Synthesis failed."
        );
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setVoice2AudioUrl(url);
      await mixerRef.current?.loadVoice2(url);
    } catch (err) {
      setVoice2Error(
        err instanceof Error ? err.message : "Voice 2 synthesis failed."
      );
    } finally {
      setIsSynthesisingVoice2(false);
    }
  }, [confirmedScript, voice2Id]);

  const handleRemoveVoice2 = useCallback(() => {
    setVoice2AudioUrl("");
    setVoice2Id("");
    mixerRef.current?.clearVoice2();
  }, []);

  const handlePlayPause = useCallback(() => {
    if (!mixerRef.current) return;
    if (isPlaying) {
      mixerRef.current.pause();
      setIsPlaying(false);
    } else {
      mixerRef.current.play(
        mixState.voiceVolume / 100,
        mixState.ducking
          ? (mixState.musicVolume / 100) * 0.4
          : mixState.musicVolume / 100,
        mixState.voice2Volume / 100
      );
      setIsPlaying(true);
    }
  }, [isPlaying, mixState]);

  const handleStop = useCallback(() => {
    mixerRef.current?.stop();
    setIsPlaying(false);
    setMixCurrentTime(0);
  }, []);

  const handleSeek = useCallback(
    (time: number) => {
      if (!mixerRef.current) return;
      const clamped = Math.max(
        0,
        Math.min(time, mixerRef.current.duration)
      );
      mixerRef.current.seekTo(clamped);
      setMixCurrentTime(clamped);
    },
    []
  );

  const handleSkipMix = useCallback(
    (seconds: number) => {
      if (!mixerRef.current) return;
      const newTime = Math.max(
        0,
        Math.min(
          mixerRef.current.currentTime + seconds,
          mixerRef.current.duration
        )
      );
      mixerRef.current.seekTo(newTime);
      setMixCurrentTime(newTime);
    },
    []
  );

  const handleBedSelect = useCallback(
    (bedId: string) => {
      setSelectedBedId(bedId);
      localStorage.setItem(STORAGE_KEYS.SELECTED_BED, bedId);
      if (mixedAudioUrl) URL.revokeObjectURL(mixedAudioUrl);
      setMixedAudioUrl("");
      setMixError(null);
      setMixLog("");
      handleStop();
    },
    [handleStop, mixedAudioUrl]
  );

  const handleMix = useCallback(async () => {
    if (!voiceAudioUrl || !mixerRef.current) return;
    setMixError(null);
    if (mixedAudioUrl) URL.revokeObjectURL(mixedAudioUrl);
    setMixedAudioUrl("");
    setIsMixing(true);
    handleStop();
    setMixLog("Rendering final mix...");
    try {
      const blob = await mixerRef.current.exportMix({
        voiceVolume: mixState.voiceVolume / 100,
        voice2Volume: mixState.voice2Volume / 100,
        musicVolume: mixState.musicVolume / 100,
        ducking: mixState.ducking,
      });
      setMixLog("Encoding final mix...");
      const url = URL.createObjectURL(blob);
      setMixedAudioUrl(url);
      localStorage.setItem(STORAGE_KEYS.GENERATED_MIX, url);
      const selectedBed = MUSIC_BEDS.find((b) => b.id === selectedBedId);
      saveBlobUrlToHistory(url, {
        entryType: "mix",
        scriptTitle: confirmedScript?.title ?? "Untitled Script",
        voiceId: primaryVoiceId,
        voiceName:
          VOICES.find((v) => v.voiceId === primaryVoiceId)?.name ??
          primaryVoiceId,
        bedId: selectedBedId || undefined,
        bedName: selectedBed?.name,
      }).catch(() => {});
      const formatLabel =
        mixState.format === "wav" ? "WAV 44.1 kHz" : "MP3 192 kbps";
      const bedLabel = selectedBed
        ? ` + ${selectedBed.name}`
        : " (voice only)";
      setMixLog(
        `Mix complete: ${formatLabel}${bedLabel}${
          mixState.ducking && selectedBed ? " · ducking on" : ""
        }`
      );
    } catch (err) {
      console.error("[MixPage] export error:", err);
      const msg =
        err instanceof Error ? err.message : "Unknown error during mix.";
      if (msg.includes("Failed to fetch") || msg.includes("No voice buffer"))
        setMixError(
          "Voice audio expired. Re-generate on the Voice page."
        );
      else setMixError(msg);
      setMixLog("");
    } finally {
      setIsMixing(false);
    }
  }, [
    voiceAudioUrl,
    selectedBedId,
    mixState,
    mixedAudioUrl,
    handleStop,
    confirmedScript,
    primaryVoiceId,
  ]);

  useEffect(() => {
    if (voiceAudioUrl && !voiceAudioUnavailable && !isMixing && !mixedAudioUrl)
      handleMix();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBedId, voiceAudioUrl]);

  const handleDownload = useCallback(
    (fmt: OutputFormat) => {
      if (!mixedAudioUrl) return;
      const a = document.createElement("a");
      a.href = mixedAudioUrl;
      a.download = `mix-${Date.now()}.${fmt}`;
      a.click();
    },
    [mixedAudioUrl]
  );

  const canMix = !!voiceAudioUrl && !voiceAudioUnavailable;

  if (!loaded) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <svg
          className="animate-spin h-6 w-6 text-[#8B5CF6]"
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
    );
  }

  if (
    (voiceAudioUnavailable || (!voiceAudioUrl && !confirmedScript)) &&
    !mixedAudioUrl
  ) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="rounded-2xl border border-dashed border-[#27272a] p-8 sm:p-12 text-center max-w-md bg-[#18181b]">
          <div className="w-12 h-12 rounded-xl bg-[#27272a] flex items-center justify-center mx-auto mb-4">
            <Icon name="volume_off" className="text-2xl text-gray-500" />
          </div>
          <p className="text-white font-semibold mb-1">
            No voice audio
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Generate audio on the Voice page first.
          </p>
          <Link
            href="/voice"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7c3aed] text-white text-sm font-medium transition-all hover:opacity-90"
          >
            Go to Voice Synthesis
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-1 md:flex-row md:overflow-hidden">
      {/* Left Panel -- Controls */}
      <section className="w-full md:w-[420px] lg:w-[460px] md:shrink-0 flex flex-col border-b md:border-b-0 md:border-r border-[#27272a]">
        {/* Header */}
        <header className="px-4 py-3 md:px-6 md:py-4 border-b border-[#27272a]">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-xl font-bold text-white">
              Audio Mix
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {mixedAudioUrl && !isMixing && (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  Mixed
                </span>
              )}
              {isMixing && (
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#8B5CF6]/10 text-[#a78bfa] border border-[#8B5CF6]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#a78bfa] animate-pulse" />
                  Rendering
                </span>
              )}
            </div>
          </div>
          {/* Volume presets */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wider shrink-0">
              Presets
            </span>
            {[
              { label: "Voice Forward", voice: 100, music: 25, duck: true },
              { label: "Balanced", voice: 85, music: 50, duck: true },
              { label: "Music Heavy", voice: 70, music: 70, duck: false },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setMixState((s) => ({
                    ...s,
                    voiceVolume: preset.voice,
                    musicVolume: preset.music,
                    ducking: preset.duck,
                  }));
                  mixerRef.current?.setVoiceVolume(preset.voice / 100);
                  const effectiveMusic = preset.duck
                    ? (preset.music / 100) * 0.4
                    : preset.music / 100;
                  mixerRef.current?.setMusicVolume(effectiveMusic);
                }}
                className={[
                  "px-2.5 py-1 rounded-lg text-[9px] font-medium border transition-all",
                  mixState.voiceVolume === preset.voice &&
                  mixState.musicVolume === preset.music &&
                  mixState.ducking === preset.duck
                    ? "border-[#8B5CF6]/40 bg-[#8B5CF6]/10 text-[#a78bfa]"
                    : "border-[#27272a] text-gray-500 hover:text-gray-300 hover:border-[#3f3f46]",
                ].join(" ")}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </header>

        {/* Scrollable content */}
        <div className="p-4 space-y-4 md:flex-1 md:overflow-y-auto">
          {/* spacer */}
          {/* Mobile-only timeline preview */}
          <div className="md:hidden">
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="equalizer" className="text-sm text-[#a78bfa]" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  Preview
                </h2>
              </div>
              <LiveMixPreview
                isMixing={isMixing}
                voiceAudioUrl={voiceAudioUrl}
                voice2AudioUrl={voice2AudioUrl}
                isPlaying={isPlaying}
                currentTime={mixCurrentTime}
                duration={mixDuration}
                hasMix={!!voiceAudioUrl && !voiceAudioUnavailable}
                onPlayPause={handlePlayPause}
                onSkip={handleSkipMix}
                onSeek={handleSeek}
                voiceVolume={mixState.voiceVolume / 100}
                voice2Volume={mixState.voice2Volume / 100}
                musicVolume={
                  mixState.ducking
                    ? (mixState.musicVolume / 100) * 0.4
                    : mixState.musicVolume / 100
                }
                compact
              />
            </div>
          </div>

          {/* Music Bed Selection */}
          <MusicBedSelector
            onSelect={handleBedSelect}
            selectedBedId={selectedBedId}
            recommendedIds={recommendedIds}
          />

          {/* Voice Tracks */}
          <div className="bg-[#18181b] border border-[#27272a]/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Icon name="mic" className="text-sm text-[#a78bfa]" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Voices
              </h2>
            </div>

            {/* Track 1 -- primary */}
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-[#131316] border border-[#27272a] mb-2">
              <div className="w-7 h-7 rounded-full bg-[#8B5CF6]/15 flex items-center justify-center shrink-0">
                <Icon name="mic" className="text-xs text-[#a78bfa]" />
              </div>
              <p className="text-[11px] font-semibold text-white truncate flex-1 min-w-0">
                {VOICES.find((v) => v.voiceId === primaryVoiceId)?.name ??
                  "Primary Voice"}
              </p>
              <input
                type="range"
                min={0}
                max={100}
                value={mixState.voiceVolume}
                onChange={(e) =>
                  handleVoiceVolumeChange(Number(e.target.value))
                }
                className="w-20 h-1 rounded-full appearance-none cursor-pointer accent-[#8B5CF6]"
                style={{ backgroundColor: "#27272a" }}
              />
              <span className="text-[9px] font-mono text-gray-500 w-7 text-right">
                {mixState.voiceVolume}%
              </span>
            </div>

            {/* Track 2 -- optional */}
            {voice2AudioUrl ? (
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-[#131316] border border-[#8B5CF6]/20 mb-2">
                <div className="w-7 h-7 rounded-full bg-[#8B5CF6]/15 flex items-center justify-center shrink-0">
                  <Icon
                    name="record_voice_over"
                    className="text-xs text-[#a78bfa]"
                  />
                </div>
                <p className="text-[11px] font-semibold text-white truncate flex-1 min-w-0">
                  {VOICES.find((v) => v.voiceId === voice2Id)?.name ??
                    "Voice 2"}
                </p>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={mixState.voice2Volume}
                  onChange={(e) =>
                    handleVoice2VolumeChange(Number(e.target.value))
                  }
                  className="w-20 h-1 rounded-full appearance-none cursor-pointer accent-[#8B5CF6]"
                  style={{ backgroundColor: "#27272a" }}
                />
                <span className="text-[9px] font-mono text-gray-500 w-7 text-right">
                  {mixState.voice2Volume}%
                </span>
                <button
                  type="button"
                  onClick={handleRemoveVoice2}
                  className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                  title="Remove"
                >
                  <Icon name="close" className="text-[10px] text-red-400" />
                </button>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[#27272a] p-3">
                <div className="flex items-center gap-2">
                  <select
                    value={voice2Id}
                    onChange={(e) => setVoice2Id(e.target.value)}
                    className="flex-1 bg-[#131316] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-[11px] text-gray-300 focus:outline-none focus:border-[#8B5CF6] transition-colors"
                  >
                    <option value="">+ Add voice overlay...</option>
                    {VOICES.filter(
                      (v) => v.voiceId !== primaryVoiceId
                    ).map((v) => (
                      <option key={v.voiceId} value={v.voiceId}>
                        {v.name}: {v.tone}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleSynthesiseVoice2}
                    disabled={!voice2Id || isSynthesisingVoice2}
                    className="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed text-white"
                    style={{
                      background:
                        "linear-gradient(135deg, #7c3aed, #a78bfa)",
                    }}
                  >
                    {isSynthesisingVoice2 ? "..." : "Generate"}
                  </button>
                </div>
                {voice2Error && (
                  <p className="text-[9px] text-red-400 mt-1.5">
                    {voice2Error}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Level Controls */}
          <div className="bg-[#18181b] border border-[#27272a]/50 rounded-xl p-4">
            <MixControls
              voiceVolume={mixState.voiceVolume}
              musicVolume={mixState.musicVolume}
              ducking={mixState.ducking}
              format={mixState.format}
              onVoiceVolumeChange={handleVoiceVolumeChange}
              onMusicVolumeChange={handleMusicVolumeChange}
              onDuckingChange={(v) =>
                setMixState((s) => ({ ...s, ducking: v }))
              }
              onFormatChange={(f) =>
                setMixState((s) => ({ ...s, format: f }))
              }
              onMix={handleMix}
              onDownload={handleDownload}
              loading={isMixing}
              disabled={!canMix}
              mixedAudioUrl={mixedAudioUrl}
              isMixing={isMixing}
              mixLog={mixLog}
              mixError={mixError}
              onDismissError={() => setMixError(null)}
            />
          </div>

          {/* Proceed */}
          {mixedAudioUrl && !isMixing ? (
            <Link
              href="/preview"
              className="block w-full py-3 rounded-xl text-white font-bold text-sm text-center transition-all shadow-lg shadow-purple-900/40 hover:shadow-purple-900/60"
              style={{
                background:
                  "linear-gradient(to right, #8b5cf6, #d8b4fe)",
              }}
            >
              Proceed to Peer Review
            </Link>
          ) : (
            <button
              disabled
              className="w-full py-3 rounded-xl bg-[#27272a] text-gray-500 font-bold text-sm cursor-not-allowed"
            >
              {isMixing ? "Mixing..." : "Mix audio to proceed"}
            </button>
          )}
        </div>
      </section>

      {/* Right Panel -- DAW Timeline Preview -- desktop only */}
      <section className="hidden md:flex flex-1 flex-col overflow-hidden">
        <LiveMixPreview
          isMixing={isMixing}
          voiceAudioUrl={voiceAudioUrl}
          voice2AudioUrl={voice2AudioUrl}
          isPlaying={isPlaying}
          currentTime={mixCurrentTime}
          duration={mixDuration}
          hasMix={!!voiceAudioUrl && !voiceAudioUnavailable}
          onPlayPause={handlePlayPause}
          onSkip={handleSkipMix}
          onSeek={handleSeek}
          voiceVolume={mixState.voiceVolume / 100}
          voice2Volume={mixState.voice2Volume / 100}
          musicVolume={
            mixState.ducking
              ? (mixState.musicVolume / 100) * 0.4
              : mixState.musicVolume / 100
          }
        />
      </section>
    </div>
  );
}
