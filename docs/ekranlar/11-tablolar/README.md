# 11 · Tablolar

**Codex kapısı:** KOŞULLU UYGUN (2026-11-08) — grup bulguları `dogrulama.md` Kapanış bölümünde; ortak kurallar `../ortak-kurallar.md`.

**Artboard'lar:** `Tablolar.dc.html` (`11 · Tablolar`), `Tablo-Detay.dc.html` (`11b · Tablo › Fuar haftası vardiya planı`), `Tablo-Pencereler.dc.html` (`11c · Tablo › Paylaş`), `Tablo-Baglanti.dc.html` (`11d · Tablo › Tablo bağlantısı`), `Tablo-Birlikte.dc.html` (`11e · Tablo › Birlikte çalışma`), `Tablo-Detay-Acik.dc.html` (`A4 · Açık tema › Tablo`)
**Faz:** sonra (yeni backend modülüyle) · **v1:** — · **Yol haritası bağı:** K14 (v1 dışı, menüde görünmez), K13 (backend'de karşılık yok → tamamı `BE-031`), K8 (gerçek zamanlı yalnız sohbet — bu modülle çelişir, bkz. `mekanizma.md` §4.9), §4 "sonra" satırı; ihtiyaç tanımı `../../../../nizam.io--program/program/isler/girdi-excel-modulu.md` (faz kararı ürün sahibinin)
**Rota (önerilen, K10):** `/tablolar` — süzgeç `kapsam` (`tumu|benim|paylasilan`), `q`; `/tablolar/:tabloId` — `q`, `yapilacak` (`tumu|acik|tamam`), `sirala` (`<sütunId>:artan|azalan`), `satir` (bağlantıdan gelince parlatılacak satır). Tablo kimliği tipli (UUID varsayımı; bilinmiyor).

## Özet
Kullanıcıların kendi çalışma tablolarını kurduğu, ekibiyle birlikte doldurduğu genel amaçlı tablo modülü (Excel yerine). Liste ekranı (11) şablonla/boş başlatma ve "Tümü / Oluşturduklarım / Benimle paylaşılanlar" süzgeçli tablo kartlarını gösterir; düzenleyici (11b, açık teması A4) satır/sütun ekleme-silme-taşıma, yedi sütun tipi (Metin, Tarih, Yapılacak, Kişi, Koordinatörlük, Görev, Tablo bağlantısı), tek sütun sıralama, arama, yapılacak süzgeci ve alt özet satırı sunar; değişiklikler otomatik kaydedilir. 11c paylaşım (kişi başına Düzenler / Görür, sahip) ve yeni tablo penceresini, 11d tablolar arası satır bağlantısını (geri bağlar, erişimsiz hedefte kilitli çip) gösterir. 11e bir **kavram panosu**dur (gerçek ekran değil): canlı varlık, hücre yorumu, değişiklik geçmişi/geri al, sütun kilidi. Görünürlük rol merceğine değil tablo başına erişim listesine (sahip / düzenler / görür) bağlıdır; Kişi/Koordinatörlük/Görev sütunları NIZAM.IO kullanıcı, departman ve görev kayıtlarına referans verir. Backend'de hiçbir karşılığı yoktur (BE-031, XL).

## Dosyalar
| Dosya | Durum | Son güncelleme | Üreten |
|---|---|---|---|
| ozellikler.md | denetlendi | 2026-11-08 | tasarım analisti |
| mekanizma.md | denetlendi | 2026-11-08 | tasarım analisti |
| backend.md | denetlendi | 2026-11-08 | backend analisti |
| eksikler.md | denetlendi | 2026-11-08 | backend analisti |
| dogrulama.md | denetlendi | 2026-11-08 | denetçi (Sonnet) |

## Uygulama kararı tablosu (CX-M-07)

| E-kimliği | Faz | Davranış (canlı / statik / gizli / devre dışı) | Kabul edilmiş varsayım (öneri / kabul / ret — ortak-kurallar §2) | BE bağı | Bağımlılık | Kabul kanıtı |
|---|---|---|---|---|---|---|
| … | | | | | | |

Faz açılışında koordinatör doldurur; uygulayıcı yalnız `kabul` satırlarını kodlar.

## Açık sorular (ürün sahibine)
- Tablolar program kapsamlı mı (kırıntıda program adı var; 11e "programdaki herkes görür") yoksa kişisel/şirket geneli mi? İhtiyaç tanımı "NIZAM.IO'dan bağımsız çekirdek" diyor.
- Paylaşım yalnız kişi bazlı mı (11c) yoksa departman/program bazlı da mı (11e alt satırı)? "Bağlantıyı kopyala" erişim vermeyen düz URL mi, yoksa bağlantıyla erişim mi?
- Gerçek zamanlı (11b ipucu "herkes anında görür", 11e canlı varlık/imleç) K8 ile çelişiyor: modül fazında SSE kapsamı genişletilecek mi, yoksa sorgu tazelemesiyle mi yetinilecek?
- Sütun tipi listesi kesin mi? 11e'de para (₺) değerli "Bütçe" sütunu var; Sayı/Para tipi listede yok. İhtiyaç tanımındaki çoklu seçim, dosya, zorunluluk/doğrulama tasarımda yok.
- Sütun kilidi kimin yetkisi (sahip mi, koordinatör mü, "kilitleyen ve koordinatörler" mi)? Koordinatör tablo bazında mı program rolü mü?
- Tip değişiminde dönüştürülemeyen değerler ne olacak (ihtiyaç tanımı §3 "sessizce kaybettirmemeli") — tasarımda uyarı yok.
- Tablo silme / arşivleme / sahiplik devri / çoğaltma / şablona çevirme / dışa aktarma (Excel) için tasarımda öğe yok — v1 modül kapsamında mı?
- Erişimsiz hedef tablodaki bağlantı sayısının ("🔒 2 bağlantı", alt satır "5 bağlantı") gösterilmesi gizlilik açısından kabul mü?
