import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const sampleRate = 44100;
const totalSeconds = 3.2;
const totalSamples = Math.ceil(totalSeconds * sampleRate);
const left = new Float32Array(totalSamples);
const right = new Float32Array(totalSamples);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const noteFreq = (midi) => 440 * 2 ** ((midi - 69) / 12);
const saw = (phase) => 2 * (phase / (Math.PI * 2) - Math.floor(phase / (Math.PI * 2) + 0.5));
const square = (phase) => (Math.sin(phase) >= 0 ? 1 : -1);

function envelope(t, duration) {
  if (t < 0 || t > duration) return 0;
  const attack = 0.035;
  const release = 0.38;
  if (t < attack) return t / attack;
  if (t > duration - release) return Math.max(0, (duration - t) / release);
  return 1;
}

function addWah({ start, duration, midi, slide = -1.8, volume = 0.55, pan = 0 }) {
  const startSample = Math.floor(start * sampleRate);
  const count = Math.min(totalSamples - startSample, Math.floor(duration * sampleRate));
  const leftGain = Math.cos((pan + 1) * Math.PI / 4);
  const rightGain = Math.sin((pan + 1) * Math.PI / 4);

  for (let i = 0; i < count; i += 1) {
    const t = i / sampleRate;
    const progress = t / duration;
    const freq = noteFreq(midi + slide * progress);
    const phase = Math.PI * 2 * freq * t;
    const wah = 0.58 + Math.sin(progress * Math.PI * 2.4) * 0.34;
    const tone = saw(phase) * 0.48 + square(phase * 0.5) * 0.22 + Math.sin(phase * 2) * 0.12;
    const sample = tone * envelope(t, duration) * wah * volume;
    left[startSample + i] += sample * leftGain;
    right[startSample + i] += sample * rightGain;
  }
}

addWah({ start: 0.08, duration: 0.72, midi: 55, slide: -1.4, pan: -0.12 });
addWah({ start: 0.78, duration: 0.78, midi: 52, slide: -1.7, pan: 0.12 });
addWah({ start: 1.55, duration: 1.28, midi: 48, slide: -5.2, volume: 0.62, pan: 0 });

for (let i = 0; i < totalSamples; i += 1) {
  const fadeOut = clamp((totalSamples - i) / (sampleRate * 0.12), 0, 1);
  left[i] = Math.tanh(left[i] * 1.5) * fadeOut * 0.82;
  right[i] = Math.tanh(right[i] * 1.5) * fadeOut * 0.82;
}

function wavBuffer() {
  const bytesPerSample = 2;
  const channels = 2;
  const dataSize = totalSamples * channels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * bytesPerSample, 28);
  buffer.writeUInt16LE(channels * bytesPerSample, 32);
  buffer.writeUInt16LE(bytesPerSample * 8, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  let offset = 44;
  for (let i = 0; i < totalSamples; i += 1) {
    buffer.writeInt16LE(Math.round(clamp(left[i], -1, 1) * 32767), offset);
    buffer.writeInt16LE(Math.round(clamp(right[i], -1, 1) * 32767), offset + 2);
    offset += 4;
  }
  return buffer;
}

const output = new URL("../public/audio/game-over-sting.wav", import.meta.url);
mkdirSync(dirname(output.pathname), { recursive: true });
writeFileSync(output, wavBuffer());
console.log(`Wrote ${output.pathname} (${totalSeconds.toFixed(2)}s)`);
