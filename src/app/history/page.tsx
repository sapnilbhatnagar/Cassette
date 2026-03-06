"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import {
  getAllHistoryEntries,
  deleteHistoryEntry,
  createBlobUrlFromEntry,
  type HistoryEntry,
} from "@/lib/audio/history-store";
import { STORAGE_KEYS } from "@/constants/storage-keys";

type FilterType = "all" | "voice" | "mix";

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function formatDuration(seconds?: number): string {
  if (!seconds) return "-";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${s}s`;
}

interface PlayingState {
  id: string;
  url: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [playing, setPlaying] = useState<PlayingState | null>(null);
  const [loadedToWorkflow, setLoadedToWorkflow] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadEntries = useCallback(async () => {
    const all = await getAllHistoryEntries();
    setEntries(all);
    setLoaded(true);
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handlePlay = useCallback((entry: HistoryEntry) => {
    // Stop currently playing
    if (audioRef.current) {
      audioRef.current.pause();
      if (playing?.url) URL.revokeObjectURL(playing.url);
      setPlaying(null);
      if (playing?.id === entry.id) return; // toggle off
    }
    const url = createBlobUrlFromEntry(entry);
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play();
    audio.onended = () => {
      URL.revokeObjectURL(url);
      setPlaying(null);
      audioRef.current = null;
    };
    setPlaying({ id: entry.id, url });
  }, [playing]);

  const handleStop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (playing?.url) URL.revokeObjectURL(playing.url);
    setPlaying(null);
  }, [playing]);

  const handleDelete = useCallback(async (id: string) => {
    if (playing?.id === id) handleStop();
    await deleteHistoryEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, [playing, handleStop]);

  const handleLoadToWorkflow = useCallback((entry: HistoryEntry) => {
    const url = createBlobUrlFromEntry(entry);
    if (entry.entryType === "voice") {
      localStorage.setItem(STORAGE_KEYS.GENERATED_AUDIO, url);
      localStorage.setItem(STORAGE_KEYS.SELECTED_VOICE, entry.voiceId);
      // Restore the confirmed script so the mix page has everything it needs
      if (entry.scriptVariant) {
        localStorage.setItem(STORAGE_KEYS.CONFIRMED_SCRIPT, JSON.stringify(entry.scriptVariant));
      }
      setLoadedToWorkflow(entry.id);
      router.push("/mix");
    } else {
      localStorage.setItem(STORAGE_KEYS.GENERATED_MIX, url);
      if (entry.bedId) localStorage.setItem(STORAGE_KEYS.SELECTED_BED, entry.bedId);
      setLoadedToWorkflow(entry.id);
      router.push("/preview");
    }
  }, [router]);

  const filtered = entries.filter((e) => filter === "all" || e.entryType === filter);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0f0f12]">
      {/* Header */}
      <header className="px-4 py-4 md:px-8 md:py-6 border-b border-[#27272a] shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-0.5">
              Audio Library
            </p>
            <h1 className="text-xl md:text-2xl font-bold text-white">History</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1 hidden sm:block">
              Previously generated audio. Replay or load back into the workflow without re-generating.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 shrink-0">
            <Icon name="storage" className="text-base text-[#a78bfa]" />
            <span>{entries.length} saved</span>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2 mt-4">
          {(["all", "voice", "mix"] as FilterType[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={[
                "px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 capitalize",
                filter === f
                  ? "bg-[#8B5CF6]/15 text-[#a78bfa] border-[#8B5CF6]/30"
                  : "bg-transparent text-gray-500 border-[#27272a] hover:border-[#3f3f46] hover:text-gray-400",
              ].join(" ")}
            >
              {f === "all" ? `All (${entries.length})` : f === "voice" ? `Voice (${entries.filter((e) => e.entryType === "voice").length})` : `Mix (${entries.filter((e) => e.entryType === "mix").length})`}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        {!loaded ? (
          <div className="flex items-center justify-center py-24">
            <svg className="animate-spin h-6 w-6 text-[#8B5CF6]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#18181b] border border-[#27272a] flex items-center justify-center mb-4">
              <Icon name="library_music" className="text-2xl text-gray-600" />
            </div>
            <p className="text-white font-semibold mb-1">No audio saved yet</p>
            <p className="text-gray-500 text-sm max-w-xs">
              Generate voice audio or a mix. It will appear here automatically so you can replay it later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((entry) => (
              <HistoryCard
                key={entry.id}
                entry={entry}
                isPlaying={playing?.id === entry.id}
                loadedToWorkflow={loadedToWorkflow === entry.id}
                onPlay={() => handlePlay(entry)}
                onStop={handleStop}
                onDelete={() => handleDelete(entry.id)}
                onLoadToWorkflow={() => handleLoadToWorkflow(entry)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface HistoryCardProps {
  entry: HistoryEntry;
  isPlaying: boolean;
  loadedToWorkflow: boolean;
  onPlay: () => void;
  onStop: () => void;
  onDelete: () => void;
  onLoadToWorkflow: () => void;
}

function HistoryCard({
  entry,
  isPlaying,
  loadedToWorkflow,
  onPlay,
  onStop,
  onDelete,
  onLoadToWorkflow,
}: HistoryCardProps) {
  const isVoice = entry.entryType === "voice";
  const accentColor = isVoice ? "#8B5CF6" : "#10b981";
  const accentBg = isVoice ? "rgba(139,92,246,0.1)" : "rgba(16,185,129,0.1)";
  const accentBorder = isVoice ? "rgba(139,92,246,0.2)" : "rgba(16,185,129,0.2)";

  return (
    <div
      className="bg-[#18181b] border border-[#27272a] rounded-2xl overflow-hidden flex flex-col hover:border-[#3f3f46] transition-all duration-150"
    >
      {/* Top bar: type badge + time */}
      <div className="px-4 pt-4 flex items-center justify-between mb-3">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border"
          style={{ color: accentColor, backgroundColor: accentBg, borderColor: accentBorder }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
          {isVoice ? "Voice" : "Mix"}
        </span>
        <span className="text-[10px] text-gray-600">{formatRelativeTime(entry.createdAt)}</span>
      </div>

      {/* Script title */}
      <div className="px-4 mb-3">
        <h3 className="text-sm font-bold text-white truncate">{entry.scriptTitle || "Untitled Script"}</h3>
        <div className="flex items-center gap-1.5 mt-1">
          <Icon name="record_voice_over" className="text-xs text-gray-600" />
          <span className="text-[11px] text-gray-500 truncate">{entry.voiceName}</span>
          {entry.bedName && (
            <>
              <span className="text-gray-700">·</span>
              <Icon name="music_note" className="text-xs text-gray-600" />
              <span className="text-[11px] text-gray-500 truncate">{entry.bedName}</span>
            </>
          )}
        </div>
      </div>

      {/* Waveform placeholder + duration */}
      <div
        className="mx-4 mb-3 rounded-lg flex items-center justify-between px-3 py-2"
        style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid #27272a" }}
      >
        {/* Simple animated bars as visual indicator */}
        <div className="flex items-end gap-0.5 h-6">
          {Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className="w-0.5 rounded-full"
              style={{
                height: `${Math.max(20, Math.sin(i * 0.8) * 40 + 50)}%`,
                backgroundColor: isPlaying ? accentColor : "#3f3f46",
                opacity: isPlaying ? 1 : 0.6,
                transition: "background-color 0.3s",
              }}
            />
          ))}
        </div>
        {entry.durationSeconds !== undefined && (
          <span className="text-[10px] font-mono text-gray-600 ml-2 shrink-0">
            {formatDuration(entry.durationSeconds)}
          </span>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-4 pb-4 mt-auto flex items-center gap-2">
        {/* Play / Stop */}
        <button
          type="button"
          onClick={isPlaying ? onStop : onPlay}
          className="flex items-center justify-center w-8 h-8 rounded-full transition-all duration-150 shrink-0"
          style={{
            backgroundColor: isPlaying ? accentColor : "rgba(139,92,246,0.12)",
            color: isPlaying ? "#fff" : accentColor,
          }}
          aria-label={isPlaying ? "Stop" : "Play"}
        >
          <Icon name={isPlaying ? "stop" : "play_arrow"} className="text-base" filled />
        </button>

        {/* Load to workflow */}
        <button
          type="button"
          onClick={onLoadToWorkflow}
          className={[
            "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all duration-150",
            loadedToWorkflow
              ? "bg-green-500/10 border-green-500/20 text-green-400"
              : "bg-transparent border-[#27272a] text-gray-400 hover:border-[#3f3f46] hover:text-gray-200",
          ].join(" ")}
          aria-label="Load to workflow"
        >
          {loadedToWorkflow ? (
            <>
              <Icon name="check_circle" className="text-sm text-green-400" />
              Loading...
            </>
          ) : (
            <>
              <Icon name="upload" className="text-sm" />
              {entry.entryType === "voice" ? "Load to Mix" : "Load to Review"}
            </>
          )}
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={onDelete}
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 shrink-0"
          aria-label="Delete entry"
        >
          <Icon name="delete" className="text-base" />
        </button>
      </div>
    </div>
  );
}
