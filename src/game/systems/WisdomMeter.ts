import type { TimingJudgement } from "../types";

export class WisdomMeter {
  private value = 0;

  get current(): number {
    return this.value;
  }

  get isReady(): boolean {
    return this.value >= 100;
  }

  addForJudgement(judgement: TimingJudgement): void {
    const gainByJudgement: Record<TimingJudgement, number> = {
      PERFECT: 8,
      GOOD: 4,
      LATE: 1,
      MISS: 0,
    };

    this.value = Math.min(100, this.value + gainByJudgement[judgement]);
  }

  spend(): boolean {
    if (!this.isReady) {
      return false;
    }

    this.value = 0;
    return true;
  }

  reset(): void {
    this.value = 0;
  }
}
