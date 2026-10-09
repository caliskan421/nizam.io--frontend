#!/usr/bin/env bash
# e2e ilk yönetici yolunun hiçbir üretim çıktısına sızmadığının denetimi (CX-Ö-03; F15 K8):
#   dist   — frontend yayın paketi (dist/) sahte merkez / test aktivasyonu izi içermez
#            (eski geçici aracın adı dahil).
#   image  — etiketten üretilen backend çalışma imajında /usr/local/bin yalnız server,
#            migrate, setup'tır; e2e'ye özel ek ikili yoktur. İlk yönetici artık bu imajın
#            kendi `setup --test-activation`'ıyla kurulur (yalnız test + fake adaptörde kabul).
set -euo pipefail
root="$(cd "$(dirname "$0")/../.." && pwd)"

case "${1:-}" in
  dist)
    test -d "$root/dist" || { echo "HATA: dist/ yok (önce pnpm build)" >&2; exit 1; }
    if grep -rIl -e 'e2e-bootstrap' -e 'FakeControlPlane' -e 'IssueActivationCode' -e 'test-activation' "$root/dist"; then
      echo "HATA: e2e ilk yönetici yolu izi frontend yayın paketinde" >&2
      exit 1
    fi
    echo "dist/: e2e ilk yönetici yolu izi yok"
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
    [[ "$bins" == "migrate server setup " ]] || { echo "HATA: beklenmeyen ikili kümesi" >&2; exit 1; }
    ;;
  *)
    echo "kullanım: $0 dist|image" >&2
    exit 2
    ;;
esac
