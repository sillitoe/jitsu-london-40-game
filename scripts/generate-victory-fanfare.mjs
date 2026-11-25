import { writeFileSync } from "node:fs";

const sampleRate = 44100;
const samples = new Float32Array(sampleRate * 5);
const beatSeconds = 0.36;

function note(midi, beat, length, volume, brightness) {
  const frequency = 440 * 2 ** ((midi - 69) / 12);
  const start = Math.round(beat * beatSeconds * sampleRate);
  const duration = length * beatSeconds;

  for (let i = 0; i < duration * sampleRate && start + i < samples.length; i += 1) {
    const time = i / sampleRate;
    const envelope = Math.min(time / 0.014, 1, (duration - time) / 0.14);
    const phase = 2 * Math.PI * frequency * time;
    const tone = Math.sin(phase + brightness * Math.sin(phase * 2)) + 0.2 * Math.sin(phase * 3);
    samples[start + i] += tone * volume * envelope;
  }
}

// An ascending synth-brass call, followed by a dominant-to-tonic resolution.
const melody = [
  [60, 0, 0.85], [64, 1, 0.85], [67, 2, 0.85], [72, 3, 1.6],
  [69, 5, 0.85], [74, 6, 0.85], [77, 7, 0.85], [76, 8, 0.85],
  [79, 9, 3.8],
];
for (const [pitch, beat, length] of melody) {
  note(pitch, beat, length, 0.31, 1.08);
  note(pitch + 12, beat + 0.09, length, 0.045, 0.4);
}

const chords = [
  [0, 3, 36, [48, 55, 64]],
  [3, 2, 41, [53, 60, 69]],
  [5, 2, 38, [50, 57, 65]],
  [7, 2, 43, [55, 59, 65]],
  [9, 3.8, 36, [48, 55, 60, 64, 72]],
];
for (const [beat, length, bass, chord] of chords) {
  note(bass, beat, length, 0.19, 0.38);
  chord.forEach((pitch, index) => note(pitch, beat + index * 0.04, length, 0.072, 0.68));
}

const wav = Buffer.alloc(44 + samples.length * 2);
wav.write("RIFF", 0);
wav.writeUInt32LE(wav.length - 8, 4);
wav.write("WAVEfmt ", 8);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(sampleRate, 24);
wav.writeUInt32LE(sampleRate * 2, 28);
wav.writeUInt16LE(2, 32);
wav.writeUInt16LE(16, 34);
wav.write("data", 36);
wav.writeUInt32LE(samples.length * 2, 40);
samples.forEach((sample, index) => wav.writeInt16LE(Math.round(Math.tanh(sample) * 32767), 44 + index * 2));
writeFileSync(new URL("../public/audio/victory-fanfare.wav", import.meta.url), wav);
