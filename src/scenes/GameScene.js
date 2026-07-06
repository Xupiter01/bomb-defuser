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

    // Background (per stage). Keep it atmospheric but subdued so the board stays readable.
    const bgKey = STAGE_BG[this.stageNum] || 'bg_office';
    this.add.image(W/2, H/2, bgKey).setDisplaySize(W, H).setAlpha(0.42).setTint(0x7f8fb8);
    this.add.rectangle(W/2, H/2, W, H, 0x050814, 0.58);

    // HUD: stage, lives, timer
    this.add.text(W/2, 30, `STAGE ${this.stageNum}`, { fontFamily: 'monospace', fontSize: '20px', color: '#8ad3ff', stroke: '#001018', strokeThickness: 4 }).setOrigin(0.5);
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

    // High-contrast board panel separates gameplay from detailed stage art.
    this.add.rectangle(
      W / 2,
      this.boardY + this.boardH / 2,
      this.boardW + 28,
      this.boardH + 28,
      0x050814,
      0.92
    ).setStrokeStyle(4, 0x00f5d4, 0.85);
    this.add.rectangle(
      W / 2,
      this.boardY + this.boardH / 2,
      this.boardW + 14,
      this.boardH + 14,
      0x111a2e,
      0.96
    ).setStrokeStyle(2, 0x8ad3ff, 0.35);

    // High-contrast generated tile textures keep the puzzle readable on phones.
    this.ensureClarityTextures();

    // Render grid
    this.cellSprites = [];
    this.numberTexts = [];
    for (let r = 0; r < this.config.rows; r++) {
      this.cellSprites[r] = [];
      this.numberTexts[r] = [];
      for (let c = 0; c < this.config.cols; c++) {
        const x = this.boardX + c * this.cellSize + this.cellSize/2;
        const y = this.boardY + r * this.cellSize + this.cellSize/2;
        this.add.rectangle(x, y, this.cellSize - 1, this.cellSize - 1, 0x030711, 1)
          .setStrokeStyle(2, 0x20385f, 0.9);
        const sprite = this.add.image(x, y, 'tile_hidden_clear')
          .setDisplaySize(this.cellSize - 6, this.cellSize - 6)
          .setInteractive({ useHandCursor: true });
        sprite.setData('r', r);
        sprite.setData('c', c);
        sprite.on('pointerdown', (ptr) => this.handleClick(ptr, r, c));
        this.cellSprites[r][c] = sprite;
        const num = this.add.text(x, y, '', {
          fontFamily: 'monospace',
          fontSize: `${Math.min(30, Math.floor(this.cellSize * 0.58))}px`,
          color: '#fff',
          fontStyle: 'bold',
          stroke: '#02050c',
          strokeThickness: 6,
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
    const bgmKey = bgKey.replace('bg_', 'bgm_');
    if (this.sound.get(bgmKey)) {
      this.bgm = this.sound.add(bgmKey, { loop: true, volume: 0.3 });
      this.bgm.play();
    }

    // Timer
    this.timer = new Countdown(this, this.config.time,
      () => this.sound.play('timer_warning'),
      () => this.gameOver(false)
    );
    this.timer.start();
  }

  ensureClarityTextures() {
    if (this.textures.exists('tile_hidden_clear')) return;

    const makeTile = (key, fill, stroke, inner = null) => {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(fill, 1);
      g.fillRoundedRect(3, 3, 58, 58, 7);
      g.lineStyle(4, stroke, 1);
      g.strokeRoundedRect(3, 3, 58, 58, 7);
      if (inner) {
        g.lineStyle(2, inner, 0.9);
        g.strokeRoundedRect(13, 13, 38, 38, 4);
      }
      g.generateTexture(key, 64, 64);
      g.destroy();
    };

    makeTile('tile_hidden_clear', 0x0b1830, 0x2f6db3, 0x183b6e);
    makeTile('tile_empty_clear', 0x263957, 0x8ad3ff, null);
    makeTile('tile_safe_clear', 0xd9f1ff, 0x00f5d4, null);
    makeTile('tile_boss_clear', 0x3a2430, 0xffd60a, 0xff4d6d);
    makeTile('tile_mine_clear', 0x3d1018, 0xff4d6d, 0xff9aa8);
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

  countRevealedBossTriggers() {
    let count = 0;
    for (let r = 0; r < this.config.rows; r++) {
      for (let c = 0; c < this.config.cols; c++) {
        if (this.grid[r][c].bossTrigger && this.grid[r][c].revealed) count++;
      }
    }
    return count;
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
    this.cellSprites[r][c].clearTint().setTexture(cell.flagged ? 'tile_flag' : 'tile_hidden_clear');
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
      this.cellSprites[r][c].clearTint().setTexture('tile_mine_clear').setDisplaySize(this.cellSize - 6, this.cellSize - 6);
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
      this.bossTriggersRevealed = this.countRevealedBossTriggers();
      this.score = Math.floor(this.score + 10 * this.config.stage * mult);
      this.scoreText.setText(this.score.toString());

      if (this.config.isBoss && this.bossTriggersRevealed >= 3) {
        this.timer.stop();
        if (this.bgm) this.bgm.stop();
        this.time.delayedCall(500, () => {
          this.scene.start('BossScene', { stage: this.stageNum, score: this.score });
        });
        return;
      }

      if (countUnrevealedSafe(this.grid) === 0) {
        if (this.config.isBoss) {
          this.timer.stop();
          if (this.bgm) this.bgm.stop();
          this.time.delayedCall(500, () => {
            this.scene.start('BossScene', { stage: this.stageNum, score: this.score });
          });
        } else {
          this.stageCleared();
        }
      }
    }
  }

  refreshBoard() {
    const numColors = ['#5ee7ff', '#6cff8d', '#ff5b7a', '#ffd166', '#c77dff', '#00f5d4', '#ffffff', '#ff9f1c'];
    for (let r = 0; r < this.config.rows; r++) {
      for (let c = 0; c < this.config.cols; c++) {
        const cell = this.grid[r][c];
        if (!cell.revealed) continue;
        if (cell.mine) {
          this.cellSprites[r][c].clearTint().setTexture('tile_mine_clear').setDisplaySize(this.cellSize - 6, this.cellSize - 6);
          this.numberTexts[r][c].setText('');
        } else if (cell.bossTrigger) {
          this.cellSprites[r][c].clearTint().setTexture('tile_boss_clear').setDisplaySize(this.cellSize - 6, this.cellSize - 6);
          this.numberTexts[r][c].setText('⚡').setColor('#ffd60a');
        } else if (cell.adjacent > 0) {
          this.cellSprites[r][c].clearTint().setTexture('tile_safe_clear').setDisplaySize(this.cellSize - 6, this.cellSize - 6);
          this.numberTexts[r][c].setText(String(cell.adjacent)).setColor(numColors[cell.adjacent - 1] || '#fff');
        } else {
          this.cellSprites[r][c].clearTint().setTexture('tile_empty_clear').setDisplaySize(this.cellSize - 6, this.cellSize - 6);
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
    const powerupSound = {
      shield: 'powerup_shield',
      scanner: 'powerup_scan',
      freeze: 'powerup_freeze',
      cross: 'powerup_crosshair',
    }[type] || 'powerup_scan';
    this.sound.play(powerupSound);
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
        for (let c = 0; c < this.config.cols; c++) {
          if (!this.grid[idx][c].mine) this.reveal(idx, c);
        }
        for (let r = 0; r < this.config.rows; r++) {
          if (!this.grid[r][jdx].mine) this.reveal(r, jdx);
        }
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
