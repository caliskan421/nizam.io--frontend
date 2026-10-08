#!/usr/bin/env bash
# Taban imaj pini denetimi (CX-Ö-04, CX-r2-Ö-01). Yerel daemon'da genel etiket OKUMAZ/YAZMAZ;
# pinli distroless katmanları registry'den (yalnız okuma) alınır.
#   check-base-pins.sh <imaj> <distroless-ref@sha256> <dockerfile> [<buildkit-günlüğü> <golang-ref@sha256>]
# 1) <dockerfile>'daki bütün FROM satırları digest'lidir.
# 2) Günlük verilirse: BuildKit golang ve distroless'i tam olarak pinli referanslarla çözmüştür.
# 3) <imaj>'ın RootFS katmanları pinli distroless'in (registry config'indeki) diff_id'leriyle başlar.
set -euo pipefail
image="$1" distroless_ref="$2" dockerfile="$3"

unpinned="$(grep -E '^FROM ' "$dockerfile" | grep -v '@sha256:' || true)"
if [[ -n "$unpinned" ]]; then
  echo "HATA: digest'siz FROM: $unpinned" >&2
  exit 1
fi
echo "FROM satırları ($dockerfile):"
grep -E '^FROM ' "$dockerfile" | sed 's/^/  /'

if [[ $# -ge 5 ]]; then
  log="$4" golang_ref="$5"
  echo "buildkit çözümleme satırları:"
  grep -E 'resolve (docker\.io|gcr\.io)|\[(build|runtime) 1/[0-9]+\] FROM' "$log" | sed 's/^/  /'
  for ref in "docker.io/library/$golang_ref" "$distroless_ref"; do
    if ! grep -qF "FROM $ref" "$log"; then
      echo "HATA: BuildKit günlüğünde pinli FROM yok: $ref" >&2
      exit 1
    fi
  done
fi

# Pinli distroless'in diff_id'leri (registry, anonim okuma).
repo_path="${distroless_ref#gcr.io/}"; repo_path="${repo_path%%:*}"
digest="${distroless_ref##*@}"
arch="$(docker image inspect -f '{{.Architecture}}' "$image")"
accept='application/vnd.oci.image.index.v1+json, application/vnd.docker.distribution.manifest.list.v2+json, application/vnd.oci.image.manifest.v1+json, application/vnd.docker.distribution.manifest.v2+json'
index="$(curl -fsSL -H "Accept: $accept" "https://gcr.io/v2/$repo_path/manifests/$digest")"
manifest_digest="$(printf '%s' "$index" | python3 -c '
import json, sys
d = json.load(sys.stdin); arch = sys.argv[1]
ms = d.get("manifests")
if ms is None: print(sys.argv[2]); sys.exit()
print(next(m["digest"] for m in ms if m["platform"]["os"] == "linux" and m["platform"]["architecture"] == arch))
' "$arch" "$digest")"
config_digest="$(curl -fsSL -H "Accept: $accept" "https://gcr.io/v2/$repo_path/manifests/$manifest_digest" |
  python3 -c 'import json,sys; print(json.load(sys.stdin)["config"]["digest"])')"
base_layers="$(curl -fsSL "https://gcr.io/v2/$repo_path/blobs/$config_digest" |
  python3 -c 'import json,sys; print("\n".join(json.load(sys.stdin)["rootfs"]["diff_ids"]))')"
n="$(printf '%s\n' "$base_layers" | wc -l | tr -d ' ')"
image_prefix="$(docker image inspect -f '{{range .RootFS.Layers}}{{println .}}{{end}}' "$image" | sed '/^$/d' | head -n "$n")"
if [[ "$base_layers" != "$image_prefix" ]]; then
  echo "HATA: $image çalışma tabanı pinli distroless değil" >&2
  exit 1
fi
echo "taban denetimi: $image ilk $n katmanı = $distroless_ref ($arch, config $config_digest)"
