"use client";

import React from "react";

interface DownloadButtonProps {
  audioUrl: string;
  businessName?: string;
  duration?: string;
}

function buildFilename(businessName?: string, duration?: string): string {
  const today = new Date();
  const dateStr = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  // Sanitize businessName — keep only alphanumeric and hyphens
  const safeBusiness = businessName
    ? businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
    : "ad";

  // Sanitize duration
  const safeDuration = duration ? duration.replace(/[^0-9s]/g, "") : "30s";

  return `cassette-${safeBusiness}-${safeDuration}-${dateStr}.wav`;
}

export default function DownloadButton({
  audioUrl,
  businessName,
  duration,
}: DownloadButtonProps) {
  const filename = buildFilename(businessName, duration);

  return (
    <a
      href={audioUrl}
      download={filename}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#27272a] hover:bg-[#3f3f46] border border-[#3f3f46] hover:border-[#52525b] text-white text-sm font-medium transition-colors"
      aria-label={`Download audio as ${filename}`}
    >
      {/* Download icon */}
      <svg
        className="h-4 w-4 text-gray-500"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
      Download WAV
      <span className="text-xs text-gray-600 font-normal hidden sm:inline">
        {filename}
      </span>
    </a>
  );
}
