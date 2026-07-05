# Bomb Defuser — Game Design Spec

**Date:** 2026-07-06
**Status:** Approved
**Author:** Fia (Lead) — delegated to Aura (code) + Mona (art/sfx)
**Engine:** Phaser 3 (latest)

---

## 1. Overview

**Bomb Defuser** is a 2D pixel-art grid puzzle game built on Phaser 3. The player takes the role of a bomb disposal unit, clearing grids of hidden explosives under time pressure. Every 3 stages triggers a Boss Fight — an action mini-game where the player must defuse a complex bomb through timed QTE sequences.

- **Genre:** Grid Puzzle × Action Arcade Hybrid
- **Platform:** Web (desktop + mobile), deployed via GitHub Pages
- **Art Style:** 2D Pixel Art (16-bit inspired, neon-on-dark palette)
- **Multiplayer:** Solo + 2P Co-op (shared screen)
- **Persistence:** localStorage (progress, stats) + Firebase (leaderboard)

---

## 2. Architecture

```
bomb-defuser/
├── index.html              # Entry point — loads Phaser
├── src/
│   ├── main.js             # Phaser game config + boot
│   ├── scenes/
│   │   ├── BootScene.js    # Asset loading, progress bar
│   │   ├── TitleScene.js   # Title screen, animations
│   │   ├── LobbyScene.js   # Stage select, avatar, co-op toggle
│   │   ├── GameScene.js    # Grid puzzle gameplay
│   │   ├── BossScene.js    # Action mini-game
│   │   └── GameOverScene.js# Win/lose screen, stats
│   ├── logic/
│   │   ├── Board.js        # Grid generation, mine placement
│   │   ├── Timer.js        # Countdown + time-freeze
│   │   ├── PowerUp.js      # Shield, Scanner, Freeze, Cross
│   │   └── StageData.js    # 10 stage configs
│   ├── ui/
│   │   ├── HUD.js          # Timer, lives, combo, power-up bar
│   │   └── Leaderboard.js  # Firebase leaderboard integration
│   └── utils/
│       ├── Storage.js      # localStorage wrapper
│       └── SeededRNG.js    # Deterministic random for daily challenge
├── assets/
│   ├── img/                # Sprites, backgrounds, tiles (Mona)
│   ├── sfx/                # Sound effects (Mona)
│   └── fonts/              # Pixel fonts
└── docs/
    └── superpowers/specs/  # This document
```

**Dependencies:**
- `phaser` (npm, latest 3.x)
- `firebase` (npm, for leaderboard only — lazy loaded)

**No build tooling required** — single-file HTML + ES modules served raw. Phaser loaded from CDN (or bundled via npm for local dev).

---

## 3. Core Gameplay — Grid Puzzle

### 3.1 Board

| Stage | Grid Size | Mines | Time (s) | Lives |
|-------|-----------|-------|----------|-------|
| 1-2   | 6×6       | 5     | 120      | 3     |
| 3*    | 8×8       | 10    | 120      | 3     |
| 4-5   | 8×8       | 12    | 100      | 3     |
| 6*    | 10×10     | 18    | 100      | 3     |
| 7-8   | 10×10     | 22    | 80       | 3     |
| 9*    | 12×12     | 30    | 80       | 3     |
| 10*   | 12×12     | 35    | 60       | 2     |

`*` = Boss stage (triggers BossScene after grid clear)

### 3.2 Cell Types

| Cell | Behavior |
|------|----------|
| 🔹 Safe (number) | Reveals adjacent mine count. Number = danger level. |
| 💣 Mine | Game over — lose 1 life. Remaining mines persist. |
| ⚡ Boss Trigger | Found on boss stages (3/6/9/10). Collect 3 to unlock boss fight. |
| 🧰 Power-up | Random drop from safe cells. Shield/Scanner/Freeze/Cross. |

### 3.3 Controls

| Platform | Reveal | Flag | Power-up |
|----------|--------|------|----------|
| Desktop | Left click | Right click / F key | Number keys 1-4 or click bar |
| Mobile | Tap | Swipe left / long-press (500ms) | Bottom sheet buttons |
| Co-op | P1: left half + blue cells | P2: right half + red cells | Each player has own power-up bar |

### 3.4 Scored System

- **Base score:** 10 points per safe cell revealed.
- **Combo multiplier:** Reveal 3+ safe cells in a row without flagging → ×1.5, 5+ → ×2, 7+ → ×3.
- **Time bonus:** Remaining seconds × 5 at stage clear.
- **Lives bonus:** Each remaining life × 50.
- **Stage multiplier:** Stage number × base score.

### 3.5 Power-ups (1 use each per stage)

| Power-up | Effect | Icon |
|----------|--------|------|
| 🛡️ Shield | Absorb 1 mine hit | Blue shield pixel icon |
| 🔍 Scanner | Reveal a random safe cell | Green radar pixel icon |
| ❄️ Time Freeze | Pause timer for 15 seconds | Ice crystal pixel icon |
| ✚ Reveal Cross | Reveal entire row + column of cell | Orange crosshair pixel icon |

---

## 4. Boss Fight — Action Mini-Game

Triggered after clearing a boss stage grid. The scene transitions seamlessly (screen shake → fade → zoom into bomb).

### 4.1 Boss Scene Design

- **Visual:** Large pixel-art bomb in center of screen. 6-8 colored wires sprouting from it.
- **Mechanic:** Wires highlight in sequence (Simon Says style). Player must tap/cut them in the same order within a time window.
- **Difficulty scaling:**
  - Stage 3: 6 wires, sequence length 4, window 3s
  - Stage 6: 7 wires, sequence length 6, window 2.5s
  - Stage 9: 8 wires, sequence length 8, window 2s
  - Stage 10: 8 wires, sequence length 10, window 1.5s, 2 fake wires

### 4.2 QTE Integration

During the wire-cutting sequence, random **QTE pulses** appear (red circles expanding/contracting). Player must tap at the right moment:
- **Too early/late:** Lose 1 boss life (3 total)
- **Correct timing:** Bonus points, combo continues

### 4.3 Co-op Boss

- P1 handles left 4 wires, P2 handles right 4 wires
- Sequence alternates between players
- Must coordinate — if one fails, both retry

---

## 5. Meta Systems

### 5.1 Progression

- All 10 stages locked except Stage 1
- Clear a stage → unlock next
- Boss stages (3, 6, 9) require clearing the boss fight to unlock 4, 7, 10
- Stage 10 is the final boss — beat it to see credits

### 5.2 Leaderboard (Firebase)

- **Schema:** `{ name, stage, score, time, date }`
- Display top 10 on lobby screen
- Optional: global vs friends filter

### 5.3 Stats & Achievements (localStorage)

| Achievement | Condition |
|-------------|-----------|
| First Blood | Clear Stage 1 |
| Speed Demon | Clear any stage with >50% time remaining |
| Flawless | Clear any stage with 0 lives lost |
| Combo King | Get ×3 combo in any stage |
| Scavenger | Use all 4 power-ups in one stage |
| Boss Slayer | Beat a boss fight |
| Wire Master | Beat a boss with 0 mistakes |
| Full Clear | Complete all 10 stages |
| Iron Man | Complete game with ≤3 deaths total |
| Co-op Crew | Complete any stage in co-op mode |

### 5.4 Daily Challenge

- Fixed seed per date, one stage only
- Compete for leaderboard position
- Different from campaign progress

---

## 6. Art Direction (Mona)

### 6.1 Style

- **2D Pixel Art**, 16-bit neon aesthetic
- **Color palette:** Dark background (#0a0a1a), neon accent colors (cyan, magenta, lime, gold)
- **Sprite size:** 32×32 base, 64×64 for bosses/characters
- **No antialiasing:** Crisp pixels (`image-rendering: pixelated`)

### 6.2 Asset List (84 files)

| Category | Count | Description |
|----------|-------|-------------|
| Tile sprites | 6 | Safe, Mine, Boss trigger, Power-up, Flag, Revealed |
| Player character | 4 | Idle, Walk, Cut, Defuse animations |
| Boss sprites | 4 | Stage 3/6/9/10 boss bombs |
| Wires | 8 | Colored wires for boss scene |
| Power-up icons | 4 | Shield, Scanner, Freeze, Cross |
| Backgrounds | 10 | One per stage theme |
| UI elements | 8 | Buttons, timer, life hearts, power-up bar |
| Particles | 4 | Explosion, spark, smoke, confetti |
| Title screen | 1 | Bomb Defuser logo pixel art |
| Sound effects | 35 | SFX for all actions |

### 6.3 Stage Themes (Pixel Art Backgrounds)

| Stage | Theme | Color |
|-------|-------|-------|
| 1-2 | 🏢 Office | Cool blue + gray |
| 3 | 💼 Bank Vault | Gold + dark teal |
| 4-5 | 🏭 Factory | Orange + brown |
| 6 | 🚇 Subway | Deep purple + yellow |
| 7-8 | 🏗️ Construction | Steel gray + hazard yellow |
| 9 | 🛸 Alien Ship | Lime green + magenta |
| 10 | 🔥 Nuclear Core | Crimson red + orange glow |

---

## 7. Audio (Mona)

| Category | Count | Description |
|----------|-------|-------------|
| Grid cell reveal | 1 | Soft click/pop |
| Mine explosion | 1 | Loud blast + rumble |
| Flag place | 1 | Metallic snap |
| Combo activation | 1 | Rising tone, 3 tiers |
| Power-up use | 4 | Unique per power-up |
| Boss wire cut | 1 | Snip + electrical hum |
| Boss QTE hit | 1 | Satisfying ding |
| Boss QTE miss | 1 | Buzzer |
| Stage clear | 1 | Victory jingle |
| Stage fail | 1 | Sad trombone |
| BGM (stage) | 10 | Ambient tension per stage theme |
| BGM (boss) | 4 | High-tempo per boss |
| Menu/UI | 4 | Hover, click, transition, notification |
| **Total** | **~31** | |

---

## 8. Responsive Design

- **Phaser Scale Manager:** `FIT` mode — scales canvas to fill viewport while maintaining aspect ratio
- **Aspect ratio:** 9:16 (portrait mobile) or 16:9 (landscape desktop)
- **Phaser config:** `scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }`
- **Touch-first:** All interactions work with touch (tap, swipe, long-press)
- **No CSS grid issues** — Phaser handles layout internally

---

## 9. Technical Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Engine | Phaser 3 latest | Industry standard for 2D web games |
| Bundler | None | ES modules loaded directly, no build step |
| Phaser load | CDN `<script>` | Simplest deployment |
| Persistence | localStorage | No backend needed for progress |
| Leaderboard | Firebase | Free tier, real-time, JSON API |
| AI art | OpenRouter Gemini | Free tier for asset generation |
| SFX | Procedural + OpenRouter | Generate WAV via Python struct module |
| Deployment | GitHub Pages | Auto via GitHub Actions |

---

## 10. Implementation Order (MVP → Full)

### Phase 1: Core Loop (1-2 days)
- [ ] Phaser project setup, BootScene + TitleScene
- [ ] Board generation + rendering (Stage 1 only, 6×6)
- [ ] Click/tap to reveal cells
- [ ] Mine detection, lives, basic HUD
- [ ] Stage clear → Stage 2
- [ ] Timer countdown

### Phase 2: Full Gameplay (1-2 days)
- [ ] All 10 stage configs
- [ ] Power-ups (all 4)
- [ ] Combo system + scoring
- [ ] Boss Fight scene (wire cutting + QTE)
- [ ] LobbyScene (stage select, avatar)
- [ ] GameOverScene (stats, retry)

### Phase 3: Polish (1-2 days)
- [ ] All pixel art assets (Mona)
- [ ] All SFX + BGM (Mona)
- [ ] Particle effects (explosion, spark, confetti)
- [ ] Screen shake, juice animations
- [ ] Mobile touch controls
- [ ] Co-op mode

### Phase 4: Meta (1 day)
- [ ] localStorage progress + stats
- [ ] Achievements (10)
- [ ] Firebase leaderboard
- [ ] Daily Challenge
- [ ] GitHub Pages deploy

---