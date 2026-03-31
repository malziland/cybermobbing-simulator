#!/bin/bash
# Downloads app icons for the simulation
# These icons are trademarks of their respective owners and are used
# for educational purposes only (§42f UrhG / Zitatrecht).

set -e

ICON_DIR="assets/icons"
mkdir -p "$ICON_DIR"

echo "Downloading app icons..."

# WhatsApp (Meta)
curl -sL "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/44/0e/f1/440ef192-4011-5a42-8b09-d8a21e1a0963/AppIcon-0-0-1x_U007emarketing-0-7-0-85-220.png/246x0w.webp" -o "$ICON_DIR/whatsapp.png"

# Instagram (Meta)
curl -sL "https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/96/08/a2/9608a24d-1e37-5209-e445-45490adce130/Prod-0-0-1x_U007emarketing-0-7-0-85-220.png/246x0w.webp" -o "$ICON_DIR/instagram.png"

# TikTok (ByteDance)
curl -sL "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/4b/41/bf/4b41bff5-2e09-9271-dadd-56f859b1ba7e/AppIcon_TikTok-0-0-1x_U007epad-0-0-0-85-220.png/246x0w.webp" -o "$ICON_DIR/tiktok.png"

# Messages (Apple)
curl -sL "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/b0/90/17/b09017e0-f78a-9c3e-5e4c-eee48acb4fda/AppIcon-messagesApp-0-0-1x_U007emarketing-0-7-0-85-220.png/246x0w.webp" -o "$ICON_DIR/messages.png"

# Snapchat (Snap Inc.)
curl -sL "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/cf/70/41/cf7041ff-9a32-4e07-ad0d-a4dfed25b535/AppIcon-0-0-1x_U007emarketing-0-7-0-85-220.png/246x0w.webp" -o "$ICON_DIR/snapchat.png"

echo "Done! Icons saved to $ICON_DIR/"
echo ""
echo "NOTE: These icons are trademarks of their respective owners."
echo "They are included for educational use only."
