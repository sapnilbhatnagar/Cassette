# Cassette — AI Audio Ad Production

> **From brief to broadcast in 5 minutes.**
> AI-powered radio ad production built for Bauer Media — demonstrating how generative AI can compress weeks of production into a single workflow.

---

## What it does

Cassette is a full-stack prototype that lets a marketer produce a broadcast-ready radio ad — script, voice, mix, QA, and regional localisation — entirely through a browser, without a studio or production team.

The workflow mirrors how a real radio ad is made, but every manual step is replaced with an AI-assisted equivalent:

| Traditional | Cassette |
|---|---|
| Brief → copywriter (days) | Brief → Claude API (seconds) |
| Casting session | ElevenLabs voice library |
| Studio recording + edits | One-click synthesis |
| Audio engineer mix session | Web Audio API real-time mixer |
| Legal/compliance review | Automated checks (duration, loudness) |
| Separate scripts per region | Claude localisation × 11 UK regions |

---

## Screens

1. **Intelligence Collection** — Campaign brief → Claude generates 4 script variants with tone switching and typewriter reveal
2. **Voice Selection** — ElevenLabs voice library filtered by tone/gender/accent, side-by-side tile layout
3. **Audio Mix Control** — Multi-track DAW-style timeline, live level controls, voice overlays, WAV/MP3 export
4. **Peer Review** — Compliance checklist + human evaluator approval loop with rework queue
5. **Station Distribution** — UK map with zoom/pan, region selector, reach/CPM stats, Claude-powered localisation per region
6. **Audio History** — IndexedDB-backed library of all generated audio with reload-to-workflow

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 |
| AI Script Generation | Anthropic Claude (`claude-opus-4-6`) |
| Voice Synthesis | ElevenLabs v1 TTS API |
| Audio Engine | Web Audio API — live `AudioContext` + `OfflineAudioContext` for WAV export |
| Localisation | Claude API with region-aware prompt engineering |
| Persistence | `localStorage` (session state) + IndexedDB (audio history) |

---

## Getting started

### Prerequisites

- Node.js 20+
- Anthropic API key
- ElevenLabs API key

### Install

```bash
cd voiceforge-app
npm install
```

### Environment

Create `.env.local`:

```env
ANTHROPIC_API_KEY=sk-ant-...
ELEVENLABS_API_KEY=...
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
```

---

## Project structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── page.tsx                # Landing / home
│   ├── script/page.tsx         # Intelligence Collection
│   ├── voice/page.tsx          # Voice Selection
│   ├── mix/page.tsx            # Audio Mix Control
│   ├── preview/page.tsx        # Peer Review
│   ├── localise/page.tsx       # Station Distribution
│   ├── history/page.tsx        # Audio History
│   └── api/
│       ├── generate-script/    # Claude script generation
│       ├── synthesize/         # ElevenLabs TTS
│       ├── localise/           # Claude region localisation
│       └── voice-preview/      # ElevenLabs preview proxy
│
├── components/
│   ├── ui/                     # Shared: Sidebar, Icon, Input, Select, Textarea, ErrorBanner
│   ├── script/                 # BriefForm, LiveScriptDraft, ScriptResults, ScriptCard, ScriptEditor
│   ├── voice/                  # VoiceSelector, VoiceCard, VoicePreviewPanel, AudioPlayer
│   ├── mix/                    # MusicBedSelector, MusicBedCard, MixControls, LiveMixPreview, MultiTrackTimeline
│   ├── preview/                # ComplianceChecklist, PreviewPlayer, Waveform, DownloadButton
│   └── localise/               # UKMap, RegionSelector, VariantList, VariantCard
│
├── constants/                  # voices, music-beds, regions, prompts, demo-brief, storage-keys
├── lib/
│   ├── api/                    # anthropic.ts, elevenlabs.ts
│   ├── audio/                  # realtime-mixer.ts, history-store.ts, compliance-checks.ts, match-music.ts
│   └── localise/               # substitute.ts
└── types/                      # ad-brief.ts
```

---

## Key design decisions

**Why Web Audio API instead of server-side ffmpeg?**
Browser-native audio processing means no server cost, no file uploads, and instant feedback. The `RealtimeMixer` class uses a live `AudioContext` for playback with real-time volume changes, switching to `OfflineAudioContext` only for WAV export — giving a true DAW-like experience without the infrastructure.

**Why Claude for both scripts and localisation?**
Script generation and localisation share the same prompt engineering pattern but serve different goals. Script generation explores creative space (4 variants × tone switching). Localisation is precision work — injecting regional references, station brands, and local idioms into a confirmed master script. Keeping them as separate API routes with different system prompts makes each task auditable and iterable.

**Why IndexedDB for audio history?**
Blob URLs are ephemeral — they die on page refresh. Storing `ArrayBuffer` in IndexedDB means generated audio survives session resets and can be restored to the workflow without re-generating.

**Why a 5-step linear sidebar?**
The sidebar stepper enforces the production workflow order (brief → voice → mix → QA → deploy), which is the same order a real radio production follows. It doubles as progress tracking for the evaluator during a demo.

---

## Context

Built as a pitch prototype for the **AI Product Manager** role at Bauer Media Group (March 2026). The product thesis: Bauer's 120+ UK stations share an audio ad production process that is largely manual, slow, and expensive. Cassette demonstrates what that process looks like when every step is AI-assisted, and what the product roadmap from prototype to production would require.

---

## Licence

Private prototype — not for distribution.
