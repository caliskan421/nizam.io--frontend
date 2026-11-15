# up.sh / down.sh / check-isolation.sh ortak adlandırma (source edilir; çalıştırılmaz).
# Paylaşılan makinede paralel çalışmalar çakışmasın diye hepsi env ile geçersiz kılınabilir;
# VARSAYILANLAR eskisiyle aynıdır (CI değişmez).
#
#   NIZAMIO_E2E_PROJECT          Compose projesi + konteyner öneki (küçük harf/rakam/_/-). Varsayılan nizamio_web_e2e.
#   NIZAMIO_E2E_IMAGE_REPO       Backend imaj deposu adı. Varsayılan: proje varsayılansa nizamio-web-e2e/backend,
#                                değilse <proje>/backend.
#   NIZAMIO_E2E_PORT_SERVER      Normal server host portu (varsayılan 18080; eski ad NIZAMIO_E2E_SERVER_PORT).
#   NIZAMIO_E2E_PORT_SHORT       Kısa ömürlü server host portu (varsayılan 18081; eski ad NIZAMIO_E2E_SHORT_SERVER_PORT).
#   NIZAMIO_E2E_PORT_PG          Yerel Postgres host portu (varsayılan 15432; eski ad NIZAMIO_E2E_PG_PORT).
default_project="nizamio_web_e2e"
project="${NIZAMIO_E2E_PROJECT:-$default_project}"
if [[ ! "$project" =~ ^[a-z0-9][a-z0-9_-]*$ ]]; then
  echo "HATA: NIZAMIO_E2E_PROJECT küçük harf/rakam/_/- olmalı: $project" >&2
  exit 1
fi
if [[ "$project" == "$default_project" ]]; then
  image_repo="${NIZAMIO_E2E_IMAGE_REPO:-nizamio-web-e2e/backend}"
else
  image_repo="${NIZAMIO_E2E_IMAGE_REPO:-$project/backend}"
fi
server_name="${project}-server"
short_server_name="${project}-server-shortttl"
isocheck_name="${project}-isocheck"
server_port="${NIZAMIO_E2E_PORT_SERVER:-${NIZAMIO_E2E_SERVER_PORT:-18080}}"
short_server_port="${NIZAMIO_E2E_PORT_SHORT:-${NIZAMIO_E2E_SHORT_SERVER_PORT:-18081}}"
export NIZAMIO_E2E_PG_PORT="${NIZAMIO_E2E_PORT_PG:-${NIZAMIO_E2E_PG_PORT:-15432}}"
