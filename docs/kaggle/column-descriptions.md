# Column descriptions (paste into Kaggle web column editor)

Kaggle does not reliably apply column descriptions via the API on version updates. If the dataset page shows blank columns, edit each file on kaggle.com and paste these.

## cloud-price-index.csv

- **provider** — Cloud storage provider
- **tier_gb** — Plan storage size in GB
- **monthly_usd** — Monthly price in USD
- **annual_usd** — Annual price in USD (blank if monthly-only)
- **usd_per_gb_month** — Price per GB per month in USD
- **ten_year_usd** — Cheapest 10-year cost in USD
- **bundled** — Whether Office/apps are bundled
- **verified** — "yes" if confirmed on the provider page, else "list"

## compression-benchmark-hires.csv

- **image** — Source image identifier
- **width** — Image width in pixels
- **height** — Image height in pixels
- **pixels** — Total pixels (width×height)
- **format** — Codec/format of the encoded output
- **quality** — Encoder quality setting
- **bytes** — Encoded file size in bytes
- **bpp** — Bits per pixel of the encoded output
- **ssim** — Structural similarity vs the lossless master (1.0 = identical)
- **psnr** — Peak signal-to-noise ratio in dB vs the master (higher = closer)

## compression-benchmark-summary.csv

- **metric** — Name of the summary metric
- **format** — Codec/format of the encoded output
- **quality_or_target** — Quality level or target SSIM the metric refers to
- **value** — Metric value

## compression-benchmark.csv

- **image** — Source image identifier
- **width** — Image width in pixels
- **height** — Image height in pixels
- **pixels** — Total pixels (width×height)
- **format** — Codec/format of the encoded output
- **quality** — Encoder quality setting
- **bytes** — Encoded file size in bytes
- **bpp** — Bits per pixel of the encoded output
- **ssim** — Structural similarity vs the lossless master (1.0 = identical)
- **psnr** — Peak signal-to-noise ratio in dB vs the master (higher = closer)

## heic-tax-benchmark.csv

- **image** — Source image identifier
- **pixels** — Total pixels (width×height)
- **heic_q** — iOS-like HEIC encode quality level
- **heic_bytes** — Size of the source HEIC file in bytes
- **heic_ssim** — SSIM of the HEIC vs the lossless master
- **png_bytes** — Size of the lossless PNG conversion in bytes
- **jpg_matched_bytes** — JPEG size at the quality matching the HEIC perceptually (bytes)
- **jpg80_bytes** — JPEG at quality 80: output size in bytes
- **jpg80_ssim** — SSIM vs master for JPEG at quality 80
- **jpg85_bytes** — JPEG at quality 85: output size in bytes
- **jpg85_ssim** — SSIM vs master for JPEG at quality 85
- **jpg90_bytes** — JPEG at quality 90: output size in bytes
- **jpg90_ssim** — SSIM vs master for JPEG at quality 90
- **jpg93_bytes** — JPEG at quality 93: output size in bytes
- **jpg93_ssim** — SSIM vs master for JPEG at quality 93
- **jpg95_bytes** — JPEG at quality 95: output size in bytes
- **jpg95_ssim** — SSIM vs master for JPEG at quality 95
- **jpg97_bytes** — JPEG at quality 97: output size in bytes
- **jpg97_ssim** — SSIM vs master for JPEG at quality 97
- **jpg98_bytes** — JPEG at quality 98: output size in bytes
- **jpg98_ssim** — SSIM vs master for JPEG at quality 98
- **jpg100_bytes** — JPEG at quality 100: output size in bytes
- **jpg100_ssim** — SSIM vs master for JPEG at quality 100

## heic-tax-summary.csv

- **heic_q** — iOS-like HEIC encode quality level
- **mean_ssim** — Mean SSIM of the HEIC vs master across the corpus
- **corpus_heic_mb** — Total corpus size as HEIC (MB)
- **corpus_matched_jpg_mb** — Total corpus size as matched-quality JPEG (MB)
- **corpus_png_mb** — Total corpus size as PNG (MB)
- **jpg_tax_x_median** — Median size multiplier of HEIC→JPG
- **jpg_tax_pct** — Median percent size increase of HEIC→JPG
- **png_tax_x_median** — Median size multiplier of HEIC→PNG
- **png_tax_pct** — Median percent size increase of HEIC→PNG

## nextgen-formats-benchmark.csv

- **image** — Source image identifier
- **jpeg_ssim95_bytes** — JPEG size (bytes) at SSIM 0.95
- **webp_ssim95_bytes** — WEBP size (bytes) at SSIM 0.95
- **avif_ssim95_bytes** — AVIF size (bytes) at SSIM 0.95
- **jxl_ssim95_bytes** — JXL size (bytes) at SSIM 0.95
- **jpeg_ssim98_bytes** — JPEG size (bytes) at SSIM 0.98
- **webp_ssim98_bytes** — WEBP size (bytes) at SSIM 0.98
- **avif_ssim98_bytes** — AVIF size (bytes) at SSIM 0.98
- **jxl_ssim98_bytes** — JXL size (bytes) at SSIM 0.98
- **jpeg_q90_bytes** — JPEG at quality 90 output size (bytes)
- **jxl_lossless_bytes** — JPEG XL lossless recompression of the source JPEG (bytes)

## passport-photo-specs.csv

- **country** — Country name
- **document** — Document type (passport/visa)
- **width_mm** — Photo width in mm
- **height_mm** — Photo height in mm
- **size_inches** — Photo size in inches
- **head_min_mm** — Minimum head height in mm
- **head_max_mm** — Maximum head height in mm
- **head_measure** — How head size is measured
- **background** — Required background
- **glasses** — Glasses policy
- **neutral_expression** — Neutral expression required
- **recency_months** — Max photo age in months
- **digital_notes** — Digital submission limits
- **us_monthly_searches** — US monthly search volume for this spec
- **official_source** — Official government source

## photo-storage-capacity.csv

- **kind** — Content kind (photos/video)
- **item** — Item type (e.g. HEIC 12 MP)
- **item_size_mb** — Approx size per item in MB
- **tier_advertised_gb** — Advertised storage tier in GB
- **tier_usable_gb** — Usable storage after system in GB
- **capacity** — Number of items that fit
- **unit** — Unit of the capacity value

## storage-trends-by-country.csv

- **country_code** — ISO country code
- **country** — Country name
- **geo_id** — Geo identifier
- **topic_total_monthly** — Total monthly searches for the topic
- **free up iphone storage** — Monthly search volume for the query "free up iphone storage"
- **iphone storage full** — Monthly search volume for the query "iphone storage full"
- **how to free up space on iphone** — Monthly search volume for the query "how to free up space on iphone"
- **iphone running out of storage** — Monthly search volume for the query "iphone running out of storage"
- **clear storage iphone** — Monthly search volume for the query "clear storage iphone"
- **clear cache iphone** — Monthly search volume for the query "clear cache iphone"
- **other storage iphone** — Monthly search volume for the query "other storage iphone"
- **system data iphone** — Monthly search volume for the query "system data iphone"
- **delete duplicate photos** — Monthly search volume for the query "delete duplicate photos"
- **delete duplicate photos iphone** — Monthly search volume for the query "delete duplicate photos iphone"
- **phone storage full** — Monthly search volume for the query "phone storage full"
- **free up space on phone** — Monthly search volume for the query "free up space on phone"
- **clean up storage** — Monthly search volume for the query "clean up storage"
- **best phone cleaner app** — Monthly search volume for the query "best phone cleaner app"
- **find duplicate files** — Monthly search volume for the query "find duplicate files"

## storage-trends-long.csv

- **country_code** — ISO country code
- **country** — Country name
- **query** — Search query
- **avg_monthly_searches** — Average monthly search volume
- **competition** — Advertiser competition level

## storage-trends-monthly.csv

- **country_code** — ISO country code
- **query** — Search query
- **year** — Year
- **month** — Month
- **searches** — Search volume

## streaming-data-usage.csv

- **category** — Media category (video/audio)
- **service** — Streaming service
- **tier** — Quality tier
- **per_hour_mb** — Data per hour in MB
- **per_hour_gb** — Data per hour in GB
- **status** — Source of the figure (official/measured/estimate)
