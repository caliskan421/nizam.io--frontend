# NIZAM.IO — Web istemcisi

NIZAM.IO'nun tarayıcı istemcisi. Durum: **iskelet (WEB-1a)** — proje, kalite kapıları,
sınır kuralı kuruldu (`../program/fazlar/F06-web-1a-iskelet.md`). Ekranlar F09'dan itibaren.

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
| `pnpm gen:check` | Yeniden üretir ve `git diff --exit-code` uygular (CI kapısı). |

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

## Dizin düzeni

```text
src/main.ts                 giriş noktası
src/app/                    router, sağlayıcılar, layout
src/shared/                 http, oturum, kapsam, hata, i18n, token'lar
src/shared/api/             ÜRETİLMİŞ sözleşme çıktıları (elle düzenlenmez)
scripts/gen-api.ts          tip/katalog/kapsam haritası üreticisi
src/modules/<modul>/        api/ pages/ components/ store/ routes.ts public.ts
tests/lint/                 mimari lint kurallarının negatif testleri
```

Sınır kuralı (`eslint.config.js`, `boundaries/dependencies`):

- `shared` yalnız `shared`'ı içe aktarır (`app`/`modules` yasak).
- `app` → `shared` ve modüllerin yalnız `public.ts`'i.
- Modül → `shared`, kendi iç dosyaları ve başka modüllerin yalnız `public.ts`'i.

## Süreç

Faz sırası ve durum: `../program/DURUM.md`. Her değişiklik PR + CI; dilim sonunda
Codex tek koşum. Bu depoda `project-control` kaydı tutulmaz.
