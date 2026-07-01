import Phaser from "phaser";
import type { CharacterDef } from "../config/characters";

export class NPC extends Phaser.Physics.Arcade.Sprite {
  readonly character: CharacterDef;
  readonly greeting: string;

  constructor(scene: Phaser.Scene, x: number, y: number, character: CharacterDef, greeting: string) {
    super(scene, x, y, character.spriteKey);
    this.character = character;
    this.greeting = greeting;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(true);
    body.setSize(16, 12);
    body.setOffset(8, 18);
    this.setDepth(y);

    scene.add
      .text(x, y - 24, character.name, {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#f4ecd6",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(9000);
  }
}
