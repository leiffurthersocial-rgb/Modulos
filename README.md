# Modulos

A 2D pixel-art sandbox in the spirit of **Terraria** / "2D Minecraft" — explore an
**infinite, procedurally-generated world**, dig and place blocks with gravity and
jumping, **craft** tools, and **farm** crops and trees. Built with **Phaser 3 +
TypeScript**, bundled by **Vite**, deployable as a static site to **Vercel**.

Your world and inventory **autosave to the browser**, so you can pick up where you
left off.

## Play

- **Main menu** — the first choice is **Continue Saved World** (so you never lose a
  world by accident); **Create New World** takes you to character select (Robin, Leif,
  Jovan, Leonidas, Erim, Till, Lenni, Tusya) and a **Start** button. There's also a
  **Settings** page.
- **World** — an endless side-view world: grassy hills and trees on the surface,
  **oceans and lakes with sandy beaches**, dirt, then stone with **caves and ore**
  (coal, iron, gold, gem) as you dig deeper, down to bedrock. A day/night cycle darkens
  the surface and caves are dark underground.
- **Health** — you have a row of hearts. **Falling too far hurts** (and can kill you —
  you respawn at the surface), and health slowly regenerates when you're safe. You
  **swim** in water.

### Controls

| Action              | Keys / Mouse                    |
| ------------------- | ------------------------------- |
| Move                | `A` / `D` or `←` / `→`          |
| Jump                | `Space` / `W` / `↑`             |
| Climb ladders       | `W` / `S` while on a ladder     |
| Mine block          | **Left-click** (hold)           |
| Place / use item    | **Right-click**                 |
| Select hotbar slot  | `1`–`9` or mouse wheel          |
| Inventory + Crafting| `E` (or `C`)                    |
| Settings / pause    | `Esc`                           |

### What you can do

- **Mine** any block within reach. Tool tier matters — deeper ores need better
  pickaxes. Blocks drop items into your inventory.
- **Build** by placing blocks from your hotbar next to existing terrain.
- **Craft** in the inventory panel: logs → planks → sticks → a crafting table, then
  wooden and stone **pickaxes / axes / shovels / hoes**, plus torches, ladders, doors,
  and bread. Tool recipes need a crafting table nearby.
- **Farm**: hoe grass/dirt into farmland, plant **wheat seeds** (from tall grass) and
  watch them grow, then harvest wheat. Plant **saplings** (from leaves) on grass and
  they grow into full trees you can chop.

You start with a wooden pickaxe, a wooden axe, and a few torches.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + static build into dist/
npm run preview  # serve the production build
```

Deployment to **Vercel** is zero-config (`vercel.json` sets the build command and
`dist` output); pushing to the connected GitHub repo triggers a deploy.

## Architecture

All art is **generated at runtime** as 16px pixel-art — there are no image assets to
manage. The world is chunked and infinite horizontally, bounded in depth.

```
src/
  main.ts               Phaser config (custom AABB physics, no global gravity)
  state.ts              selected character + settings
  config/characters.ts  the 8 characters as recolorable side-view skins
  core/
    constants.ts        tile size, chunk width, world height
    rng.ts              seeded PRNG + value-noise / fbm
    tiles.ts            tile registry (solidity, hardness, tool, drops)
    items.ts            item registry (blocks, tools, materials, seeds, food)
    recipes.ts          crafting recipes
    worldgen.ts         deterministic chunk generation (terrain, caves, ores, trees)
    world.ts            chunk store, get/set tiles, plant-growth tick
    inventory.ts        stacking inventory + hotbar
    save.ts             localStorage save (seed + edit deltas + inventory)
  systems/physics.ts    AABB-vs-tile collision, gravity, jump
  art/
    pixel.ts            canvas/pixel/RNG helpers
    tileset.ts          16px tileset spritesheet + cave background
    sprites.ts          player rig (idle/walk/jump) + item icons
  entities/Player.ts    side-view player body + animation
  ui/Hud.ts             hotbar, inventory, crafting, settings (own UI camera)
  scenes/
    BootScene.ts        build textures
    MenuScene.ts        title + character picker + Continue
    GameScene.ts        world render, input, mining/placing, day/night, autosave
```

Rendering uses a fixed **pool of tile sprites** that follows the camera, so an
infinite world draws with a constant number of objects. A separate UI camera keeps the
HUD crisp and unzoomed over the 3× zoomed world.

## Roadmap

Enemies & combat · health/hunger · flowing liquids · more biomes · per-tile lighting ·
chests & storage · sound · multiplayer.
