import Phaser from "phaser";
import { CHARACTERS } from "../config/characters";
import { generateCharacterTexture } from "../art/characters";
import { generateWorldTextures } from "../art/world";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  create(): void {
    for (const char of CHARACTERS) {
      generateCharacterTexture(this, char);
    }
    generateWorldTextures(this);

    this.scene.start("CharacterSelect");
  }
}
