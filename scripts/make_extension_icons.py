#!/usr/bin/env python3
"""Generate real PNG icons (16/48/128) for the OGVPN Chrome extension.

The previous manifest referenced icons/icon.svg — Chromium does not accept
SVG for extension icons ("Could not load icon"), so the extension failed to
load. This draws the OGVPN shield mark at each required size and writes
icon16.png / icon48.png / icon128.png.
"""
import os

from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "extension", "icons")

BG = (11, 30, 58, 255)        # deep navy tile
SHIELD = (14, 165, 233, 255)  # sky blue
CHECK = (255, 255, 255, 255)


def shield_points(w):
    return [
        (0.50 * w, 0.10 * w),
        (0.86 * w, 0.24 * w),
        (0.80 * w, 0.60 * w),
        (0.50 * w, 0.90 * w),
        (0.20 * w, 0.60 * w),
        (0.14 * w, 0.24 * w),
    ]


def make(size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    dr = ImageDraw.Draw(img)
    r = max(2, int(size * 0.22))
    m = max(1, int(size * 0.04))
    dr.rounded_rectangle([m, m, size - m, size - m], radius=r, fill=BG)
    dr.polygon(shield_points(size), fill=SHIELD)
    lw = max(2, int(size * 0.085))
    dr.line(
        [
            (0.36 * size, 0.52 * size),
            (0.47 * size, 0.64 * size),
            (0.68 * size, 0.36 * size),
        ],
        fill=CHECK,
        width=lw,
        joint="curve",
    )
    path = os.path.join(OUT, f"icon{size}.png")
    img.save(path)
    print("wrote", path)


def main():
    os.makedirs(OUT, exist_ok=True)
    for s in (16, 48, 128):
        make(s)


if __name__ == "__main__":
    main()
