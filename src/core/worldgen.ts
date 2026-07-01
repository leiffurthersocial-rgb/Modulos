import { BEDROCK_ROWS, CHUNK_W, SEA_LEVEL, SURFACE_BASE, WORLD_H } from "./constants";
import { fbm1D, fbm2D, hash2 } from "./rng";
import { Tile } from "./tiles";

/** Deterministic surface row for a world column. */
export function surfaceHeight(seed: number, wx: number): number {
  const hills = (fbm1D(seed, wx * 0.03, 4) - 0.5) * 2 * 16;
  const mountains = (fbm1D(seed + 991, wx * 0.008, 3) - 0.5) * 2 * 22;
  const h = Math.round(SURFACE_BASE + hills + mountains);
  return Math.max(24, Math.min(WORLD_H - 60, h));
}

/** Returns trunk height (>0) if a tree roots at this column, else 0. */
function treeAt(seed: number, wx: number): number {
  if (hash2(seed + 3001, wx, 0) > 0.09) return 0;
  // enforce a little spacing: no tree if a neighbour also rolled one
  if (hash2(seed + 3001, wx - 1, 0) <= 0.09) return 0;
  return 4 + Math.floor(hash2(seed + 3002, wx, 0) * 3); // 4..6
}

function oreAt(seed: number, wx: number, wy: number, depth: number): number {
  const clump = fbm2D(seed + 500, wx * 0.18, wy * 0.18, 2);
  const r = hash2(seed + 700, wx, wy);
  if (depth > 60 && clump > 0.66 && r < 0.28) return Tile.GEM_ORE;
  if (depth > 40 && clump > 0.62 && r < 0.34) return Tile.GOLD_ORE;
  if (depth > 18 && clump > 0.58 && r < 0.4) return Tile.IRON_ORE;
  if (depth > 5 && clump > 0.55 && r < 0.5) return Tile.COAL_ORE;
  return 0;
}

function isCave(seed: number, wx: number, wy: number): boolean {
  const a = fbm2D(seed + 7, wx * 0.055, wy * 0.09, 3);
  const b = fbm2D(seed + 71, wx * 0.09, wy * 0.055, 3);
  return Math.abs(a - 0.5) < 0.055 || Math.abs(b - 0.5) < 0.05;
}

/** Generates a chunk as a column-major Uint16Array: idx = localX * WORLD_H + y. */
export function generateChunk(cx: number, seed: number): Uint16Array {
  const data = new Uint16Array(CHUNK_W * WORLD_H);
  const start = cx * CHUNK_W;

  for (let lx = 0; lx < CHUNK_W; lx++) {
    const wx = start + lx;
    const surfaceY = surfaceHeight(seed, wx);
    const dirtDepth = 4 + Math.floor(hash2(seed + 12, wx, 3) * 3);
    const underwater = surfaceY > SEA_LEVEL; // ground dips below sea level → basin
    const sandy = surfaceY >= SEA_LEVEL - 2; // shorelines and lakebeds are sandy

    for (let y = 0; y < WORLD_H; y++) {
      const idx = lx * WORLD_H + y;
      let id: number = Tile.AIR;

      if (y >= WORLD_H - BEDROCK_ROWS) {
        id = Tile.BEDROCK;
      } else if (y < surfaceY) {
        id = underwater && y >= SEA_LEVEL ? Tile.WATER : Tile.AIR;
      } else if (y < surfaceY + dirtDepth) {
        if (sandy) id = Tile.SAND;
        else id = y === surfaceY ? Tile.GRASS : Tile.DIRT;
      } else {
        const depth = y - surfaceY;
        if (isCave(seed, wx, y)) {
          id = Tile.AIR;
        } else {
          id = oreAt(seed, wx, y, depth) || Tile.STONE;
        }
      }
      data[idx] = id;
    }

    // Surface decoration on the grass top (only on dry grassy land).
    const topIdx = lx * WORLD_H + surfaceY;
    if (data[topIdx] === Tile.GRASS && surfaceY - 1 >= 0) {
      const r = hash2(seed + 88, wx, 1);
      if (r < 0.18) data[lx * WORLD_H + (surfaceY - 1)] = Tile.FLOWER;
      else if (r < 0.5) data[lx * WORLD_H + (surfaceY - 1)] = Tile.TALL_GRASS;
    }
  }

  // Trees: stamp from an extended root range so canopies cross chunk seams seamlessly.
  for (let wx = start - 3; wx < start + CHUNK_W + 3; wx++) {
    const th = treeAt(seed, wx);
    if (th === 0) continue;
    const groundY = surfaceHeight(seed, wx);
    if (groundY >= SEA_LEVEL - 2) continue; // no trees on beaches / in water
    stampTree(data, start, wx, groundY, th, seed);
  }

  return data;
}

function put(data: Uint16Array, start: number, wx: number, y: number, id: number, overwriteAir = false): void {
  const lx = wx - start;
  if (lx < 0 || lx >= CHUNK_W || y < 0 || y >= WORLD_H) return;
  const idx = lx * WORLD_H + y;
  if (overwriteAir && data[idx] !== Tile.AIR) return;
  data[idx] = id;
}

function stampTree(data: Uint16Array, start: number, rootX: number, groundY: number, th: number, seed: number): void {
  const topY = groundY - 1 - th;
  // clear any deco above the root, then trunk
  put(data, start, rootX, groundY - 1, Tile.LOG);
  for (let i = 0; i < th; i++) {
    put(data, start, rootX, groundY - 1 - i, Tile.LOG);
  }
  // leaf canopy (3x wide blob around the top)
  for (let dx = -2; dx <= 2; dx++) {
    for (let dy = -2; dy <= 1; dy++) {
      if (Math.abs(dx) === 2 && dy <= -2) continue;
      const lx = rootX + dx;
      const ly = topY + dy;
      // slightly ragged edges
      if (Math.abs(dx) === 2 && hash2(seed + 61, lx, ly) < 0.4) continue;
      put(data, start, lx, ly, Tile.LEAVES, true);
    }
  }
}
