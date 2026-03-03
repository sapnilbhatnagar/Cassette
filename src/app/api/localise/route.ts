import { NextRequest, NextResponse } from "next/server";
import { anthropicClient } from "@/lib/api/anthropic";
import { REGIONS, type Region } from "@/constants/regions";
import { buildLocalisationPrompt } from "@/lib/localise/substitute";

interface LocalisedVariant {
  regionId: string;
  regionName: string;
  stationBrands: string[];
  localisedScript: string;
  error?: string;
}

interface RequestBody {
  baseScript: string;
  regionIds: string[];
}

/** Small delay between Claude calls to avoid rate-limit bursts. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function localiseForRegion(
  baseScript: string,
  region: Region
): Promise<LocalisedVariant> {
  const prompt = buildLocalisationPrompt(baseScript, region);

  const message = await anthropicClient.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const firstBlock = message.content[0];
  if (firstBlock.type !== "text") {
    throw new Error("Unexpected response type from Claude.");
  }

  const localisedScript = firstBlock.text.trim();

  return {
    regionId: region.id,
    regionName: region.regionName,
    stationBrands: region.stationBrands,
    localisedScript,
  };
}

export async function POST(request: NextRequest) {
  let body: Partial<RequestBody>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body." },
      { status: 400 }
    );
  }

  const { baseScript, regionIds } = body;

  if (!baseScript || typeof baseScript !== "string" || baseScript.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing required field: baseScript" },
      { status: 400 }
    );
  }

  if (!regionIds || !Array.isArray(regionIds) || regionIds.length === 0) {
    return NextResponse.json(
      { error: "Missing required field: regionIds (must be a non-empty array)" },
      { status: 400 }
    );
  }

  // Resolve region objects from IDs
  const regions: Region[] = regionIds
    .map((id) => REGIONS.find((r) => r.id === id))
    .filter((r): r is Region => r !== undefined);

  if (regions.length === 0) {
    return NextResponse.json(
      { error: "None of the provided regionIds matched known regions." },
      { status: 400 }
    );
  }

  const variants: LocalisedVariant[] = [];

  // Process sequentially to be polite to the Claude API
  for (let i = 0; i < regions.length; i++) {
    const region = regions[i];

    // Small delay between calls (skip before first call)
    if (i > 0) {
      await delay(400);
    }

    try {
      const variant = await localiseForRegion(baseScript.trim(), region);
      variants.push(variant);
    } catch (err) {
      console.error(`[localise] Failed for region ${region.id}:`, err);
      // Individual errors don't fail the whole batch
      variants.push({
        regionId: region.id,
        regionName: region.regionName,
        stationBrands: region.stationBrands,
        localisedScript: "",
        error: "Failed to localise script for this region. Please try again.",
      });
    }
  }

  return NextResponse.json({ variants });
}
