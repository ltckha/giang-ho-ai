const INK = '#2b1a12';

export interface BrandLogoOptions {
  /** Hiện chữ "GỌN TIỆM / SẠCH PHỐ" trên biển gỗ (tắt cho favicon 32×32) */
  showText?: boolean;
  /** Bo góc nền vuông (mặc định 92/512 cho icon app) */
  cornerRadius?: number;
}

/**
 * Logo bản vuông chính thức "Gọn Tiệm, Sạch Phố" (viewBox 512×512):
 * Mái hiên sọc đỏ-kem tiệm Đà Lạt mùa mưa, ánh đèn vàng ấm,
 * chiếc dép tông hoạt hình đặc trưng, 5 hạt Ngũ Hành & biển chữ Việt rõ nét.
 */
export function renderBrandLogoSvg(opts: BrandLogoOptions = {}): string {
  const showText = opts.showText ?? true;
  const rx = opts.cornerRadius ?? 92;

  const flipFlopTransform = showText
    ? 'translate(256 232) scale(0.98)'
    : 'translate(256 286) scale(1.36)';

  const textBanner = showText
    ? `
      <!-- Biển gỗ tên game phía dưới: chữ Việt đậm rõ nét -->
      <g transform="translate(256 410)">
        <!-- Bóng biển -->
        <rect x="-208" y="-56" width="416" height="122" rx="24" fill="#1e1109" opacity="0.4"/>
        <!-- Thân biển gỗ nâu đậm viền vàng -->
        <rect x="-208" y="-62" width="416" height="122" rx="24" fill="url(#logoWoodSign)" stroke="${INK}" stroke-width="10"/>
        <rect x="-194" y="-48" width="388" height="94" rx="15" fill="none" stroke="#f6c762" stroke-width="4" stroke-dasharray="10 6" opacity="0.82"/>
        <!-- Đinh đồng 4 góc -->
        <circle cx="-178" cy="-34" r="6" fill="#fde047" stroke="${INK}" stroke-width="2.5"/>
        <circle cx="178" cy="-34" r="6" fill="#fde047" stroke="${INK}" stroke-width="2.5"/>
        <circle cx="-178" cy="34" r="6" fill="#fde047" stroke="${INK}" stroke-width="2.5"/>
        <circle cx="178" cy="34" r="6" fill="#fde047" stroke="${INK}" stroke-width="2.5"/>

        <!-- Dòng 1: GỌN TIỆM -->
        <text
          x="0"
          y="-7"
          text-anchor="middle"
          font-family="'Noto Serif', Georgia, serif"
          font-weight="700"
          font-size="47"
          letter-spacing="1.5"
          fill="#fff5cf"
          stroke="${INK}"
          stroke-width="7"
          paint-order="stroke fill"
        >GỌN TIỆM</text>

        <!-- Dòng 2: SẠCH PHỐ -->
        <text
          x="0"
          y="40"
          text-anchor="middle"
          font-family="'Noto Serif', Georgia, serif"
          font-weight="700"
          font-size="44"
          letter-spacing="2"
          fill="#ffd24d"
          stroke="${INK}"
          stroke-width="7"
          paint-order="stroke fill"
        >SẠCH PHỐ</text>
      </g>
    `
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" role="img" aria-label="Logo Gọn Tiệm, Sạch Phố">
  <defs>
    <clipPath id="logoClip">
      <rect x="14" y="14" width="484" height="484" rx="${rx}"/>
    </clipPath>
    <linearGradient id="logoSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3c546b"/>
      <stop offset="52%" stop-color="#5a748a"/>
      <stop offset="100%" stop-color="#3d2718"/>
    </linearGradient>
    <radialGradient id="logoSunGlow" cx="50%" cy="46%" r="52%">
      <stop offset="0%" stop-color="#fff8d6"/>
      <stop offset="58%" stop-color="#f7d382"/>
      <stop offset="100%" stop-color="#d59445"/>
    </radialGradient>
    <linearGradient id="logoRoof" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#a8492e"/>
      <stop offset="100%" stop-color="#762f1c"/>
    </linearGradient>
    <linearGradient id="logoWoodSign" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#5b351b"/>
      <stop offset="100%" stop-color="#331c0d"/>
    </linearGradient>
    <linearGradient id="logoSole" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff9e2"/>
      <stop offset="100%" stop-color="#ead09c"/>
    </linearGradient>
    <linearGradient id="logoStrap" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#69d17b"/>
      <stop offset="100%" stop-color="#2f8f4b"/>
    </linearGradient>
  </defs>

  <!-- Nền khung vuông bo tròn tiệm gỗ Đà Lạt -->
  <g clip-path="url(#logoClip)">
    <!-- Trời chiều mưa Đà Lạt & rặng thông mờ -->
    <rect x="14" y="14" width="484" height="484" fill="url(#logoSky)"/>
    <path d="M14 140 L52 74 L86 140 L124 88 L160 148 L354 148 L392 84 L428 140 L464 78 L498 140 L498 220 L14 220 Z" fill="#2c4442" opacity="0.65"/>

    <!-- Vầng sáng cửa tiệm gỗ ấm phía sau -->
    <rect x="48" y="138" width="416" height="330" rx="28" fill="#8f5324" stroke="${INK}" stroke-width="10"/>
    <rect x="68" y="156" width="376" height="260" rx="20" fill="url(#logoSunGlow)" stroke="${INK}" stroke-width="8"/>

    <!-- Hạt mưa chéo nhẹ ngoài trời -->
    <g stroke="#d6f2ff" stroke-width="4.5" stroke-linecap="round" opacity="0.5">
      <line x1="68" y1="34" x2="54" y2="66"/>
      <line x1="158" y1="26" x2="144" y2="58"/>
      <line x1="358" y1="28" x2="344" y2="60"/>
      <line x1="444" y1="36" x2="430" y2="68"/>
    </g>

    <!-- Mái ngói & Mái hiên sọc đỏ-kem Đà Lạt phía trên -->
    <path d="M26 112 L78 52 L434 52 L486 112 Z" fill="url(#logoRoof)" stroke="${INK}" stroke-width="10" stroke-linejoin="round"/>
    <path d="M20 112 L492 112 L500 170 L12 170 Z" fill="#faf0da" stroke="${INK}" stroke-width="10" stroke-linejoin="round"/>
    <!-- Sọc đỏ mái hiên -->
    <path d="M62 112 L54 170 L118 170 L122 112 Z M184 112 L182 170 L246 170 L246 112 Z M308 112 L310 170 L374 170 L370 112 Z M428 112 L434 170 L492 170 L482 112 Z" fill="#cf4836"/>
    <!-- Đường viền lượn sóng mái hiên -->
    <path d="M12 170 Q44 196 76 170 Q108 196 140 170 Q172 196 204 170 Q236 196 268 170 Q300 196 332 170 Q364 196 396 170 Q428 196 460 170 Q482 188 500 170" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>

    <!-- Hai đèn lồng vàng ấm treo hai bên mái hiên -->
    <circle cx="80" cy="214" r="36" fill="#ffe57f" opacity="0.45"/>
    <rect x="66" y="196" width="28" height="36" rx="9" fill="#ffe082" stroke="${INK}" stroke-width="6"/>
    <circle cx="432" cy="214" r="36" fill="#ffe57f" opacity="0.45"/>
    <rect x="418" y="196" width="28" height="36" rx="9" fill="#ffe082" stroke="${INK}" stroke-width="6"/>

    <!-- 5 hạt Ngũ Hành (Kim - Mộc - Thủy - Hỏa - Thổ) sáng rõ trên viền kệ -->
    ${
      showText
        ? `<g stroke="${INK}" stroke-width="5">
             <circle cx="152" cy="332" r="13" fill="#cbd5e1"/>
             <circle cx="204" cy="332" r="13" fill="#59c173"/>
             <circle cx="256" cy="332" r="13" fill="#38bdf8"/>
             <circle cx="308" cy="332" r="13" fill="#ff6b4a"/>
             <circle cx="360" cy="332" r="13" fill="#d4a359"/>
             <g fill="#ffffff" stroke="none" opacity="0.65">
               <circle cx="148" cy="328" r="3.5"/>
               <circle cx="200" cy="328" r="3.5"/>
               <circle cx="252" cy="328" r="3.5"/>
               <circle cx="304" cy="328" r="3.5"/>
               <circle cx="356" cy="328" r="3.5"/>
             </g>
           </g>`
        : ''
    }

    <!-- Chiếc Dép Tông hoạt hình biểu tượng của Gọn Tiệm -->
    <g transform="${flipFlopTransform}">
      <!-- Vệt sáng vèo cong phía sau dép -->
      <path d="M-126 30 Q-72 86 24 72" fill="none" stroke="#fff9e2" stroke-width="11" stroke-linecap="round" opacity="0.72"/>
      <g transform="rotate(-18)">
        <!-- Bóng đế dưới -->
        <path d="M-108 14 C-112 -32, -62 -56, 8 -54 C76 -52, 118 -26, 114 14 C110 52, 64 62, -2 58 C-64 54, -104 48, -108 14 Z"
              fill="#3e8c4c" stroke="${INK}" stroke-width="10" transform="translate(0 12)"/>
        <!-- Thân đế dép tông kem ấm -->
        <path d="M-108 6 C-112 -38, -62 -62, 8 -60 C76 -58, 118 -32, 114 8 C110 46, 64 56, -2 52 C-64 48, -104 42, -108 6 Z"
              fill="url(#logoSole)" stroke="${INK}" stroke-width="10"/>
        <!-- Đường gân lòng dép -->
        <path d="M-86 4 C-86 -24, -48 -42, 8 -40 C58 -38, 92 -20, 90 6 C88 30, 52 38, 0 36 C-52 34, -86 28, -86 4 Z"
              fill="none" stroke="#d4a359" stroke-width="4.5" stroke-dasharray="10 7"/>
        <!-- Quai dép chữ Y xanh lá Mộc nổi bật -->
        <path d="M-24 -52 C14 -36, 46 -18, 66 2 C46 18, 14 34, -22 46"
              fill="none" stroke="${INK}" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M-24 -52 C14 -36, 46 -18, 66 2 C46 18, 14 34, -22 46"
              fill="none" stroke="url(#logoStrap)" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- Chốt tròn quai dép -->
        <circle cx="64" cy="2" r="12" fill="#fde047" stroke="${INK}" stroke-width="6"/>
        <!-- Đôi mắt hoạt hình vui vẻ trên đế dép -->
        <ellipse cx="-52" cy="-6" rx="7" ry="8.5" fill="${INK}"/>
        <circle cx="-54" cy="-9" r="3" fill="#ffffff"/>
        <ellipse cx="-24" cy="-4" rx="7" ry="8.5" fill="${INK}"/>
        <circle cx="-26" cy="-7" r="3" fill="#ffffff"/>
        <path d="M-46 10 Q-38 20 -30 10" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>
        <ellipse cx="-62" cy="7" rx="6" ry="3.5" fill="#ff8a75" opacity="0.65"/>
        <ellipse cx="-14" cy="9" rx="6" ry="3.5" fill="#ff8a75" opacity="0.65"/>
      </g>
      <!-- Tia lấp lánh sạch bong -->
      <path d="M88 -66 L94 -84 L100 -66 L118 -60 L100 -54 L94 -36 L88 -54 L70 -60 Z" fill="#fffbeb" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>
      <path d="M-104 -56 L-100 -68 L-96 -56 L-84 -52 L-96 -48 L-100 -36 L-104 -48 L-116 -52 Z" fill="#fde047" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    </g>

    ${textBanner}
  </g>

  <!-- Viền gỗ ngoài cùng sắc nét -->
  <rect x="14" y="14" width="484" height="484" rx="${rx}" fill="none" stroke="${INK}" stroke-width="12"/>
  <rect x="24" y="24" width="464" height="464" rx="${Math.max(12, rx - 10)}" fill="none" stroke="#f5cb6e" stroke-width="3.5" opacity="0.65"/>
</svg>`;
}
