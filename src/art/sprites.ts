import Phaser from "phaser";
import { CHARACTERS, type CharacterDef } from "../config/characters";
import { allItemIds, itemDef } from "../core/items";
import { darken, hex, lighten, makeCanvas } from "./pixel";
import { drawTile } from "./tileset";

export const PW = 20; // player frame width  (Terraria source is 20x28)
export const PH = 28; // player frame height
export const PLAYER_FRAMES = 6; // 0 idle, 1-4 walk, 5 jump
const OUT = 0x201812;
const PANTS = 0x3a4a66;
const PANTS_SH = 0x2b3a52;
const SHOES = 0x2a2320;

function f(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: number): void {
  ctx.fillStyle = hex(c);
  ctx.fillRect(x, y, w, h);
}

/** Filled rect with a 1px dark outline — the crisp pixel-art silhouette. */
function part(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: number): void {
  f(ctx, x - 1, y - 1, w + 2, h + 2, OUT);
  f(ctx, x, y, w, h, c);
}

interface FramePose {
  phase: -1 | 0 | 1; // leg/arm swing phase
  jump: boolean;
}
const POSES: FramePose[] = [
  { phase: 0, jump: false }, // idle
  { phase: 1, jump: false }, // walk 1
  { phase: 0, jump: false }, // walk 2 (pass)
  { phase: -1, jump: false }, // walk 3
  { phase: 0, jump: false }, // walk 4 (pass)
  { phase: 0, jump: true }, // jump
];

/** Detailed 20x28 side-view character, facing right. */
function drawPlayer(ctx: CanvasRenderingContext2D, x0: number, char: CharacterDef, pose: FramePose): void {
  const skin = char.skinTone;
  const skinSh = darken(skin, 0.84);
  const skinHl = lighten(skin, 0.14);
  const hair = char.hairColor;
  const hairSh = darken(hair, 0.68);
  const hairHl = lighten(hair, 0.24);
  const shirt = char.shirtColor;
  const shirtSh = darken(shirt, 0.76);
  const shirtHl = lighten(shirt, 0.16);

  const musc = char.build === "muscular";
  const { phase, jump } = pose;

  // Geometry (relative to x0). Feet at y=27.
  const hipY = 20;
  const legW = 3;
  const lBase = x0 + 6;
  const rBase = x0 + 11;

  // ---- Legs (behind torso) ----
  const drawLeg = (baseX: number, dx: number, short: number) => {
    const top = hipY;
    const len = 7 - short;
    part(ctx, baseX + dx, top, legW, len, PANTS);
    f(ctx, baseX + dx + legW - 1, top, 1, len - 2, PANTS_SH);
    f(ctx, baseX + dx, top + len - 2, legW, 2, SHOES); // shoe
    f(ctx, baseX + dx, top + len - 1, legW + 1, 1, SHOES); // shoe toe
  };
  if (jump) {
    drawLeg(lBase, -1, 2);
    drawLeg(rBase, 1, 2);
  } else {
    drawLeg(lBase, -phase * 2, phase > 0 ? 1 : 0);
    drawLeg(rBase, phase * 2, phase < 0 ? 1 : 0);
  }

  // ---- Back arm (behind torso) ----
  const tx = x0 + 5;
  const tw = musc ? 11 : 10;
  const ty = 12;
  const th = hipY - ty;
  part(ctx, tx - 2, ty + 1, 2, 6, shirtSh);
  f(ctx, tx - 2, ty + 6, 2, 2, skinSh); // back hand

  // ---- Torso ----
  part(ctx, tx, ty, tw, th, shirt);
  f(ctx, tx, ty, 1, th, shirtHl); // left highlight
  f(ctx, tx + tw - 2, ty, 2, th, shirtSh); // right shade
  f(ctx, tx, ty + th - 1, tw, 1, darken(shirt, 0.55)); // belt/hem
  if (musc) f(ctx, tx + 2, ty + 2, tw - 4, 1, shirtHl); // chest

  // ---- Front arm (swings) ----
  const armSwing = jump ? 1 : phase * 1;
  const faX = tx + tw - 1 + armSwing;
  const faY = jump ? ty - 2 : ty + 1;
  part(ctx, faX, faY, 3, 6, shirt);
  f(ctx, faX + 2, faY, 1, 5, shirtSh);
  f(ctx, faX, faY + 5, 3, 2, skin); // hand

  // ---- Head ----
  const hx = x0 + 6;
  const hy = 3;
  const hw = 8;
  const hh = 9;
  part(ctx, hx, hy, hw, hh, skin);
  f(ctx, hx, hy, 1, hh, skinHl); // left light
  f(ctx, hx + hw - 1, hy + 1, 1, hh - 1, skinSh); // right cheek shade
  f(ctx, hx - 1, hy + 4, 1, 3, skin); // ear
  f(ctx, hx + hw, hy + 4, 1, 2, skinSh); // nose bump at the front

  // ---- Face (facing right) ----
  f(ctx, hx + hw - 4, hy + 3, 3, 1, hairSh); // brow
  f(ctx, hx + hw - 4, hy + 4, 3, 2, 0xf4f4f4); // eye white
  f(ctx, hx + hw - 3, hy + 4, 2, 2, char.eyeColor); // iris
  f(ctx, hx + hw - 4, hy + 7, 2, 1, skinSh); // mouth

  // ---- Hair (short for everyone) ----
  part(ctx, hx - 1, hy - 2, hw + 2, 3, hair); // crown
  f(ctx, hx - 1, hy - 2, hw + 2, 1, hairHl); // sheen
  f(ctx, hx - 1, hy, 2, 5, hair); // back of head
  f(ctx, hx - 1, hy, 1, 5, hairSh);
  f(ctx, hx + hw - 4, hy - 1, 4, 2, hair); // fringe
  f(ctx, hx + hw - 1, hy, 1, 3, hair); // short sideburn
  if (char.id === "leonidas") {
    f(ctx, hx + 1, hy - 3, hw - 3, 2, hair); // styled quiff
    f(ctx, hx + 1, hy - 3, hw - 4, 1, hairHl);
  }

  // ---- Accessories ----
  if (char.accessories.includes("glasses")) {
    ctx.strokeStyle = hex(0x181818);
    ctx.lineWidth = 1;
    ctx.strokeRect(hx + hw - 4.5, hy + 3.5, 3, 3);
    f(ctx, hx + hw - 1, hy + 4, 1, 1, 0x181818); // bridge to ear
  }
  if (char.accessories.includes("goatee")) {
    f(ctx, hx + hw - 4, hy + hh - 1, 3, 2, hairSh);
    f(ctx, hx + hw - 3, hy + hh + 1, 2, 1, hair);
  }
}

export function generatePlayerTextures(scene: Phaser.Scene): void {
  for (const char of CHARACTERS) {
    const key = char.spriteKey;
    if (scene.textures.exists(key)) continue;
    const tex = scene.textures.createCanvas(key, PW * PLAYER_FRAMES, PH);
    if (!tex) continue;
    const ctx = tex.getContext();
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, PW * PLAYER_FRAMES, PH);
    POSES.forEach((pose, i) => {
      drawPlayer(ctx, i * PW, char, pose);
      tex.add(i, 0, i * PW, 0, PW, PH);
    });
    tex.refresh();
  }
}

// ---------------- Item icons ----------------

const ICON = 16;

function drawTool(ctx: CanvasRenderingContext2D, type: string, tier: number): void {
  const handle = 0x6f4a29;
  const head = tier >= 2 ? 0x8a8f98 : 0xb98a56;
  // handle diagonal bottom-left -> top-right
  for (let i = 0; i < 9; i++) f(ctx, 4 + i, 13 - i, 2, 2, handle);
  if (type === "pickaxe") {
    f(ctx, 9, 2, 5, 2, head);
    f(ctx, 10, 1, 1, 2, head);
    f(ctx, 13, 1, 1, 2, head);
  } else if (type === "axe") {
    f(ctx, 11, 2, 3, 5, head);
    f(ctx, 10, 3, 1, 3, head);
  } else if (type === "shovel") {
    f(ctx, 11, 2, 3, 4, head);
    f(ctx, 12, 6, 1, 1, head);
  } else {
    // hoe
    f(ctx, 10, 2, 5, 2, head);
    f(ctx, 14, 2, 1, 3, head);
  }
}

function drawItemIcon(ctx: CanvasRenderingContext2D, id: string): void {
  switch (id) {
    case "stick":
      for (let i = 0; i < 9; i++) f(ctx, 5 + i, 12 - i, 2, 2, 0x8a5a34);
      return;
    case "coal":
      f(ctx, 4, 5, 8, 7, 0x2a2a2e);
      f(ctx, 6, 6, 2, 2, 0x4a4a52);
      return;
    case "iron_ore":
      f(ctx, 4, 5, 8, 7, 0x8a8f98);
      f(ctx, 6, 6, 2, 2, 0xd9a066);
      f(ctx, 9, 8, 2, 2, 0xd9a066);
      return;
    case "gold_ore":
      f(ctx, 4, 5, 8, 7, 0x8a8f98);
      f(ctx, 6, 6, 2, 2, 0xf5d13b);
      f(ctx, 9, 8, 2, 2, 0xf5d13b);
      return;
    case "gem":
      f(ctx, 7, 3, 2, 2, 0x49e0e8);
      f(ctx, 5, 5, 6, 4, 0x49e0e8);
      f(ctx, 7, 9, 2, 2, 0x49e0e8);
      f(ctx, 6, 5, 2, 2, 0xbdf6f9);
      return;
    case "wheat":
      for (const gx of [5, 8, 11]) {
        f(ctx, gx, 4, 1, 9, 0xbfa14a);
        f(ctx, gx - 1, 4, 3, 3, 0xf5d13b);
      }
      return;
    case "wheat_seeds":
      for (const [x, y] of [[5, 8], [8, 6], [10, 9], [7, 11]] as const) f(ctx, x, y, 2, 2, 0xcbb87e);
      return;
    case "apple":
      f(ctx, 5, 5, 6, 6, 0xd8443a);
      f(ctx, 5, 6, 2, 2, 0xf28a80);
      f(ctx, 8, 3, 1, 3, 0x6f4a29);
      f(ctx, 9, 3, 2, 1, 0x3f9b3a);
      return;
    case "bread":
      f(ctx, 3, 6, 10, 5, 0xc79a5e);
      f(ctx, 3, 6, 10, 1, 0xe0b878);
      f(ctx, 5, 8, 1, 1, 0x9c7644);
      f(ctx, 8, 8, 1, 1, 0x9c7644);
      return;
    default: {
      const def = itemDef(id);
      if (def?.tool) {
        drawTool(ctx, def.tool.type, def.tool.tier);
      } else if (def?.place !== undefined) {
        drawTile(ctx, 0, 0, def.place); // block icon reuses the tile art
      }
    }
  }
}

export function generateItemIcons(scene: Phaser.Scene): void {
  for (const id of allItemIds()) {
    const key = `icon_${id}`;
    const c = makeCanvas(scene, key, ICON, ICON);
    if (!c) continue;
    c.ctx.imageSmoothingEnabled = false;
    drawItemIcon(c.ctx, id);
    c.tex.refresh();
  }
}

function drawHeart(ctx: CanvasRenderingContext2D, fill: number, outline: number): void {
  // 11x10 pixel heart
  const shape = [
    "0110110",
    "1111111",
    "1111111",
    "1111111",
    "0111110",
    "0011100",
    "0001000",
  ];
  const ox = 2;
  const oy = 1;
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x] === "1") f(ctx, ox + x, oy + y, 1, 1, fill);
    }
  }
  // simple outline + shine
  f(ctx, ox + 1, oy + 1, 2, 1, lighten(fill, 0.4));
  void outline;
}

/** Hearts (full / half / empty) and other small UI icons. */
export function generateUiIcons(scene: Phaser.Scene): void {
  const full = makeCanvas(scene, "heart_full", 12, 11);
  if (full) {
    full.ctx.imageSmoothingEnabled = false;
    drawHeart(full.ctx, 0xe23b45, 0x7a1220);
    full.tex.refresh();
  }
  const half = makeCanvas(scene, "heart_half", 12, 11);
  if (half) {
    half.ctx.imageSmoothingEnabled = false;
    drawHeart(half.ctx, 0xe23b45, 0x7a1220);
    // grey out the right half
    half.ctx.fillStyle = "rgba(40,40,50,0.9)";
    half.ctx.fillRect(6, 0, 6, 11);
    half.tex.refresh();
  }
  const empty = makeCanvas(scene, "heart_empty", 12, 11);
  if (empty) {
    empty.ctx.imageSmoothingEnabled = false;
    drawHeart(empty.ctx, 0x3a2a30, 0x241c20);
    empty.tex.refresh();
  }
}
