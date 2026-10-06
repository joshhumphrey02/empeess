/**
 * Generates every logo size from assets/brand/logo-source.jpg.
 *
 *   bun run brand:assets
 *
 * The source is the MP mark on a black canvas. We lift the mark off the black
 * (colour-to-alpha), crop it tight, then compose it onto square canvases:
 *
 *   src/app/favicon.ico            16/32/48, black rounded tile
 *   src/app/icon.png               512, black rounded tile (browser tabs)
 *   src/app/apple-icon.png         180, full-bleed black (iOS rounds it)
 *   src/app/opengraph-image.png    1200x630 link preview
 *   public/brand/icon-192|512.png  PWA icons, full-bleed black (maskable-safe)
 *   public/brand/logo-tile.png     512, black rounded tile (UI on light bg)
 *   public/brand/logo-mark.png     512 square, transparent (any background)
 *   public/brand/logo-square.png   1024, full-bleed black (socials, avatars)
 */
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const SOURCE = "assets/brand/logo-source.jpg";
const BLACK = { r: 0, g: 0, b: 0, alpha: 1 };
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 };

/** The mark on transparency, cropped to its bounds. */
async function extractMark() {
  const { data, info } = await sharp(SOURCE).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const raw1 = { raw: { width: info.width, height: info.height, channels: 1 as const } };

  // Mark vs background: JPEG noise keeps "black" at 0-3. Inside the mark every
  // pixel (dark fold lines included) is kept opaque in its true colour, so it
  // reads on light backgrounds as well as dark.
  const mask = Buffer.alloc(info.width * info.height);
  for (let i = 0, p = 0; i < data.length; i += 3, p++) {
    mask[p] = Math.max(data[i], data[i + 1], data[i + 2]) > 24 ? 255 : 0;
  }
  // The source edge fades into black, which shows as a dark outline on light
  // backgrounds. Shrink the mask ~4px past that fringe, then soften it for anti-aliasing.
  const eroded = await sharp(mask, raw1).blur(3.5).threshold(250).extractChannel(0).raw().toBuffer();
  const alpha = await sharp(eroded, raw1).blur(0.7).extractChannel(0).raw().toBuffer();

  const out = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0, p = 0, o = 0; i < data.length; i += 3, p++, o += 4) {
    out[o] = data[i];
    out[o + 1] = data[i + 1];
    out[o + 2] = data[i + 2];
    out[o + 3] = alpha[p];
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim({ threshold: 1 })
    .png()
    .toBuffer();
}

/** Centre the mark on a square canvas, filling `fill` of the side. */
async function square(mark: Buffer, size: number, fill: number, background = CLEAR, radius = 0) {
  const inner = Math.round(size * fill);
  const resized = await sharp(mark).resize(inner, inner, { fit: "contain", background: CLEAR }).toBuffer();
  let canvas = sharp({ create: { width: size, height: size, channels: 4, background } }).composite([
    { input: resized, gravity: "centre" },
  ]);
  if (radius > 0) {
    const r = Math.round(size * radius);
    const mask = Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" ry="${r}"/></svg>`);
    canvas = sharp(await canvas.png().toBuffer()).composite([{ input: mask, blend: "dest-in" }]);
  }
  return canvas.png({ compressionLevel: 9 }).toBuffer();
}

/** A PNG-payload .ico (supported by every current browser). */
function ico(images: { size: number; png: Buffer }[]) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = 6 + images.length * 16;
  const entries = images.map(({ size, png }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(png.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += png.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...images.map((i) => i.png)]);
}

const mark = await extractMark();
await mkdir("public/brand", { recursive: true });

// Small sizes get a bigger mark: detail matters more than breathing room at 16px.
const tile = (size: number, fill = 0.74) => square(mark, size, fill, BLACK, 0.22);
const bleed = (size: number, fill = 0.62) => square(mark, size, fill, BLACK);

const favicon = ico(await Promise.all([16, 32, 48].map(async (size) => ({ size, png: await tile(size, 0.86) }))));

const ogMark = await sharp(mark).resize(420, 420, { fit: "contain", background: CLEAR }).toBuffer();
const og = await sharp({ create: { width: 1200, height: 630, channels: 4, background: BLACK } })
  .composite([{ input: ogMark, gravity: "centre" }])
  .png({ compressionLevel: 9 })
  .toBuffer();

const outputs: Record<string, Buffer> = {
  "src/app/favicon.ico": favicon,
  "src/app/icon.png": await tile(512),
  "src/app/apple-icon.png": await bleed(180, 0.7),
  "src/app/opengraph-image.png": og,
  // Maskable icons keep the mark inside the 80% safe zone.
  "public/brand/icon-192.png": await bleed(192),
  "public/brand/icon-512.png": await bleed(512),
  "public/brand/logo-tile.png": await tile(512),
  "public/brand/logo-mark.png": await square(mark, 512, 1),
  "public/brand/logo-square.png": await bleed(1024, 0.72),
};

for (const [path, buf] of Object.entries(outputs)) {
  await writeFile(path, buf);
  console.log(`${path.padEnd(32)} ${(buf.length / 1024).toFixed(1)} KB`);
}
