import sys
import numpy as np
from PIL import Image

src = sys.argv[1]
im = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
h, w, _ = im.shape
B = np.array([19, 1, 19], np.float32)            # plum background
# Navy ground with a soft lift behind the head, like the Mimi Bright cards.
yy, xx = np.mgrid[0:h, 0:w]
r = np.sqrt(((xx - w * 0.5) / w) ** 2 + ((yy - h * 0.36) / h) ** 2)
t = np.clip(r / 0.75, 0, 1)[..., None]
inner = np.array([24, 42, 100], np.float32)
outer = np.array([6, 12, 38], np.float32)
navy = inner * (1 - t) + outer * t
lum = (0.299 * im[..., 0] + 0.587 * im[..., 1] + 0.114 * im[..., 2])[..., None] / 255
keep = np.clip(1 - lum * 2.2, 0, 1)               # fade the navy out under bright gold
light = np.clip(im - B * keep, 0, 255)            # remove the plum only where it shows
out = np.clip(light + navy * keep, 0, 255).astype(np.uint8)
Image.fromarray(out).save(sys.argv[2])
