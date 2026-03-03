"use client";

import React, { useState } from "react";
import ScriptCard from "./ScriptCard";
import type { ScriptVariant } from "@/types/ad-brief";

interface ScriptResultsProps {
  variants: ScriptVariant[];
  onConfirm: (variant: ScriptVariant) => void;
  onVariantSelect?: (variant: ScriptVariant | null) => void;
  onToneChange?: (variantIndex: number, newTone: string) => void;
  regeneratingIndex?: number | null;
}

export default function ScriptResults({
  variants,
  onConfirm,
  onVariantSelect,
  onToneChange,
  regeneratingIndex = null,
}: ScriptResultsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(variants.length / 2);
  const pageVariants = variants.slice(page * 2, page * 2 + 2);

  const selectedVariant = variants.find((v) => v.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <h2 className="text-lg font-semibold text-white">Generated Drafts</h2>

      {/* Script cards grid — 2 per page, equal height */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {pageVariants.map((variant) => {
          const globalIndex = variants.findIndex((v) => v.id === variant.id);
          return (
            <ScriptCard
              key={variant.id}
              variant={variant}
              selected={variant.id === selectedId}
              onSelect={() => {
                const newId = selectedId === variant.id ? null : variant.id;
                setSelectedId(newId);
                onVariantSelect?.(newId ? variant : null);
              }}
              onToneChange={(newTone) => onToneChange?.(globalIndex, newTone)}
              isRegenerating={regeneratingIndex === globalIndex}
            />
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-1.5 rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
            </svg>
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i)}
              className={`h-2 rounded-full transition-all duration-200 ${
                i === page ? "bg-[#8B5CF6] w-6" : "bg-[#27272a] w-2 hover:bg-[#3a3a3a]"
              }`}
            />
          ))}
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="p-1.5 rounded-lg hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Continue CTA — full width */}
      <button
        type="button"
        disabled={!selectedVariant}
        onClick={() => { if (selectedVariant) onConfirm(selectedVariant); }}
        className={[
          "w-full py-3 rounded-xl text-sm font-bold transition-all duration-200",
          selectedVariant
            ? "bg-[#8B5CF6] hover:bg-[#7c3aed] text-white shadow-lg shadow-[#8B5CF6]/20"
            : "bg-[#1a1a1d] text-gray-600 cursor-not-allowed border border-[#27272a]",
        ].join(" ")}
      >
        {selectedVariant ? `Continue with "${selectedVariant.title}"` : "Select a draft to continue"}
      </button>
    </div>
  );
}
