import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { CharacterSelectScene } from "./scenes/CharacterSelectScene";
import { GradingScene } from "./scenes/GradingScene";
import { PreloadScene } from "./scenes/PreloadScene";

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-root",
  backgroundColor: "#17191d",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },
  physics: {
    default: "arcade",
  },
  scene: [BootScene, PreloadScene, CharacterSelectScene, GradingScene],
};
