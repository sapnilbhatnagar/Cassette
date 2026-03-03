"use client";

import React from "react";
import Button from "@/components/ui/Button";
import VariantCard from "@/components/localise/VariantCard";

export interface LocalisedVariant {
  regionId: string;
  regionName: string;
  stationBrands: string[];
  localisedScript: string;
  audioUrl?: string;
  audioLoading?: boolean;
  error?: string;
}

interface BatchProgress {
  current: number;
  total: number;
}

interface VariantListProps {
  variants: LocalisedVariant[];
  baseScript: string;
  onGenerateAudio: (regionId: string) => void;
  onGenerateAll: () => void;
  batchProgress?: BatchProgress;
  batchLoading?: boolean;
}

export default function VariantList({
  variants,
  baseScript,
  onGenerateAudio,
  onGenerateAll,
  batchProgress,
  batchLoading = false,
}: VariantListProps) {
  const totalVariants = variants.length;
  const generatedCount = variants.filter((v) => v.audioUrl).length;
  const hasAnyAudio = generatedCount > 0;
  const allGenerated = generatedCount === totalVariants && totalVariants > 0;

  // Progress bar percentage
  const progressPercent = batchProgress
    ? Math.round((batchProgress.current / batchProgress.total) * 100)
    : 0;

  return (
    <div className="space-y-5">
      {/* Batch controls bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 rounded-xl bg-[#18181b] border border-[#27272a]">
        <div>
          <p className="text-sm font-medium text-white">
            {totalVariants} Regional Adaptation{totalVariants !== 1 ? "s" : ""}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {generatedCount === 0
              ? "No audio generated yet. Generate individually or all at once."
              : `${generatedCount} of ${totalVariants} audio files ready`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Batch generate all */}
          {!allGenerated && (
            <Button
              variant="primary"
              size="sm"
              onClick={onGenerateAll}
              loading={batchLoading}
              disabled={batchLoading}
            >
              {batchLoading ? (
                batchProgress
                  ? `Generating ${batchProgress.current}/${batchProgress.total}...`
                  : "Generating..."
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Generate All Audio
                </>
              )}
            </Button>
          )}

          {/* Download all as individual links (simple approach) */}
          {hasAnyAudio && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                variants.forEach((v) => {
                  if (v.audioUrl) {
                    const a = document.createElement("a");
                    a.href = v.audioUrl;
                    a.download = `cassette-${v.regionId}.mp3`;
                    a.click();
                  }
                });
              }}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Download All
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar (shown during batch generation) */}
      {batchLoading && batchProgress && (
        <div className="space-y-2">
          <div className="h-1.5 bg-[#27272a] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#8B5CF6] rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 text-right">
            {progressPercent}% complete &mdash; generating {batchProgress.current} of{" "}
            {batchProgress.total}
          </p>
        </div>
      )}

      {/* Variant cards grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {variants.map((variant) => (
          <VariantCard
            key={variant.regionId}
            regionName={variant.regionName}
            stationBrands={variant.stationBrands}
            baseScript={baseScript}
            localisedScript={variant.localisedScript}
            audioUrl={variant.audioUrl}
            onGenerateAudio={() => onGenerateAudio(variant.regionId)}
            audioLoading={variant.audioLoading}
            error={variant.error}
          />
        ))}
      </div>
    </div>
  );
}
