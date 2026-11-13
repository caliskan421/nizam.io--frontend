# 01b · Ana sayfa › İşlem geçmişi

**Codex kapısı:** KOŞULLU UYGUN (2026-11-08) — grup bulguları `dogrulama.md` Kapanış bölümünde; ortak kurallar `../ortak-kurallar.md`.

**F6 bağlantısı:** işlem geçmişinin hangi fazda açılacağı kararı [WEB-6 iskeleti](../../yurutme/web-6/README.md) hazırlığında ele alınır; F6 AÇILMADI.

**Artboard'lar:** `Islem-Gecmisi.dc.html` (`01b · Ana sayfa › İşlem geçmişi`; 1440×1500, yalnız koyu tema varsayılanı; açık tema artboard'u yok)
**Faz:** sonra (yeni modül, ayrı backend + web fazı) · **v1:** — (K14: v1 dışı, menüde görünmez) · **Yol haritası bağı:** K13, K14, §4 "sonra" satırı; eksik kaydı `BE-030` (ekranın tamamı)
**Rota (önerilen, K10):** `/islem-gecmisi` — tipli süzgeç parametreleri (öneri, URL'de): `from`, `to` (tarih; gün tıklaması / aralık), `tur[]` (işlem türü), `islem[]` (işlem kodu), `yapan[]` (kullanıcı kimliği), `koord[]` (departman kimliği veya "bağlı değil"), `q` (arama). Varsayım: tür/kimlik biçimleri backend fazında belirlenir.

## Özet
Portalda yapılan işlemlerin değiştirilemez denetim kaydını (audit log) listeleyen ekran. Ana sayfadaki "Son işlemler" kartının "Tümü" bağlantısıyla açılır (kenar menüsünde ayrı öğe yok; menü "Ana sayfa" etkin kalır). Üstte son 30 günün günlük işlem sayısını türlere göre yığılı çubuklarla gösteren etkinlik şeridi; altında "Yapan" ve "Koordinatörlük" çoklu seçim süzgeçleri, metin araması, etkin süzgeç çipleri; gövdede güne göre gruplanmış tablo (saat · tür rozeti · işlem + ayrıntı · yapan · koordinatörlük), "Daha fazla göster" ile artımlı yükleme ve "CSV indir" dışa aktarımı. Satır ayrıntı paneli tasarımda yok. Kim görür: tasarımda belirtilmemiş; alt başlık "portaldaki tüm işlemler" dediği ve oturum/IP kayıtları gösterildiği için **Varsayım:** yalnız yönetici (`company_admin`) merceği — ürün sahibine sorulacak. Ana veri kaynağı: backend'de yok (audit okuma ucu yok — `BE-030`, GAP-002, KR-09).

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
- Ekranı kim görür? Yalnız yönetici mi, koordinatör kendi koordinatörlüğünün kayıtlarını görebilir mi, üye kendi işlemlerini görebilir mi?
- Kapsam program mı kuruluş mu? Kırıntı kökü program adı (`<program adı>`) gösteriyor, alt başlık "portaldaki tüm işlemler" diyor; Hesap (oturum) olayları programdan bağımsızdır.
- Oturum kayıtlarında IP adresi ve tarayıcı/işletim sistemi gösterilmesi ve CSV'ye çıkması (KVKK) kabul mü? Saklama süresi nedir?
- İşlem türü kümesi: bu ekran Görev/Dosya/Toplantı/Mesaj/Hesap, Ana sayfa "Son işlemler" Görev/Arşiv/Toplantı/Mesaj/Giriş diyor. Hangisi geçerli? "Hesap" rol/yetki değişikliklerini de kapsar mı (KPI notu "oturum, rol ve yetki")?
- Satıra tıklayınca hedef nesneye (görev, toplantı, dosya) gidilecek mi? Veride `target`/`go` var ama tasarımda gösterilmemiş.
- CSV hangi kümeyi indirir: etkin süzgeçlerle eşleşen tümü mü, yalnız yüklenmiş satırlar mı? Satır tavanı?
- Sütun başlığı süzgeçleri (saat/tür/işlem) ile araç çubuğu süzgeçleri (Yapan/Koordinatörlük) birlikte mi kalacak; KPI şeridi (veride var, çizilmemiş) eklenecek mi?
