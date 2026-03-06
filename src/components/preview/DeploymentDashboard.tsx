"use client";

import React, { useState, useEffect, useMemo } from "react";
import Icon from "@/components/ui/Icon";
import { REGIONS } from "@/constants/regions";
import { STATIONS } from "@/constants/stations";
import type { LocalisedVariant } from "@/components/localise/VariantList";
import { STORAGE_KEYS } from "@/constants/storage-keys";

interface StationRecord {
  id: string;
  name: string;
  region: string;
  localised: boolean;
  status: "pending" | "delivered" | "failed";
}

interface DeploymentDashboardProps {
  scriptTitle: string;
  selectedRegionIds: string[];
  onClose: () => void;
}

function generateDeploymentId(): string {
  return `DEP-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

export default function DeploymentDashboard({
  scriptTitle,
  selectedRegionIds,
  onClose,
}: DeploymentDashboardProps) {
  const [records, setRecords] = useState<StationRecord[]>([]);
  const deploymentId = useMemo(() => generateDeploymentId(), []);
  const deploymentTime = useMemo(
    () =>
      new Date().toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    []
  );

  // Build station records from selected regions
  useEffect(() => {
    let variants: LocalisedVariant[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LOCALISED_VARIANTS);
      if (raw) variants = JSON.parse(raw) as LocalisedVariant[];
    } catch {
      /* ignore */
    }

    const list: StationRecord[] = [];
    const selectedRegions = REGIONS.filter((r) =>
      selectedRegionIds.includes(r.id)
    );

    selectedRegions.forEach((region) => {
      const hasVariant = variants.some((v) => v.regionId === region.id);
      region.stationBrands.forEach((brand) => {
        if (list.some((r) => r.name === brand)) return;
        list.push({
          id: `${brand}-${region.id}`,
          name: brand,
          region: region.name,
          localised: hasVariant,
          status: "pending",
        });
      });
    });

    // National stations always included
    STATIONS.filter((s) => s.region === "National").forEach((station) => {
      if (list.some((r) => r.name === station.name)) return;
      list.push({
        id: `${station.name}-national`,
        name: station.name,
        region: "National",
        localised: false,
        status: "pending",
      });
    });

    setRecords(list);
  }, [selectedRegionIds]);

  // Animate deliveries
  useEffect(() => {
    if (records.length === 0) return;
    let idx = 0;
    const interval = setInterval(() => {
      if (idx >= records.length) {
        clearInterval(interval);
        return;
      }
      setRecords((prev) =>
        prev.map((r, i) =>
          i === idx
            ? {
                ...r,
                status: Math.random() > 0.05 ? "delivered" : "failed",
              }
            : r
        )
      );
      idx++;
    }, 180 + Math.random() * 120);
    return () => clearInterval(interval);
  }, [records.length]);

  const delivered = records.filter((r) => r.status === "delivered").length;
  const failed = records.filter((r) => r.status === "failed").length;
  const total = records.length;
  const done = delivered + failed;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;
  const allDone = done === total && total > 0;

  // Group by region
  const grouped = useMemo(() => {
    const g: Record<string, StationRecord[]> = {};
    records.forEach((r) => {
      if (!g[r.region]) g[r.region] = [];
      g[r.region].push(r);
    });
    return g;
  }, [records]);

  const regionCount = Object.keys(grouped).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4 pt-10 md:pt-20">
      <div className="w-full max-w-lg bg-[#0f0f12] border border-[#27272a] rounded-2xl overflow-hidden shadow-2xl animate-in">
        {/* Header */}
        <div className="px-5 py-5 md:px-6 text-center relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Icon name="close" className="text-base" />
          </button>

          {/* Animated icon */}
          <div
            className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
            style={{
              background: allDone
                ? failed === 0
                  ? "linear-gradient(135deg, #10b981, #059669)"
                  : "linear-gradient(135deg, #f59e0b, #d97706)"
                : "linear-gradient(135deg, #8B5CF6, #6d28d9)",
              transition: "background 0.5s",
            }}
          >
            <Icon
              name={
                allDone
                  ? failed === 0
                    ? "check"
                    : "warning"
                  : "cell_tower"
              }
              className="text-xl text-white"
            />
          </div>

          <h2 className="text-base font-bold text-white">
            {allDone
              ? failed === 0
                ? "Broadcast Complete"
                : "Broadcast Complete with Errors"
              : "Broadcasting..."}
          </h2>
          <p className="text-xs text-gray-500 mt-1">{scriptTitle}</p>

          {/* Progress bar */}
          <div className="mt-4 mx-auto max-w-xs">
            <div className="h-1.5 rounded-full bg-[#27272a] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  background:
                    allDone && failed === 0
                      ? "linear-gradient(to right, #10b981, #34d399)"
                      : allDone
                        ? "linear-gradient(to right, #f59e0b, #fbbf24)"
                        : "linear-gradient(to right, #8B5CF6, #a78bfa)",
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px] text-gray-500 font-mono">
                {done}/{total} stations
              </span>
              <span className="text-[10px] font-mono text-gray-500">
                {progress}%
              </span>
            </div>
          </div>

          {/* Summary pills */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#8B5CF6]/10 text-[#a78bfa] border border-[#8B5CF6]/20">
              <Icon name="map" className="text-xs" />
              {regionCount} Region{regionCount !== 1 ? "s" : ""}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">
              <Icon name="check" className="text-xs" />
              {delivered} Delivered
            </span>
            {failed > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                <Icon name="close" className="text-xs" />
                {failed} Failed
              </span>
            )}
          </div>
        </div>

        {/* Station list grouped by region */}
        <div className="border-t border-[#27272a] max-h-[340px] overflow-y-auto">
          {Object.entries(grouped).map(([region, stations]) => {
            const regionDelivered = stations.filter(
              (s) => s.status === "delivered"
            ).length;
            return (
              <div key={region}>
                {/* Region header */}
                <div className="px-5 py-2 bg-[#18181b] border-b border-[#27272a] sticky top-0 z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: "#8B5CF6" }}
                    />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {region}
                    </span>
                  </div>
                  <span className="text-[9px] text-gray-600 font-mono">
                    {regionDelivered}/{stations.length}
                  </span>
                </div>

                {/* Station rows */}
                {stations.map((station) => (
                  <div
                    key={station.id}
                    className="px-5 py-2 border-b border-[#27272a]/40 flex items-center gap-3"
                  >
                    {/* Status dot */}
                    <div className="shrink-0">
                      {station.status === "delivered" ? (
                        <div className="w-4 h-4 rounded-full bg-green-500/15 flex items-center justify-center">
                          <Icon
                            name="check"
                            className="text-[8px] text-green-400"
                          />
                        </div>
                      ) : station.status === "failed" ? (
                        <div className="w-4 h-4 rounded-full bg-red-500/15 flex items-center justify-center">
                          <Icon
                            name="close"
                            className="text-[8px] text-red-400"
                          />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-[#27272a] flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-pulse" />
                        </div>
                      )}
                    </div>

                    {/* Station name */}
                    <span className="text-xs text-gray-300 truncate flex-1">
                      {station.name}
                    </span>

                    {/* Localised badge */}
                    {station.localised && (
                      <span className="text-[8px] font-bold text-[#a78bfa] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#8B5CF6]/10 shrink-0">
                        Localised
                      </span>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#27272a] flex items-center justify-between gap-3">
          <p className="text-[9px] text-gray-600 font-mono">{deploymentId}</p>
          <div className="flex items-center gap-2">
            {failed > 0 && allDone && (
              <button
                type="button"
                onClick={() => {
                  setRecords((prev) =>
                    prev.map((r) =>
                      r.status === "failed"
                        ? { ...r, status: "pending" }
                        : r
                    )
                  );
                }}
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-amber-400 border border-amber-500/20 hover:bg-amber-500/10 transition-colors"
              >
                Retry Failed
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all"
              style={{
                background: "linear-gradient(135deg, #8B5CF6, #6d28d9)",
              }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
