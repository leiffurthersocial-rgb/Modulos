export interface Settings {
  dayNight: boolean;
  volume: number;
}

class GameState {
  selectedCharacterId = "robin";
  continueGame = false; // set by MenuScene when loading an existing save
  settings: Settings = { dayNight: true, volume: 0.6 };
}

export const gameState = new GameState();
