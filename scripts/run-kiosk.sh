#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$project_dir"

if [[ ! -f dist/server.cjs || ! -f dist/index.html ]]; then
  echo "No existe el build. Ejecuta primero: npm run install:linux" >&2
  exit 1
fi

browser=""
for candidate in chromium chromium-browser google-chrome; do
  if command -v "$candidate" >/dev/null 2>&1; then
    browser="$(command -v "$candidate")"
    break
  fi
done

if [[ -z "$browser" ]]; then
  echo "No se encontró Chromium/Chrome. Instálalo con el gestor de paquetes de tu Debian." >&2
  exit 1
fi

port="${PORT:-3000}"
url="http://127.0.0.1:${port}"
if curl --silent --fail "${url}/api/health" >/dev/null; then
  echo "Ya hay un servidor Photobooth respondiendo en ${url}." >&2
  exit 1
fi

PORT="$port" NODE_ENV=production node dist/server.cjs &
server_pid=$!
cleanup() {
  kill "$server_pid" 2>/dev/null || true
  wait "$server_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

ready=0
for _ in {1..30}; do
  if ! kill -0 "$server_pid" 2>/dev/null; then
    echo "El servidor terminó antes de iniciar el kiosco." >&2
    exit 1
  fi
  if curl --silent --fail "${url}/api/health" >/dev/null; then
    ready=1
    break
  fi
  sleep 1
done

if (( ! ready )); then
  echo "El servidor no respondió en ${url} dentro de 30 segundos." >&2
  exit 1
fi

"$browser" --kiosk --no-first-run --disable-infobars \
  --autoplay-policy=no-user-gesture-required "$url"