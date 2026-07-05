#!/usr/bin/env python3
"""
Bomb Defuser — Procedural SFX Generator
สร้าง SFX ทั้งหมดด้วย Python struct module (sine/square/noise + envelopes)
"""
import struct, math, os, random

SR = 44100  # sample rate
OUT_DIR = os.path.dirname(os.path.abspath(__file__))


def write_wav(path, samples):
    """Write 16-bit mono WAV."""
    with open(path, 'wb') as f:
        f.write(b'RIFF' + struct.pack('<I', 36 + len(samples) * 2) + b'WAVE')
        f.write(b'fmt ' + struct.pack('<IHHIIHH', 16, 1, 1, SR, SR * 2, 2, 16))
        f.write(b'data' + struct.pack('<I', len(samples) * 2))
        f.write(b''.join(struct.pack('<h', max(-32767, min(32767, int(s)))) for s in samples))


def env_exp(t, dur, k=8.0):
    """Exponential decay envelope."""
    return math.exp(-k * t / dur)


def env_adsr(t, dur, a=0.01, d=0.1, s=0.5, r=0.2):
    """ADSR envelope (fractions of dur)."""
    tt = t / dur
    a_r, d_r, r_r = a, d, r
    s_r = 1.0 - a_r - d_r - r_r
    if s_r < 0: s_r = 0.1
    if tt < a_r:
        return tt / a_r if a_r > 0 else 1.0
    elif tt < a_r + d_r:
        return 1.0 - (1.0 - s) * (tt - a_r) / d_r if d_r > 0 else s
    elif tt < a_r + d_r + s_r:
        return s
    else:
        return s * max(0, 1.0 - (tt - a_r - d_r - s_r) / r_r) if r_r > 0 else 0


def sine(freq, t):
    return math.sin(2 * math.pi * freq * t / SR)


def square(freq, t):
    return 1.0 if sine(freq, t) > 0 else -1.0


def noise():
    return random.uniform(-1.0, 1.0)


# --- 1. cell_reveal.wav — Soft click (0.1s, sine 800Hz + fade) ---
def gen_cell_reveal():
    dur = 0.1
    n = int(SR * dur)
    samples = []
    for i in range(n):
        t = i / SR
        env = env_exp(i, n, k=12.0)
        s = 0.5 * sine(800, i) * env
        # subtle click at very start
        if i < 200:
            s += 0.3 * noise() * (1 - i / 200)
        samples.append(s * 32767)
    write_wav(os.path.join(OUT_DIR, 'cell_reveal.wav'), samples)
    print('✅ cell_reveal.wav (0.1s soft click)')


# --- 2. mine_explode.wav — Blast + rumble (0.5s, noise + low freq) ---
def gen_mine_explode():
    dur = 0.5
    n = int(SR * dur)
    samples = []
    for i in range(n):
        t = i / SR
        env = env_exp(i, n, k=4.0)
        # White noise blast
        s = 0.6 * noise() * env
        # Low frequency rumble (60Hz)
        s += 0.4 * sine(60, i) * env
        # Sub boom (40Hz)
        s += 0.3 * sine(40, i) * env_exp(i, n, k=2.0)
        samples.append(s * 32767)
    write_wav(os.path.join(OUT_DIR, 'mine_explode.wav'), samples)
    print('✅ mine_explode.wav (0.5s blast + rumble)')


# --- 3. flag_place.wav — Metallic snap (0.1s, square wave) ---
def gen_flag_place():
    dur = 0.1
    n = int(SR * dur)
    samples = []
    for i in range(n):
        env = env_exp(i, n, k=15.0)
        s = 0.4 * square(1200, i) * env
        # metallic ring
        s += 0.2 * sine(2400, i) * env
        # initial click
        if i < 100:
            s += 0.4 * noise() * (1 - i / 100)
        samples.append(s * 32767)
    write_wav(os.path.join(OUT_DIR, 'flag_place.wav'), samples)
    print('✅ flag_place.wav (0.1s metallic snap)')


# --- 4. combo_1.wav, combo_2.wav, combo_3.wav — Rising tones ---
def gen_combo(tier):
    dur = 0.3
    n = int(SR * dur)
    base_freq = [440, 554, 659][tier - 1]  # A4, C#5, E5
    samples = []
    for i in range(n):
        t = i / SR
        env = env_adsr(i, n, a=0.02, d=0.1, s=0.6, r=0.3)
        s = 0.4 * sine(base_freq, i) * env
        # harmonic
        s += 0.2 * sine(base_freq * 2, i) * env
        # rising sweep
        sweep_freq = base_freq + (base_freq * 0.5) * (i / n)
        s += 0.15 * sine(sweep_freq, i) * env
        samples.append(s * 32767)
    write_wav(os.path.join(OUT_DIR, f'combo_{tier}.wav'), samples)
    print(f'✅ combo_{tier}.wav (0.3s rising tone tier {tier})')


# --- 5. timer_warning.wav — Beep (last 10s) ---
def gen_timer_warning():
    dur = 0.15
    n = int(SR * dur)
    samples = []
    for i in range(n):
        env = env_adsr(i, n, a=0.005, d=0.05, s=0.8, r=0.1)
        s = 0.5 * square(880, i) * env  # urgent beep
        samples.append(s * 32767)
    write_wav(os.path.join(OUT_DIR, 'timer_warning.wav'), samples)
    print('✅ timer_warning.wav (0.15s urgent beep)')


# --- 6. stage_clear.wav — Victory jingle (0.8s) ---
def gen_stage_clear():
    dur = 0.8
    n = int(SR * dur)
    # Jingle: C5, E5, G5, C6 (arpeggio)
    notes = [(523, 0.0, 0.15), (659, 0.15, 0.15), (784, 0.3, 0.15), (1047, 0.45, 0.35)]
    samples = [0.0] * n
    for freq, start, length in notes:
        start_i = int(start * SR)
        length_i = int(length * SR)
        for j in range(length_i):
            idx = start_i + j
            if idx >= n: break
            env = env_exp(j, length_i, k=4.0)
            s = 0.4 * sine(freq, idx) * env
            s += 0.15 * sine(freq * 2, idx) * env
            samples[idx] += s
    write_wav(os.path.join(OUT_DIR, 'stage_clear.wav'), [s * 32767 for s in samples])
    print('✅ stage_clear.wav (0.8s victory jingle)')


# --- 7. stage_fail.wav — Sad tone (0.5s) ---
def gen_stage_fail():
    dur = 0.5
    n = int(SR * dur)
    samples = []
    for i in range(n):
        t = i / SR
        env = env_exp(i, n, k=3.0)
        # Descending: 440Hz -> 220Hz
        freq = 440 * (1 - 0.5 * t / dur)
        s = 0.4 * sine(freq, i) * env
        # detuned for sadness
        s += 0.15 * sine(freq * 0.99, i) * env
        samples.append(s * 32767)
    write_wav(os.path.join(OUT_DIR, 'stage_fail.wav'), samples)
    print('✅ stage_fail.wav (0.5s sad descending tone)')


if __name__ == '__main__':
    random.seed(42)
    print(f'Generating SFX into {OUT_DIR}...\n')
    gen_cell_reveal()
    gen_mine_explode()
    gen_flag_place()
    gen_combo(1)
    gen_combo(2)
    gen_combo(3)
    gen_timer_warning()
    gen_stage_clear()
    gen_stage_fail()
    print('\n🎉 All 9 SFX generated!')
    # List files
    for f in sorted(os.listdir(OUT_DIR)):
        if f.endswith('.wav'):
            size = os.path.getsize(os.path.join(OUT_DIR, f))
            print(f'  {f}: {size/1024:.1f} KB')
