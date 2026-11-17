# F11 — mevcut ekranlarda hazır sözleşme eksikleri

**F11 kaynak ve bağımsız kabul tamam; Opus son kaynak hükmü UYGUN/açık bulgu0; kendi PR üç CI SUCCESS+MERGED kapanış kapısıdır.** Ürün sahibi «Mevcut ekranlardaki hazır eksikleri tamamla» kapsamını seçti. Pin `v0.26.0-api` / backend `4d4adc0f` korunur; ayrı BE-F8 sürecine veya backend/mobil/program depolarına yazılmaz. Başlangıç F10 kapanışı PR180/main984a1a37'dir.

## Mevcut ekran karşılığı

BE164 etki okuması, 12 Silinen kayıtlar ekranının mevcut koordinatörlük **tekil kalıcı silme** onayına bağlandı: `GET /v1/departments/{id}/delete-impact` S1, şirket geneli ve başlıksızdır. Her açılışta taze okunur. Sayılar okuma anının görüntüsüdür; önizleme yazmayı kilitlemez. Yüklenirken yazmalar bekler; okuma hatasında veya kalıcı engelde onay/DELETE açılmaz. Kullanıcı aynı eylemle yeniden okuyabilir. 08'e yeni katalog silme düğmesi eklenmedi.

Onay, bütün programlardaki aktif/tamamlanmış/zaten silinmiş görevleri ayrı gösterir; `deleted_with_department` zaten `deleted_items` içindedir ve ikinci kez toplanmaz. Dosya sayısı çöpteki dosyaları da içerir. Üye sayısı farklı kişilerin ekip üyelikleridir; hesapların silineceği söylenmez. Toplantılar departman adı kopyasıyla kalır. Program adları null ise nötr ad kullanılır; opaque kimlik ad gibi gösterilmez. Kalıcı engeller tablo/proje/bekleyen öneridir; görev veya program bağı artık engel diye sunulmaz.

ADR0043 geri yükleme uyarısı düzeltildi: yalnız departmanla birlikte silinmiş görevler, departmanın hâlâ bağlı olduğu programlarda geri gelir; önce ayrıca silinmiş görevler ve bağı kalkmış programlar geri gelmez. Başarı bildirimi önizleme sayılarından değil gerçek `DepartmentLifecycleResult` yanıtından üretilir. Tekil/toplu/çöp boşaltma metinleri programdaki aday kümesi ile şirket geneli silme etkisini ayırır; toplu işlemlerde N etki sorgusu yapılmaz.

## Bağlam ve önbellek

Etki okumasından önce yakalanan kapsam/oturum nesli onaya taşınır. Geç veya iptal edilen yanıt yeni bağlamda onay açamaz; sahip sökülmesi, çıkış ve kapsam değişimi sınanmıştır. Korunan onay ve mutasyon motoru kullanılır; iyimser silme ve otomatik yazma tekrarı yoktur. 409 alanlarındaki sayılar yalnız izinli `organization.department_usage` kodu ve bilinen türlerle ayrıştırılır; ham sunucu metni arayüze taşınmaz.

Departman zincirinin etkilediği görev/çocuk/çöp/arşiv/rapor/başvuru özetleri bütün programlarda tazelenir. İlgisiz profil/bildirim kaynakları ve başka program kapsamlı yazmaların sınırı korunur. Sohbet `messageTasks` hedef görev durumunu çözdüğü için tazelenir; mesajların kendi bağlarını sayan `sharedCounts` yeni departman zincirine eklenmez.

ADR0043'te kalıcı silme, görev/dosya adımlarından sonra geri yükleme yarışında `organization.permanent_requires_deleted`409 dönebilir. Bu çift için sonuç `failed` kalırken ilgili bütün program önbellekleri yeniden okunur. Uyarı bazı görev veya dosyaların kalıcı silinmiş olabileceğini söyler. Ön kapı `department_in_use` hatası bu kısmi etki gibi yorumlanmaz. İstemci otomatik DELETE tekrarlamaz.

## Kanıt ve kalan kapılar

[Bağımsız doğrulama](dogrulama-F11.md) gerçek API/MSW/Caddy ayrımını ve başarısız ilk koşuları tutar. Son kaynak **f7729476**; ilk gerçek Caddy tanığı d0a924cc'de uzun tek parça koordinatörlük adında modal taşmasını buldu ve kabul verilmedi. Sonnet W201 başlık/gövde sarması, hatada loading temizliği, kısmi409 hata tonu ve sıfır zincir parantezini düzeltti. Terra yeni uzun departman+program adı fixture'larıyla390/1440 her11 kontrolü kabul etti; belge/modal/başlık/gövde yatay taşması0, CSP/pageerror0 ve footer/odak/gerçek wire sonuçları doğru. Aynı son kaynakta fulltypecheck/build ve6 delta dosyası43 test PASS. Opus son kaynak hükmü UYGUN/açık bulgu0 [denetim kaydındadır](../reviews/WEB-11-opus.md); kendi PR üç CI SUCCESS+MERGED olmadan faz kapanmaz.

BE164 mevcut12 kapsamıyla bağlandı: **163 kayıt=87 bağlı72 açık4 vazgeçildi**. Yeni BE kimliği yok; çalışma-zamanı stub ölçümü17 kimlik26 kullanım olarak korunur, standart tarama son kaynaktan kaydedilir. Yeni modüller,08 katalog silme eylemi, seçimli program ZIP'i için yeni seçici ve W7 konferans yüzeyi bu paket dışıdır. BE022/062'nin eski «alan yok» açıklamaları yayımlı sözleşmeye göre düzeltildi; P21/W7 ekran kapısı ve açık durumları korunur.


## Son odak ve sayaç anlamı düzeltmeleri

Opus tur2 dab0a05a için kaynak UYGUN dedi ve F1–F4 kapandı; engellemeyen G1 gözlemi kısmi409 yenilemesinde kaybolan satırın seçimi/odağıydı. Koordinatör KESİN27 nedeniyle bunu da Sonnet'e düzelttirdi:769669d4, yeniden okunan listede hedef yoksa mevcut seçim/odak temizliği; varsa seçim korunur. Kapsam/oturum nesli/sahip koruması küçük yerel guard'dır; gecikmiş bu özel yenileme yarışı için ayırt edici runtime kanıtı yok, kod incelemesidir. G1'in satır kaybolması/kalması MSW testleri ve bağımsız4 dosya30 test geçti. Sonnet tamtypecheck/build ve6 dosya36 test geçti; sayılar örtüşür.

Son kaynak **f7729476** ayrıca başarı bildiriminden `memberships_deleted` sayacını çıkartır: yayımlı sözleşmeye göre bu alan program bağları kaldırılırken silinen üyelikleri **içermez**, toplam üye/üyelik sayısı değildir. Etki önizlemesindeki gerçek farklı kişi sayısı korunur; görev/dosya/program bağı başarı sayıları sunucu yanıtından kalır. Üyelik sayacı tek alan olarak dönerse genel başarı metni kullanılır; istemci toplam uydurmaz. Yeni API veya şema değişikliği yoktur.

İlk Opus turu P1 nedeniyle KOŞULLU UYGUN DEĞİL olduğundan P78'in üçüncü tur olanağı yalnız son G1/sayaç delta'sının nihai hükmü için kullanılır. Kendi PR üç CI SUCCESS+MERGED kapısı ve yalnız faza ait kaynakların temizliği yine zorunludur.
