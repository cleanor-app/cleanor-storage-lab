# Contributing to Storage Lab

Thanks for helping build open, reproducible datasets on image compression and
storage. Contributions of all sizes are welcome.

## Ways to contribute

- **Re-run a benchmark on your own corpus** and report the numbers, or open a PR
  with a new dataset row. Every benchmark in `benchmarks/` is a single script.
- **Add a format or codec** to the compression benchmarks (for example a new
  JPEG XL encoder setting).
- **Correct a data point or methodology.** Open a `data correction` issue with
  your reasoning and source.
- **Add an analysis.** Notebooks or scripts that read the CSVs in `data/` and
  produce charts or findings.
- **Improve the harness or docs.**

## Development

```bash
npm install                # installs sharp
npm run compression        # image compression benchmark (JPEG/WebP/AVIF)
npm run heic-tax           # HEIC to JPG/PNG size tax
npm run nextgen            # next-gen formats (JPEG XL)
npm run cloud-price        # cloud storage price index
npm run photo-capacity     # phone storage capacity
node benchmarks/render-charts.mjs   # regenerate docs/charts from the CSVs
```

Image benchmarks need an input corpus of your own images; see the README for the
expected layout. The derived CSVs are what we publish and cite.

## Rules of the road

- **Document your corpus.** A benchmark number is only meaningful with its inputs
  described (count, source, resolution). Note them in the PR.
- **Match perceptual quality, not just file size.** Compression comparisons use
  SSIM against a lossless master; keep that discipline.
- **Cite your sources** for any external figure (cloud prices, specs).

## AI usage

We use AI assistants to help write code and prose here, and disclose that in the
accompanying paper. If you use AI to prepare a contribution, please make sure you
have reviewed and understand what you submit.

By contributing you agree that code is licensed under MIT and data under
CC BY 4.0.
