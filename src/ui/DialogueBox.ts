import Phaser from "phaser";

export class DialogueBox {
  private container: Phaser.GameObjects.Container;
  private text: Phaser.GameObjects.Text;
  private nameText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    const { width, height } = scene.scale;

    const boxHeight = 90;
    const bg = scene.add
      .rectangle(width / 2, height - boxHeight / 2 - 10, width - 40, boxHeight, 0x14141c, 0.92)
      .setStrokeStyle(2, 0x3a3a4a);

    this.nameText = scene.add.text(40, height - boxHeight - 4, "", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#e8c96b",
    });

    this.text = scene.add.text(40, height - boxHeight + 14, "", {
      fontFamily: "monospace",
      fontSize: "13px",
      color: "#f0e4c8",
      wordWrap: { width: width - 100 },
    });

    this.container = scene.add.container(0, 0, [bg, this.nameText, this.text]);
    this.container.setDepth(100);
    this.container.setVisible(false);
  }

  show(name: string, message: string): void {
    this.nameText.setText(name);
    this.text.setText(`${message}\n(press E to close)`);
    this.container.setVisible(true);
  }

  hide(): void {
    this.container.setVisible(false);
  }

  get isVisible(): boolean {
    return this.container.visible;
  }
}
