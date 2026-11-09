# F2 görsel doğrulama — gerçek imaj tanığı (O5 adım 3)

- **HEAD:** `7ee18fe` (dal `web2/o5-kapanis`, main #60 birleşimi)
- **Tarih:** 2026-11-09/10
- **Kapsam:** 05 Kullanıcılar (+ yan panel), 05b Kişisel takip (Görevler + Hesap sekmesi), 08 Koordinatörlükler, 08b Koordinatörlük detayı (Genel / Üyeler / Görevler / Ayarlar), `/programlar` (P3) ve bu ekranların formları; giriş formu.
- Görüntüler git'e girmez; yalnız bu özet depodadır.

## 1. Yöntem

### A — gerçek imaj tanığı (yapıldı)

| Parça | Ne |
|---|---|
| Backend | `nizamio_web_e2e-server` (imaj `nizamio-web-e2e/backend:v0.11.0-api`, `api-pin.json` etiketi), Postgres `nizamio_web_e2e-db-1`. **`up.sh` yeniden koşulmadı:** üç kaynak tur başında zaten ayaktaydı (5 sa) ve başka bir oturumun `vite` geliştirme sunucusu (`:5173`, `NIZAMIO_DEV_BACKEND=http://127.0.0.1:18080`) onları kullanıyordu. `up.sh` sunucuları `docker rm -f` ile yeniden yaratırdı. Aynı pinli etiket `healthz/ready` ile doğrulandı ve kullanıldı. |
| Web imajı | Depodaki `Dockerfile` + `deploy/Caddyfile` → `docker build -t nizamio-web-o5f2:7ee18fe` (digest pinli node/caddy tabanları). `deploy/check-image.sh nizamio-web-o5f2:7ee18fe 18490` **GEÇTİ** (uid 65532, salt okunur kök, nonce başlık = meta ve istek başına farklı, `no-store`, varlık immutable, eksik varlık 404, imajda kaynak/.env yok). |
| Kapsayıcılar | `nizamio-web-o5f2` (CI kısıtlarıyla: `--read-only --tmpfs /tmp --cap-drop ALL --security-opt no-new-privileges`, 127.0.0.1:18491). `nizamio-web-o5f2-edge`: caddy imajı aynı digest, backend `build/Caddyfile` yönlendirmesinin TLS'siz yerel eşdeğeri; `/v1`, `/.well-known`, `/healthz` → `host.docker.internal:18080`, diğer her şey → web; kenar CSP'yi ezmez. 127.0.0.1:18492. Ağ: `nizamio-web-o5f2-net`. Tarayıcı `http://localhost:18492` üzerinden aynı kökene bağlandı. |
| CSP | Belge yanıtındaki gerçek Caddy başlığı: `default-src 'self'; script-src 'self' https://challenges.cloudflare.com; style-src 'self' 'nonce-<istek uuid>'; …` (`unsafe-*` yok). Matristeki her yükleme `cspHeader=true` verdi. |
| Tohum (gerçek API) | `scratchpad/o5-f2-gorsel/seed.mjs`. Program "O5 Görsel Sezon qboqb" (2026), 3 koordinatörlük (Yazılım/Mekanik/Elektronik, kodlu, açıklamalı, programa bağlı), 8 kullanıcı (3 koordinatör + 5 üye; `updateAccount` ile parola). Yönetici, Koordinatör merceği için Elektronik'e koordinatör atandı. 20 görev: 7 başlamadı, 5 devam, 3 onayda, 2 iade, 3 tamamlandı; 7'si gecikmiş; 5'inde toplam 10 alt görev; onaya sunmadan önce gerçek PDF kanıt yüklendi. Uçlar pinli şemadan alındı: `createProgram`, `createDepartment`, `linkDepartment`, `createUser`, `updateAccount`, `assignCoordinator`, `createWorkItem` (+`Idempotency-Key`), `createSubtask`, `attachFile` (`tag` kapalı küme), `transitionWorkItem`. |
| Tarayıcı | Depodaki `@playwright/test` chromium. Kişilikler: **adminA** (yönetici, Admin merceği), **adminK** (yönetici, Koordinatör merceği, Elektronik), **koord** (Ayşe, Yazılım koordinatörü), **uye** (Ali). Yükleme için ayrıca **elif** (atanan üye). Kapsam/mercek tercihi `nizamio.pref.scope.*` ile önceden verildi. Tema gerçek `.rp-themebtn` düğmesiyle değiştirildi. Diyalog açıkken düğme inert olduğundan aynı mekanizma (`theme.ts` → `documentElement.dataset.theme`) doğrudan uygulandı. |

Ölçümler (`lib.mjs` `measure`):
- yatay taşma: `scrollWidth − clientWidth` (belge ve gövde), taşan öğe listesi;
- `securitypolicyviolation`: init script her belgede dinledi; ayrıca konsoldaki CSP iletileri;
- `pageerror` ve konsol hataları;
- dolgusu 0 olan metinli ve zeminli düğmeler;
- görünür tema simgesi sayısı;
- `<head>` içindeki ilk stil kaynağı;
- `document.fonts` durumu ve yazı tipi kaynaklarının kökeni;
- başlık tipografisi (boyut, ağırlık, aile, renk).

### B — sahte `/v1` turu (tamamlayıcı; yapıldı)

Yöntem sapması: `vite preview :4290` yerine **aynı gerçek imaj ve kenar** üzerinde `page.route` kullanıldı. Böylece CSP sahte değil, gerçek Caddy başlığıdır. Derlenmiş paket aynı commit'tir.

Yalnız senaryonun gerektirdiği uç değiştirildi. Diğer bütün istekler gerçek backend'e geçti, yani yetkili görünürlükle süzülmeden ve sözleşmeye birebir uyarak. Değiştirmeler üç türdür:
- gerçek gövdeye yalnız `x-result-truncated: true` başlığı eklendi;
- sözleşmedeki boş biçim döndürüldü (`{departments: []}`);
- 500 yanıtında `ErrorEnvelope` döndürüldü.

Betik: `mock.mjs`, `b7.mjs`.

## 2. Ölçüm matrisi (A)

264 satır = 4 kişilik × ekran × {1440, 1024, 390} × {koyu, açık}.

- Yönetici kişiliklerinde 10 ekran: `users`, `users-panel`, `user`, `user-hesap`, `coords`, `coord-genel`, `coord-uyeler`, `coord-gorevler`, `coord-ayarlar`, `programs`.
- koord/uye kişiliklerinde bu 10 rota ile birlikte `/` ve `/gorevler` ölçüldü.

| Kişilik | Ekranlar | Son URL | Taşma | CSP ihlali | pageerror | Tema simgesi | İlk stil | Yazı tipleri | Dolgusu 0 düğme | API hatası |
|---|---|---|---|---|---|---|---|---|---|---|
| adminA | 10 × 6 | ekranın kendisi | 0 (60/60) | 0 | 0 | 1 | `/layers.css` | yükleniyor/hata 0; kaynak yalnız `localhost:18492` | 0 | 0 (yalnız ilk anonim `refresh` 401) |
| adminK | 10 × 6 | ekranın kendisi | 0 (60/60) | 0 | 0 | 1 | `/layers.css` | aynı | 0 | 0 |
| koord | 12 × 6 | 05/05b/08/08b/programlar → `/` (rota kapısı; P1/P13/P16 beklenen); `/`, `/gorevler` | 0 (72/72) | 0 | 0 | 1 | `/layers.css` | aynı | 0 | 0 |
| uye | 12 × 6 | koord ile aynı | 0 (72/72) | 0 | 0 | 1 | `/layers.css` | aynı | 0 | 0 |
| giriş formu | 1 × 6 | `/` | 0 | 0 | 0 | 0 (kabuk yok, beklenen) | `/layers.css` | aynı | — | — |
| formlar (A+B), 21 diyalog/durum | × 6 | — | 0 | 0 | 0 | 1 | — | — | 0 | diyalog 390'da 358 px, sol 16 / sağ 374; taşma yok |

Başlık tipografisi her yönetici ekranında 28/34 600 Poppins, koyuda `rgb(245,245,245)`, açıkta `rgb(22,22,21)`. Ana sayfa başlığı 44/50.

## 3. Gerçek yazma akışları (A; adminA, 1440 koyu)

| # | Akış | Yazma istekleri | Yenilenme kanıtı |
|---|---|---|---|
| W1 | Koordinatörlük oluştur (ad, tür, kod `hbqboqb` → `HBQBOQB`, açıklama) | `POST /v1/departments 201` → `POST /v1/program/departments 201` (2 adım) | Diyalog kapandı. Sayım "3 / 3" → "4 / 4". `program/departments` ve `reports/dashboard` yeniden okundu. Kod büyük harfe çevrildi. |
| W2 | Ad (program) ve katalog düzenle (Ayarlar → Düzenle) | `PATCH /v1/program/departments/{id} 200` + `PATCH /v1/departments/{id} 200` | Form taze veriyle açıldı (kod korundu). Başlık "Haberleşme ve Telemetri qboqb". Ayarlar kartında yeni açıklama görünüyor, 08 kartında yeni ad var. "Bu değişiklik tüm sezonlarda geçerlidir" uyarısı gösterildi. |
| W3 | Üye ekle (08b Üyeler; kişi seçici "Can" → Can Üye, rol Üye) | `POST /v1/departments/{id}/memberships 201` | Sekme "Üyeler 3" → "Üyeler 4", satır listede. `members` ve `dashboard` yeniden okundu (4 GET). |
| W4a | Çip rolü: Ali Üye → Koordinatör | `PATCH …/memberships/{acc} 200` (onay gerekmedi) | Çip ve tablo satırı "Koordinatör" oldu. `admin/users`, `program/work-items` ve `dashboard` yeniden okundu. |
| W4b | Çip rolü: Ali Koordinatör → Üye | `PATCH 409` (`organization.confirmation_required`) → onay penceresi "Atamadan düşecek görevler: Uçuş yazılımı mimarisi, Yer istasyonu arayüzü, Hata kayıt sistemi" → "Rolü değiştir" → `PATCH 200` (gövdede `confirm`) | Çip ve satır "Üye" oldu. |
| W4c/d | Ayşe Koordinatör → Üye (onaylı, "Yer testi raporu" düştü), ardından geri | 409 → 200, ardından 200 | Çip güncellendi. |
| W5 | Kullanıcı oluştur, ardından geçici parola | `POST /v1/admin/users 201` → aynı diyalogda parola adımı → `PATCH /v1/admin/accounts/{id} 200` | Liste "14 kullanıcı" → "15", yeni kişi listede. Parola DOM'da kalmadı. Yeni hesapla girişte `/oturum` "Parola değişimi gerekli" gösteriyor (aşağıda K-1). |
| W6 | Program oluştur (ad, yıl 2027, açıklama) | `POST /v1/programs 201` | Liste 2 → 3. `programs` ve `program-transfers` yeniden okundu. |
| W7 | Görev dosyası **yükleme ve indirme** (03 paneli, "Telemetri ayrıştırıcı", Elif) | Yükleme: `POST /v1/work-items/{id}/files 201` (etiket "İster", PDF 582 B) → `GET work-item` + `GET files`. İndirme: `POST /v1/download-tickets 201`, ardından bilet adresinden indirme | "Dosyalar 0" → "Dosyalar 1", kanıt adı görünüyor. İndirilen dosya bayt bayt aynı. Adres çubuğu değişmedi (`/gorevler?gorev=…`), açılan sekme yok. Bilet ve `/v1/downloads/…` DOM'da ya da geçmişte yok. |
| W8 | Dönem aktarımı önizle (hedef "O5 Hedef Sezon", Yazılım, Tümünü seç → 7 görev) | `POST /v1/program-transfers/preview 200` (yalnız 1 istek) | Önizleme kartı: "7 görev aktarılacak · 3 dosya (1,7 KB) · 3 kişi eklenecek · Departman hedef programa bağlı değil → Departmanı hedef programa bağla · 1 engel var". "Aktar" devre dışı. |
| B5 | Kısmi başarı, sonra mevcut departmanı bağla | `POST /v1/departments 201` (gerçek) → `POST /v1/program/departments 500` (sahte). Ardından gerçek aynı adla: `POST /v1/departments 409` → `GET departments` → `POST /v1/program/departments 201` | `of-partial` "Departman kataloğa eklendi ancak programa bağlanamadı…", alanlar kilitli, "Bu programa ekle" görünüyor. 409'da `of-exists` göründü ve bağlandı. Liste yenilendi, birim listede. |

Doğrulama iletileri gösteriliyor: "Ad gerekli.", "Kod yalnız A–Z ve 0–9 içeren 2–10 karakter olmalı.", kullanıcı oluşturmada iki alan `aria-invalid`.

Yan etki notu: W4b/W4c onaylarıyla Ali'nin 3 ve Ayşe'nin 1 görevi atamasız kaldı. B6b'de Elif gerçek olarak Koordinatör yapıldı ve öyle bırakıldı.

## 4. B katmanı sonuçları

| Senaryo | Sonuç |
|---|---|
| B1 05 yükleniyor (listUsers 5 sn) | İskelet: 60 iskelet öğesi, `aria-busy=true`. Taşma 0. |
| B2 05 / 08 / 08b 500 | Bölge içi hata kutusu: "Kullanıcılar yüklenemedi." / "Yapı sağlığı yüklenemedi" / "Üyeler yüklenemedi", istek kimliği ve "Yeniden dene". 05'te yeniden deneme 15 satırla kurtardı. |
| B3 boş durumlar | 08 `departments: []` → "Programa departman katılmamış" + "Yeni koordinatörlük". 08 süzgeç boş → "Bu filtrelerle eşleşen koordinatörlük yok · Süzgeçleri temizle". 05 arama boş → "Sonuç yok · Süzgeçleri temizle". 05b görevsiz kişi → "%0 · Henüz görev yok". 08b üyesiz birim → "Bu koordinatörlükte henüz kimse yok". |
| B4 `X-Result-Truncated` | 08 alt satır "4 koordinatörlük (sınıra ulaşmış olabilir)". 05 koordinatörlük süzgeci → "Liste eksik olabilir: sunucu sonucu sınırladı.". 05 `next_cursor` dolu → "5+ kullanıcı · yüklenen kayıtlar içinde" + "Daha fazla yükle". 08b `listMembers` truncated → **görünür uyarı bulunamadı** (aşağıda K-6). |
| B6 `confirmation_required` iki biçim | Gövde biçimi gerçek (W4b/c): 409, ardından onaylı PATCH 200. Sorgu biçimi (`removeMember`): ilk `DELETE` gerçek 409 → "Ekipten çıkar … Atamadan düşecek görevler: Telemetri ayrıştırıcı, Simülasyon testleri" → "Çıkar" → `DELETE …?confirm=true` (yakalandı ve 204 verildi, yan etkisi yok). |
| B7 390 dar menü klavye | "Menü" Enter: `aria-expanded=true`, `main` inert, odak menüde ("Menüyü daralt"). Tab yalnız menü öğelerinde dolaşıyor, içeriğe kaçmıyor. Esc: menü kapanıyor, inert kalkıyor, odak "Menü" düğmesine dönüyor; 4 Tab sonrasında da aynı. İç içe Program menüsünde Esc önce alt menüyü kapatıp odağı "Program:" düğmesine, ikinci Esc "Menü"ye veriyor. Menüden "Kullanıcılar"a gidince menü kapanıyor, taşma 0. |

## 5. Kusur tablosu

Tasarım karşılaştırması 1440'ta `file://` ile yapıldı. `{{ }}` ham kaldığı için yalnız yerleşim, ölçü ve metin karşılaştırıldı. Bilinçli farklar kabul satırına bağlıdır.

| # | Öğe | Tasarım | Uygulama | Fark | Sınıf | Muhtemel dosya |
|---|---|---|---|---|---|---|
| K-1 | Geçici parolayla ilk giriş | P14: "ilk girişte değiştirilir"; 00-ortak backend.md §hata: `force_password_change_required` → "Parola değiştir ekranına yönlendir" | `/oturum` yalnız "Parola değişimi gerekli · Bilgileri yenile · Çıkış" gösteriyor. Parola değiştirme formu yok (`src` içinde `/v1/auth/password` çağrısı yok). | 05'te oluşturulan kullanıcı web'de ilerleyemiyor; W5 akışı tamamlanmıyor | **kusur-yüksek** (faz ataması belgelenmemiş; bilinçli ertelendiyse kabul satırı gerekir) | `src/modules/identity/*` (oturum sayfası), 00-ortak |
| K-2 | Form doğrulaması sonrası odak (Yeni koordinatörlük, Kullanıcı oluştur, Geçici parola) | Odak diyalogda kalmalı; ilk hatalı alana gitmeli | Geçersiz gönderimde (fare ya da klavye Enter) odak `BODY`'ye düşüyor. Ardından Tab arka plana gidiyor (arka plan inert değil), Esc diyaloğu kapatmıyor. Normal açılışta Tab döngüsü ve Esc doğru çalışıyor. | Klavye kullanıcısı modal bağlamını kaybediyor | **kusur-orta** | `src/modules/organization/components/forms/form-kit.ts`, `src/shared/ui/UiModal.vue` / `focus-trap.ts` |
| K-3 | 05 tablo, 390 | — (tasarım 390 çizmiyor) | "roller" sütunundaki "Koordinatör" rozeti sağ kenarda kırpılıyor ("Koordinatö"). Rol sekmesi şeridinde "Üye (5" kesiliyor (iç kaydırma; belge taşması 0). | Okunabilirlik | **kusur-orta** | `src/modules/organization/components/users/users.css`, `pages/users/users-page.css` |
| K-4 | 05 rol sekmesi sayaçları | "Tümü 185" (parantezsiz `rp-count`) | "Tümü (14)" (`UiSegmented` her zaman `parens`) | Metin biçimi | kusur-düşük | `src/shared/ui/UiSegmented.vue` / `UsersToolbar.vue` |
| K-5 | Kırıntı, 390 (08b, 05b) | — | Program ve üst düzey parçaları boşalıyor, satırda yalnız "/ / Yazılım Koo…" kalıyor | Görsel artık | kusur-düşük | `src/app/shell/topbar/*` |
| K-6 | 08b Üyeler `X-Result-Truncated` | Satır dışı kabul: `listMembers` kesilmesi → "liste eksik olabilir" | Başlık eklenince Üyeler sekmesinde görünür uyarı bulunamadı (05 süzgecinde aynı uç uyarı veriyor) | Kabul satırı görünmüyor olabilir (seçici kaçırmış olabilir; ekran görüntüsü `B4b-*`) | kusur-orta (doğrulanmalı) | `components/detail/MembersPanel.vue` |
| K-7 | Giriş formu boş gönderim | — | İstemci doğrulaması yok; boş kimlik bilgisi sunucuya gidiyor ("E-posta veya parola hatalı") | F0 ekranı, kapsam kenarı | kusur-düşük | `src/modules/identity/*` |
| K-8 | 05 yan panel, 390 | — | Satır seçilince panel 14 satırlık listenin altında açılıyor (görünür alanın dışında) | Keşfedilebilirlik | kusur-düşük | `pages/UsersPage.vue` |
| — | Dışa aktar devre dışı; "Admin" sekmesi devre dışı; e-posta satırı yok; arama "Ad…" | — | — | — | bilinçli: E-05-04, E-05-06, E-05-17, E-05-07 | — |
| — | Satır seçim kutuları; numaralı sayfalayıcı; Vazgeç/Kaydet yok; Şifre sıfırlama / Hesabı kilitle devre dışı; "Giriş kilidini kaldır" her zaman görünür | — | — | — | bilinçli: E-05-09/14, E-05-22/23 (P4), E-05-37/38 (P12), E-05-34/35, satır dışı #15 | — |
| — | Admin rozeti çizilmez; Roller kartları salt gösterim | — | — | — | bilinçli: E-05-18, E-05-31 (BE-042) | — |
| — | 05b "Onay bekleyen" not satırı boş; Mesaj/Rapor devre dışı; Dosyalar sayaçsız; Kanıt "—" | — | — | — | bilinçli: E-05-52, E-05-46/47, E-05-54, E-05-66 | — |
| — | 08: Aktif/Pasif ve Üst birim süzgeci yok; grup başlığı yok; "Yapıyı düzenle" ve "Yapı" devre dışı; sağlık şeridinde not satırı boş | — | — | — | bilinçli: E-08-14/15/24, E-08-04/12, E-08-08 | — |
| — | 08b: "Ekibe mesaj F7'de"; Arşiv/Toplantılar sekmeleri devre dışı; üst/alt birim yok; Kuruluş/Görünürlük "—"; Son etkinlik yer tutucu; "Aktif" yok | — | — | — | bilinçli: E-08-54, E-08-61/62, E-08-72/76/77, E-08-73/75, E-08-90, E-08-53 | — |
| — | koord/uye rotalarında ana sayfaya dönüş | — | — | — | bilinçli: P1, P13, P16, satır dışı kabul | — |

Ölçü ve renk notları:
- 05, 05b ve 08b ana yerleşimi tasarımla aynı: başlık 28 px, düğme konumları, sekme şeridi, KPI kartları, yan panel 340 px, takvim ve durum dağılımı kartları.
- 08'de sağlık şeridi tasarımda 4 kutuluk bir tekrar (`v-for`). Uygulamada 4 kutu yan yana; ızgara aynı.
- Arka plan rengi, kart kenarı ve vurgu (lime) rengi göz karşılaştırmasında sapma göstermedi. Piksel farkı ölçülmedi.

Gözlem (kusur değil, backend kuralı):
- Şirket yöneticisi koordinatörü olmadığı birimde onaya sunulan görevi tamamlayamıyor (`transitionWorkItem` 403 `work.not_authorized`). Tohumda birim koordinatörüyle yapıldı.
- Rol düşürme onayı görev atamalarını düşürüyor.

## 6. Yapılamayanlar / sapmalar

- `pnpm e2e:backend:up` / `down` **koşulmadı**. Gerçek backend kaynakları bu turdan önce ayaktaydı ve başka bir oturumun canlı geliştirme sunucusu tarafından kullanılıyordu. `up.sh` yeniden yaratma, `down.sh` ise `down -v` (veri silme) yapar; ikisi de o oturumu bozardı. Aynı pinli etiket ve aynı yönetici kullanıldı. Kapatma, kaynakların sahibine bırakıldı. Tohum verisi atılabilir e2e DB'ye `qboqb` önekiyle eklendi.
- B katmanı `vite preview :4290` yerine gerçek imaj ve `page.route` ile koşuldu (gerekçe §1). `pnpm build` ayrıca koşulmadı; imaj içi `pnpm build` başarılıydı.
- Tasarım dosyaları `support.js` olmadan açıldığı için şablon ifadeleri ham kaldı. Yalnız yerleşim, ölçü ve metin karşılaştırıldı. Tasarımın açık teması `file://` içinde `data-theme` ile tetiklenemedi; açık tema karşılaştırması yalnız uygulama içinde koyu/açık tutarlılığı olarak yapıldı.
- Onay diyaloğu (rol) süpürmesinde W4 turunda yalnız açık tema var. B6'da sorgu biçimli onay her iki temada da alındı.

## 7. Temizlik kanıtı

```
docker rm -f nizamio-web-o5f2 nizamio-web-o5f2-edge   → kaldırıldı
docker network rm nizamio-web-o5f2-net                → kaldırıldı
docker rmi nizamio-web-o5f2:7ee18fe                   → Untagged/Deleted sha256:352b387e…
deploy/check-image.sh kapsayıcısı nizamio-web-imagecheck → trap ile kaldırıldı
docker ps -a --filter name=nizamio-web                → boş
docker images | grep nizamio-web-o5f2                 → boş
lsof :18490 :18491 :18492 :4290                       → dinleyen yok
```

`docker ps -a --filter name=nizamio` boş **değil**. Kalanlar bu turdan önce vardı ve dokunulmadı:
- `nizamio_web_e2e-server`
- `nizamio_web_e2e-server-shortttl`
- `nizamio_web_e2e-db-1`
- `nizamio-test-pg`

## 8. Görüntüler (scratchpad, git dışı)

Kök: `scratchpad/o5-f2-gorsel/`. Toplam **442 PNG**.

| Klasör | Adet | Dosya adı kalıbı |
|---|---|---|
| `shots/matrix/` | 264 | `<kişilik>-<ekran>-<genişlik>-<tema>.png` |
| `shots/forms/` | 101 | `dept-create*`, `dept-edit*`, `coordinator-assign*`, `member-add*`, `confirm-role-*`, `temp-password*`, `user-create*`, `user-temp-password*`, `chip-add*`, `delete-confirm*`, `program-{create,dept-link,delete,reset}*`, `transfer-preview*`, `task-upload*`, `task-files-after-upload*`, `page-coord-uyeler-after-writes*` |
| `shots/mock/` | 62 | `B1…B7-*` |
| `shots/login/` | 7 | `login-*`, `temp-password-first-login-*` |
| `tasarim/` | 8 | 4 tasarım × 2 tema, 1440 |

Betikler ve ham sonuçlar aynı klasörde: `seed.mjs`, `lib.mjs`, `matrix.mjs`, `writes.mjs`, `w2.mjs`, `forms.mjs`, `upload.mjs`, `mock.mjs`, `b7.mjs`, `loginf.mjs`, `*.json`.
