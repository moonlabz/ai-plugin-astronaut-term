#!/usr/bin/env python3
"""Build Astronaut Term's pixel previews and Codex V2 sprite atlas."""

import ctypes
import ctypes.util
import json
import struct
import sys
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "codex" / "pet"
PREVIEW = ROOT / "preview"
W, H = 192, 208
GRID_W, GRID_H = 32, 34
SCALE = 6
COLORS = {
    "N": "#07111F", "D": "#0B1730", "V": "#10244A", "B": "#174EA6",
    "b": "#2563EB", "c": "#3B82F6", "h": "#60A5FA", "i": "#93C5FD",
    "p": "#BFDBFE", "m": "#64748B", "s": "#94A3B8", "l": "#CBD5E1",
    "w": "#E8F1FF", "y": "#F5C451", "r": "#F87171", "g": "#60D394",
}
RGBA = {key: tuple(bytes.fromhex(value[1:])) + (255,) for key, value in COLORS.items()}
TRANSPARENT = (0, 0, 0, 0)


class Canvas:
    def __init__(self, width, height, fill=TRANSPARENT):
        self.width, self.height = width, height
        self.pixels = bytearray(fill * (width * height))

    def pixel(self, x, y, color):
        if 0 <= x < self.width and 0 <= y < self.height:
            at = (y * self.width + x) * 4
            self.pixels[at:at + 4] = bytes(color)

    def rect(self, x, y, width, height, color):
        for py in range(y, y + height):
            for px in range(x, x + width):
                self.pixel(px, py, color)

    def blit(self, other, x, y):
        for py in range(other.height):
            for px in range(other.width):
                at = (py * other.width + px) * 4
                color = tuple(other.pixels[at:at + 4])
                if color[3]:
                    self.pixel(x + px, y + py, color)

    def png(self):
        raw = b"".join(b"\0" + self.pixels[y * self.width * 4:(y + 1) * self.width * 4] for y in range(self.height))
        def chunk(name, data):
            body = name + data
            return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body) & 0xffffffff)
        return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", self.width, self.height, 8, 6, 0, 0, 0))
                + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))


def save_png(path, canvas):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(canvas.png())


def save_webp(path, canvas):
    lib = ctypes.CDLL(ctypes.util.find_library("webp") or "libwebp.so.6")
    lib.WebPEncodeLosslessRGBA.argtypes = [ctypes.POINTER(ctypes.c_uint8), ctypes.c_int, ctypes.c_int,
                                           ctypes.c_int, ctypes.POINTER(ctypes.POINTER(ctypes.c_uint8))]
    lib.WebPEncodeLosslessRGBA.restype = ctypes.c_size_t
    lib.WebPFree.argtypes = [ctypes.c_void_p]
    output = ctypes.POINTER(ctypes.c_uint8)()
    source = (ctypes.c_uint8 * len(canvas.pixels)).from_buffer(canvas.pixels)
    size = lib.WebPEncodeLosslessRGBA(source, canvas.width, canvas.height, canvas.width * 4, ctypes.byref(output))
    if not size:
        raise RuntimeError("libwebp failed to encode the atlas")
    try:
        path.write_bytes(ctypes.string_at(output, size))
    finally:
        lib.WebPFree(output)
    data = path.read_bytes()
    decoded_width, decoded_height = ctypes.c_int(), ctypes.c_int()
    info = (ctypes.c_uint8 * len(data)).from_buffer_copy(data)
    lib.WebPGetInfo.argtypes = [ctypes.POINTER(ctypes.c_uint8), ctypes.c_size_t,
                                ctypes.POINTER(ctypes.c_int), ctypes.POINTER(ctypes.c_int)]
    lib.WebPGetInfo.restype = ctypes.c_int
    if not lib.WebPGetInfo(info, len(data), ctypes.byref(decoded_width), ctypes.byref(decoded_height)):
        raise RuntimeError("encoded WebP atlas cannot be decoded")
    if (decoded_width.value, decoded_height.value) != (canvas.width, canvas.height):
        raise RuntimeError(f"encoded WebP is {decoded_width.value}x{decoded_height.value}")


def rect(canvas, x, y, w, h, color):
    canvas.rect(x * SCALE, y * SCALE, w * SCALE, h * SCALE, RGBA[color])


def astronaut(state="idle", frame=0):
    c = Canvas(GRID_W * SCALE, GRID_H * SCALE)
    bob = (frame % 2) if state in ("idle", "waiting", "review") else 0
    shift = -1 if state == "running-left" else (1 if state == "running-right" else 0)
    if state == "jumping":
        bob = -1 if frame % 2 == 0 else -2
    if state == "failed":
        bob = 0
    x = 8 + shift
    y = 3 + bob
    # backpack, arms, suit and boots: stepped shapes keep the silhouette crisp.
    rect(c, x - 2, y + 11, 4, 7, "V")
    rect(c, x - 2, y + 12, 1, 4, "h")
    rect(c, x + 10, y + 11, 4, 7, "B")
    rect(c, x + 11, y + 12, 2, 4, "h")
    rect(c, x + 1, y + 14, 10, 8, "b")
    rect(c, x + 2, y + 15, 8, 5, "c")
    rect(c, x + 5, y + 15, 3, 3, "i")
    if state.startswith("running"):
        lead = frame % 2
        rect(c, x + 1 + lead * 2, y + 21 + lead, 3, 3, "D")
        rect(c, x + 8 - lead * 2, y + 22 - lead, 3, 3, "D")
        rect(c, x + lead * 2, y + 23 + lead, 4, 2, "s")
        rect(c, x + 7 - lead * 2, y + 23 - lead, 4, 2, "s")
    elif state == "jumping":
        rect(c, x + 2, y + 21, 3, 3, "D")
        rect(c, x + 8, y + 20, 3, 3, "D")
        rect(c, x + 1, y + 23, 4, 2, "s")
        rect(c, x + 8, y + 22, 4, 2, "s")
    else:
        rect(c, x + 2, y + 21, 3, 3, "D")
        rect(c, x + 8, y + 21, 3, 3, "D")
        rect(c, x + 1, y + 23, 4, 2, "s")
        rect(c, x + 8, y + 23, 4, 2, "s")
    # helmet with stepped outer ring and dark visor.
    rect(c, x + 1, y, 10, 1, "l")
    rect(c, x, y + 1, 12, 1, "l")
    rect(c, x - 1, y + 2, 14, 5, "l")
    rect(c, x, y + 7, 12, 2, "l")
    rect(c, x + 1, y + 9, 10, 1, "l")
    rect(c, x + 1, y + 2, 10, 1, "w")
    rect(c, x, y + 3, 12, 4, "N")
    rect(c, x + 1, y + 7, 10, 1, "m")
    rect(c, x + 2, y + 4, 7, 2, "s")
    rect(c, x + 9, y + 3, 1, 1, "p")
    # tiny suit insignia and state-specific prop.
    rect(c, x + 6, y + 18, 2, 2, "w")
    if state == "thinking":
        rect(c, x + 14, y + 5, 4, 1, "h")
        rect(c, x + 15, y + 4, 2, 3, "i")
        rect(c, x + 16, y + 5, 1, 1, "N")
    elif state.startswith("running"):
        rect(c, x + 2, y + 25, 2, 1, "h")
        rect(c, x + 9, y + 26, 2, 1, "i")
    elif state == "failed":
        rect(c, x + 13, y + 1, 1, 4, "y")
        rect(c, x + 12, y + 2, 3, 1, "y")
        rect(c, x + 13, y + 2, 1, 1, "N")
    elif state == "jumping":
        rect(c, x + 4, y + 26, 2, 2, "y")
        rect(c, x + 8, y + 27, 2, 2, "r")
    elif state == "review":
        rect(c, x + 14, y + 5, 3, 2, "h")
        rect(c, x + 15, y + 5, 1, 1, "N")
    elif state == "waving":
        rect(c, x + 11, y + 11, 3, 2, "b")
        rect(c, x + 13, y + 9, 2, 2, "l")
        rect(c, x + 14, y + 7, 1, 2, "w")
    elif state == "look-left":
        rect(c, x + 1, y + 5, 3, 2, "h")
    elif state == "look-right":
        rect(c, x + 8, y + 5, 3, 2, "h")
    elif state == "waiting":
        rect(c, x + 14, y + 3, 1, 1, "p")
    return c


def satellite():
    c = Canvas(16 * SCALE, 12 * SCALE)
    rect(c, 0, 4, 4, 4, "B"); rect(c, 1, 5, 2, 2, "h")
    rect(c, 5, 3, 6, 6, "s"); rect(c, 6, 4, 4, 4, "i")
    rect(c, 12, 4, 4, 4, "B"); rect(c, 13, 5, 2, 2, "h")
    rect(c, 7, 1, 2, 2, "p"); rect(c, 7, 9, 2, 2, "p")
    return c


def rocket():
    c = Canvas(12 * SCALE, 20 * SCALE)
    rect(c, 5, 0, 2, 1, "p"); rect(c, 4, 1, 4, 2, "l")
    rect(c, 3, 3, 6, 8, "w"); rect(c, 4, 4, 4, 5, "h")
    rect(c, 5, 5, 2, 2, "N"); rect(c, 2, 8, 2, 4, "b")
    rect(c, 8, 8, 2, 4, "b"); rect(c, 5, 11, 2, 3, "y")
    rect(c, 5, 14, 2, 2, "r"); rect(c, 5, 16, 2, 2, "h")
    return c


def moon():
    c = Canvas(32 * SCALE, 32 * SCALE)
    for y in range(32):
        half = int((max(0, 256 - (y - 15) ** 2) ** 0.5))
        left, right = max(0, 15 - half), min(31, 16 + half)
        for x in range(left, right + 1):
            shade = "m" if x < left + 3 or y > 27 else ("l" if y < 4 and x > 7 else "s")
            rect(c, x, y, 1, 1, shade)
    # Craters use stepped rims and darker centers, without smoothing.
    for x, y, w, h in ((7, 9, 5, 4), (20, 7, 4, 5), (14, 18, 6, 4), (6, 23, 4, 3), (23, 20, 3, 2)):
        rect(c, x, y, w, 1, "l")
        rect(c, x, y + h - 1, w, 1, "m")
        rect(c, x, y + 1, 1, h - 2, "l")
        rect(c, x + w - 1, y + 1, 1, h - 2, "m")
        rect(c, x + 1, y + 1, w - 2, h - 2, "m")
    return c


def horizon():
    c = Canvas(32 * SCALE, 9 * SCALE)
    for y, left, right in [(2, 6, 27), (3, 3, 30), (4, 1, 32), (5, 0, 32), (6, 2, 30), (7, 5, 27), (8, 9, 23)]:
        rect(c, left, y, right - left, 1, "m" if y >= 7 else "s")
    rect(c, 8, 4, 3, 1, "m"); rect(c, 9, 3, 1, 1, "l")
    rect(c, 21, 5, 4, 1, "m"); rect(c, 22, 4, 2, 1, "l")
    return c


def scaled_preview(state):
    out = Canvas(256, 256, RGBA["N"])
    # sparse pixel stars, plus a small moon horizon.
    for x, y, color in [(31, 43, "h"), (49, 71, "i"), (208, 54, "h"), (185, 97, "p"), (73, 116, "h")]:
        out.rect(x, y, 3, 3, RGBA[color])
    out.blit(moon(), 32, 88)
    out.blit(horizon(), 32, 192)
    char = astronaut(state, 0)
    out.blit(char, 80, 48 if state == "jumping" else 56)
    if state == "review":
        out.blit(satellite(), 168, 120)
    if state == "jumping":
        out.blit(rocket(), 172, 72)
    if state == "success":
        out.blit(rocket(), 172, 72)
    return out


def gif_lzw(indices, min_code_size):
    clear, end = 1 << min_code_size, (1 << min_code_size) + 1
    table = {bytes([index]): index for index in range(clear)}
    code_size, next_code = min_code_size + 1, end + 1
    bit_buffer = bit_count = 0
    output = bytearray()

    def emit(code):
        nonlocal bit_buffer, bit_count
        bit_buffer |= code << bit_count
        bit_count += code_size
        while bit_count >= 8:
            output.append(bit_buffer & 255)
            bit_buffer >>= 8
            bit_count -= 8

    emit(clear)
    current = bytes([indices[0]])
    for value in indices[1:]:
        following = current + bytes([value])
        if following in table:
            current = following
            continue
        emit(table[current])
        if next_code < 4096:
            table[following] = next_code
            next_code += 1
            if next_code > (1 << code_size) and code_size < 12:
                code_size += 1
        else:
            emit(clear)
            table = {bytes([index]): index for index in range(clear)}
            code_size, next_code = min_code_size + 1, end + 1
        current = bytes([value])
    emit(table[current])
    emit(end)
    if bit_count:
        output.append(bit_buffer & 255)
    blocks = bytearray()
    for start in range(0, len(output), 255):
        part = output[start:start + 255]
        blocks.append(len(part)); blocks.extend(part)
    blocks.append(0)
    return bytes([min_code_size]) + blocks


def save_gif(path, frames):
    palette = list(dict.fromkeys(RGBA.values()))
    table_size = 1 << max(1, (len(palette) - 1).bit_length())
    min_code_size = max(2, (table_size - 1).bit_length())
    color_indices = {color: index for index, color in enumerate(palette)}
    global_table = b"".join(bytes(color[:3]) for color in palette)
    global_table += b"\0\0\0" * (table_size - len(palette))
    packed = 0x80 | 0x70 | (table_size.bit_length() - 2)
    data = bytearray(b"GIF89a" + struct.pack("<HHBBB", 256, 256, packed, 0, 0))
    data.extend(global_table)
    for frame in frames:
        indices = [color_indices[tuple(frame.pixels[i:i + 4])] for i in range(0, len(frame.pixels), 4)]
        data.extend(b"!\xf9\x04\x00" + struct.pack("<H", 45) + b"\x00\x00")
        data.extend(b"," + struct.pack("<HHHHB", 0, 0, 256, 256, 0))
        data.extend(gif_lzw(indices, min_code_size))
    data.append(0x3b)
    path.write_bytes(data)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    PREVIEW.mkdir(parents=True, exist_ok=True)
    atlas = Canvas(8 * W, 11 * H)
    rows = [
        ("idle", 6), ("running-right", 8), ("running-left", 8), ("waving", 4),
        ("jumping", 5), ("failed", 4), ("waiting", 6), ("running-right", 6),
        ("review", 6), ("look-left", 8), ("look-right", 8),
    ]
    atlas_v1 = Canvas(8 * W, 9 * H)
    for row, (state, frames) in enumerate(rows):
        for col in range(frames):
            sprite = astronaut(state, col)
            atlas.blit(sprite, col * W, row * H)
            if row < 9:
                atlas_v1.blit(sprite, col * W, row * H)
    save_png(PREVIEW / "spritesheet.png", atlas)
    save_webp(OUT / "spritesheet.webp", atlas)
    save_png(PREVIEW / "v1-spritesheet.png", atlas_v1)
    save_webp(ROOT / "codex" / "pet-v1" / "spritesheet.webp", atlas_v1)
    save_png(ROOT / "core" / "sprites" / "astronaut.png", astronaut("idle"))
    for state in ("idle", "thinking", "running", "waiting", "failed", "jumping", "review", "waving"):
        save_png(PREVIEW / f"{state}.png", scaled_preview(state))
    for name, sprite in (("moon", moon()), ("rocket", rocket()), ("satellite", satellite())):
        save_png(PREVIEW / f"{name}.png", sprite)
        save_png(ROOT / "core" / "sprites" / f"{name}.png", sprite)
    stars = Canvas(32 * SCALE, 16 * SCALE)
    for x, y, size in ((3, 4, 1), (12, 9, 2), (22, 3, 1), (27, 12, 1)):
        rect(stars, x, y, size, size, "i")
    save_png(ROOT / "core" / "sprites" / "stars.png", stars)
    save_png(OUT / "preview.png", scaled_preview("idle"))
    if "--demo" in sys.argv:
        states = ("idle", "thinking", "running", "success", "idle")
        save_gif(PREVIEW / "mission.gif", [scaled_preview(state) for state in states])

    expected = (1536, 2288)
    if (atlas.width, atlas.height) != expected:
        raise SystemExit(f"V2 atlas is {atlas.width}x{atlas.height}, expected {expected[0]}x{expected[1]}")
    if len(atlas.pixels) != atlas.width * atlas.height * 4:
        raise SystemExit("Atlas RGBA buffer size is invalid")
    if not any(atlas.pixels[index] == 0 for index in range(3, len(atlas.pixels), 4)):
        raise SystemExit("Atlas background must remain transparent")
    manifest = json.loads((OUT / "pet.json").read_text())
    manifest_v1 = json.loads((ROOT / "codex" / "pet-v1" / "pet.json").read_text())
    if manifest.get("spriteVersionNumber") != 2:
        raise SystemExit("pet.json must declare spriteVersionNumber 2")
    frame = manifest.get("frame", {})
    if (frame.get("width") * frame.get("columns"), frame.get("height") * frame.get("rows")) != expected:
        raise SystemExit("pet.json frame grid does not cover the V2 atlas")
    frame_count = frame["columns"] * frame["rows"]
    for name, animation in manifest["animations"].items():
        if not animation["frames"] or any(index < 0 or index >= frame_count for index in animation["frames"]):
            raise SystemExit(f"Animation {name} contains invalid frame indices")
    v1_grid = manifest_v1["frame"]
    if (v1_grid["width"] * v1_grid["columns"], v1_grid["height"] * v1_grid["rows"]) != (1536, 1872):
        raise SystemExit("V1 pet.json frame grid does not cover the legacy Codex atlas")
    if any(index >= 72 for animation in manifest_v1["animations"].values() for index in animation["frames"]):
        raise SystemExit("V1 animation references a frame outside its 8x9 grid")
    print(f"Built V2 atlas {atlas.width}x{atlas.height}: {OUT / 'spritesheet.webp'}")
    print(f"Built V1 fallback {atlas_v1.width}x{atlas_v1.height}: {ROOT / 'codex' / 'pet-v1' / 'spritesheet.webp'}")
    print(f"Generated {len(list(PREVIEW.glob('*.png')))} PNG previews in {PREVIEW}")
    if "--demo" in sys.argv:
        print(f"Generated animated demo: {PREVIEW / 'mission.gif'}")


if __name__ == "__main__":
    main()
