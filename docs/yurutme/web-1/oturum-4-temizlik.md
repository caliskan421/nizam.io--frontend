# O4 — F0'dan devreden temizlik (W61)

## Açılış istemi

```
WEB-1 O4 oturumunu koordinatör olarak yürüt.
Oku: docs/yurutme/web-1/README.md → ortak-sozlesme.md → oturum-4-temizlik.md → ilerleme.md
→ docs/yurutme/web-0/ilerleme.md (O2/O3 "Bilerek yapılmayanlar").
Giriş: O2 main'de, CI yeşil (O3 ile paralel olabilir; dosya kesişmesi yok). W61'i başlat; dönüşte kapı, PR, birleştir.
Kod yazma. Ürün sahibine soru sorma. Kapanışta ilerleme.md.
```

## W61 — Temizlik

- **Sahip:** `design/web-tokens.json`, `scripts/gen-tokens.ts` (gerekirse), `src/shared/tokens/**` (üretilmiş), `src/shared/ui/styles/metrics.css`, `src/app/shell/side/side-metrics.css`, O2'de eklenen `*-metrics.css` dosyaları (yalnız px → token taşıması), `src/shared/i18n/tr/ui.ts` (yeni) + `src/shared/i18n/tr/index.ts` bağlama + `src/shared/ui/**` içindeki `mergeLocaleMessage` çağrısının kaldırılması, `src/app/styles/fonts/**` (yeni) + `src/app/styles/main.css` `@font-face`, `.github/workflows/ci.yml` yalnız hata metni.
- **Tespit:** K9 (token kaynağı), K12; PR #20, #21, #24 gövdelerindeki "Açık kalan" maddeleri; `docs/tasarim/kaynak/theme.css` / `tema-sistemi/tokens.css` (yazı tipleri ve ölçüler).
- **İş:**
  1. **Yazı tipleri** Inter, Poppins, Geist Mono kendi barındırılan `woff2` olarak (`font-src 'self'`, CSP nonce bozulmaz; harici CDN yok); lisans dosyası yanında. Paket gerekiyorsa koordinatör istemde açıkça izin verir, yoksa dosya kopyası.
  2. **Ölçek dışı px** `metrics.css` ve `side-metrics.css` (ve O2'de eklenenler) → `design/web-tokens.json` → `pnpm gen:tokens`; metrics dosyaları yalnız üretilmiş değişkenleri kullanır ya da kalkar.
  3. **`ui.*` i18n** çalışma anı `mergeLocaleMessage` → statik `src/shared/i18n/tr/ui.ts`; i18n testi anahtarların çözüldüğünü doğrular.
  4. **`ci.yml`** hata metni "tokens.json" → "tokens/design-system.tokens.json / design/web-tokens.json".
- **Kapsam dışı (kayıtta kalır):** Yönetim grubu kapısı `menu.ts` → organizasyon `capabilities.ts` (F2); `UpdateRequired.vue` tasarımı (tasarım yok; P3 minimum ayrı iş); CI `APP_VERSION` (sürüm etiketi gizli kalır; ürün kararı gerekirse ayrı).
- **Kabul:** `pnpm gen:check` diff 0; px yalnız üretilmiş token dosyasında (stil testi genişler); görsel fark yok (W11 değişken eşitliği testleri yeşil); yazı tipi yüklemesi CSP ihlali üretmez (Playwright duman, CI); `mergeLocaleMessage` kodda yok.
