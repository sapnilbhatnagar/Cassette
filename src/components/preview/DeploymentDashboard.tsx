"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Icon from "@/components/ui/Icon";
import { REGIONS } from "@/constants/regions";
import { STATIONS, type Station } from "@/constants/stations";
import type { LocalisedVariant } from "@/components/localise/VariantList";
import { STORAGE_KEYS } from "@/constants/storage-keys";

/* --------------- Types --------------- */
type DeliveryStatus =
  | "pending"
  | "delivered"
  | "failed"
  | "needs_config"
  | "queued";

interface StationRecord {
  id: string;
  name: string;
  region: string;
  localised: boolean;
  status: DeliveryStatus;
  trafficEmail?: string;
  deliveredAt?: number;
  format?: string;
}

interface DeliveryLogEntry {
  timestamp: number;
  station: string;
  region: string;
  status: "delivered" | "failed";
}

interface DeploymentDashboardProps {
  scriptTitle: string;
  selectedRegionIds: string[];
  onFlipToMap: () => void;
}

/* --------------- Config storage --------------- */
const CONFIG_KEY = "cassette_station_configs";

function loadStationConfigs(): Record<string, string> {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function saveStationConfigs(configs: Record<string, string>) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(configs));
}

/* --------------- Deployment ID --------------- */
function generateDeploymentId(): string {
  return `DEP-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

/* --------------- Component --------------- */
export default function DeploymentDashboard({
  scriptTitle,
  selectedRegionIds,
  onFlipToMap,
}: DeploymentDashboardProps) {
  const [records, setRecords] = useState<StationRecord[]>([]);
  const [configuring, setConfiguring] = useState<string | null>(null);
  const [configEmail, setConfigEmail] = useState("");
  const [userConfigs, setUserConfigs] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showConfirmBroadcast, setShowConfirmBroadcast] = useState(false);
  const [broadcastStarted, setBroadcastStarted] = useState(false);
  const [deliveryLog, setDeliveryLog] = useState<DeliveryLogEntry[]>([]);
  const [showLog, setShowLog] = useState(false);
  const [expandedStation, setExpandedStation] = useState<string | null>(null);
  const [showCompletionBanner, setShowCompletionBanner] = useState(false);
  const completionShown = useRef(false);
  const deploymentId = useMemo(() => generateDeploymentId(), []);

  // Load user-provided configs
  useEffect(() => {
    setUserConfigs(loadStationConfigs());
  }, []);

  // Build station records from selected regions
  useEffect(() => {
    let variants: LocalisedVariant[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LOCALISED_VARIANTS);
      if (raw) variants = JSON.parse(raw) as LocalisedVariant[];
    } catch {
      /* ignore */
    }

    const configs = loadStationConfigs();
    const list: StationRecord[] = [];
    const selectedRegions = REGIONS.filter((r) =>
      selectedRegionIds.includes(r.id)
    );

    selectedRegions.forEach((region) => {
      const hasVariant = variants.some((v) => v.regionId === region.id);
      region.stationBrands.forEach((brand) => {
        if (list.some((r) => r.name === brand)) return;
        const stationData = STATIONS.find((s) => s.name === brand);
        const isConfigured =
          stationData?.configured || !!configs[brand];
        const email =
          configs[brand] || stationData?.trafficEmail;

        list.push({
          id: `${brand}-${region.id}`,
          name: brand,
          region: region.name,
          localised: hasVariant,
          status: isConfigured
            ? broadcastStarted
              ? "pending"
              : "pending"
            : "needs_config",
          trafficEmail: email,
          format: stationData?.format,
        });
      });
    });

    setRecords(list);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRegionIds, userConfigs]);

  // Animate delivery for configured stations — only after broadcast confirmed
  useEffect(() => {
    if (!broadcastStarted) return;

    const configuredPending = records.filter((r) => r.status === "pending");
    if (configuredPending.length === 0) return;

    let idx = 0;
    const interval = setInterval(() => {
      if (idx >= configuredPending.length) {
        clearInterval(interval);
        return;
      }
      const target = configuredPending[idx];
      const targetId = target.id;
      const newStatus: "delivered" | "failed" =
        Math.random() > 0.08 ? "delivered" : "failed";

      setRecords((prev) =>
        prev.map((r) =>
          r.id === targetId
            ? { ...r, status: newStatus, deliveredAt: Date.now() }
            : r
        )
      );

      setDeliveryLog((prev) => [
        {
          timestamp: Date.now(),
          station: target.name,
          region: target.region,
          status: newStatus,
        },
        ...prev,
      ]);

      idx++;
    }, 200 + Math.random() * 120);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [broadcastStarted]);

  // Show completion banner
  useEffect(() => {
    if (!broadcastStarted || completionShown.current) return;
    const pending = records.filter((r) => r.status === "pending");
    const configuredCount = records.filter(
      (r) => r.status !== "needs_config" && r.status !== "queued"
    ).length;
    if (configuredCount > 0 && pending.length === 0) {
      completionShown.current = true;
      setShowCompletionBanner(true);
      setTimeout(() => setShowCompletionBanner(false), 5000);
    }
  }, [records, broadcastStarted]);

  // Handle providing config for a station
  const handleSubmitConfig = useCallback(
    (stationName: string) => {
      if (!configEmail.trim()) return;
      const updated = { ...userConfigs, [stationName]: configEmail.trim() };
      setUserConfigs(updated);
      saveStationConfigs(updated);
      setRecords((prev) =>
        prev.map((r) =>
          r.name === stationName
            ? { ...r, status: "pending", trafficEmail: configEmail.trim() }
            : r
        )
      );
      setConfiguring(null);
      setConfigEmail("");
    },
    [configEmail, userConfigs]
  );

  // Skip config
  const handleSkipConfig = useCallback((stationName: string) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.name === stationName ? { ...r, status: "queued" } : r
      )
    );
    setConfiguring(null);
    setConfigEmail("");
  }, []);

  // Retry all failed
  const handleRetryAllFailed = useCallback(() => {
    setRecords((prev) =>
      prev.map((r) =>
        r.status === "failed" ? { ...r, status: "pending" } : r
      )
    );
    // Re-trigger animation
    completionShown.current = false;
  }, []);

  // Confirm broadcast
  const handleConfirmBroadcast = useCallback(() => {
    setShowConfirmBroadcast(false);
    setBroadcastStarted(true);
  }, []);

  // Stats
  const delivered = records.filter((r) => r.status === "delivered").length;
  const failed = records.filter((r) => r.status === "failed").length;
  const queued = records.filter((r) => r.status === "queued").length;
  const needsConfig = records.filter(
    (r) => r.status === "needs_config"
  ).length;
  const pending = records.filter((r) => r.status === "pending").length;
  const total = records.length;
  const configuredTotal = total - needsConfig - queued;
  const progress =
    configuredTotal > 0
      ? Math.round(((delivered + failed) / configuredTotal) * 100)
      : 0;
  const deliveryDone = broadcastStarted && pending === 0 && configuredTotal > 0;

  // Group by region
  const grouped = useMemo(() => {
    const g: Record<string, StationRecord[]> = {};
    records.forEach((r) => {
      if (!g[r.region]) g[r.region] = [];
      g[r.region].push(r);
    });
    return g;
  }, [records]);

  // Filtered by search
  const filteredGrouped = useMemo(() => {
    if (!searchQuery.trim()) return grouped;
    const q = searchQuery.toLowerCase();
    const result: Record<string, StationRecord[]> = {};
    Object.entries(grouped).forEach(([region, stations]) => {
      const filtered = stations.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.region.toLowerCase().includes(q) ||
          (s.format && s.format.toLowerCase().includes(q))
      );
      if (filtered.length > 0) result[region] = filtered;
    });
    return result;
  }, [grouped, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-[#0f0f12]">
      {/* Confirmation modal */}
      {showConfirmBroadcast && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center"
          style={{
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-6 max-w-sm mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Icon name="cell_tower" className="text-xl text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-bold">Confirm Broadcast</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  This will begin delivering to stations
                </p>
              </div>
            </div>

            <div className="bg-[#0f0f12] rounded-xl p-3 mb-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Stations ready</span>
                <span className="text-white font-bold">
                  {configuredTotal}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Needs config</span>
                <span
                  className={
                    needsConfig > 0
                      ? "text-amber-400 font-bold"
                      : "text-gray-500"
                  }
                >
                  {needsConfig}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Queued (skipped)</span>
                <span className="text-gray-500">{queued}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Campaign</span>
                <span className="text-gray-400 truncate max-w-[180px]">
                  {scriptTitle}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleConfirmBroadcast}
                className="flex-1 py-2.5 px-4 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all"
                style={{
                  background:
                    "linear-gradient(to right, #3b82f6, #2563eb)",
                }}
              >
                <Icon name="rocket_launch" className="text-base" />
                Begin Broadcast
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmBroadcast(false)}
                className="px-4 py-2.5 rounded-xl border border-[#27272a] text-gray-400 hover:text-white text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion banner */}
      {showCompletionBanner && (
        <div
          className="mx-4 mt-3 px-4 py-3 rounded-xl border flex items-center gap-3"
          style={{
            background:
              failed === 0
                ? "rgba(16,185,129,0.08)"
                : "rgba(245,158,11,0.08)",
            borderColor:
              failed === 0
                ? "rgba(16,185,129,0.2)"
                : "rgba(245,158,11,0.2)",
            animation: "fadeIn 0.3s ease",
          }}
        >
          <Icon
            name={failed === 0 ? "check_circle" : "warning"}
            className={`text-lg ${failed === 0 ? "text-green-400" : "text-amber-400"}`}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">
              {failed === 0
                ? "Broadcast Complete"
                : "Broadcast Complete with Issues"}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {delivered} delivered
              {failed > 0 ? `, ${failed} failed` : ""}
              {queued > 0 ? `, ${queued} queued` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCompletionBanner(false)}
            className="text-gray-600 hover:text-gray-400 transition-colors"
          >
            <Icon name="close" className="text-sm" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="px-5 py-5 border-b border-[#27272a] shrink-0">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-white truncate">
              {!broadcastStarted
                ? "Ready to Broadcast"
                : deliveryDone
                  ? failed === 0 && queued === 0
                    ? "Broadcast Complete"
                    : "Deployment Complete"
                  : pending > 0
                    ? "Broadcasting..."
                    : "Ready to Broadcast"}
            </h2>
            <p className="text-[9px] text-gray-600 font-mono mt-1">
              {deploymentId}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!broadcastStarted && configuredTotal > 0 && (
              <button
                type="button"
                onClick={() => setShowConfirmBroadcast(true)}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white transition-all"
                style={{
                  background:
                    "linear-gradient(to right, #3b82f6, #2563eb)",
                }}
              >
                <Icon name="rocket_launch" className="text-xs" />
                Broadcast
              </button>
            )}
            <button
              type="button"
              onClick={onFlipToMap}
              className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-[#a78bfa] border border-[#8B5CF6]/30 hover:bg-[#8B5CF6]/10 transition-colors"
            >
              <Icon name="map" className="text-xs" />
              Map
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {broadcastStarted && (
          <div className="space-y-2.5">
            <div className="h-2 rounded-full bg-[#27272a] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  background:
                    deliveryDone && failed === 0
                      ? "linear-gradient(to right, #10b981, #34d399)"
                      : pending > 0
                        ? "linear-gradient(to right, #8B5CF6, #a78bfa)"
                        : "linear-gradient(to right, #f59e0b, #fbbf24)",
                }}
              />
            </div>

            {/* Summary pills — with labels */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                {delivered} Delivered
              </span>
              {failed > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  {failed} Failed
                </span>
              )}
              {pending > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold bg-[#8B5CF6]/10 text-[#a78bfa] border border-[#8B5CF6]/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#a78bfa] animate-pulse" />
                  {pending} Sending
                </span>
              )}
              {queued > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  {queued} Queued
                </span>
              )}
              {needsConfig > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold bg-[#8B5CF6]/10 text-[#a78bfa] border border-[#8B5CF6]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#a78bfa]" />
                  {needsConfig} Unconfigured
                </span>
              )}
              <span className="text-[9px] text-gray-600 font-mono ml-auto">
                {delivered + failed}/{configuredTotal} stations
              </span>
            </div>
          </div>
        )}

        {/* Pre-broadcast summary */}
        {!broadcastStarted && records.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                {configuredTotal} Ready
              </span>
              {needsConfig > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  {needsConfig} Need Config
                </span>
              )}
              <span className="text-[9px] text-gray-600 font-mono ml-auto">
                {total} total stations
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Search bar */}
      {records.length > 4 && (
        <div className="px-5 py-2.5 border-b border-[#27272a] shrink-0">
          <div className="relative">
            <Icon
              name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-600"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stations, regions, formats..."
              className="w-full bg-[#18181b] border border-[#27272a] rounded-lg pl-9 pr-3 py-2 text-[11px] text-gray-300 placeholder-gray-600 focus:outline-none focus:border-[#8B5CF6]/40 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400"
              >
                <Icon name="close" className="text-xs" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Station list */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(filteredGrouped).map(([region, stations]) => {
          const regionDelivered = stations.filter(
            (s) => s.status === "delivered"
          ).length;
          const regionTotal = stations.length;
          return (
            <div key={region}>
              {/* Region header */}
              <div className="px-5 py-2.5 bg-[#18181b] border-b border-[#27272a] sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">
                      {region}
                    </span>
                  </div>
                  <span className="text-[9px] text-gray-600 font-mono">
                    {broadcastStarted
                      ? `${regionDelivered}/${regionTotal} delivered`
                      : `${regionTotal} station${regionTotal > 1 ? "s" : ""}`}
                  </span>
                </div>
              </div>

              {/* Station rows */}
              {stations.map((station) => (
                <div key={station.id}>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedStation(
                        expandedStation === station.id ? null : station.id
                      )
                    }
                    className="w-full px-5 py-3 border-b border-[#27272a]/30 hover:bg-white/[0.02] transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      {/* Status indicator */}
                      <div className="shrink-0">
                        {station.status === "delivered" && (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center border border-green-400/30 bg-green-400/5">
                            <Icon
                              name="check"
                              className="text-[10px] text-green-400"
                            />
                          </div>
                        )}
                        {station.status === "failed" && (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center border border-red-400/30 bg-red-400/5">
                            <Icon
                              name="close"
                              className="text-[10px] text-red-400"
                            />
                          </div>
                        )}
                        {station.status === "pending" && (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center border border-[#8B5CF6]/30 bg-[#8B5CF6]/5">
                            {broadcastStarted ? (
                              <div className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-pulse" />
                            ) : (
                              <Icon
                                name="radio"
                                className="text-[10px] text-[#a78bfa]"
                              />
                            )}
                          </div>
                        )}
                        {station.status === "needs_config" && (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center border border-amber-400/30 bg-amber-400/5">
                            <Icon
                              name="settings"
                              className="text-[10px] text-amber-400"
                            />
                          </div>
                        )}
                        {station.status === "queued" && (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center border border-amber-400/20 bg-amber-400/5">
                            <Icon
                              name="schedule"
                              className="text-[10px] text-amber-300"
                            />
                          </div>
                        )}
                      </div>

                      {/* Station name + status */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium text-gray-200">
                            {station.name}
                          </p>
                          {station.format && (
                            <span className="text-[8px] text-gray-600 font-mono hidden sm:inline">
                              {station.format}
                            </span>
                          )}
                        </div>
                        {station.status === "needs_config" && (
                          <p className="text-[9px] text-amber-500/70 mt-0.5">
                            Not connected — needs traffic email
                          </p>
                        )}
                        {station.status === "queued" && (
                          <p className="text-[9px] text-amber-500/60 mt-0.5">
                            Queued for manual delivery
                          </p>
                        )}
                        {station.status === "delivered" &&
                          station.trafficEmail && (
                            <p className="text-[9px] text-green-500/60 mt-0.5 truncate">
                              {station.trafficEmail}
                            </p>
                          )}
                        {station.status === "failed" && (
                          <p className="text-[9px] text-red-400/60 mt-0.5">
                            Delivery failed — retry available
                          </p>
                        )}
                      </div>

                      {/* Localised badge */}
                      {station.localised && station.status === "delivered" && (
                        <span className="text-[8px] font-bold text-[#a78bfa] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#8B5CF6]/10 shrink-0 border border-[#8B5CF6]/20">
                          Local
                        </span>
                      )}

                      {/* Config button */}
                      {station.status === "needs_config" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfiguring(station.name);
                            setConfigEmail("");
                          }}
                          className="shrink-0 px-2.5 py-1 rounded text-[9px] font-bold text-[#a78bfa] border border-[#8B5CF6]/30 hover:bg-[#8B5CF6]/10 transition-colors"
                        >
                          Configure
                        </button>
                      )}

                      {/* Retry individual */}
                      {station.status === "failed" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRecords((prev) =>
                              prev.map((r) =>
                                r.id === station.id
                                  ? { ...r, status: "pending" }
                                  : r
                              )
                            );
                          }}
                          className="shrink-0 px-2.5 py-1 rounded text-[9px] font-bold text-amber-400 border border-amber-500/20 hover:bg-amber-500/10 transition-colors"
                        >
                          Retry
                        </button>
                      )}

                      {/* Expand indicator */}
                      <svg
                        className={`w-3 h-3 text-gray-600 transition-transform duration-200 shrink-0 ${
                          expandedStation === station.id ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded station details */}
                  {expandedStation === station.id && (
                    <div className="px-5 py-3 bg-[#18181b]/50 border-b border-[#27272a]">
                      <div className="grid grid-cols-2 gap-3 text-[10px]">
                        <div>
                          <span className="text-gray-600 block mb-0.5">
                            Region
                          </span>
                          <span className="text-gray-300">{station.region}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 block mb-0.5">
                            Format
                          </span>
                          <span className="text-gray-300">
                            {station.format || "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 block mb-0.5">
                            Traffic Email
                          </span>
                          <span className="text-gray-300 font-mono text-[9px]">
                            {station.trafficEmail || "Not configured"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 block mb-0.5">
                            Status
                          </span>
                          <span
                            className={`font-bold ${
                              station.status === "delivered"
                                ? "text-green-400"
                                : station.status === "failed"
                                  ? "text-red-400"
                                  : station.status === "pending"
                                    ? "text-[#a78bfa]"
                                    : "text-amber-400"
                            }`}
                          >
                            {station.status === "delivered"
                              ? "Delivered"
                              : station.status === "failed"
                                ? "Failed"
                                : station.status === "pending"
                                  ? broadcastStarted
                                    ? "Sending..."
                                    : "Ready"
                                  : station.status === "queued"
                                    ? "Queued"
                                    : "Needs Config"}
                          </span>
                        </div>
                        {station.localised && (
                          <div className="col-span-2">
                            <span className="text-gray-600 block mb-0.5">
                              Localisation
                            </span>
                            <span className="text-[#a78bfa]">
                              Region-specific script variant applied
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Inline config form */}
                  {configuring === station.name && (
                    <div className="px-5 py-3 bg-[#18181b] border-b border-[#27272a]">
                      <p className="text-[9px] text-gray-400 mb-2.5 font-medium">
                        Traffic email for{" "}
                        <span className="text-[#a78bfa]">{station.name}</span>
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="email"
                          value={configEmail}
                          onChange={(e) => setConfigEmail(e.target.value)}
                          placeholder="traffic@station.bauer.co.uk"
                          className="flex-1 bg-[#0f0f12] border border-[#27272a] rounded-lg px-3 py-1.5 text-[10px] text-gray-300 placeholder-gray-600 focus:outline-none focus:border-[#8B5CF6]/40 transition-colors"
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              handleSubmitConfig(station.name);
                          }}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSubmitConfig(station.name)}
                          disabled={!configEmail.trim()}
                          className="px-2.5 py-1.5 rounded text-[9px] font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all bg-[#8B5CF6] hover:bg-[#a78bfa]"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSkipConfig(station.name)}
                          className="px-2.5 py-1.5 rounded text-[9px] font-bold text-gray-500 border border-[#27272a] hover:text-gray-300 transition-colors"
                        >
                          Skip
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}

        {/* Empty state */}
        {records.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-10 h-10 rounded-lg bg-[#27272a] flex items-center justify-center mb-3">
              <Icon
                name="cell_tower"
                className="text-base text-gray-600"
              />
            </div>
            <p className="text-xs text-gray-500">
              Select regions to broadcast
            </p>
          </div>
        )}

        {/* Search no results */}
        {records.length > 0 &&
          Object.keys(filteredGrouped).length === 0 &&
          searchQuery && (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <Icon name="search_off" className="text-2xl text-gray-700 mb-2" />
              <p className="text-xs text-gray-500">
                No stations match &quot;{searchQuery}&quot;
              </p>
            </div>
          )}
      </div>

      {/* Footer */}
      {records.length > 0 && (
        <div className="px-5 py-3 border-t border-[#27272a] shrink-0">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[9px] text-gray-600 truncate flex-1">
              {scriptTitle}
            </p>
            <div className="flex items-center gap-2">
              {/* Delivery log toggle */}
              {deliveryLog.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowLog(!showLog)}
                  className="shrink-0 px-2 py-1 rounded text-[9px] font-bold text-gray-500 border border-[#27272a] hover:text-gray-300 transition-colors"
                >
                  {showLog ? "Hide Log" : "View Log"}
                </button>
              )}
              {/* Retry all failed */}
              {failed > 0 && deliveryDone && (
                <button
                  type="button"
                  onClick={handleRetryAllFailed}
                  className="shrink-0 px-2.5 py-1 rounded text-[9px] font-bold text-amber-400 border border-amber-500/20 hover:bg-amber-500/10 transition-colors"
                >
                  Retry All Failed ({failed})
                </button>
              )}
            </div>
          </div>

          {/* Delivery log */}
          {showLog && deliveryLog.length > 0 && (
            <div className="mt-3 max-h-40 overflow-y-auto bg-[#0f0f12] rounded-lg border border-[#27272a] p-2">
              {deliveryLog.slice(0, 50).map((entry, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 py-1 text-[9px] font-mono"
                >
                  <span className="text-gray-600 shrink-0">
                    {new Date(entry.timestamp).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                  <span
                    className={`shrink-0 ${
                      entry.status === "delivered"
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {entry.status === "delivered" ? "OK" : "FAIL"}
                  </span>
                  <span className="text-gray-400 truncate">
                    {entry.station}
                  </span>
                  <span className="text-gray-600 ml-auto shrink-0">
                    {entry.region}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
