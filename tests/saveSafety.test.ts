import { describe, expect, it } from 'vitest';
import { loadTdSave, TD_SAVE_KEY, capInventory, MAX_INVENTORY } from '../src/core/saveSystem';
import { migrateGearItem, makeGearItem } from '../src/core/equipment';
import { mergeSaveData } from '../src/game/saveMerge';
import { realStreetsOpen } from '../src/core/streetProgress';
import type { TdSaveData } from '../src/core/types';

const store = (obj: unknown) => ({ getItem: (k: string) => (k === TD_SAVE_KEY ? JSON.stringify(obj) : null) });
const base = (extra: Partial<TdSaveData> = {}): TdSaveData => ({ version: 1, unlockedStage: 1, starsByStage: {}, bestLivesByStage: {}, updatedAt: 1, ...extra });

describe('Bản lưu an toàn (đánh giá độc lập 25/11)', () => {
  it('C3: tên món trong bản lưu bị thay bằng tên chuẩn — không chèn được mã lạ', () => {
    const bad = { uid: 'x1', slot: 'hat', element: 'moc', rarity: 'tot', name: '<img src=x onerror=alert(1)>', visible: [{ kind: 'all_dmg', value: 0.1 }], hidden: [] };
    const it = migrateGearItem(bad)!;
    expect(it.name).not.toContain('<');
    expect(migrateGearItem({ ...bad, uid: '"><script>' })).toBeNull();
    expect(migrateGearItem({ ...bad, slot: 'x<y' })).toBeNull();
    expect(migrateGearItem({ ...bad, visible: [{ kind: '<b>', value: 1 }] })!.visible[0]!.kind).not.toBe('<b>');
  });

  it('V3: 1 món hỏng không làm mất sao các màn', () => {
    const s = loadTdSave(store(base({ starsByStage: { stage_1: 3, stage_2: 3 }, gearInventory: [null as never, { uid: 'ok1', slot: 'hat', element: 'moc', rarity: 'tot', visible: [], hidden: [] } as never] })));
    expect(s.starsByStage).toEqual({ stage_1: 3, stage_2: 3 });
    expect(s.gearInventory!.map((g) => g.uid)).toEqual(['ok1']);
  });

  it('C1: gộp 2 máy lấy sao cao hơn và hợp túi đồ, không mất phần của máy nào', () => {
    const g1 = makeGearItem('hat', 'moc', 'tot', 'g1');
    const g2 = makeGearItem('glasses', 'hoa', 'xin', 'g2');
    const a = base({ starsByStage: { stage_1: 3, stage_2: 1 }, gearInventory: [g1], updatedAt: 5 });
    const b = base({ starsByStage: { stage_1: 1, stage_3: 2 }, gearInventory: [g2], updatedAt: 9 });
    const m = mergeSaveData(a, b);
    expect(m.starsByStage).toEqual({ stage_1: 3, stage_2: 1, stage_3: 2 });
    expect(m.gearInventory!.map((g) => g.uid).sort()).toEqual(['g1', 'g2']);
  });

  it('V2: túi đồ tối đa 200 món, giữ món đang mặc', () => {
    const inv = Array.from({ length: MAX_INVENTORY + 30 }, (_, i) => makeGearItem('hat', 'moc', 'thuong', `t${i}`));
    const out = capInventory(inv, { hat: 't0' });
    expect(out.length).toBe(MAX_INVENTORY);
    expect(out.some((g) => g.uid === 't0')).toBe(true);
  });

  it('C4: giữ xong 3 tiệm Phố Dốc là mở phố Đà Lạt (không cần thắng Trùm)', () => {
    expect(realStreetsOpen(base({ starsByStage: { stage_1: 1, stage_2: 1 } }))).toBe(false);
    expect(realStreetsOpen(base({ starsByStage: { stage_1: 1, stage_2: 1, stage_3: 1 } }))).toBe(true);
  });
});
