import { ElevenLabsClient } from "elevenlabs";

let _client: ElevenLabsClient | null = null;

export function getElevenLabsClient(): ElevenLabsClient {
  if (!_client) {
    _client = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "",
    });
  }
  return _client;
}

// Keep named export for backward compatibility
export const elevenlabsClient = new Proxy({} as ElevenLabsClient, {
  get(_target, prop) {
    return getElevenLabsClient()[prop as keyof ElevenLabsClient];
  },
});
