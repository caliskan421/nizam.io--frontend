# Pin aşaması (v0.15.0-api) doğrulaması — entegrasyon senaryoları ve gerçek imaj tanığı (WP3)

- **HEAD:** `dcca9d4` (dal `webp/wp3`, taban main `6f48795`; WP2c #83 birleşimi). Web imajı bu HEAD'den üretildi (`git diff dcca9d4 HEAD` boş).
- **Tarih:** 2026-11-10. Sözleşme pini `v0.15.0-api` (`gen:api`: 194 hata kodu, 189 operasyon).
- **Kod değişikliği:** İş 2'de bulunan 4 hata düzeltildi (bkz. §3). İş 3'te kusur DÜZELTİLMEDİ.
- Görüntüler ve betikler git'e girmez: `nizam.io--frontend/.git/koordinator/dogrulama-pin/` (194 PNG `shots/`, betikler ve ham JSON `betik/`).

## 1. Tam kapı

Önce main (`6f48795`), sonra bu dalın sonu. Test paketi iki kez koşuldu; kararsız test **görülmedi** (her iki koşuda aynı sayı, hata yok; makine yükü ~5).

| Komut | main `6f48795` | dal `dcca9d4` |
|---|---|---|
| `typecheck` | geçti | geçti |
| `lint` (`--max-warnings=0`) | geçti | geçti |
| `format:check` | geçti | geçti |
| `gen:check` | geçti (`v0.15.0-api`, `git diff` boş) | geçti |
| `test` koşu 1 | 408 dosya / 2992 test geçti (51 sn) | 414 dosya / 3020 test geçti (58 sn) |
| `test` koşu 2 | 408 / 2992 geçti | 414 / 3020 geçti (62 sn) |
| `build` | geçti (`index` gzip 60,2 kB) | geçti |

Fark +28 test: 26 `pin-*.test.ts` senaryosu, 1 `query-keys` (shell-counts), 1 `users` (boş sayfa/hata).

## 2. Entegrasyon senaryoları (`src/app/__tests__/integration/pin-*.test.ts`)

Üretim kök + router + kabuk + durumlu sahte backend, taslak bileşen yok. Sahte backend v0.15'e yaklaştırıldı: `countProgramWorkItems` (liste ile aynı görünürlük ve `department_id`/`assignee_account_id` süzgeci, türetilmiş `is_overdue`), `transitionWorkItem`/`ownStatusWorkItem`, `readProgram` + PROGRAM-K46 doğrulaması (boş kısa ad 422, yalnız `null` temizler), `createDepartment`/`linkDepartment` isteğe bağlı `Idempotency-Key` (200 tekrar, 409 reused, 422 geçersiz anahtar) ve yanıt düşürme kancası, `createUser` aktarım teklifi (`transfer_available` üç girdi + `transfer_account_id`).

| Dosya | Test | Kapsam |
|---|---|---|
| `pin-sayaclar` (a) | 7 | Koordinatör merceği: durum geçişi, görev oluştur, tarih talebi; Üye merceği; Admin merceği (pano rozeti): talep onayı ve görev yazması; yönetici-Koordinatör merceği. Her yazmadan sonra kenar menüsü rozeti ve 03 sekme/talep sayaçları aynı sunucu sayısını söyler. |
| `pin-kisi` (b) | 3 | `?kisi=` süzgeci ↔ 05b ↔ 05 paneli aynı kişide aynı sayılar; durum geçişi ve "Görev ata" sonrası üçü birlikte güncel. |
| `pin-kullanicilar` (c) | 5 | Program değişiminde K/Ü sayaçları daralır, Tümü/Admin kapsamsız; hesap kapat/aç: panel, liste, sayaç; 05b hesap sekmesi. |
| `pin-koordinatorluk` (d) | 6 | `department_exists` (katalogda var → bağla; bu programda var → yalnız bilgi); oluşturma ve bağ yanıtı kaybında AYNI anahtarla tek tekrar; 05 aktarım teklifi ve onayı; hedef ekipte varken teklif yok. |
| `pin-zaman` (e) | 4 | Tam 200 kalemde başlık/uyarı yok, 201'de var (BE-019); Gantt uzantı kümesi = 03 talep süzgeci = rozet, karar sonrası birlikte küçülür; uzatma yanıt kaybı: aynı anahtar, tek uzatma, sonraki yazma güncel `dates_revision` ile. |
| `pin-program` (f) | 1 | Program kısa ad/renk değişir → kapsam kartı ve program menüsü avatarı; temizleme `null` gönderir, avatar türetilene döner. |

## 3. Bulunan ve düzeltilen hatalar

| # | Önem | Hata | Düzeltme (dosya) | Neden |
|---|---|---|---|---|
| H-1 | **orta** | Kenar menüsü K/Ü rozet sorgusu (`['work-items','shell-counts',…]`) görev/tarih yazmasında yenilenmiyordu: 03 sayaçları (`counts`) yenilenir, rozet 30 sn bayat kalırdı (durum geçişi, görev oluşturma, tarih talebi). | `src/shared/http/query-keys.ts` (`workItems.counts` süzgeci `shell-counts`'ı da kapsar) + `query-keys.test.ts` | Yorum "§6 geçersizlemesi rozetleri de yeniler" diyordu; filtre anahtar adı yüzünden eşleşmiyordu. WP2d (rozet) ve WP2a (sayaç) ayrı ayrı doğruydu, birleşik ağaçta kaçıyordu. |
| H-2 | **orta** | Admin merceği rozeti (pano `overdue_tasks`/`pending_date_changes`) görev/tarih yazmasında bayat: yönetici (Elektronik koordinatörü) görevi tamamlayınca 03 "Geciken" 0 olur, rozet kalırdı. | `src/shared/http/query-keys.ts` (`report` = organizasyon yazmaları + görev + tarih + devir yazmaları) | Rozet panodan gelir; 03 sayacı sunucu sayacından. Bedeli: görev yazmasında bir `reportDashboard` okuması (yalnız pano açıkken/etkin gözlemci varken). Önceki karar "odakta tazele" idi. |
| H-3 | **orta** | `useUser` (readUser) gözlemcisi veri önbelleğe düşünce kendini kapatıyordu (`enabled: satır yoksa`); pasif sorgu geçersizlemede yenilenmez. 05b/05 paneli hesap kapat/aç, rol, çip yazmalarından sonra bayat kalıyordu ("Hesabı kilitle" yerinde kalır). | `src/modules/organization/api/users.ts` (veri gelince o kimlik için etkin kalan "yapışkan" `enabled`) | Yeniden üretme: `/kullanicilar/<id>?sekme=hesap` → Hesabı kilitle → onay: panel "Etkinleştir"e dönmez (testte `pin-kullanicilar`, gerçek backend'de c3). |
| H-4 | **orta** | `listUsers` boş sayfa otomatik ilerlemesi: devam okuması HATA verince efekt `isFetchingNextPage` düşünce yeniden tetiklenip isteği sonsuza dek yineliyordu (sahte sunucu 40 çağrıya ulaşınca test güvenliği için kesildi). | `src/modules/organization/api/users.ts` + `users.test.ts` | Bkz. §4. |

## 4. WP2c "boş sayfa + `next_cursor` otomatik ilerleme, 20 sayfa üst sınırı" değerlendirmesi

- **Sonsuz döngünün kök nedeni istemcidir, sunucu değil.** Backend (`v0.15.0-api`, `usecase/users.go`): süzgeçli sayfa `usersScanChunk=400` × `usersScanMaxChunks=8` = sayfa başına en çok 3200 hesap tarar; bütçe dolunca sayfa boş/kısa döner ama imleç **son taranan satırdan** ilerler, tablo sonludur. Doğru çalışan sunucuda zincir mutlaka biter (spec: "istemci `next_cursor` boşalana dek devam eder"). Döngü yalnız (i) sunucu hatalı imleç verirse ya da (ii) istemci hata sonrası kendini yeniden tetiklerse olur; (ii) gerçekti ve düzeltildi (H-4): hata sonrası otomatik ilerleme durur, kullanıcı "Daha fazla yükle" ile bilinçli sürdürür.
- **Sınır doğru yerde değildi.** Eski sınır `pages.length >= 20` TOPLAM sayfa sayısıydı: 20+ dolu sayfa yükleyip ardından boş sayfa gelen uzun listede ilerleme hiç başlamazdı. Sınır SON ARDIŞIK boş sayfa sayısına çevrildi (20 × 3200 = en çok 64 000 taranan hesap; bu ölçekte sunucu tarafı bütçesi zaten başka sınırlara dayanır). Gerçek backend'de boş sayfa zinciri üretilemedi (13–19 hesap); davranış birim ve sahte sunucu testleriyle sınandı.

## 5. Gerçek imaj tanığı

### Yöntem

| Parça | Ne |
|---|---|
| Backend | `e2e/backend/up.sh` KOPYASI (betik başlığındaki `here/root/state/portlar/proje/imaj` ayrıştırıldı; depo betiği değişmedi): Compose projesi `nizamio_pin3` (Postgres 127.0.0.1:25432), `nizamio_pin3-server` 127.0.0.1:28080 + `nizamio_pin3-server-shortttl` :28081, imaj `nizamio-pin3/backend:v0.15.0-api` (etiketin `build/Dockerfile`'ı, digest'li FROM denetimi geçti, `setup --test-activation`). `/healthz/ready` → `{"status":"ready"}`. Mevcut `nizamio_web_e2e-*`, `nizamio-test-pg`, `nizamio-ci-be3`'e dokunulmadı (tur sonunda da ayakta, `:18080` hazır). |
| Web imajı | Depodaki `Dockerfile` + `deploy/Caddyfile` → `nizamio-web-pin3:dcca9d4`. `deploy/check-image.sh … 18500` **GEÇTİ** (uid 65532, salt okunur kök, nonce başlık = meta ve istek başı farklı, varlık immutable, eksik varlık 404, imajda kaynak/.env yok). |
| Kapsayıcılar | `nizamio-web-pin3` (`--read-only --tmpfs /tmp --cap-drop ALL --security-opt no-new-privileges`, 127.0.0.1:18501), `nizamio-web-pin3-edge` (caddy aynı digest; `/v1`, `/.well-known`, `/healthz` → `host.docker.internal:28080`, kalan → web; kenar CSP'yi ezmez; 127.0.0.1:18502), ağ `nizamio-web-pin3-net`. Tarayıcı `http://localhost:18502`. Belge CSP: `default-src 'self'; script-src 'self' https://challenges.cloudflare.com; style-src 'self' 'nonce-…'; … object-src 'none'` (`unsafe-*` yok). |
| Tarayıcı | Depodaki `@playwright/test` Chromium. Kişilikler: **adminA** (yönetici, Admin merceği), **adminK** (yönetici, Koordinatör merceği, Elektronik), **koord** (Ayşe, Yazılım koordinatörü), **uye** (Ali, Yazılım + Mekanik üyesi). Giriş gerçek arayüz formundan; tema ve kapsam tercihi `nizamio.pref.*` ile sayfa yüklenmeden. |
| Tohum | Gerçek API (`seed.mjs`): 2 program (biri kısa ad `PS` + `gold`), 4 koordinatörlük (3'ü programa bağlı), 7 kişi (2 koordinatör, 5 üye; yönetici Elektronik koordinatörü), 12 görev (geciken, onayda, tamamlanan, atanmamış), 2 bekleyen tarih talebi. Ölçüm ve akışlar ayrı tohumlarda (kendi `state` dosyaları). |

### Ölçüm matrisi (192 satır = 4 kişi × 8 ekran × 3 genişlik × 2 tema)

Ekranlar: `/` (01), `/gorevler` (03), `/kullanicilar` (05), `/kullanicilar/<id>` (05b), `/koordinatorlukler` (08), `/koordinatorlukler/<id>` (08b), `/zaman-cizelgesi` (03c), `/programlar`. Genişlikler 390 / 1024 / 1440.

| Kişi | Satır | Belge yatay taşma | CSP ihlali | `pageerror` | API ≥ 400 (anonim `refresh` 401 hariç) |
|---|---|---|---|---|---|
| adminA | 48 | 0 (en büyük 0 px) | 0 | 0 | 0 |
| adminK | 48 | 0 | 0 | 0 | 0 |
| koord | 48 | 0 | 0 | 0 | 0 |
| uye | 48 | 0 | 0 | 0 | 0 |
| **Toplam** | **192** | **0** | **0** | **0** | **0** |

Hesaplanmış stil (192 satırın tamamında aynı): gövde yazı tipi `Inter, system-ui, …`; sayfa başlığı 28/600 (ana sayfa karşılaması 44/600); koyu: başlık `rgb(245,245,245)`, zemin `rgb(11,11,11)`; açık: `rgb(22,22,21)`, `rgb(246,246,243)`. Koordinatör ve Üye için yönetim rotaları (`/kullanicilar`, `/koordinatorlukler[/…]`, `/programlar`) Ana sayfaya yönlenir (rota kapısı; bilgi notu yok, bkz. G-1). Kenar menüsü avatarı her satırda `PS` (program kısa adı, altın). Kenar menüsü rozetleri: adminA `2 / 2` (talep / geciken), koord `1 / 1`, uye `1` (yalnız geciken), adminK rozetsiz.

Belge taşması her yerde 0; 390'da tablolar `rp-scroll` (kendi içinde `overflow-x:auto`) kayar, belge kaymaz.

### Gerçek yazma akışları (gerçek backend; ayrı tohum, sayılar sunucudan okundu)

| # | Akış (İş 2'deki karşılığı) | Sonuç |
|---|---|---|
| A1 | Koordinatör (Ayşe) geciken görevi UI'dan tamamlar (a) | Rozet `geciken 1 → yok`; 03 Geciken 1→0, Tamamlanan 1→2, Devam 2→1; sunucu `counts` aynı (`overdue 1→0`). `tarih` rozeti `1` kalır. |
| A2 | Görev oluştur (a) | 03 Tümü 5→6, Başlamadı 1→2; sunucu `total 6`; rozet aynı. |
| A3 | 03c "Tarih talebi gönder" (a) | tek `POST /v1/date-change-requests 201`; tarih rozeti 1→2, 03 "Tarih talebi (2)", sunucu `pending_date_requests 2`. |
| A4 | Üye (Ali) (a) | Sayaç isteği `assignee_account_id=<ben>`; tarih rozeti yok; 03 Tümü 3 = sunucu `total 3`. |
| A5 | Admin merceği: bekleyen talebi onayla (a, e) | Rozet 3→2, 03 "Tarih talebi 3→2", pano `pending_date_changes 3→2`; Gantt uzantı satırları ile 03 `?talep=1` aynı görev kümesi. |
| A6 | Yönetici Admin merceğinde (Elektronik koordinatörü) geciken görevi tamamlar (a, H-2) | Rozet `geciken 2→1`, 03 Geciken 2→1; sunucu `counts` ve pano `overdue_tasks` 1. |
| A7 | Yönetici Koordinatör merceğinde aynı akış (a) | Rozet `1→yok`; 03 Geciken 1→0; birim sayacı `overdue 0` (pano 1: Mekanik'te başkasının gecikeni, mercek içeriği daraltır). |
| B | `?kisi=<Ali>` ↔ 05b ↔ 05 (b) | 03 Tümü 4 (Devam 2, Onay 1, Tamamlanan 1) = sunucu `total 4`; 05b açık 3 / geciken 0 / onayda 1; 05 paneli aynı. |
| C1 | Program 2026 → 2027 (c) | Sekmeler `Tümü 19 · Admin 1 · Koord 3 · Üye 3` → `19 · 1 · 0 · 1`; sunucu `role_counts` (program_id'li) birebir. |
| C2 | Hesap kapat/aç (c, BE-012) | UI "kapalı" işareti + API `account_status disabled`; sonra `active`; sayaçlar şirket çapında aynı. |
| C3 | 05b hesap sekmesi kapat (c, H-3) | Aynı panel "Etkinleştir"e döner (düzeltmeden önce dönmüyordu). |
| D1 | 08 "Yeni koordinatörlük": katalogda var, bu programda yok (d, BE-050) | Zarftaki kimlikle `of-exists` + "Bu programa ekle"; katalog satırı 1, kart bağlandı; iki istekte de `Idempotency-Key`. |
| D2 | Yanıt kaybı (istek uygulandı, yanıt `route.abort`) (d) | "Yeniden gönder"; 2 `POST /v1/departments`, AYNI anahtar; katalogda tek kayıt, programda tek bağ. |
| D3 | 05 kullanıcı oluştur: e-posta başka hesaba ait (d, BE-107) | Teklif metni kişinin adıyla; onayda hesap sayısı 19→19, kişi hedef ekipte. |
| E1 | 03c tam 200 görevli program (e, BE-019) | Yanıt başlığı YOK, uyarı yok, "200 görev · 0 bitti · 0 gecikmede". |
| E2 | 201 görev (e) | `X-Result-Truncated: true`, uyarı, "200+ görev … yüklenen kayıtlar içinde"; 21 satır DOM'da (sanallaştırma). |
| E3 | Admin uzatma sürüklemesi, yanıt kaybı (e, BE-056) | 2 `POST …/extend`, AYNI anahtar; `end_on` yalnız +4 gün, `dates_revision` 1→2 (tek uzatma). |
| F | Program 07: kısa ad `TZ` + `teal` (f, BE-001) | Kapsam kartı avatarı `PS/altın → TZ/teal`; API `short_name:TZ, color:teal`; temizleyince `short_name:null,color:null` ve avatar türetilene (`P6`) döner; geri `PS/gold`. |

Akış sonrası konsol hatası, CSP ihlali ve `pageerror` her akışta 0 (anonim ilk `refresh` 401 hariç); bilerek üretilen 4xx yok.

## 6. Kusur tablosu (düzeltilmedi)

| # | Önem | Öğe | Yeniden üretme | Dosya |
|---|---|---|---|---|
| G-1 | düşük | Koordinatör/Üye, yönetim rotasına (`/kullanicilar`, `/koordinatorlukler`, `/programlar`) gidince sessizce Ana sayfaya yönlenir; "Bu sayfaya erişiminiz yok" gibi bir bildirim yok. | koord ya da uye ile giriş → `/kullanicilar`: Ana sayfa, ileti yok (ölçümde `koord-kullanicilar-*`). | `src/app/router.ts` rota kapıları |
| G-2 | düşük | Kısa kod her yerde `YUEA-–`: katalog kodu + tire + BE-005 tutucusu `—`. | `/gorevler`, `/zaman-cizelgesi`, 08b "Dikkat gerektirenler" (adminA 1440). Pinde sıra numarası yok (BE-005 açık). | `src/modules/work/components/list/TaskRow.vue:44`, `rows.ts` |
| G-3 | düşük | 03c seçili görev paneli (sağ alt) 1440×900'de kaydırma konumuna göre bitiş tutamacını örter (`elementFromPoint` → `section.timeline-panel`); tutamaç tıklanamaz, çubuk panelin altından kaydırılmalı. | adminA, `/zaman-cizelgesi?olcek=gun&secili=<görev>`, çubuk sağ ucu x≈1070'e gelecek biçimde kaydır. | `src/modules/timeline/components/panel/SelectedTaskPanel.vue` / `panel.css` |
| G-4 | bilgi | Hızlı 200 görev oluşturma 429 (`platform.rate_limited`) üretir; yazma hız sınırı backend davranışıdır, istemci hatası değil (tohum betiği `Retry-After` ile bekler). | `POST /v1/work-items` art arda. | — |

CSP, taşma, veri bütünlüğü ya da erişilemeyen eylem türünde kusur yok; G-3 dışında hepsi görsel/ileti düzeyinde.

## 7. Yapılamayanlar

- Gerçek backend'de boş sayfa + `next_cursor` zinciri üretilemedi (en çok 19 hesap; tarama bütçesi 3200): yalnız birim/sahte sunucu testi.
- Ekran okuyucu ve gerçek cihaz denemesi yapılmadı (F3'ten devralınan borç).
- `NIZAMIO_E2E` Playwright paketi (`pnpm e2e`) bu turda koşulmadı; yerine yukarıdaki betikler kullanıldı.

## 8. Temizlik

Yalnız bu turda yaratılanlar adıyla kaldırıldı: kapsayıcılar `nizamio-web-pin3`, `nizamio-web-pin3-edge`, `nizamio_pin3-server`, `nizamio_pin3-server-shortttl`, `nizamio_pin3-db-1` (Compose `nizamio_pin3` `down -v`: kapsayıcı, ağ `nizamio_pin3_default`, birim), ağ `nizamio-web-pin3-net`, imajlar `nizamio-web-pin3:dcca9d4` ve `nizamio-pin3/backend:v0.15.0-api`. Kanıt: `docker ps -a/network ls/volume ls/images` süzgeci `pin3`/`nizamio` yalnız başkalarının kaynaklarını (`nizamio-ci-be3`, `nizamio_web_e2e-*`, `nizamio-test-pg`, `nizamio_web_e2e_default`, `nizamio-web-e2e/backend:v0.11.0-api`, `nizamio-ci-go`) listeler; 15432/25432/28080/28081/18500–18502 kapalı, `:18080/healthz/ready` hazır.
