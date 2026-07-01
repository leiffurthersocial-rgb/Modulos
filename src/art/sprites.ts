import Phaser from "phaser";
import { CHARACTERS, type CharacterDef } from "../config/characters";
import { allItemIds, itemDef } from "../core/items";
import { darken, hex, lighten, makeCanvas } from "./pixel";
import { drawTile } from "./tileset";

export const PW = 16; // player frame width
export const PH = 24; // player frame height
const OUT = 0x241c18;
const PANTS = 0x394a63;
const SHOES = 0x2a2320;

type Pose = "idle" | "walkA" | "walkB" | "jump";
const POSES: Pose[] = ["idle", "walkA", "walkB", "jump"];

function f(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: number): void {
  ctx.fillStyle = hex(c);
  ctx.fillRect(x, y, w, h);
}

function part(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: number): void {
  f(ctx, x - 1, y - 1, w + 2, h + 2, OUT);
  f(ctx, x, y, w, h, c);
}

/** Side-view character facing right. Hair hangs down the back for longer lengths. */
function drawPlayer(ctx: CanvasRenderingContext2D, x0: number, char: CharacterDef, pose: Pose): void {
  const skin = char.skinTone;
  const skinSh = darken(skin, 0.85);
  const hair = char.hairColor;
  const hairSh = darken(hair, 0.72);
  const hairLt = lighten(hair, 0.2);
  const shirt = char.shirtColor;
  const shirtSh = darken(shirt, 0.78);

  const musc = char.build === "muscular";
  const tall = char.build === "tall";
  const yShift = tall ? -1 : char.build === "short" ? 1 : 0;

  const headX = x0 + 5;
  const headY = 2 + yShift;
  const headW = 7;
  const headH = 7;

  // --- Back hair (drawn first, behind everything), length-dependent ---
  const backX = x0 + 3;
  if (char.hairLength === "medium") {
    part(ctx, backX, headY + 1, 3, 9, hair);
    f(ctx, backX, headY + 1, 1, 9, hairSh);
  } else if (char.hairLength === "medium-long") {
    part(ctx, backX - 1, headY + 1, 3, 14, hair); // long hanging strand
    f(ctx, backX - 1, headY + 1, 1, 14, hairSh);
    f(ctx, backX + 1, headY + 10, 2, 4, hair); // over the shoulder
  }

  // --- Legs (pose-dependent) ---
  const hipY = 17 + yShift;
  const legTop = hipY + 1;
  const legLen = 5;
  let lLegX = x0 + 5;
  let rLegX = x0 + 8;
  if (pose === "walkA") {
    lLegX = x0 + 4;
    rLegX = x0 + 9;
  } else if (pose === "walkB") {
    lLegX = x0 + 6;
    rLegX = x0 + 7;
  } else if (pose === "jump") {
    lLegX = x0 + 4;
    rLegX = x0 + 9;
  }
  const legH = pose === "jump" ? legLen - 1 : legLen;
  for (const lx of [lLegX, rLegX]) {
    part(ctx, lx, legTop, 3, legH, PANTS);
    f(ctx, lx, legTop + legH - 2, 3, 2, SHOES);
  }

  // --- Torso ---
  const torsoX = x0 + 4;
  const torsoW = musc ? 8 : 7;
  const torsoY = 10 + yShift;
  part(ctx, torsoX, torsoY, torsoW, hipY - torsoY + 1, shirt);
  f(ctx, torsoX + torsoW - 2, torsoY, 2, hipY - torsoY + 1, shirtSh);

  // --- Front arm ---
  const armX = torsoX + torsoW - 1;
  const armY = pose === "jump" ? torsoY - 1 : torsoY + 1;
  part(ctx, armX, armY, 2, 6, shirt);
  f(ctx, armX, armY + 5, 2, 2, skin); // hand

  // --- Head + face (facing right) ---
  part(ctx, headX, headY, headW, headH, skin);
  f(ctx, headX + headW - 1, headY + 1, 1, headH - 1, skinSh);
  // eye near the front
  f(ctx, headX + headW - 3, headY + 3, 2, 2, 0xffffff);
  f(ctx, headX + headW - 2, headY + 3, 1, 2, char.eyeColor);
  // mouth
  f(ctx, headX + headW - 3, headY + 6, 2, 1, skinSh);

  // --- Front / top hair ---
  f(ctx, headX - 1, headY - 2, headW + 2, 3, hair); // crown
  f(ctx, headX - 1, headY - 2, headW + 2, 1, hairLt);
  f(ctx, headX - 1, headY, 2, 4, hair); // back-top of head
  if (char.id === "leonidas") {
    f(ctx, headX + 1, headY - 3, headW - 2, 2, hair); // quiff
  }
  if (char.id === "lenni") {
    f(ctx, headX + 2, headY - 1, 2, 2, skin); // middle part hint
  }
  // fringe over forehead
  f(ctx, headX + headW - 4, headY - 1, 4, 2, hair);

  // --- Accessories ---
  if (char.accessories.includes("glasses")) {
    ctx.strokeStyle = hex(0x1b1b1b);
    ctx.lineWidth = 1;
    ctx.strokeRect(headX + headW - 4.5, headY + 2.5, 3, 3);
  }
  if (char.accessories.includes("goatee")) {
    f(ctx, headX + headW - 4, headY + headH - 1, 3, 2, hairSh);
  }
}

export function generatePlayerTextures(scene: Phaser.Scene): void {
  for (const char of CHARACTERS) {
    const key = char.spriteKey;
    if (scene.textures.exists(key)) continue;
    const tex = scene.textures.createCanvas(key, PW * POSES.length, PH);
    if (!tex) continue;
    const ctx = tex.getContext();
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, PW * POSES.length, PH);
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
