#!/usr/bin/env bash
# up.sh'in açtığı kaynakları ADIYLA kapatır (paylaşılan makine kuralı).
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
docker rm -f nizamio_web_e2e-server nizamio_web_e2e-server-shortttl >/dev/null 2>&1 || true
if [[ "${NIZAMIO_E2E_MODE:-local}" != "ci" ]]; then
  docker compose -p nizamio_web_e2e -f "$here/compose.yaml" down -v
fi
