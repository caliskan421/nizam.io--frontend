#!/usr/bin/env bash
# e2e ilk yönetici aracının (nizamio-e2e-bootstrap) hiçbir üretim çıktısına girmediğinin
# denetimi (CX-Ö-03):
#   dist   — frontend yayın paketi (dist/) aracın adını/kaynağını içermez.
#   image  — etiketten üretilen backend çalışma imajında /usr/local/bin yalnız server,
#            migrate, setup'tır; araç ikilisi yoktur.
set -euo pipefail
root="$(cd "$(dirname "$0")/../.." && pwd)"

case "${1:-}" in
  dist)
    test -d "$root/dist" || { echo "HATA: dist/ yok (önce pnpm build)" >&2; exit 1; }
    if grep -rIl -e 'e2e-bootstrap' -e 'FakeControlPlaneAdaptor' -e 'IssueActivationCode' "$root/dist"; then
      echo "HATA: e2e ilk yönetici aracı izi frontend yayın paketinde" >&2
      exit 1
    fi
    echo "dist/: e2e aracı izi yok"
    ;;
  image)
    tag="$(node -p "require('$root/api-pin.json').backendTag")"
    image="nizamio-web-e2e/backend:$tag"
    name="nizamio_web_e2e-isocheck"
    docker rm -f "$name" >/dev/null 2>&1 || true
    docker create --name "$name" "$image" >/dev/null
    trap 'docker rm -f "$name" >/dev/null 2>&1 || true' EXIT
    bins="$(docker export "$name" | tar -t | sed -nE 's#^usr/local/bin/([^/]+)$#\1#p' | sort | tr '\n' ' ')"
    echo "backend imajı /usr/local/bin: $bins"
    if docker export "$name" | tar -t | grep -q 'e2e-bootstrap'; then
      echo "HATA: e2e aracı backend çalışma imajında" >&2
      exit 1
    fi
    [[ "$bins" == "migrate server setup " ]] || { echo "HATA: beklenmeyen ikili kümesi" >&2; exit 1; }
    ;;
  *)
    echo "kullanım: $0 dist|image" >&2
    exit 2
    ;;
esac
