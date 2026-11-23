import Phaser from 'phaser';
import './ui/styles.css';
import { BootScene } from './scenes/BootScene';
import { TdStageScene } from './scenes/TdStageScene';
import { TitleScene } from './scenes/TitleScene';

import { music } from './game/music';
import { sound } from './game/sound';

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

const game = new Phaser.Game(config);

if (typeof window !== 'undefined') {
  (window as unknown as { __GIANG_HO_GAME__?: Phaser.Game }).__GIANG_HO_GAME__ = game;
  (window as unknown as { __GON_TIEM_AUDIO__?: { music: typeof music; sound: typeof sound } }).__GON_TIEM_AUDIO__ = {
    music,
    sound,
  };
}
