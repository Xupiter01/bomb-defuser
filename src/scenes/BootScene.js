// BootScene: load assets + show progress bar
export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    const cx = this.cameras.main.width / 2;
    const cy = this.cameras.main.height / 2;
    const assetVersion = '20260706-audiofix';
    const asset = (path) => `${path}?v=${assetVersion}`;
    this.add.text(cx, cy - 80, '💣 BOMB DEFUSER', { fontFamily: 'monospace', fontSize: '32px', color: '#ff4d6d' }).setOrigin(0.5);
    this.add.text(cx, cy - 40, 'Loading...', { fontFamily: 'monospace', fontSize: '18px', color: '#8ad3ff' }).setOrigin(0.5);

    const barW = 280, barH = 16;
    this.add.rectangle(cx, cy + 20, barW, barH, 0x222244).setOrigin(0.5);
    const barFill = this.add.rectangle(cx - barW/2, cy + 20, 0, barH, 0x00f5d4).setOrigin(0, 0.5);

    this.load.on('progress', (p) => { barFill.width = barW * p; });

    // Tiles
    for (const t of ['safe', 'mine', 'boss', 'powerup', 'flag', 'revealed']) {
      this.load.image(`tile_${t}`, asset(`assets/img/tile_${t}.png`));
    }
    // UI
    for (const k of ['heart_full', 'heart_empty', 'btn_play']) {
      this.load.image(k, asset(`assets/img/${k}.png`));
    }
    for (let i = 1; i <= 4; i++) {
      this.load.image(`btn_powerup_${i}`, asset(`assets/img/btn_powerup_${i}.png`));
    }
    // Boss + Wires
    for (let i = 1; i <= 4; i++) {
      this.load.image(`boss_${i}`, asset(`assets/img/boss_${i}.png`));
    }
    for (const c of ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'white', 'black']) {
      this.load.image(`wire_${c}`, asset(`assets/img/wire_${c}.png`));
    }
    // Backgrounds (in subfolder)
    for (const b of ['bg_office', 'bg_vault', 'bg_factory', 'bg_subway', 'bg_construction', 'bg_alien', 'bg_nuclear']) {
      this.load.image(b, asset(`assets/img/bg/${b}.png`));
    }
    // Player (4 frames per anim)
    for (const anim of ['idle', 'walk', 'cut', 'defuse']) {
      for (let i = 1; i <= 4; i++) {
        this.load.image(`player_${anim}_${i}`, asset(`assets/img/player_${anim}_${i}.png`));
      }
    }
    // Particles
    for (const p of ['particle_explosion', 'particle_spark', 'particle_smoke', 'particle_confetti']) {
      this.load.image(p, asset(`assets/img/${p}.png`));
    }
    // SFX
    const sfxList = [
      'cell_reveal', 'mine_explode', 'flag_place',
      'combo_1', 'combo_2', 'combo_3',
      'timer_warning', 'stage_clear', 'stage_fail',
      'powerup_shield', 'powerup_scan', 'powerup_freeze', 'powerup_crosshair',
      'wire_cut', 'qte_hit', 'qte_miss',
    ];
    for (const s of sfxList) {
      this.load.audio(s, asset(`assets/sfx/${s}.wav`));
    }
    // BGM (per location, not per stage)
    for (const loc of ['office', 'vault', 'factory', 'subway', 'construction', 'alien', 'nuclear']) {
      this.load.audio(`bgm_${loc}`, asset(`assets/sfx/bgm_${loc}.wav`));
    }
    // Boss BGM
    for (const n of [3, 6, 9, 10]) {
      this.load.audio(`bgm_boss_stage${n}`, asset(`assets/sfx/bgm_boss_stage${n}.wav`));
    }
  }

  create() {
    // Delay one tick so remote/CDN builds reliably transition after the loader completes.
    this.time.delayedCall(0, () => this.scene.start('TitleScene'));
  }
}
