# WEB-4 ilerleme

Koordinatör her oturum kapanışında bir kayıt ekler; sonraki oturum buradan başlar. Uygulayıcılar bu dosyaya yazmaz.

**F4 geçişi 2026-11-11 onaylandı.** O1 #88 ve O2a #89 ile kapandı; O2b aktif. F4 kapanmış değildir.

## Durum

| Oturum | Durum | main hash |
|---|---|---|
| Pin aşaması (WEB-P, `v0.15.0-api`) | **KAPANDI 2026-11-10** — Codex tur 2 KOŞULLU UYGUN (HEAD `1bd80b6`); ayrıntı aşağıda "Pin aşaması" | `1bd80b6` |
| O1 — F4 kabul tablosu (09) | **Kabul** (2026-11-10: E-09-01…84 dolu; F4-S1…S10 ürün sahibi cevapladı → `../../ekranlar/ortak-kurallar.md` §12 P21–P30) | — |
| O2a — Toplantılar veri katmanı (W101) | Birleşti: #89, üç CI denetimi SUCCESS | `d3e3263` |
| O2b — Liste, detay + gündem, notlar, katılımcılar, pencereler (W102–W106) | Aktif: W102–W104 PR kapısında; W105/W106 uygulama ve doğrulamada | `d3e3263` |
| O3 — Entegrasyon turu (W107) | Bekliyor | — |
| O4 — Kapanış | Bekliyor | — |

## Devralınan (WEB-3 O4)

- **Ürün onayı:** **F4-S1…S10 cevaplandı (2026-11-10)** → `../../ekranlar/ortak-kurallar.md` §12 P21–P30 (+ P31 avatar renkleri); 09 kabul tablosu güncellendi. **Güncelleme:** F4 geçiş onayı 2026-11-11 verildi.
- **Kapı:** F3 KAPANDI 2026-11-10 — Codex tur 2 KOŞULLU UYGUN (HEAD `768f22b`; `../../reviews/WEB-3-codex.md`); `dogrulama-F3.md` tamam. WEB-3'ten açık "geçici kabul": 03c E-03C-27, 41 (görsel nihai kabul, ürün sahibi onayı) — F4 borcu, F4'ü bloklamaz. **F4'e aktarılan borçlar:** Ö-07 gerçek ekran okuyucu, K-04 05 odak dönüşü, E-03C-27/41 görsel nihai kabul. **Pin aşamasına devredilen koşullar (F4'ten önce, ilk iş):** Codex CX-F3-Ö-03 (ARIA alt satır `aria-rowindex`/sıra), Ö-04 (sürükleme ön okumasında kapsam değişimi), Ö-08 (ortak `useProtectedMutation` başarı bekleyişinde sahip yarışı); kabul ölçütleri `../../backend-eksikleri/rapor-F3.md` §2 ve `../../reviews/WEB-3-codex.md` tur 2.
- **Backend / F4 ön koşulu — pin aşaması (YAPILDI: `api-pin.json` `v0.15.0-api`; WEB-P, Codex tur 2 KOŞULLU UYGUN; pin aşaması kapandı):** `v0.13.0-api`…`v0.15.0-api` yayımlandı; ürün sahibi: F3 `v0.11.0-api` ile kapanır, pin yükseltmesi **F3 kapandıktan sonra F4'ten önce ayrı aşama** (kendi Codex kapısı; `../../backend-eksikleri/rapor-F3.md` §2). Backend notları: kesilme `X-Result-Truncated` başlığından; uzatma tekrarında `replayed:true`, `dates_revision` ilk sonuç; aktarım kimliği `fields[field=account_id]` `message`. `../../backend-eksikleri/rapor-F3.md` §4 — Paket 4.1 (BE-021) + BELGE (BE-036 madde 7); 09 tablosunun "Şimdilik" yolları pin aşamasından sonra yeniden okunur.
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

**Bağlanan BE'ler:** 18 bağlandı (BE-001, 003, 011, 012, 019, 038, 041, 042, 043, 044, 045, 049, 050, 051, 052, 053, 056, 107; BE-003 WP2a çekirdek sayaçlar + WP2d rozetler ortak satır — koordinatör ara kaydındaki "19" BE-003'ün iki grupta sayılmasından doğan sayım hatasıydı). **BE-036 kısmen** (belge paketi; madde 7 toplantı kuralları hâlâ açık, kayıtta `açık`). Satır satır web adımları: `../../backend-eksikleri/rapor-F3.md` §2.

**WP3 entegrasyon + gerçek imaj:** `dogrulama-pin.md` — tam kapı iki koşuda 414 dosya / 3020 test, kararsız test yok; 26 `pin-*` senaryo; H-1 (kenar menüsü `shell-counts` geçersizleme), H-2 (Admin rozeti görev/tarih yazmasında yenilenir; ortak-kurallar §6'ya istisna yazıldı), H-3 (`useUser` yapışkan `enabled`), H-4 (`listUsers` boş sayfa döngüsü). Gerçek imaj (v0.15 backend + web imajı, 192 ölçüm = 4 kişi × 8 ekran × 3 genişlik × 2 tema): taşma 0, CSP 0, `pageerror` 0, API ≥ 400 0; 20 gerçek yazma akışı.

**Codex hükmü:** tur 1 (`0cba31a`) UYGUN DEĞİL (CX-P-E-01) → WP4a + WP4b → tur 2 (`1bd80b6`) **KOŞULLU UYGUN**; E-01 kapandı. Tam metin `../../reviews/WEB-P-codex.md`. Not: work anahtarlı tekrarlar K5 ihlali değildir; genel "tek tekrar" politikası ayrı kapsam kararı.

**PİN AŞAMASI KAPANDI 2026-11-10** (Codex KOŞULLU UYGUN). `web-4/README.md` ön koşul (4) karşılandı.

**F4'e devredilenler** (F4'ü bloklamaz; F4 içinde izlenir ve kapatılır):

1. **Codex tur 2:** Ö-02 (yalnız mercek değişimi ve geç gelen eski 409'da teklif düşmeli, eski teklif görünmemeli); Ö-05/K-04 (gerçek 390/1024/1440 yerleşiminde tutamaç hit-test'i, klavye/odak, gerçek watcher/scope temizleme testi); K-02 (kalan çelişkili kabul metinleri: `05-kullanicilar/README.md` satır 39/40/55 "ret/aranmaz/toplam üretilmez", `ortak-kurallar.md` eski pano yasağı cümlesi; `dogrulama-pin.md` eski G-3 kaydı yeni kanıtla ilişkilendirilir); Ö-03 ek güvence (alt görev yaz→satır kapat/aç; Admin değiştir→pano sayısı senaryoları). Work tekrar politikası: ayrı kapsam kararı.
2. **`dogrulama-pin.md` kusurları:** G-1 (yönetim rotasında yetkisiz yönlendirme sessiz, bildirim yok), G-2 (kısa kod `KOD-–`, BE-005 açık), G-4 (bilgi: yazma hız sınırı 429 backend davranışı); G-3 (03c panel tutamaç örtmesi) Ö-05 ile birlikte izlenir.
3. **Gerçek ekran okuyucu (VoiceOver) kabulü** (CX-F3-Ö-07; F3'ten devralınan, hâlâ yapılmadı).
4. **K-04:** 05 panel kapanışında odak satıra dönüşü.
5. **E-03C-27/41:** 03c görsel nihai kabul (ürün sahibi onayı).
6. **Ürün kararlarının uygulanması:** 09 kabul tablosu F4-S1…S10 (P21–P30); özellikle S4 ("Kişiler" daveti: O1 yeterlilik ve BE-067 sınırı) ve S9 (`listMeetings` `from`/`to`).

## 2026-11-11 — O1 ve devredilen borçlar

F4 geçişi ürün sahibince onaylandı. W100 O1: [backend yeterlilik](o1-backend-yeterlilik.md); v0.15 pin korunur, koordinatör adayları BE-067 ile sınırlı, özel seçicinin açılmış çizimi bulunamadı. Önceki oturumda commit ve GitHub erişimi engelliydi. Bu oturumda GitHub API/uzak main erişimi ve W100 commit işlemi doğrulandı (`6461e4f`); PR/CI ve birleşim henüz açık.

- W108 ayrı borç işçisi: Ö-02 aktarım mercek/geç 409, 05 K-04 odak, G-1/G-2.
- W109 ayrı borç işçisi: 03c Ö-05/K-04 gerçek yerleşim/temizleme ve Ö-03 ek entegrasyon.
- W100 K-02 belge kalemleri tamamlandı: 05 rol/arama/toplam kabul kanıtları, §6 pano kararının tarihçesi ve G-3 ile WP4b kısmi kanıtı ilişkilendirildi. Ö-05/K-04 gerçek hit-test ve temizleme borcu W109’da açık; belge düzeltmesi bu davranışları doğrulamaz.
- W107 gerçek person rolleri, URL + filtre + özel seçici entegrasyonuna sahip.
- O4: G-4 429 tanığı, VoiceOver ve E-03C-27/41 kullanıcı kanıtı bekleniyor; otomatik doğrulandı sayılmaz.

O1 denetimi: Node 24.9.0 ve aynı `package.json`/kilit dosyasına sahip ana çalışma ağacının kurulu bağımlılıkları kullanılarak `pnpm lint` ve değişen belgelerin Prettier kontrolü geçti; `git diff --check` temiz. Önceki çevrimdışı kurulum `@primeuix/themes` 2.0.3 önbellekte olmadığından ve varsayılan Node 22.12.0 proje gereksiniminin altında olduğundan başarısızdı. Önceki Git yazma ve GitHub erişim engelleri bu oturumda tekrarlanmadı. W100 belge denetimi ve commit tamamlandı; son tutarlılık düzeltmesinin ardından O1 PR, CI ve yeşil birleşim, sonra W101 gelir.

### K-02 belge takibi

05 kabul tablosu pinli sunucu rolü, e-posta araması ve toplam kanıtlarına hizalandı; §6 eski pano yasağı tarihsel ayrıldı; G-3 tarihsel gözlemi WP4b kısmi koruması ve açık Ö-05/K-04 gerçek yerleşim borcuna bağlandı. Bu belge kalemleri tamamlandı; O1 commit/PR/CI kapısı açık kalır.

## 2026-11-11 — O1 birleşimi ve O2a açılışı

W100 #88 `17ceed7` birleşti; PR başı `192805b`, CI [42997202531](https://github.com/caliskan421/nizam.io--frontend/actions/runs/42997202531) üç denetim COMPLETED+SUCCESS, MERGED doğrulandı. İlk koşu 42992979250 kayıt durumundaki tipografik apostrof nedeniyle 1 testte kırmızıydı; W100 `192805b` yalnız kayıt biçimini düzeltti, hedefli 30 test geçti; test/parser gevşetilmedi. O1/K-02 belge işi tamam; S3 özel seçici görsel kabulü ve BE-067 kapsam sınırı açık.

O2a W101 Terra medium işçisi başladı; ayrı worktree `nizam.io--frontend-wt-w101`, dal `web4/o2-w101`, kalıcı istem Git worktree yönetim dizininde W-PROMPT.md. O2b W101'in yeşil birleşimini bekler. W108/W109 ve O4 gerçek kullanıcı kanıtı borçları korunur; F5 açılmaz.


## 2026-11-11 — O2a W101 birleşimi

PR #89 `d3e3263`: üç CI denetimi COMPLETED+SUCCESS, MERGED doğrulandı. Yerel typecheck/lint/format, 437 dosyada 3083 test, build/gen:check geçti. Üretim+Caddy CSP ile iki boş iskelet rota × üç genişlik × iki tema: 12 ölçüm, taşma/CSP/pageerror 0; dar menü odak/tıklama doğrulandı. Bu yalnız O2a iskelet kabulüdür. O2b W102–W104 ayrı dallarda başladı; W105/W106 sırada. S3 özel seçici tasarımı hâlâ eksik. Nottan görev sonrası sorgu geçersizleme testli; görsel rozet/pano önce-sonra kanıtı W107 girdisidir.

## 2026-11-11 — O2b ara kayıt ve S3 kararı

Kullanıcı özel kişi seçicisinin açılmış çizimi yerine koordinatöre karar yetkisi verdi. Gerçek Claude Opus 5.5 ile iki tur salt okunur değerlendirme yapıldı; [S3 kararı](s3-kisi-secici-karari.md) ve ortak-kurallar P32 bağlayıcıdır. Tasarım bekleme sınırı bu türetilmiş özel modal kararıyla çözüldü; uygulama/görsel/entegrasyon kapıları ayrıca geçilecektir. BE-067 aday kapsamı açık kalır.

W102 `9c77a64` PR #90: tam kapı 446 dosya/3101 test ve üretim+Caddy 6/6 görsel koşul yeşil. W103 `bb338c8` PR #91: 455 dosya/3134 test ve 6/6 koşul yeşil. W104 `5aababb` PR #92: 463 dosya/3157 test ve 6/6 koşul yeşil. Bu ara kayıt anında CI/birleşim zinciri açık; yerel kapı CI yerine geçmez. Kanıtlar `.git/koordinator/web4-w102`, `web4-w103`, `web4-w104` altında. W105/W106 özel seçici, katılımcı/yan kart ve form/silinenler işinde; W108 ayrı borç dalında başladı, W109 hazırlanmış fakat başlamadı.

- TASLAK W102: `MeetingsPage.test.ts` form bileşeni; W107 gerçek oluşturma/düzenleme/silinenler entegrasyonu.
- TASLAK W103: `MeetingDetailPage.test.ts` ve `MeetingDetailPage.delete.test.ts` içindeki MeetingNotes, MeetingPeople, MeetingSide, MeetingForm, MeetingConvert; W107 gerçek alt bileşen senaryoları.
- W104: gerçek nottan görev → görev listesi/kenar menüsü rozeti/pano önce-sonra W107'de. Geçersizleme haritası testi bu kabulün yerine geçmez.
- O3, O4, nihai read-only Sol kapısı, gerçek VoiceOver ve kullanıcı görsel onayı açık. F5 açılmadı.

## 2026-11-11 — O2b yerel teslimler ve CI altyapı engeli

W105 `f465832` PR #94: özel kişi seçici ve kişi/yan bilgi kartları tamamlandı; typecheck/lint/format, 466 dosya/3173 test, gen:check ve build geçti. Gerçek Caddy+Chromium altı genişlik/tema koşulunda taşma/CSP/pageerror sıfır; 390×600 ve 20 adayla tek modal kaydırma alanı, seçim ve odak dönüşü doğrulandı. Kişi ve yan bilgi kartları tasarımdaki sağ sütuna bağlandı. S3 çizimi bulunmadı; P32 kararına uygun türetilmiş yüzeydir.

W106 `c2ae041`: oluşturma/düzenleme, koordinatörlük kümesi, silinenler tamamlandı. Geçmiş tarih değişmediyse yalnız başlık PATCH, gün değişimi, kurulum saat dilimi, Unicode başlık, K sahip departmanı, restore409 yenilemesi ve canlı departman kodu sınandı. Tam test paketi `ce20720` üzerinde 470 dosya/3185 test; sonraki yerleşim ve kabul düzeltmelerinde `1ee3236` 14 dosya/45 hedefli test, `c2ae041` 7 dosya/18 hedefli test ve son typecheck/tam lint/format/gen/build geçti. Son üretim+Caddy altı görünümde taşma/CSP/pageerror sıfır; gerçek eski tarih title-only PATCH, EKP kodu, nested seçici odağı ve oluşturma/silinenler/departman pencereleri doğrulandı. Nihai PR/CI kapısı açık.

W108 `f6304b6` PR #93: aktarım mercek/geç409, 05 panel odak/owner yarışı, G1 yetkisiz rota bildirimi, G2 nötr kısa kod düzeltildi. Yerel typecheck/lint/format, 438 dosya/3092 test, gen/build geçti. Dört rota × üç genişlik × iki tema ve K/Ü üç yönetim rotasında tek bildirim, iç modal Esc ve panel odağı gerçek tarayıcıyla sınandı. W109 gerçek Gantt yerleşimi/cleanup ve ek entegrasyon işinde; henüz teslim yok.

**Birleşim engeli:** #90/#91/#92 ilk ve ikinci CI denemelerinde kod/test ve Docker imajı denetimleri geçti, fakat Ubuntu paket sunucularının DNS çözümlemesi başarısız olduğundan Playwright bağımlılık kurulumu APT exit100 verdi; gerçek backend tarayıcı testleri hiç başlamadı. Başarılı #89 aynı runner imajı `ubuntu-26.04 / 20261101.186`, workflow, pin ve kilit dosyasıyla 4 E2E testini geçmiştir; kaynak veya sürüm uyumsuzluğu kanıtı yok. Test atlama/kapı gevşetme yapılmadı. Yeni PR'ların CI sonuçları ayrıca beklenecek. Bu kayıt anında O2b PR'ları birleşmedi; O3/W107 ve O4 açılmadı, F5 açılmadı.

Ham yerel kanıtlar ve CI karşılaştırma günlükleri `.git/koordinator/web4-w105`, `web4-w106`, `web4-w108` ve aynı dizindeki CI günlüklerindedir. Önceki Apple Git Xcode lisans hataları Homebrew Git PATH ile giderildi; bu ortam hataları başarılı kapı diye kaydedilmedi. Gerçek VoiceOver ve E-03C-27/41 kullanıcı görsel onayı açık.
