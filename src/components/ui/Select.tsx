"use client";

import React from "react";
import Icon from "@/components/ui/Icon";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  error?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
  name?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export default function Select({
  label,
  error,
  options,
  value,
  onChange,
  placeholder,
  name,
  id,
  disabled = false,
  required = false,
  className = "",
}: SelectProps) {
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
      <div className="relative">
        <select
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={[
            "w-full bg-[#121212] border border-[#27272a] rounded-lg px-3 py-2.5 text-sm text-white",
            "focus:ring-1 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] outline-none appearance-none cursor-pointer transition-colors",
            disabled ? "opacity-50 cursor-not-allowed" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <Icon name="unfold_more" className="text-lg text-gray-500" />
        </div>
      </div>
      {error && <p className="text-xs text-[#ef4444]">{error}</p>}
    </div>
  );
}
