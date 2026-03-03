"use client";

import React, { useState, useMemo } from "react";
import VoiceCard from "@/components/voice/VoiceCard";
import Icon from "@/components/ui/Icon";
import { VOICES, ACCENT_OPTIONS } from "@/constants/voices";

interface VoiceSelectorProps {
  onSelect: (voiceId: string) => void;
  selectedVoiceId?: string;
  onTryScript?: (voiceId: string) => void;
  tryScriptLoadingId?: string;
}

type GenderFilter = "all" | "male" | "female";

const TONE_OPTIONS = [...new Set(VOICES.map((v) => v.tone))].sort();

export default function VoiceSelector({
  onSelect,
  selectedVoiceId,
  onTryScript,
  tryScriptLoadingId,
}: VoiceSelectorProps) {
  const [genderFilter, setGenderFilter] = useState<GenderFilter>("all");
  const [accentFilter, setAccentFilter] = useState<string>("all");
  const [toneFilter, setToneFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredVoices = useMemo(() => {
    return VOICES.filter((v) => {
      const matchesGender = genderFilter === "all" || v.gender === genderFilter;
      const matchesAccent = accentFilter === "all" || v.accent === accentFilter;
      const matchesTone = toneFilter === "all" || v.tone === toneFilter;
      const matchesSearch =
        !searchQuery ||
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.tone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.accent.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesGender && matchesAccent && matchesTone && matchesSearch;
    });
  }, [genderFilter, accentFilter, toneFilter, searchQuery]);

  const hasActiveFilters =
    genderFilter !== "all" ||
    accentFilter !== "all" ||
    toneFilter !== "all" ||
    searchQuery !== "";

  const resetFilters = () => {
    setGenderFilter("all");
    setAccentFilter("all");
    setToneFilter("all");
    setSearchQuery("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Filter pills section */}
      <div className="px-8 pb-4 border-b border-[#2A2B35]">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Icon
              name="search"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-600 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search voices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-40 pl-8 pr-3 py-1.5 rounded-full text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-[#8B5CF6]/50 transition-colors border"
              style={{ backgroundColor: "#161821", borderColor: "#2A2B35" }}
            />
          </div>

          {/* Tone filter */}
          <FilterChip
            label="Tone"
            value={toneFilter}
            options={TONE_OPTIONS}
            onChange={setToneFilter}
          />

          {/* Gender filter */}
          <FilterChip
            label="Gender"
            value={genderFilter}
            options={["male", "female"]}
            onChange={(v) => setGenderFilter(v as GenderFilter)}
          />

          {/* Accent filter */}
          <FilterChip
            label="Accent"
            value={accentFilter}
            options={ACCENT_OPTIONS}
            onChange={setAccentFilter}
          />

          {/* Reset */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-[#8B5CF6] hover:text-[#A78BFA] font-medium transition-colors ml-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Scrollable voice grid */}
      <div className="flex-1 overflow-y-auto px-8 py-4">
        {filteredVoices.length === 0 ? (
          <div
            className="rounded-xl border border-dashed p-10 text-center"
            style={{ borderColor: "#2A2B35" }}
          >
            <p className="text-sm text-gray-500">
              No voices match the selected filters.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-3 text-[#8B5CF6] text-sm hover:text-[#A78BFA] transition-colors font-medium"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredVoices.map((voice) => (
              <VoiceCard
                key={voice.voiceId}
                voice={voice}
                selected={selectedVoiceId === voice.voiceId}
                onSelect={() => onSelect(voice.voiceId)}
                onTryScript={
                  onTryScript ? () => onTryScript(voice.voiceId) : undefined
                }
                tryScriptLoading={tryScriptLoadingId === voice.voiceId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- Filter Chip ---- */

interface FilterChipProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}

function FilterChip({ label, value, options, onChange }: FilterChipProps) {
  const isActive = value !== "all";

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={[
          "appearance-none pl-3 pr-7 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-all duration-150 focus:outline-none",
          isActive
            ? "text-white border-[#8B5CF6]/50"
            : "text-gray-300 hover:border-[#8B5CF6]/30",
        ].join(" ")}
        style={{
          backgroundColor: isActive
            ? "linear-gradient(135deg, #8B5CF6, #7c3aed)"
            : "#161821",
          background: isActive
            ? "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(124,58,237,0.25))"
            : "#161821",
          borderColor: isActive ? "rgba(139,92,246,0.5)" : "#2A2B35",
        }}
      >
        <option value="all" style={{ backgroundColor: "#161821" }}>
          {label}
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt} style={{ backgroundColor: "#161821" }}>
            {opt.charAt(0).toUpperCase() + opt.slice(1)}
          </option>
        ))}
      </select>
      <Icon
        name="expand_more"
        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none"
      />
    </div>
  );
}
