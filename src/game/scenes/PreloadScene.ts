import Phaser from "phaser";

const assetUrl = (path: string): string => `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
const LOADING_MESSAGES = [
  "LOOKING FOR A CLEAN GI",
  "FINDING THE LOST NOVICE",
  "SEWING ON A BADGE",
  "TIGHTENING THE BELT AGAIN",
  "PERSUADING STEVE TO START",
  "PUTTING THE MATS THE RIGHT WAY ROUND",
];

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
    const bar = this.add.rectangle(frame.x - 252, frame.y, 504, 16, 0xfff044, 1)
      .setOrigin(0, 0.5).setScale(0, 1);
    const detail = this.add.text(width / 2, height / 2 + 46, "0%", {
      color: "#f5f2eb",
      fontSize: "18px",
      fontFamily: '"Courier New", "Monaco", monospace',
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5);

    let currentMessage = Phaser.Utils.Array.GetRandom(LOADING_MESSAGES);
    const status = this.add.text(width / 2, height / 2 + 78, currentMessage, {
      color: "#fff0a3",
      fontSize: "18px",
      fontFamily: '"Courier New", "Monaco", monospace',
      fontStyle: "bold",
    }).setOrigin(0.5);
    const rotation = this.time.addEvent({
      delay: 1600,
      loop: true,
      callback: () => {
        currentMessage = Phaser.Utils.Array.GetRandom(LOADING_MESSAGES.filter((message) => message !== currentMessage));
        status.setText(currentMessage);
      },
    });

    this.load.on("progress", (progress: number) => {
      bar.setScale(progress, 1);
      detail.setText(`${Math.round(progress * 100)}%`);
    });
    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      rotation.remove();
      title.setText("LOAD FAILED");
      status.setText(file.key.toUpperCase()).setColor("#ff4d63");
    });

    this.load.audio("characterSelectTheme", assetUrl("/audio/character-select-theme.wav"));
    this.load.audio("gradingPanicTheme", assetUrl("/audio/grading-panic-theme.wav"));
    this.load.audio("gameOverSting", assetUrl("/audio/game-over-sting.wav"));
    this.load.audio("victoryFanfare", assetUrl("/audio/victory-fanfare.wav"));
    this.load.image("dojoBackground", assetUrl("/backgrounds/dojo-london.webp"));
    this.load.image("arcadeSplash", assetUrl("/backgrounds/arcade-splash-ruby-v3.webp"));
    this.load.image("arcadeVictory", assetUrl("/backgrounds/arcade-victory.webp"));
    this.load.image("examinerSteve", assetUrl("/sprites/examiner-steve.png"));
    this.load.image("examinerGareth", assetUrl("/sprites/examiner-gareth.png"));
    this.load.image("examinerSteveWalk", assetUrl("/sprites/examiner-steve-walk.webp"));
    this.load.image("examinerGarethWalk", assetUrl("/sprites/examiner-gareth-walk.webp"));
    this.load.image("examinerSteveWalkStep", assetUrl("/sprites/examiner-steve-step.webp"));
    this.load.image("examinerGarethWalkStep", assetUrl("/sprites/examiner-gareth-step.webp"));
    this.load.image("senseiMarianne", assetUrl("/sprites/sensei-marianne.png"));
    this.load.image("senseiGarvey", assetUrl("/sprites/sensei-garvey.png"));
    this.load.image("studentBack", assetUrl("/sprites/student-back.png"));
    this.load.image("studentMaleBack", assetUrl("/sprites/student-male-back.png"));
    this.load.image("studentMalePunched", assetUrl("/sprites/student-male-punched.png"));
    for (const student of ["ada", "noah", "mei"]) {
      this.load.image(`${student}Ready`, assetUrl(`/sprites/tori-${student}-ready.webp`));
      this.load.image(`${student}Hit`, assetUrl(`/sprites/tori-${student}-hit.webp`));
    }
    this.load.image("attackerReady", assetUrl("/sprites/attacker-ready.png"));
    this.load.image("attackerHeavy", assetUrl("/sprites/attacker-heavy.png"));
    this.load.image("attackerThrown", assetUrl("/sprites/attacker-thrown.png"));
    for (const attacker of ["ruby", "imani", "kai"]) {
      for (const pose of ["Ready", "Punch", "Thrown"]) {
        this.load.image(attacker + pose, assetUrl(`/sprites/uke-${attacker}-${pose.toLowerCase()}.webp`));
      }
    }
    this.load.image("portraitMarianne", assetUrl("/sprites/portrait-marianne.png"));
    this.load.image("portraitGarvey", assetUrl("/sprites/portrait-garvey.png"));
    this.load.image("senseiIan", assetUrl("/sprites/sensei-ian.webp"));
    this.load.image("senseiShep", assetUrl("/sprites/sensei-shep.webp"));
    this.load.image("senseiOliur", assetUrl("/sprites/sensei-oliur.webp"));
    this.load.image("portraitIan", assetUrl("/sprites/portrait-ian.webp"));
    this.load.image("portraitShep", assetUrl("/sprites/portrait-shep.webp"));
    this.load.image("portraitOliur", assetUrl("/sprites/portrait-oliur.webp"));
    this.load.image("iconBad", assetUrl("/sprites/icon-bad.png"));
    this.load.image("iconGood", assetUrl("/sprites/icon-good.png"));
    this.load.image("iconPerfect", assetUrl("/sprites/icon-perfect.png"));
    this.load.image("ninjaGaidenFont", assetUrl("/fonts/ninja-gaiden-tecmo.png"));
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
    this.scene.start("AttractScene");
  }
}
