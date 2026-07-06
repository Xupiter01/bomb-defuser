// BootScene: load assets + show progress bar
export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    const cx = this.cameras.main.width / 2;
    const cy = this.cameras.main.height / 2;
    this.add.text(cx, cy - 80, '💣 BOMB DEFUSER', { fontFamily: 'monospace', fontSize: '32px', color: '#ff4d6d' }).setOrigin(0.5);
    this.add.text(cx, cy - 40, 'Loading...', { fontFamily: 'monospace', fontSize: '18px', color: '#8ad3ff' }).setOrigin(0.5);

    // Progress bar
    const barW = 280, barH = 16;
    const barBg = this.add.rectangle(cx, cy + 20, barW, barH, 0x222244).setOrigin(0.5);
    const barFill = this.add.rectangle(cx - barW/2, cy + 20, 0, barH, 0x00f5d4).setOrigin(0, 0.5);

    this.load.on('progress', (p) => { barFill.width = barW * p; });

    // Load tiles
    for (const t of ['safe', 'mine', 'boss', 'powerup', 'flag', 'revealed']) {
      this.load.image(`tile_${t}`, `assets/img/tile_${t}.png`);
    }
    // UI
    for (const k of ['heart_full', 'heart_empty', 'btn_play']) {
      this.load.image(k, `assets/img/${k}.png`);
    }
    for (let i = 1; i <= 4; i++) {
      this.load.image(`btn_powerup_${i}`, `assets/img/btn_powerup_${i}.png`);
    }
    // SFX
    for (const s of ['cell_reveal', 'mine_explode', 'flag_place', 'combo_1', 'combo_2', 'combo_3', 'timer_warning', 'stage_clear', 'stage_fail']) {
      this.load.audio(s, `assets/sfx/${s}.wav`);
    }
  }

  create() {
    this.scene.start('TitleScene');
  }
}
