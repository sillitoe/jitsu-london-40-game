import Phaser from "phaser";
import { inputIconTexture } from "../ui/inputIcons";

const FONT = '"Courier New", "Monaco", monospace';

export class AttractScene extends Phaser.Scene {
  constructor() {
    super("AttractScene");
  }

  create(): void {
    const splash = this.add.container();
    splash.add([
      this.add.image(640, 360, "arcadeSplash").setDisplaySize(1280, 720),
      this.label(640, 44, "LONDON JITSU 40", 30, "#5ee7ff"),
      this.label(640, 104, "GRADING PANIC", 72, "#ffe478"),
    ]);

    const controls = this.add.container();
    controls.add([
      this.add.image(640, 360, "dojoBackground").setDisplaySize(1280, 720),
      this.add.rectangle(640, 360, 1280, 720, 0x050913, 0.94),
      this.label(640, 92, "HOW TO PLAY", 62, "#5ee7ff"),
      this.label(640, 160, "TSUKURI: STEP LEFT OR RIGHT WHEN THE NEEDLE IS IN THE PATCH", 24, "#ffe478"),
    ]);

    const rows = [
      ["DIRECTION", null, "SWIPE LEFT / DOWN / RIGHT"],
      ["ACTION", "X / SPACE", "TAP"],
      ["WISDOM SPECIAL", "RETURN", "TRIPLE TAP"],
    ] as const;
    controls.add([
      this.label(592, 236, "KEYBOARD", 22, "#5ee7ff"),
      this.label(934, 236, "TOUCH", 22, "#5ee7ff"),
    ]);
    rows.forEach(([action, keyboard, touch], index) => {
      const y = 290 + index * 76;
      controls.add([
        this.add.rectangle(640, y, 990, 62, 0x081929).setStrokeStyle(2, 0x206497),
        this.label(306, y, action, 26, "#ffe478"),
        this.label(934, y, touch, 23),
      ]);
      if (keyboard) {
        controls.add(this.label(592, y, keyboard, 29));
      } else {
        (["LEFT", "DOWN", "RIGHT"] as const).forEach((direction, arrowIndex) => {
          controls.add(this.add.image(592 + (arrowIndex - 1) * 60, y, inputIconTexture(direction)));
        });
      }
    });
    controls.add([
      this.label(640, 516, "KUZUSHI: ALTERNATE THE TWO SHOWN DIRECTIONS", 23),
      this.label(640, 555, "SPECIAL: FULL WISDOM METER DURING KAKE", 23),
    ]);
    controls.setVisible(false);

    this.add.rectangle(640, 659, 590, 58, 0x050913, 0.96).setStrokeStyle(3, 0x00d8ff);
    const start = this.label(640, 659, "PRESS ENTER  /  TAP TO PLAY", 28, "#ffe478");
    this.tweens.add({ targets: start, alpha: 0.65, duration: 650, yoyo: true, repeat: -1 });
    this.time.addEvent({
      delay: 8500,
      loop: true,
      callback: () => {
        splash.setVisible(!splash.visible);
        controls.setVisible(!splash.visible);
      },
    });
    const begin = () => this.scene.start("CharacterSelectScene");
    this.input.keyboard?.once("keydown-ENTER", begin);
    this.input.keyboard?.once("keydown-SPACE", begin);
    this.input.once("pointerup", begin);
  }

  private label(x: number, y: number, text: string, size: number, color = "#f5f2eb"): Phaser.GameObjects.Text {
    return this.add.text(x, y, text, {
      fontFamily: FONT,
      fontSize: size,
      fontStyle: "bold",
      color,
      stroke: "#050913",
      strokeThickness: size >= 60 ? 9 : 4,
    }).setOrigin(0.5);
  }
}
