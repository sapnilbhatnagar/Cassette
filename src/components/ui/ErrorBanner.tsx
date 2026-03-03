"use client";

import Icon from "@/components/ui/Icon";

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
}

export default function ErrorBanner({ message, onDismiss, onRetry }: ErrorBannerProps) {
  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20"
      role="alert"
      aria-live="polite"
    >
      <Icon name="error" className="text-xl text-red-400 shrink-0 mt-0.5" filled />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-red-400">Error</p>
        <p className="text-sm text-red-300/80 mt-0.5 break-words">{message}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs font-medium text-red-400 hover:text-red-300 underline underline-offset-2 transition-colors"
            aria-label="Retry"
          >
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-400 hover:text-red-300 transition-colors"
            aria-label="Dismiss error"
          >
            <Icon name="close" className="text-lg" />
          </button>
        )}
      </div>
    </div>
  );
}
