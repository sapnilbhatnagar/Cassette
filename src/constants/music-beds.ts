export interface MusicBed {
  id: string;
  name: string;
  filename: string;
  mood: string;
  genre: string;
  bpm: number;
  durationSeconds: number;
}

export const MUSIC_BEDS: MusicBed[] = [
  {
    id: "mb-1",
    name: "Corporate Uplift",
    filename: "corporate-uplift.mp3",
    mood: "professional",
    genre: "corporate",
    bpm: 120,
    durationSeconds: 30,
  },
  {
    id: "mb-2",
    name: "Feel Good Pop",
    filename: "feel-good-pop.mp3",
    mood: "friendly",
    genre: "pop",
    bpm: 128,
    durationSeconds: 30,
  },
  {
    id: "mb-3",
    name: "Breaking News Energy",
    filename: "breaking-news.mp3",
    mood: "urgent",
    genre: "electronic",
    bpm: 140,
    durationSeconds: 30,
  },
  {
    id: "mb-4",
    name: "Comedy Bounce",
    filename: "comedy-bounce.mp3",
    mood: "humorous",
    genre: "quirky",
    bpm: 115,
    durationSeconds: 30,
  },
  {
    id: "mb-5",
    name: "Elegant Piano",
    filename: "elegant-piano.mp3",
    mood: "luxurious",
    genre: "classical",
    bpm: 72,
    durationSeconds: 45,
  },
  {
    id: "mb-6",
    name: "Indie Acoustic",
    filename: "indie-acoustic.mp3",
    mood: "friendly",
    genre: "acoustic",
    bpm: 100,
    durationSeconds: 30,
  },
  {
    id: "mb-7",
    name: "Cinematic Drama",
    filename: "cinematic-drama.mp3",
    mood: "professional",
    genre: "cinematic",
    bpm: 90,
    durationSeconds: 45,
  },
  {
    id: "mb-8",
    name: "Urban Groove",
    filename: "urban-groove.mp3",
    mood: "friendly",
    genre: "hip-hop",
    bpm: 95,
    durationSeconds: 30,
  },
  {
    id: "mb-9",
    name: "Retro Synth",
    filename: "retro-synth.mp3",
    mood: "humorous",
    genre: "synthwave",
    bpm: 118,
    durationSeconds: 30,
  },
  {
    id: "mb-10",
    name: "Smooth Jazz",
    filename: "smooth-jazz.mp3",
    mood: "luxurious",
    genre: "jazz",
    bpm: 80,
    durationSeconds: 45,
  },
];

export const MOOD_OPTIONS = [
  "all",
  "professional",
  "friendly",
  "urgent",
  "humorous",
  "luxurious",
] as const;

export type MoodOption = (typeof MOOD_OPTIONS)[number];
