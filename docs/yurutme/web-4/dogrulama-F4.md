# F4 yerel doğrulama — W110

**Durum: Kısmi gerçek ortam kanıtı.** Yerel kapı ve son imaj dumanı geçti; aşağıdaki gerçek kullanıcı ve UI kapsamları açık kalır.

## Kaynak ve tam kapı

- Kaynak HEAD `24bfb174e92185b964e3f82ad2174ff8738e1c17` (PR #97 birleşmiş main ile aynı kaynak); test worktree `web4/o4-w110`.
- Backend yalnız `v0.15.0-api` arşivinden, etiket commit'i `b8f6479a7971fa7056823acada47a7db4d9052de`; backend imaj kimliği `sha256:3583eabdefaf55d20d2635769cf8b62f9cd1afc3b5ad2067c588193df5305426`. Digest sabitli tabanlar ve imaja gömülü commit denetlendi; `setup --test-activation --expected-digest` başarılı.
- Node 24, `COREPACK_HOME` ve Homebrew Git ile `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test --maxWorkers=2`, `pnpm gen:check`, `pnpm build`: geçti. Test 484 dosya / 3252 test, 174,56 sn. Üretilen API ve token diff'i sıfır; 194 hata kodu, 189 operasyon.
- Gerçek Docker web imajı `sha256:ef58eb4ea12115b46cd55a774ddb911e7c66307de97eb2f40385e2caa19515d3`; imaj denetimi geçti: uid 65532, salt okunur kök, tüm capability'ler düşürülmüş, no-new-privileges; SPA fallback 200, belge no-store, başlık/meta nonce eşleşir ve istekler arasında değişir, unsafe-inline/eval yok, parmak izli varlık önbelleği, eksik varlık 404 ve kaynak/bağımlılık/env sızıntısı yok.

## Gerçek backend HTTP tanığı

Taze izole veritabanında koordinatörlük ve kişi kipinde toplantı oluşturma 201; toplantı PATCH 200; gündem ekleme 201 ve işaretleme 200; anahtarlı not oluşturma 201, düzenleme 200, silme 204, göreve dönüşüm 201; katılımcı ekleme 201 ve çıkarma 204. Silme 204 → geri yükleme 200 → silme 204 → kalıcı silme 200. Bunlar **HTTP API tanığıdır**, arayüz üzerinden yazma kanıtı değildir. Nottan görevin 03 liste/pano ve türevlerine etkisi gerçek tarayıcıda doğrulanmadı.

Üç rol için iki kipte detay 200; sunucunun `viewer_role` değerleri ŞY `admin`, K `coordinator`, Ü `member`. Admin olmayan sahip K kişi kipinde toplantı oluşturdu ve katılımcı ekledi (201/201). ŞY kişi kipinde katılımcı ekledi 201; Ü ekleme 403. Katılımcı listeleri iki kipte de sunucu yanıtından gözlendi. Bağlı K olmayan ŞY coordinatorship toplantısına katılımcı eklerken 403 aldı. Koordinatörlüğü kaybeden oluşturan ve diğer yetki kenarları henüz tamamlanmadı; UI eylem görünürlüğü ölçülmedi.

G4: test sunucusunda kontrollü anahtarsız PATCH dizisinde 60. istek 429 `platform.rate_limited`, `Retry-After: 52`. Ayrıca gerçek UI gündem gönderiminde tek anahtarsız POST 429, Retry-After 34; uyarı göründü, taslak korundu ve networkidle boyunca otomatik tekrar gözlenmedi.

## Açık kanıtlar

- Önceki `24bfb174` üretim imajıyla dolu 09 liste ve 09b detay üç rol × iki tema × 390/1024/1440: 36 görünümde yatay taşma/CSP/pageerror sıfır, gövde yazı tipi Inter. ŞY 09c formu ve özel kişi seçicisi altı tema/genişlikte açıldı, Escape ile kapatıldı; form modalı 24px dolgu ve Inter, taşma/CSP/pageerror sıfır. Son imajda ŞY detay ve formu altı görünümde tekrarlandı; üç rolün tüm liste/detay matrisi son imajda tekrar edilmedi. Silinenler ve kapsamlı tasarım karşılaştırması açık.
- Gerçek UI: 390 px kişi toplantısı oluşturma 201 ve PATCH 200 anahtarsız; gündem ekleme 201 anahtarsız; not ekleme 201 anahtarlı, düzenleme 200 ve silme 204. Filtre URL/ağ eşleşmesi, UI görev dönüşümü ve türevleri, katılımcı ve toplantı sil/restore/kalıcı sil, video/Canlı/Bekliyor/sağlayıcı/09d/09e yokluğu tamamlanmadı.
- Browser komutuna teknik izin verildi; yukarıdaki turlar gerçek backend ve üretim CSP ile koşuldu. Önceki sandbox içi MachPort reddi ve ortam temizliğinden sonra yapılan bağlantı reddi geçerli tanık sayılmadı.
- Gerçek VoiceOver turu ve E-03C-27/41 kullanıcı görsel onayı **YAPILMADI**; otomatik test bunların yerine geçmez.
- W107 entegrasyon senaryoları durumlu MSW kanıtıdır; bu kayıttaki gerçek sunucu ve eksik gerçek UI kanıtlarıyla karıştırılmamalıdır.

Görsel duman: `24bfb174` imajında 09/09b üç rol × iki tema × 390/1024/1440 ve ŞY 09c altı görünüm: taşma/CSP/pageerror 0; Inter, modal dolgu 24px. `707fd07` son imajında ŞY detay/form altı görünümde aynı ölçümler ve iç/dış Escape odak dönüşü geçti.

e2e provası: e2e dosyaları değiştirilmedi.

YENİ-EKSİK: yok. SAHİPLİK-DIŞI İHTİYAÇ: yok. TASLAK: yok. Varsayım: yok.

## Kaynaklar ve kanıtlar

Yalnız bu işe ait `nizamio_web4_w110` ağ/DB/sunucu/web/proxy kaynakları ve `nizamio-web4-w110/*` imajları oluşturuldu. Geçici betikler ve ham kanıtlar `/private/tmp/nizamio_web4_w110/` altındadır; fixture ve kimlik bilgileri kalıcı kanıt olarak kopyalanmamalıdır. Diğer oturumların kaynakları değiştirilmedi. İlk izole ortam temizlendi; ikinci taze ortam kanıt kopyası ve koordinatör kabulüne kadar korundu; #98 birleşimi ve main kapısından sonra W110’a ait dört konteyner, ağ ve veritabanı hacmi adla temizlendi. 18410–18413 portlarında dinleyen süreç kalmadı; imajlar ve geçici kanıtlar korundu. Koordinatör 54 güvenli JSON/PNG dosyasını ana frontend `.git/koordinator/web4-w110/` dizinine kopyaladı; fixture/state/env/auth ve betikler kopyalanmadı.

## O4 görsel düzeltmesi

Detayda durum rozeti, formun eylem metnini gösteriyordu. `src/shared/i18n/tr/meetings.ts` detay metni tasarım ve E-09-23 ile uyumlu “Üyeler dahil” olarak düzeltildi; form metni korundu. `src/modules/meetings/pages/MeetingDetailPage.test.ts` gerçek başlık metnini sınar ve diğer testlerin kişi kipi fixture’ını korur. Kaynak düzeltmesi `8af1b77`, test fixture düzeltmesi `50112fe`; dar test 12/12 geçti. `24bfb174` tam kapısından sonra typecheck/lint/format/gen:check/build tekrar geçti; test fixture son düzenlemesinin ardından tam lint tekrar geçti. Son imaj ve duman sonucu aşağıdadır.

## 2026-11-12 ara imaj turu — bulunan odak kusuru

`ea0be0f` kaynak ağacından üretilen `sha256:8b25d3abc680d659357c002a5d2a909b1e9aeec5ed9f272590689abf4d38b3be` imajı çalışan web konteynerinin imaj kimliğiyle eşleşti. UID 65532, read-only, cap-drop ALL, no-new-privileges ve nonce/SPA/cache/404/içerik imagecheck geçti. Altı ŞY tema/genişlik görünümünde detayda tam “Üyeler dahil”, formda “Tüm üyelere de davet gönder” doğrulandı; taşma/CSP/pageerror 0, Inter ve modal dolgu 24px.

**Bu ara görsel/etkileşim turu geçmedi:** özel kişi seçicisi Escape ile kapanınca odağı kendi tetikleyicisine döndürdü; ardından üst oluşturma formu Escape ile kapanınca odak altı görünümün tümünde BODY'ye düştü. Tetikleyiciye odak verilip Enter ile açılışta da tekrarlandı. Koşullu iki saniyelik odak beklemesi sonrası sonuç değişmedi. Bu sonuç sonraki sınıf düzeltmesi için kırmızı tanıktır.

Ortak modal koşullu sökümünde odak tuzağının devreden çıkarılması `open` değerine bağlandığı için kapanış ve söküm aynı güncellemede olduğunda atlanabiliyordu. `707fd07` sökümde idempotent devreden çıkarmayı sağlar. Önce eski kodda Escape, kapatma düğmesi ve iç içe modal testleri kırıldı; düzeltmeyle hedefli 12/12 geçti. Eylemle söküm, bağlı olmayan tetikleyici ve kapanış ardından tekrar sökümde çift odak olmaması da sınandı. `707fd07` tam yerel kapı: typecheck, tam lint, format, 484 dosya / 3259 test (200,40 sn), gen:check ve build geçti. Yeni imaj ve gerçek altı görünüm tekrarı aşağıda geçti.

## 2026-11-12 düzeltilmiş son imaj

`707fd07` uygulama kaynağıyla üretilen `sha256:1ed32302346b37149b840ada9f9846831e59d92fc432cc68f59b823e8999dd3c`, çalışan web konteynerinin imaj kimliğiyle eşleşti. UID 65532, salt okunur kök, cap-drop ALL ve no-new-privileges denetlendi; nonce, SPA fallback, cache, varlık 404 ve imaj içerik denetimi geçti.

Gerçek backend ile ŞY detay ve formu açık/koyu × 390/1024/1440: detayda “Üyeler dahil”, formda “Tüm üyelere de davet gönder”; taşma, CSP ihlali ve pageerror her görünümde 0. Yazı tipi Inter, modal dolgu 24px. Fare ve klavyeyle açılışta özel kişi seçicisi Escape sonrası kendi düğmesine, üst form Escape sonrası “Yeni toplantı” düğmesine altı görünümün tümünde odak döndürdü. Üç rolün tüm eski matrisi ve yukarıdaki UI yazmaları önceki imajın kanıtıdır.

Kalıcı kopya için güvenli kanıtlar: `final-keyboard-results.json`, `final-results.json` (fare), `flows-ui.json`, `flows-write.json`, `rate-ui.json`, `results.json` ve `final-detail-*.png`, `form-*.png`, rol/tema/genişlik adıyla üretilmiş liste ve detay PNG’leri. Betikler, fixture, state, env ve auth verileri kopyalanmaz.

## Birleşim ve CI

[#98](https://github.com/caliskan421/nizam.io--frontend/pull/98), üç COMPLETED+SUCCESS denetimi ve zorunlu `pr-merge.sh` ardından `4683af5e71896bb10f52d2fff886511c0f36555d` ile main'e birleşti; MERGED bağımsız doğrulandı. [CI 43103473776](https://github.com/caliskan421/nizam.io--frontend/actions/runs/43103473776): kod/test/build, Web imajı ve gerçek backend Playwright denetimleri geçti.

Birleşmiş main `4683af5` üzerinde O4 son tam kapısı ayrıca çalıştırıldı: 484 dosyada3259 test (205,41 sn), typecheck/lint/format/build/gen:check geçti; önce/sonra HEAD aynı, ağaç temiz. Sonraki nihai Sol tur1 üç kabul koşulu buldu; bu yeşil koşum onların kapandığı anlamına gelmez. Takip [WEB-4-codex](../../reviews/WEB-4-codex.md).

## Nihai kapı koşulları — W111/W112

W111 `43dc571`, [#99](https://github.com/caliskan421/nizam.io--frontend/pull/99): not düzenleyici ilk PATCH, 409 seçimi ve tekrar boyunca kilitli; eski kodda kırmızı regresyon, yeni kodda gerçek üst bileşen ve 409 testleri yeşil. Tam kapı 485 dosyada 3260 test; typecheck/lint/format/gen/build geçti. Birleşim `098ecba`; [CI 43107051132](https://github.com/caliskan421/nizam.io--frontend/actions/runs/43107051132) üç denetim başarılı.

W112 `bbfde3d`, [#100](https://github.com/caliskan421/nizam.io--frontend/pull/100): create/PATCH alan hataları yerel mesaj ve ARIA ile girişlere bağlı; ham sunucu metni yok, taslak korunur. Departmanlar kabul edilen `aria-pressed` çipleri; kişi kipinin tek sahibi ve K yetkisi korunur. İlk tam koşuda eski checkbox seçicisini kullanan iki entegrasyon kırıldı (485/487 dosya, 3264/3266); gerçek çip seçimine uyarlanarak hedefli 21 test ve son tam **487 dosya / 3266 test** geçti. Typecheck/lint/format/gen/build yeşil. W111 ve main `098ecba` bu kapıdan önce alındı; doğrulanan `b14eef8` ile teslim `bbfde3d` ağaç farkı sıfır. Birleşim `9065517627c262051f8318edd794879c3be6d7c7`; [CI 43109957738](https://github.com/caliskan421/nizam.io--frontend/actions/runs/43109957738) üç denetim COMPLETED+SUCCESS, zorunlu pr-merge.sh ve bağımsız MERGED doğrulaması yapıldı.

Her iki işçinin son üretim paketi+Caddy CSP turu 390/1024/1440 × iki temada taşma/CSP/pageerror sıfır. W111 dar menü ve editör odağı; W112 Enter ile çip seçimi 6/6, Inter, 0 12px dolgu, arka katman z=50. JSON ve PNG’ler `.git/koordinator/web4-w111/` ve `web4-w112/` altında. Bu son turlar sahte API ile yapılmıştır; W110 gerçek backend tanığı yerine sunulmaz. W112 form testindeki mevcut özel seçici taslağı bu bulgunun dışındadır; gerçek özel seçici entegrasyonu W107’de doğrulanmıştır. İşçilere ait Caddy konteynerleri ve bağımlılık bağlantıları temizlendi.

[Nihai Codex tur 2](../../reviews/WEB-4-codex.md), Ö-01/Ö-02/K-01’in kapandığını ve yakın varyantlarda regresyon bulunmadığını doğruladı. Son main kapısı aşağıda tamamlandı.

## Son main kapısı — 2026-11-12

`9065517627c262051f8318edd794879c3be6d7c7` üzerinde Node24 ile typecheck, tam lint, format:check, test --maxWorkers=2 (**487 dosya / 3266 test**), gen:check ve build geçti. Başlangıç/son HEAD aynı, çalışma ağacı temiz. Pin `v0.15.0-api`; 194 hata kodu, 189 operasyon; üretilen fark sıfır. Son uygulama kaynağı Sol tur2 ile incelenen ağaçla aynıdır. Tur2’nin CI/birleşim/son kapı kayıt koşulları tamamlandı; açık gerçek kullanıcı borçları yukarıda aynen korunur.
