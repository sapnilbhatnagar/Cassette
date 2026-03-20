"use client";

import React, { useState } from "react";
import type { ComplianceCheck } from "@/lib/audio/compliance-checks";

interface ComplianceChecklistProps {
  checks: ComplianceCheck[];
  loading?: boolean;
  onRerun?: () => void;
  onProceedAnyway?: () => void;
}

// ---------------------------------------------------------------------------
// Compliance check item definitions for display
// ---------------------------------------------------------------------------
const CHECK_DISPLAY: Record<
  string,
  { name: string; detail: string; icon: string; category: string }
> = {
  "File Available": {
    name: "File Integrity",
    detail: "Audio file accessible and decodable",
    icon: "verified",
    category: "Format",
  },
  "Sample Rate": {
    name: "Sample Rate",
    detail: "Meets broadcast sample rate standards",
    icon: "speed",
    category: "Format",
  },
  Duration: {
    name: "Duration Check",
    detail: "Within permitted ad slot length",
    icon: "timer",
    category: "Timing",
  },
  "Peak Level": {
    name: "Peak Level",
    detail: "Audio levels comply with regulations",
    icon: "equalizer",
    category: "Levels",
  },
  "Approx. Loudness": {
    name: "RMS Loudness",
    detail: "Loudness within broadcast range",
    icon: "volume_up",
    category: "Levels",
  },
  Channels: {
    name: "Channel Format",
    detail: "Correct channel configuration",
    icon: "surround_sound",
    category: "Format",
  },
};

const CATEGORY_ORDER = ["Format", "Timing", "Levels"];

// ---------------------------------------------------------------------------
// Skeleton row
// ---------------------------------------------------------------------------
function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3.5 animate-pulse">
      <div className="h-8 w-8 rounded-lg bg-[#27272a] shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-[#27272a] rounded w-28" />
        <div className="h-2.5 bg-[#27272a]/60 rounded w-44" />
      </div>
      <div className="h-5 w-12 bg-[#27272a] rounded-full" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Check status icon
// ---------------------------------------------------------------------------
function CheckStatusIcon({
  passed,
  category,
}: {
  passed: boolean;
  category: string;
}) {
  const bgColor = passed
    ? category === "Levels"
      ? "bg-green-500/10 border-green-500/20"
      : "bg-[#8b5cf6]/10 border-[#8b5cf6]/20"
    : "bg-red-500/10 border-red-500/20";

  const iconColor = passed
    ? category === "Levels"
      ? "text-green-400"
      : "text-[#a78bfa]"
    : "text-red-400";

  return (
    <div
      className={[
        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border transition-all duration-500",
        bgColor,
      ].join(" ")}
      style={{
        animation:
          "scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
      }}
    >
      {passed ? (
        <svg
          className={`w-4 h-4 ${iconColor}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      ) : (
        <svg
          className={`w-4 h-4 ${iconColor}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      )}
    </div>
  );
}

export default function ComplianceChecklist({
  checks,
  loading = false,
  onRerun,
  onProceedAnyway,
}: ComplianceChecklistProps) {
  const allPassed = checks.length > 0 && checks.every((c) => c.passed);
  const hasResults = !loading && checks.length > 0;
  const [expandedCheck, setExpandedCheck] = useState<number | null>(null);

  // Map compliance checks to display names and group by category
  const displayChecks = checks.map((check, i) => {
    const display = CHECK_DISPLAY[check.check] || {
      name: check.check,
      detail: `${check.value} (expected: ${check.expected})`,
      icon: "help_outline",
      category: "Other",
    };
    return {
      ...check,
      index: i,
      displayName: display.name,
      displayDetail: display.detail,
      icon: display.icon,
      category: display.category,
    };
  });

  // Group by category
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    checks: displayChecks.filter((c) => c.category === cat),
  })).filter((g) => g.checks.length > 0);

  // Add any uncategorized
  const categorized = new Set(CATEGORY_ORDER);
  const other = displayChecks.filter((c) => !categorized.has(c.category));
  if (other.length > 0) grouped.push({ category: "Other", checks: other });

  const passedCount = checks.filter((c) => c.passed).length;
  const totalCount = checks.length;

  return (
    <>
      {/* Inline keyframe for the scale animation */}
      <style>{`
        @keyframes scaleIn {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Card header */}
      <div className="px-5 py-4 flex items-center gap-3 border-b border-white/10">
        <div className="w-9 h-9 rounded-lg bg-[#27272a] flex items-center justify-center shrink-0">
          <svg
            className="w-4 h-4 text-white/60"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-white">
            Compliance Checklist
          </h3>
          <p className="text-[10px] text-[#6b7280] uppercase tracking-wider font-semibold mt-0.5">
            Automated Quality Assurance
          </p>
        </div>
        {hasResults && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-gray-500">
              {passedCount}/{totalCount}
            </span>
            <span
              className={[
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                allPassed
                  ? "bg-[#0f291e] text-[#10b981] border-[#10b981]/20"
                  : "bg-[#2a0f0f] text-[#ef4444] border-[#ef4444]/20",
              ].join(" ")}
            >
              {allPassed ? (
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {allPassed ? "Passed" : "Failed"}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 space-y-1">
        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-1">
            {[...Array(6)].map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        )}

        {/* Check items grouped by category */}
        {hasResults && (
          <div className="space-y-4">
            {grouped.map((group) => (
              <div key={group.category}>
                <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-2 px-1">
                  {group.category}
                </p>
                <div className="space-y-0 bg-[#0f0f12] rounded-xl border border-white/5 overflow-hidden">
                  {group.checks.map((check) => (
                    <div key={check.index}>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedCheck(
                            expandedCheck === check.index
                              ? null
                              : check.index
                          )
                        }
                        className="w-full flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-b-0 hover:bg-white/[0.02] transition-colors text-left"
                        style={{ animationDelay: `${check.index * 80}ms` }}
                      >
                        <CheckStatusIcon
                          passed={check.passed}
                          category={check.category}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">
                            {check.displayName}
                          </p>
                          <p className="text-[11px] text-[#9ca3af] mt-0.5">
                            {check.displayDetail}
                          </p>
                        </div>
                        <svg
                          className={`w-3.5 h-3.5 text-gray-600 transition-transform duration-200 ${
                            expandedCheck === check.index ? "rotate-180" : ""
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
                      </button>
                      {/* Expanded detail */}
                      {expandedCheck === check.index && (
                        <div className="px-4 py-3 bg-[#18181b]/50 border-b border-white/5">
                          <div className="grid grid-cols-2 gap-3 text-[11px]">
                            <div>
                              <span className="text-gray-600 block mb-0.5">
                                Measured
                              </span>
                              <span className="text-gray-300 font-mono">
                                {check.value}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600 block mb-0.5">
                                Expected
                              </span>
                              <span className="text-gray-300 font-mono">
                                {check.expected}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && checks.length === 0 && (
          <div className="text-center py-8">
            <div className="w-10 h-10 rounded-lg bg-[#27272a] flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p className="text-sm text-[#6b7280]">
              No compliance data available.
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Checks will run automatically when audio loads.
            </p>
          </div>
        )}

        {/* Re-run + Override when failed */}
        {hasResults && !allPassed && (
          <div className="pt-4 space-y-2">
            {onRerun && (
              <button
                type="button"
                onClick={onRerun}
                className="w-full py-2.5 px-5 rounded-xl bg-[#27272a] hover:bg-[#3a3a3a] border border-white/10 text-[#A1A1AA] hover:text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Re-run Checks
              </button>
            )}
            {onProceedAnyway && (
              <button
                type="button"
                onClick={onProceedAnyway}
                className="w-full py-2.5 px-5 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
                Override &amp; Proceed to Deployment
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
