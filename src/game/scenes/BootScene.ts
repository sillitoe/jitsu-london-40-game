import Phaser from "phaser";
import { createInputIconTextures } from "../ui/inputIcons";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create(): void {
    createInputIconTextures(this);
    this.scene.start("PreloadScene");
  }
}

