import { NextRequest, NextResponse } from "next/server";
import { elevenlabsClient } from "@/lib/api/elevenlabs";

async function streamToUint8Array(stream: AsyncIterable<Uint8Array>): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

interface VoiceSettings {
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

export async function POST(request: NextRequest) {
  let body: { scriptText?: string; voiceId?: string; voiceSettings?: VoiceSettings };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body." },
      { status: 400 }
    );
  }

  const { scriptText, voiceId, voiceSettings } = body;

  if (!scriptText || typeof scriptText !== "string" || scriptText.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing required field: scriptText" },
      { status: 400 }
    );
  }

  if (!voiceId || typeof voiceId !== "string" || voiceId.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing required field: voiceId" },
      { status: 400 }
    );
  }

  let audioData: Uint8Array;
  try {
    const audioStream = await elevenlabsClient.textToSpeech.convert(voiceId.trim(), {
      text: scriptText.trim(),
      model_id: "eleven_multilingual_v2",
      output_format: "mp3_44100_128",
      ...(voiceSettings && {
        voice_settings: {
          stability: voiceSettings.stability ?? 0.5,
          similarity_boost: voiceSettings.similarityBoost ?? 0.75,
          style: voiceSettings.style ?? 0.0,
          use_speaker_boost: voiceSettings.useSpeakerBoost ?? true,
        },
      }),
    });

    audioData = await streamToUint8Array(audioStream);
  } catch (err) {
    console.error("[synthesize] ElevenLabs API error:", err);
    // Surface a more actionable message based on common error codes
    const errStr = String(err);
    let message = "Failed to synthesize audio. Please try again.";
    if (errStr.includes("401") || errStr.includes("Unauthorized")) {
      message = "ElevenLabs API key is invalid or expired. Please update ELEVENLABS_API_KEY in .env.local and restart the server.";
    } else if (errStr.includes("429") || errStr.includes("rate")) {
      message = "ElevenLabs rate limit reached. Please wait a moment and try again.";
    } else if (errStr.includes("quota") || errStr.includes("402")) {
      message = "ElevenLabs quota exhausted. Please check your account usage.";
    } else if (errStr.includes("404")) {
      message = "Voice not found. The selected voice ID may no longer be available.";
    }
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return new Response(audioData.buffer as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": String(audioData.length),
      "Cache-Control": "no-store",
    },
  });
}
