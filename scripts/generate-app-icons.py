#!/usr/bin/env python3
"""Rasterize the in-app HaltereMark vector onto store assets.

The checked-in logo PNG was 100x127 with alpha. This redraws the jumping-weight
mark from components/ui/HaltereMark.tsx instead of upscaling those pixels.
"""

from __future__ import annotations

import math
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"

# Theme: lib/theme.ts
PAPER = (244, 239, 230)  # #F4EFE6
BLUE = (23, 113, 220)  # #1771DC
INK = (26, 35, 50)  # unused; kept as brand reference


def clamp(value: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return lo if value < lo else hi if value > hi else value


def coverage_from_signed_distance(distance: float) -> float:
    return clamp(0.5 - distance)


def circle_alpha(px: float, py: float, cx: float, cy: float, radius: float) -> float:
    dx = px + 0.5 - cx
    dy = py + 0.5 - cy
    return coverage_from_signed_distance(math.hypot(dx, dy) - radius)


def rounded_rect_alpha(
    px: float, py: float, x: float, y: float, w: float, h: float, radius: float
) -> float:
    cx = x + w / 2.0
    cy = y + h / 2.0
    half_w = w / 2.0
    half_h = h / 2.0
    dx = abs(px + 0.5 - cx) - (half_w - radius)
    dy = abs(py + 0.5 - cy) - (half_h - radius)
    outside = math.hypot(max(dx, 0.0), max(dy, 0.0))
    inside = min(max(dx, dy), 0.0)
    return coverage_from_signed_distance(outside + inside - radius)


def blend(dst: list[int], src: tuple[int, int, int], alpha: float) -> None:
    if alpha <= 0:
        return
    if len(dst) == 4:
        src_a = clamp(alpha)
        dst_a = dst[3] / 255.0
        out_a = src_a + dst_a * (1.0 - src_a)
        if out_a <= 0:
            return
        for i in range(3):
            dst[i] = int(
                (src[i] * src_a + dst[i] * dst_a * (1.0 - src_a)) / out_a + 0.5
            )
        dst[3] = int(out_a * 255 + 0.5)
        return
    if alpha >= 1:
        dst[0], dst[1], dst[2] = src
        return
    inv = 1.0 - alpha
    dst[0] = int(src[0] * alpha + dst[0] * inv + 0.5)
    dst[1] = int(src[1] * alpha + dst[1] * inv + 0.5)
    dst[2] = int(src[2] * alpha + dst[2] * inv + 0.5)


def draw_halteres_mark(
    pixels: list[list[int]],
    size: int,
    mark_size: float,
    color: tuple[int, int, int],
    inner: tuple[int, int, int] | None = PAPER,
) -> None:
    """HaltereMark viewBox is 64x64 (see components/ui/HaltereMark.tsx)."""
    scale = mark_size / 64.0
    origin = (size - mark_size) / 2.0

    def sx(value: float) -> float:
        return origin + value * scale

    def sr(value: float) -> float:
        return value * scale

    min_x = max(0, int(origin) - 2)
    max_x = min(size, int(origin + mark_size) + 3)
    min_y = max(0, int(origin) - 2)
    max_y = min(size, int(origin + mark_size) + 3)

    left = (sx(15), sx(33), sr(13))
    right = (sx(49), sx(31), sr(13))
    bar = (sx(14), sx(27.5), sr(36), sr(8), sr(4))
    inner_r = sr(5)

    for y in range(min_y, max_y):
        row_offset = y * size
        for x in range(min_x, max_x):
            alpha = 0.0
            alpha = max(alpha, circle_alpha(x, y, *left))
            alpha = max(alpha, circle_alpha(x, y, *right))
            alpha = max(alpha, rounded_rect_alpha(x, y, *bar))
            if alpha <= 0:
                continue
            pixel = pixels[row_offset + x]
            blend(pixel, color, alpha)
            if inner is None:
                continue
            inner_alpha = max(
                circle_alpha(x, y, left[0], left[1], inner_r),
                circle_alpha(x, y, right[0], right[1], inner_r),
            )
            if inner_alpha > 0:
                blend(pixel, inner, inner_alpha * 0.35)


def write_png(path: Path, width: int, height: int, pixels: list[list[int]], alpha: bool) -> None:
    raw = bytearray()
    channels = 4 if alpha else 3
    for y in range(height):
        raw.append(0)
        start = y * width
        for x in range(width):
            pixel = pixels[start + x]
            raw.extend(pixel[:channels])

    def chunk(tag: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    color_type = 6 if alpha else 2
    ihdr = struct.pack(">IIBBBBB", width, height, 8, color_type, 0, 0, 0)
    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", ihdr)
        + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
        + chunk(b"IEND", b"")
    )
    path.write_bytes(png)


def canvas(size: int, fill: tuple[int, int, int] | None, alpha: bool) -> list[list[int]]:
    if fill is None:
        return [[0, 0, 0, 0] for _ in range(size * size)]
    r, g, b = fill
    if alpha:
        return [[r, g, b, 255] for _ in range(size * size)]
    return [[r, g, b] for _ in range(size * size)]


def main() -> None:
    ASSETS.mkdir(exist_ok=True)
    size = 1024

    icon = canvas(size, PAPER, alpha=False)
    draw_halteres_mark(icon, size, mark_size=560, color=BLUE, inner=PAPER)
    write_png(ASSETS / "icon.png", size, size, icon, alpha=False)

    splash = canvas(size, PAPER, alpha=False)
    draw_halteres_mark(splash, size, mark_size=420, color=BLUE, inner=PAPER)
    write_png(ASSETS / "splash.png", size, size, splash, alpha=False)

    adaptive = canvas(size, None, alpha=True)
    draw_halteres_mark(adaptive, size, mark_size=480, color=BLUE, inner=PAPER)
    write_png(ASSETS / "adaptive-icon.png", size, size, adaptive, alpha=True)

    print("wrote", ASSETS / "icon.png")
    print("wrote", ASSETS / "splash.png")
    print("wrote", ASSETS / "adaptive-icon.png")


if __name__ == "__main__":
    main()
