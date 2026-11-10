# WEB-4 ilerleme

Koordinatör her oturum kapanışında bir kayıt ekler; sonraki oturum buradan başlar. Uygulayıcılar bu dosyaya yazmaz.

**F4 ürün sahibinin uyarısı/onayı olmadan AÇILMAZ.** Onay henüz verilmedi (2026-11-10 itibarıyla); bu dosya WEB-3 O4'te hazırlanan iskelettir.

## Durum

| Oturum | Durum | main hash |
|---|---|---|
| Pin aşaması (WEB-P, `v0.15.0-api`) | **KAPANDI 2026-11-10** — Codex tur 2 KOŞULLU UYGUN (HEAD `1bd80b6`); ayrıntı aşağıda "Pin aşaması" | `1bd80b6` |
| O1 — F4 kabul tablosu (09) | **Kabul** (2026-11-10: E-09-01…84 dolu; F4-S1…S10 ürün sahibi cevapladı → `../../ekranlar/ortak-kurallar.md` §12 P21–P30) | — |
| O2a — Toplantılar veri katmanı (W101) | Bekliyor (F4 onayı yok) | — |
| O2b — Liste, detay + gündem, notlar, katılımcılar, pencereler (W102–W106) | Bekliyor | — |
| O3 — Entegrasyon turu (W107) | Bekliyor | — |
| O4 — Kapanış | Bekliyor | — |

## Devralınan (WEB-3 O4)

- **Ürün onayı:** **F4-S1…S10 cevaplandı (2026-11-10)** → `../../ekranlar/ortak-kurallar.md` §12 P21–P30 (+ P31 avatar renkleri); 09 kabul tablosu güncellendi. **Hâlâ açık:** F4 geçişi için ürün sahibinin açık "F4'e geç" onayı.
- **Kapı:** F3 KAPANDI 2026-11-10 — Codex tur 2 KOŞULLU UYGUN (HEAD `768f22b`; `../../reviews/WEB-3-codex.md`); `dogrulama-F3.md` tamam. WEB-3'ten açık "geçici kabul": 03c E-03C-27, 41 (görsel nihai kabul, ürün sahibi onayı) — F4 borcu, F4'ü bloklamaz. **F4'e aktarılan borçlar:** Ö-07 gerçek ekran okuyucu, K-04 05 odak dönüşü, E-03C-27/41 görsel nihai kabul. **Pin aşamasına devredilen koşullar (F4'ten önce, ilk iş):** Codex CX-F3-Ö-03 (ARIA alt satır `aria-rowindex`/sıra), Ö-04 (sürükleme ön okumasında kapsam değişimi), Ö-08 (ortak `useProtectedMutation` başarı bekleyişinde sahip yarışı); kabul ölçütleri `../../backend-eksikleri/rapor-F3.md` §2 ve `../../reviews/WEB-3-codex.md` tur 2.
- **Backend / F4 ön koşulu — pin aşaması (YAPILDI: `api-pin.json` `v0.15.0-api`; WEB-P, Codex pin kapısı tur 1 düzeltmeleri sürüyor):** `v0.13.0-api`…`v0.15.0-api` yayımlandı; ürün sahibi: F3 `v0.11.0-api` ile kapanır, pin yükseltmesi **F3 kapandıktan sonra F4'ten önce ayrı aşama** (kendi Codex kapısı; `../../backend-eksikleri/rapor-F3.md` §2). Backend notları: kesilme `X-Result-Truncated` başlığından; uzatma tekrarında `replayed:true`, `dates_revision` ilk sonuç; aktarım kimliği `fields[field=account_id]` `message`. `../../backend-eksikleri/rapor-F3.md` §4 — Paket 4.1 (BE-021) + BELGE (BE-036 madde 7); 09 tablosunun "Şimdilik" yolları pin aşamasından sonra yeniden okunur.
- **F3 borçları (F4'ü etkilemez, izlenir):** 05 panel kapanışında odak satıra dönmez; ekran okuyucu gerçek cihaz denemesi yapılmadı; `GanttView.vue` 250 satır sınırında; 03d alt görev bloğu kısa kayma (BE-051); W97b (12) kararı.
- **Yeni KESİN kurallar:** [ortak-sozlesme.md](ortak-sozlesme.md) 28–32 (bağlama noktası istemde adıyla, türev sayaç/rozet geçersizleme, dar ekran etkileşimli duman, tek kaynak alan, sınırdaki dosya/test süresi).

## Kayıtlar

### Pin aşaması (WEB-P, 2026-11-10) — PİN AŞAMASI KAPANDI 2026-11-10

Pin: `api-pin.json` **`v0.15.0-api`** (`gen:api`: 194 hata kodu, 189 operasyon). Taban `f3b78b2` (F3 kapanışı) → `main` `1bd80b6`. Hüküm: Codex tur 2 **KOŞULLU UYGUN** (`../../reviews/WEB-P-codex.md`).

**PR listesi** (`git log --first-parent f3b78b2..HEAD`):

| PR | Birleşim | İş |
|---|---|---|
| #77 | `8b9b2c4` | WP1: pin `v0.15.0-api`, `gen:api`, derleme uyumu, envanter; `e2e/backend/up.sh` v0.15 Dockerfile'ını denetler (yeniden yazmaz) |
| #78 | `d797855` | WP0: Codex F3 devri — Ö-08 (`useProtectedMutation` başarı bekleyişinde sökülen sahip), Ö-04 (sürükleme gönderimi kapsam değişimini denetler), Ö-03 (alt görev satırı `aria-rowindex`) |
| #79 | `15d4032` | WP2d: BE-001 program kısa ad/renk (okuma + yazma), BE-003 menü rozetleri K/Ü merceğinde |
| #80 | `1989391` | WP2a: BE-003 çekirdek sayaçlar (`countProgramWorkItems`), BE-038 kişi süzgeci (`assignee_account_id`), BE-036 kısmen |
| #81 | `3bbaec6` | WPf: `password.test` kararsızlığı (testler arası geç istek sızıntısı) kök düzeltmesi |
| #82 | `77ff9bb` | WP2b: BE-052/051/053/019/056 (03c Gantt satır alanları, `X-Result-Truncated`, anahtarlı tek tekrar) |
| #83 | `6f48795` | WP2c: BE-107/050/049/011/041/042/043/044/045/012 (kullanıcı listesi, hesap durumu, aktarım, koordinatörlük oluşturma) |
| #84 | `0cba31a` | WP3: entegrasyon (26 `pin-*` senaryo, H-1…H-4 düzeltmesi) + gerçek imaj tanığı (`dogrulama-pin.md`) |
| #85 | `4413119` | WP4b (Codex tur 1): Ö-03 geçersizleme haritası, Ö-05 panel örtmesi, K-01 §6 belge, K-02 kanıt/yorum, K-03 tek sayaç okuması |
| #86 | `1bd80b6` | WP4a (Codex tur 1): E-01 retry/confirm sahip yaşamı, Ö-01 BE-050 tek tekrar, Ö-02 aktarım bağlam/gövde, Ö-04 `useDateSend` kapı sırası |

**Bağlanan BE'ler:** koordinatör kaydına göre 19 bağlandı; `kayit.md`'de `bağlandı` durumlu 18 satır var (BE-001, 003, 011, 012, 019, 038, 041, 042, 043, 044, 045, 049, 050, 051, 052, 053, 056, 107) — 19. kalemin kimliği kayıtta ayrıca doğrulanmalı (F4 açılışı). **BE-036 kısmen** (belge paketi; madde 7 toplantı kuralları hâlâ açık, kayıtta `açık`). Satır satır web adımları: `../../backend-eksikleri/rapor-F3.md` §2.

**WP3 entegrasyon + gerçek imaj:** `dogrulama-pin.md` — tam kapı iki koşuda 414 dosya / 3020 test, kararsız test yok; 26 `pin-*` senaryo; H-1 (kenar menüsü `shell-counts` geçersizleme), H-2 (Admin rozeti görev/tarih yazmasında yenilenir; ortak-kurallar §6'ya istisna yazıldı), H-3 (`useUser` yapışkan `enabled`), H-4 (`listUsers` boş sayfa döngüsü). Gerçek imaj (v0.15 backend + web imajı, 192 ölçüm = 4 kişi × 8 ekran × 3 genişlik × 2 tema): taşma 0, CSP 0, `pageerror` 0, API ≥ 400 0; 20 gerçek yazma akışı.

**Codex hükmü:** tur 1 (`0cba31a`) UYGUN DEĞİL (CX-P-E-01) → WP4a + WP4b → tur 2 (`1bd80b6`) **KOŞULLU UYGUN**; E-01 kapandı. Tam metin `../../reviews/WEB-P-codex.md`. Not: work anahtarlı tekrarlar K5 ihlali değildir; genel "tek tekrar" politikası ayrı kapsam kararı.

**PİN AŞAMASI KAPANDI 2026-11-10** (Codex KOŞULLU UYGUN). `web-4/README.md` ön koşul (4) karşılandı.

**F4'e devredilenler** (F4'ü bloklamaz; F4 içinde izlenir ve kapatılır):

1. **Codex tur 2:** Ö-02 (yalnız mercek değişimi ve geç gelen eski 409'da teklif düşmeli, eski teklif görünmemeli); Ö-05/K-04 (gerçek 390/1024/1440 yerleşiminde tutamaç hit-test'i, klavye/odak, gerçek watcher/scope temizleme testi); K-02 (kalan çelişkili kabul metinleri: `05-kullanicilar/README.md` satır 39/40/55 "ret/aranmaz/toplam üretilmez", `ortak-kurallar.md` eski pano yasağı cümlesi; `dogrulama-pin.md` eski G-3 kaydı yeni kanıtla ilişkilendirilir); Ö-03 ek güvence (alt görev yaz→satır kapat/aç; Admin değiştir→pano sayısı senaryoları). Work tekrar politikası: ayrı kapsam kararı.
2. **`dogrulama-pin.md` kusurları:** G-1 (yönetim rotasında yetkisiz yönlendirme sessiz, bildirim yok), G-2 (kısa kod `KOD-–`, BE-005 açık), G-4 (bilgi: yazma hız sınırı 429 backend davranışı); G-3 (03c panel tutamaç örtmesi) Ö-05 ile birlikte izlenir.
3. **Gerçek ekran okuyucu (VoiceOver) kabulü** (CX-F3-Ö-07; F3'ten devralınan, hâlâ yapılmadı).
4. **K-04:** 05 panel kapanışında odak satıra dönüşü.
5. **E-03C-27/41:** 03c görsel nihai kabul (ürün sahibi onayı).
6. **Ürün kararlarının uygulanması:** 09 kabul tablosu F4-S1…S10 (P21–P30); özellikle S4 ("Kişiler" daveti: `invite_mode` yeterliliği F4 açılışında doğrulanır) ve S9 (`listMeetings` `from`/`to`).
