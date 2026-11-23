import numpy as np
from PIL import Image, ImageFilter

import os
os.makedirs('out', exist_ok=True)
full = Image.open('navy.png').convert('RGB')
NAVY = (11, 22, 64)

def alpha_cut(img, lo=0.10, span=0.30):
    """Gold on transparent: opacity follows brightness above the navy ground."""
    a = np.asarray(img).astype(np.float32)
    lum = (0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]) / 255
    alpha = np.clip((lum - lo) / span, 0, 1)
    rgb = np.clip(a / np.maximum(alpha[..., None], 1e-3) * alpha[..., None], 0, 255)
    out = np.dstack([a, alpha * 255]).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')

def sharp(img):
    return img.filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))

head = full.crop((280, 90, 940, 750))                  # glowing head, halo and star
icon = sharp(head.resize((1024, 1024), Image.LANCZOS))
icon.save('out/icon.png')                               # iOS and store icon: full square, no transparency
sharp(head.resize((256, 256), Image.LANCZOS)).save('out/logo-256.png')
head.resize((64, 64), Image.LANCZOS).save('out/favicon.png')

cut = alpha_cut(head)
def centered(img, scale, size=1024, bg=(0, 0, 0, 0)):
    canvas = Image.new('RGBA', (size, size), bg)
    s = int(size * scale)
    canvas.alpha_composite(sharp(img.resize((s, s), Image.LANCZOS)), ((size - s) // 2, (size - s) // 2))
    return canvas
centered(cut, 0.66).save('out/android-icon-foreground.png')
Image.new('RGB', (1024, 1024), NAVY).save('out/android-icon-background.png')
mono = np.asarray(centered(cut, 0.66)).copy(); mono[..., :3] = 0
Image.fromarray(mono, 'RGBA').save('out/android-icon-monochrome.png')
# Splash: the full logo with wordmark, on transparent, shown on a navy splash background.
centered(alpha_cut(full.crop((80, 80, 1174, 1174))), 1.0).save('out/splash-icon.png')
# Full logo for brand use.
full.save('out/luminary-logo-navy.png')
