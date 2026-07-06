#!/usr/bin/env node
// "The True Cost of a Photo" — storage capacity model.
// Combines documented, sourced per-item sizes with an advertised->usable
// storage correction to compute how many photos / how much video actually fit
// in each iPhone storage tier. Writes data/photo-storage-capacity.csv.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// Advertised tier -> approximate AVAILABLE storage the user sees, out of the box.
// Advertised GB is decimal (1 GB = 1e9 bytes); binary formatting keeps ~93.1%,
// then iOS + preinstalled apps take ~8-14 GB. Representative real-world figures.
const TIERS = [
  { adv: 64, usableGB: 50 },
  { adv: 128, usableGB: 112 },
  { adv: 256, usableGB: 228 },
  { adv: 512, usableGB: 466 },
];

// Per-item sizes (MB). Sources: Apple ProRAW/ProRes support pages (25/75 MB, 6 GB/min);
// iPhone in-app video-size figures (HEVC); HEIC/JPEG/HEIF from converging 2026 reports.
const PHOTOS = [
  { key: 'HEIC 12 MP', mb: 3, note: 'iPhone default (High Efficiency)' },
  { key: 'JPEG 12 MP', mb: 5, note: 'Most Compatible' },
  { key: 'HEIF 48 MP', mb: 25, note: 'ProRes/48 MP HEIF Max' },
  { key: 'ProRAW 48 MP', mb: 75, note: 'Apple: ~75 MB' },
];
const VIDEO = [
  { key: '1080p 30fps', mbmin: 60 },
  { key: '4K 30fps', mbmin: 170 },
  { key: '4K 60fps', mbmin: 400 },
  { key: 'ProRes 4K', mbmin: 6000 },
];

const rows = [];
console.log('PHOTOS that fit (count):');
console.log('  format          ' + TIERS.map((t) => `${t.adv}GB`.padStart(9)).join(''));
for (const p of PHOTOS) {
  const counts = TIERS.map((t) => Math.round((t.usableGB * 1000) / p.mb));
  console.log(
    '  ' + p.key.padEnd(15) + counts.map((c) => c.toLocaleString('en-US').padStart(9)).join(''),
  );
  TIERS.forEach((t, i) =>
    rows.push({
      kind: 'photos',
      item: p.key,
      size_mb: p.mb,
      tier_gb: t.adv,
      usable_gb: t.usableGB,
      capacity: counts[i],
      unit: 'photos',
    }),
  );
}
console.log('\nVIDEO that fits (minutes):');
console.log('  format          ' + TIERS.map((t) => `${t.adv}GB`.padStart(9)).join(''));
for (const v of VIDEO) {
  const mins = TIERS.map((t) => (t.usableGB * 1000) / v.mbmin);
  const disp = mins
    .map((m) => (m >= 90 ? (m / 60).toFixed(1) + 'h' : m.toFixed(0) + 'm').padStart(9))
    .join('');
  console.log('  ' + v.key.padEnd(15) + disp);
  TIERS.forEach((t, i) =>
    rows.push({
      kind: 'video',
      item: v.key,
      size_mb: v.mbmin + '/min',
      tier_gb: t.adv,
      usable_gb: t.usableGB,
      capacity: Math.round(mins[i]),
      unit: 'minutes',
    }),
  );
}

// headline spreads (128 GB)
const t128 = TIERS.find((t) => t.adv === 128).usableGB * 1000;
const heic = Math.round(t128 / 3),
  proraw = Math.round(t128 / 75);
console.log(
  `\n128 GB spread: HEIC ${heic.toLocaleString()} vs ProRAW ${proraw.toLocaleString()} photos = ${(heic / proraw).toFixed(0)}x`,
);
console.log(
  `128 GB video: 4K60 ${(t128 / 400 / 60).toFixed(1)}h vs ProRes 4K ${(t128 / 6000).toFixed(0)} min`,
);

const head = 'kind,item,item_size_mb,tier_advertised_gb,tier_usable_gb,capacity,unit';
fs.writeFileSync(
  path.join(ROOT, 'data/photo-storage-capacity.csv'),
  [
    head,
    ...rows.map(
      (r) => `${r.kind},${r.item},${r.size_mb},${r.tier_gb},${r.usable_gb},${r.capacity},${r.unit}`,
    ),
  ].join('\n'),
);
console.log('\n✓ data/photo-storage-capacity.csv');
