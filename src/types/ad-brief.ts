export type Tone = "professional" | "friendly" | "urgent" | "humorous" | "luxurious";
export type Duration = "15s" | "30s";

export interface AdBrief {
  businessName: string;
  offer: string;
  tone: Tone;
  targetAudience: string;
  duration: Duration;
  stationBrand: string;
  additionalNotes?: string;
  businessCategory?: string;
}

export interface ScriptVariant {
  id: string;
  title: string;
  body: string;
  wordCount: number;
  estimatedDuration: string;
  tone: string;
}
