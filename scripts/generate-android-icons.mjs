/**
 * Generates every Android launcher/splash resource from public/icon.svg.
 *
 * Outputs (relative to the repo root):
 *   android/app/src/main/res/mipmap-.../ic_launcher.png            legacy launcher
 *   android/app/src/main/res/mipmap-.../ic_launcher_round.png      round launcher
 *   android/app/src/main/res/mipmap-.../ic_launcher_foreground.png adaptive layer
 *
 * The legacy icons use the full artwork (dark rounded squircle + vinyl
 * waveform glyph). The adaptive *foreground* layer strips the background
 * rects (the launcher supplies a solid colour background) and scales the
 * glyph into the 66dp "safe zone" so nothing is cropped by the mask.
 *
 * Usage: node scripts/generate-android-icons.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const resDir = join(root, 'android', 'app', 'src', 'main', 'res');

const fullSvg = readFileSync(join(root, 'public', 'icon.svg'), 'utf8');

// --- Adaptive foreground source: drop outer svg tag, background rects + vault badge. ---
const glyphOnly = fullSvg
  .replace(/<svg[^>]*>/, '')
  .replace(/<rect width="512" height="512" rx="128" fill="url\(#bgGrad\)" \/>/, '')
  .replace(/<rect x="16" y="16" width="480" height="480" rx="112"[^/]*\/>/, '')
  .replace(/<!-- Small lock\/vault badge indicator -->[\s\S]*$/, '');

// Content (rings + bars) spans y 64..448, x ~64..448 => half-extent ~192/512 of canvas.
// Adaptive safe zone is the central 66/108dp circle => half-extent 33/108 = 0.3056 of the
// canvas. Scale factor 0.78 keeps the artwork comfortably inside with a small margin.
const SAFE_SCALE = 0.78;

const mipDensities = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
const LEGACY_SIZES = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
const FOREGROUND_SIZES = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };

async function rasterize(svg, px) {
  return sharp(Buffer.from(svg)).resize(px, px).png().toBuffer();
}

async function main() {
  for (const [density, size] of Object.entries(LEGACY_SIZES)) {
    const buf = await rasterize(fullSvg, size);
    mkdirSync(join(resDir, `mipmap-${density}`), { recursive: true });
    writeFileSync(join(resDir, `mipmap-${density}`, 'ic_launcher.png'), buf);
    writeFileSync(join(resDir, `mipmap-${density}`, 'ic_launcher_round.png'), buf);
    console.log(`ic_launcher.png/round (${density}) ${size}px`);
  }

  for (const [density, size] of Object.entries(FOREGROUND_SIZES)) {
    const shift = (1 - SAFE_SCALE) * 256;
    const foregroundSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}"><g transform="translate(${shift} ${shift}) scale(${SAFE_SCALE})">${glyphOnly}</g></svg>`;
    const buf = await rasterize(foregroundSvg, size);
    mkdirSync(join(resDir, `mipmap-${density}`), { recursive: true });
    writeFileSync(join(resDir, `mipmap-${density}`, 'ic_launcher_foreground.png'), buf);
    console.log(`ic_launcher_foreground.png (${density}) ${size}px`);
  }
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
