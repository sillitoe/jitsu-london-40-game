import Phaser from "phaser";

const assetUrl = (path: string): string => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#050913");

    const title = this.add.text(width / 2, height / 2 - 74, "LOADING...", {
      color: "#00d8ff",
      fontSize: "46px",
      fontFamily: '"Courier New", "Monaco", monospace',
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 8,
    }).setOrigin(0.5);

    const frame = this.add.rectangle(width / 2, height / 2, 520, 28, 0x050913, 1)
      .setStrokeStyle(3, 0xf5f2eb, 1);
    const bar = this.add.rectangle(frame.x - 252, frame.y, 0, 16, 0xfff044, 1)
      .setOrigin(0, 0.5);
    const detail = this.add.text(width / 2, height / 2 + 46, "0%", {
      color: "#f5f2eb",
      fontSize: "18px",
      fontFamily: '"Courier New", "Monaco", monospace',
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.load.on("progress", (progress: number) => {
      bar.setDisplaySize(504 * progress, 16);
      detail.setText(`${Math.round(progress * 100)}%`);
    });
    this.load.on("fileprogress", (file: Phaser.Loader.File) => {
      detail.setText(`${Math.round(this.load.progress * 100)}%  ${file.key.toUpperCase()}`);
    });
    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      title.setText("LOAD FAILED");
      detail.setText(file.key.toUpperCase());
      detail.setColor("#ff4d63");
    });

    this.load.audio("characterSelectTheme", assetUrl("/audio/character-select-theme.wav"));
    this.load.audio("gradingPanicTheme", assetUrl("/audio/grading-panic-theme.wav"));
    this.load.audio("gameOverSting", assetUrl("/audio/game-over-sting.wav"));
    this.load.image("dojoBackground", assetUrl("/backgrounds/dojo-mock-background.png"));
    this.load.image("examinerSteve", assetUrl("/sprites/examiner-steve.png"));
    this.load.image("examinerGareth", assetUrl("/sprites/examiner-gareth.png"));
    this.load.image("senseiMarianne", assetUrl("/sprites/sensei-marianne.png"));
    this.load.image("senseiGarvey", assetUrl("/sprites/sensei-garvey.png"));
    this.load.image("studentBack", assetUrl("/sprites/student-back.png"));
    this.load.image("studentMaleBack", assetUrl("/sprites/student-male-back.png"));
    this.load.image("studentMalePunched", assetUrl("/sprites/student-male-punched.png"));
    this.load.image("attackerReady", assetUrl("/sprites/attacker-ready.png"));
    this.load.image("attackerHeavy", assetUrl("/sprites/attacker-heavy.png"));
    this.load.image("attackerThrown", assetUrl("/sprites/attacker-thrown.png"));
    this.load.image("attackerQuick", assetUrl("/sprites/attacker-quick.png"));
    this.load.image("portraitMarianne", assetUrl("/sprites/portrait-marianne.png"));
    this.load.image("portraitGarvey", assetUrl("/sprites/portrait-garvey.png"));
    this.load.image("iconBad", assetUrl("/sprites/icon-bad.png"));
    this.load.image("iconGood", assetUrl("/sprites/icon-good.png"));
    this.load.image("iconPerfect", assetUrl("/sprites/icon-perfect.png"));
    this.load.image("ninjaGaidenFont", assetUrl("/fonts/ninja-gaiden-tecmo.png"));
    this.load.image("beltWhite", assetUrl("/sprites/belts/white.png"));
    this.load.image("beltYellow", assetUrl("/sprites/belts/yellow.png"));
    this.load.image("beltOrange", assetUrl("/sprites/belts/orange.png"));
    this.load.image("beltGreen", assetUrl("/sprites/belts/green.png"));
    this.load.image("beltPurple", assetUrl("/sprites/belts/purple.png"));
    this.load.image("beltLightBlue", assetUrl("/sprites/belts/light-blue.png"));
    this.load.image("beltDarkBlue", assetUrl("/sprites/belts/dark-blue.png"));
    this.load.image("beltBrown", assetUrl("/sprites/belts/brown.png"));
    this.load.image("beltBlack", assetUrl("/sprites/belts/black.png"));
  }

  create(): void {
    this.scene.start("CharacterSelectScene");
  }
}
