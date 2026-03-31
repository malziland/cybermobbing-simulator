#!/bin/bash
# Replaces all ?v=XXXX cache-bust strings in index.html with the current Unix timestamp.
# Run automatically before deploy via: npm run deploy

STAMP=$(date +%s)
sed -i '' "s/?v=[0-9]*/?v=$STAMP/g" "$(dirname "$0")/../index.html"
echo "Cache-bust updated to ?v=$STAMP"
