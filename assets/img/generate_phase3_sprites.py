#!/usr/bin/env python3
"""
Bomb Defuser — Phase 3 Sprite Generator
สร้าง backgrounds, player, boss, wires, particles, title logo
"""
import sys, os, subprocess, time
from PIL import Image

IMG_DIR = os.path.expanduser('~/Desktop/project/Games/bomb-defuser/assets/img')
SCRIPT = os.path.expanduser('~/Desktop/project/Tools/openrouter_image_gen.py')

# Subdirectory for backgrounds
BG_DIR = os.path.join(IMG_DIR, 'bg')
os.makedirs(BG_DIR, exist_ok=True)
os.makedirs(IMG_DIR, exist_ok=True)

# Common style suffix
STYLE = '16-bit pixel art, dark neon palette #0a0a1a background, retro game asset, high quality'

# (filename, prompt, output_dir, size_hint)
SPRITES = [
    # === 10 Stage Backgrounds (320×560 portrait mobile) ===
    ('bg_office.png',
     f'pixel art office building interior background, cubicles and desks, cool blue and gray tones, {STYLE}, 320x560 portrait game background', BG_DIR),
    ('bg_vault.png',
     f'pixel art bank vault interior background, gold bars and steel door, gold and dark teal tones, {STYLE}, 320x560 portrait game background', BG_DIR),
    ('bg_factory.png',
     f'pixel art factory interior background, machines and conveyor belts, orange and brown tones, {STYLE}, 320x560 portrait game background', BG_DIR),
    ('bg_subway.png',
     f'pixel art subway tunnel background, train tracks and pipes, deep purple and yellow tones, {STYLE}, 320x560 portrait game background', BG_DIR),
    ('bg_construction.png',
     f'pixel art construction site background, scaffolding and cranes, steel gray and hazard yellow tones, {STYLE}, 320x560 portrait game background', BG_DIR),
    ('bg_alien.png',
     f'pixel art alien spaceship interior background, organic biomechanical walls, lime green and magenta tones, {STYLE}, 320x560 portrait game background', BG_DIR),
    ('bg_nuclear.png',
     f'pixel art nuclear reactor core background, glowing reactor and warning lights, crimson red and orange glow, {STYLE}, 320x560 portrait game background', BG_DIR),

    # === 4 Boss Bombs (64×64) ===
    ('boss_1.png',
     f'pixel art boss bomb machine, complex explosive device with wires and timer, gold and teal, {STYLE}, 64x64 transparent background game sprite', IMG_DIR),
    ('boss_2.png',
     f'pixel art boss bomb machine, industrial explosive device with gears and pipes, orange and brown, {STYLE}, 64x64 transparent background game sprite', IMG_DIR),
    ('boss_3.png',
     f'pixel art alien boss bomb, biomechanical explosive device, lime green and magenta, {STYLE}, 64x64 transparent background game sprite', IMG_DIR),
    ('boss_4.png',
     f'pixel art nuclear boss bomb, reactor core explosive device, crimson red and orange glow, {STYLE}, 64x64 transparent background game sprite', IMG_DIR),

    # === 8 Colored Wires (64×32) ===
    ('wire_red.png',
     f'pixel art red wire cable horizontal, {STYLE}, 64x32 transparent background game sprite', IMG_DIR),
    ('wire_blue.png',
     f'pixel art blue wire cable horizontal, {STYLE}, 64x32 transparent background game sprite', IMG_DIR),
    ('wire_green.png',
     f'pixel art green wire cable horizontal, {STYLE}, 64x32 transparent background game sprite', IMG_DIR),
    ('wire_yellow.png',
     f'pixel art yellow wire cable horizontal, {STYLE}, 64x32 transparent background game sprite', IMG_DIR),
    ('wire_white.png',
     f'pixel art white wire cable horizontal, {STYLE}, 64x32 transparent background game sprite', IMG_DIR),
    ('wire_black.png',
     f'pixel art black wire cable horizontal, {STYLE}, 64x32 transparent background game sprite', IMG_DIR),
    ('wire_purple.png',
     f'pixel art purple wire cable horizontal, {STYLE}, 64x32 transparent background game sprite', IMG_DIR),
    ('wire_orange.png',
     f'pixel art orange wire cable horizontal, {STYLE}, 64x32 transparent background game sprite', IMG_DIR),

    # === 4 Particles (16×16) ===
    ('particle_explosion.png',
     f'pixel art explosion particle burst, orange and yellow, {STYLE}, 16x16 transparent background game sprite', IMG_DIR),
    ('particle_spark.png',
     f'pixel art spark particle, cyan and white, {STYLE}, 16x16 transparent background game sprite', IMG_DIR),
    ('particle_smoke.png',
     f'pixel art smoke particle cloud, gray, {STYLE}, 16x16 transparent background game sprite', IMG_DIR),
    ('particle_confetti.png',
     f'pixel art confetti particle colorful, rainbow, {STYLE}, 16x16 transparent background game sprite', IMG_DIR),

    # === Title Logo (256×128) ===
    ('title_logo.png',
     f'pixel art title logo text "BOMB DEFUSER", bold neon cyan and magenta letters, explosive bomb icon, {STYLE}, 256x128 transparent background game logo', IMG_DIR),
]

# Player character animations — 4 poses × 4 frames = 16 sprites
PLAYER_POSES = ['idle', 'walk', 'cut', 'defuse']
for pose in PLAYER_POSES:
    for frame in range(1, 5):
        desc = {
            'idle': f'standing bomb defuser character breathing frame {frame}',
            'walk': f'walking bomb defuser character motion frame {frame}',
            'cut': f'cutting wire with pliers action frame {frame}',
            'defuse': f'defusing bomb carefully action frame {frame}',
        }[pose]
        SPRITES.append((
            f'player_{pose}_{frame}.png',
            f'pixel art bomb disposal expert character, {desc}, cyan uniform with helmet, {STYLE}, 32x32 transparent background game sprite',
            IMG_DIR
        ))


def gen_sprite(filename, prompt, out_dir):
    out_path = os.path.join(out_dir, filename)
    print(f'\n🎨 {filename}...')
    result = subprocess.run(
        ['python3', SCRIPT, prompt, out_path],
        capture_output=True, text=True, timeout=120
    )
    if result.returncode != 0 or not os.path.exists(out_path):
        print(f'  ❌ FAIL: {result.stderr[:200]}')
        return False
    # Post-process: resize + transparent
    img = Image.open(out_path).convert('RGBA')
    # Determine target size from filename
    if filename.startswith('bg_'):
        img = img.resize((320, 560), Image.LANCZOS)
    elif filename.startswith('boss_'):
        img = img.resize((64, 64), Image.LANCZOS)
    elif filename.startswith('wire_'):
        img = img.resize((64, 32), Image.LANCZOS)
    elif filename.startswith('particle_'):
        img = img.resize((16, 16), Image.LANCZOS)
    elif filename.startswith('title_'):
        img = img.resize((256, 128), Image.LANCZOS)
    elif filename.startswith('player_'):
        img = img.resize((32, 32), Image.LANCZOS)

    # Remove background (auto-detect edge color)
    w, h = img.size
    edge_pixels = []
    for x in range(w):
        edge_pixels.append(img.getpixel((x, 0)))
        edge_pixels.append(img.getpixel((x, h - 1)))
    for y in range(h):
        edge_pixels.append(img.getpixel((0, y)))
        edge_pixels.append(img.getpixel((w - 1, y)))
    from collections import Counter
    bg_rgb = Counter([p[:3] for p in edge_pixels]).most_common(1)[0][0]
    brightness = sum(bg_rgb) / 3
    threshold = 70 if brightness > 200 else (55 if brightness > 100 else 45)

    pixels = img.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            dist = ((r - bg_rgb[0])**2 + (g - bg_rgb[1])**2 + (b - bg_rgb[2])**2) ** 0.5
            if dist < threshold * 0.4:
                pixels[x, y] = (r, g, b, 0)
            elif dist < threshold:
                alpha = int(a * (dist - threshold * 0.4) / (threshold * 0.6))
                pixels[x, y] = (r, g, b, alpha)

    img.save(out_path, 'PNG', optimize=True)
    size_kb = os.path.getsize(out_path) / 1024
    print(f'  ✅ {filename} ({size_kb:.1f}KB)')
    return True


if __name__ == '__main__':
    print(f'Generating {len(SPRITES)} Phase 3 sprites...\n')
    # Allow filtering by category via argv
    category = sys.argv[1] if len(sys.argv) > 1 else 'all'
    filtered = SPRITES
    if category != 'all':
        filtered = [s for s in SPRITES if s[0].startswith(category)]
    print(f'Category: {category} ({len(filtered)} sprites)\n')

    success = 0
    for filename, prompt, out_dir in filtered:
        ok = gen_sprite(filename, prompt, out_dir)
        if ok:
            success += 1
        time.sleep(2)  # rate limit
    print(f'\n🎉 Done: {success}/{len(filtered)}')
    if success < len(filtered):
        sys.exit(1)
