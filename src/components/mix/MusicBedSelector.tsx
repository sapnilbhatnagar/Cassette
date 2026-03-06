"use client";

import React, { useState, useMemo } from "react";
import { MUSIC_BEDS, MOOD_OPTIONS, type MoodOption } from "@/constants/music-beds";
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

  const filteredBeds = useMemo(() => {
    const filtered =
      activeMood === "all"
        ? MUSIC_BEDS
        : MUSIC_BEDS.filter((bed) => bed.mood === activeMood);

    // Sort: recommended beds first, then alphabetically
    return [...filtered].sort((a, b) => {
      const aRec = recommendedIds.includes(a.id);
      const bRec = recommendedIds.includes(b.id);
      if (aRec && !bRec) return -1;
      if (!aRec && bRec) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [activeMood, recommendedIds]);

  return (
    <div className="bg-[#18181b] border border-[#27272a]/50 rounded-xl p-4">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon name="library_music" className="text-sm text-[#a78bfa]" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">Music Bed</h2>
        </div>
        <span className="text-[9px] text-gray-500">
          {MUSIC_BEDS.length} tracks
        </span>
      </div>

      {/* Mood filter chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {MOOD_OPTIONS.map((mood) => (
          <button
            key={mood}
            type="button"
            onClick={() => setActiveMood(mood)}
            className={[
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 cursor-pointer capitalize",
              activeMood === mood
                ? "bg-[#7c3aed] border-[#7c3aed] text-white shadow-[0_0_12px_rgba(124,58,237,0.4)]"
                : "bg-[#18181b] border-[#27272a] text-gray-300 hover:border-[#3f3f46] hover:text-white",
            ].join(" ")}
          >
            {mood === "all" ? "All moods" : mood}
          </button>
        ))}
      </div>

      {/* Recommended count hint */}
      {recommendedIds.length > 0 && (
        <p className="text-xs text-gray-500 mb-3">
          <span className="text-[#a78bfa] font-semibold">{recommendedIds.length} recommended</span>
          {" "}based on your ad tone.
        </p>
      )}

      {/* 2-column card grid */}
      {filteredBeds.length === 0 ? (
        <div className="text-center py-10 text-gray-500 text-sm">
          No music beds match this mood filter.
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
