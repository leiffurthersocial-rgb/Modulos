import Phaser from "phaser";

/** Low-level helpers for drawing crisp 16-bit style pixel art onto Phaser canvas textures. */

export function hex(color: number): string {
  return `#${(color & 0xffffff).toString(16).padStart(6, "0")}`;
}

export function darken(color: number, factor: number): number {
  const r = Math.round(((color >> 16) & 0xff) * factor);
  const g = Math.round(((color >> 8) & 0xff) * factor);
  const b = Math.round((color & 0xff) * factor);
  return (clamp(r) << 16) | (clamp(g) << 8) | clamp(b);
}

export function lighten(color: number, amount: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return (
    (clamp(r + (255 - r) * amount) << 16) |
    (clamp(g + (255 - g) * amount) << 8) |
    clamp(b + (255 - b) * amount)
  );
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

/** Deterministic little RNG so generated textures look hand-placed but stay stable. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface Canvas {
  ctx: CanvasRenderingContext2D;
  tex: Phaser.Textures.CanvasTexture;
}

export function makeCanvas(scene: Phaser.Scene, key: string, w: number, h: number): Canvas | null {
  if (scene.textures.exists(key)) return null;
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) return null;
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, w, h);
  return { ctx, tex };
}

export function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: number): void {
  ctx.fillStyle = hex(color);
  ctx.fillRect(x, y, w, h);
}

/** Fills a rect with a 1px dark outline around it — the chunky look of good pixel art. */
export function outlined(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: number,
  outline: number,
): void {
  px(ctx, x - 1, y - 1, w + 2, h + 2, outline);
  px(ctx, x, y, w, h, fill);
}
