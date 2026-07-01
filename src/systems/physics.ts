import { TILE_SIZE } from "../core/constants";
import type { World } from "../core/world";

/** Axis-aligned body in world pixel coordinates. */
export interface Body {
  x: number; // left
  y: number; // top
  w: number;
  h: number;
  vx: number;
  vy: number;
  onGround: boolean;
}

function solidBetween(world: World, x0: number, y0: number, x1: number, y1: number): boolean {
  const tx0 = Math.floor(x0 / TILE_SIZE);
  const tx1 = Math.floor((x1 - 0.001) / TILE_SIZE);
  const ty0 = Math.floor(y0 / TILE_SIZE);
  const ty1 = Math.floor((y1 - 0.001) / TILE_SIZE);
  for (let tx = tx0; tx <= tx1; tx++) {
    for (let ty = ty0; ty <= ty1; ty++) {
      if (world.isSolidAt(tx, ty)) return true;
    }
  }
  return false;
}

/**
 * Integrates a body against solid world tiles, resolving X then Y.
 * dt is in seconds. Returns the (possibly mutated) body.
 */
export function moveBody(world: World, b: Body, dt: number): void {
  // X axis
  const nx = b.x + b.vx * dt;
  if (b.vx !== 0) {
    if (b.vx > 0) {
      if (solidBetween(world, nx + b.w, b.y, nx + b.w, b.y + b.h)) {
        b.x = Math.floor((nx + b.w) / TILE_SIZE) * TILE_SIZE - b.w - 0.01;
        b.vx = 0;
      } else b.x = nx;
    } else {
      if (solidBetween(world, nx, b.y, nx, b.y + b.h)) {
        b.x = (Math.floor(nx / TILE_SIZE) + 1) * TILE_SIZE + 0.01;
        b.vx = 0;
      } else b.x = nx;
    }
  }

  // Y axis
  b.onGround = false;
  const ny = b.y + b.vy * dt;
  if (b.vy >= 0) {
    if (solidBetween(world, b.x, ny + b.h, b.x + b.w, ny + b.h)) {
      b.y = Math.floor((ny + b.h) / TILE_SIZE) * TILE_SIZE - b.h - 0.01;
      b.vy = 0;
      b.onGround = true;
    } else b.y = ny;
  } else {
    if (solidBetween(world, b.x, ny, b.x + b.w, ny)) {
      b.y = (Math.floor(ny / TILE_SIZE) + 1) * TILE_SIZE + 0.01;
      b.vy = 0;
    } else b.y = ny;
  }
}
