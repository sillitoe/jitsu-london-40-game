import type Phaser from "phaser";
import type { PromptInput } from "../types";

export function inputIconTexture(input: PromptInput): string {
  const textures: Record<PromptInput, string> = {
    LEFT: "inputLeft",
    DOWN: "inputDown",
    RIGHT: "inputRight",
    X: "inputX",
  };

  return textures[input];
}

export function createInputIconTextures(scene: Phaser.Scene): void {
  const inputs: PromptInput[] = [
    "LEFT",
    "DOWN",
    "RIGHT",
    "X",
  ];

  inputs.forEach((input) => {
    const key = inputIconTexture(input);
    if (scene.textures.exists(key)) {
      return;
    }

    const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(0x15202d, 0.9);
    graphics.lineStyle(2, 0x26394d, 0.95);
    graphics.fillRoundedRect(0, 0, 56, 48, 4);
    graphics.strokeRoundedRect(0, 0, 56, 48, 4);
    graphics.fillStyle(0xf2f4ff, 1);

    if (input === "X") {
      graphics.lineStyle(9, 0xf2f4ff, 1);
      graphics.beginPath();
      graphics.moveTo(17, 13);
      graphics.lineTo(39, 35);
      graphics.moveTo(39, 13);
      graphics.lineTo(17, 35);
      graphics.strokePath();
    } else {
      const points: Record<Exclude<PromptInput, "X">, number[]> = {
        LEFT: [14, 24, 30, 10, 30, 18, 43, 18, 43, 30, 30, 30, 30, 38],
        RIGHT: [42, 24, 26, 10, 26, 18, 13, 18, 13, 30, 26, 30, 26, 38],
        DOWN: [28, 39, 13, 23, 21, 23, 21, 9, 35, 9, 35, 23, 43, 23],
      };
      const polygon = points[input];
      graphics.beginPath();
      graphics.moveTo(polygon[0], polygon[1]);
      for (let index = 2; index < polygon.length; index += 2) {
        graphics.lineTo(polygon[index], polygon[index + 1]);
      }
      graphics.closePath();
      graphics.fillPath();
    }

    graphics.generateTexture(key, 56, 48);
    graphics.destroy();
  });
}
