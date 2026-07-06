# Kaggle upload — Storage Lab datasets

Paste the description below into the Kaggle dataset page, or use the CLI.

## Dataset description (paste into Kaggle)

**Storage Lab: Image Compression & Cloud Storage Benchmarks**

Reproducible, original benchmarks on image compression and digital storage — with the harness that produced them, so every number can be verified or re-run on your own images.

**What's inside**
- **Image compression** (`compression-benchmark*.csv`): JPEG / WebP / AVIF encoded across a full quality ladder, scored with SSIM + PSNR against the lossless master. At matched perceptual quality (SSIM 0.95), AVIF is ~41% smaller than JPEG; WebP is *larger than JPEG* above SSIM 0.98.
- **Next-gen formats** (`nextgen-formats-benchmark.csv`): adds JPEG XL, including bit-exact lossless recompression of an existing JPEG (~20% smaller, reversible).
- **The HEIC tax** (`heic-tax-*.csv`): converting iPhone HEIC to JPG inflates files 1.75×–4.65×, and to PNG 3.87×–13.6×, at matched quality — for no visual gain.
- **Cloud storage price index** (`cloud-price-index.csv`): $/GB/month and 10-year cost across Apple, Google, Microsoft, Dropbox, Amazon, Proton, Box, pCloud, Backblaze.
- **Reference** (`streaming-data-usage.csv`, `photo-storage-capacity.csv`, `passport-photo-specs.csv`, `storage-trends-*.csv`).

**Methodology & code:** https://github.com/cleanor-app/cleanor-storage-lab
**Citable version (DOI):** https://doi.org/10.5281/zenodo.21217372
**Write-ups with charts:** https://cleanor.app/research
**License:** CC BY 4.0 (attribution to Cleanor Labs).

## Option A — Web UI
1. https://www.kaggle.com/datasets → **New Dataset**.
2. Upload every `.csv` from the repo's `data/` folder.
3. Title: *Storage Lab: Image Compression & Cloud Storage Benchmarks*; paste the description above; License: CC BY 4.0; add tags (image data, image processing, internet).
4. Create.

## Option B — Kaggle CLI
```bash
pip install kaggle                      # then put your token at ~/.kaggle/kaggle.json
mkdir -p /tmp/storage-lab-kaggle
cp data/*.csv docs/kaggle/dataset-metadata.json /tmp/storage-lab-kaggle/
# edit "id" in dataset-metadata.json → your-kaggle-username/storage-lab-image-compression-benchmarks
kaggle datasets create -p /tmp/storage-lab-kaggle --dir-mode zip
```
