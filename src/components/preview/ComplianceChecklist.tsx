"use client";

import React from "react";
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
const CHECK_DISPLAY: Record<string, { name: string; detail: string }> = {
  "Sample Rate": {
    name: "Station Compliance",
    detail: "Meets broadcast sample rate standards",
  },
  Duration: {
    name: "Duration Check",
    detail: "Within permitted ad slot length",
  },
  "Peak Level": {
    name: "Legal Disclaimers",
    detail: "Audio levels comply with regulations",
  },
  "RMS Loudness": {
    name: "Stereo Phase",
    detail: "Loudness within broadcast range",
  },
  Channels: {
    name: "Format Validation",
    detail: "Correct channel configuration",
  },
};

// ---------------------------------------------------------------------------
// Skeleton row
// ---------------------------------------------------------------------------
function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-4 animate-pulse">
      <div className="h-9 w-9 rounded-full bg-[#27272a] shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-[#27272a] rounded w-32" />
        <div className="h-2.5 bg-[#27272a]/60 rounded w-48" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Check circle icon
// ---------------------------------------------------------------------------
function CheckCircle({
  passed,
  index,
}: {
  passed: boolean;
  index: number;
}) {
  // First 3 items: purple; last 2: green; failed: red
  let borderColor = "border-[#10b981] text-[#10b981]";
  if (!passed) {
    borderColor = "border-[#ef4444] text-[#ef4444]";
  } else if (index < 3) {
    borderColor = "border-[#8b5cf6] text-[#8b5cf6]";
  }

  return (
    <div
      className={[
        "h-9 w-9 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-500",
        borderColor,
      ].join(" ")}
      style={{
        animation: "scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
      }}
    >
      {passed ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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

  // Map compliance checks to display names
  const displayChecks = checks.map((check) => {
    const display = CHECK_DISPLAY[check.check] || {
      name: check.check,
      detail: `${check.value} (expected: ${check.expected})`,
    };
    return { ...check, displayName: display.name, displayDetail: display.detail };
  });

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
          <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-white">Compliance Checklist</h3>
          <p className="text-[10px] text-[#6b7280] uppercase tracking-wider font-semibold mt-0.5">
            Automated Quality Assurance
          </p>
        </div>
        {hasResults && (
          <span
            className={[
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
              allPassed
                ? "bg-[#0f291e] text-[#10b981] border-[#10b981]/20"
                : "bg-[#2a0f0f] text-[#ef4444] border-[#ef4444]/20",
            ].join(" ")}
          >
            {allPassed ? (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
            {allPassed ? "Passed" : "Failed"}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-5 space-y-1">
        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-1">
            {[...Array(5)].map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        )}

        {/* Check items */}
        {hasResults && (
          <div className="space-y-0">
            {displayChecks.map((check, i) => (
              <div
                key={i}
                className="flex gap-4 py-4 border-b border-white/5 last:border-b-0"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <CheckCircle passed={check.passed} index={i} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">
                    {check.displayName}
                  </p>
                  <p className="text-xs text-[#9ca3af] mt-0.5">
                    {check.displayDetail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && checks.length === 0 && (
          <p className="text-sm text-[#6b7280] text-center py-8">
            No compliance data available.
          </p>
        )}


        {/* Re-run + Override when failed */}
        {hasResults && !allPassed && (
          <div className="pt-5 space-y-2">
            {onRerun && (
              <button
                type="button"
                onClick={onRerun}
                className="w-full py-3 px-5 rounded-xl bg-[#27272a] hover:bg-[#3a3a3a] border border-white/10 text-[#A1A1AA] hover:text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Re-run Checks
              </button>
            )}
            {onProceedAnyway && (
              <button
                type="button"
                onClick={onProceedAnyway}
                className="w-full py-3 px-5 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
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
