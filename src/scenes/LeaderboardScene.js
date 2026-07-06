// LeaderboardScene: top scores from localStorage (no Firebase to keep it simple)
// In production swap localStorage for Firebase Realtime DB
export class LeaderboardScene extends Phaser.Scene {
  constructor() { super('LeaderboardScene'); }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    this.cameras.main.setBackgroundColor('#0a0a1a');

    this.add.text(W/2, 40, '🏆 LEADERBOARD', {
      fontFamily: 'monospace', fontSize: '28px', color: '#ffd60a', fontStyle: 'bold'
    }).setOrigin(0.5);

    const scores = this.getScores();
    if (scores.length === 0) {
      this.add.text(W/2, H/2, 'No scores yet!\nPlay to get on the board.', {
        fontFamily: 'monospace', fontSize: '18px', color: '#888', align: 'center'
      }).setOrigin(0.5);
    } else {
      scores.slice(0, 10).forEach((s, i) => {
        const y = 100 + i * 36;
        const rank = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`;
        this.add.text(40, y, rank, { fontFamily: 'monospace', fontSize: '18px', color: '#ffd60a' });
        this.add.text(90, y, s.name, { fontFamily: 'monospace', fontSize: '16px', color: '#fff' });
        this.add.text(W - 80, y, `${s.score}`, { fontFamily: 'monospace', fontSize: '16px', color: '#00f5d4' });
        this.add.text(W - 30, y, `S${s.stage}`, { fontFamily: 'monospace', fontSize: '14px', color: '#8ad3ff' });
      });
    }

    const backBtn = this.add.text(W/2, H - 40, '< BACK', {
      fontFamily: 'monospace', fontSize: '18px', color: '#888'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.scene.start('TitleScene'));
  }

  getScores() {
    try {
      const raw = localStorage.getItem('bombdefuser_leaderboard') || '[]';
      return JSON.parse(raw).sort((a, b) => b.score - a.score);
    } catch (e) { return []; }
  }
}

export function submitScore(name, stage, score) {
  try {
    const raw = localStorage.getItem('bombdefuser_leaderboard') || '[]';
    const scores = JSON.parse(raw);
    scores.push({
      name: (name || 'Player').slice(0, 16),
      stage, score,
      timestamp: Date.now()
    });
    scores.sort((a, b) => b.score - a.score);
    localStorage.setItem('bombdefuser_leaderboard', JSON.stringify(scores.slice(0, 50)));
  } catch (e) { /* localStorage unavailable */ }
}
