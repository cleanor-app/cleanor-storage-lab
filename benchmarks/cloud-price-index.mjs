#!/usr/bin/env node
// "Cloud Storage Price Index 2026" — compute $/GB and the long-run "storage rent".
// Prices are US consumer list prices (2026-07); Apple/Microsoft/Box/Backblaze
// officially confirmed, others standard US list (flagged in the study method).
// Writes data/cloud-price-index.csv.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// provider, tier_gb, monthly_usd, annual_usd(or null), bundled(Office/apps), verified
const PLANS = [
  ['Apple iCloud+', 50, 0.99, null, false, true],
  ['Apple iCloud+', 200, 2.99, null, false, true],
  ['Apple iCloud+', 2000, 9.99, null, false, true],
  ['Apple iCloud+', 6000, 29.99, null, false, true],
  ['Apple iCloud+', 12000, 59.99, null, false, true],
  ['Google One', 100, 1.99, 19.99, false, false],
  ['Google One', 200, 2.99, 29.99, false, false],
  ['Google One', 2000, 9.99, 99.99, false, false],
  ['Google One', 5000, 24.99, 249.99, false, false],
  ['Microsoft 365', 100, 1.99, 19.99, false, true],
  ['Microsoft 365', 1000, 9.99, 99.99, true, true],
  ['Microsoft 365', 6000, 12.99, 129.99, true, true],
  ['Dropbox', 2000, 11.99, 119.88, false, false],
  ['Dropbox', 3000, 19.99, 199.0, false, false],
  ['Amazon', 100, 1.99, 19.99, false, false],
  ['Amazon', 1000, 6.99, 59.99, false, false],
  ['Amazon', 2000, 11.99, 119.98, false, false],
  ['Proton Drive', 200, 4.99, 47.88, false, false],
  ['Box', 100, 10.0, 120.0, false, true],
];
// one-time lifetime plans (pCloud) and unlimited (Backblaze) handled separately
const LIFETIME = [
  ['pCloud (lifetime)', 500, 199],
  ['pCloud (lifetime)', 2000, 399],
];
const UNLIMITED = [['Backblaze Personal', '9/mo, 99/yr, unlimited per computer']];

const rows = [
  [
    'provider',
    'tier_gb',
    'monthly_usd',
    'annual_usd',
    'usd_per_gb_month',
    'ten_year_usd',
    'bundled',
    'verified',
  ],
];
for (const [p, gb, mo, yr, bundled, ver] of PLANS) {
  const perGb = (mo / gb).toFixed(4);
  const cheapestYear = yr != null ? yr : mo * 12;
  const tenYear = (cheapestYear * 10).toFixed(0);
  rows.push([
    p,
    gb,
    mo.toFixed(2),
    yr != null ? yr.toFixed(2) : '',
    perGb,
    tenYear,
    bundled ? 'yes' : 'no',
    ver ? 'yes' : 'list',
  ]);
}
fs.writeFileSync(
  path.join(ROOT, 'data/cloud-price-index.csv'),
  rows.map((r) => r.join(',')).join('\n'),
);

const at2tb = PLANS.filter((p) => p[1] === 2000).map(([p, gb, mo, yr]) => ({
  p,
  perGb: mo / gb,
  mo,
  ten: (yr ?? mo * 12) * 10,
}));
console.log('Price index at the 2 TB tier ($/GB/month):');
at2tb
  .sort((a, b) => a.perGb - b.perGb)
  .forEach((x) =>
    console.log(
      `  ${x.p.padEnd(16)} $${x.perGb.toFixed(4)}/GB   $${x.mo}/mo   10yr $${x.ten.toFixed(0)}`,
    ),
  );

// small-tier penalty (iCloud)
const ic50 = 0.99 / 50,
  ic2t = 9.99 / 2000;
console.log(
  `\nSmall-tier penalty: iCloud 50 GB = $${ic50.toFixed(4)}/GB vs 2 TB = $${ic2t.toFixed(4)}/GB  (${(ic50 / ic2t).toFixed(1)}x more per GB)`,
);
console.log('\n10-year cost of 2 TB (cheapest billing):');
console.log(`  iCloud+ (monthly only): $${(9.99 * 120).toFixed(0)}`);
console.log(`  Google One (annual):    $${(99.99 * 10).toFixed(0)}`);
console.log(`  Dropbox (annual):       $${(119.88 * 10).toFixed(0)}`);
console.log(`  pCloud (lifetime buy):  $399 once`);
console.log(`  Backblaze (unlimited):  $${(99 * 10).toFixed(0)} (unlimited, per computer)`);
console.log(`\n  pCloud lifetime payback vs iCloud: ${(399 / (9.99 * 12)).toFixed(1)} years`);
console.log('\n✓ data/cloud-price-index.csv');
