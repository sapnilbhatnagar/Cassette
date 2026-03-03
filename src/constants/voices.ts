export interface VoiceOption {
  voiceId: string;
  name: string;
  gender: "male" | "female";
  accent: string;
  tone: string;
  previewUrl: string;
}

export const VOICES: VoiceOption[] = [
  {
    voiceId: "21m00Tcm4TlvDq8ikWAM",
    name: "Rachel",
    gender: "female",
    accent: "American",
    tone: "Calm & Warm",
    previewUrl: "/api/voice-preview/21m00Tcm4TlvDq8ikWAM",
  },
  {
    voiceId: "29vD33N1CtxCmqQRPOHJ",
    name: "Drew",
    gender: "male",
    accent: "American",
    tone: "Confident",
    previewUrl: "/api/voice-preview/29vD33N1CtxCmqQRPOHJ",
  },
  {
    voiceId: "2EiwWnXFnvU5JabPnv8n",
    name: "Clyde",
    gender: "male",
    accent: "American",
    tone: "Deep & Strong",
    previewUrl: "/api/voice-preview/2EiwWnXFnvU5JabPnv8n",
  },
  {
    voiceId: "CYw3kZ02Hs0563khs1Fj",
    name: "Dave",
    gender: "male",
    accent: "British",
    tone: "Conversational",
    previewUrl: "/api/voice-preview/CYw3kZ02Hs0563khs1Fj",
  },
  {
    voiceId: "D38z5RcWu1voky8WS1ja",
    name: "Fin",
    gender: "male",
    accent: "Irish",
    tone: "Energetic",
    previewUrl: "/api/voice-preview/D38z5RcWu1voky8WS1ja",
  },
  {
    voiceId: "EXAVITQu4vr4xnSDxMaL",
    name: "Sarah",
    gender: "female",
    accent: "American",
    tone: "Soft & Friendly",
    previewUrl: "/api/voice-preview/EXAVITQu4vr4xnSDxMaL",
  },
  {
    voiceId: "FGY2WhTYpPnrIDTdsKH5",
    name: "Laura",
    gender: "female",
    accent: "American",
    tone: "Upbeat",
    previewUrl: "/api/voice-preview/FGY2WhTYpPnrIDTdsKH5",
  },
  {
    voiceId: "IKne3meq5aSn9XLyUdCD",
    name: "Charlie",
    gender: "male",
    accent: "Australian",
    tone: "Casual",
    previewUrl: "/api/voice-preview/IKne3meq5aSn9XLyUdCD",
  },
  {
    voiceId: "JBFqnCBsd6RMkjVDRZzb",
    name: "George",
    gender: "male",
    accent: "British",
    tone: "Warm & Authoritative",
    previewUrl: "/api/voice-preview/JBFqnCBsd6RMkjVDRZzb",
  },
  {
    voiceId: "pFZP5JQG7iQjIQuC4Bku",
    name: "Lily",
    gender: "female",
    accent: "British",
    tone: "Warm & Professional",
    previewUrl: "/api/voice-preview/pFZP5JQG7iQjIQuC4Bku",
  },
];

export const ACCENT_OPTIONS = [...new Set(VOICES.map((v) => v.accent))].sort();
