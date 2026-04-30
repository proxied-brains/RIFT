#!/bin/bash
# ═══════════════════════════════════════════════
#  RIFT — Fresh LXC Install Script
#  Run as root inside the LXC
# ═══════════════════════════════════════════════

set -e

echo ""
echo "▓▒░ RIFT Install Script ░▒▓"
echo ""

# ── 1. System packages ──────────────────────────
echo "[1/6] Installing system packages..."
apt update -qq && apt install -y curl git

# ── 2. Node.js 20 ───────────────────────────────
echo "[2/6] Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
echo "Node: $(node -v) | npm: $(npm -v)"

# ── 3. Clone repo ───────────────────────────────
echo "[3/6] Cloning RIFT repo..."
rm -rf /var/www/rift
git clone https://github.com/proxied-brains/RIFT.git /var/www/rift
cd /var/www/rift

# ── 4. Fix file structure ───────────────────────
echo "[4/6] Fixing file structure..."
mkdir -p public/css public/js public/uv

# Move HTML files into public if they're in root
for f in index.html proxy.html games.html tools.html chat.html settings.html login.html; do
  if [ -f "$f" ]; then
    mv "$f" public/
    echo "  Moved $f → public/"
  fi
done

# Move CSS into public/css
if [ -f "main.css" ]; then
  mv main.css public/css/main.css
  echo "  Moved main.css → public/css/"
fi

# Move JS into public/js
if [ -f "main.js" ]; then
  mv main.js public/js/main.js
  echo "  Moved main.js → public/js/"
fi

# Fix HTML references to CSS/JS if needed
for f in public/*.html; do
  sed -i 's|href="/main.css"|href="/css/main.css"|g' "$f"
  sed -i 's|src="/main.js"|src="/js/main.js"|g' "$f"
  sed -i 's|href="main.css"|href="/css/main.css"|g' "$f"
  sed -i 's|src="main.js"|src="/js/main.js"|g' "$f"
done

# ── 5. Install npm packages ─────────────────────
echo "[5/6] Installing npm packages..."
npm install
npm audit fix 2>/dev/null || true

# ── 6. Systemd service ──────────────────────────
echo "[6/6] Setting up systemd service..."
cat > /etc/systemd/system/rift.service << 'SERVICE'
[Unit]
Description=Rift
After=network.target

[Service]
WorkingDirectory=/var/www/rift
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable rift
systemctl start rift

# ── Done ─────────────────────────────────────────
sleep 2
echo ""
echo "═══════════════════════════════════"
echo " RIFT install complete!"
echo " Testing on port 8080..."
echo "═══════════════════════════════════"
curl -s http://127.0.0.1:8080 | head -3
echo ""
echo " File structure:"
find /var/www/rift/public -type f | sort
echo ""
echo " Service status:"
systemctl status rift --no-pager | head -5
