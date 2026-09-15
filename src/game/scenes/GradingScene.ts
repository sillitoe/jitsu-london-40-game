import Phaser from "phaser";
import { grades } from "../data/grades";
import { prototypeRounds } from "../data/prototypeBeats";
import { RhythmJudge } from "../systems/RhythmJudge";
import { WisdomMeter } from "../systems/WisdomMeter";
import type { PlayableSenseiId, PromptInput, RhythmWindow, TechniquePhase, TechniquePhaseId, TechniqueRound, TimingJudgement } from "../types";

interface BeatTile {
  box: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  promptIcon: Phaser.GameObjects.Image;
  resultSprite: Phaser.GameObjects.Image;
  goodWindow: Phaser.GameObjects.Rectangle;
  perfectWindow: Phaser.GameObjects.Rectangle;
  input: PromptInput;
  judgement?: TimingJudgement;
}

interface PhaseOverlayItem {
  box: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  icon: Phaser.GameObjects.Text;
  iconSprite: Phaser.GameObjects.Image;
  status: Phaser.GameObjects.Text;
  phaseId: TechniquePhaseId;
  player: 1 | 2;
}

type PhaseStatus = "pending" | "active" | "failed" | "good" | "perfect";

const GRADING_NOTICE_MS = 820;
const STEVE_NOTICE_MS = 2200;
const GARETH_NOTICE_MS = 680;
const YOI_NOTICE_MS = 700;
const YOSHIN_NOTICE_MS = 600;
const ROUND_INTRO_MS = GRADING_NOTICE_MS + STEVE_NOTICE_MS + GARETH_NOTICE_MS + YOI_NOTICE_MS + YOSHIN_NOTICE_MS;
const PHASE_LEAD_IN_MS = 650;
const KUZUSHI_COMMAND_LEAD_IN_MS = 1450;
const TSUKURI_SPEED_MULTIPLIER = 1.5;
const DEFAULT_WINDOW: RhythmWindow = { perfectMs: 42, goodMs: 160, lateMs: 260 };
const TOTAL_ROUNDS = prototypeRounds.length;
const ALL_INPUTS: PromptInput[] = ["LEFT", "DOWN", "RIGHT"];
const ARCADE_FONT = '"Courier New", "Monaco", monospace';
const ACTIVE_PLAYERS = 1;
const MAX_FAILURES = 3;
const TORI_TARGET_HEIGHT = 254;
const UKE_TARGET_HEIGHT = 274;
const CHARACTER_FOOT_Y = 538;
const CHARACTER_DEPTH = 10;
const UI_DEPTH = 40;
const SPEECH_DEPTH = 58;
const SPECIAL_DEPTH = 1200;

export class GradingScene extends Phaser.Scene {
  private readonly judge = new RhythmJudge();
  private readonly wisdom = new WisdomMeter();
  private currentRoundIndex = 0;
  private currentPhaseIndex = 0;
  private selectedSensei: PlayableSenseiId = "marianne";
  private activeRound: TechniqueRound = prototypeRounds[0];
  private activePhase: TechniquePhase = prototypeRounds[0].phases[0];
  private currentBeatIndex = 0;
  private patternStartedAt = 0;
  private inputLockedUntil = 0;
  private lastCountdownMessage = "";
  private runComplete = false;
  private roundsCompleted = 0;
  private phaseFailed = false;
  private phaseHadNonPerfect = false;
  private mashPresses = 0;
  private lastMashInput?: PromptInput;
  private activeMashInputs: PromptInput[] = ["X", "RIGHT"];
  private phaseStatuses: Partial<Record<TechniquePhaseId, PhaseStatus>> = {};
  private phaseScores: Partial<Record<TechniquePhaseId, number>> = {};
  private failures = 0;
  private scoreMultiplier = 1;
  private roundScore = 0;
  private currentPhaseScore = 0;
  private currentPhaseSuccessfulHits = 0;
  private score = 0;
  private nextStepTimer?: Phaser.Time.TimerEvent;
  private specialInProgress = false;
  private skipNextSenseiSpeech = false;
  private playerStudent?: Phaser.GameObjects.Image;
  private attackerStudent?: Phaser.GameObjects.Image;
  private senseiMarianneSprite?: Phaser.GameObjects.Image;
  private speechBubble?: Phaser.GameObjects.Rectangle;
  private speechPointer?: Phaser.GameObjects.Triangle;
  private speechText?: Phaser.GameObjects.Text;
  private phaseText!: Phaser.GameObjects.Text;
  private gradingText!: Phaser.GameObjects.Text;
  private actionText!: Phaser.GameObjects.Text;
  private mangaPanel!: Phaser.GameObjects.Rectangle;
  private mangaPunch!: Phaser.GameObjects.Rectangle;
  private mangaBurst!: Phaser.GameObjects.Star;
  private feedbackText!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;
  private statsText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private wisdomFill!: Phaser.GameObjects.Rectangle;
  private multiplierText!: Phaser.GameObjects.Text;
  private techniqueTitleText!: Phaser.GameObjects.Text;
  private lifeIcons: Phaser.GameObjects.Text[] = [];
  private lostLifeIndexes = new Set<number>();
  private beltSelectionBox!: Phaser.GameObjects.Rectangle;
  private beltGradingText!: Phaser.GameObjects.Text;
  private steveText!: Phaser.GameObjects.Text;
  private garethText!: Phaser.GameObjects.Text;
  private examinerBubble?: Phaser.GameObjects.Rectangle;
  private examinerBubbleOutline?: Phaser.GameObjects.Rectangle;
  private examinerPointer?: Phaser.GameObjects.Triangle;
  private examinerBubbleText?: Phaser.GameObjects.Text;
  private timingGuideText!: Phaser.GameObjects.Text;
  private timingTrack!: Phaser.GameObjects.Rectangle;
  private timingCursor!: Phaser.GameObjects.Rectangle;
  private playerTwoTimingTrack?: Phaser.GameObjects.Rectangle;
  private playerTwoTimingCursor?: Phaser.GameObjects.Rectangle;
  private fireText!: Phaser.GameObjects.Text;
  private countdownText!: Phaser.GameObjects.Text;
  private gameOverText!: Phaser.GameObjects.Text;
  private specialOverlay?: Phaser.GameObjects.Graphics;
  private specialBubble?: Phaser.GameObjects.Rectangle;
  private specialPointer?: Phaser.GameObjects.Triangle;
  private specialText?: Phaser.GameObjects.Text;
  private soundtrack?: Phaser.Sound.BaseSound;
  private hudObjects: Phaser.GameObjects.GameObject[] = [];
  private beatTiles: BeatTile[] = [];
  private phaseOverlayItems: PhaseOverlayItem[] = [];
  private beltMarkers: Phaser.GameObjects.Image[] = [];

  constructor() {
    super("GradingScene");
  }

  init(data?: { selectedSensei?: PlayableSenseiId }): void {
    this.selectedSensei = data?.selectedSensei ?? this.selectedSensei ?? "marianne";
    this.resetRuntimeState();
  }

  create(): void {
    this.createInputIconTextures();
    this.drawGradingHall();
    this.drawSplitScreenFrames();
    this.drawCast();
    this.drawUi();
    this.bindInput();
    this.startSoundtrack();
    this.startPattern();
  }

  private startSoundtrack(): void {
    this.sound.stopByKey("gradingPanicTheme");
    this.soundtrack = this.sound.add("gradingPanicTheme", {
      loop: true,
      volume: 0.28,
    });
    this.soundtrack.play();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.sound.stopByKey("gradingPanicTheme");
    });
  }

  private resetRuntimeState(): void {
    this.currentRoundIndex = 0;
    this.currentPhaseIndex = 0;
    this.currentBeatIndex = 0;
    this.activeRound = prototypeRounds[0];
    this.activePhase = prototypeRounds[0].phases[0];
    this.patternStartedAt = 0;
    this.inputLockedUntil = 0;
    this.lastCountdownMessage = "";
    this.runComplete = false;
    this.roundsCompleted = 0;
    this.phaseFailed = false;
    this.phaseHadNonPerfect = false;
    this.mashPresses = 0;
    this.lastMashInput = undefined;
    this.activeMashInputs = ["X", "RIGHT"];
    this.phaseStatuses = {};
    this.phaseScores = {};
    this.failures = 0;
    this.scoreMultiplier = 1;
    this.roundScore = 0;
    this.currentPhaseScore = 0;
    this.currentPhaseSuccessfulHits = 0;
    this.score = 0;
    this.nextStepTimer = undefined;
    this.specialInProgress = false;
    this.skipNextSenseiSpeech = false;
    this.lostLifeIndexes.clear();
    this.hudObjects = [];
    this.beatTiles = [];
    this.phaseOverlayItems = [];
    this.beltMarkers = [];
    this.lifeIcons = [];
    this.wisdom.reset();
  }

  update(): void {
    if (this.specialInProgress) {
      return;
    }

    this.renderTimingLane();
    this.renderWisdomMeter();
    if (this.failures >= MAX_FAILURES - 1) {
      this.updateLives();
    }
  }

  private createInputIconTextures(): void {
    const specs: Array<{ key: string; input: PromptInput }> = [
      { key: "inputLeft", input: "LEFT" },
      { key: "inputDown", input: "DOWN" },
      { key: "inputRight", input: "RIGHT" },
      { key: "inputX", input: "X" },
    ];

    specs.forEach((spec) => {
      if (this.textures.exists(spec.key)) {
        return;
      }

      const graphics = this.make.graphics({ x: 0, y: 0 }, false);
      graphics.fillStyle(0x15202d, 0.9);
      graphics.lineStyle(2, 0x26394d, 0.95);
      graphics.fillRoundedRect(0, 0, 56, 48, 4);
      graphics.strokeRoundedRect(0, 0, 56, 48, 4);
      graphics.fillStyle(0xf2f4ff, 1);

      if (spec.input === "X") {
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
        const polygon = points[spec.input];
        graphics.beginPath();
        graphics.moveTo(polygon[0], polygon[1]);
        for (let index = 2; index < polygon.length; index += 2) {
          graphics.lineTo(polygon[index], polygon[index + 1]);
        }
        graphics.closePath();
        graphics.fillPath();
      }

      graphics.generateTexture(spec.key, 56, 48);
      graphics.destroy();
    });
  }

  private drawGradingHall(): void {
    this.add.rectangle(640, 360, 1280, 720, 0x20242a);
    this.add.image(640, 360, "dojoBackground")
      .setDisplaySize(1280, 720)
      .setAlpha(0.92);
    this.add.rectangle(640, 360, 1280, 720, 0x07131f, 0.12);
    this.add.rectangle(640, 624, 1280, 192, 0x11151a, 0.58);
  }

  private drawSplitScreenFrames(): void {
    this.add.rectangle(326, 400, 516, 278, 0x000000, 0);
    this.add.rectangle(954, 400, 516, 278, 0x000000, 0);
  }

  private drawCast(): void {
    this.add.image(548, 244, "examinerSteve").setDisplaySize(126, 116);
    this.add.image(724, 244, "examinerGareth").setDisplaySize(126, 116);
    this.senseiMarianneSprite = this.add.image(ACTIVE_PLAYERS === 1 ? 164 : 82, 406, this.selectedSenseiSpriteKey())
      .setOrigin(0.5);
    this.scaleSpriteToHeight(this.senseiMarianneSprite, this.selectedSensei === "marianne" ? 266 : 311);
    this.faceSensei(this.senseiMarianneSprite, "right");
    this.rememberSenseiHome(this.senseiMarianneSprite);
    if (ACTIVE_PLAYERS > 1) {
      const playerTwoSensei = this.add.image(1192, 438, "senseiGarvey").setOrigin(0.5);
      this.scaleSpriteToHeight(playerTwoSensei, 311);
      this.faceSensei(playerTwoSensei, "left");
    }
    this.drawStudentsForGrade(this.activeRound.grade);
  }

  private drawStudentsForGrade(_grade: TechniqueRound["grade"]): void {
    const attackerKey = "attackerReady";

    this.playerStudent?.destroy();
    this.attackerStudent?.destroy();

    const playerX = ACTIVE_PLAYERS === 1 ? 510 : 352;
    const attackerX = ACTIVE_PLAYERS === 1 ? 770 : 600;

    this.attackerStudent = this.add.image(attackerX, CHARACTER_FOOT_Y, attackerKey).setOrigin(0.5, 1);
    this.scaleSpriteToHeight(this.attackerStudent, UKE_TARGET_HEIGHT);
    this.attackerStudent.setDepth(CHARACTER_DEPTH);
    this.playerStudent = this.add.image(playerX, CHARACTER_FOOT_Y, "studentMaleBack").setOrigin(0.5, 1);
    this.scaleSpriteToHeight(this.playerStudent, TORI_TARGET_HEIGHT);
    this.playerStudent.setDepth(CHARACTER_DEPTH + 1);

    this.rememberCharacterHome(this.attackerStudent);
    this.rememberCharacterHome(this.playerStudent);
  }

  private selectedSenseiName(): string {
    return this.selectedSensei === "garvey" ? "GARVEY" : "MARIANNE";
  }

  private selectedSenseiSpriteKey(): string {
    return this.selectedSensei === "garvey" ? "senseiGarvey" : "senseiMarianne";
  }

  private selectedSenseiPortraitKey(): string {
    return this.selectedSensei === "garvey" ? "portraitGarvey" : "portraitMarianne";
  }

  private preparePhase(phase: TechniquePhase): TechniquePhase {
    const prompts = phase.prompts.map((prompt) => ({ ...prompt }));

    if (phase.id === "tsukuri" && prompts.length > 0) {
      const direction = Phaser.Utils.Array.GetRandom(ALL_INPUTS);
      prompts.forEach((prompt) => {
        prompt.input = direction;
      });
    }

    return {
      ...phase,
      prompts,
      mashInputs: phase.mashInputs ? [...phase.mashInputs] : undefined,
      timingWindow: phase.timingWindow ? { ...phase.timingWindow } : undefined,
    };
  }

  private scaleSpriteToHeight(sprite: Phaser.GameObjects.Image, targetHeight: number): void {
    const frame = sprite.texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    const width = "naturalWidth" in frame ? frame.naturalWidth : frame.width;
    const height = "naturalHeight" in frame ? frame.naturalHeight : frame.height;
    const scale = targetHeight / height;
    sprite.setScale(scale);
    sprite.setDisplaySize(width * scale, targetHeight);
  }

  private faceSensei(sprite: Phaser.GameObjects.Image, direction: "left" | "right"): void {
    const magnitude = Math.abs(sprite.scaleX);
    sprite.setScale(direction === "right" ? magnitude : -magnitude, sprite.scaleY);
  }

  private rememberCharacterHome(sprite: Phaser.GameObjects.Image): void {
    sprite.setData("homeX", sprite.x);
    sprite.setData("homeY", sprite.y);
    sprite.setData("homeScaleX", sprite.scaleX);
    sprite.setData("homeScaleY", sprite.scaleY);
    sprite.setData("homeRotation", sprite.rotation);
  }

  private rememberPhaseBase(sprite?: Phaser.GameObjects.Image): void {
    if (!sprite) {
      return;
    }

    sprite.setData("phaseBaseX", sprite.x);
    sprite.setData("phaseBaseY", sprite.y);
    sprite.setData("phaseBaseRotation", sprite.rotation);
  }

  private rememberSenseiHome(sprite: Phaser.GameObjects.Image): void {
    sprite.setData("homeX", sprite.x);
    sprite.setData("homeY", sprite.y);
    sprite.setData("homeScaleX", sprite.scaleX);
    sprite.setData("homeScaleY", sprite.scaleY);
    sprite.setData("homeRotation", sprite.rotation);
    sprite.setData("homeDepth", sprite.depth);
  }

  private resetSensei(sprite?: Phaser.GameObjects.Image): void {
    if (!sprite) {
      return;
    }

    this.tweens.killTweensOf(sprite);
    sprite.setPosition(sprite.getData("homeX") as number, sprite.getData("homeY") as number);
    sprite.setScale(sprite.getData("homeScaleX") as number, sprite.getData("homeScaleY") as number);
    sprite.setRotation(sprite.getData("homeRotation") as number);
    sprite.setDepth(sprite.getData("homeDepth") as number);
    sprite.setAlpha(1);
  }

  private resetCharacter(sprite?: Phaser.GameObjects.Image): void {
    if (!sprite) {
      return;
    }

    this.tweens.killTweensOf(sprite);
    sprite.setPosition(sprite.getData("homeX") as number, sprite.getData("homeY") as number);
    sprite.setScale(sprite.getData("homeScaleX") as number, sprite.getData("homeScaleY") as number);
    sprite.setRotation(sprite.getData("homeRotation") as number);
    sprite.setAlpha(1);
  }

  private drawUi(): void {
    this.drawPlayerHud(1);
    if (ACTIVE_PLAYERS > 1) {
      this.drawPlayerHud(2);
    }

    this.mangaPanel = this.add.rectangle(640, 400, 430, 190, 0xf6f1df, 0);
    this.mangaPanel.setStrokeStyle(0, 0x000000, 0);
    this.mangaPunch = this.add.rectangle(640, 400, 170, 56, 0xd44336, 0);
    this.mangaPunch.setRotation(-0.18);
    this.mangaBurst = this.add.star(640, 400, 16, 26, 86, 0xfff0a3, 0);
    this.mangaBurst.setStrokeStyle(0, 0x000000, 0);

    this.phaseText = this.add.text(640, 214, "", {
      color: "#fff7cf",
      fontSize: "20px",
      fontStyle: "bold",
      align: "center",
      wordWrap: { width: 760 },
      fontFamily: ARCADE_FONT,
      stroke: "#050913",
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.gradingText = this.add.text(640, 652, "", {
      color: "#fff0a3",
      fontSize: "18px",
      fontStyle: "bold",
      fontFamily: ARCADE_FONT,
      stroke: "#17191d",
      strokeThickness: 4,
    }).setOrigin(0.5);
    this.gradingText.setVisible(false);

    this.createPhaseOverlay();

    this.actionText = this.add.text(640, 506, "", {
      color: "#f5f2eb",
      fontSize: "15px",
      fontFamily: ARCADE_FONT,
      align: "center",
      wordWrap: { width: 760 },
      stroke: "#050913",
      strokeThickness: 4,
    }).setOrigin(0.5);
    this.actionText.setVisible(false);

    this.add.rectangle(640, 652, 1280, 136, 0x17191d);
    this.drawRhythmPanels();
    this.drawBeltLadder();

    this.promptText = this.add.text(640, 558, "", {
      color: "#fff7cf",
      fontSize: "28px",
      fontStyle: "bold",
      fontFamily: ARCADE_FONT,
    }).setOrigin(0.5);
    this.promptText.setVisible(false);

    const timingPanelX = this.playerPanelX(1);
    this.timingGuideText = this.add.text(timingPanelX, 648, "", {
      color: "#ffffff",
      fontSize: "18px",
      fontStyle: "bold",
      fontFamily: ARCADE_FONT,
      align: "center",
      wordWrap: { width: 470 },
    }).setOrigin(0.5);
    this.timingGuideText.setVisible(false);

    this.timingTrack = this.add.rectangle(timingPanelX, 626, 560, 14, 0x11151a);
    this.timingTrack.setStrokeStyle(2, 0xe1d6b8, 0.8);
    this.timingCursor = this.add.rectangle(timingPanelX - 280, 626, 9, 24, 0xfff0a3);

    this.fireText = this.add.text(timingPanelX + 218, 646, "", {
      color: "#ff7a2f",
      fontSize: "22px",
      fontStyle: "bold",
      fontFamily: ARCADE_FONT,
      stroke: "#17191d",
      strokeThickness: 5,
    }).setOrigin(0.5);
    this.fireText.setVisible(false);

    this.countdownText = this.add.text(640, 356, "", {
      color: "#fff0a3",
      fontSize: "84px",
      fontStyle: "bold",
      fontFamily: ARCADE_FONT,
      stroke: "#17191d",
      strokeThickness: 10,
    }).setOrigin(0.5);

    this.gameOverText = this.add.text(640, 344, "GAME OVER", {
      color: "#ff2438",
      fontSize: "104px",
      fontStyle: "bold",
      fontFamily: ARCADE_FONT,
      stroke: "#050913",
      strokeThickness: 14,
    }).setOrigin(0.5).setDepth(SPEECH_DEPTH + 10);
    this.gameOverText.setVisible(false);

    this.feedbackText = this.add.text(640, 588, "", {
      color: "#f5f2eb",
      fontSize: "16px",
      fontFamily: ARCADE_FONT,
      align: "center",
      wordWrap: { width: 520 },
    }).setOrigin(0.5);
    this.feedbackText.setVisible(false);

    this.statsText = this.add.text(38, 48, "", {
      color: "#f5f2eb",
      fontSize: "12px",
      fontFamily: ARCADE_FONT,
    });
    this.statsText.setVisible(false);

    this.steveText = this.add.text(468, 112, "", {
      color: "#ffffff",
      fontSize: "14px",
      fontFamily: ARCADE_FONT,
      wordWrap: { width: 260 },
    });
    this.steveText.setVisible(false);

    this.garethText = this.add.text(468, 170, "", {
      color: "#d7dde0",
      fontSize: "13px",
      fontFamily: ARCADE_FONT,
      wordWrap: { width: 260 },
    });
    this.garethText.setVisible(false);

    this.updateStats();
  }

  private drawPlayerHud(player: 1 | 2): void {
    const isLeft = player === 1;
    const x = isLeft ? 18 : 898;
    const label = isLeft ? `1P  SENSEI ${this.selectedSenseiName()}` : "2P  SENSEI GARVEY";
    const portraitKey = isLeft ? this.selectedSenseiPortraitKey() : "portraitGarvey";
    this.hudObjects.push(...this.drawArcadeFrame(x + 215, 82, 430, 128, player === 1 ? 0x00e7ff : 0x4f84ff, 0.92));
    const portrait = this.trackHud(this.add.image(isLeft ? x + 66 : x + 364, 82, portraitKey)
      .setDisplaySize(120, 120)
      .setDepth(UI_DEPTH + 1));
    portrait.setFlipX(!isLeft || (isLeft && this.selectedSensei === "garvey"));
    this.trackHud(this.add.text(x + 13, 15, isLeft ? "1P" : "2P", {
      color: "#fff7cf",
      fontSize: "22px",
      fontFamily: ARCADE_FONT,
      fontStyle: "bold",
      stroke: "#050913",
      strokeThickness: 4,
    }).setDepth(UI_DEPTH + 1));
    const textX = isLeft ? x + 146 : x + 24;
    const barX = textX + 98;
    this.trackHud(this.add.text(textX, 24, label.replace("1P  ", "").replace("2P  ", ""), {
      color: "#f5f2eb",
      fontSize: "20px",
      fontFamily: ARCADE_FONT,
      fontStyle: "bold",
      stroke: "#050913",
      strokeThickness: 4,
    }).setDepth(UI_DEPTH + 1));
    if (player === 1) {
      this.scoreText = this.trackHud(this.add.text(textX, 54, "", {
        color: "#fff0a3",
        fontSize: "17px",
        fontFamily: ARCADE_FONT,
        fontStyle: "bold",
        stroke: "#050913",
        strokeThickness: 3,
      }).setDepth(UI_DEPTH + 1));
      for (let index = 0; index < MAX_FAILURES; index += 1) {
        const heart = this.trackHud(this.add.text(textX + 106 + index * 44, 126, "♥", {
          color: "#ff4d63",
          fontSize: "38px",
          fontFamily: '"Arial Black", Arial, sans-serif',
          fontStyle: "bold",
          stroke: "#050913",
          strokeThickness: 6,
        }).setOrigin(0.5).setDepth(UI_DEPTH + 1));
        heart.setData("homeX", heart.x);
        heart.setData("homeY", heart.y);
        this.lifeIcons.push(heart);
      }
    }
    this.trackHud(this.add.text(textX, 82, "WISDOM", {
      color: "#ff4d9a",
      fontSize: "16px",
      fontFamily: ARCADE_FONT,
      fontStyle: "bold",
      stroke: "#050913",
      strokeThickness: 3,
    }).setDepth(UI_DEPTH + 1));
    this.trackHud(this.add.rectangle(barX, 84, 172, 18, 0x050913).setStrokeStyle(2, 0xf5f2eb, 1).setOrigin(0, 0).setDepth(UI_DEPTH + 1));
    const fill = this.trackHud(this.add.rectangle(barX + 4, 88, player === 1 ? 0 : 132, 10, 0xfff044).setOrigin(0, 0).setDepth(UI_DEPTH + 1));
    if (player === 1) {
      this.wisdomFill = fill;
    }
  }

  private trackHud<T extends Phaser.GameObjects.GameObject>(object: T): T {
    this.hudObjects.push(object);
    return object;
  }

  private drawBeltLadder(): void {
    this.drawArcadeFrame(640, 689, 450, 62, 0x00e7ff, 1);
    this.drawArcadeFrame(640, 664, 258, 24, 0x00e7ff, 1, UI_DEPTH + 0.8);
    this.beltGradingText = this.add.text(640, 664, this.bottomGradingLabel(), {
      color: "#fff0a3",
      fontSize: "14px",
      fontFamily: ARCADE_FONT,
      fontStyle: "bold",
      stroke: "#050913",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(UI_DEPTH + 1);
    this.beltSelectionBox = this.add.rectangle(468, 704, 40, 34, 0x080a11, 0.95)
      .setStrokeStyle(4, 0xfff044, 1)
      .setDepth(UI_DEPTH + 1);

    grades.forEach((grade, index) => {
      const x = 468 + index * 43;
      const marker = this.add.image(x, 704, grade.beltSprite).setDisplaySize(28, 28).setDepth(UI_DEPTH + 2);
      this.beltMarkers.push(marker);
    });
  }

  private drawRhythmPanels(): void {
    this.drawArcadeFrame(this.playerPanelX(1), 612, 700, 144, 0x00e7ff, 1);
    this.drawArcadeFrame(this.playerPanelX(1), 538, 420, 28, 0x00e7ff, 1, UI_DEPTH + 0.8);
    this.techniqueTitleText = this.add.text(this.playerPanelX(1), 538, "", {
      color: "#fff0a3",
      fontSize: "18px",
      fontFamily: ARCADE_FONT,
      fontStyle: "bold",
      stroke: "#050913",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(UI_DEPTH + 1);
    if (ACTIVE_PLAYERS > 1) {
      this.drawArcadeFrame(this.playerPanelX(2), 632, 430, 108, 0x4f84ff, 0.76);
      this.playerTwoTimingTrack = this.add.rectangle(this.playerPanelX(2), 646, 350, 14, 0x11151a);
      this.playerTwoTimingTrack.setStrokeStyle(2, 0x8aa8ff, 0.75);
      this.playerTwoTimingCursor = this.add.rectangle(this.playerPanelX(2) - 175, 646, 9, 24, 0x8aa8ff, 0.75);
    }
  }

  private playerPanelX(player: 1 | 2): number {
    if (ACTIVE_PLAYERS === 1) {
      return 646;
    }

    return player === 1 ? 288 : 992;
  }

  private drawArcadeFrame(x: number, y: number, width: number, height: number, _stroke: number, alpha: number, depth = UI_DEPTH): Phaser.GameObjects.GameObject[] {
    const graphics = this.add.graphics().setDepth(depth);
    const left = x - width / 2;
    const top = y - height / 2;
    const radius = 5;
    const darkBlue = 0x030b19;
    const bevelDark = 0x00346d;
    const blue = 0x00d8ff;

    graphics.fillStyle(0x000000, 1);
    graphics.fillRoundedRect(left - 5, top - 5, width + 10, height + 10, radius + 3);
    graphics.fillStyle(darkBlue, alpha);
    graphics.fillRoundedRect(left, top, width, height, radius);

    graphics.lineStyle(4, blue, 1);
    graphics.strokeRoundedRect(left, top, width, height, radius);
    graphics.lineStyle(3, bevelDark, 1);
    graphics.beginPath();
    graphics.moveTo(left + radius + 3, top + 5);
    graphics.lineTo(left + width - radius - 3, top + 5);
    graphics.moveTo(left + 5, top + radius + 3);
    graphics.lineTo(left + 5, top + height - radius - 3);
    graphics.strokePath();
    graphics.lineStyle(3, bevelDark, 1);
    graphics.beginPath();
    graphics.moveTo(left + width + 5, top + radius + 2);
    graphics.lineTo(left + width + 5, top + height - radius - 2);
    graphics.moveTo(left + radius + 2, top + height + 5);
    graphics.lineTo(left + width - radius - 2, top + height + 5);
    graphics.strokePath();

    return [graphics];
  }

  private createPhaseOverlay(): void {
    const phases: Array<{ id: TechniquePhaseId; label: string }> = [
      { id: "tsukuri", label: "TSUKURI" },
      { id: "kuzushi", label: "KUZUSHI" },
      { id: "kake", label: "KAKE" },
    ];
    const columns: Array<{ player: 1 | 2; x: number }> = ACTIVE_PLAYERS === 1
      ? [{ player: 1, x: 24 }]
      : [
          { player: 1, x: 72 },
          { player: 2, x: 1020 },
        ];

    columns.forEach((column) => {
      phases.forEach((phase, index) => {
        const y = (ACTIVE_PLAYERS === 1 ? 634 : 294) + index * 30;
        const box = this.add.rectangle(column.x, y, 214, 26, 0x000000, 0);
        box.setOrigin(0, 0.5);
        box.setStrokeStyle(0, 0x000000, 0);
        const labelX = column.x + 14;
        const iconX = column.x + 124;
        const statusX = column.x + 204;
        const label = this.add.text(labelX, y, phase.label, {
          color: "#f5f2eb",
          fontSize: "15px",
          fontStyle: "bold",
          fontFamily: ARCADE_FONT,
          stroke: "#050913",
          strokeThickness: 3,
        }).setOrigin(0, 0.5);
        const icon = this.add.text(iconX, y, "-", {
          color: "#b9c3c0",
          fontSize: "21px",
          fontStyle: "bold",
          fontFamily: ARCADE_FONT,
          stroke: "#050913",
          strokeThickness: 4,
        }).setOrigin(0.5);
        const iconSprite = this.add.image(iconX, y, "iconGood")
          .setDisplaySize(26, 26)
          .setVisible(false);
        const status = this.add.text(statusX, y, "-", {
          color: "#b9c3c0",
          fontSize: "16px",
          fontStyle: "bold",
          fontFamily: ARCADE_FONT,
          stroke: "#050913",
          strokeThickness: 3,
        }).setOrigin(1, 0.5);

        this.phaseOverlayItems.push({ box, label, icon, iconSprite, status, phaseId: phase.id, player: column.player });
      });

      if (column.player === 1) {
        this.multiplierText = this.add.text(column.x + 214, 728, "", {
          color: "#fff0a3",
          fontSize: "15px",
          fontStyle: "bold",
          fontFamily: ARCADE_FONT,
          stroke: "#050913",
          strokeThickness: 4,
        }).setOrigin(1, 0.5);
      }
    });
  }

  private bindInput(): void {
    this.input.keyboard?.on("keydown-LEFT", () => this.handleInput("LEFT"));
    this.input.keyboard?.on("keydown-DOWN", () => this.handleInput("DOWN"));
    this.input.keyboard?.on("keydown-RIGHT", () => this.handleInput("RIGHT"));
    this.input.keyboard?.on("keydown-X", () => this.handleInput("X"));
    this.input.keyboard?.on("keydown-SPACE", () => this.triggerWisdom());
    this.input.keyboard?.on("keydown-ESC", () => this.resetGame());
  }

  private startPattern(): void {
    this.currentBeatIndex = 0;
    this.phaseFailed = false;
    this.phaseHadNonPerfect = false;
    this.mashPresses = 0;
    this.lastMashInput = undefined;
    this.currentPhaseSuccessfulHits = 0;
    this.activeRound = prototypeRounds[this.currentRoundIndex];
    this.activePhase = this.preparePhase(this.activeRound.phases[this.currentPhaseIndex]);
    this.currentPhaseScore = 0;
    if (this.currentPhaseIndex === 0) {
      this.phaseStatuses = {};
      this.phaseScores = {};
      this.roundScore = 0;
      this.drawStudentsForGrade(this.activeRound.grade);
    }
    this.activeMashInputs = this.activePhase.mode === "mash" ? this.randomMashInputs() : ["X", "RIGHT"];
    this.phaseStatuses[this.activePhase.id] = "active";
    const leadInMs = this.currentPhaseIndex === 0
      ? ROUND_INTRO_MS
      : this.activePhase.id === "kuzushi"
        ? KUZUSHI_COMMAND_LEAD_IN_MS
        : PHASE_LEAD_IN_MS;
    const now = this.currentSceneTime();
    this.patternStartedAt = now + leadInMs;
    this.inputLockedUntil = now + 420;
    this.lastCountdownMessage = "";
    this.runComplete = false;
    this.gameOverText?.setVisible(false);
    this.countdownText.setColor("#fff0a3");

    const phase = this.activePhase;
    this.gradingText.setText(this.bottomGradingLabel());
    this.techniqueTitleText.setText(this.techniqueTitle());
    this.updateBeltLadder();
    this.promptText.setText("");
    this.phaseText.setText("");
    this.actionText.setText("");
    this.feedbackText.setText("");
    this.hideExaminerSpeech();
    this.steveText.setText("STEVE: READY!");
    this.garethText.setText("GARETH:");
    if (this.currentPhaseIndex === 0) {
      this.resetCharacter(this.playerStudent);
      this.resetCharacter(this.attackerStudent);
    }
    this.rememberPhaseBase(this.playerStudent);
    this.rememberPhaseBase(this.attackerStudent);
    if (this.activePhase.id === "kuzushi") {
      this.showSenseiSpeechMessage(`${this.selectedSenseiName()}: TAKE BALANCE!`, KUZUSHI_COMMAND_LEAD_IN_MS - 260);
    }
    this.createBeatTiles(phase);
    this.raiseUi();
    this.renderPhaseOverlay();
    this.renderPhaseVisual("ready");
    this.renderTimingLane();
  }

  private handleInput(input: PromptInput): void {
    if (this.currentSceneTime() < this.inputLockedUntil) {
      return;
    }

    if (this.runComplete) {
      this.feedbackText.setText(this.lockedRunMessage());
      return;
    }

    if (this.activePhase.mode === "mash") {
      this.handleMashInput(input);
      return;
    }

    this.advanceExpiredPrompts();

    const prompt = this.activePhase.prompts[this.currentBeatIndex];

    if (!prompt) {
      return;
    }

    const elapsedMs = this.phaseElapsedMs();

    if (elapsedMs < 0) {
      this.feedbackText.setText("WAIT FOR THE MARKER TO START");
      return;
    }

    const window = this.activeWindow();

    if (elapsedMs < prompt.atMs - window.lateMs) {
      this.feedbackText.setText(`TOO EARLY - GET READY FOR ${this.inputLabel(prompt.input)}`);
      return;
    }

    const judgement = this.judge.judge(prompt, input, elapsedMs, window);
    this.applyJudgement(judgement, this.currentBeatIndex);
    this.currentBeatIndex += 1;

    if (this.activePhase.failOnBadTiming && judgement === "MISS") {
      this.failPhase();
      return;
    }

    if (this.currentBeatIndex >= this.activePhase.prompts.length) {
      this.completePhase();
    }
  }

  private handleMashInput(input: PromptInput): void {
    const elapsedMs = this.phaseElapsedMs();
    const mashInputs = this.activeMashInputs;
    const target = this.activePhase.mashTarget ?? 10;

    if (elapsedMs < 0) {
      this.feedbackText.setText("WAIT FOR THE MARKER TO START");
      return;
    }

    if (elapsedMs > this.patternDuration(this.activePhase)) {
      this.completeMashPhase();
      return;
    }

    if (!mashInputs.includes(input)) {
      this.feedbackText.setText(`ALTERNATE ${mashInputs.map((mashInput) => this.inputLabel(mashInput)).join(" + ")}`);
      return;
    }

    if (input === this.lastMashInput) {
      this.feedbackText.setText(`ALTERNATE! NEXT: ${this.nextMashLabel()}`);
      this.updateStats();
      return;
    }

    this.lastMashInput = input;
    this.mashPresses += 1;
    this.addPhasePoints(10);
    this.jiggleKuzushiBalance();

    if (this.mashPresses % 3 === 0) {
      this.wisdom.addForJudgement("GOOD");
    }

    this.feedbackText.setText(
      this.mashPresses >= target
        ? `${this.activePhase.result} KEEP GOING FOR EXAMINER POINTS.`
        : `TAKE BALANCE: ${this.mashPresses}/${target}`,
    );
    this.renderPhaseVisual(this.mashPresses >= target ? "PERFECT" : "GOOD");
    this.updateStats();
  }

  private completeMashPhase(): void {
    if (this.runComplete) {
      return;
    }

    const target = this.activePhase.mashTarget ?? 10;
    if (this.mashPresses >= target) {
      this.applyJudgement(this.mashPresses >= target + 4 ? "PERFECT" : "GOOD");
      this.completePhase();
      return;
    }

    this.applyJudgement("MISS");
    this.failPhase();
  }

  private jiggleKuzushiBalance(): void {
    const uke = this.attackerStudent;
    const tori = this.playerStudent;
    if (!uke || !tori) {
      return;
    }

    const ukeBaseX = uke.getData("phaseBaseX") as number;
    const ukeBaseY = uke.getData("phaseBaseY") as number;
    const toriBaseX = tori.getData("phaseBaseX") as number;
    const toriBaseY = tori.getData("phaseBaseY") as number;
    const intensity = Phaser.Math.Clamp(4 + this.mashPresses * 0.3, 4, 10);
    this.tweens.killTweensOf(uke);
    this.tweens.killTweensOf(tori);
    this.tweens.add({
      targets: uke,
      x: ukeBaseX + Phaser.Math.Between(-intensity, intensity),
      y: ukeBaseY + Phaser.Math.Between(-3, 3),
      rotation: Phaser.Math.FloatBetween(-0.055, 0.055),
      duration: 58,
      ease: "Stepped",
      onComplete: () => {
        this.tweens.add({
          targets: uke,
          x: ukeBaseX + Phaser.Math.Between(-5, 5),
          y: ukeBaseY,
          rotation: Phaser.Math.FloatBetween(-0.025, 0.025),
          duration: 72,
          ease: "Sine.easeOut",
        });
      },
    });
    this.tweens.add({
      targets: tori,
      x: toriBaseX + Phaser.Math.Between(-Math.ceil(intensity * 0.65), Math.ceil(intensity * 0.65)),
      y: toriBaseY + Phaser.Math.Between(-2, 2),
      rotation: Phaser.Math.FloatBetween(-0.035, 0.035),
      duration: 58,
      ease: "Stepped",
      onComplete: () => {
        this.tweens.add({
          targets: tori,
          x: toriBaseX + Phaser.Math.Between(-3, 3),
          y: toriBaseY,
          rotation: Phaser.Math.FloatBetween(-0.018, 0.018),
          duration: 72,
          ease: "Sine.easeOut",
        });
      },
    });
  }

  private applyJudgement(judgement: TimingJudgement, beatIndex?: number): void {
    if (judgement !== "PERFECT") {
      this.phaseHadNonPerfect = true;
    }

    const scoreByJudgement: Record<TimingJudgement, number> = {
      PERFECT: 100,
      GOOD: 60,
      LATE: 20,
      MISS: 0,
    };

    this.addPhasePoints(scoreByJudgement[judgement]);
    if (judgement !== "MISS") {
      this.currentPhaseSuccessfulHits += 1;
    }
    this.wisdom.addForJudgement(judgement);
    this.updateStats();
    this.showJudgementGraphic(judgement);
    if (beatIndex !== undefined) {
      this.beatTiles[beatIndex].judgement = judgement;
    }

    const feedbackByJudgement: Record<TimingJudgement, string> = {
      PERFECT: `PERFECT - ${this.activePhase.result}`,
      GOOD: `GOOD - ${this.activePhase.result}`,
      LATE: `LATE - ${this.activePhase.result}`,
      MISS: `BAD - ${this.activePhase.failResult}`,
    };

    this.feedbackText.setText(feedbackByJudgement[judgement].toUpperCase());
    this.renderPhaseVisual(judgement);
  }

  private completePhase(): void {
    if (this.runComplete) {
      return;
    }

    if (this.activePhase.mode === "sequence" && this.currentPhaseSuccessfulHits === 0) {
      this.failPhase();
      return;
    }

    this.runComplete = true;
    this.phaseScores[this.activePhase.id] = this.currentPhaseScore;
    this.roundScore += this.currentPhaseScore;
    this.phaseStatuses[this.activePhase.id] = this.phaseHadNonPerfect ? "good" : "perfect";
    this.countdownText.setText("");
    this.timingGuideText.setText("COMPLETE");
    this.steveText.setText(this.phaseCompletionLine());
    this.garethText.setText(this.currentPhaseIndex === 2 ? "GARETH: HM." : "GARETH:");

    const playResult = () => {
      this.playStageResultAnimation(true, () => {
        this.hideSenseiSpeech();
        this.renderPhaseOverlay();
        if (this.currentPhaseIndex < this.activeRound.phases.length - 1) {
          this.feedbackText.setText(`${this.activePhase.name} COMPLETE - NEXT PHASE`.toUpperCase());
          this.currentPhaseIndex += 1;
          this.nextStepTimer = this.time.delayedCall(720, () => {
            this.nextStepTimer = undefined;
            this.startPattern();
          });
          return;
        }

        this.bankTechniqueScore(() => this.completeRound(false));
      });
    };

    if (this.skipNextSenseiSpeech || this.activePhase.id === "kuzushi") {
      this.skipNextSenseiSpeech = false;
      playResult();
      return;
    }

    this.showSenseiSpeech(true, playResult);
  }

  private failPhase(): void {
    if (this.runComplete) {
      return;
    }

    this.phaseFailed = true;
    this.runComplete = true;
    const failedPhaseId = this.activePhase.id;
    const failedPhaseScore = this.currentPhaseScore;
    this.failures += 1;
    this.scoreMultiplier = 1;
    this.refreshScoreLabels();
    this.updateLives();
    this.countdownText.setText("");
    this.timingGuideText.setText("TECHNIQUE FAILED");
    this.feedbackText.setText(`${this.activePhase.name} FAILED - ${this.activePhase.failResult}`.toUpperCase());
    this.steveText.setText("STEVE: NO. RESET. DO NOT STAND THERE ADMIRING THE FIST.");
    this.garethText.setText("GARETH: MM.");
    this.renderPhaseVisual("MISS");
    this.animateLifeLost(this.failures - 1);
    this.showSenseiSpeech(false, () => {
      const playFailAnimation = () => this.playStageResultAnimation(false, () => {
        this.hideSenseiSpeech();
        this.phaseStatuses[failedPhaseId] = "failed";
        this.phaseScores[failedPhaseId] = failedPhaseScore;
        this.roundScore += failedPhaseScore;
        this.countdownText.setText("THWACK!");
        this.dropTechniqueScore();
        this.renderPhaseOverlay();
        this.nextStepTimer = this.time.delayedCall(560, () => {
          this.nextStepTimer = undefined;
          if (this.failures >= MAX_FAILURES) {
            this.gameOver();
            return;
          }
          this.completeRound(true);
        });
      });
      if (this.activePhase.id === "tsukuri" || this.activePhase.id === "kuzushi") {
        this.showToriConfusion(playFailAnimation);
        return;
      }

      playFailAnimation();
    });
  }

  private gameOver(): void {
    this.runComplete = true;
    this.sound.stopByKey("gradingPanicTheme");
    this.sound.play("gameOverSting", { volume: 0.72 });
    this.countdownText.setText("GAME OVER");
    this.countdownText.setColor("#ff4d63");
    this.countdownText.setAlpha(1);
    this.countdownText.setScale(1);
    this.gameOverText.setVisible(true);
    this.gameOverText.setAlpha(0);
    this.gameOverText.setScale(1.35);
    this.tweens.add({
      targets: this.gameOverText,
      alpha: 1,
      scale: 1,
      duration: 320,
      ease: "Back.easeOut",
    });
    this.timingGuideText.setText("PRESS ESC TO RESET");
  }

  private showSenseiSpeech(success: boolean, onComplete: () => void): void {
    this.showSenseiSpeechMessage(`${this.selectedSenseiName()}: ${this.senseiStageLine(success)}`, 0, onComplete);
  }

  private splitSpeechPrefix(message: string): { prefix: string; spoken: string } {
    const match = message.match(/^([A-Z0-9 .'!-]+:\s)(.*)$/);
    if (!match) {
      return { prefix: "", spoken: message };
    }

    return { prefix: match[1], spoken: match[2] };
  }

  private showSenseiSpeechMessage(message: string, holdMs: number, onComplete?: () => void): void {
    this.hideSenseiSpeech();

    const bubbleX = 310;
    const bubbleY = 244;
    const bubble = this.add.rectangle(bubbleX, bubbleY, 330, 76, 0xffffff, 1)
      .setStrokeStyle(4, 0x050913, 1)
      .setDepth(SPEECH_DEPTH + 1);
    const pointer = this.add.triangle(bubbleX - 118, bubbleY + 47, 0, 0, 34, 0, 8, 28, 0xffffff, 1)
      .setDepth(SPEECH_DEPTH + 2);
    const text = this.add.text(bubbleX - 146, bubbleY - 24, "", {
      color: "#050913",
      fontSize: "18px",
      fontStyle: "bold",
      fontFamily: ARCADE_FONT,
      wordWrap: { width: 292 },
    }).setDepth(SPEECH_DEPTH + 3);

    this.speechBubble = bubble;
    this.speechPointer = pointer;
    this.speechText = text;

    bubble.setAlpha(0);
    pointer.setAlpha(0);
    text.setAlpha(0);
    this.tweens.add({
      targets: [bubble, pointer],
      alpha: 1,
      scale: { from: 0.92, to: 1 },
      duration: 180,
      ease: "Back.easeOut",
    });

    const { prefix, spoken } = this.splitSpeechPrefix(message);
    let index = 0;
    this.time.delayedCall(180, () => {
      text.setAlpha(1);
      text.setText(prefix);
      if (spoken.length <= 0) {
        return;
      }
      this.time.addEvent({
        delay: 32,
        repeat: spoken.length - 1,
        callback: () => {
          index += 1;
          text.setText(`${prefix}${spoken.slice(0, index)}`);
        },
      });
    });

    const totalMs = holdMs > 0 ? holdMs : 180 + spoken.length * 32 + 720;
    this.nextStepTimer = this.time.delayedCall(totalMs, () => {
      this.nextStepTimer = undefined;
      onComplete?.();
    });
  }

  private hideSenseiSpeech(): void {
    this.speechBubble?.destroy();
    this.speechPointer?.destroy();
    this.speechText?.destroy();
    this.speechBubble = undefined;
    this.speechPointer = undefined;
    this.speechText = undefined;
  }

  private showExaminerSpeech(speaker: "STEVE" | "GARETH", message: string): void {
    const x = speaker === "STEVE" ? 246 : 902;
    const y = 270;
    const pointerX = speaker === "STEVE" ? x + 142 : x - 142;
    const pointerPoints = speaker === "STEVE"
      ? ([0, -12, 72, 0, 0, 12] as const)
      : ([0, -12, -72, 0, 0, 12] as const);
    if (!this.examinerBubble) {
      this.examinerBubbleOutline = this.add.rectangle(x, y, 292, 60, 0x050913, 1)
        .setDepth(SPEECH_DEPTH + 3);
      this.examinerBubble = this.add.rectangle(x, y, 286, 54, 0x050913, 1)
        .setStrokeStyle(3, 0xffffff, 1)
        .setDepth(SPEECH_DEPTH + 4);
      this.examinerPointer = this.add.triangle(pointerX, y, ...pointerPoints, 0x050913, 1)
        .setDepth(SPEECH_DEPTH + 4);
      this.examinerBubbleText = this.add.text(x, y, "", {
        color: "#ffffff",
        fontSize: "16px",
        fontStyle: "bold",
        fontFamily: ARCADE_FONT,
        align: "center",
        wordWrap: { width: 250 },
      }).setOrigin(0.5).setDepth(SPEECH_DEPTH + 5);
    }

    this.examinerBubbleOutline?.setPosition(x, y);
    this.examinerBubbleOutline?.setVisible(true);
    this.examinerBubble.setPosition(x, y);
    this.examinerBubble.setVisible(true);
    this.examinerPointer?.setPosition(pointerX, y);
    this.examinerPointer?.setTo(...pointerPoints);
    this.examinerPointer?.setVisible(true);
    this.examinerBubbleText?.setPosition(x, y);
    this.examinerBubbleText?.setText(`${speaker}: ${message}`.toUpperCase());
    this.examinerBubbleText?.setVisible(true);
  }

  private hideExaminerSpeech(): void {
    this.examinerBubbleOutline?.setVisible(false);
    this.examinerBubble?.setVisible(false);
    this.examinerPointer?.setVisible(false);
    this.examinerBubbleText?.setVisible(false);
  }

  private senseiStageLine(success: boolean): string {
    if (success) {
      if (this.activePhase.id === "kake") {
        return this.activeRound.kakeAdvice;
      }

      const lines: Record<TechniquePhaseId, string[]> = {
        tsukuri: ["MOVE YOUR FEET!", "GET OFF THE LINE!"],
        kuzushi: ["TAKE BALANCE!", "USE YOUR ATEMI!"],
        kake: ["TURN YOUR HIPS!", "POSTURE!"],
      };
      return Phaser.Utils.Array.GetRandom(lines[this.activePhase.id]);
    }

    const lines: Record<TechniquePhaseId, string[]> = {
      tsukuri: ["STAND STILL!", "BLOCK WITH YOUR FACE!"],
      kuzushi: ["LET THEM KEEP BALANCE!", "ADMIRE THE PUNCH!"],
      kake: ["FORGET YOUR POSTURE!", "REAP THE FRESH AIR!"],
    };
    return Phaser.Utils.Array.GetRandom(lines[this.activePhase.id]);
  }

  private playStageResultAnimation(success: boolean, onComplete: () => void): void {
    const tori = this.playerStudent;
    const uke = this.attackerStudent;
    if (!tori || !uke) {
      onComplete();
      return;
    }

    this.tweens.killTweensOf(tori);
    this.tweens.killTweensOf(uke);

    const toriHomeX = tori.x;
    const toriHomeY = tori.y;
    const ukeHomeX = uke.x;
    const ukeHomeY = uke.y;
    const toriScaleX = tori.getData("homeScaleX") as number;
    const toriScaleY = tori.getData("homeScaleY") as number;
    const ukeScaleX = uke.getData("homeScaleX") as number;
    const ukeScaleY = uke.getData("homeScaleY") as number;

    if (this.activePhase.id === "tsukuri") {
      this.tweens.add({
        targets: uke,
        x: ukeHomeX + 24,
        scaleX: ukeScaleX * 0.96,
        scaleY: ukeScaleY * 1.04,
        duration: 180,
        ease: "Sine.easeOut",
        onComplete: () => {
          uke.setTexture("attackerHeavy");
          this.scaleSpriteToHeight(uke, UKE_TARGET_HEIGHT);
          uke.setOrigin(0.5, 1);
          this.tweens.add({
            targets: uke,
            x: ukeHomeX - 178,
            y: ukeHomeY + 4,
            rotation: -0.05,
            duration: 230,
            ease: "Cubic.easeOut",
          });
          if (success) {
            this.tweens.add({
              targets: tori,
              x: toriHomeX + 48,
              y: toriHomeY + 18,
              rotation: -0.08,
              duration: 260,
              ease: "Back.easeOut",
            });
          } else {
            tori.setTexture("studentMalePunched");
            this.scaleSpriteToHeight(tori, TORI_TARGET_HEIGHT);
            tori.setOrigin(0.5, 1);
            tori.setDepth(CHARACTER_DEPTH + 1);
            this.playDeathBounce(tori, -1);
          }
        },
      });
      this.time.delayedCall(success ? 820 : 2540, onComplete);
      return;
    }

    if (this.activePhase.id === "kuzushi") {
      this.tweens.add({
        targets: [tori, uke],
        x: (_target: Phaser.GameObjects.Image) => _target === tori ? toriHomeX + 22 : ukeHomeX + (success ? 16 : 0),
        y: (_target: Phaser.GameObjects.Image) => _target === tori ? toriHomeY : ukeHomeY,
        rotation: 0,
        scaleX: (_target: Phaser.GameObjects.Image) => _target === tori ? toriScaleX : ukeScaleX,
        scaleY: (_target: Phaser.GameObjects.Image) => _target === tori ? toriScaleY : ukeScaleY,
        duration: 220,
        ease: "Sine.easeOut",
      });
      if (!success) {
        tori.setTexture("studentMalePunched");
        this.scaleSpriteToHeight(tori, TORI_TARGET_HEIGHT);
        tori.setOrigin(0.5, 1);
        tori.setDepth(CHARACTER_DEPTH + 1);
        this.playDeathBounce(tori, -1);
      }
      this.time.delayedCall(success ? 860 : 2540, onComplete);
      return;
    }

    if (success) {
      this.tweens.add({
        targets: tori,
        x: toriHomeX + 34,
        y: toriHomeY + 8,
        duration: 220,
        ease: "Cubic.easeOut",
      });
    } else {
      this.playDeathBounce(tori, -1);
    }
    if (success) {
      uke.setTexture("attackerThrown");
      this.scaleSpriteToHeight(uke, UKE_TARGET_HEIGHT);
      uke.setOrigin(0.5, 1);
      this.playDeathBounce(uke, 1);
    } else {
      this.tweens.add({
        targets: uke,
        x: ukeHomeX - 42,
        y: ukeHomeY + 6,
        rotation: -0.1,
        alpha: 1,
        scaleX: ukeScaleX,
        scaleY: ukeScaleY,
        duration: 180,
        ease: "Sine.easeInOut",
        yoyo: true,
        repeat: 2,
      });
    }
    this.time.delayedCall(success ? 2540 : 2540, onComplete);
  }

  private playDeathBounce(sprite: Phaser.GameObjects.Image, direction: -1 | 1): void {
    this.tweens.killTweensOf(sprite);
    sprite.setVisible(true);
    sprite.setAlpha(1);

    const startY = sprite.y;
    const hops = [
      { height: 118, drift: 96, duration: 340 },
      { height: 78, drift: 48, duration: 300 },
      { height: 44, drift: 25, duration: 260 },
      { height: 22, drift: 13, duration: 230 },
      { height: 9, drift: 6, duration: 210 },
    ];

    const flash = this.time.addEvent({
      delay: 110,
      repeat: 14,
      paused: true,
      callback: () => sprite.setVisible(!sprite.visible),
    });

    const runHop = (index: number): void => {
      const hop = hops[index];
      if (!hop) {
        sprite.setVisible(true);
        sprite.setY(startY);
        this.tweens.add({
          targets: sprite,
          alpha: 0,
          duration: 420,
          ease: "Sine.easeOut",
          onComplete: () => {
            flash.remove(false);
            sprite.setVisible(false);
          },
        });
        return;
      }

      this.tweens.add({
        targets: sprite,
        x: sprite.x + direction * hop.drift,
        y: startY - hop.height,
        rotation: direction * (0.72 + index * 0.12),
        duration: hop.duration,
        ease: "Sine.easeOut",
        onComplete: () => {
          this.tweens.add({
            targets: sprite,
            x: sprite.x + direction * hop.drift * 0.42,
            y: startY,
            rotation: direction * (0.9 + index * 0.1),
            duration: hop.duration + 70,
            ease: "Sine.easeIn",
            onComplete: () => {
              if (index === 0) {
                flash.paused = false;
              }
              runHop(index + 1);
            },
          });
        },
      });
    };

    runHop(0);
  }

  private showToriConfusion(onComplete: () => void): void {
    const tori = this.playerStudent;
    if (!tori) {
      onComplete();
      return;
    }

    const cue = this.add.text(tori.x, tori.y - 244, "??!", {
      color: "#ff2438",
      fontSize: "50px",
      fontStyle: "bold",
      fontFamily: ARCADE_FONT,
      stroke: "#050913",
      strokeThickness: 8,
    }).setOrigin(0.5).setDepth(SPEECH_DEPTH + 8);
    cue.setScale(0.72);
    this.tweens.add({
      targets: cue,
      y: cue.y - 18,
      scale: 1.08,
      duration: 230,
      ease: "Back.easeOut",
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        cue.destroy();
        onComplete();
      },
    });
  }

  private completeRound(failed: boolean): void {
    this.roundsCompleted += 1;
    const allPerfect = this.activeRound.phases.every((phase) => this.phaseStatuses[phase.id] === "perfect");
    const verdict = failed
      ? "MY EYES JUST VOMITED."
      : allPerfect
        ? "NOT TOO SHABBY."
        : "IT WILL DO.";
    this.showExaminerSpeech("STEVE", verdict);
    this.scheduleGarethVerdict(failed, allPerfect);

    if (this.roundsCompleted >= TOTAL_ROUNDS) {
      this.feedbackText.setText(
        failed
          ? "FINAL ROUND FAILED - PRESS ESC TO RESET"
          : "GRADING COMPLETE - PRESS ESC TO RESET",
      );
      this.runComplete = true;
      return;
    }

    this.feedbackText.setText(
      failed
        ? `GRADING ${this.roundsCompleted} FAILED - NEXT GRADING INCOMING`
        : `GRADING ${this.roundsCompleted} COMPLETE - NEXT GRADING INCOMING`,
    );
    this.currentRoundIndex = (this.currentRoundIndex + 1) % prototypeRounds.length;
    this.currentPhaseIndex = 0;
    this.nextStepTimer = this.time.delayedCall(2600, () => {
      this.nextStepTimer = undefined;
      this.hideExaminerSpeech();
      this.startPattern();
    });
  }

  private scheduleGarethVerdict(failed: boolean, allPerfect: boolean): void {
    if (!failed && !allPerfect) {
      return;
    }

    if (Phaser.Math.FloatBetween(0, 1) > 0.42) {
      return;
    }

    this.time.delayedCall(1180, () => {
      this.showExaminerSpeech("GARETH", failed ? "WELL THAT WAS DISAPPOINTING." : "ACCEPTABLE.");
    });
  }

  private triggerWisdom(): void {
    if (this.currentSceneTime() < this.inputLockedUntil) {
      return;
    }

    if (this.runComplete || this.specialInProgress) {
      this.feedbackText.setText(this.lockedRunMessage());
      return;
    }

    if (this.activePhase.id !== "kake") {
      this.feedbackText.setText("WISDOM IS ONLY ACTIVE DURING KAKE");
      return;
    }

    if (!this.wisdom.spend()) {
      const nextPrompt = this.activePhase.prompts[this.currentBeatIndex];
      const hint = nextPrompt
        ? `NEXT RHYTHM INPUT: ${this.inputLabel(nextPrompt.input)}`
        : this.activePhase.mode === "mash"
          ? `MASH BY ALTERNATING ${this.mashLabels()}`
          : "COMPLETE A RHYTHM FIRST";
      this.feedbackText.setText(`WISDOM NOT READY - ${hint}`);
      return;
    }

    this.playWisdomSpecial();
  }

  private playWisdomSpecial(): void {
    const sensei = this.senseiMarianneSprite;
    this.specialInProgress = true;
    this.runComplete = true;
    this.feedbackText.setText("WISDOM SPECIAL!");
    this.steveText.setText("STEVE: SEE IT BEFORE IT ARRIVES!");
    this.garethText.setText("GARETH: GOOD.");
    this.updateStats();
    this.setHudDepth(SPECIAL_DEPTH + 20);

    this.specialOverlay?.destroy();
    this.specialBubble?.destroy();
    this.specialPointer?.destroy();
    this.specialText?.destroy();
    this.specialOverlay = this.add.graphics()
      .setScrollFactor(0)
      .setDepth(SPECIAL_DEPTH);
    this.specialOverlay.fillStyle(0x000000, 1);
    this.specialOverlay.fillRect(-1280, -720, 3840, 2160);
    this.specialOverlay.setAlpha(0);
    this.specialBubble = this.add.rectangle(850, 98, 386, 96, 0xffffff, 1)
      .setScrollFactor(0)
      .setStrokeStyle(5, 0x050913, 1)
      .setAlpha(0)
      .setDepth(SPECIAL_DEPTH + 3);
    this.specialPointer = this.add.triangle(712, 142, 0, 0, 54, 0, 4, 38, 0xffffff, 1)
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setAlpha(0)
      .setDepth(SPECIAL_DEPTH + 3);
    this.specialText = this.add.text(850, 98, "", {
      color: "#050913",
      fontSize: "30px",
      fontStyle: "bold",
      fontFamily: ARCADE_FONT,
      wordWrap: { width: 332 },
      align: "center",
    }).setOrigin(0.5).setScrollFactor(0).setAlpha(0).setDepth(SPECIAL_DEPTH + 4);

    if (sensei) {
      sensei.setDepth(SPECIAL_DEPTH + 2);
      this.children.bringToTop(sensei);
    }

    this.cameras.main.pan(sensei?.x ?? 164, sensei?.y ?? 406, 900, "Sine.easeInOut");
    this.cameras.main.zoomTo(1.18, 1100, "Sine.easeInOut");
    this.tweens.add({
      targets: this.specialOverlay,
      alpha: 0.86,
      duration: 850,
      ease: "Sine.easeOut",
      onComplete: () => {
        if (!sensei) {
          return;
        }

        if (this.specialOverlay) {
          this.children.bringToTop(this.specialOverlay);
        }
        this.children.bringToTop(sensei);
        this.setHudDepth(SPECIAL_DEPTH + 20);
      },
    });

    const uttering = `${this.selectedSenseiName()}: DON'T BE SHIT`;
    const { prefix, spoken } = this.splitSpeechPrefix(uttering);
    let index = 0;
    this.time.delayedCall(1900, () => {
      if (this.specialBubble && this.specialPointer && this.specialText) {
        this.children.bringToTop(this.specialBubble);
        this.children.bringToTop(this.specialPointer);
        this.children.bringToTop(this.specialText);
      }

      this.tweens.add({
        targets: [this.specialBubble, this.specialPointer],
        alpha: 1,
        duration: 220,
        ease: "Sine.easeOut",
      });
      this.tweens.add({
        targets: [this.specialBubble, this.specialPointer, this.specialText],
        x: "+=7",
        duration: 42,
        yoyo: true,
        repeat: 22,
      });
    });

    this.time.delayedCall(2180, () => {
      this.specialText?.setAlpha(1);
      this.specialText?.setText(prefix);
      if (spoken.length <= 0) {
        return;
      }
      this.time.addEvent({
        delay: 55,
        repeat: spoken.length - 1,
        callback: () => {
          index += 1;
          this.specialText?.setText(`${prefix}${spoken.slice(0, index)}`);
        },
      });
    });

    const finishSpecialAt = 2180 + spoken.length * 55 + 1100;

    this.nextStepTimer = this.time.delayedCall(finishSpecialAt + 1180, () => {
      this.nextStepTimer = undefined;
      this.applyWisdomPerfect();
    });
  }

  private applyWisdomPerfect(): void {
    this.specialOverlay?.destroy();
    this.specialBubble?.destroy();
    this.specialPointer?.destroy();
    this.specialText?.destroy();
    this.specialOverlay = undefined;
    this.specialBubble = undefined;
    this.specialPointer = undefined;
    this.specialText = undefined;
    this.cameras.main.pan(640, 360, 460, "Sine.easeOut");
    this.cameras.main.zoomTo(1, 460, "Sine.easeOut");
    this.resetSensei(this.senseiMarianneSprite);
    this.setHudDepth(UI_DEPTH + 1);

    this.phaseHadNonPerfect = false;
    if (this.activePhase.mode === "mash") {
      this.mashPresses = Math.max(this.mashPresses, this.activePhase.mashTarget ?? 10);
      this.currentPhaseScore = Math.max(this.currentPhaseScore, this.mashPresses * 10 + 100);
    } else {
      const scoreByPrompt = 100;
      this.currentPhaseSuccessfulHits = this.activePhase.prompts.length;
      this.activePhase.prompts.forEach((_prompt, index) => {
        if (this.beatTiles[index]) {
          this.beatTiles[index].judgement = "PERFECT";
        }
      });
      this.currentBeatIndex = this.activePhase.prompts.length;
      this.currentPhaseScore = Math.max(this.currentPhaseScore, this.activePhase.prompts.length * scoreByPrompt);
    }

    this.phaseScores[this.activePhase.id] = this.currentPhaseScore;
    this.time.delayedCall(520, () => this.restoreOneHeart(true));
    this.time.delayedCall(980, () => {
      this.specialInProgress = false;
      this.skipNextSenseiSpeech = true;
      this.runComplete = false;
      this.updateStats();
      this.showJudgementGraphic("PERFECT");
      this.renderPhaseVisual("PERFECT");
      this.completePhase();
    });
  }

  private restoreOneHeart(showSplash = false): void {
    if (this.failures <= 0) {
      return;
    }

    this.failures -= 1;
    this.lostLifeIndexes.delete(this.failures);
    const heart = this.lifeIcons[this.failures];
    if (!heart) {
      return;
    }

    this.tweens.killTweensOf(heart);
    heart.setText("♥");
    heart.setFontSize(38);
    heart.setColor("#ff4d63");
    heart.setAlpha(1);
    heart.setScale(1);
    heart.setVisible(true);
    heart.setPosition(heart.getData("homeX") as number, heart.getData("homeY") as number);
    this.tweens.add({
      targets: heart,
      scale: 1.28,
      duration: 150,
      yoyo: true,
      ease: "Back.easeOut",
    });

    if (showSplash) {
      const restoredHeart = this.add.text(640, 438, "♥ RESTORED", {
        color: "#ff4d63",
        fontSize: "50px",
        fontFamily: ARCADE_FONT,
        fontStyle: "bold",
        stroke: "#050913",
        strokeThickness: 10,
      }).setOrigin(0.5).setDepth(SPECIAL_DEPTH + 5);
      this.tweens.add({
        targets: restoredHeart,
        scale: 1.16,
        duration: 260,
        yoyo: true,
        repeat: 1,
        ease: "Back.easeOut",
        onComplete: () => {
          this.tweens.add({
            targets: restoredHeart,
            alpha: 0,
            duration: 420,
            onComplete: () => restoredHeart.destroy(),
          });
        },
      });
    }
  }

  private setHudDepth(depth: number): void {
    this.hudObjects.forEach((object) => {
      const depthObject = object as Phaser.GameObjects.GameObject & { setDepth?: (value: number) => void };
      depthObject.setDepth?.(depth);
      this.children.bringToTop(object);
    });
  }

  private updateStats(): void {
    this.refreshScoreLabels();
    this.updateLives();
    this.renderPhaseOverlay();
  }

  private refreshScoreLabels(): void {
    this.statsText.setText(
      `SCORE ${this.score}   X${this.scoreMultiplier}   WIS ${this.wisdom.current}/100`,
    );
    this.scoreText?.setText(`SCORE ${this.score.toString().padStart(6, "0")}   X${this.scoreMultiplier}`);
    if (this.wisdomFill) {
      this.wisdomFill.width = Math.round((this.wisdom.current / 100) * 164);
    }
    this.multiplierText?.setText(`MULTIPLIER X${this.scoreMultiplier}`);
  }

  private renderWisdomMeter(): void {
    if (!this.wisdomFill) {
      return;
    }

    if (!this.wisdom.isReady) {
      this.wisdomFill.setAlpha(1);
      this.wisdomFill.setFillStyle(0xfff044);
      return;
    }

    if (this.activePhase.id !== "kake") {
      this.wisdomFill.setAlpha(1);
      this.wisdomFill.setFillStyle(0xfff044);
      return;
    }

    const pulse = 0.55 + Math.sin(this.currentSceneTime() / 75) * 0.35;
    this.wisdomFill.setAlpha(Phaser.Math.Clamp(pulse, 0.32, 1));
    this.wisdomFill.setFillStyle(this.currentSceneTime() % 220 < 110 ? 0xfff044 : 0x00e7ff);
  }

  private updateLives(): void {
    this.lifeIcons.forEach((heart, index) => {
      const isLost = index < this.failures;
      if (!isLost) {
        this.tweens.killTweensOf(heart);
        heart.setText("♥");
        heart.setFontSize(38);
        heart.setColor("#ff4d63");
        heart.setAlpha(1);
        heart.setScale(1);
        heart.setVisible(true);
        heart.setX(heart.getData("homeX") as number);
        heart.setY(heart.getData("homeY") as number);
        return;
      }

      heart.setText("♡");
      heart.setFontSize(28);
      heart.setColor("#5c6670");
      heart.setScale(1);
      heart.setVisible(true);
      heart.setX(heart.getData("homeX") as number);
      heart.setY(heart.getData("homeY") as number);
      heart.setAlpha(this.failures >= MAX_FAILURES - 1 ? 0.25 + Math.abs(Math.sin(this.currentSceneTime() / 120)) * 0.62 : 0.72);
    });
  }

  private animateLifeLost(index: number): void {
    const heart = this.lifeIcons[index];
    if (!heart || this.lostLifeIndexes.has(index)) {
      return;
    }

    this.lostLifeIndexes.add(index);
    this.tweens.killTweensOf(heart);
    heart.setText("♡");
    heart.setFontSize(28);
    heart.setColor("#5c6670");
    heart.setAlpha(0.72);
    heart.setScale(1);

    const burstHeart = this.add.text(heart.x, heart.y, "♥", {
      color: "#ff4d63",
      fontSize: "38px",
      fontFamily: '"Arial Black", Arial, sans-serif',
      fontStyle: "bold",
      stroke: "#050913",
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(UI_DEPTH + 6);

    this.time.addEvent({
      delay: 82,
      repeat: 5,
      callback: () => burstHeart.setVisible(!burstHeart.visible),
    });

    this.time.delayedCall(560, () => {
      burstHeart.setVisible(true);
      this.tweens.add({
        targets: burstHeart,
        scale: 3.2,
        angle: 8,
        y: burstHeart.y - 18,
        alpha: 0,
        duration: 520,
        ease: "Cubic.easeOut",
        onComplete: () => burstHeart.destroy(),
      });
    });
  }

  private resetLostHeartAnimation(index: number): void {
    const heart = this.lifeIcons[index];
    if (!heart) {
      return;
    }

    heart.setText("♡");
    heart.setColor("#5c6670");
    heart.setAlpha(0.72);
    heart.setScale(1);
    heart.setVisible(true);
    heart.setPosition(heart.getData("homeX") as number, heart.getData("homeY") as number);
  }

  private fadeAndRemoveSprite(sprite: Phaser.GameObjects.GameObject & { setAlpha: (alpha: number) => unknown }): void {
    this.tweens.add({
      targets: sprite,
      alpha: 0,
      duration: 200,
      onComplete: () => sprite.destroy(),
    });
  }

  private updateBeltLadder(): void {
    const activeIndex = grades.findIndex((grade) => grade.id === this.activeRound.grade);
    this.beltGradingText?.setText(this.bottomGradingLabel());
    if (activeIndex >= 0) {
      this.beltSelectionBox.setX(468 + activeIndex * 43);
    }

    this.beltMarkers.forEach((marker, index) => {
      const isActive = grades[index]?.id === this.activeRound.grade;
      marker.setDisplaySize(isActive ? 30 : 28, isActive ? 30 : 28);
      marker.setAlpha(isActive ? 1 : 0.72);
    });
  }

  private addPhasePoints(points: number): void {
    if (points <= 0) {
      this.phaseScores[this.activePhase.id] = this.currentPhaseScore;
      this.renderPhaseOverlay();
      return;
    }

    this.currentPhaseScore += points;
    this.phaseScores[this.activePhase.id] = this.currentPhaseScore;
    this.renderPhaseOverlay();
  }

  private bankTechniqueScore(onComplete: () => void): void {
    const multiplier = this.scoreMultiplier;
    const baseScore = this.roundScore;
    const bankedScore = baseScore * multiplier;
    this.renderPhaseOverlay();

    this.showScoreCalculation(`TECHNIQUE ${baseScore}`, () => {
      this.showScoreCalculation(`MULTIPLIER X${multiplier}`, () => {
        this.showScoreCalculation(`${baseScore} X ${multiplier} = ${bankedScore}`, () => {
      const targetX = this.scoreText?.x ?? 164;
      const targetY = this.scoreText?.y ?? 54;
      const pointsText = this.add.text(640, 360, `+${bankedScore}`, {
        color: "#fff0a3",
        fontSize: "66px",
        fontStyle: "bold",
        fontFamily: ARCADE_FONT,
        stroke: "#050913",
        strokeThickness: 10,
      }).setOrigin(0.5);
      pointsText.setDepth(70);

      this.tweens.add({
        targets: pointsText,
        x: targetX + 86,
        y: targetY + 8,
        scale: 0.24,
        alpha: 0.88,
        duration: 820,
        ease: "Cubic.easeInOut",
        onComplete: () => {
          this.score += bankedScore;
          this.scoreMultiplier = multiplier + 1;
          this.updateStats();
          pointsText.destroy();
          onComplete();
        },
      });
        });
      });
    });
  }

  private dropTechniqueScore(): void {
    this.renderPhaseOverlay();
    if (this.roundScore <= 0) {
      this.updateStats();
      return;
    }

    const droppedText = this.add.text(640, 360, `${this.roundScore}`, {
      color: "#ff4d63",
      fontSize: "54px",
      fontStyle: "bold",
      fontFamily: ARCADE_FONT,
      stroke: "#050913",
      strokeThickness: 10,
    }).setOrigin(0.5);
    droppedText.setDepth(70);

    this.tweens.add({
      targets: droppedText,
      y: 830,
      alpha: 0,
      scale: 0.7,
      duration: 900,
      ease: "Cubic.easeIn",
      onComplete: () => droppedText.destroy(),
    });
    this.updateStats();
  }

  private showScoreCalculation(message: string, onComplete: () => void): void {
    const calculationText = this.add.text(640, 360, "", {
      color: "#fff0a3",
      fontSize: "52px",
      fontStyle: "bold",
      fontFamily: ARCADE_FONT,
      stroke: "#050913",
      strokeThickness: 10,
    }).setOrigin(0.5);
    calculationText.setDepth(70);

    let index = 0;
    this.time.addEvent({
      delay: 38,
      repeat: message.length - 1,
      callback: () => {
        index += 1;
        calculationText.setText(message.slice(0, index));
      },
    });
    this.time.delayedCall(message.length * 38 + 520, () => {
      calculationText.destroy();
      onComplete();
    });
  }

  private showJudgementGraphic(judgement: TimingJudgement): void {
    const labelByJudgement: Record<TimingJudgement, string> = {
      PERFECT: "PERFECT!",
      GOOD: "GOOD!",
      LATE: "GOOD!",
      MISS: "BAD!",
    };
    const colorByJudgement: Record<TimingJudgement, string> = {
      PERFECT: "#56ff45",
      GOOD: "#4db7ff",
      LATE: "#4db7ff",
      MISS: "#ff4d63",
    };
    const splash = this.add.text(640, 612, labelByJudgement[judgement], {
      color: colorByJudgement[judgement],
      fontSize: "48px",
      fontStyle: "bold",
      fontFamily: ARCADE_FONT,
      stroke: "#050913",
      strokeThickness: 9,
    }).setOrigin(0.5);
    splash.setDepth(55);
    splash.setScale(1.14);

    this.tweens.add({
      targets: splash,
      y: 588,
      scale: 0.92,
      alpha: 0,
      duration: 620,
      ease: "Cubic.easeOut",
      onComplete: () => splash.destroy(),
    });
  }

  private raiseUi(): void {
    [
      this.mangaPanel,
      this.mangaPunch,
      this.mangaBurst,
      this.phaseText,
      this.gradingText,
      this.actionText,
      this.promptText,
      this.timingGuideText,
      this.timingTrack,
      this.timingCursor,
      this.playerTwoTimingTrack,
      this.playerTwoTimingCursor,
      this.fireText,
      this.countdownText,
      this.gameOverText,
      this.feedbackText,
      this.statsText,
      this.scoreText,
      this.techniqueTitleText,
      this.multiplierText,
      this.beltSelectionBox,
      this.beltGradingText,
      this.steveText,
      this.garethText,
    ].forEach((item) => {
      if (item) {
        item.setDepth(UI_DEPTH + 1);
        this.children.bringToTop(item);
      }
    });

    this.beltMarkers.forEach((marker) => {
      marker.setDepth(UI_DEPTH + 2);
      this.children.bringToTop(marker);
    });
    this.beltSelectionBox.setDepth(UI_DEPTH + 1);
    this.children.bringToTop(this.beltSelectionBox);
    this.beltMarkers.forEach((marker) => this.children.bringToTop(marker));

    this.phaseOverlayItems.forEach((item) => {
      item.box.setDepth(UI_DEPTH + 1);
      item.label.setDepth(UI_DEPTH + 2);
      item.icon.setDepth(UI_DEPTH + 2);
      item.iconSprite.setDepth(UI_DEPTH + 2);
      item.status.setDepth(UI_DEPTH + 2);
      this.children.bringToTop(item.box);
      this.children.bringToTop(item.label);
      this.children.bringToTop(item.icon);
      this.children.bringToTop(item.iconSprite);
      this.children.bringToTop(item.status);
    });

    this.beatTiles.forEach((tile) => {
      tile.goodWindow.setDepth(UI_DEPTH + 2);
      tile.perfectWindow.setDepth(UI_DEPTH + 3);
      tile.box.setDepth(UI_DEPTH + 4);
      tile.label.setDepth(UI_DEPTH + 5);
      tile.promptIcon.setDepth(UI_DEPTH + 5);
      tile.resultSprite.setDepth(UI_DEPTH + 5);
      this.children.bringToTop(tile.goodWindow);
      this.children.bringToTop(tile.perfectWindow);
      this.children.bringToTop(tile.box);
      this.children.bringToTop(tile.label);
      this.children.bringToTop(tile.promptIcon);
      this.children.bringToTop(tile.resultSprite);
    });
  }

  private renderPhaseOverlay(): void {
    this.phaseOverlayItems.forEach((item) => {
      const state = item.player === 1 ? this.phaseStatuses[item.phaseId] ?? "pending" : "pending";
      const style = this.phaseStatusVisual(state);
      const score = item.player === 1 ? this.phaseScores[item.phaseId] ?? 0 : 0;
      item.box.setFillStyle(0x000000, 0);
      item.box.setStrokeStyle(0, style.stroke, 0);
      item.label.setColor(state === "pending" ? "#f5f2eb" : style.color);
      item.status.setText(state === "pending" ? "-" : score.toString());
      item.status.setColor(score > 0 ? "#fff0a3" : style.color);
      const iconTexture = this.phaseStatusTexture(state);
      item.iconSprite.setVisible(iconTexture !== undefined);
      if (iconTexture) {
        item.iconSprite.setTexture(iconTexture);
        item.iconSprite.setDisplaySize(state === "perfect" ? 30 : 26, state === "perfect" ? 30 : 26);
      }
      item.icon.setVisible(iconTexture === undefined);
      item.icon.setText(style.icon);
      item.icon.setColor(style.color);
    });
  }

  private animatePhaseStatus(phaseId: TechniquePhaseId, status: PhaseStatus): void {
    const target = this.phaseOverlayItems.find((item) => item.player === 1 && item.phaseId === phaseId);
    if (!target || status === "active" || status === "pending") {
      return;
    }

    const style = this.phaseStatusVisual(status);
    target.icon.setAlpha(0);
    target.status.setAlpha(0);

    const splash = this.add.text(640, 360, `${style.icon} ${style.text.toUpperCase()}`, {
      color: style.color,
      fontSize: "72px",
      fontStyle: "bold",
      fontFamily: ARCADE_FONT,
      stroke: "#17191d",
      strokeThickness: 12,
    }).setOrigin(0.5);
    splash.setDepth(50);
    splash.setScale(1.18);

    this.tweens.add({
      targets: splash,
      x: target.icon.x + 22,
      y: target.icon.y,
      scale: 0.18,
      duration: 720,
      ease: "Cubic.easeInOut",
      onComplete: () => {
        splash.destroy();
        target.icon.setAlpha(1);
        target.status.setAlpha(1);
      },
    });
  }

  private phaseStatusVisual(status: PhaseStatus): {
    fill: number;
    stroke: number;
    icon: string;
    text: string;
    color: string;
  } {
    const palette: Record<PhaseStatus, { fill: number; stroke: number; icon: string; text: string; color: string }> = {
      pending: { fill: 0x20242a, stroke: 0x71807d, icon: "-", text: "-", color: "#b9c3c0" },
      active: { fill: 0x303824, stroke: 0xfff0a3, icon: ">", text: "now", color: "#fff0a3" },
      failed: { fill: 0x4a1f25, stroke: 0xffb2ba, icon: "✖", text: "failed", color: "#ff8d96" },
      good: { fill: 0x214639, stroke: 0xcff6df, icon: "✔", text: "good", color: "#8ee6a1" },
      perfect: { fill: 0x3a3424, stroke: 0xffffff, icon: "🔥✔", text: "perfect", color: "#ffd166" },
    };

    return palette[status];
  }

  private phaseStatusTexture(status: PhaseStatus): string | undefined {
    const textures: Partial<Record<PhaseStatus, string>> = {
      failed: "iconBad",
      good: "iconGood",
      perfect: "iconPerfect",
    };

    return textures[status];
  }

  private randomMashInputs(): PromptInput[] {
    const first = Phaser.Utils.Array.GetRandom(ALL_INPUTS);
    const second = Phaser.Utils.Array.GetRandom(ALL_INPUTS.filter((input) => input !== first));
    return [first, second];
  }

  private createBeatTiles(pattern: TechniquePhase): void {
    this.beatTiles.forEach(({ box, label, promptIcon, resultSprite, goodWindow, perfectWindow }) => {
      box.destroy();
      label.destroy();
      promptIcon.destroy();
      resultSprite.destroy();
      goodWindow.destroy();
      perfectWindow.destroy();
    });
    this.beatTiles = [];

    const duration = this.patternDuration(pattern);
    const startX = this.timingTrack.x - this.timingTrack.width / 2;
    const prompts = pattern.mode === "mash"
      ? this.activeMashInputs.map((input, index, inputs) => ({
          atMs: duration * (0.5 + (index - (inputs.length - 1) / 2) * 0.18),
          input,
        }))
      : pattern.prompts;

    prompts.forEach((prompt) => {
      const x = startX + (prompt.atMs / duration) * this.timingTrack.width;
      const endX = startX + this.timingTrack.width;
      const iconY = this.timingTrack.y - 32;
      const window = pattern.mode === "mash" ? DEFAULT_WINDOW : pattern.timingWindow ?? DEFAULT_WINDOW;
      const pxPerMs = this.timingTrack.width / duration;
      const laneHeight = 8;
      const rawGoodWidth = window.goodMs * 2 * pxPerMs;
      const goodLeft = Phaser.Math.Clamp(x - rawGoodWidth / 2, startX, endX);
      const goodRight = Phaser.Math.Clamp(x + rawGoodWidth / 2, startX, endX);
      const goodWindow = this.add.rectangle(
        (goodLeft + goodRight) / 2,
        this.timingTrack.y,
        Math.max(4, goodRight - goodLeft),
        laneHeight,
        0x36ff7a,
        0.28,
      );
      const perfectWindow = this.add.rectangle(x, this.timingTrack.y, 4, laneHeight + 12, 0xfff044, 1);
      goodWindow.setVisible(pattern.mode !== "mash");
      perfectWindow.setVisible(pattern.mode !== "mash");
      const box = this.add.rectangle(x, iconY, 34, 34, 0x000000, 0);
      box.setStrokeStyle(0, 0xffffff, 0);
      const label = this.add.text(x, iconY, this.inputLabel(prompt.input), {
        color: "#ffffff",
        fontSize: prompt.input === "X" ? "20px" : "30px",
        fontStyle: "bold",
        fontFamily: ARCADE_FONT,
        stroke: "#050913",
        strokeThickness: 4,
      }).setOrigin(0.5);
      label.setVisible(false);
      const promptIcon = this.add.image(x, iconY, this.inputIconTexture(prompt.input))
        .setDisplaySize(50, 42);
      const resultSprite = this.add.image(x, iconY, "iconGood")
        .setDisplaySize(38, 38)
        .setVisible(false);
      this.beatTiles.push({ box, label, promptIcon, resultSprite, goodWindow, perfectWindow, input: prompt.input });
    });
  }

  private renderTimingLane(): void {
    if (!this.timingTrack || !this.timingCursor || this.beatTiles.length === 0) {
      return;
    }

    const pattern = this.activePhase;
    const rawElapsedMs = this.currentSceneTime() - this.patternStartedAt;
    const elapsedMs = this.phaseElapsedMs();
    const duration = this.patternDuration(pattern);
    const startX = this.timingTrack.x - this.timingTrack.width / 2;
    const progress = Phaser.Math.Clamp(elapsedMs / duration, 0, 1);

    this.timingCursor.setX(startX + progress * this.timingTrack.width);
    if (this.playerTwoTimingTrack && this.playerTwoTimingCursor) {
      const playerTwoStartX = this.playerTwoTimingTrack.x - this.playerTwoTimingTrack.width / 2;
      this.playerTwoTimingCursor.setX(playerTwoStartX + progress * this.playerTwoTimingTrack.width);
    }
    this.timingCursor.setDisplaySize(pattern.mode === "mash" ? 12 : 9, pattern.mode === "mash" ? 28 : 24);
    this.playerTwoTimingCursor?.setDisplaySize(pattern.mode === "mash" ? 12 : 9, pattern.mode === "mash" ? 28 : 24);
    this.timingCursor.setFillStyle(pattern.mode === "mash" ? 0xff7a2f : 0xfff0a3);
    this.playerTwoTimingCursor?.setFillStyle(pattern.mode === "mash" ? 0xff7a2f : 0x8aa8ff, 0.75);
    this.timingTrack.setFillStyle(pattern.mode === "mash" ? 0x32180f : 0x11151a);
    this.playerTwoTimingTrack?.setFillStyle(pattern.mode === "mash" ? 0x32180f : 0x11151a);
    this.timingTrack.setStrokeStyle(2, pattern.mode === "mash" ? 0xff7a2f : 0xe1d6b8, pattern.mode === "mash" ? 1 : 0.8);
    this.playerTwoTimingTrack?.setStrokeStyle(2, pattern.mode === "mash" ? 0xff7a2f : 0x8aa8ff, pattern.mode === "mash" ? 0.75 : 0.55);
    this.fireText.setVisible(false);
    this.fireText.setScale(pattern.mode === "mash" ? 1 + Math.min(this.mashPresses, 12) * 0.015 : 1);
    this.renderCountdown(rawElapsedMs);

    if (pattern.mode === "mash") {
      this.renderMashLane(elapsedMs, duration);
      return;
    }

    if (!this.runComplete) {
      this.advanceExpiredPrompts();
    }

    const prompt = pattern.prompts[this.currentBeatIndex];
    const window = this.activeWindow();
    if (this.runComplete) {
      this.timingGuideText.setText(this.nextRunLabel());
    } else if (!prompt) {
      this.timingGuideText.setText("SEQUENCE COMPLETE");
    } else {
      const delta = elapsedMs - prompt.atMs;
      const label = this.inputLabel(prompt.input);
      if (elapsedMs < 0) {
        this.timingGuideText.setText(this.markerLeadInLine());
      } else if (delta < -window.lateMs) {
        this.timingGuideText.setText(`NEXT: ${label}`);
      } else if (Math.abs(delta) <= window.perfectMs) {
        this.timingGuideText.setText(`PERFECT: ${label}`);
      } else if (Math.abs(delta) <= window.goodMs) {
        this.timingGuideText.setText(`HIT: ${label}`);
      } else if (delta <= window.lateMs) {
        this.timingGuideText.setText(`LATE: ${label}`);
      } else {
        this.timingGuideText.setText(`MISSED: ${label}`);
      }
    }

    this.beatTiles.forEach((tile, index) => {
      const beat = pattern.prompts[index];
      const delta = elapsedMs - beat.atMs;
      const isCurrent = index === this.currentBeatIndex;
      const isDone = tile.judgement !== undefined || index < this.currentBeatIndex;
      const inPerfectWindow = isCurrent && Math.abs(delta) <= window.perfectMs;

      tile.box.setFillStyle(0x000000, 0);
      tile.box.setVisible(inPerfectWindow);
      tile.box.setStrokeStyle(inPerfectWindow ? 5 : 0, 0xffffff, inPerfectWindow ? 1 : 0);
      tile.goodWindow.setAlpha(isCurrent ? 0.34 : 0.22);
      tile.perfectWindow.setAlpha(1);
      tile.label.setVisible(false);
      tile.promptIcon.setVisible(tile.judgement === undefined);
      tile.promptIcon.setAlpha(isDone ? 0.72 : 1);
      tile.promptIcon.setScale(inPerfectWindow ? 1.1 : 1);
      tile.resultSprite.setVisible(tile.judgement !== undefined);
      if (tile.judgement !== undefined) {
        tile.resultSprite.setTexture(this.judgementTexture(tile.judgement));
        tile.resultSprite.setDisplaySize(tile.judgement === "PERFECT" ? 44 : 38, tile.judgement === "PERFECT" ? 44 : 38);
      }
    });
  }

  private renderMashLane(elapsedMs: number, duration: number): void {
    if (!this.runComplete && elapsedMs >= duration) {
      this.completeMashPhase();
    }

    const target = this.activePhase.mashTarget ?? 10;
    const nextInput = this.nextMashInput();

    if (this.runComplete) {
      this.timingGuideText.setText(this.nextRunLabel());
    } else if (elapsedMs < 0) {
      this.timingGuideText.setText(this.markerLeadInLine());
    } else {
      this.timingGuideText.setText(`MASH ${this.mashLabels()}   ${this.mashPresses}/${target}`);
    }

    this.beatTiles.forEach((tile) => {
      const passed = this.mashPresses >= target;
      const isActiveMash = !this.runComplete && elapsedMs >= 0 && elapsedMs < duration;
      const iconIndex = this.beatTiles.indexOf(tile);
      const flashOn = Math.floor(this.currentSceneTime() / 145 + iconIndex) % 2 === 0;

      tile.box.setFillStyle(0x000000, 0);
      tile.box.setVisible(false);
      tile.box.setStrokeStyle(0, 0xffffff, 0);
      tile.goodWindow.setVisible(false);
      tile.perfectWindow.setVisible(false);
      tile.label.setVisible(false);
      tile.promptIcon.setTexture(this.inputIconTexture(tile.input));
      tile.promptIcon.setAlpha(passed ? 0.88 : 1);
      tile.promptIcon.setScale(1);
      tile.promptIcon.setVisible(!isActiveMash || flashOn);
      tile.resultSprite.setVisible(false);
    });
  }

  private patternDuration(pattern: TechniquePhase): number {
    if (pattern.durationMs !== undefined) {
      return pattern.durationMs;
    }

    const finalBeat = pattern.prompts.at(-1)?.atMs ?? 0;
    return finalBeat + 900;
  }

  private tileLabel(tile: BeatTile): string {
    if (tile.judgement === "MISS") {
      return "✖";
    }

    if (tile.judgement === "PERFECT") {
      return "🔥";
    }

    if (tile.judgement === "GOOD" || tile.judgement === "LATE") {
      return "✔";
    }

    return this.inputLabel(tile.input);
  }

  private inputIconTexture(input: PromptInput): string {
    const textures: Record<PromptInput, string> = {
      LEFT: "inputLeft",
      DOWN: "inputDown",
      RIGHT: "inputRight",
      X: "inputX",
    };

    return textures[input];
  }

  private judgementTexture(judgement: TimingJudgement): string {
    if (judgement === "MISS") {
      return "iconBad";
    }

    if (judgement === "PERFECT") {
      return "iconPerfect";
    }

    return "iconGood";
  }

  private activeWindow(): RhythmWindow {
    return this.activePhase.timingWindow ?? DEFAULT_WINDOW;
  }

  private phaseElapsedMs(): number {
    const rawElapsedMs = this.currentSceneTime() - this.patternStartedAt;
    if (rawElapsedMs <= 0 || this.activePhase.id !== "tsukuri") {
      return rawElapsedMs;
    }

    return rawElapsedMs * TSUKURI_SPEED_MULTIPLIER;
  }

  private currentSceneTime(): number {
    return this.game.loop.time || this.time.now;
  }

  private mashLabels(): string {
    return this.activeMashInputs.map((input) => this.inputLabel(input)).join(" + ");
  }

  private nextMashInput(): PromptInput {
    const mashInputs = this.activeMashInputs;
    if (this.lastMashInput === undefined) {
      return mashInputs[0];
    }

    return mashInputs.find((input) => input !== this.lastMashInput) ?? mashInputs[0];
  }

  private nextMashLabel(): string {
    return this.inputLabel(this.nextMashInput());
  }

  private bottomGradingLabel(): string {
    if (this.activeRound.grade === "white") {
      return "NOVICE GRADING";
    }

    const grade = grades.find((gradeInfo) => gradeInfo.id === this.activeRound.grade);
    return `${grade?.label.toUpperCase() ?? this.activeRound.grade.toUpperCase()} BELT GRADING`;
  }

  private spokenTechniqueName(): string {
    return this.activeRound.technique.toUpperCase();
  }

  private techniqueTitle(): string {
    const phaseTitles: Record<TechniquePhaseId, string> = {
      tsukuri: "TSUKURI: MOVEMENT ENTRY",
      kuzushi: "KUZUSHI: BALANCE BREAKING",
      kake: `KAKE: ${this.activeRound.technique}`,
    };

    return phaseTitles[this.activePhase.id].toUpperCase();
  }

  private nextRunLabel(): string {
    if (this.roundsCompleted >= TOTAL_ROUNDS) {
      return "COMPLETE";
    }

    return this.currentPhaseIndex >= this.activeRound.phases.length - 1 ? "NEXT GRADING" : "NEXT PHASE";
  }

  private lockedRunMessage(): string {
    if (this.roundsCompleted >= TOTAL_ROUNDS) {
      return "GRADING COMPLETE - PRESS ESC TO RESET";
    }

    return `${this.nextRunLabel()} INCOMING`;
  }

  private markerLeadInLine(): string {
    return this.currentPhaseIndex === 0 ? "MARKER STARTS AFTER YOSHIN!" : "MARKER STARTS SHORTLY";
  }

  private renderCountdown(elapsedMs: number): void {
    if (elapsedMs >= 0) {
      this.countdownText.setText("");
      this.lastCountdownMessage = "";
      return;
    }

    if (this.currentPhaseIndex > 0) {
      this.countdownText.setText("");
      this.lastCountdownMessage = "";
      return;
    }

    const introElapsedMs = Phaser.Math.Clamp(ROUND_INTRO_MS + elapsedMs, 0, ROUND_INTRO_MS);
    let message: string;
    let isStartCall = false;

    if (introElapsedMs < GRADING_NOTICE_MS) {
      message = this.activeRound.gradingTitle.toUpperCase();
      this.hideExaminerSpeech();
    } else if (introElapsedMs < GRADING_NOTICE_MS + STEVE_NOTICE_MS) {
      message = "";
      this.countdownText.setText("");
      this.showExaminerSpeech("STEVE", this.activeRound.steveIntro ?? `LET'S SEE ${this.spokenTechniqueName()}!`);
    } else if (introElapsedMs < GRADING_NOTICE_MS + STEVE_NOTICE_MS + GARETH_NOTICE_MS) {
      message = "";
      this.countdownText.setText("");
      this.showExaminerSpeech("GARETH", "...");
    } else if (introElapsedMs < GRADING_NOTICE_MS + STEVE_NOTICE_MS + GARETH_NOTICE_MS + YOI_NOTICE_MS) {
      message = "YOI!";
      isStartCall = true;
      this.hideExaminerSpeech();
    } else {
      message = "YOSHIN!";
      isStartCall = true;
      this.hideExaminerSpeech();
    }

    if (message === "") {
      this.lastCountdownMessage = "";
      return;
    }

    if (message !== this.lastCountdownMessage) {
      this.lastCountdownMessage = message;
      this.countdownText.setText(message);
      this.countdownText.setColor(isStartCall ? "#00e7ff" : "#fff0a3");
      this.countdownText.setStroke("#050913", isStartCall ? 13 : 10);
      this.countdownText.setAlpha(0);
      this.countdownText.setScale(message.length > 8 ? 1.34 : 1.75);
      this.tweens.add({
        targets: this.countdownText,
        alpha: 1,
        scale: message.length > 8 ? 0.78 : 1,
        duration: 280,
        ease: "Back.easeOut",
      });
    }
  }

  private inputLabel(input: PromptInput): string {
    const labels: Record<PromptInput, string> = {
      LEFT: "◀",
      DOWN: "▼",
      RIGHT: "▶",
      X: "X",
    };
    return labels[input];
  }

  private advanceExpiredPrompts(): void {
    if (this.activePhase.mode === "mash") {
      return;
    }

    const elapsedMs = this.phaseElapsedMs();
    const window = this.activeWindow();

    while (this.currentBeatIndex < this.activePhase.prompts.length) {
      const prompt = this.activePhase.prompts[this.currentBeatIndex];
      if (elapsedMs <= prompt.atMs + window.lateMs) {
        break;
      }

      this.beatTiles[this.currentBeatIndex].judgement = "MISS";
      this.phaseHadNonPerfect = true;
      this.currentBeatIndex += 1;

      if (this.activePhase.failOnBadTiming) {
        this.failPhase();
        return;
      }
    }

    if (this.currentBeatIndex >= this.activePhase.prompts.length) {
      this.completePhase();
    }
  }

  private resetGame(): void {
    this.nextStepTimer?.remove();
    this.nextStepTimer = undefined;
    this.hideSenseiSpeech();
    this.specialOverlay?.destroy();
    this.specialBubble?.destroy();
    this.specialPointer?.destroy();
    this.specialText?.destroy();
    this.specialOverlay = undefined;
    this.specialBubble = undefined;
    this.specialPointer = undefined;
    this.specialText = undefined;
    this.cameras.main.setZoom(1);
    this.cameras.main.centerOn(640, 360);
    this.setHudDepth(UI_DEPTH + 1);
    this.currentRoundIndex = 0;
    this.currentPhaseIndex = 0;
    this.currentBeatIndex = 0;
    this.runComplete = false;
    this.specialInProgress = false;
    this.skipNextSenseiSpeech = false;
    this.roundsCompleted = 0;
    this.phaseFailed = false;
    this.mashPresses = 0;
    this.lastMashInput = undefined;
    this.failures = 0;
    this.lostLifeIndexes.clear();
    this.score = 0;
    this.scoreMultiplier = 1;
    this.roundScore = 0;
    this.currentPhaseScore = 0;
    this.phaseScores = {};
    this.phaseStatuses = {};
    this.beatTiles = [];
    this.phaseOverlayItems = [];
    this.beltMarkers = [];
    this.lifeIcons = [];
    this.gameOverText?.setVisible(false);
    this.wisdom.reset();
    this.scene.restart({ selectedSensei: this.selectedSensei });
  }

  private phaseCompletionLine(): string {
    if (this.activePhase.id === "tsukuri") {
      return "STEVE: GOOD. YOU MOVED YOUR FEET. NOW DO SOMETHING USEFUL WITH IT.";
    }

    if (this.activePhase.id === "kuzushi") {
      return "STEVE: THAT'S BALANCE. NOW FINISH THE TECHNIQUE.";
    }

    return "STEVE: BETTER. KEEP MOVING, KEEP BREATHING, DO NOT ADMIRE IT.";
  }

  private renderPhaseVisual(_state: TimingJudgement | "ready"): void {
    this.mangaPanel.setAlpha(0);
    this.mangaPanel.setStrokeStyle(0, 0x111111, 0);
    this.mangaPunch.setAlpha(0);
    this.mangaBurst.setAlpha(0);
    this.actionText.setText("");
  }
}
