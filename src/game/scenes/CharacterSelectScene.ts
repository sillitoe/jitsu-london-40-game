import Phaser from "phaser";
import type { PlayableSenseiId } from "../types";

const ARCADE_FONT = '"Courier New", "Monaco", monospace';
const SELECT_BLUE = 0x00e7ff;

interface SenseiChoice {
  id: PlayableSenseiId;
  name: string;
  dan: string;
  portraitKey: string;
  flipX: boolean;
}

const SENSEI_CHOICES: SenseiChoice[] = [
  {
    id: "marianne",
    name: "SENSEI MARIANNE",
    dan: "BROWN BELT",
    portraitKey: "portraitMarianne",
    flipX: false,
  },
  {
    id: "garvey",
    name: "SENSEI GARVEY",
    dan: "4TH DAN",
    portraitKey: "portraitGarvey",
    flipX: true,
  },
];

export class CharacterSelectScene extends Phaser.Scene {
  private selectedIndex = 0;
  private cards: Phaser.GameObjects.Container[] = [];
  private highlights: Phaser.GameObjects.Rectangle[] = [];
  private startHint!: Phaser.GameObjects.Text;
  private selectMusic?: Phaser.Sound.BaseSound;
  private selectionLocked = false;

  constructor() {
    super("CharacterSelectScene");
  }

  create(): void {
    this.scene.stop("GradingScene");
    this.selectedIndex = 0;
    this.cards = [];
    this.highlights = [];
    this.selectionLocked = false;

    this.add.image(640, 360, "dojoBackground")
      .setDisplaySize(1280, 720)
      .setAlpha(0.45);
    this.add.rectangle(640, 360, 1280, 720, 0x050913, 0.62);

    this.add.text(640, 86, "SELECT YOUR SENSEI", {
      color: "#00e7ff",
      fontSize: "44px",
      fontStyle: "bold",
      fontFamily: ARCADE_FONT,
      stroke: "#050913",
      strokeThickness: 8,
    }).setOrigin(0.5);

    SENSEI_CHOICES.forEach((choice, index) => {
      this.cards.push(this.createSenseiCard(choice, 504 + index * 272, 368));
    });

    this.startHint = this.add.text(640, 646, "LEFT / RIGHT TO CHOOSE    SPACE / ENTER TO START", {
      color: "#fff0a3",
      fontSize: "20px",
      fontStyle: "bold",
      fontFamily: ARCADE_FONT,
      stroke: "#050913",
      strokeThickness: 5,
    }).setOrigin(0.5);

    this.bindInput();
    this.startSelectMusic();
    this.refreshSelection();
  }

  private createSenseiCard(choice: SenseiChoice, x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const shadow = this.add.rectangle(0, 0, 156, 156, 0x000000, 0);
    const highlightBack = this.add.rectangle(0, -42, 164, 164, 0x000000, 1);
    const highlight = this.add.rectangle(0, -42, 156, 156, 0x000000, 0)
      .setStrokeStyle(5, SELECT_BLUE, 1);

    const portrait = this.add.image(0, -42, choice.portraitKey)
      .setDisplaySize(142, 142)
      .setFlipX(choice.flipX);
    const name = this.add.text(0, 66, choice.name, {
      color: "#f5f2eb",
      fontSize: "16px",
      fontStyle: "bold",
      fontFamily: ARCADE_FONT,
      stroke: "#050913",
      strokeThickness: 4,
    }).setOrigin(0.5);
    const dan = this.add.text(0, 96, choice.dan, {
      color: "#fff0a3",
      fontSize: "15px",
      fontStyle: "bold",
      fontFamily: ARCADE_FONT,
      stroke: "#050913",
      strokeThickness: 4,
    }).setOrigin(0.5);

    container.add([shadow, highlightBack, portrait, name, dan, highlight]);
    highlightBack.setVisible(false);
    this.highlights.push(highlight);
    this.highlights.push(highlightBack);
    return container;
  }

  private bindInput(): void {
    this.input.keyboard?.on("keydown-LEFT", () => this.moveSelection(-1));
    this.input.keyboard?.on("keydown-RIGHT", () => this.moveSelection(1));
    this.input.keyboard?.on("keydown-ENTER", () => this.startGrading());
    this.input.keyboard?.on("keydown-SPACE", () => this.startGrading());
  }

  private moveSelection(direction: number): void {
    if (this.selectionLocked) {
      return;
    }

    this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + direction, 0, SENSEI_CHOICES.length);
    this.refreshSelection();
  }

  private refreshSelection(): void {
    this.highlights.forEach((highlight, index) => {
      const isSelected = Math.floor(index / 2) === this.selectedIndex;
      highlight.setVisible(isSelected);
      highlight.setAlpha(isSelected ? 1 : 0);
    });
    this.cards.forEach((card, index) => {
      const isSelected = index === this.selectedIndex;
      card.setScale(isSelected ? 1.06 : 0.96);
      card.setAlpha(isSelected ? 1 : 0.72);
    });
    this.startHint.setColor(this.selectedIndex === 0 ? "#fff0a3" : "#00e7ff");
  }

  private startGrading(): void {
    if (this.selectionLocked) {
      return;
    }

    this.selectionLocked = true;
    const selectedSensei = SENSEI_CHOICES[this.selectedIndex].id;
    const music = this.selectMusic;
    if (!music) {
      this.scene.start("GradingScene", { selectedSensei });
      return;
    }

    this.fadeSoundOut(music, 620, () => {
      this.scene.start("GradingScene", { selectedSensei });
    });
  }

  private startSelectMusic(): void {
    this.sound.stopByKey("characterSelectTheme");
    this.selectMusic = this.sound.add("characterSelectTheme", {
      loop: true,
      volume: 0.48,
    });
    this.selectMusic.play();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.sound.stopByKey("characterSelectTheme");
    });
  }

  private fadeSoundOut(sound: Phaser.Sound.BaseSound, duration: number, onComplete: () => void): void {
    const startVolume = this.soundVolume(sound);
    const marker = { progress: 0 };
    this.tweens.add({
      targets: marker,
      progress: 1,
      duration,
      ease: "Sine.easeOut",
      onUpdate: () => this.setSoundVolume(sound, startVolume * (1 - marker.progress)),
      onComplete: () => {
        sound.stop();
        onComplete();
      },
    });
  }

  private soundVolume(sound: Phaser.Sound.BaseSound): number {
    const maybeSound = sound as Phaser.Sound.BaseSound & { volume?: number };
    return maybeSound.volume ?? 0.48;
  }

  private setSoundVolume(sound: Phaser.Sound.BaseSound, volume: number): void {
    const maybeSound = sound as Phaser.Sound.BaseSound & { setVolume?: (value: number) => void; volume?: number };
    if (maybeSound.setVolume) {
      maybeSound.setVolume(volume);
      return;
    }

    maybeSound.volume = volume;
  }
}
