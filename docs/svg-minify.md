# How much does SVGO shrink an SVG? It depends on the SVG

**On already-published SVGs, SVGO removes about 5% from a clean icon and ~16% from a detailed emoji — but gzip, which is how the file actually travels, is the bigger lever: it brings both to roughly 40–50% of the original.** Measured on 21 SVGs in [`data/svg-minify.csv`](../data/svg-minify.csv). Raw design-tool exports (with editor metadata) save far more from SVGO; these files were already reasonably tight.

## The spread

Mean per category (`data/svg-minify.csv`):

| Source | SVGO minify | Then gzip → % of original |
|---|---|---|
| Clean icons (simple-icons) | **4.7%** smaller | 51% |
| Detailed emoji (twemoji, openmoji) | **15.9%** smaller | 40% |

## What to take from it

- **Gzip/Brotli does more than minification for SVGs that are already clean.** SVG is text, and text compresses well; a well-authored icon has little redundant markup for SVGO to strip, but gzip still halves it on the wire. Make sure your server compresses `image/svg+xml` — that is the ~50% win, free.
- **SVGO earns its keep on messy SVGs.** The savings here are modest because simple-icons and the emoji sets are already hand-tightened. An SVG exported straight from Illustrator or Inkscape carries editor metadata, comments, and 6-decimal coordinates that SVGO can cut 50–80% — this corpus just does not contain those, and the dataset says so rather than pretending.
- **Do both.** Minify at build time (SVGO), then serve gzipped/brotlied. The `minified_gzip_bytes` column is the real over-the-wire size.

## Method

21 SVGs — 9 clean single-path icons (simple-icons, CC0) and 12 detailed multi-path emoji (twemoji CC BY 4.0, openmoji CC BY-SA) — optimized with SVGO (`multipass`), then the minified output gzipped at level 9. Sizes are bytes. Corpus fetched by [`benchmarks/fetch-svg-corpus.sh`](../benchmarks/fetch-svg-corpus.sh); generator [`benchmarks/svg-minify.mjs`](../benchmarks/svg-minify.mjs). Swap in your own SVGs to see your real savings.
