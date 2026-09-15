import type { BeatPrompt, PromptInput, RhythmWindow, TimingJudgement } from "../types";

export class RhythmJudge {
  private readonly window: RhythmWindow;

  constructor(window: RhythmWindow = { perfectMs: 80, goodMs: 160, lateMs: 260 }) {
    this.window = window;
  }

  judge(
    prompt: BeatPrompt,
    actualInput: PromptInput,
    elapsedMs: number,
    overrideWindow?: RhythmWindow,
  ): TimingJudgement {
    if (prompt.input !== actualInput) {
      return "MISS";
    }

    const window = overrideWindow ?? this.window;
    const delta = Math.abs(elapsedMs - prompt.atMs);

    if (delta <= window.perfectMs) {
      return "PERFECT";
    }

    if (delta <= window.goodMs) {
      return "GOOD";
    }

    if (elapsedMs > prompt.atMs && delta <= window.lateMs) {
      return "LATE";
    }

    return "MISS";
  }
}
