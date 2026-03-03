"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import BriefForm from "@/components/script/BriefForm";
import ScriptResults from "@/components/script/ScriptResults";
import ScriptEditor from "@/components/script/ScriptEditor";
import LiveScriptDraft from "@/components/script/LiveScriptDraft";
import { DEMO_BRIEF } from "@/constants/demo-brief";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import type { AdBrief, ScriptVariant } from "@/types/ad-brief";

type Step = "brief" | "results" | "editor";

export default function ScriptPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("brief");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [variants, setVariants] = useState<ScriptVariant[]>([]);
  const [selectedScript, setSelectedScript] = useState<ScriptVariant | null>(
    null
  );
  const [currentBrief, setCurrentBrief] = useState<AdBrief | null>(null);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);

  // Call the generate-script API with an AdBrief
  const generateScripts = useCallback(
    async (brief: AdBrief): Promise<ScriptVariant[]> => {
      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brief),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to generate scripts.");
      }

      return data.variants as ScriptVariant[];
    },
    []
  );

  // Step 1 -> 2: Submit brief, call API
  const handleBriefSubmit = useCallback(
    async (brief: AdBrief) => {
      setError(null);
      setLoading(true);
      setCurrentBrief(brief);
      try {
        // Persist the brief
        localStorage.setItem(STORAGE_KEYS.AD_BRIEF, JSON.stringify(brief));
        const result = await generateScripts(brief);
        setVariants(result);
        // Auto-select first variant for the live draft
        if (result.length > 0) {
          setSelectedScript(result[0]!);
        }
        setStep("results");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again."
        );
      } finally {
        setLoading(false);
      }
    },
    [generateScripts]
  );

  // Step 2 -> 3: Confirm selected script
  const handleScriptConfirm = useCallback((variant: ScriptVariant) => {
    setSelectedScript(variant);
    setStep("editor");
  }, []);

  // ScriptEditor regenerate: calls API with current text as an "additional notes" override
  const handleRegenerate = useCallback(
    async (currentText: string): Promise<ScriptVariant> => {
      if (!currentBrief) throw new Error("No brief available for regeneration.");

      const refinedBrief: AdBrief = {
        ...currentBrief,
        additionalNotes: `Refine and improve the following draft script while keeping the same tone and structure:\n\n"${currentText}"`,
      };

      const result = await generateScripts(refinedBrief);
      if (!result[0]) throw new Error("No variant returned from regeneration.");
      return result[0];
    },
    [currentBrief, generateScripts]
  );

  // Regenerate a single variant with a new tone
  const handleRegenerateSingle = useCallback(
    async (index: number, newTone: string) => {
      if (!currentBrief) return;
      setRegeneratingIndex(index);
      try {
        const singleBrief: AdBrief = {
          ...currentBrief,
          tone: newTone as AdBrief["tone"],
          additionalNotes: "Generate only 1 variant with this tone.",
        };
        const result = await generateScripts(singleBrief);
        if (result[0]) {
          setVariants((prev) => {
            const next = [...prev];
            next[index] = result[0]!;
            return next;
          });
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to regenerate variant."
        );
      } finally {
        setRegeneratingIndex(null);
      }
    },
    [currentBrief, generateScripts]
  );

  // Final confirmation -- save to localStorage and navigate to voice page
  const handleEditorConfirm = useCallback(
    (editedScript: ScriptVariant) => {
      setSelectedScript(editedScript);
      const scriptJson = JSON.stringify(editedScript);
      localStorage.setItem(STORAGE_KEYS.CONFIRMED_SCRIPT, scriptJson);
      router.push("/voice");
    },
    [router]
  );

  // Load demo handler
  function handleLoadDemo() {
    const btn = document.getElementById("load-demo-btn");
    if (btn) btn.click();
  }

  // The script to show in the live draft panel
  const liveScript =
    step === "editor" && selectedScript
      ? selectedScript
      : step === "results" && selectedScript
        ? selectedScript
        : variants.length > 0
          ? variants[0]!
          : null;

  return (
    <div className="flex-1 overflow-hidden flex flex-col animate-fade-in">
      {/* Page header bar */}
      <div className="h-20 flex items-center px-8 border-b border-[#27272a]/30 shrink-0">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white">
            Intelligence Collection
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gathering raw data signals to synthesize high-conversion audio copy.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Demo loader button — only shown on brief step */}
          {step === "brief" && (
            <button
              type="button"
              onClick={handleLoadDemo}
              className="px-3 py-1.5 rounded-lg bg-[#27272a] hover:bg-[#3f3f46] text-gray-400 hover:text-white text-xs font-medium border border-[#3a3a3a] transition-all duration-150"
            >
              Load Demo
            </button>
          )}

          {/* Settings icon */}
          <button
            type="button"
            className="w-9 h-9 rounded-lg bg-[#27272a] hover:bg-[#3f3f46] border border-[#3a3a3a] flex items-center justify-center transition-all duration-150"
            aria-label="Settings"
          >
            <svg
              className="w-4 h-4 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

          {/* User avatar */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#3b82f6] flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-white">JS</span>
          </div>
        </div>
      </div>

      {/* Two-panel split */}
      <div className="flex-1 overflow-hidden p-8 flex gap-8">
        {/* Left panel — form / results / editor (38%) */}
        <div style={{ flex: "0 0 38%" }} className="min-w-0 overflow-y-auto">
          {/* Error alert */}
          {error && (
            <div className="mb-6 flex items-start gap-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <svg
                className="h-5 w-5 text-red-400 shrink-0 mt-0.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-red-400 font-medium">Error</p>
                <p className="text-sm text-red-400/80 mt-0.5">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400/60 hover:text-red-400 transition-colors"
                aria-label="Dismiss error"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Brief step */}
          {step === "brief" && (
            <div className="bg-[#121212] rounded-xl border border-[#27272a] overflow-hidden">
              {/* Purple gradient top border */}
              <div className="h-1 bg-gradient-to-r from-purple-500 to-blue-500" />
              <div className="p-8">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-white">
                    Feed Intelligence
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Define your campaign parameters to generate targeted audio scripts.
                  </p>
                </div>
                <BriefForm
                  onSubmit={handleBriefSubmit}
                  loading={loading}
                  demoValues={DEMO_BRIEF}
                />
              </div>
            </div>
          )}

          {/* Results step */}
          {step === "results" && (
            <ScriptResults
              variants={variants}
              onConfirm={handleScriptConfirm}
              onVariantSelect={(v) => setSelectedScript(v ?? variants[0] ?? null)}
              onToneChange={handleRegenerateSingle}
              regeneratingIndex={regeneratingIndex}
            />
          )}

          {/* Editor step */}
          {step === "editor" && selectedScript && (
            <ScriptEditor
              script={selectedScript}
              onConfirm={handleEditorConfirm}
              onRegenerate={handleRegenerate}
            />
          )}
        </div>

        {/* Right panel — Live Script Draft (fills remaining ~60%) */}
        <div style={{ flex: "1 1 0" }} className="min-w-0 flex flex-col">
          <LiveScriptDraft script={liveScript} isGenerating={loading} />
        </div>
      </div>
    </div>
  );
}
