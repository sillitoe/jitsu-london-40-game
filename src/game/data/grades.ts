import type { Grade } from "../types";

export const grades: Array<{ id: Grade; label: string; beltColor: number; beltSprite: string }> = [
  { id: "white", label: "White", beltColor: 0xf8f8f1, beltSprite: "beltWhite" },
  { id: "yellow", label: "Yellow", beltColor: 0xf5d742, beltSprite: "beltYellow" },
  { id: "orange", label: "Orange", beltColor: 0xf28c28, beltSprite: "beltOrange" },
  { id: "green", label: "Green", beltColor: 0x2f9e44, beltSprite: "beltGreen" },
  { id: "purple", label: "Purple", beltColor: 0x7a4db3, beltSprite: "beltPurple" },
  { id: "lightBlue", label: "Light blue", beltColor: 0x67c7f0, beltSprite: "beltLightBlue" },
  { id: "darkBlue", label: "Dark blue", beltColor: 0x1e4f9c, beltSprite: "beltDarkBlue" },
  { id: "brown", label: "Brown", beltColor: 0x7b4b2a, beltSprite: "beltBrown" },
  { id: "black", label: "Black", beltColor: 0x111111, beltSprite: "beltBlack" },
];
