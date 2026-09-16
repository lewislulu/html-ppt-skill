#!/usr/bin/env bash
# html-ppt :: render.sh — headless Chrome screenshot(s)
#
# Usage:
#   render.sh <html-file>                     # one PNG, slide 1
#   render.sh <html-file> <N>                 # N PNGs, slides 1..N, via #/k
#   render.sh <html-file> all                 # autodetect .slide count
#   render.sh <html-file> <N> <out-dir>       # custom output dir
#
# Requires: Google Chrome at /Applications/Google Chrome.app (macOS).

set -euo pipefail

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [[ ! -x "$CHROME" ]]; then
  echo "error: Chrome not found at $CHROME" >&2
  exit 1
fi

FILE="${1:-}"
if [[ -z "$FILE" ]]; then
  echo "usage: render.sh <html> [N|all] [out-dir]" >&2
  exit 1
fi
if [[ ! -f "$FILE" ]]; then
  echo "error: $FILE not found" >&2
  exit 1
fi

COUNT="${2:-1}"
OUT="${3:-}"

ABS="$(cd "$(dirname "$FILE")" && pwd)/$(basename "$FILE")"
STEM="$(basename "${FILE%.*}")"

# Count <section> elements whose class attribute carries "slide" as a whole
# token. A plain `class="slide"` match misses every slide with an extra class
# (slide is-active, slide dark, slide t-violet …), and a loose \bslide\b would
# also match class="slide-number".
count_slides() {
  grep -Eco '<section[^>]*class="([^"]*[[:space:]])?slide([[:space:]][^"]*)?"' "$1" || true
}

if [[ "$COUNT" == "all" ]]; then
  COUNT="$(count_slides "$FILE")"
  if [[ -z "$COUNT" || "$COUNT" -lt 1 ]]; then
    echo "warning: no <section class=\"slide\"> found in $FILE — rendering 1 page" >&2
    COUNT=1
  fi
fi

if ! [[ "$COUNT" =~ ^[0-9]+$ ]] || [[ "$COUNT" -lt 1 ]]; then
  echo "error: slide count must be a positive integer or 'all' (got: $COUNT)" >&2
  exit 1
fi

if [[ -z "$OUT" && "$COUNT" -gt 1 ]]; then
  OUT="$(dirname "$FILE")/${STEM}-png"
fi

# Chrome does not create the target directory; without this it exits 0 having
# written nothing.
if [[ -n "$OUT" ]]; then
  if [[ "$OUT" == *.png ]]; then
    mkdir -p "$(dirname "$OUT")"
  else
    mkdir -p "$OUT"
  fi
fi

render_one() {
  local url="$1" target="$2"
  "$CHROME" \
    --headless=new \
    --disable-gpu \
    --hide-scrollbars \
    --no-sandbox \
    --virtual-time-budget=4000 \
    --window-size=1920,1080 \
    --screenshot="$target" \
    "$url" >/dev/null 2>&1 || true
  # Chrome reports success even when it could not write the file, so the only
  # trustworthy signal is the file itself.
  if [[ ! -s "$target" ]]; then
    echo "  ✗ $target — not written" >&2
    return 1
  fi
  echo "  ✔ $target"
}

FAILED=0

if [[ "$COUNT" == "1" ]]; then
  if [[ -z "$OUT" ]]; then
    OUT_FILE="$(dirname "$FILE")/${STEM}.png"
  elif [[ "$OUT" == *.png ]]; then
    OUT_FILE="$OUT"
  else
    OUT_FILE="$OUT/${STEM}.png"
  fi
  render_one "file://$ABS" "$OUT_FILE" || FAILED=$((FAILED + 1))
else
  for i in $(seq 1 "$COUNT"); do
    render_one "file://$ABS#/$i" "$OUT/${STEM}_$(printf '%02d' "$i").png" \
      || FAILED=$((FAILED + 1))
  done
fi

if [[ "$FAILED" -gt 0 ]]; then
  echo "error: $FAILED of $COUNT slide(s) were not written from $FILE" >&2
  exit 1
fi

echo "done: rendered $COUNT slide(s) from $FILE"
