import { describe, expect, it } from 'vitest';
import {
  ALL_GUILD_IDS,
  createInitialGuildWorld,
  evaluateGuildDecision,
  getEncounterBehavior,
  getGuildRelationTier,
  joinPlayerGuild,
  leavePlayerGuild,
  resolveWeeklySiege,
  simulateGuildWorldHours,
} from '../src/core/guildSystem';
import {
  HOURS_PER_WEEK,
  MAX_OFFLINE_CATCHUP_HOURS,
  advanceWorldClock,
  computeOfflineCatchupHours,
  decomposeWorldClock,
} from '../src/core/worldClock';

describe('Bang hội AI (cây quyết định, tranh bãi quái & công thành theo giờ trong game)', () => {
  it('đồng hồ thế giới tính đúng tuần, ngày, giờ công thành và phát hiện các mốc 6 giờ / tuần', () => {
    const start = decomposeWorldClock(8);
    expect(start.week).toBe(1);
    expect(start.dayOfWeek).toBe(1);
    expect(start.hourOfDay).toBe(8);
    expect(start.isSiegeWindow).toBe(false);

    // Ngày 7, 19:00 nằm trong khung giờ công thành (18:00..22:00)
    const siegeTime = decomposeWorldClock(6 * 24 + 19);
    expect(siegeTime.dayOfWeek).toBe(7);
    expect(siegeTime.isSiegeWindow).toBe(true);
    expect(siegeTime.hoursUntilNextSiege).toBe(0);

    // Tiến 1 tuần đầy đủ (168 giờ) phải kích hoạt đúng 1 kỳ Công Thành Tuần 1
    const adv = advanceWorldClock(8, HOURS_PER_WEEK);
    expect(adv.tickHoursReached.length).toBe(28);
    expect(adv.siegeWeeksTriggered).toEqual([1]);

    // Ghi chú REVIEW_LOG #1: đóng game mở lại chỉ bù tối đa 1 tuần trong game (168 giờ)
    const t0 = 1_700_000_000_000;
    expect(computeOfflineCatchupHours(t0, t0 - 5000)).toBe(0);
    expect(computeOfflineCatchupHours(t0, t0 + 60 * 1000)).toBe(10); // 60s = 10 giờ game
    expect(computeOfflineCatchupHours(t0, t0 + 30 * 24 * 3600 * 1000)).toBe(MAX_OFFLINE_CATCHUP_HOURS);
    expect(MAX_OFFLINE_CATCHUP_HOURS).toBe(168);
  });

  it('mỗi tính cách bang hội AI ra quyết định khác nhau rõ rệt bằng chấm điểm / cây quyết định', () => {
    const world = createInitialGuildWorld();

    // Bang hiếu chiến (aggressive) khi chưa có bãi & quân đầy sẽ ưu tiên tranh bãi quái
    const aggressiveDecision = evaluateGuildDecision(world.guilds.guild_aggressive, world);
    expect(aggressiveDecision.action).toBe('contest_spot');
    expect(aggressiveDecision.targetSpotId).toBeDefined();

    // Bang tích trữ (hoarder) ưu tiên gom linh thạch / luyện cấp an toàn hơn là đánh chiếm sớm
    const hoarderDecision = evaluateGuildDecision(world.guilds.guild_merchant, world);
    expect(['gather_stones', 'train_level']).toContain(hoarderDecision.action);

    // Bang phòng thủ (defensive) đang giữ thành khi bước vào ngày Công Thành phải ưu tiên thủ thành
    const siegeDayWorld = { ...world, clockHours: 6 * 24 + 16 }; // Ngày 7, 16:00
    const guardianDecision = evaluateGuildDecision(siegeDayWorld.guilds.guild_guardian, siegeDayWorld);
    expect(guardianDecision.action).toBe('defend_castle');

    // Bang hiếu chiến khi bước vào ngày Công Thành sẽ quyết định tham chiến công thành
    const aggSiegeDecision = evaluateGuildDecision(siegeDayWorld.guilds.guild_aggressive, siegeDayWorld);
    expect(aggSiegeDecision.action).toBe('join_siege');

    // Khi quân số tụt thấp (< 50%) và còn linh thạch, bang sẽ ưu tiên chiêu mộ quân
    const lowArmyWorld = createInitialGuildWorld();
    lowArmyWorld.guilds.guild_opportunist.members = 12;
    lowArmyWorld.guilds.guild_opportunist.spiritStones = 100;
    const recruitDecision = evaluateGuildDecision(lowArmyWorld.guilds.guild_opportunist, lowArmyWorld);
    expect(recruitDecision.action).toBe('recruit_members');
  });

  it('mô phỏng tranh bãi quái, tự luyện cấp và đổi hạng bang theo giờ trong game (ổn định theo seed)', () => {
    const initial = createInitialGuildWorld();
    const sim1 = simulateGuildWorldHours(initial, 72, 202601); // 3 ngày trong game (12 tick)
    const sim2 = simulateGuildWorldHours(initial, 72, 202601);

    // Cùng seed ra kết quả hoàn toàn giống nhau
    expect(sim1.world).toEqual(sim2.world);

    // Các bang đã tự tăng cấp / tích lũy linh thạch và phát sinh tin tức tranh bãi trên bảng tin
    const totalLevelsBefore = ALL_GUILD_IDS.reduce((s, id) => s + initial.guilds[id].level, 0);
    const totalLevelsAfter = ALL_GUILD_IDS.reduce((s, id) => s + sim1.world.guilds[id].level, 0);
    expect(totalLevelsAfter).toBeGreaterThan(totalLevelsBefore);
    expect(sim1.world.newsLog.length).toBeGreaterThan(0);

    // Bãi trống phía bắc (spot_north) được bang hội AI tự kéo quân chiếm giữ
    expect(sim1.world.spots.spot_north.ownerGuildId).not.toBeNull();

    // Thứ hạng 1..4 luôn duy nhất và đầy đủ
    const ranks = ALL_GUILD_IDS.map((id) => sim1.world.guilds[id].rank).sort((a, b) => a - b);
    expect(ranks).toEqual([1, 2, 3, 4]);
  });

  it('tự động tổ chức Công Thành mỗi tuần và ghi nhận đóng góp của người chơi cùng bang mình', () => {
    let world = createInitialGuildWorld();
    world = joinPlayerGuild(world, 'guild_opportunist');
    expect(world.playerGuildId).toBe('guild_opportunist');

    // Mô phỏng xuyên qua 1 tuần đầy đủ (168 giờ) có người chơi hỗ trợ mạnh trong trận Công Thành
    const sim = simulateGuildWorldHours(world, HOURS_PER_WEEK, 8888, {
      guildId: 'guild_opportunist',
      contribution: 200,
    });

    expect(sim.siegeResults.length).toBe(1);
    expect(sim.siegeResults[0].week).toBe(1);
    expect(sim.siegeResults[0].winnerGuildId).toBe('guild_opportunist');
    expect(sim.world.castleOwnerId).toBe('guild_opportunist');
    expect(sim.world.lastSiegeWeek).toBe(1);
    expect(sim.world.siegeHistory.length).toBe(1);

    // Có tin tức công thành trong bảng tin thành
    const siegeNews = sim.world.newsLog.find(
      (n) => n.kind === 'siege_won' || n.kind === 'siege_defended',
    );
    expect(siegeNews).toBeDefined();

    // Kiểm tra resolveWeeklySiege trực tiếp cho tuần 2 khi không có người chơi hỗ trợ
    const week2 = resolveWeeklySiege(sim.world, 2, 9999, null);
    expect(week2.result.week).toBe(2);
    expect(week2.world.siegeHistory.length).toBe(2);
  });

  it('người chơi có thể gia nhập / rời bang và hành vi gặp bang ngoài bản đồ tuân theo quan hệ', () => {
    let world = createInitialGuildWorld();

    // Khi đứng ngoài (chưa vào bang): bang trung lập tránh nhau, bang hiếu chiến đánh nếu xâm phạm bãi của họ
    expect(getEncounterBehavior(null, 'guild_merchant', world, false)).toBe('avoid');
    expect(getEncounterBehavior(null, 'guild_aggressive', world, true)).toBe('attack');

    // Khi gia nhập guild_aggressive: cùng bang là friendly, thù địch (guild_guardian, guild_merchant) là attack, trung lập (guild_opportunist) là avoid
    world = joinPlayerGuild(world, 'guild_aggressive');
    expect(getGuildRelationTier(world, 'guild_aggressive', 'guild_guardian')).toBe('hostile');
    expect(getEncounterBehavior(world.playerGuildId, 'guild_aggressive', world)).toBe('friendly');
    expect(getEncounterBehavior(world.playerGuildId, 'guild_guardian', world)).toBe('attack');
    expect(getEncounterBehavior(world.playerGuildId, 'guild_opportunist', world)).toBe('avoid');

    // Rời bang trả về trạng thái đứng ngoài
    world = leavePlayerGuild(world);
    expect(world.playerGuildId).toBeNull();
  });
});
