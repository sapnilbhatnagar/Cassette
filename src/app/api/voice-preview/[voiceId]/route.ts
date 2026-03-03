import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ voiceId: string }> }
): Promise<NextResponse> {
  const { voiceId } = await params;

  if (!voiceId || !/^[a-zA-Z0-9]{10,30}$/.test(voiceId)) {
    return NextResponse.json({ error: "Invalid voice ID" }, { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ElevenLabs API key not configured" }, { status: 503 });
  }

  try {
    // Fetch voice info to get the preview_url (a public CDN link)
    const infoRes = await fetch(
      `https://api.elevenlabs.io/v1/voices/${voiceId}`,
      { headers: { "xi-api-key": apiKey } }
    );

    if (!infoRes.ok) {
      return NextResponse.json(
        { error: `ElevenLabs returned ${infoRes.status}` },
        { status: infoRes.status }
      );
    }

    const info = await infoRes.json() as { preview_url?: string };
    const previewUrl = info.preview_url;

    if (!previewUrl) {
      return NextResponse.json({ error: "No preview available for this voice" }, { status: 404 });
    }

    // Fetch the actual audio from the CDN and proxy it
    const audioRes = await fetch(previewUrl);
    if (!audioRes.ok) {
      return NextResponse.json({ error: "Preview audio unavailable" }, { status: 502 });
    }

    const audioBuffer = await audioRes.arrayBuffer();
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": audioRes.headers.get("Content-Type") ?? "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    console.error("[voice-preview]", err);
    return NextResponse.json({ error: "Preview fetch failed" }, { status: 502 });
  }
}
