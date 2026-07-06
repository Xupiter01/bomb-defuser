#!/usr/bin/env python3
"""
Bomb Defuser — Phase 3 Audio Generator
สร้าง BGM (14 tracks) + SFX เพิ่มเติม (power-up, wire cut, QTE)
"""
import struct, math, os, random

SR = 44100
OUT_DIR = os.path.dirname(os.path.abspath(__file__))


def write_wav(path, samples):
    """Write a browser-decodable PCM WAV file.

    WAV chunks must be RIFF/WAVE, fmt, data header, then sample bytes.
    The previous version wrote sample bytes before the data chunk, which
    made Web Audio fail with "Unable to decode audio data".
    """
    pcm = b''.join(struct.pack('<h', max(-32767, min(32767, int(s)))) for s in samples)
    with open(path, 'wb') as f:
        f.write(b'RIFF' + struct.pack('<I', 36 + len(pcm)) + b'WAVE')
        f.write(b'fmt ' + struct.pack('<IHHIIHH', 16, 1, 1, SR, SR * 2, 2, 16))
        f.write(b'data' + struct.pack('<I', len(pcm)))
        f.write(pcm)


def sine(freq, t):
    return math.sin(2 * math.pi * freq * t / SR)


def square(freq, t):
    return 1.0 if math.sin(2 * math.pi * freq * t / SR) > 0 else -1.0


def tri(freq, t):
    return 2 * abs(2 * (freq * t / SR - math.floor(freq * t / SR + 0.5))) - 1


def noise():
    return random.uniform(-1.0, 1.0)


def env_exp(i, n, k=6.0):
    return math.exp(-k * i / n)


# === BGM GENERATORS ===
# BGM tracks: procedural loops ~8-16 seconds, ambient tension

def gen_bgm_stage(theme_name, freqs, dur=12.0, filename=None):
    """Generate ambient BGM for a stage theme."""
    n = int(SR * dur)
    samples = [0.0] * n
    # Layered drones
    for freq in freqs:
        amp = 0.08
        for i in range(n):
            # Slow LFO modulation
            lfo = 0.5 + 0.5 * math.sin(2 * math.pi * 0.1 * i / SR)
            samples[i] += amp * lfo * sine(freq, i)
    # Add subtle pulse/heartbeat
    pulse_freq = 0.5  # 1 beat per 2s
    for i in range(n):
        beat = (i / SR * pulse_freq) % 1.0
        if beat < 0.1:
            env = 1.0 - beat / 0.1
            samples[i] += 0.05 * env * sine(freqs[0] / 2, i)
    # Subtle noise bed
    for i in range(n):
        samples[i] += 0.02 * noise() * env_exp(i % (SR // 4), SR // 4, k=2)
    # Fade in/out
    fade = int(SR * 1.0)
    for i in range(fade):
        samples[i] *= i / fade
        samples[n - 1 - i] *= i / fade
    fname = filename or f'bgm_{theme_name}.wav'
    write_wav(os.path.join(OUT_DIR, fname), [s * 32767 for s in samples])
    print(f'✅ {fname} ({dur}s ambient)')


def gen_bgm_boss(boss_name, freqs, tempo=140, dur=10.0, filename=None):
    """Generate high-tempo boss BGM with beat."""
    n = int(SR * dur)
    samples = [0.0] * n
    beat_dur = 60.0 / tempo  # seconds per beat
    beat_samples = int(SR * beat_dur)
    # Bass line (root note pulse)
    bass_freq = freqs[0] / 4
    for i in range(n):
        beat_pos = i % beat_samples
        if beat_pos < beat_samples * 0.3:
            env = 1.0 - beat_pos / (beat_samples * 0.3)
            samples[i] += 0.15 * env * sine(bass_freq, i)
    # Arpeggio
    arp_notes = [f for f in freqs]
    step_samples = beat_samples // 2  # 8th notes
    for i in range(n):
        step = (i // step_samples) % len(arp_notes)
        beat_pos = i % step_samples
        env = env_exp(beat_pos, step_samples, k=8)
        samples[i] += 0.06 * env * sine(arp_notes[step], i)
    # Hi-hat noise
    for i in range(n):
        if (i // (beat_samples // 4)) % 2 == 1:
            hp = i % (beat_samples // 4)
            if hp < 200:
                samples[i] += 0.04 * noise() * (1 - hp / 200)
    # Fade
    fade = int(SR * 0.5)
    for i in range(fade):
        samples[i] *= i / fade
        samples[n - 1 - i] *= i / fade
    fname = filename or f'bgm_boss_{boss_name}.wav'
    write_wav(os.path.join(OUT_DIR, fname), [s * 32767 for s in samples])
    print(f'✅ {fname} ({dur}s boss tempo {tempo}bpm)')


# === SFX GENERATORS ===

def gen_powerup(idx, name):
    """Power-up use sounds — unique per power-up."""
    dur = 0.4
    n = int(SR * dur)
    samples = []
    freqs = [[523, 659, 784], [440, 554, 659], [659, 784, 988], [392, 523, 659]][idx - 1]
    for i in range(n):
        t = i / SR
        # Arpeggio sweep
        note_idx = min(int(t / 0.12), len(freqs) - 1)
        freq = freqs[note_idx]
        env = env_exp(i, n, k=4)
        s = 0.4 * sine(freq, i) * env
        s += 0.15 * sine(freq * 2, i) * env  # harmonic
        # Sparkle
        s += 0.1 * noise() * env_exp(i % 500, 500, k=5)
        samples.append(s * 32767)
    write_wav(os.path.join(OUT_DIR, f'powerup_{name}.wav'), samples)
    print(f'✅ powerup_{name}.wav (0.4s)')


def gen_wire_cut():
    """Snip + electrical hum."""
    dur = 0.3
    n = int(SR * dur)
    samples = []
    for i in range(n):
        t = i / SR
        env = env_exp(i, n, k=10)
        s = 0.3 * square(2000, i) * env  # snip
        s += 0.2 * noise() * env_exp(i, n, k=8)  # cut noise
        # Electrical hum after cut
        if t > 0.05:
            s += 0.15 * sine(120, i) * env_exp(i - int(0.05 * SR), n - int(0.05 * SR), k=2)
        samples.append(s * 32767)
    write_wav(os.path.join(OUT_DIR, 'wire_cut.wav'), samples)
    print('✅ wire_cut.wav (0.3s snip + hum)')


def gen_qte_hit():
    """Satisfying ding."""
    dur = 0.3
    n = int(SR * dur)
    samples = []
    for i in range(n):
        env = env_exp(i, n, k=5)
        s = 0.5 * sine(1318, i) * env  # E6
        s += 0.2 * sine(2637, i) * env  # E7 harmonic
        samples.append(s * 32767)
    write_wav(os.path.join(OUT_DIR, 'qte_hit.wav'), samples)
    print('✅ qte_hit.wav (0.3s ding)')


def gen_qte_miss():
    """Buzzer."""
    dur = 0.3
    n = int(SR * dur)
    samples = []
    for i in range(n):
        env = env_exp(i, n, k=4)
        s = 0.4 * square(150, i) * env  # low buzzer
        s += 0.2 * square(155, i) * env  # detuned
        samples.append(s * 32767)
    write_wav(os.path.join(OUT_DIR, 'qte_miss.wav'), samples)
    print('✅ qte_miss.wav (0.3s buzzer)')


if __name__ == '__main__':
    random.seed(42)
    print('=== Generating Phase 3 Audio ===\n')

    # --- 10 Stage BGM ---
    print('-- Stage BGM (10 tracks) --')
    # Stage 1-2: Office — cool blue/gray (A minor, low tension)
    gen_bgm_stage('office', [220, 277, 330], dur=12)
    # Stage 3: Bank Vault — gold/teal (D minor, mysterious)
    gen_bgm_stage('vault', [147, 196, 247], dur=12)
    # Stage 4-5: Factory — orange/brown (E minor, industrial)
    gen_bgm_stage('factory', [165, 196, 247], dur=12)
    # Stage 6: Subway — purple/yellow (F# minor, tense)
    gen_bgm_stage('subway', [185, 233, 277], dur=12)
    # Stage 7-8: Construction — steel/hazard (G minor, mechanical)
    gen_bgm_stage('construction', [196, 247, 294], dur=12)
    # Stage 9: Alien Ship — lime/magenta (C# minor, eerie)
    gen_bgm_stage('alien', [139, 175, 220], dur=12)
    # Stage 10: Nuclear Core — crimson/orange (B minor, intense)
    gen_bgm_stage('nuclear', [247, 311, 370], dur=12)

    # --- 4 Boss BGM ---
    print('\n-- Boss BGM (4 tracks) --')
    gen_bgm_boss('stage3', [196, 233, 294], tempo=130, dur=10)
    gen_bgm_boss('stage6', [220, 262, 330], tempo=140, dur=10)
    gen_bgm_boss('stage9', [247, 294, 370], tempo=150, dur=10)
    gen_bgm_boss('stage10', [262, 311, 392], tempo=160, dur=10)

    # --- 4 Power-up SFX ---
    print('\n-- Power-up SFX (4) --')
    gen_powerup(1, 'shield')
    gen_powerup(2, 'scan')
    gen_powerup(3, 'freeze')
    gen_powerup(4, 'crosshair')

    # --- Boss SFX ---
    print('\n-- Boss SFX (3) --')
    gen_wire_cut()
    gen_qte_hit()
    gen_qte_miss()

    print('\n🎉 Phase 3 Audio complete!')
    # List
    wavs = sorted([f for f in os.listdir(OUT_DIR) if f.endswith('.wav')])
    print(f'\nTotal WAV files: {len(wavs)}')
    for f in wavs:
        size = os.path.getsize(os.path.join(OUT_DIR, f))
        print(f'  {f:30s} {size/1024:6.1f}KB')
