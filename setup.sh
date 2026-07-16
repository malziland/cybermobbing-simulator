#!/bin/bash
# Downloads app icons for the simulation.
# These icons are trademarks of their respective owners and are used
# for educational purposes only (§42f UrhG / Zitatrecht).
#
# Icon URLs are resolved at runtime via the official iTunes Lookup API
# (stable), because raw mzstatic CDN URLs rotate without notice --
# hardcoded tokens broke every fresh clone within months (found during
# the 2026-07 rollback probe, see docs/RUNBOOK.md).
#
# Requires: curl, python3 (JSON parsing), file
#
# If a fork hits a failure here, either:
#   1. Check whether the bundle IDs below still exist in the App Store, or
#   2. Ship replacement icons directly in assets/icons/ and remove
#      this script from the setup step.

set -e

ICON_DIR="assets/icons"
mkdir -p "$ICON_DIR"

# name|app-store-bundle-id
ICONS=$(cat <<'EOF'
whatsapp|net.whatsapp.WhatsApp
instagram|com.burbn.instagram
tiktok|com.zhiliaoapp.musically
messages|com.apple.MobileSMS
snapchat|com.toyopagroup.picaboo
EOF
)

MIN_BYTES=2000   # real icons are ~30-80 KB; anything under 2 KB is an error payload

echo "Downloading app icons..."

failures=0
while IFS='|' read -r name bundle; do
  [ -z "$name" ] && continue
  out="$ICON_DIR/$name.png"

  url=$(curl -sf "https://itunes.apple.com/lookup?bundleId=$bundle&country=us" \
    | python3 -c 'import sys,json;r=json.load(sys.stdin).get("results",[]);print(r[0].get("artworkUrl512","") if r else "")' \
    || echo "")
  if [ -z "$url" ]; then
    echo "ERROR: $name: iTunes lookup for $bundle returned no artwork URL" >&2
    failures=$((failures + 1))
    continue
  fi

  http_status=$(curl -sSL -w '%{http_code}' -o "$out" "$url" || echo "000")
  ctype=$(file -b --mime-type "$out")
  size=$(wc -c < "$out" | tr -d ' ')

  case "$ctype" in
    image/png|image/jpeg|image/webp) type_ok=1 ;;
    *) type_ok=0 ;;
  esac

  if [ "$http_status" != "200" ] || [ "$type_ok" != "1" ] || [ "$size" -lt "$MIN_BYTES" ]; then
    echo "ERROR: $name failed validation" >&2
    echo "  http:  $http_status" >&2
    echo "  type:  $ctype (expected png/jpeg/webp)" >&2
    echo "  size:  $size bytes (min $MIN_BYTES)" >&2
    rm -f "$out"
    failures=$((failures + 1))
  else
    echo "  $name OK  ($size bytes, $ctype)"
  fi
done <<< "$ICONS"

if [ "$failures" -gt 0 ]; then
  echo "" >&2
  echo "Setup failed: $failures icon(s) could not be downloaded." >&2
  echo "See header comment in setup.sh for how to recover." >&2
  exit 1
fi

echo ""
echo "Done! Icons saved to $ICON_DIR/"
echo "NOTE: These icons are trademarks of their respective owners."
echo "They are included for educational use only."
