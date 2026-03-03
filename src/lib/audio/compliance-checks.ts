export interface ComplianceCheck {
  check: string;
  passed: boolean;
  value: string;
  expected: string;
}

/**
 * Parse the numeric seconds target from an estimatedDuration string like "15s", "30s", "60s".
 * Falls back to 30 if unparseable.
 */
function parseDurationTarget(expectedDuration: string): number {
  const match = expectedDuration.match(/(\d+)/);
  if (!match) return 30;
  return parseInt(match[1], 10);
}

/**
 * Calculate RMS amplitude from a Float32Array of audio samples.
 * Returns a value 0..1.
 */
function calculateRMS(samples: Float32Array): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i];
  }
  return Math.sqrt(sum / samples.length);
}

/**
 * Convert a linear amplitude (0..1) to dBFS.
 */
function linearToDb(linear: number): number {
  if (linear <= 0) return -Infinity;
  return 20 * Math.log10(linear);
}

/**
 * Run automated compliance checks on an audio file in the browser.
 * Uses the Web Audio API to decode and inspect the audio buffer.
 */
export async function runComplianceChecks(params: {
  audioUrl: string;
  expectedDuration: string; // "15s" | "30s" | "60s"
}): Promise<ComplianceCheck[]> {
  const { audioUrl, expectedDuration } = params;
  const targetSeconds = parseDurationTarget(expectedDuration);

  // --- Fetch and decode the audio ---
  let audioBuffer: AudioBuffer | null = null;
  let fetchError: string | null = null;

  try {
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const ctx = new AudioContext();
    audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    await ctx.close();
  } catch (err) {
    fetchError = err instanceof Error ? err.message : "Unknown error";
  }

  const checks: ComplianceCheck[] = [];

  // --- 1. Format check (file availability) ---
  checks.push({
    check: "File Available",
    passed: audioBuffer !== null,
    value: audioBuffer !== null ? "Audio decoded successfully" : `Error: ${fetchError ?? "Unknown"}`,
    expected: "Audio file accessible and decodable",
  });

  if (!audioBuffer) {
    // Without a buffer we can still report the other checks as failed
    checks.push({
      check: "Duration",
      passed: false,
      value: "N/A",
      expected: `${targetSeconds}s (±1s)`,
    });
    checks.push({
      check: "Sample Rate",
      passed: false,
      value: "N/A",
      expected: "44,100 or 48,000 Hz",
    });
    checks.push({
      check: "Channels",
      passed: false,
      value: "N/A",
      expected: "Mono (1) or Stereo (2)",
    });
    checks.push({
      check: "Peak Level",
      passed: false,
      value: "N/A",
      expected: "< 0 dBFS (no clipping)",
    });
    checks.push({
      check: "Approx. Loudness",
      passed: false,
      value: "N/A",
      expected: "-30 to -6 dBFS RMS",
    });
    return checks;
  }

  // --- 2. Duration check ---
  const actualDuration = audioBuffer.duration;
  const durationDiff = Math.abs(actualDuration - targetSeconds);
  // TTS duration is variable — allow ±15s tolerance (TTS at natural pace varies significantly)
  const durationPassed = durationDiff <= 15.0;
  checks.push({
    check: "Duration",
    passed: durationPassed,
    value: `${actualDuration.toFixed(1)}s`,
    expected: `${targetSeconds}s (±15s)`,
  });

  // --- 3. Sample rate check ---
  // Browsers may resample audio to their native rate (44100 or 48000 Hz)
  const sampleRate = audioBuffer.sampleRate;
  const sampleRatePassed = sampleRate === 44100 || sampleRate === 48000;
  checks.push({
    check: "Sample Rate",
    passed: sampleRatePassed,
    value: `${sampleRate.toLocaleString()} Hz`,
    expected: "44,100 or 48,000 Hz",
  });

  // --- 4. Channels check ---
  const channels = audioBuffer.numberOfChannels;
  const channelsPassed = channels === 1 || channels === 2;
  const channelLabel = channels === 1 ? "Mono" : channels === 2 ? "Stereo" : `${channels} ch`;
  checks.push({
    check: "Channels",
    passed: channelsPassed,
    value: channelLabel,
    expected: "Mono (1) or Stereo (2)",
  });

  // --- 5. Peak level check (no clipping) ---
  // Gather all channel data and find absolute peak
  let peakAmplitude = 0;
  for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
    const channelData = audioBuffer.getChannelData(c);
    for (let i = 0; i < channelData.length; i++) {
      const abs = Math.abs(channelData[i]);
      if (abs > peakAmplitude) peakAmplitude = abs;
    }
  }
  const peakDb = linearToDb(peakAmplitude);
  const peakPassed = peakAmplitude < 1.0; // strictly below 0 dBFS
  checks.push({
    check: "Peak Level",
    passed: peakPassed,
    value: `${peakDb.toFixed(1)} dBFS`,
    expected: "< 0 dBFS (no clipping)",
  });

  // --- 6. Approximate loudness (RMS) ---
  // Average RMS across all channels
  let totalRms = 0;
  for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
    totalRms += calculateRMS(audioBuffer.getChannelData(c));
  }
  const avgRms = totalRms / audioBuffer.numberOfChannels;
  const rmsDb = linearToDb(avgRms);
  // Reasonable loudness range: -30 to -6 dBFS RMS (broadcast-safe, accommodates voice-only mixes)
  const loudnessPassed = isFinite(rmsDb) && rmsDb >= -30 && rmsDb <= -6;
  checks.push({
    check: "Approx. Loudness",
    passed: loudnessPassed,
    value: isFinite(rmsDb) ? `${rmsDb.toFixed(1)} dBFS RMS` : "Silent",
    expected: "-30 to -6 dBFS RMS",
  });

  return checks;
}
