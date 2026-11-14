# 10 — Mekanizma (nasıl davranıyor)

Bu dosya tasarımın davranışını tespit eder; uç / alan eşlemesi `backend.md`'ye, karşılıksız öğeler `eksikler.md`'ye aittir. Sözleşme bağı olarak yalnız `istemci-akislari.md` bölüm numaraları anılır (§10.x = sohbet). Ekran F7'dir, v1 dışıdır (K14). **F7 eki (W151, 2026-11-14):** P54–P66 kararlarıyla hizalandı; satır satır karar README "Uygulama kararı tablosu"ndadır; bu dosyadaki eski "Varsayım" işaretleri aşağıda kararla değiştirildi ya da §9'da kapatıldı. Optimistik gönderim **yoktur** (§9.1).

## 1. Giriş ve gezinme

- **Giriş:** kenar menüsü "Mesajlar" (E-10-01) → `/mesajlar`. **Karar (W151, N-10-33):** sohbet seçilmeden gelindiğinde ilk sohbet kendiliğinden açılmaz; sağ sütunda "Bir konuşma seçin" boş durumu gösterilir (tasarımda yok; K7 varsayılanı), dar ekranda yalnız liste görünür (§9.4).
- **Sohbet seçimi:** konuşma satırı (E-10-08) → `/mesajlar/:sohbetId`; kırıntının son öğesi sohbet adı olur (E-10-02). Geri/İleri tarayıcı geçmişini izler (00-ortak).
- **Derin bağlantılar:**
  - "Bağlantıyı kopyala" (E-10-45) → `/mesajlar/:sohbetId?mesaj=<seq>` (Varsayım). Açılınca mesajın çevresi yüklenir (§10.3 `around`), hedef E-10-49 odak vurgusuyla işaretlenir.
  - **Bildirim panelinden sohbet bağlantısı yoktur** (G20, N-10-31): sohbet mesajı bildirim üretmez (ADR-0026 "Bildirim yok", MESSAGING-K24, BE-027); panelde sohbet satırı çıkmaz. Bu bağlantı BE-027 kapanırsa yeniden ele alınır.
- **Ekrandan çıkışlar:**
  - Görev çipi (E-10-32) ve Mesajdan görev sonrası "Göreve dönüştürüldü" çipi → 03 Görevler ayrıntı paneli `/gorevler?gorev=<id>` (P55: yönetici K/Ü merceğinde de açılır; P61). Çip tıklanınca önce `getWorkItem` (S3; `getChatRefSummary.task.department_id`) görev yetkisini yoklar; yetkisizse 403/404 → çipin altında "Bu göreve erişiminiz yok", gezinme yapılmaz (kilitli kart çizilmez).
  - Dosya kartı (E-10-33) → indirme (bilet akışı); tasarımdaki kilitli kart (E-10-34) tıklanamaz. **Sözleşme notu:** sözleşmede kilitli kart yok; paylaşılan dosyayı her sohbet üyesi indirir, tek "görünmez" durum `available: false` ("artık yok" kartı, §2).
  - Grup bilgisi "Toplantı planla" (E-10-67) → `/toplantilar` (09; yalnız `isAdmin`/koordinatör görür); Yeni toplantı formu 09'dadır, mesaj bağlamı ve üye ön doldurması taşınmaz (P61 taslak).
  - Üye satırı "Mesaj" (E-10-69) → o kişiyle birebir sohbet (açar ya da mevcut olanı getirir, §10.1 "201 yeni, 200 mevcut").
- **URL'de taşınan durum:** seçili sohbet (yol), hedef mesaj (`?mesaj`), süzgeç sekmesi (`?filtre`, Varsayım). Arama metni, açık pencere, yanıt bağlamı, taslak URL'de değil.
- **Kapsam (program) değişince:** sohbetler program kapsamlıdır (S2). Kapsam değişince açık sohbet kapanır, liste yeni programdan okunur, SSE akışı yeni programla yeniden açılır (K2: eski kapsamın sorguları iptal). Rotadaki `sohbetId` yeni programda yoksa 404 → liste görünümüne dönülür. **Akış iptali (KESİN 26, §9.2):** program/hesap/oturum değişiminde akış ve uçuştaki okumalar iptal edilir; departman/mercek değişiminde `scoped(...)` sohbet önbelleği düşer (K2) ama akış sürer.

## 2. Kapsam ve rol etkisi (K1, K2)

- Ekranı programdaki her rol görür; liste içeriği sunucudan gelir (kişi yalnız üyesi olduğu sohbetleri görür). 10 (yönetici merceği; tasarımda sistem grubu "Koordinatörler", kendi koordinatörlüğü, serbest gruplar, birebirler) ile 10b (üye: "Genel", kendi koordinatörlük grubu, serbest grup, aynı birimdekilerle birebir) arasındaki liste farkı **veri farkıdır**, istemci süzmez. **Sözleşme notu:** "Koordinatörler" sistem grubu yok; kendiliğinden gruplar yalnız "Genel" (`auto_kind = general`) ve bağlı her koordinatörlük (`auto_kind = department`). Şirket yöneticisi "Genel"e (kaynak `program`) kendiliğinden dahildir, koordinatörlük gruplarının (kaynak `department`) üyesi olması ADR-0026'ya göre kendiliğinden değildir; **Karar (P64 taslak):** yönetici merceğinde listelenen koordinatörlük grupları sunucunun `listChats` döndürdüğüdür (yetki sunucuda; istemci süzmez; mercek yalnız program kapsamını seçer).
- Balondaki rol rozeti (E-10-28) ve üye satırındaki rol (E-10-69) **gösterimdir**; eylem kararı için kullanılmaz (K1).
- **Eylem görünürlüğü** rol dizesi karşılaştırmasıyla değil, `capabilities.ts` (sohbet modülü) üzerinden, `istemci-akislari.md` §4 ilkesi ve §10 kurallarıyla hesaplanır. Tasarımın işaret ettiği koşullu eylemler:
  - "Göreve dönüştür" (E-10-48): yalnız görev açabilenlere (tasarım notu; sözleşme §10.9 — şirket yöneticisi ya da hedef koordinatörlüğün koordinatörü; `getChat` rolü değil, program rolü). Hedef koordinatörlük çipleri (E-10-88) de aynı kuraldan süzülür.
  - Düzenle (E-10-46): yalnız gönderen (§10.2). Sil (E-10-47): gönderen; grupta `getChat.role == admin` olan her mesajı (§10.7 M-10 — tasarım herkesin yalnız kendi mesajını sildiğini varsayıyor). **Sözleşme notu:** kurucu (`founder`) başkasının mesajını silemez; üyenin kurduğu grupta yönetici yoktur, şirket yöneticisi de değil (MESSAGING-K07). Anket mesajı düzenlenmez (403).
  - Sabitle (E-10-43): tasarımda herkese açık; sözleşmede birebirde iki taraf, grupta yönetici/kurucu (§10.7, §10.10).
  - "@herkes" önerisi (E-10-61): sözleşmede yalnız grupta ve yönetici/kurucuya (§10.8).
  - Grup bilgisi: ad düzenle (E-10-63), üye ekle (E-10-66), gruptan ayrıl (E-10-71) — sistem / kaynaktan yönetilen grupta ve kaynaktan gelen üyede gizlenir (§10.1 `from_source`, "çıkarılamaz ve ayrılamaz"). Tasarımda bu ayrım çizilmemiş.
  - Anket (E-10-58): sözleşmede yalnız grupta; birebirde menü öğesi gizlenmeli (Varsayım).
- **İçerik yetkisi (tasarım varsayımı sözleşmeyle çelişir):** tasarım görev çipi, görev önerisi ("<n> kişi kilitli görür", E-10-50), iletilen kart (E-10-84) ve arşivden paylaşılan dosyanın (E-10-34, E-10-106) "her okuyana kendi yetkisiyle" gösterildiğini, yetkisi olmayana kilitli kart çıktığını varsayıyor. **Sözleşme notu: tersi.** Paylaşılan öğenin özeti her sohbet üyesine açıktır (`getChatRefSummary`, MESSAGING-K31); paylaşılan dosyayı her üye indirir (`downloadChatSharedFile`, MESSAGING-K32). Tek "görünmez" durum `available: false` (hedef artık yok / başka programa aktarıldı) → "artık yok" kartı; mesaj silinmiş ya da çağıran üye değilse 404 `messaging.ref_not_found`. İstemci kilit kararı vermez; "<n> kişi kilitli görür" sayısı gösterilmez, kilitli kart çizilmez. Gönderen yalnız o gün görebildiği öğeyi paylaşabilir (yoksa 422 `messaging.input_invalid`, `field: refs`). Görevi açmak yine görev yetkisiyle (`getWorkItem`) olur; yetkisizse kartta kalınır.
- **Yetki kaybı (K6):** gönderimde 403 → `me` + `me/departments` geçersizlenir; sohbetten düşüş SSE `member.changed`/`chat.changed` ile gelir (§10.5) → sohbet kapanır, liste tazelenir.

## 3. Durum makinesi

| Durum | Değerler | Nerede tutulur |
|---|---|---|
| Seçili sohbet | `sohbetId` / yok | URL yolu |
| Hedef mesaj (bağlantı, alıntı, sabit, arama) | `seq` / yok | URL sorgusu (`?mesaj`) — yalnız bağlantıyla gelişte; içerde gezinme bellekte |
| Süzgeç sekmesi (E-10-06) | Tümü / Okunmamış / Gruplar / Kişiler | URL sorgusu `?filtre` (geçici kabul, W151) |
| Liste araması (E-10-05) | metin | bellek (sorgu parametresi olarak sunucuya; Varsayım: gecikmeli) |
| Akış penceresi | yüklenmiş `seq` aralığı [A, Ü], "daha eski var" | TanStack Query (sohbet başına) |
| Okunmamış ayırıcı çapası (E-10-25) | sohbete girişteki ilk okunmamış `seq` | bellek; sohbet açık kaldıkça sabit, yeni gelen mesajla kaymaz (Varsayım) |
| Sabit şeridi dizini (E-10-22/23) | i / n | bellek |
| Yazma çubuğu | boş / metin / öneri açık (#, @) / ekle menüsü açık / yanıt bağlamı / düzenleme kipi | bellek, sohbet başına taslak (Varsayım); **depolamaya yazılmaz** (K2 istisnası yalnız kapsam + tema) → sayfa yenilenince taslak kaybolur |
| Satır araçları | gizli / görünür (hover, odak) / tepki seçici açık / menü açık | bellek (tek seferde tek menü) |
| Açık pencere | yok / Grup bilgisi / Mesaj bilgisi / Yeni grup / İlet / Mesajdan görev / Anket / Dosya paylaş | bellek; URL'de değil (Varsayım) |
| Grup bilgisi sekmesi (E-10-68) | Üyeler / Dosyalar / Görevler / Sabitli | bellek |
| Gönderim kuyruğu | gönderiliyor / gönderildi / bilinmiyor (K5) / reddedildi | bellek; istemci mesaj kimliği her taslakla birlikte korunur |
| SSE bağlantısı | kapalı / açılıyor / açık / bekliyor (geri çekilme) | `shared/sse` tekil; yalnız `/mesajlar` açıkken, (oturum nesli, program) anahtarına bağlı (N-10-10/11; P65 taslak) |

## 4. Etkileşim akışları

Ortak kural: bütün yazmalar K5 yazma protokolünden (`shared/http/mutation`) geçer; sohbet yazımları `X-Requested-With` taşır. Hata metinleri ve kodları `backend.md`'de eşlenir.

1. **Mesaj gönder** (E-10-59, E-10-60): Enter / Gönder → istemci mesaj kimliği üretilir (taslakla bağlı) → istek. Başarı: mesaj akışın sonuna eklenir, liste satırının önizlemesi ve zamanı güncellenir, okundu imleci ilerler. Ağ hatası / zaman aşımı: **sonuç bilinmiyor** (K5) — taslak ve aynı kimlik korunur, tekrar aynı gövdeyle (§10.2). "Silinmiş" çakışması: yeni kimlik üretilmez, taslak kullanıcıya bırakılır. **Sözleşme notu:** mesaj düz metindir (≤5.000 karakter, kontrol karakteri yok, biçimlendirme yok — MESSAGING-K08); tasarımdaki kalın parça (E-10-30) uygulanmaz. Tasarımda gönderiliyor / başarısız görünümü yok: **karar (W151):** optimistik balon çizilmez (§9.1); gönderirken Gönder düğmesi "Gönderiliyor" durumundadır ve taslak alanda kalır; sonuç bilinmiyorsa alan altında "Gönderim doğrulanamadı — Tekrar dene" (aynı kimlik).
2. **Yanıtla** (E-10-39, E-10-41 → E-10-51): yanıt bağlamı şeridi açılır, metin alanına odak; "Vazgeç" bağlamı kaldırır. Gönderimde yanıtlanan mesaj kimliği eklenir. Yanıtlanan mesaj silindiyse 404 → bağlam kaldırılır, kullanıcı uyarılır.
3. **Bahsetme** (`@`, E-10-57 → E-10-61): `@` ile öneri listesi; adaylar kişi (sohbet üyeleri), koordinatörlük, "herkes" (koşullu, §2). Seçim metne çip olarak girer; gönderimde yapılandırılmış listeye çevrilir (sunucu metni ayrıştırmaz, §10.8; en çok 20).
4. **Görev çipi** (`#`, E-10-56 → E-10-50): `#` sonrası yazılanla görev listesi **istemcide süzülür** (sunucu araması yok, §10.7); satırda tasarımda "<n> kişi kilitli görür" ve alt bilgi var (sözleşmede kavram yok, §2; sayı gösterilmez, alt bilgi yeniden yazılır). Ok tuşları + Enter seçer; seçilen görev çip olur, gönderimde referans olarak eklenir (en çok 10). Gönderen görevi göremiyorsa öneride çıkmaz. "<n> kişi kilitli görür" değerinin kaynağı yoktur: kavram sözleşmede yok (`eksikler.md` §4).
5. **Düzenle** (E-10-46): yalnız kendi mesajı. Varsayım: yazma alanı mesaj metniyle dolar, satır `rp-row--edit` vurgusu alır, yanıt bağlamı yerine "düzenleniyor" şeridi (çizilmemiş). Gönderimde son okunan düzenleme sürümü taşınır; çakışma (409) → K5 alan alan seçim yerine sohbette "mesaj başka yerde değişti" uyarısı + güncel metin (Varsayım). Başarı: "düzenlendi · SS:dd" (E-10-36). Bahsetme ve referans düzenlemeyle değişmez (§10.8) — çipler kilitli kalmalı.
6. **Sil** (E-10-47): onay (tasarımda yok; Varsayım: ortak onay diyaloğu) → istek → mesaj akıştan **kalkar** (sözleşmede tombstone listelenmez). Tasarım "silindi" görünümü çizmediğinden kaldırma esas alınır; alıntılarda "silinmiş mesaj" metni (§10.2).
7. **Tepki** (E-10-38, E-10-40): emoji seç → koy; aynı türe dokunuş → kaldır; farklı tür → yer değiştirir (kişi başına tek). Çip sayısı ve `aria-pressed` güncellenir. **İyimser güncelleme YOK** (karar, §9.1): çip meşgul görünür, 204 sonrası `around` okumasıyla gerçek durum çizilir. **Sözleşme notu:** tepki kümesi 4 türdür: `like`, `heart`, `check`, `star` (MESSAGING-K36; 👍 ❤️ ✅ ⭐). Tasarımdaki 😂 🎉 🙏 karşılıksızdır; seçici sözleşme kümesine iner ya da ürün kararıyla enum genişler (README açık sorusu). Tepki edenler gösterilmez.
8. **Sabitle** (E-10-43): koşullu görünür; başarıda sabit şeridi (E-10-22) ve mesaj metasında iğne. Sabitten kaldırma metni çizilmemiş.
9. **Mesaj bilgisi** (E-10-37, E-10-44 → E-10-72): pencere açılır, okudu / okumadı listeleri. Sözleşmede grup için karşılığı yok (BE-028) → F7'de statik / gizli kararı `eksikler.md`'de.
10. **İlet** (E-10-42 → E-10-81..85): alıcı ara + çoklu seç + isteğe bağlı not → "İlet". Sözleşmede iletme ucu yok (BE-028). Varsayım: her alıcıya ayrı gönderim; iletilen mesajda "İletildi" etiketi (`rp-bub__fwd`).
11. **Mesajdan görev** (E-10-48 → E-10-86..92): başlık (boşsa ilk 100 karakter), hedef koordinatörlük (zorunlu, tek), atanan, başlangıç / bitiş (başlangıç bugünden önce olamaz, bitiş başlangıçtan önce olamaz — alan hatası). İşlem anahtarı (K5 `Idempotency-Key`) zorunlu; aynı mesajdan ikinci görevde istemci uyarır (§10.9: sunucu engellemez). Başarı: görev 03 listesinin sorguları geçersizlenir; mesaj güncellenir (görev bağı). Mesajdaki görünüm belirsiz (ozellikler §7.6). **Sözleşme notu:** mesajda yalnız `task_ids` güncellenir (kart özeti yok); görevde kaynak mesaj alanı ve "görevin geçmişinde kaynak mesaj" izi yoktur (ozellikler §7.18, BE-007).
12. **Anket oluştur** (E-10-58 → E-10-93..100): soru ≤200, 2–10 seçenek (tekil, tek satır), tek / çoklu, isimli / anonim, son tarih (ileride). "Anketi gönder" → mesaj olarak gönderim (akış 1 ile aynı istemci kimliği kuralı). Anonim seçeneğinin karşılığı yok (ozellikler §7.9). Sözleşme sınırları: soru = mesaj gövdesi (≤5.000; tasarımın 200'ü istemci kesmesidir), seçenek ≤100 karakter, yalnız grupta.
13. **Oy ver** (E-10-35): seçeneğe dokun → tek seçimde değiştirir, çoklu seçimde kümeye ekler / çıkarır; tüm seçimler kaldırılınca oy geri çekilir. Yüzde çubukları ve "<n> kişi oy verdi" güncellenir. Kapanmış / süresi geçmiş ankette 409 → anket "kapandı" gösterilir, seçenekler `disabled` (görünümü çizilmemiş).
14. **Dosya paylaş** (E-10-54/55 → E-10-101..107): "Yeni yükle": dosya seç / sürükle → (isteğe bağlı) "Görev arşivine de kaydet" + görev + etiket → "Gönder". Sözleşmede ek tek istek tek dosya; görev arşivine birleşik kayıt yok (BE-029). "Arşivden": arşivde dosya seç → bağlantı olarak paylaş (kopyalanmaz). Yükleme ilerlemesi, tür / boyut reddi (izinli türler, tavan) tasarımda yok; hata alan altında gösterilir (Varsayım).
15. **Yeni grup** (E-10-04 → E-10-76..80): "Grup": ad ≤80 (sözleşme sınırı 100; istemci 80'de keser, ozellikler §7.19) + üye seç (aday listesinden) → "Grubu oluştur" → yeni sohbet açılır, listeye eklenir. "Birebir": aday listesinden kişi → sohbet açılır (yeni ya da mevcut). Aday listesinde olmayan kişi için "neden yazamıyorum" metni (§10.6) — tasarımda yok.
16. **Grup bilgisi eylemleri** (E-10-62..71): ad düzenle, üye ekle, sessize al (BE-027), "Yalnız @bahsedilince bildir" (BE-027), gruptan ayrıl (onay; Varsayım), üyeye "Mesaj". Kaynaktan yönetilen üye / grup için sunucu 409 döner; istemci düğmeyi göstermez.
17. **Okundu işaretleme:** sohbet görünürken ve akışın sonu görüş alanına girince okundu imleci son görünen mesaja ilerletilir (karar N-10-01: 1 sn gecikmeli, yalnız pencere odaktayken ve akışın sonu görünürken). Liste rozeti (E-10-14/15) ve sekme sayacı (E-10-07) sunucudan tazelenir. Tasarımda "tümünü okundu yap" yok.
18. **Yazıyor gönderimi:** metin alanına yazarken en az 3 sn aralıkla "yazıyor" sinyali (§10.10).

## 5. Liste davranışı

- **Konuşma listesi:** son etkinliğe göre, imleçli (sayfa numarası yok), aşağı kaydırınca devamı yüklenir (karar: "Daha fazla yükle" düğmesi, P4 kalıbı; mesaj akışında yukarı kaydırma `before` sayfalarını kendiliğinden yükler). Sistem grupları iğneli görünüyor (E-10-13): **sıralama sunucuya aittir**, istemci yeniden sıralamaz (README E-10-13).
- **Arama (E-10-05):** sunucu tarafı (grup adı, mesaj metni, birebirde karşı tarafın adı; en çok 100 karakter, §10.10). Türkçe I/ı katlama yok (GAP-036/GAP-213) — kullanıcıya bir şey söylenmez, bilinen sınır. Sohbet içi arama arayüzü tasarımda yok (yalnız ölü stil `rp-sres`, `rp-hl`).
- **Süzgeç sekmeleri (E-10-06):** "Okunmamış" / "Gruplar" / "Kişiler" süzgeçlerinin sunucu karşılığı yoktur (`listChats` yalnız `q`, `limit`, `cursor` alır; `backend.md` §1, `eksikler.md` yeni-1); bu yüzden yüklenen satırlarda istemcide süzülür ve tavan / imleç nedeniyle eksik olabilir.
- **Okunmamış sayacı (E-10-07):** Karar (P59 taslak): okunmamışı olan konuşma sayısı (sessiz kavramı yok, BE-027). Kaynağı liste satırları ise yalnız yüklenmiş sayfalar sayılır (yaklaşık). **Sözleşme notu:** kesin kaynak `getChatUnreadOverview.unread_chats` (S1); sessiz kavramı sözleşmede yok (BE-027).
- **Mesaj akışı:** sohbet içi sıra numarası imleci; ilk açılışta son sayfa (ya da okunmamış varsa ilk okunmamışın çevresi — Varsayım), yukarı kaydırınca daha eskiler, bağlantı / alıntı / sabit / arama ile bir mesajın çevresi. Gün ayırıcıları ve ardışık gruplama (aynı gönderen, Varsayım: kısa zaman aralığı) istemcide hesaplanır; ardışık grubun ilk balonunda ad + rol, sonunda avatar.
- **Sabit şeridi:** sabitler en yeniden eskiye, imleçsiz; "1/2" sayacı ve "Sonraki" istemcide döner.
- **Mesaj bilgisi listeleri:** ilk birkaç kişi + "ve <n> kişi daha" — genişletme davranışı çizilmemiş.
- **Görev önerisi:** sayfalı görev listesinden istemci süzmesi; tavan nedeniyle aranan görev çıkmayabilir (GAP-212).

## 6. Boş / yükleniyor / hata durumları

Tasarımda **hiçbiri** çizilmemiş. Aşağıdakiler "tasarımda yok — K7 varsayılanı" ya da sözleşme metnidir:

- **Program yok / departman ataması bekleniyor / programa departman katılmamış:** K7 açık durum ekranları (kabuk düzeyi).
- **Hiç sohbet yok:** tasarımda yok. Varsayım: "Genel" ve koordinatörlük grupları sunucuda ilk listede kurulduğundan (§10.1) pratikte boş liste nadirdir; yine de "Henüz konuşma yok" + "Yeni konuşma" düğmesi.
- **Sohbet seçili değil:** tasarımda yok (§1).
- **Boş sohbet (mesaj yok):** tasarımda yok.
- **Süzgeç / arama sonucu boş:** tasarımda yok.
- **Yükleniyor:** liste ve akış için iskelet (Varsayım: ortak `shared/ui` iskeleti); yukarı kaydırmada üstte küçük yükleniyor göstergesi.
- **Sohbet bulunamadı / erişim yok:** 404 sohbetin varlığını gizler → "Bu konuşma bulunamadı" + listeye dön (Varsayım).
- **Yazma kapalı:** birebirde karşı taraf programdan çıktıysa: "Bu kişi artık programda değil; mesaj gönderilemez." ve yazma alanı kapanır (§10.6). Tasarımda kapalı yazma alanı görünümü yok.
- **Neden yazamıyorum:** aday listesinde olmayan kişi için "Bu kişiyle doğrudan yazışamazsınız: birebir sohbet yalnız koordinatörlük zinciri içinde açılır. Ortak bir grupta yazışabilirsiniz." (§10.6) — Yeni konuşma "Birebir" kipinde ve üye satırı "Mesaj" bağlantısında gösterilir (Varsayım: konum). Aday listesi kırpıldıysa "Liste ilk 200 kişiyle sınırlı".
- **Gerçek zamanlı bağlantı koptu:** tasarımda gösterge yok. Karar (N-10-15): sessiz yeniden bağlanma; kopukluk 10 sn'yi aşarsa başlık altında küçük "Bağlantı yeniden kuruluyor…" (`role="status"`; ürün sahibine açık soru).
- **Hız sınırı (429):** otomatik tekrar yok (K5); gönderimde taslak korunur, "Biraz sonra tekrar deneyin".
- **Kilitli içerik:** tasarımda dosya için çizilmiş (E-10-34), sözleşmede karşılığı yok (§2); görev çipi / referans kartı için `available: false` "artık yok" görünümü çizilmemiş, uygulanacak olan odur.

### Gerçek zamanlı güncellemenin tasarımdaki izleri (K8)

| Kimlik | İz | Tetikleyen olay (§10.5 / §10.10) | Ekrandaki etki |
|---|---|---|---|
| E-10-19 | "<Ad> yazıyor…" | `typing` | başlık alt satırı geçici olarak değişir, birkaç sn sonra eski metne döner (Varsayım) |
| E-10-11, E-10-12 | Son etkinlik zamanı, önizleme, satır sırası | `message.created` / `updated` / `deleted` | liste uzlaştırması; satır en üste çıkar |
| E-10-07, E-10-14, E-10-15, E-10-16 | Okunmamış sayacı, sayı / @ / sessiz rozetleri | `message.created`, `read.updated` (başka cihazda okuma) | liste tazelenir |
| E-10-25 | "<n> okunmamış mesaj" ayırıcı | `message.created` (açık sohbet) | Varsayım: açık ve odaktaki sohbette yeni mesaj ayırıcıyı büyütmez, doğrudan okunur |
| E-10-26/27, E-10-30, E-10-36 | Yeni balon, "düzenlendi", silinen balonun kalkması | `message.created` / `updated` / `deleted` | akış uzlaştırması (`after`, `around`, kimlikle kaldırma) |
| E-10-38 | Tepki sayıları | `message.updated` | mesaj yeniden okunur |
| E-10-35 | Anket yüzdeleri, "<n> kişi oy verdi", kapandı | `message.updated` | mesaj yeniden okunur |
| E-10-22, E-10-36 | Sabit şeridi, iğne simgesi | `message.updated` | sabit listesi tazelenir |
| E-10-17, E-10-37 | Okundu tikleri | `read.updated` | birebirde karşı taraf imleci; grupta karşılık yok (BE-028) |
| E-10-62..69 | Grup adı, üye listesi, sohbete giriş / düşüş | `member.changed`, `chat.changed` | liste ve açık pencere tazelenir; düşüşte sohbet kapanır |
| E-10-02 | Zil noktası | bildirimler (F7, 00-ortak) | SSE kapsamı dışı (Varsayım: sorgu tazelemesi) |
| — | Çevrimiçi / son görülme | olay yok (§10.10) | tasarımda çizilmemiş; sözleşme alanları birebirde var, açılışta ve yeniden bağlanmada okunur |

Akış kuralları (K8, §10.5): `fetch` akışı (`Authorization` başlığı, `EventSource` değil), olaylar içeriksizdir → HTTP ile uzlaştırma, sohbet başına en az 1 sn birleştirme, 0–5 sn jitter + üstel geri çekilme (en çok 60 sn), yeniden bağlanmada önce akış sonra liste sonra açık sohbetin iki okuması (yeni mesajlar + görünür pencere). Ping yokluğunda bağlantı ölü sayılır.

## 7. Öğe → davranış tablosu
| Kimlik | Öğe | Olay | Davranış | Bağ (mekanizma §, backend.md satırı) |
|---|---|---|---|---|
| E-10-01 | Kenar menüsü | tık | `/mesajlar` | §1; 00-ortak |
| E-10-02 | Üst çubuk | — | kırıntı son öğesi = sohbet adı | §1; 00-ortak |
| E-10-04 | Yeni konuşma | tık | Yeni grup penceresi | §4.15 |
| E-10-05 | Arama | yazma | sunucu araması, liste yeniden okunur | §5 |
| E-10-06 | Süzgeç sekmeleri | tık / ok tuşları | listeyi süzer, URL'ye yazar | §3, §5 |
| E-10-07 | Okunmamış sayacı | — | okunmamış konuşma sayısı | §5; SSE §6 |
| E-10-08 | Konuşma satırı | tık / Enter | sohbeti açar, rota değişir, seçili animasyon | §1 |
| E-10-09..12 | Avatar, ad, zaman, önizleme | — | listeden gösterim; okunmamışta kalın önizleme | §5 |
| E-10-13 | İğne | — | sıralama / sabit göstergesi | §5; ozellikler §7.5 |
| E-10-14..16 | Rozetler | — | okunmamış / bahsetme / sessiz | §5, §6 |
| E-10-17 | Liste tiki | — | birebirde son mesajım okunduysa | §6 tablo |
| E-10-18, E-10-20 | Başlık, ⓘ | tık | Grup bilgisi penceresi | §4.16 |
| E-10-19 | Alt satır | SSE | yazıyor / tür ipucu | §6 tablo |
| E-10-21 | Görüntüleyen şeridi | — | belirsiz (ürün sahibine) | ozellikler §7.1 |
| E-10-22 | Sabit şeridi | tık | sabit mesaja git + odak vurgusu (Varsayım) | §4.8, §5 |
| E-10-23 | Sonraki | tık | sıradaki sabite geç | §3 |
| E-10-24, E-10-25 | Ayırıcılar | — | gün ve ilk okunmamış; gün çipi yapışkan | §3, §5 |
| E-10-26..28 | Mesaj satırları, ad + rol | — | ardışık gruplama istemcide | §5 |
| E-10-29 | Alıntı | tık | yanıtlanan mesaja git (`around`) + odak | §1, §4.2 |
| E-10-31 | Bahsetme çipi | — | gösterim; beni kapsıyorsa vurgulu | §4.3 |
| E-10-32 | Görev çipi | tık | 03 görev ayrıntısı (yetkiyle) | §1 |
| E-10-33 | Dosya kartı | tık | indirme | §1, §4.14 |
| E-10-34 | Kilitli dosya (tasarım) | — | tıklanamaz, ipucu; sözleşmede yok, yerine `available: false` "artık yok" kartı | §2 |
| E-10-35 | Anket | seçenek tık | oy ver / değiştir / geri çek | §4.13 |
| E-10-36 | Meta | — | saat, düzenlendi, iğne | §4.5 |
| E-10-37 | Okundu tiki | tık | Mesaj bilgisi | §4.9 |
| E-10-38 | Tepki çipi | tık | kendi tepkini koy / kaldır | §4.7 |
| E-10-39 | Satır araçları | hover / odak | araçları gösterir | §3 |
| E-10-40 | Tepki seçici | seçim | tepki koy | §4.7 |
| E-10-41 | Mesaj menüsü / Yanıtla | tık | yanıt bağlamı | §4.2 |
| E-10-42 | İlet | tık | İlet penceresi | §4.10 |
| E-10-43 | Sabitle | tık | sabitle / kaldır (koşullu) | §2, §4.8 |
| E-10-44 | Mesaj bilgisi | tık | Mesaj bilgisi penceresi | §4.9 |
| E-10-45 | Bağlantıyı kopyala | tık | panoya `/mesajlar/:id?mesaj=<seq>` | §1 |
| E-10-46 | Düzenle | tık | düzenleme kipi (yalnız gönderen) | §2, §4.5 |
| E-10-47 | Sil | tık | onay → sil (koşullu) | §2, §4.6 |
| E-10-48 | Göreve dönüştür | tık | Mesajdan görev penceresi (koşullu) | §2, §4.11 |
| E-10-49 | Odak vurgusu | gezinme | hedef mesajı işaretler | §1 |
| E-10-50 | Görev önerisi | `#` yazma, ok / Enter | görev çipi ekler | §4.4 |
| E-10-51 | Yanıt bağlamı | Vazgeç | bağlamı kaldırır | §4.2 |
| E-10-52, E-10-53 | Ekle + menü | tık | menüyü aç / kapat | §3 |
| E-10-54, E-10-55 | Arşivden dosya / Yeni dosya yükle | tık | Dosya paylaş (ilgili sekme) | §4.14 |
| E-10-56 | Görev kartı | tık | `#` önerisini açar | §4.4 |
| E-10-57 | Kişi ya da grup an | tık | `@` önerisini açar | §4.3 |
| E-10-58 | Anket | tık | Anket penceresi (grupta) | §2, §4.12 |
| E-10-59 | Metin alanı | yazma, Enter | yazıyor sinyali; gönder | §4.1, §4.18 |
| E-10-60 | Gönder | tık | gönder | §4.1 |
| E-10-61 | Bahsetme önerisi | `@` yazma | aday listesi | §4.3 |
| E-10-62..71 | Grup bilgisi | çeşitli | ad, üye, sessize al, bildirim tercihi, ayrıl, birebir aç, toplantı | §4.16, §1 |
| E-10-72..75 | Mesaj bilgisi | aç | okudu / okumadı listeleri | §4.9 |
| E-10-76..80 | Yeni grup | gönder | grup ya da birebir aç | §4.15 |
| E-10-81..85 | İlet | gönder | çoklu alıcıya ilet | §4.10 |
| E-10-86..92 | Mesajdan görev | gönder | görev oluştur + bağla | §4.11 |
| E-10-93..100 | Anket oluştur | gönder | anket mesajı | §4.12 |
| E-10-101..107 | Dosya paylaş | gönder | ek / arşiv bağlantısı (+ görev arşivi) | §4.14 |

`backend.md` bağı aynı `E-10-NN` kimlikleriyle kurulur (`backend.md` her tabloda kimlik sütunu taşır); bu tablonun bağ sütunu yalnız mekanizma bölümünü gösterir.

## 8. Bağımlılıklar

- **00-ortak:** kenar menüsü (Mesajlar öğesi; okunmamış göstergesi varsa F7'de bağlanır), üst çubuk (kırıntı, geri/ileri, tema, bildirim zili — panel F7), Kenar-Secici program kartı (program başına okunmamış rozeti — sözleşmede programlar arası okunmamış özeti var, tasarımda kartta rozet görünüp görünmediği 00-ortak'ta doğrulanmalı).
- **shared/ui:** `t-modal`, `t-input`, `t-select`, `t-chip`, `t-iconbtn`, `t-btn`, `rp-seg`, `rp-switch`, `rp-chipbtn`, `rp-pop`/`rp-menuitem`, `rp-ctabs` (03/05 sekmeleriyle ortak olabilir), avatar.
- **shared/http/mutation (K5):** istemci mesaj kimliği (sohbete özgü idempotency), `Idempotency-Key` (mesajdan görev), sürüm (`expected_revision`, düzenleme), sonuç bilinmiyor, 429.
- **SSE altyapısı (K8, P65):** `shared/sse` tek modül, yalnız sohbet; `fetch` akışı; kapsam/oturum değişimine (KESİN 26) ve belirteç yenilemeye (401 → tek refresh) bağlı; bildirimlerde SSE yoktur.
- **Diğer ekranlar:** 03 Görevler (görev çipi, mesajdan görev, görev önerisi kaynağı), 06/07 Arşiv (arşivden dosya, görev arşivine kaydet, etiket kümesi), 09 Toplantılar (Toplantı planla), 05 Kullanıcılar (rol / birim metinleri).
- **Paylaşılan durum:** seçili program (kapsam), tema; `me` (kendi kimliği → "Sen", sağ balon).

## 9. F7 eki (W151): kararlar ve kurallar
Bu bölüm yukarıdaki "Varsayım" işaretlerini kapatır ve `backend.md` §5 ile birlikte okunur. Karar durumları README tablosundadır.

### 9.1 İyimser gönderim yok (karar)
- `backend.md` eski "Varsayım" (iyimser güncelleme) **kapandı: YOK**. Mesaj, düzenleme, tepki, oy, sabit, silme, anket bitirme, mesajdan görev: ekran yalnız 201/200 cevabı ya da 204 + `around` okuması sonrası değişir.
- Gönderimde taslak ve **aynı `client_message_id`** alanda kalır; yeniden deneme aynı kimlik + aynı gövdedir (sonuç bilinmiyor, K5). Gövde değişirse yeni kimlik (yeni eylem). 409 `message_deleted` → yeni kimlik üretilmez.
- Yankı tekilleştirme: kendi gönderimimin SSE `message.created` yankısı geldiğinde `message_id` yerelde varsa okuma/ekleme yapılmaz.
- Mesaj yazımları pencereyi `setQueryData` ile günceller (parçalı `chats.messages`, `backend.md` §5); liste (`chats.list`) önizleme ve sıra için geçersizlenir.

### 9.2 Akış yaşamı ve iptal (KESİN 26, P65)
- Akış sahibi `/mesajlar` sayfasıdır; sayfa sökülünce akış kapanır (uçuştaki okumalar `signal` ile iptal). Gizli sekmede 30 sn sonra kapanır, görününce yeniden açılır ve uzlaştırılır (N-10-10).
- Program, hesap ya da oturum nesli değişince akış iptal edilir; yeniden açılış yeni anahtarla yapılır (`sessionBound`). Departman/mercek değişiminde yalnız `scoped` sorgu önbelleği düşer; akış sürer, açık sohbet yeniden okunur (K2).
- Her yeni okuyucu `sessionBound` kapısından geçer ve `signal`'i iletir (KESİN 26b); sökülmüş ekran ek iş başlatmaz (KESİN 26a): geç gelen okuma sonucu ekrana işlenmez, ortak önbellek uzlaştırması sürer.

### 9.3 Yeniden bağlanma ve uzlaştırma (özet; ayrıntı `backend.md` §5.1)
Jitter 0–5 sn, üstel ≤60 sn; 401 → tek belirteç yenileme; 429 → `Retry-After`; ölü bağlantı 60 sn çerçevesizlik; sıra: akış → `listChats` → açık sohbette `after=<Ü>` + pencere `before` yeniden okuması. Birleştirme ≥1 sn, sohbet başına tek toplu okuma; akış bütçesi dolunca sunucu keser (normal döngü).

### 9.4 Dar ekran yerleşimi (P62, KESİN 30)
- Tasarımda 390 px yok → akışta tek sütun: `/mesajlar` yalnız liste, `/mesajlar/:sohbetId` yalnız konuşma; başlıkta Geri düğmesi `/mesajlar`'a döner ve odak o konuşma satırına gider; tarayıcı geri aynıdır.
- Yedi pencere tam ekran, alt düğmeler yapışık (E-13-12 kalıbı). Satır araçları dokununca açılır; tepki seçici ve mesaj menüsü akışta yer açar, yazma çubuğunu örtmez; açılırlar 390 px'te tıklanarak/odaklanarak sınanır (KESİN 30).
- Dokunmatikte (`pointer: coarse`) Enter yeni satırdır; gönderim Gönder düğmesiyledir.

### 9.5 Pencere ve açılır yüzeylerde odak dönüşü (KESİN 27)
Grup bilgisi, Mesaj bilgisi, Yeni grup, Mesajdan görev, Anket, Dosya paylaş pencereleri, ekle menüsü (+), mesaj menüsü (…), tepki seçici ve öneri listeleri kapanınca (Esc, ✕, Vazgeç, dış tık, eylem sonrası söküm) odak tetikleyiciye döner (tetikleyici kalktıysa mantıklı komşuya: silinen mesajın satırı yoksa yazma alanına); liste yokken `aria-controls` verilmez; her kapanış yolu birim testlidir. Durum iletilerinde (`role="status"`) odak çalınmaz. Gönderim sonrası odak yazma alanında kalır.

### 9.6 Enter kuralı ve taslak
Enter gönderir, Shift+Enter satır ekler, IME bileşimi sürerken Enter göndermez, dokunmatikte Enter satırdır. Taslak sohbet başına bellekte tutulur (depolamaya yazılmaz, K2); sohbet değişince korunur, kapsam/oturum değişince ve yenilemede kaybolur; düzenleme kipinde taslak ayrı tutulur (düzenleme bitince önceki taslak geri gelir).

### 9.7 Okunmamış ayırıcı ve okundu
Ayırıcı yaklaşık kuralla çizilir (README E-10-25); `markChatRead` 1 sn gecikmeli (N-10-01). Kendi `read_seq` yoktur (BE-082); bu yüzden ayırıcı yalnız sohbet açılışında hesaplanır, sohbet açıkken yeni gelen mesaj ayırıcıyı büyütmez.

### 9.8 Alıntıya ve sabite gitme
Alıntıda `seq` yoktur (BE-162): yanıtlanan mesaj yüklü pencerede varsa kaydırılır; yoksa en çok 3 `before` sayfası aranır, bulunamazsa sessiz kalınır. Sabit şeridi ve bağlantı (`?mesaj=<seq>`) `seq` taşıdığından `around` kullanır.
