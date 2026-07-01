import Phaser from "phaser";
import { generateTileset, generateCaveBack } from "../art/tileset";
import { generatePlayerTextures, generateItemIcons, generateUiIcons } from "../art/sprites";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  create(): void {
    generateTileset(this);
    generateCaveBack(this);
    generatePlayerTextures(this);
    generateItemIcons(this);
    generateUiIcons(this);
    this.scene.start("Menu");
  }
}
