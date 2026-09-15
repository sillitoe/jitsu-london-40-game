import Phaser from "phaser";

export interface CharacterStyle {
  skin: number;
  hair: number;
  belt: number;
  badgeFill: number;
  badgeText: number;
  bodyScale?: number;
}

export type CharacterFacing = "front" | "back";

export function drawStudent(
  scene: Phaser.Scene,
  x: number,
  y: number,
  style: CharacterStyle,
  facing: CharacterFacing = "back",
): Phaser.GameObjects.Container {
  return drawGiCharacter(scene, x, y, style, false, facing);
}

export function drawInstructor(
  scene: Phaser.Scene,
  x: number,
  y: number,
  style: CharacterStyle,
  facing: CharacterFacing = "front",
): Phaser.GameObjects.Container {
  return drawGiCharacter(scene, x, y, style, true, facing);
}

export function drawExaminer(
  scene: Phaser.Scene,
  x: number,
  y: number,
  name: string,
  style: CharacterStyle,
): Phaser.GameObjects.Container {
  const character = drawGiCharacter(scene, x, y, style, true, "front");
  const label = scene.add
    .text(0, 62, name, { color: "#f5f2eb", fontSize: "16px" })
    .setOrigin(0.5);
  character.add(label);
  return character;
}

function drawGiCharacter(
  scene: Phaser.Scene,
  x: number,
  y: number,
  style: CharacterStyle,
  hasBlackWaistcoat: boolean,
  facing: CharacterFacing,
): Phaser.GameObjects.Container {
  const scale = style.bodyScale ?? 1;
  const container = scene.add.container(x, y).setScale(scale);

  const body = scene.add.rectangle(0, 10, 46, 72, 0xf4f1ea);
  const leftArm = scene.add.rectangle(-34, 8, 18, 58, 0xf4f1ea);
  const rightArm = scene.add.rectangle(34, 8, 18, 58, 0xf4f1ea);
  const head = scene.add.circle(0, -42, 21, style.skin);
  const hair = scene.add.arc(0, -50, 22, 180, 360, false, style.hair);
  const belt = scene.add.rectangle(0, 32, 54, 8, style.belt);

  container.add([body, leftArm, rightArm, head, hair, belt]);

  if (hasBlackWaistcoat) {
    const waistcoat = scene.add.rectangle(0, 8, 34, 62, 0x111111);
    const leftSleeve = scene.add.rectangle(-34, 8, 18, 58, 0x111111);
    const rightSleeve = scene.add.rectangle(34, 8, 18, 58, 0x111111);
    container.add([waistcoat, leftSleeve, rightSleeve]);
  }

  const badgeX = facing === "front" ? -34 : 34;
  const rightShoulderBadge = scene.add.rectangle(badgeX, -14, 13, 13, style.badgeFill);
  rightShoulderBadge.setStrokeStyle(1, 0x0a0a0a);
  const badgeText = scene.add
    .text(badgeX, -14, "J", { color: numberToCss(style.badgeText), fontSize: "8px" })
    .setOrigin(0.5);

  container.add([rightShoulderBadge, badgeText]);
  return container;
}

function numberToCss(value: number): string {
  return `#${value.toString(16).padStart(6, "0")}`;
}
