#!/usr/bin/env bash
# Web statik imajının denetimi. CI `image` işi ve yerel prova kullanır.
#
#   deploy/check-image.sh <imaj> [host-portu]
#
# İmaj üretimdekiyle aynı kısıtlarla koşturulur: salt okunur kök (yalnız /tmp tmpfs), kök
# olmayan kullanıcı, bütün yetenekler düşük, no-new-privileges. Denetlenen: süreç kimliği,
# SPA belgesi ve fallback (200), istek başı CSP nonce'u başlıkta ve <meta>'da AYNI ve her
# istekte farklı, 'unsafe-inline'/'unsafe-eval' yok, belge no-store, parmak izli varlık uzun
# önbellekli ve şablonlanmamış, eksik varlık 404, imajda kaynak/bağımlılık/.env yok.
# Dokunulan kaynak adıyla: konteyner nizamio-web-imagecheck. Toplu docker müdahalesi YOKTUR.
set -euo pipefail

image="${1:?imaj gerekli}"
port="${2:-18490}"
name="nizamio-web-imagecheck"
base="http://127.0.0.1:$port"
fail() { echo "HATA: $*" >&2; exit 1; }

docker rm -f "$name" >/dev/null 2>&1 || true
trap 'docker rm -f "$name" >/dev/null 2>&1 || true' EXIT
docker run -d --name "$name" --read-only --tmpfs /tmp:size=16m,mode=1777 \
  --cap-drop ALL --security-opt no-new-privileges -p "127.0.0.1:$port:8080" "$image" >/dev/null

for _ in $(seq 1 30); do
  curl -fsS -o /dev/null "$base/" 2>/dev/null && break
  sleep 1
done

uid="$(docker exec "$name" id -u)"
[[ "$uid" != "0" ]] || fail "süreç root olarak koşuyor"
echo "süreç kimliği: uid=$uid (root değil); kök dosya sistemi salt okunur"

doc() { # yol → başlıklar ve gövde ayrı dosyalara
  curl -fsS -D "$tmp/h" -o "$tmp/b" "$base$1"
}
tmp="$(mktemp -d)"
trap 'docker rm -f "$name" >/dev/null 2>&1 || true; rm -rf "$tmp"' EXIT

check_doc() {
  local path="$1" csp nonce meta
  doc "$path"
  grep -qi '^HTTP/1.1 200' "$tmp/h" || fail "$path 200 değil"
  csp="$(grep -i '^content-security-policy:' "$tmp/h" | tr -d '\r')"
  [[ -n "$csp" ]] || fail "$path CSP yok"
  [[ "$csp" != *unsafe-inline* && "$csp" != *unsafe-eval* ]] || fail "$path CSP unsafe-* içeriyor"
  nonce="$(sed -nE "s/.*'nonce-([^']+)'.*/\1/p" <<<"$csp")"
  meta="$(sed -nE 's/.*<meta name="csp-nonce" content="([^"]*)".*/\1/p' "$tmp/b")"
  [[ -n "$nonce" && "$nonce" == "$meta" ]] || fail "$path nonce başlık ($nonce) ile meta ($meta) aynı değil"
  grep -qi '^cache-control: no-store' "$tmp/h" || fail "$path belge no-store değil"
  for h in 'x-content-type-options: nosniff' 'referrer-policy: no-referrer'; do
    grep -qi "^$h" "$tmp/h" || fail "$path başlık eksik: $h"
  done
  grep -qi '^server:' "$tmp/h" && fail "$path Server başlığı sızıyor"
  echo "$nonce"
}

n1="$(check_doc /)"
n2="$(check_doc /herhangi/bir/istemci/rotasi)"
[[ "$n1" != "$n2" ]] || fail "nonce istekler arasında aynı"
echo "SPA belgesi ve fallback: 200; nonce başlık = meta, istek başı farklı"

asset="$(sed -nE 's#.*src="(/assets/[^"]+\.js)".*#\1#p' "$tmp/b" | head -1)"
[[ -n "$asset" ]] || fail "belgede varlık yolu bulunamadı"
curl -fsS -D "$tmp/ah" -o "$tmp/ab" "$base$asset"
grep -qi '^cache-control: public, max-age=31536000, immutable' "$tmp/ah" || fail "varlık uzun önbellekli değil"
grep -qi '^content-security-policy:' "$tmp/ah" && fail "varlık yanıtı belge CSP'si taşıyor (şablonlanmış olabilir)"
code="$(curl -s -o /dev/null -w '%{http_code}' "$base/assets/olmayan-dosya.js")"
[[ "$code" == "404" ]] || fail "eksik varlık $code döndü (404 beklenir)"
echo "varlık: $asset uzun önbellekli, şablonlanmamış; eksik varlık 404"

listing="$(docker export "$name" | tar -t)"
if grep -E '(^|/)(node_modules|\.git)/|(^|/)\.env|(^|/)src/main\.ts$|pnpm-lock\.yaml$' <<<"$listing"; then
  fail "imajda kaynak/bağımlılık/.env izi var"
fi
echo "imaj içeriği: kaynak, node_modules, .env yok"
echo "web imajı denetimi: GEÇTİ ($image)"
