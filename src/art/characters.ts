import Phaser from "phaser";
import type { CharacterDef } from "../config/characters";
import { darken, hex, lighten, makeCanvas, px } from "./pixel";

const OUT = 0x241c18; // warm near-black outline
const PANTS = 0x3b4a63;
const SHOES = 0x3a2a1e;

/**
 * Draws a polished 32x32 top-down character in a 16-bit RPG style
 * (Stardew/Terraria flavour): outline, shading, distinct hair styles,
 * builds and accessories derived from the character's trait data.
 *
 * Swap-in point: to use hand-drawn art later, load a spritesheet under
 * `char.spriteKey` in BootScene and skip this generator for that key.
 */
export function generateCharacterTexture(scene: Phaser.Scene, char: CharacterDef): void {
  const c = makeCanvas(scene, char.spriteKey, 32, 32);
  if (!c) return;
  const ctx = c.ctx;

  const skin = char.skinTone;
  const skinSh = darken(skin, 0.82);
  const skinHi = lighten(skin, 0.15);
  const hair = char.hairColor;
  const hairSh = darken(hair, 0.7);
  const hairHi = lighten(hair, 0.22);
  const shirt = char.shirtColor;
  const shirtSh = darken(shirt, 0.78);
  const shirtHi = lighten(shirt, 0.16);
  const pantsSh = darken(PANTS, 0.78);

  const tall = char.build === "tall";
  const short = char.build === "short";
  const musc = char.build === "muscular";

  // Vertical layout, tuned to fit within 32px including a ground shadow.
  const headTop = tall ? 4 : short ? 6 : 5;
  const headH = 11;
  const headLeft = 10;
  const headW = 12;
  const headBottom = headTop + headH; // exclusive-ish
  const shoulderY = headBottom + 1;
  const torsoH = short ? 8 : 9;
  const hipY = shoulderY + torsoH;
  const legH = tall ? 7 : short ? 4 : 5;
  const legBottom = hipY + legH;

  const torsoHalf = musc ? 8 : 6;
  const torsoLeft = 16 - torsoHalf;
  const torsoW = torsoHalf * 2;

  // --- Ground shadow ---
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.ellipse(16, legBottom + 1, torsoHalf + 2, 2.4, 0, 0, Math.PI * 2);
  ctx.fill();

  // --- Legs + shoes ---
  const legW = musc ? 4 : 3;
  const legGap = 2;
  const lLegX = 16 - legGap / 2 - legW;
  const rLegX = 16 + legGap / 2;
  for (const lx of [lLegX, rLegX]) {
    px(ctx, lx - 1, hipY - 1, legW + 2, legH + 2, OUT);
    px(ctx, lx, hipY, legW, legH, PANTS);
    px(ctx, lx + legW - 1, hipY, 1, legH, pantsSh); // right-edge shade
    px(ctx, lx, legBottom - 2, legW, 2, SHOES); // shoes
  }

  // --- Arms (drawn behind torso so sleeves sit under the shirt edge) ---
  const armW = musc ? 4 : 3;
  const armTop = musc ? shoulderY : shoulderY + 1;
  const armH = torsoH - 2;
  for (const side of [-1, 1]) {
    const ax = side < 0 ? torsoLeft - armW : torsoLeft + torsoW;
    px(ctx, ax - 1, armTop - 1, armW + 2, armH + 2, OUT);
    px(ctx, ax, armTop, armW, armH - 2, shirt); // sleeve
    px(ctx, ax, armTop + armH - 2, armW, 2, skin); // hand
    px(ctx, side < 0 ? ax : ax + armW - 1, armTop, 1, armH - 2, shirtSh);
  }

  // --- Torso / shirt ---
  px(ctx, torsoLeft - 1, shoulderY - 1, torsoW + 2, torsoH + 2, OUT);
  px(ctx, torsoLeft, shoulderY, torsoW, torsoH, shirt);
  px(ctx, torsoLeft, shoulderY, 1, torsoH, shirtHi); // left highlight
  px(ctx, torsoLeft + torsoW - 2, shoulderY, 2, torsoH, shirtSh); // right shade
  px(ctx, torsoLeft, hipY - 1, torsoW, 1, shirtSh); // hem
  if (musc) {
    // chest/pecs suggestion
    px(ctx, torsoLeft + 2, shoulderY + 2, torsoW - 4, 1, shirtHi);
    px(ctx, 16, shoulderY + 1, 1, torsoH - 2, shirtSh);
  }

  // --- Neck ---
  px(ctx, 14, headBottom - 1, 4, 2, skinSh);

  // --- Head ---
  px(ctx, headLeft - 1, headTop - 1, headW + 2, headH + 2, OUT);
  px(ctx, headLeft, headTop, headW, headH, skin);
  px(ctx, headLeft, headTop, 1, headH, skinHi); // left cheek light
  px(ctx, headLeft + headW - 1, headTop, 1, headH, skinSh); // right cheek shade
  // ears
  px(ctx, headLeft - 1, headTop + 5, 1, 3, skin);
  px(ctx, headLeft + headW, headTop + 5, 1, 3, skinSh);

  // --- Eyes + brows ---
  const eyeY = headTop + 6;
  for (const side of [-1, 1]) {
    const ex = side < 0 ? headLeft + 2 : headLeft + headW - 5;
    px(ctx, ex, eyeY - 1, 3, 1, hairSh); // brow
    px(ctx, ex, eyeY, 3, 2, 0xf4f4f4); // white
    px(ctx, side < 0 ? ex + 1 : ex, eyeY, 2, 2, char.eyeColor); // iris
  }
  // subtle mouth
  px(ctx, 15, headTop + 9, 2, 1, skinSh);

  // --- Hair ---
  drawHair(ctx, char, { headTop, headLeft, headW, headH, hair, hairSh, hairHi, skin });

  // --- Accessories ---
  if (char.accessories.includes("glasses")) {
    drawGlasses(ctx, headLeft, headW, eyeY);
  }
  if (char.accessories.includes("goatee")) {
    px(ctx, 14, headTop + 10, 4, 2, hairSh);
    px(ctx, 15, headTop + 11, 2, 1, hair);
  }

  c.tex.refresh();
}

interface HairCtx {
  headTop: number;
  headLeft: number;
  headW: number;
  headH: number;
  hair: number;
  hairSh: number;
  hairHi: number;
  skin: number;
}

function drawHair(ctx: CanvasRenderingContext2D, char: CharacterDef, h: HairCtx): void {
  const { headTop, headLeft, headW, hair, hairSh, hairHi } = h;
  const styled = char.id === "leonidas";
  const middlePart = char.id === "lenni";
  const length = char.hairLength;

  // Crown / top of hair, slightly wider than the head.
  px(ctx, headLeft - 1, headTop - 2, headW + 2, 4, hair);
  px(ctx, headLeft - 1, headTop - 2, headW + 2, 1, hairHi); // top sheen
  // Fringe over the forehead
  px(ctx, headLeft, headTop + 2, headW, 2, hair);

  if (middlePart) {
    // parted fringe: skin-colored gap down the centre + swoops to each side
    px(ctx, 15, headTop + 2, 2, 2, h.skin);
    px(ctx, headLeft, headTop + 2, 5, 3, hair);
    px(ctx, headLeft + headW - 5, headTop + 2, 5, 3, hair);
  } else if (styled) {
    // quiff: a raised, swept front
    px(ctx, headLeft + 2, headTop - 4, headW - 4, 2, hair);
    px(ctx, headLeft + 3, headTop - 4, headW - 7, 1, hairHi);
    px(ctx, headLeft + headW - 6, headTop + 2, 3, 2, h.skin); // swept-back temple
  }

  // Sides depend on length.
  const sideBottom =
    length === "short" ? headTop + 3 : length === "medium" ? headTop + 8 : headTop + 12;
  const sideW = length === "medium-long" ? 3 : 2;
  for (const side of [-1, 1]) {
    const sx = side < 0 ? headLeft - 1 : headLeft + headW - (sideW - 1);
    px(ctx, sx, headTop - 1, sideW, sideBottom - (headTop - 1), hair);
    px(ctx, sx, headTop - 1, 1, sideBottom - (headTop - 1), side < 0 ? hairHi : hairSh);
  }

  if (length === "medium-long") {
    // hair falling behind the shoulders
    px(ctx, headLeft, headTop + 11, 2, 3, hairSh);
    px(ctx, headLeft + headW - 2, headTop + 11, 2, 3, hairSh);
  }
}

function drawGlasses(ctx: CanvasRenderingContext2D, headLeft: number, headW: number, eyeY: number): void {
  ctx.strokeStyle = hex(0x1b1b1b);
  ctx.lineWidth = 1;
  ctx.strokeRect(headLeft + 1.5, eyeY - 0.5, 4, 3);
  ctx.strokeRect(headLeft + headW - 5.5, eyeY - 0.5, 4, 3);
  px(ctx, headLeft + 5, eyeY, 2, 1, 0x1b1b1b); // bridge
}
