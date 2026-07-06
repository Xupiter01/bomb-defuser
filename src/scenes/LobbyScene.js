// LobbyScene: animated campaign map + Solo/Co-op toggle
import { STAGES } from '../logic/StageData.js';
import { loadProgress } from '../logic/Progress.js';

const MAP_POINTS = [
  [78, 720], [145, 620], [250, 650], [365, 565], [455, 610],
  [420, 455], [300, 405], [170, 455], [110, 310], [275, 245],
];

export class LobbyScene extends Phaser.Scene {
  constructor() { super('LobbyScene'); }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const progress = loadProgress();
    this.selectedStage = Math.min(progress.unlocked, 10);

    this.cameras.main.setBackgroundColor('#07101f');
    this.drawMapBackground(W, H);

    this.add.text(W/2, 38, 'DEFUSE ROUTE', {
      fontFamily: 'monospace', fontSize: '28px', color: '#8ad3ff', fontStyle: 'bold',
      stroke: '#001018', strokeThickness: 5,
    }).setOrigin(0.5);
    this.add.text(W/2, 72, 'Clear stages to unlock the next bomb site', {
      fontFamily: 'monospace', fontSize: '12px', color: '#c8d8ff'
    }).setOrigin(0.5);

    this.drawRoute(progress);
    this.drawNodes(progress);

    this.mode = 'solo';
    this.modeText = this.add.text(W/2, 825, 'MODE: SOLO', {
      fontFamily: 'monospace', fontSize: '18px', color: '#8ad3ff', stroke: '#001018', strokeThickness: 4
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.modeText.on('pointerdown', () => {
      this.mode = this.mode === 'solo' ? 'coop' : 'solo';
      this.modeText.setText(`MODE: ${this.mode.toUpperCase()}`);
    });

    this.playBtn = this.add.text(W/2, 870, `[ PLAY STAGE ${this.selectedStage} ]`, {
      fontFamily: 'monospace', fontSize: '24px', color: '#00f5d4', fontStyle: 'bold',
      stroke: '#003028', strokeThickness: 5,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.playBtn.on('pointerover', () => this.playBtn.setColor('#ffffff'));
    this.playBtn.on('pointerout', () => this.playBtn.setColor('#00f5d4'));
    this.playBtn.on('pointerdown', () => this.startSelected());

    this.input.keyboard.on('keydown-ENTER', () => this.startSelected());
    this.input.keyboard.on('keydown-SPACE', () => this.startSelected());

    const backBtn = this.add.text(W/2, 920, '< BACK', {
      fontFamily: 'monospace', fontSize: '16px', color: '#9aa7c7', stroke: '#001018', strokeThickness: 4
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.scene.start('TitleScene'));
  }

  drawMapBackground(W, H) {
    this.add.rectangle(W/2, H/2, W, H, 0x07101f, 1);
    for (let i = 0; i < 18; i++) {
      const x = Phaser.Math.Between(20, W - 20);
      const y = Phaser.Math.Between(110, 790);
      const size = Phaser.Math.Between(2, 5);
      this.add.circle(x, y, size, 0x17385e, 0.55);
    }
    this.add.rectangle(W/2, 440, W - 36, 650, 0x0b1830, 0.72).setStrokeStyle(3, 0x1e7fb5, 0.55);
    this.add.text(W/2, 112, 'CITY MAP', {
      fontFamily: 'monospace', fontSize: '13px', color: '#4fb6ff', letterSpacing: 4,
    }).setOrigin(0.5);
  }

  drawRoute(progress) {
    const route = this.add.graphics();
    route.lineStyle(10, 0x13243d, 1);
    route.beginPath();
    MAP_POINTS.forEach(([x, y], i) => i === 0 ? route.moveTo(x, y) : route.lineTo(x, y));
    route.strokePath();

    const unlockedRoute = this.add.graphics();
    unlockedRoute.lineStyle(5, 0x00f5d4, 0.85);
    unlockedRoute.beginPath();
    MAP_POINTS.forEach(([x, y], i) => {
      if (i >= progress.unlocked) return;
      i === 0 ? unlockedRoute.moveTo(x, y) : unlockedRoute.lineTo(x, y);
    });
    unlockedRoute.strokePath();

    this.tweens.add({ targets: unlockedRoute, alpha: 0.45, duration: 850, yoyo: true, repeat: -1 });
  }

  drawNodes(progress) {
    STAGES.forEach((stage, i) => {
      const [x, y] = MAP_POINTS[i];
      const unlocked = stage.stage <= progress.unlocked;
      const completedStars = Number(progress.stars[String(stage.stage)] || 0);
      const isCurrent = stage.stage === progress.unlocked && completedStars === 0;
      const isBoss = stage.isBoss;
      const fill = !unlocked ? 0x1b2433 : (isBoss ? 0x5c2030 : 0x123a59);
      const stroke = !unlocked ? 0x526072 : (isBoss ? 0xff4d6d : 0x00f5d4);

      const halo = this.add.circle(x, y, isBoss ? 33 : 29, stroke, unlocked ? 0.16 : 0.05);
      const node = this.add.circle(x, y, isBoss ? 25 : 22, fill, 0.98).setStrokeStyle(4, stroke, unlocked ? 1 : 0.55);
      const label = this.add.text(x, y - 1, unlocked ? String(stage.stage) : '🔒', {
        fontFamily: 'monospace', fontSize: unlocked ? '18px' : '16px',
        color: unlocked ? '#ffffff' : '#8993aa', fontStyle: 'bold', stroke: '#02050c', strokeThickness: 4,
      }).setOrigin(0.5);

      if (isBoss && unlocked) {
        this.add.text(x, y + 34, 'BOSS', {
          fontFamily: 'monospace', fontSize: '10px', color: '#ffd60a', stroke: '#2f1600', strokeThickness: 3,
        }).setOrigin(0.5);
      }

      const starText = completedStars > 0 ? '★'.repeat(completedStars) + '☆'.repeat(3 - completedStars) : (unlocked ? '☆☆☆' : '');
      this.add.text(x, y + 51, starText, {
        fontFamily: 'monospace', fontSize: '15px', color: completedStars ? '#ffd60a' : '#526072',
        stroke: '#02050c', strokeThickness: 4,
      }).setOrigin(0.5);

      // — Tap-to-play interaction on unlocked nodes (tap anywhere on/around the node) —
      if (unlocked) {
        const hitZone = this.add.rectangle(x, y, 68, 68, 0x000000, 0).setInteractive({ useHandCursor: true });
        hitZone.on('pointerdown', () => this.startStage(stage.stage));
      }

      // "NEXT" pulse + label for the current unlockable stage
      if (isCurrent) {
        this.tweens.add({ targets: [node, halo], scale: 1.12, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.add.text(x, y - 40, 'NEXT', {
          fontFamily: 'monospace', fontSize: '11px', color: '#00f5d4', stroke: '#003028', strokeThickness: 4,
        }).setOrigin(0.5);
      }
    });
  }

  startStage(stage) {
    if (this.mode === 'coop') {
      this.scene.start('CoopScene');
    } else {
      this.scene.start('GameScene', { stage });
    }
  }

  startSelected() {
    this.startStage(this.selectedStage);
  }
}
