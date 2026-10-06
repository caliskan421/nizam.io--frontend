# NIZAM.IO — Web istemcisi

NIZAM.IO'nun tarayıcı istemcisi. Durum: **iskelet henüz yok** — ilk kod WEB-1a fazında
(`../program/fazlar/F06-web-1a-iskelet.md`) gelir.

## Yığın

Vue 3.5 · TypeScript strict · Vite · vue-router · Pinia · TanStack Query ·
`openapi-fetch` (+ `openapi-typescript` tip üretimi) · vee-validate/zod · PrimeVue 4 ·
Tailwind · vue-i18n · vitest + Testing Library + MSW · Playwright.

## Backend ile ilişki

- Sözleşme: `../nizam.io--backend/docs/api/openapi.yaml` + `error-codes.json`, backend
  etiketinden (ilk: `v0.1.0-api`). Üretilen tipler commit'lenir; CI "yeniden üret,
  diff = 0" kapısını uygular.
- Teslim modeli: ayrı statik imaj + Caddy, aynı origin (`/` statik, `/v1` ve
  `/.well-known` backend). CORS yoktur. Geliştirmede Vite proxy.
- Kurulum bilgisi (ad, marka rengi, saat dilimi, `api_version`) oturumdan önce
  `GET /v1/instance/profile` ucundan okunur.
- Statik içerik CSP'si Caddy'de, API CSP/HSTS backend'dedir.

## Dizin düzeni (plan — WEB-1a)

```text
src/app/        router, sağlayıcılar, layout
src/shared/     http, oturum, kapsam, hata, i18n, token'lar
src/modules/<modul>/  api, pages, components, store, routes.ts, public.ts
```

## Süreç

Faz sırası ve durum: `../program/DURUM.md`. Her değişiklik PR + CI; dilim sonunda
Codex tek koşum. Bu depoda `project-control` kaydı tutulmaz.
