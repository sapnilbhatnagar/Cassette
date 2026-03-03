import { MUSIC_BEDS } from "@/constants/music-beds";

const TONE_TO_MOODS: Record<string, string[]> = {
  professional: ["professional", "luxurious"],
  friendly: ["friendly", "humorous"],
  urgent: ["urgent", "professional"],
  humorous: ["humorous", "friendly"],
  luxurious: ["luxurious", "professional"],
};

/**
 * Returns up to 3 recommended music bed IDs based on ad tone.
 * Falls back to the first 3 beds if tone is not recognised.
 */
export function matchMusicToTone(tone: string): string[] {
  const moods = TONE_TO_MOODS[tone.toLowerCase()] ?? [];

  const matches = MUSIC_BEDS.filter((bed) => moods.includes(bed.mood));

  // Sort: primary mood first, then secondary
  const primary = matches.filter((bed) => bed.mood === moods[0]);
  const secondary = matches.filter((bed) => bed.mood === moods[1]);

  const ordered = [...primary, ...secondary];

  // Return top 3, falling back to first 3 beds if nothing matched
  return ordered.length > 0
    ? ordered.slice(0, 3).map((b) => b.id)
    : MUSIC_BEDS.slice(0, 3).map((b) => b.id);
}
