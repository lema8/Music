/**
 * Locally-generated cover artwork.
 *
 * The original app fetched its default album-art presets from images.unsplash.com
 * at runtime — which breaks the "100% offline" promise of the SoundVault
 * Android app (and renders broken images on the web without connectivity).
 *
 * These presets are procedurally drawn SVGs (neon palette matching the app UI),
 * embedded as data: URIs, so artwork always renders with zero network access.
 */

export interface CoverArtPreset {
  id: string;
  name: string;
  url: string;
}

// ---------------------------------------------------------------------------
// SVG builders (800×800 canvas)
// ---------------------------------------------------------------------------

const esc = (s: string) =>
  'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s.replace(/\s+/g, ' '));

const svgWrap = (inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"><rect width="800" height="800" fill="#0c0e16"/>${inner}</svg>`;

function motifGrid(bg: string[], accent: string, accent2: string): string {
  const floor = bg[1];
  let lines = '';
  for (let i = -14; i <= 14; i++) {
    const xT = 400 + i * 9;
    const xB = 400 + i * 34;
    lines += `<line x1="${xT}" y1="560" x2="${xB}" y2="800" stroke="${accent}" stroke-opacity="0.28" stroke-width="3"/>`;
  }
  for (let y = 590; y <= 800; y += 28) {
    const half = Math.round(((y - 560) / 240) * 460);
    lines += `<line x1="${400 - half}" y1="${y}" x2="${400 + half}" y2="${y}" stroke="${accent2}" stroke-opacity="0.5" stroke-width="3"/>`;
  }
  return esc(
    svgWrap(
      `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="#160b33"/></linearGradient></defs>` +
        `<rect width="800" height="560" fill="url(#sky)"/>` +
        `<circle cx="400" cy="470" r="150" fill="${accent2}" opacity="0.16"/>` +
        `<circle cx="400" cy="470" r="90" fill="${accent2}" opacity="0.9"/>` +
        `<rect y="560" width="800" height="240" fill="${floor}"/>` +
        lines +
        `<rect y="552" width="800" height="8" fill="${accent}" opacity="0.7"/>`
    )
  );
}

function motifVinyl(bg: string[], accent: string, accent2: string): string {
  let grooves = '';
  for (let i = 0; i < 26; i++) {
    const r = 120 + i * 7.5;
    grooves += `<circle cx="400" cy="400" r="${r}" fill="none" stroke="${accent}" stroke-opacity="${(0.85 - i * 0.028).toFixed(2)}" stroke-width="2"/>`;
  }
  return esc(
    svgWrap(
      `<defs><radialGradient id="disc" cx="0.35" cy="0.3" r="1"><stop offset="0" stop-color="${bg[1]}"/><stop offset="1" stop-color="${bg[0]}"/></radialGradient></defs>` +
        `<rect width="800" height="800" fill="${bg[0]}"/>` +
        `<circle cx="400" cy="400" r="330" fill="url(#disc)"/>` +
        grooves +
        `<circle cx="400" cy="400" r="118" fill="#0c0e16"/>` +
        `<circle cx="400" cy="400" r="118" fill="none" stroke="${accent2}" stroke-width="5" opacity="0.9"/>` +
        `<circle cx="400" cy="400" r="42" fill="${accent2}"/>` +
        `<circle cx="400" cy="400" r="14" fill="${bg[0]}"/>` +
        `<circle cx="452" cy="348" r="22" fill="none" stroke="${accent}" stroke-width="3" opacity="0.75"/>` +
        `<circle cx="300" cy="140" r="70" fill="none" stroke="${accent}" stroke-width="3" opacity="0.35"/>`
    )
  );
}

function motifNebula(bg: string[], accent: string, accent2: string): string {
  let stars = '';
  for (let i = 0; i < 90; i++) {
    const x = (i * 137 + 41) % 800;
    const y = (i * 271 + 83) % 560;
    stars += `<circle cx="${x}" cy="${y}" r="${(i % 3) + 1}" fill="#ffffff" opacity="${(0.15 + ((i * 7) % 10) / 12).toFixed(2)}"/>`;
  }
  return esc(
    svgWrap(
      `<defs><radialGradient id="neb" cx="0.5" cy="0.5" r="0.75"><stop offset="0" stop-color="${bg[1]}"/><stop offset="1" stop-color="${bg[0]}"/></radialGradient></defs>` +
        `<rect width="800" height="800" fill="url(#neb)"/>` +
        stars +
        `<circle cx="570" cy="240" r="230" fill="${accent}" opacity="0.14"/>` +
        `<circle cx="570" cy="240" r="150" fill="${accent}" opacity="0.12"/>` +
        `<circle cx="570" cy="240" r="80" fill="${accent2}" opacity="0.25"/>` +
        `<circle cx="210" cy="560" r="130" fill="${accent2}" opacity="0.1"/>` +
        `<circle cx="210" cy="560" r="44" fill="none" stroke="${accent2}" stroke-width="2" opacity="0.7"/>`
    )
  );
}

function motifSunset(bg: string[], accent: string, accent2: string): string {
  let bands = '';
  for (let y = 440; y < 800; y += 36) {
    bands += `<rect x="0" y="${y}" width="800" height="${(y % 72) + 8}" fill="${bg[1]}" opacity="0.16"/>`;
  }
  return esc(
    svgWrap(
      `<defs><linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></linearGradient></defs>` +
        `<rect width="800" height="800" fill="url(#sky2)"/>` +
        `<circle cx="400" cy="430" r="150" fill="${accent}" opacity="0.25"/>` +
        `<circle cx="400" cy="430" r="120" fill="${accent}"/>` +
        bands +
        `<path d="M0 660 L150 560 L260 640 L420 520 L570 640 L700 570 L800 650 L800 800 L0 800 Z" fill="${bg[0]}" opacity="0.85"/>` +
        `<path d="M0 800 L0 720 L180 640 L330 730 L470 660 L640 750 L800 690 L800 800 Z" fill="#0c0e16" opacity="0.9"/>` +
        `<circle cx="400" cy="430" r="122" fill="none" stroke="${accent2}" stroke-width="3" opacity="0.5"/>`
    )
  );
}

function motifWave(bg: string[], accent: string, accent2: string): string {
  let wave = '';
  for (let k = 0; k < 2; k++) {
    let d = '';
    for (let x = 0; x <= 800; x += 16) {
      const y = 320 + k * 130 + Math.sin((x / 800) * Math.PI * 4 + k * 1.6) * 70 + Math.sin(x / 90) * 26;
      d += `${x === 0 ? 'M' : 'L'}${x} ${y.toFixed(1)} `;
    }
    wave += `<path d="${d}" fill="none" stroke="${k === 0 ? accent : accent2}" stroke-width="7" opacity="${k === 0 ? 0.9 : 0.55}"/>`;
  }
  let bars = '';
  for (let i = 0; i < 24; i++) {
    const x = 52 + i * 30;
    const h = 40 + ((i * 37 + 11) % 150);
    bars += `<rect x="${x}" y="${780 - h}" width="14" height="${h}" rx="7" fill="${i % 3 === 0 ? accent2 : i % 3 === 1 ? accent : '#ffffff'}" opacity="${i % 3 === 0 ? 0.85 : 0.7}"/>`;
  }
  return esc(
    svgWrap(
      `<defs><linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></linearGradient></defs>` +
        `<rect width="800" height="620" fill="url(#sea)"/>` +
        `<circle cx="640" cy="150" r="90" fill="none" stroke="${accent2}" stroke-width="2" opacity="0.5"/>` +
        `<circle cx="640" cy="150" r="60" fill="none" stroke="${accent2}" stroke-width="2" opacity="0.35"/>` +
        wave +
        `<rect y="620" width="800" height="180" fill="${bg[1]}"/>` +
        bars
    )
  );
}

function motifEQ(bg: string[], accent: string, accent2: string): string {
  let bars = '';
  for (let i = 1; i < 26; i++) {
    const h = 40 + ((i * 53 + 19) % 220);
    const x = 400 - i * 15 - 6;
    const color = i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? accent2 : accent;
    bars += `<rect x="${x}" y="${400 - h}" width="12" height="${h}" rx="6" fill="${color}" opacity="0.85"/>`;
    bars += `<rect x="${400 + i * 15 - 6}" y="${400 - h}" width="12" height="${h}" rx="6" fill="${color}" opacity="0.85"/>`;
  }
  return esc(
    svgWrap(
      `<defs><radialGradient id="eqbg" cx="0.5" cy="0.5" r="0.8"><stop offset="0" stop-color="${bg[1]}"/><stop offset="1" stop-color="${bg[0]}"/></radialGradient></defs>` +
        `<rect width="800" height="800" fill="url(#eqbg)"/>` +
        `<circle cx="400" cy="400" r="330" fill="none" stroke="${accent}" stroke-width="2" opacity="0.14"/>` +
        bars +
        `<circle cx="400" cy="400" r="16" fill="${accent2}" opacity="0.9"/>` +
        `<circle cx="400" cy="400" r="5" fill="#0c0e16"/>`
    )
  );
}

// ---------------------------------------------------------------------------
// Presets (same ids/names as the original remote-art presets)
// ---------------------------------------------------------------------------

interface Palette {
  bg: [string, string];
  accent: string;
  accent2: string;
  motif: keyof typeof builders;
}

const PALETTES: Palette[] = [
  { bg: ['#0d0a1e', '#2b1055'], accent: '#4cd7f6', accent2: '#a078ff', motif: 'grid' },
  { bg: ['#1a0f14', '#541c18'], accent: '#f2b56b', accent2: '#d0bcff', motif: 'vinyl' },
  { bg: ['#05050f', '#221457'], accent: '#a078ff', accent2: '#4cd7f6', motif: 'nebula' },
  { bg: ['#3a0f1e', '#7a2e1d'], accent: '#ffd9a0', accent2: '#4edea3', motif: 'sunset' },
  { bg: ['#052e36', '#0f5b57'], accent: '#4cd7f6', accent2: '#4edea3', motif: 'wave' },
  { bg: ['#101218', '#232a4d'], accent: '#4edea3', accent2: '#d0bcff', motif: 'eq' },
];

const NAMES = ['Cyber Synth', 'Vintage Vinyl', 'Deep Nebula', 'Acoustic Warmth', 'Solar Drift', 'Analog Master'];
const IDS = ['preset-cyber', 'preset-vinyl', 'preset-nebula', 'preset-acoustic', 'preset-solar', 'preset-analog'];

const builders = {
  grid: motifGrid,
  vinyl: motifVinyl,
  nebula: motifNebula,
  sunset: motifSunset,
  wave: motifWave,
  eq: motifEQ,
};

export function buildCoverArt(index: number): string {
  const p = PALETTES[((index % PALETTES.length) + PALETTES.length) % PALETTES.length];
  return builders[p.motif](p.bg, p.accent, p.accent2);
}

export const COVER_PRESETS: CoverArtPreset[] = PALETTES.map((p, i) => ({
  id: IDS[i],
  name: NAMES[i],
  url: buildCoverArt(i),
}));

/** Deterministic artwork for a given seed string (used as img onError fallback). */
export function coverArtForSeed(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return buildCoverArt(hash);
}

/** React onError handler: swaps a failed remote/legacy cover for local art. */
export function coverOnError(seed?: string) {
  return (e: { currentTarget: { dataset?: Record<string, string>; src?: string; alt?: string } }) => {
    const el = e.currentTarget;
    if (el.dataset?.svfb) return;
    el.dataset.svfb = '1';
    el.src = coverArtForSeed(seed || el.alt || 'soundvault-cover');
  };
}
