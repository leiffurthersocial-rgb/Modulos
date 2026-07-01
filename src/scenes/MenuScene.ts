import Phaser from "phaser";
import { CHARACTERS } from "../config/characters";
import { gameState } from "../state";
import { hasSave } from "../core/save";

const COLS = 4;
const CELL = 130;

export class MenuScene extends Phaser.Scene {
  private cards: Phaser.GameObjects.Container[] = [];
  private selected = 0;

  constructor() {
    super("Menu");
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor("#12121c");

    this.add.text(width / 2, 48, "MODULOS", { fontFamily: "monospace", fontSize: "48px", color: "#f4d94a", stroke: "#000", strokeThickness: 6 }).setOrigin(0.5);
    this.add.text(width / 2, 92, "A 2D pixel sandbox — mine, build, craft, farm", { fontFamily: "monospace", fontSize: "14px", color: "#a8a8b8" }).setOrigin(0.5);
    this.add.text(width / 2, 128, "Choose your character", { fontFamily: "monospace", fontSize: "15px", color: "#e8d8b0" }).setOrigin(0.5);

    const gridW = COLS * CELL;
    const x0 = width / 2 - gridW / 2 + CELL / 2;
    const y0 = 200;
    CHARACTERS.forEach((c, i) => {
      const x = x0 + (i % COLS) * CELL;
      const y = y0 + Math.floor(i / COLS) * (CELL + 6);
      const card = this.add.container(x, y);
      const bg = this.add.rectangle(0, 0, CELL - 12, CELL - 6, 0x1e1e2a).setStrokeStyle(2, 0x3a3a4a);
      const spr = this.add.image(0, -14, c.spriteKey, 0).setScale(3.2);
      const name = this.add.text(0, 40, c.name, { fontFamily: "monospace", fontSize: "15px", color: "#f4ecd6" }).setOrigin(0.5);
      card.add([bg, spr, name]);
      card.setSize(CELL - 12, CELL - 6).setInteractive({ useHandCursor: true });
      card.on("pointerover", () => this.highlight(i));
      card.on("pointerdown", () => {
        this.highlight(i);
        this.play();
      });
      this.cards.push(card);
    });
    this.highlight(0);

    const play = this.add
      .text(width / 2, height - 78, "▶ Play", { fontFamily: "monospace", fontSize: "22px", color: "#eaffea", backgroundColor: "#3a5a34", padding: { x: 20, y: 8 } })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.play());

    if (hasSave()) {
      this.add
        .text(width / 2, height - 32, "Continue saved world", { fontFamily: "monospace", fontSize: "15px", color: "#f4d94a", backgroundColor: "#33333f", padding: { x: 14, y: 6 } })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on("pointerdown", () => {
          gameState.continueGame = true;
          this.scene.start("Game");
        });
    }
    void play;
  }

  private highlight(i: number): void {
    this.selected = i;
    this.cards.forEach((card, idx) => {
      (card.list[0] as Phaser.GameObjects.Rectangle).setStrokeStyle(2, idx === i ? 0xf4d94a : 0x3a3a4a);
    });
  }

  private play(): void {
    gameState.selectedCharacterId = CHARACTERS[this.selected].id;
    gameState.continueGame = false;
    this.scene.start("Game");
  }
}
