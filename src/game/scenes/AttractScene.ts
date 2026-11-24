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
      this.label(640, 61, "HOW TO PLAY", 54, "#5ee7ff"),
      this.label(640, 115, "YOUR STUDENTS ARE ABOUT TO EMBARRASS YOU, THEMSELVES, AND THE WHOLE DOJO.", 21),
      this.label(640, 146, "FIND THE RIGHT WORDS TO COACH THEM THROUGH THEIR GRADING.", 21),
    ]);

    const phases = [
      ["TSUKURI", "MOVEMENT", "STEP LEFT OR RIGHT WHEN THE NEEDLE ENTERS THE PATCH."],
      ["KUZUSHI", "BALANCE BREAKING", "QUICKLY ALTERNATE THE TWO DIRECTIONS SHOWN."],
      ["KAKE", "THROW", "HIT EACH PROMPT AS THE PLAYHEAD CROSSES ITS MARK."],
    ];
    phases.forEach(([name, stage, instruction], index) => {
      const y = 202 + index * 43;
      controls.add([
        this.add.rectangle(640, y, 990, 36, 0x081929),
        this.label(163, y, name, 20, "#ffe478").setOrigin(0, 0.5),
        this.label(277, y, stage, 17, "#5ee7ff").setOrigin(0, 0.5),
        this.label(475, y, instruction, 18).setOrigin(0, 0.5),
      ]);
    });

    const rows = [
      ["DIRECTION", null, "SWIPE LEFT / DOWN / RIGHT"],
      ["ACTION", "X / SPACE", "TAP"],
      ["WISDOM SPECIAL", "RETURN", "TRIPLE TAP"],
    ] as const;
    controls.add([
      this.label(306, 346, "CONTROLS", 22, "#5ee7ff"),
      this.label(592, 346, "KEYBOARD", 22, "#5ee7ff"),
      this.label(934, 346, "TOUCH", 22, "#5ee7ff"),
    ]);
    rows.forEach(([action, keyboard, touch], index) => {
      const y = 396 + index * 63;
      controls.add([
        this.add.rectangle(640, y, 990, 54, 0x081929).setStrokeStyle(2, 0x206497),
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
    controls.add(this.label(640, 571, "WISDOM SPECIAL REQUIRES A FULL METER DURING KAKE", 18));
    controls.setVisible(false);

    this.add.rectangle(640, 659, 590, 58, 0x050913, 0.96).setStrokeStyle(3, 0x00d8ff);
    const start = this.label(640, 659, "PRESS ENTER  /  TAP TO PLAY", 28, "#ffe478");
    this.tweens.add({ targets: start, alpha: 0.65, duration: 650, yoyo: true, repeat: -1 });
    const rotate = () => {
      splash.setVisible(!splash.visible);
      controls.setVisible(!splash.visible);
      this.time.delayedCall(splash.visible ? 8500 : 18000, rotate);
    };
    this.time.delayedCall(8500, rotate);
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
