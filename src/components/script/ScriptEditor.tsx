"use client";

import React, { useState, useCallback } from "react";
import Button from "@/components/ui/Button";
import type { ScriptVariant } from "@/types/ad-brief";

interface ScriptEditorProps {
  script: ScriptVariant;
  onConfirm: (editedScript: ScriptVariant) => void;
  onRegenerate: (text: string) => Promise<ScriptVariant>;
}

// Approximate words-per-second at a natural radio read pace
const WORDS_PER_SECOND = 2.5;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function estimateDuration(wordCount: number): string {
  const seconds = Math.round(wordCount / WORDS_PER_SECOND);
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

export default function ScriptEditor({
  script,
  onConfirm,
  onRegenerate,
}: ScriptEditorProps) {
  const [body, setBody] = useState(script.body);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);

  const wordCount = countWords(body);
  const duration = estimateDuration(wordCount);

  const handleConfirm = useCallback(() => {
    onConfirm({
      ...script,
      body,
      wordCount,
      estimatedDuration: duration,
    });
  }, [script, body, wordCount, duration, onConfirm]);

  const handleRegenerate = useCallback(async () => {
    setRegenerateError(null);
    setRegenerating(true);
    try {
      const refined = await onRegenerate(body);
      setBody(refined.body);
    } catch (err) {
      setRegenerateError(
        err instanceof Error ? err.message : "Regeneration failed. Please try again."
      );
    } finally {
      setRegenerating(false);
    }
  }, [body, onRegenerate]);

  // Word count colour guidance
  const originalWords = script.wordCount;
  const deviation = Math.abs(wordCount - originalWords);
  const wordCountColour =
    deviation <= 5
      ? "#22c55e"
      : deviation <= 15
      ? "#f59e0b"
      : "#ef4444";

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">Edit Script</h2>
        <p className="text-sm text-gray-400 mt-0.5">
          Refine the script before sending to voice synthesis. Changes update word count and duration in real time.
        </p>
      </div>

      <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-5 mb-4">
        {/* Script title + meta row */}
        <div className="flex items-center justify-between gap-4 mb-3">
          <h3 className="text-white font-semibold text-sm">{script.title}</h3>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border"
              style={{
                color: wordCountColour,
                borderColor: `${wordCountColour}40`,
                backgroundColor: `${wordCountColour}10`,
              }}
            >
              {wordCount} words
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-[#27272a] border border-[#27272a] text-gray-400">
              ~{duration}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-[#8B5CF6]">
              {script.tone}
            </span>
          </div>
        </div>

        {/* Editable textarea */}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          disabled={regenerating}
          className={[
            "w-full px-4 py-3 rounded-lg text-sm resize-y leading-relaxed",
            "bg-[#121212] border border-[#27272a] text-white placeholder-gray-600",
            "transition-colors duration-150",
            "focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/30 focus:border-[#8B5CF6]/50",
            "hover:border-[#3a3a3a]",
            regenerating ? "opacity-50 cursor-not-allowed" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        />

        {/* Guidance hint */}
        <p className="text-xs text-gray-500 mt-2">
          Target: {originalWords} words ({script.estimatedDuration}).{" "}
          {deviation > 5 && (
            <span style={{ color: wordCountColour }}>
              {wordCount > originalWords
                ? `${wordCount - originalWords} over`
                : `${originalWords - wordCount} under`}{" "}
              target.
            </span>
          )}
        </p>
      </div>

      {/* Regenerate error */}
      {regenerateError && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {regenerateError}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="secondary"
          size="md"
          loading={regenerating}
          onClick={handleRegenerate}
        >
          Regenerate
        </Button>

        <Button
          variant="primary"
          size="lg"
          disabled={!body.trim() || regenerating}
          onClick={handleConfirm}
        >
          Confirm Script
        </Button>
      </div>
    </div>
  );
}
