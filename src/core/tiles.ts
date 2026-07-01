/** Tile registry. Tiles live in the world grid; ids index into the generated tileset. */

export const Tile = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  SAND: 4,
  LOG: 5,
  LEAVES: 6,
  PLANKS: 7,
  COAL_ORE: 8,
  IRON_ORE: 9,
  GOLD_ORE: 10,
  GEM_ORE: 11,
  BEDROCK: 12,
  TORCH: 13,
  FARMLAND: 14,
  CRAFTING_TABLE: 15,
  LADDER: 16,
  DOOR: 17,
  WATER: 18,
  SAPLING: 19,
  WHEAT_0: 20,
  WHEAT_1: 21,
  WHEAT_2: 22,
  WHEAT_3: 23,
  TALL_GRASS: 24,
  FLOWER: 25,
} as const;

export type TileId = number;

export type ToolType = "pickaxe" | "axe" | "shovel" | "hand";

export interface TileDef {
  id: TileId;
  name: string;
  solid: boolean;
  /** Base seconds to break with the correct tool at power 1; Infinity = unbreakable. */
  hardness: number;
  tool: ToolType;
  /** Minimum tool tier (0 hand, 1 wood, 2 stone, 3 iron) needed to yield a drop. */
  minTier: number;
  /** Item id dropped when broken (null = nothing). */
  drop: string | null;
  /** Light this tile emits (0..15) — used by simple lighting. */
  light?: number;
  /** Climbable (ladders) — passable but lets you go up/down. */
  climb?: boolean;
  /** Non-solid decorative overlay that pops off when the tile under it changes. */
  overlay?: boolean;
}

const T: Record<number, TileDef> = {};
function def(d: TileDef): void {
  T[d.id] = d;
}

def({ id: Tile.AIR, name: "Air", solid: false, hardness: 0, tool: "hand", minTier: 0, drop: null });
def({ id: Tile.GRASS, name: "Grass", solid: true, hardness: 0.4, tool: "shovel", minTier: 0, drop: "dirt" });
def({ id: Tile.DIRT, name: "Dirt", solid: true, hardness: 0.4, tool: "shovel", minTier: 0, drop: "dirt" });
def({ id: Tile.STONE, name: "Stone", solid: true, hardness: 1.4, tool: "pickaxe", minTier: 0, drop: "stone" });
def({ id: Tile.SAND, name: "Sand", solid: true, hardness: 0.35, tool: "shovel", minTier: 0, drop: "sand" });
def({ id: Tile.LOG, name: "Log", solid: false, hardness: 0.9, tool: "axe", minTier: 0, drop: "log" });
def({ id: Tile.LEAVES, name: "Leaves", solid: false, hardness: 0.2, tool: "hand", minTier: 0, drop: null });
def({ id: Tile.PLANKS, name: "Planks", solid: true, hardness: 0.7, tool: "axe", minTier: 0, drop: "planks" });
def({ id: Tile.COAL_ORE, name: "Coal Ore", solid: true, hardness: 1.8, tool: "pickaxe", minTier: 1, drop: "coal" });
def({ id: Tile.IRON_ORE, name: "Iron Ore", solid: true, hardness: 2.2, tool: "pickaxe", minTier: 1, drop: "iron_ore" });
def({ id: Tile.GOLD_ORE, name: "Gold Ore", solid: true, hardness: 2.6, tool: "pickaxe", minTier: 2, drop: "gold_ore" });
def({ id: Tile.GEM_ORE, name: "Gem Ore", solid: true, hardness: 3.2, tool: "pickaxe", minTier: 2, drop: "gem" });
def({ id: Tile.BEDROCK, name: "Bedrock", solid: true, hardness: Infinity, tool: "pickaxe", minTier: 9, drop: null });
def({ id: Tile.TORCH, name: "Torch", solid: false, hardness: 0.1, tool: "hand", minTier: 0, drop: "torch", light: 12, overlay: true });
def({ id: Tile.FARMLAND, name: "Farmland", solid: true, hardness: 0.4, tool: "shovel", minTier: 0, drop: "dirt" });
def({ id: Tile.CRAFTING_TABLE, name: "Crafting Table", solid: true, hardness: 0.8, tool: "axe", minTier: 0, drop: "crafting_table" });
def({ id: Tile.LADDER, name: "Ladder", solid: false, hardness: 0.3, tool: "hand", minTier: 0, drop: "ladder", climb: true, overlay: true });
def({ id: Tile.DOOR, name: "Door", solid: false, hardness: 0.6, tool: "axe", minTier: 0, drop: "door", overlay: true });
def({ id: Tile.WATER, name: "Water", solid: false, hardness: Infinity, tool: "hand", minTier: 9, drop: null });
def({ id: Tile.SAPLING, name: "Sapling", solid: false, hardness: 0.1, tool: "hand", minTier: 0, drop: "sapling", overlay: true });
def({ id: Tile.TALL_GRASS, name: "Tall Grass", solid: false, hardness: 0.05, tool: "hand", minTier: 0, drop: null, overlay: true });
def({ id: Tile.FLOWER, name: "Flower", solid: false, hardness: 0.05, tool: "hand", minTier: 0, drop: null, overlay: true });

// Wheat growth stages — non-solid overlays; only the mature stage drops food.
for (const [id, drop] of [
  [Tile.WHEAT_0, null],
  [Tile.WHEAT_1, null],
  [Tile.WHEAT_2, null],
  [Tile.WHEAT_3, "wheat"],
] as const) {
  def({ id, name: "Wheat", solid: false, hardness: 0.05, tool: "hand", minTier: 0, drop, overlay: true });
}

export function tileDef(id: TileId): TileDef {
  return T[id] ?? T[Tile.AIR];
}

export function isSolid(id: TileId): boolean {
  return tileDef(id).solid;
}

export function isOverlay(id: TileId): boolean {
  return !!tileDef(id).overlay;
}

export const WHEAT_STAGES = [Tile.WHEAT_0, Tile.WHEAT_1, Tile.WHEAT_2, Tile.WHEAT_3];
