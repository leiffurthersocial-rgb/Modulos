import { Inventory, type Slot } from "./inventory";
import { World } from "./world";

const KEY = "modulos_save_v1";
const VERSION = 1;

export interface SaveData {
  version: number;
  seed: number;
  character: string;
  player: { x: number; y: number };
  health?: number;
  inventory: Slot[];
  hotbar: number;
  edits: Record<string, number>;
}

export function hasSave(): boolean {
  try {
    return localStorage.getItem(KEY) !== null;
  } catch {
    return false;
  }
}

export function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;
    if (data.version !== VERSION) return null;
    return data;
  } catch {
    return null;
  }
}

export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage full or unavailable — ignore */
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Snapshot current game state into a save record. */
export function snapshot(
  world: World,
  inv: Inventory,
  hotbar: number,
  character: string,
  player: { x: number; y: number },
  health: number,
): SaveData {
  return {
    version: VERSION,
    seed: world.seed,
    character,
    player,
    health,
    inventory: inv.serialize(),
    hotbar,
    edits: Object.fromEntries(world.edits),
  };
}
