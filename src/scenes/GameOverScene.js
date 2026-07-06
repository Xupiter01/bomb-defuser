// GameOverScene: shown after stage fail or game completion
import { recordStageClear } from '../logic/Progress.js';

export class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  init(data) {
    this.complete = data.complete || false;
    this.won = data.won || false;
    this.stageNum = data.stage || 1;
    this.score = data.score || 0;
    this.lives = data.lives || 0;
    this.timeBonus = data.timeBonus || 0;
    this.lifeBonus = data.lifeBonus || 0;
    this.stars = Math.max(1, Math.min(3, data.stars || 1));
  }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    this.cameras.main.setBackgroundColor(this.won ? '#0a0a1a' : '#1a0a0a');
    if (this.won) recordStageClear(this.stageNum, this.stars);
    this.add.text(W/2, 80, this.complete ? '🏆 BOMB DEFUSER COMPLETE' : (this.won ? '💥 STAGE CLEAR' : '💀 GAME OVER'), {
      fontFamily: 'monospace', fontSize: '36px',
      color: this.won ? '#00f5d4' : '#ff4d6d', fontStyle: 'bold'
    }).setOrigin(0.5);

    if (this.won) {
      this.add.text(W/2, 160, this.complete ? 'All bombs defused. City saved!' : `Stage ${this.stageNum} cleared!`, {
        fontFamily: 'monospace', fontSize: '20px', color: '#fff'
      }).setOrigin(0.5);

      this.add.text(W/2, 195, '★'.repeat(this.stars) + '☆'.repeat(3 - this.stars), {
        fontFamily: 'monospace', fontSize: '30px', color: '#ffd60a', fontStyle: 'bold', stroke: '#3d2500', strokeThickness: 5
      }).setOrigin(0.5);

      this.add.text(W/2, 235, 'Score Breakdown', {
        fontFamily: 'monospace', fontSize: '16px', color: '#8ad3ff'
      }).setOrigin(0.5);
      this.add.text(W/2, 265, `Time bonus: +${this.timeBonus}`, {
        fontFamily: 'monospace', fontSize: '14px', color: '#ffd60a'
      }).setOrigin(0.5);
      this.add.text(W/2, 290, `Lives bonus: +${this.lifeBonus}`, {
        fontFamily: 'monospace', fontSize: '14px', color: '#ffd60a'
      }).setOrigin(0.5);
      this.add.text(W/2, 325, `Total: ${this.score}`, {
        fontFamily: 'monospace', fontSize: '20px', color: '#00f5d4', fontStyle: 'bold'
      }).setOrigin(0.5);

      if (!this.complete && this.stageNum < 10) {
        const nextBtn = this.add.text(W/2, 400, '[ NEXT STAGE ]', {
          fontFamily: 'monospace', fontSize: '22px', color: '#00f5d4'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        nextBtn.on('pointerover', () => nextBtn.setColor('#fff'));
        nextBtn.on('pointerout', () => nextBtn.setColor('#00f5d4'));
        nextBtn.on('pointerdown', () => {
          this.scene.start('GameScene', { stage: this.stageNum + 1, score: this.score });
        });
      }
    } else {
      this.add.text(W/2, 160, `Failed at Stage ${this.stageNum}`, {
        fontFamily: 'monospace', fontSize: '20px', color: '#fff'
      }).setOrigin(0.5);
      this.add.text(W/2, 220, `Final score: ${this.score}`, {
        fontFamily: 'monospace', fontSize: '18px', color: '#ffd60a'
      }).setOrigin(0.5);

      const retryBtn = this.add.text(W/2, 320, '[ RETRY ]', {
        fontFamily: 'monospace', fontSize: '22px', color: '#ff4d6d'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      retryBtn.on('pointerover', () => retryBtn.setColor('#fff'));
      retryBtn.on('pointerout', () => retryBtn.setColor('#ff4d6d'));
      retryBtn.on('pointerdown', () => {
        this.scene.start('GameScene', { stage: this.stageNum });
      });
    }

    const menuBtn = this.add.text(W/2, 460, '[ MAIN MENU ]', {
      fontFamily: 'monospace', fontSize: '18px', color: '#888'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    menuBtn.on('pointerover', () => menuBtn.setColor('#fff'));
    menuBtn.on('pointerout', () => menuBtn.setColor('#888'));
    menuBtn.on('pointerdown', () => {
      this.scene.start('TitleScene');
    });
  }
}
