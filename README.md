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

## Backend ile ilişki

- Sözleşme: `../nizam.io--backend/docs/api/openapi.yaml` + `error-codes.json`, backend
  etiketinden (ilk: `v0.1.0-api`). Üretilen tipler commit'lenir; CI "yeniden üret,
  diff = 0" kapısını uygular.
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
