// Phaser game config + boot
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { LobbyScene } from './scenes/LobbyScene.js';
import { GameScene } from './scenes/GameScene.js';
import { BossScene } from './scenes/BossScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { CoopScene } from './scenes/CoopScene.js';
import { LeaderboardScene } from './scenes/LeaderboardScene.js';

const config = {
  type: Phaser.AUTO,
  width: 540, height: 960,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  backgroundColor: '#0a0a1a',
  scene: [BootScene, TitleScene, LobbyScene, GameScene, BossScene, GameOverScene, CoopScene, LeaderboardScene]
};

new Phaser.Game(config);
