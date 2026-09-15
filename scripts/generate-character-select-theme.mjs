import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const sampleRate = 44100;
const bpm = 112;
const beatsPerBar = 4;
const bars = 8;
const secondsPerBeat = 60 / bpm;
const totalSeconds = bars * beatsPerBar * secondsPerBeat;
const totalSamples = Math.ceil(totalSeconds * sampleRate);
const left = new Float32Array(totalSamples);
const right = new Float32Array(totalSamples);

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const noteFreq = (midi) => 440 * 2 ** ((midi - 69) / 12);
const square = (phase) => (Math.sin(phase) >= 0 ? 1 : -1);
const sine = (phase) => Math.sin(phase);
const pulse = (phase) => (phase % (Math.PI * 2)) < Math.PI * 0.72 ? 1 : -1;
const pentatonic = [0, 2, 5, 7, 9, 12, 14, 17, 19, 21, 24];

function env(t, duration, attack = 0.01, release = 0.12) {
  if (t < 0 || t > duration) return 0;
  if (t < attack) return t / attack;
  if (t > duration - release) return Math.max(0, (duration - t) / release);
  return 1;
}

function addTone({ beat, length, midi, volume, pan = 0, shape = "pulse", attack = 0.01, release = 0.08, vibrato = 0 }) {
  const start = Math.floor(beat * secondsPerBeat * sampleRate);
  const duration = length * secondsPerBeat;
  const count = Math.min(totalSamples - start, Math.floor(duration * sampleRate));
  const leftGain = Math.cos((pan + 1) * Math.PI / 4);
  const rightGain = Math.sin((pan + 1) * Math.PI / 4);

  for (let i = 0; i < count; i += 1) {
    const t = i / sampleRate;
    const frequency = noteFreq(midi) * (1 + Math.sin(t * Math.PI * 2 * 5.5) * vibrato);
    const phase = Math.PI * 2 * frequency * t;
    const wave = shape === "bell"
      ? 0.8 * sine(phase) + 0.22 * sine(phase * 2.01) + 0.12 * sine(phase * 3.03)
      : shape === "square"
        ? square(phase) * 0.78 + square(phase * 2) * 0.12
        : pulse(phase) * 0.68 + sine(phase * 2) * 0.16;
    const sample = wave * env(t, duration, attack, release) * volume;
    left[start + i] += sample * leftGain;
    right[start + i] += sample * rightGain;
  }
}

function addNoise({ beat, length, volume, tone = 0.08, pan = 0 }) {
  const start = Math.floor(beat * secondsPerBeat * sampleRate);
  const duration = length * secondsPerBeat;
  const count = Math.min(totalSamples - start, Math.floor(duration * sampleRate));
  const leftGain = Math.cos((pan + 1) * Math.PI / 4);
  const rightGain = Math.sin((pan + 1) * Math.PI / 4);
  let last = 0;
  for (let i = 0; i < count; i += 1) {
    const t = i / sampleRate;
    last = last * tone + (Math.random() * 2 - 1) * (1 - tone);
    const sample = last * (1 - t / duration) ** 3 * volume;
    left[start + i] += sample * leftGain;
    right[start + i] += sample * rightGain;
  }
}

function addTaiko(beat, accent = 1) {
  addTone({ beat, length: 0.32, midi: 36, volume: 0.42 * accent, shape: "bell", release: 0.24 });
  addNoise({ beat, length: 0.08, volume: 0.18 * accent, tone: 0.18 });
}

const baseMidi = 57;
const melody = [0, 2, 3, 5, 7, 5, 3, 2, 0, 3, 5, 7, 9, 7, 5, 3];
const counter = [7, 5, 3, 2, 0, 2, 3, 5];

for (let bar = 0; bar < bars; bar += 1) {
  const b = bar * beatsPerBar;
  const root = bar % 4 === 2 ? -5 : bar % 4 === 3 ? -3 : 0;

  [0, 4, 7].forEach((offset, index) => {
    addTone({
      beat: b,
      length: 3.8,
      midi: baseMidi + root + pentatonic[Math.min(offset, pentatonic.length - 1)],
      volume: 0.08,
      pan: index === 0 ? -0.35 : index === 2 ? 0.35 : 0,
      shape: "bell",
      attack: 0.02,
      release: 0.42,
    });
  });

  for (let step = 0; step < 8; step += 1) {
    addTone({
      beat: b + step * 0.5,
      length: 0.38,
      midi: baseMidi - 24 + root + pentatonic[step % 3],
      volume: 0.18,
      pan: -0.08,
      shape: "square",
      release: 0.08,
    });
  }

  for (let step = 0; step < 16; step += 1) {
    const scaleIndex = melody[(bar + step) % melody.length];
    addTone({
      beat: b + step * 0.25,
      length: step % 4 === 0 ? 0.36 : 0.18,
      midi: baseMidi + 12 + root + pentatonic[scaleIndex % pentatonic.length],
      volume: step % 4 === 0 ? 0.15 : 0.1,
      pan: 0.22,
      shape: "pulse",
      release: 0.05,
      vibrato: 0.002,
    });
  }

  for (let step = 0; step < 8; step += 1) {
    addTone({
      beat: b + 0.25 + step * 0.5,
      length: 0.22,
      midi: baseMidi + 24 + root + pentatonic[counter[(bar + step) % counter.length] % pentatonic.length],
      volume: 0.055,
      pan: -0.28,
      shape: "bell",
      attack: 0.004,
      release: 0.18,
    });
  }

  addTaiko(b, 1.25);
  addTaiko(b + 2, 1);
  addNoise({ beat: b + 1, length: 0.18, volume: 0.22, tone: 0.04, pan: 0.15 });
  addNoise({ beat: b + 3, length: 0.18, volume: 0.24, tone: 0.04, pan: 0.15 });
}

for (let i = 0; i < totalSamples; i += 1) {
  const fadeIn = clamp(i / (sampleRate * 0.08), 0, 1);
  const fadeOut = clamp((totalSamples - i) / (sampleRate * 0.08), 0, 1);
  left[i] = Math.tanh(left[i] * 1.7) * fadeIn * fadeOut * 0.92;
  right[i] = Math.tanh(right[i] * 1.7) * fadeIn * fadeOut * 0.92;
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

const output = new URL("../public/audio/character-select-theme.wav", import.meta.url);
mkdirSync(dirname(output.pathname), { recursive: true });
writeFileSync(output, wavBuffer());
console.log(`Wrote ${output.pathname} (${totalSeconds.toFixed(2)}s, ${bpm} BPM)`);
