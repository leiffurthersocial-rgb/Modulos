import Phaser from "phaser";
import { hex, mulberry32 } from "./pixel";
import { hash2 } from "../core/rng";
import { Tile } from "../core/tiles";

export const TS = 16; // tileset frame size
export const TILE_FRAMES = 26; // base ids 0..25

// Cohesive, slightly richer palette with more shades for depth.
const P = {
  grass: 0x5fae43,
  grassDk: 0x4a9333,
  grassDkr: 0x3b7628,
  grassLt: 0x7fca5c,
  grassLtr: 0x9bdc79,
  dirt: 0x8a5a30,
  dirtDk: 0x6d4522,
  dirtDkr: 0x573619,
  dirtLt: 0xa06d3e,
  stone: 0x8b909a,
  stoneDk: 0x6a6f79,
  stoneDkr: 0x52565f,
  stoneLt: 0xa7acb4,
  stoneLtr: 0xc3c7cd,
  sand: 0xe6d59b,
  sandDk: 0xcdba7c,
  sandDkr: 0xb39f63,
  sandLt: 0xf3e7bb,
  wood: 0x8a5e37,
  woodDk: 0x633f22,
  woodLt: 0xa87a4c,
  leaf: 0x3f9b3a,
  leafDk: 0x2f7a30,
  leafDkr: 0x245f26,
  leafLt: 0x64bd53,
  leafLtr: 0x86d873,
  plank: 0xc79a5e,
  plankDk: 0x9c7644,
  plankLt: 0xdcb072,
  coal: 0x2a2a2e,
  iron: 0xce9463,
  gold: 0xf5d13b,
  gem: 0x49e0e8,
  bedrock: 0x3a3540,
  bedrockDk: 0x272330,
  water: "rgba(58,140,214,0.72)",
  waterLt: "rgba(120,190,240,0.85)",
  waterDk: "rgba(40,104,170,0.8)",
  farm: 0x6b4a2c,
  farmDk: 0x513720,
  farmWet: 0x4a3320,
  petal: 0xe86ab0,
  petalYell: 0xf5d13b,
};

function fill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: number): void {
  ctx.fillStyle = hex(c);
  ctx.fillRect(x, y, w, h);
}
function fillS(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, style: string): void {
  ctx.fillStyle = style;
  ctx.fillRect(x, y, w, h);
}

/** Draws a single 16x16 tile at (x0,y0). `v` selects a texture variant. */
export function drawTile(ctx: CanvasRenderingContext2D, x0: number, y0: number, id: number, v = 0): void {
  const rnd = mulberry32(id * 2654435761 + v * 40503 + 1);
  const speckle = (base: number, a: number, b: number, n: number) => {
    fill(ctx, x0, y0, TS, TS, base);
    for (let i = 0; i < n; i++) {
      fill(ctx, x0 + Math.floor(rnd() * TS), y0 + Math.floor(rnd() * TS), 1, rnd() > 0.7 ? 2 : 1, rnd() > 0.5 ? a : b);
    }
  };

  switch (id) {
    case Tile.AIR:
      return;

    case Tile.GRASS: {
      // dirt body
      speckle(P.dirt, P.dirtDk, P.dirtLt, 20);
      fill(ctx, x0, y0 + TS - 2, TS, 2, P.dirtDkr); // bottom shade
      // grassy top
      fill(ctx, x0, y0, TS, 5, P.grass);
      fill(ctx, x0, y0, TS, 1, P.grassLtr);
      fill(ctx, x0, y0 + 4, TS, 1, P.grassDkr);
      // blades hanging over the edge + tufts
      for (let x = 0; x < TS; x += 1) {
        if (hash2(v + 7, x, 1) > 0.62) fill(ctx, x0 + x, y0 + 5, 1, 1 + Math.floor(hash2(v + 9, x, 2) * 2), P.grassDk);
        if (hash2(v + 3, x, 3) > 0.8) fill(ctx, x0 + x, y0 - 0, 1, 1, P.grassLt);
      }
      break;
    }

    case Tile.DIRT: {
      speckle(P.dirt, P.dirtDk, P.dirtLt, 24);
      // a couple of embedded pebbles
      for (let i = 0; i < 3; i++) {
        const px = 2 + Math.floor(rnd() * 11);
        const py = 2 + Math.floor(rnd() * 11);
        fill(ctx, x0 + px, y0 + py, 2, 2, P.dirtDkr);
        fill(ctx, x0 + px, y0 + py, 1, 1, P.dirtLt);
      }
      break;
    }

    case Tile.STONE: {
      speckle(P.stone, P.stoneDk, P.stoneLt, 22);
      // bevel
      fill(ctx, x0, y0, TS, 1, P.stoneLtr);
      fill(ctx, x0, y0, 1, TS, P.stoneLt);
      fill(ctx, x0, y0 + TS - 2, TS, 2, P.stoneDkr);
      fill(ctx, x0 + TS - 2, y0, 2, TS, P.stoneDk);
      // cracks (variant-dependent)
      const cx = 4 + Math.floor(rnd() * 6);
      const cy = 3 + Math.floor(rnd() * 5);
      fill(ctx, x0 + cx, y0 + cy, 1, 4, P.stoneDkr);
      fill(ctx, x0 + cx + 1, y0 + cy + 3, 3, 1, P.stoneDkr);
      fill(ctx, x0 + cx - 2, y0 + cy + 6, 3, 1, P.stoneDk);
      break;
    }

    case Tile.SAND: {
      speckle(P.sand, P.sandDk, P.sandLt, 30);
      fill(ctx, x0, y0, TS, 1, P.sandLt);
      fill(ctx, x0, y0 + TS - 1, TS, 1, P.sandDkr);
      break;
    }

    case Tile.LOG:
      fill(ctx, x0, y0, TS, TS, P.wood);
      fill(ctx, x0, y0, 2, TS, P.woodDk);
      fill(ctx, x0 + TS - 2, y0, 2, TS, P.woodDk);
      fill(ctx, x0 + 4, y0, 1, TS, P.woodDk);
      fill(ctx, x0 + 9, y0, 1, TS, P.woodDk);
      fill(ctx, x0 + 6, y0, 1, TS, P.woodLt);
      fill(ctx, x0 + 12, y0, 1, TS, P.woodLt);
      fill(ctx, x0 + 7, y0 + 4, 2, 2, P.woodDk);
      fill(ctx, x0 + 10, y0 + 11, 1, 2, P.woodDk);
      break;

    case Tile.LEAVES: {
      // rounded blob, transparent corners, layered greens
      fill(ctx, x0 + 1, y0 + 1, TS - 2, TS - 2, P.leafDk);
      fill(ctx, x0 + 2, y0 + 2, TS - 4, TS - 4, P.leaf);
      fill(ctx, x0 + 3, y0, TS - 6, 1, P.leaf);
      fill(ctx, x0 + 3, y0 + TS - 1, TS - 6, 1, P.leafDkr);
      fill(ctx, x0, y0 + 3, 1, TS - 6, P.leaf);
      fill(ctx, x0 + TS - 1, y0 + 3, 1, TS - 6, P.leafDkr);
      for (let i = 0; i < 22; i++) {
        const x = x0 + 1 + Math.floor(rnd() * (TS - 2));
        const y = y0 + 1 + Math.floor(rnd() * (TS - 2));
        const r = rnd();
        fill(ctx, x, y, 1, 1, r > 0.66 ? P.leafLtr : r > 0.33 ? P.leafLt : P.leafDkr);
      }
      break;
    }

    case Tile.PLANKS:
      fill(ctx, x0, y0, TS, TS, P.plank);
      for (let y = 0; y < TS; y += 5) {
        fill(ctx, x0, y0 + y, TS, 1, P.plankDk);
        fill(ctx, x0, y0 + y + 1, TS, 1, P.plankLt);
      }
      fill(ctx, x0 + 7, y0, 1, TS, P.plankDk);
      // nails
      fill(ctx, x0 + 2, y0 + 2, 1, 1, P.woodDk);
      fill(ctx, x0 + 12, y0 + 7, 1, 1, P.woodDk);
      break;

    case Tile.COAL_ORE:
    case Tile.IRON_ORE:
    case Tile.GOLD_ORE:
    case Tile.GEM_ORE: {
      speckle(P.stone, P.stoneDk, P.stoneLt, 16);
      fill(ctx, x0, y0, TS, 1, P.stoneLt);
      fill(ctx, x0, y0 + TS - 2, TS, 2, P.stoneDkr);
      const oc = id === Tile.COAL_ORE ? P.coal : id === Tile.IRON_ORE ? P.iron : id === Tile.GOLD_ORE ? P.gold : P.gem;
      for (const [ox, oy, s] of [
        [3, 4, 3],
        [9, 3, 2],
        [6, 9, 3],
        [11, 10, 2],
        [4, 11, 2],
      ] as const) {
        fill(ctx, x0 + ox, y0 + oy, s, s, oc);
        fill(ctx, x0 + ox, y0 + oy, 1, 1, 0xffffff);
      }
      break;
    }

    case Tile.BEDROCK:
      speckle(P.bedrock, P.bedrockDk, 0x4a4556, 34);
      break;

    case Tile.WATER:
      // transparent so the background shows through
      fillS(ctx, x0, y0, TS, TS, P.water);
      fillS(ctx, x0, y0, TS, 1, P.waterLt);
      for (let y = 3; y < TS; y += 6) fillS(ctx, x0 + (y % 4), y0 + y, TS - 3, 1, P.waterLt);
      for (let y = 6; y < TS; y += 6) fillS(ctx, x0 + 1, y0 + y, TS - 4, 1, P.waterDk);
      break;

    case Tile.FARMLAND:
      fill(ctx, x0, y0, TS, TS, P.farm);
      fill(ctx, x0, y0, TS, 2, P.dirt);
      for (let y = 3; y < TS; y += 5) {
        fill(ctx, x0, y0 + y, TS, 2, P.farmDk);
        fill(ctx, x0 + 2, y0 + y, 3, 1, P.farmWet);
      }
      break;

    case Tile.CRAFTING_TABLE:
      fill(ctx, x0, y0, TS, TS, P.plank);
      fill(ctx, x0, y0, TS, 4, P.woodDk);
      fill(ctx, x0, y0, TS, 1, P.woodLt);
      fill(ctx, x0 + 7, y0 + 4, 1, TS - 4, P.plankDk);
      fill(ctx, x0, y0 + 9, TS, 1, P.plankDk);
      fill(ctx, x0 + 3, y0 + 1, 2, 2, P.stone); // saw
      fill(ctx, x0 + 10, y0 + 1, 2, 2, 0x9c6b3f);
      break;

    case Tile.TORCH:
      fill(ctx, x0 + 7, y0 + 6, 2, 9, P.woodDk);
      fill(ctx, x0 + 6, y0 + 3, 4, 4, 0xffb23a);
      fill(ctx, x0 + 7, y0 + 1, 2, 4, 0xffe27a);
      fill(ctx, x0 + 7, y0 + 5, 2, 1, 0xffffff);
      break;

    case Tile.LADDER:
      fill(ctx, x0 + 2, y0, 2, TS, P.wood);
      fill(ctx, x0 + TS - 4, y0, 2, TS, P.wood);
      for (let y = 2; y < TS; y += 5) fill(ctx, x0 + 2, y0 + y, TS - 4, 2, P.woodLt);
      break;

    case Tile.DOOR:
      fill(ctx, x0 + 1, y0, TS - 2, TS, P.wood);
      fill(ctx, x0 + 1, y0, TS - 2, 1, P.woodLt);
      fill(ctx, x0 + 3, y0 + 2, TS - 6, 5, P.woodDk);
      fill(ctx, x0 + 3, y0 + 9, TS - 6, 5, P.woodDk);
      fill(ctx, x0 + TS - 4, y0 + 8, 1, 2, P.gold);
      break;

    case Tile.SAPLING:
      fill(ctx, x0 + 7, y0 + 9, 2, 5, P.woodDk);
      fill(ctx, x0 + 4, y0 + 6, 8, 4, P.leaf);
      fill(ctx, x0 + 6, y0 + 5, 4, 2, P.leafLt);
      break;

    case Tile.TALL_GRASS:
      for (const gx of [3, 6, 9, 12]) {
        const gh = 5 + Math.floor(rnd() * 4);
        fill(ctx, x0 + gx, y0 + TS - gh, 1, gh, rnd() > 0.5 ? P.grass : P.grassDk);
        fill(ctx, x0 + gx, y0 + TS - gh, 1, 1, P.grassLt);
      }
      break;

    case Tile.FLOWER:
      fill(ctx, x0 + 7, y0 + 8, 1, 6, P.grassDk);
      fill(ctx, x0 + 5, y0 + 4, 6, 6, P.petal);
      fill(ctx, x0 + 7, y0 + 6, 2, 2, P.petalYell);
      fill(ctx, x0 + 5, y0 + 4, 2, 2, 0xf29ad0);
      break;

    default:
      if (id >= Tile.WHEAT_0 && id <= Tile.WHEAT_3) {
        const stage = id - Tile.WHEAT_0;
        const h = 4 + stage * 3;
        const col = stage >= 3 ? P.gold : stage >= 2 ? 0xbfa14a : P.grassDk;
        for (const gx of [4, 7, 10]) {
          fill(ctx, x0 + gx, y0 + TS - h, 1, h, col);
          if (stage >= 2) fill(ctx, x0 + gx - 1, y0 + TS - h, 3, 2, col);
        }
      }
      break;
  }
}

// ---- variant table so terrain doesn't visibly tile ----
const VARIANTS: Record<number, number[]> = {};

/** Returns the tileset frame index to draw for a world position. */
export function tileFrame(id: number, wx: number, wy: number): number {
  const vs = VARIANTS[id];
  if (!vs) return id;
  return vs[Math.floor(hash2(1234, wx, wy) * vs.length) % vs.length];
}

/** Dark underground background shown behind tiles so caves/tunnels aren't sky-blue. */
export function generateCaveBack(scene: Phaser.Scene): void {
  if (scene.textures.exists("caveback")) return;
  const tex = scene.textures.createCanvas("caveback", TS, TS);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;
  fill(ctx, 0, 0, TS, TS, 0x2a2733);
  const rnd = mulberry32(99);
  for (let i = 0; i < 24; i++) fill(ctx, Math.floor(rnd() * TS), Math.floor(rnd() * TS), 1, 1, rnd() > 0.5 ? 0x211e29 : 0x35313f);
  tex.refresh();
}

/** Builds the 'tiles' spritesheet with base frames + terrain variants. */
export function generateTileset(scene: Phaser.Scene): void {
  if (scene.textures.exists("tiles")) return;

  const variantCounts: Record<number, number> = {
    [Tile.GRASS]: 3,
    [Tile.DIRT]: 3,
    [Tile.STONE]: 4,
    [Tile.SAND]: 3,
  };
  let total = TILE_FRAMES;
  for (const c of Object.values(variantCounts)) total += c - 1;

  const tex = scene.textures.createCanvas("tiles", TS * total, TS);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, TS * total, TS);

  for (let id = 0; id < TILE_FRAMES; id++) {
    drawTile(ctx, id * TS, 0, id, 0);
    tex.add(id, 0, id * TS, 0, TS, TS);
  }
  let n = TILE_FRAMES;
  for (const [idStr, count] of Object.entries(variantCounts)) {
    const id = Number(idStr);
    VARIANTS[id] = [id];
    for (let v = 1; v < count; v++) {
      drawTile(ctx, n * TS, 0, id, v);
      tex.add(n, 0, n * TS, 0, TS, TS);
      VARIANTS[id].push(n);
      n++;
    }
  }
  tex.refresh();
}
