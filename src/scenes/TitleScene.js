// TitleScene: title + menu (Play / Leaderboard)
export class TitleScene extends Phaser.Scene {
  constructor() { super('TitleScene'); }

  create() {
    const cx = this.cameras.main.width / 2;
    const cy = this.cameras.main.height / 2;

    this.add.text(cx, cy - 220, '💣', { fontSize: '100px' }).setOrigin(0.5);
    this.add.text(cx, cy - 100, 'BOMB DEFUSER', { fontFamily: 'monospace', fontSize: '32px', color: '#ff4d6d', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(cx, cy - 60, 'A pixel art grid puzzle', { fontFamily: 'monospace', fontSize: '14px', color: '#8ad3ff' }).setOrigin(0.5);

    // Play button
    const playBtn = this.add.image(cx, cy + 20, 'btn_play').setInteractive({ useHandCursor: true });
    playBtn.setScale(2);
    playBtn.on('pointerover', () => playBtn.setScale(2.1));
    playBtn.on('pointerout', () => playBtn.setScale(2));
    playBtn.on('pointerdown', () => {
      this.scene.start('LobbyScene');
    });

    // Leaderboard button
    const lbBtn = this.add.text(cx, cy + 130, '🏆 LEADERBOARD', {
      fontFamily: 'monospace', fontSize: '20px', color: '#ffd60a'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    lbBtn.on('pointerover', () => lbBtn.setColor('#fff'));
    lbBtn.on('pointerout', () => lbBtn.setColor('#ffd60a'));
    lbBtn.on('pointerdown', () => this.scene.start('LeaderboardScene'));

    this.add.text(cx, cy + 230, 'Tap PLAY to start', { fontFamily: 'monospace', fontSize: '12px', color: '#888' }).setOrigin(0.5);
  }
}
