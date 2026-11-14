# Web yol haritası — ekranların yapımı (F0–F8)

**Durum:** Kabul (2026-11-08, ürün sahibi kararları + Codex 3 tur çapraz inceleme) · **Pin:** `v0.11.0-api`
**Yürütme:** [`../yurutme/web-0/`](../yurutme/web-0/) (Faz 0 oturumları). Sonraki fazların yürütme seti faz açılışında `docs/yurutme/web-<N>/` olarak yazılır.
**Önceki belge:** "nizam.io Frontend — Mimari Analiz ve Yol Haritası" (2026-10-22). Bu belge onun yerine geçer; aşağıdaki §2 hangi kararın değiştiğini söyler.

## 1. Kaynaklar (çelişkide sıra)

1. Backend sözleşmesi: `../nizam.io--backend/docs/api/` — `openapi.yaml`, `error-codes.json`, **`istemci-akislari.md`** (rol türetme §1, kapsam §2, ekran→uç §3, eylem görünürlüğü §4, yazma/çakışma §8, sohbet §10). Web uydurmaz; uyuşmazlık backend eksiği olarak kaydedilir (§5).
2. Tasarım: **"(Doğan) RoketPortal — Yeniden Tasarım"** tuvali — <https://claude.ai/artifact/W25DrXfL1htpcn8E5gL1Xf>. Ekranlar **birebir** referanstır (ürün sahibi 2026-11-08). Görsel sistem: tuvaldeki `tema-sistemi/tokens.css`, `tema-sistemi/bundle.css` (`t-*`), `theme.css` (`rp-*`); koyu varsayılan + açık tema.
3. Bu belge ve yürütme seti.

## 2. Kararlar

| # | Karar | Hüküm |
|---|---|---|
| K1 | Yetki bilgisi | Yeni uç yok: `GET /v1/me` (`company_admin`, `full_name`) + `GET /v1/me/departments`. Rol yalnız **gösterim** içindir; eylem görünürlüğü işlem bazında `istemci-akislari.md` §4 tablosundan, modül başına tek `capabilities.ts` dosyasında hesaplanır. Rol dizesi karşılaştırması yalnız o dosyalarda (lint). |
| K2 | Kapsam | Varsayılan kapsam yok. Kenar menüsü tasarımdaki **Program / Rol / Koordinatörlük** kartları (Kenar-Secici). Rol kartı sunucu rolü değil, kapsamın istemci merceğidir: Admin → departmansız program kapsamı; Koordinatör/Üye → `me/departments` satırlarından birim seçimi. Tek seçenek varsa otomatik seçilir; son seçim (yalnız kimlikler) hatırlanır — depolama yasağının tek istisnası `src/shared/preferences/storage-adapter.ts` dosyasıdır: izinli anahtar listesi (kapsam kimlikleri, tema), belirteç asla; lint istisnası yalnız o dosya, testle kanıtlı. Kapsam değişince eski kapsamın sorguları iptal, veri görünmez. |
| K3 | Görev listesi | Tek uç `listProgramWorkItems` (S2); departman süzgeci `department_id`. Departmanlar arası fan-out **yasak**. Yönetici "Üye" merceğinde "bana atananlar" süzgeci istemcide. |
| K4 | Gantt | Görünüm seçici yok; yüz kapsamdan türetilir (Admin → `adminGantt`; Koordinatör → `coordinatorGantt`; Üye → `memberGantt`; birleşik rolde koordinatör). Tam 200 satırda "sınıra ulaşmış olabilir" uyarısı (GAP-053). Kütüphane F0'da ayrı pilotla seçilir (bağımlılık okları, 200+ satır, erişilebilirlik, CSP nonce, lisans; tutmazsa kendi SVG'miz). Pilot (W31, `gantt-secimi.md`): kendi SVG Gantt seçildi; yedek SVAR Vue Gantt. |
| K5 | Yazma protokolü | `shared/http/mutation`: `expected_revision`/`expected_dates_revision`, `Idempotency-Key` (aynı gövde aynı anahtar), 409 `*.edit_conflict` → alan alan seçim, `*.idempotency_key_reused`, `platform.conflict_retry` tek tekrar, "sonuç bilinmiyor" (taslak + anahtar korunur), 429 `Retry-After` (otomatik tekrar yok), 409 `organization.confirmation_required` → ortak **etkili işlem onayı** diyaloğu (`fields[]` görev başlıkları, `confirm=true`). Kaynak: `istemci-akislari.md` §8, F60 devir notu. |
| K6 | Yetki kaybı | 403 `organization.not_authorized` / `organization.membership_required` ve 404 `work.program_scope_invalid` sonrası `me` + `me/departments` geçersizlenir, kapsam yeniden doğrulanır; pencere odağa dönünce tazelenir. Gizleme güvenlik değildir. |
| K7 | Açık durumlar | "Program yok" (yönetici: program oluştur), "departman ataması bekleniyor" (`membership_required`, metni istemci), "programa departman katılmamış" (yönetici: departman ekle), `organization.department_exists` → "mevcut departmanı bu programa ekle". |
| K8 | Gerçek zamanlı | SSE yalnız sohbet (F7): `fetch` akışı (`Authorization` başlığı; `EventSource` değil), 0–5 sn jitter + üstel geri çekilme, olay → HTTP uzlaştırma (§10.5). Diğer ekranlar sorgu tazelemesi. |
| K9 | Görsel sistem | Web kendi `tokens/tokens.json` yer tutucu paletini emekliye ayırır. Renk/ölçek kaynağı tasarım sistemi `tokens.json` (mobilin okuduğu dosya; aynı soy), mobildeki yöntemle dosya bu depoya kopyalanır, kaynağı **sabit commit + `git hash-object` blob pini** ile `api-pin.json`'da (CI mobil deposuna erişmez); web'e özgü değerler (`--gp-*` Gantt, `rp-*` yerleşim) `design/web-tokens.json`'da. PrimeVue yalnız davranış için (unstyled/pass-through); görünüm `t-*`/`rp-*` karşılığı `shared/ui` bileşenleri. Uzun vadede tasarım sisteminin ayrı depoya taşınması açık soru (bloke etmez). |
| K10 | Rota kataloğu | `app/routes.catalog.ts`: tipli ad → yol → tipli parametre/süzgeç; URL özelliğe göre (`/gorevler`, `/zaman-cizelgesi`), rol öneki yok. F46 (asistan görünüm kataloğu) bu tabloyu tüketir. |
| K11 | Formlar | vee-validate + zod ilk karmaşık formla (F1) eklenir. |
| K12 | Boyut kapıları | `.vue` 250 satırda uyarı / 400'de hata; fonksiyon uzunluğu ve karmaşıklık sınırı; F0–F1'de ölçülüp kalibre edilir, istisna yazılı gerekçeyle. |
| K13 | Tasarım önce, eksik statik | Tasarım birebir uygulanır. Backend'de karşılığı olmayan alan/eylem **statik** gösterilir, kod içinde `designStub('BE-NNN', …)` ile işaretlenir ve [`../backend-eksikleri/`](../backend-eksikleri/) kaydına yazılır. Kayıt ↔ kod tutarlılığını test denetler. Her faz kapanışında eksik raporu çıkar; ürün sahibi backend eksiklerini paralel bir ajanla kapatır, web sonraki fazda bağlar. |
| K14 | v1 kapsamı | **F0–F4.** Tasarımdaki yeni modül ekranları (İşlem geçmişi, Tablolar, Takvim, Kurumsal hafıza, Simülasyon, Bütçe/Talep) v1 dışı, menüde görünmez; ayrı backend+web fazları. Departmanlar v1'de düz liste (hiyerarşi, aktif/pasif, birleştirme sonra). Koordinatör/üye ana sayfası mevcut uçlarla sade; yönetici panosu mevcut rapor uçlarıyla. |
| K15 | Geliştirme | Ürün sahibi + Claude, bu depoda. Süreç backend/mobil ile aynı: faz = iş dosyası + yürütme seti; koordinatör kod yazmaz, uygulayıcı alt ajanlar worktree'de; her PR CI yeşil; faz sonu Codex salt okunur kapı (`docs/reviews/`); yönetim deposunda (`../program/DURUM.md`) faz başına tek satır. |

**P30 toplantı yetkisi istisnası:** `istemci-akislari.md` toplantı yetkisini kapsamaz; pinli meetings README §3/§4 K73/K74 `capabilities.ts` kaynağıdır (BE-036 madde 7 belge paketi gelene dek).

**Önceki belgeden değişenler:** Karar 1'deki `/v1/me/authorities` önerisi düştü (K1); "Gantt'ta görünür seçici" düştü (K4, backend sözleşmesi); "gerçek zamanlı yok" düştü (K8); "web token'ların sahibi, mobil okur" düştü (K9); yazma protokolü, rota kataloğu, açık durumlar ve program yönetimi eklendi.

## 3. Mimari (değişmeyen çekirdek)

Vue 3 + TS strict + Vite, `openapi-fetch` + üretilmiş tipler (`api-pin.json`), TanStack Query tek sunucu verisi kaynağı (`scopedKey()`), Pinia yalnız oturum/kapsam/arayüz. Klasörler backend modülleriyle birebir, rol klasörü yok:

```
src/app/            router, routes.catalog.ts, kabuk (kenar menüsü, üst çubuk), açık durum ekranları
src/shared/         http (+ mutation), session, scope (+ standing), errors, i18n, tokens, design-stub
src/shared/ui/      davranış taşıyan ortak bileşenler (t-*/rp-* karşılıkları)
src/modules/<m>/    api/ (sorgu+mutasyon) · model/ (capabilities.ts, etiketler, geçişler) · components/ · pages/ (ince) · routes.ts · public.ts
```

## 4. Fazlar

Her faz: API çağrısı → sorgu/mutasyon → yetki hesabı → arayüz (tasarım birebir) → test → eksik raporu → Codex. Sonraki faz, öncekinin PR'ları `main`'de ve CI yeşilken açılır.

| Faz | Kapsam | Tasarım ekranları | v1 |
|---|---|---|---|
| **F0** temel | Token geçişi, `shared/ui` çekirdeği, rota kataloğu, kapsam yaşam döngüsü + standing + capability iskeleti, yazma protokolü, etkili işlem onayı, açık durumlar, kabuk (kenar menüsü + Kenar-Secici + üst çubuk + tema), boyut kapıları, design-stub + eksik kaydı; **ayrı çıkışlı** Gantt kütüphane pilotu | Sidebar, Kenar-Secici, üst çubuk, A1–A4 tema | ✓ |
| **F1** görevler | Liste (`listProgramWorkItems`), ayrıntı paneli, alt görev, not, dosya, durum geçişi; yazma protokolünün ilk tüketicisi; sade ana sayfa | 03, 03'ün açık teması, 01 (sade) | ✓ |
| **F2** organizasyon + program | Kullanıcılar, kişisel takip, koordinatörlükler (düz), departman/üyelik/koordinatör, programlar ("Teknofest ve sezon"), katılım bağı, dönem aktarımı, sıfırlama | 05, 05b, 08, 08b | ✓ |
| **F3** zaman çizelgesi | Gantt üç yüz, tarih talepleri, uzatma, bağımlılıklar | 03c, 03d | ✓ |
| **F4** toplantılar | Liste, detay, gündem, notlar, nottan görev, silinenler; video (W7) ayrı | 09, 09b, 09c (09d/09e statik, KR-26) | ✓ |
| F5 arşiv | Klasörler, dosyalar, ZIP, silinenler/geri yükleme | 06, 07, 12 (silinen kayıtlar) | |
| F6 rapor/pano | Yönetici panosu tam, iş yükü, PDF | 01 (tam) | **KAPANDI (2026-11-14; açıldı 2026-11-13; PR #119–#134, Codex 3 tur UYGUN, kapanış PR'ı ile birleşir) (P46–P53):** raporlar ayrı sayfa değil, kendi ekranlarında (06 Arşiv, 09b/K7, 03/K3, 05) + 01f/01g önizleme; K1/Ü1 ana sayfaları ve rol menüleri dahil; 01b F6 dışı; backend paketi açılmaz ([web-6](../yurutme/web-6/README.md)) |
| F7 sohbet + bildirim | Sohbet, SSE, okunmamış, bildirimler, Web Push | 10, 10b, 10c | **AÇILDI 2026-11-14 (P54; backend dursun)** ([web-7](../yurutme/web-7/README.md)). Kapsam (P54): yalnız sohbet + bildirimler (zil paneli canlı, Mesajlar menüsü + rozet, SSE `shared/sse`; Web Push **dahil** (P58, ürün sahibi 2026-11-14; O2b son işçisi W159); Takvim, Kurumsal hafıza, profil, Ü2–Ü7/K2–K8, Asistan sonraki faz; pin `v0.15.0-api` değişmez, backend paketi açılmaz |
| F8 asistan | F46 paneli (rota kataloğu) | Ana sayfa "Asistan" | |
| sonra | Yeni modüller (backend fazıyla) | 01b, 11–11e, Takvim, Kurumsal hafıza, Simülasyon, Bütçe/Talep | |

**F6 durumu (2026-11-14): KAPANDI.** Kod main'de (PR #119–#134, son kod `c18d4ab`, 664 dosya / 4633 test); Codex 3 tur (KOŞULLU UYGUN → KOŞULLU UYGUN → UYGUN, [hüküm](../reviews/WEB-6-codex.md)); kapanış PR'ı ile birleşir. Backend paketi açılmadı ("backend dursun", P46): BE-120/122…141 açık, ekranda statik/devre dışı ([rapor-F6](../backend-eksikleri/rapor-F6.md), [web-6](../yurutme/web-6/README.md)). **F7 AÇILDI (2026-11-14; kullanıcı: "F7'yi aç, backend dursun"):** kapsam, sıra ve açık sorular (P58, P60) [web-7](../yurutme/web-7/README.md)'de. (Aşağıdaki F5 notu tarihsel kayıttır; F5 KAPANDI 2026-11-13, menü rol borcu F6'da W141 ile kapandı.)

**F5 durumu (2026-11-12):** uygulandı (#102–#113; W127 #114 birleşti `8abcb3b`); Codex nihai kapısı ve kapanış PR'ı bekliyor ([kayıt](../yurutme/web-5/ilerleme.md)). **Borç:** kenar menüsü tanımına rol bazlı sıra/etiket (örn. üye "Dosyalarım") — menü tanımı rol bilgisi taşımıyor. Yönetici arşivi BE-072 için geçici yolda ([rapor-F5](../backend-eksikleri/rapor-F5.md)). F6 AÇILMAZ — kullanıcı onayı.

## 5. Backend eksikleri

Kayıt: [`../backend-eksikleri/`](../backend-eksikleri/) — tek satır = tek eksik (`BE-NNN`), ekran, tasarım öğesi, eksik uç/alan, şimdilik ne gösteriliyor, ilgili GAP/KR, boyut, durum. Web bu depodan backend'e yazmaz (CLAUDE.md); eksik, yönetim deposu sürecinde backend fazı olarak kapanır, yeni API etiketi + pin yükseltmesiyle web bağlar ve satırı "bağlandı" yapar.

## 6. Bağımlılıklar (karar web planında verilmez)

GAP-033 (programa bağımsız üyelik), GAP-036 (Türkçe I/ı katlama), ORGANIZATION-K18 (rol kaybında görev devri), silinmiş departman görevlerinin görünürlüğü, GAP-107; ADR-0024 (alt görev Gantt dışı — tasarım 03d bunu aşar, statik + BE kaydı); REPORTING-K01 (pano yalnız yönetici); KR-26 (video).
