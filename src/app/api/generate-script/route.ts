import { NextRequest, NextResponse } from "next/server";
import { anthropicClient } from "@/lib/api/anthropic";
import {
  SCRIPT_GENERATION_SYSTEM_PROMPT,
  buildScriptUserMessage,
} from "@/constants/prompts";
import type { AdBrief, ScriptVariant } from "@/types/ad-brief";

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function extractJSON(text: string): string {
  // Strip markdown code fences if present
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }
  // Otherwise assume the whole text is JSON
  return text.trim();
}

export async function POST(request: NextRequest) {
  let body: Partial<AdBrief>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body." },
      { status: 400 }
    );
  }

  // Validate required fields
  const required: (keyof AdBrief)[] = [
    "businessName",
    "offer",
    "tone",
    "targetAudience",
    "duration",
    "stationBrand",
  ];

  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json(
        { error: `Missing required field: ${field}` },
        { status: 400 }
      );
    }
  }

  const brief = body as AdBrief;

  let rawContent: string;
  try {
    const message = await anthropicClient.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: SCRIPT_GENERATION_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildScriptUserMessage(brief),
        },
      ],
    });

    const firstBlock = message.content[0];
    if (firstBlock.type !== "text") {
      throw new Error("Unexpected response type from Claude.");
    }
    rawContent = firstBlock.text;
  } catch (err) {
    console.error("[generate-script] Claude API error:", err);
    return NextResponse.json(
      {
        error:
          "Failed to generate scripts. The AI service is temporarily unavailable. Please try again.",
      },
      { status: 502 }
    );
  }

  let parsed: unknown;
  try {
    const jsonString = extractJSON(rawContent);
    parsed = JSON.parse(jsonString);
  } catch (err) {
    console.error("[generate-script] JSON parse error. Raw content:", rawContent, err);
    return NextResponse.json(
      {
        error:
          "The AI returned an unexpected format. Please try again.",
      },
      { status: 502 }
    );
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    return NextResponse.json(
      { error: "The AI did not return any script variants. Please try again." },
      { status: 502 }
    );
  }

  // Attach generated IDs and ensure all fields are present
  const variants: ScriptVariant[] = (parsed as Array<Record<string, unknown>>).map(
    (item) => ({
      id: generateId(),
      title: String(item.title ?? "Untitled"),
      body: String(item.body ?? ""),
      wordCount: typeof item.wordCount === "number" ? item.wordCount : String(item.body ?? "").split(/\s+/).filter(Boolean).length,
      estimatedDuration: String(item.estimatedDuration ?? brief.duration),
      tone: String(item.tone ?? brief.tone),
    })
  );

  return NextResponse.json({ variants });
}
