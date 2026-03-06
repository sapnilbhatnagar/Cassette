"use client";

import React, { useState, useEffect, useMemo } from "react";
import Icon from "@/components/ui/Icon";
import { REGIONS } from "@/constants/regions";
import { STATIONS } from "@/constants/stations";
import type { LocalisedVariant } from "@/components/localise/VariantList";
import { STORAGE_KEYS } from "@/constants/storage-keys";

interface DeploymentRecord {
  id: string;
  stationName: string;
  region: string;
  format: string;
  variant: string;
  status: "delivered" | "pending" | "failed";
  deliveredAt: string;
  email: string;
  fileSize: string;
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

function generateEmail(stationName: string): string {
  const slug = stationName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 12);
  return `traffic@${slug}.bauer.co.uk`;
}

function randomFileSize(): string {
  const mb = (1.2 + Math.random() * 2.8).toFixed(1);
  return `${mb} MB`;
}

export default function DeploymentDashboard({
  scriptTitle,
  selectedRegionIds,
  onClose,
}: DeploymentDashboardProps) {
  const [records, setRecords] = useState<DeploymentRecord[]>([]);
  const [animatedCount, setAnimatedCount] = useState(0);
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

  // Build deployment records from selected regions + stations + localised variants
  useEffect(() => {
    const savedVariants = localStorage.getItem(STORAGE_KEYS.LOCALISED_VARIANTS);
    let variants: LocalisedVariant[] = [];
    if (savedVariants) {
      try {
        variants = JSON.parse(savedVariants) as LocalisedVariant[];
      } catch {
        /* ignore */
      }
    }

    const allRecords: DeploymentRecord[] = [];
    const selectedRegions = REGIONS.filter((r) => selectedRegionIds.includes(r.id));

    // Add regional stations only from user-selected regions
    selectedRegions.forEach((region) => {
      const variant = variants.find((v) => v.regionId === region.id);
      region.stationBrands.forEach((brand) => {
        if (allRecords.some((r) => r.stationName === brand)) return;
        allRecords.push({
          id: `${brand}-${region.id}`,
          stationName: brand,
          region: region.name,
          format:
            STATIONS.find((s) => s.name === brand)?.format ?? "Regional",
          variant: variant ? `${region.name} Localised` : "Base Script",
          status: "pending",
          deliveredAt: "",
          email: generateEmail(brand),
          fileSize: randomFileSize(),
        });
      });
    });

    // Add national stations (always included)
    STATIONS.filter((s) => s.region === "National").forEach((station) => {
      if (allRecords.some((r) => r.stationName === station.name)) return;
      allRecords.push({
        id: `${station.name}-national`,
        stationName: station.name,
        region: "National",
        format: station.format,
        variant: "Base Script",
        status: "pending",
        deliveredAt: "",
        email: generateEmail(station.name),
        fileSize: randomFileSize(),
      });
    });

    setRecords(allRecords);
  }, [selectedRegionIds]);

  // Animate delivery statuses
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
                status:
                  Math.random() > 0.05 ? "delivered" : "failed",
                deliveredAt: new Date().toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                }),
              }
            : r
        )
      );
      setAnimatedCount(idx + 1);
      idx++;
    }, 200 + Math.random() * 150);

    return () => clearInterval(interval);
  }, [records.length]);

  const deliveredCount = records.filter(
    (r) => r.status === "delivered"
  ).length;
  const failedCount = records.filter((r) => r.status === "failed").length;
  const pendingCount = records.filter((r) => r.status === "pending").length;
  const totalCount = records.length;
  const progress =
    totalCount > 0
      ? Math.round(((deliveredCount + failedCount) / totalCount) * 100)
      : 0;
  const allDone = pendingCount === 0 && totalCount > 0;

  // Group by region
  const groupedByRegion = useMemo(() => {
    const groups: Record<string, DeploymentRecord[]> = {};
    records.forEach((r) => {
      if (!groups[r.region]) groups[r.region] = [];
      groups[r.region].push(r);
    });
    return groups;
  }, [records]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-4 pt-8 md:pt-16">
      <div className="w-full max-w-4xl bg-[#131316] border border-[#27272a] rounded-2xl overflow-hidden shadow-2xl animate-in">
        {/* Header */}
        <div className="px-5 py-4 md:px-6 md:py-5 border-b border-[#27272a] flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Icon
                  name="rocket_launch"
                  className="text-base text-blue-400"
                />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  Broadcast Deployment
                </h2>
                <p className="text-[10px] text-gray-500 font-mono">
                  {deploymentId}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {scriptTitle} &middot; Initiated {deploymentTime}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-colors shrink-0"
          >
            <Icon name="close" className="text-lg" />
          </button>
        </div>

        {/* Summary stats */}
        <div className="px-5 py-4 md:px-6 border-b border-[#27272a]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-3 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Total Stations
              </p>
              <p className="text-xl font-bold text-white font-mono">
                {totalCount}
              </p>
            </div>
            <div className="bg-[#18181b] border border-green-500/20 rounded-xl p-3 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wider text-green-400 mb-1">
                Delivered
              </p>
              <p className="text-xl font-bold text-green-400 font-mono">
                {deliveredCount}
              </p>
            </div>
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-3 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Pending
              </p>
              <p className="text-xl font-bold text-amber-400 font-mono">
                {pendingCount}
              </p>
            </div>
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-3 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Failed
              </p>
              <p className="text-xl font-bold text-red-400 font-mono">
                {failedCount}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Deployment Progress
              </span>
              <span className="text-[10px] font-mono text-gray-400">
                {progress}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-[#27272a] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  background:
                    allDone && failedCount === 0
                      ? "linear-gradient(to right, #10b981, #34d399)"
                      : allDone
                      ? "linear-gradient(to right, #f59e0b, #fbbf24)"
                      : "linear-gradient(to right, #3b82f6, #60a5fa)",
                }}
              />
            </div>
          </div>

          {/* Status message */}
          {allDone && (
            <div
              className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg ${
                failedCount === 0
                  ? "bg-green-500/10 border border-green-500/20"
                  : "bg-amber-500/10 border border-amber-500/20"
              }`}
            >
              <Icon
                name={failedCount === 0 ? "check_circle" : "warning"}
                className={`text-base ${
                  failedCount === 0 ? "text-green-400" : "text-amber-400"
                }`}
              />
              <p
                className={`text-xs font-medium ${
                  failedCount === 0 ? "text-green-400" : "text-amber-400"
                }`}
              >
                {failedCount === 0
                  ? `All ${deliveredCount} stations received the audio successfully.`
                  : `${deliveredCount} delivered, ${failedCount} failed. Retry available for failed stations.`}
              </p>
            </div>
          )}
        </div>

        {/* Station delivery log */}
        <div className="max-h-[400px] overflow-y-auto">
          {Object.entries(groupedByRegion).map(
            ([region, regionRecords]) => (
              <div key={region}>
                {/* Region header */}
                <div className="px-5 py-2 md:px-6 bg-[#18181b] border-b border-[#27272a] sticky top-0 z-10">
                  <div className="flex items-center gap-2">
                    <Icon
                      name="location_on"
                      className="text-sm text-[#a78bfa]"
                    />
                    <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                      {region}
                    </span>
                    <span className="text-[9px] text-gray-500 font-mono ml-auto">
                      {regionRecords.filter((r) => r.status === "delivered").length}
                      /{regionRecords.length} delivered
                    </span>
                  </div>
                </div>

                {/* Station rows */}
                {regionRecords.map((record) => (
                  <div
                    key={record.id}
                    className="px-5 py-2.5 md:px-6 border-b border-[#27272a]/50 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Status indicator */}
                    <div className="shrink-0">
                      {record.status === "delivered" ? (
                        <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                          <Icon
                            name="check"
                            className="text-[10px] text-green-400"
                          />
                        </div>
                      ) : record.status === "failed" ? (
                        <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center">
                          <Icon
                            name="close"
                            className="text-[10px] text-red-400"
                          />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-[#27272a] flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        </div>
                      )}
                    </div>

                    {/* Station info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-white truncate">
                        {record.stationName}
                      </p>
                      <p className="text-[9px] text-gray-500 truncate">
                        {record.format}
                      </p>
                    </div>

                    {/* Variant badge */}
                    <span
                      className={`hidden sm:inline-flex shrink-0 px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                        record.variant.includes("Localised")
                          ? "bg-[#8B5CF6]/10 text-[#a78bfa] border border-[#8B5CF6]/20"
                          : "bg-[#27272a] text-gray-500"
                      }`}
                    >
                      {record.variant}
                    </span>

                    {/* Email */}
                    <span className="hidden md:inline text-[9px] text-gray-600 font-mono truncate max-w-[180px] shrink-0">
                      {record.email}
                    </span>

                    {/* File size */}
                    <span className="text-[9px] text-gray-500 font-mono w-12 text-right shrink-0">
                      {record.fileSize}
                    </span>

                    {/* Time */}
                    <span className="text-[9px] text-gray-600 font-mono w-16 text-right shrink-0">
                      {record.deliveredAt || "--:--:--"}
                    </span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 md:px-6 border-t border-[#27272a] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Icon name="info" className="text-sm text-gray-600" />
            <p className="text-[10px] text-gray-500">
              Deployment audit log retained for 90 days. All deliveries are
              tracked and verifiable.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {failedCount > 0 && allDone && (
              <button
                type="button"
                onClick={() => {
                  setRecords((prev) =>
                    prev.map((r) =>
                      r.status === "failed"
                        ? { ...r, status: "pending", deliveredAt: "" }
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
              className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all"
              style={{
                background: "linear-gradient(to right, #8B5CF6, #6d28d9)",
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
