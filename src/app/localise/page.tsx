"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import ErrorBanner from "@/components/ui/ErrorBanner";
import RegionSelector from "@/components/localise/RegionSelector";
import UKMap from "@/components/localise/UKMap";
import VariantList, {
  type LocalisedVariant,
} from "@/components/localise/VariantList";
import DeploymentDashboard from "@/components/preview/DeploymentDashboard";
import { REGIONS } from "@/constants/regions";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import type { ScriptVariant } from "@/types/ad-brief";

interface LocaliseApiVariant {
  regionId: string;
  regionName: string;
  stationBrands: string[];
  localisedScript: string;
  error?: string;
}

function Spinner() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <svg
        className="animate-spin h-6 w-6 text-[#8B5CF6]"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    </div>
  );
}

export default function LocalisePage() {
  const [loaded, setLoaded] = useState(false);
  const [confirmedScript, setConfirmedScript] =
    useState<ScriptVariant | null>(null);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("");
  const [selectedRegionIds, setSelectedRegionIds] = useState<string[]>([]);
  const [isLocalising, setIsLocalising] = useState(false);
  const [localiseError, setLocaliseError] = useState<string | null>(null);
  const [variants, setVariants] = useState<LocalisedVariant[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState<
    { current: number; total: number } | undefined
  >();
  const [showDeployDashboard, setShowDeployDashboard] = useState(false);
  const [showMapMobile, setShowMapMobile] = useState(false);

  useEffect(() => {
    const rawScript = localStorage.getItem(STORAGE_KEYS.CONFIRMED_SCRIPT);
    if (rawScript) {
      try {
        setConfirmedScript(JSON.parse(rawScript) as ScriptVariant);
      } catch {
        /* malformed */
      }
    }
    const savedVoice = localStorage.getItem(STORAGE_KEYS.SELECTED_VOICE);
    if (savedVoice) setSelectedVoiceId(savedVoice);
    const savedVariants = localStorage.getItem(
      STORAGE_KEYS.LOCALISED_VARIANTS
    );
    if (savedVariants) {
      try {
        const parsed = JSON.parse(savedVariants) as LocalisedVariant[];
        setVariants(
          parsed.map((v) => ({
            ...v,
            audioUrl: undefined,
            audioLoading: false,
          }))
        );
      } catch {
        /* ignore */
      }
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (variants.length > 0) {
      const toSave = variants.map((v) => ({
        ...v,
        audioUrl: undefined,
        audioLoading: false,
      }));
      localStorage.setItem(
        STORAGE_KEYS.LOCALISED_VARIANTS,
        JSON.stringify(toSave)
      );
    }
  }, [variants]);

  const synthesiseAudio = useCallback(
    async (scriptText: string, voiceId: string): Promise<string> => {
      const res = await fetch("/api/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptText, voiceId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ?? "Audio synthesis failed."
        );
      }
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    },
    []
  );

  const handleLocalise = useCallback(async () => {
    if (!confirmedScript || selectedRegionIds.length === 0) return;
    setIsLocalising(true);
    setLocaliseError(null);
    setVariants([]);
    try {
      const res = await fetch("/api/localise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseScript: confirmedScript.body,
          regionIds: selectedRegionIds,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error ?? "Localisation failed."
        );
      }
      const data = (await res.json()) as { variants: LocaliseApiVariant[] };
      setVariants(
        data.variants.map((v) => ({
          regionId: v.regionId,
          regionName: v.regionName,
          stationBrands: v.stationBrands,
          localisedScript: v.localisedScript,
          audioUrl: undefined,
          audioLoading: false,
          error: v.error,
        }))
      );
    } catch (err) {
      setLocaliseError(
        err instanceof Error ? err.message : "Localisation failed."
      );
    } finally {
      setIsLocalising(false);
    }
  }, [confirmedScript, selectedRegionIds]);

  const handleGenerateAudio = useCallback(
    async (regionId: string) => {
      if (!selectedVoiceId) return;
      const variant = variants.find((v) => v.regionId === regionId);
      if (!variant?.localisedScript) return;
      setVariants((prev) =>
        prev.map((v) =>
          v.regionId === regionId ? { ...v, audioLoading: true } : v
        )
      );
      try {
        const url = await synthesiseAudio(
          variant.localisedScript,
          selectedVoiceId
        );
        setVariants((prev) =>
          prev.map((v) =>
            v.regionId === regionId
              ? { ...v, audioUrl: url, audioLoading: false }
              : v
          )
        );
      } catch (err) {
        setVariants((prev) =>
          prev.map((v) =>
            v.regionId === regionId
              ? {
                  ...v,
                  audioLoading: false,
                  error:
                    err instanceof Error
                      ? err.message
                      : "Audio generation failed.",
                }
              : v
          )
        );
      }
    },
    [variants, selectedVoiceId, synthesiseAudio]
  );

  const handleGenerateAll = useCallback(async () => {
    if (!selectedVoiceId) return;
    const pending = variants.filter(
      (v) => !v.audioUrl && !v.error && v.localisedScript
    );
    if (pending.length === 0) return;
    setBatchLoading(true);
    setBatchProgress({ current: 0, total: pending.length });
    for (let i = 0; i < pending.length; i++) {
      const variant = pending[i];
      setBatchProgress({ current: i + 1, total: pending.length });
      setVariants((prev) =>
        prev.map((v) =>
          v.regionId === variant.regionId ? { ...v, audioLoading: true } : v
        )
      );
      try {
        const url = await synthesiseAudio(
          variant.localisedScript,
          selectedVoiceId
        );
        setVariants((prev) =>
          prev.map((v) =>
            v.regionId === variant.regionId
              ? { ...v, audioUrl: url, audioLoading: false }
              : v
          )
        );
      } catch (err) {
        setVariants((prev) =>
          prev.map((v) =>
            v.regionId === variant.regionId
              ? {
                  ...v,
                  audioLoading: false,
                  error:
                    err instanceof Error
                      ? err.message
                      : "Audio generation failed.",
                }
              : v
          )
        );
      }
      if (i < pending.length - 1)
        await new Promise((resolve) => setTimeout(resolve, 600));
    }
    setBatchLoading(false);
    setBatchProgress(undefined);
  }, [variants, selectedVoiceId, synthesiseAudio]);

  const handleBroadcast = useCallback(() => {
    setShowDeployDashboard(true);
  }, []);

  if (!loaded) return <Spinner />;

  if (!confirmedScript) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="rounded-2xl border border-dashed border-[#27272a] p-8 sm:p-12 text-center max-w-md bg-[#18181b]">
          <div className="w-12 h-12 rounded-xl bg-[#27272a] flex items-center justify-center mx-auto mb-4">
            <Icon name="description" className="text-2xl text-gray-500" />
          </div>
          <p className="text-white font-semibold mb-1">
            No confirmed script found
          </p>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            Generate and confirm a script before creating regional variants.
          </p>
          <Link
            href="/script"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7c3aed] text-white text-sm font-medium transition-all hover:opacity-90"
          >
            Go to Script Generator
          </Link>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalReach = selectedRegionIds.reduce((acc, id) => {
    const region = REGIONS.find((r) => r.id === id);
    return acc + (region?.reachNumber ?? 0);
  }, 0);
  const totalStations = selectedRegionIds.reduce((acc, id) => {
    const region = REGIONS.find((r) => r.id === id);
    return acc + (region?.stationBrands?.length ?? 0);
  }, 0);

  return (
    <>
      <div className="flex flex-col md:flex-1 md:flex-row md:overflow-hidden">
        {/* Left Panel: Station Cards */}
        <div className="w-full md:w-1/2 md:shrink-0 bg-[#18181b] flex flex-col border-b md:border-b-0 md:border-r border-[#27272a]">
          {/* Header with inline stats */}
          <header className="p-4 md:p-6 border-b border-[#27272a] z-10">
            <div className="flex justify-between items-start mb-1">
              <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">
                Deploy &amp; Localise
              </p>
              <div className="flex items-center gap-2">
                {/* Mobile map toggle */}
                <button
                  type="button"
                  onClick={() => setShowMapMobile(!showMapMobile)}
                  className="md:hidden inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-[#a78bfa] border border-[#8B5CF6]/20 hover:bg-[#8B5CF6]/10 transition-colors"
                >
                  <Icon name="map" className="text-xs" />
                  {showMapMobile ? "Hide Map" : "View Map"}
                </button>
                <span className="inline-flex items-center rounded-full bg-green-900/80 px-2 py-1 text-[10px] font-medium text-green-400 border border-green-500/30">
                  ACTIVE
                </span>
              </div>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white mb-3">
              Station Distribution
            </h1>

            {/* Inline stats row */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Icon name="map" className="text-sm text-[#a78bfa]" />
                <span className="text-xs text-gray-400">
                  <span className="font-bold text-white">
                    {selectedRegionIds.length}
                  </span>{" "}
                  Regions
                </span>
              </div>
              <div className="w-px h-4 bg-[#3a3a3a]" />
              <div className="flex items-center gap-1.5">
                <Icon name="cell_tower" className="text-sm text-[#a78bfa]" />
                <span className="text-xs text-gray-400">
                  <span className="font-bold text-white">
                    {totalStations}
                  </span>{" "}
                  Stations
                </span>
              </div>
              <div className="w-px h-4 bg-[#3a3a3a]" />
              <div className="flex items-center gap-1.5">
                <Icon name="group" className="text-sm text-[#a78bfa]" />
                <span className="text-xs text-gray-400">
                  <span className="font-bold text-white">
                    {totalReach > 0
                      ? `${(totalReach / 1_000_000).toFixed(1)}M`
                      : "-"}
                  </span>{" "}
                  Listeners
                </span>
              </div>
            </div>
          </header>

          {/* Mobile map (collapsible) */}
          {showMapMobile && (
            <div className="md:hidden h-64 bg-[#0f0f12] border-b border-[#27272a]">
              <UKMap
                selectedRegionIds={selectedRegionIds}
                regions={REGIONS}
              />
            </div>
          )}

          {/* Scrollable Region Selector */}
          <div className="p-4 md:flex-1 md:overflow-y-auto">
            <RegionSelector
              selectedRegionIds={selectedRegionIds}
              onChange={setSelectedRegionIds}
            />

            {/* Action buttons — Localise or Broadcast as-is */}
            {variants.length === 0 && (
              <div className="mt-4 space-y-2">
                <button
                  onClick={handleLocalise}
                  disabled={selectedRegionIds.length === 0 || isLocalising}
                  className="w-full py-3 px-6 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background:
                      "linear-gradient(to right, #6f42c1, #8a2be2)",
                  }}
                >
                  {isLocalising ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Localising...
                    </>
                  ) : (
                    <>
                      <Icon name="translate" className="text-lg" />
                      Localise Scripts for Each Region
                    </>
                  )}
                </button>

                <div className="flex items-center gap-3 px-2">
                  <div className="flex-1 h-px bg-[#27272a]" />
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">or</span>
                  <div className="flex-1 h-px bg-[#27272a]" />
                </div>

                <button
                  type="button"
                  onClick={handleBroadcast}
                  disabled={selectedRegionIds.length === 0}
                  className="w-full py-3 px-6 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  style={{
                    background:
                      "linear-gradient(to right, #3b82f6, #2563eb)",
                    boxShadow: selectedRegionIds.length > 0 ? "0 4px 14px rgba(59,130,246,0.3)" : "none",
                  }}
                >
                  <Icon name="rocket_launch" className="text-base" />
                  Broadcast Same Audio to All Regions
                </button>
                <p className="text-[10px] text-gray-600 text-center leading-relaxed px-4">
                  Skip localisation and send the same base audio to all selected stations.
                </p>
              </div>
            )}

            {/* Error */}
            {localiseError && (
              <div className="mt-4">
                <ErrorBanner
                  message={localiseError}
                  onDismiss={() => setLocaliseError(null)}
                  onRetry={handleLocalise}
                />
              </div>
            )}

            {/* No voice warning */}
            {!selectedVoiceId && (
              <div className="mt-4 flex items-start gap-3 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Icon
                  name="warning"
                  className="text-xl text-amber-400 shrink-0 mt-0.5"
                />
                <div>
                  <p className="text-sm text-amber-300 font-medium">
                    No voice selected
                  </p>
                  <p className="text-xs text-amber-400/70 mt-0.5">
                    Select a voice on the{" "}
                    <Link href="/voice" className="underline">
                      Voice page
                    </Link>{" "}
                    before generating audio.
                  </p>
                </div>
              </div>
            )}

            {/* Variant list */}
            {variants.length > 0 && (
              <div className="mt-5 space-y-4">
                {/* Section header */}
                <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon
                        name="hub"
                        className="text-lg text-[#a78bfa]"
                      />
                      <h2 className="text-white font-bold text-sm">
                        Regional Adaptations
                      </h2>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/10 border border-green-500/20 text-green-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      {variants.length} Regions
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Each script has been rewritten for its local market.
                    Purple-highlighted words show localised changes.
                  </p>
                </div>

                <VariantList
                  variants={variants}
                  baseScript={confirmedScript.body}
                  onGenerateAudio={handleGenerateAudio}
                  onGenerateAll={handleGenerateAll}
                  batchProgress={batchProgress}
                  batchLoading={batchLoading}
                />

                {/* Broadcast button */}
                <button
                  type="button"
                  onClick={handleBroadcast}
                  className="w-full py-3 px-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg"
                  style={{
                    background:
                      "linear-gradient(to right, #3b82f6, #2563eb)",
                    boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
                  }}
                >
                  <Icon name="rocket_launch" className="text-base" />
                  Broadcast to All Stations
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Map Visualization -- desktop only */}
        <section className="hidden md:flex flex-1 bg-[#0f0f12] flex-col overflow-hidden">
          <UKMap selectedRegionIds={selectedRegionIds} regions={REGIONS} />
        </section>
      </div>

      {/* Deployment Dashboard Overlay */}
      {showDeployDashboard && (
        <DeploymentDashboard
          scriptTitle={confirmedScript?.title ?? "Untitled Campaign"}
          selectedRegionIds={selectedRegionIds}
          onClose={() => setShowDeployDashboard(false)}
        />
      )}
    </>
  );
}
