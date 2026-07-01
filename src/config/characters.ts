export type HairLength = "short" | "medium" | "medium-long";
export type Build = "average" | "tall" | "short" | "muscular";

export interface CharacterDef {
  id: string;
  name: string;
  skinTone: number;
  hairColor: number;
  eyeColor: number;
  shirtColor: number;
  hairLength: HairLength;
  build: Build;
  accessories: Array<"glasses" | "goatee">;
  spriteKey: string;
  blurb: string;
}

// Shared skin tone palette. Swap per-character if a lighter/darker tone is specified.
const SKIN_LIGHT = 0xf0c9a0;
const SKIN_TAN = 0xc98a5b;

export const CHARACTERS: CharacterDef[] = [
  {
    id: "robin",
    name: "Robin",
    skinTone: SKIN_LIGHT,
    hairColor: 0xe8c96b, // blonde
    eyeColor: 0x6b4423, // brown
    shirtColor: 0xffffff, // white
    hairLength: "short",
    build: "average",
    accessories: [],
    spriteKey: "char_robin",
    blurb: "Blonde, brown eyes, white shirt, short hair.",
  },
  {
    id: "leif",
    name: "Leif",
    skinTone: SKIN_LIGHT,
    hairColor: 0x6b4423, // brown
    eyeColor: 0x8a8a8a, // grayish
    shirtColor: 0x111111, // black
    hairLength: "short",
    build: "average",
    accessories: [],
    spriteKey: "char_leif",
    blurb: "Brown hair, grayish eyes, black shirt, short hair.",
  },
  {
    id: "jovan",
    name: "Jovan",
    skinTone: SKIN_LIGHT,
    hairColor: 0x6b4423, // brown
    eyeColor: 0x6b4423, // brown
    shirtColor: 0xffffff, // white
    hairLength: "short",
    build: "tall",
    accessories: [],
    spriteKey: "char_jovan",
    blurb: "Taller than average, brown eyes, brown hair, white shirt, short hair.",
  },
  {
    id: "leonidas",
    name: "Leonidas",
    skinTone: SKIN_LIGHT,
    hairColor: 0x5c3a21, // styled brown
    eyeColor: 0x6b4423, // brown
    shirtColor: 0x8b1e1e, // deep red, athletic
    hairLength: "short",
    build: "muscular",
    accessories: [],
    spriteKey: "char_leonidas",
    blurb: "Brown eyes, styled brown hair, shorter than average, really muscular.",
  },
  {
    id: "erim",
    name: "Erim",
    skinTone: SKIN_LIGHT,
    hairColor: 0x111111, // black
    eyeColor: 0x6b4423, // brown
    shirtColor: 0x2b4a6b, // navy
    hairLength: "short",
    build: "average",
    accessories: ["glasses", "goatee"],
    spriteKey: "char_erim",
    blurb: "Black hair, black goatee, brown eyes, glasses.",
  },
  {
    id: "till",
    name: "Till",
    skinTone: SKIN_LIGHT,
    hairColor: 0xe8c96b, // blonde
    eyeColor: 0x3a6ea5, // blue
    shirtColor: 0x4a7c59, // casual green
    hairLength: "short",
    build: "average",
    accessories: [],
    spriteKey: "char_till",
    blurb: "Blonde, blue eyes, short hair.",
  },
  {
    id: "lenni",
    name: "Lenni",
    skinTone: SKIN_LIGHT,
    hairColor: 0x6b4423, // brown, middle part
    eyeColor: 0x6b4423, // brown
    shirtColor: 0x1e4d2b, // dark green
    hairLength: "short",
    build: "average",
    accessories: ["glasses"],
    spriteKey: "char_lenni",
    blurb: "Brown short hair, glasses, brown eyes, dark green shirt.",
  },
  {
    id: "tusya",
    name: "Tusya",
    skinTone: SKIN_TAN,
    hairColor: 0x111111, // black
    eyeColor: 0x6b4423, // brown
    shirtColor: 0x555555, // neutral gray, placeholder
    hairLength: "short",
    build: "average",
    accessories: [],
    spriteKey: "char_tusya",
    blurb: "Brown skin, black hair, brown eyes.",
  },
];

export function getCharacterById(id: string): CharacterDef {
  const found = CHARACTERS.find((c) => c.id === id);
  if (!found) {
    throw new Error(`Unknown character id: ${id}`);
  }
  return found;
}
