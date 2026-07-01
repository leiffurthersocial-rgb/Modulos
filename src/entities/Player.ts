import Phaser from "phaser";
import { TILE_SIZE } from "../core/constants";
import { Tile } from "../core/tiles";
import type { World } from "../core/world";
import { moveBody, type Body } from "../systems/physics";
import { PH, PW } from "../art/sprites";

const GRAVITY = 900;
const MOVE_SPEED = 90;
const JUMP_SPEED = 260;
const CLIMB_SPEED = 80;
const SWIM_SPEED = 70;

export class Player {
  readonly body: Body;
  readonly sprite: Phaser.GameObjects.Sprite;
  private facing: 1 | -1 = 1;
  private animTime = 0;

  private airMinY: number;
  private wasOnGround = false;
  /** Tiles fallen on the frame the player lands (0 otherwise); consumed by GameScene. */
  lastFallTiles = 0;
  submerged = false;

  constructor(scene: Phaser.Scene, spriteKey: string, tileX: number, tileY: number) {
    this.body = {
      x: tileX * TILE_SIZE + 3,
      y: tileY * TILE_SIZE,
      w: 10,
      h: 22,
      vx: 0,
      vy: 0,
      onGround: false,
    };
    this.airMinY = this.body.y;
    this.sprite = scene.add.sprite(0, 0, spriteKey, 0).setOrigin(0.5, 0);
    this.sprite.setDepth(100);
  }

  get centerX(): number {
    return this.body.x + this.body.w / 2;
  }
  get centerY(): number {
    return this.body.y + this.body.h / 2;
  }

  update(
    world: World,
    dt: number,
    input: { left: boolean; right: boolean; up: boolean; down: boolean; jump: boolean },
  ): void {
    const b = this.body;

    // Horizontal
    if (input.left && !input.right) {
      b.vx = -MOVE_SPEED;
      this.facing = -1;
    } else if (input.right && !input.left) {
      b.vx = MOVE_SPEED;
      this.facing = 1;
    } else {
      b.vx = 0;
    }

    const cxTile = Math.floor(this.centerX / TILE_SIZE);
    const cyTile = Math.floor(this.centerY / TILE_SIZE);
    this.submerged = world.getTile(cxTile, cyTile) === Tile.WATER;
    const onLadder = world.isClimbAt(cxTile, cyTile);

    // Vertical: ladders, swimming, or gravity
    if (onLadder && (input.up || input.down)) {
      b.vy = input.up ? -CLIMB_SPEED : CLIMB_SPEED;
    } else if (this.submerged) {
      b.vy += GRAVITY * 0.25 * dt; // buoyant
      if (input.jump || input.up) b.vy = -SWIM_SPEED;
      b.vy = Phaser.Math.Clamp(b.vy, -SWIM_SPEED, SWIM_SPEED);
    } else {
      b.vy += GRAVITY * dt;
      if (b.vy > 700) b.vy = 700;
      if (input.jump && b.onGround) b.vy = -JUMP_SPEED;
      if (onLadder && !input.jump) b.vy = Math.min(b.vy, CLIMB_SPEED);
    }

    // Track fall distance from the apex for fall damage
    if (!b.onGround) {
      this.airMinY = Math.min(this.airMinY, b.y);
    }

    moveBody(world, b, dt);

    // Landing this frame?
    this.lastFallTiles = 0;
    if (b.onGround && !this.wasOnGround) {
      const fell = (b.y - this.airMinY) / TILE_SIZE;
      if (!this.submerged && fell > 0) this.lastFallTiles = fell;
    }
    if (b.onGround) this.airMinY = b.y;
    this.wasOnGround = b.onGround;

    // Animation frame selection
    let frame = 0;
    if (this.submerged) {
      this.animTime += dt;
      frame = Math.floor(this.animTime * 6) % 2 === 0 ? 1 : 2;
    } else if (!b.onGround) {
      frame = 3; // jump/fall
    } else if (b.vx !== 0) {
      this.animTime += dt;
      frame = Math.floor(this.animTime * 8) % 2 === 0 ? 1 : 2;
    } else {
      this.animTime = 0;
      frame = 0;
    }
    this.sprite.setFrame(frame);
    this.sprite.setFlipX(this.facing === -1);
    this.sprite.setPosition(Math.round(this.centerX), Math.round(b.y - (PH - b.h)));
  }

  get width(): number {
    return PW;
  }

  respawn(tileX: number, tileY: number): void {
    this.body.x = tileX * TILE_SIZE + 3;
    this.body.y = tileY * TILE_SIZE;
    this.body.vx = 0;
    this.body.vy = 0;
    this.airMinY = this.body.y;
    this.wasOnGround = false;
    this.lastFallTiles = 0;
  }
}
