import Phaser from "phaser";
import { CHARACTERS } from "../config/characters";
import { gameState } from "../state";
import { Player } from "../entities/Player";
import { NPC } from "../entities/NPC";
import { DialogueBox } from "../ui/DialogueBox";

const TILE = 32;
const MAP_COLS = 25;
const MAP_ROWS = 18;
const MAP_W = MAP_COLS * TILE;
const MAP_H = MAP_ROWS * TILE;

const GRASS_KEYS = ["tile_grass", "tile_grass2", "tile_grass3"];

const GREETINGS: Record<string, string> = {
  robin: "Hey! Beautiful day to get some farming done, right?",
  leif: "Oh, hi. I was just heading down to the mine.",
  jovan: "Hey there! Let me know if you need a hand building anything.",
  leonidas: "Stay strong! Training never stops around here.",
  erim: "Hm? Oh, hello. I was reading about the mine's rock formations.",
  till: "Hiya! The water's really clear today, wanna go fishing later?",
  lenni: "Oh, hey! I found a neat old book in the mine yesterday.",
  tusya: "Welcome to Modulos! Let me know if you get lost around town.",
};

export class TownScene extends Phaser.Scene {
  private player!: Player;
  private solids: Phaser.GameObjects.GameObject[] = [];
  private npcs: NPC[] = [];
  private dialogue!: DialogueBox;
  private nearbyNpc: NPC | null = null;
  private nearbyPrompt!: Phaser.GameObjects.Text;
  private eKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super("Town");
  }

  create(): void {
    const selected = gameState.selectedCharacter ?? CHARACTERS[0];

    this.physics.world.setBounds(TILE, TILE, MAP_W - TILE * 2, MAP_H - TILE * 2);
    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.cameras.main.setBackgroundColor("#2f7030");

    this.drawGround();
    this.drawTreeBorder();
    this.drawDecor();

    this.player = new Player(this, MAP_W * 0.42, MAP_H * 0.5, selected);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    this.spawnNpcs(selected.id);

    // A single collider against all solid props (trees, house, water, mine rocks).
    this.physics.add.collider(this.player, this.solids);
    this.npcs.forEach((npc) => this.physics.add.collider(this.player, npc));

    this.dialogue = new DialogueBox(this);
    this.nearbyPrompt = this.add
      .text(0, 0, "Press E to talk", { fontFamily: "monospace", fontSize: "11px", color: "#ffffff" })
      .setOrigin(0.5)
      .setDepth(9000)
      .setVisible(false);

    this.createMineEntrance();

    this.eKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.add
      .text(12, 12, `Playing as ${selected.name}`, {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#f4ecd6",
        backgroundColor: "#00000088",
        padding: { x: 8, y: 5 },
      })
      .setScrollFactor(0)
      .setDepth(10000);
  }

  private drawGround(): void {
    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        const key = GRASS_KEYS[(col * 7 + row * 3) % GRASS_KEYS.length];
        this.add.image(col * TILE + TILE / 2, row * TILE + TILE / 2, key).setDepth(-100);
      }
    }
    // Cobbled path: a T leading from the town centre down and across to the mine.
    for (let row = 4; row < MAP_ROWS - 2; row++) {
      this.addPath(11, row);
    }
    for (let col = 11; col < MAP_COLS - 2; col++) {
      this.addPath(col, MAP_ROWS - 3);
    }
  }

  private addPath(col: number, row: number): void {
    this.add.image(col * TILE + TILE / 2, row * TILE + TILE / 2, "tile_path").setDepth(-90);
  }

  private drawTreeBorder(): void {
    // A ring of trees encloses the town clearing; world bounds keep the player in.
    for (let col = 0; col < MAP_COLS; col++) {
      this.addTree(col, 0);
      if (col % 2 === 0) this.addTree(col, MAP_ROWS - 1);
    }
    for (let row = 1; row < MAP_ROWS - 1; row++) {
      this.addTree(0, row);
      this.addTree(MAP_COLS - 1, row);
    }
  }

  private addTree(col: number, row: number): void {
    const x = col * TILE + TILE / 2;
    const y = row * TILE + TILE;
    this.add.image(x, y, "prop_tree").setOrigin(0.5, 1).setDepth(y);
    this.addSolid(x, y - 5, 12, 8);
  }

  private drawDecor(): void {
    // House (home base) near the top-left of the clearing.
    const hx = 5 * TILE;
    const hy = 5 * TILE;
    this.add.image(hx, hy, "prop_house").setOrigin(0.5, 1).setDepth(hy);
    this.addSolid(hx, hy - 10, 56, 22);

    // Pond bottom-left, with collision so you can't walk on water.
    for (let row = 12; row < 15; row++) {
      for (let col = 3; col < 7; col++) {
        this.add.image(col * TILE + TILE / 2, row * TILE + TILE / 2, "tile_water").setDepth(-80);
      }
    }
    this.addSolid(5 * TILE, 13 * TILE + TILE / 2, 4 * TILE, 3 * TILE);

    // Scattered bushes and flowers for life (decorative only).
    const bushes: Array<[number, number]> = [
      [8, 3],
      [16, 4],
      [19, 12],
      [7, 9],
      [14, 14],
    ];
    for (const [col, row] of bushes) {
      const x = col * TILE + TILE / 2;
      const y = row * TILE + TILE / 2;
      this.add.image(x, y, "prop_bush").setDepth(y);
      this.addSolid(x, y + 4, 20, 8);
    }
    const flowers: Array<[number, number]> = [
      [9, 6],
      [13, 7],
      [17, 9],
      [6, 11],
      [20, 6],
    ];
    for (const [col, row] of flowers) {
      const x = col * TILE + TILE / 2;
      const y = row * TILE + TILE / 2;
      this.add.image(x, y, "prop_flower").setOrigin(0.5, 1).setDepth(y);
    }
  }

  private addSolid(x: number, y: number, w: number, h: number): void {
    const rect = this.add.rectangle(x, y, w, h);
    this.physics.add.existing(rect, true);
    this.solids.push(rect);
  }

  private spawnNpcs(excludeId: string): void {
    const npcCandidates = CHARACTERS.filter((c) => c.id !== excludeId);
    const positions: Array<[number, number]> = [
      [8, 6],
      [15, 7],
      [18, 10],
      [13, 11],
    ];
    positions.forEach(([col, row], i) => {
      const char = npcCandidates[i % npcCandidates.length];
      const npc = new NPC(this, col * TILE + TILE / 2, row * TILE + TILE / 2, char, GREETINGS[char.id] ?? "Hey there!");
      this.npcs.push(npc);
    });
  }

  private createMineEntrance(): void {
    const x = (MAP_COLS - 3) * TILE + TILE / 2;
    const y = (MAP_ROWS - 3) * TILE + TILE / 2;
    this.add.image(x, y - 4, "prop_mine").setOrigin(0.5, 0.5).setDepth(y);
    this.add
      .text(x, y - 34, "▼ MINE", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#f4d94a",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(9000);

    const zone = this.add.zone(x, y + 6, TILE - 8, TILE - 12);
    this.physics.add.existing(zone);
    this.physics.add.overlap(this.player, zone, () => {
      this.cameras.main.fadeOut(250, 0, 0, 0);
      this.time.delayedCall(260, () => this.scene.start("Dungeon"));
    });
  }

  update(): void {
    this.player.update();
    this.player.setDepth(this.player.y);

    this.nearbyNpc = null;
    let closestDist = 48;
    for (const npc of this.npcs) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.x, npc.y);
      if (dist < closestDist) {
        closestDist = dist;
        this.nearbyNpc = npc;
      }
    }

    if (this.nearbyNpc && !this.dialogue.isVisible) {
      this.nearbyPrompt.setPosition(this.nearbyNpc.x, this.nearbyNpc.y - 40);
      this.nearbyPrompt.setVisible(true);
    } else {
      this.nearbyPrompt.setVisible(false);
    }

    if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
      if (this.dialogue.isVisible) {
        this.dialogue.hide();
      } else if (this.nearbyNpc) {
        this.dialogue.show(this.nearbyNpc.character.name, this.nearbyNpc.greeting);
      }
    }
  }
}
