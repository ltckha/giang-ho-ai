import { getElementMultiplier } from './elements';
import { createSeededRng } from './equipmentGen';
import type { ElementType } from './types';
import {
  DAYS_PER_WEEK,
  HOURS_PER_DAY,
  SIEGE_DAY_OF_WEEK,
  advanceWorldClock,
  decomposeWorldClock,
} from './worldClock';

export type GuildId =
  | 'guild_aggressive'
  | 'guild_merchant'
  | 'guild_opportunist'
  | 'guild_guardian';

export type GuildPersonality = 'aggressive' | 'hoarder' | 'opportunist' | 'defensive';

export type HuntingSpotId = 'spot_west' | 'spot_north' | 'spot_east';

export type GuildActionType =
  | 'train_level'
  | 'recruit_members'
  | 'gather_stones'
  | 'contest_spot'
  | 'defend_spot'
  | 'join_siege'
  | 'defend_castle';

export type GuildRelationTier = 'allied' | 'neutral' | 'hostile';
export type EncounterBehavior = 'friendly' | 'avoid' | 'attack';
export type RankTrend = 'up' | 'down' | 'same';

export interface HuntingSpotState {
  id: HuntingSpotId;
  difficulty: number;
  element: ElementType;
  stonesPerTick: number;
  xpPerTick: number;
  ownerGuildId: GuildId | null;
}

export interface GuildState {
  id: GuildId;
  personality: GuildPersonality;
  element: ElementType;
  level: number;
  xp: number;
  members: number;
  maxMembers: number;
  spiritStones: number;
  controlledSpots: HuntingSpotId[];
  powerScore: number;
  rank: number;
  previousRank: number;
  rankTrend: RankTrend;
  siegeWins: number;
  lastAction: GuildActionType;
  lastActionTarget?: string;
}

export interface GuildDecision {
  guildId: GuildId;
  action: GuildActionType;
  targetSpotId?: HuntingSpotId;
  score: number;
  scoresByAction: Partial<Record<GuildActionType, number>>;
  reason: string;
}

export type GuildNewsKind =
  | 'spot_captured'
  | 'spot_defended'
  | 'guild_leveled_up'
  | 'siege_won'
  | 'siege_defended'
  | 'player_joined'
  | 'player_left';

export interface GuildNewsEvent {
  id: number;
  week: number;
  dayOfWeek: number;
  hourOfDay: number;
  kind: GuildNewsKind;
  actorGuildId: GuildId;
  targetGuildId?: GuildId | null;
  spotId?: HuntingSpotId;
  value?: number;
}

export interface SiegeResult {
  week: number;
  winnerGuildId: GuildId;
  previousOwnerId: GuildId;
  defenderHeld: boolean;
  participants: Array<{ guildId: GuildId; siegeScore: number }>;
  playerHelpedGuildId: GuildId | null;
}

export interface GuildWorldState {
  clockHours: number;
  lastSiegeWeek: number;
  castleOwnerId: GuildId;
  playerGuildId: GuildId | null;
  guilds: Record<GuildId, GuildState>;
  spots: Record<HuntingSpotId, HuntingSpotState>;
  relations: Record<GuildId, Record<GuildId, number>>;
  newsSeq: number;
  newsLog: GuildNewsEvent[];
  siegeHistory: SiegeResult[];
}

export interface PlayerSiegeSupport {
  guildId: GuildId;
  contribution: number; // điểm đóng góp từ trận chiến của người chơi (0..200)
}

export const ALL_GUILD_IDS: readonly GuildId[] = [
  'guild_aggressive',
  'guild_merchant',
  'guild_opportunist',
  'guild_guardian',
] as const;

export const ALL_SPOT_IDS: readonly HuntingSpotId[] = [
  'spot_west',
  'spot_north',
  'spot_east',
] as const;

const MAX_NEWS_LOG = 24;

export function xpRequiredForGuildLevel(level: number): number {
  const safe = Math.max(1, Math.floor(level));
  return 120 + (safe - 1) * 90 + (safe - 1) * (safe - 1) * 25;
}

export function computeGuildPowerScore(guild: GuildState, isCastleOwner: boolean): number {
  const base =
    guild.level * 48 +
    guild.members * 4.5 +
    Math.min(180, guild.spiritStones * 0.45) +
    guild.controlledSpots.length * 28 +
    (isCastleOwner ? 35 : 0);
  return Math.round(base);
}

export function getGuildRelationScore(
  world: GuildWorldState,
  a: GuildId,
  b: GuildId,
): number {
  if (a === b) return 100;
  return world.relations[a]?.[b] ?? 0;
}

export function getGuildRelationTier(
  world: GuildWorldState,
  a: GuildId,
  b: GuildId,
): GuildRelationTier {
  if (a === b) return 'allied';
  const score = getGuildRelationScore(world, a, b);
  if (score <= -20) return 'hostile';
  if (score >= 30) return 'allied';
  return 'neutral';
}

/**
 * Xác định hành vi khi gặp thành viên bang hội AI ngoài bản đồ:
 * - Cùng bang hoặc đồng minh -> friendly
 * - Bang thù địch (hoặc đang xâm phạm bãi của bang hiếu chiến khi đứng ngoài) -> attack
 * - Trung lập -> avoid (tránh giao tranh vô ích)
 */
export function getEncounterBehavior(
  playerGuildId: GuildId | null,
  encounterGuildId: GuildId,
  world: GuildWorldState,
  isInGuildControlledSpot = false,
): EncounterBehavior {
  if (playerGuildId === encounterGuildId) {
    return 'friendly';
  }
  if (playerGuildId === null) {
    const guild = world.guilds[encounterGuildId];
    if (isInGuildControlledSpot && guild.personality === 'aggressive') {
      return 'attack';
    }
    return 'avoid';
  }
  const tier = getGuildRelationTier(world, playerGuildId, encounterGuildId);
  if (tier === 'allied') return 'friendly';
  if (tier === 'hostile') return 'attack';
  if (isInGuildControlledSpot && world.guilds[encounterGuildId].personality === 'aggressive') {
    return 'attack';
  }
  return 'avoid';
}

function createInitialRelations(): Record<GuildId, Record<GuildId, number>> {
  return {
    guild_aggressive: {
      guild_aggressive: 100,
      guild_merchant: -25,
      guild_opportunist: -10,
      guild_guardian: -35,
    },
    guild_merchant: {
      guild_aggressive: -25,
      guild_merchant: 100,
      guild_opportunist: 15,
      guild_guardian: 20,
    },
    guild_opportunist: {
      guild_aggressive: -10,
      guild_merchant: 15,
      guild_opportunist: 100,
      guild_guardian: -15,
    },
    guild_guardian: {
      guild_aggressive: -35,
      guild_merchant: 20,
      guild_opportunist: -15,
      guild_guardian: 100,
    },
  };
}

export function createInitialGuildWorld(): GuildWorldState {
  const spots: Record<HuntingSpotId, HuntingSpotState> = {
    spot_west: {
      id: 'spot_west',
      difficulty: 2,
      element: 'thuy',
      stonesPerTick: 10,
      xpPerTick: 42,
      ownerGuildId: 'guild_merchant',
    },
    spot_north: {
      id: 'spot_north',
      difficulty: 3,
      element: 'hoa',
      stonesPerTick: 14,
      xpPerTick: 56,
      ownerGuildId: null,
    },
    spot_east: {
      id: 'spot_east',
      difficulty: 4,
      element: 'tho',
      stonesPerTick: 18,
      xpPerTick: 70,
      ownerGuildId: 'guild_guardian',
    },
  };

  const guilds: Record<GuildId, GuildState> = {
    guild_aggressive: {
      id: 'guild_aggressive',
      personality: 'aggressive',
      element: 'kim',
      level: 3,
      xp: 30,
      members: 28,
      maxMembers: 45,
      spiritStones: 75,
      controlledSpots: [],
      powerScore: 0,
      rank: 2,
      previousRank: 2,
      rankTrend: 'same',
      siegeWins: 0,
      lastAction: 'train_level',
    },
    guild_merchant: {
      id: 'guild_merchant',
      personality: 'hoarder',
      element: 'moc',
      level: 3,
      xp: 45,
      members: 28,
      maxMembers: 45,
      spiritStones: 110,
      controlledSpots: ['spot_west'],
      powerScore: 0,
      rank: 3,
      previousRank: 3,
      rankTrend: 'same',
      siegeWins: 0,
      lastAction: 'gather_stones',
    },
    guild_opportunist: {
      id: 'guild_opportunist',
      personality: 'opportunist',
      element: 'thuy',
      level: 3,
      xp: 20,
      members: 25,
      maxMembers: 45,
      spiritStones: 85,
      controlledSpots: [],
      powerScore: 0,
      rank: 4,
      previousRank: 4,
      rankTrend: 'same',
      siegeWins: 0,
      lastAction: 'train_level',
    },
    guild_guardian: {
      id: 'guild_guardian',
      personality: 'defensive',
      element: 'hoa',
      level: 3,
      xp: 40,
      members: 30,
      maxMembers: 45,
      spiritStones: 95,
      controlledSpots: ['spot_east'],
      powerScore: 0,
      rank: 1,
      previousRank: 1,
      rankTrend: 'same',
      siegeWins: 1,
      lastAction: 'defend_castle',
    },
  };

  const world: GuildWorldState = {
    clockHours: 8, // Tuần 1, Ngày 1, 08:00
    lastSiegeWeek: 0,
    castleOwnerId: 'guild_guardian',
    playerGuildId: null,
    guilds,
    spots,
    relations: createInitialRelations(),
    newsSeq: 0,
    newsLog: [],
    siegeHistory: [],
  };

  recalculateRankings(world, false);
  return world;
}

export function cloneGuildWorld(world: GuildWorldState): GuildWorldState {
  const guilds = {} as Record<GuildId, GuildState>;
  for (const gid of ALL_GUILD_IDS) {
    const g = world.guilds[gid];
    guilds[gid] = { ...g, controlledSpots: [...g.controlledSpots] };
  }
  const spots = {} as Record<HuntingSpotId, HuntingSpotState>;
  for (const sid of ALL_SPOT_IDS) {
    spots[sid] = { ...world.spots[sid] };
  }
  const relations = {} as Record<GuildId, Record<GuildId, number>>;
  for (const a of ALL_GUILD_IDS) {
    relations[a] = { ...world.relations[a] };
  }
  return {
    clockHours: world.clockHours,
    lastSiegeWeek: world.lastSiegeWeek,
    castleOwnerId: world.castleOwnerId,
    playerGuildId: world.playerGuildId,
    guilds,
    spots,
    relations,
    newsSeq: world.newsSeq,
    newsLog: world.newsLog.map((n) => ({ ...n })),
    siegeHistory: world.siegeHistory.map((s) => ({
      ...s,
      participants: s.participants.map((p) => ({ ...p })),
    })),
  };
}

function pushNews(
  world: GuildWorldState,
  kind: GuildNewsKind,
  actorGuildId: GuildId,
  extra?: { targetGuildId?: GuildId | null; spotId?: HuntingSpotId; value?: number },
): void {
  const clock = decomposeWorldClock(world.clockHours);
  world.newsSeq += 1;
  world.newsLog.push({
    id: world.newsSeq,
    week: clock.week,
    dayOfWeek: clock.dayOfWeek,
    hourOfDay: clock.hourOfDay,
    kind,
    actorGuildId,
    targetGuildId: extra?.targetGuildId,
    spotId: extra?.spotId,
    value: extra?.value,
  });
  if (world.newsLog.length > MAX_NEWS_LOG) {
    world.newsLog.splice(0, world.newsLog.length - MAX_NEWS_LOG);
  }
}

function adjustRelation(world: GuildWorldState, a: GuildId, b: GuildId, delta: number): void {
  if (a === b) return;
  const cur = world.relations[a][b] ?? 0;
  const next = Math.max(-100, Math.min(100, cur + delta));
  world.relations[a][b] = next;
  world.relations[b][a] = next;
}

export function recalculateRankings(world: GuildWorldState, recordPrevious: boolean): void {
  for (const gid of ALL_GUILD_IDS) {
    const g = world.guilds[gid];
    g.controlledSpots = ALL_SPOT_IDS.filter((sid) => world.spots[sid].ownerGuildId === gid);
    g.powerScore = computeGuildPowerScore(g, world.castleOwnerId === gid);
  }

  const ordered = [...ALL_GUILD_IDS].sort((a, b) => {
    const diff = world.guilds[b].powerScore - world.guilds[a].powerScore;
    if (diff !== 0) return diff;
    return world.guilds[b].spiritStones - world.guilds[a].spiritStones;
  });

  ordered.forEach((gid, idx) => {
    const g = world.guilds[gid];
    const newRank = idx + 1;
    if (recordPrevious) {
      g.previousRank = g.rank;
    } else {
      g.previousRank = newRank;
    }
    g.rank = newRank;
    g.rankTrend = newRank < g.previousRank ? 'up' : newRank > g.previousRank ? 'down' : 'same';
  });
}

function pickBestSpotToContest(
  guild: GuildState,
  world: GuildWorldState,
): { spotId: HuntingSpotId; score: number; reason: string } | null {
  let best: { spotId: HuntingSpotId; score: number; reason: string } | null = null;
  const selfPower = computeGuildPowerScore(guild, world.castleOwnerId === guild.id);

  for (const sid of ALL_SPOT_IDS) {
    const spot = world.spots[sid];
    if (spot.ownerGuildId === guild.id) continue;

    let score = spot.stonesPerTick * 2.4 + spot.xpPerTick * 0.35;
    let reason = 'contest_rich_spot';

    if (spot.ownerGuildId === null) {
      // Bãi vô chủ rất hấp dẫn, đặc biệt với bang mưu lược/thời cơ
      score += guild.personality === 'opportunist' ? 42 : 24;
      reason = 'claim_free_spot';
    } else {
      const owner = world.guilds[spot.ownerGuildId];
      const ownerPower = computeGuildPowerScore(owner, world.castleOwnerId === owner.id);
      const elemMult = getElementMultiplier(guild.element, owner.element);
      const rel = getGuildRelationScore(world, guild.id, owner.id);
      const powerRatio = selfPower / Math.max(1, ownerPower);

      score += (elemMult - 1) * 50;
      score += (powerRatio - 1) * 65;
      if (rel <= -20) score += 16;
      if (rel >= 30) score -= 35;

      if (guild.personality === 'opportunist') {
        if (owner.members < owner.maxMembers * 0.55 || powerRatio > 1.08) {
          score += 28;
          reason = 'opportunist_strike_weak_rival';
        } else {
          score -= 22;
        }
      } else if (guild.personality === 'aggressive') {
        score += 26;
        reason = 'aggressive_raid_spot';
      } else if (guild.personality === 'hoarder') {
        // Bang tích trữ chỉ đánh chiếm khi vượt trội rõ rệt
        score += powerRatio >= 1.2 ? 10 : -34;
        reason = 'hoarder_safe_expansion';
      } else {
        // Bang phòng thủ ngại gây chiến nếu đã có bãi
        score -= guild.controlledSpots.length > 0 ? 28 : 4;
        reason = 'defensive_secure_spot';
      }
    }

    if (!best || score > best.score) {
      best = { spotId: sid, score: Math.round(score), reason };
    }
  }

  return best;
}

/**
 * Cây quyết định + chấm điểm cho từng Bang Hội AI (không dùng mô hình ngôn ngữ).
 * Mỗi bang đánh giá đầy đủ trạng thái quân số, kho linh thạch, bãi chiếm, đồng hồ công thành
 * và trọng số tính cách riêng để chọn hành động tối ưu nhất.
 */
export function evaluateGuildDecision(
  guild: GuildState,
  world: GuildWorldState,
): GuildDecision {
  const clock = decomposeWorldClock(world.clockHours);
  const memberRatio = guild.members / Math.max(1, guild.maxMembers);
  const isOwner = world.castleOwnerId === guild.id;
  const nearSiege = clock.isSiegeWindow || (clock.dayOfWeek === SIEGE_DAY_OF_WEEK && clock.hourOfDay >= 12);

  const scores: Partial<Record<GuildActionType, number>> = {};

  // 1. Công thành / Thủ thành vào ngày Công Thành (Ngày 7)
  if (nearSiege) {
    if (isOwner) {
      let defScore = 118;
      if (guild.personality === 'defensive') defScore += 28;
      if (memberRatio >= 0.5) defScore += 12;
      scores.defend_castle = Math.round(defScore);
    } else {
      const owner = world.guilds[world.castleOwnerId];
      const selfPower = computeGuildPowerScore(guild, false);
      const ownerPower = computeGuildPowerScore(owner, true);
      let siegeScore = 92 + (selfPower - ownerPower) * 0.35;
      if (guild.personality === 'aggressive') siegeScore += 34;
      if (guild.personality === 'opportunist') {
        siegeScore += owner.members < 24 || selfPower >= ownerPower * 0.9 ? 32 : 8;
      }
      if (guild.personality === 'hoarder') {
        siegeScore += guild.spiritStones >= 130 && memberRatio >= 0.7 ? 28 : -18;
      }
      if (guild.personality === 'defensive') siegeScore += 10;
      if (memberRatio < 0.35) siegeScore -= 30;
      scores.join_siege = Math.round(siegeScore);
    }
  }

  // 2. Chiêu mộ quân số khi hao tổn và có đủ linh thạch
  let recruitScore = 30;
  if (memberRatio < 0.55) recruitScore += 48;
  else if (memberRatio < 0.75) recruitScore += 24;
  else recruitScore -= 25;
  if (guild.spiritStones < 35) recruitScore -= 60;
  if (guild.personality === 'defensive' && memberRatio < 0.85) recruitScore += 16;
  if (guild.personality === 'hoarder' && guild.spiritStones >= 100 && memberRatio < 0.85) recruitScore += 14;
  scores.recruit_members = Math.round(recruitScore);

  // 3. Tích trữ linh thạch
  let gatherScore = 44 + (guild.spiritStones < 70 ? 24 : 0);
  if (guild.personality === 'hoarder') gatherScore += 32;
  if (guild.controlledSpots.length > 0) gatherScore += 12;
  if (guild.personality === 'aggressive') gatherScore -= 14;
  scores.gather_stones = Math.round(gatherScore);

  // 4. Luyện cấp bang hội
  const xpNeed = xpRequiredForGuildLevel(guild.level);
  const closeToLevelUp = guild.xp >= xpNeed * 0.65;
  let trainScore = 48 + (closeToLevelUp ? 22 : 0) + (guild.level < 4 ? 10 : 0);
  if (guild.personality === 'hoarder') trainScore += 18;
  if (guild.personality === 'opportunist') trainScore += 12;
  if (guild.personality === 'aggressive') trainScore -= 6;
  scores.train_level = Math.round(trainScore);

  // 5. Phòng thủ bãi đang chiếm
  if (guild.controlledSpots.length > 0) {
    let holdScore = 38 + guild.controlledSpots.length * 10;
    if (guild.personality === 'defensive') holdScore += 34;
    if (guild.personality === 'hoarder') holdScore += 10;
    scores.defend_spot = Math.round(holdScore);
  }

  // 6. Tranh bãi quái
  const bestSpot = pickBestSpotToContest(guild, world);
  if (bestSpot) {
    let contestScore = bestSpot.score;
    if (memberRatio < 0.4) contestScore -= 35;
    if (guild.controlledSpots.length === 0) contestScore += 16;
    if (nearSiege) contestScore -= 28;
    scores.contest_spot = Math.round(contestScore);
  }

  // Chọn nhánh có điểm cao nhất
  let chosen: GuildActionType = 'train_level';
  let bestScore = -Infinity;
  const actionPriority: GuildActionType[] = [
    'defend_castle',
    'join_siege',
    'contest_spot',
    'defend_spot',
    'recruit_members',
    'gather_stones',
    'train_level',
  ];
  for (const act of actionPriority) {
    const s = scores[act];
    if (s !== undefined && s > bestScore) {
      bestScore = s;
      chosen = act;
    }
  }

  const reasonMap: Record<GuildActionType, string> = {
    defend_castle: 'castle_owner_siege_defense',
    join_siege: 'weekly_siege_assault',
    contest_spot: bestSpot?.reason ?? 'contest_hunting_spot',
    defend_spot: 'fortify_owned_spots',
    recruit_members: 'replenish_guild_members',
    gather_stones: 'stockpile_spirit_stones',
    train_level: closeToLevelUp ? 'push_guild_level_up' : 'steady_guild_training',
  };

  return {
    guildId: guild.id,
    action: chosen,
    targetSpotId: chosen === 'contest_spot' ? bestSpot?.spotId : undefined,
    score: bestScore,
    scoresByAction: scores,
    reason: reasonMap[chosen],
  };
}

function applyGuildXp(world: GuildWorldState, guild: GuildState, gainedXp: number): void {
  guild.xp += Math.max(0, Math.round(gainedXp));
  while (guild.level < 15 && guild.xp >= xpRequiredForGuildLevel(guild.level)) {
    guild.xp -= xpRequiredForGuildLevel(guild.level);
    guild.level += 1;
    guild.maxMembers = 40 + guild.level * 5;
    guild.members = Math.min(guild.maxMembers, guild.members + 3);
    pushNews(world, 'guild_leveled_up', guild.id, { value: guild.level });
  }
}

function executeGuildTick(world: GuildWorldState, tickSeed: number): void {
  const rng = createSeededRng(tickSeed);

  // Thu nhập thụ động từ bãi quái đang chiếm & thuế thành
  for (const sid of ALL_SPOT_IDS) {
    const spot = world.spots[sid];
    if (spot.ownerGuildId) {
      const owner = world.guilds[spot.ownerGuildId];
      owner.spiritStones += spot.stonesPerTick;
      applyGuildXp(world, owner, spot.xpPerTick);
    }
  }
  const castleOwner = world.guilds[world.castleOwnerId];
  castleOwner.spiritStones += 12;
  applyGuildXp(world, castleOwner, 25);

  // Từng bang ra quyết định theo thứ tự xoay vòng ổn định theo seed
  const order = [...ALL_GUILD_IDS].sort(() => rng() - 0.5);
  for (const gid of order) {
    const guild = world.guilds[gid];
    const decision = evaluateGuildDecision(guild, world);
    guild.lastAction = decision.action;
    guild.lastActionTarget = decision.targetSpotId;

    if (decision.action === 'train_level') {
      const xpGain = 36 + guild.level * 8 + Math.floor(rng() * 14);
      applyGuildXp(world, guild, xpGain);
      guild.spiritStones += 4;
    } else if (decision.action === 'gather_stones') {
      const gain = 14 + guild.controlledSpots.length * 6 + Math.floor(rng() * 8);
      guild.spiritStones += gain;
      applyGuildXp(world, guild, 14);
    } else if (decision.action === 'recruit_members') {
      if (guild.spiritStones >= 30 && guild.members < guild.maxMembers) {
        const recruits = Math.min(guild.maxMembers - guild.members, 4 + Math.floor(rng() * 3));
        guild.spiritStones -= 28;
        guild.members += recruits;
      }
    } else if (decision.action === 'defend_spot' || decision.action === 'defend_castle') {
      guild.spiritStones += 6;
      applyGuildXp(world, guild, 22);
      if (guild.members < guild.maxMembers) {
        guild.members += 1;
      }
    } else if (decision.action === 'join_siege') {
      // Tập hợp lực lượng chuẩn bị công thành
      applyGuildXp(world, guild, 24);
      if (guild.spiritStones >= 20 && guild.members < guild.maxMembers) {
        guild.spiritStones -= 15;
        guild.members = Math.min(guild.maxMembers, guild.members + 2);
      }
    } else if (decision.action === 'contest_spot' && decision.targetSpotId) {
      const spot = world.spots[decision.targetSpotId];
      if (spot.ownerGuildId === null) {
        spot.ownerGuildId = guild.id;
        guild.spiritStones += Math.round(spot.stonesPerTick * 0.6);
        applyGuildXp(world, guild, spot.xpPerTick);
        pushNews(world, 'spot_captured', guild.id, { targetGuildId: null, spotId: spot.id });
      } else if (spot.ownerGuildId !== guild.id) {
        const defender = world.guilds[spot.ownerGuildId];
        const atkElemMult = getElementMultiplier(guild.element, defender.element);
        const defBonus = defender.lastAction === 'defend_spot' ? 1.15 : 1.0;
        const atkPower =
          computeGuildPowerScore(guild, world.castleOwnerId === guild.id) *
          atkElemMult *
          (0.88 + rng() * 0.24);
        const defPower =
          computeGuildPowerScore(defender, world.castleOwnerId === defender.id) *
          defBonus *
          (0.9 + rng() * 0.22);

        // Giao tranh làm giảm quan hệ và tổn thất nhẹ hai bên
        adjustRelation(world, guild.id, defender.id, -18);
        guild.members = Math.max(10, guild.members - (2 + Math.floor(rng() * 3)));
        defender.members = Math.max(10, defender.members - (2 + Math.floor(rng() * 3)));

        if (atkPower > defPower) {
          spot.ownerGuildId = guild.id;
          const lootedStones = Math.min(defender.spiritStones, 12);
          defender.spiritStones -= lootedStones;
          guild.spiritStones += lootedStones + 8;
          applyGuildXp(world, guild, 45);
          pushNews(world, 'spot_captured', guild.id, {
            targetGuildId: defender.id,
            spotId: spot.id,
          });
        } else {
          applyGuildXp(world, defender, 35);
          pushNews(world, 'spot_defended', defender.id, {
            targetGuildId: guild.id,
            spotId: spot.id,
          });
        }
      }
    }
  }

  // Quan hệ trung lập tự dịu nhẹ theo thời gian
  for (let i = 0; i < ALL_GUILD_IDS.length; i++) {
    for (let j = i + 1; j < ALL_GUILD_IDS.length; j++) {
      const a = ALL_GUILD_IDS[i];
      const b = ALL_GUILD_IDS[j];
      const cur = world.relations[a][b];
      if (cur < -5) adjustRelation(world, a, b, 1);
      else if (cur > 15) adjustRelation(world, a, b, -1);
    }
  }

  recalculateRankings(world, true);
}

/**
 * Xử lý trận Công Thành hằng tuần (Ngày 7, 20:00 giờ trong game).
 * Nếu người chơi đã gia nhập bang và tham chiến, `playerSupport` cộng điểm chiến công trực tiếp cho bang đó.
 */
export function resolveWeeklySiege(
  world: GuildWorldState,
  weekNumber: number,
  seed: number,
  playerSupport?: PlayerSiegeSupport | null,
): { world: GuildWorldState; result: SiegeResult } {
  const next = cloneGuildWorld(world);
  const rng = createSeededRng((seed ^ (weekNumber * 2654435761)) >>> 0);
  const prevOwnerId = next.castleOwnerId;
  const defender = next.guilds[prevOwnerId];

  const participants: Array<{ guildId: GuildId; siegeScore: number }> = [];

  for (const gid of ALL_GUILD_IDS) {
    const g = next.guilds[gid];
    const isDef = gid === prevOwnerId;
    const basePower = computeGuildPowerScore(g, isDef);
    const elemMult = isDef ? 1.0 : getElementMultiplier(g.element, defender.element);
    const personalityMod =
      isDef && g.personality === 'defensive'
        ? 1.16
        : !isDef && g.personality === 'aggressive'
          ? 1.12
          : !isDef && g.personality === 'opportunist'
            ? 1.07
            : 1.0;
    const defenderWallBonus = isDef ? 22 : 0;
    const supportBonus =
      playerSupport && playerSupport.guildId === gid
        ? Math.max(0, Math.min(240, playerSupport.contribution))
        : 0;
    const variance = 0.9 + rng() * 0.2;

    const siegeScore = Math.round(
      (basePower * elemMult * personalityMod + defenderWallBonus + supportBonus) * variance,
    );
    participants.push({ guildId: gid, siegeScore });

    // Tiêu hao nhẹ sau trận công thành
    g.members = Math.max(12, g.members - (3 + Math.floor(rng() * 4)));
    g.spiritStones = Math.max(0, g.spiritStones - 12);
    applyGuildXp(next, g, 40);
  }

  participants.sort((a, b) => b.siegeScore - a.siegeScore);
  const winnerId = participants[0].guildId;
  const defenderHeld = winnerId === prevOwnerId;

  next.castleOwnerId = winnerId;
  next.lastSiegeWeek = weekNumber;
  const winner = next.guilds[winnerId];
  winner.siegeWins += 1;
  winner.spiritStones += 45;
  applyGuildXp(next, winner, 90);

  if (!defenderHeld) {
    adjustRelation(next, winnerId, prevOwnerId, -22);
    pushNews(next, 'siege_won', winnerId, { targetGuildId: prevOwnerId, value: weekNumber });
  } else {
    const topChallenger = participants.find((p) => p.guildId !== prevOwnerId)?.guildId ?? null;
    pushNews(next, 'siege_defended', winnerId, { targetGuildId: topChallenger, value: weekNumber });
  }

  recalculateRankings(next, true);

  const result: SiegeResult = {
    week: weekNumber,
    winnerGuildId: winnerId,
    previousOwnerId: prevOwnerId,
    defenderHeld,
    participants,
    playerHelpedGuildId: playerSupport?.guildId ?? null,
  };
  next.siegeHistory.push(result);
  if (next.siegeHistory.length > 10) {
    next.siegeHistory.splice(0, next.siegeHistory.length - 10);
  }

  return { world: next, result };
}

/**
 * Mô phỏng thế giới sống trôi theo `deltaHours` giờ trong game (chạy gọn kể cả khi người chơi ở bản đồ khác).
 * Tự động chạy các nhịp quyết định 6 giờ của bang hội AI và tự tổ chức Công Thành khi bước qua Ngày 7, 20:00.
 */
export function simulateGuildWorldHours(
  world: GuildWorldState,
  deltaHours: number,
  seed: number,
  playerSupport?: PlayerSiegeSupport | null,
): { world: GuildWorldState; siegeResults: SiegeResult[] } {
  let current = cloneGuildWorld(world);
  const adv = advanceWorldClock(current.clockHours, deltaHours);
  const siegeResults: SiegeResult[] = [];
  const pendingSieges = new Set(adv.siegeWeeksTriggered);

  for (const tickHour of adv.tickHoursReached) {
    current.clockHours = tickHour;
    executeGuildTick(current, (seed ^ (tickHour * 7919)) >>> 0);

    const view = decomposeWorldClock(tickHour);
    const siegeOffsetHour = (SIEGE_DAY_OF_WEEK - 1) * HOURS_PER_DAY + 20;
    const hourInWeek = tickHour % (DAYS_PER_WEEK * HOURS_PER_DAY);
    if (pendingSieges.has(view.week) && hourInWeek >= siegeOffsetHour && current.lastSiegeWeek < view.week) {
      pendingSieges.delete(view.week);
      const res = resolveWeeklySiege(current, view.week, seed, playerSupport);
      current = res.world;
      siegeResults.push(res.result);
    }
  }

  current.clockHours = adv.nextHours;
  // Phòng trường hợp bước nhảy kết thúc đúng giờ 20:00 (không trùng bội số 6 giờ)
  for (const w of Array.from(pendingSieges)) {
    if (current.lastSiegeWeek < w) {
      const res = resolveWeeklySiege(current, w, seed, playerSupport);
      current = res.world;
      siegeResults.push(res.result);
    }
  }

  return { world: current, siegeResults };
}

export function joinPlayerGuild(world: GuildWorldState, guildId: GuildId): GuildWorldState {
  const next = cloneGuildWorld(world);
  if (next.playerGuildId === guildId) return next;
  next.playerGuildId = guildId;
  next.guilds[guildId].members = Math.min(
    next.guilds[guildId].maxMembers,
    next.guilds[guildId].members + 1,
  );
  pushNews(next, 'player_joined', guildId);
  recalculateRankings(next, false);
  return next;
}

export function leavePlayerGuild(world: GuildWorldState): GuildWorldState {
  const next = cloneGuildWorld(world);
  if (!next.playerGuildId) return next;
  const old = next.playerGuildId;
  next.playerGuildId = null;
  next.guilds[old].members = Math.max(10, next.guilds[old].members - 1);
  pushNews(next, 'player_left', old);
  recalculateRankings(next, false);
  return next;
}
