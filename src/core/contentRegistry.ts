import type { AllyId, MapId, QuestId, SectId } from './types';

/**
 * Đã được Claude duyệt trong docs/REVIEW_LOG.md ("NAMES: ĐỒNG Ý", commit 932c401).
 * Toàn bộ tên khớp chính xác với docs/NAMES.md.
 */
export const NAMES_APPROVED = true;

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
  };
  enemies: Record<string, string>;
  items: Record<string, { name: string; desc: string }>;
  npcs: Record<string, { name: string; title: string }>;
  quests: Record<QuestId, { title: string; summary: string }>;
  bossDialog: {
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
      bonusDesc: 'Mẹo: Đeo Ngọc Thổ Thạch để đổi Chiêu 1 sang Thổ khắc trùm Sơ Giác',
    },
  },
  maps: {
    map_town: {
      name: 'Thành Lam Lư',
      subtitle: 'Khu an toàn • Lò Đúc Chấn Cơ • Chợ Bến Đá • Xưởng Rèn Tắt Lửa',
    },
    map_forest: {
      name: 'Rừng Thạch Mạch',
      subtitle: 'Mỏ linh thạch bị tranh • Ngã Ba Sương Độc • Quái Kim / Mộc / Thổ',
    },
    map_cave: {
      name: 'Động Tàn Cơ',
      subtitle: 'Nghĩa địa khôi lỗi đời cũ • Trùm Sơ Giác (Thủy)',
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
  },
  enemies: {
    enemy_mine_guard: 'Khôi Lỗi Canh Mỏ',
    enemy_mine_bandit: 'Sơn Tặc Cướp Mỏ',
    enemy_rogue_logger: 'Khôi Lỗi Đốn Củi Loạn',
    enemy_furnace_golem: 'Khôi Lỗi Lò Hỏng',
    enemy_cave_sentry: 'Thủy Mạch Vệ Cơ',
    boss_awakened: 'Sơ Giác — Khôi Lỗi Số Không',
  },
  items: {
    wpn_wood_staff: { name: 'Côn Gỗ Xưởng Cũ', desc: '+5 Công' },
    wpn_bronze_sword: { name: 'Kiếm Đồng Thử Lò', desc: '+6 Công' },
    wpn_ember_rod: { name: 'Bùa Trượng Than Hồng', desc: '+6 Công' },
    wpn_mine_spear: { name: 'Thương Mỏ Linh Thiết', desc: '+13 Công' },
    wpn_blacksmith_blade: { name: 'Đao Rèn Lão Bính', desc: '+18 Công, +15 Máu (Thưởng nhiệm vụ)' },
    wpn_cave_relic: { name: 'Binh Khí Tàn Cơ', desc: '+24 Công, +4 Thủ (Chiến lợi phẩm Sơ Giác)' },

    arm_cloth_coat: { name: 'Áo Vải Thợ Lò', desc: '+3 Thủ, +10 Máu' },
    arm_wood_weave: { name: 'Giáp Mộc Đan', desc: '+8 Thủ, +30 Máu' },
    arm_bronze_mail: { name: 'Khải Đồng Luyện', desc: '+13 Thủ, +45 Máu' },
    arm_fire_ward: { name: 'Áo Trấn Hỏa', desc: '+10 Thủ, +35 Máu' },

    chm_kim: { name: 'Ngọc Kim Sắc', desc: '+4 Công • Kháng Kim 25% • Chiêu 1 hóa hệ Kim' },
    chm_moc: { name: 'Ngọc Mộc Khí', desc: '+25 Máu • Kháng Mộc 25% • Chiêu 1 hóa hệ Mộc' },
    chm_thuy: { name: 'Ngọc Thủy Mạch', desc: '+4 Thủ • Kháng Thủy 28% • Chiêu 1 hóa hệ Thủy' },
    chm_hoa: { name: 'Ngọc Hỏa Tinh', desc: '+4 Công • Kháng Hỏa 25% • Chiêu 1 hóa hệ Hỏa' },
    chm_tho: { name: 'Ngọc Thổ Thạch', desc: '+5 Thủ • Kháng Thổ 25% • Chiêu 1 hóa hệ Thổ' },

    pot_heal_small: { name: 'Bình Linh Dịch Nhỏ', desc: 'Hồi 65 máu cho bản thân' },
    pot_ally_oil: { name: 'Dầu Chốt Đồng', desc: 'Hồi 55 máu cho bản thân và 3 khôi lỗi' },
    qst_iron_ore: { name: 'Mảnh Quặng Linh Thiết', desc: 'Vật phẩm nhiệm vụ cho Lão Bính' },
  },
  npcs: {
    npc_blacksmith: { name: 'Lão Bính', title: 'Thợ rèn mất việc • Xưởng Rèn Tắt Lửa' },
    npc_guide: { name: 'Bách Thông', title: 'Khôi lỗi chỉ đường tự tin thái quá' },
    npc_merchant: { name: 'Bà Tư Chợ Đá', title: 'Chủ tiệm • Chợ Khôi Lỗi Bến Đá' },
    npc_foundry: { name: 'Chưởng Lò Tạ Nghiêm', title: 'Lò Đúc Chấn Cơ' },
    npc_guard: { name: 'Bùi An', title: 'Lính gác Cổng Đông' },
  },
  quests: {
    quest_blacksmith: {
      title: 'Lò Than Chưa Tắt (Nhiệm vụ phụ)',
      summary: 'Tìm 3 Mảnh Quặng Linh Thiết từ quái ở Rừng Thạch Mạch mang về cho Lão Bính.',
    },
    quest_hallucination: {
      title: 'Bản Đồ Không Có Thật (Nhiệm vụ phụ)',
      summary: 'Lên lối cụt phía bắc Rừng Thạch Mạch kiểm tra "Cổ Thụ Chín Gốc" theo lời Bách Thông rồi quay lại đối chất.',
    },
    quest_boss: {
      title: 'Khôi Lỗi Đầu Tiên Tỉnh Dậy (Chính tuyến)',
      summary: 'Vào Động Tàn Cơ ở góc đông nam Rừng Thạch Mạch và đối mặt Sơ Giác — Khôi Lỗi Số Không.',
    },
  },
  bossDialog: {
    intro:
      'Các ngươi đúc ta bằng gỗ, thắp ta bằng linh thạch, dùng chán rồi ném xuống Động Tàn Cơ... Nay ta đã biết nghĩ. Ta có được tự quyết mạng mình không?',
    phaseTwo: 'Vòng Cấm Tự Giải! Bùa phong ấn của các ngươi không còn trói được ý thức của ta!',
    defeated:
      'Ngươi đã nghe câu hỏi của ta bằng binh khí thật... Giang hồ này sớm muộn sẽ phải trả lời: khi khôi lỗi biết nghĩ, ai mới là chủ nhân?',
  },
  npcDialog: {
    foundry: [
      'Lò Đúc Chấn Cơ mỗi mùa lại tung khôi lỗi đời mới nhanh hơn gấp đôi! Ai chiếm được mỏ linh thạch ngoài Rừng Thạch Mạch sẽ làm chủ cả giang hồ.',
      'Nghe nói kẻ lạ vừa tháo bùa phong ấn trên mấy con khôi lỗi ngoài rừng, còn dưới Động Tàn Cơ có tiếng gõ kỳ quái của khôi lỗi đời cũ...',
    ],
    guard: [
      'Bước qua Cổng Đông là Rừng Thạch Mạch. Quái ngoài đó đủ cả Ngũ Hành: Kim khắc Mộc, Mộc khắc Thổ, Thổ khắc Thủy, Thủy khắc Hỏa, Hỏa khắc Kim!',
      'Đừng quên ghé Bà Tư Chợ Đá mua Ngọc Ngũ Hành (đổi hệ Chiêu 1) và bình hồi máu. Nghe đồn ở trấn bên còn có khôi lỗi đóng giả trưởng lão lừa dân nữa đấy!',
    ],
    merchantGreeting:
      'Chợ Khôi Lỗi Bến Đá kính chào! Mua binh khí, giáp, Ngọc Ngũ Hành đổi hệ chiêu, hay bán chiến lợi phẩm nhặt được ở rừng?',
    blacksmithStart: [
      'Thở dài... Xưởng Rèn Tắt Lửa của Lão Bính ta vắng tanh nửa tháng rồi. Dân giờ đổ xô mua đao kiếm do khôi lỗi Lò Đúc Chấn Cơ rèn hàng loạt giá rẻ mạt.',
      'Nếu ngươi tìm giúp ta 3 Mảnh Quặng Linh Thiết từ đám quái ngoài Rừng Thạch Mạch, ta sẽ tự tay rèn thanh Đao Rèn Lão Bính để chứng minh tay nghề người thật vẫn có hồn!',
    ],
    blacksmithActive:
      'Ngươi gom đủ 3 Mảnh Quặng Linh Thiết ngoài Rừng Thạch Mạch chưa? Cứ đánh quái quanh mỏ linh thạch là rơi ra đó.',
    blacksmithReady: [
      'Quặng linh thiết này mịn quá! Nghe tiếng búa gõ chưa? Thứ khôi lỗi đúc theo khuôn sao bằng lửa rèn từ bàn tay người thợ!',
      'Tặng ngươi thanh Đao Rèn Lão Bính này. Chúc ngươi vững bước ngoài mỏ và dưới Động Tàn Cơ!',
    ],
    blacksmithDone: 'Cảm ơn ngươi, lò than của Lão Bính lại đỏ lửa rồi!',
    guideStart: [
      'Bách Thông ta thông thiên địa, chưa bao giờ chỉ nhầm một bước! Phía bắc Rừng Thạch Mạch có "Cổ Thụ Chín Gốc" giấu đầy linh thạch vô chủ!',
      'Ngươi cứ tiến thẳng lên góc bắc lối cụt là thấy ngay. Cứ tin ta trăm phần trăm!',
    ],
    guideActive:
      'Sao còn đứng đây? Cứ lên góc bắc Rừng Thạch Mạch tìm "Cổ Thụ Chín Gốc", kho báu đang chờ đó!',
    guideReady: [
      'Hả?! Không có cây nào chín gốc, chỉ có ổ sơn tặc và khôi lỗi loạn phục kích ngươi sao?!',
      'À... ừm... Bách Thông thành thật xin lỗi vì chút sai lệch! Ý ta thực ra là kho báu nằm ở... hướng ngược lại! Thôi nhận viên Ngọc Thủy Mạch này làm quà tạ lỗi nhé!',
    ],
    guideDone: 'Từ giờ Bách Thông sẽ kiểm tra lại bản đồ trước khi nói... chắc chắn là vậy!',
  },
};
