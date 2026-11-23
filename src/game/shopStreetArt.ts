import type { ShopOnStreet } from '../core/shopStreet';

const INK = '#2b1a12';

/**
 * Mái & nền mặt tiền cho từng tiệm trên Con phố dốc Đà Lạt (cùng nét viền #2b1a12).
 * Nếu sau này thêm tiệm mới vào SHOP_STREET chưa có hình riêng, tự động dùng mặt tiền gỗ mặc định.
 */
function renderFacadeInterior(stageId: string): string {
  if (stageId === 'stage_1') {
    // Tiệm Giày Hẻm Dốc: tường gỗ ấm, cửa kính trưng bày kệ giày + ghế thử giày + mái hiên sọc đỏ-kem
    return `
      <!-- Mái ngói nâu đỏ Đà Lạt -->
      <path d="M12 42 L30 14 L330 14 L348 42 Z" fill="#8b4228" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/>
      <path d="M44 14 L34 42 M86 14 L80 42 M130 14 L126 42 M176 14 L176 42 M224 14 L228 42 M270 14 L278 42 M314 14 L324 42" stroke="#5d2917" stroke-width="2" opacity="0.6"/>
      <!-- Thân mặt tiền tường gỗ vàng kem -->
      <rect x="22" y="42" width="316" height="96" fill="#e8c796" stroke="${INK}" stroke-width="3.2"/>
      <!-- Ốp gỗ chân tường -->
      <rect x="22" y="114" width="316" height="24" fill="#a86836" stroke="${INK}" stroke-width="2.6"/>
      <line x1="62" y1="114" x2="62" y2="138" stroke="${INK}" stroke-width="1.6" opacity="0.45"/>
      <line x1="102" y1="114" x2="102" y2="138" stroke="${INK}" stroke-width="1.6" opacity="0.45"/>
      <line x1="258" y1="114" x2="258" y2="138" stroke="${INK}" stroke-width="1.6" opacity="0.45"/>
      <line x1="298" y1="114" x2="298" y2="138" stroke="${INK}" stroke-width="1.6" opacity="0.45"/>

      <!-- Cửa kính trưng bày bên trái -->
      <rect x="36" y="64" width="112" height="60" rx="5" fill="url(#warmWindowGlow)" stroke="${INK}" stroke-width="3"/>
      <!-- 2 tầng kệ giày trong tủ kính -->
      <line x1="40" y1="90" x2="144" y2="90" stroke="#7b4822" stroke-width="3"/>
      <line x1="40" y1="112" x2="144" y2="112" stroke="#7b4822" stroke-width="3"/>
      <!-- Đôi giày đỏ, xanh, bốt vàng trên kệ -->
      <path d="M50 88 C50 81, 60 80, 68 83 L69 88 Z" fill="#e53935" stroke="${INK}" stroke-width="1.8"/>
      <path d="M77 88 C77 81, 88 80, 96 83 L97 88 Z" fill="#38bdf8" stroke="${INK}" stroke-width="1.8"/>
      <path d="M108 77 L116 77 L116 84 C122 84, 126 86, 126 88 L108 88 Z" fill="#d97706" stroke="${INK}" stroke-width="1.8"/>
      <path d="M54 110 C54 103, 66 102, 74 105 L75 110 Z" fill="#59c173" stroke="${INK}" stroke-width="1.8"/>
      <path d="M90 110 C90 103, 102 102, 112 105 L113 110 Z" fill="#8b5a2b" stroke="${INK}" stroke-width="1.8"/>
      <!-- Phản chiếu kính -->
      <path d="M46 68 L62 68 L48 118 L40 118 Z" fill="#ffffff" opacity="0.22"/>

      <!-- Cửa ra vào gỗ kính ở giữa -->
      <rect x="160" y="62" width="54" height="76" rx="4" fill="#8f5324" stroke="${INK}" stroke-width="3"/>
      <rect x="168" y="70" width="38" height="40" rx="3" fill="url(#warmWindowGlow)" stroke="${INK}" stroke-width="2.2"/>
      <circle cx="204" cy="108" r="3" fill="#f5cb5c" stroke="${INK}" stroke-width="1.5"/>
      <!-- Biển nhỏ treo kính "MỞ" -->
      <rect x="176" y="84" width="22" height="12" rx="2.5" fill="#fff8e1" stroke="${INK}" stroke-width="1.5"/>
      <line x1="181" y1="90" x2="193" y2="90" stroke="#8b4228" stroke-width="2" stroke-linecap="round"/>

      <!-- Cửa kính bên phải (kệ dép tông & giỏ ô dù) -->
      <rect x="226" y="64" width="98" height="60" rx="5" fill="url(#warmWindowGlow)" stroke="${INK}" stroke-width="3"/>
      <line x1="230" y1="96" x2="320" y2="96" stroke="#7b4822" stroke-width="3"/>
      <!-- Dép tông & hộp giày -->
      <ellipse cx="252" cy="86" rx="11" ry="5" transform="rotate(-14 252 86)" fill="#59c173" stroke="${INK}" stroke-width="1.8"/>
      <rect x="274" y="80" width="20" height="14" rx="2" fill="#e6a938" stroke="${INK}" stroke-width="1.8"/>
      <rect x="296" y="83" width="18" height="11" rx="2" fill="#e56b4e" stroke="${INK}" stroke-width="1.8"/>
      <rect x="242" y="102" width="24" height="16" rx="3" fill="#b87a3d" stroke="${INK}" stroke-width="1.8"/>
      <line x1="250" y1="102" x2="248" y2="91" stroke="#38bdf8" stroke-width="2.6" stroke-linecap="round"/>
      <line x1="257" y1="102" x2="260" y2="90" stroke="#e53935" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M236 68 L250 68 L238 118 L230 118 Z" fill="#ffffff" opacity="0.22"/>

      <!-- Mái hiên sọc đỏ-kem che mưa -->
      <path d="M16 42 L344 42 L352 64 L8 64 Z" fill="#faf0da" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M36 42 L32 64 L58 64 L60 42 Z M86 42 L84 64 L110 64 L112 42 Z M138 42 L138 64 L164 64 L164 42 Z M190 42 L192 64 L218 64 L216 42 Z M242 42 L246 64 L272 64 L268 42 Z M294 42 L300 64 L326 64 L320 42 Z" fill="#c94a38"/>
      <path d="M8 64 Q22 72 36 64 Q50 72 64 64 Q78 72 92 64 Q106 72 120 64 Q134 72 148 64 Q162 72 176 64 Q190 72 204 64 Q218 72 232 64 Q246 72 260 64 Q274 72 288 64 Q302 72 316 64 Q330 72 352 64" fill="none" stroke="${INK}" stroke-width="2.6"/>

      <!-- Chậu dương xỉ trước cửa -->
      <path d="M138 124 L154 124 L151 138 L141 138 Z" fill="#b86035" stroke="${INK}" stroke-width="2"/>
      <circle cx="146" cy="119" r="8" fill="#4f9e4a" stroke="${INK}" stroke-width="2"/>
      <circle cx="141" cy="117" r="5" fill="#74c365"/>
    `;
  }

  if (stageId === 'stage_2') {
    // Tiệm Bánh Đầu Phố: tủ kính bánh mì nóng hổi, bao bột, đèn vàng ấm, mái hiên vàng nâu
    return `
      <!-- Mái ngói nâu cam ấm cúng -->
      <path d="M12 42 L30 14 L330 14 L348 42 Z" fill="#9c5628" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/>
      <!-- Ống khói lò bánh có làn khói trắng -->
      <rect x="286" y="4" width="22" height="18" rx="2" fill="#7a4526" stroke="${INK}" stroke-width="2.6"/>
      <circle cx="297" cy="1" r="5" fill="#fff7e6" opacity="0.65"/>
      <!-- Thân mặt tiền màu kem bơ -->
      <rect x="22" y="42" width="316" height="96" fill="#f3dfc1" stroke="${INK}" stroke-width="3.2"/>
      <!-- Gạch chân tường nâu gạch -->
      <rect x="22" y="114" width="316" height="24" fill="#b86d3b" stroke="${INK}" stroke-width="2.6"/>
      <line x1="22" y1="126" x2="338" y2="126" stroke="${INK}" stroke-width="1.4" opacity="0.45"/>

      <!-- Tủ kính bánh mì lớn bên trái -->
      <rect x="34" y="64" width="126" height="60" rx="6" fill="url(#bakeryGlow)" stroke="${INK}" stroke-width="3"/>
      <line x1="38" y1="92" x2="156" y2="92" stroke="#854d27" stroke-width="3"/>
      <line x1="38" y1="112" x2="156" y2="112" stroke="#854d27" stroke-width="3"/>
      <!-- Bánh mì ổ & bánh sừng bò -->
      <ellipse cx="58" cy="85" rx="13" ry="6" fill="#e8a547" stroke="${INK}" stroke-width="1.8"/>
      <path d="M52 82 L55 88 M58 81 L61 88 M64 82 L66 87" stroke="#8f4f18" stroke-width="1.4"/>
      <ellipse cx="94" cy="85" rx="14" ry="6" fill="#f0b454" stroke="${INK}" stroke-width="1.8"/>
      <path d="M88 82 L91 88 M95 81 L98 88" stroke="#8f4f18" stroke-width="1.4"/>
      <circle cx="132" cy="84" r="9" fill="#d98736" stroke="${INK}" stroke-width="1.8"/>
      <!-- Tầng dưới bánh ngọt & khay -->
      <ellipse cx="62" cy="106" rx="12" ry="5.5" fill="#f3be62" stroke="${INK}" stroke-width="1.8"/>
      <ellipse cx="98" cy="106" rx="12" ry="5.5" fill="#e59c42" stroke="${INK}" stroke-width="1.8"/>
      <ellipse cx="132" cy="106" rx="11" ry="5.5" fill="#f6c770" stroke="${INK}" stroke-width="1.8"/>
      <path d="M44 68 L62 68 L48 118 L38 118 Z" fill="#ffffff" opacity="0.22"/>

      <!-- Cửa vòm tiệm bánh ở giữa phải -->
      <path d="M174 138 L174 74 Q202 58 230 74 L230 138 Z" fill="#7c4723" stroke="${INK}" stroke-width="3"/>
      <path d="M182 110 L182 78 Q202 68 222 78 L222 110 Z" fill="url(#bakeryGlow)" stroke="${INK}" stroke-width="2.2"/>
      <circle cx="220" cy="116" r="3" fill="#fde047" stroke="${INK}" stroke-width="1.5"/>

      <!-- Cửa sổ bên phải + 2 bao bột mì ngoài hiên -->
      <rect x="244" y="64" width="80" height="48" rx="6" fill="url(#bakeryGlow)" stroke="${INK}" stroke-width="3"/>
      <!-- Lò nướng ánh cam thấp thoáng -->
      <rect x="256" y="76" width="56" height="30" rx="4" fill="#9a4424" stroke="${INK}" stroke-width="2"/>
      <rect x="264" y="82" width="40" height="16" rx="3" fill="#ff9e3d" stroke="${INK}" stroke-width="1.6"/>
      <!-- Bao bột mì -->
      <path d="M254 114 C252 124, 250 136, 256 138 L280 138 C286 136, 284 124, 282 114 Q268 110 254 114 Z" fill="#f7edd6" stroke="${INK}" stroke-width="2.2"/>
      <path d="M262 112 L274 112" stroke="#c97a36" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M286 118 C285 126, 284 136, 289 138 L310 138 C315 136, 314 126, 312 118 Q299 115 286 118 Z" fill="#efe1c1" stroke="${INK}" stroke-width="2.2"/>

      <!-- Mái hiên sọc vàng mật - nâu gỗ -->
      <path d="M16 42 L344 42 L352 64 L8 64 Z" fill="#fff3d1" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M36 42 L32 64 L58 64 L60 42 Z M86 42 L84 64 L110 64 L112 42 Z M138 42 L138 64 L164 64 L164 42 Z M190 42 L192 64 L218 64 L216 42 Z M242 42 L246 64 L272 64 L268 42 Z M294 42 L300 64 L326 64 L320 42 Z" fill="#d98726"/>
      <path d="M8 64 Q22 72 36 64 Q50 72 64 64 Q78 72 92 64 Q106 72 120 64 Q134 72 148 64 Q162 72 176 64 Q190 72 204 64 Q218 72 232 64 Q246 72 260 64 Q274 72 288 64 Q302 72 316 64 Q330 72 352 64" fill="none" stroke="${INK}" stroke-width="2.6"/>
    `;
  }

  if (stageId === 'stage_3') {
    // Tiệm Hoa Cuối Dốc: mái kính nhà kính Đà Lạt, chậu đất nung, cẩm tú cầu & hoa nhiều màu
    return `
      <!-- Mái nhà kính khung xanh ngọc trong sương -->
      <path d="M14 44 L36 12 L324 12 L346 44 Z" fill="#9cd3c2" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/>
      <path d="M56 12 L42 44 M102 12 L94 44 M148 12 L144 44 M194 12 L196 44 M240 12 L248 44 M286 12 L300 44" stroke="#2f6659" stroke-width="2.4"/>
      <path d="M36 18 L120 18 L112 36 L26 36 Z" fill="#e6fbf6" opacity="0.4"/>
      <!-- Thân nhà kính tường gỗ xanh kem -->
      <rect x="22" y="44" width="316" height="94" fill="#dcece0" stroke="${INK}" stroke-width="3.2"/>
      <!-- Chân tường đá chẻ Đà Lạt -->
      <rect x="22" y="114" width="316" height="24" fill="#8d9b8e" stroke="${INK}" stroke-width="2.6"/>

      <!-- Cửa kính trưng bày hoa bên trái -->
      <rect x="34" y="64" width="118" height="58" rx="5" fill="url(#flowerGlow)" stroke="${INK}" stroke-width="3"/>
      <!-- Giỏ hoa treo trong kính -->
      <line x1="64" y1="64" x2="64" y2="76" stroke="${INK}" stroke-width="1.8"/>
      <circle cx="64" cy="80" r="9" fill="#52b768" stroke="${INK}" stroke-width="1.8"/>
      <circle cx="60" cy="79" r="3.5" fill="#f472b6"/>
      <circle cx="68" cy="80" r="3.5" fill="#facc15"/>
      <line x1="118" y1="64" x2="118" y2="76" stroke="${INK}" stroke-width="1.8"/>
      <circle cx="118" cy="80" r="9" fill="#52b768" stroke="${INK}" stroke-width="1.8"/>
      <circle cx="115" cy="79" r="3.5" fill="#60a5fa"/>
      <circle cx="122" cy="81" r="3.5" fill="#c084fc"/>
      <!-- Cửa kính phải (nhà kính cẩm tú cầu) -->
      <rect x="218" y="64" width="106" height="58" rx="5" fill="url(#flowerGlow)" stroke="${INK}" stroke-width="3"/>
      <line x1="271" y1="64" x2="271" y2="122" stroke="#366b5d" stroke-width="2.4"/>
      <circle cx="246" cy="100" r="12" fill="#4f9e5a" stroke="${INK}" stroke-width="1.8"/>
      <circle cx="242" cy="96" r="6" fill="#60a5fa" stroke="${INK}" stroke-width="1.5"/>
      <circle cx="252" cy="98" r="5" fill="#93c5fd" stroke="${INK}" stroke-width="1.5"/>
      <circle cx="296" cy="100" r="12" fill="#4f9e5a" stroke="${INK}" stroke-width="1.8"/>
      <circle cx="294" cy="95" r="6" fill="#fb7185" stroke="${INK}" stroke-width="1.5"/>
      <circle cx="303" cy="99" r="5" fill="#fde047" stroke="${INK}" stroke-width="1.5"/>

      <!-- Cửa gỗ xanh tiệm hoa ở giữa -->
      <rect x="162" y="62" width="46" height="76" rx="4" fill="#3a7a61" stroke="${INK}" stroke-width="3"/>
      <rect x="169" y="70" width="32" height="38" rx="3" fill="url(#flowerGlow)" stroke="${INK}" stroke-width="2.2"/>
      <circle cx="200" cy="112" r="2.8" fill="#fde047" stroke="${INK}" stroke-width="1.4"/>

      <!-- Mái hiên sọc xanh lá - kem -->
      <path d="M16 44 L344 44 L352 64 L8 64 Z" fill="#f7faee" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M36 44 L32 64 L58 64 L60 44 Z M86 44 L84 64 L110 64 L112 44 Z M138 44 L138 64 L164 64 L164 44 Z M190 44 L192 64 L218 64 L216 44 Z M242 44 L246 64 L272 64 L268 44 Z M294 44 L300 64 L326 64 L320 44 Z" fill="#3c8d5e"/>

      <!-- Hàng chậu đất nung hoa rực rỡ bày ngoài hiên -->
      <g>
        <path d="M40 122 L62 122 L59 138 L43 138 Z" fill="#c96a3b" stroke="${INK}" stroke-width="2"/>
        <circle cx="51" cy="116" r="10" fill="#4ea353" stroke="${INK}" stroke-width="2"/>
        <circle cx="47" cy="114" r="4.5" fill="#f472b6" stroke="${INK}" stroke-width="1.2"/>
        <circle cx="55" cy="112" r="4.2" fill="#facc15" stroke="${INK}" stroke-width="1.2"/>

        <path d="M84 122 L106 122 L103 138 L87 138 Z" fill="#c96a3b" stroke="${INK}" stroke-width="2"/>
        <circle cx="95" cy="116" r="10" fill="#4ea353" stroke="${INK}" stroke-width="2"/>
        <circle cx="92" cy="113" r="5" fill="#60a5fa" stroke="${INK}" stroke-width="1.2"/>
        <circle cx="99" cy="116" r="4" fill="#c084fc" stroke="${INK}" stroke-width="1.2"/>

        <path d="M244 122 L266 122 L263 138 L247 138 Z" fill="#c96a3b" stroke="${INK}" stroke-width="2"/>
        <circle cx="255" cy="116" r="10" fill="#4ea353" stroke="${INK}" stroke-width="2"/>
        <circle cx="252" cy="113" r="4.5" fill="#fb923c" stroke="${INK}" stroke-width="1.2"/>
        <circle cx="259" cy="115" r="4.2" fill="#fef08a" stroke="${INK}" stroke-width="1.2"/>

        <path d="M286 122 L308 122 L305 138 L289 138 Z" fill="#c96a3b" stroke="${INK}" stroke-width="2"/>
        <circle cx="297" cy="116" r="10" fill="#4ea353" stroke="${INK}" stroke-width="2"/>
        <circle cx="294" cy="114" r="4.5" fill="#f43f5e" stroke="${INK}" stroke-width="1.2"/>
        <circle cx="301" cy="112" r="4" fill="#fbcfe8" stroke="${INK}" stroke-width="1.2"/>
      </g>
    `;
  }

  if (stageId === 'stage_4') {
    // Trận Trùm Phố Dốc Đà Lạt: trời tối mây lốc xoáy, sấm chớp, dãy 3 mái tiệm dưới dốc và cổng đèn cuối phố
    return `
      <!-- Bầu trời bão lốc tối hơn & mây xoáy tím-xanh -->
      <rect x="0" y="0" width="360" height="140" rx="10" fill="#1e2438"/>
      <ellipse cx="180" cy="30" rx="156" ry="34" fill="#2d3652" opacity="0.9"/>
      <ellipse cx="102" cy="24" rx="76" ry="22" fill="#161c2e"/>
      <ellipse cx="264" cy="24" rx="80" ry="22" fill="#161c2e"/>
      <!-- Cơn lốc xoáy ở chính giữa bầu trời dốc phố -->
      <g transform="translate(180 54)">
        <path d="M-38 -22 Q0 -34 38 -22 Q46 -4 26 6 Q0 14 -26 6 Q-46 -4 -38 -22 Z" fill="#324b6b" stroke="${INK}" stroke-width="2.6"/>
        <path d="M-22 6 C-12 18, 18 18, 22 6 C14 26, -10 26, -12 36 C-2 42, 8 42, 6 48 C-2 52, -6 46, -4 38" fill="#4f83b8" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
        <!-- Tia sét vàng sắc lẹm hai bên cơn bão -->
        <path d="M-54 -14 L-66 4 L-56 6 L-64 24" fill="none" stroke="#fde047" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M54 -14 L66 4 L56 6 L64 24" fill="none" stroke="#fde047" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- Mắt bão sáng rực -->
        <ellipse cx="-11" cy="-8" rx="6" ry="4" fill="#7dd3fc" stroke="${INK}" stroke-width="1.6"/>
        <ellipse cx="11" cy="-8" rx="6" ry="4" fill="#7dd3fc" stroke="${INK}" stroke-width="1.6"/>
      </g>
      <!-- Rặng thông dốc hai bên -->
      <path d="M0 100 L18 54 L36 100 L54 64 L74 108 L286 108 L306 62 L326 100 L344 56 L360 100 L360 138 L0 138 Z" fill="#1d3033" stroke="${INK}" stroke-width="2"/>
      <!-- 3 mái tiệm nhỏ nối tiếp xuống dốc (Giày -> Bánh -> Hoa) -->
      <!-- Tiệm Giày bên trái -->
      <rect x="26" y="88" width="84" height="50" rx="4" fill="#a86836" stroke="${INK}" stroke-width="2.6"/>
      <path d="M22 88 L114 88 L118 100 L18 100 Z" fill="#c94a38" stroke="${INK}" stroke-width="2.4"/>
      <rect x="38" y="106" width="32" height="22" rx="3" fill="#ffe082" stroke="${INK}" stroke-width="2"/>
      <rect x="78" y="106" width="22" height="32" rx="3" fill="#7c4720" stroke="${INK}" stroke-width="2"/>
      <!-- Tiệm Hoa bên phải -->
      <rect x="250" y="88" width="84" height="50" rx="4" fill="#89b8a2" stroke="${INK}" stroke-width="2.6"/>
      <path d="M246 88 L338 88 L342 100 L242 100 Z" fill="#3c8d5e" stroke="${INK}" stroke-width="2.4"/>
      <rect x="262" y="106" width="32" height="22" rx="3" fill="#e6f7d6" stroke="${INK}" stroke-width="2"/>
      <rect x="302" y="106" width="22" height="32" rx="3" fill="#3a7a61" stroke="${INK}" stroke-width="2"/>
      <!-- Con dốc đá chính giữa & Quầy cuối phố có đèn vàng rực -->
      <path d="M132 138 L156 104 L204 104 L228 138 Z" fill="#747e8c" stroke="${INK}" stroke-width="2.4"/>
      <rect x="144" y="110" width="72" height="28" rx="4" fill="#9c5628" stroke="${INK}" stroke-width="2.6"/>
      <path d="M138 112 L148 98 L212 98 L222 112 Z" fill="#f5b74e" stroke="${INK}" stroke-width="2.4"/>
      <circle cx="180" cy="119" r="7" fill="#ffe066" stroke="${INK}" stroke-width="1.8"/>
      <!-- Lá bay trong gió -->
      <ellipse cx="122" cy="72" rx="6" ry="2.8" transform="rotate(-24 122 72)" fill="#74c365" stroke="${INK}" stroke-width="1.4"/>
      <ellipse cx="236" cy="78" rx="6" ry="2.8" transform="rotate(20 236 78)" fill="#f59e0b" stroke="${INK}" stroke-width="1.4"/>
    `;
  }

  // Fallback mặt tiền gỗ Đà Lạt chung nếu sau này thêm tiệm mới vào SHOP_STREET
  return `
    <path d="M12 42 L30 14 L330 14 L348 42 Z" fill="#7c5032" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/>
    <rect x="22" y="42" width="316" height="96" fill="#ebd4ae" stroke="${INK}" stroke-width="3.2"/>
    <rect x="38" y="64" width="110" height="58" rx="5" fill="url(#warmWindowGlow)" stroke="${INK}" stroke-width="3"/>
    <rect x="160" y="62" width="52" height="76" rx="4" fill="#8a522a" stroke="${INK}" stroke-width="3"/>
    <rect x="224" y="64" width="98" height="58" rx="5" fill="url(#warmWindowGlow)" stroke="${INK}" stroke-width="3"/>
    <path d="M16 42 L344 42 L352 64 L8 64 Z" fill="#d98726" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  `;
}

/**
 * Cửa cuốn kéo xuống + ổ khóa đồng lớn khi tiệm chưa mở.
 */
function renderClosedShutterOverlay(): string {
  const slats: string[] = [];
  for (let y = 68; y <= 132; y += 8) {
    slats.push(`<line x1="27" y1="${y}" x2="333" y2="${y}" stroke="#5b534b" stroke-width="1.8"/>`);
    slats.push(`<line x1="27" y1="${y + 2}" x2="333" y2="${y + 2}" stroke="#b8afa3" stroke-width="1" opacity="0.6"/>`);
  }
  return `
    <g class="td-facade-shutter" data-shutter="closed">
      <!-- Bóng phủ tối dịu toàn mặt tiền -->
      <rect x="22" y="42" width="316" height="96" fill="#231914" opacity="0.34"/>
      <!-- Hộp cửa cuốn -->
      <rect x="24" y="58" width="312" height="10" rx="2" fill="#6f665d" stroke="${INK}" stroke-width="2.6"/>
      <!-- Lá cửa cuốn kéo kín xuống nền -->
      <rect x="26" y="66" width="308" height="72" fill="#9a9186" stroke="${INK}" stroke-width="3"/>
      ${slats.join('')}
      <!-- Thanh khóa dưới -->
      <rect x="26" y="129" width="308" height="9" fill="#6d645b" stroke="${INK}" stroke-width="2.5"/>
      <!-- Ổ khóa đồng to ở chính giữa cửa cuốn -->
      <g transform="translate(180 104)">
        <circle cx="0" cy="4" r="24" fill="#1e1510" opacity="0.35"/>
        <!-- Móc khóa sắt -->
        <path d="M-10 -2 L-10 -12 C-10 -21, 10 -21, 10 -12 L10 -2" fill="none" stroke="#d8dee9" stroke-width="5.5" stroke-linecap="round"/>
        <path d="M-10 -2 L-10 -12 C-10 -21, 10 -21, 10 -12 L10 -2" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
        <!-- Thân ổ khóa đồng vàng -->
        <rect x="-15" y="-3" width="30" height="24" rx="5" fill="#e5a938" stroke="${INK}" stroke-width="3"/>
        <rect x="-11" y="0" width="9" height="18" rx="2" fill="#fae08c" opacity="0.5"/>
        <!-- Lỗ chìa khóa -->
        <circle cx="0" cy="7" r="3.4" fill="${INK}"/>
        <path d="M-2 9 L2 9 L3 16 L-3 16 Z" fill="${INK}"/>
      </g>
    </g>
  `;
}

/**
 * Vẽ mặt tiền tiệm trên Con phố dốc Đà Lạt kèm trời mưa nhẹ, đèn vàng ấm, vỉa hè đá dốc.
 */
export function renderShopFacadeSvg(shop: ShopOnStreet, unlocked: boolean): string {
  const lampGlow = unlocked
    ? `
      <!-- Đèn vàng ấm hai bên hiên tỏa sáng xuống mặt phố mưa -->
      <circle cx="30" cy="55" r="26" fill="url(#lanternGlow)"/>
      <circle cx="330" cy="55" r="26" fill="url(#lanternGlow)"/>
      <rect x="25" y="49" width="10" height="13" rx="3" fill="#ffe082" stroke="${INK}" stroke-width="2"/>
      <rect x="325" y="49" width="10" height="13" rx="3" fill="#ffe082" stroke="${INK}" stroke-width="2"/>
    `
    : `
      <!-- Đèn tắt khi tiệm chưa mở -->
      <rect x="25" y="49" width="10" height="13" rx="3" fill="#6b625a" stroke="${INK}" stroke-width="2"/>
      <rect x="325" y="49" width="10" height="13" rx="3" fill="#6b625a" stroke="${INK}" stroke-width="2"/>
    `;

  const rainOverlay = `
    <g stroke="#cdefff" stroke-width="1.3" stroke-linecap="round" opacity="${unlocked ? '0.45' : '0.35'}">
      <line x1="24" y1="6" x2="18" y2="20"/>
      <line x1="78" y1="2" x2="72" y2="17"/>
      <line x1="142" y1="5" x2="136" y2="18"/>
      <line x1="216" y1="3" x2="210" y2="16"/>
      <line x1="284" y1="6" x2="278" y2="19"/>
      <line x1="342" y1="10" x2="336" y2="24"/>
      <line x1="12" y1="78" x2="6" y2="94"/>
      <line x1="354" y1="84" x2="348" y2="100"/>
    </g>
  `;

  return `
    <svg class="td-shop-facade-svg" viewBox="0 0 360 154" aria-hidden="true">
      <defs>
        <linearGradient id="dalatSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#38495c"/>
          <stop offset="100%" stop-color="#586c7d"/>
        </linearGradient>
        <radialGradient id="warmWindowGlow" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stop-color="#fff5c0"/>
          <stop offset="65%" stop-color="#f6c768"/>
          <stop offset="100%" stop-color="#c98438"/>
        </radialGradient>
        <radialGradient id="bakeryGlow" cx="50%" cy="38%" r="68%">
          <stop offset="0%" stop-color="#fff3b8"/>
          <stop offset="60%" stop-color="#f5b74e"/>
          <stop offset="100%" stop-color="#be6f28"/>
        </radialGradient>
        <radialGradient id="flowerGlow" cx="50%" cy="38%" r="68%">
          <stop offset="0%" stop-color="#fffce0"/>
          <stop offset="62%" stop-color="#d9f0c7"/>
          <stop offset="100%" stop-color="#7eb38a"/>
        </radialGradient>
        <radialGradient id="lanternGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffe57f" stop-opacity="0.82"/>
          <stop offset="55%" stop-color="#ffb74d" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="#ffb74d" stop-opacity="0"/>
        </radialGradient>
      </defs>

      <!-- Trời chiều mưa Đà Lạt & rặng thông mờ phía sau mái tiệm -->
      <rect x="0" y="0" width="360" height="142" rx="10" fill="url(#dalatSky)"/>
      <path d="M0 32 L14 10 L26 32 L40 16 L54 36 L306 36 L322 14 L336 32 L348 12 L360 32 L360 60 L0 60 Z" fill="#2d4240" opacity="0.65"/>

      <!-- Kiến trúc mặt tiền từng tiệm -->
      ${renderFacadeInterior(shop.stageId)}

      <!-- Cửa cuốn + ổ khóa nếu tiệm chưa mở -->
      ${unlocked ? '' : renderClosedShutterOverlay()}

      <!-- Đèn vàng ấm hai bên hiên -->
      ${lampGlow}

      <!-- Vỉa hè lát đá dốc ướt mưa phản chiếu ánh đèn vàng -->
      <path d="M0 137 L360 137 L360 154 L0 154 Z" fill="#5b6470" stroke="${INK}" stroke-width="2.4"/>
      <line x1="0" y1="145" x2="360" y2="145" stroke="#3c434d" stroke-width="1.5"/>
      <path d="M52 137 L48 154 M112 137 L108 154 M176 137 L172 154 M242 137 L238 154 M304 137 L300 154" stroke="#3c434d" stroke-width="1.5"/>
      ${
        unlocked
          ? `<ellipse cx="95" cy="147" rx="34" ry="4" fill="#ffe082" opacity="0.34"/>
             <ellipse cx="268" cy="147" rx="32" ry="4" fill="#ffe082" opacity="0.3"/>`
          : `<ellipse cx="180" cy="147" rx="46" ry="3.5" fill="#9cc6e0" opacity="0.28"/>`
      }

      <!-- Hạt mưa rơi nhẹ -->
      ${rainOverlay}
    </svg>
  `;
}

/**
 * Góc con dốc nối dài phía cuối phố — chừa chỗ sẵn cho những tiệm mới sau này.
 */
export function renderStreetExtensionSvg(): string {
  return `
    <svg class="td-street-more-svg" viewBox="0 0 360 74" aria-hidden="true">
      <defs>
        <linearGradient id="mistRoad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#485a6c"/>
          <stop offset="100%" stop-color="#2c241e"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="360" height="74" rx="10" fill="url(#mistRoad)"/>
      <!-- Rặng thông mờ Đà Lạt -->
      <path d="M0 44 L22 14 L42 44 L66 18 L90 44 L268 44 L292 16 L316 44 L338 20 L360 44 L360 74 L0 74 Z" fill="#2c413e" opacity="0.72"/>
      <!-- Mặt đường dốc uốn lượn đi tiếp -->
      <path d="M126 74 Q158 50 176 34 L196 34 Q212 52 246 74 Z" fill="#6b7480" stroke="${INK}" stroke-width="2.4"/>
      <path d="M180 68 L184 56 M185 48 L186 40" stroke="#e2d4b7" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
      <!-- Đèn đường cổ Đà Lạt -->
      <line x1="112" y1="22" x2="112" y2="66" stroke="${INK}" stroke-width="3.6"/>
      <circle cx="112" cy="20" r="14" fill="#ffe082" opacity="0.25"/>
      <circle cx="112" cy="20" r="5" fill="#fff0a6" stroke="${INK}" stroke-width="2"/>
      <!-- Hàng rào gỗ báo sắp mở tiệm mới -->
      <rect x="234" y="46" width="62" height="14" rx="3" fill="#e6a938" stroke="${INK}" stroke-width="2.2"/>
      <path d="M244 46 L238 60 M260 46 L254 60 M276 46 L270 60 M290 46 L284 60" stroke="${INK}" stroke-width="2.5"/>
      <line x1="242" y1="60" x2="242" y2="69" stroke="${INK}" stroke-width="3"/>
      <line x1="288" y1="60" x2="288" y2="69" stroke="${INK}" stroke-width="3"/>
    </svg>
  `;
}

/**
 * Bản đồ minh hoạ trung tâm Đà Lạt (Khu Hoà Bình • Chợ Đà Lạt • Hồ Xuân Hương)
 * dùng làm nền cho các điểm chọn phố thật trong REAL_STREET_STAGES.
 */
export function renderDalatMapBgSvg(unlocked: boolean): string {
  return `
    <svg class="td-dalat-map-svg ${unlocked ? '' : 'locked'}" viewBox="0 0 360 190" aria-hidden="true">
      <defs>
        <linearGradient id="dalatHillBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${unlocked ? '#cfe2b8' : '#7a877d'}"/>
          <stop offset="55%" stop-color="${unlocked ? '#b7d4a0' : '#65726b'}"/>
          <stop offset="100%" stop-color="${unlocked ? '#9ec08d' : '#56625c'}"/>
        </linearGradient>
        <linearGradient id="xuanHuongLake" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${unlocked ? '#70c5ea' : '#58788a'}"/>
          <stop offset="100%" stop-color="${unlocked ? '#4697c8' : '#456070'}"/>
        </linearGradient>
      </defs>
      <!-- Nền đồi thông Đà Lạt -->
      <rect x="0" y="0" width="360" height="190" rx="12" fill="url(#dalatHillBg)" stroke="${INK}" stroke-width="2.6"/>
      <!-- Đường đồng mức đồi dốc -->
      <path d="M-10 46 Q95 20 185 48 T370 36" fill="none" stroke="#ffffff" stroke-width="1.6" opacity="0.28"/>
      <path d="M-10 112 Q110 88 210 116 T370 100" fill="none" stroke="#ffffff" stroke-width="1.6" opacity="0.24"/>
      <path d="M-10 162 Q130 144 240 166 T370 150" fill="none" stroke="#ffffff" stroke-width="1.6" opacity="0.22"/>

      <!-- Hồ Xuân Hương góc dưới phải -->
      <path d="M236 188 C242 152, 274 134, 314 132 C336 131, 352 138, 360 148 L360 188 Z" fill="url(#xuanHuongLake)" stroke="#2c5d7a" stroke-width="2.2"/>
      <path d="M276 156 Q304 150 330 156" fill="none" stroke="#d9f4ff" stroke-width="1.6" stroke-linecap="round" opacity="0.7"/>
      <text x="308" y="176" text-anchor="middle" font-size="8.5" font-weight="700" fill="#eef9ff" opacity="0.9">Hồ Xuân Hương</text>

      <!-- Cụm thông xanh Đà Lạt rải rác -->
      <g fill="${unlocked ? '#3d824d' : '#4a5a52'}" stroke="${INK}" stroke-width="1.6">
        <circle cx="26" cy="34" r="11"/><circle cx="38" cy="28" r="9"/>
        <circle cx="330" cy="36" r="12"/><circle cx="316" cy="28" r="9"/>
        <circle cx="28" cy="156" r="12"/><circle cx="42" cy="166" r="10"/>
        <circle cx="176" cy="158" r="10"/><circle cx="190" cy="164" r="8"/>
      </g>

      <!-- Mạng đường dốc Đà Lạt nối Chợ Đà Lạt -> Tăng Bạt Hổ -> Phố Cà Phê Khu Hoà Bình -->
      <path d="M36 130 Q84 106 124 88 Q166 68 228 62 Q278 58 318 82" fill="none" stroke="${INK}" stroke-width="11" stroke-linecap="round"/>
      <path d="M36 130 Q84 106 124 88 Q166 68 228 62 Q278 58 318 82" fill="none" stroke="${unlocked ? '#f3e3c3' : '#aeb5b0'}" stroke-width="7" stroke-linecap="round"/>
      <path d="M124 88 Q144 120 186 128 Q232 136 266 116" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>
      <path d="M124 88 Q144 120 186 128 Q232 136 266 116" fill="none" stroke="${unlocked ? '#efe0be' : '#a6ada8'}" stroke-width="5.5" stroke-linecap="round"/>
      <!-- Nét đứt chỉ dẫn tuyến phố -->
      <path d="M56 120 Q116 92 228 62" fill="none" stroke="#9b784f" stroke-width="1.6" stroke-dasharray="5 5"/>

      <!-- Biểu tượng nhỏ Chợ Đà Lạt ở gần góc trái dưới đường -->
      <g transform="translate(56 128)">
        <rect x="-14" y="-8" width="28" height="16" rx="3" fill="${unlocked ? '#e39c44' : '#7b7870'}" stroke="${INK}" stroke-width="1.8"/>
        <path d="M-16 -8 L0 -16 L16 -8 Z" fill="${unlocked ? '#b84830' : '#5e5a55'}" stroke="${INK}" stroke-width="1.8"/>
        <text x="0" y="20" text-anchor="middle" font-size="8" font-weight="700" fill="${INK}">Chợ Đà Lạt</text>
      </g>

      <!-- Biểu tượng Khu Hoà Bình ở phía trên -->
      <g transform="translate(186 32)">
        <circle cx="0" cy="0" r="9" fill="${unlocked ? '#f5cb5c' : '#85857f'}" stroke="${INK}" stroke-width="1.8"/>
        <text x="0" y="-12" text-anchor="middle" font-size="8" font-weight="700" fill="${INK}">Khu Hoà Bình</text>
      </g>

      <!-- Ghi nguồn OpenStreetMap trên bản đồ -->
      <text x="8" y="183" font-size="7.5" font-weight="600" fill="${INK}" opacity="0.72">© OpenStreetMap contributors</text>
    </svg>
  `;
}

