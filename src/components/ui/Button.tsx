"use client";

import React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "gradient";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[#8B5CF6] hover:bg-[#7c3aed] text-white shadow-lg shadow-[#8B5CF6]/25",
  secondary:
    "bg-[#27272a] hover:bg-[#3f3f46] text-white border border-[#3a3a3a]",
  ghost:
    "bg-transparent hover:bg-white/5 text-gray-400 hover:text-white",
  gradient:
    "bg-gradient-to-r from-[#7c3aed] to-[#8a2be2] text-white shadow-lg shadow-[#8B5CF6]/30 hover:shadow-[#8B5CF6]/50",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-4 py-2 text-sm rounded-lg",
  lg: "px-6 py-3 text-base rounded-xl",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  children,
  onClick,
  type = "button",
  className = "",
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={[
        "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 cursor-pointer select-none",
        variantClasses[variant],
        sizeClasses[size],
        isDisabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4 shrink-0"
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
      )}
      {children}
    </button>
  );
}
