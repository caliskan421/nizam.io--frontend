# 08 · Koordinatörlükler

**Codex kapısı:** KOŞULLU UYGUN (2026-11-08) — grup bulguları `dogrulama.md` Kapanış bölümünde; ortak kurallar `../ortak-kurallar.md`.

**Artboard'lar:** `Koordinatorlukler.dc.html` (`08 · Koordinatörlükler`, 1440×1700), `Koordinatorluk-Detay.dc.html` (`08b · Koordinatörlük › Altyapı ve tesisat`, 1440×1500)
**Faz:** F2 · **v1:** ✓ (düz liste) · **Yol haritası bağı:** K1, K2, K5, K6, K7, K13, K14 (departmanlar v1'de düz liste — hiyerarşi, aktif/pasif, birleştirme sonra), §4 F2 satırı ("koordinatörlükler (düz), departman/üyelik/koordinatör")
**Rota (önerilen, K10):** `/koordinatorlukler` — süzgeç parametreleri: `gorunum` (`liste` | `yapi`), `q` (metin), `sirala` (değer kümesi bilinmiyor); `/koordinatorlukler/:departmentId` — `departmentId` (kimlik), `sekme` (`genel` | `uyeler` | `gorevler` | `arsiv` | `toplantilar` | `ayarlar`). Varsayım: parametre adları rota kataloğunda kesinleşir.

## Özet
Programa bağlı koordinatörlüklerin (backend'de departman) kart ızgarası ve tek bir koordinatörlüğün ayrıntı sayfası. Liste ekranı birim başına kod, ad, koordinatör(ler), üye/görev/arşiv sayıları ve son etkinlik bayrağını; üstte "yapı sağlığı" uyarı şeritlerini, toplu işlem çubuğunu ve Liste/Yapı görünümünü gösterir. Ayrıntı ekranı sekmeli (Genel bakış, Üyeler, Görevler, Arşiv, Toplantılar, Ayarlar); Genel bakış'ta KPI şeridi, Hakkında, Alt birimler, Ekip, Dikkat gerektirenler, Kısayollar ve Son etkinlik kartları vardır. Tasarım yönetici (Admin) merceğiyle çizilmiştir (yeni koordinatörlük, birleştir, pasifleştir); Koordinatör ve Üye merceğinde ne görüneceği tasarımda yoktur. Ana veri kaynağı seçili programa bağlı departmanlar, onların ekip (üyelik/koordinatör) satırları ve görev sayılarıdır. K14 gereği v1'de üst birim/alt birim hiyerarşisi, "Yapı" görünümü, aktif/pasif, birleştirme ve toplu üye taşıma statiktir (BE-016, BE-017); görünürlük ve kuruluş tarihi statiktir (BE-018); son etkinlik yalnız yönetici merceğinde canlı (`last_activity_at`, görev hareketi), diğer merceklerde statiktir (BE-018).

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
- Koordinatör ve Üye merceğinde bu ekran (kenar menüsündeki "Koordinatörlükler") görünür mü; görünürse yalnız kendi birim(ler)i mi, programın tüm birimleri mi listelenir? Tasarım yalnız yönetici merceğini çizer.
- Hiyerarşi v1'de yokken liste ekranındaki üst birim grupları (`<birim adı>` vb.) nasıl gösterilecek: tek düz ızgara mı, grup başlıkları statik örnek olarak mı? (K14 "düz liste" → bu analiz düz ızgarayı varsayar.)
- "Yeni koordinatörlük" formu, Üyeler / Görevler / Arşiv / Toplantılar / Ayarlar sekmelerinin içeriği, üye çıkarma, koordinatör kaldırma ve programa departman bağlama arayüzü tasarımda çizilmemiş. Bunlar tasarım ekibinden mi gelecek, yoksa mevcut `t-*`/`rp-*` bileşenleriyle uygulayıcı mı kuracak?
- Ayrıntıdaki "Arşiv" sekmesi/kısayolu ve karttaki "arşiv" sayısı F5'e (v1 dışı) bağlı; "Ekibe mesaj" F7'ye (v1 dışı) bağlı; "Birim raporu (PDF)" F6'ya bağlı. v1'de gizlensin mi, devre dışı mı gösterilsin?
- "Diğer işlemler: sezona kopyala, roller" menüsü — "sezona kopyala" F2'deki dönem aktarımı mıdır?
