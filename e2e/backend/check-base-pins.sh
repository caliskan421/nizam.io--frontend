#!/usr/bin/env bash
# Taban imaj pini denetimi (CX-Ö-04).
#   check-base-pins.sh <imaj> <runtime-taban-etiketi> [<buildkit-günlüğü> <golang-etiketi> <golang-digest>]
# 1) <imaj>'ın RootFS katmanları <runtime-taban>'ın (pinli, yerel etiketli) katmanlarıyla başlar.
# 2) Günlük verilirse: BuildKit'in golang aşaması için çözdüğü FROM satırı pinli digest'i taşır.
set -euo pipefail
image="$1" base="$2"
layers() { docker image inspect -f '{{range .RootFS.Layers}}{{println .}}{{end}}' "$1" | sed '/^$/d'; }
base_layers="$(layers "$base")"
n="$(printf '%s\n' "$base_layers" | wc -l | tr -d ' ')"
image_prefix="$(layers "$image" | head -n "$n")"
if [[ "$base_layers" != "$image_prefix" ]]; then
  echo "HATA: $image çalışma tabanı pinli $base değil" >&2
  exit 1
fi
echo "taban denetimi: $image ilk $n katmanı = pinli $base ($(docker image inspect -f '{{index .RepoDigests 0}}' "$base"))"

if [[ $# -ge 5 ]]; then
  log="$3" golang_tag="$4" golang_digest="$5"
  from_line="$(grep -E "FROM docker.io/library/${golang_tag}" "$log" | head -n 1 || true)"
  echo "buildkit golang FROM: ${from_line:-<yok>}"
  if [[ "$from_line" != *"$golang_digest"* ]]; then
    # Yerel etiket kullanıldığında BuildKit FROM satırına digest yazmayabilir; o durumda
    # yerel etiketin pinli içerikle aynı imaj olduğu doğrulanır.
    local_id="$(docker image inspect -f '{{.Id}}' "$golang_tag")"
    pinned_id="$(docker image inspect -f '{{.Id}}' "${golang_tag%:*}@$golang_digest")"
    if [[ "$local_id" != "$pinned_id" ]]; then
      echo "HATA: $golang_tag yerel etiketi pinli digest'le aynı imaj değil" >&2
      exit 1
    fi
    if grep -qiE "resolve docker.io/library/${golang_tag}@sha256:" "$log" &&
      ! grep -qE "$golang_digest" "$log"; then
      echo "HATA: BuildKit golang tabanını uzaktan farklı digest'e çözdü" >&2
      exit 1
    fi
    echo "golang yerel etiketi = pinli imaj ($local_id)"
  fi
fi
