#!/usr/bin/env node
// Cleanor Storage Lab — "The HEIC Tax" benchmark.
//
// Question: 246,000 people/month Google "heic to jpg". What does converting an
// iPhone-style HEIC to JPG (at the high quality online converters use) or to
// lossless PNG do to the file size — and do you get any visible quality for it?
//
// Method, per master image (lossless PNG):
//   1. Encode master -> HEIC at an iOS-like quality (heif-enc, x265) = "the file on your phone".
//   2. From that HEIC, convert -> JPG at q in {80,90,95,100} and -> PNG (lossless), the
//      outputs a typical converter produces.
//   3. Measure bytes for each, and SSIM (via ffmpeg) of HEIC and every JPG against the
//      lossless master, so we can compare size *at matched perceptual quality*.
//
//   node heic-tax-benchmark.mjs                    # corpus corpus
//   node heic-tax-benchmark.mjs --corpus DIR --out data/heic-tax-benchmark.csv --heic-q 50
//
// Needs: heif-enc + heif-convert (brew install libheif), sharp (repo dep), ffmpeg (brew).

import sharp from 'sharp';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (n, d) => {
  const i = argv.indexOf(n);
  return i >= 0 ? argv[i + 1] : d;
};
const CORPUS = path.resolve(ROOT, opt('--corpus', 'corpus'));
const OUT = path.resolve(ROOT, opt('--out', 'data/heic-tax-benchmark.csv'));
// Sweep several HEIC qualities so the "tax" is robust to how aggressively the phone
// encoded the original. iOS "High Efficiency" sits around the middle of this range.
const HEIC_QUALITIES = (opt('--heic-q', '40,50,60,70') || '')
  .split(',')
  .map((s) => parseInt(s.trim(), 10))
  .filter(Boolean);
// Fine JPG ladder so we can interpolate the size at exactly the HEIC's SSIM (matched quality).
const JPG_QUALITIES = [80, 85, 90, 93, 95, 97, 98, 100];
const WORK = path.join(ROOT, '.work/heic');
fs.mkdirSync(WORK, { recursive: true });
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const bytes = (p) => fs.statSync(p).size;
const sh = (cmd, args) => {
  const r = spawnSync(cmd, args, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`${cmd} failed: ${(r.stderr || '').slice(0, 300)}`);
  return r;
};

// SSIM (All) of candidate PNG vs reference PNG, via ffmpeg's ssim filter.
function ssim(refPng, candPng) {
  const r = spawnSync(
    'ffmpeg',
    ['-i', candPng, '-i', refPng, '-lavfi', 'ssim', '-f', 'null', '-'],
    { encoding: 'utf8' },
  );
  const m = (r.stderr || '').match(/All:([0-9.]+)/);
  return m ? parseFloat(m[1]) : null;
}

const masters = fs
  .readdirSync(CORPUS)
  .filter((f) => /\.(png|jpe?g)$/i.test(f))
  .sort();
if (!masters.length) {
  console.error(`No images in ${CORPUS}`);
  process.exit(1);
}

console.log(
  `HEIC Tax benchmark · ${masters.length} masters · HEIC q=${HEIC_QUALITIES.join('/')} · JPG q=${JPG_QUALITIES.join('/')}\n`,
);

// Interpolate the JPG size (bytes) at exactly the target SSIM, from the JPG quality ladder.
function jpgBytesAtSsim(jpg, targetSsim) {
  const pts = JPG_QUALITIES.map((q) => jpg[q]).filter((p) => p.ssim != null);
  pts.sort((a, b) => a.ssim - b.ssim);
  if (targetSsim <= pts[0].ssim) return pts[0].bytes;
  if (targetSsim >= pts[pts.length - 1].ssim) return pts[pts.length - 1].bytes;
  for (let k = 1; k < pts.length; k++) {
    if (targetSsim <= pts[k].ssim) {
      const a = pts[k - 1],
        b = pts[k];
      const t = (targetSsim - a.ssim) / (b.ssim - a.ssim || 1);
      return a.bytes + t * (b.bytes - a.bytes);
    }
  }
  return pts[pts.length - 1].bytes;
}

const rows = [];
let i = 0;
const totalUnits = masters.length * HEIC_QUALITIES.length;
for (const file of masters) {
  const name = path.parse(file).name;
  const master = path.join(CORPUS, file);
  const meta = await sharp(master).metadata();
  const px = meta.width * meta.height;

  // Reference master as PNG for SSIM.
  const refPng = path.join(WORK, `${name}.master.png`);
  await sharp(master).png({ compressionLevel: 6 }).toFile(refPng);

  for (const hq of HEIC_QUALITIES) {
    // 1. master -> HEIC (the "phone" file) at this quality.
    const heic = path.join(WORK, `${name}.q${hq}.heic`);
    sh('heif-enc', ['-q', String(hq), '--no-thumbnails', master, '-o', heic]);
    const heicBytes = bytes(heic);

    // 2. HEIC -> PNG (decode; also the lossless "heic to png" output).
    const heicPng = path.join(WORK, `${name}.q${hq}.fromheic.png`);
    sh('heif-convert', [heic, heicPng]);
    const pngBytes = bytes(heicPng);
    const heicSsim = ssim(refPng, heicPng);

    // 3. HEIC(decoded) -> JPG across the quality ladder.
    const jpg = {};
    for (const q of JPG_QUALITIES) {
      const out = path.join(WORK, `${name}.q${hq}.j${q}.jpg`);
      await sharp(heicPng).jpeg({ quality: q, mozjpeg: true }).toFile(out);
      const outPng = path.join(WORK, `${name}.q${hq}.j${q}.png`);
      await sharp(out).png().toFile(outPng);
      jpg[q] = { bytes: bytes(out), ssim: ssim(refPng, outPng) };
    }
    // Matched-quality JPG: the JPG size at the HEIC's own SSIM.
    const jpgMatchedBytes = jpgBytesAtSsim(jpg, heicSsim);

    rows.push({ name, px, heicQ: hq, heicBytes, pngBytes, heicSsim, jpgMatchedBytes, jpg });
    process.stdout.write(
      `\r  ${++i}/${totalUnits}  ${name} hq${hq}  heic ${(heicBytes / 1024).toFixed(0)}KB  matchedJPG ${(jpgMatchedBytes / 1024).toFixed(0)}KB  png ${(pngBytes / 1024).toFixed(0)}KB   `,
    );
  }
}
console.log('\n');

// ---- write per-image CSV ----
const header = [
  'image',
  'pixels',
  'heic_q',
  'heic_bytes',
  'heic_ssim',
  'png_bytes',
  'jpg_matched_bytes',
  ...JPG_QUALITIES.flatMap((q) => [`jpg${q}_bytes`, `jpg${q}_ssim`]),
];
const lines = rows.map((r) =>
  [
    r.name,
    r.px,
    r.heicQ,
    r.heicBytes,
    r.heicSsim?.toFixed(5) ?? '',
    r.pngBytes,
    Math.round(r.jpgMatchedBytes),
    ...JPG_QUALITIES.flatMap((q) => [r.jpg[q].bytes, r.jpg[q].ssim?.toFixed(5) ?? '']),
  ].join(','),
);
fs.writeFileSync(OUT, [header.join(','), ...lines].join('\n'));
console.log(
  `✓ ${rows.length} rows (${masters.length} imgs × ${HEIC_QUALITIES.length} HEIC q) → ${path.relative(ROOT, OUT)}`,
);

// ---- aggregate to stdout, per HEIC quality (full analysis in analyze script) ----
const pct = (a, b) => (((a - b) / b) * 100).toFixed(1);
const mult = (a, b) => (a / b).toFixed(2);
console.log('\nPer HEIC quality — totals across corpus (matched perceptual quality):');
for (const hq of HEIC_QUALITIES) {
  const rs = rows.filter((r) => r.heicQ === hq);
  const sum = (f) => rs.reduce((a, r) => a + f(r), 0);
  const tH = sum((r) => r.heicBytes);
  const tM = sum((r) => r.jpgMatchedBytes);
  const tP = sum((r) => r.pngBytes);
  const meanH = sum((r) => r.heicSsim) / rs.length;
  console.log(
    `  HEIC q${hq} (SSIM ${meanH.toFixed(3)}): HEIC ${(tH / 1e6).toFixed(2)}MB · matched JPG ${(tM / 1e6).toFixed(2)}MB (${mult(tM, tH)}× / +${pct(tM, tH)}%) · PNG ${(tP / 1e6).toFixed(2)}MB (${mult(tP, tH)}× / +${pct(tP, tH)}%)`,
  );
}
