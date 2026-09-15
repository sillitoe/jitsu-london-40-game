import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const sampleRate = 44100;
const bpm = 148;
const beatsPerBar = 4;
const bars = 12;
const secondsPerBeat = 60 / bpm;
const totalSeconds = bars * beatsPerBar * secondsPerBeat;
const totalSamples = Math.ceil(totalSeconds * sampleRate);
const left = new Float32Array(totalSamples);
const right = new Float32Array(totalSamples);

const root = 55;
const semitone = 2 ** (1 / 12);
const noteFreq = (midi) => 440 * 2 ** ((midi - 69) / 12);
const midi = (offset) => 45 + offset;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const square = (phase) => (Math.sin(phase) >= 0 ? 1 : -1);
const saw = (phase) => 2 * (phase / (Math.PI * 2) - Math.floor(phase / (Math.PI * 2) + 0.5));
const triangle = (phase) => 2 * Math.abs(2 * (phase / (Math.PI * 2) - Math.floor(phase / (Math.PI * 2) + 0.5))) - 1;

function envelope(t, duration, attack = 0.006, release = 0.055) {
  if (t < 0 || t > duration) return 0;
  if (t < attack) return t / attack;
  if (t > duration - release) return Math.max(0, (duration - t) / release);
  return 1;
}

function addTone({ beat, length, freq, volume, pan = 0, type = "square", detune = 0, attack, release }) {
  const start = Math.floor(beat * secondsPerBeat * sampleRate);
  const duration = length * secondsPerBeat;
  const count = Math.min(totalSamples - start, Math.floor(duration * sampleRate));
  const leftGain = Math.cos((pan + 1) * Math.PI / 4);
  const rightGain = Math.sin((pan + 1) * Math.PI / 4);

  for (let i = 0; i < count; i += 1) {
    const t = i / sampleRate;
    const env = envelope(t, duration, attack, release);
    const f = freq * (1 + detune);
    const phase = Math.PI * 2 * f * t;
    const wave = type === "saw" ? saw(phase) : type === "tri" ? triangle(phase) : square(phase);
    const bright = 0.58 * wave + 0.2 * square(phase * 2) + 0.12 * triangle(phase * 0.5);
    const sample = bright * env * volume;
    left[start + i] += sample * leftGain;
    right[start + i] += sample * rightGain;
  }
}

function addNoise({ beat, length, volume, pan = 0, tone = 0 }) {
  const start = Math.floor(beat * secondsPerBeat * sampleRate);
  const duration = length * secondsPerBeat;
  const count = Math.min(totalSamples - start, Math.floor(duration * sampleRate));
  const leftGain = Math.cos((pan + 1) * Math.PI / 4);
  const rightGain = Math.sin((pan + 1) * Math.PI / 4);
  let last = 0;

  for (let i = 0; i < count; i += 1) {
    const t = i / sampleRate;
    const decay = (1 - t / duration) ** 2.8;
    const noise = Math.random() * 2 - 1;
    last = last * tone + noise * (1 - tone);
    const sample = last * decay * volume;
    left[start + i] += sample * leftGain;
    right[start + i] += sample * rightGain;
  }
}

function addKick(beat) {
  const start = Math.floor(beat * secondsPerBeat * sampleRate);
  const duration = 0.16;
  const count = Math.min(totalSamples - start, Math.floor(duration * sampleRate));
  for (let i = 0; i < count; i += 1) {
    const t = i / sampleRate;
    const freq = 120 * (1 - t / duration) + 42;
    const sample = Math.sin(Math.PI * 2 * freq * t) * (1 - t / duration) ** 3 * 0.52;
    left[start + i] += sample;
    right[start + i] += sample;
  }
}

function addSnare(beat) {
  addNoise({ beat, length: 0.22, volume: 0.34, tone: 0.15 });
  addTone({ beat, length: 0.08, freq: 180, volume: 0.12, type: "tri", release: 0.06 });
}

function addHat(beat, accent = 1) {
  addNoise({ beat, length: 0.055, volume: 0.12 * accent, pan: 0.24, tone: 0.03 });
}

const chordProgression = [
  [0, 3, 7],
  [-2, 2, 7],
  [-5, 0, 3],
  [-4, 0, 5],
  [0, 3, 7],
  [2, 5, 9],
  [-2, 2, 7],
  [-7, -2, 2],
  [0, 3, 7],
  [-2, 2, 7],
  [-5, 0, 3],
  [-4, 0, 7],
];

const leadPattern = [12, 15, 19, 22, 19, 15, 17, 19, 22, 24, 22, 19, 17, 15, 12, 10];
const bassPattern = [0, 0, 7, 0, -2, -2, 5, -2];

for (let bar = 0; bar < bars; bar += 1) {
  const barBeat = bar * beatsPerBar;
  const chord = chordProgression[bar % chordProgression.length];

  chord.forEach((offset, index) => {
    addTone({
      beat: barBeat,
      length: 3.85,
      freq: noteFreq(midi(offset + 12)),
      volume: 0.05,
      pan: index === 0 ? -0.28 : index === 2 ? 0.28 : 0,
      type: "saw",
      detune: index === 1 ? 0.002 : -0.001,
      attack: 0.02,
      release: 0.16,
    });
  });

  for (let step = 0; step < 8; step += 1) {
    const beat = barBeat + step * 0.5;
    const octaveJump = step === 6 ? 12 : 0;
    addTone({
      beat,
      length: 0.35,
      freq: noteFreq(midi(bassPattern[(bar + step) % bassPattern.length] + octaveJump)),
      volume: 0.16,
      pan: -0.08,
      type: "square",
      release: 0.05,
    });
  }

  for (let step = 0; step < 16; step += 1) {
    const beat = barBeat + step * 0.25;
    const note = leadPattern[(bar * 3 + step) % leadPattern.length] + (bar > 7 ? 12 : 0);
    if (step % 4 !== 3 || bar % 2 === 1) {
      addTone({
        beat,
        length: step % 4 === 0 ? 0.33 : 0.19,
        freq: noteFreq(midi(note)),
        volume: step % 4 === 0 ? 0.12 : 0.08,
        pan: 0.18,
        type: step % 2 === 0 ? "square" : "tri",
        release: 0.035,
      });
    }
  }

  addKick(barBeat);
  addKick(barBeat + 2);
  addSnare(barBeat + 1);
  addSnare(barBeat + 3);
  for (let step = 0; step < 8; step += 1) {
    addHat(barBeat + step * 0.5, step % 2 === 0 ? 1.25 : 0.75);
  }
}

for (let i = 0; i < totalSamples; i += 1) {
  const fadeIn = clamp(i / (sampleRate * 0.035), 0, 1);
  const fadeOut = clamp((totalSamples - i) / (sampleRate * 0.05), 0, 1);
  const gain = fadeIn * fadeOut * 0.78;
  left[i] = Math.tanh(left[i] * 1.4) * gain;
  right[i] = Math.tanh(right[i] * 1.4) * gain;
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

const output = new URL("../public/audio/grading-panic-theme.wav", import.meta.url);
mkdirSync(dirname(output.pathname), { recursive: true });
writeFileSync(output, wavBuffer());
console.log(`Wrote ${output.pathname} (${totalSeconds.toFixed(2)}s, ${bpm} BPM)`);
