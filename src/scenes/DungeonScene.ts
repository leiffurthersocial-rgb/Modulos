import Phaser from "phaser";
import { gameState } from "../state";
import { CHARACTERS } from "../config/characters";
import { Player } from "../entities/Player";

const TILE = 32;
const MAP_COLS = 20;
const MAP_ROWS = 14;
const MAP_W = MAP_COLS * TILE;
const MAP_H = MAP_ROWS * TILE;

interface MineRock {
  sprite: Phaser.Physics.Arcade.Sprite;
  hp: number;
}

export class DungeonScene extends Phaser.Scene {
  private player!: Player;
  private walls!: Phaser.Physics.Arcade.StaticGroup;
  private rocks = new Map<Phaser.Physics.Arcade.Sprite, MineRock>();
  private rockGroup!: Phaser.Physics.Arcade.StaticGroup;
  private oreCount = 0;
  private oreText!: Phaser.GameObjects.Text;

  constructor() {
    super("Dungeon");
  }

  create(): void {
    const selected = gameState.selectedCharacter ?? CHARACTERS[0];
    this.oreCount = 0;

    this.physics.world.setBounds(0, 0, MAP_W, MAP_H);
    this.cameras.main.setBounds(0, 0, MAP_W, MAP_H);
    this.cameras.main.setBackgroundColor("#1a1620");
    this.cameras.main.fadeIn(250, 0, 0, 0);

    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        this.add.image(col * TILE + TILE / 2, row * TILE + TILE / 2, "tile_cave").setDepth(-100);
      }
    }

    this.walls = this.physics.add.staticGroup();
    for (let col = 0; col < MAP_COLS; col++) {
      this.addWall(col, 0);
      this.addWall(col, MAP_ROWS - 1);
    }
    for (let row = 0; row < MAP_ROWS; row++) {
      this.addWall(0, row);
      this.addWall(MAP_COLS - 1, row);
    }

    this.rockGroup = this.physics.add.staticGroup();
    this.scatterRocks();

    this.player = new Player(this, TILE * 2, TILE * 2, selected);
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.player, this.rockGroup, (_p, rock) => {
      this.mineRock(rock as Phaser.Physics.Arcade.Sprite);
    });
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    this.createExit();

    this.oreText = this.add
      .text(12, 12, "Ore: 0", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#8fe6f4",
        backgroundColor: "#00000088",
        padding: { x: 8, y: 5 },
      })
      .setScrollFactor(0)
      .setDepth(10000);

    this.add
      .text(12, MAP_H - 28, "Walk into rocks to mine them · reach the ladder to leave", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#c8c0d0",
        backgroundColor: "#00000088",
        padding: { x: 6, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(10000);
  }

  private addWall(col: number, row: number): void {
    const wall = this.walls.create(col * TILE + TILE / 2, row * TILE + TILE / 2, "tile_stone") as Phaser.Physics.Arcade.Sprite;
    wall.setDepth(-50);
    wall.refreshBody();
  }

  private scatterRocks(): void {
    for (let row = 2; row < MAP_ROWS - 2; row++) {
      for (let col = 4; col < MAP_COLS - 2; col++) {
        if ((row * 3 + col * 2) % 4 !== 0) continue;
        const x = col * TILE + TILE / 2;
        const y = row * TILE + TILE / 2;
        const rock = this.rockGroup.create(x, y, "prop_ore") as Phaser.Physics.Arcade.Sprite;
        rock.setDepth(y);
        rock.refreshBody();
        (rock.body as Phaser.Physics.Arcade.StaticBody).setSize(22, 20).setOffset(5, 7);
        this.rocks.set(rock, { sprite: rock, hp: 3 });
      }
    }
  }

  private mineRock(rockSprite: Phaser.Physics.Arcade.Sprite): void {
    const rock = this.rocks.get(rockSprite);
    if (!rock) return;
    rock.hp -= 1;
    // little shake + flash on each hit
    this.tweens.add({ targets: rockSprite, x: rockSprite.x + 1, duration: 40, yoyo: true });
    rockSprite.setTint(0xffffff);
    this.time.delayedCall(60, () => rockSprite.clearTint());
    if (rock.hp <= 0) {
      this.spawnOrePop(rockSprite.x, rockSprite.y);
      rockSprite.destroy();
      this.rocks.delete(rockSprite);
      this.oreCount += 1;
      this.oreText.setText(`Ore: ${this.oreCount}`);
    }
  }

  private spawnOrePop(x: number, y: number): void {
    const bit = this.add.rectangle(x, y, 6, 6, 0x8fe6f4).setDepth(9000);
    this.tweens.add({
      targets: bit,
      y: y - 16,
      alpha: 0,
      duration: 400,
      onComplete: () => bit.destroy(),
    });
  }

  private createExit(): void {
    const x = TILE * 1 + TILE / 2;
    const y = (MAP_ROWS - 2) * TILE + TILE / 2;
    this.add.image(x, y, "prop_ladder").setDepth(-40);
    this.add
      .text(x, y - 22, "▲ EXIT", {
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#f4d94a",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(9000);
    const zone = this.add.zone(x, y, TILE + 12, TILE + 12);
    this.physics.add.existing(zone);
    this.physics.add.overlap(this.player, zone, () => {
      this.cameras.main.fadeOut(250, 0, 0, 0);
      this.time.delayedCall(260, () => this.scene.start("Town"));
    });
  }

  update(): void {
    this.player.update();
    this.player.setDepth(this.player.y);
  }
}
