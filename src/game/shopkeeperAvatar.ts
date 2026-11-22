import type { Equipped } from '../core/equipment';
import type { ElementType } from '../core/types';

const INK = '#2b1a12';

function renderUmbrellaBack(el: ElementType): string {
  const pal: Record<ElementType, { hi: string; mid: string; dark: string; tip: string }> = {
    kim: { hi: '#e2e8f0', mid: '#94a3b8', dark: '#64748b', tip: '#cbd5e1' },
    moc: { hi: '#86d46b', mid: '#4fa647', dark: '#2f6e2d', tip: '#b57234' },
    thuy: { hi: '#7dd3fc', mid: '#38bdf8', dark: '#0284c7', tip: '#0c4a6e' },
    hoa: { hi: '#ff8066', mid: '#e53935', dark: '#a31b1b', tip: '#f59e0b' },
    tho: { hi: '#e0a968', mid: '#b37438', dark: '#7a481e', tip: '#8a4c1d' },
  };
  const c = pal[el];
  const drops =
    el === 'thuy'
      ? `<circle cx="38" cy="48" r="3" fill="#e0f2fe" stroke="${INK}" stroke-width="1.5"/>
         <circle cx="96" cy="36" r="2.6" fill="#e0f2fe" stroke="${INK}" stroke-width="1.5"/>`
      : '';
  return `
    <g class="sk-layer-umbrella-back" data-gear-worn="umbrella-${el}">
      <!-- Shaft behind shoulder -->
      <line x1="48" y1="15" x2="66" y2="152" stroke="${INK}" stroke-width="6.5" stroke-linecap="round"/>
      <line x1="48" y1="16" x2="66" y2="150" stroke="${c.tip}" stroke-width="2.6" stroke-linecap="round"/>
      <!-- Open umbrella canopy angled behind left shoulder so face stays 100% visible -->
      <g transform="rotate(-11 56 58)">
        <path d="M6 68 Q62 56 118 68 Q94 74 74 68 Q56 76 38 68 Q20 74 6 68 Z"
              fill="${c.dark}" stroke="${INK}" stroke-width="3.5"/>
        <path d="M5 68 C10 26, 42 18, 62 18 C82 18, 114 26, 119 68
                 Q98 62 82 70 Q70 62 62 70 Q54 62 42 70 Q26 62 5 68 Z"
              fill="${c.mid}" stroke="${INK}" stroke-width="4.2" stroke-linejoin="round"/>
        <path d="M22 44 C32 28, 46 23, 58 22 C44 34, 34 50, 28 65 Z" fill="${c.hi}" opacity="0.6"/>
        <path d="M62 18 C48 34, 42 50, 42 69" fill="none" stroke="${INK}" stroke-width="2.6"/>
        <path d="M62 18 C76 34, 82 50, 82 69" fill="none" stroke="${INK}" stroke-width="2.6"/>
        <line x1="62" y1="18" x2="62" y2="69" stroke="${INK}" stroke-width="2.6"/>
        ${drops}
      </g>
    </g>
  `;
}

function renderUmbrellaHandleFront(el: ElementType): string {
  const handleCol: Record<ElementType, string> = {
    kim: '#cbd5e1',
    moc: '#b57234',
    thuy: '#334155',
    hoa: '#f59e0b',
    tho: '#8a4c1d',
  };
  const hc = handleCol[el];
  return `
    <g class="sk-layer-umbrella-handle">
      <line x1="64" y1="138" x2="68" y2="168" stroke="${INK}" stroke-width="6.5" stroke-linecap="round"/>
      <line x1="64" y1="138" x2="68" y2="168" stroke="${hc}" stroke-width="2.8" stroke-linecap="round"/>
      ${
        el === 'thuy'
          ? `<rect x="63" y="162" width="10" height="16" rx="4" transform="rotate(-7 68 170)" fill="${hc}" stroke="${INK}" stroke-width="3"/>`
          : `<path d="M68 166 L69 175 C70 183, 56 184, 55 175" fill="none" stroke="${INK}" stroke-width="7.5" stroke-linecap="round"/>
             <path d="M68 166 L69 175 C70 183, 56 184, 55 175" fill="none" stroke="${hc}" stroke-width="3.2" stroke-linecap="round"/>`
      }
    </g>
  `;
}

function renderShoes(el?: ElementType): string {
  if (!el) {
    // Default cozy shop slippers
    return `
      <g class="sk-layer-shoes-default">
        <path d="M77 236 C77 227, 94 226, 104 231 L104 246 C94 249, 77 248, 77 236 Z" fill="#d9b482" stroke="${INK}" stroke-width="3.8"/>
        <path d="M116 231 C126 226, 143 227, 143 236 C143 248, 126 249, 116 246 Z" fill="#d9b482" stroke="${INK}" stroke-width="3.8"/>
      </g>
    `;
  }
  if (el === 'kim') {
    // Giày Tây Mũi Bạc
    return `
      <g class="sk-layer-shoes" data-gear-worn="shoes-kim">
        <path d="M73 239 C73 229, 88 225, 105 227 L105 247 C90 250, 73 248, 73 239 Z" fill="#334155" stroke="${INK}" stroke-width="3.8"/>
        <path d="M74 239 C75 232, 84 230, 89 233 L88 245 C80 246, 74 244, 74 239 Z" fill="#e2e8f0" stroke="${INK}" stroke-width="2.5"/>
        <path d="M115 227 C132 225, 147 229, 147 239 C147 248, 130 250, 115 247 Z" fill="#334155" stroke="${INK}" stroke-width="3.8"/>
        <path d="M131 233 C136 230, 145 232, 146 239 C146 244, 140 246, 132 245 Z" fill="#e2e8f0" stroke="${INK}" stroke-width="2.5"/>
      </g>
    `;
  }
  if (el === 'moc') {
    // Giày Vải xanh rêu
    return `
      <g class="sk-layer-shoes" data-gear-worn="shoes-moc">
        <path d="M73 239 C73 228, 89 224, 105 227 L105 246 C91 249, 73 248, 73 239 Z" fill="#5c9447" stroke="${INK}" stroke-width="3.8"/>
        <path d="M74 242 L105 242 L105 247 C90 249, 74 248, 74 242 Z" fill="#fef3d6" stroke="${INK}" stroke-width="2.5"/>
        <path d="M74 238 C76 232, 82 232, 85 239 Z" fill="#fef3d6" stroke="${INK}" stroke-width="2"/>
        <path d="M115 227 C131 224, 147 228, 147 239 C147 248, 129 249, 115 246 Z" fill="#5c9447" stroke="${INK}" stroke-width="3.8"/>
        <path d="M115 242 L146 242 C146 248, 130 249, 115 247 Z" fill="#fef3d6" stroke="${INK}" stroke-width="2.5"/>
        <path d="M135 239 C138 232, 144 232, 146 238 Z" fill="#fef3d6" stroke="${INK}" stroke-width="2"/>
      </g>
    `;
  }
  if (el === 'thuy') {
    // Sandal Quai Hậu xanh biển
    return `
      <g class="sk-layer-shoes" data-gear-worn="shoes-thuy">
        <!-- Feet skin + blue straps + rugged sole -->
        <path d="M75 238 C76 230, 90 228, 104 230 L104 245 L75 244 Z" fill="#ffdbb8" stroke="${INK}" stroke-width="3.2"/>
        <rect x="73" y="241" width="33" height="7" rx="3.5" fill="#0369a1" stroke="${INK}" stroke-width="3.2"/>
        <path d="M80 233 L103 232 M85 227 L91 241" stroke="#38bdf8" stroke-width="5.5" stroke-linecap="round"/>
        <path d="M80 233 L103 232" stroke="${INK}" stroke-width="1.6"/>
        <path d="M116 230 C130 228, 144 230, 145 238 L145 244 L116 245 Z" fill="#ffdbb8" stroke="${INK}" stroke-width="3.2"/>
        <rect x="114" y="241" width="33" height="7" rx="3.5" fill="#0369a1" stroke="${INK}" stroke-width="3.2"/>
        <path d="M117 232 L140 233 M135 227 L129 241" stroke="#38bdf8" stroke-width="5.5" stroke-linecap="round"/>
        <path d="M117 232 L140 233" stroke="${INK}" stroke-width="1.6"/>
      </g>
    `;
  }
  if (el === 'hoa') {
    // Giày Thể Thao Đỏ
    return `
      <g class="sk-layer-shoes" data-gear-worn="shoes-hoa">
        <path d="M71 239 C71 228, 88 223, 105 226 L105 246 C88 249, 71 248, 71 239 Z" fill="#e53935" stroke="${INK}" stroke-width="3.8"/>
        <path d="M76 237 Q90 233 102 238" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M72 243 L105 243 L105 248 C88 250, 72 249, 72 243 Z" fill="#ffffff" stroke="${INK}" stroke-width="2.6"/>
        <path d="M115 226 C132 223, 149 228, 149 239 C149 248, 132 249, 115 246 Z" fill="#e53935" stroke="${INK}" stroke-width="3.8"/>
        <path d="M118 238 Q130 233 144 237" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M115 243 L148 243 C148 249, 132 250, 115 248 Z" fill="#ffffff" stroke="${INK}" stroke-width="2.6"/>
      </g>
    `;
  }
  // tho: Bốt Da Nâu
  return `
    <g class="sk-layer-shoes" data-gear-worn="shoes-tho">
      <path d="M84 216 L105 216 L105 247 C89 250, 73 248, 73 238 C73 231, 80 228, 84 226 Z" fill="#9c5927" stroke="${INK}" stroke-width="3.8" stroke-linejoin="round"/>
      <line x1="87" y1="224" x2="97" y2="224" stroke="#f5d7a1" stroke-width="2.2" stroke-linecap="round"/>
      <line x1="87" y1="230" x2="97" y2="230" stroke="#f5d7a1" stroke-width="2.2" stroke-linecap="round"/>
      <rect x="73" y="242" width="33" height="6" rx="2.5" fill="#4f290e" stroke="${INK}" stroke-width="2.5"/>
      <path d="M115 216 L136 216 L136 226 C140 228, 147 231, 147 238 C147 248, 131 250, 115 247 Z" fill="#9c5927" stroke="${INK}" stroke-width="3.8" stroke-linejoin="round"/>
      <line x1="123" y1="224" x2="133" y2="224" stroke="#f5d7a1" stroke-width="2.2" stroke-linecap="round"/>
      <line x1="123" y1="230" x2="133" y2="230" stroke="#f5d7a1" stroke-width="2.2" stroke-linecap="round"/>
      <rect x="114" y="242" width="33" height="6" rx="2.5" fill="#4f290e" stroke="${INK}" stroke-width="2.5"/>
    </g>
  `;
}

function renderBelt(el: ElementType): string {
  const pal: Record<ElementType, { strap: string; buckle: string }> = {
    kim: { strap: '#475569', buckle: '#fde047' },
    moc: { strap: '#558b42', buckle: '#e2e8f0' },
    thuy: { strap: '#1e4e8c', buckle: '#bae6fd' },
    hoa: { strap: '#991b1b', buckle: '#fbbf24' },
    tho: { strap: '#b06427', buckle: '#f5cb5c' },
  };
  const c = pal[el];
  return `
    <g class="sk-layer-belt" data-gear-worn="belt-${el}">
      <rect x="81" y="167" width="58" height="10" rx="3" fill="${c.strap}" stroke="${INK}" stroke-width="3"/>
      <rect x="103" y="165" width="14" height="14" rx="3" fill="${c.buckle}" stroke="${INK}" stroke-width="2.8"/>
      <rect x="107" y="169" width="6" height="6" rx="1" fill="${c.strap}"/>
    </g>
  `;
}

function renderJacket(el: ElementType): string {
  if (el === 'kim') {
    // Áo Gió Bạc
    return `
      <g class="sk-layer-jacket" data-gear-worn="jacket-kim">
        <!-- Sleeves -->
        <path d="M77 110 C64 118, 58 134, 58 156 L74 157 L82 132 Z" fill="#cbd5e1" stroke="${INK}" stroke-width="3.8" stroke-linejoin="round"/>
        <path d="M143 110 C156 118, 162 134, 162 156 L146 157 L138 132 Z" fill="#b4c2d4" stroke="${INK}" stroke-width="3.8" stroke-linejoin="round"/>
        <!-- Body -->
        <path d="M78 108 L142 108 L146 178 C126 184, 94 184, 74 178 Z" fill="#dbe4ef" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
        <path d="M90 105 Q110 119 130 105 L127 117 Q110 127 93 117 Z" fill="#f1f5f9" stroke="${INK}" stroke-width="3.5"/>
        <line x1="110" y1="118" x2="110" y2="181" stroke="${INK}" stroke-width="3.6"/>
        <path d="M84 128 L100 128" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" opacity="0.8"/>
        <line x1="82" y1="150" x2="98" y2="158" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
        <line x1="138" y1="150" x2="122" y2="158" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
      </g>
    `;
  }
  if (el === 'moc') {
    // Áo Khoác Kaki Xanh
    return `
      <g class="sk-layer-jacket" data-gear-worn="jacket-moc">
        <path d="M77 110 C64 118, 58 134, 58 156 L74 157 L82 132 Z" fill="#679b4e" stroke="${INK}" stroke-width="3.8" stroke-linejoin="round"/>
        <path d="M143 110 C156 118, 162 134, 162 156 L146 157 L138 132 Z" fill="#52823c" stroke="${INK}" stroke-width="3.8" stroke-linejoin="round"/>
        <!-- Open khaki coat showing cream sweater & belt slightly -->
        <path d="M77 108 L100 108 L102 180 L74 177 Z" fill="#6ea454" stroke="${INK}" stroke-width="3.8" stroke-linejoin="round"/>
        <path d="M143 108 L120 108 L118 180 L146 177 Z" fill="#5c9044" stroke="${INK}" stroke-width="3.8" stroke-linejoin="round"/>
        <path d="M86 104 L103 118 L92 126 L77 112 Z" fill="#8bc26c" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/>
        <path d="M134 104 L117 118 L128 126 L143 112 Z" fill="#7bb25e" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/>
        <rect x="81" y="132" width="15" height="14" rx="2.5" fill="#7bb25e" stroke="${INK}" stroke-width="2.6"/>
        <rect x="124" y="132" width="15" height="14" rx="2.5" fill="#6ca050" stroke="${INK}" stroke-width="2.6"/>
      </g>
    `;
  }
  if (el === 'thuy') {
    // Áo Mưa Trong (translucent glossy blue!)
    return `
      <g class="sk-layer-jacket" data-gear-worn="jacket-thuy">
        <path d="M76 110 C62 118, 56 135, 57 158 L74 159 L82 132 Z" fill="#5ec2f7" fill-opacity="0.78" stroke="${INK}" stroke-width="3.8" stroke-linejoin="round"/>
        <path d="M144 110 C158 118, 164 135, 163 158 L146 159 L138 132 Z" fill="#38bdf8" fill-opacity="0.78" stroke="${INK}" stroke-width="3.8" stroke-linejoin="round"/>
        <path d="M77 108 L143 108 L152 188 C126 194, 94 194, 68 188 Z" fill="#7dd3fc" fill-opacity="0.76" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
        <line x1="110" y1="115" x2="110" y2="191" stroke="${INK}" stroke-width="3.2"/>
        <circle cx="110" cy="128" r="3" fill="#ffffff" stroke="${INK}" stroke-width="2"/>
        <circle cx="110" cy="146" r="3" fill="#ffffff" stroke="${INK}" stroke-width="2"/>
        <circle cx="110" cy="164" r="3" fill="#ffffff" stroke="${INK}" stroke-width="2"/>
        <path d="M84 124 L94 142" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.82"/>
        <path d="M132 132 L138 150" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.65"/>
      </g>
    `;
  }
  if (el === 'hoa') {
    // Áo Phao Đỏ (quilted red puffer)
    return `
      <g class="sk-layer-jacket" data-gear-worn="jacket-hoa">
        <path d="M75 110 C60 118, 54 136, 56 158 L75 158 L82 130 Z" fill="#e53935" stroke="${INK}" stroke-width="3.8" stroke-linejoin="round"/>
        <path d="M145 110 C160 118, 166 136, 164 158 L145 158 L138 130 Z" fill="#c62828" stroke="${INK}" stroke-width="3.8" stroke-linejoin="round"/>
        <path d="M76 108 C72 130, 72 158, 74 178 C94 184, 126 184, 146 178 C148 158, 148 130, 144 108 Z" fill="#ef4444" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
        <!-- Puffy horizontal ribs -->
        <path d="M75 130 Q110 135 145 130" fill="none" stroke="${INK}" stroke-width="3"/>
        <path d="M74 152 Q110 157 146 152" fill="none" stroke="${INK}" stroke-width="3"/>
        <path d="M88 104 Q110 116 132 104 L130 116 Q110 124 90 116 Z" fill="#dc2626" stroke="${INK}" stroke-width="3.4"/>
        <line x1="110" y1="116" x2="110" y2="181" stroke="${INK}" stroke-width="3.8"/>
        <path d="M84 120 L100 122" stroke="#fca5a5" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
      </g>
    `;
  }
  // tho: Áo Khoác Dạ Nâu
  return `
    <g class="sk-layer-jacket" data-gear-worn="jacket-tho">
      <path d="M77 110 C64 118, 58 135, 58 158 L74 159 L82 132 Z" fill="#b87a3d" stroke="${INK}" stroke-width="3.8" stroke-linejoin="round"/>
      <path d="M143 110 C156 118, 162 135, 162 158 L146 159 L138 132 Z" fill="#9a612c" stroke="${INK}" stroke-width="3.8" stroke-linejoin="round"/>
      <path d="M76 108 L100 108 L104 188 L70 185 Z" fill="#c78848" stroke="${INK}" stroke-width="3.8" stroke-linejoin="round"/>
      <path d="M144 108 L120 108 L116 188 L150 185 Z" fill="#aa6f34" stroke="${INK}" stroke-width="3.8" stroke-linejoin="round"/>
      <!-- Lapels -->
      <path d="M90 104 L106 134 L88 132 L76 114 Z" fill="#dda15e" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/>
      <path d="M130 104 L114 134 L132 132 L144 114 Z" fill="#c08242" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/>
      <circle cx="94" cy="148" r="3.2" fill="#4f2c14" stroke="${INK}" stroke-width="1.8"/>
      <circle cx="126" cy="148" r="3.2" fill="#4f2c14" stroke="${INK}" stroke-width="1.8"/>
      <circle cx="94" cy="166" r="3.2" fill="#4f2c14" stroke="${INK}" stroke-width="1.8"/>
      <circle cx="126" cy="166" r="3.2" fill="#4f2c14" stroke="${INK}" stroke-width="1.8"/>
    </g>
  `;
}

function renderBag(el: ElementType): string {
  if (el === 'hoa') {
    // Túi Đeo Hông Đỏ (crossbody sling across chest/waist!)
    return `
      <g class="sk-layer-bag" data-gear-worn="bag-hoa">
        <path d="M84 110 L143 162" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
        <path d="M84 110 L143 162" stroke="#b91c1c" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M94 146 C108 140, 134 146, 146 158 C142 174, 120 176, 98 164 Z"
              fill="#e53935" stroke="${INK}" stroke-width="3.6" stroke-linejoin="round"/>
        <path d="M104 154 L136 161" stroke="#fef08a" stroke-width="2.4" stroke-linecap="round"/>
      </g>
    `;
  }
  const pal: Record<ElementType, { strap: string; body: string; flap: string; clasp: string }> = {
    kim: { strap: '#64748b', body: '#94a3b8', flap: '#cbd5e1', clasp: '#f8fafc' },
    moc: { strap: '#4a7a36', body: '#679b4e', flap: '#89bd68', clasp: '#bef264' },
    thuy: { strap: '#0369a1', body: '#38bdf8', flap: '#7dd3fc', clasp: '#1e293b' },
    hoa: { strap: '#b91c1c', body: '#e53935', flap: '#ef4444', clasp: '#fde047' },
    tho: { strap: '#8a4c1d', body: '#b86d31', flap: '#d48b48', clasp: '#f5cb5c' },
  };
  const c = pal[el];
  return `
    <g class="sk-layer-bag" data-gear-worn="bag-${el}">
      <!-- Diagonal crossbody strap -->
      <path d="M84 109 L146 164" stroke="${INK}" stroke-width="8.5" stroke-linecap="round"/>
      <path d="M84 109 L146 164" stroke="${c.strap}" stroke-width="4" stroke-linecap="round"/>
      <!-- Hip pouch bag -->
      <rect x="134" y="160" width="34" height="30" rx="7" fill="${c.body}" stroke="${INK}" stroke-width="3.6"/>
      <path d="M134 166 C134 160, 168 160, 168 166 L166 177 C156 182, 146 182, 136 177 Z"
            fill="${c.flap}" stroke="${INK}" stroke-width="3"/>
      <rect x="147" y="172" width="8" height="9" rx="2.5" fill="${c.clasp}" stroke="${INK}" stroke-width="2.2"/>
    </g>
  `;
}

function renderWatchOnWrist(el: ElementType): string {
  const col: Record<ElementType, { strap: string; face: string }> = {
    kim: { strap: '#cbd5e1', face: '#ffffff' },
    moc: { strap: '#558b42', face: '#d9a76a' },
    thuy: { strap: '#0ea5e9', face: '#e0f2fe' },
    hoa: { strap: '#b91c1c', face: '#ef4444' },
    tho: { strap: '#a8642d', face: '#fff6dc' },
  };
  const c = col[el];
  return `
    <g class="sk-layer-watch" data-gear-worn="watch-${el}">
      <rect x="147" y="150" width="15" height="7" rx="3" fill="${c.strap}" stroke="${INK}" stroke-width="2.5"/>
      <circle cx="154.5" cy="153.5" r="5" fill="${c.face}" stroke="${INK}" stroke-width="2.4"/>
      <circle cx="154.5" cy="153.5" r="1.2" fill="${INK}"/>
    </g>
  `;
}

function renderGlasses(el: ElementType): string {
  if (el === 'kim') {
    // Kính Gọng Kim Loại (round silver wire frames)
    return `
      <g class="sk-layer-glasses" data-gear-worn="glasses-kim">
        <circle cx="96" cy="79" r="10.5" fill="#e0f2fe" fill-opacity="0.34" stroke="#94a3b8" stroke-width="3.2"/>
        <circle cx="96" cy="79" r="10.5" fill="none" stroke="${INK}" stroke-width="1.3"/>
        <circle cx="124" cy="79" r="10.5" fill="#e0f2fe" fill-opacity="0.34" stroke="#94a3b8" stroke-width="3.2"/>
        <circle cx="124" cy="79" r="10.5" fill="none" stroke="${INK}" stroke-width="1.3"/>
        <path d="M106.5 79 Q110 76 113.5 79" fill="none" stroke="#64748b" stroke-width="2.5"/>
        <line x1="79" y1="77" x2="85.5" y2="79" stroke="#64748b" stroke-width="2.5"/>
        <line x1="134.5" y1="79" x2="141" y2="77" stroke="#64748b" stroke-width="2.5"/>
        <path d="M90 74 L95 72" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.85"/>
      </g>
    `;
  }
  if (el === 'moc') {
    // Kính Gọng Tre (green bamboo frames + leaf accent)
    return `
      <g class="sk-layer-glasses" data-gear-worn="glasses-moc">
        <rect x="84" y="70" width="23" height="17" rx="6" fill="#ecfccb" fill-opacity="0.28" stroke="#5c9447" stroke-width="4"/>
        <rect x="84" y="70" width="23" height="17" rx="6" fill="none" stroke="${INK}" stroke-width="1.5"/>
        <rect x="113" y="70" width="23" height="17" rx="6" fill="#ecfccb" fill-opacity="0.28" stroke="#5c9447" stroke-width="4"/>
        <rect x="113" y="70" width="23" height="17" rx="6" fill="none" stroke="${INK}" stroke-width="1.5"/>
        <line x1="107" y1="77" x2="113" y2="77" stroke="#5c9447" stroke-width="3.6"/>
        <path d="M135 72 C139 66, 145 66, 144 73 C140 75, 137 74, 135 72 Z" fill="#84cc16" stroke="${INK}" stroke-width="1.8"/>
      </g>
    `;
  }
  if (el === 'thuy') {
    // Kính Tròng Xanh Biển (cool ocean sunglasses)
    return `
      <g class="sk-layer-glasses" data-gear-worn="glasses-thuy">
        <rect x="83" y="70" width="24" height="17" rx="6" fill="#0ea5e9" fill-opacity="0.82" stroke="#0c4a6e" stroke-width="3.5"/>
        <rect x="113" y="70" width="24" height="17" rx="6" fill="#0ea5e9" fill-opacity="0.82" stroke="#0c4a6e" stroke-width="3.5"/>
        <line x1="107" y1="76" x2="113" y2="76" stroke="#0c4a6e" stroke-width="3.5"/>
        <path d="M88 74 L97 74 L91 83" fill="none" stroke="#e0f2fe" stroke-width="2.4" stroke-linecap="round" opacity="0.85"/>
        <path d="M118 74 L127 74 L121 83" fill="none" stroke="#e0f2fe" stroke-width="2.4" stroke-linecap="round" opacity="0.85"/>
      </g>
    `;
  }
  if (el === 'hoa') {
    // Kính Râm Tròng Cam (warm fiery orange sunglasses!)
    return `
      <g class="sk-layer-glasses" data-gear-worn="glasses-hoa">
        <rect x="83" y="70" width="24" height="17" rx="6" fill="#ff7a29" fill-opacity="0.86" stroke="${INK}" stroke-width="3.6"/>
        <rect x="113" y="70" width="24" height="17" rx="6" fill="#ff7a29" fill-opacity="0.86" stroke="${INK}" stroke-width="3.6"/>
        <line x1="107" y1="76" x2="113" y2="76" stroke="${INK}" stroke-width="3.6"/>
        <path d="M88 74 L97 74 L91 82" fill="none" stroke="#fef08a" stroke-width="2.6" stroke-linecap="round" opacity="0.9"/>
        <path d="M118 74 L127 74 L121 82" fill="none" stroke="#fef08a" stroke-width="2.6" stroke-linecap="round" opacity="0.9"/>
      </g>
    `;
  }
  // tho: Kính Gọng Sừng
  return `
    <g class="sk-layer-glasses" data-gear-worn="glasses-tho">
      <rect x="83" y="70" width="24" height="17" rx="6" fill="#fef3c7" fill-opacity="0.22" stroke="#8a4b1d" stroke-width="4.4"/>
      <rect x="83" y="70" width="24" height="17" rx="6" fill="none" stroke="${INK}" stroke-width="1.4"/>
      <rect x="113" y="70" width="24" height="17" rx="6" fill="#fef3c7" fill-opacity="0.22" stroke="#8a4b1d" stroke-width="4.4"/>
      <rect x="113" y="70" width="24" height="17" rx="6" fill="none" stroke="${INK}" stroke-width="1.4"/>
      <line x1="107" y1="76" x2="113" y2="76" stroke="#8a4b1d" stroke-width="3.8"/>
    </g>
  `;
}

function renderHat(el: ElementType): string {
  if (el === 'kim') {
    // Nón Bảo Hiểm Bạc
    return `
      <g class="sk-layer-hat" data-gear-worn="hat-kim">
        <path d="M71 72 C69 32, 88 23, 110 23 C132 23, 151 32, 149 72 L144 82 L139 62 C126 54, 94 54, 81 62 L76 82 Z"
              fill="#cbd5e1" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
        <path d="M74 56 Q110 45 146 56 L142 64 Q110 54 78 64 Z" fill="#475569" stroke="${INK}" stroke-width="3.2"/>
        <circle cx="84" cy="59" r="2" fill="#e2e8f0"/>
        <circle cx="136" cy="59" r="2" fill="#e2e8f0"/>
        <path d="M84 37 C94 29, 108 27, 120 29" fill="none" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" opacity="0.85"/>
      </g>
    `;
  }
  if (el === 'moc') {
    // Mũ Len Xanh Rêu (cozy ribbed knitted beanie with pom-pom)
    return `
      <g class="sk-layer-hat" data-gear-worn="hat-moc">
        <circle cx="110" cy="20" r="10.5" fill="#77b058" stroke="${INK}" stroke-width="3.8"/>
        <path d="M74 56 C76 26, 144 26, 146 56 Z" fill="#639a48" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
        <line x1="94" y1="30" x2="90" y2="52" stroke="${INK}" stroke-width="2.4" opacity="0.6"/>
        <line x1="110" y1="28" x2="110" y2="52" stroke="${INK}" stroke-width="2.4" opacity="0.6"/>
        <line x1="126" y1="30" x2="130" y2="52" stroke="${INK}" stroke-width="2.4" opacity="0.6"/>
        <!-- Folded ribbed cuff -->
        <rect x="70" y="48" width="80" height="15" rx="7" fill="#7cb55d" stroke="${INK}" stroke-width="3.8"/>
        <line x1="88" y1="49" x2="88" y2="62" stroke="${INK}" stroke-width="2.2" opacity="0.55"/>
        <line x1="104" y1="49" x2="104" y2="62" stroke="${INK}" stroke-width="2.2" opacity="0.55"/>
        <line x1="120" y1="49" x2="120" y2="62" stroke="${INK}" stroke-width="2.2" opacity="0.55"/>
        <line x1="134" y1="49" x2="134" y2="62" stroke="${INK}" stroke-width="2.2" opacity="0.55"/>
      </g>
    `;
  }
  if (el === 'thuy') {
    // Mũ Bucket Vải Dù
    return `
      <g class="sk-layer-hat" data-gear-worn="hat-thuy">
        <path d="M80 48 L86 28 Q110 24 134 28 L140 48 Z" fill="#5ec2f7" stroke="${INK}" stroke-width="3.8" stroke-linejoin="round"/>
        <path d="M62 60 C72 44, 148 44, 158 60 C138 66, 82 66, 62 60 Z" fill="#38bdf8" stroke="${INK}" stroke-width="3.8" stroke-linejoin="round"/>
        <path d="M126 35 C126 35, 130 41, 130 43 A4 4 0 0 1 122 43 C122 41, 126 35, 126 35 Z" fill="#e0f2fe" stroke="${INK}" stroke-width="1.8"/>
      </g>
    `;
  }
  if (el === 'hoa') {
    // Mũ Lưỡi Trai Đỏ
    return `
      <g class="sk-layer-hat" data-gear-worn="hat-hoa">
        <path d="M74 56 C76 26, 144 26, 146 56 Z" fill="#e53935" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
        <circle cx="110" cy="27" r="4" fill="#b91c1c" stroke="${INK}" stroke-width="2.5"/>
        <path d="M70 55 Q112 48 162 60 C142 66, 98 63, 70 55 Z" fill="#c62828" stroke="${INK}" stroke-width="3.8" stroke-linejoin="round"/>
        <path d="M98 30 Q95 42 96 52" fill="none" stroke="#ffd1c7" stroke-width="2" stroke-dasharray="3 3" opacity="0.8"/>
      </g>
    `;
  }
  // tho: Mũ Cói
  return `
    <g class="sk-layer-hat" data-gear-worn="hat-tho">
      <ellipse cx="110" cy="54" rx="54" ry="12" fill="#eab664" stroke="${INK}" stroke-width="3.8"/>
      <path d="M82 52 L86 28 Q110 22 134 28 L138 52 Z" fill="#f3c978" stroke="${INK}" stroke-width="3.8" stroke-linejoin="round"/>
      <path d="M83 45 Q110 51 137 45 L138 52 Q110 58 82 52 Z" fill="#8a4b1d" stroke="${INK}" stroke-width="2.8"/>
      <circle cx="132" cy="50" r="4.2" fill="#a85e24" stroke="${INK}" stroke-width="2"/>
    </g>
  `;
}

/**
 * Vẽ hình Chủ tiệm Đà Lạt trẻ, thân thiện — mặc đúng toàn bộ đồ đang đeo:
 * Mũ, Kính mắt, Áo khoác, Dây nịt, Giày, Túi đeo chéo, Ô dù, Đồng hồ!
 * Có hào quang vàng Ngũ hành viên mãn khi fullRing = true.
 */
export function renderShopkeeperAvatarSvg(eq: Equipped, fullRing: boolean): string {
  const hasHieu = Object.values(eq).some((it) => it?.rarity === 'hieu');
  const hasUmbrella = Boolean(eq.umbrella);

  const auraSvg = fullRing
    ? `
      <g class="sk-fullring-aura">
        <circle cx="110" cy="134" r="98" fill="url(#sk_gold_aura)"/>
        <circle cx="110" cy="134" r="84" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-dasharray="8 6" opacity="0.72"/>
        <path d="M36 44 L39 34 L42 44 L52 47 L42 50 L39 60 L36 50 L26 47 Z" fill="#fef08a" stroke="#d97706" stroke-width="1.5"/>
        <path d="M180 56 L182 48 L184 56 L192 58 L184 60 L182 68 L180 60 L172 58 Z" fill="#fef08a" stroke="#d97706" stroke-width="1.5"/>
        <path d="M174 202 L176 196 L178 202 L184 204 L178 206 L176 212 L174 206 L168 204 Z" fill="#fef08a" stroke="#d97706" stroke-width="1.4"/>
      </g>
    `
    : hasHieu
      ? `
      <g class="sk-hieu-sparkle">
        <circle cx="110" cy="134" r="78" fill="url(#sk_soft_aura)"/>
        <path d="M174 64 L176 57 L178 64 L185 66 L178 68 L176 75 L174 68 L167 66 Z" fill="#fef08a" stroke="#d97706" stroke-width="1.4"/>
      </g>
    `
      : `<circle cx="110" cy="136" r="74" fill="url(#sk_soft_aura)"/>`;

  const wornSummary = Object.entries(eq)
    .filter(([, v]) => Boolean(v))
    .map(([k, v]) => `${k}:${v!.element}`)
    .join(',');

  return `
    <svg
      class="td-shopkeeper-svg ${fullRing ? 'full-ring' : ''}"
      viewBox="0 0 220 264"
      role="img"
      aria-label="Chủ tiệm Đà Lạt đang mặc trang bị"
      data-testid="shopkeeper-avatar"
      data-worn="${wornSummary}"
    >
      <defs>
        <radialGradient id="sk_soft_aura" cx="50%" cy="48%" r="50%">
          <stop offset="0%" stop-color="#fff9e6" stop-opacity="0.9"/>
          <stop offset="70%" stop-color="#f3d8a3" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#f3d8a3" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="sk_gold_aura" cx="50%" cy="48%" r="50%">
          <stop offset="0%" stop-color="#fffbeb" stop-opacity="0.95"/>
          <stop offset="52%" stop-color="#fde047" stop-opacity="0.48"/>
          <stop offset="85%" stop-color="#f59e0b" stop-opacity="0.16"/>
          <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="sk_skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffe4c9"/>
          <stop offset="100%" stop-color="#f6c59f"/>
        </linearGradient>
        <linearGradient id="sk_sweater" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fff8e8"/>
          <stop offset="100%" stop-color="#ebd5b0"/>
        </linearGradient>
      </defs>

      <!-- 1. Hào quang nền -->
      ${auraSvg}

      <!-- 2. Bóng dưới chân -->
      <ellipse cx="110" cy="249" rx="48" ry="9" fill="#5a3c28" opacity="0.22"/>

      <!-- 3. Tán ô dù mở phía sau vai trái (nếu đeo Ô dù) -->
      ${eq.umbrella ? renderUmbrellaBack(eq.umbrella.element) : ''}

      <!-- 4. Quần jeans xanh đậm Đà Lạt -->
      <g class="sk-legs">
        <path d="M84 172 L136 172 L138 232 L117 232 L110 198 L103 232 L82 232 Z"
              fill="#3d5673" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
        <path d="M110 174 L110 198" stroke="${INK}" stroke-width="3"/>
        <path d="M88 186 L87 224" stroke="#5d7ca0" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
      </g>

      <!-- 5. Giày (hoặc dép nhà nếu chưa đeo giày) -->
      ${renderShoes(eq.shoes?.element)}

      <!-- 6. Thân áo len kem mặc định & tay áo -->
      <g class="sk-base-torso">
        <!-- Right arm (viewer left) -->
        <path d="M80 112 C67 120, 62 134, ${hasUmbrella ? '62 150' : '64 162'} L77 160 L84 134 Z"
              fill="url(#sk_sweater)" stroke="${INK}" stroke-width="3.8" stroke-linejoin="round"/>
        <!-- Left arm (viewer right) -->
        <path d="M140 112 C153 120, 158 134, 156 162 L143 160 L136 134 Z"
              fill="url(#sk_sweater)" stroke="${INK}" stroke-width="3.8" stroke-linejoin="round"/>
        <!-- Torso sweater -->
        <path d="M80 110 L140 110 L142 174 C122 178, 98 178, 78 174 Z"
              fill="url(#sk_sweater)" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
        <!-- Cozy knit stripe -->
        <path d="M82 142 Q110 148 138 142" fill="none" stroke="#d4a359" stroke-width="3.5" opacity="0.55"/>
        <path d="M82 152 Q110 158 138 152" fill="none" stroke="#c96b4b" stroke-width="2.5" opacity="0.45"/>
        <!-- Hands -->
        <circle cx="${hasUmbrella ? 66 : 69}" cy="${hasUmbrella ? 156 : 165}" r="8.5" fill="url(#sk_skin)" stroke="${INK}" stroke-width="3.4"/>
        <circle cx="151" cy="165" r="8.5" fill="url(#sk_skin)" stroke="${INK}" stroke-width="3.4"/>
      </g>

      <!-- 7. Dây nịt da ở eo (nếu đeo) -->
      ${eq.belt ? renderBelt(eq.belt.element) : ''}

      <!-- 8. Áo khoác (mặc đè lên áo len kem) -->
      ${eq.jacket ? renderJacket(eq.jacket.element) : ''}

      <!-- Re-draw belt buckle subtly over open/short jacket waist if both worn -->
      ${eq.belt && (eq.jacket?.element === 'moc' || eq.jacket?.element === 'tho') ? renderBelt(eq.belt.element) : ''}

      <!-- 9. Tay cầm ô dù phía trước tay trái người xem -->
      ${eq.umbrella ? renderUmbrellaHandleFront(eq.umbrella.element) : ''}

      <!-- Re-draw gripping hand over umbrella handle -->
      ${hasUmbrella ? `<circle cx="67" cy="154" r="8.5" fill="url(#sk_skin)" stroke="${INK}" stroke-width="3.4"/>` : ''}

      <!-- 10. Đồng hồ đeo cổ tay phải (nếu đeo) -->
      ${eq.watch ? renderWatchOnWrist(eq.watch.element) : ''}

      <!-- 11. Túi đeo chéo / túi đeo hông (vắt qua áo khoác!) -->
      ${eq.bag ? renderBag(eq.bag.element) : ''}

      <!-- 12. Cổ & Đầu chủ tiệm Đà Lạt tươi cười -->
      <g class="sk-head">
        <!-- Neck -->
        <rect x="100" y="96" width="20" height="17" rx="6" fill="#f1be96" stroke="${INK}" stroke-width="3.5"/>
        <!-- Back hair -->
        <path d="M72 78 C70 46, 90 36, 110 36 C130 36, 150 46, 148 78 C148 92, 138 98, 134 94 L86 94 C82 98, 72 92, 72 78 Z"
              fill="#3d2316" stroke="${INK}" stroke-width="3.8"/>
        <!-- Cute ears -->
        <circle cx="77" cy="80" r="7.5" fill="url(#sk_skin)" stroke="${INK}" stroke-width="3.4"/>
        <circle cx="143" cy="80" r="7.5" fill="url(#sk_skin)" stroke="${INK}" stroke-width="3.4"/>
        <!-- Face -->
        <rect x="79" y="48" width="62" height="58" rx="28" fill="url(#sk_skin)" stroke="${INK}" stroke-width="4"/>
        <!-- Front tousled hair bangs -->
        <path d="M77 68 C78 44, 142 44, 143 68 C134 58, 126 62, 118 56 C112 63, 102 64, 94 57 C88 63, 82 64, 77 68 Z"
              fill="#462819" stroke="${INK}" stroke-width="3.6" stroke-linejoin="round"/>
        <path d="M90 50 Q108 44 126 50" fill="none" stroke="#75472f" stroke-width="3" stroke-linecap="round" opacity="0.65"/>
        <!-- Expressive friendly cartoon eyes -->
        <ellipse cx="96" cy="79" rx="4.4" ry="5.2" fill="${INK}"/>
        <circle cx="94.5" cy="77" r="1.8" fill="#ffffff"/>
        <ellipse cx="124" cy="79" rx="4.4" ry="5.2" fill="${INK}"/>
        <circle cx="122.5" cy="77" r="1.8" fill="#ffffff"/>
        <!-- Cheerful eyebrows -->
        <path d="M90 70 Q96 67 101 70" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M119 70 Q124 67 130 70" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>
        <!-- Rosy Dalat cool-weather cheeks -->
        <ellipse cx="87" cy="87" rx="5.5" ry="3.2" fill="#ff8f7a" opacity="0.62"/>
        <ellipse cx="133" cy="87" rx="5.5" ry="3.2" fill="#ff8f7a" opacity="0.62"/>
        <!-- Cute warm smile -->
        <path d="M102 90 Q110 98 118 90" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/>
      </g>

      <!-- 13. Kính mắt (nếu đeo) -->
      ${eq.glasses ? renderGlasses(eq.glasses.element) : ''}

      <!-- 14. Mũ (nếu đeo) -->
      ${eq.hat ? renderHat(eq.hat.element) : ''}
    </svg>
  `;
}
