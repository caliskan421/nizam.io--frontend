# 01b — Mekanizma (nasıl davranıyor)

Ekran v1 dışıdır (K14): menüde görünmez, rota kataloğuna v1'de eklenmez. Aşağıdaki davranış, ekran kendi backend fazıyla geldiğinde uygulanacak tasarım niyetidir. Backend karşılığı bugün yoktur (`BE-030`).

## 1. Giriş ve gezinme
- **Giriş:** Ana sayfa (`01-ana-sayfa`) "Son işlemler" kartındaki "Tümü" bağlantısı (`h.history`). Kenar menüsünde öğe yok; bu ekrandayken menüde "Ana sayfa" etkin kalır (E-01B-01). Derin bağlantı: `/islem-gecmisi` (öneri, K10).
- **Çıkış:**
  - Kırıntı kökü (E-01B-03) → program ana sayfası (Varsayım: `00-ortak` kırıntı davranışı).
  - "Yapan" hücresi (E-01B-32, `goActor`) → kişinin sayfası. Varsayım: `05-kullanicilar` 05b "Kişisel takip" (kişi kimliğiyle). Doğrulanmalı.
  - Hedef nesneye gidiş (E-01B-41, `go`): veride var, arayüzde tetikleyici yok → **bilinmiyor**. Olursa hedef türüne göre: görev → `03` ayrıntı paneli, toplantı → `09b`, dosya → `07` klasör; Hesap olaylarında bağlantı yok (`noLink`).
  - Geri/İleri (E-01B-02): tarayıcı geçmişi (`00-ortak`).
- **URL'de taşınan durum (öneri):** tarih aralığı (`from`/`to` ya da hazır ad), tür, işlem, yapan, koordinatörlük seçimleri, arama `q`. Böylece Ana sayfadan ya da kişi sayfasından süzgeçli derin bağlantı (ör. "bu kişinin işlemleri") kurulabilir. Varsayım: tasarım URL'den söz etmez; K10 ilkesinden türetildi.

## 2. Kapsam ve rol etkisi (K1, K2)
- Tasarım rol farkı göstermez (tek artboard). **Varsayım:** ekran yalnız yönetici (`company_admin`) içindir — gerekçe: "portaldaki tüm işlemler", herkesin oturum olayları ve IP adresleri, tüm koordinatörlüklerin süzgeçte listelenmesi. Koordinatör/Üye merceği için davranış **bilinmiyor** (ürün sahibine soru: koordinatör yalnız kendi koordinatörlüğünü, üye yalnız kendi işlemlerini görebilir mi?).
- Kapsam: kırıntı program adını gösteriyor → program kapsamı ima ediliyor; ama Hesap olayları programdan bağımsız. Program değişince (K2) sorgular iptal, liste yeniden yüklenir — kapsam türü netleşmeden bu varsayımdır.
- Eylem görünürlüğü yalnız okuma + CSV; yazma eylemi yoktur. CSV düğmesinin kimde görüneceği `istemci-akislari.md` §4'e girecek yeni satıra bağlıdır (bugün yok).
- K6: 403 sonrası `me` tazelenir; ekran erişimi kaybolursa Ana sayfaya dönüş (Varsayım).

## 3. Durum makinesi
| Durum | Değerler | Nerede |
|---|---|---|
| Tarih aralığı | hazır (`Bugün` / `Son 7 gün` / `Son 30 gün` / `Tümü`) ya da özel `[from, to]`; tek gün de bir aralıktır | URL (öneri) |
| Tür süzgeci | çoklu: Görev, Dosya, Toplantı, Mesaj, Hesap ("Tümü" = boş küme) | URL |
| İşlem süzgeci | çoklu işlem kodu (türe göre gruplu — Varsayım) | URL |
| Yapan süzgeci | çoklu kullanıcı kimliği | URL |
| Koordinatörlük süzgeci | çoklu departman kimliği + "bağlı değil" | URL |
| Arama | serbest metin | URL |
| Açık panel | yok / Yapan / Koordinatörlük / saat / tür / işlem (aynı anda en çok bir — Varsayım) | bellek |
| Şerit aralık çapası | shift ile tıklamada ilk seçilen gün | bellek |
| Yüklenen sayfalar | imleç listesi | sorgu önbelleği |

- Varsayılan açılış: veride "Son 7 gün" etkin ve çip olarak görünüyor → Varsayım: varsayılan aralık "Son 7 gün". Doğrulanmalı (çip "Tümünü temizle" ile kaldırılabildiğine göre varsayılan süzgeç kaldırılabilir).
- Hiçbir süzgeç hatırlanmaz (K2 depolama istisnası yalnız kapsam + tema).
- Her süzgeç değişikliği: liste sıfırlanır (ilk sayfa), sayaç ve seçenek sayıları yeniden hesaplanır. Şerit sabit "son 30 gün" penceresini gösterir; Varsayım: şerit yüksekliği süzgeçten bağımsız, seçili aralık dışındaki günler soluk (`data-in="false"`). Şeridin tür/kişi süzgecine uyup uymadığı bilinmiyor (bkz. ozellikler §7-3).

## 4. Etkileşim akışları
Ekranda **yazma eylemi yoktur**; kayıtlar değiştirilemez (E-01B-37). K5 yazma protokolü uygulanmaz.

- **Gün seçimi (E-01B-12):** tıklama → aralık = o gün; çip "`<gün>`" eklenir (önceki tarih çipinin yerine — Varsayım). Shift + tıklama → çapa gün ile tıklanan gün arasındaki kapalı aralık. Aynı güne tekrar tıklama davranışı bilinmiyor (Varsayım: seçimi kaldırır).
- **Araç çubuğu süzgeci (E-01B-16/17 → E-01B-18):** düğme paneli açar/kapar; onay kutusu değişikliği anında uygulanır; "Temizle" yalnız o süzgeci boşaltır; "Kapat" paneli kapatır. Etkin süzgeçte düğmede seçili sayısı ve vurgulu kenar görünür; her seçili değer bir çip olur.
- **Başlık süzgeçleri (E-01B-22..24 → E-01B-38):** "saat" → tarih aralığı paneli (iki tarih girişi + hazır haplar; hazır hap `aria-pressed`); "tür" → türler (renk noktası + sayı); "işlem" → işlem adları, türe göre gruplu (`rp-thgrp`). Panelde eşleşen seçenek yoksa `rp-thempty` (metin bilinmiyor). Etkin başlıkta `data-on="true"` ve sayı (`rp-thfilter__n`). Tamamı Varsayım (markup yok).
- **Arama (E-01B-19):** `onChange` ile uygulanır (Varsayım: yazarken gecikmeli). Kapsam: işlem metni, hedef adı, kişi adı (yer tutucudan). Türkçe büyük/küçük harf katlama GAP-036'ya bağlı. Aramanın çip üretip üretmediği bilinmiyor.
- **Çip kaldırma (E-01B-20)** → yalnız o değer düşer; **Tümünü temizle (E-01B-21)** → tüm süzgeçler ve arama sıfırlanır (Varsayım: arama da dahil; tarih aralığı varsayılana mı "Tümü"ye mi döner — bilinmiyor).
- **CSV indir (E-01B-08):** tıklama → etkin süzgeçlerle eşleşen kayıtların dosyası indirilir (Varsayım; yalnız yüklenmiş satırlar olabilir). Akış: düğme yükleniyor → sunucu tarafı dışa aktarım ucu (yok) → dosya indirme; hata/429 durumu tasarımda yok. Büyük kümede eşzamansız iş (hazır olunca bildirim) gerekebilir — bilinmiyor.
- **Daha fazla göster (E-01B-36):** sonraki sayfa eklenir; yeni satırlar mevcut gün gruplarına katılır (aynı gün iki sayfaya bölünebilir; grup sayacı o günün toplamını mı yüklenen satırları mı gösterir — bilinmiyor).

## 5. Liste davranışı
- Sıralama: zamana göre azalan (en yeni üstte), sabit; kullanıcı sıralaması yok.
- Gruplama: yerel güne göre (`rp-trgroup`), grup başında gün etiketi ve kayıt sayısı. Saat dilimi bilinmiyor (Varsayım: kuruluş saat dilimi, Europe/Istanbul).
- Sayfalama: "Daha fazla göster" → imleçli artımlı yükleme uygundur; sayfa numarası yok. Sayfa boyu bilinmiyor.
- Sayaçlar: "`<yüklenen>` / `<eşleşen>` kayıt gösteriliyor" — eşleşen toplam sunucudan gelmeli (istemci bilemez). Alt başlıktaki toplam süzgeçsiz tüm kayıtlar. Seçenek sayıları (faset) ve şerit günlük/tür sayıları da sunucu toplulaştırması gerektirir; yüklenen satırlardan hesap yanıltıcı olur.
- Süzgeçler arasında VE, süzgeç içinde VEYA (Varsayım; çoklu onay kutusu standardı).
- Seçenek listeleri: işlem yapmış kullanıcılar / koordinatörlükler (yalnız kaydı olanlar — Varsayım), sayıya göre azalan.

## 6. Boş / yükleniyor / hata durumları
- **Süzgeçle sonuç yok:** "Bu filtrelerle eşleşen kayıt yok." (E-01B-34), tablo başlığı kalır; sayaç "0 / 0" (Varsayım).
- **Şeritte boş gün:** 3 px iz + ipucunda "Bu gün işlem yok".
- **Hiç kayıt yok (yeni kuruluş):** tasarımda yok — Varsayım: aynı boş durum metni ya da ayrı metin; ürün sahibine.
- **Yükleniyor** (ilk yükleme, daha fazla, CSV): tasarımda yok — K7 / ortak iskelet varsayılanı.
- **Hata** (liste, şerit, CSV): tasarımda yok — ortak hata durumu varsayılanı; 429'da otomatik tekrar yok (K5 genel ilkesi).
- **K7 açık durumları:** "program yok" → program kapsamlıysa geçerli; `membership_required` → yönetici olmayanlar için ekran kapalıysa uygulanmaz. Kapsam kararına bağlı.

## 7. Öğe → davranış tablosu
| Kimlik | Öğe | Olay | Davranış | Bağ (mekanizma §, backend.md satırı) |
|---|---|---|---|---|
| E-01B-01..05 | Kabuk | — | `00-ortak` davranışı; menüde "Ana sayfa" etkin | §1, `00-ortak`; backend §1 kabuk satırı |
| E-01B-03 | Kırıntı kökü | tıklama | program ana sayfası | §1; backend §1 kabuğun `['programs']` verisi (CX-T-02) |
| E-01B-06 | Başlık | — | sabit | — |
| E-01B-07 | Alt başlık | yükleme | süzgeçsiz toplam kayıt sayısı | §5; backend §1 "uç yok"; eksikler yeni-4 (`total_all`) |
| E-01B-08 | CSV indir | tıklama | etkin süzgeçlerle dışa aktarım (Varsayım) | §4; backend §1/§2 `issueDownloadTicket`; eksikler yeni-5 |
| E-01B-09..11 | Şerit başlık/özet/ipucu | yükleme | 30 günlük toplam ve en yoğun gün | §5; backend §1 "uç yok"; eksikler yeni-4 (`activity_30d`) |
| E-01B-12 | Gün çubuğu | tıklama / shift+tıklama / hover / odak | tek gün ya da aralık seçer; ipucunu açar | §4; backend §1 `instanceProfile`; eksikler yeni-4 |
| E-01B-13 | Bugün işareti | — | bugünkü çubukta | §5 (saat dilimi); backend §1 `instanceProfile`; eksikler yeni-4 |
| E-01B-14 | İpucu balonu | hover / `focus-visible` | gün toplamı + tür dağılımı (sayı, yüzde) | §4; eksikler yeni-4 (`by_category`) |
| E-01B-15 | Eksen | — | pencere başı, ortası, "bugün" | backend §1 `instanceProfile`; eksikler yeni-4 |
| E-01B-16 | Yapan | tıklama | paneli aç/kapa | §4; backend §1 `listUsers` (dolaylı); eksikler yeni-1 (`actor[]`), yeni-4 |
| E-01B-17 | Koordinatörlük | tıklama | paneli aç/kapa | §4; backend §1 `listProgramDepartments`/`listDepartments`; eksikler yeni-1 (`department[]`), yeni-3, yeni-4 |
| E-01B-18 | Süzgeç paneli | onay kutusu / Temizle / Kapat | anında uygula / bu süzgeci boşalt / kapat | §3, §4; eksikler yeni-1, yeni-4 |
| E-01B-19 | Arama | değişiklik | metin süzgeci, liste sıfırlanır | §4; backend §1 E-01B-19; eksikler yeni-1 (`q`) |
| E-01B-20 | Çip × | tıklama | o süzgeç değerini kaldır | §4; eksikler yeni-1 |
| E-01B-21 | Tümünü temizle | tıklama | tüm süzgeçleri sıfırla | §4; eksikler yeni-1 |
| E-01B-22 | saat başlığı | tıklama | tarih aralığı paneli (Varsayım) | §4; backend §1 E-01B-22; eksikler yeni-1 (`from`/`to`), yeni-4 |
| E-01B-23 | tür başlığı | tıklama | tür paneli (Varsayım) | §4; backend §1 E-01B-23; eksikler yeni-1, yeni-2, yeni-4 |
| E-01B-24 | işlem başlığı | tıklama | işlem paneli (Varsayım) | §4; backend §1 E-01B-24; eksikler yeni-1, yeni-2, yeni-4 |
| E-01B-25, 26 | yapan / koordinatörlük başlığı | — | etkileşimsiz | eksikler yeni-3 (koordinatörlük) |
| E-01B-27 | Gün grubu | — | gün etiketi + gün sayacı | §5; backend §1 `instanceProfile`; eksikler yeni-1, yeni-4 (`days`) |
| E-01B-28..31, 33 | Satır hücreleri | hover | satır vurgusu; ayrıntının tamamı `title` ipucunda | §5; backend §1, §4; eksikler yeni-1, yeni-3, yeni-6, yeni-7 |
| E-01B-32 | Yapan hücresi | tıklama | kişi sayfası (Varsayım: 05b) | §1; backend §1 E-01B-32 (05b, `account_id`); eksikler yeni-1 (`actor`) |
| E-01B-34 | Boş durum | sonuç yok | metin | §6; eksikler yeni-1 |
| E-01B-35 | Sayaç satırı | liste değişimi | yüklenen / eşleşen | §5; backend §1 "uç yok"; eksikler yeni-4 (`total_matched`) |
| E-01B-36 | Daha fazla göster | tıklama | sonraki sayfa (imleç) | §4, §5; backend §1 E-01B-36; eksikler yeni-1 (imleç) |
| E-01B-37 | Değişmezlik notu | — | sabit | §4; backend §1 E-01B-37; eksikler §4-5 |
| E-01B-38 | Başlık süzgeç paneli | — | çizilmemiş; Varsayım içeriği §4 | §4; backend §1 E-01B-38; eksikler yeni-2, yeni-4 |
| E-01B-39 | KPI dörtlüsü | — | çizilmemiş; uygulanmaz | ozellikler §7-10; eksikler — (uygulanmaz) |
| E-01B-40 | Seçenek sayıları | panel açılışı | faset sayıları (sunucu) | §5; backend §1 E-01B-40; eksikler yeni-4 (`facets`) |
| E-01B-41 | Hedef + bağlantı | — | tetikleyici yok; arama alanı olarak kullanılır | §1, §4; backend §1 hedef satırları; eksikler yeni-1 (`target`), yeni-3 |

## 8. Bağımlılıklar
- **`00-ortak`:** kenar menüsü (etkin "Ana sayfa"), üst çubuk (gezinme düğmeleri, kırıntı, tema geçişi, bildirim zili), `rp-pop` açılır panel davranışı (dış tıklama/Esc), boş/yükleniyor/hata bileşenleri, avatar baş harf kuralı.
- **`01-ana-sayfa`:** "Son işlemler" kartı aynı veri kaynağının kısa görünümü ve bu ekrana giriş; `rp-logtype` rozeti, tür adları ve renkleri iki ekranda tek sözlükten gelmeli (bugün çelişkili — ozellikler §7-5). Ana sayfa akışı ayrıca yapanın rolünü gösterir.
- **`05-kullanicilar`:** "yapan" bağlantısının hedefi (05b); 05b "Etkinlik" sekmesi (BE-015) aynı audit kaynağının kişiye süzülmüş hali olabilir.
- **`08-koordinatorlukler`:** koordinatörlük süzgeci seçenekleri ve 08b "son etkinlik" (BE-018) aynı kaynak.
- **`03-gorevler-liste`:** görev etkinlik çizgisi (BE-007) aynı kaynak; hedef bağlantısı olursa görev ayrıntısı.
- **`09-toplantilar`, `06-arsiv`, `10-mesajlar`:** Toplantı/Dosya/Mesaj olaylarının üreticileri ve olası hedefleri.
- **Paylaşılan durum:** seçili program (K2), tema. Türkçe arama katlaması GAP-036.

## 9. Sözleşme notu (denetçi ekledi; tasarım niyetini değiştirmez)
Yukarıdaki davranış tasarım niyetidir. Backend kaydının (audit modülü README AUDIT-K02/K03/K06/K07, §5; GAP-002/067; KR-05/KR-09) bu davranışı bugün kısıtlayan yönleri; çözümleri `eksikler.md`'dedir, ayrıntı `ozellikler.md` §7-17…22:
- **Ayrıntı satırı (E-01B-31):** `details` en çok 300 rune ve yalnız kararlı değer; not metni ve gündem başlığı kayıttan değil, okuma anında hedef nesneden gelir (güncel değer; hedef silinmişse boş). Satırın `title` ipucu bu durumda "kayıt anındaki metin" değil "şimdiki başlık"tır.
- **Oturum ayrıntısı (E-01B-31, Hesap):** yalnız istemci kategorisi (`web` / `mobile` / `ops`) vardır; tarayıcı·işletim sistemi·IP tutulmaz ve CSV'ye (E-01B-08) çıkamaz.
- **Koordinatörlük sütunu ve süzgeci (E-01B-17, E-01B-33, §3 süzgeç durumu, §5 seçenek listesi):** work, identity, organization, program ve provisioning kayıtlarında kapsam NULL; yalnız records departman taşır. "Koordinatörlüğe bağlı değil" seçeneği ve "—" bugün bu kayıtların hepsini kapsar; süzgeç yeni-3 olmadan anlamlı çalışmaz.
- **Değişmezlik (E-01B-37) ve toplam (E-01B-07):** değişmezlik veritabanında zorlanmaz (GAP-067); saklama süresi verilirse eski kayıtlar silinir, bu yüzden "Tümü" ve alt başlık toplamı zamanla düşebilir. Geçmiş kayıt taşınmaz (KR-05): "Tümü" kurulumla başlar.
- **Tür süzgeci (E-01B-23, §3):** beş tür kümesi backend eylem öneklerinin (organization, program, reporting, assistant, provisioning, `security.`) tamamını karşılamaz; küme kararı verilene dek türsüz kayıtların hangi türde süzüleceği belirsizdir.

