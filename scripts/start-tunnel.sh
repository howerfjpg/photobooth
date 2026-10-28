#!/usr/bin/env bash
set -euo pipefail

# Script para exponer el kiosco a internet público de forma GRATIS usando Cloudflare Tunnel.
# Requisitos: tener instalado cloudflared (https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/)
# Uso: ./scripts/start-tunnel.sh

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

if ! command -v cloudflared &> /dev/null; then
  echo "ERROR: cloudflared no está instalado."
  echo "Instálalo gratis desde: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/"
  exit 1
fi

# Levanta el servidor en segundo puerto
npm run build > /dev/null 2>&1 || true
NODE_ENV=production PORT=3000 node dist/server.cjs &
SERVER_PID=$!

cleanup() {
  echo "Deteniendo servidor y túnel..."
  kill "$SERVER_PID" 2>/dev/null || true
  kill "$TUNNEL_PID" 2>/dev/null || true
}
trap cleanup EXIT

# Espera a que el servidor esté listo
echo "Esperando a que el servidor liste en http://localhost:3000..."
for i in $(seq 1 30); do
  if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "Servidor listo."
    break
  fi
  sleep 1
done

# Levanta cloudflared y captura la URL pública
echo "Levantando túnel público gratuito con Cloudflare..."
cloudflared tunnel --url http://localhost:3000 2>&1 | tee /tmp/cf-tunnel.log &
TUNNEL_PID=$!

# Extrae la URL pública de trycloudflare.com que imprime cloudflared
PUBLIC_URL=""
for i in $(seq 1 30); do
  PUBLIC_URL=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' /tmp/cf-tunnel.log 2>/dev/null | head -1 || true)
  if [ -n "$PUBLIC_URL" ]; then
    break
  fi
  sleep 1
done

if [ -z "$PUBLIC_URL" ]; then
  echo "No se pudo obtener la URL pública de Cloudflare. Revisa /tmp/cf-tunnel.log"
  wait
  exit 1
fi

echo ""
echo "=============================================="
echo "TÚNEL PÚBLICO ACTIVO:"
echo "  $PUBLIC_URL"
echo ""
echo "Pega esta URL en el Panel Admin del kiosco:"
echo "  Configuración > IP de Red o Dominio Público para QR"
echo "=============================================="
echo ""
echo "Presiona Ctrl+C para detener todo."

wait
