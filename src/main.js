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
  parent: 'game',
  width: 540, height: 960,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  backgroundColor: '#0a0a1a',
  scene: [BootScene, TitleScene, LobbyScene, GameScene, BossScene, GameOverScene, CoopScene, LeaderboardScene]
};

// Expose for browser smoke tests and debugging.
window.game = new Phaser.Game(config);

// Safety fallback for static hosts/CDN cache edge cases: if Boot completes but no scene
// is active, bring up the title screen rather than leaving a black canvas.
window.setTimeout(() => {
  const scenes = window.game?.scene?.scenes || [];
  const hasActiveScene = scenes.some((scene) => scene.scene.isActive());
  if (!hasActiveScene && window.game?.scene?.getScene('TitleScene')) {
    window.game.scene.start('TitleScene');
  }
}, 1500);
