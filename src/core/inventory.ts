import type { EquipmentSlot, EquipmentState, InventoryEntry, ItemDef } from './types';

export const ITEMS: Record<string, ItemDef> = {
  // Vũ khí (GĐ1 + GĐ2)
  wpn_wood_staff: { id: 'wpn_wood_staff', kind: 'weapon', price: 25, atkBonus: 5 },
  wpn_bronze_sword: { id: 'wpn_bronze_sword', kind: 'weapon', price: 25, atkBonus: 6 },
  wpn_ember_rod: { id: 'wpn_ember_rod', kind: 'weapon', price: 25, atkBonus: 6 },
  wpn_mine_spear: { id: 'wpn_mine_spear', kind: 'weapon', price: 90, atkBonus: 13 },
  wpn_blacksmith_blade: { id: 'wpn_blacksmith_blade', kind: 'weapon', price: 140, atkBonus: 18, hpBonus: 15 },
  wpn_cave_relic: { id: 'wpn_cave_relic', kind: 'weapon', price: 220, atkBonus: 24, defBonus: 4 },
  wpn_valley_staff: { id: 'wpn_valley_staff', kind: 'weapon', price: 260, atkBonus: 27, hpBonus: 25 },
  wpn_inner_sword: { id: 'wpn_inner_sword', kind: 'weapon', price: 280, atkBonus: 30, defBonus: 5 },
  wpn_unseal_rod: { id: 'wpn_unseal_rod', kind: 'weapon', price: 290, atkBonus: 31, hpBonus: 18 },
  wpn_fused_core: { id: 'wpn_fused_core', kind: 'weapon', price: 420, atkBonus: 38, defBonus: 8, hpBonus: 35 },

  // Giáp (GĐ1 + GĐ2)
  arm_cloth_coat: { id: 'arm_cloth_coat', kind: 'armor', price: 20, defBonus: 3, hpBonus: 10 },
  arm_wood_weave: { id: 'arm_wood_weave', kind: 'armor', price: 75, defBonus: 8, hpBonus: 30 },
  arm_bronze_mail: { id: 'arm_bronze_mail', kind: 'armor', price: 130, defBonus: 13, hpBonus: 45 },
  arm_fire_ward: { id: 'arm_fire_ward', kind: 'armor', price: 110, defBonus: 10, hpBonus: 35 },
  arm_stone_vein: { id: 'arm_stone_vein', kind: 'armor', price: 210, defBonus: 17, hpBonus: 65 },
  arm_inner_plate: { id: 'arm_inner_plate', kind: 'armor', price: 250, defBonus: 21, hpBonus: 80 },
  arm_talisman_robe: { id: 'arm_talisman_robe', kind: 'armor', price: 240, defBonus: 18, hpBonus: 75 },
  arm_siege_armor: { id: 'arm_siege_armor', kind: 'armor', price: 340, defBonus: 26, hpBonus: 105 },

  // Ngọc Ngũ Hành (kháng ngũ hành + truyền hệ cho Chiêu 1)
  chm_kim: { id: 'chm_kim', kind: 'charm', price: 70, atkBonus: 4, resistElement: 'kim', resistBonus: 0.25, imbueElement: 'kim' },
  chm_moc: { id: 'chm_moc', kind: 'charm', price: 70, hpBonus: 25, resistElement: 'moc', resistBonus: 0.25, imbueElement: 'moc' },
  chm_thuy: { id: 'chm_thuy', kind: 'charm', price: 85, defBonus: 4, resistElement: 'thuy', resistBonus: 0.28, imbueElement: 'thuy' },
  chm_hoa: { id: 'chm_hoa', kind: 'charm', price: 75, atkBonus: 4, resistElement: 'hoa', resistBonus: 0.25, imbueElement: 'hoa' },
  chm_tho: { id: 'chm_tho', kind: 'charm', price: 75, defBonus: 5, resistElement: 'tho', resistBonus: 0.25, imbueElement: 'tho' },
  chm_awakened_core: {
    id: 'chm_awakened_core',
    kind: 'charm',
    price: 320,
    atkBonus: 10,
    defBonus: 8,
    hpBonus: 45,
    resistElement: 'kim',
    resistBonus: 0.32,
    imbueElement: 'hoa',
  },

  // Tiêu hao
  pot_heal_small: { id: 'pot_heal_small', kind: 'consumable', price: 18, healAmount: 65, healParty: false },
  pot_ally_oil: { id: 'pot_ally_oil', kind: 'consumable', price: 32, healAmount: 55, healParty: true },

  // Vật phẩm nhiệm vụ (GĐ1 + GĐ2)
  qst_iron_ore: { id: 'qst_iron_ore', kind: 'quest', price: 0 },
  qst_voice_mask: { id: 'qst_voice_mask', kind: 'quest', price: 0 },
  qst_stolen_page: { id: 'qst_stolen_page', kind: 'quest', price: 0 },
  qst_reserve_seal: { id: 'qst_reserve_seal', kind: 'quest', price: 0 },
  qst_so_giac_log: { id: 'qst_so_giac_log', kind: 'quest', price: 0 },
};

export const SHOP_STOCK: string[] = [
  'pot_heal_small',
  'pot_ally_oil',
  'wpn_mine_spear',
  'wpn_valley_staff',
  'wpn_inner_sword',
  'arm_wood_weave',
  'arm_bronze_mail',
  'arm_stone_vein',
  'chm_thuy',
  'chm_tho',
  'chm_hoa',
  'chm_kim',
  'chm_moc',
];

export function getSellPrice(itemId: string): number {
  const item = ITEMS[itemId];
  if (!item || item.kind === 'quest' || item.price <= 0) return 0;
  return Math.max(1, Math.floor(item.price * 0.5));
}

export function addInventoryItem(
  inventory: InventoryEntry[],
  itemId: string,
  amount = 1,
): InventoryEntry[] {
  if (amount <= 0 || !ITEMS[itemId]) return inventory;
  const next = inventory.map((entry) => ({ ...entry }));
  const found = next.find((e) => e.itemId === itemId);
  if (found) {
    found.quantity += amount;
  } else {
    next.push({ itemId, quantity: amount });
  }
  return next;
}

export function removeInventoryItem(
  inventory: InventoryEntry[],
  itemId: string,
  amount = 1,
): { inventory: InventoryEntry[]; removed: boolean } {
  const idx = inventory.findIndex((e) => e.itemId === itemId);
  if (idx === -1 || inventory[idx].quantity < amount) {
    return { inventory, removed: false };
  }
  const next = inventory.map((entry) => ({ ...entry }));
  next[idx].quantity -= amount;
  if (next[idx].quantity <= 0) {
    next.splice(idx, 1);
  }
  return { inventory: next, removed: true };
}

export function countInventoryItem(inventory: InventoryEntry[], itemId: string): number {
  return inventory.find((e) => e.itemId === itemId)?.quantity ?? 0;
}

export function equipItem(
  inventory: InventoryEntry[],
  equipment: EquipmentState,
  itemId: string,
): { inventory: InventoryEntry[]; equipment: EquipmentState; equipped: boolean } {
  const item = ITEMS[itemId];
  if (!item || (item.kind !== 'weapon' && item.kind !== 'armor' && item.kind !== 'charm')) {
    return { inventory, equipment, equipped: false };
  }
  const removal = removeInventoryItem(inventory, itemId, 1);
  if (!removal.removed) {
    return { inventory, equipment, equipped: false };
  }

  const slot: EquipmentSlot = item.kind;
  const prevItemId = equipment[slot];
  let nextInventory = removal.inventory;
  if (prevItemId) {
    nextInventory = addInventoryItem(nextInventory, prevItemId, 1);
  }

  return {
    inventory: nextInventory,
    equipment: { ...equipment, [slot]: itemId },
    equipped: true,
  };
}

export function buyItem(
  silver: number,
  inventory: InventoryEntry[],
  itemId: string,
): { silver: number; inventory: InventoryEntry[]; success: boolean } {
  const item = ITEMS[itemId];
  if (!item || item.price <= 0 || silver < item.price) {
    return { silver, inventory, success: false };
  }
  return {
    silver: silver - item.price,
    inventory: addInventoryItem(inventory, itemId, 1),
    success: true,
  };
}

export function sellItem(
  silver: number,
  inventory: InventoryEntry[],
  itemId: string,
): { silver: number; inventory: InventoryEntry[]; success: boolean; gained: number } {
  const sellPrice = getSellPrice(itemId);
  if (sellPrice <= 0) {
    return { silver, inventory, success: false, gained: 0 };
  }
  const removal = removeInventoryItem(inventory, itemId, 1);
  if (!removal.removed) {
    return { silver, inventory, success: false, gained: 0 };
  }
  return {
    silver: silver + sellPrice,
    inventory: removal.inventory,
    success: true,
    gained: sellPrice,
  };
}
