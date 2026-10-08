# NIZAM.IO — Web istemcisi

NIZAM.IO'nun tarayıcı istemcisi. Durum: **iskelet (WEB-1a)** — proje, kalite kapıları,
sınır kuralı, tip üretimi, HTTP/oturum/kapsam katmanı, i18n, tasarım token'ları ve gerçek
backend'e karşı e2e duman kuruldu (`../program/fazlar/F06-web-1a-iskelet.md`). Giriş/kabuk/kapsam
seçici ve bütün ekran tasarımı program sonrası istemci geliştirmesindedir (`../program/` D-0174);
bugünkü oturum sayfası ve PrimeVue preset/token değerleri yer tutucudur.

## Yığın

Vue 3.5 · TypeScript strict · Vite · vue-router · Pinia · TanStack Query ·
`openapi-fetch` (+ `openapi-typescript` tip üretimi) · vee-validate/zod · PrimeVue 4 ·
Tailwind · vue-i18n · vitest + Testing Library + MSW · Playwright.

## Gereksinimler

- Node **24 LTS** (`.nvmrc`; `engines`), pnpm (`packageManager` alanındaki sürüm; `corepack enable`).

## Komutlar

| Komut | Ne yapar |
|---|---|
| `pnpm install --frozen-lockfile` | Bağımlılıklar (kilit dosyası donuk). |
| `pnpm dev` | Vite geliştirme sunucusu; `/v1`, `/.well-known`, `/healthz` → `NIZAMIO_DEV_BACKEND` (`.env.development`). |
| `pnpm build` / `pnpm preview` | Üretim paketi / önizleme (önizlemede de aynı proxy). |
| `pnpm typecheck` | `vue-tsc --build` (strict). |
| `pnpm lint` | ESLint: sınır kuralı, `localStorage`/`sessionStorage` yasağı, `modules/**/api` içinde elle DTO yasağı. |
| `pnpm format` / `pnpm format:check` | Prettier. |
| `pnpm test` | vitest (birim + lint kurallarının negatif testleri). |
| `pnpm gen:api` | Backend etiketinden (`api-pin.json`) üretim: `src/shared/api/schema.d.ts`, `error-codes.gen.ts`, `operations.gen.ts`. Backend dizini `NIZAMIO_BACKEND_DIR` (varsayılan `../nizam.io--backend`). |
| `pnpm e2e:backend:up` | Gerçek backend'i etiketten kurar (bkz. "e2e"). |
| `pnpm e2e` | Playwright duman (global setup API ile fixture kurar; `vite preview` + chromium). |
| `pnpm e2e:backend:down` | e2e backend kaynaklarını adıyla kapatır. |
| `pnpm gen:tokens` | `tokens/tokens.json` → `src/shared/tokens/tokens.gen.{css,ts}` + `tailwind.gen.css`. |
| `pnpm gen:check` | İki üreticiyi koşar ve `git diff --exit-code` uygular (CI kapısı). |

## Backend ile ilişki

- Sözleşme: `../nizam.io--backend/docs/api/openapi.yaml` + `error-codes.json`, backend
  etiketinden. **Pin tek yerdedir:** `api-pin.json` (`backendTag`, bugün `v0.1.0-api`).
  `pnpm gen:api` spec'i `git show <etiket>:docs/api/...` ile okur; çalışma ağacı veya
  etiketsiz `main` okunmaz. Üretilen dosyalar commit'lenir; CI backend etiketini salt
  okunur deploy key ile getirir, yeniden üretir ve diff = 0 ister.
- Pin yükseltme: backend yeni etiket → `api-pin.json` → `pnpm gen:api` → PR
  ("spec değişti mi" alanı doldurulur).
- Teslim modeli: ayrı statik imaj + Caddy, aynı origin (`/` statik, `/v1` ve
  `/.well-known` backend). CORS yoktur. Geliştirmede Vite proxy.
- Kurulum bilgisi (ad, marka rengi, saat dilimi, `api_version`) oturumdan önce
  `GET /v1/instance/profile` ucundan okunur.
- Statik içerik CSP'si Caddy'de, API CSP/HSTS backend'dedir.

## HTTP ve oturum katmanı (`src/shared/`)

- `http/client.ts` — `openapi-fetch` + ara katmanlar: spec dışı uç reddi
  (`client.unknown_operation`), yazmalarda `X-Requested-With`, S2/S3'te kapsam başlıkları
  (kapsam yoksa istek gönderilmez: `client.scope_missing`), `Authorization: Bearer`,
  401 → tek uçuş refresh → bir kez tekrar, 403 `identity.force_password_change_required`
  bayrağı. `http/unwrap.ts` sonucu veriye çevirir, hatayı normalize eder.
- `errors/api-error.ts` — hata zarfı → `{code, messageKey, requestId, fields[], status,
  retryAfter}`; sunucu `message` alanı taşınmaz. İstemci kodları `errors/client-codes.ts`.
- `session/` — `AuthSession` (belirteç yalnız bellekte), Web Locks + BroadcastChannel
  koordinasyonu ([docs/refresh-coordination.md](docs/refresh-coordination.md)), Pinia
  oturum deposu (sessiz refresh, giriş, `/v1/me`, çıkış).
- `scope/` — kapsam deposu (program + departman) ve TanStack Query anahtar fabrikası.
- `i18n/` — vue-i18n (v1 yalnız TR). `tr/errors.ts`: katalogdaki her zarf ve alan kodu +
  `client.*` kodları için elle yazılmış metin (anahtar `errors.<kod>`); eksik/fazla testle
  denetlenir. Bilinmeyen kod genel metne düşer.
- `tokens/` — kökteki `tokens/tokens.json` (renk, tipografi, boşluk, radius; açık/koyu;
  platformdan bağımsız, mobil de okur) → üretilmiş CSS değişkenleri (`--nz-*`,
  `[data-theme='dark']`), Tailwind v4 `@theme` eşlemesi, PrimeVue 4 preset'i (Aura +
  `definePreset`, `preset.ts`). Tailwind ↔ PrimeVue: `tailwindcss-primeui`, CSS katmanları.
- `instance/` — `GET /v1/instance/profile`; `api_version` desteklenmiyorsa
  `update_required` durumu (sessiz düşüş yok).

## e2e (Playwright, gerçek backend)

`e2e/backend/up.sh` backend'i **yalnız `api-pin.json` etiketinden** kurar: `git archive`
ile geçici kaynak ağacı (`e2e/.state/`, backend deposuna yazılmaz) → etiketin
`build/Dockerfile`'ı ile imaj → `migrations/roles.sql` → migrator kimliğiyle `migrate up` →
roller tekrar → ilk yönetici → uygulama kimliğiyle server (`127.0.0.1:18080`).

- **İlk yönetici:** backend `cmd/setup` aktivasyon kodu ister ve sahte merkezde kod yalnız
  süreç içinde üretilebilir (backend README "Bugünkü sınır"). Bu yüzden
  `e2e/backend/bootstrap/main.go` backend entegrasyon düzeneğinin yaptığını dışa açık
  composition API'siyle yapar: sahte merkezle gerçek aktivasyon akışı + `Root.Bootstrap`.
  Yalnız e2e içindir; üretim kurulumu değildir. **Geçicidir:** backend'e test amaçlı
  aktivasyon yolu gelince araç kaldırılır ve `cmd/setup`'a dönülür. Hiçbir üretim
  imajına/derlemesine girmediğini CI `e2e/backend/check-isolation.sh` denetler (`dist/` ve
  backend çalışma imajı).
- **Fixture:** `e2e/global-setup.ts` yalnız API çağrılarıyla (yönetici girişi → program →
  departman → programa bağlama → üye) kurar; backend seed yüzü yoktur (D-0162).
- **Duman:** `e2e/smoke.spec.ts` — giriş → `/v1/me` → sayfa yenileme sonrası sessiz refresh
  → çıkış; tarayıcı depolarının boş ve yenileme çerezinin HttpOnly olduğu denetlenir.
- **İki sekme:** `e2e/two-tabs.spec.ts` — aynı tarayıcı bağlamında iki gerçek sayfa; erişim
  belirteci dolduktan sonra eşzamanlı 401 → ağda tek `/v1/auth/refresh`, iki oturum da
  geçerli. Bu senaryo için ikinci bir server (`18081`, `NIZAMIO_SESSION_TTL=1m`, aynı DB)
  ve ikinci önizleme (`4174`) koşar; normal akışlar `4173 → 18080` (15 dk) üzerindedir.
- **Tedarik zinciri:** CI eylemleri commit SHA'sına, Postgres ve e2e araç imajının tabanları
  digest'e sabitlidir. Backend imajı etiketin kendi `build/Dockerfile`'ıyla derlenir;
  tabanları `up.sh` digest'li çekip Dockerfile'ın beklediği etiketle yerel etiketler,
  `--pull=false` + `BUILDKIT_SYNTAX` (digest'li) ile derler ve `check-base-pins.sh` ile
  denetler. Kalıcı çözüm backend `build/Dockerfile`'ında digest pinidir (F23'e devir).
- **Yerel:** `NIZAMIO_E2E_MODE=local` (varsayılan) Postgres'i `nizamio_web_e2e` Compose
  projesinde açar (`127.0.0.1:15432`); kapatma `pnpm e2e:backend:down`. Paylaşılan
  makinede başka projelerin kaynaklarına dokunulmaz. **CI:** Postgres servis konteyneri,
  `NIZAMIO_E2E_MODE=ci`.

## Dizin düzeni

```text
src/main.ts                 giriş noktası
src/app/                    router, sağlayıcılar, layout
src/shared/                 http, oturum, kapsam, hata, i18n, token'lar
src/shared/api/             ÜRETİLMİŞ sözleşme çıktıları (elle düzenlenmez)
scripts/gen-api.ts          tip/katalog/kapsam haritası üreticisi
src/modules/<modul>/        api/ pages/ components/ store/ routes.ts public.ts
tests/lint/                 mimari lint kurallarının negatif testleri
tests/support/              MSW sahte backend, sahte sekme koordinasyonu
tokens/tokens.json          tasarım token'larının tek kaynağı (web + mobil)
e2e/                        Playwright duman, global setup, backend kurulum betikleri
docs/                       tasarım notları (refresh koordinasyonu); Codex hükmü docs/reviews/
scripts/gen-tokens.ts       token üreticisi
```

Sınır kuralı (`eslint.config.js`, `boundaries/dependencies`):

- `shared` yalnız `shared`'ı içe aktarır (`app`/`modules` yasak).
- `app` → `shared` ve modüllerin yalnız `public.ts`'i.
- Modül → `shared`, kendi iç dosyaları ve başka modüllerin yalnız `public.ts`'i.

## Süreç

Faz sırası ve durum: `../program/DURUM.md`. Her değişiklik PR + CI; faz sonunda
Codex tek koşum. Bu depoda `project-control` kaydı tutulmaz.
