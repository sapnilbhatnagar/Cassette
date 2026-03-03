"use client";

import React from "react";
import { REGIONS } from "@/constants/regions";
import Icon from "@/components/ui/Icon";

interface RegionSelectorProps {
  selectedRegionIds: string[];
  onChange: (ids: string[]) => void;
}

export default function RegionSelector({ selectedRegionIds, onChange }: RegionSelectorProps) {
  const allSelected = selectedRegionIds.length === REGIONS.length;

  function toggleAll() {
    onChange(allSelected ? [] : REGIONS.map((r) => r.id));
  }

  function toggleRegion(id: string) {
    onChange(
      selectedRegionIds.includes(id)
        ? selectedRegionIds.filter((rid) => rid !== id)
        : [...selectedRegionIds, id]
    );
  }

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-3 px-0.5">
        <button
          type="button"
          onClick={toggleAll}
          className="text-xs font-semibold text-[#8B5CF6] hover:text-[#a78bfa] transition-colors"
        >
          {allSelected ? "Deselect All" : "Select All"}
        </button>
        <span className="text-xs text-gray-500">
          {selectedRegionIds.length}/{REGIONS.length} selected
        </span>
      </div>

      {/* 2-column tile grid */}
      <div className="grid grid-cols-2 gap-2">
        {REGIONS.map((region) => {
          const sel = selectedRegionIds.includes(region.id);
          // Show up to 2 station brands, then overflow count
          const visibleBrands = region.stationBrands.slice(0, 2);
          const overflow = region.stationBrands.length - visibleBrands.length;

          return (
            <button
              key={region.id}
              type="button"
              onClick={() => toggleRegion(region.id)}
              className={[
                "relative text-left rounded-xl border p-3 transition-all duration-150 cursor-pointer group",
                sel
                  ? "bg-[#8B5CF6]/10 border-[#8B5CF6]/40 shadow-[0_0_12px_rgba(139,92,246,0.12)]"
                  : "bg-[#18181b] border-[#27272a] hover:border-[#3f3f46] hover:bg-[#1f1f22]",
              ].join(" ")}
            >
              {/* Checkmark badge — top right when selected */}
              <div className="absolute top-2.5 right-2.5">
                {sel ? (
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#8B5CF6]">
                    <Icon name="check" className="text-[10px] text-white" />
                  </span>
                ) : (
                  <span className="flex items-center justify-center w-4 h-4 rounded-full border border-[#3f3f46] bg-[#27272a] group-hover:border-[#8B5CF6]/40 transition-colors" />
                )}
              </div>

              {/* Region name */}
              <p className={[
                "text-xs font-bold pr-5 leading-snug mb-0.5 truncate",
                sel ? "text-white" : "text-gray-300",
              ].join(" ")}>
                {region.name}
              </p>

              {/* Reach */}
              <p className="text-[10px] text-gray-500 mb-2">
                <span className={sel ? "text-[#a78bfa] font-semibold" : "text-gray-400 font-semibold"}>
                  {region.reach}
                </span>
                {" "}listeners
              </p>

              {/* Station brand pills */}
              <div className="flex flex-wrap gap-1">
                {visibleBrands.map((brand) => (
                  <span
                    key={brand}
                    className={[
                      "inline-block px-1.5 py-0.5 rounded text-[9px] font-medium border",
                      sel
                        ? "bg-[#8B5CF6]/10 text-[#a78bfa] border-[#8B5CF6]/20"
                        : "bg-[#27272a] text-gray-500 border-[#3f3f46]",
                    ].join(" ")}
                  >
                    {brand}
                  </span>
                ))}
                {overflow > 0 && (
                  <span className="inline-block px-1.5 py-0.5 rounded text-[9px] text-gray-600 border border-[#27272a]">
                    +{overflow}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
