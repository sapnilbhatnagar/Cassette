"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
          status: isConfigured ? "pending" : "needs_config",
          trafficEmail: email,
        });
      });
    });

    setRecords(list);
  }, [selectedRegionIds, userConfigs]);

  // Animate delivery for configured stations
  useEffect(() => {
    const configuredPending = records.filter((r) => r.status === "pending");
    if (configuredPending.length === 0) return;

    let idx = 0;
    const interval = setInterval(() => {
      if (idx >= configuredPending.length) {
        clearInterval(interval);
        return;
      }
      const targetId = configuredPending[idx].id;
      setRecords((prev) =>
        prev.map((r) =>
          r.id === targetId
            ? {
                ...r,
                status: Math.random() > 0.08 ? "delivered" : "failed",
              }
            : r
        )
      );
      idx++;
    }, 200 + Math.random() * 120);
    return () => clearInterval(interval);
  }, [records.length]);

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

  // Skip config → mark as queued
  const handleSkipConfig = useCallback((stationName: string) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.name === stationName ? { ...r, status: "queued" } : r
      )
    );
    setConfiguring(null);
    setConfigEmail("");
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
  const deliveryDone = pending === 0 && needsConfig === 0;

  // Group by region
  const grouped = useMemo(() => {
    const g: Record<string, StationRecord[]> = {};
    records.forEach((r) => {
      if (!g[r.region]) g[r.region] = [];
      g[r.region].push(r);
    });
    return g;
  }, [records]);

  return (
    <div className="flex flex-col h-full bg-[#0f0f12]">
      {/* Header */}
      <div className="px-5 py-5 border-b border-[#27272a] shrink-0">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-white truncate">
              {deliveryDone
                ? failed === 0 && queued === 0
                  ? "✓ Broadcast Complete"
                  : "⚠ Deployment Complete"
                : pending > 0
                  ? "Broadcasting..."
                  : "Ready to Broadcast"}
            </h2>
            <p className="text-[9px] text-gray-600 font-mono mt-1">
              {deploymentId}
            </p>
          </div>
          <button
            type="button"
            onClick={onFlipToMap}
            className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-[#a78bfa] border border-[#8B5CF6]/30 hover:bg-[#8B5CF6]/10 transition-colors"
          >
            <Icon name="map" className="text-xs" />
            Map
          </button>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
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

          {/* Summary pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">
              <span className="w-1 h-1 rounded-full bg-green-400" />
              {delivered}
            </span>
            {failed > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                <span className="w-1 h-1 rounded-full bg-red-400" />
                {failed}
              </span>
            )}
            {queued > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <span className="w-1 h-1 rounded-full bg-amber-400" />
                {queued} Queued
              </span>
            )}
            {needsConfig > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold bg-[#8B5CF6]/10 text-[#a78bfa] border border-[#8B5CF6]/30">
                <span className="w-1 h-1 rounded-full bg-[#a78bfa]" />
                {needsConfig}
              </span>
            )}
            <span className="text-[9px] text-gray-600 font-mono ml-auto">
              {delivered + failed}/{total}
            </span>
          </div>
        </div>
      </div>

      {/* Station list */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(grouped).map(([region, stations]) => {
          const regionDelivered = stations.filter(
            (s) => s.status === "delivered"
          ).length;
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
                    {regionDelivered}/{stations.length}
                  </span>
                </div>
              </div>

              {/* Station rows */}
              {stations.map((station) => (
                <div key={station.id}>
                  <div className="px-5 py-3 border-b border-[#27272a]/30 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3">
                      {/* Status indicator */}
                      <div className="shrink-0">
                        {station.status === "delivered" && (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center border border-green-400/30 bg-green-400/5">
                            <Icon
                              name="check"
                              className="text-[9px] text-green-400"
                            />
                          </div>
                        )}
                        {station.status === "failed" && (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center border border-red-400/30 bg-red-400/5">
                            <Icon
                              name="close"
                              className="text-[9px] text-red-400"
                            />
                          </div>
                        )}
                        {station.status === "pending" && (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center border border-[#8B5CF6]/30 bg-[#8B5CF6]/5">
                            <div className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-pulse" />
                          </div>
                        )}
                        {station.status === "needs_config" && (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center border border-amber-400/30 bg-amber-400/5">
                            <Icon
                              name="settings"
                              className="text-[9px] text-amber-400"
                            />
                          </div>
                        )}
                        {station.status === "queued" && (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center border border-amber-400/20 bg-amber-400/3">
                            <Icon
                              name="schedule"
                              className="text-[9px] text-amber-300"
                            />
                          </div>
                        )}
                      </div>

                      {/* Station name + status */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-200">
                          {station.name}
                        </p>
                        {station.status === "needs_config" && (
                          <p className="text-[9px] text-amber-500/70 mt-0.5">
                            Not connected
                          </p>
                        )}
                        {station.status === "queued" && (
                          <p className="text-[9px] text-amber-500/60 mt-0.5">
                            Queued
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
                          onClick={() => {
                            setConfiguring(station.name);
                            setConfigEmail("");
                          }}
                          className="shrink-0 px-2 py-1 rounded text-[9px] font-bold text-[#a78bfa] border border-[#8B5CF6]/30 hover:bg-[#8B5CF6]/10 transition-colors"
                        >
                          Config
                        </button>
                      )}
                    </div>
                  </div>

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
                          onClick={() =>
                            handleSubmitConfig(station.name)
                          }
                          disabled={!configEmail.trim()}
                          className="px-2.5 py-1.5 rounded text-[9px] font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all bg-[#8B5CF6] hover:bg-[#a78bfa]"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSkipConfig(station.name)
                          }
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
      </div>

      {/* Footer */}
      {records.length > 0 && (
        <div className="px-5 py-3 border-t border-[#27272a] shrink-0">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[9px] text-gray-600 truncate flex-1">
              {scriptTitle}
            </p>
            {failed > 0 && deliveryDone && (
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
                className="shrink-0 px-2 py-1 rounded text-[9px] font-bold text-amber-400 border border-amber-500/20 hover:bg-amber-500/10 transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
