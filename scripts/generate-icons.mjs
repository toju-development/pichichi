#!/usr/bin/env node
/**
 * Pichichi icon generator.
 *
 * Single source of truth → all platform icons. Run: `npm run icons:gen`.
 *
 * Outputs:
 *   apps/web/public/logo.svg                 — master SVG, also used as modern favicon
 *   apps/web/public/icon-192.png             — PWA manifest
 *   apps/web/public/icon-512.png             — PWA manifest
 *   apps/web/public/apple-icon.png           — iOS Safari home screen (180)
 *   apps/web/src/app/favicon.ico             — multi-size .ico (16/32/48)
 *   apps/mobile/assets/icon.png              — iOS app icon (1024)
 *   apps/mobile/assets/android-icon-foreground.png  — Android adaptive fg (1024)
 *   apps/mobile/assets/android-icon-background.png  — Android adaptive bg (1024)
 *   apps/mobile/assets/android-icon-monochrome.png  — Android themed-icon silhouette
 *   apps/mobile/assets/splash-icon.png       — Expo splash (512)
 *   apps/mobile/assets/favicon.png           — Expo Web favicon (48)
 *   apps/web/public/og-image.png             — Social share preview (1200×630)
 *
 * The glyph "9" is outlined from Inter Black at build time so the SVG is
 * portable (renders identically everywhere, no font required at runtime).
 */

import opentype from "opentype.js";
import sharp from "sharp";
import pngToIco from "png-to-ico";
import fs from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const WEB_PUB = path.join(ROOT, "apps/web/public");
const WEB_APP = path.join(ROOT, "apps/web/src/app");
const MOBILE_ASSETS = path.join(ROOT, "apps/mobile/assets");
const FONT_DIR = path.join(__dirname, "_assets");
const FONT_PATH = path.join(FONT_DIR, "inter-black.woff");
const FONT_URL =
  "https://cdn.jsdelivr.net/npm/@fontsource/inter/files/inter-latin-900-normal.woff";

const C = {
  primaryDark: "#0B6E4F",
  primaryLight: "#14A76C",
  gold: "#FFD166",
  goldDark: "#E6B84D",
};

async function ensureFont() {
  if (existsSync(FONT_PATH)) return;
  await fs.mkdir(FONT_DIR, { recursive: true });
  console.log("Downloading Inter Black (latin) ...");
  const res = await fetch(FONT_URL);
  if (!res.ok) throw new Error(`Font download failed: ${res.status} ${res.statusText}`);
  await fs.writeFile(FONT_PATH, Buffer.from(await res.arrayBuffer()));
}

function loadFont() {
  const buf = readFileSync(FONT_PATH);
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  return opentype.parse(ab);
}

/**
 * Outline the "9" glyph, centered inside a square viewBox.
 * glyphScale = visual ink height as a fraction of viewBox.
 */
function ninePath(font, { viewBox = 240, glyphScale = 0.7 }) {
  const probeSize = 1000;
  const probe = font.getPath("9", 0, 0, probeSize);
  const pBox = probe.getBoundingBox();
  const probeH = pBox.y2 - pBox.y1;

  const targetH = viewBox * glyphScale;
  const fontSize = (targetH / probeH) * probeSize;

  const real = font.getPath("9", 0, 0, fontSize);
  const rBox = real.getBoundingBox();
  const inkW = rBox.x2 - rBox.x1;
  const inkH = rBox.y2 - rBox.y1;

  const tx = (viewBox - inkW) / 2 - rBox.x1;
  const ty = (viewBox - inkH) / 2 - rBox.y1;

  return font.getPath("9", tx, ty, fontSize).toPathData(3);
}

function wrapSvg({ viewBox = 240, inner }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBox} ${viewBox}" width="${viewBox}" height="${viewBox}">
  <defs>
    <linearGradient id="g-green" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${C.primaryDark}"/>
      <stop offset="100%" stop-color="${C.primaryLight}"/>
    </linearGradient>
    <linearGradient id="g-gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${C.gold}"/>
      <stop offset="100%" stop-color="${C.goldDark}"/>
    </linearGradient>
  </defs>
${inner}
</svg>
`;
}

function svgFull(nineData, viewBox = 240) {
  const c = viewBox / 2;
  const ringR = (viewBox / 2) * 0.93;
  const ringStroke = viewBox * 0.017;
  return wrapSvg({
    viewBox,
    inner: `  <circle cx="${c}" cy="${c}" r="${viewBox / 2}" fill="url(#g-green)"/>
  <circle cx="${c}" cy="${c}" r="${ringR}" fill="none" stroke="${C.gold}" stroke-width="${ringStroke}" stroke-opacity="0.85"/>
  <path d="${nineData}" fill="url(#g-gold)"/>`,
  });
}

function svgForeground(nineData, viewBox = 240) {
  return wrapSvg({
    viewBox,
    inner: `  <path d="${nineData}" fill="url(#g-gold)"/>`,
  });
}

function svgBackground(viewBox = 240) {
  return wrapSvg({
    viewBox,
    inner: `  <rect width="${viewBox}" height="${viewBox}" fill="url(#g-green)"/>`,
  });
}

function svgMonochrome(nineData, viewBox = 240) {
  return wrapSvg({
    viewBox,
    inner: `  <path d="${nineData}" fill="#ffffff"/>`,
  });
}

async function renderPng(svg, size, outPath) {
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(outPath);
  console.log(`  ✓ ${path.relative(ROOT, outPath)}  (${size}×${size})`);
}

/**
 * OG image — 1200×630 — used for social shares (WhatsApp, Twitter, LinkedIn).
 * Layout: dark green background, logo centered-left, "Pichichi" + tagline right.
 */
async function renderOgImage(logoSvg, outPath) {
  const W = 1200;
  const H = 630;
  const LOGO_SIZE = 220;

  // Render logo PNG at target size
  const logoPng = await sharp(Buffer.from(logoSvg))
    .resize(LOGO_SIZE, LOGO_SIZE)
    .png()
    .toBuffer();

  // Background SVG with text
  const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="og-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#083D2C"/>
      <stop offset="100%" stop-color="#0B6E4F"/>
    </linearGradient>
    <linearGradient id="og-gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFD166"/>
      <stop offset="100%" stop-color="#E6B84D"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#og-bg)"/>

  <!-- Subtle grid pattern -->
  <line x1="0" y1="${H / 2}" x2="${W}" y2="${H / 2}" stroke="white" stroke-width="1" stroke-opacity="0.04"/>
  <line x1="${W / 2}" y1="0" x2="${W / 2}" y2="${H}" stroke="white" stroke-width="1" stroke-opacity="0.04"/>
  <circle cx="600" cy="315" r="280" fill="none" stroke="white" stroke-width="1" stroke-opacity="0.04"/>

  <!-- Logo placeholder (composited below via sharp) -->

  <!-- App name -->
  <text
    x="700" y="240"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="96"
    font-weight="900"
    fill="url(#og-gold)"
    text-anchor="middle"
    letter-spacing="-2"
  >Pichichi</text>

  <!-- Tagline line 1 -->
  <text
    x="700" y="318"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="32"
    font-weight="400"
    fill="white"
    fill-opacity="0.85"
    text-anchor="middle"
    letter-spacing="0.5"
  >Predecí, competí, ganá con tus amigos</text>

  <!-- Tagline line 2 -->
  <text
    x="700" y="368"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="26"
    font-weight="400"
    fill="white"
    fill-opacity="0.55"
    text-anchor="middle"
  >Armá tu grupo · Predecí los scores · Subí al podio</text>

  <!-- URL -->
  <text
    x="700" y="530"
    font-family="system-ui, -apple-system, sans-serif"
    font-size="22"
    font-weight="400"
    fill="white"
    fill-opacity="0.4"
    text-anchor="middle"
    letter-spacing="1"
  >pichichi.app</text>
</svg>`;

  // Composite: render background SVG, overlay logo PNG centered-left
  const logoX = Math.round((W / 2 - LOGO_SIZE) / 2 - 20);
  const logoY = Math.round((H - LOGO_SIZE) / 2);

  await sharp(Buffer.from(ogSvg))
    .composite([{ input: logoPng, left: logoX, top: logoY }])
    .png()
    .toFile(outPath);

  console.log(`  ✓ ${path.relative(ROOT, outPath)}  (${W}×${H})`);
}

async function main() {
  await ensureFont();
  const font = loadFont();

  const nineFull = ninePath(font, { viewBox: 240, glyphScale: 0.7 });
  const nineSafe = ninePath(font, { viewBox: 240, glyphScale: 0.46 });

  const fullSvg = svgFull(nineFull);
  const fgSvg = svgForeground(nineSafe);
  const bgSvg = svgBackground();
  const monoSvg = svgMonochrome(nineSafe);

  await fs.mkdir(WEB_PUB, { recursive: true });
  await fs.writeFile(path.join(WEB_PUB, "logo.svg"), fullSvg);
  console.log(`  ✓ apps/web/public/logo.svg`);

  await renderPng(fullSvg, 192, path.join(WEB_PUB, "icon-192.png"));
  await renderPng(fullSvg, 512, path.join(WEB_PUB, "icon-512.png"));
  await renderPng(fullSvg, 180, path.join(WEB_PUB, "apple-icon.png"));

  const icoPngs = [];
  for (const s of [16, 32, 48]) {
    icoPngs.push(await sharp(Buffer.from(fullSvg)).resize(s, s).png().toBuffer());
  }
  const icoBuf = await pngToIco(icoPngs);
  await fs.writeFile(path.join(WEB_APP, "favicon.ico"), icoBuf);
  console.log(`  ✓ apps/web/src/app/favicon.ico  (16/32/48)`);

  await renderPng(fullSvg, 1024, path.join(MOBILE_ASSETS, "icon.png"));
  await renderPng(fgSvg, 1024, path.join(MOBILE_ASSETS, "android-icon-foreground.png"));
  await renderPng(bgSvg, 1024, path.join(MOBILE_ASSETS, "android-icon-background.png"));
  await renderPng(monoSvg, 1024, path.join(MOBILE_ASSETS, "android-icon-monochrome.png"));
  await renderPng(fullSvg, 512, path.join(MOBILE_ASSETS, "splash-icon.png"));
  await renderPng(fullSvg, 48, path.join(MOBILE_ASSETS, "favicon.png"));

  await renderOgImage(fullSvg, path.join(WEB_PUB, "og-image.png"));

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
