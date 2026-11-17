# WEB-9 — bağımsız Opus denetimi ve Codex koordinatör kaydı

**Nihai kaynak hükmü: KOŞULLU UYGUN — tek koşul bu kapanış başlığının üç CI başarısı ve MERGED sonucudur.** Dosya adı önceki fazların yol düzenini korur. Kullanıcının rol talimatıyla bağımsız denetçi Opus, test/tanık Terra, uygulayıcı Sonnet, yönetici ve bu kaydın yazarı ana Codex'tir. Yönetim Opus'a devredilmedi.

## Denetim turu1 — kaynak ve mevcut kanıt

2026-11-17, gerçek model `claude-opus-5-5`, kaynak `553f5058`. Opus yalnız okudu; test/Docker/üretim kodu çalıştırmadı veya değiştirmedi. Backend sözleşmesi v0.25.0-api (`58856bbc`) etiketinden incelendi. Hüküm **KOŞULLU UYGUN**: P0/P1/P2 kaynak bulgusu yok; W188 nihai tanığı, W185 PR174 üç CI ve kapanış PR'ı bekleniyor. Bu hüküm F9 kapanış onayı değildir.

| Bulgu                                         | Öncelik | Tetik ve etki                                                                                               | Koordinatör kararı                                                                                                                                              |
| --------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Grup cümlesinde eksik kesin kişi sayısı       | P3      | Backend actors listesi en çok5 ve adlar nullable; “Ayşe ve4 kişi” gerçek toplamı açıklamayabilir.           | Sonnet W189: belirsiz toplamda sayısız güvenli ifade; grup olay sayısı kişi sayısı değildir.                                                                    |
| Listede yüklenmemiş sohbetin okunmamış çapası | P3      | İlk50 dışındaki derin bağlantıda liste özeti yokken history.first_unread_seq kullanılmaz; ayırıcı çizilmez. | Sonnet W189: her girişte güvenli limit1 geçmiş okuması, giriş boyunca dondurulmuş çapa ve açık mesaj hedefi önceliği; güvenilir sayı yoksa genel ayırıcı metni. |

Tur1'de sözleşme sayıları doğrulandı:248→261 uç,326→348 şema,227 hata kodu. Kaynakta16 designStub kimliği,23 F9 bağlı BE, toplam163 benzersiz kayıt (77 bağlı/84 açık/2 vazgeçildi). F8 raporundaki160/104 toplamı tarihsel hesap hatasıdır.

Süreç düzeltmesi: tur1 başlangıcında Opus üç alt denetçi açtı. Koordinatör çalışmayı durdurdu; aynı tur tek denetçi olarak Agent/Task araçları kapalı sürdürüldü. Opus hiçbir alt denetçi sonucunu kullanmadığını, sonuçları kendisi kaynak okuyarak verdiğini bildirdi. Sonraki çalışmalarda da delege etme yetkisi kapalıdır.

## Kanıt sınırları

Opus W183 liste, GroupInfo/notify_level, receipts ve Koordinatörler korumasını ilk turda özet düzeyinde inceledi; ikinci turda bu alanlara ek odak istenecek. Sahte API dumanı gerçek backend tanığı sayılmaz. W188 ara mesajları ilk hükümde yalnız koordinatör beyanıydı; nihai hükümde ham JSON/PNG ve tamamlanan rapor doğrudan incelenmelidir.

## Nihai tur ve kapanış

Bekliyor: W189 düzeltmesi + Terra dar regresyonu, W188 nihai gerçek tanık, PR174 üç CI sonucu ve son kapanış belgeleri. Opus tur2 bunları salt okunur değerlendirecek. Kapanış PR'ı kendi üç CI kontrolü başarılı ve MERGED olmadan F9 kapanmış sayılmaz.

### Tur1 bulgularının giderilmesi

4a274180 capped aktör metnini düzeltti. Çapa ilk uygulamasındaki cache ömrü Terra kırmızısıyla düzeltildi(3c4312c2); yeni metadata yolunun kapsam kapısı ve readiness yarışı ayrıca bağımsız testlerle yakalanıp12711e3b ve30bfc952'de giderildi. Son bütünleşik84f9cff6 üzerinde Terra67 hedefli test/build başarılı. Bu sayılar aynı testlerin önceki koşumlarıyla toplanmaz. Yeni sparse gerçek-backend e2e kodu hazır ve CI ilk yürütmesini bekler; yerel Docker ROFS bu ek UI koşumuna engel oldu.

PR174 `553f5058` için CI44010736714 kalite/imaj/gerçek backend dumanı üç SUCCESS ile main8b797382 oldu. Kapanış kaynakları ve W188 ham tanığı tur2'ye sunulacaktır.

Son Terra üretim paketi sahte DOM dumanı390/1440, genel ayırıcı/okundu/SPA geri dönüş akışını geçti; CSP uygulanmadığı açık. Gerçek sparse CI kodu yeni request+null response+render bariyeri bekler ve yalnız kendi gruplarını temizler. İlk gerçek yürütme halen kapanış CI şartıdır; bu koşum geçmeden tamamlandı iddiası verilmez.

## Tur2 — kaynak/kanıt hükmü ve dar bulgu kapanışı

Opus `c00ab727` kaynağını ve ham W188 JSON'larını doğrudan inceledi: **KOŞULLU UYGUN**, P0/P1/P2 yok; tek faz kapanış koşulu PR'ın üç CI başarısı ve birleşmesidir. İlk turun W183/GroupInfo/notify_level/receipts/Koordinatörler özet alanları ikinci turda kaynak ve v0.25 etiketiyle ayrıca incelendi.

Tek bloklamayan P3, around okuması reddedilince resolving/frozen/ready yolunun kilitlenmesi ve yeni okundu kapısının o girişte okumayı durdurmasıydı. Koordinatör bu küçük hata yolunu da kapattı: Sonnet fcf7bc76, hatayı yerel çapa yok olarak ele alır; pencere korunur, ready açılır, resolving bırakılır ve entryToken eski girişin geç sonucunu eler. Yeni503 testi eski kodda kırmızı, düzeltmeyle yeşildir. Terra4 dosyada25 bağımsız testi geçirdi; ayrı gecikmeli A→B→A testi yapılmadı, jeton kaynakta incelendi. Normal yoldaki son UI dumanı84 kaynağına aittir; fcf hata yolunun kanıtı component testidir.

Bu bilinen bulgunun kapanış deltasına aynı tur2'de Opus ek kontrolü alındı; aşağıdaki son hüküm geçerlidir. Kapanış CI'ında yeni sparse gerçek-backend e2e ilk yürütmesi henüz gerçekleşmedi; başarılı varsayılmaz.

## Tur2 ek kontrol — nihai kaynak hükmü

Opus5f6f3365/ürünfcf7bc76(src ağacı080b0242) farkını salt okunur inceledi: **KOŞULLU UYGUN**. Bildirilen around hata yolu P3'ü kapandı; yeni P0/P1/P2/P3 yok. safe helper hata sonrası false döndürür; aynı giriş ready açılır/resolving bırakılır, mevcut pencere korunur ve eski A→B→A sonucu entryToken ile elenir. readFirstUnread güvenlik kapıları ve açık mesaj önceliği değişmedi. Terra25 testinin ham logu doğrudan görüldü.

Hata yolunda okundu görünür son mesaja kadar ilerler; görünmeyen daha eski sıra da backend'in okundu-ya-kadar anlamıyla kapanabilir. Bu, çapasız normal açılışla aynı mevcut davranıştır ve kilitlenme yerine seçilen sınırlı fallback'tir; bulgu değildir.

Yeni e2e tasarımı güvenli bulundu fakat ilk gerçek yürütmesi geçmiş sayılmadı. Tek kalan faz kapısı: kapanış başlığında kalite/imaj/gerçek backend(son sparse e2e dahil) üç SUCCESS ve PR MERGED. Bu koşul gerçekleşince koordinatör F9 kapanışını yürürlüğe alır. Denetim belgesi/prettier/koşullu kapanış başlıkları ürün kaynağını değiştirmediğinden kaynak hükmünü etkilemez. Başarısız CI varken tamamlandı iddiası verilmez.

CI1'deki iki test uyumu sonrasında yalnız first-unread.test.ts ve ChatPage.test.ts değişti; denetlenen ürün kodu değişmedi. Pencere/metadata istekleri ayrı ve daha kesin doğrulanır, ilgili query success koşulu kullanılır.6326/6328 ilk sonuç başarılı tamamlanmış sayılmaz; yeni başlığın tam CI kapısı şarttır.
