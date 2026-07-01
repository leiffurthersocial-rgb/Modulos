import Phaser from "phaser";
import { TILE_SIZE } from "../core/constants";
import { World } from "../core/world";
import { surfaceHeight } from "../core/worldgen";
import { Tile, tileDef } from "../core/tiles";
import { Inventory } from "../core/inventory";
import { itemDef } from "../core/items";
import { hasSave, loadSave, writeSave, clearSave, snapshot } from "../core/save";
import { Player } from "../entities/Player";
import { Hud } from "../ui/Hud";
import { getCharacterById } from "../config/characters";
import { gameState } from "../state";

const ZOOM = 3;
const REACH = 5; // tiles
const DAY_LENGTH = 120; // seconds

export class GameScene extends Phaser.Scene {
  private world!: World;
  private player!: Player;
  private hud!: Hud;
  private inv!: Inventory;

  private pool: Phaser.GameObjects.Image[] = [];
  private bgPool: Phaser.GameObjects.Image[] = [];
  private poolCols = 0;
  private poolRows = 0;
  private fx!: Phaser.GameObjects.Graphics;
  private nightOverlay!: Phaser.GameObjects.Rectangle;

  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private mineTarget: { tx: number; ty: number } | null = null;
  private mineProgress = 0;
  private timeOfDay = 0.25; // start at morning
  private character!: string;

  constructor() {
    super("Game");
  }

  create(): void {
    const save = gameState.continueGame && hasSave() ? loadSave() : null;
    this.character = save?.character ?? gameState.selectedCharacterId;
    const seed = save?.seed ?? (Math.floor(Math.random() * 0xffffffff) >>> 0);
    this.world = new World(seed, save?.edits);

    this.inv = new Inventory(undefined, save?.inventory);
    if (!save) {
      // starter kit so the world is immediately interactive
      this.inv.add("wood_pickaxe", 1);
      this.inv.add("wood_axe", 1);
      this.inv.add("torch", 5);
    }

    const spriteKey = getCharacterById(this.character).spriteKey;
    const spawn = this.world.spawnTile();
    this.player = new Player(this, spriteKey, spawn.x, spawn.y);
    if (save) {
      this.player.body.x = save.player.x;
      this.player.body.y = save.player.y;
    }

    const cam = this.cameras.main;
    cam.setZoom(ZOOM);
    cam.setBackgroundColor("#8fd2ff");
    cam.startFollow(this.player.sprite, true, 1, 1);
    cam.roundPixels = true;

    this.buildPool();
    this.fx = this.add.graphics().setDepth(95);
    this.nightOverlay = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x0a0a20, 0)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(900);

    this.hud = new Hud(this, this.inv);
    this.hud.selected = save?.hotbar ?? 0;

    // Separate unzoomed camera for the HUD (the main camera is zoomed 3x).
    const uiCam = this.cameras.add(0, 0, this.scale.width, this.scale.height);
    uiCam.setScroll(0, 0);
    uiCam.ignore([...this.pool, ...this.bgPool, this.player.sprite, this.fx]);
    this.cameras.main.ignore([...this.hud.objects, this.nightOverlay]);

    this.hud.getDayNight = () => gameState.settings.dayNight;
    this.hud.onToggleDayNight = () => {
      gameState.settings.dayNight = !gameState.settings.dayNight;
    };
    this.hud.onNewWorld = () => {
      clearSave();
      gameState.continueGame = false;
      this.scene.restart();
    };
    this.hud.refresh();

    this.setupInput();

    // Autosave
    this.time.addEvent({ delay: 5000, loop: true, callback: () => this.save() });
    this.game.events.on(Phaser.Core.Events.BLUR, () => this.save());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(Phaser.Core.Events.BLUR);
    });

    // Dev hook for verification
    if (import.meta.env.DEV) {
      (window as unknown as { modulos: unknown }).modulos = {
        grow: () => this.world.growAllNow(),
        give: (id: string, n = 1) => {
          this.inv.add(id, n);
          this.hud.refresh();
        },
        count: (id: string) => this.inv.count(id),
        tile: (tx: number, ty: number) => this.world.getTile(tx, ty),
        playerTile: () => ({
          tx: Math.floor(this.player.centerX / TILE_SIZE),
          ty: Math.floor(this.player.centerY / TILE_SIZE),
        }),
        screenOf: (tx: number, ty: number) => {
          const cam = this.cameras.main;
          return {
            x: (tx * TILE_SIZE + 8 - cam.worldView.x) * cam.zoom,
            y: (ty * TILE_SIZE + 8 - cam.worldView.y) * cam.zoom,
          };
        },
        world: this.world,
        player: this.player,
      };
    }
  }

  private buildPool(): void {
    const viewW = this.scale.width / ZOOM;
    const viewH = this.scale.height / ZOOM;
    this.poolCols = Math.ceil(viewW / TILE_SIZE) + 3;
    this.poolRows = Math.ceil(viewH / TILE_SIZE) + 3;
    for (let i = 0; i < this.poolCols * this.poolRows; i++) {
      this.bgPool.push(this.add.image(0, 0, "caveback").setOrigin(0, 0).setDepth(-50));
      this.pool.push(this.add.image(0, 0, "tiles", 0).setOrigin(0, 0).setDepth(0));
    }
  }

  private setupInput(): void {
    const kb = this.input.keyboard!;
    this.keys = kb.addKeys("A,D,W,S,LEFT,RIGHT,UP,DOWN,SPACE,E,C,ESC") as Record<string, Phaser.Input.Keyboard.Key>;

    for (let i = 1; i <= 9; i++) {
      kb.on(`keydown-${["ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE"][i - 1]}`, () =>
        this.hud.select(i - 1),
      );
    }
    kb.on("keydown-E", () => this.hud.toggleInventory());
    kb.on("keydown-C", () => this.hud.toggleInventory());
    kb.on("keydown-ESC", () => this.hud.toggleSettings());

    this.input.on("wheel", (_p: unknown, _o: unknown, _dx: number, dy: number) => this.hud.cycle(dy > 0 ? 1 : -1));

    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (this.hud.isAnyOpen()) return;
      if (p.rightButtonDown()) this.tryPlace(p);
    });
  }

  private readInput(): { left: boolean; right: boolean; up: boolean; down: boolean; jump: boolean } {
    if (this.hud.isAnyOpen()) return { left: false, right: false, up: false, down: false, jump: false };
    const k = this.keys;
    return {
      left: k.A.isDown || k.LEFT.isDown,
      right: k.D.isDown || k.RIGHT.isDown,
      up: k.W.isDown || k.UP.isDown,
      down: k.S.isDown || k.DOWN.isDown,
      jump: k.SPACE.isDown || k.W.isDown || k.UP.isDown,
    };
  }

  update(_time: number, delta: number): void {
    const dt = Math.min(delta / 1000, 0.05);
    this.player.update(this.world, dt, this.readInput());
    this.world.tick(delta);

    this.updateNearTable();
    this.handleMining(dt);
    this.renderTiles();
    this.drawFx();
    this.updateDayNight(dt);
  }

  private updateNearTable(): void {
    const ptx = Math.floor(this.player.centerX / TILE_SIZE);
    const pty = Math.floor(this.player.centerY / TILE_SIZE);
    let near = false;
    for (let dx = -2; dx <= 2 && !near; dx++)
      for (let dy = -2; dy <= 2; dy++)
        if (this.world.getTile(ptx + dx, pty + dy) === Tile.CRAFTING_TABLE) {
          near = true;
          break;
        }
    this.hud.nearTable = near;
  }

  private pointerTile(p: Phaser.Input.Pointer): { tx: number; ty: number } {
    const w = this.cameras.main.getWorldPoint(p.x, p.y);
    return { tx: Math.floor(w.x / TILE_SIZE), ty: Math.floor(w.y / TILE_SIZE) };
  }

  private inReach(tx: number, ty: number): boolean {
    const ptx = this.player.centerX / TILE_SIZE;
    const pty = this.player.centerY / TILE_SIZE;
    return Math.abs(tx + 0.5 - ptx) <= REACH && Math.abs(ty + 0.5 - pty) <= REACH;
  }

  private handleMining(dt: number): void {
    const pointer = this.input.activePointer;
    if (this.hud.isAnyOpen() || !pointer.leftButtonDown()) {
      this.mineTarget = null;
      this.mineProgress = 0;
      return;
    }
    const { tx, ty } = this.pointerTile(pointer);
    const id = this.world.getTile(tx, ty);
    const def = tileDef(id);
    if (id === Tile.AIR || !isFinite(def.hardness) || !this.inReach(tx, ty)) {
      this.mineTarget = null;
      this.mineProgress = 0;
      return;
    }
    if (!this.mineTarget || this.mineTarget.tx !== tx || this.mineTarget.ty !== ty) {
      this.mineTarget = { tx, ty };
      this.mineProgress = 0;
    }
    const held = this.hud.selectedItem();
    const tool = held ? itemDef(held.id).tool : undefined;
    const correct = tool && tool.type === def.tool;
    const power = correct ? tool!.power : 1;
    const tier = correct ? tool!.tier : 0;
    const breakTime = def.hardness / power;
    this.mineProgress += dt;
    if (this.mineProgress >= breakTime) {
      this.breakTile(tx, ty, id, def, tier >= def.minTier);
      this.mineTarget = null;
      this.mineProgress = 0;
    }
  }

  private breakTile(tx: number, ty: number, id: number, def: ReturnType<typeof tileDef>, canDrop: boolean): void {
    this.world.setTile(tx, ty, Tile.AIR);
    if (def.drop && canDrop) this.inv.add(def.drop, 1);
    // bonus drops
    if (id === Tile.TALL_GRASS && Math.random() < 0.35) this.inv.add("wheat_seeds", 1);
    if (id === Tile.LEAVES) {
      if (Math.random() < 0.12) this.inv.add("sapling", 1);
      if (Math.random() < 0.06) this.inv.add("apple", 1);
    }
    if (id === Tile.WHEAT_3) {
      this.inv.add("wheat", 1);
      this.inv.add("wheat_seeds", 1 + (Math.random() < 0.5 ? 1 : 0));
    }
    this.hud.refresh();
    this.save();
  }

  private tryPlace(p: Phaser.Input.Pointer): void {
    const sel = this.hud.selectedItem();
    if (!sel) return;
    const def = itemDef(sel.id);
    const { tx, ty } = this.pointerTile(p);
    if (!this.inReach(tx, ty)) return;

    // Hoe: till grass/dirt
    if (def.tool?.type === "hoe") {
      const t = this.world.getTile(tx, ty);
      if ((t === Tile.GRASS || t === Tile.DIRT) && this.world.getTile(tx, ty - 1) === Tile.AIR) {
        this.world.setTile(tx, ty, Tile.FARMLAND);
        this.save();
      }
      return;
    }

    if (def.place === undefined) return;
    const target = this.world.getTile(tx, ty);
    const targetDef = tileDef(target);
    const replaceable = target === Tile.AIR || (!targetDef.solid && targetDef.overlay);
    if (!replaceable) return;
    if (this.overlapsPlayer(tx, ty) && tileDef(def.place).solid) return;

    // placement constraints
    if (def.placeOn === "grass") {
      if (this.world.getTile(tx, ty + 1) !== Tile.GRASS) return;
    } else if (def.placeOn === "farmland") {
      if (this.world.getTile(tx, ty + 1) !== Tile.FARMLAND) return;
    } else {
      // needs a neighbour so blocks aren't placed in empty sky
      const n =
        this.world.isSolidAt(tx - 1, ty) ||
        this.world.isSolidAt(tx + 1, ty) ||
        this.world.isSolidAt(tx, ty - 1) ||
        this.world.isSolidAt(tx, ty + 1);
      if (!n) return;
    }

    this.world.setTile(tx, ty, def.place);
    this.hud.consumeSelected(1);
    this.save();
  }

  private overlapsPlayer(tx: number, ty: number): boolean {
    const b = this.player.body;
    const x0 = tx * TILE_SIZE;
    const y0 = ty * TILE_SIZE;
    return x0 < b.x + b.w && x0 + TILE_SIZE > b.x && y0 < b.y + b.h && y0 + TILE_SIZE > b.y;
  }

  private renderTiles(): void {
    const view = this.cameras.main.worldView;
    const ox = Math.floor(view.x / TILE_SIZE) - 1;
    const oy = Math.floor(view.y / TILE_SIZE) - 1;
    for (let j = 0; j < this.poolRows; j++) {
      for (let i = 0; i < this.poolCols; i++) {
        const cell = j * this.poolCols + i;
        const spr = this.pool[cell];
        const bg = this.bgPool[cell];
        const wx = ox + i;
        const wy = oy + j;

        // cave background behind everything below the surface line
        if (wy >= surfaceHeight(this.world.seed, wx)) {
          bg.setVisible(true).setPosition(wx * TILE_SIZE, wy * TILE_SIZE);
        } else {
          bg.setVisible(false);
        }

        const t = this.world.getTile(wx, wy);
        if (t === Tile.AIR || wy < 0) {
          spr.setVisible(false);
          continue;
        }
        spr.setVisible(true).setPosition(wx * TILE_SIZE, wy * TILE_SIZE).setFrame(t);
      }
    }
  }

  private drawFx(): void {
    this.fx.clear();
    if (this.hud.isAnyOpen()) return;
    const { tx, ty } = this.pointerTile(this.input.activePointer);
    if (!this.inReach(tx, ty)) return;
    const x = tx * TILE_SIZE;
    const y = ty * TILE_SIZE;
    this.fx.lineStyle(1, 0xffffff, 0.7);
    this.fx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
    if (this.mineTarget && this.mineTarget.tx === tx && this.mineTarget.ty === ty) {
      const id = this.world.getTile(tx, ty);
      const def = tileDef(id);
      const held = this.hud.selectedItem();
      const tool = held ? itemDef(held.id).tool : undefined;
      const power = tool && tool.type === def.tool ? tool.power : 1;
      const ratio = Math.min(1, this.mineProgress / (def.hardness / power));
      this.fx.fillStyle(0x000000, 0.35 * ratio);
      this.fx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    }
  }

  private updateDayNight(dt: number): void {
    this.timeOfDay = (this.timeOfDay + dt / DAY_LENGTH) % 1;
    const dayDark = gameState.settings.dayNight ? 0.3 - 0.3 * Math.cos(this.timeOfDay * Math.PI * 2) : 0;
    const ptx = Math.floor(this.player.centerX / TILE_SIZE);
    const pty = Math.floor(this.player.centerY / TILE_SIZE);
    const surf = surfaceHeight(this.world.seed, ptx);
    const depthDark = Phaser.Math.Clamp((pty - surf) / 45, 0, 1) * 0.8;
    this.nightOverlay.setAlpha(Math.min(0.82, Math.max(dayDark, depthDark)));
  }

  private save(): void {
    writeSave(
      snapshot(this.world, this.inv, this.hud.selected, this.character, {
        x: this.player.body.x,
        y: this.player.body.y,
      }),
    );
  }
}
