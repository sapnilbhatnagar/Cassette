"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import AudioPlayer from "@/components/voice/AudioPlayer";

interface VariantCardProps {
  regionName: string;
  stationBrands: string[];
  baseScript: string;
  localisedScript: string;
  audioUrl?: string;
  onGenerateAudio: () => void;
  audioLoading?: boolean;
  error?: string;
}

interface DiffToken {
  word: string;
  changed: boolean;
}

function buildDiff(base: string, localised: string): DiffToken[] {
  const baseWords = base.trim().split(/\s+/);
  const localisedWords = localised.trim().split(/\s+/);
  const baseSet = new Set(baseWords.map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, "")));

  return localisedWords.map((word) => {
    const cleaned = word.toLowerCase().replace(/[^a-z0-9]/g, "");
    const isStopWord = /^(a|an|the|and|or|but|in|on|at|to|for|of|with|by|from|is|it|its|was|are|were|be|been|has|had|have|this|that|they|we|you|he|she|i|not|so|as|do|did|will|would|can|could|should|shall|may|might|your|our|my|his|her|their|its|our|about|up|out|over|no|yes)$/.test(cleaned);
    const changed = !isStopWord && cleaned.length > 2 && !baseSet.has(cleaned);
    return { word, changed };
  });
}

function DiffText({ tokens }: { tokens: DiffToken[] }) {
  return (
    <p className="text-xs text-gray-400 leading-relaxed">
      {tokens.map((token, idx) => (
        <React.Fragment key={idx}>
          {token.changed ? (
            <span className="font-semibold" style={{ color: "#A78BFA" }}>
              {token.word}
            </span>
          ) : (
            <span>{token.word}</span>
          )}
          {idx < tokens.length - 1 ? " " : ""}
        </React.Fragment>
      ))}
    </p>
  );
}

export default function VariantCard({
  regionName,
  stationBrands,
  baseScript,
  localisedScript,
  audioUrl,
  onGenerateAudio,
  audioLoading = false,
  error,
}: VariantCardProps) {
  const [expanded, setExpanded] = useState(false);
  const tokens = localisedScript ? buildDiff(baseScript, localisedScript) : [];
  const changedCount = tokens.filter((t) => t.changed).length;

  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-lg overflow-hidden flex flex-col">
      {/* Header — compact */}
      <div className="px-3 py-2.5 border-b border-[#27272a] flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <svg className="h-3.5 w-3.5 text-[#8B5CF6] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div className="min-w-0">
            <h3 className="text-white font-semibold text-xs truncate">{regionName}</h3>
            <p className="text-gray-600 text-[10px] truncate">{stationBrands.join(" · ")}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {localisedScript && (
            <span className="text-[10px] text-[#A78BFA] bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 rounded-full px-2 py-0.5 whitespace-nowrap">
              {changedCount} changes
            </span>
          )}
          {audioUrl && (
            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" title="Audio ready" />
          )}
        </div>
      </div>

      {/* Script body — fixed height, scrollable */}
      <div className="px-3 py-2.5 flex-1 min-h-0" style={{ height: "110px", overflowY: "auto" }}>
        {error ? (
          <p className="text-xs text-red-400">{error}</p>
        ) : localisedScript ? (
          <>
            <div className="flex items-center gap-1 mb-1.5 text-[9px] text-gray-600">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#A78BFA]" />
              <span style={{ color: "#A78BFA" }}>Localised</span>
              <span className="mx-1">·</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-600" />
              <span>Unchanged</span>
            </div>
            <DiffText tokens={tokens} />
          </>
        ) : (
          <p className="text-xs text-gray-500 italic">Generating...</p>
        )}
      </div>

      {/* Footer — audio controls */}
      {!error && localisedScript && (
        <div className="px-3 pb-3 pt-1 shrink-0 border-t border-[#27272a]">
          {audioUrl ? (
            <div className="space-y-1.5">
              <AudioPlayer src={audioUrl} />
              <a
                href={audioUrl}
                download={`cassette-${regionName.toLowerCase().replace(/\s+/g, "-")}.mp3`}
                className="inline-flex items-center gap-1 text-[10px] text-gray-600 hover:text-gray-400 transition-colors"
              >
                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Download
              </a>
            </div>
          ) : (
            <Button variant="secondary" size="sm" onClick={onGenerateAudio} loading={audioLoading} disabled={audioLoading}>
              {audioLoading ? "Generating..." : (
                <>
                  <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Generate Audio
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
