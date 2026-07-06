// Timer: countdown with callback
export class Countdown {
  constructor(scene, durationSec, onWarn, onExpire) {
    this.scene = scene;
    this.duration = durationSec;
    this.remaining = durationSec;
    this.onWarn = onWarn;
    this.onExpire = onExpire;
    this.event = null;
  }

  start() {
    this.event = this.scene.time.addEvent({
      delay: 1000,
      callback: this.tick,
      callbackScope: this,
      loop: true,
    });
  }

  tick() {
    this.remaining--;
    if (this.remaining === 10 && this.onWarn) this.onWarn();
    if (this.remaining <= 0) {
      this.stop();
      if (this.onExpire) this.onExpire();
    }
  }

  freeze(sec) {
    if (this.event) {
      this.event.paused = true;
      this.scene.time.delayedCall(sec * 1000, () => {
        if (this.event) this.event.paused = false;
      });
    }
  }

  stop() { if (this.event) { this.event.remove(); this.event = null; } }
}
