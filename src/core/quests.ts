import type { QuestId, QuestStateMap } from './types';

export interface QuestReward {
  silver: number;
  spiritStones: number;
  xp: number;
  itemId?: string;
  rolledRewardRarity?: 'fine' | 'rare' | 'epic';
  rolledRewardSlot?: 'weapon' | 'armor' | 'charm';
}

export const QUEST_REWARDS: Record<QuestId, QuestReward> = {
  quest_blacksmith: {
    silver: 60,
    spiritStones: 3,
    xp: 90,
    itemId: 'wpn_blacksmith_blade',
  },
  quest_hallucination: {
    silver: 55,
    spiritStones: 4,
    xp: 85,
    itemId: 'chm_thuy',
  },
  quest_boss: {
    silver: 180,
    spiritStones: 10,
    xp: 260,
    itemId: 'wpn_cave_relic',
  },
  quest_fake_elder: {
    silver: 110,
    spiritStones: 5,
    xp: 160,
    rolledRewardRarity: 'fine',
    rolledRewardSlot: 'charm',
  },
  quest_stolen_manual: {
    silver: 135,
    spiritStones: 6,
    xp: 190,
    rolledRewardRarity: 'rare',
    rolledRewardSlot: 'weapon',
  },
  quest_seal_breaker: {
    silver: 150,
    spiritStones: 7,
    xp: 220,
    rolledRewardRarity: 'rare',
    rolledRewardSlot: 'armor',
  },
};

export function createInitialQuests(): QuestStateMap {
  return {
    quest_blacksmith: { status: 'not_started', count: 0, targetCount: 3 },
    quest_hallucination: { status: 'not_started', count: 0, targetCount: 1 },
    quest_boss: { status: 'active', count: 0, targetCount: 1 },
    quest_fake_elder: { status: 'not_started', count: 0, targetCount: 1 },
    quest_stolen_manual: { status: 'not_started', count: 0, targetCount: 3 },
    quest_seal_breaker: { status: 'not_started', count: 0, targetCount: 3 },
  };
}

export function startQuest(quests: QuestStateMap, questId: QuestId): QuestStateMap {
  const current = quests[questId];
  if (current.status !== 'not_started') return quests;
  return {
    ...quests,
    [questId]: { ...current, status: 'active' },
  };
}

export function advanceQuestProgress(
  quests: QuestStateMap,
  questId: QuestId,
  delta = 1,
): QuestStateMap {
  const current = quests[questId];
  if (current.status !== 'active') return quests;
  const nextCount = Math.min(current.targetCount, current.count + delta);
  const nextStatus = nextCount >= current.targetCount ? 'ready' : 'active';
  return {
    ...quests,
    [questId]: {
      ...current,
      count: nextCount,
      status: nextStatus,
    },
  };
}

export function completeQuest(
  quests: QuestStateMap,
  questId: QuestId,
): { quests: QuestStateMap; reward: QuestReward | null } {
  const current = quests[questId];
  if (current.status !== 'ready') {
    return { quests, reward: null };
  }
  return {
    quests: {
      ...quests,
      [questId]: { ...current, status: 'completed' },
    },
    reward: QUEST_REWARDS[questId],
  };
}
