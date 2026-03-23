#!/bin/sh
# BharatLink CLI Installer
# Usage: curl -fsSL https://rohitsainier.github.io/pages/bharatlink/install.sh | sh

set -e

REPO="rohitsainier/terminal"
BINARY="bharatlink"

# ─── Detect OS & Arch ───
OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Darwin)  PLATFORM="apple-darwin" ;;
  Linux)   PLATFORM="unknown-linux-gnu" ;;
  MINGW*|MSYS*|CYGWIN*) PLATFORM="pc-windows-msvc" ;;
  *) echo "❌ Unsupported OS: $OS"; exit 1 ;;
esac

case "$ARCH" in
  x86_64|amd64)   ARCH="x86_64" ;;
  arm64|aarch64)   ARCH="aarch64" ;;
  *) echo "❌ Unsupported architecture: $ARCH"; exit 1 ;;
esac

TARGET="${ARCH}-${PLATFORM}"

# ─── Get latest release ───
echo "🔗 BharatLink CLI Installer"
echo "   Detecting system: ${OS} ${ARCH}"
echo ""

LATEST=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" 2>/dev/null | grep '"tag_name"' | sed -E 's/.*"tag_name": *"([^"]+)".*/\1/' || echo "")

if [ -z "$LATEST" ]; then
  echo "⚠️  Could not fetch latest release from GitHub."
  echo ""
  echo "   Install via Cargo instead:"
  echo "   cargo install bharatlink"
  echo ""
  exit 1
fi

echo "   Latest release: ${LATEST}"

# ─── Download ───
DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${LATEST}/${BINARY}-${TARGET}.tar.gz"
TMPDIR=$(mktemp -d)
TARBALL="${TMPDIR}/${BINARY}.tar.gz"

echo "   Downloading ${BINARY}-${TARGET}..."
if ! curl -fsSL "$DOWNLOAD_URL" -o "$TARBALL" 2>/dev/null; then
  echo "❌ Download failed."
  echo "   URL: ${DOWNLOAD_URL}"
  echo ""
  echo "   Binary may not be available for ${TARGET} yet."
  echo "   Install via Cargo instead:"
  echo "   cargo install bharatlink"
  echo ""
  rm -rf "$TMPDIR"
  exit 1
fi

# ─── Extract ───
tar -xzf "$TARBALL" -C "$TMPDIR"

# ─── Install ───
INSTALL_DIR="/usr/local/bin"
if [ ! -w "$INSTALL_DIR" ]; then
  INSTALL_DIR="$HOME/.local/bin"
  mkdir -p "$INSTALL_DIR"
fi

mv "${TMPDIR}/${BINARY}" "${INSTALL_DIR}/${BINARY}"
chmod +x "${INSTALL_DIR}/${BINARY}"

# ─── Cleanup ───
rm -rf "$TMPDIR"

# ─── Verify ───
echo ""
echo "   ✅ Installed to ${INSTALL_DIR}/${BINARY}"
echo ""

if command -v "$BINARY" >/dev/null 2>&1; then
  echo "   Version: $($BINARY --version)"
else
  echo "   ⚠️  ${INSTALL_DIR} is not in your PATH."
  echo "   Add it:"
  echo "   export PATH=\"${INSTALL_DIR}:\$PATH\""
fi

echo ""
echo "   Get started:"
echo "   bharatlink start          # Start P2P node"
echo "   bharatlink --help         # Show all commands"
echo ""
echo "   📦 crates.io:  https://crates.io/crates/bharatlink"
echo "   🔗 GitHub:     https://github.com/${REPO}"
echo ""
