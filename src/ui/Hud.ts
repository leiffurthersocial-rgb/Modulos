import Phaser from "phaser";
import { HOTBAR_SIZE, type Inventory, type Slot } from "../core/inventory";
import { itemDef } from "../core/items";
import { RECIPES, type Recipe } from "../core/recipes";

const SLOT = 42;
const GAP = 4;

interface SlotView {
  bg: Phaser.GameObjects.Rectangle;
  icon: Phaser.GameObjects.Image;
  count: Phaser.GameObjects.Text;
}

export class Hud {
  private scene: Phaser.Scene;
  private inv: Inventory;
  selected = 0;

  /** Root objects the main (zoomed) camera should ignore so the UI camera owns them. */
  readonly objects: Phaser.GameObjects.GameObject[] = [];

  private hotbarSlots: SlotView[] = [];
  private invSlots: SlotView[] = [];
  private invPanel!: Phaser.GameObjects.Container;
  private craftRows: Array<{ recipe: Recipe; row: Phaser.GameObjects.Container; ok: boolean }> = [];
  private settingsPanel!: Phaser.GameObjects.Container;
  private held: Slot = null;
  private heldIcon!: Phaser.GameObjects.Image;

  /** Set by GameScene: whether a crafting table is nearby, and callbacks. */
  nearTable = false;
  onNewWorld: () => void = () => {};
  onToggleDayNight: () => void = () => {};
  getDayNight: () => boolean = () => true;

  constructor(scene: Phaser.Scene, inv: Inventory) {
    this.scene = scene;
    this.inv = inv;
    this.buildHotbar();
    this.buildInventory();
    this.buildSettings();

    this.heldIcon = scene.add.image(0, 0, "icon_dirt").setScale(2.2).setDepth(3000).setScrollFactor(0).setVisible(false);
    scene.input.on("pointermove", (p: Phaser.Input.Pointer) => this.heldIcon.setPosition(p.x, p.y));
    this.objects.push(this.heldIcon, this.invPanel, this.settingsPanel);

    this.refresh();
  }

  private makeSlot(x: number, y: number, container?: Phaser.GameObjects.Container): SlotView {
    const bg = this.scene.add.rectangle(x, y, SLOT, SLOT, 0x2b2b38, 0.9).setStrokeStyle(2, 0x4a4a5a).setScrollFactor(0);
    const icon = this.scene.add.image(x, y, "icon_dirt").setScale(2.2).setScrollFactor(0).setVisible(false);
    const count = this.scene.add
      .text(x + SLOT / 2 - 4, y + SLOT / 2 - 4, "", { fontFamily: "monospace", fontSize: "12px", color: "#fff", stroke: "#000", strokeThickness: 3 })
      .setOrigin(1, 1)
      .setScrollFactor(0);
    if (container) container.add([bg, icon, count]);
    else {
      bg.setDepth(1000);
      icon.setDepth(1001);
      count.setDepth(1002);
      this.objects.push(bg, icon, count);
    }
    return { bg, icon, count };
  }

  private buildHotbar(): void {
    const total = HOTBAR_SIZE * (SLOT + GAP) - GAP;
    const x0 = this.scene.scale.width / 2 - total / 2 + SLOT / 2;
    const y = this.scene.scale.height - SLOT / 2 - 8;
    for (let i = 0; i < HOTBAR_SIZE; i++) {
      const s = this.makeSlot(x0 + i * (SLOT + GAP), y, undefined);
      const idx = i;
      s.bg.setInteractive().on("pointerdown", () => {
        if (this.invPanel.visible) this.clickSlot(idx);
        else this.select(idx);
      });
      this.hotbarSlots.push(s);
    }
  }

  private buildInventory(): void {
    const { width, height } = this.scene.scale;
    this.invPanel = this.scene.add.container(0, 0).setDepth(2000).setScrollFactor(0).setVisible(false);
    const dim = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5).setScrollFactor(0);
    this.invPanel.add(dim);

    const cols = 9;
    const rows = 4;
    const gridW = cols * (SLOT + GAP) - GAP;
    const gx = width / 2 - gridW / 2 - 90;
    const gy = 120;
    this.invPanel.add(
      this.scene.add.text(gx, gy - 30, "Inventory", { fontFamily: "monospace", fontSize: "16px", color: "#f4ecd6" }),
    );
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const index = r === rows - 1 ? c : HOTBAR_SIZE + (r * cols + c); // bottom row = hotbar
        const x = gx + c * (SLOT + GAP) + SLOT / 2;
        const y = gy + r * (SLOT + GAP) + SLOT / 2 + (r === rows - 1 ? 10 : 0);
        const s = this.makeSlot(x, y, this.invPanel);
        s.bg.setInteractive().on("pointerdown", () => this.clickSlot(index));
        this.invSlots[index] = s;
      }
    }

    // Crafting column
    const cxr = gx + gridW + 40;
    this.invPanel.add(
      this.scene.add.text(cxr, gy - 30, "Crafting", { fontFamily: "monospace", fontSize: "16px", color: "#f4ecd6" }),
    );
    RECIPES.forEach((recipe, i) => {
      const y = gy + i * 24;
      const row = this.scene.add.container(cxr, y);
      const bg = this.scene.add.rectangle(90, 10, 200, 22, 0x2b2b38, 0.9).setStrokeStyle(1, 0x4a4a5a).setOrigin(0.5);
      const icon = this.scene.add.image(10, 10, `icon_${recipe.out.id}`).setScale(1.2).setOrigin(0.5);
      const label = this.scene.add
        .text(24, 10, `${recipe.out.count}x ${itemDef(recipe.out.id).name}`, { fontFamily: "monospace", fontSize: "11px", color: "#ddd" })
        .setOrigin(0, 0.5);
      row.add([bg, icon, label]);
      bg.setInteractive().on("pointerdown", () => this.craft(recipe));
      this.invPanel.add(row);
      this.craftRows.push({ recipe, row, ok: false });
    });
  }

  private buildSettings(): void {
    const { width, height } = this.scene.scale;
    this.settingsPanel = this.scene.add.container(0, 0).setDepth(2500).setScrollFactor(0).setVisible(false);
    const dim = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6).setScrollFactor(0);
    const panel = this.scene.add.rectangle(width / 2, height / 2, 320, 260, 0x1c1c26, 0.98).setStrokeStyle(2, 0x4a4a5a);
    const title = this.scene.add.text(width / 2, height / 2 - 108, "Settings", { fontFamily: "monospace", fontSize: "20px", color: "#f4ecd6" }).setOrigin(0.5);
    this.settingsPanel.add([dim, panel, title]);

    const mkBtn = (label: string, dy: number, cb: () => void): Phaser.GameObjects.Text => {
      const t = this.scene.add
        .text(width / 2, height / 2 + dy, label, { fontFamily: "monospace", fontSize: "15px", color: "#e8d8b0", backgroundColor: "#33333f", padding: { x: 12, y: 7 } })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setInteractive({ useHandCursor: true })
        .on("pointerover", () => t.setColor("#ffffff"))
        .on("pointerout", () => t.setColor("#e8d8b0"))
        .on("pointerdown", cb);
      this.settingsPanel.add(t);
      return t;
    };

    this.dayNightBtn = mkBtn("Day/Night: On", -50, () => {
      this.onToggleDayNight();
      this.dayNightBtn.setText(`Day/Night: ${this.getDayNight() ? "On" : "Off"}`);
    });
    mkBtn("Resume", 0, () => this.toggleSettings());
    mkBtn("New World", 50, () => this.onNewWorld());
    const help = this.scene.add
      .text(width / 2, height / 2 + 100, "Move: A/D  Jump: Space  Mine: L-Click\nPlace: R-Click  Inv/Craft: E  Settings: Esc", {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#9a9aa8",
        align: "center",
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
    this.settingsPanel.add(help);
  }
  private dayNightBtn!: Phaser.GameObjects.Text;

  // ---- interactions ----
  select(i: number): void {
    this.selected = Phaser.Math.Clamp(i, 0, HOTBAR_SIZE - 1);
    this.refresh();
  }

  cycle(dir: number): void {
    this.selected = (this.selected + dir + HOTBAR_SIZE) % HOTBAR_SIZE;
    this.refresh();
  }

  selectedItem(): Slot {
    return this.inv.slots[this.selected];
  }

  consumeSelected(n = 1): void {
    this.inv.removeAt(this.selected, n);
    this.refresh();
  }

  private clickSlot(index: number): void {
    const cur = this.inv.slots[index];
    if (this.held) {
      if (cur && cur.id === this.held.id) {
        const max = itemDef(cur.id).maxStack;
        const room = max - cur.count;
        const take = Math.min(room, this.held.count);
        cur.count += take;
        this.held.count -= take;
        if (this.held.count <= 0) this.held = null;
      } else {
        this.inv.slots[index] = this.held;
        this.held = cur;
      }
    } else if (cur) {
      this.held = cur;
      this.inv.slots[index] = null;
    }
    this.updateHeldIcon();
    this.refresh();
  }

  private updateHeldIcon(): void {
    if (this.held) this.heldIcon.setTexture(`icon_${this.held.id}`).setVisible(true);
    else this.heldIcon.setVisible(false);
  }

  private craft(recipe: Recipe): void {
    if (recipe.station && !this.nearTable) return;
    for (const req of recipe.ins) if (!this.inv.has(req.id, req.count)) return;
    for (const req of recipe.ins) this.inv.remove(req.id, req.count);
    this.inv.add(recipe.out.id, recipe.out.count);
    this.refresh();
  }

  toggleInventory(): void {
    const v = !this.invPanel.visible;
    this.invPanel.setVisible(v);
    if (!v && this.held) {
      // drop held back into inventory
      this.inv.add(this.held.id, this.held.count);
      this.held = null;
      this.updateHeldIcon();
    }
    this.refresh();
  }

  toggleSettings(): void {
    this.settingsPanel.setVisible(!this.settingsPanel.visible);
  }

  isAnyOpen(): boolean {
    return this.invPanel.visible || this.settingsPanel.visible;
  }

  closeAll(): void {
    if (this.invPanel.visible) this.toggleInventory();
    if (this.settingsPanel.visible) this.settingsPanel.setVisible(false);
  }

  private paint(view: SlotView, slot: Slot, selected: boolean): void {
    if (slot) {
      view.icon.setTexture(`icon_${slot.id}`).setVisible(true);
      view.count.setText(slot.count > 1 ? String(slot.count) : "");
    } else {
      view.icon.setVisible(false);
      view.count.setText("");
    }
    view.bg.setStrokeStyle(selected ? 3 : 2, selected ? 0xf4d94a : 0x4a4a5a);
  }

  refresh(): void {
    for (let i = 0; i < HOTBAR_SIZE; i++) this.paint(this.hotbarSlots[i], this.inv.slots[i], i === this.selected);
    if (this.invPanel.visible) {
      for (let i = 0; i < this.invSlots.length; i++) if (this.invSlots[i]) this.paint(this.invSlots[i], this.inv.slots[i], false);
      for (const cr of this.craftRows) {
        const ok = (!cr.recipe.station || this.nearTable) && cr.recipe.ins.every((r) => this.inv.has(r.id, r.count));
        cr.ok = ok;
        (cr.row.list[0] as Phaser.GameObjects.Rectangle).setFillStyle(ok ? 0x3a5a34 : 0x2b2b38, 0.9);
        (cr.row.list[2] as Phaser.GameObjects.Text).setColor(ok ? "#eaffea" : "#888");
      }
    }
  }
}
