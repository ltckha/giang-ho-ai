import Phaser from 'phaser';
import { SCENE_KEYS } from '../game/sceneKeys';
import { generateGameTextures } from '../game/textures';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.BOOT });
  }

  public create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#141210');

    this.add
      .text(width / 2, height / 2, 'Đang đúc linh thạch...', {
        fontSize: '20px',
        color: '#e8c468',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      })
      .setOrigin(0.5);

    generateGameTextures(this);
    this.scene.start(SCENE_KEYS.TITLE);
  }
}
