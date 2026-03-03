/**
 * Real-time audio mixer using live AudioContext.
 * Enables instant volume changes during playback.
 * Uses OfflineAudioContext only for final WAV export.
 */

export class RealtimeMixer {
  private ctx: AudioContext | null = null;
  private voiceBuffer: AudioBuffer | null = null;
  private voice2Buffer: AudioBuffer | null = null;
  private musicBuffer: AudioBuffer | null = null;
  private voiceSource: AudioBufferSourceNode | null = null;
  private voice2Source: AudioBufferSourceNode | null = null;
  private musicSource: AudioBufferSourceNode | null = null;
  private voiceGain: GainNode | null = null;
  private voice2Gain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private _playing = false;
  private _startTime = 0;
  private _pauseOffset = 0;
  private _lastVoiceVol = 1;
  private _lastMusicVol = 0.4;
  private _lastVoice2Vol = 0.8;

  get playing() {
    return this._playing;
  }

  get currentTime() {
    if (!this.ctx) return 0;
    if (this._playing) {
      return this.ctx.currentTime - this._startTime + this._pauseOffset;
    }
    return this._pauseOffset;
  }

  get duration() {
    if (!this.voiceBuffer) return 0;
    let d = this.voiceBuffer.duration;
    if (this.musicBuffer) {
      const tail = Math.min(2, this.musicBuffer.duration - this.voiceBuffer.duration);
      d += tail > 0 ? tail : 0;
    }
    return d;
  }

  private ensureContext(): AudioContext {
    if (!this.ctx || this.ctx.state === "closed") {
      this.ctx = new AudioContext();
    }
    return this.ctx;
  }

  async loadVoice(url: string): Promise<void> {
    const ctx = this.ensureContext();
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch voice audio: ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    this.voiceBuffer = await ctx.decodeAudioData(arrayBuffer);
  }

  async loadVoice2(url: string): Promise<void> {
    const ctx = this.ensureContext();
    try {
      const res = await fetch(url);
      if (!res.ok) { this.voice2Buffer = null; return; }
      const arrayBuffer = await res.arrayBuffer();
      this.voice2Buffer = await ctx.decodeAudioData(arrayBuffer);
    } catch {
      this.voice2Buffer = null;
    }
  }

  clearVoice2(): void {
    this.voice2Buffer = null;
  }

  async loadMusic(url: string): Promise<void> {
    const ctx = this.ensureContext();
    try {
      const res = await fetch(url);
      if (!res.ok) {
        this.musicBuffer = null;
        return;
      }
      const arrayBuffer = await res.arrayBuffer();
      this.musicBuffer = await ctx.decodeAudioData(arrayBuffer);
    } catch {
      this.musicBuffer = null;
    }
  }

  setVoiceVolume(v: number): void {
    if (this.voiceGain) {
      this.voiceGain.gain.setValueAtTime(v, this.ctx?.currentTime ?? 0);
    }
  }

  setVoice2Volume(v: number): void {
    if (this.voice2Gain) {
      this.voice2Gain.gain.setValueAtTime(v, this.ctx?.currentTime ?? 0);
    }
  }

  setMusicVolume(v: number): void {
    if (this.musicGain) {
      this.musicGain.gain.setValueAtTime(v, this.ctx?.currentTime ?? 0);
    }
  }

  get hasVoice2(): boolean {
    return !!this.voice2Buffer;
  }

  seekTo(time: number): void {
    const wasPlaying = this._playing;
    if (wasPlaying) this._stopSources();
    this._pauseOffset = Math.max(0, Math.min(time, this.duration));
    this._playing = false;
    if (wasPlaying) {
      this.play(this._lastVoiceVol, this._lastMusicVol, this._lastVoice2Vol);
    }
  }

  play(voiceVol = 1, musicVol = 0.4, voice2Vol = 0.8): void {
    if (this._playing || !this.voiceBuffer) return;
    const ctx = this.ensureContext();
    if (ctx.state === "suspended") ctx.resume();

    // Voice 1 chain
    this.voiceSource = ctx.createBufferSource();
    this.voiceSource.buffer = this.voiceBuffer;
    this.voiceGain = ctx.createGain();
    this.voiceGain.gain.setValueAtTime(voiceVol, ctx.currentTime);
    this.voiceSource.connect(this.voiceGain);
    this.voiceGain.connect(ctx.destination);

    // Voice 2 chain (optional)
    if (this.voice2Buffer) {
      this.voice2Source = ctx.createBufferSource();
      this.voice2Source.buffer = this.voice2Buffer;
      this.voice2Gain = ctx.createGain();
      this.voice2Gain.gain.setValueAtTime(voice2Vol, ctx.currentTime);
      this.voice2Source.connect(this.voice2Gain);
      this.voice2Gain.connect(ctx.destination);
    }

    // Music chain
    if (this.musicBuffer) {
      this.musicSource = ctx.createBufferSource();
      this.musicSource.buffer = this.musicBuffer;
      this.musicGain = ctx.createGain();
      this.musicGain.gain.setValueAtTime(musicVol, ctx.currentTime);
      this.musicSource.connect(this.musicGain);
      this.musicGain.connect(ctx.destination);
    }

    this._lastVoiceVol = voiceVol;
    this._lastMusicVol = musicVol;
    this._lastVoice2Vol = voice2Vol;

    const offset = this._pauseOffset;
    this._startTime = ctx.currentTime;
    this.voiceSource.start(0, offset);
    this.voice2Source?.start(0, offset);
    this.musicSource?.start(0, offset);

    this._playing = true;

    // Auto-stop when voice finishes
    this.voiceSource.onended = () => {
      if (this._playing) {
        this.stop();
      }
    };
  }

  pause(): void {
    if (!this._playing) return;
    this._pauseOffset = this.currentTime;
    this._stopSources();
    this._playing = false;
  }

  stop(): void {
    this._stopSources();
    this._playing = false;
    this._pauseOffset = 0;
    this._startTime = 0;
  }

  private _stopSources(): void {
    try { this.voiceSource?.stop(); } catch { /* already stopped */ }
    try { this.voice2Source?.stop(); } catch { /* already stopped */ }
    try { this.musicSource?.stop(); } catch { /* already stopped */ }
    this.voiceSource?.disconnect();
    this.voice2Source?.disconnect();
    this.musicSource?.disconnect();
    this.voiceGain?.disconnect();
    this.voice2Gain?.disconnect();
    this.musicGain?.disconnect();
    this.voiceSource = null;
    this.voice2Source = null;
    this.musicSource = null;
    this.voiceGain = null;
    this.voice2Gain = null;
    this.musicGain = null;
  }

  /** Export final mix as WAV blob using OfflineAudioContext */
  async exportMix(params: {
    voiceVolume: number;
    voice2Volume?: number;
    musicVolume: number;
    ducking: boolean;
  }): Promise<Blob> {
    if (!this.voiceBuffer) throw new Error("No voice buffer loaded");

    const sampleRate = this.voiceBuffer.sampleRate;
    const numChannels = Math.max(
      this.voiceBuffer.numberOfChannels,
      this.musicBuffer ? this.musicBuffer.numberOfChannels : 1
    );

    const outputDuration = this.duration;
    const offlineCtx = new OfflineAudioContext(
      numChannels,
      Math.ceil(outputDuration * sampleRate),
      sampleRate
    );

    const voiceSrc = offlineCtx.createBufferSource();
    voiceSrc.buffer = this.voiceBuffer;
    const vGain = offlineCtx.createGain();
    vGain.gain.value = params.voiceVolume;
    voiceSrc.connect(vGain);
    vGain.connect(offlineCtx.destination);
    voiceSrc.start(0);

    if (this.voice2Buffer) {
      const voice2Src = offlineCtx.createBufferSource();
      voice2Src.buffer = this.voice2Buffer;
      const v2Gain = offlineCtx.createGain();
      v2Gain.gain.value = params.voice2Volume ?? 0.8;
      voice2Src.connect(v2Gain);
      v2Gain.connect(offlineCtx.destination);
      voice2Src.start(0);
    }

    if (this.musicBuffer) {
      const musicSrc = offlineCtx.createBufferSource();
      musicSrc.buffer = this.musicBuffer;
      const mGain = offlineCtx.createGain();
      mGain.gain.value = params.ducking ? params.musicVolume * 0.4 : params.musicVolume;
      musicSrc.connect(mGain);
      mGain.connect(offlineCtx.destination);
      musicSrc.start(0);
    }

    const rendered = await offlineCtx.startRendering();
    return new Blob([encodeWav(rendered)], { type: "audio/wav" });
  }

  async dispose(): Promise<void> {
    this.stop();
    if (this.ctx && this.ctx.state !== "closed") {
      await this.ctx.close();
    }
    this.ctx = null;
    this.voiceBuffer = null;
    this.musicBuffer = null;
  }
}

// WAV encoder (same as web-mixer.ts)
function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function encodeWav(audioBuffer: AudioBuffer): ArrayBuffer {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const numSamples = audioBuffer.length;
  const bitsPerSample = 16;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataByteLength = numSamples * blockAlign;
  const headerByteLength = 44;
  const totalByteLength = headerByteLength + dataByteLength;

  const buffer = new ArrayBuffer(totalByteLength);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, totalByteLength - 8, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataByteLength, true);

  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(audioBuffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, Math.round(int16), true);
      offset += 2;
    }
  }

  return buffer;
}
