import Phaser from 'phaser';
import './ui/styles.css';
import { BootScene } from './scenes/BootScene';
import { TdStageScene } from './scenes/TdStageScene';
import { TitleScene } from './scenes/TitleScene';

import { music } from './game/music';
import { sound } from './game/sound';
import { requireInvite } from './game/invite';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#141210',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: '100%',
    height: '100%',
  },
  render: {
    antialias: true,
    pixelArt: false,
  },
  scene: [BootScene, TitleScene, TdStageScene],
};

// Giai đoạn 1 thử nội bộ: người mới phải nhập mã mời (src/game/invite.ts)
void requireInvite(() => {
  const game = new Phaser.Game(config);
  if (typeof window !== 'undefined') {
    (window as unknown as { __GIANG_HO_GAME__?: Phaser.Game }).__GIANG_HO_GAME__ = game;
    (window as unknown as { __GON_TIEM_AUDIO__?: { music: typeof music; sound: typeof sound } }).__GON_TIEM_AUDIO__ = {
      music,
      sound,
    };
  }
});

// Lưu sẵn game để chơi không cần mạng (chuyển từ index.html sang đây để bật được chính sách chặn mã chèn — đánh giá độc lập C3/T12).
// Bỏ qua khi chạy thử tự động (trừ khi có ?sw=1); chờ 20 giây sau khi mở để không giành mạng lúc mở.
if ('serviceWorker' in navigator && location.port !== '5173' && (!navigator.webdriver || location.search.indexOf('sw=1') >= 0)) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }, 20000);
  });
}
