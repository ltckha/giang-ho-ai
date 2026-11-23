import { describe, expect, it } from 'vitest';
import { isShopUnlocked, SHOP_STREET, shopStars } from '../src/core/shopStreet';
import { STAGES } from '../src/core/tdDefinitions';
import { TowerDefenseEngine } from '../src/core/tdEngine';
import { TUTORIAL_PAD, TUTORIAL_STEPS, TUTORIAL_TOWER, TutorialController } from '../src/core/tutorial';

describe('Hướng dẫn lần đầu — luật bước', () => {
  it('đi đủ 5 bước theo thao tác thật rồi đánh dấu đã xem', () => {
    let done = 0;
    const tut = new TutorialController(() => done++);
    const e = new TowerDefenseEngine(STAGES.stage_1);
    expect(tut.current()!.id).toBe('tap_pad');
    expect(tut.shouldPause()).toBe(true);
    tut.notify('next'); // bước chạm ô không có nút Tiếp
    expect(tut.current()!.id).toBe('tap_pad');
    tut.notify('pad_opened');
    expect(tut.current()!.id).toBe('pick_tower');
    tut.sync(e);
    expect(tut.current()!.id).toBe('pick_tower');
    e.buildTower(TUTORIAL_PAD, TUTORIAL_TOWER);
    tut.sync(e);
    expect(tut.current()!.id).toBe('see_wave');
    tut.notify('next');
    tut.notify('next');
    expect(tut.current()!.id).toBe('upgrade_go');
    expect(tut.shouldPause()).toBe(false);
    e.startNextWave(false);
    tut.sync(e);
    expect(tut.isActive()).toBe(false);
    expect(done).toBe(1);
  });

  it('bỏ qua ở bước nào cũng kết thúc, chỉ đánh dấu 1 lần', () => {
    let done = 0;
    const tut = new TutorialController(() => done++);
    tut.skip();
    tut.skip();
    expect(tut.isActive()).toBe(false);
    expect(done).toBe(1);
  });

  it('ô và món gợi ý tồn tại và đủ xu ở đầu Màn 1', () => {
    const e = new TowerDefenseEngine(STAGES.stage_1);
    expect(STAGES.stage_1.pads.some((p) => p.id === TUTORIAL_PAD)).toBe(true);
    expect(e.getBuildCost(TUTORIAL_TOWER)).toBeLessThanOrEqual(e.essence);
    expect(TUTORIAL_STEPS.length).toBe(5);
  });
});

describe('Con phố dốc', () => {
  it('3 tiệm theo thứ tự, mở dần theo màn đã qua', () => {
    expect(SHOP_STREET.map((s) => s.stageId)).toEqual(['stage_1', 'stage_2', 'stage_3']);
    const save = { unlockedStage: 2 as const, starsByStage: { stage_1: 3 as const } };
    expect(isShopUnlocked(save, SHOP_STREET[0]!)).toBe(true);
    expect(isShopUnlocked(save, SHOP_STREET[1]!)).toBe(true);
    expect(isShopUnlocked(save, SHOP_STREET[2]!)).toBe(false);
    expect(shopStars(save, SHOP_STREET[0]!)).toBe(3);
  });
});
