"use client";

import React, { useState, useRef, useEffect } from "react";
import type { ScriptVariant } from "@/types/ad-brief";

const PERSONALITIES = [
  { value: "friendly", label: "Friendly", emoji: "😊" },
  { value: "professional", label: "Professional", emoji: "💼" },
  { value: "urgent", label: "Urgent", emoji: "⚡" },
  { value: "humorous", label: "Humorous", emoji: "😄" },
  { value: "luxurious", label: "Luxurious", emoji: "✨" },
  { value: "energetic", label: "Energetic", emoji: "🔥" },
  { value: "warm", label: "Warm", emoji: "🤝" },
  { value: "authoritative", label: "Authoritative", emoji: "🎯" },
  { value: "playful", label: "Playful", emoji: "🎈" },
];

function getPersonality(tone: string) {
  return PERSONALITIES.find((p) => p.value.toLowerCase() === tone.toLowerCase())
    ?? { value: tone, label: tone, emoji: "🎙️" };
}

interface ScriptCardProps {
  variant: ScriptVariant;
  selected?: boolean;
  onSelect: () => void;
  onToneChange?: (newTone: string) => void;
  isRegenerating?: boolean;
}

export default function ScriptCard({
  variant,
  selected = false,
  onSelect,
  onToneChange,
  isRegenerating = false,
}: ScriptCardProps) {
  const [regenOpen, setRegenOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const personality = getPersonality(variant.tone);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setRegenOpen(false);
      }
    }
    if (regenOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [regenOpen]);

  return (
    <div
      className={[
        "flex flex-col rounded-xl border transition-all duration-150 relative overflow-hidden",
        // Fixed height so cards are symmetric with the live draft panel
        "h-[300px]",
        selected
          ? "border-[#8B5CF6] bg-[#8B5CF6]/5 shadow-lg shadow-[#8B5CF6]/10"
          : "border-[#27272a] bg-[#18181b] hover:border-[#3a3a3a]",
        isRegenerating ? "opacity-60 pointer-events-none" : "",
      ].join(" ")}
    >
      {/* Loading overlay */}
      {isRegenerating && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#18181b]/80 rounded-xl">
          <div className="flex flex-col items-center gap-3">
            <div className="w-5 h-5 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-400">Regenerating with new personality...</span>
          </div>
        </div>
      )}

      {/* Header — fixed */}
      <div
        className={[
          "px-4 py-3 border-b shrink-0",
          selected ? "border-[#8B5CF6]/20" : "border-[#27272a]",
        ].join(" ")}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-white font-semibold text-sm leading-snug truncate flex-1">
            {variant.title}
          </h3>
          {selected && (
            <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#8B5CF6] text-white">
              Selected
            </span>
          )}
        </div>

        {/* Meta + Personality */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#27272a] text-gray-400">
            {variant.wordCount}w · {variant.estimatedDuration}
          </span>

          {/* Personality badge */}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-[#a78bfa] capitalize">
            {personality.emoji} {personality.label}
          </span>
        </div>
      </div>

      {/* Script body — scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
        <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
          {variant.body}
        </p>
      </div>

      {/* Footer — fixed */}
      <div
        className={[
          "px-4 py-2.5 border-t shrink-0 flex items-center gap-2",
          selected ? "border-[#8B5CF6]/20" : "border-[#27272a]",
        ].join(" ")}
      >
        {/* Select button */}
        <button
          type="button"
          onClick={onSelect}
          className={[
            "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150",
            selected
              ? "bg-[#8B5CF6] text-white"
              : "bg-[#27272a] text-gray-300 hover:bg-[#3a3a3a] hover:text-white",
          ].join(" ")}
        >
          {selected ? "✓ Selected" : "Select Draft"}
        </button>

        {/* Regenerate with personality picker */}
        {onToneChange && (
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setRegenOpen(!regenOpen)}
              title="Regenerate with a different personality"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#1a1a1d] border border-[#27272a] text-gray-400 hover:border-[#8B5CF6]/40 hover:text-[#a78bfa] transition-all duration-150"
            >
              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Regen
            </button>

            {regenOpen && (
              <div className="absolute z-30 bottom-full right-0 mb-1 w-44 bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl shadow-2xl overflow-hidden py-1">
                <p className="text-[9px] font-bold uppercase tracking-wider text-gray-600 px-3 py-1.5">
                  Change Personality
                </p>
                {PERSONALITIES.filter((p) => p.value.toLowerCase() !== variant.tone.toLowerCase()).map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => {
                      setRegenOpen(false);
                      onToneChange(p.value);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-[#8B5CF6]/10 hover:text-[#a78bfa] transition-colors flex items-center gap-2"
                  >
                    <span>{p.emoji}</span>
                    <span className="capitalize">{p.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
