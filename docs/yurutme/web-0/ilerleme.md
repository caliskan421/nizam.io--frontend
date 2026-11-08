# WEB-0 ilerleme

Koordinatör her oturum kapanışında bir kayıt ekler; sonraki oturum buradan başlar. Uygulayıcılar bu dosyaya yazmaz.

## Durum

| Oturum | Durum | main hash |
|---|---|---|
| O1 — Belgeler | Birleşti (#18) | `d010acb` |
| O1b — Ekran tespitleri | Birleşti (#18, O1 ile aynı PR) | `d010acb` |
| O2 — Temel | Birleşti (W14 #19, W11 #20, W12 #21, W13 #22, W15 #23) | `2c1c370` |
| O3 — Kabuk | W21 birleşti (#24) · W22 PR #25 (CI) | `5adbeee` · `<#25 merge>` |
| O4 — Gantt pilotu | Karar belgesi PR #26 (pilot kodu `web0/o4-w31` dalında, birleşmez) | `<#26 merge>` |
| O5 — Kapanış | Sürüyor (`web0/o5-kapanis`) | — |

## Kayıtlar

### 2026-11-08 — O1
- Yol haritası (K1–K15) Codex 3 tur + ürün sahibi kararlarıyla kabul; tasarım kopyası `docs/tasarim/kaynak/` (sürüm `1794118532-71ae`); eksik kaydı BE-001…BE-035 tohumlandı.
- Ürün sahibi kararları: v1 = F0–F4; yeni modül ekranları v1 dışı ve menüde gizli; departman v1'de düz; koordinatör/üye ana sayfası sade; tasarım birebir, eksik statik + faz başı eksik raporu.
- Sonraki adım: PR → CI yeşil → birleştir → O2 açılış istemi.

### 2026-11-08 — O1b (ekran tespitleri)
- `docs/ekranlar/`: 11 ekran grubu × 6 dosya; tasarım analisti → backend analisti → Sonnet denetçi (hepsi `denetlendi`) → Codex kapısı `gpt-6-astra` (`docs/reviews/EKRANLAR-codex.md`, **KOŞULLU UYGUN**) → Codex bulguları grup dosyalarına işlendi; `ortak-kurallar.md` (tek sözleşme) ve `sentez.md` (kararlar) yazıldı.
- Eksik kaydı: BE-001…031 düzeltildi (BE-008 açık, BE-023 vazgeçildi, BE-025 bölündü), BE-036…BE-106 eklendi; devir raporu `docs/backend-eksikleri/rapor-tespit-2026-11-08.md`.
- Yürütme seti bu plana bağlandı: `ortak-sozlesme.md` 2a, O2–O5 istemleri ekran gruplarına ve kabul tablolarına referans veriyor; K15 "tek satırlık bağlama" istisnası kaldırıldı (Codex CX-M-06).
- Ürün sahibi `sentez.md` §4 sorularını cevapladı → `ortak-kurallar.md` §12 P1–P11; `00-ortak`, `03-gorevler-liste`, `01-ana-sayfa` kabul tabloları dolduruldu, durum `kabul`.
- Açık: yol haritası Y1/Y2/Y3/Y9/Y11/Y12 metin onayı (ürün sahibi).

### 2026-11-08 — O2 (temel, W11–W15)
- **Yapılanlar:** W11 token geçişi (#20; mobil tasarım sistemi kopyası + blob pini `api-pin.json` `designTokens`, `design/web-tokens.json`, koyu varsayılan) · W12 `shared/ui` çekirdeği (#21; 69 dosya, `DesignStub`, `UiPlaceholder`, odak tuzağı/roving) · W13 kapsam yaşam döngüsü, standing, `work/model/capabilities.ts`, `shared/preferences`, çıkış doğrulanamadı (#22) · W14 `useProtectedMutation` + `query-keys.ts` (#19) · W15 boyut kapıları, rol dizesi/rota öneki lint'i, `designStub` + kayıt testi, rota kataloğu (#23). Birleştirme sırası W15 → W11 → W12 → W13 → W14; main `2c1c370`.
- **Koordinatör onaylı varsayılanlar (W13):** logout 2xx dışı = "doğrulanamadı"; yönetici olmayanın program seçenekleri `me/departments`'tan; mercek/departman yeni programda geçerliyse korunur; mercek değişiminde seçici açılırsa hatırlanan departman silinir → `00-ortak/README.md` kabul tablosuna işlendi (O5).
- **Bilerek yapılmayanlar:** yazı tipleri (Inter/Poppins/Geist Mono) yüklenmiyor; `src/shared/ui/styles/metrics.css` ölçek dışı px'ler henüz `design/web-tokens.json`'da değil; `ui.*` i18n çalışma anında `mergeLocaleMessage` (→ `tr/ui.ts`); `.github/workflows/ci.yml` hata metni hâlâ "tokens.json" → F1 temizliği (web-1 O4).
- **Kapı:** her PR'da typecheck / lint / format:check / test / build yeşil (W11'de ayrıca `gen:check`); vitest 302 (F0 öncesi) → W11 323 · W12 388 · W13 401 · W14 402 · W15 434 (her biri kendi dalında); CI yeşil.
- YENİ-EKSİK: yok.

### 2026-11-08 — O3 (kabuk, W21–W22)
- **Yapılanlar:** W21 kenar menüsü + Kenar-Secici (#24, main `5adbeee`; `src/app/shell/side/**`, dar menü E-00-40, sabit "RoketPortal", Yönetim grubu `company_admin` ile) · W22 `AppShell`, üst çubuk, tema, K7 açık durumlar, etkili işlem onayı + genel onay diyaloğu (#25, CI'da; `DefaultLayout.vue` silindi).
- **Koordinatör onaylı varsayılanlar:** W21 — standing kapsam yaşam döngüsünden okunur; Görevler rozetleri F0'da hesaplanmaz (öğe devre dışı); `0.0.0` sürüm etiketi gizli. W22 — K7 açık durumları S0 rotalarının (`/oturum`) yerine geçmez; F2'de program/departman yönetim rotaları "program yok"/"departman yok" durumundan muaf tutulmalı; yöneticide "programa departman katılmamış" tespiti F2 (`listProgramDepartments` gerekir) → `00-ortak/README.md` kabul tablosuna işlendi.
- **Bilerek yapılmayanlar:** `src/app/shell/side/side-metrics.css` ölçek dışı px'ler (`metrics.css` ile birlikte F1 temizliği); Yönetim grubu kapısı `menu.ts`'te boolean olgu → organizasyon `capabilities.ts` (F2); `UpdateRequired.vue` tasarımsız yer tutucu; e2e yalnız CI'da koştu; CI `APP_VERSION` vermiyor (etiket gizli kalır); 272 px taşma yalnız jsdom'da kanıtlı.
- **Kapı:** W21 vitest 787 · W22 (main ile birleşik) 851; typecheck / lint / format:check / build yeşil; W21 CI yeşil, W22 CI sürüyor.
- YENİ-EKSİK: yok (kabukta `designStub` yalnız BE-001 ve BE-003).

### 2026-11-08 — O4 (Gantt pilotu, W31)
- **Yapılanlar:** 4 aday (kendi SVG, SVAR Vue Gantt, DHTMLX, Frappe) aynı tohumlu veriyle (250 görev + 60 bağ, gerçek `GanttTask`/`GanttLink` tipleri), üretim CSP'si birebir, Playwright ölçümü. Karar belgesi `docs/architecture/gantt-secimi.md` (PR #26); pilot kodu `web0/o4-w31` dalında, main'e girmez.
- **Karar:** **kendi SVG Gantt** (86/100; CSP 0 ihlal, ilk çizim 77 ms, +5,1 KB gzip, treegrid + klavye); yedek **SVAR Vue Gantt** (65); DHTMLX (57) ve Frappe (39) CSP ihlalleriyle elendi → yol haritası K4 satırına ve `sentez.md` Y6'ya işlendi (O5).
- **Bilerek yapılmayanlar:** gerçek ekran okuyucu (VoiceOver/NVDA), Safari/Firefox/dokunmatik denenmedi → F3 kabul kanıtı; ay ölçeği, sezon şeridi, dışa aktarım F3 işi.
- YENİ-EKSİK: yok.

### 2026-11-08 — O5 (açık)
- **Yapılanlar:** `docs/backend-eksikleri/rapor-F0.md` (F0'da BE satırı değişmedi; F1 öncelik sırası BE-003 → BE-036 → BE-038 → BE-040 → BE-004 → BE-001 → BE-051); `00-ortak` kabul tablosuna W13/W21/W22 onaylı varsayılanları; yol haritası K4 pilot cümlesi; `sentez.md` Y6 notu ve §8 durum satırı; `docs/yurutme/web-1/` iskeleti (F1 oturumları O2–O5, W41–W47 / W51 / W61).
- **Bekleyen:** #25 ve #26 birleşmesi (hash yer tutucuları); `main`'de tam kapı + e2e CI; açık/koyu tema × 1440/1024/390 kabuk ekran görüntüsü doğrulaması; **Codex kapısı** (`docs/reviews/WEB-0-codex.md`); yönetim deposu `program/DURUM.md` + `gunluk/` satırı; Y1/Y2/Y3/Y9/Y11/Y12 yol haritası metinleri (ürün sahibi onayı).
