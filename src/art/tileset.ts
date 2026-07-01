import Phaser from "phaser";
import { hex, mulberry32 } from "./pixel";
import { Tile } from "../core/tiles";

export const TS = 16; // tileset frame size
export const TILE_FRAMES = 26; // ids 0..25

// Cohesive earthy palette.
const P = {
  grass: 0x5aa93f,
  grassDk: 0x489033,
  grassLt: 0x76c455,
  dirt: 0x8a5a34,
  dirtDk: 0x6e4526,
  dirtLt: 0xa06d42,
  stone: 0x8a8f98,
  stoneDk: 0x686d76,
  stoneLt: 0xa6abb2,
  sand: 0xe4d29a,
  sandDk: 0xcbb87e,
  wood: 0x9c6b3f,
  woodDk: 0x6f4a29,
  woodLt: 0xb98a56,
  leaf: 0x3f9b3a,
  leafDk: 0x2f7a30,
  leafLt: 0x63bd52,
  plank: 0xc79a5e,
  plankDk: 0x9c7644,
  coal: 0x2a2a2e,
  iron: 0xd9a066,
  gold: 0xf5d13b,
  gem: 0x49e0e8,
  bedrock: 0x3a3540,
  bedrockDk: 0x272330,
  water: 0x3b8fd6,
  waterLt: 0x67b0ec,
  flame: 0xffb23a,
  flameHot: 0xffe27a,
  farm: 0x6b4a2c,
  farmDk: 0x513720,
  petal: 0xe86ab0,
  petalYell: 0xf5d13b,
};

function fill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: number): void {
  ctx.fillStyle = hex(c);
  ctx.fillRect(x, y, w, h);
}

/** Draws a single 16x16 tile at (x0,y0). Background left transparent for overlay tiles. */
export function drawTile(ctx: CanvasRenderingContext2D, x0: number, y0: number, id: number): void {
  const rnd = mulberry32(id * 2654435761 + 1);
  const speckle = (base: number, a: number, b: number, n: number) => {
    fill(ctx, x0, y0, TS, TS, base);
    for (let i = 0; i < n; i++) {
      const x = x0 + Math.floor(rnd() * TS);
      const y = y0 + Math.floor(rnd() * TS);
      fill(ctx, x, y, 1, 1, rnd() > 0.5 ? a : b);
    }
  };

  switch (id) {
    case Tile.AIR:
      return; // transparent

    case Tile.GRASS:
      speckle(P.dirt, P.dirtDk, P.dirtLt, 22);
      fill(ctx, x0, y0, TS, 4, P.grass);
      fill(ctx, x0, y0, TS, 1, P.grassLt);
      for (let i = 0; i < TS; i += 2) fill(ctx, x0 + i, y0 + 4, 1, rnd() > 0.5 ? 2 : 1, P.grassDk);
      break;

    case Tile.DIRT:
      speckle(P.dirt, P.dirtDk, P.dirtLt, 26);
      break;

    case Tile.STONE:
      speckle(P.stone, P.stoneDk, P.stoneLt, 24);
      fill(ctx, x0 + 4, y0 + 3, 4, 1, P.stoneDk);
      fill(ctx, x0 + 9, y0 + 8, 1, 4, P.stoneDk);
      fill(ctx, x0 + 3, y0 + 11, 3, 1, P.stoneLt);
      break;

    case Tile.SAND:
      speckle(P.sand, P.sandDk, P.sandDk, 20);
      break;

    case Tile.LOG:
      // vertical bark streaks (not ladder-like rungs)
      fill(ctx, x0, y0, TS, TS, P.wood);
      fill(ctx, x0, y0, 2, TS, P.woodDk);
      fill(ctx, x0 + TS - 2, y0, 2, TS, P.woodDk);
      fill(ctx, x0 + 4, y0, 1, TS, P.woodDk);
      fill(ctx, x0 + 9, y0, 1, TS, P.woodDk);
      fill(ctx, x0 + 6, y0, 1, TS, P.woodLt);
      fill(ctx, x0 + 12, y0, 1, TS, P.woodLt);
      // a couple of knots
      fill(ctx, x0 + 7, y0 + 4, 2, 2, P.woodDk);
      fill(ctx, x0 + 10, y0 + 11, 1, 2, P.woodDk);
      break;

    case Tile.LEAVES:
      // rounded blob, transparent corners
      fill(ctx, x0 + 1, y0 + 1, TS - 2, TS - 2, P.leaf);
      fill(ctx, x0 + 3, y0, TS - 6, 1, P.leaf);
      fill(ctx, x0 + 3, y0 + TS - 1, TS - 6, 1, P.leaf);
      fill(ctx, x0, y0 + 3, 1, TS - 6, P.leaf);
      fill(ctx, x0 + TS - 1, y0 + 3, 1, TS - 6, P.leaf);
      for (let i = 0; i < 18; i++) {
        const x = x0 + 1 + Math.floor(rnd() * (TS - 2));
        const y = y0 + 1 + Math.floor(rnd() * (TS - 2));
        fill(ctx, x, y, 1, 1, rnd() > 0.5 ? P.leafDk : P.leafLt);
      }
      break;

    case Tile.PLANKS:
      fill(ctx, x0, y0, TS, TS, P.plank);
      for (let y = 0; y < TS; y += 5) fill(ctx, x0, y0 + y, TS, 1, P.plankDk);
      fill(ctx, x0 + 7, y0, 1, TS, P.plankDk);
      fill(ctx, x0, y0 + 1, TS, 1, 0xd9b072);
      break;

    case Tile.COAL_ORE:
    case Tile.IRON_ORE:
    case Tile.GOLD_ORE:
    case Tile.GEM_ORE: {
      speckle(P.stone, P.stoneDk, P.stoneLt, 18);
      const oc =
        id === Tile.COAL_ORE ? P.coal : id === Tile.IRON_ORE ? P.iron : id === Tile.GOLD_ORE ? P.gold : P.gem;
      for (const [ox, oy] of [
        [3, 4],
        [9, 3],
        [6, 9],
        [11, 11],
        [4, 11],
      ] as const) {
        fill(ctx, x0 + ox, y0 + oy, 2, 2, oc);
        fill(ctx, x0 + ox, y0 + oy, 1, 1, 0xffffff);
      }
      break;
    }

    case Tile.BEDROCK:
      speckle(P.bedrock, P.bedrockDk, 0x4a4556, 30);
      break;

    case Tile.WATER:
      fill(ctx, x0, y0, TS, TS, P.water);
      for (let y = 2; y < TS; y += 5) fill(ctx, x0 + (y % 4), y0 + y, TS - 2, 1, P.waterLt);
      break;

    case Tile.FARMLAND:
      fill(ctx, x0, y0, TS, TS, P.farm);
      for (let y = 2; y < TS; y += 5) fill(ctx, x0, y0 + y, TS, 2, P.farmDk);
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
      fill(ctx, x0 + 7, y0 + 6, 2, 9, P.woodDk); // stick
      fill(ctx, x0 + 6, y0 + 3, 4, 4, P.flame);
      fill(ctx, x0 + 7, y0 + 2, 2, 3, P.flameHot);
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
      fill(ctx, x0 + TS - 4, y0 + 8, 1, 2, P.gold); // handle
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
      }
      break;

    case Tile.FLOWER:
      fill(ctx, x0 + 7, y0 + 8, 1, 6, P.grassDk);
      fill(ctx, x0 + 5, y0 + 4, 6, 6, P.petal);
      fill(ctx, x0 + 7, y0 + 6, 2, 2, P.petalYell);
      break;

    default:
      // wheat stages 20..23
      if (id >= Tile.WHEAT_0 && id <= Tile.WHEAT_3) {
        const stage = id - Tile.WHEAT_0; // 0..3
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

/** Dark underground background shown behind tiles so caves/tunnels aren't sky-blue. */
export function generateCaveBack(scene: Phaser.Scene): void {
  if (scene.textures.exists("caveback")) return;
  const tex = scene.textures.createCanvas("caveback", TS, TS);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;
  fill(ctx, 0, 0, TS, TS, 0x2a2733);
  const rnd = mulberry32(99);
  for (let i = 0; i < 24; i++) {
    fill(ctx, Math.floor(rnd() * TS), Math.floor(rnd() * TS), 1, 1, rnd() > 0.5 ? 0x211e29 : 0x35313f);
  }
  tex.refresh();
}

/** Builds the 'tiles' spritesheet texture with one frame per tile id. */
export function generateTileset(scene: Phaser.Scene): void {
  if (scene.textures.exists("tiles")) return;
  const tex = scene.textures.createCanvas("tiles", TS * TILE_FRAMES, TS);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, TS * TILE_FRAMES, TS);
  for (let id = 0; id < TILE_FRAMES; id++) {
    drawTile(ctx, id * TS, 0, id);
    tex.add(id, 0, id * TS, 0, TS, TS);
  }
  tex.refresh();
}
