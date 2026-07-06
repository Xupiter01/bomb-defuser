// CoopScene: PeerJS room-based co-op
// Host: creates room, gets code, waits for peer
// Guest: enters code, joins
// Turn-based: alternate revealing cells
export class CoopScene extends Phaser.Scene {
  constructor() { super('CoopScene'); }

  create() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    this.cameras.main.setBackgroundColor('#0a0a1a');

    this.add.text(W/2, 50, '🤝 CO-OP MODE', {
      fontFamily: 'monospace', fontSize: '28px', color: '#8ad3ff'
    }).setOrigin(0.5);

    // Mode buttons
    const hostBtn = this.add.text(W/2, 160, '[ HOST GAME ]', {
      fontFamily: 'monospace', fontSize: '22px', color: '#00f5d4'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    hostBtn.on('pointerdown', () => this.hostGame());

    const joinBtn = this.add.text(W/2, 220, '[ JOIN GAME ]', {
      fontFamily: 'monospace', fontSize: '22px', color: '#ffd60a'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    joinBtn.on('pointerdown', () => this.joinGame());

    this.statusText = this.add.text(W/2, 350, '', {
      fontFamily: 'monospace', fontSize: '16px', color: '#fff',
      wordWrap: { width: W - 40 }
    }).setOrigin(0.5);

    this.codeText = this.add.text(W/2, 420, '', {
      fontFamily: 'monospace', fontSize: '32px', color: '#ff4d6d', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.inputField = null; // We'll use a DOM input for the code

    const backBtn = this.add.text(W/2, 540, '< BACK', {
      fontFamily: 'monospace', fontSize: '16px', color: '#888'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerdown', () => this.scene.start('LobbyScene'));
  }

  hostGame() {
    if (typeof Peer === 'undefined') {
      this.statusText.setText('❌ PeerJS not loaded. Check console.');
      return;
    }
    this.statusText.setText('Creating room...');
    this.peer = new Peer(undefined);
    this.peer.on('open', (id) => {
      this.roomCode = id;
      this.codeText.setText('CODE: ' + id);
      this.statusText.setText('Waiting for opponent...\nShare this code!');
      this.isHost = true;
    });
    this.peer.on('connection', (conn) => {
      this.conn = conn;
      this.conn.on('open', () => {
        this.statusText.setText('✅ Opponent connected!');
        this.time.delayedCall(1500, () => this.startCoopGame());
      });
    });
    this.peer.on('error', (err) => {
      this.statusText.setText('Error: ' + err.type);
    });
  }

  joinGame() {
    const code = prompt('Enter room code:');
    if (!code) return;
    if (typeof Peer === 'undefined') {
      this.statusText.setText('❌ PeerJS not loaded.');
      return;
    }
    this.statusText.setText('Connecting...');
    this.peer = new Peer(undefined);
    this.peer.on('open', () => {
      this.conn = this.peer.connect(code, { reliable: true });
      this.conn.on('open', () => {
        this.statusText.setText('✅ Connected to host!');
        this.time.delayedCall(1500, () => this.startCoopGame());
      });
      this.conn.on('error', (err) => {
        this.statusText.setText('Connection error: ' + err);
      });
    });
  }

  startCoopGame() {
    if (this.peer) this.peer.destroy();
    this.scene.start('GameScene', { stage: 1, coop: true, isHost: this.isHost });
  }

  shutdown() {
    if (this.peer) this.peer.destroy();
  }
}
