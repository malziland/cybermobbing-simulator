#!/bin/bash
# Replaces all ?v=XXXX cache-bust strings in index.html with the current Unix timestamp.
# Run automatically before deploy via: npm run deploy
# Portable across BSD (macOS) and GNU (Linux/CI) sed.

set -e

STAMP=$(date +%s)
TARGET="$(dirname "$0")/../index.html"
TMP="$(mktemp)"
sed "s/?v=[0-9]*/?v=$STAMP/g" "$TARGET" > "$TMP"
mv "$TMP" "$TARGET"
echo "Cache-bust updated to ?v=$STAMP"
