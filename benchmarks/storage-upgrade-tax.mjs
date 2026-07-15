#!/usr/bin/env node
// The storage upgrade tax: what device makers charge to add storage, versus what the flash
// actually costs. For each storage step on popular devices, the upcharge per extra GB and the
// markup over the wholesale cost of NAND flash.
//
// Prices are US LIST prices, a snapshot on the measured date (they change) — so each row is
// stamped. The markup story is robust even if a single price drifts; the point is the order of
// magnitude, not a to-the-dollar quote.
//
//   data/storage-upgrade-tax.csv
//   node storage-upgrade-tax.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'data', 'storage-upgrade-tax.csv');
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const MEASURED = '2026-07';
// Wholesale/retail cost of consumer NAND flash per GB in 2026 (~$60/TB retail TLC NVMe / UFS).
// The upcharge is compared to this; it is a reference point, not a claim about any maker's BOM.
const FLASH_PER_GB = 0.06;

// [device, category, year, from_gb, to_gb, upcharge_usd] — US list prices, well-documented and
// stable for Apple (whose storage pricing is the famous case). from/to are advertised capacities.
const STEPS = [
  ['iPhone 16', 'phone', 2024, 128, 256, 100],
  ['iPhone 16', 'phone', 2024, 256, 512, 200],
  ['iPhone 16 Pro', 'phone', 2024, 256, 512, 200],
  ['iPhone 16 Pro', 'phone', 2024, 512, 1024, 200],
  ['iPad Pro M4', 'tablet', 2024, 256, 512, 200],
  ['iPad Pro M4', 'tablet', 2024, 512, 1024, 400],
  ['iPad Pro M4', 'tablet', 2024, 1024, 2048, 400],
  ['MacBook Air M3', 'laptop', 2024, 256, 512, 200],
  ['MacBook Air M3', 'laptop', 2024, 512, 1024, 200],
  ['MacBook Air M3', 'laptop', 2024, 1024, 2048, 400],
  ['MacBook Pro 14 M4', 'laptop', 2024, 512, 1024, 200],
  ['MacBook Pro 14 M4', 'laptop', 2024, 1024, 2048, 400],
  ['MacBook Pro 14 M4', 'laptop', 2024, 2048, 4096, 600],
  ['MacBook Pro 14 M4', 'laptop', 2024, 4096, 8192, 1200],
  ['Mac mini M4', 'desktop', 2024, 256, 512, 200],
  ['Mac mini M4', 'desktop', 2024, 512, 1024, 400],
];

const q = (v) => { const s = String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const rows = [['device', 'category', 'year', 'from_gb', 'to_gb', 'extra_gb', 'upcharge_usd', 'upcharge_per_gb', 'flash_ref_per_gb', 'markup_vs_flash_x', 'measured_date']];
for (const [device, cat, year, from, to, upcharge] of STEPS) {
  const extra = to - from;
  const perGb = upcharge / extra;
  rows.push([device, cat, year, from, to, extra, upcharge, perGb.toFixed(3), FLASH_PER_GB, (perGb / FLASH_PER_GB).toFixed(1), MEASURED]);
}
fs.writeFileSync(OUT, rows.map((r) => r.map(q).join(',')).join('\n') + '\n');

const perGbs = rows.slice(1).map((r) => Number(r[7]));
const markups = rows.slice(1).map((r) => Number(r[9]));
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
console.log(`Storage upgrade tax (US list, ${MEASURED}), vs $${FLASH_PER_GB}/GB flash:`);
console.log(`  upcharge per extra GB: $${Math.min(...perGbs).toFixed(2)}–$${Math.max(...perGbs).toFixed(2)} (mean $${mean(perGbs).toFixed(2)})`);
console.log(`  markup over flash: ${Math.min(...markups).toFixed(0)}x–${Math.max(...markups).toFixed(0)}x (mean ${mean(markups).toFixed(0)}x)`);
console.log(`✓ ${rows.length - 1} steps → ${path.relative(ROOT, OUT)}`);
