// BossScene: Simon-Says wire-cutting QTE
import { calculateStars } from '../logic/Progress.js';

// Stages 3/6/9/10 trigger this after grid clear
// Wire counts: stage3=6/4seq, stage6=7/6seq, stage9=8/8seq, stage10=8/10seq
const BOSS_CONFIG = {
  3:  { wires: 6, sequence: 4, bossImg: 'boss_1' },
  6:  { wires: 7, sequence: 6, bossImg: 'boss_2' },
  9:  { wires: 8, sequence: 8, bossImg: 'boss_3' },
  10: { wires: 8, sequence: 10, bossImg: 'boss_4' },
};
const COLORS = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'white', 'black'];

export class BossScene extends Phaser.Scene {
  constructor() { super('BossScene'); }

  init(data) {
    this.stageNum = data.stage || 3;
    this.score = data.score || 0;
    this.config = BOSS_CONFIG[this.stageNum] || BOSS_CONFIG[3];
    this.timeRemaining = data.timeRemaining || 0;
    this.totalTime = data.totalTime || 1;
    this.lives = data.lives || 0;
    this.maxLives = data.maxLives || 3;
    this.mineHits = data.mineHits || 0;
  }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    this.cameras.main.setBackgroundColor('#0a0a1a');

    this.bossLives = 3;
    this.playerWires = 0;
    this.attempts = 0;

    this.add.text(W/2, 30, `⚠️ STAGE ${this.stageNum} BOSS`, {
      fontFamily: 'monospace', fontSize: '24px', color: '#ff4d6d', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.bossLifeText = this.add.text(W/2, 60, 'BOSS HP: ❤️❤️❤️', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ff4d6d'
    }).setOrigin(0.5);

    // Boss image
    this.add.image(W/2, H/2 - 30, this.config.bossImg).setScale(2);

    // Wires around the boss
    this.wires = [];
    const cx = W/2, cy = H/2 - 30;
    const radius = 200;
    for (let i = 0; i < this.config.wires; i++) {
      const angle = (i / this.config.wires) * Math.PI * 2 - Math.PI/2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      const color = COLORS[i % COLORS.length];
      const wire = this.add.image(x, y, `wire_${color}`).setInteractive({ useHandCursor: true }).setScale(1.2);
      wire.setData('color', color);
      wire.setData('idx', i);
      wire.on('pointerdown', () => this.cutWire(wire));
      this.wires.push(wire);
    }

    this.infoText = this.add.text(W/2, H - 60, 'Tap the wires in sequence...', {
      fontFamily: 'monospace', fontSize: '14px', color: '#8ad3ff'
    }).setOrigin(0.5);

    // Play BGM
    this.bgm = this.sound.add(`bgm_boss_stage${this.stageNum}`, { loop: true, volume: 0.4 });
    this.bgm.play();

    // Generate and play sequence
    this.time.delayedCall(500, () => this.startSequence());
  }

  startSequence() {
    this.sequence = [];
    for (let i = 0; i < this.config.sequence; i++) {
      this.sequence.push(Phaser.Math.Between(0, this.config.wires - 1));
    }
    this.infoText.setText('Watch the sequence...');
    this.playSequence(0);
  }

  playSequence(idx) {
    if (idx >= this.sequence.length) {
      this.infoText.setText('Your turn! Tap in order');
      this.playerStep = 0;
      return;
    }
    const wire = this.wires[this.sequence[idx]];
    this.tweens.add({
      targets: wire,
      scale: 1.6,
      alpha: 0.5,
      duration: 300,
      yoyo: true,
      onComplete: () => {
        this.time.delayedCall(200, () => this.playSequence(idx + 1));
      }
    });
    this.sound.play('qte_hit', { volume: 0.3 });
  }

  cutWire(wire) {
    if (this.playerStep === undefined) return;
    const expected = this.sequence[this.playerStep];
    if (wire.getData('idx') === expected) {
      this.sound.play('qte_hit');
      this.sound.play('wire_cut');
      this.tweens.add({
        targets: wire, alpha: 0, scale: 0.5, duration: 200,
        onComplete: () => wire.disableInteractive()
      });
      this.playerStep++;
      this.attempts++;
      if (this.playerStep >= this.sequence.length) {
        this.bossLives--;
        this.bossLifeText.setText('BOSS HP: ' + '❤️'.repeat(this.bossLives) + '🖤'.repeat(3 - this.bossLives));
        this.cameras.main.flash(200, 0, 245, 212);
        if (this.bossLives <= 0) {
          this.sound.play('stage_clear');
          this.infoText.setText(this.stageNum >= 10 ? '💥 FINAL BOMB DEFUSED!' : '💥 BOSS DEFEATED!');
          this.bgm.stop();
          const stars = calculateStars({
            timeRemaining: this.timeRemaining,
            totalTime: this.totalTime,
            lives: this.lives,
            maxLives: this.maxLives,
            mineHits: this.mineHits,
            bossAttempts: this.attempts,
            bossSequence: this.config.sequence,
          });
          this.time.delayedCall(2000, () => {
            this.scene.start('GameOverScene', {
              won: true,
              complete: this.stageNum >= 10,
              stage: this.stageNum,
              score: this.score,
              stars,
            });
          });
        } else {
          this.playerStep = 0;
          this.infoText.setText('Boss stunned! Next sequence...');
          this.time.delayedCall(1500, () => this.startSequence());
        }
      }
    } else {
      this.sound.play('qte_miss');
      this.attempts++;
      this.infoText.setText('Wrong wire! Sequence restarts...');
      this.playerStep = 0;
      // Re-enable all wires
      this.wires.forEach(w => { w.alpha = 1; w.scale = 1.2; w.setInteractive({ useHandCursor: true }); });
      this.time.delayedCall(1000, () => this.startSequence());
    }
  }

  shutdown() {
    if (this.bgm) this.bgm.stop();
  }
}
