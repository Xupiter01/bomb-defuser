// Phaser game config + boot
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { GameScene } from './scenes/GameScene.js';

const config = {
  type: Phaser.AUTO,
  width: 540, height: 960,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  backgroundColor: '#0a0a1a',
  scene: [BootScene, TitleScene, GameScene]
};

new Phaser.Game(config);
