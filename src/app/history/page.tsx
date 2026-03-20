"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import {
  getAllHistoryEntries,
  deleteHistoryEntry,
  createBlobUrlFromEntry,
  type HistoryEntry,
} from "@/lib/audio/history-store";
import { STORAGE_KEYS } from "@/constants/storage-keys";

/* ─── Types ──────────────────────────────────── */
type FilterType = "all" | "voice" | "mix";
type SortMode = "newest" | "oldest" | "name";

/* ─── Helpers ────────────────────────────────── */
function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function formatDuration(seconds?: number): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatAbsoluteDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDateGroup(ts: number): string {
  const now = new Date();
  const d = new Date(ts);
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const startOfYesterday = startOfToday - 86_400_000;
  const startOfWeek = startOfToday - now.getDay() * 86_400_000;

  if (ts >= startOfToday) return "Today";
  if (ts >= startOfYesterday) return "Yesterday";
  if (ts >= startOfWeek) return "This Week";
  return "Older";
}

/* ─── Playing state ──────────────────────────── */
interface PlayingState {
  id: string;
  url: string;
  progress: number;
  currentTime: number;
  duration: number;
}

/* ─── Main Page ──────────────────────────────── */
export default function HistoryPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [playing, setPlaying] = useState<PlayingState | null>(null);
  const [loadedToWorkflow, setLoadedToWorkflow] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animRef = useRef<number>(0);

  /* ── Load entries ── */
  const loadEntries = useCallback(async () => {
    const all = await getAllHistoryEntries();
    setEntries(all);
    setLoaded(true);
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  /* ── Playback progress polling ── */
  useEffect(() => {
    if (!playing) {
      cancelAnimationFrame(animRef.current);
      return;
    }
    let active = true;
    function tick() {
      if (!active) return;
      const audio = audioRef.current;
      if (audio && audio.duration > 0) {
        setPlaying((prev) =>
          prev
            ? {
                ...prev,
                progress: audio.currentTime / audio.duration,
                currentTime: audio.currentTime,
                duration: audio.duration,
              }
            : null
        );
      }
      animRef.current = requestAnimationFrame(tick);
    }
    animRef.current = requestAnimationFrame(tick);
    return () => {
      active = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [playing?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Playback controls ── */
  const handlePlay = useCallback(
    (entry: HistoryEntry) => {
      // Stop currently playing
      if (audioRef.current) {
        audioRef.current.pause();
        if (playing?.url) URL.revokeObjectURL(playing.url);
        if (playing?.id === entry.id) {
          setPlaying(null);
          audioRef.current = null;
          return;
        }
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
      setPlaying({
        id: entry.id,
        url,
        progress: 0,
        currentTime: 0,
        duration: entry.durationSeconds ?? 0,
      });
    },
    [playing]
  );

  const handleStop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (playing?.url) URL.revokeObjectURL(playing.url);
    setPlaying(null);
  }, [playing]);

  /* ── Seek ── */
  const handleSeek = useCallback(
    (fraction: number) => {
      const audio = audioRef.current;
      if (audio && audio.duration > 0) {
        audio.currentTime = fraction * audio.duration;
      }
    },
    []
  );

  /* ── Delete ── */
  const handleDelete = useCallback(
    async (id: string) => {
      if (playing?.id === id) handleStop();
      await deleteHistoryEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [playing, handleStop]
  );

  const handleBulkDelete = useCallback(async () => {
    for (const id of selectedIds) {
      if (playing?.id === id) handleStop();
      await deleteHistoryEntry(id);
    }
    setEntries((prev) => prev.filter((e) => !selectedIds.has(e.id)));
    setSelectedIds(new Set());
    setSelectMode(false);
    setShowDeleteConfirm(false);
  }, [selectedIds, playing, handleStop]);

  /* ── Download ── */
  const handleDownload = useCallback((entry: HistoryEntry) => {
    const url = createBlobUrlFromEntry(entry);
    const a = document.createElement("a");
    a.href = url;
    const ext = entry.entryType === "mix" ? "mp3" : "mp3";
    const name = (entry.scriptTitle || "audio")
      .replace(/[^a-zA-Z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase();
    a.download = `${name}-${entry.entryType}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, []);

  /* ── Load to workflow ── */
  const handleLoadToWorkflow = useCallback(
    (entry: HistoryEntry) => {
      const url = createBlobUrlFromEntry(entry);
      if (entry.entryType === "voice") {
        localStorage.setItem(STORAGE_KEYS.GENERATED_AUDIO, url);
        localStorage.setItem(STORAGE_KEYS.SELECTED_VOICE, entry.voiceId);
        if (entry.scriptVariant) {
          localStorage.setItem(
            STORAGE_KEYS.CONFIRMED_SCRIPT,
            JSON.stringify(entry.scriptVariant)
          );
        }
        setLoadedToWorkflow(entry.id);
        router.push("/mix");
      } else {
        localStorage.setItem(STORAGE_KEYS.GENERATED_MIX, url);
        if (entry.bedId)
          localStorage.setItem(STORAGE_KEYS.SELECTED_BED, entry.bedId);
        setLoadedToWorkflow(entry.id);
        router.push("/preview");
      }
    },
    [router]
  );

  /* ── Select toggle ── */
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /* ── Filtered & sorted ── */
  const processed = useMemo(() => {
    let result = entries.filter(
      (e) => filter === "all" || e.entryType === filter
    );

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          (e.scriptTitle || "").toLowerCase().includes(q) ||
          e.voiceName.toLowerCase().includes(q) ||
          (e.bedName || "").toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortMode) {
      case "newest":
        result.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case "oldest":
        result.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case "name":
        result.sort((a, b) =>
          (a.scriptTitle || "").localeCompare(b.scriptTitle || "")
        );
        break;
    }

    return result;
  }, [entries, filter, searchQuery, sortMode]);

  /* ── Group by date ── */
  const grouped = useMemo(() => {
    if (sortMode === "name") return [{ label: "All", entries: processed }];
    const groups: { label: string; entries: HistoryEntry[] }[] = [];
    const groupMap = new Map<string, HistoryEntry[]>();
    for (const entry of processed) {
      const label = getDateGroup(entry.createdAt);
      if (!groupMap.has(label)) {
        groupMap.set(label, []);
        groups.push({ label, entries: groupMap.get(label)! });
      }
      groupMap.get(label)!.push(entry);
    }
    return groups;
  }, [processed, sortMode]);

  const voiceCount = entries.filter((e) => e.entryType === "voice").length;
  const mixCount = entries.filter((e) => e.entryType === "mix").length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0f0f12]">
      {/* Header */}
      <header className="px-4 py-4 md:px-8 md:py-6 border-b border-[#27272a] shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-0.5">
              Audio Library
            </p>
            <h1 className="text-xl md:text-2xl font-bold text-white">
              History
            </h1>
            <p className="text-xs text-gray-500 mt-1 hidden sm:block">
              Replay, download, or load saved audio back into the workflow.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {/* Stats */}
            <div className="hidden sm:flex items-center gap-3 text-[10px] text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
                {voiceCount} voice
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {mixCount} mix
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-[#18181b] border border-[#27272a] rounded-lg px-2.5 py-1.5">
              <Icon name="storage" className="text-sm text-[#a78bfa]" />
              <span className="font-mono">{entries.length}</span>
            </div>
          </div>
        </div>

        {/* Toolbar row */}
        <div className="flex items-center gap-3 mt-4 flex-wrap">
          {/* Filter pills */}
          <div className="flex items-center gap-1.5">
            {(
              [
                { key: "all", label: "All", count: entries.length },
                { key: "voice", label: "Voice", count: voiceCount },
                { key: "mix", label: "Mix", count: mixCount },
              ] as { key: FilterType; label: string; count: number }[]
            ).map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={[
                  "px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all duration-150 uppercase tracking-wider",
                  filter === f.key
                    ? "bg-[#8B5CF6]/15 text-[#a78bfa] border-[#8B5CF6]/30"
                    : "bg-transparent text-gray-600 border-[#27272a] hover:border-[#3f3f46] hover:text-gray-400",
                ].join(" ")}
              >
                {f.label}{" "}
                <span className="font-mono ml-0.5 opacity-70">{f.count}</span>
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-[#27272a] hidden sm:block" />

          {/* Search */}
          <div className="relative flex-1 min-w-[160px] max-w-[280px]">
            <Icon
              name="search"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-600"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-[#131316] border border-[#27272a] rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-gray-300 placeholder-gray-600 focus:outline-none focus:border-[#8B5CF6]/40 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
              >
                <Icon name="close" className="text-[10px]" />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1 bg-[#131316] border border-[#27272a] rounded-lg p-0.5">
            {(
              [
                { key: "newest", icon: "arrow_downward", label: "Newest" },
                { key: "oldest", icon: "arrow_upward", label: "Oldest" },
                { key: "name", icon: "sort_by_alpha", label: "Name" },
              ] as { key: SortMode; icon: string; label: string }[]
            ).map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSortMode(s.key)}
                title={s.label}
                className={[
                  "px-2 py-1 rounded-md text-[9px] font-bold transition-all duration-150 flex items-center gap-1",
                  sortMode === s.key
                    ? "bg-[#7c3aed] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-300",
                ].join(" ")}
              >
                <Icon name={s.icon} className="text-[10px]" />
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-[#27272a] hidden sm:block" />

          {/* Select mode toggle */}
          <button
            type="button"
            onClick={() => {
              setSelectMode(!selectMode);
              if (selectMode) setSelectedIds(new Set());
            }}
            className={[
              "px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all duration-150 flex items-center gap-1.5",
              selectMode
                ? "bg-red-500/10 border-red-500/20 text-red-400"
                : "bg-transparent border-[#27272a] text-gray-500 hover:border-[#3f3f46] hover:text-gray-300",
            ].join(" ")}
          >
            <Icon
              name={selectMode ? "close" : "checklist"}
              className="text-xs"
            />
            {selectMode ? "Cancel" : "Select"}
          </button>

          {/* Bulk delete */}
          {selectMode && selectedIds.size > 0 && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all flex items-center gap-1.5"
            >
              <Icon name="delete" className="text-xs" />
              Delete {selectedIds.size}
            </button>
          )}
        </div>
      </header>

      {/* Bulk delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <Icon name="delete_forever" className="text-2xl text-red-400" />
            </div>
            <h3 className="text-white font-bold text-center mb-2">
              Delete {selectedIds.size} item{selectedIds.size > 1 ? "s" : ""}?
            </h3>
            <p className="text-gray-500 text-xs text-center mb-6">
              This action cannot be undone. The audio data will be permanently
              removed from your browser.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-gray-400 border border-[#27272a] hover:border-[#3f3f46] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-all"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        {!loaded ? (
          <div className="flex items-center justify-center py-24">
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
        ) : processed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#18181b] border border-[#27272a] flex items-center justify-center mb-4">
              <Icon
                name={searchQuery ? "search_off" : "library_music"}
                className="text-2xl text-gray-600"
              />
            </div>
            <p className="text-white font-semibold mb-1">
              {searchQuery ? "No results found" : "No audio saved yet"}
            </p>
            <p className="text-gray-500 text-sm max-w-xs">
              {searchQuery
                ? `Nothing matches "${searchQuery}". Try a different search.`
                : "Generate voice audio or a mix. It will appear here automatically."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map((group) => (
              <div key={group.label}>
                {/* Date group header */}
                {sortMode !== "name" && (
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                      {group.label}
                    </h3>
                    <div className="flex-1 h-px bg-[#27272a]" />
                    <span className="text-[9px] text-gray-600 font-mono">
                      {group.entries.length}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {group.entries.map((entry) => (
                    <HistoryCard
                      key={entry.id}
                      entry={entry}
                      playing={playing?.id === entry.id ? playing : null}
                      loadedToWorkflow={loadedToWorkflow === entry.id}
                      selectMode={selectMode}
                      isSelected={selectedIds.has(entry.id)}
                      onPlay={() => handlePlay(entry)}
                      onStop={handleStop}
                      onSeek={handleSeek}
                      onDelete={() => handleDelete(entry.id)}
                      onDownload={() => handleDownload(entry)}
                      onLoadToWorkflow={() => handleLoadToWorkflow(entry)}
                      onToggleSelect={() => toggleSelect(entry.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── History Card ───────────────────────────── */
interface HistoryCardProps {
  entry: HistoryEntry;
  playing: PlayingState | null;
  loadedToWorkflow: boolean;
  selectMode: boolean;
  isSelected: boolean;
  onPlay: () => void;
  onStop: () => void;
  onSeek: (fraction: number) => void;
  onDelete: () => void;
  onDownload: () => void;
  onLoadToWorkflow: () => void;
  onToggleSelect: () => void;
}

function HistoryCard({
  entry,
  playing,
  loadedToWorkflow,
  selectMode,
  isSelected,
  onPlay,
  onStop,
  onSeek,
  onDelete,
  onDownload,
  onLoadToWorkflow,
  onToggleSelect,
}: HistoryCardProps) {
  const isVoice = entry.entryType === "voice";
  const isPlaying = playing !== null;
  const accentColor = isVoice ? "#8B5CF6" : "#10b981";

  const progressBarRef = useRef<HTMLDivElement>(null);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isPlaying) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const fraction = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width)
      );
      onSeek(fraction);
    },
    [isPlaying, onSeek]
  );

  return (
    <div
      className={[
        "relative bg-[#18181b] border rounded-2xl overflow-hidden flex flex-col transition-all duration-150 group",
        isSelected
          ? "border-red-500/40 bg-red-500/5"
          : "border-[#27272a] hover:border-[#3f3f46]",
      ].join(" ")}
    >
      {/* Select checkbox overlay */}
      {selectMode && (
        <button
          type="button"
          onClick={onToggleSelect}
          className="absolute top-3 left-3 z-10 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all"
          style={{
            borderColor: isSelected ? "#ef4444" : "#3f3f46",
            backgroundColor: isSelected ? "#ef4444" : "transparent",
          }}
        >
          {isSelected && (
            <Icon name="check" className="text-[10px] text-white" />
          )}
        </button>
      )}

      {/* Top bar: type + timestamp */}
      <div
        className={[
          "px-4 pt-4 flex items-center justify-between mb-2",
          selectMode ? "pl-10" : "",
        ].join(" ")}
      >
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest"
          style={{
            color: accentColor,
            backgroundColor: `${accentColor}15`,
          }}
        >
          <Icon
            name={isVoice ? "mic" : "merge"}
            className="text-[9px]"
            style={{ color: accentColor }}
          />
          {isVoice ? "Voice" : "Mix"}
        </span>
        <span
          className="text-[9px] text-gray-600"
          title={formatAbsoluteDate(entry.createdAt)}
        >
          {formatRelativeTime(entry.createdAt)}
        </span>
      </div>

      {/* Track info */}
      <div className="px-4 mb-2">
        <h3 className="text-sm font-bold text-white truncate leading-tight">
          {entry.scriptTitle || "Untitled Script"}
        </h3>
        <div className="flex items-center gap-1.5 mt-1">
          <Icon name="record_voice_over" className="text-[10px] text-gray-600" />
          <span className="text-[10px] text-gray-500 truncate">
            {entry.voiceName}
          </span>
          {entry.bedName && (
            <>
              <span className="text-[10px] text-gray-700">&middot;</span>
              <Icon name="music_note" className="text-[10px] text-gray-600" />
              <span className="text-[10px] text-gray-500 truncate">
                {entry.bedName}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Waveform / Progress section */}
      <div className="mx-4 mb-3">
        <div
          ref={progressBarRef}
          className="relative rounded-lg overflow-hidden cursor-pointer"
          style={{
            backgroundColor: "rgba(255,255,255,0.03)",
            border: "1px solid #27272a",
          }}
          onClick={isPlaying ? handleProgressClick : onPlay}
        >
          {/* Waveform bars */}
          <div className="flex items-end gap-[2px] h-10 px-3 py-2">
            {Array.from({ length: 32 }).map((_, i) => {
              const barHeight =
                Math.abs(Math.sin(i * 0.6 + 0.5) * 0.6 + Math.cos(i * 1.2) * 0.3) *
                  100;
              const filled =
                isPlaying && playing ? i / 32 <= playing.progress : false;
              return (
                <div
                  key={i}
                  className="flex-1 rounded-sm transition-colors duration-100"
                  style={{
                    height: `${Math.max(15, barHeight)}%`,
                    backgroundColor: filled
                      ? accentColor
                      : isPlaying
                        ? `${accentColor}30`
                        : "#27272a",
                  }}
                />
              );
            })}
          </div>

          {/* Progress overlay */}
          {isPlaying && playing && (
            <div
              className="absolute bottom-0 left-0 h-0.5"
              style={{
                width: `${playing.progress * 100}%`,
                backgroundColor: accentColor,
              }}
            />
          )}

          {/* Play overlay icon when not playing */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${accentColor}cc` }}
              >
                <Icon
                  name="play_arrow"
                  filled
                  className="text-base text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Time display */}
        <div className="flex items-center justify-between mt-1 px-0.5">
          <span className="text-[8px] font-mono text-gray-600">
            {isPlaying && playing
              ? formatDuration(playing.currentTime)
              : "0:00"}
          </span>
          <span className="text-[8px] font-mono text-gray-600">
            {formatDuration(entry.durationSeconds)}
          </span>
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-4 pb-3 mt-auto flex items-center gap-1.5">
        {/* Play / Stop */}
        <button
          type="button"
          onClick={isPlaying ? onStop : onPlay}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 shrink-0"
          style={{
            backgroundColor: isPlaying ? accentColor : `${accentColor}18`,
            color: isPlaying ? "#fff" : accentColor,
          }}
          aria-label={isPlaying ? "Stop" : "Play"}
        >
          <Icon
            name={isPlaying ? "stop" : "play_arrow"}
            className="text-sm"
            filled
          />
        </button>

        {/* Load to workflow */}
        <button
          type="button"
          onClick={onLoadToWorkflow}
          className={[
            "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold border transition-all duration-150",
            loadedToWorkflow
              ? "bg-green-500/10 border-green-500/20 text-green-400"
              : "bg-transparent border-[#27272a] text-gray-500 hover:border-[#3f3f46] hover:text-gray-200",
          ].join(" ")}
        >
          {loadedToWorkflow ? (
            <>
              <Icon name="check_circle" className="text-xs text-green-400" />
              Loaded
            </>
          ) : (
            <>
              <Icon name="upload" className="text-xs" />
              {isVoice ? "To Mix" : "To Review"}
            </>
          )}
        </button>

        {/* Download */}
        <button
          type="button"
          onClick={onDownload}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-[#a78bfa] hover:bg-[#8B5CF6]/10 border border-transparent hover:border-[#8B5CF6]/20 transition-all duration-150 shrink-0"
          aria-label="Download"
          title="Download audio"
        >
          <Icon name="download" className="text-sm" />
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={onDelete}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-150 shrink-0"
          aria-label="Delete"
        >
          <Icon name="delete" className="text-sm" />
        </button>
      </div>
    </div>
  );
}
