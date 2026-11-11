# F4 yerel doğrulama — W110

**Durum: EKSİK.** Bu kayıt, tamamlanmış kapı iddiası değildir. Gerçek tarayıcı turu ve aşağıda belirtilen kanıtlar eksiktir.

## Kaynak ve tam kapı

- Kaynak HEAD `24bfb174e92185b964e3f82ad2174ff8738e1c17` (PR #97 birleşmiş main ile aynı kaynak); test worktree `web4/o4-w110`.
- Backend yalnız `v0.15.0-api` arşivinden, etiket commit'i `b8f6479a7971fa7056823acada47a7db4d9052de`; backend imaj kimliği `sha256:3583eabdefaf55d20d2635769cf8b62f9cd1afc3b5ad2067c588193df5305426`. Digest sabitli tabanlar ve imaja gömülü commit denetlendi; `setup --test-activation --expected-digest` başarılı.
- Node 24, `COREPACK_HOME` ve Homebrew Git ile `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test --maxWorkers=2`, `pnpm gen:check`, `pnpm build`: geçti. Test 484 dosya / 3252 test, 174,56 sn. Üretilen API ve token diff'i sıfır; 194 hata kodu, 189 operasyon.
- Gerçek Docker web imajı `sha256:ef58eb4ea12115b46cd55a774ddb911e7c66307de97eb2f40385e2caa19515d3`; imaj denetimi geçti: uid 65532, salt okunur kök, tüm capability'ler düşürülmüş, no-new-privileges; SPA fallback 200, belge no-store, başlık/meta nonce eşleşir ve istekler arasında değişir, unsafe-inline/eval yok, parmak izli varlık önbelleği, eksik varlık 404 ve kaynak/bağımlılık/env sızıntısı yok.

## Gerçek backend HTTP tanığı

Taze izole veritabanında koordinatörlük ve kişi kipinde toplantı oluşturma 201; toplantı PATCH 200; gündem ekleme 201 ve işaretleme 200; anahtarlı not oluşturma 201, düzenleme 200, silme 204, göreve dönüşüm 201; katılımcı ekleme 201 ve çıkarma 204. Silme 204 → geri yükleme 200 → silme 204 → kalıcı silme 200. Bunlar **HTTP API tanığıdır**, arayüz üzerinden yazma kanıtı değildir. Nottan görevin 03 liste/pano ve türevlerine etkisi gerçek tarayıcıda doğrulanmadı.

Üç rol için iki kipte detay 200; sunucunun `viewer_role` değerleri ŞY `admin`, K `coordinator`, Ü `member`. Admin olmayan sahip K kişi kipinde toplantı oluşturdu ve katılımcı ekledi (201/201). ŞY kişi kipinde katılımcı ekledi 201; Ü ekleme 403. Katılımcı listeleri iki kipte de sunucu yanıtından gözlendi. Bağlı K olmayan ŞY coordinatorship toplantısına katılımcı eklerken 403 aldı. Koordinatörlüğü kaybeden oluşturan ve diğer yetki kenarları henüz tamamlanmadı; UI eylem görünürlüğü ölçülmedi.

G4: test sunucusunda kontrollü anahtarsız PATCH dizisinde 60. istek 429 `platform.rate_limited`, `Retry-After: 52`. Bu yalnız gerçek API yanıtıdır; istemcinin otomatik tekrar yapmama davranışı gerçek UI ile gözlenmedi.

## Açık kanıtlar

- 09 liste, 09b detay, 09c form ve silinenler için üç rol × iki tema × 390/1024/1440 gerçek tarayıcı matrisi, hesaplanmış stil/tasarımla karşılaştırma, yatay taşma, tüm CSP ve pageerror sayımı, 390 tıklama/klavye/odak **yapılmadı**. Boş iskelet başarı sayılmadı.
- Filtre URL/ağ eşleşmesi; özel kişi seçici; UI ile gerçek create/PATCH/gündem/not/görev/katılımcı/sil/restore/kalıcı sil ve görev türevlerinin önce-sonrası; video/Canlı/Bekliyor/sağlayıcı/09d/09e yokluğu **yapılmadı**.
- Browser betiği `/private/tmp/nizamio_web4_w110/smoke.cjs` sözdizimi denetiminden geçti. Sandbox içi Chromium, macOS MachPort `Permission denied` ile açılmadı. Tam bu komutun sandbox dışı teknik izin çağrısı beklerken kesildi; session kimliği veya çalıştığına ilişkin sonuç yok. İzin sınırı aşılmadı.
- Gerçek VoiceOver turu ve E-03C-27/41 kullanıcı görsel onayı **YAPILMADI**; otomatik test bunların yerine geçmez.
- W107 entegrasyon senaryoları durumlu MSW kanıtıdır; bu kayıttaki gerçek sunucu ve eksik gerçek UI kanıtlarıyla karıştırılmamalıdır.

Görsel duman: **tamamlanmadı**; gerçek backend ile rota × genişlik/tema, stil, CSP ve taşma değerleri elde edilmedi.

e2e provası: e2e dosyaları değiştirilmedi.

YENİ-EKSİK: yok. SAHİPLİK-DIŞI İHTİYAÇ: yok. TASLAK: yok. Varsayım: yok.

## Kaynaklar ve kanıtlar

Yalnız bu işe ait `nizamio_web4_w110` ağ/DB/sunucu/web/proxy kaynakları ve `nizamio-web4-w110/*` imajları oluşturuldu. Geçici betikler ve ham kanıtlar `/private/tmp/nizamio_web4_w110/` altındadır; fixture ve kimlik bilgileri kalıcı kanıt olarak kopyalanmamalıdır. Diğer oturumların kaynakları değiştirilmedi. Oluşturulan proxy, web, backend ve DB konteynerleri, ağ, DB hacmi ve bu işe ait iki imaj etiketi temizlendi; başka kaynağa dokunulmadı. Kalıcı kanıt kopyası henüz yapılmadı.
