#!/bin/bash
# Downloads app icons for the simulation.
# These icons are trademarks of their respective owners and are used
# for educational purposes only (§42f UrhG / Zitatrecht).
#
# WARNING: The Apple mzstatic URLs below were valid at initial release
# but Apple rotates these tokens without notice. If the CDN returns
# JSON error payloads or redirects, this script will fail loudly
# instead of silently writing garbage into assets/icons/.
#
# If a fork hits a failure here, either:
#   1. Look up the current App Store icon URL for the app in question
#      and update the ICONS table below, or
#   2. Ship replacement icons directly in assets/icons/ and remove
#      this script from the setup step.

set -e

ICON_DIR="assets/icons"
mkdir -p "$ICON_DIR"

# name|url
ICONS=$(cat <<'EOF'
whatsapp|https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/44/0e/f1/440ef192-4011-5a42-8b09-d8a21e1a0963/AppIcon-0-0-1x_U007emarketing-0-7-0-85-220.png/246x0w.webp
instagram|https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/96/08/a2/9608a24d-1e37-5209-e445-45490adce130/Prod-0-0-1x_U007emarketing-0-7-0-85-220.png/246x0w.webp
tiktok|https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/4b/41/bf/4b41bff5-2e09-9271-dadd-56f859b1ba7e/AppIcon_TikTok-0-0-1x_U007epad-0-0-0-85-220.png/246x0w.webp
messages|https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/b0/90/17/b09017e0-f78a-9c3e-5e4c-eee48acb4fda/AppIcon-messagesApp-0-0-1x_U007emarketing-0-7-0-85-220.png/246x0w.webp
snapchat|https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/cf/70/41/cf7041ff-9a32-4e07-ad0d-a4dfed25b535/AppIcon-0-0-1x_U007emarketing-0-7-0-85-220.png/246x0w.webp
EOF
)

MIN_BYTES=2000   # real icons are ~30-80 KB; anything under 2 KB is an error payload

echo "Downloading app icons..."

failures=0
while IFS='|' read -r name url; do
  [ -z "$name" ] && continue
  out="$ICON_DIR/$name.png"
  http_status=$(curl -sSL -w '%{http_code}' -o "$out" "$url" || echo "000")
  ctype=$(file -b --mime-type "$out")
  size=$(wc -c < "$out" | tr -d ' ')

  if [ "$http_status" != "200" ] || [ "$ctype" != "image/webp" ] || [ "$size" -lt "$MIN_BYTES" ]; then
    echo "ERROR: $name failed validation" >&2
    echo "  http:  $http_status" >&2
    echo "  type:  $ctype (expected image/webp)" >&2
    echo "  size:  $size bytes (min $MIN_BYTES)" >&2
    rm -f "$out"
    failures=$((failures + 1))
  else
    echo "  $name OK  ($size bytes)"
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
