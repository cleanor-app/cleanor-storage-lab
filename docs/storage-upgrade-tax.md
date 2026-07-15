# The storage upgrade tax: what makers charge for a GB vs what it costs

**Apple charges about $0.78 per gigabyte to upgrade the storage on an iPhone, iPad or Mac at the base tier — roughly 13x the ~$0.06/GB that consumer NAND flash costs at retail.** Across the tiers the upcharge runs $0.29–$0.78/GB, a 5x to 13x markup. Measured from US list prices in [`data/storage-upgrade-tax.csv`](../data/storage-upgrade-tax.csv).

## The tax, by step

From [`data/storage-upgrade-tax.csv`](../data/storage-upgrade-tax.csv) (US list, 2026-07):

| Device | Step | Upcharge | Per extra GB | Markup vs flash |
|---|---|---|---|---|
| iPhone 16 | 128 → 256 GB | $100 | $0.78 | **13x** |
| iPhone 16 Pro | 256 → 512 GB | $200 | $0.78 | 13x |
| iPhone 16 Pro | 512 GB → 1 TB | $200 | $0.39 | 6.5x |
| MacBook Air M3 | 256 → 512 GB | $200 | $0.78 | 13x |
| MacBook Pro 14 | 4 TB → 8 TB | $1,200 | $0.29 | 5x |

The base-tier steps are the most expensive per GB, and they are the ones most buyers hit — the jump off the smallest storage option is where the markup is steepest.

## Why this is the "tax"

Consumer NAND flash retails around **$0.06/GB** in 2026 (a 1 TB NVMe SSD is roughly $60). The maker's cost is lower still. So a $100 upgrade that adds 128 GB is charging **$0.78/GB for something that costs a fraction of that** — the extra is margin, not silicon. It is called a tax because there is no cheaper option: you cannot add storage to a sealed phone later, so the upgrade is priced as a captive one.

This is the device-side companion to the [cloud storage price index](cloud-price-index.csv), which shows the same thing as rent: storage you pay for once at a steep markup, or forever.

## Method & honesty

- Prices are **US list prices, a snapshot on the measured date** (`measured_date` column) — they change, and the CSV says so. Verify at purchase.
- The comparison is to a **reference flash cost of $0.06/GB** (retail consumer TLC NVMe/UFS, 2026), stated as a reference point, not a claim about any maker's bill of materials. The markup is the upcharge-per-GB divided by that reference.
- Apple-heavy on purpose: its storage pricing is the well-documented, stable case and the one people search for. Android makers generally charge less per GB, but their per-device upgrade pricing is less consistent, so it is left out rather than published approximately.

Generator: [`benchmarks/storage-upgrade-tax.mjs`](../benchmarks/storage-upgrade-tax.mjs) — edit the price table and re-run to refresh or add devices.
