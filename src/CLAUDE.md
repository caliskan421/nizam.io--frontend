# CLAUDE.md — nizam.io--frontend/src (harita)

Kural burada tekrar edilmez; yetkili belge `../README.md` (komutlar, dizin düzeni, sınır kuralı).

**Katmanlar:**
- `main.ts` — giriş noktası.
- `app/` — router, sağlayıcılar, layout, CSP nonce ve "güncelleme gerekli" ekranı; modülleri yalnız `public.ts` üzerinden bağlar.
- `modules/<modul>/` — özellik dilimleri (bugün `identity`); `shared` ve başka modüllerin yalnız `public.ts`'ini görür.
- `shared/` — HTTP istemcisi, oturum, kapsam, hata, i18n, kurulum profili, token'lar; `app`/`modules` içe aktarmaz.

**Modül kalıbı:** `modules/<modul>/{api/,pages/,components/,store/,routes.ts,public.ts}`; `api/` içinde elle DTO yazılmaz (lint), tipler üretilmiş şemadan gelir.

**Üretilmiş istemci:** `shared/api/schema.d.ts`, `error-codes.gen.ts`, `operations.gen.ts` elle düzenlenmez. Yeniden üretme `pnpm gen:api` (`../scripts/gen-api.ts`); CI kapısı `pnpm gen:check` (diff = 0). Token çıktıları `shared/tokens/*.gen.*` → `pnpm gen:tokens`.

**Pin:** spec yalnız `../api-pin.json` içindeki backend etiketinden okunur; yükseltme yeni etiket + `pnpm gen:api` + PR. Sürüm ilkesi: [`../../nizam.io--backend/docs/api/README.md`](../../nizam.io--backend/docs/api/README.md) §8.

**Test:**
- Birim: `pnpm test` (vitest; dosyalar kaynağın yanında `*.test.ts`, destek `../tests/support/`, lint negatif testleri `../tests/lint/`).
- e2e: `pnpm e2e:backend:up` → `pnpm e2e` → `pnpm e2e:backend:down` (Playwright, gerçek backend; `../e2e/`).
- Kapılar: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`.

**Yetkili belge:** `../README.md`; depo kuralları `../CLAUDE.md`.
