#!/usr/bin/env python3
"""
Bomb Defuser — Sprite Generator
สร้าง tile + UI sprites ด้วย OpenRouter Gemini 2.5 Flash Image
แล้ว resize/crop เป็น 32x32 หรือ 64x64 + transparent background
"""
import sys, os, subprocess, time
from PIL import Image

IMG_DIR = os.path.expanduser('~/Desktop/project/Games/bomb-defuser/assets/img')
SCRIPT = os.path.expanduser('~/Desktop/project/Tools/openrouter_image_gen.py')

os.makedirs(IMG_DIR, exist_ok=True)

# (filename, prompt, size)
SPRITES = [
    # === 6 Tile Sprites (32x32) ===
    ('tile_safe.png',
     'pixel art gray metal plate tile, 16-bit retro game sprite, dark neon palette, metallic texture with subtle cyan edge glow, 32x32, transparent background, game asset', 32),
    ('tile_mine.png',
     'pixel art red blinking bomb, 16-bit retro game sprite, dark neon palette, glowing red sphere with fuse, magenta accent, 32x32, transparent background, game asset', 32),
    ('tile_boss.png',
     'pixel art gold lightning trigger chip, 16-bit retro game sprite, dark neon palette, glowing yellow gold circuit chip, 32x32, transparent background, game asset', 32),
    ('tile_powerup.png',
     'pixel art glowing treasure chest box, 16-bit retro game sprite, dark neon palette, cyan magenta glow, 32x32, transparent background, game asset', 32),
    ('tile_flag.png',
     'pixel art blue flag pin, 16-bit retro game sprite, dark neon palette, cyan glowing flag on pole, 32x32, transparent background, game asset', 32),
    ('tile_revealed.png',
     'pixel art dark empty cell, 16-bit retro game sprite, dark neon palette, deep navy recessed square with subtle grid lines, 32x32, transparent background, game asset', 32),
    # === 8 UI Sprites ===
    ('heart_full.png',
     'pixel art full red heart icon, 16-bit retro game UI, dark neon palette, glowing red heart, 32x32, transparent background, game asset', 32),
    ('heart_empty.png',
     'pixel art empty hollow heart outline, 16-bit retro game UI, dark neon palette, dark grey heart outline, 32x32, transparent background, game asset', 32),
    ('btn_play.png',
     'pixel art play button, 16-bit retro game UI, dark neon palette, cyan glowing triangle on dark button, 64x64, transparent background, game asset', 64),
    ('btn_powerup_1.png',
     'pixel art shield icon, 16-bit retro game UI, dark neon palette, blue glowing shield, power-up button, 64x64, transparent background, game asset', 64),
    ('btn_powerup_2.png',
     'pixel art radar scanner icon, 16-bit retro game UI, dark neon palette, green glowing radar sweep, power-up button, 64x64, transparent background, game asset', 64),
    ('btn_powerup_3.png',
     'pixel art ice crystal snowflake icon, 16-bit retro game UI, dark neon palette, cyan glowing freeze symbol, power-up button, 64x64, transparent background, game asset', 64),
    ('btn_powerup_4.png',
     'pixel art crosshair cross icon, 16-bit retro game UI, dark neon palette, orange glowing target cross, power-up button, 64x64, transparent background, game asset', 64),
]


def gen_sprite(filename, prompt, size):
    out_path = os.path.join(IMG_DIR, filename)
    print(f'\n🎨 Generating {filename} ({size}x{size})...')
    # Call OpenRouter script
    result = subprocess.run(
        ['python3', SCRIPT, prompt, out_path],
        capture_output=True, text=True, timeout=120
    )
    if result.returncode != 0 or not os.path.exists(out_path):
        print(f'  ❌ API failed: {result.stderr[:200]}')
        return False
    # Post-process: resize + transparent
    img = Image.open(out_path).convert('RGBA')
    # Resize to target (LANCZOS for quality)
    img = img.resize((size, size), Image.LANCZOS)
    # Remove near-black background (dark neon bg #0a0a1a)
    pixels = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = pixels[x, y]
            # Dark background → transparent
            if r < 30 and g < 30 and b < 40:
                pixels[x, y] = (0, 0, 0, 0)
            elif r < 50 and g < 50 and b < 60:
                pixels[x, y] = (r, g, b, max(0, a - 120))
    img.save(out_path, 'PNG', optimize=True)
    size_kb = os.path.getsize(out_path) / 1024
    print(f'  ✅ {filename}: {size}x{size} ({size_kb:.1f} KB)')
    return True


if __name__ == '__main__':
    print(f'Generating {len(SPRITES)} sprites into {IMG_DIR}...\n')
    success = 0
    for filename, prompt, size in SPRITES:
        ok = gen_sprite(filename, prompt, size)
        if ok:
            success += 1
        else:
            print(f'  ⚠️ Will retry later')
        # Rate limit: wait between calls
        time.sleep(2)
    print(f'\n🎉 Done: {success}/{len(SPRITES)} sprites generated')
    if success < len(SPRITES):
        print('⚠️ Some sprites failed — re-run script to retry')
        sys.exit(1)
