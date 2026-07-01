import { CHUNK_W, SEA_LEVEL, WORLD_H } from "./constants";
import { generateChunk, surfaceHeight } from "./worldgen";
import { Tile, isSolid, tileDef } from "./tiles";

interface GrowState {
  kind: "wheat" | "sapling";
  acc: number;
}

const WHEAT_STAGE_MS = 5000;
const SAPLING_MS = 12000;

export class World {
  readonly seed: number;
  private chunks = new Map<number, Uint16Array>();
  /** Player edits, for save/load. Key "wx,wy" -> tileId. */
  readonly edits = new Map<string, number>();
  private growables = new Map<string, GrowState>();

  constructor(seed: number, edits?: Record<string, number>) {
    this.seed = seed >>> 0;
    if (edits) {
      for (const [k, v] of Object.entries(edits)) this.edits.set(k, v);
    }
  }

  private chunk(cx: number): Uint16Array {
    let c = this.chunks.get(cx);
    if (!c) {
      c = generateChunk(cx, this.seed);
      // apply persisted edits for this chunk's columns
      const start = cx * CHUNK_W;
      for (const [k, v] of this.edits) {
        const comma = k.indexOf(",");
        const wx = parseInt(k.slice(0, comma), 10);
        if (wx >= start && wx < start + CHUNK_W) {
          const wy = parseInt(k.slice(comma + 1), 10);
          if (wy >= 0 && wy < WORLD_H) c[(wx - start) * WORLD_H + wy] = v;
        }
      }
      this.chunks.set(cx, c);
      // register any growables that generated or were edited in
      this.scanGrowables(cx, c);
    }
    return c;
  }

  private scanGrowables(cx: number, c: Uint16Array): void {
    const start = cx * CHUNK_W;
    for (let lx = 0; lx < CHUNK_W; lx++) {
      for (let y = 0; y < WORLD_H; y++) {
        const id = c[lx * WORLD_H + y];
        const key = `${start + lx},${y}`;
        if (id === Tile.SAPLING) this.growables.set(key, { kind: "sapling", acc: 0 });
        else if (id >= Tile.WHEAT_0 && id < Tile.WHEAT_3) this.growables.set(key, { kind: "wheat", acc: 0 });
      }
    }
  }

  getTile(wx: number, wy: number): number {
    if (wy < 0) return Tile.AIR;
    if (wy >= WORLD_H) return Tile.BEDROCK;
    const cx = Math.floor(wx / CHUNK_W);
    const c = this.chunk(cx);
    return c[(wx - cx * CHUNK_W) * WORLD_H + wy];
  }

  setTile(wx: number, wy: number, id: number, record = true): void {
    if (wy < 0 || wy >= WORLD_H) return;
    const cx = Math.floor(wx / CHUNK_W);
    const c = this.chunk(cx);
    c[(wx - cx * CHUNK_W) * WORLD_H + wy] = id;
    const key = `${wx},${wy}`;
    if (record) this.edits.set(key, id);

    // maintain growables registry
    if (id === Tile.SAPLING) this.growables.set(key, { kind: "sapling", acc: 0 });
    else if (id >= Tile.WHEAT_0 && id < Tile.WHEAT_3) this.growables.set(key, { kind: "wheat", acc: 0 });
    else this.growables.delete(key);

    // Grass decays to dirt if a solid tile is placed directly on top.
    if (isSolid(id)) {
      if (this.getTile(wx, wy - 1) === Tile.GRASS) this.setTile(wx, wy - 1, Tile.DIRT);
    }
  }

  isSolidAt(wx: number, wy: number): boolean {
    return isSolid(this.getTile(wx, wy));
  }

  isClimbAt(wx: number, wy: number): boolean {
    return !!tileDef(this.getTile(wx, wy)).climb;
  }

  /** A clear, dry spawn position (world tile coords) near the origin. */
  spawnTile(): { x: number; y: number } {
    for (let dx = 0; dx < 200; dx++) {
      for (const x of [dx, -dx]) {
        const surf = surfaceHeight(this.seed, x);
        if (surf < SEA_LEVEL - 2 && this.getTile(x, surf) === Tile.GRASS) {
          return { x, y: surf - 2 };
        }
      }
    }
    return { x: 0, y: surfaceHeight(this.seed, 0) - 2 };
  }

  /** Advance plant growth. dt in ms. */
  tick(dt: number): void {
    for (const [key, g] of this.growables) {
      g.acc += dt;
      const comma = key.indexOf(",");
      const wx = parseInt(key.slice(0, comma), 10);
      const wy = parseInt(key.slice(comma + 1), 10);
      const cur = this.getTile(wx, wy);

      if (g.kind === "wheat") {
        if (cur < Tile.WHEAT_0 || cur >= Tile.WHEAT_3) {
          this.growables.delete(key);
          continue;
        }
        if (g.acc >= WHEAT_STAGE_MS) {
          g.acc = 0;
          this.setTile(wx, wy, cur + 1);
        }
      } else {
        if (cur !== Tile.SAPLING) {
          this.growables.delete(key);
          continue;
        }
        if (g.acc >= SAPLING_MS) {
          this.growables.delete(key);
          this.growTree(wx, wy);
        }
      }
    }
  }

  /** Instantly advance every tracked plant (debug / testing). */
  growAllNow(): void {
    for (const [key, g] of [...this.growables]) {
      const comma = key.indexOf(",");
      const wx = parseInt(key.slice(0, comma), 10);
      const wy = parseInt(key.slice(comma + 1), 10);
      if (g.kind === "wheat") this.setTile(wx, wy, Tile.WHEAT_3);
      else {
        this.growables.delete(key);
        this.growTree(wx, wy);
      }
    }
  }

  private growTree(wx: number, groundAboveY: number): void {
    const th = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < th; i++) this.setTile(wx, groundAboveY - i, Tile.LOG);
    const topY = groundAboveY - th;
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 1; dy++) {
        if (Math.abs(dx) === 2 && dy <= -2) continue;
        if (this.getTile(wx + dx, topY + dy) === Tile.AIR) this.setTile(wx + dx, topY + dy, Tile.LEAVES);
      }
    }
  }
}
