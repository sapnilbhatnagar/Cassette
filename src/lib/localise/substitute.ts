import type { Region } from "@/constants/regions";

/**
 * Builds a Claude prompt that localises a base ad script for a specific region.
 * Claude is asked to substitute place names/references with regionally appropriate
 * ones, while keeping structure, tone, word count (±5 words), and CTA intact.
 */
export function buildLocalisationPrompt(baseScript: string, region: Region): string {
  const localRefs = region.localReferences.join(", ");
  const stations = region.stationBrands.join(", ");

  return `You are an award-winning radio copywriter who specialises in hyper-local ad production for UK regional stations. You understand the cultural nuances, slang, landmarks, and listener expectations of every major UK market.

CONTEXT: You are adapting a national ad script for the ${region.regionName} market. The ad will broadcast on: ${stations}.

YOUR TASK:
Rewrite the base script so it sounds like it was written specifically for ${region.regionName} listeners, not like a generic national ad with a place name swapped in. Make it feel local, authentic, and warm.

HOW TO LOCALISE WELL:
- Weave in recognisable ${region.regionName} landmarks, streets, or cultural touchpoints where they fit naturally
- Match the conversational register that ${region.regionName} listeners expect from their local station
- If the script mentions a location or landmark, replace it with an equivalent that resonates locally
- Keep brand names, offers, prices, and URLs exactly as they are
- Small colloquial touches are welcome if they suit the tone (e.g. "pop down to" vs "visit")

AVAILABLE LOCAL REFERENCES for ${region.regionName}: ${localRefs}
(Use 1-3 of these naturally. Do not force all of them in.)

STRICT CONSTRAINTS:
1. Maintain the same overall structure, flow, and number of paragraphs
2. Preserve the original tone and energy level precisely
3. Word count must stay within ±5 words of the original (${baseScript.split(/\s+/).length} words)
4. Keep the call-to-action (CTA) intact or adapt it minimally
5. Do NOT add narration labels (Voice 1:, VO:, etc.) unless the original has them
6. Return ONLY the adapted script text. No commentary, no explanations, no metadata.

BASE SCRIPT:
${baseScript}

ADAPTED SCRIPT FOR ${region.regionName.toUpperCase()}:`;
}
