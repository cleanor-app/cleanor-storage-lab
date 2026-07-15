# WOFF2 vs WOFF vs TTF: how much smaller is a web font?

**Serving a font as WOFF2 instead of TTF cuts it to about 40% of its size, and subsetting to just the Latin characters a page uses cuts it to around 11% — an ~88% saving overall — with no change to the glyphs.** Measured on five popular open-source families in [`data/font-format-weight.csv`](../data/font-format-weight.csv).

## The weights

Mean size as a percentage of the original TTF (`data/font-format-weight.csv`):

| Variant | Mean size vs TTF |
|---|---|
| TTF (install format) | 100% |
| WOFF | 53% |
| **WOFF2** (serve this) | **40%** |
| WOFF2, subset to Latin | **11.5%** |

Roboto, for example: 477 KB as TTF → 217 KB WOFF2 → **79 KB** subset to Latin.

## What to take from it

- **Serve WOFF2, always.** It uses Brotli compression and is supported by every current browser (see the [format support matrix](https://github.com/cleanor-app/developer-reference-datasets)). WOFF (the older zlib format) is a fallback you almost never need now.
- **Subsetting is the bigger lever than the format.** WOFF2 alone gets you to 40%; dropping the glyphs a page never renders gets you to ~11%. These are variable fonts carrying many weights and scripts — a Latin-only site is paying for Cyrillic, Greek and every weight axis it never uses.
- **It is lossless.** The outlines are byte-for-byte the same; only the container and the unused glyphs change.

## Method

Five Google Fonts (OFL) TTFs converted with `fontTools` (`flavor = 'woff' / 'woff2'`, Brotli) and subset with `pyftsubset --unicodes=U+0000-00FF,U+2000-206F --flavor=woff2` (Basic Latin + general punctuation). Sizes are the output bytes. Generator: [`benchmarks/font-format-weight.mjs`](../benchmarks/font-format-weight.mjs). Note several of these are variable fonts, which is why the Latin subset saving is so large; a single-weight static font would subset less dramatically.
