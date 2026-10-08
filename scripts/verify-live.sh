#!/bin/bash
# Compares what the live site serves with the local files, by checksum.
# Read-only. Exit code 0 only if every file is identical.
#
# Use: bash scripts/verify-live.sh [base-url]
#   after a deployment it must end with 0; right before one it must end with 1
#   (the live site still serves the previous release) -- that is the proof
#   that this check can fail at all.
#
# The content of js/config.js is never printed, only compared.

set -u

BASE="${1:-https://cybermobbing.web.app}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 2

sum() { shasum -a 256 | cut -d' ' -f1; }

FILES=$(
  {
    echo index.html
    find css js assets -type f ! -name '.*'
    for f in llms.txt robots.txt sitemap.xml; do [ -f "$f" ] && echo "$f"; done
  } | sort
)

total=0
bad=0
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

while IFS= read -r f; do
  [ -n "$f" ] || continue
  total=$((total + 1))
  code=$(curl -s -o "$TMP" -w '%{http_code}' "$BASE/$f")
  if [ "$code" != "200" ]; then
    echo "MISSING   $f (HTTP $code)"
    bad=$((bad + 1))
    continue
  fi
  if [ "$(sum < "$TMP")" = "$(sum < "$f")" ]; then
    echo "same      $f"
  else
    echo "DIFFERENT $f"
    bad=$((bad + 1))
  fi
done <<EOF_FILES
$FILES
EOF_FILES

stamp=$(curl -s "$BASE/index.html" | grep -o '?v=[0-9]*' | sort -u | tr '\n' ' ')
echo "live cache stamp: ${stamp:-none found}"
echo "local cache stamp: $(grep -o '?v=[0-9]*' index.html | sort -u | tr '\n' ' ')"

if [ "$total" -eq 0 ]; then
  echo "RESULT: no files compared -- the check itself failed"
  exit 2
fi
if [ "$bad" -eq 0 ]; then
  echo "RESULT: live site serves this state ($total of $total files identical)"
  exit 0
fi
echo "RESULT: live site differs ($bad of $total files)"
exit 1
