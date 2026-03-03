"use client";

import React from "react";

interface TextareaProps {
  label?: string;
  error?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  name?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export default function Textarea({
  label,
  error,
  placeholder,
  value,
  onChange,
  rows = 4,
  name,
  id,
  disabled = false,
  required = false,
  className = "",
}: TextareaProps) {
  const inputId = id ?? name;

  return (
    <div className={["flex flex-col gap-1.5", className].filter(Boolean).join(" ")}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs text-gray-500 font-medium"
        >
          {label}
          {required && <span className="text-[#ef4444] ml-1">*</span>}
        </label>
      )}
      <textarea
        id={inputId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        required={required}
        className={[
          "w-full bg-[#121212] border border-[#27272a] rounded-lg px-3 py-2.5 text-sm text-white",
          "placeholder:text-gray-600 focus:ring-1 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] outline-none resize-y transition-colors",
          disabled ? "opacity-50 cursor-not-allowed" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      />
      {error && <p className="text-xs text-[#ef4444]">{error}</p>}
    </div>
  );
}
