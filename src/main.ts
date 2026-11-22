import Phaser from 'phaser';
import './ui/styles.css';
import { BootScene } from './scenes/BootScene';
import { CaveScene } from './scenes/CaveScene';
import { ForestScene } from './scenes/ForestScene';
import { InnerCityScene } from './scenes/InnerCityScene';
import { TitleScene } from './scenes/TitleScene';
import { TownScene } from './scenes/TownScene';
import { UIScene } from './scenes/UIScene';
import { ValleyScene } from './scenes/ValleyScene';

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
  scene: [
    BootScene,
    TitleScene,
    TownScene,
    ForestScene,
    CaveScene,
    InnerCityScene,
    ValleyScene,
    UIScene,
  ],
};

const game = new Phaser.Game(config);

// Hỗ trợ kiểm thử trình duyệt & chẩn đoán nhẹ trong môi trường nội bộ (không gửi mạng)
if (typeof window !== 'undefined') {
  (window as unknown as { __GIANG_HO_GAME__?: Phaser.Game }).__GIANG_HO_GAME__ = game;
}
