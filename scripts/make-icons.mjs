// Renders the app icons from an SVG logo using the pre-installed Playwright browser.
// Usage: node scripts/make-icons.mjs assets/logo/logo.svg
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const src = process.argv[2] ?? 'assets/logo/logo.svg';
const svg = fs.readFileSync(src, 'utf8');
// The mark without its rounded-square background, for adaptive and splash icons.
const mark = svg.replace(/<rect[^>]*\/>/, '');
const bg = /<rect[^>]*fill="([^"]+)"/.exec(svg)?.[1] ?? '#4B5FD6';

const jobs = [
  { out: 'assets/icon.png', size: 1024, html: full(svg, true) },
  { out: 'assets/favicon.png', size: 64, html: full(svg, false) },
  { out: 'assets/splash-icon.png', size: 1024, html: inset(mark, 1, 'transparent') },
  { out: 'assets/android-icon-foreground.png', size: 1024, html: inset(mark, 0.62, 'transparent') },
  { out: 'assets/android-icon-background.png', size: 1024, html: `<div style="width:100%;height:100%;background:${bg}"></div>` },
  { out: 'assets/android-icon-monochrome.png', size: 1024, html: inset(mark.replace(/fill="#[0-9A-Fa-f]{6}"/g, 'fill="#000"').replace(/stroke="#[0-9A-Fa-f]{6}"/g, 'stroke="#000"'), 0.62, 'transparent') },
  { out: 'assets/logo/logo-256.png', size: 256, html: full(svg, false) },
];

function full(s, square) {
  // App stores round the corners themselves, so the store icon is a full square.
  const body = square ? s.replace(/rx="\d+"/, 'rx="0"') : s;
  return `<div style="width:100%;height:100%">${body.replace('<svg ', '<svg width="100%" height="100%" ')}</div>`;
}
function inset(s, scale, bgc) {
  const pad = ((1 - scale) / 2) * 100;
  return `<div style="width:100%;height:100%;background:${bgc};box-sizing:border-box;padding:${pad}%">${s.replace('<svg ', '<svg width="100%" height="100%" ')}</div>`;
}

const browser = await chromium.launch();
for (const j of jobs) {
  const page = await browser.newPage({ viewport: { width: j.size, height: j.size } });
  await page.setContent(`<html><body style="margin:0;background:transparent;width:${j.size}px;height:${j.size}px">${j.html}</body></html>`);
  await page.screenshot({ path: j.out, omitBackground: true });
  await page.close();
  console.log('wrote', path.normalize(j.out));
}
await browser.close();
