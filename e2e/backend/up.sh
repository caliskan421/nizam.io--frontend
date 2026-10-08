#!/usr/bin/env bash
# Web e2e için gerçek backend'i ayağa kaldırır — kaynak YALNIZ api-pin.json'daki etiket.
#
# Sıra (backend README "Binary yüzeyleri ve kurulum sırası"): imaj (etiketin build/Dockerfile'ı)
# → yönetici bağlantısıyla migrations/roles.sql → migrator kimliğiyle `migrate up` → roles.sql
# tekrar → ilk yönetici (nizamio-e2e-bootstrap; bkz. bootstrap/main.go başlığı) → uygulama
# kimliğiyle server.
#
# Kip (NIZAMIO_E2E_MODE):
#   local (varsayılan) — Postgres `nizamio_web_e2e` Compose projesinde (127.0.0.1:15432),
#                        server 127.0.0.1:18080'e yayımlanır.
#   ci                 — Postgres GitHub Actions servis konteyneri (127.0.0.1:5432),
#                        konteynerler --network host.
# Dokunulan kaynaklar adıyla: Compose projesi nizamio_web_e2e, konteyner
# nizamio_web_e2e-server, imajlar nizamio-web-e2e/*. Toplu docker müdahalesi YOKTUR.
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
root="$(cd "$here/../.." && pwd)"
mode="${NIZAMIO_E2E_MODE:-local}"
backend_dir="${NIZAMIO_BACKEND_DIR:-$root/../nizam.io--backend}"
case "$backend_dir" in /*) ;; *) backend_dir="$root/$backend_dir" ;; esac
state="$root/e2e/.state"
server_port="${NIZAMIO_E2E_SERVER_PORT:-18080}"
server_name="nizamio_web_e2e-server"
project="nizamio_web_e2e"
db_name="nizamio_e2e"
admin_email="${NIZAMIO_E2E_ADMIN_EMAIL:-yonetici@e2e.nizamio.test}"
# Yalnız atılabilir e2e veritabanına ait sabit test parolası (sır değildir).
admin_password="${NIZAMIO_E2E_ADMIN_PASSWORD:-E2e-Yonetici-Parola-2026}"

tag="$(node -p "require('$root/api-pin.json').backendTag")"
git -C "$backend_dir" rev-parse --verify "refs/tags/$tag^{commit}" >/dev/null

echo "== backend kaynağı: $tag (etiketten, çalışma ağacı değil)"
rm -rf "$state/src"
mkdir -p "$state/src"
git -C "$backend_dir" archive "refs/tags/$tag" | tar -x -C "$state/src"
mkdir -p "$state/src/cmd/nizamio-e2e-bootstrap"
cp "$here/bootstrap/main.go" "$state/src/cmd/nizamio-e2e-bootstrap/main.go"
go_version="$(sed -nE 's/^go ([0-9]+\.[0-9]+).*/\1/p' "$state/src/go.mod")"

image="nizamio-web-e2e/backend:$tag"
bootstrap_image="nizamio-web-e2e/bootstrap:$tag"
echo "== imaj: $image (etiketin build/Dockerfile'ı, Go $go_version)"
docker build -q --build-arg "GO_VERSION=$go_version" -f "$state/src/build/Dockerfile" -t "$image" "$state/src"
docker build -q --build-arg "GO_VERSION=$go_version" -f "$here/bootstrap.Dockerfile" -t "$bootstrap_image" "$state/src"

if [[ "$mode" == "ci" ]]; then
  net=(--network host)
  db_host="127.0.0.1"
  publish=()
  listen="127.0.0.1:$server_port"
else
  docker compose -p "$project" -f "$here/compose.yaml" up -d --wait
  net=(--network "${project}_default")
  db_host="db"
  publish=(-p "127.0.0.1:$server_port:8080")
  listen="0.0.0.0:8080"
fi
admin_url="postgres://postgres:postgres@$db_host:5432/$db_name?sslmode=disable"
psql_run() { docker run --rm -i "${net[@]}" postgres:16 psql "$admin_url" -X -q -v ON_ERROR_STOP=1 "$@"; }

migrator_role="${db_name}_migrator"
app_role="${db_name}_app"
role_password="$(openssl rand -hex 24)"
echo "== roller: $migrator_role / $app_role"
psql_run -v "migrator_role=$migrator_role" -v "app_role=$app_role" -v "db_name=$db_name" -f - \
  <"$state/src/migrations/roles.sql"
psql_run -v "migrator_role=$migrator_role" -v "app_role=$app_role" -v "role_password=$role_password" <<'SQL'
ALTER ROLE :"migrator_role" PASSWORD :'role_password';
ALTER ROLE :"app_role" PASSWORD :'role_password';
SQL
migrator_url="postgres://$migrator_role:$role_password@$db_host:5432/$db_name?sslmode=disable"
app_url="postgres://$app_role:$role_password@$db_host:5432/$db_name?sslmode=disable"

env_file="$state/backend.env"
umask 077
cat >"$env_file" <<ENV
NIZAMIO_ENV=test
NIZAMIO_CONFIG_SCHEMA_VERSION=1
NIZAMIO_PRODUCT_VERSION=0.0.0-web-e2e
NIZAMIO_INSTANCE_ID=web-e2e
NIZAMIO_INSTANCE_TIMEZONE=Europe/Istanbul
NIZAMIO_TOKEN_SIGNING_SECRET=$(openssl rand -hex 32)
NIZAMIO_SESSION_TTL=15m
NIZAMIO_HTTP_LISTEN_ADDR=$listen
NIZAMIO_STORAGE_LOCAL_ROOT=/tmp/nizamio-storage
NIZAMIO_CONTROL_PLANE_ADAPTER=fake
NIZAMIO_OUTBOX_MAX_ATTEMPTS=3
NIZAMIO_OUTBOX_RETRY_BACKOFF=1s
NIZAMIO_LOGIN_MAX_FAILURES=10
NIZAMIO_LOGIN_FAILURE_WINDOW=24h
NIZAMIO_LOGIN_LOCK_DURATION=1m
NIZAMIO_LOGIN_ATTEMPT_RETENTION=48h
NIZAMIO_LOGIN_ATTEMPT_CLEANUP_INTERVAL=1m
NIZAMIO_DISCOVERY_RATE_LIMIT_PER_MINUTE=60
ENV

echo "== migrate up (migrator kimliği; yedek kontrolü: atılabilir e2e DB için 'migrate verify')"
docker run --rm "${net[@]}" --env-file "$env_file" -e "NIZAMIO_DATABASE_URL=$migrator_url" \
  --entrypoint /usr/local/bin/migrate "$image" "--backup-check-cmd=/usr/local/bin/migrate verify" up
psql_run -v "migrator_role=$migrator_role" -v "app_role=$app_role" -v "db_name=$db_name" -f - \
  <"$state/src/migrations/roles.sql"

echo "== ilk yönetici: $admin_email"
printf '%s\n' "$admin_password" | docker run --rm -i "${net[@]}" --env-file "$env_file" \
  -e "NIZAMIO_DATABASE_URL=$app_url" "$bootstrap_image" \
  --admin-email "$admin_email" --company-name "NIZAM.IO Web E2E"

echo "== server: $server_name → 127.0.0.1:$server_port"
docker rm -f "$server_name" >/dev/null 2>&1 || true
docker run -d --name "$server_name" "${net[@]}" "${publish[@]}" --env-file "$env_file" \
  -e "NIZAMIO_DATABASE_URL=$app_url" "$image" >/dev/null

for _ in $(seq 1 60); do
  if [[ "$(docker inspect -f '{{.State.Running}}' "$server_name" 2>/dev/null)" != "true" ]]; then
    break
  fi
  if curl -fsS "http://127.0.0.1:$server_port/healthz/ready" >/dev/null 2>&1; then
    echo "== backend hazır: http://127.0.0.1:$server_port"
    exit 0
  fi
  sleep 1
done
echo "HATA: backend hazır olmadı" >&2
docker logs "$server_name" >&2 || true
exit 1
