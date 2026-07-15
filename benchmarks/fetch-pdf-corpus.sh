#!/usr/bin/env bash
# Fetch the PDF corpus (public arXiv papers, varying image density). Not redistributed; the
# published data is our measurements.
set -uo pipefail
cd "$(dirname "$0")/.." && mkdir -p corpus-pdf && cd corpus-pdf
declare -A P=( [arxiv-transformer]=1706.03762v7 [arxiv-resnet]=1512.03385v1 [arxiv-gan]=1406.2661v1
  [arxiv-gpt3]=2005.14165v4 [arxiv-vgg]=1409.1556v6 [arxiv-bert]=1810.04805v2 )
for name in "${!P[@]}"; do
  curl -fsSL --max-time 60 -o "$name.pdf" "https://arxiv.org/pdf/${P[$name]}" || true
done
echo "PDF corpus ready — run: node benchmarks/pdf-compression.mjs"
