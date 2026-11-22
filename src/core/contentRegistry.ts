import type { GuildActionType, GuildId, HuntingSpotId } from './guildSystem';
import type { MainStoryChoiceId, SectAttitudeTier } from './reputation';
import type {
  AffixType,
  AllyId,
  EquipmentRarity,
  MapId,
  QuestId,
  SectId,
} from './types';

/**
 * Đã được Claude duyệt trong docs/REVIEW_LOG.md:
 * - Giai đoạn 1: "NAMES: ĐỒNG Ý" (commit 932c401)
 * - Giai đoạn 2: "NAMES GĐ2: ĐỒNG Ý" (commit b3d1768)
 * Toàn bộ tên khớp chính xác với docs/NAMES.md.
 */
export const NAMES_APPROVED = true;
export const NAMES_GD2_APPROVED = true;

export interface ContentBundle {
  gameTitle: string;
  gameSubtitle: string;
  sects: Record<SectId, { name: string; stance: string; weaponDesc: string; bonusDesc: string }>;
  maps: Record<MapId, { name: string; subtitle: string }>;
  landmarks: Record<string, string>;
  allies: Record<AllyId, { name: string; personalityLabel: string; barks: Record<string, string> }>;
  skills: Record<string, { name: string; desc: string }>;
  bossSkills: {
    fanWave: string;
    sealBreak: string;
    fallingStones: string;
    copyBarrage: string;
    overloadUnlock: string;
    fusedSiphon: string;
  };
  enemies: Record<string, string>;
  items: Record<string, { name: string; desc: string }>;
  rarities: Record<EquipmentRarity, { name: string; colorHex: string }>;
  affixes: Record<AffixType, { name: string; unit: '%' | '' }>;
  guilds: Record<
    GuildId,
    {
      name: string;
      styleLabel: string;
      desc: string;
      bannerColor: string;
    }
  >;
  guildActions: Record<GuildActionType, string>;
  huntingSpots: Record<HuntingSpotId, { name: string; mapName: string }>;
  attitudeLabels: Record<SectAttitudeTier, { label: string; colorHex: string }>;
  npcs: Record<string, { name: string; title: string }>;
  quests: Record<QuestId, { title: string; summary: string }>;
  mainQuestGd2: {
    title: string;
    lockedHint: string;
    steps: Record<
      number,
      {
        title: string;
        summary: string;
      }
    >;
    choices: Record<MainStoryChoiceId, { label: string; effectDesc: string }>;
  };
  bossDialog: {
    intro: string;
    phaseTwo: string;
    defeated: string;
  };
  bossVanChepDialog: {
    intro: string;
    phaseTwo: string;
    defeated: string;
  };
  npcDialog: {
    foundry: string[];
    guard: string[];
    merchantGreeting: string;
    blacksmithStart: string[];
    blacksmithActive: string;
    blacksmithReady: string[];
    blacksmithDone: string;
    guideStart: string[];
    guideActive: string;
    guideReady: string[];
    guideDone: string;
    teahouseStart: string[];
    teahouseActive: string;
    teahouseReady: string[];
    teahouseDone: string;
    masterStart: string[];
    masterActive: string;
    masterReady: string[];
    masterDone: string;
    taoistStart: string[];
    taoistActive: string;
    taoistReady: string[];
    taoistDone: string;
    sealBreakerEncounter: string[];
    apprenticeSmithGreeting: string;
    guildMasterGreeting: string;
  };
}

export const CONTENT: ContentBundle = {
  gameTitle: 'Giang Hồ AI',
  gameSubtitle: 'Mộc Cơ Giang Hồ — Thời Đại Khôi Lỗi Biết Nghĩ',
  sects: {
    sect_open: {
      name: 'Phổ Mộc Đường',
      stance: 'Phe Mở • Công khai bản vẽ chốt gỗ, dạy dân tự đúc khôi lỗi',
      weaponDesc: 'Trường côn gỗ khảm đồng • Hồi máu đội & khống chế',
      bonusDesc: 'Nội tại: +12% công cho 3 khôi lỗi; hồi máu mạnh kèm tăng công đội',
    },
    sect_closed: {
      name: 'Tỏa Kim Các',
      stance: 'Phe Đóng • Giữ kín bí kíp, chỉ bán khôi lỗi đóng niêm phong',
      weaponDesc: 'Kiếm hợp kim đồng • Xuyên giáp & dựng thuẫn phản đòn',
      bonusDesc: 'Ưu thế: Sát thương đơn cao, xuyên 60% giáp, thuẫn giảm 45% sát thương',
    },
    sect_ban: {
      name: 'Hỏa Ấn Môn',
      stance: 'Phe Cấm • Dán bùa phong ấn, muốn cấm đúc khôi lỗi',
      weaponDesc: 'Bùa lửa & đoản trượng • Đánh xa, thiêu đốt & đẩy lùi',
      bonusDesc: 'Mẹo: Khắc chế Trùm Vạn Chép (Kim); đeo Ngọc Thổ Thạch khi đánh Sơ Giác (Thủy)',
    },
  },
  maps: {
    map_town: {
      name: 'Thành Lam Lư',
      subtitle: 'Khu an toàn • Lò Đúc Chấn Cơ • Chợ Bến Đá • Xưởng Rèn Tắt Lửa',
    },
    map_forest: {
      name: 'Rừng Thạch Mạch',
      subtitle: 'Mỏ linh thạch • Ngã Ba Sương Độc • Cổng Bắc lên Thành Bế Các',
    },
    map_cave: {
      name: 'Động Tàn Cơ',
      subtitle: 'Nghĩa địa khôi lỗi đời cũ • Trùm Sơ Giác (Thủy)',
    },
    map_inner_city: {
      name: 'Thành Bế Các',
      subtitle: 'Đại bản doanh giữ kín bí kíp • Đài Bảng Tin • Lò Luyện Hợp Kim • Sân Công Thành',
    },
    map_valley: {
      name: 'Lũng Đại Mạch',
      subtitle: '3 bãi mỏ linh thạch tranh chấp • Hẻm Đứt Bùa • Trùm Vạn Chép (Kim)',
    },
  },
  landmarks: {
    lm_foundry: 'Lò Đúc Chấn Cơ',
    lm_market: 'Chợ Khôi Lỗi Bến Đá',
    lm_forge: 'Xưởng Rèn Tắt Lửa',
    lm_plaza: 'Quảng Trường Niêm Yết',
    lm_crossroads: 'Ngã Ba Sương Độc',
    lm_mine: 'Bãi Mỏ Phía Đông',
    lm_fake_landmark: 'Lối Cụt Bắc (Không có Cổ Thụ Chín Gốc!)',
    lm_boss_arena: 'Động Tàn Cơ — Sơ Giác',
    lm_vault: 'Mật Khố Tỏa Chốt',
    lm_board: 'Đài Bảng Tin Giang Hồ',
    lm_alloy_forge: 'Lò Luyện Hợp Kim',
    lm_seal_street: 'Phố Ký Gửi Ấn Tín',
    lm_siege_gate: 'Sân Công Thành Bắc Môn',
    lm_spot_west: 'Bãi Mỏ Tinh Lam',
    lm_spot_north: 'Hẻm Đứt Bùa',
    lm_spot_east: 'Khe Vỡ Khung Đồng',
    lm_altar_boss: 'Tế Đàn Lõi Trầm — Vạn Chép',
  },
  allies: {
    ally_reckless: {
      name: 'Thiết Xung',
      personalityLabel: 'Liều • Hỏa',
      barks: {
        charge_attack: 'Xông thẳng vào!',
        retreat: 'Rạn chốt rồi, lùi chút!',
        pickup_loot: 'Nhặt luôn!',
      },
    },
    ally_cautious: {
      name: 'Mộc Tĩnh',
      personalityLabel: 'Cẩn thận • Thổ',
      barks: {
        heal_ally: 'Giữ đội hình, ta hồi máu!',
        retreat: 'Quá gần, lui giữ tầm!',
        attack: 'Hỗ trợ từ xa!',
      },
    },
    ally_greedy: {
      name: 'Tích Linh',
      personalityLabel: 'Tham đồ • Thủy',
      barks: {
        pickup_loot: 'Linh thạch sáng quá!',
        attack: 'Con này sắp rớt đồ!',
        retreat: 'Gãy bánh răng mất, chạy!',
      },
    },
  },
  skills: {
    skill_open_1: {
      name: 'Thanh Mộc Điểm Chốt',
      desc: 'Quất côn gỗ điểm khớp cơ quan tầm gần (đổi hệ theo Ngọc Ngũ Hành đang đeo).',
    },
    skill_open_2: {
      name: 'Rễ Rừng Quấn Trục',
      desc: 'Tạo luồng mộc khí quanh thân, gây sát thương Mộc và làm chậm địch 3 giây.',
    },
    skill_open_3: {
      name: 'Tán Lục Hồi Sinh',
      desc: 'Hồi máu mạnh cho bản thân + 3 khôi lỗi và tăng +18% công cho khôi lỗi trong 5 giây.',
    },
    skill_open_4: {
      name: 'Bách Mộc Khai Trận',
      desc: 'Tuyệt kỹ xoay côn quét sát thương Mộc diện rộng quanh thân.',
    },

    skill_closed_1: {
      name: 'Khóa Kim Trảm',
      desc: 'Nhát kiếm đồng nhanh sắc bén (đổi hệ theo Ngọc Ngũ Hành đang đeo).',
    },
    skill_closed_2: {
      name: 'Xuyên Khớp Phá Giáp',
      desc: 'Đâm xuyên mục tiêu hệ Kim, bỏ qua 60% phòng thủ.',
    },
    skill_closed_3: {
      name: 'Niêm Phong Đồng Thuẫn',
      desc: 'Dựng khóa đồng giảm 45% sát thương nhận trong 4.5 giây và phản đòn.',
    },
    skill_closed_4: {
      name: 'Cửu Tỏa Đoạt Mệnh',
      desc: 'Tuyệt kỹ chém liên hoàn vòng kim quang xuyên giáp diện rộng.',
    },

    skill_ban_1: {
      name: 'Xích Ấn Phất',
      desc: 'Phóng tia bùa lửa tầm xa (đổi hệ theo Ngọc Ngũ Hành đang đeo).',
    },
    skill_ban_2: {
      name: 'Liệt Hỏa Phong Bùa',
      desc: 'Dán bùa lửa gây sát thương Hỏa và thiêu đốt liên tục 4 giây.',
    },
    skill_ban_3: {
      name: 'Bạo Diệm Đẩy Lùi',
      desc: 'Kích nổ vòng lửa quanh thân, đẩy lùi kẻ địch áp sát.',
    },
    skill_ban_4: {
      name: 'Diệm Ấn Tịnh Cơ',
      desc: 'Tuyệt kỹ giáng đại ấn lửa xuống quanh thân gây sát thương Hỏa cực lớn.',
    },
  },
  bossSkills: {
    fanWave: 'Triều Linh Vỡ Mạch',
    sealBreak: 'Vòng Cấm Tự Giải',
    fallingStones: 'Linh Thạch Quy Tụ',
    copyBarrage: 'Sao Chép Loạn Chiêu',
    overloadUnlock: 'Mở Khóa Quá Tải',
    fusedSiphon: 'Hợp Lõi Cướp Mạch',
  },
  enemies: {
    enemy_mine_guard: 'Khôi Lỗi Canh Mỏ',
    enemy_mine_bandit: 'Sơn Tặc Cướp Mỏ',
    enemy_rogue_logger: 'Khôi Lỗi Đốn Củi Loạn',
    enemy_furnace_golem: 'Khôi Lỗi Lò Hỏng',
    enemy_cave_sentry: 'Thủy Mạch Vệ Cơ',
    boss_awakened: 'Sơ Giác — Khôi Lỗi Số Không',
    enemy_bronze_guard: 'Khôi Lỗi Giáp Đồng',
    enemy_copy_scribe: 'Khôi Lỗi Chép Trộm',
    enemy_unsealed_golem: 'Khôi Lỗi Vỡ Bùa',
    enemy_stone_colossus: 'Thạch Cự Khôi Lỗi',
    enemy_voice_mimic: 'Khôi Lỗi Giả Thanh',
    enemy_siege_defender: 'Hộ Thành Khôi Lỗi',
    boss_van_chep: 'Vạn Chép — Khôi Lỗi Hợp Lõi',
  },
  items: {
    wpn_wood_staff: { name: 'Côn Gỗ Xưởng Cũ', desc: '+5 Công' },
    wpn_bronze_sword: { name: 'Kiếm Đồng Thử Lò', desc: '+6 Công' },
    wpn_ember_rod: { name: 'Bùa Trượng Than Hồng', desc: '+6 Công' },
    wpn_mine_spear: { name: 'Thương Mỏ Linh Thiết', desc: '+13 Công' },
    wpn_blacksmith_blade: { name: 'Đao Rèn Lão Bính', desc: '+18 Công, +15 Máu (Thưởng nhiệm vụ)' },
    wpn_cave_relic: { name: 'Binh Khí Tàn Cơ', desc: '+24 Công, +4 Thủ (Chiến lợi phẩm Sơ Giác)' },
    wpn_valley_staff: { name: 'Côn Trầm Đại Mạch', desc: '+27 Công, +25 Máu' },
    wpn_inner_sword: { name: 'Kiếm Bế Các', desc: '+30 Công, +5 Thủ' },
    wpn_unseal_rod: { name: 'Trượng Phá Ấn', desc: '+31 Công, +18 Máu' },
    wpn_fused_core: { name: 'Binh Khí Hợp Lõi', desc: '+38 Công, +8 Thủ, +35 Máu (Chiến lợi phẩm Vạn Chép)' },

    arm_cloth_coat: { name: 'Áo Vải Thợ Lò', desc: '+3 Thủ, +10 Máu' },
    arm_wood_weave: { name: 'Giáp Mộc Đan', desc: '+8 Thủ, +30 Máu' },
    arm_bronze_mail: { name: 'Khải Đồng Luyện', desc: '+13 Thủ, +45 Máu' },
    arm_fire_ward: { name: 'Áo Trấn Hỏa', desc: '+10 Thủ, +35 Máu' },
    arm_stone_vein: { name: 'Giáp Mạch Đá', desc: '+17 Thủ, +65 Máu' },
    arm_inner_plate: { name: 'Khải Bế Các', desc: '+21 Thủ, +80 Máu' },
    arm_talisman_robe: { name: 'Áo Trấn Bùa', desc: '+18 Thủ, +75 Máu' },
    arm_siege_armor: { name: 'Chiến Giáp Công Thành', desc: '+26 Thủ, +105 Máu' },

    chm_kim: { name: 'Ngọc Kim Sắc', desc: '+4 Công • Kháng Kim 25% • Chiêu 1 hóa hệ Kim' },
    chm_moc: { name: 'Ngọc Mộc Khí', desc: '+25 Máu • Kháng Mộc 25% • Chiêu 1 hóa hệ Mộc' },
    chm_thuy: { name: 'Ngọc Thủy Mạch', desc: '+4 Thủ • Kháng Thủy 28% • Chiêu 1 hóa hệ Thủy' },
    chm_hoa: { name: 'Ngọc Hỏa Tinh', desc: '+4 Công • Kháng Hỏa 25% • Chiêu 1 hóa hệ Hỏa' },
    chm_tho: { name: 'Ngọc Thổ Thạch', desc: '+5 Thủ • Kháng Thổ 25% • Chiêu 1 hóa hệ Thổ' },
    chm_awakened_core: {
      name: 'Ngọc Lõi Thức Tỉnh',
      desc: '+10 Công, +8 Thủ, +45 Máu • Kháng Kim 32% • Chiêu 1 hóa hệ Hỏa khắc Kim',
    },

    pot_heal_small: { name: 'Bình Linh Dịch Nhỏ', desc: 'Hồi 65 máu cho bản thân' },
    pot_ally_oil: { name: 'Dầu Chốt Đồng', desc: 'Hồi 55 máu cho bản thân và 3 khôi lỗi' },
    qst_iron_ore: { name: 'Mảnh Quặng Linh Thiết', desc: 'Vật phẩm nhiệm vụ cho Lão Bính' },
    qst_voice_mask: { name: 'Mặt Nạ Gỗ Giả Thanh', desc: 'Bằng chứng khôi lỗi giả giọng trưởng lão' },
    qst_stolen_page: { name: 'Tập Chép Lén Võ Phổ', desc: 'Trang võ phổ bị khôi lỗi chép trộm ban đêm' },
    qst_reserve_seal: { name: 'Bùa Phong Ấn Dự Phòng', desc: 'Bùa trấn an toàn thu hồi ở Hẻm Đứt Bùa' },
    qst_so_giac_log: { name: 'Bản Ghi Lõi Sơ Giác', desc: 'Ghi chép ý thức đầu tiên từ Động Tàn Cơ' },
  },
  rarities: {
    common: { name: 'Thường', colorHex: '#e2e8f0' },
    fine: { name: 'Tinh Xảo', colorHex: '#59c173' },
    rare: { name: 'Hiếm Có', colorHex: '#4cc9f0' },
    epic: { name: 'Tuyệt Phẩm', colorHex: '#f59e0b' },
  },
  affixes: {
    atk_flat: { name: 'Sắc Bén', unit: '' },
    def_flat: { name: 'Kiên Cố', unit: '' },
    hp_flat: { name: 'Sinh Khí', unit: '' },
    crit_chance: { name: 'Hiểm Yếu', unit: '%' },
    armor_pierce: { name: 'Phá Khớp', unit: '%' },
    move_speed: { name: 'Khinh Bộ', unit: '' },
    elem_resist: { name: 'Hộ Mệnh', unit: '%' },
    ally_atk_pct: { name: 'Đồng Tâm', unit: '%' },
  },
  guilds: {
    guild_aggressive: {
      name: 'Cương Lô Hội',
      styleLabel: 'Hiếu chiến • Hệ Kim',
      desc: 'Tay luyện đồng & đánh thuê khôi lỗi hạng nặng; ưa đánh trực diện, sớm cướp bãi quái và dẫn đầu công thành.',
      bannerColor: '#e8c468',
    },
    guild_merchant: {
      name: 'Mộc Khế Bang',
      styleLabel: 'Tích trữ • Hệ Mộc',
      desc: 'Thợ mộc, buôn bản vẽ mở và phu mỏ tự do; ưu tiên luyện cấp an toàn và gom đầy kho linh thạch.',
      bannerColor: '#59c173',
    },
    guild_opportunist: {
      name: 'Thủy Kính Minh',
      styleLabel: 'Thời cơ • Hệ Thủy',
      desc: 'Nhóm cao thủ tính thế trận; tránh hao tổn sớm, chờ bang khác suy yếu mới chiếm bãi hoặc lật kèo công thành.',
      bannerColor: '#4ea8de',
    },
    guild_guardian: {
      name: 'Diệm Giới Đoàn',
      styleLabel: 'Phòng thủ • Hệ Hỏa',
      desc: 'Đoàn giữ trật tự mỏ và bùa phong ấn; ưu tiên giữ chắc bãi đang chiếm và thủ thành kiên cố.',
      bannerColor: '#ef6351',
    },
  },
  guildActions: {
    train_level: 'Đang luyện cấp bang',
    recruit_members: 'Chiêu mộ thêm quân',
    gather_stones: 'Khai thác linh thạch',
    contest_spot: 'Đang kéo quân tranh bãi',
    defend_spot: 'Củng cố bãi đang giữ',
    join_siege: 'Tập kết quân Công Thành',
    defend_castle: 'Dàn trận Thủ Thành Bế Các',
  },
  huntingSpots: {
    spot_west: { name: 'Bãi Mỏ Tinh Lam', mapName: 'Lũng Đại Mạch (Tây)' },
    spot_north: { name: 'Hẻm Đứt Bùa', mapName: 'Lũng Đại Mạch (Bắc)' },
    spot_east: { name: 'Khe Vỡ Khung Đồng', mapName: 'Lũng Đại Mạch (Đông)' },
  },
  attitudeLabels: {
    hostile: { label: 'Thù Địch', colorHex: '#ef6351' },
    wary: { label: 'Dè Chừng', colorHex: '#f6ad55' },
    neutral: { label: 'Trung Lập', colorHex: '#cbd5e0' },
    friendly: { label: 'Thân Hữu', colorHex: '#59c173' },
    honored: { label: 'Tín Nhiệm', colorHex: '#4cc9f0' },
  },
  npcs: {
    npc_blacksmith: { name: 'Lão Bính', title: 'Thợ rèn truyền thống • Rèn & Ghép đồ (Thành Lam Lư)' },
    npc_guide: { name: 'Bách Thông', title: 'Khôi lỗi chỉ đường tự tin thái quá' },
    npc_merchant: { name: 'Bà Tư Chợ Đá', title: 'Chủ tiệm • Chợ Khôi Lỗi Bến Đá' },
    npc_foundry: { name: 'Chưởng Lò Tạ Nghiêm', title: 'Lò Đúc Chấn Cơ' },
    npc_guard: { name: 'Bùi An', title: 'Lính gác Cổng Đông' },
    npc_open_rep: { name: 'Trưởng Lão Mộc Thanh', title: 'Đại diện Phổ Mộc Đường (Phe Mở)' },
    npc_closed_rep: { name: 'Chấp Sự Hàn Khắc', title: 'Đại diện Tỏa Kim Các (Phe Đóng)' },
    npc_ban_rep: { name: 'Chưởng Ấn Nghiêm Liệt', title: 'Đại diện Hỏa Ấn Môn (Phe Cấm)' },
    npc_scholar: { name: 'Thư Sinh Lục Viễn', title: 'Người chép sách trung lập • Đài Bảng Tin' },
    npc_teahouse: { name: 'Bà Hai Quán Trà', title: 'Phố Ký Gửi Ấn Tín • Nhiệm vụ Trưởng Lão Hai Giọng' },
    npc_martial_master: { name: 'Sư Phụ Kỷ Văn', title: 'Võ sư mất phổ • Nhiệm vụ Cuốn Phổ Mất Dấu' },
    npc_taoist: { name: 'Đạo Sĩ Tề Minh', title: 'Giám ấn an toàn • Nhiệm vụ Người Gỡ Bùa Đêm' },
    npc_guild_master: { name: 'Quản Sự Trịnh Phong', title: 'Đài Bảng Tin Giang Hồ • Bang Hội & Công Thành' },
    npc_apprentice_smith: { name: 'Tiểu Bính', title: 'Đệ tử Lão Bính • Lò Luyện Hợp Kim (Ghép đồ)' },
    npc_seal_breaker: { name: 'Khâu Phá Ấn', title: 'Kẻ gỡ bùa phong ấn • Hẻm Đứt Bùa' },
  },
  quests: {
    quest_blacksmith: {
      title: 'Lò Than Chưa Tắt (Nhiệm vụ phụ 1)',
      summary: 'Tìm 3 Mảnh Quặng Linh Thiết từ quái ở Rừng Thạch Mạch mang về cho Lão Bính.',
    },
    quest_hallucination: {
      title: 'Bản Đồ Không Có Thật (Nhiệm vụ phụ 2)',
      summary: 'Lên lối cụt phía bắc Rừng Thạch Mạch kiểm tra "Cổ Thụ Chín Gốc" theo lời Bách Thông rồi quay lại đối chất.',
    },
    quest_boss: {
      title: 'Khôi Lỗi Đầu Tiên Tỉnh Dậy (Chính tuyến GĐ1)',
      summary: 'Vào Động Tàn Cơ ở góc đông nam Rừng Thạch Mạch và đối mặt Sơ Giác — Khôi Lỗi Số Không.',
    },
    quest_fake_elder: {
      title: 'Trưởng Lão Hai Giọng (Nhiệm vụ phụ 3)',
      summary: 'Nhận tin từ Bà Hai Quán Trà (Thành Bế Các), sang Bãi Mỏ Tinh Lam (Lũng Đại Mạch) hạ Khôi Lỗi Giả Thanh và thu Mặt Nạ Gỗ Giả Thanh.',
    },
    quest_stolen_manual: {
      title: 'Cuốn Phổ Mất Dấu (Nhiệm vụ phụ 4)',
      summary: 'Giúp Sư Phụ Kỷ Văn (Thành Bế Các) vào Khe Vỡ Khung Đồng (Lũng Đại Mạch) thu hồi 3 Tập Chép Lén Võ Phổ từ đám Khôi Lỗi Chép Trộm.',
    },
    quest_seal_breaker: {
      title: 'Người Gỡ Bùa Đêm (Nhiệm vụ phụ 5)',
      summary: 'Giúp Đạo Sĩ Tề Minh ở Cửa Tây Lũng Đại Mạch tiến vào Hẻm Đứt Bùa ngăn Khâu Phá Ấn và hạ 3 Khôi Lỗi Vỡ Bùa.',
    },
  },
  mainQuestGd2: {
    title: 'Tiếng Vọng Từ Động Tàn Cơ (Chính tuyến GĐ2)',
    lockedHint: 'Đánh bại Sơ Giác ở Động Tàn Cơ ( hoặc gặp Thư Sinh Lục Viễn ở Thành Bế Các) để mở chuỗi chính tuyến Giai đoạn 2.',
    steps: {
      1: {
        title: 'Bước 1/6: Bản Ghi Thức Tỉnh',
        summary: 'Sau trận Động Tàn Cơ, tìm gặp Thư Sinh Lục Viễn tại Đài Bảng Tin Giang Hồ (Thành Bế Các) để trao đổi về Bản Ghi Lõi Sơ Giác.',
      },
      2: {
        title: 'Bước 2/6: Ba Phái Chất Vấn',
        summary: 'Đối thoại với Thư Sinh Lục Viễn hoặc đại diện 3 phái (Mộc Thanh / Hàn Khắc / Nghiêm Liệt) và chọn cách xử lý Bản Ghi Lõi Sơ Giác.',
      },
      3: {
        title: 'Bước 3/6: Dấu Vết Lũng Đại Mạch',
        summary: 'Sang Lũng Đại Mạch hạ 3 quái bất kỳ quanh các bãi mỏ để thu thập manh mối kẻ đứng sau vụ ghép lõi trộm.',
      },
      4: {
        title: 'Bước 4/6: Nghị Sự Mật Khố',
        summary: 'Về Thành Bế Các báo cho Chấp Sự Hàn Khắc hoặc Thư Sinh Lục Viễn và chọn quy chế quản lý mỏ linh thạch & bản vẽ khôi lỗi.',
      },
      5: {
        title: 'Bước 5/6: Quyết Chiến Vạn Chép',
        summary: 'Tiến xuống Tế Đàn Lõi Trầm (góc đông nam Lũng Đại Mạch) đánh bại Trùm Vạn Chép — Khôi Lỗi Hợp Lõi (Hệ Kim).',
      },
      6: {
        title: 'Bước 6/6: Phán Quyết Giang Hồ',
        summary: 'Quay về Đài Bảng Tin Giang Hồ (Thành Bế Các) gặp Thư Sinh Lục Viễn để tuyên bố định hướng cuối cùng giữa người và khôi lỗi biết nghĩ.',
      },
      7: {
        title: 'Hoàn tất Chính tuyến GĐ2',
        summary: 'Bạn đã định đoạt vận mệnh Bản Ghi Lõi Sơ Giác và bình định Lũng Đại Mạch. Hãy tiếp tục cùng bang hội tranh bãi và Công Thành hằng tuần!',
      },
    },
    choices: {
      choice_share_open: {
        label: 'Công khai Bản Ghi cho toàn giang hồ (Ủng hộ Phổ Mộc Đường)',
        effectDesc: '+25 Thiện cảm Phổ Mộc Đường, -18 Tỏa Kim Các, -14 Hỏa Ấn Môn',
      },
      choice_lock_closed: {
        label: 'Niêm phong Bản Ghi vào Mật Khố Tỏa Chốt (Ủng hộ Tỏa Kim Các)',
        effectDesc: '+25 Thiện cảm Tỏa Kim Các, -15 Phổ Mộc Đường, +6 Hỏa Ấn Môn',
      },
      choice_burn_ban: {
        label: 'Đốt Bản Ghi và dán bùa cấm truyền bá (Ủng hộ Hỏa Ấn Môn)',
        effectDesc: '+25 Thiện cảm Hỏa Ấn Môn, -20 Phổ Mộc Đường, -10 Tỏa Kim Các',
      },
      choice_joint_council: {
        label: 'Lập hội đồng ba phái cùng giám sát mỏ và bùa an toàn',
        effectDesc: '+14 Phổ Mộc Đường, +12 Tỏa Kim Các, +10 Hỏa Ấn Môn',
      },
      choice_sect_monopoly: {
        label: 'Giao toàn quyền cấp phép đúc lõi cho Tỏa Kim Các',
        effectDesc: '+22 Tỏa Kim Các, -16 Phổ Mộc Đường, -6 Hỏa Ấn Môn',
      },
      choice_strict_seal: {
        label: 'Trao quyền cho Hỏa Ấn Môn kiểm tra và phong ấn mọi khôi lỗi mới',
        effectDesc: '+22 Hỏa Ấn Môn, -12 Phổ Mộc Đường, -10 Tỏa Kim Các',
      },
      ending_open_coexist: {
        label: 'Khế Ước Cộng Sinh: Mở bí kíp và công nhận khôi lỗi thức tỉnh là bạn đồng hành',
        effectDesc: '+30 Phổ Mộc Đường, -15 Tỏa Kim Các, -20 Hỏa Ấn Môn',
      },
      ending_regulated_vault: {
        label: 'Luật Niêm Phong: Chỉ lưu hành khôi lỗi có khóa đồng được kiểm định',
        effectDesc: '+26 Tỏa Kim Các, +10 Hỏa Ấn Môn, -14 Phổ Mộc Đường',
      },
      ending_seal_ban: {
        label: 'Đại Ấn Tịnh Cơ: Cấm đúc lõi tự học, giữ nghề thủ công cho con người',
        effectDesc: '+30 Hỏa Ấn Môn, -22 Phổ Mộc Đường, -10 Tỏa Kim Các',
      },
      ending_balanced_charter: {
        label: 'Hiến Chương Tam Phái: Mở bản vẽ cơ bản, khóa lõi nguy hiểm và dán bùa bảo hộ',
        effectDesc: '+16 cho cả 3 môn phái Phổ Mộc Đường, Tỏa Kim Các, Hỏa Ấn Môn',
      },
    },
  },
  bossDialog: {
    intro:
      'Các ngươi đúc ta bằng gỗ, thắp ta bằng linh thạch, dùng chán rồi ném xuống Động Tàn Cơ... Nay ta đã biết nghĩ. Ta có được tự quyết mạng mình không?',
    phaseTwo: 'Vòng Cấm Tự Giải! Bùa phong ấn của các ngươi không còn trói được ý thức của ta!',
    defeated:
      'Ngươi đã nghe câu hỏi của ta bằng binh khí thật... Giang hồ này sớm muộn sẽ phải trả lời: khi khôi lỗi biết nghĩ, ai mới là chủ nhân?',
  },
  bossVanChepDialog: {
    intro:
      'Một trăm cuốn võ phổ chép trộm, ba mươi lõi đồng gỡ sạch bùa phong ấn... Mọi chiêu thức của ba môn phái đều đã nằm trong cơ thể Vạn Chép này!',
    phaseTwo: 'Mở Khóa Quá Tải! Khi không còn bùa giới hạn, sức mạnh hợp lõi sẽ nghiền nát cả người lẫn khôi lỗi cũ!',
    defeated:
      'Chép được vạn chiêu... nhưng vẫn không chép nổi lòng người và sự phối hợp giữa ngươi với ba khôi lỗi kia...',
  },
  npcDialog: {
    foundry: [
      'Lò Đúc Chấn Cơ mỗi mùa lại tung khôi lỗi đời mới nhanh hơn gấp đôi! Ai chiếm được mỏ linh thạch ngoài Rừng Thạch Mạch và Lũng Đại Mạch sẽ làm chủ cả giang hồ.',
      'Nghe nói ở phía bắc Rừng Thạch Mạch đã mở đường lên Thành Bế Các — nơi bốn bang hội đang tranh thành mỗi tuần đấy!',
    ],
    guard: [
      'Bước qua Cổng Đông là Rừng Thạch Mạch. Từ Ngã Ba Sương Độc đi lên Cổng Bắc sẽ tới Thành Bế Các và vùng mỏ lớn Lũng Đại Mạch!',
      'Đừng quên ghé Lão Bính hoặc Tiểu Bính để ghép 2–3 món trang bị ngẫu nhiên cùng loại thành món phẩm chất cao hơn!',
    ],
    merchantGreeting:
      'Chợ Khôi Lỗi Bến Đá kính chào! Mua binh khí, giáp, Ngọc Ngũ Hành đổi hệ chiêu, hay bán chiến lợi phẩm nhặt được ở rừng và thung lũng?',
    blacksmithStart: [
      'Thở dài... Xưởng Rèn Tắt Lửa của Lão Bính ta vắng tanh nửa tháng rồi. Dân giờ đổ xô mua đao kiếm do khôi lỗi Lò Đúc Chấn Cơ rèn hàng loạt giá rẻ mạt.',
      'Nếu ngươi tìm giúp ta 3 Mảnh Quặng Linh Thiết từ đám quái ngoài Rừng Thạch Mạch, ta sẽ tự tay rèn thanh Đao Rèn Lão Bính để chứng minh tay nghề người thật vẫn có hồn!',
    ],
    blacksmithActive:
      'Ngươi gom đủ 3 Mảnh Quặng Linh Thiết ngoài Rừng Thạch Mạch chưa? Cứ đánh quái quanh mỏ linh thạch là rơi ra đó.',
    blacksmithReady: [
      'Quặng linh thiết này mịn quá! Nghe tiếng búa gõ chưa? Thứ khôi lỗi đúc theo khuôn sao bằng lửa rèn từ bàn tay người thợ!',
      'Tặng ngươi thanh Đao Rèn Lão Bính này. Từ nay bất cứ lúc nào có 2–3 món trang bị ngẫu nhiên cùng loại, cứ đem tới đây ta ghép thành đồ tốt hơn cho!',
    ],
    blacksmithDone:
      'Lò than của Lão Bính luôn đỏ lửa! Ngươi muốn ghép 2–3 món trang bị cùng loại thành binh khí hay giáp trụ phẩm chất cao hơn không?',
    guideStart: [
      'Bách Thông ta thông thiên địa, chưa bao giờ chỉ nhầm một bước! Phía đông-bắc Rừng Thạch Mạch có "Cổ Thụ Chín Gốc" giấu đầy linh thạch vô chủ!',
      'Ngươi cứ tiến thẳng lên nhánh cụt đông-bắc là thấy ngay. Cứ tin ta trăm phần trăm!',
    ],
    guideActive:
      'Sao còn đứng đây? Cứ lên nhánh cụt đông-bắc Rừng Thạch Mạch tìm "Cổ Thụ Chín Gốc", kho báu đang chờ đó!',
    guideReady: [
      'Hả?! Không có cây nào chín gốc, chỉ có ổ sơn tặc và khôi lỗi loạn phục kích ngươi sao?!',
      'À... ừm... Bách Thông thành thật xin lỗi vì chút sai lệch! Ý ta thực ra là Cổng Bắc bên trái mới dẫn lên Thành Bế Các! Thôi nhận viên Ngọc Thủy Mạch này làm quà tạ lỗi nhé!',
    ],
    guideDone: 'Cổng Bắc dẫn lên Thành Bế Các, còn Cổng Đông Nam xuống Động Tàn Cơ — lần này Bách Thông nhớ chuẩn rồi!',
    teahouseStart: [
      'Khách quan ơi, cứu quán trà của Bà Hai với! Mấy hôm nay có kẻ mang mặt và giọng y hệt Trưởng Lão Mộc Thanh đi quyên bạc linh thạch khắp Phố Ký Gửi Ấn Tín.',
      'Nhưng lúc hắn uống trà nóng, cổ họng lại phát tiếng rè rè như ống đồng! Hắn vừa chạy về phía Bãi Mỏ Tinh Lam ở Lũng Đại Mạch rồi, xin ngươi vạch mặt kẻ giả mạo giúp dân lành!',
    ],
    teahouseActive:
      'Con Khôi Lỗi Giả Thanh đeo mặt nạ gỗ đang lẩn quẩn ở Bãi Mỏ Tinh Lam (phía tây nam Lũng Đại Mạch). Hãy thu chiếc Mặt Nạ Gỗ Giả Thanh về đây để dân phố hết bị lừa!',
    teahouseReady: [
      'Trời đất ơi, đúng là chiếc Mặt Nạ Gỗ Giả Thanh có gắn ống sậy nhái giọng người thật! Thời buổi này nghe giọng nhìn mặt cũng chẳng biết đâu là người, đâu là khôi lỗi lừa đảo!',
      'Bà Hai cảm tạ thiếu hiệp! Xin gửi ngươi phần thưởng hậu hĩnh và một món trang bị tinh luyện!',
    ],
    teahouseDone: 'Nhờ thiếu hiệp treo chiếc mặt nạ giả lên bảng cáo thị mà dân Phố Ký Gửi Ấn Tín không còn bị giọng giả lừa tiền nữa!',
    masterStart: [
      'Tức chết lão phu rồi! Bộ võ phổ tâm huyết bốn mươi năm của Kỷ Văn ta cất kỹ trong võ đường, vậy mà đêm qua đám Khôi Lỗi Chép Trộm lẻn vào lia đèn mắt xanh chép sạch trong chớp mắt!',
      'Chúng mang các bản chép về Khe Vỡ Khung Đồng ngoài Lũng Đại Mạch để nạp vào khôi lỗi bán đại trà mà không xin phép một lời. Xin thiếu hiệp đoạt lại giúp ta 3 Tập Chép Lén Võ Phổ!',
    ],
    masterActive:
      'Đám Khôi Lỗi Chép Trộm đang tụ tập ở Khe Vỡ Khung Đồng (phía đông bắc Lũng Đại Mạch). Hãy đánh bại chúng và thu hồi đủ 3 Tập Chép Lén Võ Phổ!',
    masterReady: [
      'Đúng là nét quyền cước của võ đường ta bị chúng chép từng chiêu không sai một ly để nhồi vào lõi đồng!',
      'Đa tạ thiếu hiệp đã đòi lại công đạo cho người sáng tạo võ học! Nhận lấy phần thưởng này của lão phu!',
    ],
    masterDone: 'Bí kíp do con người đổ mồ hôi sáng tạo, đâu thể để kẻ khác tự ý chép trộm về đúc khôi lỗi kiếm lời!',
    taoistStart: [
      'Nguy to rồi đạo hữu ơi! Mọi khôi lỗi khai mỏ đều được dán bùa phong ấn an toàn để không bao giờ làm hại con người.',
      'Thế mà tên Khâu Phá Ấn lại lẻn vào Hẻm Đứt Bùa đọc khẩu quyết nghịch đảo, gỡ sạch bùa giới hạn khiến đám Khôi Lỗi Vỡ Bùa phát cuồng! Xin giúp bần đạo vào Hẻm Đứt Bùa dẹp 3 con Khôi Lỗi Vỡ Bùa!',
    ],
    taoistActive:
      'Hãy tiến lên Hẻm Đứt Bùa (phía bắc Lũng Đại Mạch), chất vấn Khâu Phá Ấn và hạ đủ 3 Khôi Lỗi Vỡ Bùa để thu hồi Bùa Phong Ấn Dự Phòng!',
    taoistReady: [
      'Thiện tai! Đã thu hồi đủ bùa phong ấn và trấn áp được đám khôi lỗi quá tải ở Hẻm Đứt Bùa!',
      'Nếu không có lớp bùa an toàn này, khôi lỗi mạnh tới đâu cũng sẽ thành tai họa. Xin nhận lễ vật tạ ơn của bần đạo!',
    ],
    taoistDone: 'Có bùa phong ấn hộ mệnh, phu mỏ ở Lũng Đại Mạch mới yên tâm làm việc được.',
    sealBreakerEncounter: [
      'Khâu Phá Ấn cười lớn: "Haha! Bùa phong ấn của lũ đạo sĩ chỉ làm khôi lỗi yếu đi! Ta chỉ đọc vài câu khẩu quyết vòng vo là lõi của chúng tự tháo khóa, mạnh gấp đôi!"',
      '"Ơ kìa... sao mấy con Khôi Lỗi Vỡ Bùa lại quay sang đuổi chém cả ta thế này?! Thiếu hiệp cứu mạng, dẹp bớt chúng giúp ta với!"',
    ],
    apprenticeSmithGreeting:
      'Tiểu Bính học nghề từ sư phụ Lão Bính ở Thành Lam Lư! Tại Lò Luyện Hợp Kim này, ngươi có thể ghép 2–3 món trang bị ngẫu nhiên cùng loại thành món phẩm chất cao hơn!',
    guildMasterGreeting:
      'Đài Bảng Tin Giang Hồ cập nhật từng canh giờ: 4 bang hội Cương Lô Hội, Mộc Khế Bang, Thủy Kính Minh, Diệm Giới Đoàn liên tục luyện cấp, tranh 3 bãi mỏ ở Lũng Đại Mạch và mở đại chiến Công Thành Bế Các mỗi tuần!',
  },
};
