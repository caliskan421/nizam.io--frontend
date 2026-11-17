# Backend devir raporu — F9 (WEB-9), 2026-11-17

**F9 KAPANDI — bu kayıt, kendi başlığında üç CI SUCCESS ile main’e MERGED olmuş sürümde yürürlüğe girer. Açık PR dalı kapanış adayıdır.** Web pini **v0.25.0-api**; F10 açılmadı.

Kaynaklar: [kayıt](kayit.md), [F9 kapsamı](../yurutme/web-9/README.md), [canlıya alma matrisi](../yurutme/web-9/canliya-alma-matrisi.md), [ilerleme](../yurutme/web-9/ilerleme.md). Backend yalnız `v0.25.0-api` etiketi (`58856bbc`) üzerinden okundu; backend/mobil/program depolarına yazılmadı. Kullanıcı backend çalışmasını ayrı yürütür.

## 1. Pin ve sözleşme farkı

Tek PR ile v0.23 → v0.25 yükseltildi; ara v0.24 pini yok. Uç 248 → 261 (+13; v0.24 +6, v0.25 +7), şema 326 → 348 (+ 22), hata kodu 227 → 227. Üretilen tipler ve varsayılan üreticiler yenilendi. Pin PR170 kalite, imaj ve gerçek backend dumanı başarılı birleşti. Pin tek başına canlıya alma sayılmadı.

## 2. Kaynakta bağlanan satırlar

| İş                   | Tam bağlanan BE kimlikleri              | Davranış                                                                                                                         |
| -------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| W183                 | 081,082,086,160,162                     | Sunucu liste süzgeci/total, ilk okunmamış, liste tiki/önizleme, doğrudan alıntı hedefi, Koordinatörler grubu                     |
| W184                 | 028,083,084,085                         | Rol/üye bilgisi, paylaşılan sayıları/iki dosya kaynağı/görev bağları, receipts ve grup tiki, görevden kaynak mesaja bağlantı     |
| W185b                | 029,080,161                             | Tek multipart görev arşivi, atomik çoklu hedefe iletme, anonim anket                                                             |
| W185                 | 142,143,144,145,146,148,149,154,155,156 | Zengin18 tür, soğuk hedef, iki sayaç, server filtre, karar, grup/zamanlı tür/saklama metni, konu durumu ve konu mute/list/unmute |
| Ortak W183/W184/W185 | 027                                     | Liste sessiz rozeti, all/mentions/none tercihi ve sohbet bildirim/okundu zinciri                                                 |

Toplam 23 satır. Kayıt toplamı 163 satır = 77 bağlı + 84 açık + 2 vazgeçildi; yeni BE kimliği atanmadı. Kaynakta beklenen gerçek designStub sayısı31 → 16; nihai kaynak denetimi kapanışta doğrulanacaktır. Matris 28 satırının 23'ü tam, 5'i kalır. Yeni ekran/artboard yok: kaynak bağlantısı mevcut görev detayında, sessize alınanlar mevcut bildirim panelindedir.

Kayıt toplamı düzeltmesi: F8 raporundaki 160 satır/104 açık sayısı tarihsel bir raporlama hatasıdır. F8 kapanış commit'i a48a3e78 ve F9 başlangıcı 099dfe6e üzerinde kayit.md doğrudan sayıldı: 163 benzersiz satır = 54 bağlı + 107 açık + 2 vazgeçildi. F9'da 23 satır bağlanınca sonuç 77 bağlı + 84 açık + 2 vazgeçildi, toplam yine 163'tür. Yeni satır eklenmedi; BE-164/165/166 başlangıçta zaten vardı.

## 3. Kabul kararları ve korunan sınırlar

- P88: yeni bildirim action kabiliyeti şirket yöneticisi/koordinatör için mevcut korumalı iş mutasyonuyla tüketilir. Eski global görev aktör matrisi ve ADR-0041 kararı değiştirilmedi. Hedef başlıkları bildirim satırından gelir.
- İletmede kaynak sohbet/gönderen açıklanmaz, dönen kimliklerden mesaj gövdesi üretilmez. Ağ tekrarında aynı anahtar korunur; arşivde client_message_id de sabittir. Multipart metin alanları dosyadan önce gelir. Atomik davranış ve gerçek tekrar sonucu W188 tanığına tabidir.
- Anonim çoklu ankette tekil kişi sayısı sözleşmede yoktur. Kişi sayısı/yüzde uydurulmaz; oy sayısı ve en büyük seçeneğe oranlı çubuk gösterilir. Kendi oy mine alanından okunur.
- Mute listesi DTO'su yalnız kind/id/created_at taşır. Mevcut güncel available bildirim başlığı varsa kullanılır, yoksa nötr görev/toplantı metni ve tarih gösterilir. Şema dışı DTO/başlık veya program tahminiyle GET yoktur.
- Bildirimlerde SSE yoktur. Sohbet olayı shared/sse yolundadır; bildirim listesi mevcut odak/aralıklı yenileme mekanizmasını kullanır.
- Saklama200 grup ve bekleyen karar istisnası backend kuralıdır; istemcide 30 gün iddiası yoktur. BE-147 geri alma (GAP-246), BE-150 Tablolar ve BE-151/152/153 profil F9 dışında kalır.

## 4. Uygulama ve kabul kaydı

| PR  | İçerik                                        | Birleşme/CI                                     |
| --- | --------------------------------------------- | ----------------------------------------------- |
| 169 | O1 plan ve v0.25 kapsamı                      | main099dfe6e; CI43985113355 üç SUCCESS          |
| 170 | API pini                                      | main2bd788f3; CI43988603878 attempt2 üç SUCCESS |
| 171 | W183 sohbet A                                 | mainb69c6e9c; CI44001071112 üç SUCCESS          |
| 172 | W184 sohbet B                                 | mainabfc7916; CI44005439139 üç SUCCESS          |
| 173 | W185b sohbet C ve W186 regresyon düzeltmeleri | main718d67a2; CI44008206065 üç SUCCESS          |
| 174 | W185 bildirimler                              | main8b797382; CI44010736714 üç SUCCESS          |

Her uygulama paketinde Sonnet yerel ilgili testleri çalıştırdı; Terra ayrı test/etkileşimli duman yaptı. Sayıları örtüşen koşumlardan toplamak yerine ilgili ilerleme kaydına bakılmalıdır. W185 Sonnet 124 dosyada 983 test/type/lint/format/build başarılı; Terra bağımsız13 dosyada244 test,40 kayıt testi ve390/1440 sahte dumanıyla kabul verdi; PR174 üç CI ile birleşti.

## 5. Gerçek backend ve bağımsız denetim

W188 gerçek backend v0.25/58856bbc ve Caddy2.11.4-alpine tanık proxy üzerinde kaynak94fe0a3a'yı sınadı: görev detayından kaynak mesaja390/1440 pointer, around ve S3 başlıkları; çapraz program soğuk hedef; gerçek bildirim satırı görev/tarih kararı; sohbet tercih/okundu/grup zinciri; atomik iletme; anonim anket; arşiv201→aynı anahtar200 ve tek kayıt. [Doğrulama kaydı](dogrulama-F9.md) gerçek/fake/CI ayrımını ve kalan cihaz/timer kapsamını açıkça taşır.

Opus iki turda kaynak/sözleşme ve ham kanıtları salt okunur inceledi. İki ilk P3 ve ek around hata yolu giderildi; son delta hükmü KOŞULLU UYGUN, açık kaynak bulgusu yok. Tek faz kapanış koşulu kendi başlığında üç CI SUCCESS ve MERGED'dir; [denetim kaydı](../reviews/WEB-9-codex.md).

Son W189 kodunun yeni gerçek sparse UI kontrolü yerel Docker ROFS/login500 nedeniyle çalışmadı; bunun için eklenen gerçek-backend e2e temiz kapanış CI'ında çalışır. Önceki gerçek tanık kaynak sürümü, final sahte duman ve CI yeni testi birbirinin yerine sunulmaz. Test süreçleri durdu, ancak dört dead Docker kaydı/ağ/volume ROFS nedeniyle silinemedi.

## 6. Sonraki iş

### 6a. Web tarafı — F10 önerisi, açılmadı

F9 kapanışı sonrası ayrı kapsam kararı gerekir. Mevcut pinle yapılabilecek yüzeyler ile yeni backend sözleşmesi bekleyenler ayrılmalıdır. Tablolar model/tasarım hizalaması (GAP-224), rol kapsamlı audit/01b (BE-091), Ü7 profil ve diğer ikinci sıra ekranlar otomatik olarak F10'a alınmaz. Devralınan ADR-0041 ŞY aktör kararı ve E03C22 ürün kararları açık kalır.

### 6b. Backend'e sonraki paket adayları

F8 raporundaki sohbet/bildirim ikinci paketinin v0.25'te karşılanan kısmı artık yeni backend talebi değildir. Kalan öncelikler:

| Öncelik | Paket                                                    | Kayıt/bağımlılık                                                               |
| ------- | -------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 1       | Rol kapsamlı audit okuma ve hedef çözümü                 | BE-091/087…092; tüketiciler007/010/015/018/130. Ürün ve rol kararı önce gelir. |
| 2       | Takvim ve Kurumsal hafıza                                | BE-032/033; menü yüzeyi var, backend yok.                                      |
| 3       | Arşiv depolama dağılımı                                  | BE-025 kalanı; tür/etiket bazlı bayt.                                          |
| 4       | Birleşik silinenler listesi                              | BE-110/GAP-234.                                                                |
| 5       | Rapor/Gantt ayrıntıları                                  | BE-123/GAP-239, BE-136/GAP-237, BE-127/GAP-236.                                |
| 6       | Program kapsamlı departman purge                         | BE-163/ADR-0045.                                                               |
| 7       | Tablolar modeli ve tasarım hizalaması                    | BE-031/093…106, GAP-224; web ekranından önce karar.                            |
| 8       | Profil tercihleri/cihazlar/sessiz saat ve kalan kararlar | BE-151/152/153, BE-006/046/164, ADR-0041; ayrı kapsam kararı.                  |

F9 sırasında görülen düşük öncelikli sözleşme önerileri: anonim çoklu ankette tekil oy veren sayısı; mute listesinde güvenli title/state; metinsiz Web Push yükünde program_id/seq. Push mevcut yükte bu alanları taşımadığından OS push tıklamasında çapraz program ve kesin mesaj hedefi garanti edilmez; panel satırı bu bağlamı taşır. Bu önerilere yeni BE kimliği/stub atanmadı, backend deposuna yazılmadı. Sözleşme yayımlanmadan istemci alan uyduramaz.

## 7. Doğrulama borçları ve kapanış koşulu

- Borç 39: PR170 ilk CI reports-lifecycle boot/login localhost80 client.network_error 1/6011. İki dar 7/7 ve sonraki CI başarılı; kesin neden bulunmadı, kalıcı düzeltildi denmez. Eski geç401 borcu 38'den ayrıdır.
- W185b geniş koşum chat-window açık mesaj testi 5 s zaman aşımı; iki dar 11/11 geçti. Kesin yük nedeni kanıtlanmadı; değişen başlığın tam CI'ı sonradan geçti.
- Terra'nın somut arşiv yanıt kaybı/başarılı tekrarında pencere yaması ve mutable giriş snapshot regresyonları korundu; Sonnet düzeltmeleri bağımsız Terra dar tekrarında yeşil.
- Yürürlük kapısı: bu kapanış başlığının üç CI SUCCESS ile MERGED olmasıdır. Önceki ana uygulama PR'ları169–174 zaten üç CI ile birleşti; yeni sparse e2e sonucu da bu son kapıya dahildir.

W189 son kaynak ek kabulü: aktör tavanında “diğerleri”, listede olmayan sohbetin her girişte güvenli limit1 metadata okuması ve otomatik read readiness kapısı tamamlandı(30bfc952). Terra67 ilgili test/build başarılı; yeni gerçek sparse e2e temiz CI'da ilk koşumu bekler. W18894 sürümünde gerçek tanıklar tamam; son ek yerel UI koşumu Docker ROFS nedeniyle başlamadı. Nihai kaynak hükmü Opus tur2 ek kaydındadır; koşulu bu kapanışın CI/merge kapısıdır.
