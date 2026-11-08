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

- **Sahip:** `design/web-tokens.json`, `scripts/gen-tokens.ts` (gerekirse), `src/shared/tokens/**` (üretilmiş), `src/shared/ui/styles/metrics.css`, `src/app/shell/side/side-metrics.css`, O2'de eklenen `*-metrics.css` dosyaları (yalnız px → token taşıması), `src/shared/i18n/tr/ui.ts` (yeni) + `src/shared/i18n/tr/index.ts` bağlama + `src/shared/ui/**` içindeki `mergeLocaleMessage` çağrısının kaldırılması, `src/app/styles/fonts/**` (yeni) + `src/app/styles/main.css` `@font-face`, `.github/workflows/ci.yml` yalnız hata metni; görsel borçlar için `src/app/shell/side/program-avatar.ts`, kenar menüsü/`AppShell` dar ekran düzeni (`src/app/shell/**`, `src/app/layouts/**` yalnız ≤900 px kuralı), `src/app/shell/topbar/**` yalnız zil noktası stili, `src/modules/identity/pages/**` (giriş formu); madde 9–10 için ilgili `*.test.ts` dosyaları ve `src/shared/session/**` yalnız bayrak aktarımı.
- **Tespit:** `docs/reviews/WEB-0-codex.md` borçları **CX-F0-Ö-02** (madde 2), **CX-F0-Ö-05** (madde 1), **CX-F0-K-01** (madde 4); K9 (token kaynağı), K12; PR #20, #21, #24 gövdelerindeki "Açık kalan" maddeleri; `docs/tasarim/kaynak/theme.css` / `tema-sistemi/tokens.css` (yazı tipleri ve ölçüler).
- **İş:**
  1. **Yazı tipleri (CX-F0-Ö-05)** Inter, Poppins, Geist Mono kendi barındırılan `woff2` olarak (`font-src 'self'`, CSP nonce bozulmaz; harici CDN yok); lisans dosyası yanında. Paket gerekiyorsa koordinatör istemde açıkça izin verir, yoksa dosya kopyası.
  2. **Ölçek dışı px (CX-F0-Ö-02)** `metrics.css` ve `side-metrics.css` (ve O2'de eklenenler) → `design/web-tokens.json` → `pnpm gen:tokens`; metrics dosyaları yalnız üretilmiş değişkenleri kullanır ya da kalkar.
  3. **`ui.*` i18n** çalışma anı `mergeLocaleMessage` → statik `src/shared/i18n/tr/ui.ts`; i18n testi anahtarların çözüldüğünü doğrular.
  4. **`ci.yml` (CX-F0-K-01)** hata metni "tokens.json" → "tokens/design-system.tokens.json / design/web-tokens.json".
  5. **Program avatarı (görsel, orta):** iki program aynı baş harf/renk ("T2" mavi) → BE-001 statik türetmesinde renk kimlikten farklı türetilir, çakışmada ikinci harf stratejisi; `designStub('BE-001')` kalır.
  6. **Dar ekran (görsel, orta):** 390 px'te kenar menüsü ~100vh kaplıyor, içerik ilk ekranda yok → ≤900 px'te menü varsayılan kapalı / perdeli kaplama (tasarımda mobil yok; P3 minimum); konum izi kesilmesi üç noktalı.
  7. **Zil noktası (görsel, orta):** düğme `disabled` (F7'ye kadar) iken okunmamış noktası soluk → nokta `disabled` opaklığından muaf (düğme devre dışı kalır).
  8. **Giriş sayfası (görsel, orta):** `SessionPage` koyu temada alan kenarlıkları görünmüyor, metinler bitişik → `UiInput`/`UiField`/`UiButton` ile yeniden kurulur.
  9. **Gerçek zaman beklemeleri (Codex tur 2, Ö-03 artığı):** `standing.test.ts:48` (20 ms), `auth-session.test.ts:39`/`:45` (sıfır süreli zamanlayıcı), `sign-out.test.ts:142` (gerçek 20 ms) → sahte saat ya da kontrollü Promise. `e2e/two-tabs.spec.ts:34` gerçek token ömrü için 65 sn bekleme e2e'de **kabul edilebilir** (not olarak kalır; yalnız CI).
  10. **Kardeş sekme bayrak aktarımı (Codex tur 2 madde 5):** "sunucu çıkışı doğrulanamadı" bayrağının (`serverLogoutUnverified`) kardeş sekmelere aktarımı borcu; ortak kanal (`docs/refresh-coordination.md`) üzerinden, belirteç taşımadan. Sahiplik: `src/shared/session/**` yalnız bu bayrak.
- **Kapsam dışı (kayıtta kalır):** Yönetim grubu kapısı `menu.ts` → organizasyon `capabilities.ts` (F2); `UpdateRequired.vue` tasarımı (tasarım yok; P3 minimum ayrı iş); CI `APP_VERSION` (sürüm etiketi gizli kalır; ürün kararı gerekirse ayrı).
- **Kabul:** `pnpm gen:check` diff 0; px yalnız üretilmiş token dosyasında (stil testi genişler); görsel fark yok (W11 değişken eşitliği testleri yeşil); yazı tipi yüklemesi CSP ihlali üretmez (Playwright duman, CI); `mergeLocaleMessage` kodda yok; madde 5–8 için açık/koyu × 1440/390 ekran görüntüsü (O5 görsel doğrulama senaryoları) ve birim testi (avatar ayırt ediciliği, nokta stili).
