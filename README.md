# Modulos

A 16-bit pixel-art game in the spirit of **Stardew Valley** and **Terraria** — a
cozy home-base town connected to a mineable dungeon. Built with **Phaser 3 +
TypeScript**, bundled by **Vite**, and deployable as a static site to **Vercel**.

> This is an early playable **MVP scaffold** — the core loop works end to end, and
> the art is generated procedurally as a placeholder that's designed to be swapped
> for hand-drawn sprites later (see [Art](#art)).

## The game so far

- **Character select** — pick one of eight characters as your avatar. The rest
  appear around town as NPCs you can talk to.
- **Town (home base)** — a tree-enclosed clearing with a house, a pond, bushes,
  flowers, a cobblestone path, and wandering NPCs. Walk with **WASD / arrow keys**,
  press **E** near an NPC to talk.
- **Mine / Dungeon** — walk into the cave entrance to descend. Bump into ore rocks
  to mine them (3 hits each), watch your **Ore** counter climb, then take the
  ladder back up to town.

### The cast

Robin, Leif, Jovan, Leonidas, Erim, Till, Lenni, and Tusya — each defined by data
(hair, eyes, shirt, build, accessories) in [`src/config/characters.ts`](src/config/characters.ts).

## Run it locally

```bash
npm install
npm run dev      # http://localhost:5173
```

### Controls

| Action        | Keys                    |
| ------------- | ----------------------- |
| Move          | WASD or Arrow keys      |
| Talk / close  | E (near an NPC)         |
| Enter mine    | Walk onto the ▼ MINE    |
| Leave mine    | Walk onto the ▲ EXIT ladder |
| Mine a rock   | Walk into it            |

## Build & deploy

```bash
npm run build    # type-checks, then outputs a static site to dist/
npm run preview  # serve the production build locally
```

Deployment to **Vercel** is zero-config — `vercel.json` sets the build command and
`dist` output directory, so pushing to the connected GitHub repo triggers a deploy.

## Project structure

```
src/
  main.ts                 Phaser game config + scene list
  state.ts                Tiny singleton holding the chosen character
  config/characters.ts    All 8 characters as data (traits → sprite)
  art/
    pixel.ts              Low-level pixel/canvas + shading + RNG helpers
    characters.ts         Procedural 16-bit character sprite generator
    world.ts              Tiles (grass/dirt/stone/water/path/cave) + props
  scenes/
    BootScene.ts          Generates all textures, then goes to select
    CharacterSelectScene.ts
    TownScene.ts          Home base: NPCs, dialogue, mine entrance
    DungeonScene.ts       Cave: mineable ore, ladder exit
  entities/
    Player.ts             8-directional arcade-physics movement
    NPC.ts
  ui/DialogueBox.ts
```

## Art

All sprites and tiles are **generated at runtime** from the character/tile data in
`src/art/*` — there are no image files to manage yet. This keeps the project
runnable while real pixel art is produced. To swap in hand-drawn art later, load a
spritesheet under a character's `spriteKey` in `BootScene` and the generator for
that key is skipped.

## Roadmap ideas

Farming plots and crops · NPC friendship/relationships · tools & inventory · deeper
procedurally-generated mine levels with enemies · save/load · day–night and seasons.
