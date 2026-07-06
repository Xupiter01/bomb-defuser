// TitleScene: title + menu (Play / Leaderboard)
export class TitleScene extends Phaser.Scene {
  constructor() { super('TitleScene'); }

  create() {
    const cx = this.cameras.main.width / 2;
    const cy = this.cameras.main.height / 2;

    this.add.text(cx, cy - 220, '💣', { fontSize: '100px' }).setOrigin(0.5);
    this.add.text(cx, cy - 100, 'BOMB DEFUSER', { fontFamily: 'monospace', fontSize: '32px', color: '#ff4d6d', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(cx, cy - 60, 'A pixel art grid puzzle', { fontFamily: 'monospace', fontSize: '14px', color: '#8ad3ff' }).setOrigin(0.5);

    const startGame = () => this.scene.start('LobbyScene');

    // Play button
    const playBtn = this.add.image(cx, cy + 20, 'btn_play').setInteractive({ useHandCursor: true });
    playBtn.setScale(2);
    playBtn.on('pointerover', () => playBtn.setScale(2.1));
    playBtn.on('pointerout', () => playBtn.setScale(2));
    playBtn.on('pointerdown', startGame);

    // Keyboard fallback for desktop/smoke tests.
    this.input.keyboard.on('keydown-ENTER', startGame);
    this.input.keyboard.on('keydown-SPACE', startGame);

    // Touch fallback: tapping around the play button also starts the lobby.
    this.input.on('pointerdown', (pointer) => {
      if (Phaser.Math.Distance.Between(pointer.x, pointer.y, cx, cy + 20) <= 80) {
        startGame();
      }
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
