export type StepDirection = "LEFT" | "RIGHT";

const radians = (degrees: number): number => degrees * Math.PI / 180;
export const SWEEP_LIMIT = radians(58);

export function stepSweep(elapsedMs: number, roundIndex: number, direction: StepDirection) {
  const passes = roundIndex < 4 ? 3 : 2;
  const passMs = 1180 - roundIndex * 45;
  const duration = passes * passMs;
  const elapsed = Math.max(0, Math.min(duration, elapsedMs));
  const pass = Math.min(passes - 1, Math.floor(elapsed / passMs));
  const progress = (elapsed - pass * passMs) / passMs;
  const side = direction === "LEFT" ? -1 : 1;
  const heading = pass % 2 === 0 ? side : -side;
  const angle = heading * SWEEP_LIMIT * (2 * progress - 1);
  const target = side * radians(32);
  const halfWidth = radians(14 - roundIndex * 0.55 - 7 * elapsed / duration);
  const perfectHalfWidth = halfWidth * 0.28;
  const delta = Math.abs(angle - target);

  return {
    angle, target, halfWidth, perfectHalfWidth, pass, passes,
    started: elapsedMs >= 0,
    expired: elapsedMs >= duration,
    hit: delta <= halfWidth,
    perfect: delta <= perfectHalfWidth,
  };
}
