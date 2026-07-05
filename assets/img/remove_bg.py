#!/usr/bin/env python3
"""
Bomb Defuser — Background Remover
ลบพื้นหลังออกจาก sprites โดยใช้ edge color detection
รองรับทั้งพื้นหลังขาว/เทา/ดำ/ม่วงเข้ม
"""
import os
from PIL import Image
from collections import Counter

IMG_DIR = os.path.dirname(os.path.abspath(__file__))


def detect_bg_color(img):
    """Detect dominant background color from edge pixels."""
    w, h = img.size
    edge_pixels = []
    # Sample all 4 edges
    for x in range(w):
        edge_pixels.append(img.getpixel((x, 0)))
        edge_pixels.append(img.getpixel((x, h - 1)))
    for y in range(h):
        edge_pixels.append(img.getpixel((0, y)))
        edge_pixels.append(img.getpixel((w - 1, y)))
    # Find most common color (ignoring alpha for detection)
    rgb_pixels = [p[:3] for p in edge_pixels]
    common = Counter(rgb_pixels).most_common(1)[0][0]
    return common


def color_distance(c1, c2):
    """Euclidean distance between two RGB colors."""
    return ((c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2 + (c1[2] - c2[2]) ** 2) ** 0.5


def remove_bg(img, bg_color, threshold=60):
    """Remove background color with smooth alpha falloff."""
    img = img.convert('RGBA')
    pixels = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            dist = color_distance((r, g, b), bg_color)
            if dist < threshold * 0.4:
                # Very close to bg → fully transparent
                pixels[x, y] = (r, g, b, 0)
            elif dist < threshold:
                # Transition zone → partial transparency
                alpha = int(a * (dist - threshold * 0.4) / (threshold * 0.6))
                pixels[x, y] = (r, g, b, alpha)
    return img


def process_file(filename):
    path = os.path.join(IMG_DIR, filename)
    if not os.path.exists(path):
        return False
    img = Image.open(path).convert('RGBA')
    bg = detect_bg_color(img)
    # Determine threshold based on bg brightness
    brightness = (bg[0] + bg[1] + bg[2]) / 3
    if brightness > 200:
        threshold = 70  # white bg
    elif brightness > 100:
        threshold = 55  # grey bg
    else:
        threshold = 45  # dark bg
    result = remove_bg(img, bg, threshold)
    result.save(path, 'PNG', optimize=True)
    # Verify
    result2 = Image.open(path).convert('RGBA')
    pixels = list(result2.getdata())
    alphas = [p[3] for p in pixels]
    transparent = sum(1 for a in alphas if a == 0)
    pct = transparent / len(alphas) * 100
    size_kb = os.path.getsize(path) / 1024
    print(f"  ✅ {filename}: bg={bg} thr={threshold} transparent={pct:.1f}% ({size_kb:.1f}KB)")
    return True


if __name__ == '__main__':
    sprites = [f for f in sorted(os.listdir(IMG_DIR)) if f.endswith('.png')]
    print(f"Processing {len(sprites)} sprites...\n")
    for s in sprites:
        process_file(s)
    print("\n🎉 Background removal complete!")
