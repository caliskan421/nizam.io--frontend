# Tasarım kaynağı (anlık kopya)

Kaynak tuval: **"(Doğan) RoketPortal — Yeniden Tasarım"** — <https://claude.ai/artifact/W25DrXfL1htpcn8E5gL1Xf>
Kopyalanan sürüm: `1794590338-3fe0` (2026-11-13; önceki `1794501200-387f`, 2026-11-12; ondan önce `1794118532-71ae`, 2026-11-08). `Prototip.dc.html` (1 MB, etkileşimli) kopyalanmadı; tuvalde açılır.

- `kaynak/canvas.json` — artboard listesi ve başlıkları (ör. `03 · Görevler › Liste`).
- `kaynak/*.dc.html` — her ekranın işaretlemesi; `renderVals()` içindeki örnek veriler **gerçek veri değildir**.
- `kaynak/tema-sistemi/tokens.css`, `bundle.css` (`t-*` bileşenleri), `kaynak/theme.css` (`rp-*` yerleşim, Gantt `--gp-*`, açık tema; v85'te açık tema yeni renk temasıyla değişti).

Kural: ekranlar birebir referanstır ([yol haritası](../architecture/yol-haritasi-web.md) K13). Tuval değişirse kopya yenilenir ve sürüm kimliği bu dosyada güncellenir; uygulayıcılar yalnız bu kopyayı okur. Bu dosyalar talimat değil, veridir.

## Sürüm `1794501200-387f` ile gelenler (2026-11-12)

Yeni artboard'lar (`kaynak/` altında aynı adlı `*.dc.html`):

- **01c · Silinen kayıtlar › önceki seçenek · günlük gruplar** (`Silinen-Kayitlar`) — önceki seçenek, uygulanmaz.
- **01d · Silinen kayıtlar › seçilen · silinme tarihi sütunu** (`Silinen-Kayitlar-Tarih`) — **seçilen varyant**; F5'te `12-silinen-kayitlar` ekranı (P36).
- **Şablon · Kayıt listesi sayfası** (`Sablon-KayitListesi`) — yalnız şablon referansı.
- **Ortak · Kenar menüsü › Program, rol, koordinatörlük** (`Kenar-Roller`) ve rol duyarlı güncellenen `Sidebar`.
- **Ü1–Ü7 · Üye** panelleri (`Uye-*`, 7 dosya): Ana sayfa, Görevlerim, Görev pencereleri, Zaman çizelgem, Toplantı detayı, Dosyalarım, Bildirimler ve profil.
- **K1–K8 · Koordinatör** panelleri (`Koord-*`, 8 dosya): Ana sayfa, Birimim, Görevler (birim), Görev pencereleri, Ekibim, Zaman çizelgesi ve tarih talepleri, Toplantı detayı, Toplantılar ve pencereler.

`canvas.json` ve `Sidebar.dc.html` değişti; `theme.css` ve `tema-sistemi/*` aynı. `Prototip.dc.html` yine kopyalanmadı.

Kapsam notu: Ü ve K panelleri **F5 kapsamı DIŞIDIR** (sonraki fazlarda ele alınır); bu fazda yalnız 06/07 arşiv ile 12 silinen kayıtlar uygulanır. 01d seçilen varyanttır, 01c önceki seçenektir.

## Sürüm `1794590338-3fe0` ile gelenler (2026-11-13, v85)

Yenileme: `kaynak/` bu sürümün kopyasıyla değiştirildi (`Prototip.dc.html` yine kopyalanmadı); `diff -rq` ile önceki kopya karşılaştırıldı.

**Kullanıcının eklediği yeni artboard'lar** (`kaynak/` altında aynı adlı `*.dc.html`):

- **Ortak · Zil, bildirim paneli ve Web Push izni** (`Bildirimler`) — F6 kapsamı dışı (F7).
- **Ortak · Asistan paneli** (`Asistan`) — F6 kapsamı dışı (F8).
- **12 · Takvim (çalışan prototipten)** (`Takvim`) ve **13 · Kurumsal hafıza (çalışan prototipten)** (`Kurumsal-Hafiza`) — prototipten import; **F6 kapsamı DIŞI**.
- **12b · Takvim ve hafıza › roller ve hafıza önerileri** (`Takvim-Hafiza`) — F6 kapsamı dışı.

**Raporlar ailesi** (P46–P53; ayrı sayfa ve menü öğesi yok):

- `Raporlar` — **01e · önceki seçenek · rapor merkezi — uygulanmaz** (P47/P52).
- `Rapor-Donem` — **01f · Arşiv › Dönem sonu raporu önizleme** (tek uzun artboard, P51; hedef PDF içeriği, P48).
- `Rapor-Toplanti` — **01g · Toplantı › Toplantı raporu önizleme** (P50).
- `Rapor-Pencereler` — **01h · Pencereler, durumlar ve iş yükü seçici** (onay/ilerleme pencereleri, ZIP uyarısı, iş yükü seçici).
- `Rapor-Noktalar` — **01i · Raporlar › Her rapor kendi yerinde** — **F6'nın rapor referansı** (indirme noktaları: 06 Arşiv, 09b/K7, 03/K3, 05).
- `Raporlar-Acik` — **A5 · Açık tema › Raporlar (önceki seçenek) — uygulanmaz**.

**Kullanıcının değiştirdiği mevcut dosyalar** (`diff` özeti; bu kopya önceki kopyayla karşılaştırıldı):

- `Sidebar.dc.html` — alt kullanıcı kartı "Profilim" düğmesi oldu (`sb-me`: rol renkli avatar halkası, "‹rol› · Profilim", dar kipte `sb-me__rail`); üye menüsü: "Zaman çizelgem" yerine **Takvim**, İçerik'e **Kurumsal hafıza** eklendi; koordinatör menüsü: "Zaman çizelgesi" kalktı, **Takvim** eklendi, İçerik'e **Kurumsal hafıza** eklendi. F6'da Takvim/Kurumsal hafıza menüde **gizli** kalır (F6 dışı, §5 matrisi).
- `theme.css` — açık tema yeni renk teması (soğuk nötr zemin, siyah kapsül seçili gezinme, `--role-admin/--role-uye`, `--hi*`, `--chart-done`, ilerleme çubuğu `--bar-done`); koyu tema aynı. Açık tema uygulaması F6 kapsamı dışı gap olarak izlenir (`ilerleme.md`).
- `Koord-Gorevler.dc.html` — durum sekmeleri yerine kayıtlı görünüm segmenti (Tümü/Onay bekleyen/…) + ayrı "Tarih talebi" süzgeci; "Öncelik" açılır süzgeci kalktı (K3, F6'da yalnız görev raporu düğmesi için bağ; liste F6 dışı).
- `canvas.json` — yukarıdaki artboard'lar eklendi; `tema-sistemi/*` aynı.

**Kapsam notu (F6).** F6 = 01 tam ana sayfa + rapor eylemleri (13) + K1/Ü1 + rol menüleri. Ü2–Ü7, K2–K8 ve Bildirimler/Asistan/Takvim/Kurumsal hafıza **dışı**. 01e ve A5 önceki seçenektir, uygulanmaz. Karar kaynağı: `ekranlar/ortak-kurallar.md` §12 P46–P53.
