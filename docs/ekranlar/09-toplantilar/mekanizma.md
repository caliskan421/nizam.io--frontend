# 09 — Mekanizma (nasıl davranıyor)

Öğe kimlikleri `ozellikler.md` ile aynıdır. 09d/09e (E-09-55…65) **F4'te gizlidir** (KR-26, BE-023): davranışlar aşağıda tasarım niyeti olarak yazılır, F4'te bağlanmaz.

## 1. Giriş ve gezinme
- **Giriş:** kenar menüsü "İçerik › Toplantılar" (`00-ortak`, `active="meetings"`) → `/toplantilar`. Başka girişler: ana sayfa "yaklaşan toplantılar" (BE-009 notu, `01-ana-sayfa`), bildirimler (F7).
- **Liste → detay:** satırın tamamı (E-09-09) → `/toplantilar/:meetingId`.
- **Detay → liste:** kırıntıdaki "Toplantılar" bağlantısı; üst çubuk geri düğmesi tarayıcı geçmişini kullanır (`00-ortak`).
- **Detay → görev:** F4’te "Göreve dönüştü" bağlantısız etikettir; hedef departman bilgisi eksik (BE-065).
- **Kırıntı:** `<program adı> / Toplantılar[ / <toplantı başlığı>]`; program adı kapsamdan gelir.
- **URL'de taşınan durum:** zaman sekmesi (`zaman`), koordinatörlük süzgeci (`koordinatorluk`), tarih aralığı (`from`/`to`), detayda not süzgeci (`notlar`, isteğe bağlı). Pencere açıklığı URL'de değil.
- **Görüşme (statik niyet):** "Katıl" (E-09-30) → tam ekran görüşme (09d, kabuksuz katman); "Küçült" → 09e küçük pencere; kabuk içinde başka rotalara gezinilirken pencere kalır; "Büyüt"/video alanı → 09d; "Toplantı sayfası" → detay. F4'te rota yok; Varsayım: video fazında küçük pencere kabuk düzeyinde (route dışı) global durum olur.

## 2. Kapsam ve rol etkisi (K1, K2)
- Liste seçili programa bağlıdır (kenar menüsü Program kartı). Kapsam değişince eski sorgular iptal, liste yeniden yüklenir (K2); açık detay sayfası, yeni kapsamda toplantı görünmüyorsa K6 akışına düşer.
- **Admin merceği:** sezondaki tüm toplantılar (alt başlık cümlesi E-09-02); "Silinenler" sekmesi (E-09-05); koordinatörlük kümesini "Değiştir" (E-09-51); göreve dönüştürmede tüm koordinatörlükler (E-09-77).
- **Koordinatör merceği:** coordinatorship kipinde bağlı K görür; person kipinde yalnız sahip departmanı hâlâ koordine eden oluşturan yönetir; iki kipte katılımcı görür. Katılımcı yönetimi coordinatorship'te bağlı K, person'da ŞY veya yetkili oluşturandadır (K19/K21/K74); göreve dönüştürmede yalnız yönettiği **ve** toplantıya bağlı birimler (E-09-77 ipucu). Yeni toplantı penceresi 09c'de "koordinatör görünümü" olarak çizilmiş.
- **Üye merceği:** coordinatorship kipinde üye `members_included` açık (E-09-23) ve departmanı bağlıysa görür; her iki kipte de katılımcı olmak görünürlük verir (K19/K74). Gördüğü toplantıya not yazabilir.
- Mercek cümleleri (E-09-02, E-09-54 "Rolün") yalnız gösterimdir. **Eylem görünürlüğü** pinli meetings README §3/§4 K73/K74 ve `backend.md` §3 esas alınarak modülün `capabilities.ts` dosyasında hesaplanır; rol dizesi karşılaştırması yalnız yetki dosyasında yapılır. Gizleme güvenlik değildir (K6).

## 3. Durum makinesi
| Durum | Değerler | Yer |
|---|---|---|
| Zaman sekmesi | `yaklasan` (varsayılan) / `gecmis` / `silinenler` (yalnız izinliyse) | URL |
| Koordinatörlük süzgeci | yok / tek departman kimliği (çoklu seçim bilinmiyor) | URL |
| Not süzgeci | `tumu` (varsayılan) / `gorev` / `benim` | URL (isteğe bağlı) ya da bellek |
| Yüklenen not sayısı ("N not daha göster") | sayfa/imleç | bellek |
| Katılımcı grubu üye aç/kapa (E-09-49) | F4’te gizli; düz liste | yok |
| Eklenemeyenler uyarısı (E-09-46) | görünür / kapatıldı | bellek (yalnız son ekleme sonucu) |
| Açık pencere | yeni toplantı / göreve dönüştür / silme onayı / (tasarlanmamışlar) | bellek |
| Form taslakları | pencere başına; "sonuç bilinmiyor"da korunur (K5) | bellek |
| Görüşme (statik) | kapalı / tam ekran / küçük; sekme (Gündem/Notlar/Kişiler); panel açık/kapalı | F4'te yok |

Hiçbiri kalıcı depoya yazılmaz (K2 istisnası yalnız kapsam + tema).

**Toplantı zamanı durumu (türetilmiş, satır başına):** gelecek → normal; konferans canlı → `live`; "Bekliyor" (`due`) → anlamı bilinmiyor (Varsayım: zamanı gelmiş, konferans başlamamış). F4'te Canlı/Bekliyor gizli (P21).

## 4. Etkileşim akışları
Tüm yazmalar `shared/http/mutation` üzerinden (K5): `Idempotency-Key` aynı gövde için korunur, 429'da otomatik tekrar yok, "sonuç bilinmiyor"da taslak + anahtar korunur. Not: `istemci-akislari.md` §8'e göre toplantı notu `Idempotency-Key` ister; toplantı ve gündem maddesi `PATCH`'leri sürüm taşımaz ("bilinçli son yazan kazanır") — bu yüzden bu iki düzenlemede 409 alan seçimi beklenmez. Kesin başlık/alan eşlemesi `backend.md`'nin işi.

1. **Yeni toplantı** (E-09-03 → E-09-66…73): başlık (1–255), tarih (bugün ve sonrası), saat; en az bir koordinatörlük çipi zorunlu (`department_ids` minItems 1, ilki sahip); `person` kipinde tek sahip departman zorunlu, `participant_ids` görünürlük verir; `members_included: true` yasak (K73/K74), "Tüm üyelere" bayrağı yalnız coordinatorship kipinde;  doğrulanamayan davet sayısı ve otomatik katılım metni gizlenir. "Toplantıyı oluştur" → istek → başarı: pencere kapanır, liste geçersizlenir, Varsayım: yeni toplantının detayına gidilir (tasarımda yok). Hata: alan hataları ilgili girişe, geçmiş tarih hatası tarih alanına.
2. **Toplantıyı düzenle** (E-09-24): form tasarlanmamış. Varsayım: yeni toplantı formunun dolu hâli; tarih kuralı sunucuda yalnız "kurulum saat dilimindeki bugünden önceki gün olamaz"dır (K17); daha erken bir gelecek güne çekmek de geçerlidir, E-09-18'deki "yalnız ileri alınabilir" cümlesi tasarım metnidir ve sözleşmeyle uyuşmaz (`dogrulama.md`). `updateMeeting`'te `expected_revision` yoktur, son yazan kazanır.
3. **Tarihi ileri al** (E-09-25 menüsü): pencere tasarlanmamış; sunucu kuralı yalnızca geçmiş günü reddeder (K17), "yalnız ileri" kısıtı istemci ek kuralı olurdu (uydurma, yapılmaz).
4. **Sil** (E-09-25 → E-09-81): onay → silme → listeye dön, liste + silinenler sayacı geçersizlenir. Canlı konferans cümlesi video verisi yokken gösterilmez (Varsayım).
5. **Geri yükle / kalıcı sil** (E-09-83, yalnız Silinenler): geri yükle → satır kalkar, yaklaşan/geçmiş listesi geçersizlenir. Kalıcı sil → onay penceresi tasarlanmamış; Varsayım: E-09-81 benzeri `alertdialog` + E-09-84 metni.
6. **Gündem maddesi ekle** (E-09-35): Enter ile gönder, 1–300 karakter, boşsa gönderilmez; başarıda giriş temizlenir, sayaç ve ilerleme (E-09-31) güncellenir. Varsayım: iyimser değil, yanıt sonrası yenileme.
7. **Gündem maddesi işaretle/kaldır** (E-09-32): onay kutusu → güncelleme; işaretleyen + saat (E-09-33) yanıttan gelir. Son yazan kazanır; Varsayım: başarısızlıkta kutu eski hâline döner ve hata bildirilir.
8. **Gündem maddesi düzenle/sil** (E-09-34): menü tasarlanmamış.
9. **Not ekle** (E-09-38 / statik E-09-61): tasarımda 0 / 2000; F4’te P28 gereği N / 5000 (rune); `Idempotency-Key`; başarıda alan temizlenir, not listesi ve sayaçlar (E-09-36/37, liste E-09-15) geçersizlenir.
10. **Not düzenle / sil** (E-09-43): menüdeki eylemler izinlere göre; dönüşmüş not kilidi yalnız **üye** yazarında geçerlidir (E-09-42; K29); yönetici/koordinatör yazarın dönüşmüş notu düzenlenebilir (GAP-070). **Düzenlemede `expected_revision` zorunludur** (okunan `edit_revision`); bayatsa 409 `collaboration.edit_conflict` → notu yeniden oku, taslak / taban / sunucu değeri seçtir (K5; ADR-0027, K68). Düzenlemede "· düzenlendi" (`edit_revision > 1`) görünür. Silmede onay tasarlanmamış.
11. **Nottan görev** (E-09-41 → E-09-74…80): başlık önceden not metninden doldurulur (boşsa sunucu ilk 100 karakteri kullanır — ipucu); hedef koordinatörlük seçenekleri role göre; başlangıç/bitiş doğrulaması: bitiş ≥ başlangıç ve ≥ bugün (istemci ön denetim + sunucu hatası); hata varken "Görevi oluştur" `aria-disabled`. İşlem atomik (görev + not işareti + denetim kaydı); başarıda not bağlantısız "Göreve dönüştü" etiketi alır, "Göreve dönüştür" kalkar; görev listesi sorguları da geçersizlenir. Not bir kez dönüştürülür: ikinci deneme hatası (kod `backend.md`) → not yeniden yüklenir. `convertNoteToTask` hata listesinde `organization.confirmation_required` **yoktur**: etkili işlem onayı diyaloğu tetiklenmez. Gövdede tasarımda olmayan `priority` (gönderilmezse `orta`) ve `assignee_account_ids` alanları vardır; tasarım göndermez, görev atamasız açılır.
12. **Katılımcı ekle** (E-09-45): özel seçicinin açılmış tasarımı bulunamadı (P23 korunur; O1); tek kişi/istek (`user_id`), kısmi başarı istemcide toplanır → E-09-46 uyarısı (eklenemeyen ad + tek genel neden). Sunucu kişi bazında neden ayrımı sağlamaz (BE-066); yanıt biçimi `backend.md`.
13. **Katılımcı çıkar** (E-09-48 x): onay tasarlanmamış; Varsayım: onaysız, başarıda katılımcı toplamı güncellenir.
14. **Koordinatörlük kümesini değiştir** (E-09-51): pencere tasarlanmamış; yalnız coordinatorship kipinde admin, person kipinde yasak.
15. **Konferans eylemleri** (Katıl, Konferansı bitir, Herkes için bitir, Ayrıl, mikrofon/kamera/paylaşım): **F4'te gizli** (P21); düğme ve istek yok. Bu ürün/faz kararıdır: backend video uçları vardır ve sağlayıcı kurulum profiline bağlıdır (`livekit` varsayılan, profil 2'de `none` önerilir; GAP-133 ürün sahibi kararı bekliyor); "üretimde video kapalı" denemez, istemci `conference_available` alanını okur.

## 5. Liste davranışı
- **Toplantı listesi:** yaklaşan ve geçmiş için gün gruplarına ayrılır. Gruplama istemcide toplantı tarihinden ve bugünden hesaplanır: "Bugün", "Bu hafta" (yarından hafta sonuna, örnek "22 – 25 Ekim" Pazar'a kadar), "Gelecek hafta" (Pazartesi–Pazar); daha ileri tarihler için grup adı bilinmiyor (Varsayım: ay adı). Hafta başlangıcı Pazartesi (örnekten çıkarım). Yaklaşan sıralama artan tarih+saat; geçmiş: Varsayım azalan.
- **Sayfalama:** tasarımda sayfa/daha fazla yükle yok; alt sayaç "N yaklaşan toplantı". Sunucu sayfalaması/tavanı `backend.md`'de; tavan varsa "daha fazla yükle" eklenmeli.
- **Süzgeç:** koordinatörlük `department_id`, tarih `from`/`to` sunucuya gönderilir (K71). Sekme sayaçları (E-09-04/05) ve alt başlıktaki sayılar: Varsayım: yüklenen listeden istemcide sayılır; süzgeç sayaçları etkiler mi bilinmiyor.
- **Arama yok.**
- **Satır sayaçları** (gündem işaretli/toplam, not, kişi): liste yanıtında yoksa istemci satır başına detay çağırmamalı (fan-out); eksikse BE önerisi (`eksikler.md`).
- **Notlar:** ilk sayfa + "N not daha göster"; Varsayım: en yeni üstte değil, örnekte zaman artan sırada (14:15 → 14:25). Süzgeç sayaçları (Tümü/Göreve dönüşen/Benim) toplam bilgisi gerektirir; yalnız yüklenenden sayılırsa yaklaşık olur.
- **Gündem:** tümü tek seferde (madde tavanı bilinmiyor). İlerleme = işaretli/toplam.
- **Katılımcılar:** F4’te düz liste; grup ve aç/kapa gizli. `teams` verisi mevcut; çok ekipli ve boş ekipli gruplama kararı açık (BE-064).

## 6. Boş / yükleniyor / hata durumları
Tasarımda hiçbiri yok — K7 varsayılanları:
- Program seçili değil / program yok → K7 "Program yok" (yönetici: program oluştur).
- `membership_required` → "departman ataması bekleniyor".
- Liste boş (sekme başına) → tasarımda yok — K7 varsayılanı; Varsayım metni: "Yaklaşan toplantı yok" + (izinliyse) "Yeni toplantı".
- Süzgeç sonucu boş → tasarımda yok.
- Notlar boş → listede "not yok" metni var; detay kartında boş metin yok.
- Gündem boş → yalnız ekleme satırı; ilerleme "0 / 0" davranışı bilinmiyor.
- Silinenler boş → tasarımda yok.
- Detay 404 / erişim yok → K6 akışı (kapsam yeniden doğrulanır), sonra listeye dönüş.
- Yükleniyor: tasarımda yok — ortak iskelet (`00-ortak` / `shared/ui`).
- Yazma hataları: alan hataları girişte (`t-hint--error`), genel hata ortak bildirimle; 429 `Retry-After` iletisi.

## 7. Öğe → davranış tablosu
| Kimlik | Öğe | Olay | Davranış | Bağ (mekanizma §, backend.md satırı) |
|---|---|---|---|---|
| E-09-02 | Alt başlık | yükleme | sezon adı + sekme sayıları + mercek cümlesi | §2, §5 |
| E-09-03 | Yeni toplantı | tık | E-09-66 penceresini aç; görünürlük §4 | §4.1 |
| E-09-04 | Zaman sekmeleri | tık | `zaman` URL'ye; liste yeniden süzülür/yüklenir | §3, §5 |
| E-09-05 | Silinenler | tık | yalnız izinliyse görünür; silinen listesi (E-09-82) | §2, §4.5 |
| E-09-06 | Koordinatörlük süzgeci | tık → seç | `koordinatorluk` URL'ye; `department_id` sunucu filtresi (K71) | §5 |
| E-09-08 | Gün grubu | yükleme | tarihten istemcide gruplama | §5 |
| E-09-09 | Toplantı satırı | tık / Enter | detaya git | §1 |
| E-09-10 | Tarih kutusu | yükleme | normal; live/due F4'te gizli (P21) | §3 |
| E-09-12/13 | Koordinatörlük kodları/satırı | yükleme | ilk = sahip; çoklu ise "+ N koordinatörlük" | §5 |
| E-09-14…16 | Satır sayaçları | yükleme | liste yanıtından; yoksa fan-out yasak → eksik | §5 |
| E-09-19 | Alt sayaç | yükleme | seçili sekmenin sayısı | §5 |
| E-09-20 | Kicker | yükleme | göreli gün + tam tarih + saat | §5 |
| E-09-23 | Üyeler dahil | yükleme | bayrak açıksa görünür | §2 |
| E-09-24 | Düzenle | tık | form (tasarlanmamış); son yazan kazanır | §4.2 |
| E-09-25 | Diğer işlemler | tık | menü: tarihi ileri al, sil | §4.3, §4.4 |
| E-09-26…30 | Konferans şeridi | — | F4'te gizli (P21) | §4.15 |
| E-09-31 | Gündem ilerlemesi | gündem değişimi | işaretli/toplam yeniden hesap | §5 |
| E-09-32 | Gündem onay kutusu | değişim | işaretle/kaldır; başarısızlıkta geri al | §4.7 |
| E-09-34 | Madde menüsü | tık | tasarlanmamış | §4.8 |
| E-09-35 | Madde ekle | Enter | ekle (≤300) | §4.6 |
| E-09-37 | Not süzgeci | tık | yüklü notları süz; sayaçlar | §3, §5 |
| E-09-38 | Not ekle | tık | not yaz (≤5000 rune, Idempotency-Key) | §4.9 |
| E-09-40 | Göreve dönüştü etiketi | yükleme | bağlantısız (BE-065) | §1 |
| E-09-41 | Göreve dönüştür | tık | E-09-74 penceresi | §4.11 |
| E-09-43 | Not menüsü | tık | izinli eylemler (düzenle/sil) | §4.10 |
| E-09-44 | N not daha göster | tık | sonraki sayfa | §5 |
| E-09-45 | Katılımcı Ekle | tık | özel kişi seçici (açılmış çizim bulunamadı; O1) → kısmi sonuç | §4.12 |
| E-09-46 | Eklenemeyen uyarısı | x | kapat (bellek) | §3 |
| E-09-48 | Katılımcı çıkar | hover/odak → tık | çıkar | §4.13 |
| E-09-49 | Üye aç/kapa | — | F4’te gizli | §3 |
| E-09-51 | Değiştir | tık | yalnız coordinatorship kipinde admin; pencere tasarlanmamış | §4.14 |
| E-09-54 | Bilgi kartı | yükleme | oluşturan, tarih, görünürlük cümlesi (türetilmiş), konferans satırı gizli | §2 |
| E-09-66…73 | Yeni toplantı formu | gönder | doğrula → oluştur → liste geçersiz | §4.1 |
| E-09-74…80 | Göreve dönüştür formu | gönder | doğrula → atomik dönüştürme → not + görevler geçersiz | §4.11 |
| E-09-81 | Silme onayı | Sil | sil → listeye dön | §4.4 |
| E-09-83 | Geri yükle / Kalıcı sil | tık | geri yükle; kalıcı silmede onay | §4.5 |
| E-09-55…65 | Görüşme ve küçük pencere | — | F4'te gizli (P21, KR-26); niyet §1 | §4.15 |

## 8. Bağımlılıklar
- `00-ortak`: kenar menüsü (Toplantılar öğesi, Program/Rol/Koordinatörlük kartları), üst çubuk (kırıntı, geri/ileri, tema, bildirim), açık durum ekranları (K7), ortak `t-modal`, menü, onay diyaloğu, bildirim.
- `03-gorevler-liste`: görev listesi sorgularının geçersizlenmesi; nottan görev bağlantısı BE-065 nedeniyle açık.
- `08-koordinatorlukler`: koordinatörlük kodu/adı (`Department.code`), yeni toplantı çiplerinde üye sayıları.
- `05-kullanicilar`: P23 özel kişi seçici için aday veri kaynağı; ortak seçiciye sessiz geçiş yok.
- `01-ana-sayfa`: yaklaşan toplantılar kartı aynı liste sorgusunu paylaşabilir.
- Video (W7, KR-26): 09d/09e ve konferans şeridi; sonraki faz. Küçük pencere kabuk düzeyinde global durum gerektirir (`00-ortak` ile birlikte tasarlanmalı).
- Paylaşılan durum: seçili program (kapsam), tema (09d/09e tema dışı sabit koyu).
