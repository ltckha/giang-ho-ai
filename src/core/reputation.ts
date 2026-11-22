import type { SectId } from './types';

export type SectAttitudeTier = 'hostile' | 'wary' | 'neutral' | 'friendly' | 'honored';

export type SectReputationMap = Record<SectId, number>;

export type MainStoryChoiceId =
  | 'choice_share_open'
  | 'choice_lock_closed'
  | 'choice_burn_ban'
  | 'choice_joint_council'
  | 'choice_sect_monopoly'
  | 'choice_strict_seal'
  | 'ending_open_coexist'
  | 'ending_regulated_vault'
  | 'ending_seal_ban'
  | 'ending_balanced_charter';

export type MainQuestChoiceSlot = 'step2' | 'step4' | 'step6';

export interface MainQuestState {
  /**
   * 0 = chưa mở khóa (chờ hạ Trùm GĐ1),
   * 1..6 = 6 bước nhiệm vụ chính GĐ2,
   * 7 = hoàn thành chuỗi nhiệm vụ chính GĐ2.
   */
  step: number;
  stepProgress: number;
  stepTarget: number;
  choicesMade: Partial<Record<MainQuestChoiceSlot, MainStoryChoiceId>>;
  gd2BossDefeated: boolean;
}

export const MAIN_QUEST_TOTAL_STEPS = 6;

export const MAIN_QUEST_STEP_TARGETS: Record<number, number> = {
  1: 1, // Nghe tin đồn và gặp người dẫn chuyện trung lập sau khi Trùm GĐ1 thức tỉnh
  2: 1, // Lựa chọn lập trường ban đầu trước đại diện 3 môn phái (ảnh hưởng thái độ 3 phái)
  3: 3, // Điều tra dấu vết chép trộm / phá bùa tại vùng mỏ lớn (hạ 3 quái tinh nhuệ / thu chứng cứ)
  4: 1, // Quyết định cơ chế quản lý mỏ & bí kíp (lựa chọn lần 2 ảnh hưởng thái độ 3 phái)
  5: 1, // Đối mặt và đánh bại Trùm GĐ2 tại đáy vùng mỏ
  6: 1, // Đưa ra phán quyết cuối cùng về quyền tồn tại của khôi lỗi biết nghĩ (lựa chọn lần 3)
};

export const CHOICE_REPUTATION_DELTAS: Record<MainStoryChoiceId, Partial<Record<SectId, number>>> = {
  choice_share_open: { sect_open: 25, sect_closed: -18, sect_ban: -14 },
  choice_lock_closed: { sect_closed: 25, sect_open: -15, sect_ban: 6 },
  choice_burn_ban: { sect_ban: 25, sect_open: -20, sect_closed: -10 },

  choice_joint_council: { sect_open: 14, sect_closed: 12, sect_ban: 10 },
  choice_sect_monopoly: { sect_closed: 22, sect_open: -16, sect_ban: -6 },
  choice_strict_seal: { sect_ban: 22, sect_open: -12, sect_closed: -10 },

  ending_open_coexist: { sect_open: 30, sect_closed: -15, sect_ban: -20 },
  ending_regulated_vault: { sect_closed: 26, sect_ban: 10, sect_open: -14 },
  ending_seal_ban: { sect_ban: 30, sect_open: -22, sect_closed: -10 },
  ending_balanced_charter: { sect_open: 16, sect_closed: 16, sect_ban: 16 },
};

export const STEP_CHOICE_SLOT: Partial<Record<number, MainQuestChoiceSlot>> = {
  2: 'step2',
  4: 'step4',
  6: 'step6',
};

function clampRep(v: number): number {
  return Math.max(-100, Math.min(100, Math.round(v)));
}

export function createInitialSectReputation(playerSectId: SectId): SectReputationMap {
  return {
    sect_open: playerSectId === 'sect_open' ? 20 : 0,
    sect_closed: playerSectId === 'sect_closed' ? 20 : 0,
    sect_ban: playerSectId === 'sect_ban' ? 20 : 0,
  };
}

export function applySectReputationDelta(
  rep: SectReputationMap,
  delta: Partial<Record<SectId, number>>,
): SectReputationMap {
  return {
    sect_open: clampRep(rep.sect_open + (delta.sect_open ?? 0)),
    sect_closed: clampRep(rep.sect_closed + (delta.sect_closed ?? 0)),
    sect_ban: clampRep(rep.sect_ban + (delta.sect_ban ?? 0)),
  };
}

export function getSectAttitudeTier(score: number): SectAttitudeTier {
  if (score <= -30) return 'hostile';
  if (score <= -10) return 'wary';
  if (score < 20) return 'neutral';
  if (score < 50) return 'friendly';
  return 'honored';
}

export function createInitialMainQuest(unlocked = false): MainQuestState {
  if (unlocked) {
    return {
      step: 1,
      stepProgress: 0,
      stepTarget: MAIN_QUEST_STEP_TARGETS[1],
      choicesMade: {},
      gd2BossDefeated: false,
    };
  }
  return {
    step: 0,
    stepProgress: 0,
    stepTarget: 1,
    choicesMade: {},
    gd2BossDefeated: false,
  };
}

export function unlockMainQuestGd2(state: MainQuestState): MainQuestState {
  if (state.step > 0) return state;
  return {
    ...state,
    step: 1,
    stepProgress: 0,
    stepTarget: MAIN_QUEST_STEP_TARGETS[1],
  };
}

export function advanceMainQuestProgress(
  state: MainQuestState,
  delta = 1,
): MainQuestState {
  if (state.step <= 0 || state.step > MAIN_QUEST_TOTAL_STEPS) return state;
  const nextProgress = Math.min(state.stepTarget, state.stepProgress + Math.max(0, delta));
  return {
    ...state,
    stepProgress: nextProgress,
  };
}

/**
 * Hoàn tất bước hiện tại của nhiệm vụ chính GĐ2 và chuyển sang bước kế tiếp.
 * Với các bước có lựa chọn (bước 2, 4, 6), tự động áp dụng thay đổi thái độ 3 môn phái.
 */
export function completeMainQuestStep(
  state: MainQuestState,
  reputation: SectReputationMap,
  choiceId?: MainStoryChoiceId,
): { state: MainQuestState; reputation: SectReputationMap; advanced: boolean } {
  if (state.step <= 0 || state.step > MAIN_QUEST_TOTAL_STEPS) {
    return { state, reputation, advanced: false };
  }

  const slot = STEP_CHOICE_SLOT[state.step];
  if (slot && !choiceId) {
    return { state, reputation, advanced: false };
  }

  // Bước 3 và 5 yêu cầu hoàn thành đủ chỉ tiêu trước khi sang bước sau
  if ((state.step === 3 || state.step === 5) && state.stepProgress < state.stepTarget) {
    return { state, reputation, advanced: false };
  }

  let nextRep = reputation;
  const nextChoices = { ...state.choicesMade };
  if (slot && choiceId) {
    nextChoices[slot] = choiceId;
    nextRep = applySectReputationDelta(reputation, CHOICE_REPUTATION_DELTAS[choiceId]);
  }

  const nextStep = state.step + 1;
  const nextTarget = MAIN_QUEST_STEP_TARGETS[nextStep] ?? 1;

  return {
    state: {
      ...state,
      step: nextStep,
      stepProgress: 0,
      stepTarget: nextTarget,
      choicesMade: nextChoices,
      gd2BossDefeated: state.gd2BossDefeated || state.step === 5,
    },
    reputation: nextRep,
    advanced: true,
  };
}

export function getDominantSectAlly(rep: SectReputationMap): SectId | 'balanced' {
  const entries: Array<[SectId, number]> = [
    ['sect_open', rep.sect_open],
    ['sect_closed', rep.sect_closed],
    ['sect_ban', rep.sect_ban],
  ];
  entries.sort((a, b) => b[1] - a[1]);
  if (entries[0][1] - entries[1][1] <= 5) {
    return 'balanced';
  }
  return entries[0][0];
}
