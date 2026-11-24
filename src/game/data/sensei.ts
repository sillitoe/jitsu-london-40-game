import type { PlayableSenseiId } from "../types";

export const senseiRoster = {
  marianne: { name: "MARIANNE", rank: "BROWN BELT", height: 266, flipPortrait: false },
  garvey: { name: "GARVEY", rank: "4TH DAN", height: 311, flipPortrait: true },
  ian: { name: "IAN", rank: "4TH DAN", height: 282, flipPortrait: false },
  shep: { name: "SHEP", rank: "5TH DAN", height: 282, flipPortrait: false },
  oliur: { name: "OLIUR", rank: "1ST DAN (SP)", height: 266, flipPortrait: false },
} satisfies Record<PlayableSenseiId, { name: string; rank: string; height: number; flipPortrait: boolean }>;

export function senseiTexture(id: PlayableSenseiId, kind: "portrait" | "sensei"): string {
  return kind + id.charAt(0).toUpperCase() + id.slice(1);
}
