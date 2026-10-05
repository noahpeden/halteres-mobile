import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const iconPath = join(root, "assets/icon.png");
const buf = readFileSync(iconPath);

if (buf[0] !== 0x89 || buf.toString("ascii", 1, 4) !== "PNG") {
  throw new Error("assets/icon.png is not a PNG");
}

const width = buf.readUInt32BE(16);
const height = buf.readUInt32BE(20);
const colorType = buf[25];
const colorNames = {
  0: "grayscale",
  2: "RGB",
  3: "indexed",
  4: "grayscale+alpha",
  6: "RGBA",
};

if (width !== 1024 || height !== 1024) {
  throw new Error(`assets/icon.png must be 1024x1024, got ${width}x${height}`);
}

if (colorType === 4 || colorType === 6) {
  throw new Error(
    `assets/icon.png has an alpha channel (PNG color type ${colorType} ${colorNames[colorType]})`,
  );
}

if (colorType !== 2 && colorType !== 0) {
  throw new Error(
    `assets/icon.png unexpected PNG color type ${colorType} (${colorNames[colorType] ?? "unknown"})`,
  );
}

console.log(
  `ok: assets/icon.png ${width}x${height} colorType=${colorType} (${colorNames[colorType]}, no alpha)`,
);
