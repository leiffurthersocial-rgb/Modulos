export interface Stack {
  id: string;
  count: number;
}

export interface Recipe {
  out: Stack;
  ins: Stack[];
  /** Requires standing next to a crafting table. */
  station?: boolean;
}

export const RECIPES: Recipe[] = [
  // Hand recipes
  { out: { id: "planks", count: 4 }, ins: [{ id: "log", count: 1 }] },
  { out: { id: "stick", count: 4 }, ins: [{ id: "planks", count: 2 }] },
  { out: { id: "crafting_table", count: 1 }, ins: [{ id: "planks", count: 4 }] },
  { out: { id: "torch", count: 4 }, ins: [{ id: "coal", count: 1 }, { id: "stick", count: 1 }] },
  { out: { id: "ladder", count: 3 }, ins: [{ id: "planks", count: 4 }, { id: "stick", count: 2 }] },

  // Crafting-table recipes
  { out: { id: "door", count: 1 }, ins: [{ id: "planks", count: 6 }], station: true },
  { out: { id: "wood_pickaxe", count: 1 }, ins: [{ id: "planks", count: 3 }, { id: "stick", count: 2 }], station: true },
  { out: { id: "wood_axe", count: 1 }, ins: [{ id: "planks", count: 3 }, { id: "stick", count: 2 }], station: true },
  { out: { id: "wood_shovel", count: 1 }, ins: [{ id: "planks", count: 1 }, { id: "stick", count: 2 }], station: true },
  { out: { id: "wood_hoe", count: 1 }, ins: [{ id: "planks", count: 2 }, { id: "stick", count: 2 }], station: true },
  { out: { id: "stone_pickaxe", count: 1 }, ins: [{ id: "stone", count: 3 }, { id: "stick", count: 2 }], station: true },
  { out: { id: "stone_axe", count: 1 }, ins: [{ id: "stone", count: 3 }, { id: "stick", count: 2 }], station: true },
  { out: { id: "stone_shovel", count: 1 }, ins: [{ id: "stone", count: 1 }, { id: "stick", count: 2 }], station: true },
  { out: { id: "stone_hoe", count: 1 }, ins: [{ id: "stone", count: 2 }, { id: "stick", count: 2 }], station: true },
  { out: { id: "bread", count: 1 }, ins: [{ id: "wheat", count: 3 }], station: true },
];
