# NIZAM.IO web istemcisi — statik imaj.
#
# İki aşama: (1) resmî node imajında kilit dosyasıyla bağımlılık + `vite build`;
# (2) resmî caddy imajında yalnız derlenmiş dist/ ve deploy/Caddyfile. Çalışma imajında
# kaynak kod, node_modules, .env ya da herhangi bir sır YOKTUR.
#
# TABAN İMAJLAR DIGEST PİNLİ. Referans etiketsizdir (ad@sha256): paylaşılan bir Docker
# daemon'ında derleme hiçbir genel etiket (node:…, caddy:…) oluşturmaz veya değiştirmez.
# Digest'ler Docker Hub Docker-Content-Digest başlığından (çok mimarili dizin) okunmuştur;
# karşılık gelen etiket yorumdadır. Güncelleme: etiket yorumu + digest birlikte değişir.
#   node:24.21.0-alpine
ARG NODE_IMAGE=docker.io/library/node@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1
#   caddy:2.11.4-alpine
ARG CADDY_IMAGE=docker.io/library/caddy@sha256:6aeddd44c3078b0f9a35206472a11420648a79c184603ef95957d0a20044cb2b

FROM ${NODE_IMAGE} AS build
WORKDIR /src
# pnpm sürümü package.json `packageManager` alanından (corepack).
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM ${CADDY_IMAGE} AS runtime
# Resmî imajdaki ikili `cap_net_bind_service` dosya yeteneği taşır; kök olmayan kullanıcı ve
# `no-new-privileges` ile böyle bir ikili ÇALIŞTIRILAMAZ. Yetenek gerekmez (port 8080):
# ikili yeteneksiz kopyalanır (install genişletilmiş öznitelikleri taşımaz) ve asıl kaldırılır.
RUN install -m 0755 /usr/bin/caddy /usr/local/bin/caddy && rm /usr/bin/caddy
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /src/dist /srv
# Caddy'nin veri/yapılandırma dizinleri yazılabilir tek yerde (salt okunur kökte tmpfs).
ENV XDG_CONFIG_HOME=/tmp/caddy/config XDG_DATA_HOME=/tmp/caddy/data
USER 65532:65532
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
ENTRYPOINT ["/usr/local/bin/caddy"]
CMD ["run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
