"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import VoiceSelector from "@/components/voice/VoiceSelector";
import VoicePreviewPanel, {
  DEFAULT_VOICE_SETTINGS,
  type VoiceSettings,
} from "@/components/voice/VoicePreviewPanel";
import type { ScriptVariant } from "@/types/ad-brief";
import { VOICES } from "@/constants/voices";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import { saveBlobUrlToHistory } from "@/lib/audio/history-store";

export default function VoicePage() {
  const router = useRouter();
  const [confirmedScript, setConfirmedScript] = useState<ScriptVariant | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("");
  const [tryScriptLoadingId, setTryScriptLoadingId] = useState<string>("");

  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(DEFAULT_VOICE_SETTINGS);

  // Load confirmed script from localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIRMED_SCRIPT);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as ScriptVariant;
        setConfirmedScript(parsed);
      } catch {
        // malformed — treat as missing
      }
    }
    setScriptLoaded(true);

    const savedVoiceId = localStorage.getItem(STORAGE_KEYS.SELECTED_VOICE);
    if (savedVoiceId) setSelectedVoiceId(savedVoiceId);
  }, []);

  const handleVoiceSelect = useCallback((voiceId: string) => {
    setSelectedVoiceId(voiceId);
    localStorage.setItem(STORAGE_KEYS.SELECTED_VOICE, voiceId);
    setAudioUrl("");
    setError(null);
  }, []);

  const synthesize = useCallback(
    async (text: string, voiceId: string, settings?: VoiceSettings): Promise<string> => {
      const response = await fetch("/api/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptText: text, voiceId, voiceSettings: settings }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Synthesis failed.");
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    },
    []
  );

  const handleGenerateAudio = useCallback(async () => {
    if (!confirmedScript || !selectedVoiceId) return;
    setError(null);
    setIsSynthesizing(true);
    setAudioUrl("");

    try {
      const url = await synthesize(confirmedScript.body, selectedVoiceId, voiceSettings);
      setAudioUrl(url);
      localStorage.setItem(STORAGE_KEYS.GENERATED_AUDIO, url);
      // Persist to history (non-blocking)
      saveBlobUrlToHistory(url, {
        entryType: "voice",
        scriptTitle: confirmedScript.title ?? "Untitled Script",
        voiceId: selectedVoiceId,
        voiceName: VOICES.find((v) => v.voiceId === selectedVoiceId)?.name ?? selectedVoiceId,
        scriptVariant: confirmedScript,
      }).catch(() => {/* silently ignore history save errors */});
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate audio. Please try again."
      );
    } finally {
      setIsSynthesizing(false);
    }
  }, [confirmedScript, selectedVoiceId, synthesize, voiceSettings]);

  const handleTryScript = useCallback(
    async (voiceId: string) => {
      if (!confirmedScript) return;
      setTryScriptLoadingId(voiceId);
      setError(null);

      // Use first 20 words as quick preview
      const previewText = confirmedScript.body.split(/\s+/).slice(0, 20).join(" ");

      try {
        const url = await synthesize(previewText, voiceId, voiceSettings);
        const tempAudio = new Audio(url);
        tempAudio.play().catch((e) => console.error("[TryScript] play error:", e));
        tempAudio.onended = () => URL.revokeObjectURL(url);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to generate preview. Please try again."
        );
      } finally {
        setTryScriptLoadingId("");
      }
    },
    [confirmedScript, synthesize, voiceSettings]
  );

  const selectedVoice = VOICES.find((v) => v.voiceId === selectedVoiceId) ?? null;
  const selectedCount = selectedVoiceId ? 1 : 0;

  // Loading skeleton while localStorage hydrates
  if (!scriptLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <svg
          className="animate-spin h-6 w-6"
          style={{ color: "#8B5CF6" }}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </div>
    );
  }

  // No script fallback
  if (!confirmedScript) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div
          className="rounded-2xl border border-dashed p-12 text-center max-w-md w-full"
          style={{ borderColor: "#2A2B35", backgroundColor: "#161821" }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          >
            <Icon name="description" className="text-2xl text-gray-600" />
          </div>
          <p className="text-white font-semibold mb-1">No script confirmed yet</p>
          <p className="text-gray-500 text-sm mb-6">
            You need to generate and confirm a script before selecting a voice.
          </p>
          <Link
            href="/script"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-medium transition-all hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)",
              boxShadow: "0 4px 20px rgba(139,92,246,0.25)",
            }}
          >
            Go to Script Generator
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-1 md:flex-row md:overflow-hidden">

      {/* ---- Left column: voice list ---- */}
      <div className="flex flex-col md:flex-1 md:min-w-[400px] border-b md:border-b-0 md:border-r border-[#2A2B35]">
        {/* Column header */}
        <div className="px-4 py-4 md:px-8 md:py-8 shrink-0">
          <h1 className="text-2xl font-bold text-white">Voice Selection</h1>
          <p className="text-sm text-gray-500 mt-1">Choose a persona for your campaign</p>

          {/* Error banner */}
          {error && (
            <div
              className="flex items-start gap-3 px-4 py-3 rounded-xl border mt-4"
              style={{
                backgroundColor: "rgba(239,68,68,0.08)",
                borderColor: "rgba(239,68,68,0.2)",
              }}
            >
              <Icon name="error" className="text-lg text-red-400 shrink-0 mt-0.5" filled />
              <div className="flex-1">
                <p className="text-sm text-red-400 font-medium">Error</p>
                <p className="text-sm text-red-500/80 mt-0.5">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-500/50 hover:text-red-400 transition-colors"
                aria-label="Dismiss error"
              >
                <Icon name="close" className="text-lg" />
              </button>
            </div>
          )}
        </div>

        {/* Filter pills + voice list */}
        <div className="flex flex-col md:flex-1 md:overflow-hidden">
          <VoiceSelector
            onSelect={handleVoiceSelect}
            selectedVoiceId={selectedVoiceId}
            onTryScript={handleTryScript}
            tryScriptLoadingId={tryScriptLoadingId}
          />
        </div>

        {/* Footer action bar */}
        <div
          className="shrink-0 flex items-center justify-between p-4 md:p-6 border-t"
          style={{ borderColor: "#2A2B35", backgroundColor: "#0B0C15" }}
        >
          <Link
            href="/script"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-300 transition-colors"
          >
            <Icon name="arrow_back" className="text-base" />
            Back to Script
          </Link>

          <div className="flex items-center gap-3">
            {selectedVoiceId && (
              <span className="text-sm text-gray-500">
                {selectedCount} Voice Selected
              </span>
            )}

            <button
              type="button"
              onClick={audioUrl ? () => router.push("/mix") : handleGenerateAudio}
              disabled={!selectedVoiceId || isSynthesizing}
              className={[
                "flex items-center gap-2 px-5 h-10 rounded-full font-bold text-sm transition-all duration-200 border",
                selectedVoiceId && !isSynthesizing
                  ? "text-white hover:bg-[#8B5CF6] border-[#8B5CF6] cursor-pointer"
                  : "text-gray-600 border-gray-700 cursor-not-allowed",
              ].join(" ")}
              aria-label={audioUrl ? "Proceed to mix" : "Generate audio"}
            >
              {isSynthesizing ? (
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
                  Synthesizing...
                </>
              ) : audioUrl ? (
                <>
                  Proceed to Mix{" "}
                  <Icon name="arrow_forward" className="text-lg" />
                </>
              ) : (
                <>
                  Generate &amp; Continue{" "}
                  <Icon name="arrow_forward" className="text-lg" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ---- Right column: Preview & Analysis — hidden on mobile ---- */}
      <div
        className="hidden md:flex flex-1 flex-col overflow-y-auto px-6 pb-6"
        style={{ backgroundColor: "#0B0C15", paddingTop: "calc(2rem + 52px)" }}
      >
        <VoicePreviewPanel
          selectedVoice={selectedVoice}
          confirmedScript={confirmedScript}
          isSynthesizing={isSynthesizing}
          audioUrl={audioUrl}
          onGenerateAudio={handleGenerateAudio}
          onSettingsChange={setVoiceSettings}
        />
      </div>
    </div>
  );
}
