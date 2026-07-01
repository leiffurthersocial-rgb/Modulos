import { itemDef } from "./items";
import type { Stack } from "./recipes";

export const HOTBAR_SIZE = 9;
export const INV_SIZE = 36; // 4 rows of 9 (first row is the hotbar)

export type Slot = Stack | null;

export class Inventory {
  slots: Slot[];

  constructor(size = INV_SIZE, slots?: Slot[]) {
    this.slots = slots ?? new Array(size).fill(null);
  }

  /** Adds items, stacking where possible. Returns the count that didn't fit. */
  add(id: string, count: number): number {
    const max = itemDef(id)?.maxStack ?? 99;
    // top up existing stacks
    for (const s of this.slots) {
      if (count <= 0) break;
      if (s && s.id === id && s.count < max) {
        const room = max - s.count;
        const take = Math.min(room, count);
        s.count += take;
        count -= take;
      }
    }
    // fill empty slots
    for (let i = 0; i < this.slots.length && count > 0; i++) {
      if (!this.slots[i]) {
        const take = Math.min(max, count);
        this.slots[i] = { id, count: take };
        count -= take;
      }
    }
    return count;
  }

  count(id: string): number {
    let n = 0;
    for (const s of this.slots) if (s && s.id === id) n += s.count;
    return n;
  }

  has(id: string, count: number): boolean {
    return this.count(id) >= count;
  }

  /** Removes up to `count` of an item. Returns true if all were removed. */
  remove(id: string, count: number): boolean {
    if (!this.has(id, count)) return false;
    for (let i = 0; i < this.slots.length && count > 0; i++) {
      const s = this.slots[i];
      if (s && s.id === id) {
        const take = Math.min(s.count, count);
        s.count -= take;
        count -= take;
        if (s.count === 0) this.slots[i] = null;
      }
    }
    return true;
  }

  removeAt(index: number, count = 1): void {
    const s = this.slots[index];
    if (!s) return;
    s.count -= count;
    if (s.count <= 0) this.slots[index] = null;
  }

  serialize(): Slot[] {
    return this.slots;
  }
}
