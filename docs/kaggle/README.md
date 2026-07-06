# Kaggle upload — Storage Lab datasets

Kaggle **does not render SVG** (badges from shields.io/Zenodo and the repo's `docs/charts/*.svg`), and it can't resolve repo-relative paths. So don't paste the main GitHub README. Paste the block below instead: it uses **absolute PNG image URLs** (which render on Kaggle) and plain-text badges.

## Dataset description (paste into Kaggle "About this dataset")

Reproducible, original benchmarks on image compression and digital storage — with the harness that produced them, so every number can be verified or re-run on your own images.

![JPEG vs WebP vs AVIF at matched quality](https://raw.githubusercontent.com/cleanor-app/cleanor-storage-lab/main/docs/charts/compression-savings.png)

**What's inside**
- **Image compression** (`compression-benchmark*.csv`): JPEG / WebP / AVIF across a full quality ladder, scored with SSIM + PSNR against the lossless master. At matched perceptual quality (SSIM 0.95), AVIF is ~41% smaller than JPEG; WebP is *larger than JPEG* above SSIM 0.98.
- **Next-gen formats** (`nextgen-formats-benchmark.csv`): adds JPEG XL, including bit-exact lossless recompression of an existing JPEG (~20% smaller, reversible).
- **The HEIC tax** (`heic-tax-*.csv`): converting iPhone HEIC to JPG inflates files 1.75×–4.65×, and to PNG 3.87×–13.6×, at matched quality — for no visual gain.

![The HEIC tax](https://raw.githubusercontent.com/cleanor-app/cleanor-storage-lab/main/docs/charts/heic-tax.png)

- **Cloud storage price index** (`cloud-price-index.csv`): $/GB/month and 10-year cost across Apple, Google, Microsoft, Dropbox, Amazon, Proton, Box, pCloud, Backblaze.
- **Reference** (`streaming-data-usage.csv`, `photo-storage-capacity.csv`, `passport-photo-specs.csv`, `storage-trends-*.csv`).

**License:** CC BY 4.0 (attribution to Cleanor Labs).
**Methodology & code:** https://github.com/cleanor-app/cleanor-storage-lab
**Citable version (DOI):** https://doi.org/10.5281/zenodo.21217372
**Write-ups with charts:** https://cleanor.app/research

---

## Option A — Web UI
1. https://www.kaggle.com/datasets → **New Dataset**.
2. Upload every `.csv` from the repo's `data/` folder.
3. Title: *Storage Lab: Image Compression & Cloud Storage Benchmarks*; paste the description above; License: CC BY 4.0; tags: image data, image processing, internet.
4. Create.

## Option B — Kaggle CLI (id already set to cleanorlabs/…)
```bash
pip install kaggle                      # then put your token at ~/.kaggle/kaggle.json
mkdir -p /tmp/storage-lab-kaggle
cp data/*.csv docs/kaggle/dataset-metadata.json /tmp/storage-lab-kaggle/
kaggle datasets create -p /tmp/storage-lab-kaggle --dir-mode zip
```

## Why SVG breaks (and the fix)
- Kaggle sanitizes/omits SVG images, so shields.io and Zenodo badges won't show.
- Even absolute `raw.githubusercontent.com/*.svg` fails: GitHub serves SVG as `text/plain`, not an image type.
- **PNG works.** The charts above are committed as PNG in `docs/charts/` and referenced by absolute `raw.githubusercontent.com/*.png` URLs (served as `image/png`).
- Prefer brand URLs? Host the PNGs on cleanor.app (Cloudflare serves the correct content-type) and swap the two image URLs — that needs a site deploy; the GitHub-raw PNGs work today with none.
