"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import type { ScriptVariant } from "@/types/ad-brief";

interface LiveScriptDraftProps {
  script: ScriptVariant | null;
  isGenerating: boolean;
}

function formatScriptBody(body: string) {
  const lines = body.split("\n").filter((l) => l.trim());

  return lines.map((line, i) => {
    const trimmed = line.trim();

    // Detect SFX / music annotations
    if (
      trimmed.startsWith("[SFX") ||
      trimmed.startsWith("(SFX") ||
      trimmed.startsWith("[MUSIC") ||
      trimmed.startsWith("(MUSIC") ||
      trimmed.startsWith("[SOUND") ||
      trimmed.toUpperCase().startsWith("SFX:")
    ) {
      return (
        <div
          key={i}
          className="flex items-center gap-2 my-3 px-3 py-2 bg-amber-900/20 border border-amber-500/30 rounded-lg"
        >
          <Icon name="graphic_eq" className="text-base text-amber-400" />
          <span className="text-xs font-mono font-bold text-amber-400 uppercase">
            {trimmed}
          </span>
        </div>
      );
    }

    return (
      <p key={i} className="text-sm text-gray-300 leading-relaxed mb-3">
        {trimmed}
      </p>
    );
  });
}

export default function LiveScriptDraft({
  script,
  isGenerating,
}: LiveScriptDraftProps) {
  const [copied, setCopied] = useState(false);
  const [revealedChars, setRevealedChars] = useState(0);
  const [isRevealing, setIsRevealing] = useState(false);
  const lastScriptIdRef = useRef<string | null>(null);

  // Typewriter effect: when a new script appears, reveal characters progressively
  useEffect(() => {
    if (!script) {
      lastScriptIdRef.current = null;
      setRevealedChars(0);
      setIsRevealing(false);
      return;
    }

    // New script detected
    if (script.id !== lastScriptIdRef.current) {
      lastScriptIdRef.current = script.id;
      const totalChars = script.body.length;
      setRevealedChars(0);
      setIsRevealing(true);

      let current = 0;
      const interval = setInterval(() => {
        current += 3;
        if (current >= totalChars) {
          current = totalChars;
          clearInterval(interval);
          setIsRevealing(false);
        }
        setRevealedChars(current);
      }, 18);

      return () => clearInterval(interval);
    }
  }, [script]);

  function handleCopy() {
    if (!script) return;
    navigator.clipboard.writeText(script.body).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownload() {
    if (!script) return;
    const blob = new Blob([script.body], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${script.title.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Build the display body — either partial (during reveal) or full
  const displayBody =
    script && isRevealing
      ? script.body.slice(0, revealedChars)
      : script?.body ?? "";

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* Live Script Draft card */}
      <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden flex-1 flex flex-col">
        {/* Card header */}
        <div className="px-5 py-4 flex items-center gap-3 border-b border-[#27272a]">
          <div className="w-8 h-8 rounded-lg bg-[#27272a] flex items-center justify-center border border-white/5">
            <Icon name="description" className="text-lg text-white/70" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-white tracking-tight">
              Live Script Draft
            </h3>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
              Real-time Generation
            </p>
          </div>

          {/* Copy / download actions */}
          {script && !isRevealing && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleDownload}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                title="Download script"
              >
                <Icon
                  name="download"
                  className="text-lg text-white/40 hover:text-white/80"
                />
              </button>
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                title="Copy to clipboard"
              >
                <Icon
                  name={copied ? "check" : "content_copy"}
                  className={`text-lg ${copied ? "text-[#10b981]" : "text-white/40 hover:text-white/80"}`}
                />
              </button>
            </div>
          )}
        </div>

        {/* Card body */}
        <div className="p-5 flex-1 overflow-y-auto">
          {/* Empty state */}
          {!script && !isGenerating && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#27272a] flex items-center justify-center mb-4">
                <Icon name="edit_note" className="text-3xl text-gray-500" />
              </div>
              <p className="text-gray-500 font-medium text-sm">
                Awaiting intelligence input...
              </p>
              <p className="text-gray-500/70 text-xs mt-1">
                Fill in the brief and hit proceed to generate your script.
              </p>
            </div>
          )}

          {/* Generating skeleton state */}
          {isGenerating && (
            <div className="py-10 space-y-4">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                <span className="text-xs font-bold text-[#10b981] uppercase tracking-wider">
                  Analysing & Generating
                </span>
              </div>
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-3.5 rounded-full bg-[#27272a] animate-pulse"
                  style={{
                    width: `${65 + Math.random() * 30}%`,
                    animationDelay: `${i * 150}ms`,
                  }}
                />
              ))}
              <div className="h-3.5 rounded-full bg-[#27272a] animate-pulse w-[45%]" />
            </div>
          )}

          {/* Script content */}
          {script && !isGenerating && (
            <div className="animate-fade-in">
              {/* Analysis complete / revealing badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#10b981]/10 border border-[#10b981]/20 mb-4">
                <div className={`w-1.5 h-1.5 rounded-full bg-[#10b981] ${isRevealing ? "animate-pulse" : ""}`} />
                <span className="text-[10px] font-bold text-[#10b981] uppercase tracking-wider">
                  {isRevealing ? "Streaming..." : "Analysis Complete"}
                </span>
              </div>

              {/* Script title */}
              <h2 className="text-xl font-bold text-white mb-3 leading-tight">
                {script.title}
              </h2>

              {/* Metadata badges */}
              <div className="flex flex-wrap gap-2 mb-5 pb-5 border-b border-[#27272a]">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#27272a] text-gray-400">
                  <Icon name="target" className="text-sm" />
                  {script.wordCount} words
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#27272a] text-gray-400">
                  <Icon name="timer" className="text-sm" />
                  ~{script.estimatedDuration}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#8B5CF6]/10 text-[#8B5CF6]">
                  <Icon name="mood" className="text-sm" />
                  {script.tone}
                </span>
              </div>

              {/* Formatted script body with typewriter cursor */}
              <div className="mb-4">
                {formatScriptBody(displayBody)}
                {isRevealing && (
                  <span className="streaming-text inline-block w-0">&nbsp;</span>
                )}
              </div>

              {/* Bottom bar */}
              {!isRevealing && (
                <div className="flex items-center justify-between pt-3 border-t border-[#27272a]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#10b981]" />
                    <span className="text-xs text-gray-500 font-medium">
                      Ready
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 font-mono">
                    {script.body.split("\n").length} lines
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Next step preview card */}
      <Link href="/voice" className="block group">
        <div className="bg-[#18181b] border border-[#27272a] hover:border-[#8B5CF6]/30 rounded-xl p-4 flex items-center gap-4 transition-all duration-200">
          <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center shrink-0 group-hover:bg-[#8B5CF6]/20 transition-colors">
            <Icon name="record_voice_over" className="text-xl text-[#8B5CF6]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Next Step
            </p>
            <p className="text-sm font-bold text-white group-hover:text-[#A78BFA] transition-colors">
              Voice Selection & Casting
            </p>
          </div>
          <Icon
            name="arrow_forward"
            className="text-xl text-gray-500 group-hover:text-[#8B5CF6] transition-colors"
          />
        </div>
      </Link>
    </div>
  );
}
