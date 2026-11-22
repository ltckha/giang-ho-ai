import { describe, expect, it } from 'vitest';
import {
  advanceQuestProgress,
  completeQuest,
  createInitialQuests,
  startQuest,
} from '../src/core/quests';
import {
  advanceMainQuestProgress,
  completeMainQuestStep,
  createInitialMainQuest,
  createInitialSectReputation,
  getDominantSectAlly,
  getSectAttitudeTier,
  unlockMainQuestGd2,
} from '../src/core/reputation';
import {
  LEGACY_SAVE_STORAGE_KEY_V1,
  loadGameState,
  type KeyValueStorage,
} from '../src/core/saveSystem';

function createMemoryStorage(): KeyValueStorage {
  const store = new Map<string, string>();
  return {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => {
      store.set(k, v);
    },
    removeItem: (k) => {
      store.delete(k);
    },
  };
}

describe('Nhiệm vụ chính 6 bước, thái độ 3 môn phái & 3 nhiệm vụ phụ GĐ2', () => {
  it('chuỗi nhiệm vụ chính 6 bước mở khóa sau khi hạ Trùm GĐ1 và các lựa chọn thay đổi thái độ 3 phái', () => {
    let mq = createInitialMainQuest(false);
    let rep = createInitialSectReputation('sect_open');

    expect(mq.step).toBe(0);
    expect(rep.sect_open).toBe(20);
    expect(getSectAttitudeTier(rep.sect_open)).toBe('friendly');
    expect(getSectAttitudeTier(rep.sect_closed)).toBe('neutral');

    // Hạ Trùm GĐ1 -> mở khóa bước 1
    mq = unlockMainQuestGd2(mq);
    expect(mq.step).toBe(1);

    // Bước 1 -> 2
    let r = completeMainQuestStep(mq, rep);
    expect(r.advanced).toBe(true);
    mq = r.state;
    rep = r.reputation;
    expect(mq.step).toBe(2);

    // Bước 2 yêu cầu phải có lựa chọn
    expect(completeMainQuestStep(mq, rep).advanced).toBe(false);

    // Chọn phương án phe Đóng ở bước 2 -> thái độ phe Đóng tăng mạnh, phe Mở giảm
    r = completeMainQuestStep(mq, rep, 'choice_lock_closed');
    expect(r.advanced).toBe(true);
    mq = r.state;
    rep = r.reputation;
    expect(mq.step).toBe(3);
    expect(rep.sect_closed).toBe(25);
    expect(rep.sect_open).toBe(5);
    expect(getSectAttitudeTier(rep.sect_closed)).toBe('friendly');

    // Bước 3 yêu cầu đủ 3/3 tiến độ điều tra
    expect(completeMainQuestStep(mq, rep).advanced).toBe(false);
    mq = advanceMainQuestProgress(mq, 3);
    r = completeMainQuestStep(mq, rep);
    expect(r.advanced).toBe(true);
    mq = r.state;
    expect(mq.step).toBe(4);

    // Bước 4 chọn kiểm soát độc quyền
    r = completeMainQuestStep(mq, rep, 'choice_sect_monopoly');
    mq = r.state;
    rep = r.reputation;
    expect(mq.step).toBe(5);
    expect(rep.sect_closed).toBe(47);
    expect(getSectAttitudeTier(rep.sect_open)).toBe('wary');

    // Bước 5 hạ Trùm GĐ2
    expect(completeMainQuestStep(mq, rep).advanced).toBe(false);
    mq = advanceMainQuestProgress(mq, 1);
    r = completeMainQuestStep(mq, rep);
    mq = r.state;
    expect(mq.step).toBe(6);
    expect(mq.gd2BossDefeated).toBe(true);

    // Bước 6 phán quyết cuối
    r = completeMainQuestStep(mq, rep, 'ending_regulated_vault');
    mq = r.state;
    rep = r.reputation;
    expect(mq.step).toBe(7);
    expect(mq.choicesMade.step6).toBe('ending_regulated_vault');
    expect(getSectAttitudeTier(rep.sect_closed)).toBe('honored');
    expect(getDominantSectAlly(rep)).toBe('sect_closed');
  });

  it('vòng đời trọn vẹn 3 nhiệm vụ phụ mới (giả giọng, chép trộm bí kíp, phá bùa phong ấn)', () => {
    let quests = createInitialQuests();

    quests = startQuest(quests, 'quest_fake_elder');
    quests = advanceQuestProgress(quests, 'quest_fake_elder', 1);
    const done1 = completeQuest(quests, 'quest_fake_elder');
    expect(done1.reward?.rolledRewardSlot).toBe('charm');
    expect(done1.quests.quest_fake_elder.status).toBe('completed');

    quests = startQuest(done1.quests, 'quest_stolen_manual');
    quests = advanceQuestProgress(quests, 'quest_stolen_manual', 3);
    const done2 = completeQuest(quests, 'quest_stolen_manual');
    expect(done2.reward?.rolledRewardSlot).toBe('weapon');
    expect(done2.quests.quest_stolen_manual.status).toBe('completed');

    quests = startQuest(done2.quests, 'quest_seal_breaker');
    quests = advanceQuestProgress(quests, 'quest_seal_breaker', 3);
    const done3 = completeQuest(quests, 'quest_seal_breaker');
    expect(done3.reward?.rolledRewardSlot).toBe('armor');
    expect(done3.quests.quest_seal_breaker.status).toBe('completed');
  });

  it('bản lưu GĐ1 đã hạ Trùm Sơ Giác khi chuyển đổi sang GĐ2 tự mở khóa nhiệm vụ chính GĐ2 và khởi tạo bang hội AI', () => {
    const storage = createMemoryStorage();
    storage.setItem(
      LEGACY_SAVE_STORAGE_KEY_V1,
      JSON.stringify({
        version: 1,
        savedAt: 1732200000000,
        sectId: 'sect_ban',
        mapId: 'map_town',
        playerPos: { x: 640, y: 520 },
        level: 5,
        xp: 40,
        hp: 210,
        silver: 420,
        spiritStones: 18,
        equipment: { weapon: 'wpn_cave_relic', armor: 'arm_bronze_mail', charm: 'chm_tho' },
        inventory: [{ itemId: 'pot_heal_small', quantity: 4 }],
        quests: {
          quest_blacksmith: { status: 'completed', count: 3, targetCount: 3 },
          quest_hallucination: { status: 'completed', count: 1, targetCount: 1 },
          quest_boss: { status: 'completed', count: 1, targetCount: 1 },
        },
        allies: [
          { id: 'ally_reckless', hp: 130 },
          { id: 'ally_cautious', hp: 115 },
          { id: 'ally_greedy', hp: 105 },
        ],
        bossDefeated: true,
      }),
    );

    const migrated = loadGameState(storage);
    expect(migrated).not.toBeNull();
    expect(migrated?.level).toBe(5);
    expect(migrated?.silver).toBe(420);
    expect(migrated?.mainQuestGd2.step).toBe(1);
    expect(migrated?.sectReputation.sect_ban).toBe(20);
    expect(migrated?.guildWorld.castleOwnerId).toBe('guild_guardian');
    expect(migrated?.quests.quest_fake_elder.status).toBe('not_started');
    expect(migrated?.quests.quest_stolen_manual.status).toBe('not_started');
    expect(migrated?.quests.quest_seal_breaker.status).toBe('not_started');
  });
});
