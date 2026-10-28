#!/usr/bin/env bash
set -euo pipefail

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Falta Node.js y/o npm. Instala Node.js 20 o superior y vuelve a ejecutar este script." >&2
  exit 1
fi

node_major="$(node -p 'Number(process.versions.node.split(".")[0])')"
if (( node_major < 20 )); then
  echo "Se requiere Node.js 20 o superior; versión detectada: $(node --version)." >&2
  exit 1
fi

if [[ ! -f package-lock.json ]]; then
  echo "No se encontró package-lock.json. Ejecuta este script desde la raíz del proyecto." >&2
  exit 1
fi

npm ci
npm run build

cat <<'EOF'

Build Linux listo.
Instala Chromium si aún no está disponible y ejecuta: npm run kiosk
EOF