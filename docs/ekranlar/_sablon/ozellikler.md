# <NN> — Özellikler (ne görünüyor)

Kaynak: `../../tasarim/kaynak/<Dosya>.dc.html` (sürüm `1794118532-71ae`). Örnek veriler gerçek değildir.

## 1. Yerleşim
Sayfa iskeleti: kenar menüsü + üst çubuk + ana alan + (varsa) yan panel. Genişlikler, sütun oranları, kaydırma alanları. Hangi `rp-*` / `t-*` sınıfları iskeleti kurar.

## 2. Bölgeler ve öğeler
Her bölge için tablo. **Öğe kimliği** `E-<grup>-NN` diğer üç dosyada aynı kalır.

### 2.1 <Bölge adı> (`rp-...`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar (hover, seçili, devre dışı, boş) | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-xx-01 | | düğme / sekme / sayaç / liste satırı / rozet / giriş / menü | | | | |

## 3. Pencereler, menüler, açılır paneller
Her biri: tetikleyici, içerik öğeleri, düğmeler, kapanış davranışı. (Tasarımda ayrı artboard ise adı.)

## 4. Metinler ve etiket sözlüğü
Durum adları, rol adları, kısaltmalar, tarih/sayı biçimleri (tabular-nums, "1–10 / 263" vb.), boş durum metinleri. i18n anahtarı önerisi gerekmez; metinler aynen.

## 5. Açık tema farkı
Hangi öğeler açık temada farklı davranır (token değişimi dışında). Yoksa "yalnız token".

## 6. Erişilebilirlik ipuçları
`aria-*`, `role`, klavye odak sırası, `data-tip` ipuçları — tasarımda görülenler.

## 7. Tasarımda belirsiz / çelişkili
Aynı öğenin farklı artboard'larda farklı görünmesi, eksik durumlar (yükleniyor/hata yok vb.).
