#!/usr/bin/env node
// Render self-contained SVG charts from the summary CSVs for the README.
// No dependencies: reads CSV, emits SVG. Re-run after a benchmark refresh:
//   node benchmarks/render-charts.mjs
// SVGs draw their own light card background so they read well in both the
// light and dark GitHub themes.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'docs', 'charts');
mkdirSync(outDir, { recursive: true });

function readCsv(name) {
  const text = readFileSync(join(root, 'data', name), 'utf8').trim();
  const [header, ...lines] = text.split('\n');
  const cols = header.split(',');
  return lines.map((line) => {
    const cells = line.split(',');
    return Object.fromEntries(cols.map((c, i) => [c, cells[i]]));
  });
}

const COLORS = { jpeg: '#94a3b8', webp: '#60a5fa', avif: '#4a4efb', heic: '#94a3b8', jpg: '#f59e0b', png: '#ef4444' };
const INK = '#1a1c28';
const MUTED = '#5b6172';
const CARD = '#ffffff';
const CARD_EDGE = '#e6e8f0';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Generic horizontal bar chart. bars: [{label, value, display, color, note}]
function barChart({ title, subtitle, bars, footer, unitMax }) {
  const W = 760;
  const padX = 32;
  const top = 92;
  const rowH = 54;
  const barH = 26;
  const labelW = 132;
  const trackX = padX + labelW;
  const trackW = W - trackX - 150;
  const H = top + bars.length * rowH + 56;
  const max = unitMax ?? Math.max(...bars.map((b) => b.value));

  let body = '';
  bars.forEach((b, i) => {
    const y = top + i * rowH;
    const w = Math.max(3, (b.value / max) * trackW);
    body += `
      <text x="${padX}" y="${y + barH / 2 + 5}" font-size="15" font-weight="600" fill="${INK}">${esc(b.label)}</text>
      <rect x="${trackX}" y="${y}" width="${trackW}" height="${barH}" rx="6" fill="#f1f2f7"/>
      <rect x="${trackX}" y="${y}" width="${w.toFixed(1)}" height="${barH}" rx="6" fill="${b.color}"/>
      <text x="${trackX + w + 10}" y="${y + barH / 2 + 5}" font-size="15" font-weight="700" fill="${INK}">${esc(b.display)}</text>
      ${b.note ? `<text x="${trackX + w + 10}" y="${y + barH / 2 + 22}" font-size="12" fill="${MUTED}">${esc(b.note)}</text>` : ''}`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="ui-sans-serif,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="16" fill="${CARD}" stroke="${CARD_EDGE}"/>
  <text x="${padX}" y="40" font-size="21" font-weight="800" fill="${INK}">${esc(title)}</text>
  <text x="${padX}" y="66" font-size="14" fill="${MUTED}">${esc(subtitle)}</text>
  ${body}
  <text x="${padX}" y="${H - 20}" font-size="12" fill="${MUTED}">${esc(footer)}</text>
</svg>\n`;
}

// ---- Chart 1: identical quality (SSIM 0.95), fewer bytes ----
const comp = readCsv('compression-benchmark-summary.csv').filter(
  (r) => r.metric === 'iso_ssim_mean_bytes' && r.quality_or_target === '0.95',
);
const bytesByFmt = Object.fromEntries(comp.map((r) => [r.format, Number(r.value)]));
const jpegBytes = bytesByFmt.jpeg;
const mb = (b) => (b / 1048576).toFixed(2) + ' MB';
const savings = (b) => `${Math.round((1 - b / jpegBytes) * 100)}% smaller than JPEG`;
const chart1 = barChart({
  title: 'Same quality, far fewer bytes',
  subtitle: 'Mean encoded size to reach identical perceptual quality (SSIM 0.95), lower is better',
  unitMax: jpegBytes,
  bars: [
    { label: 'JPEG', value: bytesByFmt.jpeg, display: mb(bytesByFmt.jpeg), color: COLORS.jpeg, note: 'baseline' },
    { label: 'WebP', value: bytesByFmt.webp, display: mb(bytesByFmt.webp), color: COLORS.webp, note: savings(bytesByFmt.webp) },
    { label: 'AVIF', value: bytesByFmt.avif, display: mb(bytesByFmt.avif), color: COLORS.avif, note: savings(bytesByFmt.avif) },
  ],
  footer: 'Storage Lab · corpus mean · cleanor.app/research',
});
writeFileSync(join(outDir, 'compression-savings.svg'), chart1);

// ---- Chart 2: the HEIC tax ----
const heic = readCsv('heic-tax-summary.csv');
const q60 = heic.find((r) => r.heic_q === '60') ?? heic[0];
const chart2 = barChart({
  title: 'The HEIC-to-JPG tax',
  subtitle: `Same photo corpus at matched quality (SSIM ${q60.mean_ssim}), lower is better`,
  unitMax: Number(q60.corpus_png_mb),
  bars: [
    { label: 'HEIC', value: Number(q60.corpus_heic_mb), display: `${q60.corpus_heic_mb} MB`, color: COLORS.heic, note: 'original' },
    { label: 'JPG', value: Number(q60.corpus_matched_jpg_mb), display: `${q60.corpus_matched_jpg_mb} MB`, color: COLORS.jpg, note: `${q60.jpg_tax_x_median}x bigger (+${q60.jpg_tax_pct}%)` },
    { label: 'PNG', value: Number(q60.corpus_png_mb), display: `${q60.corpus_png_mb} MB`, color: COLORS.png, note: `${q60.png_tax_x_median}x bigger (+${q60.png_tax_pct}%)` },
  ],
  footer: 'Storage Lab · corpus total · cleanor.app/research',
});
writeFileSync(join(outDir, 'heic-tax.svg'), chart2);

console.log('Wrote docs/charts/compression-savings.svg and docs/charts/heic-tax.svg');
