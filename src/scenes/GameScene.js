import { generateBoard, floodReveal, countUnrevealedSafe } from '../logic/Board.js';
import { getStage } from '../logic/StageData.js';
import { Countdown } from '../logic/Timer.js';
import { submitScore } from './LeaderboardScene.js';

const STAGE_BG = {
  1: 'bg_office', 2: 'bg_office',
  3: 'bg_vault',  4: 'bg_factory', 5: 'bg_factory',
  6: 'bg_subway', 7: 'bg_construction', 8: 'bg_construction',
  9: 'bg_alien',  10: 'bg_nuclear',
};

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.stageNum = data.stage || 1;
    this.config = getStage(this.stageNum);
    this.lives = this.config.lives;
    this.score = data.score || 0;
    this.combo = 0;
    this.comboMax = 0;
    this.playerShield = false;
    this.coop = data.coop || false;
    this.isHost = data.isHost !== false;
    this.isMyTurn = !this.coop || this.isHost;
  }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // Background (per stage)
    const bgKey = STAGE_BG[this.stageNum] || 'bg_office';
    this.add.image(W/2, H/2, bgKey).setDisplaySize(W, H);

    // HUD: stage, lives, timer
    this.add.text(W/2, 30, `STAGE ${this.stageNum}`, { fontFamily: 'monospace', fontSize: '20px', color: '#8ad3ff' }).setOrigin(0.5);
    this.timerText = this.add.text(W/2, 60, this.config.time + 's', { fontFamily: 'monospace', fontSize: '28px', color: '#ffd60a' }).setOrigin(0.5);
    this.scoreText = this.add.text(W/2, 92, '0', { fontFamily: 'monospace', fontSize: '16px', color: '#8ad3ff' }).setOrigin(0.5);

    // Lives (hearts top-right)
    this.livesIcons = [];
    for (let i = 0; i < this.config.lives; i++) {
      const h = this.add.image(W - 20 - i * 36, 30, 'heart_full').setScale(0.8);
      this.livesIcons.push(h);
    }

    // Generate board
    this.grid = generateBoard(this.config.cols, this.config.rows, this.config.mines);
    this.cellSize = Math.min(56, Math.floor((W - 40) / this.config.cols));
    this.boardW = this.config.cols * this.cellSize;
    this.boardH = this.config.rows * this.cellSize;
    this.boardX = (W - this.boardW) / 2;
    this.boardY = 160;

    // Render grid
    this.cellSprites = [];
    this.numberTexts = [];
    for (let r = 0; r < this.config.rows; r++) {
      this.cellSprites[r] = [];
      this.numberTexts[r] = [];
      for (let c = 0; c < this.config.cols; c++) {
        const x = this.boardX + c * this.cellSize + this.cellSize/2;
        const y = this.boardY + r * this.cellSize + this.cellSize/2;
        const sprite = this.add.image(x, y, 'tile_revealed').setDisplaySize(this.cellSize - 2, this.cellSize - 2).setInteractive({ useHandCursor: true });
        sprite.setData('r', r);
        sprite.setData('c', c);
        sprite.on('pointerdown', (ptr) => this.handleClick(ptr, r, c));
        this.cellSprites[r][c] = sprite;
        const num = this.add.text(x, y, '', {
          fontFamily: 'monospace', fontSize: '20px', color: '#fff', fontStyle: 'bold'
        }).setOrigin(0.5);
        this.numberTexts[r][c] = num;
      }
    }

    // Boss trigger cells (3 cells with ⚡ marker) for boss stages
    if (this.config.isBoss) {
      this.placeBossTriggers();
    }

    // Power-up bar (bottom)
    const puY = H - 50;
    this.powerupIcons = [];
    this.powerupTypes = ['shield', 'scanner', 'freeze', 'cross'];
    this.powerupCharges = { shield: 1, scanner: 2, freeze: 1, cross: 1 };
    for (let i = 0; i < 4; i++) {
      const px = W/2 - 180 + i * 90;
      const pu = this.add.image(px, puY, `btn_powerup_${i+1}`).setScale(1.4).setInteractive({ useHandCursor: true });
      pu.setData('type', this.powerupTypes[i]);
      pu.setData('charges', this.powerupCharges[this.powerupTypes[i]]);
      pu.on('pointerdown', () => this.usePowerup(this.powerupTypes[i]));
      this.powerupIcons.push(pu);
    }
    this.powerupText = this.add.text(W/2, H - 100, '', {
      fontFamily: 'monospace', fontSize: '12px', color: '#8ad3ff'
    }).setOrigin(0.5);

    // Co-op turn indicator
    if (this.coop) {
      this.turnText = this.add.text(W/2, 130, this.isMyTurn ? 'YOUR TURN' : 'WAITING...', {
        fontFamily: 'monospace', fontSize: '14px', color: this.isMyTurn ? '#00f5d4' : '#ffd60a'
      }).setOrigin(0.5);
    }

    // BGM
    if (this.sound.get(`bgm_${STAGE_BG[this.stageNum] || 'office'}`)) {
      this.bgm = this.sound.add(`bgm_${STAGE_BG[this.stageNum] || 'office'}`, { loop: true, volume: 0.3 });
      this.bgm.play();
    }

    // Timer
    this.timer = new Countdown(this, this.config.time,
      () => this.sound.play('timer_warning'),
      () => this.gameOver(false)
    );
    this.timer.start();
  }

  placeBossTriggers() {
    let placed = 0, attempts = 0;
    while (placed < 3 && attempts < 100) {
      const r = Phaser.Math.Between(0, this.config.rows - 1);
      const c = Phaser.Math.Between(0, this.config.cols - 1);
      if (!this.grid[r][c].mine && !this.grid[r][c].bossTrigger) {
        this.grid[r][c].bossTrigger = true;
        this.numberTexts[r][c].setText('⚡').setColor('#ffd60a');
        placed++;
      }
      attempts++;
    }
    this.bossTriggersRevealed = 0;
  }

  handleClick(ptr, r, c) {
    if (this.coop && !this.isMyTurn) return;
    const cell = this.grid[r][c];
    if (cell.revealed) return;
    if (ptr.rightButtonDown()) {
      this.toggleFlag(r, c);
      return;
    }
    if (cell.flagged) return;
    this.reveal(r, c);
    if (this.coop && this.conn) {
      this.conn.send({ type: 'reveal', r, c });
      this.isMyTurn = false;
      if (this.turnText) this.turnText.setText('WAITING...').setColor('#ffd60a');
    }
  }

  toggleFlag(r, c) {
    const cell = this.grid[r][c];
    if (cell.revealed) return;
    cell.flagged = !cell.flagged;
    this.cellSprites[r][c].setTexture(cell.flagged ? 'tile_flag' : 'tile_revealed');
    this.sound.play('flag_place');
  }

  reveal(r, c) {
    const cell = this.grid[r][c];
    if (cell.mine) {
      this.sound.play('mine_explode');
      if (this.playerShield) {
        this.playerShield = false;
        this.powerupText.setText('🛡️ Shield absorbed the hit!');
        this.sound.play('powerup_shield');
        return;
      }
      this.lives--;
      this.cameras.main.flash(200, 255, 0, 0);
      this.cameras.main.shake(200, 0.01);
      if (this.lives >= 0) this.livesIcons[this.lives].setTexture('heart_empty');
      this.combo = 0;
      cell.revealed = true;
      this.cellSprites[r][c].setTexture('tile_mine');
      this.numberTexts[r][c].setText('');
      if (this.lives <= 0) this.gameOver(false);
    } else {
      floodReveal(this.grid, r, c);
      this.combo++;
      if (this.combo > this.comboMax) this.comboMax = this.combo;
      const mult = this.combo >= 7 ? 3 : this.combo >= 5 ? 2 : this.combo >= 3 ? 1.5 : 1;
      this.sound.play('cell_reveal');
      if (mult > 1) this.sound.play(`combo_${mult === 1.5 ? 1 : mult === 2 ? 2 : 3}`);
      this.refreshBoard();
      this.score = Math.floor(this.score + 10 * this.config.stage * mult);
      this.scoreText.setText(this.score.toString());

      if (cell.bossTrigger) {
        this.bossTriggersRevealed++;
        this.sound.play('powerup_shield');
        if (this.bossTriggersRevealed >= 3) {
          this.timer.stop();
          if (this.bgm) this.bgm.stop();
          this.time.delayedCall(500, () => {
            this.scene.start('BossScene', { stage: this.stageNum, score: this.score });
          });
          return;
        }
      }

      if (countUnrevealedSafe(this.grid) === 0) {
        this.stageCleared();
      }
    }
  }

  refreshBoard() {
    const numColors = ['#0000ff', '#008000', '#ff0000', '#000080', '#800000', '#008080', '#000000', '#808080'];
    for (let r = 0; r < this.config.rows; r++) {
      for (let c = 0; c < this.config.cols; c++) {
        const cell = this.grid[r][c];
        if (!cell.revealed) continue;
        if (cell.mine) {
          this.cellSprites[r][c].setTexture('tile_mine');
          this.numberTexts[r][c].setText('');
        } else if (cell.bossTrigger) {
          this.cellSprites[r][c].setTexture('tile_boss');
          this.numberTexts[r][c].setText('⚡').setColor('#ffd60a');
        } else if (cell.adjacent > 0) {
          this.cellSprites[r][c].setTexture('tile_safe');
          this.numberTexts[r][c].setText(String(cell.adjacent)).setColor(numColors[cell.adjacent - 1] || '#fff');
        } else {
          this.cellSprites[r][c].setTexture('tile_revealed');
          this.numberTexts[r][c].setText('');
        }
      }
    }
  }

  usePowerup(type) {
    if (this.powerupCharges[type] <= 0) {
      this.powerupText.setText(`${type}: no charges left!`);
      return;
    }
    this.powerupCharges[type]--;
    this.sound.play('powerup_scan');
    switch (type) {
      case 'shield':
        this.playerShield = true;
        this.powerupText.setText('🛡️ Shield active — next mine is safe!');
        break;
      case 'scanner': {
        // Reveal a random safe cell
        const safe = [];
        for (let r = 0; r < this.config.rows; r++)
          for (let c = 0; c < this.config.cols; c++)
            if (!this.grid[r][c].revealed && !this.grid[r][c].mine) safe.push([r, c]);
        if (safe.length) {
          const [r, c] = safe[Phaser.Math.Between(0, safe.length - 1)];
          this.reveal(r, c);
        }
        break;
      }
      case 'freeze':
        this.timer.pause(15);
        this.powerupText.setText('❄️ Timer frozen 15s');
        break;
      case 'cross': {
        // Reveal one row + one col (but not mines)
        const idx = Phaser.Math.Between(0, this.config.rows - 1);
        const jdx = Phaser.Math.Between(0, this.config.cols - 1);
        for (let c = 0; c < this.config.cols; c++) this.reveal(idx, c);
        for (let r = 0; r < this.config.rows; r++) this.reveal(r, jdx);
        this.powerupText.setText(`✝️ Cross: row ${idx+1} + col ${jdx+1} revealed`);
        break;
      }
    }
  }

  update(time, delta) {
    if (this.timer && this.timer.event) {
      this.timerText.setText(this.timer.remaining + 's');
      if (this.timer.remaining <= 10) this.timerText.setColor('#ff4d6d');
      else this.timerText.setColor('#ffd60a');
    }
  }

  stageCleared() {
    this.timer.stop();
    this.sound.play('stage_clear');
    const timeBonus = this.timer.remaining * 5;
    const lifeBonus = this.lives * 50;
    this.score += timeBonus + lifeBonus;
    if (this.bgm) this.bgm.stop();
    this.time.delayedCall(1500, () => {
      this.scene.start('GameOverScene', {
        won: true,
        stage: this.stageNum,
        score: this.score,
        timeBonus,
        lifeBonus,
      });
    });
  }

  gameOver(won) {
    this.timer.stop();
    if (this.bgm) this.bgm.stop();
    this.sound.play(won ? 'stage_clear' : 'stage_fail');
    submitScore('Player', this.stageNum, this.score);
    this.time.delayedCall(1500, () => {
      this.scene.start('GameOverScene', {
        won,
        stage: this.stageNum,
        score: this.score,
        lives: this.lives,
      });
    });
  }

  shutdown() {
    if (this.bgm) this.bgm.stop();
  }
}
