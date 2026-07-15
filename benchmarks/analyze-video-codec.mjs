#!/usr/bin/env node
// Cleanor Storage Lab — Study A3 analysis.
//
// Turns the long video-codec-benchmark.csv (a quality ladder per codec) into the matched-SSIM
// answer: at the SAME visual quality, how many kbps does each codec need, and how much smaller
// is it than MPEG-4 ASP (Xvid/DivX) and than H.264. Bytes are interpolated at fixed SSIM
// targets on a log(kbps)-vs-SSIM curve, then averaged across clips by geometric mean.
//
//   node analyze-video-codec.mjs [--in data/video-codec-benchmark.csv]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const IN = path.resolve(ROOT, opt('--in', 'data/video-codec-benchmark.csv'));
const OUT = path.resolve(ROOT, opt('--out', 'data/video-codec-summary.csv'));

const TARGETS = [0.95, 0.97, 0.99];
const ORDER = ['mpeg4', 'h264', 'h265', 'vp9', 'av1'];
const LABELS = {
  mpeg4: 'MPEG-4 ASP (Xvid/DivX)', h264: 'H.264', h265: 'HEVC', vp9: 'VP9', av1: 'AV1',
};

const lines = fs.readFileSync(IN, 'utf8').trim().split('\n');
const head = lines[0].split(',');
const idx = (c) => head.indexOf(c);
// codec_label is quoted and contains a comma, so split carefully: only the label field is quoted.
function parse(line) {
  const out = []; let cur = ''; let q = false;
  for (const ch of line) {
    if (ch === '"') q = !q;
    else if (ch === ',' && !q) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}
const rows = lines.slice(1).map(parse).map((r) => ({
  clip: r[idx('clip')], codec: r[idx('codec')],
  ssim: +r[idx('ssim')], kbps: +r[idx('kbps')],
})).filter((r) => Number.isFinite(r.ssim) && Number.isFinite(r.kbps));

const clips = [...new Set(rows.map((r) => r.clip))];

// Interpolate kbps at a target SSIM on the log(kbps)-vs-SSIM curve for one (clip, codec).
function kbpsAt(points, target) {
  const pts = points.slice().sort((a, b) => a.ssim - b.ssim);
  if (target < pts[0].ssim || target > pts[pts.length - 1].ssim) return null; // no extrapolation
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    if (target >= a.ssim && target <= b.ssim) {
      const t = (target - a.ssim) / (b.ssim - a.ssim || 1);
      const logk = Math.log(a.kbps) + t * (Math.log(b.kbps) - Math.log(a.kbps));
      return Math.exp(logk);
    }
  }
  return null;
}

const geomean = (xs) => (xs.length ? Math.exp(xs.reduce((a, x) => a + Math.log(x), 0) / xs.length) : null);

// Per (clip, codec, target) interpolated kbps. A clip counts toward a target ONLY if ALL five
// codecs bracket that SSIM on that clip — otherwise the geomean at that target would compare
// different codecs over different clip subsets, which is not a fair comparison. This is why the
// quality ladders are wide: each codec has to reach the common band on every clip.
const rowsOut = [['clip', 'codec', 'codec_label', 'target_ssim', 'kbps']];
const byCodecTarget = {}; // codec -> target -> [kbps per clip]
const coverage = {}; // target -> [clips with full coverage]
for (const T of TARGETS) {
  for (const clip of clips) {
    const k = {};
    let full = true;
    for (const codec of ORDER) {
      const pts = rows.filter((r) => r.clip === clip && r.codec === codec);
      const v = pts.length ? kbpsAt(pts, T) : null;
      if (v == null) { full = false; break; }
      k[codec] = v;
    }
    if (!full) continue;
    (coverage[T] ??= []).push(clip);
    for (const codec of ORDER) {
      rowsOut.push([clip, codec, `"${LABELS[codec]}"`, T, k[codec].toFixed(1)]);
      ((byCodecTarget[codec] ??= {})[T] ??= []).push(k[codec]);
    }
  }
}
fs.writeFileSync(OUT, rowsOut.map((r) => r.join(',')).join('\n') + '\n');

// Headline: geomean kbps per codec at each target + savings vs Xvid and H.264.
console.log(`Matched-SSIM video codec efficiency (geomean of ${clips.length} clips, kbps at equal SSIM)\n`);
for (const T of TARGETS) {
  const g = {};
  for (const codec of ORDER) g[codec] = geomean(byCodecTarget[codec]?.[T] || []);
  const xvid = g.mpeg4, h264 = g.h264;
  const n = (coverage[T] || []).length;
  console.log(`  SSIM ${T}  (${n}/${clips.length} clips with full codec coverage):`);
  if (!n) { console.log('    (no clip brackets this target on all codecs — widen the ladders)\n'); continue; }
  for (const codec of ORDER) {
    if (!g[codec]) { console.log(`    ${LABELS[codec].padEnd(24)} (out of range)`); continue; }
    const vX = xvid ? (1 - g[codec] / xvid) * 100 : NaN;
    const vH = h264 ? (1 - g[codec] / h264) * 100 : NaN;
    console.log(
      `    ${LABELS[codec].padEnd(24)} ${g[codec].toFixed(0).padStart(6)} kbps` +
      `   vs Xvid ${(vX >= 0 ? '-' : '+') + Math.abs(vX).toFixed(0)}%` +
      `   vs H.264 ${(vH >= 0 ? '-' : '+') + Math.abs(vH).toFixed(0)}%`,
    );
  }
  console.log();
}
console.log(`✓ summary → ${path.relative(ROOT, OUT)}`);
