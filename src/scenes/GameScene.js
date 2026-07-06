import { generateBoard, floodReveal, countUnrevealedSafe } from '../logic/Board.js';
import { getStage } from '../logic/StageData.js';
import { Countdown } from '../logic/Timer.js';

export class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.stageNum = data.stage || 1;
    this.config = getStage(this.stageNum);
    this.lives = this.config.lives;
    this.score = 0;
    this.combo = 0;
    this.comboMax = 0;
    this.revealed = 0;
  }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // Background
    this.cameras.main.setBackgroundColor('#0a0a1a');

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
    this.cellSize = 56;
    this.boardW = this.config.cols * this.cellSize;
    this.boardH = this.config.rows * this.cellSize;
    this.boardX = (W - this.boardW) / 2;
    this.boardY = 160;

    // Render grid
    this.cellSprites = [];
    for (let r = 0; r < this.config.rows; r++) {
      this.cellSprites[r] = [];
      for (let c = 0; c < this.config.cols; c++) {
        const x = this.boardX + c * this.cellSize + this.cellSize/2;
        const y = this.boardY + r * this.cellSize + this.cellSize/2;
        const sprite = this.add.image(x, y, 'tile_revealed').setInteractive({ useHandCursor: true });
        sprite.setData('r', r);
        sprite.setData('c', c);
        // Click to reveal, right-click to flag
        sprite.on('pointerdown', (ptr) => this.handleClick(ptr, r, c));
        this.cellSprites[r][c] = sprite;
      }
    }

    // Power-up bar (bottom)
    const puY = H - 50;
    this.powerupIcons = [];
    for (let i = 0; i < 4; i++) {
      const px = W/2 - 180 + i * 90;
      const pu = this.add.image(px, puY, `btn_powerup_${i+1}`).setScale(1.4);
      this.powerupIcons.push(pu);
    }

    // Timer
    this.timer = new Countdown(this, this.config.time,
      () => this.sound.play('timer_warning'),
      () => this.gameOver(false)
    );
    this.timer.start();
  }

  handleClick(ptr, r, c) {
    const cell = this.grid[r][c];
    if (cell.revealed) return;
    if (ptr.rightButtonDown()) {
      // Flag
      cell.flagged = !cell.flagged;
      this.cellSprites[r][c].setTexture(cell.flagged ? 'tile_flag' : 'tile_revealed');
      this.sound.play('flag_place');
      return;
    }
    if (cell.flagged) return;

    if (cell.mine) {
      // Boom!
      this.sound.play('mine_explode');
      this.lives--;
      this.cameras.main.flash(200, 255, 0, 0);
      this.cameras.main.shake(200, 0.01);
      if (this.lives >= 0) this.livesIcons[this.lives].setTexture('heart_empty');
      this.combo = 0;
      // Reveal the mine
      cell.revealed = true;
      this.cellSprites[r][c].setTexture('tile_mine');
      if (this.lives <= 0) this.gameOver(false);
    } else {
      // Safe
      floodReveal(this.grid, r, c);
      this.combo++;
      if (this.combo > this.comboMax) this.comboMax = this.combo;
      const mult = this.combo >= 7 ? 3 : this.combo >= 5 ? 2 : this.combo >= 3 ? 1.5 : 1;
      this.sound.play('cell_reveal');
      if (mult > 1) this.sound.play(`combo_${mult === 1.5 ? 1 : mult === 2 ? 2 : 3}`);
      this.refreshBoard();
      this.score = Math.floor(this.score + 10 * this.config.stage * mult);
      this.scoreText.setText(this.score.toString());

      // Check stage clear
      if (countUnrevealedSafe(this.grid) === 0) {
        this.timer.stop();
        this.sound.play('stage_clear');
        const timeBonus = this.timer.remaining * 5;
        const lifeBonus = this.lives * 50;
        this.score += timeBonus + lifeBonus;
        this.time.delayedCall(1500, () => {
          this.scene.start('GameScene', { stage: this.stageNum + 1 });
        });
      }
    }
  }

  refreshBoard() {
    for (let r = 0; r < this.config.rows; r++) {
      for (let c = 0; c < this.config.cols; c++) {
        const cell = this.grid[r][c];
        if (!cell.revealed) continue;
        if (cell.mine) this.cellSprites[r][c].setTexture('tile_mine');
        else if (cell.adjacent > 0) {
          // Use safe tile with number overlay (text)
          this.cellSprites[r][c].setTexture('tile_safe');
          this.cellSprites[r][c].setData('num', cell.adjacent);
        } else {
          this.cellSprites[r][c].setTexture('tile_revealed');
        }
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

  gameOver(won) {
    this.timer.stop();
    this.sound.play(won ? 'stage_clear' : 'stage_fail');
    this.add.text(this.cameras.main.width/2, this.cameras.main.height/2,
      won ? 'STAGE CLEAR!' : 'GAME OVER',
      { fontFamily: 'monospace', fontSize: '40px', color: won ? '#00f5d4' : '#ff4d6d' }
    ).setOrigin(0.5);
  }
}
