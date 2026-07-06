// LobbyScene: stage select + Solo/Co-op toggle
import { STAGES } from '../logic/StageData.js';

export class LobbyScene extends Phaser.Scene {
  constructor() { super('LobbyScene'); }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    this.cameras.main.setBackgroundColor('#0a0a1a');

    this.add.text(W/2, 40, 'STAGE SELECT', {
      fontFamily: 'monospace', fontSize: '28px', color: '#8ad3ff'
    }).setOrigin(0.5);

    // Stage grid (5 columns × 2 rows = 10 stages)
    const cols = 5, cellW = 80, cellH = 80, gap = 16;
    const startX = (W - (cols * cellW + (cols-1) * gap)) / 2 + cellW/2;
    const startY = 130;
    STAGES.forEach((s, i) => {
      const r = Math.floor(i / cols), c = i % cols;
      const x = startX + c * (cellW + gap);
      const y = startY + r * (cellH + gap);
      const rect = this.add.rectangle(x, y, cellW, cellH,
        s.isBoss ? 0x6b2a3a : 0x1a2a4a, 0.9).setStrokeStyle(2, s.isBoss ? 0xff4d6d : 0x00f5d4);
      const txt = this.add.text(x, y, `${s.stage}`, {
        fontFamily: 'monospace', fontSize: '24px',
        color: s.isBoss ? '#ff4d6d' : '#8ad3ff', fontStyle: 'bold'
      }).setOrigin(0.5);
      if (s.isBoss) {
        this.add.text(x, y + 24, 'BOSS', {
          fontFamily: 'monospace', fontSize: '10px', color: '#ffd60a'
        }).setOrigin(0.5);
      }
      rect.setInteractive({ useHandCursor: true });
      rect.on('pointerdown', () => {
        this.scene.start('GameScene', { stage: s.stage });
      });
    });

    // Mode toggle
    this.mode = 'solo';
    this.modeText = this.add.text(W/2, 380, 'MODE: SOLO', {
      fontFamily: 'monospace', fontSize: '20px', color: '#8ad3ff'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.modeText.on('pointerdown', () => {
      this.mode = this.mode === 'solo' ? 'coop' : 'solo';
      this.modeText.setText(`MODE: ${this.mode.toUpperCase()}`);
    });

    const startStage = () => {
      if (this.mode === 'coop') {
        this.scene.start('CoopScene');
      } else {
        this.scene.start('GameScene', { stage: 1 });
      }
    };

    // Play button
    const playBtn = this.add.text(W/2, 460, '[ START ]', {
      fontFamily: 'monospace', fontSize: '26px', color: '#00f5d4', fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    playBtn.on('pointerover', () => playBtn.setColor('#fff'));
    playBtn.on('pointerout', () => playBtn.setColor('#00f5d4'));
    playBtn.on('pointerdown', startStage);
    this.input.keyboard.on('keydown-ENTER', startStage);
    this.input.keyboard.on('keydown-SPACE', startStage);

    // Back button
    const backBtn = this.add.text(W/2, 540, '< BACK', {
      fontFamily: 'monospace', fontSize: '16px', color: '#888'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.scene.start('TitleScene'));
  }
}
