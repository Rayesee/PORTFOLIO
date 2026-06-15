#!/bin/zsh
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p assets/opt

for i in $(seq 1 14); do
  src="assets/slide${i}.png"
  out="assets/opt/slide${i}.jpg"
  if [[ -f "$src" ]]; then
    sips -Z 1280 -s format jpeg -s formatOptions 78 "$src" --out "$out" >/dev/null
    echo "optimized slide${i}.jpg"
  fi
done

du -sh assets/opt
