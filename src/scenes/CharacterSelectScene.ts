import Phaser from "phaser";
import { CHARACTERS, type CharacterDef } from "../config/characters";
import { gameState } from "../state";

const COLS = 4;
const CELL_W = 160;
const CELL_H = 165;
const GRID_TOP = 165;

export class CharacterSelectScene extends Phaser.Scene {
  private selectedIndex = 0;
  private cards: Phaser.GameObjects.Container[] = [];

  constructor() {
    super("CharacterSelect");
  }

  create(): void {
    const { width } = this.scale;

    this.add
      .text(width / 2, 40, "MODULOS", {
        fontFamily: "monospace",
        fontSize: "40px",
        color: "#f0e4c8",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 80, "Choose your character", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#a8a8a8",
      })
      .setOrigin(0.5);

    const gridWidth = COLS * CELL_W;
    const startX = width / 2 - gridWidth / 2 + CELL_W / 2;

    CHARACTERS.forEach((char, i) => {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = startX + col * CELL_W;
      const y = GRID_TOP + row * CELL_H;
      const card = this.createCard(char, x, y, i);
      this.cards.push(card);
    });

    this.highlightCard(0);

    const helpText = this.add
      .text(width / 2, this.scale.height - 30, "Click a character, or use arrow keys + Enter", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#888888",
      })
      .setOrigin(0.5);
    helpText.setDepth(1);

    const cursors = this.input.keyboard?.createCursorKeys();
    this.input.keyboard?.on("keydown-ENTER", () => this.chooseCharacter(this.selectedIndex));
    this.input.keyboard?.on("keydown-RIGHT", () => this.moveSelection(1));
    this.input.keyboard?.on("keydown-LEFT", () => this.moveSelection(-1));
    this.input.keyboard?.on("keydown-DOWN", () => this.moveSelection(COLS));
    this.input.keyboard?.on("keydown-UP", () => this.moveSelection(-COLS));
    void cursors;
  }

  private createCard(char: CharacterDef, x: number, y: number, index: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, CELL_W - 16, CELL_H - 16, 0x1c1c26).setStrokeStyle(2, 0x3a3a4a);
    const sprite = this.add.image(0, -32, char.spriteKey).setScale(2.6);
    const name = this.add
      .text(0, 25, char.name, { fontFamily: "monospace", fontSize: "18px", color: "#f0e4c8" })
      .setOrigin(0.5);
    const blurb = this.add
      .text(0, 50, char.blurb, {
        fontFamily: "monospace",
        fontSize: "9px",
        color: "#999999",
        align: "center",
        wordWrap: { width: CELL_W - 30 },
      })
      .setOrigin(0.5, 0);

    container.add([bg, sprite, name, blurb]);
    container.setSize(CELL_W - 16, CELL_H - 16);
    container.setInteractive({ useHandCursor: true });
    container.on("pointerover", () => this.highlightCard(index));
    container.on("pointerdown", () => this.chooseCharacter(index));

    return container;
  }

  private highlightCard(index: number): void {
    this.selectedIndex = index;
    this.cards.forEach((card, i) => {
      const bg = card.list[0] as Phaser.GameObjects.Rectangle;
      bg.setStrokeStyle(2, i === index ? 0xe8c96b : 0x3a3a4a);
    });
  }

  private moveSelection(delta: number): void {
    const next = Phaser.Math.Clamp(this.selectedIndex + delta, 0, CHARACTERS.length - 1);
    this.highlightCard(next);
  }

  private chooseCharacter(index: number): void {
    gameState.selectedCharacter = CHARACTERS[index];
    this.scene.start("Town");
  }
}
