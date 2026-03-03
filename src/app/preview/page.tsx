"use client";

import React, { useState, useEffect, useCallback } from "react";
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
interface ReworkItem {
  id: string;
  createdAt: number;
  comments: string;
  status: "pending" | "in_progress" | "resolved";
  resolvedAt?: number;
}

const REWORK_KEY = "cassette_rework_queue";

function loadReworkQueue(): ReworkItem[] {
  try {
    const raw = localStorage.getItem(REWORK_KEY);
    return raw ? (JSON.parse(raw) as ReworkItem[]) : [];
  } catch { return []; }
}

function saveReworkQueue(queue: ReworkItem[]) {
  localStorage.setItem(REWORK_KEY, JSON.stringify(queue));
}

/* --------------- Loading spinner --------------- */
function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <svg className="animate-spin h-6 w-6 text-[#8B5CF6]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}

/* --------------- Approval states --------------- */
type ReviewState = "reviewing" | "requesting_rework" | "approved" | "deployed";

/* --------------- Page --------------- */
export default function PreviewPage() {
  const [loaded, setLoaded] = useState(false);
  const [confirmedScript, setConfirmedScript] = useState<ScriptVariant | null>(null);
  const [mixedAudioUrl, setMixedAudioUrl] = useState<string>("");

  // Compliance
  const [checks, setChecks] = useState<ComplianceCheck[]>([]);
  const [checksLoading, setChecksLoading] = useState(false);
  const [checksRan, setChecksRan] = useState(false);

  // Approval loop
  const [reviewState, setReviewState] = useState<ReviewState>("reviewing");
  const [reworkComment, setReworkComment] = useState("");
  const [reworkQueue, setReworkQueue] = useState<ReworkItem[]>([]);

  /* Load from localStorage */
  useEffect(() => {
    const rawScript = localStorage.getItem(STORAGE_KEYS.CONFIRMED_SCRIPT);
    if (rawScript) {
      try { setConfirmedScript(JSON.parse(rawScript) as ScriptVariant); } catch { /* malformed */ }
    }

    const validateAndLoad = async () => {
      const savedMix = localStorage.getItem(STORAGE_KEYS.GENERATED_MIX);
      if (savedMix && savedMix.startsWith("blob:")) {
        try {
          const res = await fetch(savedMix);
          res.body?.cancel();
          if (res.ok) setMixedAudioUrl(savedMix);
        } catch { /* stale */ }
      }
      setLoaded(true);
    };
    validateAndLoad();
    setReworkQueue(loadReworkQueue());
  }, []);

  /* Compliance checks */
  const runChecks = useCallback(async (audioUrl: string, expectedDuration: string) => {
    setChecksLoading(true);
    setChecksRan(false);
    try {
      const results = await runComplianceChecks({ audioUrl, expectedDuration });
      setChecks(results);
    } catch (err) {
      console.error("[PreviewPage] compliance check error:", err);
      setChecks([]);
    } finally {
      setChecksLoading(false);
      setChecksRan(true);
    }
  }, []);

  useEffect(() => {
    if (mixedAudioUrl && confirmedScript && !checksRan && !checksLoading) {
      runChecks(mixedAudioUrl, confirmedScript.estimatedDuration);
    }
  }, [mixedAudioUrl, confirmedScript, checksRan, checksLoading, runChecks]);

  /* Approve */
  const handleApprove = useCallback(() => {
    setReviewState("approved");
  }, []);

  const handleDeploy = useCallback(() => {
    setReviewState("deployed");
  }, []);

  /* Request rework */
  const handleSubmitRework = useCallback(() => {
    if (!reworkComment.trim()) return;
    const item: ReworkItem = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      comments: reworkComment.trim(),
      status: "pending",
    };
    const updated = [item, ...reworkQueue];
    setReworkQueue(updated);
    saveReworkQueue(updated);
    setReworkComment("");
    setReviewState("reviewing");
  }, [reworkComment, reworkQueue]);

  /* Mark rework item as resolved */
  const handleResolveRework = useCallback((id: string) => {
    const updated = reworkQueue.map(item =>
      item.id === id ? { ...item, status: "resolved" as const, resolvedAt: Date.now() } : item
    );
    setReworkQueue(updated);
    saveReworkQueue(updated);
  }, [reworkQueue]);

  const handleStartRework = useCallback((id: string) => {
    const updated = reworkQueue.map(item =>
      item.id === id ? { ...item, status: "in_progress" as const } : item
    );
    setReworkQueue(updated);
    saveReworkQueue(updated);
  }, [reworkQueue]);

  /* Loading gate */
  if (!loaded) return <main className="flex-1 overflow-hidden flex flex-col"><Spinner /></main>;

  /* No mixed audio fallback */
  if (!mixedAudioUrl) {
    return (
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="px-6 pt-6 pb-4 shrink-0">
          <h1 className="text-2xl font-bold text-white">Peer Review</h1>
          <p className="text-sm text-gray-500 mt-1">Mix your audio before running QA checks.</p>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="rounded-2xl border border-dashed border-[#27272a] p-12 text-center bg-[#18181b]">
            <div className="w-12 h-12 rounded-xl bg-[#27272a] flex items-center justify-center mx-auto mb-4">
              <Icon name="music_note" className="text-2xl text-gray-500" />
            </div>
            <p className="text-white font-medium mb-1">No mixed audio found</p>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              You need to mix your voice audio with a music bed before you can preview and run QA checks.
            </p>
            <Link href="/mix" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#7c3aed] text-white text-sm font-semibold transition-all hover:opacity-90">
              Go to Audio Mix
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const businessName = (confirmedScript as ScriptVariant & { businessName?: string })?.businessName;
  const allPassed = checks.length > 0 && checks.every((c) => c.passed);
  const pendingRework = reworkQueue.filter(r => r.status !== "resolved");

  return (
    <main className="flex-1 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 shrink-0 flex items-start justify-between gap-4 border-b border-[#27272a]">
        <div>
          <p className="text-xs font-bold text-gray-500 tracking-wider uppercase mb-1">Quality Assurance</p>
          <h1 className="text-2xl font-bold text-white">Peer Review</h1>
        </div>
        <div className="flex items-center gap-2">
          {reviewState === "approved" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Approved
            </span>
          )}
          {reviewState === "deployed" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Deployed
            </span>
          )}
          {pendingRework.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {pendingRework.length} Rework{pendingRework.length > 1 ? "s" : ""} Pending
            </span>
          )}
        </div>
      </div>

      {/* Main content — fixed-height side-by-side panels */}
      <div className="flex-1 overflow-hidden flex gap-5 px-6 pb-6 pt-4">

        {/* Left panel: QA controls — fixed width, internally scrollable */}
        <div className="w-[360px] shrink-0 flex flex-col gap-3 overflow-y-auto">

          {/* Compliance Checklist */}
          <div className="bg-[#18181b] border border-white/10 rounded-2xl overflow-hidden shrink-0">
            <ComplianceChecklist
              checks={checks}
              loading={checksLoading}
              onRerun={() => {
                if (mixedAudioUrl && confirmedScript) {
                  setChecksRan(false);
                  runChecks(mixedAudioUrl, confirmedScript.estimatedDuration);
                }
              }}
              onProceedAnyway={checksRan && !allPassed ? handleApprove : undefined}
            />
          </div>

          {/* Evaluator Decision */}
          {checksRan && reviewState === "reviewing" && (
            <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-4 shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <Icon name="rate_review" className="text-base text-[#a78bfa]" />
                <h3 className="text-sm font-bold text-white">Evaluator Decision</h3>
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={!allPassed}
                  className="w-full py-2.5 px-4 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: allPassed ? "linear-gradient(to right, #10b981, #059669)" : "#27272a" }}
                >
                  <Icon name="check_circle" className="text-base" />
                  Approve for Deployment
                </button>
                <button
                  type="button"
                  onClick={() => setReviewState("requesting_rework")}
                  className="w-full py-2.5 px-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-amber-400 text-sm font-bold flex items-center justify-center gap-2 transition-all hover:bg-amber-500/10"
                >
                  <Icon name="edit_note" className="text-base" />
                  Request Rework
                </button>
              </div>
            </div>
          )}

          {/* Rework comment form */}
          {reviewState === "requesting_rework" && (
            <div className="bg-[#18181b] border border-amber-500/20 rounded-2xl p-4 shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="feedback" className="text-base text-amber-400" />
                <h3 className="text-sm font-bold text-white">Rework Feedback</h3>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Describe the improvements needed. This will be added to the rework queue below.
              </p>
              <textarea
                value={reworkComment}
                onChange={(e) => setReworkComment(e.target.value)}
                placeholder="e.g. Voice level too low during intro, music overpowers at 0:12..."
                rows={3}
                className="w-full bg-[#131316] border border-[#27272a] rounded-xl px-3 py-2.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-amber-500/40 resize-none transition-colors"
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleSubmitRework}
                  disabled={!reworkComment.trim()}
                  className="flex-1 py-2.5 px-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: reworkComment.trim() ? "linear-gradient(135deg, #d97706, #f59e0b)" : "#27272a" }}
                >
                  <Icon name="send" className="text-sm" />
                  Submit
                </button>
                <button
                  type="button"
                  onClick={() => { setReviewState("reviewing"); setReworkComment(""); }}
                  className="px-4 py-2.5 rounded-xl border border-[#27272a] text-gray-400 hover:text-white text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Approved state */}
          {reviewState === "approved" && (
            <div className="bg-[#18181b] border border-green-500/20 rounded-2xl p-4 shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="verified" className="text-base text-green-400" />
                <h3 className="text-sm font-bold text-white">Approved for Deployment</h3>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                This audio has passed quality checks and received evaluator approval.
              </p>
              <button
                type="button"
                onClick={handleDeploy}
                className="w-full py-2.5 px-4 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all"
                style={{ background: "linear-gradient(to right, #3b82f6, #2563eb)" }}
              >
                <Icon name="rocket_launch" className="text-base" />
                Deploy to Broadcast
              </button>
            </div>
          )}

          {/* Deployed state */}
          {reviewState === "deployed" && (
            <div className="bg-[#18181b] border border-blue-500/20 rounded-2xl p-4 shrink-0 text-center">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
                <Icon name="check_circle" className="text-2xl text-blue-400" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">Successfully Deployed</h3>
              <p className="text-xs text-gray-500 mb-3">
                Your audio ad is now live across the selected broadcast network.
              </p>
              <Link href="/localise" className="inline-flex items-center gap-2 text-sm font-medium text-[#8B5CF6] hover:text-[#a78bfa] transition-colors">
                <Icon name="cell_tower" className="text-base" />
                Go to Station Distribution
              </Link>
            </div>
          )}

          {/* Rework Queue */}
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl overflow-hidden shrink-0">
            <div className="px-4 py-3 flex items-center gap-2 border-b border-[#27272a]">
              <Icon name="assignment_return" className="text-base text-amber-400" />
              <h3 className="text-sm font-bold text-white">Rework Queue</h3>
              {reworkQueue.length > 0 && (
                <span className="ml-auto text-[10px] font-bold text-gray-500">
                  {pendingRework.length} pending &bull; {reworkQueue.length - pendingRework.length} resolved
                </span>
              )}
            </div>
            {reworkQueue.length === 0 ? (
              <div className="px-4 py-5 text-center">
                <Icon name="inbox" className="text-xl text-gray-700 mb-1.5" />
                <p className="text-xs text-gray-500 font-medium">No rework requests yet</p>
                <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">
                  Feedback submitted via &quot;Request Rework&quot; will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#27272a]">
                {reworkQueue.map((item) => (
                  <div key={item.id} className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className={[
                        "w-2 h-2 rounded-full mt-1.5 shrink-0",
                        item.status === "resolved" ? "bg-green-500" : item.status === "in_progress" ? "bg-amber-500 animate-pulse" : "bg-red-500",
                      ].join(" ")} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-300 leading-relaxed">{item.comments}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[9px] text-gray-600 font-mono">
                            {new Date(item.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className={[
                            "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                            item.status === "resolved" ? "bg-green-500/10 text-green-400" : item.status === "in_progress" ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400",
                          ].join(" ")}>
                            {item.status === "resolved" ? "Resolved" : item.status === "in_progress" ? "In Progress" : "Pending"}
                          </span>
                        </div>
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
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right panel: Final Master + Ad Script — fills remaining space */}
        <div className="flex-1 min-w-0 flex flex-col gap-3 overflow-hidden">

          {/* Final Master player */}
          <div className="bg-[#18181b] border border-white/10 rounded-2xl overflow-hidden shrink-0">
            <PreviewPlayer
              src={mixedAudioUrl}
              businessName={businessName}
              duration={confirmedScript?.estimatedDuration}
            />
          </div>

          {/* Ad Script — expands to fill remaining vertical space */}
          {confirmedScript && (
            <div className="flex-1 min-h-0 bg-[#18181b] border border-[#27272a] rounded-2xl overflow-hidden flex flex-col">
              <div className="px-5 py-3.5 border-b border-[#27272a] shrink-0 flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#27272a] flex items-center justify-center shrink-0">
                  <Icon name="article" className="text-sm text-white/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white">Ad Script</h3>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mt-0.5">
                    {confirmedScript.tone} &bull; {confirmedScript.estimatedDuration}
                  </p>
                </div>
                {confirmedScript.title && (
                  <span className="text-[10px] text-gray-500 font-medium truncate max-w-[160px]">
                    {confirmedScript.title}
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {confirmedScript.body}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
