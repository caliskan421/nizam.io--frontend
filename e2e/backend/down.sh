#!/usr/bin/env bash
# up.sh'in açtığı kaynakları ADIYLA kapatır (paylaşılan makine kuralı).
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=names.sh
source "$here/names.sh"
docker rm -f "$server_name" "$short_server_name" >/dev/null 2>&1 || true
if [[ "${NIZAMIO_E2E_MODE:-local}" != "ci" ]]; then
  docker compose -p "$project" -f "$here/compose.yaml" down -v
fi
