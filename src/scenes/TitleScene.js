// TitleScene: title + Play button → start Stage 1
export class TitleScene extends Phaser.Scene {
  constructor() { super('TitleScene'); }

  create() {
    const cx = this.cameras.main.width / 2;
    const cy = this.cameras.main.height / 2;

    this.add.text(cx, cy - 180, '💣', { fontSize: '80px' }).setOrigin(0.5);
    this.add.text(cx, cy - 80, 'BOMB DEFUSER', { fontFamily: 'monospace', fontSize: '36px', color: '#ff4d6d', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(cx, cy - 40, 'A pixel art grid puzzle', { fontFamily: 'monospace', fontSize: '16px', color: '#8ad3ff' }).setOrigin(0.5);

    // Play button
    const playBtn = this.add.image(cx, cy + 60, 'btn_play').setInteractive({ useHandCursor: true });
    playBtn.setScale(2);
    playBtn.on('pointerover', () => playBtn.setScale(2.1));
    playBtn.on('pointerout', () => playBtn.setScale(2));
    playBtn.on('pointerdown', () => {
      this.scene.start('GameScene', { stage: 1 });
    });

    this.add.text(cx, cy + 200, 'Tap PLAY to start Stage 1', { fontFamily: 'monospace', fontSize: '14px', color: '#888' }).setOrigin(0.5);
  }
}
