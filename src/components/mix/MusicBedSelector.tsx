"use client";

import React, { useState, useMemo } from "react";
import {
  MUSIC_BEDS,
  MOOD_OPTIONS,
  type MoodOption,
} from "@/constants/music-beds";
import Icon from "@/components/ui/Icon";
import MusicBedCard from "./MusicBedCard";

interface MusicBedSelectorProps {
  onSelect: (bedId: string) => void;
  selectedBedId?: string;
  recommendedIds?: string[];
}

export default function MusicBedSelector({
  onSelect,
  selectedBedId,
  recommendedIds = [],
}: MusicBedSelectorProps) {
  const [activeMood, setActiveMood] = useState<MoodOption>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBeds = useMemo(() => {
    let filtered =
      activeMood === "all"
        ? MUSIC_BEDS
        : MUSIC_BEDS.filter((bed) => bed.mood === activeMood);

    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (bed) =>
          bed.name.toLowerCase().includes(q) ||
          bed.genre.toLowerCase().includes(q) ||
          bed.mood.toLowerCase().includes(q)
      );
    }

    // Sort: recommended beds first, then alphabetically
    return [...filtered].sort((a, b) => {
      const aRec = recommendedIds.includes(a.id);
      const bRec = recommendedIds.includes(b.id);
      if (aRec && !bRec) return -1;
      if (!aRec && bRec) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [activeMood, recommendedIds, searchQuery]);

  const selectedBed = MUSIC_BEDS.find((b) => b.id === selectedBedId);

  return (
    <div className="bg-[#18181b] border border-[#27272a]/50 rounded-xl p-4">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon name="library_music" className="text-sm text-[#a78bfa]" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Music Bed
          </h2>
        </div>
        <span className="text-[9px] text-gray-500">
          {filteredBeds.length}/{MUSIC_BEDS.length} tracks
        </span>
      </div>

      {/* Currently selected indicator */}
      {selectedBed && (
        <div className="flex items-center gap-2 mb-3 px-2.5 py-2 rounded-lg bg-[#8B5CF6]/10 border border-[#8B5CF6]/20">
          <Icon name="check_circle" className="text-sm text-[#a78bfa]" />
          <span className="text-[11px] text-[#a78bfa] font-medium truncate">
            {selectedBed.name}
          </span>
          <span className="text-[9px] text-[#a78bfa]/60 ml-auto capitalize shrink-0">
            {selectedBed.genre} &middot; {selectedBed.bpm} BPM
          </span>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-3">
        <Icon
          name="search"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-600"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tracks..."
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

      {/* Mood filter chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {MOOD_OPTIONS.map((mood) => (
          <button
            key={mood}
            type="button"
            onClick={() => setActiveMood(mood)}
            className={[
              "px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all duration-150 cursor-pointer capitalize",
              activeMood === mood
                ? "bg-[#7c3aed] border-[#7c3aed] text-white shadow-[0_0_12px_rgba(124,58,237,0.4)]"
                : "bg-[#18181b] border-[#27272a] text-gray-400 hover:border-[#3f3f46] hover:text-white",
            ].join(" ")}
          >
            {mood === "all" ? "All" : mood}
          </button>
        ))}
      </div>

      {/* Recommended count hint */}
      {recommendedIds.length > 0 && activeMood === "all" && !searchQuery && (
        <p className="text-[10px] text-gray-500 mb-3">
          <span className="text-[#a78bfa] font-semibold">
            {recommendedIds.length} recommended
          </span>{" "}
          for your tone
        </p>
      )}

      {/* 2-column card grid */}
      {filteredBeds.length === 0 ? (
        <div className="text-center py-8">
          <Icon name="search_off" className="text-xl text-gray-700 mb-2" />
          <p className="text-gray-500 text-xs">
            {searchQuery
              ? `No tracks match "${searchQuery}"`
              : "No music beds match this mood filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {filteredBeds.map((bed) => (
            <MusicBedCard
              key={bed.id}
              bed={bed}
              selected={selectedBedId === bed.id}
              onSelect={() => onSelect(bed.id)}
              recommended={recommendedIds.includes(bed.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
