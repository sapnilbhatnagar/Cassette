"use client";

import React, { useState } from "react";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Icon from "@/components/ui/Icon";
import type { AdBrief } from "@/types/ad-brief";

interface BriefFormProps {
  onSubmit: (brief: AdBrief) => void;
  loading?: boolean;
  initialValues?: Partial<AdBrief>;
  demoValues?: AdBrief;
}

const CATEGORY_OPTIONS = [
  { value: "retail", label: "Retail & E-commerce" },
  { value: "music", label: "Music & Entertainment" },
  { value: "food", label: "Food & Beverage" },
  { value: "realestate", label: "Real Estate & Property" },
  { value: "automotive", label: "Automotive" },
  { value: "tech", label: "Tech & SaaS" },
  { value: "health", label: "Health & Wellness" },
];

interface FormErrors {
  businessCategory?: string;
  targetAudience?: string;
  campaignMission?: string;
}

const DURATIONS = [
  { value: "15s", label: "15s", sub: "Quick Spot" },
  { value: "30s", label: "30s", sub: "Standard" },
] as const;

export default function BriefForm({
  onSubmit,
  loading = false,
  initialValues,
  demoValues,
}: BriefFormProps) {
  const [businessCategory, setBusinessCategory] = useState(
    initialValues?.businessCategory ?? ""
  );
  const [targetAudience, setTargetAudience] = useState(
    initialValues?.targetAudience ?? ""
  );
  const [campaignMission, setCampaignMission] = useState(
    initialValues?.offer ?? ""
  );
  const [duration, setDuration] = useState<"15s" | "30s">("30s");
  const [errors, setErrors] = useState<FormErrors>({});

  function loadDemo() {
    if (!demoValues) return;
    setBusinessCategory("food");
    setTargetAudience(demoValues.targetAudience);
    setCampaignMission(
      [demoValues.offer, demoValues.additionalNotes].filter(Boolean).join("\n\n")
    );
    setErrors({});
  }

  function validate(): boolean {
    const newErrors: FormErrors = {};
    if (!businessCategory) newErrors.businessCategory = "Select a business category.";
    if (!targetAudience.trim())
      newErrors.targetAudience = "Target audience is required.";
    if (!campaignMission.trim())
      newErrors.campaignMission = "Campaign mission is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    // Map the 3-tile form to the full AdBrief the API expects
    const categoryLabel =
      CATEGORY_OPTIONS.find((c) => c.value === businessCategory)?.label ??
      businessCategory;

    const brief: AdBrief = {
      businessName: categoryLabel,
      offer: campaignMission,
      tone: demoValues?.tone ?? "friendly",
      targetAudience,
      duration,
      stationBrand: demoValues?.stationBrand ?? "Greatest Hits Radio",
      additionalNotes: `Business Category: ${categoryLabel}`,
      businessCategory,
    };

    onSubmit(brief);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Demo loader - hidden button, triggered from parent */}
      {demoValues && (
        <button
          type="button"
          id="load-demo-btn"
          onClick={loadDemo}
          className="hidden"
          aria-hidden="true"
        />
      )}

      {/* Ad Duration — compact inline selector */}
      <div className="flex items-center gap-2">
        <Icon name="timer" className="text-sm text-gray-500" />
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Duration</span>
        <div className="flex items-center gap-1 ml-auto">
          {DURATIONS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDuration(d.value)}
              className={[
                "px-2.5 py-1 rounded-md text-[10px] font-bold transition-all",
                duration === d.value
                  ? "bg-[#8B5CF6]/15 text-[#a78bfa] border border-[#8B5CF6]/30"
                  : "text-gray-500 hover:text-gray-300 border border-transparent",
              ].join(" ")}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Business Category */}
      <Select
        label="Business Category"
        required
        options={CATEGORY_OPTIONS}
        placeholder="Select your industry..."
        value={businessCategory}
        onChange={(e) => {
          setBusinessCategory(e.target.value);
          if (errors.businessCategory)
            setErrors((prev) => ({ ...prev, businessCategory: undefined }));
        }}
        error={errors.businessCategory}
        name="businessCategory"
        disabled={loading}
      />

      {/* Target Audience */}
      <Input
        label="Target Audience"
        required
        placeholder="e.g. Foodies aged 25-45 in Greater Manchester"
        value={targetAudience}
        onChange={(e) => {
          setTargetAudience(e.target.value);
          if (errors.targetAudience)
            setErrors((prev) => ({ ...prev, targetAudience: undefined }));
        }}
        error={errors.targetAudience}
        name="targetAudience"
        disabled={loading}
      />

      {/* Campaign Mission & USP */}
      <Textarea
        label="Campaign Mission & USP"
        required
        placeholder="Describe your campaign goal, unique selling points, and any specific messaging..."
        value={campaignMission}
        onChange={(e) => {
          setCampaignMission(e.target.value);
          if (errors.campaignMission)
            setErrors((prev) => ({ ...prev, campaignMission: undefined }));
        }}
        error={errors.campaignMission}
        name="campaignMission"
        rows={4}
        disabled={loading}
      />

      {/* Generate Script button */}
      <button
        type="submit"
        disabled={loading}
        className={[
          "w-full py-3 px-6 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200",
          loading ? "opacity-50 cursor-not-allowed" : "hover:opacity-90",
        ].join(" ")}
        style={{ background: "linear-gradient(to right, #8B5CF6, #3b82f6)" }}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating Scripts...
          </>
        ) : (
          <>
            <Icon name="bolt" className="text-lg" />
            Generate Scripts
          </>
        )}
      </button>
    </form>
  );
}
