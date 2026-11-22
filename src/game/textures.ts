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

export function generateGameTextures(scene: Phaser.Scene): void {
  // Đạn / hiệu ứng Ngũ Hành
  for (const el of ALL_ELEMENTS) {
    const info = ELEMENT_INFO[el];
    makeCanvasTexture(scene, `proj_${el}`, 20, 20, (ctx) => {
      const grad = ctx.createRadialGradient(10, 10, 2, 10, 10, 9);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, info.colorHex);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(10, 10, 9, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Hạt linh thạch bay về góc màn hình
  makeCanvasTexture(scene, 'loot_spirit_stone', 18, 18, (ctx) => {
    ctx.fillStyle = '#4cc9f0';
    ctx.beginPath();
    ctx.moveTo(9, 1);
    ctx.lineTo(16, 9);
    ctx.lineTo(9, 17);
    ctx.lineTo(2, 9);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.4;
    ctx.stroke();
  });
}
