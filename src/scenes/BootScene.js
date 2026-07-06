// BootScene: load assets + show progress bar
export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    const cx = this.cameras.main.width / 2;
    const cy = this.cameras.main.height / 2;
    this.add.text(cx, cy - 80, '💣 BOMB DEFUSER', { fontFamily: 'monospace', fontSize: '32px', color: '#ff4d6d' }).setOrigin(0.5);
    this.add.text(cx, cy - 40, 'Loading...', { fontFamily: 'monospace', fontSize: '18px', color: '#8ad3ff' }).setOrigin(0.5);

    const barW = 280, barH = 16;
    this.add.rectangle(cx, cy + 20, barW, barH, 0x222244).setOrigin(0.5);
    const barFill = this.add.rectangle(cx - barW/2, cy + 20, 0, barH, 0x00f5d4).setOrigin(0, 0.5);

    this.load.on('progress', (p) => { barFill.width = barW * p; });

    // Tiles
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
    // Boss + Wires
    for (let i = 1; i <= 4; i++) {
      this.load.image(`boss_${i}`, `assets/img/boss_${i}.png`);
    }
    for (const c of ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'white', 'black']) {
      this.load.image(`wire_${c}`, `assets/img/wire_${c}.png`);
    }
    // Backgrounds (Phase 3)
    for (const b of ['bg_office', 'bg_vault', 'bg_factory', 'bg_subway', 'bg_construction', 'bg_alien', 'bg_nuclear']) {
      this.load.image(b, `assets/img/${b}.png`);
    }
    // Player + Particles
    for (const p of ['player_idle', 'player_walk', 'player_cut', 'player_defuse']) {
      this.load.image(p, `assets/img/${p}.png`);
    }
    for (const p of ['particle_explosion', 'particle_spark', 'particle_smoke', 'particle_confetti']) {
      this.load.image(p, `assets/img/${p}.png`);
    }
    // SFX
    const sfxList = [
      'cell_reveal', 'mine_explode', 'flag_place',
      'combo_1', 'combo_2', 'combo_3',
      'timer_warning', 'stage_clear', 'stage_fail',
      'powerup_use', 'shield_use', 'boss_trigger',
      'wire_cut', 'qte_hit', 'qte_miss',
      'boss_bgm_stage3', 'boss_bgm_stage6', 'boss_bgm_stage9', 'boss_bgm_stage10',
    ];
    for (const s of sfxList) {
      this.load.audio(s, `assets/sfx/${s}.wav`);
    }
    // BGM per stage
    for (let i = 1; i <= 10; i++) {
      this.load.audio(`bgm_stage${i}`, `assets/sfx/bgm_stage${i}.wav`);
    }
  }

  create() {
    this.scene.start('TitleScene');
  }
}
