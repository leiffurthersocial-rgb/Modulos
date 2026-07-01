import Phaser from "phaser";
import { CHARACTERS } from "../config/characters";
import { gameState } from "../state";
import { hasSave } from "../core/save";

const COLS = 4;
const CELL = 132;

export class MenuScene extends Phaser.Scene {
  private mainPage!: Phaser.GameObjects.Container;
  private charPage!: Phaser.GameObjects.Container;
  private settingsPage!: Phaser.GameObjects.Container;
  private cards: Phaser.GameObjects.Container[] = [];
  private selected = 0;

  constructor() {
    super("Menu");
  }

  create(): void {
    const { width } = this.scale;
    this.cameras.main.setBackgroundColor("#0f1622");

    // Decorative parallax sky band
    this.add.rectangle(width / 2, 0, width, 150, 0x1b3a5c).setOrigin(0.5, 0);

    this.add
      .text(width / 2, 70, "MODULOS", { fontFamily: "monospace", fontSize: "58px", color: "#f4d94a", stroke: "#20160a", strokeThickness: 8 })
      .setOrigin(0.5);
    this.add
      .text(width / 2, 118, "A 2D pixel sandbox — mine · build · craft · farm", { fontFamily: "monospace", fontSize: "15px", color: "#bcd3e8" })
      .setOrigin(0.5);

    this.buildMainPage();
    this.buildCharPage();
    this.buildSettingsPage();
    this.showPage("main");
  }

  private btn(
    parent: Phaser.GameObjects.Container,
    x: number,
    y: number,
    label: string,
    color: number,
    cb: () => void,
    w = 320,
  ): Phaser.GameObjects.Container {
    const c = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, w, 52, color).setStrokeStyle(3, 0x000000, 0.35);
    const t = this.add.text(0, 0, label, { fontFamily: "monospace", fontSize: "20px", color: "#ffffff" }).setOrigin(0.5);
    c.add([bg, t]);
    bg.setInteractive({ useHandCursor: true })
      .on("pointerover", () => bg.setFillStyle(Phaser.Display.Color.IntegerToColor(color).lighten(12).color))
      .on("pointerout", () => bg.setFillStyle(color))
      .on("pointerdown", cb);
    parent.add(c);
    return c;
  }

  private buildMainPage(): void {
    const { width, height } = this.scale;
    this.mainPage = this.add.container(0, 0);
    const cx = width / 2;
    const cy = height / 2 + 30;

    const saved = hasSave();
    const cont = this.btn(this.mainPage, cx, cy - 40, "▶  Continue Saved World", saved ? 0x3a7a3a : 0x37414d, () => {
      if (!saved) return;
      gameState.continueGame = true;
      this.scene.start("Game");
    });
    if (!saved) (cont.list[1] as Phaser.GameObjects.Text).setColor("#7a8290");

    this.btn(this.mainPage, cx, cy + 26, "✦  Create New World", 0x3060a0, () => this.showPage("char"));
    this.btn(this.mainPage, cx, cy + 92, "⚙  Settings", 0x4a4a5a, () => this.showPage("settings"), 200);
  }

  private buildCharPage(): void {
    const { width, height } = this.scale;
    this.charPage = this.add.container(0, 0);
    this.charPage.add(
      this.add.text(width / 2, 170, "Choose your character", { fontFamily: "monospace", fontSize: "18px", color: "#e8d8b0" }).setOrigin(0.5),
    );

    const gridW = COLS * CELL;
    const x0 = width / 2 - gridW / 2 + CELL / 2;
    const y0 = 230;
    CHARACTERS.forEach((c, i) => {
      const x = x0 + (i % COLS) * CELL;
      const y = y0 + Math.floor(i / COLS) * (CELL + 4);
      const card = this.add.container(x, y);
      const bg = this.add.rectangle(0, 0, CELL - 12, CELL - 8, 0x1a2431).setStrokeStyle(2, 0x394a5a);
      const spr = this.add.image(0, -16, c.spriteKey, 0).setScale(3.2);
      const name = this.add.text(0, 42, c.name, { fontFamily: "monospace", fontSize: "15px", color: "#f4ecd6" }).setOrigin(0.5);
      card.add([bg, spr, name]);
      card.setSize(CELL - 12, CELL - 8).setInteractive({ useHandCursor: true });
      card.on("pointerover", () => this.highlight(i));
      card.on("pointerdown", () => this.highlight(i));
      this.charPage.add(card);
      this.cards.push(card);
    });

    this.btn(this.charPage, width / 2 - 120, height - 44, "◀ Back", 0x4a4a5a, () => this.showPage("main"), 180);
    this.btn(this.charPage, width / 2 + 120, height - 44, "Start New World ▶", 0x3a7a3a, () => this.start(), 220);
    this.highlight(0);
  }

  private buildSettingsPage(): void {
    const { width, height } = this.scale;
    this.settingsPage = this.add.container(0, 0);
    this.settingsPage.add(
      this.add.text(width / 2, 190, "Settings", { fontFamily: "monospace", fontSize: "26px", color: "#f4d94a" }).setOrigin(0.5),
    );
    const dn = this.btn(this.settingsPage, width / 2, 270, `Day / Night cycle: ${gameState.settings.dayNight ? "On" : "Off"}`, 0x4a4a5a, () => {
      gameState.settings.dayNight = !gameState.settings.dayNight;
      (dn.list[1] as Phaser.GameObjects.Text).setText(`Day / Night cycle: ${gameState.settings.dayNight ? "On" : "Off"}`);
    });
    this.settingsPage.add(
      this.add
        .text(width / 2, 340, "Controls\nMove: A / D   Jump: Space\nMine: Left-click   Place: Right-click\nHotbar: 1–9 / wheel   Inventory: E   Pause: Esc", {
          fontFamily: "monospace",
          fontSize: "13px",
          color: "#aebfce",
          align: "center",
          lineSpacing: 6,
        })
        .setOrigin(0.5),
    );
    this.btn(this.settingsPage, width / 2, height - 60, "◀ Back", 0x4a4a5a, () => this.showPage("main"), 200);
  }

  private showPage(p: "main" | "char" | "settings"): void {
    this.mainPage.setVisible(p === "main");
    this.charPage.setVisible(p === "char");
    this.settingsPage.setVisible(p === "settings");
  }

  private highlight(i: number): void {
    this.selected = i;
    this.cards.forEach((card, idx) => {
      (card.list[0] as Phaser.GameObjects.Rectangle).setStrokeStyle(idx === i ? 3 : 2, idx === i ? 0xf4d94a : 0x394a5a);
    });
  }

  private start(): void {
    gameState.selectedCharacterId = CHARACTERS[this.selected].id;
    gameState.continueGame = false;
    this.scene.start("Game");
  }
}
