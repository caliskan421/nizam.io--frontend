# 06 · Arşiv

**Codex kapısı:** KOŞULLU UYGUN (2026-11-08) — grup bulguları `dogrulama.md` Kapanış bölümünde; ortak kurallar `../ortak-kurallar.md`.

**Artboard'lar:** `Arsiv.dc.html` (`06 · Arşiv`), `Arsiv-Klasor.dc.html` (`07 · Arşiv › Klasör`)
**Faz:** F5 · **v1:** — (F0–F4 dışı; tespit tam yapılır) · **Yol haritası bağı:** K1, K2, K5, K6, K7, K10, K13; §4 satırı "F5 arşiv — Klasörler, dosyalar, ZIP, silinenler/geri yükleme"
**Rota (önerilen, K10):** `/arsiv` — tipli süzgeçler: `q` (metin), `tur` (tasarım segmenti `tumu|gorsel|belge|pdf`; sözleşmedeki `mime_category` kümesi `belge, tablo, gorsel, arsiv, metin` — PDF ayrı kategori değil, `belge` içindedir; eşleme `eksikler.md` yeni-10), `sirala` (bilinmiyor; tasarımda yalnız "Son yükleme").
`/arsiv/:klasorId` — `klasorId` `archiveFolders` yanıtındaki `folder_id`'dir: yönetici ve koordinatörde koordinatörlük (departman) klasörü kimliği (kod: departman kimliği; sözleşme açıkça yazmaz — `archiveFolders` yanıtıyla doğrulanacak), üyede sabit sanal klasör `"my-tasks"` ("Görevlerim", `is_virtual`); süzgeçler: `gorev` (görev klasörü kimliği), `etiket`, `gorunum` (`izgara|liste`), `dosya` (önizlemedeki dosya kimliği), `q`.

## Özet
Arşiv, seçili programdaki görevlere yüklenmiş dosyaları koordinatörlük → görev klasörü hiyerarşisiyle gösterir; görev durumuna göre süzmez (tamamlanmamış görevlerin dosyaları da dahildir; tasarımdaki "tamamlanan her görevin kanıt dosyaları" metni bu yüzden yanıltıcıdır). 06 giriş ekranıdır: tüm arşivde arama, dosya türü süzgeci, koordinatörlük klasör kartları (dosya/görev sayısı, boyut, son yükleme), etiket listesi + yeni etiket formu ve depolama özeti. 07 bir koordinatörlüğün içidir: solda klasör ağacı, ortada görev klasörleri ve "son eklenen dosyalar" ızgarası (etiket ve görünüm süzgeci), sağda seçili dosyanın önizlemesi ve dosya eylemleri (indir, yeniden adlandır, etiket değiştir, taşı, sil). Yönetici, koordinatör ve üye merceğinin hepsi görür; ancak kapsam sunucuda sabittir: yönetici programdaki bütün koordinatörlük klasörlerini, koordinatör yalnız `X-Nizamio-Department` başlığındaki tek departmanı, üye tek sanal klasörü (`my-tasks`) görür; dönem ZIP'i yalnız yöneticiye, dosya yükleme yöneticiye kapalıdır (`istemci-akislari.md` §3–§4). Ana veri kaynağı `archiveFolders`, `archiveAttachments`, `archiveTasks`, `archiveUploaders` ve ZIP uçlarıdır (eşleme backend analistinde). Silinenler/geri yükleme yol haritasında F5 kapsamındadır ama tasarımda çizilmemiştir.

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
- Silinenler / geri yükleme (yol haritası §4 F5) tasarımda yok. Hangi ekranda, hangi biçimde gösterilecek? (Ayrı sekme mi, ağaçta "Silinenler" düğümü mü?)
- Tasarımdaki etiketler ("Saha görselleri", "Sonuç dosyası", "Güncel durum verisi") ve "yeni etiket" formu, backend'in kapalı etiket kümesiyle (`ister, plan, girdi, analiz, cikti, sonuc`) örtüşmüyor (BE-024). v1'de hangi etiket adları gösterilecek?
- "Dosya yükle" (06) ve "Yükle" (07) düğmeleri göreve bağlı olmayan yükleme mi, görev seçtiren bir akış mı? (BE-025; yükleme penceresi çizilmemiş.)
- Alt başlıktaki "Kurumsal hafıza" ifadesi, kenar menüsündeki ayrı ve v1 dışı "Kurumsal hafıza" modülüyle (BE-033) karışıyor; metin korunacak mı?
- "grup" / "çalışma grubu" rozeti neyi anlatıyor (departman türü, hiyerarşi, ortak klasör)? Backend'de karşılığı bilinmiyor; v1'de düz departman kararı (K14) ile ilişkisi?
- Koordinatör (başlıktaki tek departman) ve üye (tek sanal klasör) merceğinde sunucu tek klasör döndürüyor; 06'daki koordinatörlük ızgarası bu iki role nasıl görünecek (doğrudan 07'ye mi yönlenir)?
