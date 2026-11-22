import Phaser from 'phaser';
import { ALL_ELEMENTS, ELEMENT_INFO } from '../core/elements';

type DrawFn = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

function makeCanvasTexture(
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  draw: DrawFn,
): void {
  if (scene.textures.exists(key)) return;
  const canvasTex = scene.textures.createCanvas(key, width, height);
  if (!canvasTex) return;
  const ctx = canvasTex.getContext();
  ctx.clearRect(0, 0, width, height);
  draw(ctx, width, height);
  canvasTex.refresh();
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawMartialHero(
  ctx: CanvasRenderingContext2D,
  robeMain: string,
  robeTrim: string,
  hatColor: string,
  weaponKind: 'staff' | 'sword' | 'rod',
  accentGlow: string,
): void {
  // Bóng chân
  ctx.fillStyle = 'rgba(0,0,0,0.34)';
  ctx.beginPath();
  ctx.ellipse(22, 43, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Áo choàng kiếm hiệp
  ctx.fillStyle = robeMain;
  drawRoundedRect(ctx, 11, 20, 22, 22, 6);
  ctx.fill();
  ctx.strokeStyle = '#1b1612';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Viền vạt áo chéo
  ctx.strokeStyle = robeTrim;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(15, 22);
  ctx.lineTo(27, 36);
  ctx.moveTo(29, 22);
  ctx.lineTo(17, 34);
  ctx.stroke();

  // Đai lưng & ngọc bội
  ctx.fillStyle = robeTrim;
  ctx.fillRect(12, 31, 20, 4);
  ctx.fillStyle = accentGlow;
  ctx.beginPath();
  ctx.arc(22, 33, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Đầu & mặt
  ctx.fillStyle = '#f2cfa9';
  ctx.beginPath();
  ctx.arc(22, 15, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1b1612';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Mắt sắc nét
  ctx.fillStyle = '#1b1612';
  ctx.fillRect(19, 14, 2, 2);
  ctx.fillRect(24, 14, 2, 2);

  // Nón lá cổ / mũ đạo
  ctx.fillStyle = hatColor;
  ctx.beginPath();
  ctx.ellipse(22, 9.5, 13, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1b1612';
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(22, 8.5, 6, Math.PI, 0);
  ctx.fill();
  ctx.stroke();

  // Vũ khí bên phải
  if (weaponKind === 'staff') {
    ctx.strokeStyle = '#6f4a27';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(35, 6);
    ctx.lineTo(35, 42);
    ctx.stroke();
    ctx.fillStyle = '#d9b55c';
    ctx.fillRect(32.5, 8, 5, 4);
    ctx.fillRect(32.5, 34, 5, 4);
    ctx.fillStyle = accentGlow;
    ctx.beginPath();
    ctx.arc(35, 6, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (weaponKind === 'sword') {
    ctx.strokeStyle = '#d6e3ea';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(35, 7);
    ctx.lineTo(35, 32);
    ctx.stroke();
    ctx.fillStyle = '#e8c468';
    ctx.fillRect(31, 31, 8, 3);
    ctx.fillStyle = '#6e3e1c';
    ctx.fillRect(33.5, 34, 3, 7);
  } else {
    // Bùa lửa & đoản trượng
    ctx.strokeStyle = '#4e271b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(35, 12);
    ctx.lineTo(35, 40);
    ctx.stroke();
    // Lá bùa đỏ vàng
    ctx.fillStyle = '#f2c14e';
    ctx.fillRect(31, 7, 8, 11);
    ctx.strokeStyle = '#c92a2a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(31, 7, 8, 11);
    ctx.fillStyle = accentGlow;
    ctx.beginPath();
    ctx.arc(35, 12, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawAutomatonAlly(
  ctx: CanvasRenderingContext2D,
  bodyColor: string,
  trimColor: string,
  coreColor: string,
  style: 'reckless' | 'cautious' | 'greedy',
): void {
  // Bóng chân
  ctx.fillStyle = 'rgba(0,0,0,0.34)';
  ctx.beginPath();
  ctx.ellipse(20, 40, 12, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Chân gỗ-đồng
  ctx.fillStyle = '#3d2c1e';
  ctx.fillRect(13, 33, 5, 7);
  ctx.fillRect(22, 33, 5, 7);

  // Thân khôi lỗi gỗ và đồng
  ctx.fillStyle = bodyColor;
  drawRoundedRect(ctx, 10, 16, 20, 19, 4);
  ctx.fill();
  ctx.strokeStyle = '#1b1410';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Chốt đồng & viền khớp
  ctx.fillStyle = trimColor;
  ctx.fillRect(10, 16, 20, 4);
  ctx.fillRect(12, 31, 16, 3);
  ctx.beginPath();
  ctx.arc(13, 21, 1.5, 0, Math.PI * 2);
  ctx.arc(27, 21, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Lõi linh thạch phát sáng giữa ngực
  ctx.fillStyle = coreColor;
  ctx.beginPath();
  ctx.moveTo(20, 20);
  ctx.lineTo(25, 25);
  ctx.lineTo(20, 30);
  ctx.lineTo(15, 25);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Đầu khôi lỗi có khớp đồng
  ctx.fillStyle = bodyColor;
  drawRoundedRect(ctx, 13, 5, 14, 11, 3);
  ctx.fill();
  ctx.strokeStyle = '#1b1410';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Đôi mắt linh thạch
  ctx.fillStyle = coreColor;
  ctx.fillRect(16, 9, 3, 2.5);
  ctx.fillRect(22, 9, 3, 2.5);

  // Phụ kiện riêng từng tính cách
  if (style === 'reckless') {
    // Đại đao gỗ bọc sắt
    ctx.fillStyle = '#9aa5ad';
    ctx.beginPath();
    ctx.moveTo(31, 6);
    ctx.lineTo(37, 10);
    ctx.lineTo(35, 30);
    ctx.lineTo(31, 30);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1b1410';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#6c3b1f';
    ctx.fillRect(32, 30, 3, 8);
  } else if (style === 'cautious') {
    // Hồ lô linh dịch xanh lục bên hông + bùa an định trên trán
    ctx.fillStyle = '#73d69c';
    ctx.beginPath();
    ctx.arc(7, 26, 4.5, 0, Math.PI * 2);
    ctx.arc(7, 20, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1b1410';
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.fillStyle = '#f6d57a';
    ctx.fillRect(18, 2, 4, 5);
  } else {
    // Bánh răng tốc độ & túi linh thạch sáng
    ctx.strokeStyle = '#f2c14e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(33, 24, 4.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#4ea8de';
    ctx.beginPath();
    ctx.arc(33, 24, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8be9fd';
    ctx.beginPath();
    ctx.moveTo(6, 22);
    ctx.lineTo(9, 27);
    ctx.lineTo(6, 32);
    ctx.lineTo(3, 27);
    ctx.closePath();
    ctx.fill();
  }
}

function drawNpc(
  ctx: CanvasRenderingContext2D,
  robeColor: string,
  trimColor: string,
  role: 'blacksmith' | 'guide' | 'merchant' | 'foundry' | 'guard',
): void {
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath();
  ctx.ellipse(21, 42, 13, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  if (role === 'guide') {
    // Bách Thông là khôi lỗi dẫn đường có ăng-ten chỉ lệch hướng
    drawAutomatonAlly(ctx, '#7e6748', '#d4b46a', '#5cd6ff', 'greedy');
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, 5);
    ctx.lineTo(27, 1);
    ctx.stroke();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath();
    ctx.arc(28, 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  ctx.fillStyle = robeColor;
  drawRoundedRect(ctx, 10, 19, 22, 22, 6);
  ctx.fill();
  ctx.strokeStyle = '#1b1612';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  ctx.fillStyle = trimColor;
  ctx.fillRect(11, 29, 20, 4);

  ctx.fillStyle = '#ecc59c';
  ctx.beginPath();
  ctx.arc(21, 13, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#1b1612';
  ctx.fillRect(18, 12, 2, 2);
  ctx.fillRect(23, 12, 2, 2);

  if (role === 'blacksmith') {
    // Tạp dề da & búa rèn
    ctx.fillStyle = '#4a3525';
    ctx.fillRect(15, 22, 12, 17);
    ctx.fillStyle = '#c8c8c8';
    ctx.fillRect(32, 16, 7, 5);
    ctx.fillStyle = '#6f4a27';
    ctx.fillRect(34.5, 21, 2.5, 14);
  } else if (role === 'merchant') {
    // Khăn vấn & túi bạc
    ctx.fillStyle = '#9c3d3d';
    ctx.beginPath();
    ctx.arc(21, 8, 7.5, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#e8c468';
    ctx.beginPath();
    ctx.arc(34, 30, 4.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (role === 'foundry') {
    // Mũ quan lò đúc viền lam
    ctx.fillStyle = '#1f3a52';
    ctx.fillRect(14, 4, 14, 6);
    ctx.fillStyle = '#53c8ff';
    ctx.beginPath();
    ctx.arc(21, 7, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Mũ giáp & giáo lính gác
    ctx.fillStyle = '#6b757d';
    ctx.beginPath();
    ctx.arc(21, 9, 8, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#734a26';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(35, 5);
    ctx.lineTo(35, 42);
    ctx.stroke();
    ctx.fillStyle = '#cfd8dc';
    ctx.beginPath();
    ctx.moveTo(35, 2);
    ctx.lineTo(38, 10);
    ctx.lineTo(32, 10);
    ctx.closePath();
    ctx.fill();
  }
}

function drawEnemy(
  ctx: CanvasRenderingContext2D,
  primary: string,
  accent: string,
  eyeColor: string,
  shape: 'blocky' | 'bandit' | 'logger' | 'furnace' | 'sentry',
): void {
  ctx.fillStyle = 'rgba(0,0,0,0.36)';
  ctx.beginPath();
  ctx.ellipse(21, 42, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  if (shape === 'bandit') {
    ctx.fillStyle = primary;
    drawRoundedRect(ctx, 11, 18, 20, 22, 5);
    ctx.fill();
    ctx.strokeStyle = '#181412';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Khăn bịt mặt
    ctx.fillStyle = '#e5be96';
    ctx.beginPath();
    ctx.arc(21, 12, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#2d2522';
    ctx.fillRect(15, 12, 12, 6);
    ctx.fillStyle = eyeColor;
    ctx.fillRect(18, 10, 2, 2);
    ctx.fillRect(23, 10, 2, 2);
    // Cuốc sắt
    ctx.strokeStyle = '#7a4d2b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(34, 14);
    ctx.lineTo(34, 38);
    ctx.stroke();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(28, 14);
    ctx.quadraticCurveTo(34, 9, 40, 15);
    ctx.stroke();
    return;
  }

  // Các quái dạng khôi lỗi
  ctx.fillStyle = primary;
  drawRoundedRect(ctx, 8, 14, 26, 25, 4);
  ctx.fill();
  ctx.strokeStyle = '#141110';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Vai rộng
  ctx.fillStyle = accent;
  ctx.fillRect(6, 15, 6, 10);
  ctx.fillRect(30, 15, 6, 10);

  // Đầu / lõi
  ctx.fillStyle = '#241e1a';
  ctx.fillRect(13, 6, 16, 10);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(13, 6, 16, 10);

  ctx.fillStyle = eyeColor;
  ctx.fillRect(16, 10, 3.5, 2.5);
  ctx.fillRect(23, 10, 3.5, 2.5);

  if (shape === 'furnace') {
    // Khe lò rò lửa cam
    ctx.fillStyle = '#ff6b35';
    ctx.fillRect(14, 22, 14, 10);
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(17, 25, 8, 5);
  } else if (shape === 'sentry') {
    // Mảnh linh thạch xanh ghép chắp vá
    ctx.fillStyle = '#4cc9f0';
    ctx.beginPath();
    ctx.moveTo(21, 19);
    ctx.lineTo(27, 26);
    ctx.lineTo(21, 33);
    ctx.lineTo(15, 26);
    ctx.closePath();
    ctx.fill();
  } else if (shape === 'logger') {
    // Bùa rách đỏ & rìu đốn củi
    ctx.fillStyle = '#e63946';
    ctx.fillRect(18, 2, 5, 7);
    ctx.fillStyle = '#b8c4cc';
    ctx.fillRect(33, 12, 7, 10);
  } else {
    // Đá linh thạch trên ngực
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.arc(21, 26, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBossSoGiac(ctx: CanvasRenderingContext2D, phaseTwo: boolean): void {
  const cx = 38;
  // Vòng sáng thủy linh dưới chân
  const aura = ctx.createRadialGradient(cx, 66, 8, cx, 66, 34);
  aura.addColorStop(0, phaseTwo ? 'rgba(92, 235, 255, 0.72)' : 'rgba(78, 168, 222, 0.45)');
  aura.addColorStop(1, 'rgba(78, 168, 222, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.ellipse(cx, 66, 34, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  // Chân trụ đồng-gỗ khổng lồ
  ctx.fillStyle = '#3d3024';
  ctx.fillRect(22, 56, 11, 16);
  ctx.fillRect(43, 56, 11, 16);
  ctx.strokeStyle = '#14110f';
  ctx.lineWidth = 2;
  ctx.strokeRect(22, 56, 11, 16);
  ctx.strokeRect(43, 56, 11, 16);

  // Thân khôi lỗi cổ sứt mẻ nhưng uy nghi
  const bodyGrad = ctx.createLinearGradient(14, 22, 62, 60);
  bodyGrad.addColorStop(0, phaseTwo ? '#4d5d6b' : '#6e563f');
  bodyGrad.addColorStop(1, phaseTwo ? '#233240' : '#403123');
  ctx.fillStyle = bodyGrad;
  drawRoundedRect(ctx, 15, 23, 46, 36, 8);
  ctx.fill();
  ctx.strokeStyle = phaseTwo ? '#7ce8ff' : '#c7a45a';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Hai cầu vai đồng lớn
  ctx.fillStyle = '#8b6d43';
  drawRoundedRect(ctx, 6, 22, 13, 22, 4);
  ctx.fill();
  ctx.stroke();
  drawRoundedRect(ctx, 57, 22, 13, 22, 4);
  ctx.fill();
  ctx.stroke();

  // Lõi linh thạch thức tỉnh giữa ngực (nứt sáng rực xanh lam)
  const coreGlow = ctx.createRadialGradient(cx, 41, 2, cx, 41, 16);
  coreGlow.addColorStop(0, '#ffffff');
  coreGlow.addColorStop(0.45, phaseTwo ? '#5ef2ff' : '#4ea8de');
  coreGlow.addColorStop(1, 'rgba(78, 168, 222, 0)');
  ctx.fillStyle = coreGlow;
  ctx.beginPath();
  ctx.arc(cx, 41, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = phaseTwo ? '#c2fbff' : '#7ad6ff';
  ctx.beginPath();
  ctx.moveTo(cx, 30);
  ctx.lineTo(cx + 10, 41);
  ctx.lineTo(cx, 52);
  ctx.lineTo(cx - 10, 41);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Đầu Khôi Lỗi Số Không
  ctx.fillStyle = '#4e3d2d';
  drawRoundedRect(ctx, 25, 6, 26, 18, 5);
  ctx.fill();
  ctx.strokeStyle = '#c7a45a';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Vòng linh thạch trên trán & ánh mắt thức tỉnh
  ctx.fillStyle = phaseTwo ? '#88f7ff' : '#4ea8de';
  ctx.fillRect(30, 14, 5, 4);
  ctx.fillRect(41, 14, 5, 4);

  if (!phaseTwo) {
    // Giai đoạn 1: Dải bùa phong ấn vàng dán chéo trên trán và vai
    ctx.fillStyle = '#f2c14e';
    ctx.fillRect(35, 3, 6, 12);
    ctx.fillRect(10, 29, 8, 11);
    ctx.fillStyle = '#c92a2a';
    ctx.fillRect(37, 5, 2, 7);
  } else {
    // Giai đoạn 2: Vòng Cấm Tự Giải — mảnh bùa vỡ bay tỏa & tia năng lượng lam
    ctx.strokeStyle = '#9bf6ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, 38, 33, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#f2c14e';
    ctx.save();
    ctx.translate(14, 12);
    ctx.rotate(-0.4);
    ctx.fillRect(0, 0, 7, 4);
    ctx.restore();
    ctx.save();
    ctx.translate(58, 10);
    ctx.rotate(0.5);
    ctx.fillRect(0, 0, 7, 4);
    ctx.restore();
  }
}

export function generateGameTextures(scene: Phaser.Scene): void {
  // 1. Nền bản đồ (64x64)
  makeCanvasTexture(scene, 'tile_town', 64, 64, (ctx, w, h) => {
    ctx.fillStyle = '#332d26';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#26201a';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 30, 30);
    ctx.strokeRect(33, 1, 30, 30);
    ctx.strokeRect(1, 33, 30, 30);
    ctx.strokeRect(33, 33, 30, 30);
    ctx.fillStyle = 'rgba(244, 234, 213, 0.05)';
    ctx.fillRect(4, 4, 24, 10);
    ctx.fillRect(36, 36, 22, 10);
  });

  makeCanvasTexture(scene, 'tile_forest', 64, 64, (ctx, w, h) => {
    ctx.fillStyle = '#203324';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#29422e';
    ctx.fillRect(6, 10, 14, 10);
    ctx.fillRect(38, 36, 18, 12);
    ctx.fillStyle = '#19291c';
    ctx.beginPath();
    ctx.arc(48, 16, 4, 0, Math.PI * 2);
    ctx.arc(18, 48, 5, 0, Math.PI * 2);
    ctx.fill();
    // Vệt cỏ nhỏ
    ctx.strokeStyle = '#3b6142';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(14, 26);
    ctx.lineTo(12, 20);
    ctx.moveTo(14, 26);
    ctx.lineTo(17, 21);
    ctx.moveTo(46, 52);
    ctx.lineTo(44, 46);
    ctx.stroke();
  });

  makeCanvasTexture(scene, 'tile_cave', 64, 64, (ctx, w, h) => {
    ctx.fillStyle = '#181e27';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#202836';
    ctx.beginPath();
    ctx.moveTo(8, 12);
    ctx.lineTo(28, 8);
    ctx.lineTo(32, 26);
    ctx.lineTo(10, 28);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(78, 168, 222, 0.14)';
    ctx.fillRect(44, 42, 6, 4);
    ctx.fillRect(14, 48, 4, 4);
  });

  // 2. Nhân vật chính (3 môn phái)
  makeCanvasTexture(scene, 'player_sect_open', 44, 48, (ctx) =>
    drawMartialHero(ctx, '#2b7a4b', '#d9c27a', '#6b5332', 'staff', '#59c173'),
  );
  makeCanvasTexture(scene, 'player_sect_closed', 44, 48, (ctx) =>
    drawMartialHero(ctx, '#475569', '#e8c468', '#c7a45a', 'sword', '#e8c468'),
  );
  makeCanvasTexture(scene, 'player_sect_ban', 44, 48, (ctx) =>
    drawMartialHero(ctx, '#8b2626', '#f2b84b', '#332222', 'rod', '#ff7b54'),
  );

  // 3. Ba đồng đội AI khôi lỗi
  makeCanvasTexture(scene, 'ally_reckless', 40, 44, (ctx) =>
    drawAutomatonAlly(ctx, '#9c4132', '#d49a6a', '#ff7b54', 'reckless'),
  );
  makeCanvasTexture(scene, 'ally_cautious', 40, 44, (ctx) =>
    drawAutomatonAlly(ctx, '#6e553b', '#98b475', '#d9b55c', 'cautious'),
  );
  makeCanvasTexture(scene, 'ally_greedy', 40, 44, (ctx) =>
    drawAutomatonAlly(ctx, '#3c6e8c', '#e8c468', '#6ee7ff', 'greedy'),
  );

  // 4. 5 NPC
  makeCanvasTexture(scene, 'npc_blacksmith', 42, 46, (ctx) =>
    drawNpc(ctx, '#5c4b3c', '#8c6b4f', 'blacksmith'),
  );
  makeCanvasTexture(scene, 'npc_guide', 42, 46, (ctx) =>
    drawNpc(ctx, '#7e6748', '#d4b46a', 'guide'),
  );
  makeCanvasTexture(scene, 'npc_merchant', 42, 46, (ctx) =>
    drawNpc(ctx, '#7d3b4b', '#e8c468', 'merchant'),
  );
  makeCanvasTexture(scene, 'npc_foundry', 42, 46, (ctx) =>
    drawNpc(ctx, '#244561', '#53c8ff', 'foundry'),
  );
  makeCanvasTexture(scene, 'npc_guard', 42, 46, (ctx) =>
    drawNpc(ctx, '#4a5562', '#c8a962', 'guard'),
  );

  // 5. 5 Quái & Trùm Sơ Giác
  makeCanvasTexture(scene, 'enemy_mine_guard', 42, 46, (ctx) =>
    drawEnemy(ctx, '#7c6549', '#b89b72', '#e8c468', 'blocky'),
  );
  makeCanvasTexture(scene, 'enemy_mine_bandit', 42, 46, (ctx) =>
    drawEnemy(ctx, '#5a3d36', '#d8dee9', '#ffd166', 'bandit'),
  );
  makeCanvasTexture(scene, 'enemy_rogue_logger', 42, 46, (ctx) =>
    drawEnemy(ctx, '#3c6b42', '#7a5a3a', '#8aff9e', 'logger'),
  );
  makeCanvasTexture(scene, 'enemy_furnace_golem', 42, 46, (ctx) =>
    drawEnemy(ctx, '#54322d', '#a64d36', '#ff8243', 'furnace'),
  );
  makeCanvasTexture(scene, 'enemy_cave_sentry', 42, 46, (ctx) =>
    drawEnemy(ctx, '#2c485e', '#769cb8', '#68e1fd', 'sentry'),
  );
  makeCanvasTexture(scene, 'boss_awakened', 76, 80, (ctx) => drawBossSoGiac(ctx, false));
  makeCanvasTexture(scene, 'boss_awakened_p2', 76, 80, (ctx) => drawBossSoGiac(ctx, true));

  // 6. Vật phẩm rơi
  makeCanvasTexture(scene, 'loot_silver', 24, 24, (ctx) => {
    ctx.fillStyle = '#cfd8dc';
    ctx.beginPath();
    ctx.ellipse(12, 14, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#37474f';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(10, 12, 2.2, 0, Math.PI * 2);
    ctx.fill();
  });

  makeCanvasTexture(scene, 'loot_spirit_stone', 24, 24, (ctx) => {
    ctx.fillStyle = '#4cc9f0';
    ctx.beginPath();
    ctx.moveTo(12, 2);
    ctx.lineTo(20, 12);
    ctx.lineTo(12, 22);
    ctx.lineTo(4, 12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  makeCanvasTexture(scene, 'loot_item', 24, 24, (ctx) => {
    ctx.fillStyle = '#8b5a2b';
    drawRoundedRect(ctx, 4, 7, 16, 12, 3);
    ctx.fill();
    ctx.strokeStyle = '#e8c468';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#e8c468';
    ctx.fillRect(10, 11, 4, 4);
  });

  makeCanvasTexture(scene, 'loot_quest', 24, 24, (ctx) => {
    ctx.fillStyle = '#f2c14e';
    ctx.beginPath();
    ctx.moveTo(12, 3);
    ctx.lineTo(21, 9);
    ctx.lineTo(18, 20);
    ctx.lineTo(6, 20);
    ctx.lineTo(3, 9);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#6e3e1c';
    ctx.lineWidth = 1.8;
    ctx.stroke();
  });

  // 7. Đạn / hiệu ứng Ngũ Hành
  for (const el of ALL_ELEMENTS) {
    const info = ELEMENT_INFO[el];
    makeCanvasTexture(scene, `proj_${el}`, 22, 22, (ctx) => {
      const grad = ctx.createRadialGradient(11, 11, 2, 11, 11, 10);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, info.colorHex);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(11, 11, 10, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // 8. Hạt sáng nhỏ
  makeCanvasTexture(scene, 'particle_spark', 10, 10, (ctx) => {
    const grad = ctx.createRadialGradient(5, 5, 1, 5, 5, 5);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(5, 5, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  // 9. Nền 2 bản đồ mới Giai đoạn 2 (Thành Bế Các & Lũng Đại Mạch)
  makeCanvasTexture(scene, 'tile_inner_city', 64, 64, (ctx, w, h) => {
    ctx.fillStyle = '#2a303a';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#3a4250';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 30, 30);
    ctx.strokeRect(33, 1, 30, 30);
    ctx.strokeRect(1, 33, 30, 30);
    ctx.strokeRect(33, 33, 30, 30);
    // Đường viền đồng niêm phong
    ctx.strokeStyle = 'rgba(232, 196, 104, 0.16)';
    ctx.lineWidth = 1;
    ctx.strokeRect(4, 4, 24, 24);
    ctx.strokeRect(36, 36, 24, 24);
  });

  makeCanvasTexture(scene, 'tile_valley', 64, 64, (ctx, w, h) => {
    ctx.fillStyle = '#25211c';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#312b24';
    ctx.fillRect(4, 8, 22, 16);
    ctx.fillRect(34, 36, 24, 18);
    // Mạch linh thạch lộ thiên xanh lam dưới nền thung lũng
    ctx.strokeStyle = 'rgba(76, 201, 240, 0.25)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(8, 52);
    ctx.lineTo(24, 42);
    ctx.lineTo(42, 48);
    ctx.stroke();
  });

  // 10. NPC mới Giai đoạn 2 (nhân vật nhiệm vụ chính & 3 nhiệm vụ phụ & bang hội & ghép đồ)
  makeCanvasTexture(scene, 'npc_open_rep', 42, 46, (ctx) =>
    drawNpc(ctx, '#2b7a4b', '#a7f3d0', 'foundry'),
  );
  makeCanvasTexture(scene, 'npc_closed_rep', 42, 46, (ctx) =>
    drawNpc(ctx, '#3b4a5e', '#e8c468', 'foundry'),
  );
  makeCanvasTexture(scene, 'npc_ban_rep', 42, 46, (ctx) =>
    drawNpc(ctx, '#7f2323', '#ffd166', 'guard'),
  );
  makeCanvasTexture(scene, 'npc_scholar', 42, 46, (ctx) =>
    drawNpc(ctx, '#335c67', '#e0fbfc', 'merchant'),
  );
  makeCanvasTexture(scene, 'npc_teahouse', 42, 46, (ctx) =>
    drawNpc(ctx, '#8c4a27', '#f6dc95', 'merchant'),
  );
  makeCanvasTexture(scene, 'npc_martial_master', 42, 46, (ctx) =>
    drawNpc(ctx, '#3d405b', '#f2cc8f', 'guard'),
  );
  makeCanvasTexture(scene, 'npc_taoist', 42, 46, (ctx) =>
    drawNpc(ctx, '#4a5759', '#f7e1d7', 'foundry'),
  );
  makeCanvasTexture(scene, 'npc_guild_master', 42, 46, (ctx) =>
    drawNpc(ctx, '#5f4bb6', '#ffd166', 'guard'),
  );
  makeCanvasTexture(scene, 'npc_apprentice_smith', 42, 46, (ctx) =>
    drawNpc(ctx, '#6c4f3d', '#ffb703', 'blacksmith'),
  );
  makeCanvasTexture(scene, 'npc_seal_breaker', 42, 46, (ctx) =>
    drawNpc(ctx, '#3b2842', '#ff4d6d', 'merchant'),
  );

  // 11. Quái mới Giai đoạn 2
  makeCanvasTexture(scene, 'enemy_bronze_guard', 42, 46, (ctx) =>
    drawEnemy(ctx, '#6c5838', '#f3d68b', '#ffd166', 'blocky'),
  );
  makeCanvasTexture(scene, 'enemy_copy_scribe', 42, 46, (ctx) =>
    drawEnemy(ctx, '#2b5842', '#95d5b2', '#7bf1a8', 'logger'),
  );
  makeCanvasTexture(scene, 'enemy_unsealed_golem', 42, 46, (ctx) =>
    drawEnemy(ctx, '#6e1f1f', '#ff9f1c', '#ff4d4d', 'furnace'),
  );
  makeCanvasTexture(scene, 'enemy_stone_colossus', 44, 48, (ctx) =>
    drawEnemy(ctx, '#5c5346', '#c49a6c', '#ffe6a7', 'blocky'),
  );
  makeCanvasTexture(scene, 'enemy_voice_mimic', 42, 46, (ctx) =>
    drawEnemy(ctx, '#2b506e', '#90e0ef', '#48cae4', 'sentry'),
  );
  makeCanvasTexture(scene, 'enemy_siege_defender', 44, 48, (ctx) =>
    drawEnemy(ctx, '#4a5568', '#e8c468', '#9bf6ff', 'blocky'),
  );

  // 12. Trùm mới Giai đoạn 2: Vạn Chép — Khôi Lỗi Hợp Lõi (Hệ Kim)
  const drawBossVanChep = (ctx: CanvasRenderingContext2D, phaseTwo: boolean): void => {
    const cx = 38;
    const aura = ctx.createRadialGradient(cx, 66, 8, cx, 66, 36);
    aura.addColorStop(0, phaseTwo ? 'rgba(255, 190, 85, 0.78)' : 'rgba(232, 196, 104, 0.5)');
    aura.addColorStop(1, 'rgba(232, 196, 104, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.ellipse(cx, 66, 35, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bốn cánh tay đồng chép võ công 3 phái sau lưng
    ctx.strokeStyle = phaseTwo ? '#ff9f1c' : '#d4a359';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(14, 30);
    ctx.lineTo(4, 14);
    ctx.moveTo(62, 30);
    ctx.lineTo(72, 14);
    ctx.moveTo(14, 44);
    ctx.lineTo(3, 48);
    ctx.moveTo(62, 44);
    ctx.lineTo(73, 48);
    ctx.stroke();

    // Thân hợp kim đồng-sắt đồ sộ
    ctx.fillStyle = phaseTwo ? '#5c3c24' : '#4a525d';
    drawRoundedRect(ctx, 14, 22, 48, 38, 8);
    ctx.fill();
    ctx.strokeStyle = phaseTwo ? '#ffd166' : '#e8c468';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Ba lõi linh thạch ghép chồng trước ngực (Kim - Mộc - Hỏa)
    const cores: Array<{ x: number; y: number; col: string }> = [
      { x: cx, y: 34, col: '#e8c468' },
      { x: cx - 9, y: 45, col: '#59c173' },
      { x: cx + 9, y: 45, col: '#ef6351' },
    ];
    for (const c of cores) {
      ctx.fillStyle = c.col;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // Đầu hợp lõi
    ctx.fillStyle = '#2d3748';
    drawRoundedRect(ctx, 24, 5, 28, 18, 5);
    ctx.fill();
    ctx.strokeStyle = '#e8c468';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = phaseTwo ? '#ff595e' : '#ffd166';
    ctx.fillRect(29, 12, 6, 4);
    ctx.fillRect(41, 12, 6, 4);
  };

  makeCanvasTexture(scene, 'boss_van_chep', 76, 80, (ctx) => drawBossVanChep(ctx, false));
  makeCanvasTexture(scene, 'boss_van_chep_p2', 76, 80, (ctx) => drawBossVanChep(ctx, true));

  // 13. Đại diện 4 Bang hội AI tuần tra ngoài bản đồ
  makeCanvasTexture(scene, 'guild_agent_guild_aggressive', 40, 44, (ctx) =>
    drawMartialHero(ctx, '#6b5322', '#ffd166', '#3d2f14', 'sword', '#e8c468'),
  );
  makeCanvasTexture(scene, 'guild_agent_guild_merchant', 40, 44, (ctx) =>
    drawMartialHero(ctx, '#245c3b', '#95d5b2', '#3a2d1e', 'staff', '#59c173'),
  );
  makeCanvasTexture(scene, 'guild_agent_guild_opportunist', 40, 44, (ctx) =>
    drawMartialHero(ctx, '#214e6e', '#90e0ef', '#1d3557', 'sword', '#4ea8de'),
  );
  makeCanvasTexture(scene, 'guild_agent_guild_guardian', 40, 44, (ctx) =>
    drawMartialHero(ctx, '#6e2222', '#ffadad', '#2b1818', 'rod', '#ef6351'),
  );
}
