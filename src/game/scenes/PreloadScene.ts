import Phaser from "phaser";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload(): void {
    this.load.audio("characterSelectTheme", "/audio/character-select-theme.wav");
    this.load.audio("gradingPanicTheme", "/audio/grading-panic-theme.wav");
    this.load.audio("gameOverSting", "/audio/game-over-sting.wav");
    this.load.image("dojoBackground", "/backgrounds/dojo-mock-background.png");
    this.load.image("examinerSteve", "/sprites/examiner-steve.png");
    this.load.image("examinerGareth", "/sprites/examiner-gareth.png");
    this.load.image("senseiMarianne", "/sprites/sensei-marianne.png");
    this.load.image("senseiGarvey", "/sprites/sensei-garvey.png");
    this.load.image("studentBack", "/sprites/student-back.png");
    this.load.image("studentMaleBack", "/sprites/student-male-back.png");
    this.load.image("studentMalePunched", "/sprites/student-male-punched.png");
    this.load.image("attackerReady", "/sprites/attacker-ready.png");
    this.load.image("attackerHeavy", "/sprites/attacker-heavy.png");
    this.load.image("attackerThrown", "/sprites/attacker-thrown.png");
    this.load.image("attackerQuick", "/sprites/attacker-quick.png");
    this.load.image("portraitMarianne", "/sprites/portrait-marianne.png");
    this.load.image("portraitGarvey", "/sprites/portrait-garvey.png");
    this.load.image("iconBad", "/sprites/icon-bad.png");
    this.load.image("iconGood", "/sprites/icon-good.png");
    this.load.image("iconPerfect", "/sprites/icon-perfect.png");
    this.load.image("ninjaGaidenFont", "/fonts/ninja-gaiden-tecmo.png");
    this.load.image("beltWhite", "/sprites/belts/white.png");
    this.load.image("beltYellow", "/sprites/belts/yellow.png");
    this.load.image("beltOrange", "/sprites/belts/orange.png");
    this.load.image("beltGreen", "/sprites/belts/green.png");
    this.load.image("beltPurple", "/sprites/belts/purple.png");
    this.load.image("beltLightBlue", "/sprites/belts/light-blue.png");
    this.load.image("beltDarkBlue", "/sprites/belts/dark-blue.png");
    this.load.image("beltBrown", "/sprites/belts/brown.png");
    this.load.image("beltBlack", "/sprites/belts/black.png");
  }

  create(): void {
    this.scene.start("CharacterSelectScene");
  }
}
