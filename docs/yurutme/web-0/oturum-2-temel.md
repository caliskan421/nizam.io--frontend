# O2 — Temel (W11–W15, 5 paralel)

## Açılış istemi

```
WEB-0 O2 oturumunu koordinatör olarak yürüt.
Oku: nizam.io--frontend/docs/yurutme/web-0/README.md → ortak-sozlesme.md → oturum-2-temel.md → ilerleme.md
→ docs/architecture/yol-haritasi-web.md → docs/ekranlar/ortak-kurallar.md (tamamı) → docs/ekranlar/sentez.md §1, §4, §8
→ docs/ekranlar/00-ortak/README.md (uygulama kararı tablosu) + mekanizma.md + backend.md.
Giriş: O1 ve O1b PR'ları main'de, CI yeşil; README'deki ön koşul (ürün soruları 1–5) sağlanmış ya da geçici kabul yazılmış.
Her W için origin/main'den worktree aç, ortak sözleşme + aşağıdaki özel istemle alt ajan başlat (paralel).
Kod yazma. Dönüşte kapıları worktree'de kendin koş, YENİ-EKSİK satırlarına BE kimliği ver ve kayit.md'ye işle,
her W için ayrı PR aç, CI yeşilse main'e birleştir (sıra: W15 → W11 → W12 → W13 → W14; çakışmada sonraki rebase'siz main'i alır).
Ürün sahibine soru sorma. Kapanışta ilerleme.md'yi güncelle.
```

## W11 — Token geçişi

- **Sahip:** `tokens/**`, `design/web-tokens.json` (yeni), `scripts/gen-tokens.ts`, `src/shared/tokens/**` (üretilmiş dahil), `src/app/styles/main.css`, `api-pin.json` yalnız yeni `designTokens` alanı, `README.md` token bölümü.
- **İş:** K9. Kaynak: mobil deposundaki tasarım sistemi `docs/design/design sytem/tokens.json`. Dosya bu depoya `tokens/design-system.tokens.json` olarak **kopyalanır**; kaynak commit'i ve `git hash-object` blob kimliği `api-pin.json` → `designTokens: {repo, commit, path, blob}` alanında. `gen:tokens` kopyanın blob'unu pinle doğrular (CI mobil deposuna erişmez; uyuşmazlık = kırmızı). Güncelleme = yeni kopya + yeni pin + `pnpm gen:tokens` + PR. `design/web-tokens.json`: `docs/tasarim/kaynak/theme.css` ve `tema-sistemi/tokens.css`'te olup kaynakta olmayan değerler (`--gp-*`, `rp-*` yerleşim ölçüleri, kaynakta yoksa açık tema). Çıktı: koyu varsayılan + `[data-theme=light]` CSS değişkenleri, Tailwind tema eşlemesi, PrimeVue preset. Eski yer tutucu `tokens/tokens.json` kaldırılır.
- **Kabul:** `pnpm gen:check` diff 0; tasarımdaki her `--*` değişkeninin üretilmiş CSS'te karşılığı (test: `tokens.css` + `theme.css` değişken adları ⊆ üretilmiş); blob uyuşmazlığı testi.

## W12 — `shared/ui` çekirdeği

- **Sahip:** `src/shared/ui/**` (yeni; `src/shared/ui/confirm/**` hariç — W22'nin), `src/app/styles/` altında yalnız yeni `ui.css` (gerekirse).
- **İş:** F0 kabuğunun ve F1'in ilk ekranının ihtiyacı kadar; `docs/tasarim/kaynak/tema-sistemi/bundle.css` karşılıkları, birebir görünüm (kalanlar ihtiyaç doğan fazda): `UiButton` (primary/secondary/ghost/danger, sm/lg/block, disabled), `UiIconButton`, `UiIcon` (stroke SVG seti; tasarımda kullanılan ikonlar), `UiInput`/`UiSelect`/`UiField`/`UiLabel`/`UiHint`, `UiCheck`, `UiBadge`, `UiChip`, `UiCard`, `UiStat`, `UiKbd`, `UiModal` (odak tuzağı, Esc, `aria-modal`), `UiNavItem`, `UiSegmented` (`rp-seg`), `UiEmptyState`, `UiErrorState` (istek kimliği gösterir), `UiToast` + kuyruk composable, `DesignStub` (geliştirmede kesikli çerçeve; eylem tetiklemez; yalnız `ortak-kurallar.md` §3 koşulunda kullanılır), `UiPlaceholder` (statik öğe için nötr yer tutucu — sahte veri yok, `ortak-kurallar.md` §4). PrimeVue yalnız davranış gerektiğinde unstyled. Bileşen envanteri: `docs/ekranlar/00-ortak/ozellikler.md` + `03-gorevler-liste/ozellikler.md` §2 tablolarındaki tür sütunu.
- **Kabul:** her bileşenin temel render + disabled testi; klavye testi yalnız etkileşimli olanlarda (`UiModal`, `UiSegmented`, `UiNavItem`, menü); her bileşen ≤ 150 satır; ham renk yok.

## W13 — Kapsam, standing, capability, tercih

- **Sahip:** `src/shared/scope/**`, `src/shared/session/standing*` (yeni), `src/shared/preferences/**` (yeni), `eslint.config.js` yalnız tek dosyalık istisna (`src/shared/preferences/storage-adapter.ts`), `tests/lint/architecture.test.ts` yalnız ilgili vaka, `src/modules/*/model/capabilities.ts` iskeleti yalnız `work` için örnek.
- **İş:** K1, K2, K6; davranış kaynağı `docs/ekranlar/00-ortak/mekanizma.md` §2–§3, §6 ve `ortak-kurallar.md` §1, §8. `useStanding()` → `me` + `me/departments` (TanStack, kapsamsız anahtar). Kapsam deposu: program → mercek (admin/koordinatör/üye) → departman; seçenekler standing'den (`istemci-akislari` §1–2; koordinatör/üye için `me/departments`, yönetici programı `listPrograms`); tek seçenekte otomatik; **çok seçenekte sessiz "ilk uygun" yok** — hatırlanan kimlik yoksa seçici açık / K7 boş durumu (`ortak-kurallar.md` §1). **Mercek ≠ yetki:** capability `me.company_admin` ve üyelik `role` olgularından; mercek yalnız kapsam başlıklarını ve sorgu anahtarlarını değiştirir. Kapsam değişiminde `scoped(...)` ile başlayan tüm sorgular `cancelQueries` + `removeQueries`. Yetki kaybı: K6 kodları + `program.not_found`, `reporting.not_authorized`, `work.not_authorized` (sentez Y1) → standing geçersizlenir, kapsam yeniden doğrulanır; `membership_required` `listPrograms` 403'üyle gelir (G14); `visibilitychange`/odakta tazeleme. Logout başarısızlığı "sunucu çıkışı doğrulanamadı" durumu, sessiz yenileme yok (`ortak-kurallar.md` §8). `shared/preferences`: izinli anahtarlar (`scope.programId`, `scope.lens`, `scope.departmentId`, `ui.theme`; `sidebar_collapsed` yalnız ürün sahibi kabul ederse — sentez Y9), tip güvenli, depolama erişilemezse sessizce bellek. `work/model/capabilities.ts`: §4 tablosundan saf fonksiyonlar (örnek 4 işlem) + tablo testi; §4'te satırı olmayan modüller için kaynak modül README kural kimlikleri (sentez Y3).
- **Kabul:** kapsam yaşam döngüsü testleri (çoklu rol, satırsız admin, satırsız üye 403, program değişiminde seçici/boş durum, yetki kaybı, mercek değişiminde `company_admin` korunur, logout başarısız durumu); lint testi: preferences dışında storage hâlâ yasak.

## W14 — Yazma protokolü

- **Sahip:** `src/shared/http/mutation/**` (yeni), `src/shared/http/query-keys.ts` (yeni), `src/shared/errors/**` (yalnız ekleme), `src/shared/i18n/tr/` yeni anahtar dosyası.
- **İş:** K5; kaynak `ortak-kurallar.md` §6–§7. `useProtectedMutation` (TanStack `useMutation` sarmalayıcı): `Idempotency-Key` **kullanıcı eylemi (gönder) başına** üretilir (`crypto.getRandomValues`, 22–200 bayt); ağ tekrarında aynı anahtar + aynı gövde; düzeltip yeniden gönderme yeni anahtar (CX-S-02). `X-Requested-With` bütün yazmalara istisnasız. `expected_revision`/`expected_dates_revision` geçirme; sonuç sınıflandırması: başarı (201/200 tekrar), `edit_conflict` (alanlar + sunucu değeri), `idempotency_key_reused`, `conflict_retry` (aynı anahtarla tek otomatik tekrar), "sonuç bilinmiyor" (503/zaman aşımı/ağ; taslak + anahtar korunur), 429 (`Retry-After` metni, otomatik tekrar yok), `confirmation_required` (yalnız organizasyon uçları — `removeCoordinator`, `removeMember`, `updateMembershipRole`; `fields[]` + `confirm=true` kancası), kısmi başarı modeli (ilk yanıt korunur, CX-S-03). İyimser güncelleme yok. **Sorgu anahtarı fabrikası** `query-keys.ts`: `ortak-kurallar.md` §6 tablosu birebir (`scoped()` ve hesap geneli anahtarlar), geçersizleme listeleri; gruplar kendi anahtarını yazmaz. UI yok; O3 diyalogları tüketir.
- **Kabul:** msw ile her sınıf için test; anahtarın aynı gövdede sabit, yeni eylemde yeni olduğu testi; `query-keys` tablo testi (§6'daki her kaynak için anahtar + geçersizleme).

## W15 — Kapılar, design-stub, rota kataloğu

- **Sahip:** `eslint.config.js` (W13 satırı hariç), `tests/lint/**` (W13 vakası hariç), `src/shared/design-stub/**` (yeni), `src/app/routes.catalog.ts` (yeni), `src/app/router.ts`, `src/router-meta.d.ts`, `.github/workflows/ci.yml` yalnız yeni test adımı gerekiyorsa.
- **İş:** K12: `.vue` 250 uyarı / 400 hata (`max-lines`), fonksiyon uzunluğu ve `complexity` sınırı (başlangıç 60 satır / 12; kalibrasyon notu), rol dizesi (`'koordinator'`, `'uye'`, `company_admin` karşılaştırması) yalnız izinli dosyalarda, rol önekli rota yasağı. K13: `designStub(id, value)` + `tests/lint/design-stub.test.ts` (kod ↔ `docs/backend-eksikleri/kayit.md` tutarlılığı; stub yalnız `açık`/`backend'de` satırı olan **işlev** eksiğine — belge/faz/ürün kalemlerine stub yok, `ortak-kurallar.md` §3). K10: tipli rota kataloğu (ad → yol → parametre/süzgeç tipi, menü grubu, **faz görünürlüğü** `ortak-kurallar.md` §5 matrisinden: gizli / devre dışı / canlı), router'ın tek kaynağı; F0 rotaları: ana sayfa, oturum, açık durum ekranları; rota adları ve parametre önerileri grup README'lerindeki "Rota (önerilen, K10)" satırlarından; v1 dışı modüller katalogda yok.
- **Kabul:** her yeni kural için negatif lint testi; kaçış yolu (takma ad, alt dizin) denemesi yalnız rol dizesi ve rota öneki kurallarında; design-stub testi kırmızı/yeşil örnekle.
