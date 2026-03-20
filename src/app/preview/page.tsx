"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import PreviewPlayer from "@/components/preview/PreviewPlayer";
import ComplianceChecklist from "@/components/preview/ComplianceChecklist";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import type { ScriptVariant } from "@/types/ad-brief";
import {
  runComplianceChecks,
  type ComplianceCheck,
} from "@/lib/audio/compliance-checks";

/* --------------- Rework queue types --------------- */
type ReworkPriority = "critical" | "major" | "minor";
type ReworkCategory =
  | "audio_levels"
  | "voice_quality"
  | "script_content"
  | "timing"
  | "music_bed"
  | "other";

interface ReworkItem {
  id: string;
  createdAt: number;
  comments: string;
  priority: ReworkPriority;
  category: ReworkCategory;
  status: "pending" | "in_progress" | "resolved";
  resolvedAt?: number;
}

const REWORK_KEY = "cassette_rework_queue";
const REVIEW_NOTES_KEY = "cassette_review_notes";

const PRIORITY_CONFIG: Record<
  ReworkPriority,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  critical: {
    label: "Critical",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    dot: "bg-red-500",
  },
  major: {
    label: "Major",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    dot: "bg-amber-500",
  },
  minor: {
    label: "Minor",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    dot: "bg-blue-500",
  },
};

const CATEGORY_OPTIONS: { value: ReworkCategory; label: string; icon: string }[] = [
  { value: "audio_levels", label: "Audio Levels", icon: "equalizer" },
  { value: "voice_quality", label: "Voice Quality", icon: "record_voice_over" },
  { value: "script_content", label: "Script Content", icon: "description" },
  { value: "timing", label: "Timing", icon: "timer" },
  { value: "music_bed", label: "Music Bed", icon: "music_note" },
  { value: "other", label: "Other", icon: "more_horiz" },
];

function loadReworkQueue(): ReworkItem[] {
  try {
    const raw = localStorage.getItem(REWORK_KEY);
    return raw ? (JSON.parse(raw) as ReworkItem[]) : [];
  } catch {
    return [];
  }
}

function saveReworkQueue(queue: ReworkItem[]) {
  localStorage.setItem(REWORK_KEY, JSON.stringify(queue));
}

/* --------------- Loading spinner --------------- */
function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
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

/* --------------- Approval states --------------- */
type ReviewState = "reviewing" | "requesting_rework" | "approved";

/* --------------- Page --------------- */
export default function PreviewPage() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [confirmedScript, setConfirmedScript] =
    useState<ScriptVariant | null>(null);
  const [mixedAudioUrl, setMixedAudioUrl] = useState<string>("");

  // Compliance
  const [checks, setChecks] = useState<ComplianceCheck[]>([]);
  const [checksLoading, setChecksLoading] = useState(false);
  const [checksRan, setChecksRan] = useState(false);

  // Approval loop
  const [reviewState, setReviewState] = useState<ReviewState>("reviewing");
  const [reworkComment, setReworkComment] = useState("");
  const [reworkPriority, setReworkPriority] = useState<ReworkPriority>("major");
  const [reworkCategory, setReworkCategory] = useState<ReworkCategory>("other");
  const [reworkQueue, setReworkQueue] = useState<ReworkItem[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [showReviewNotes, setShowReviewNotes] = useState(false);
  const [reworkFilter, setReworkFilter] = useState<"all" | "pending" | "resolved">("all");
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);

  /* Load from localStorage */
  useEffect(() => {
    const rawScript = localStorage.getItem(STORAGE_KEYS.CONFIRMED_SCRIPT);
    if (rawScript) {
      try {
        setConfirmedScript(JSON.parse(rawScript) as ScriptVariant);
      } catch {
        /* malformed */
      }
    }

    const savedNotes = localStorage.getItem(REVIEW_NOTES_KEY);
    if (savedNotes) setReviewNotes(savedNotes);

    const validateAndLoad = async () => {
      const savedMix = localStorage.getItem(STORAGE_KEYS.GENERATED_MIX);
      if (savedMix && savedMix.startsWith("blob:")) {
        try {
          const res = await fetch(savedMix);
          res.body?.cancel();
          if (res.ok) setMixedAudioUrl(savedMix);
        } catch {
          /* stale */
        }
      }
      setLoaded(true);
    };
    validateAndLoad();
    setReworkQueue(loadReworkQueue());
  }, []);

  /* Save review notes */
  useEffect(() => {
    if (reviewNotes) {
      localStorage.setItem(REVIEW_NOTES_KEY, reviewNotes);
    }
  }, [reviewNotes]);

  /* Compliance checks */
  const runChecks = useCallback(
    async (audioUrl: string, expectedDuration: string) => {
      setChecksLoading(true);
      setChecksRan(false);
      try {
        const results = await runComplianceChecks({
          audioUrl,
          expectedDuration,
        });
        setChecks(results);
      } catch (err) {
        console.error("[PreviewPage] compliance check error:", err);
        setChecks([]);
      } finally {
        setChecksLoading(false);
        setChecksRan(true);
      }
    },
    []
  );

  useEffect(() => {
    if (mixedAudioUrl && confirmedScript && !checksRan && !checksLoading) {
      runChecks(mixedAudioUrl, confirmedScript.estimatedDuration);
    }
  }, [mixedAudioUrl, confirmedScript, checksRan, checksLoading, runChecks]);

  /* Approve — reviewer says audio is good, proceed to deployment */
  const handleApprove = useCallback(() => {
    setIsNavigating(true);
    setReviewState("approved");
    setTimeout(() => {
      router.push("/localise");
    }, 800);
  }, [router]);

  /* Request rework */
  const handleSubmitRework = useCallback(() => {
    if (!reworkComment.trim()) return;
    const item: ReworkItem = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      comments: reworkComment.trim(),
      priority: reworkPriority,
      category: reworkCategory,
      status: "pending",
    };
    const updated = [item, ...reworkQueue];
    setReworkQueue(updated);
    saveReworkQueue(updated);
    setReworkComment("");
    setReworkPriority("major");
    setReworkCategory("other");
    setReviewState("reviewing");
  }, [reworkComment, reworkPriority, reworkCategory, reworkQueue]);

  /* Mark rework item as resolved */
  const handleResolveRework = useCallback(
    (id: string) => {
      const updated = reworkQueue.map((item) =>
        item.id === id
          ? { ...item, status: "resolved" as const, resolvedAt: Date.now() }
          : item
      );
      setReworkQueue(updated);
      saveReworkQueue(updated);
    },
    [reworkQueue]
  );

  const handleStartRework = useCallback(
    (id: string) => {
      const updated = reworkQueue.map((item) =>
        item.id === id
          ? { ...item, status: "in_progress" as const }
          : item
      );
      setReworkQueue(updated);
      saveReworkQueue(updated);
    },
    [reworkQueue]
  );

  /* Clear resolved items */
  const handleClearResolved = useCallback(() => {
    const updated = reworkQueue.filter((r) => r.status !== "resolved");
    setReworkQueue(updated);
    saveReworkQueue(updated);
  }, [reworkQueue]);

  /* Loading gate */
  if (!loaded)
    return (
      <main className="flex-1 overflow-hidden flex flex-col">
        <Spinner />
      </main>
    );

  /* No mixed audio fallback */
  if (!mixedAudioUrl) {
    return (
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="px-4 pt-4 pb-3 md:px-6 md:pt-6 md:pb-4 shrink-0">
          <h1 className="text-2xl font-bold text-white">Peer Review</h1>
          <p className="text-sm text-gray-500 mt-1">
            Mix your audio before running QA checks.
          </p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-6">
          <div className="rounded-2xl border border-dashed border-[#27272a] p-8 sm:p-12 text-center bg-[#18181b]">
            <div className="w-12 h-12 rounded-xl bg-[#27272a] flex items-center justify-center mx-auto mb-4">
              <Icon name="music_note" className="text-2xl text-gray-500" />
            </div>
            <p className="text-white font-medium mb-1">
              No mixed audio found
            </p>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              You need to mix your voice audio with a music bed before you can
              preview and run QA checks.
            </p>
            <Link
              href="/mix"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7c3aed] text-white text-sm font-semibold transition-all hover:opacity-90"
            >
              Go to Audio Mix
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const businessName = (
    confirmedScript as ScriptVariant & { businessName?: string }
  )?.businessName;
  const allPassed = checks.length > 0 && checks.every((c) => c.passed);
  const pendingRework = reworkQueue.filter((r) => r.status !== "resolved");
  const resolvedRework = reworkQueue.filter((r) => r.status === "resolved");
  const hasCritical = pendingRework.some((r) => r.priority === "critical");

  const filteredQueue =
    reworkFilter === "pending"
      ? reworkQueue.filter((r) => r.status !== "resolved")
      : reworkFilter === "resolved"
        ? reworkQueue.filter((r) => r.status === "resolved")
        : reworkQueue;

  return (
    <>
      {/* Navigation transition overlay */}
      {isNavigating && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(0,0,0,0.72)",
            backdropFilter: "blur(6px)",
            animation: "fadeIn 0.25s ease",
          }}
        >
          <div className="text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{
                background: "rgba(16,185,129,0.15)",
                border: "1.5px solid rgba(52,211,153,0.4)",
              }}
            >
              <Icon name="check_circle" className="text-4xl text-green-400" />
            </div>
            <p className="text-white font-bold text-lg tracking-tight">
              Approved
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Proceeding to deployment...
            </p>
          </div>
        </div>
      )}

      {/* Approve confirmation modal */}
      {showApproveConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-6 max-w-sm mx-4 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <Icon name="verified" className="text-xl text-green-400" />
              </div>
              <div>
                <h3 className="text-white font-bold">Confirm Approval</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  This will move the ad to deployment
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-[#0f0f12] rounded-xl p-3 mb-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Compliance</span>
                <span
                  className={
                    allPassed
                      ? "text-green-400 font-bold"
                      : "text-amber-400 font-bold"
                  }
                >
                  {allPassed ? "All Passed" : "Override"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Open Reworks</span>
                <span
                  className={
                    pendingRework.length > 0
                      ? "text-amber-400 font-bold"
                      : "text-green-400 font-bold"
                  }
                >
                  {pendingRework.length}
                </span>
              </div>
              {reviewNotes && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Notes</span>
                  <span className="text-gray-400">Attached</span>
                </div>
              )}
            </div>

            {pendingRework.length > 0 && (
              <div className="flex items-start gap-2 mb-4 px-3 py-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15">
                <Icon
                  name="warning"
                  className="text-sm text-amber-400 mt-0.5 shrink-0"
                />
                <p className="text-[11px] text-amber-400/80 leading-relaxed">
                  There are {pendingRework.length} unresolved rework
                  {pendingRework.length > 1 ? "s" : ""}. Approval will
                  proceed regardless.
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowApproveConfirm(false);
                  handleApprove();
                }}
                disabled={isNavigating}
                className="flex-1 py-2.5 px-4 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all"
                style={{
                  background: "linear-gradient(to right, #10b981, #059669)",
                }}
              >
                <Icon name="check" className="text-base" />
                Approve
              </button>
              <button
                type="button"
                onClick={() => setShowApproveConfirm(false)}
                className="px-4 py-2.5 rounded-xl border border-[#27272a] text-gray-400 hover:text-white text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex flex-col md:flex-1 md:overflow-hidden">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 md:px-6 md:pt-5 md:pb-4 shrink-0 border-b border-[#27272a]">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="text-[10px] font-bold text-gray-500 tracking-wider uppercase mb-0.5">
                Quality Assurance
              </p>
              <h1 className="text-xl md:text-2xl font-bold text-white">
                Peer Review
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {hasCritical && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
                  Critical Issues
                </span>
              )}
              {pendingRework.length > 0 && !hasCritical && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {pendingRework.length} Rework
                  {pendingRework.length > 1 ? "s" : ""} Pending
                </span>
              )}
              {pendingRework.length === 0 && checksRan && allPassed && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">
                  Ready to Approve
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col md:flex-row gap-3 px-4 md:px-6 pb-6 pt-4 md:flex-1 md:overflow-hidden">
          {/* Left panel: QA controls */}
          <div className="w-full md:w-[380px] md:shrink-0 flex flex-col gap-3 md:overflow-y-auto">
            {/* Compliance Checklist */}
            <div className="bg-[#18181b] border border-white/10 rounded-2xl overflow-hidden shrink-0">
              <ComplianceChecklist
                checks={checks}
                loading={checksLoading}
                onRerun={() => {
                  if (mixedAudioUrl && confirmedScript) {
                    setChecksRan(false);
                    runChecks(
                      mixedAudioUrl,
                      confirmedScript.estimatedDuration
                    );
                  }
                }}
                onProceedAnyway={
                  checksRan && !allPassed
                    ? () => setShowApproveConfirm(true)
                    : undefined
                }
              />
            </div>

            {/* Evaluator Decision — always visible when checks have run */}
            {checksRan && reviewState !== "approved" && (
              <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-4 shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <Icon
                    name="rate_review"
                    className="text-base text-[#a78bfa]"
                  />
                  <h3 className="text-sm font-bold text-white">
                    Evaluator Decision
                  </h3>
                </div>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowApproveConfirm(true)}
                    disabled={
                      (!allPassed && pendingRework.length > 0) || isNavigating
                    }
                    className="w-full py-2.5 px-4 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background:
                        allPassed && pendingRework.length === 0
                          ? "linear-gradient(to right, #10b981, #059669)"
                          : "#27272a",
                    }}
                  >
                    <Icon name="check_circle" className="text-base" />
                    Approve &amp; Proceed to Deployment
                  </button>
                  {reviewState !== "requesting_rework" && (
                    <button
                      type="button"
                      onClick={() => setReviewState("requesting_rework")}
                      className="w-full py-2.5 px-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-amber-400 text-sm font-bold flex items-center justify-center gap-2 transition-all hover:bg-amber-500/10"
                    >
                      <Icon name="edit_note" className="text-base" />
                      Request Rework
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Rework comment form */}
            {reviewState === "requesting_rework" && (
              <div className="bg-[#18181b] border border-amber-500/20 rounded-2xl p-4 shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <Icon
                    name="feedback"
                    className="text-base text-amber-400"
                  />
                  <h3 className="text-sm font-bold text-white">
                    Rework Feedback
                  </h3>
                </div>

                {/* Priority selector */}
                <div className="mb-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1.5">
                    Priority
                  </p>
                  <div className="flex gap-1.5">
                    {(
                      Object.entries(PRIORITY_CONFIG) as [
                        ReworkPriority,
                        (typeof PRIORITY_CONFIG)[ReworkPriority],
                      ][]
                    ).map(([key, config]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setReworkPriority(key)}
                        className={[
                          "flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all",
                          reworkPriority === key
                            ? `${config.bg} ${config.color} ${config.border}`
                            : "border-[#27272a] text-gray-600 hover:text-gray-400",
                        ].join(" ")}
                      >
                        {config.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category selector */}
                <div className="mb-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1.5">
                    Category
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {CATEGORY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setReworkCategory(opt.value)}
                        className={[
                          "py-1.5 px-2 rounded-lg text-[10px] font-medium border transition-all flex items-center justify-center gap-1",
                          reworkCategory === opt.value
                            ? "border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#a78bfa]"
                            : "border-[#27272a] text-gray-600 hover:text-gray-400",
                        ].join(" ")}
                      >
                        <Icon name={opt.icon} className="text-[10px]" />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <textarea
                  value={reworkComment}
                  onChange={(e) => setReworkComment(e.target.value)}
                  placeholder="Describe the improvements needed..."
                  rows={3}
                  className="w-full bg-[#131316] border border-[#27272a] rounded-xl px-3 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-amber-500/40 resize-none transition-colors"
                />
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleSubmitRework}
                    disabled={!reworkComment.trim()}
                    className="flex-1 py-2.5 px-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: reworkComment.trim()
                        ? "linear-gradient(135deg, #d97706, #f59e0b)"
                        : "#27272a",
                    }}
                  >
                    <Icon name="send" className="text-sm" />
                    Submit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReviewState("reviewing");
                      setReworkComment("");
                    }}
                    className="px-4 py-2.5 rounded-xl border border-[#27272a] text-gray-400 hover:text-white text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Rework Queue */}
            <div className="bg-[#18181b] border border-[#27272a] rounded-2xl overflow-hidden shrink-0">
              <div className="px-4 py-3 border-b border-[#27272a]">
                <div className="flex items-center gap-2 mb-2">
                  <Icon
                    name="assignment_return"
                    className="text-base text-amber-400"
                  />
                  <h3 className="text-sm font-bold text-white">
                    Rework Queue
                  </h3>
                  {reworkQueue.length > 0 && (
                    <span className="ml-auto text-[10px] font-bold text-gray-500">
                      {pendingRework.length} open &bull;{" "}
                      {resolvedRework.length} resolved
                    </span>
                  )}
                </div>
                {/* Filter tabs */}
                {reworkQueue.length > 0 && (
                  <div className="flex items-center gap-1">
                    {(["all", "pending", "resolved"] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setReworkFilter(f)}
                        className={[
                          "px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-colors",
                          reworkFilter === f
                            ? "bg-[#27272a] text-white"
                            : "text-gray-600 hover:text-gray-400",
                        ].join(" ")}
                      >
                        {f === "all"
                          ? `All (${reworkQueue.length})`
                          : f === "pending"
                            ? `Open (${pendingRework.length})`
                            : `Done (${resolvedRework.length})`}
                      </button>
                    ))}
                    {resolvedRework.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearResolved}
                        className="ml-auto text-[9px] text-gray-600 hover:text-red-400 transition-colors font-medium"
                        title="Clear resolved items"
                      >
                        Clear resolved
                      </button>
                    )}
                  </div>
                )}
              </div>
              {filteredQueue.length === 0 ? (
                <div className="px-4 py-5 text-center">
                  <Icon
                    name="inbox"
                    className="text-xl text-gray-700 mb-1.5"
                  />
                  <p className="text-xs text-gray-500 font-medium">
                    {reworkQueue.length === 0
                      ? "No rework requests yet"
                      : "No items match this filter"}
                  </p>
                  {reworkQueue.length === 0 && (
                    <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
                      Feedback submitted via &quot;Request Rework&quot; will
                      appear here.
                    </p>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-[#27272a]">
                  {filteredQueue.map((item) => {
                    const priorityConf = PRIORITY_CONFIG[item.priority];
                    const catOpt = CATEGORY_OPTIONS.find(
                      (c) => c.value === item.category
                    );
                    return (
                      <div key={item.id} className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={[
                              "w-2 h-2 rounded-full mt-1.5 shrink-0",
                              item.status === "resolved"
                                ? "bg-green-500"
                                : item.status === "in_progress"
                                  ? "bg-amber-500 animate-pulse"
                                  : priorityConf.dot,
                            ].join(" ")}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-300 leading-relaxed">
                              {item.comments}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span
                                className={[
                                  "text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                                  priorityConf.bg,
                                  priorityConf.color,
                                ].join(" ")}
                              >
                                {priorityConf.label}
                              </span>
                              {catOpt && (
                                <span className="text-[8px] font-medium text-gray-600 flex items-center gap-0.5">
                                  <Icon
                                    name={catOpt.icon}
                                    className="text-[8px]"
                                  />
                                  {catOpt.label}
                                </span>
                              )}
                              <span className="text-[8px] text-gray-600 font-mono">
                                {new Date(item.createdAt).toLocaleString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                              <span
                                className={[
                                  "text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                                  item.status === "resolved"
                                    ? "bg-green-500/10 text-green-400"
                                    : item.status === "in_progress"
                                      ? "bg-amber-500/10 text-amber-400"
                                      : "bg-red-500/10 text-red-400",
                                ].join(" ")}
                              >
                                {item.status === "resolved"
                                  ? "Resolved"
                                  : item.status === "in_progress"
                                    ? "In Progress"
                                    : "Pending"}
                              </span>
                            </div>
                            {item.resolvedAt && (
                              <p className="text-[8px] text-gray-600 font-mono mt-1">
                                Resolved{" "}
                                {new Date(item.resolvedAt).toLocaleString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </p>
                            )}
                          </div>
                          {item.status === "pending" && (
                            <button
                              type="button"
                              onClick={() => handleStartRework(item.id)}
                              className="shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold text-amber-400 border border-amber-500/20 hover:bg-amber-500/10 transition-colors"
                            >
                              Start
                            </button>
                          )}
                          {item.status === "in_progress" && (
                            <button
                              type="button"
                              onClick={() => handleResolveRework(item.id)}
                              className="shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold text-green-400 border border-green-500/20 hover:bg-green-500/10 transition-colors"
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Final Master + Ad Script + Review Notes */}
          <div className="flex-1 min-w-0 flex flex-col gap-3 md:overflow-y-auto">
            {/* Final Master player */}
            <div className="bg-[#18181b] border border-white/10 rounded-2xl overflow-hidden shrink-0">
              <PreviewPlayer
                src={mixedAudioUrl}
                businessName={businessName}
                duration={confirmedScript?.estimatedDuration}
              />
            </div>

            {/* Review Notes */}
            <div className="bg-[#18181b] border border-[#27272a] rounded-2xl overflow-hidden shrink-0">
              <button
                type="button"
                onClick={() => setShowReviewNotes(!showReviewNotes)}
                className="w-full px-4 py-3 md:px-5 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-[#27272a] flex items-center justify-center shrink-0">
                  <Icon name="sticky_note_2" className="text-sm text-white/60" />
                </div>
                <h3 className="text-sm font-bold text-white flex-1 text-left">
                  Review Notes
                </h3>
                {reviewNotes && (
                  <span className="text-[9px] text-gray-600 font-mono">
                    {reviewNotes.length} chars
                  </span>
                )}
                <svg
                  className={`w-3.5 h-3.5 text-gray-600 transition-transform duration-200 ${
                    showReviewNotes ? "rotate-180" : ""
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
              {showReviewNotes && (
                <div className="px-4 pb-4 md:px-5">
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add overall review notes, observations, or context for the approval decision..."
                    rows={4}
                    className="w-full bg-[#0f0f12] border border-[#27272a] rounded-xl px-3 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-[#8B5CF6]/40 resize-none transition-colors"
                  />
                  <p className="text-[10px] text-gray-600 mt-1.5">
                    Notes are saved automatically and will be attached to the
                    approval record.
                  </p>
                </div>
              )}
            </div>

            {/* Ad Script */}
            {confirmedScript && (
              <div className="flex-1 min-h-0 bg-[#18181b] border border-[#27272a] rounded-2xl overflow-hidden flex flex-col">
                <div className="px-4 py-3 md:px-5 md:py-3.5 border-b border-[#27272a] shrink-0 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#27272a] flex items-center justify-center shrink-0">
                    <Icon
                      name="article"
                      className="text-sm text-white/60"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white">
                      Ad Script
                    </h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mt-0.5">
                      {confirmedScript.tone} &bull;{" "}
                      {confirmedScript.estimatedDuration}
                    </p>
                  </div>
                  {confirmedScript.title && (
                    <span className="text-[10px] text-gray-500 font-medium truncate max-w-[160px] hidden sm:inline">
                      {confirmedScript.title}
                    </span>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-3 md:px-5 md:py-4">
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {confirmedScript.body}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
