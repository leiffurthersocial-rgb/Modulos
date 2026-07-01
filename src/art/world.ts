import Phaser from "phaser";
import { darken, hashString, lighten, makeCanvas, mulberry32, px } from "./pixel";

const TILE = 32;

// Cohesive earthy palette shared across the world.
const PAL = {
  grass: 0x5aa04a,
  grassDark: 0x468a3a,
  grassLight: 0x74b85c,
  soil: 0x7a5230,
  soilDark: 0x5f3f24,
  soilLight: 0x8f6338,
  stone: 0x9099a0,
  stoneDark: 0x6c757c,
  stoneLight: 0xafb6bc,
  water: 0x2f77b0,
  waterDark: 0x255f90,
  waterLight: 0x59a0d8,
  path: 0xc2a878,
  pathDark: 0x9c8358,
  cave: 0x494050,
  caveDark: 0x362f3e,
  caveLight: 0x5b5266,
  wood: 0x7b4a26,
  woodDark: 0x5c3719,
  leaf: 0x3f8f3a,
  leafDark: 0x2f7030,
  leafLight: 0x63b055,
};

/** Generates every non-character texture the game needs. */
export function generateWorldTextures(scene: Phaser.Scene): void {
  grassTile(scene, "tile_grass", 1, false, false);
  grassTile(scene, "tile_grass2", 7, true, false);
  grassTile(scene, "tile_grass3", 13, false, true);
  speckleTile(scene, "tile_dirt", PAL.soil, PAL.soilDark, PAL.soilLight, 21);
  stoneTile(scene, "tile_stone");
  waterTile(scene, "tile_water");
  pathTile(scene, "tile_path");
  caveTile(scene, "tile_cave");
  // legacy key still referenced as a fallback swatch
  speckleTile(scene, "tile_mineEntrance", PAL.caveDark, 0x000000, PAL.cave, 3);

  treeProp(scene, "prop_tree");
  houseProp(scene, "prop_house");
  mineProp(scene, "prop_mine");
  ladderProp(scene, "prop_ladder");
  oreProp(scene, "prop_ore");
  bushProp(scene, "prop_bush");
  flowerProp(scene, "prop_flower");
}

function grassTile(scene: Phaser.Scene, key: string, seed: number, flower: boolean, pebble: boolean): void {
  const c = makeCanvas(scene, key, TILE, TILE);
  if (!c) return;
  const { ctx } = c;
  px(ctx, 0, 0, TILE, TILE, PAL.grass);
  const rnd = mulberry32(seed);
  for (let i = 0; i < 60; i++) {
    const x = Math.floor(rnd() * TILE);
    const y = Math.floor(rnd() * TILE);
    const shade = rnd();
    px(ctx, x, y, 1, shade > 0.5 ? 2 : 1, shade > 0.5 ? PAL.grassDark : PAL.grassLight);
  }
  // little grass blades
  for (let i = 0; i < 6; i++) {
    const x = 2 + Math.floor(rnd() * (TILE - 4));
    const y = 4 + Math.floor(rnd() * (TILE - 8));
    px(ctx, x, y, 1, 3, PAL.grassDark);
    px(ctx, x + 1, y + 1, 1, 2, PAL.grassLight);
  }
  if (flower) {
    const x = 8 + Math.floor(rnd() * 16);
    const y = 8 + Math.floor(rnd() * 16);
    px(ctx, x, y, 2, 2, 0xf2d94e); // petals
    px(ctx, x, y - 1, 2, 1, 0xffffff);
    px(ctx, x - 1, y, 1, 2, 0xffffff);
  }
  if (pebble) {
    const x = 6 + Math.floor(rnd() * 18);
    const y = 6 + Math.floor(rnd() * 18);
    px(ctx, x, y, 3, 2, PAL.stoneDark);
    px(ctx, x, y, 2, 1, PAL.stoneLight);
  }
  c.tex.refresh();
}

function speckleTile(
  scene: Phaser.Scene,
  key: string,
  base: number,
  dark: number,
  light: number,
  seed: number,
): void {
  const c = makeCanvas(scene, key, TILE, TILE);
  if (!c) return;
  const { ctx } = c;
  px(ctx, 0, 0, TILE, TILE, base);
  const rnd = mulberry32(seed);
  for (let i = 0; i < 70; i++) {
    const x = Math.floor(rnd() * TILE);
    const y = Math.floor(rnd() * TILE);
    px(ctx, x, y, 1, 1, rnd() > 0.5 ? dark : light);
  }
  c.tex.refresh();
}

function stoneTile(scene: Phaser.Scene, key: string): void {
  const c = makeCanvas(scene, key, TILE, TILE);
  if (!c) return;
  const { ctx } = c;
  px(ctx, 0, 0, TILE, TILE, PAL.stone);
  // bevel for a 3D block look
  px(ctx, 0, 0, TILE, 1, PAL.stoneLight);
  px(ctx, 0, 0, 1, TILE, PAL.stoneLight);
  px(ctx, 0, TILE - 2, TILE, 2, PAL.stoneDark);
  px(ctx, TILE - 2, 0, 2, TILE, PAL.stoneDark);
  const rnd = mulberry32(31);
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(rnd() * TILE);
    const y = Math.floor(rnd() * TILE);
    px(ctx, x, y, 1, 1, rnd() > 0.5 ? PAL.stoneDark : PAL.stoneLight);
  }
  // a couple of cracks
  px(ctx, 10, 6, 1, 6, PAL.stoneDark);
  px(ctx, 11, 11, 5, 1, PAL.stoneDark);
  px(ctx, 22, 18, 1, 7, PAL.stoneDark);
  c.tex.refresh();
}

function waterTile(scene: Phaser.Scene, key: string): void {
  const c = makeCanvas(scene, key, TILE, TILE);
  if (!c) return;
  const { ctx } = c;
  px(ctx, 0, 0, TILE, TILE, PAL.water);
  const rnd = mulberry32(9);
  for (let y = 3; y < TILE; y += 7) {
    const off = Math.floor(rnd() * 6);
    for (let x = 0; x < TILE; x += 8) {
      px(ctx, x + off, y, 4, 1, PAL.waterLight);
      px(ctx, x + off, y + 1, 3, 1, PAL.waterDark);
    }
  }
  c.tex.refresh();
}

function pathTile(scene: Phaser.Scene, key: string): void {
  const c = makeCanvas(scene, key, TILE, TILE);
  if (!c) return;
  const { ctx } = c;
  px(ctx, 0, 0, TILE, TILE, PAL.path);
  // cobble grid
  ctx.fillStyle = `#${PAL.pathDark.toString(16)}`;
  for (let y = 0; y < TILE; y += 8) {
    px(ctx, 0, y, TILE, 1, PAL.pathDark);
  }
  const rnd = mulberry32(17);
  for (let y = 0; y < TILE; y += 8) {
    const stagger = (y / 8) % 2 === 0 ? 0 : 8;
    for (let x = stagger; x < TILE; x += 16) {
      px(ctx, x, y, 1, 8, PAL.pathDark);
    }
  }
  for (let i = 0; i < 30; i++) {
    const x = Math.floor(rnd() * TILE);
    const y = Math.floor(rnd() * TILE);
    px(ctx, x, y, 1, 1, rnd() > 0.5 ? PAL.pathDark : lighten(PAL.path, 0.2));
  }
  c.tex.refresh();
}

function caveTile(scene: Phaser.Scene, key: string): void {
  speckleTile(scene, key, PAL.cave, PAL.caveDark, PAL.caveLight, 5);
}

function treeProp(scene: Phaser.Scene, key: string): void {
  const w = 32;
  const h = 44;
  const c = makeCanvas(scene, key, w, h);
  if (!c) return;
  const { ctx } = c;
  // trunk
  px(ctx, 13, 30, 6, 12, PAL.woodDark);
  px(ctx, 14, 30, 4, 12, PAL.wood);
  px(ctx, 14, 30, 1, 12, lighten(PAL.wood, 0.25));
  // canopy (layered blobs)
  const blobs: Array<[number, number, number]> = [
    [16, 12, 13],
    [9, 18, 9],
    [23, 18, 9],
    [16, 22, 12],
  ];
  for (const [cx, cy, r] of blobs) {
    ctx.fillStyle = `#${PAL.leafDark.toString(16)}`;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const [cx, cy, r] of blobs) {
    ctx.fillStyle = `#${PAL.leaf.toString(16)}`;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
    ctx.fill();
  }
  // highlights
  const rnd = mulberry32(42);
  for (let i = 0; i < 40; i++) {
    const x = 4 + Math.floor(rnd() * 24);
    const y = 4 + Math.floor(rnd() * 24);
    if (Math.hypot(x - 16, y - 18) < 13) px(ctx, x, y, 2, 2, PAL.leafLight);
  }
  c.tex.refresh();
}

function houseProp(scene: Phaser.Scene, key: string): void {
  const w = 64;
  const h = 60;
  const c = makeCanvas(scene, key, w, h);
  if (!c) return;
  const { ctx } = c;
  const wall = 0xd9b892;
  const wallSh = 0xbf9d78;
  const roof = 0xa5402f;
  const roofSh = 0x842f22;
  const roofHi = 0xc25a45;
  // walls
  px(ctx, 6, 24, 52, 34, wallSh);
  px(ctx, 6, 24, 52, 34, wall);
  px(ctx, 6, 24, 52, 2, lighten(wall, 0.2));
  px(ctx, 6, 54, 52, 4, wallSh);
  // wood beams
  px(ctx, 6, 24, 2, 34, PAL.woodDark);
  px(ctx, 56, 24, 2, 34, PAL.woodDark);
  // roof (triangular)
  for (let i = 0; i < 22; i++) {
    const y = 2 + i;
    const half = Math.floor((i / 22) * 34);
    px(ctx, 32 - half, y, half * 2, 1, i < 4 ? roofHi : roof);
  }
  px(ctx, 0, 22, 64, 4, roofSh);
  px(ctx, 0, 22, 64, 1, roofHi);
  // door
  px(ctx, 27, 40, 10, 18, PAL.woodDark);
  px(ctx, 28, 41, 8, 17, PAL.wood);
  px(ctx, 34, 49, 1, 2, 0xf2d94e); // handle
  // windows
  for (const wx of [12, 44]) {
    px(ctx, wx, 30, 9, 9, PAL.woodDark);
    px(ctx, wx + 1, 31, 7, 7, 0x8fd0e6);
    px(ctx, wx + 4, 31, 1, 7, PAL.woodDark);
    px(ctx, wx + 1, 34, 7, 1, PAL.woodDark);
  }
  c.tex.refresh();
}

function mineProp(scene: Phaser.Scene, key: string): void {
  const w = 48;
  const h = 44;
  const c = makeCanvas(scene, key, w, h);
  if (!c) return;
  const { ctx } = c;
  // rocky mound
  ctx.fillStyle = `#${PAL.stoneDark.toString(16)}`;
  ctx.beginPath();
  ctx.ellipse(24, 26, 23, 18, 0, Math.PI, 0);
  ctx.fill();
  const rnd = mulberry32(88);
  for (let i = 0; i < 80; i++) {
    const x = Math.floor(rnd() * w);
    const y = 8 + Math.floor(rnd() * 34);
    if (Math.hypot((x - 24) / 23, (y - 26) / 18) < 1)
      px(ctx, x, y, 2, 2, rnd() > 0.5 ? PAL.stone : PAL.stoneLight);
  }
  // dark entrance arch
  ctx.fillStyle = "#0a0a10";
  ctx.beginPath();
  ctx.ellipse(24, 34, 11, 12, 0, Math.PI, 0);
  ctx.fill();
  px(ctx, 13, 34, 22, 10, 0x0a0a10);
  // wooden supports
  px(ctx, 12, 22, 3, 22, PAL.woodDark);
  px(ctx, 33, 22, 3, 22, PAL.woodDark);
  px(ctx, 11, 20, 26, 3, PAL.wood);
  c.tex.refresh();
}

function ladderProp(scene: Phaser.Scene, key: string): void {
  const c = makeCanvas(scene, key, TILE, TILE);
  if (!c) return;
  const { ctx } = c;
  px(ctx, 0, 0, TILE, TILE, darken(PAL.cave, 0.7));
  px(ctx, 8, 2, 3, 28, PAL.wood);
  px(ctx, 21, 2, 3, 28, PAL.wood);
  px(ctx, 8, 2, 1, 28, lighten(PAL.wood, 0.25));
  for (let y = 5; y < 30; y += 6) {
    px(ctx, 8, y, 16, 3, PAL.woodDark);
    px(ctx, 8, y, 16, 1, lighten(PAL.wood, 0.2));
  }
  c.tex.refresh();
}

function oreProp(scene: Phaser.Scene, key: string): void {
  const c = makeCanvas(scene, key, TILE, TILE);
  if (!c) return;
  const { ctx } = c;
  // rock body
  px(ctx, 4, 6, 24, 22, PAL.stoneDark);
  px(ctx, 5, 7, 22, 20, PAL.stone);
  px(ctx, 5, 7, 22, 2, PAL.stoneLight);
  px(ctx, 5, 25, 22, 2, PAL.stoneDark);
  const rnd = mulberry32(hashString(key));
  // glinting ore veins
  const ore = 0x66d0e0;
  const oreHi = 0xbdf3fb;
  for (let i = 0; i < 6; i++) {
    const x = 8 + Math.floor(rnd() * 14);
    const y = 10 + Math.floor(rnd() * 12);
    px(ctx, x, y, 2, 2, ore);
    px(ctx, x, y, 1, 1, oreHi);
  }
  c.tex.refresh();
}

function bushProp(scene: Phaser.Scene, key: string): void {
  const c = makeCanvas(scene, key, TILE, TILE);
  if (!c) return;
  const { ctx } = c;
  ctx.fillStyle = `#${PAL.leafDark.toString(16)}`;
  ctx.beginPath();
  ctx.ellipse(16, 20, 13, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `#${PAL.leaf.toString(16)}`;
  ctx.beginPath();
  ctx.ellipse(16, 19, 11, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  const rnd = mulberry32(77);
  for (let i = 0; i < 24; i++) {
    const x = 6 + Math.floor(rnd() * 20);
    const y = 12 + Math.floor(rnd() * 12);
    if (Math.hypot((x - 16) / 11, (y - 19) / 7) < 1) px(ctx, x, y, 2, 2, PAL.leafLight);
  }
  // a few berries
  for (const [bx, by] of [
    [10, 18],
    [20, 22],
    [16, 16],
  ]) {
    px(ctx, bx, by, 2, 2, 0xd8443a);
    px(ctx, bx, by, 1, 1, 0xf28a80);
  }
  c.tex.refresh();
}

function flowerProp(scene: Phaser.Scene, key: string): void {
  const c = makeCanvas(scene, key, TILE, TILE);
  if (!c) return;
  const { ctx } = c;
  // stem
  px(ctx, 15, 16, 2, 12, PAL.leafDark);
  px(ctx, 12, 20, 4, 2, PAL.leaf);
  px(ctx, 16, 23, 4, 2, PAL.leaf);
  // bloom
  const petal = 0xe86ab0;
  px(ctx, 13, 8, 6, 6, petal);
  px(ctx, 11, 10, 10, 2, petal);
  px(ctx, 15, 6, 2, 10, petal);
  px(ctx, 14, 9, 4, 4, 0xf7d94a); // center
  c.tex.refresh();
}
