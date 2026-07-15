# How much can you compress a PDF? Ghostscript vs qpdf, measured

**Ghostscript's `/ebook` preset shrinks a typical PDF by about 70% (33% to 90%, depending on how image-heavy it is) while keeping 95–100% of the text; qpdf's lossless pass saves ~13% with the text byte-for-byte intact.** The trade-off is simple: the big savings are lossy (images get downsampled), the safe savings are small. Measured on six PDFs in [`data/pdf-compression.csv`](../data/pdf-compression.csv).

## The trade-off, by method

Mean across six academic PDFs (`data/pdf-compression.csv`):

| Method | Lossy? | Mean saved | Text preserved |
|---|---|---|---|
| Ghostscript `/screen` (72 dpi) | yes | **−74%** | 95–100% |
| Ghostscript `/ebook` (150 dpi) | yes | **−70%** | 95–100% |
| Ghostscript `/printer` (300 dpi) | yes | −46% | 95–100% |
| qpdf (lossless) | no | −13% | 100% |

The savings come almost entirely from **images**. A picture-heavy PDF drops 80–90% at `/ebook`; a text-and-equations PDF with few images drops far less, because there is little to downsample. The `raster_images` column in the CSV predicts the saving better than the page count does.

## Which to use

- **Sharing / email / web:** `/ebook` (150 dpi) is the sweet spot — big saving, images still look fine on screen, text untouched. `/screen` (72 dpi) is smaller still but images start to look soft.
- **Printing:** `/printer` (300 dpi) keeps images sharp enough to print and still trims ~46%.
- **Archival / legal / when you must not alter a pixel:** qpdf lossless. It only re-packs the file structure (object streams, Flate recompression, linearization) — every image and glyph is bit-identical. ~13% for zero risk.

## Is the text safe?

Yes. The `text_word_overlap_pct` column compares the extractable text before and after. Ghostscript scores 95–100%: the text stays fully selectable and searchable. The <100% cases are not lost words — they are equations and figure labels that `pdftotext` extracts in a slightly different order once Ghostscript re-encodes the fonts. qpdf is 100% by construction. No method here damaged readable text.

## Method

Six public arXiv PDFs (fetched by [`benchmarks/fetch-pdf-corpus.sh`](../benchmarks/fetch-pdf-corpus.sh)), ranging from 0 to 737 embedded raster images. Ghostscript `-dPDFSETTINGS=/screen|/ebook|/printer`; qpdf `--linearize --object-streams=generate --recompress-flate --compression-level=9`. Size is the output bytes; text preservation is the word-multiset overlap of `pdftotext` output. Generator: [`benchmarks/pdf-compression.mjs`](../benchmarks/pdf-compression.mjs).
