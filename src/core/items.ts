import { Tile, type TileId } from "./tiles";

export type ItemKind = "block" | "tool" | "material" | "seed" | "food";
export type ToolKind = "pickaxe" | "axe" | "shovel" | "hoe";
export type PlaceTarget = "any" | "grass" | "farmland";

export interface ItemTool {
  type: ToolKind;
  tier: number;
  /** Mining speed multiplier vs. base hardness. */
  power: number;
}

export interface ItemDef {
  id: string;
  name: string;
  kind: ItemKind;
  maxStack: number;
  /** Tile placed on right-click, if any. */
  place?: TileId;
  placeOn?: PlaceTarget;
  tool?: ItemTool;
}

const I: Record<string, ItemDef> = {};
function def(d: Partial<ItemDef> & { id: string; name: string; kind: ItemKind }): void {
  I[d.id] = { maxStack: d.kind === "tool" ? 1 : 99, ...d } as ItemDef;
}

// Blocks
def({ id: "dirt", name: "Dirt", kind: "block", place: Tile.DIRT });
def({ id: "stone", name: "Stone", kind: "block", place: Tile.STONE });
def({ id: "sand", name: "Sand", kind: "block", place: Tile.SAND });
def({ id: "log", name: "Log", kind: "block", place: Tile.LOG });
def({ id: "planks", name: "Planks", kind: "block", place: Tile.PLANKS });
def({ id: "torch", name: "Torch", kind: "block", place: Tile.TORCH });
def({ id: "ladder", name: "Ladder", kind: "block", place: Tile.LADDER });
def({ id: "door", name: "Door", kind: "block", place: Tile.DOOR });
def({ id: "crafting_table", name: "Crafting Table", kind: "block", place: Tile.CRAFTING_TABLE });

// Materials
def({ id: "stick", name: "Stick", kind: "material" });
def({ id: "coal", name: "Coal", kind: "material" });
def({ id: "iron_ore", name: "Iron Ore", kind: "material" });
def({ id: "gold_ore", name: "Gold Ore", kind: "material" });
def({ id: "gem", name: "Gem", kind: "material" });
def({ id: "wheat", name: "Wheat", kind: "material" });

// Seeds / plants
def({ id: "sapling", name: "Sapling", kind: "seed", place: Tile.SAPLING, placeOn: "grass" });
def({ id: "wheat_seeds", name: "Wheat Seeds", kind: "seed", place: Tile.WHEAT_0, placeOn: "farmland" });

// Food
def({ id: "apple", name: "Apple", kind: "food" });
def({ id: "bread", name: "Bread", kind: "food" });

// Tools (tier: 1 wood, 2 stone)
def({ id: "wood_pickaxe", name: "Wooden Pickaxe", kind: "tool", tool: { type: "pickaxe", tier: 1, power: 3 } });
def({ id: "stone_pickaxe", name: "Stone Pickaxe", kind: "tool", tool: { type: "pickaxe", tier: 2, power: 5 } });
def({ id: "wood_axe", name: "Wooden Axe", kind: "tool", tool: { type: "axe", tier: 1, power: 3 } });
def({ id: "stone_axe", name: "Stone Axe", kind: "tool", tool: { type: "axe", tier: 2, power: 5 } });
def({ id: "wood_shovel", name: "Wooden Shovel", kind: "tool", tool: { type: "shovel", tier: 1, power: 3 } });
def({ id: "stone_shovel", name: "Stone Shovel", kind: "tool", tool: { type: "shovel", tier: 2, power: 5 } });
def({ id: "wood_hoe", name: "Wooden Hoe", kind: "tool", tool: { type: "hoe", tier: 1, power: 1 } });
def({ id: "stone_hoe", name: "Stone Hoe", kind: "tool", tool: { type: "hoe", tier: 2, power: 1 } });

export function itemDef(id: string): ItemDef {
  return I[id];
}

export function allItemIds(): string[] {
  return Object.keys(I);
}
