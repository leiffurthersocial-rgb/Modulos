import type { CharacterDef } from "./config/characters";

class GameState {
  selectedCharacter: CharacterDef | null = null;
}

export const gameState = new GameState();
