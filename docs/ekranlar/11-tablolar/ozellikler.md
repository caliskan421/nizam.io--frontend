# 11 — Özellikler (ne görünüyor)

Kaynak: `../../tasarim/kaynak/Tablolar.dc.html`, `Tablo-Detay.dc.html`, `Tablo-Detay-Acik.dc.html`, `Tablo-Pencereler.dc.html`, `Tablo-Baglanti.dc.html`, `Tablo-Birlikte.dc.html` (sürüm `1794118532-71ae`). Örnek veriler gerçek değildir; aşağıdaki değerler yalnız biçim kanıtıdır.

Dosya ilişkisi: 11c ve 11d, 11b ile aynı şablondan türetilmiştir (`diff` ile doğrulandı). 11d yalnız örnek veride farklıdır (başka tablo: bağlantı sütunları dolu, bir satır seçicisi açık). 11c, 11b gövdesini iki pencereyle (Yeni tablo / Paylaş, aynı `t-modal`) değiştirir; veride yalnız Paylaş dalı açıktır. A4 (`Tablo-Detay-Acik`) 11b ile yalnız `default: light` farkındadır. 11e kendi `cb-*` sınıflarıyla çizilmiş, kenar menüsüz, sabit `data-theme="dark"` bir **kavram panosu**dur (`renderVals()` boş; tüm metin sabit).

## 1. Yerleşim

- **11, 11b, 11c, 11d:** `rp-page` → `rp-side` (Sidebar, `active="sheets"`, 272px; `00-ortak`) + `rp-main` → `rp-topbar` (geri/ileri, kırıntı, tema, bildirim; `00-ortak`) → `rp-head` (başlık + `rp-actions`) → `rp-body` (tek sütun, `flex:1 1 100%`, dikey `gap` 20px liste / 14px düzenleyici). Yan panel yok.
- **11 (liste):** `rp-toolbar` → "hızlı başlangıç" bölümü (`rp-shtpls`, `grid auto-fill minmax(220px,1fr)`, gap 12) → tablo kartları bölümü (`rp-shgrid`, `auto-fill minmax(280px,1fr)`, gap 16). Önizleme 1440×1100.
- **11b/11d (düzenleyici):** isteğe bağlı bağlı tablolar şeridi (`rp-shlinks`) → isteğe bağlı salt-okunur notu (`rp-shnote`) → `rp-toolbar` → ızgara kabı `rp-sh` (kenarlı, 14px yarıçap) → `rp-sh__scroll` (yatay kaydırma; açılır menülerin taşması için `padding-bottom:180px; margin-bottom:-180px`) → `rp-sh__table` (`role="grid"`, `min-width` sütun toplamı: 11b 1064px, 11d 1194px) → ipucu satırı. Her satır CSS grid; `grid-template-columns` sütun genişliklerinden üretilir: ilk iz 52px (`#`), sonra her sütun px genişliği, son iz `minmax(52px,1fr)` (sütun ekle hücresi / boş). Başlık satırı `z-index:3`, yapışkan değil (dondurma yok).
- **11c:** `rp-head` yerine "Paylaş penceresi" başlıklı tanıtım başlığı + `rp-shwins` (yan yana pencereler, `t-modal` `position:relative`, `min(560px, 100vw-32px)`). Gerçek uygulamada pencere 11b üzerinde kaplama olarak açılır (**Varsayım:** diğer pencereler gibi `t-modal` kaplaması (doğrulanacak: tasarım tuvali)).
- **11e:** 1440×1260 pano; üstte başlık bloğu, altında `grid 1fr 360px` (solda tablo örneği paneli, sağda "Son değişiklikler" paneli), en altta 4 sütunlu kural kartları.
- Dar ekran (`max-width:720px`): `rp-shtitle` 24/30px; yeni tablo penceresinde sütun satırı tip seçiciyi alt satıra alır.

## 2. Bölgeler ve öğeler

### 2.0 Kabuk (`00-ortak` — yalnız bağımlılık)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| — | Kenar menüsü "Tablolar" girdisi | menü | ikon ızgara, etiket "Tablolar" | `active="sheets"` | — | K14: v1'de menüde görünmez |
| — | Üst çubuk: geri/ileri, tema, bildirim | düğme | "Geri", "İleri" (devre dışı), "Temayı değiştir", "Bildirimler, N okunmamış" | ileri devre dışı | okunmamış noktası | `00-ortak` |
| E-11-01 | Kırıntı | bağlantı | `<program adı> / Tablolar` (11); `<program adı> / Tablolar / <tablo adı>` (11b–d) | son öğe `strong` | program adı, tablo adı | Program adı kırıntıda → kapsam bağı (bkz. §7) |

### 2.1 Liste başlığı (11, `rp-head`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-11-02 | Sayfa başlığı | başlık | "Tablolar" (`rp-h1`) | — | — | |
| E-11-03 | Alt başlık | metin | "`{N}` tablo · ekibinle birlikte düzenlediğin çalışma alanı" | — | toplam tablo sayısı | N hangi kapsamın sayısı: örnekte "Tümü" sayacıyla eşit. **Sözleşme notu:** liste toplam/sayaç kalıbı sözleşmede yok (mekanizma §8.3-g) |
| E-11-04 | Yeni tablo | birincil düğme | "+ Yeni tablo" | hover | — | Aynı eylem E-11-08 ve E-11-17'de |

### 2.2 Liste araç çubuğu (11, `rp-toolbar`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-11-05 | Tablo süzgeci | bölümlü düğme (`rp-seg`, `aria-label="Tablo filtresi"`) | "Tümü `n`", "Oluşturduklarım `n`", "Benimle paylaşılanlar `n`" | `aria-pressed` seçili | her seçenek sayacı (`rp-count`, mono) | Örnek: Tümü = Oluşturduklarım + Paylaşılanlar. **Sözleşme notu:** süzgeç sayaçları için sözleşmede kalıp yok (mekanizma §8.3-g) |
| E-11-06 | Tablo ara | arama girişi (240px, 36px yükseklik, ikonlu) | yer tutucu "Tablo ara" | boş/dolu | — | Neye göre aradığı bilinmiyor (**Varsayım:** ada göre (doğrulanacak: eksikler.md §2.2)) |

### 2.3 Hızlı başlangıç (11, `section aria-label="Şablonla başla"`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-11-07 | Bölüm etiketi | kicker | "hızlı başlangıç" | — | — | |
| E-11-08 | Boş tablo kartı | düğme (`rp-shtpl--blank`) | ikon "+" (vurgu zemini), "Boş tablo", alt "Sütunları kendin belirle" | hover kenar/zemin | — | E-11-04 ile aynı eylem |
| E-11-09 | Şablon kartı | düğme (`rp-shtpl`) | 36px ikon kutusu + ad (`strong` 14px) + sütun adları "A · B · C" (`rp-cap rp-trunc`) | hover | şablon: ad, ikon yolu, sütun adı listesi | Örnek 3 şablon (Görev listesi, Etkinlik planı, Envanter); sabit mi sunucudan mı bilinmiyor |

### 2.4 Tablo kartları (11, `section aria-label="Tablolarım"`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-11-10 | Bölüm etiketi | kicker | "son düzenlenenler" (`sh.listLabel`, değişken) | — | — | Başka değerleri bilinmiyor (süzgece/aramaya göre değişebilir) |
| E-11-11 | Tablo kartı | düğme (`rp-shcard`, `aria-label="<ad> tablosunu aç"`) | önizleme + gövde | hover: kenar koyulaşır, `translateY(-2px)`; `focus-visible` halka | — | Tümü tıklanır |
| E-11-12 | Kart önizlemesi | salt görsel (`rp-shprev`, `aria-hidden`) | başlık satırı (mono, büyük harf, 10px) + 3 veri satırı, 3 sütun eşit | — | ilk 3 sütun adı, ilk 3 satırın ilk 3 hücresinin görüntü metni; tarih "27 Eki" kısa biçim soluk; bağlantı hücresi "↗ 2" (bağlantı sayısı) soluk; kişi adı, görev kısa kodu ("ALT-7") düz metin | Hangi sütun/satırların seçildiği kuralı bilinmiyor; `rp-shprev__done` sınıfı (yapılacak tamam) tanımlı, örnekte kullanılmamış |
| E-11-13 | Kart başlığı + rol rozeti | metin + rozet | tablo ikonu + ad (15px 600, kesilir) + "Görüntüleme" (`rp-shrole`) | rozet yalnız salt-görüntüleme erişiminde | ad, `isView` | |
| E-11-14 | Kart meta satırı | metin | "`{satır}` satır · `{sütun}` sütun · `{senin | sahip adı}`" | — | satır/sütun sayısı, sahip | Sahip sen isen "senin" |
| E-11-15 | Kişi yığını | avatar yığını (`rp-av--sm rp-tip`, `tabindex=0`) | baş harfler; `data-tip` tam ad | hover/odak ipucu | erişimi olan kişiler (örnek 3–4) | Kaç avatardan sonra kesildiği bilinmiyor; "+N" kartta yok. **Sözleşme notu:** `full_name` null olabilir → nötr avatar (mekanizma §8.3-f) |
| E-11-16 | Son düzenleme | metin | "bugün 12:10", "dün" (`rp-nowrap`) | — | son düzenleme zamanı, göreli | Biçim kuralları §4 |
| E-11-17 | Yeni tablo kartı | düğme (`rp-shcard--new`, kesikli kenar, min 230px) | "+ Yeni tablo" | hover | — | Izgaranın son hücresi |
| E-11-18 | Boş durum | metin (`rp-empty`) | "Bu filtrede tablo yok." | süzgeç/arama sonucu boşsa | — | İlk kullanım (hiç tablo yok) için ayrı metin yok |

### 2.5 Düzenleyici başlığı (11b/11d, `rp-head`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-11-19 | Tablo adı | yerinde düzenlenen giriş (`rp-shtitle`, display font 30/38px) | yer tutucu "Adsız tablo"; `aria-label="Tablo adı"` | hover/odak zemin `bg-raised`; salt-okunurda `readonly`, hover zemini yok | tablo adı | Kaydetme `onChange` (odak kaybı/Enter) |
| E-11-20 | Alt satır | metin (`rp-sub rp-trunc`) | "Sen oluşturdun · son düzenleme bugün 11:40, `<kişi>`"; 11d: "… bugün 12:10, sen" | — | oluşturan (sen/ad), son düzenleme zamanı ve kişisi | Başkasının tablosunda metin bilinmiyor (**Varsayım:** "`<ad>` oluşturdu" (doğrulanacak: tasarım tuvali)) |
| E-11-21 | Kişi yığını düğmesi | düğme (`rp-shpeople`, `aria-label="Kişileri gör"`) | avatarlar (`title="<ad> · sahip|düzenler|görür"`, satır içi `style` alanı) + "+N" | hover zemin; "+N" yalnız `hasMore` | erişim listesi, rol etiketi | Paylaş penceresini açar; `p.st` stil alanı boş (renk halkası için olabilir — 11e) |
| E-11-22 | Paylaş | ikincil düğme | paylaş ikonu + "Paylaş" | — | — | Salt-okunurda da görünüyor (gizleme yok) — §7 |

### 2.6 Bağlı tablolar şeridi (11b/11d, `rp-shlinks`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-11-23 | Şerit başlığı | ikon + kicker | zincir ikonu + "bağlı tablolar" | yalnız bağ varsa (`hasLinks`) | — | |
| E-11-24 | Gelen bağ çipi | düğme (`rp-sh__linkchip`, `title="Bu tabloya bağlanan tablo"`) | "← `<kaynak tablo>` · `<sütun>` `<n bağlantı>`" (sayı `rp-count`) | hover | kaynak tablo adı, sütun adı, bağlı satır sayısı | 11b örneği |
| E-11-25 | Giden bağ çipi | düğme (`title="Bu tablonun bağlandığı tablo"`) | "→ `<hedef tablo>`" | kilitli varyant `rp-sh__linkchip--lock` (kesikli kenar, soluk) — erişimsiz hedef | hedef tablo adı, erişim | 11d örneği; kilitli hedefin adı yine de görünüyor. **Sözleşme notu:** erişimsiz hedefin adı gösterilemez (mekanizma §8.3-d) |
| E-11-26 | Gizli gelen bağ notu | metin (`rp-cap`) | `st.backHidden` — örnekte boş | yalnız `hasBackHidden` | erişimsiz kaynak tabloların özeti | Metni bilinmiyor (**Varsayım:** "+N erişimin olmayan tablo" (doğrulanacak: tasarım tuvali / eksikler.md §2.7)) |

### 2.7 Salt-okunur notu (11b, `rp-shnote`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-11-27 | Görüntüleme notu | bilgi kutusu (göz ikonu) | "Bu tabloyu yalnızca görüntüleyebilirsin. Düzenleme izni için `<sahip adı>` ile iletişime geç." | yalnız `ro` | sahip adı | Örnekte kapalı |

### 2.8 Düzenleyici araç çubuğu (11b/11d)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-11-28 | Tabloda ara | arama girişi (220px, 34px) | "Tabloda ara" | — | — | Hangi hücre tiplerinde aradığı bilinmiyor |
| E-11-29 | Yapılacak süzgeci | `rp-seg` (`aria-label="Yapılacak filtresi"`) | "Tümü `n`", "Açık `n`", "Tamamlanan `n`" | yalnız tabloda Yapılacak sütunu varsa (`hasTodo`) | sayaçlar | Birden çok Yapılacak sütununda hangisine göre — bilinmiyor. **Sözleşme notu:** sayaçlar için kalıp yok (mekanizma §8.3-g) |
| E-11-30 | Sıralama çipi | çip (`rp-hxchip`) + kaldır (×, `aria-label="Sıralamayı kaldır"`) | `st.sortLabel` (örnekte boş) | yalnız sıralama varsa | sütun adı + yön | Etiket metni bilinmiyor (**Varsayım:** "`<Sütun>` ↑" (doğrulanacak: tasarım tuvali)) |
| E-11-31 | Satır sayacı | metin (`rp-cap`) | "`{n}` satır" | — | görünen/toplam satır | Süzgeçli durumda biçim ("3 / 6 satır"?) bilinmiyor. **Sözleşme notu:** toplam sayı sözleşmede kalıp değil (mekanizma §8.3-g) |

### 2.9 Izgara başlık satırı (`rp-sh__row--head`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-11-32 | "#" başlığı | sütun başlığı (`aria-label="Satır"`) | "#" mono 11px | — | — | 52px |
| E-11-33 | Sütun başlığı | düğme (`rp-sh__hbtn`, `aria-expanded`) | tip ikonu (14px, soluk) + ad (12.5px 500, kesilir) + sıralama oku "↑"/"↓" | hover/açık: zemin `bg-raised`, metin koyu; `title` bağlantı sütununda "→ `<hedef tablo>`" | sütun adı, tipi, sıralama | Menüyü açar (§3.1). Salt-okunurda da açılır (yalnız sıralama) |
| E-11-34 | Genişlik tutamacı | ayırıcı (`rp-sh__rz`, `role="separator"`, `aria-orientation="vertical"`) | `title="Sürükle: genişlik · çift tık: varsayılan"`; `aria-label="<ad> sütununu genişlet veya daralt"` | hover/sürükleme: vurgu çizgisi (`rp-sh__rz--on`) | sütun genişliği (px) | 8px görünmez alan, `col-resize` |
| E-11-35 | Sütun ekle | ikon düğme (`rp-sh__addcol`, "+", `aria-label/title="Sütun ekle"`) | — | hover/açık; yalnız `canEdit` | — | Son izde; menü §3.2 |

### 2.10 Izgara satırları ve hücreler (`rp-sh__row`, `role="row"`, `id="shrow-<n>"`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-11-36 | Satır numarası / satırı sil | satır başlığı + ikon düğme (`rp-sh__del`) | sıra no (mono 11px); hover'da çöp ikonu; `aria-label="<n>. satırı sil"`, `title="Satırı sil"` | hover'da numara gizlenir, düğme görünür; hover kırmızı; yalnız `canEdit` | görüntü sırası (1..n) | Numara kalıcı kimlik mi görüntü sırası mı — bkz. §7 |
| E-11-37 | Metin hücresi | giriş (`rp-sh__in`, 13.5px) | düz metin; `aria-label="<sütun>, <n>. satır"` | odak: içte 2px vurgu çerçevesi + `bg-base`; salt-okunurda `readonly`, odak çerçevesi yok | string | |
| E-11-38 | Tarih hücresi | yerel tarih girişi (`type="date"`, mono 12.5px, `color-scheme` temaya göre) | değer `YYYY-AA-GG`; görüntü tarayıcı yerelinde | salt-okunurda `disabled` | tarih (saatsiz) | Önizleme/alt satırda "27 Eki" kısa biçim |
| E-11-39 | Kişi hücresi | seçici düğme (`rp-sh__pick`) | yuvarlak baş harf etiketi (`rp-sh__tag--person`, 22px) + ad | boşken yer tutucu "Kişi seç" yalnız satır hover/odakta; açıkken `aria-expanded`; salt-okunurda `disabled` | kullanıcı (ad, baş harf) | Menü §3.3 (aramalı). **Sözleşme notu:** `full_name` null olabilir (mekanizma §8.3-f); kişi dizini gizlilik kararıdır (§8.3-e) |
| E-11-40 | Koordinatörlük hücresi | seçici düğme | 3 harf büyük kısaltma etiketi (`rp-sh__tag`, mono 10.5px; örn. "OPE", "EĞİ", "İDA") + ad | yer tutucu "Koordinatörlük seç"; menüde arama yok (`pickSearch:false`) | departman (ad, kısaltma) | Kısaltma ilk 3 harf büyük (Türkçe büyük harf kuralıyla) |
| E-11-41 | Görev hücresi | seçici düğme | turuncu etiket (`rp-sh__tag--task`; görev kısa kodu, örn. kartta "ALT-7") + görev başlığı | yer tutucu "Görev seç"; aramalı | görev (kod, başlık) | 11b/11d örneğinde dolu görev hücresi yok; biçim CSS'ten ve kart önizlemesinden çıkarıldı |
| E-11-42 | Yapılacak hücresi | onay kutusu (`t-check`, 18px, ortalı) | — | işaretli/boş; salt-okunurda `disabled`; tamam hücresi `rp-sh__cell--done` (stil tanımsız) | boolean | |
| E-11-43 | Tablo bağlantısı hücresi | çip listesi (`rp-sh__rel`) + ekle "+" (`rp-sh__reladd`) | çip: ↗ ikonu + hedef satırın birincil değeri (12px, kesilir); `title="<hedef> tablosunda aç"`; "+" `aria-label="<hedef> tablosundan satır bağla"`, `title="Satır bağla"` | çip hover: alt çizgi; "+" yalnız satır hover/odak/açıkken görünür; `relCanAdd` yoksa "+" yok; hedef silinmişse "Tablo bulunamadı" | bağlı satırların listesi (çoklu) | 11d; menü §3.4. Çipler taşınca kesilir (sarmalanmaz) |
| E-11-44 | Kilitli bağlantı çipi | çip (`rp-sh__relchip--lock`, kesikli, 🔒) | "🔒 `<n>` bağlantı"; `title="“<hedef>” tablosuna erişimin yok"` | tıklanabilir görünüyor (düğme); "+" yok | bağlı satır **sayısı** | Erişimsiz hedefte değer yerine sayı. **Sözleşme notu:** sayı gösterilemez; tek `available:false` durumu (mekanizma §8.3-d) |
| E-11-45 | Satır parlaması | animasyon (`rp-sh__row--flash`, 1.8sn, altın sol çizgi + zemin) | — | bağlantıdan gelinen satır | — | Örnekte etkin değil |
| E-11-46 | Eşleşme yok | boş durum (`rp-empty`) | "Eşleşen satır yok." | arama/süzgeç sonucu boş | — | Hiç satır yokken ayrı metin yok |
| E-11-47 | Yeni satır | tam genişlik düğme (`rp-sh__addrow`) | "+ Yeni satır" | hover; yalnız `canEdit` | — | Satırların altında, alt satırın üstünde |
| E-11-48 | Alt özet satırı | satır (`rp-sh__row--foot`, `rp-sh__calc` 11.5px tabular-nums) | sütun başına tip özeti: Kişi "`n` kişi"; Metin "`n` dolu"; Koordinatörlük "`n` koordinatörlük"; Tarih "`27 Eki – 30 Eki`" (en erken–en geç); Yapılacak "`k` / `n` tamam"; Tablo bağlantısı "`n` bağlantı" (kilitli sütunda da) | — | sütun toplamları | Görev tipinin özeti bilinmiyor. Kişi "6 kişi" farklı kişi mi dolu hücre mi bilinmiyor. **Sözleşme notu:** toplamlar sözleşmede kalıp değil; "`n` bağlantı" erişimsiz sütunda gösterilemez (mekanizma §8.3-d, §8.3-g) |
| E-11-49 | Alt ipucu | metin (`rp-cap`) | "Değişiklikler otomatik kaydedilir ve tabloya erişimi olan herkes anında görür. Sütun başlığına tıklayarak adını, tipini ve sırasını değiştirebilirsin." | — | — | Salt-okunurda metin bilinmiyor |

### 2.11 Kavram panosu öğeleri (11e — gerçek ekran değil, düzenleyiciye eklenecek davranışların görseli)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-11-50 | Pano başlığı | metin bloğu | kicker "Tablolar · birlikte çalışma"; h1 "Aynı tabloda aynı anda, kimin ne yaptığını görerek"; alt "Canlı varlık, hücre yorumu, değişiklik geçmişi ve sütun kilidi. Hepsi tablonun içinde; ayrı bir “ortak alan” gerekmez." | — | — | Uygulamada yer almaz; açıklama |
| E-11-51 | Kapsam alt satırı | metin | "Operasyon alanında · İdari işler ve Satış ile paylaşıldı · programdaki herkes görür" | — | sahip departman, paylaşılan departmanlar, program geneli görünürlük | 11c ile çelişir (§7) |
| E-11-52 | Canlı varlık yığını | avatar yığını (`cb-pres`, her avatarda kişi rengi halkası `--c`) + "+`n` görüntülüyor" | `title="<ad> · düzenliyor"`, kendin "Sen"; `aria-label="Şu an tabloda 3 kişi, 2 kişi görüntülüyor"` | düzenleyen / görüntüleyen ayrımı | anlık oturumdaki kişiler, kişi rengi | Renkler örnekte sabit hex (#c27ce6, #ffd166, #73a9e3, #74c27a) — token değil |
| E-11-53 | Geçmiş anahtarı | ikincil küçük düğme (`aria-pressed="true"`) | saat ikonu + "Geçmiş" | basılı → sağ panel açık | — | 11b başlığında yok |
| E-11-54 | Paylaş (küçük) | ikincil küçük düğme | "Paylaş" | — | — | E-11-22 karşılığı |
| E-11-55 | Başkasının imleci | hücre çerçevesi (`cb-c--p1/p2`, kişi rengi 2px) + ad etiketi (`cb-tag`, üstte) | "<Ad K.> yazıyor…", "<Ad Ö.>" (örnekteki kişi adları kopyalanmaz) | yazıyor / yalnız seçili | kişi, etkin hücre, yazma durumu | Ad kısaltması "Ad S." |
| E-11-56 | Kendi imlecim | hücre çerçevesi (`cb-c--me`, vurgu rengi) | — | — | — | |
| E-11-57 | Yorum işareti | hücre köşesinde sarı üçgen (`cb-c--note`) | — | yorumu olan hücre | — | |
| E-11-58 | Kilitli sütun | başlıkta kilit rozeti (`cb-lock`, altın; `title="Kilitli · yalnız koordinatör düzenler"`) + soluk hücre zemini (`cb-c--lock`) + ipucu "Kilitli sütun · yalnız Operasyon koordinatörü düzenler" | — | kilitli | kilit durumu, kimin düzenleyebildiği | Kilitleme eylemi için düğme/menü yok |
| E-11-59 | Hücre yorum paneli | açılır panel (`cb-pop`, 320px, `role="dialog"`, `aria-label="<satır> hücresi yorumları"`) | kicker "`B4` · `<satır birincil değeri>`"; "Çözüldü" (hayalet küçük düğme); yorumlar (avatar, ad, zaman "dün 18:20" / "09:45", gövde; `@Ad Soyad` vurgulu `cb-mention`); yanıt girişi "Yanıtla, @ ile birini an" | — | yorum dizisi | Hücre adresi harf+sayı (B4) — 11b'de sütun harfi yok |
| E-11-60 | Son değişiklikler paneli | yan panel (`aside`, 360px) | başlık "Son değişiklikler"; `rp-seg` "Tümü / Benim" (`aria-label="Geçmiş filtresi"`); açıklama "Her değişiklik kişi ve saatle tutulur. Hücre üzerine gelince o hücrenin geçmişi açılır." | Tümü seçili | — | |
| E-11-61 | Geçmiş girdisi | liste satırı (`cb-hi`) | avatar (kişi rengi halkası) + ad + saat ("14:12", "dün 18:22") + konum "`<satır>` › `<sütun>`" + fark "~~eski~~ → **yeni**" (boş eski "—"); toplu girdi "3 satır eklendi" (farksız); "Geri al" düğmesi (`aria-label="<ad> değişikliğini geri al"`) | — | değişiklik kaydı: kişi, zaman, satır, sütun, eski/yeni değer veya toplu işlem özeti | Her girdide geri al; başkasının değişikliğini de geri alma görünüyor |
| E-11-62 | Tüm geçmişi gör | bağlantı düğmesi (`rp-link rp-linkbtn`) | "Tüm geçmişi gör" | — | — | Hedef ekran tasarımda yok |
| E-11-63 | Kural kartları | 4 bilgi kartı (`cb-rule`, numaralı) | 1 "Canlı varlık", 2 "Hücre yorumu", 3 "Değişiklik geçmişi", 4 "Sütun kilidi" + açıklamaları (§4) | — | — | Davranış tanımı kaynağı; uygulamada yer almaz |
| E-11-64 | Para değerli sütun | sütun ("Bütçe", "4.500 ₺") | binlik nokta + " ₺" | kilitli | sayı/para | Tip listesinde Sayı/Para yok — §7 |
| E-11-65 | Hücre bağlam menüsü | sağ tık menüsü | "Yorum ekle" (yalnız kural metninde) | — | — | Görseli yok |
| E-11-66 | Hücre geçmişi açılır | hover paneli | yalnız açıklama metninde | — | hücreye ait değişiklikler | Görseli yok |

## 3. Pencereler, menüler, açılır paneller

Tüm satır içi menüler `rp-pop rp-sh__menu` (240px; seçiciler 300px, `rp-sh__pickmenu`), hücre/başlığın altına `top:100%+4px` hizalı. Aynı anda tek menü açık (**Varsayım:** veri modelinde her biri ayrı `open` bayrağı; birlikte açık örnek yok (doğrulanacak: tasarım tuvali)).

### 3.1 Sütun menüsü — E-11-67 (tetik: E-11-33; 11b'de "Koordinatörlük" sütununda açık)
`role="dialog"`, `aria-label="<ad> sütunu"`. Düzenleme yetkisiyle (`c.canEdit`):
- Sütun adı girişi (34px, `aria-label="Sütun adı"`) — yeniden adlandırma.
- kicker "sütun tipi" + 7 seçenek (ikon + etiket + seçili ✓): **Metin, Tarih, Yapılacak, Kişi, Koordinatörlük, Görev, Tablo bağlantısı**.
- Tip "Tablo bağlantısı" ise alt bölüm `rp-sh__relpick`: kicker "bağlanacak tablo" + tablo listesi (seçili ✓; erişilebilir tablolar, mevcut tablo hariç; maks. 180px kaydırma).
- ayırıcı; **Artan sırala** / **Azalan sırala** (her kullanıcıya).
- ayırıcı; **Sola taşı** (ilk sütunda devre dışı), **Sağa taşı** (sonda devre dışı), **Sütunu sil** (tehlike rengi; tek sütun kaldıysa devre dışı).
Salt-okunurda yalnız iki sıralama öğesi. Onay adımı, tip değişim uyarısı yok. Kapanış: başlığa yeniden tık (`toggle`); dış tık/Esc tasarımda yok (**Varsayım:** dış tık ve Esc kapatır (doğrulanacak: tasarım tuvali)).

### 3.2 Yeni sütun menüsü — E-11-68 (tetik: E-11-35)
`role="dialog"`, `aria-label="Yeni sütun"`, sütun ekle hücresinin sağına (`left:44px`). Ad girişi (yer tutucu "Sütun adı"), kicker "tip" + aynı 7 seçenek (varsayılan Metin), Tablo bağlantısı seçilince "bağlanacak tablo" listesi, ayırıcı, tam genişlik birincil küçük düğme **"Sütunu ekle"**. Ad boşken davranış bilinmiyor.

### 3.3 Değer seçici (Kişi / Koordinatörlük / Görev) — E-11-69 (tetik: E-11-39/40/41)
`role="listbox"`, `aria-label` = yer tutucu metni. Arama girişi "Ara" (Koordinatörlükte yok); isteğe bağlı kicker ipucu (`x.hint`, örnekte boş — metni bilinmiyor; **Varsayım:** Görev'de "bu programdaki görevler" türü kapsam ipucu (doğrulanacak: tasarım tuvali / eksikler.md §2.6)); seçenek listesi (etiket + ad + seçili ✓; `role="option"`, `aria-selected`; tekli seçim; maks. 260px); boşsa "Eşleşen yok."; değer varsa ayırıcı + **"Temizle"**. Açık örnek tasarımda yok; seçenek verisi şekli yalnız `{tag, t, on}`.

### 3.4 Satır bağlama seçici — E-11-70 (11d, tetik: E-11-43 "+"; 2. satır "Vardiyalar" hücresinde açık)
`role="listbox"`, `aria-multiselectable="true"`, `aria-label="<hedef> satırları"`. kicker hedef tablo adı; arama "Satır ara"; seçenekler: satır no etiketi (`rp-sh__tag`, mono) + birincil değer + alt metin (hedef satırın ikinci sütunu, `rp-cap`) + seçili ✓; çoklu seçim; boşsa "Eşleşen satır yok."; ayırıcı + **"Tabloyu aç"** (↗). Hedef tablonun tüm satırları listelenir (örnek 6/6).

### 3.5 Paylaş penceresi — E-11-71 (11c; tetik: E-11-21, E-11-22)
`t-modal`, `role="dialog"`, `aria-modal="true"`, başlık "Paylaş: `<tablo adı>`", açıklama "Kişi ekle, yetkilerini belirle. Eklenen kişiler tabloyu hemen görür.", sağ üstte kapat (×).
- **Kişi ekle**: arama girişi "Ad ile ara" (`aria-label="Kişi ara"`). Yazı varken (`hasQ`) altında sonuç listesi (`rp-shpick`): avatar + ad + "Ekle"; boşsa "Eşleşen kişi yok." Sonuçta zaten erişimi olanlar yok (örnek "re" → yalnız listede olmayan kişi). Sonuçta rol/departman alt metni yok.
- **Erişimi olanlar** `{n} kişi`: satır = avatar + ad (kendin için "(sen)") + alt metin "`<Rol>` · `<Koordinatörlük>`" (örn. "Admin · Sistem koordinatörlüğü", "Koordinatör · Operasyon", "Üye · İdari işler") + sahipte "Sahip" rozeti (düzenlenemez) + diğerlerinde `rp-seg` **Düzenler / Görür** + erişimi kaldır (× , `aria-label="<ad> erişimini kaldır"`). Liste maks. 280px kaydırma.
- Hata satırı (`b.error`, tehlike rengi) — metin bilinmiyor.
- Alt: sola yaslı hayalet **"Bağlantıyı kopyala"** (zincir ikonu), sağda ikincil **"Kapat"** (`b.cancelLabel`). Kaydet düğmesi yok → her değişiklik anında uygulanır (**Varsayım:** anında yazma (doğrulanacak: eksikler.md §2.3)).

### 3.6 Yeni tablo penceresi — E-11-72 (11c şablonunda `b.isNew` dalı; veride kapalı)
Aynı `t-modal`. Başlık/açıklama metni bilinmiyor (`b.title`, `b.desc`).
- **Tablo adı** girişi (yer tutucu "Örn. Fuar haftası vardiya planı").
- **Sütunlar** "isteğe bağlı · `{n}`": her satır = ad girişi (36px, `title` tip etiketi) + tip için ikon-yalnız `rp-seg` (her tip bir ikon düğmesi, `title`/`aria-label` tip adı) + kaldır (× "Sütunu kaldır"); altında hayalet küçük "Sütun ekle". İpucu: "Tipler: metin, tarih, yapılacak, kişi, koordinatörlük, görev. Boş bırakırsan Ad, Tarih ve Durum sütunlarıyla başlar; sütunları sonra da ekleyip tipini değiştirebilirsin."
- **Birlikte çalışacakların** `{seçili n}`: kişi çipleri (`rp-chipbtn`, `aria-pressed`; maks. 150px kaydırma) + ipucu "İsteğe bağlı; kişileri sonradan Paylaş’tan da ekleyebilirsin." Seçilenlerin rolü (düzenler/görür) belirtilmiyor.
- Alt: ikincil iptal (`b.cancelLabel`, metin bilinmiyor; **Varsayım:** "Vazgeç" (doğrulanacak: tasarım tuvali)) + birincil **"Tabloyu oluştur"**.

## 4. Metinler ve etiket sözlüğü

- **Erişim rolleri:** "sahip", "düzenler", "görür" (avatar `title`); pencerede "Sahip" rozeti, "Düzenler" / "Görür" seçimi; kartta "Görüntüleme" rozeti; notta "yalnızca görüntüleyebilirsin". 11e: "düzenliyor", "görüntülüyor" (anlık etkinlik, rol değil).
- **Sütun tipleri:** Metin, Tarih, Yapılacak, Kişi, Koordinatörlük, Görev, Tablo bağlantısı (pencere ipucunda küçük harf, bağlantısız).
- **Süzgeçler:** liste "Tümü / Oluşturduklarım / Benimle paylaşılanlar"; düzenleyici "Tümü / Açık / Tamamlanan"; geçmiş "Tümü / Benim".
- **Sayılar/biçimler:** sayaçlar mono (`rp-count`), alt satır `tabular-nums`. "`n` satır · `n` sütun · senin"; "`n` satır"; "`k` / `n` tamam"; "`n` dolu"; "`n` kişi"; "`n` koordinatörlük"; "`n` bağlantı"; "`n` kişi" (erişim). Bağlantı sayısı önizlemede "↗ `n`".
- **Tarih/saat:** hücrede ISO `YYYY-AA-GG` (yerel tarih girişi); önizleme/alt satır "27 Eki" (gün + 3 harf ay); aralık "27 Eki – 30 Eki" (en tire, boşluklu); göreli zaman "bugün 12:10", "dün", "dün 18:20", yalnız saat "09:45" (bugün). 11e "22 Kas".
- **Para (11e):** "4.500 ₺" (binlik nokta, boşluk + ₺).
- **Kısaltmalar:** kişi baş harfleri 2 harf (ad ve soyadın ilk harfleri); koordinatörlük ilk 3 harf büyük ("OPE", "EĞİ", "İDA", "SAT", "FUA"); görev kısa kodu ("ALT-7"); 11e imleç etiketi "Ad S.".
- **Boş/yer tutucu metinleri:** "Bu filtrede tablo yok.", "Eşleşen satır yok.", "Eşleşen yok.", "Eşleşen kişi yok.", "Tablo bulunamadı", "Adsız tablo", "Kişi seç", "Koordinatörlük seç", "Görev seç", "Sütun adı", "Satır ara", "Ara", "Ad ile ara", "Tablo ara", "Tabloda ara".
- **Kural metinleri (11e, aynen):**
  1. Canlı varlık — "Üstte tablodaki kişilerin avatarları. Düzenlenen hücre o kişinin rengiyle çerçevelenir; adı çerçevenin üstünde görünür."
  2. Hücre yorumu — "Sağ tık › Yorum ekle. Köşedeki sarı üçgen yorum olduğunu gösterir. @ ile anılan kişiye bildirim gider; “Çözüldü” ile kapanır."
  3. Değişiklik geçmişi — "“Geçmiş” paneli kimin neyi, eski ve yeni değeriyle değiştirdiğini gösterir. Her satırdan tek tıkla geri alınır."
  4. Sütun kilidi — "Sahip ya da koordinatör bir sütunu kilitler. Herkes görür, yalnız kilitleyen ve koordinatörler değiştirir; başlıkta kilit simgesi durur."

## 5. Açık tema farkı

A4 (`Tablo-Detay-Acik`) yalnız `default: light`. Token dışı farklar `theme.css`'te: `rp-shtpl--blank` ikon kutusu `--accent` zemin; `rp-sh__rz` hover/sürükleme çizgisi `--accent-text`; `rp-shcard` gölge `--shadow-card`; tarih girişi `color-scheme:light`; `rp-seg` seçili düğme gölgeli `bg-surface`. A4 dosyasında `:root[data-theme="light"]` seçicisi `[data-theme="light"]` olarak yazılmış (anlam aynı). 11e'nin açık teması yok (sabit koyu; kişi renkleri sabit hex — açık temada kontrast denetlenmeli).

## 6. Erişilebilirlik ipuçları

- Izgara: `role="grid"` (`aria-label` = tablo adı), `row`, `columnheader`, `rowheader`, `gridcell`. Hücre girişlerinde `aria-label="<sütun>, <n>. satır"`. Klavyeyle hücreler arası ok tuşu gezinmesi tasarımda tanımlı değil (**Varsayım:** grid deseni gereği gerekir (doğrulanacak: tasarım tuvali)).
- Sütun başlığı `aria-expanded`; menüler `role="dialog"` (sütun) veya `role="listbox"` + `role="option"` + `aria-selected` (seçiciler), bağlama seçicisinde `aria-multiselectable`.
- Tutamaç `role="separator"`, `aria-orientation="vertical"` — klavyeyle genişletme yok (**Varsayım:** ok tuşlarıyla eklenmeli (doğrulanacak: tasarım tuvali)).
- Gizli-hover öğeler (`rp-sh__del`, `rp-sh__reladd`, yer tutucular) `:focus-visible` ile de görünür.
- Kart önizlemesi `aria-hidden`; kart düğmesi `aria-label="<ad> tablosunu aç"`; avatar ipuçları `data-tip` + `tabindex=0` + `aria-label`.
- Seçili işaretleri `aria-label="Seçili"`; "Sıralamayı kaldır", "Satırı sil", "Sütun ekle", "<ad> erişimini kaldır" etiketleri.
- 11e: varlık yığını `aria-label` özetli; yorum paneli `role="dialog"`; kilit ipucu `role="tooltip"`; geri al `aria-label="<ad> değişikliğini geri al"`.

## 7. Tasarımda belirsiz / çelişkili

1. **Paylaşım modeli:** 11c yalnız kişi bazlı (Düzenler/Görür); 11e alt satırı departman ("İdari işler ve Satış ile paylaşıldı"), sahip departman ("Operasyon alanında") ve program geneli ("programdaki herkes görür") paylaşımı ima ediyor. "Bağlantıyı kopyala"nın erişim verip vermediği bilinmiyor; rol/departman bazlı izin arayüzü yok.
2. **Sütun kilidi yetkisi üç farklı yazılmış:** kural "sahip ya da koordinatör kilitler; kilitleyen ve koordinatörler değiştirir", başlık `title` "yalnız koordinatör düzenler", ipucu "yalnız Operasyon koordinatörü düzenler". 11b sütun menüsünde kilitle öğesi yok.
3. **Tip listesi:** sütun menüsü 7 tip; yeni tablo ipucu 6 tip (Tablo bağlantısı yok); 11e'de Sayı/Para ("Bütçe ₺") ve "Tamam" sütunu var, listede Sayı/Para yok. Varsayılan sütunlar "Ad, Tarih ve Durum" — "Durum" bir tip adı değil (Yapılacak mı? bilinmiyor).
4. **Gerçek zamanlı:** ipucu "herkes anında görür" ve 11e canlı varlık K8 (SSE yalnız sohbet) ile çelişir.
5. **Hücre adresi:** 11e yorum kicker'ı "B4" (Excel tarzı harf+satır) kullanıyor; 11b'de sütun harfi yok, satır numarası görüntü sırası olabilir (sıralama/süzgeçle değişir). Satırın kalıcı adresi belirsiz.
6. **Tarih biçimi:** 11b hücresi ISO yerel giriş; 11e hücresi "22 Kas". Hangisi görünüm biçimi?
7. **Etiket sınıfları tanımsız:** veri `rp-sh__tag--coord`, `--text`, `--date`, `--todo`, `--rel` ve `rp-sh__cell--done` sınıflarını kullanıyor; CSS'te yalnız `--person` ve `--task` var. Koordinatörlük etiketi temel gri stil alıyor.
8. **Görev hücresi** hiçbir örnekte dolu değil; seçenek listesinin kapsamı (program, departman, bana atananlar?) ve ipucu metni (`x.hint`) bilinmiyor.
9. **Erişimsiz bağlantılar:** kilitli çip ve alt satır ("5 bağlantı") hedef tablodaki bağ sayısını sızdırıyor; giden bağ çipi erişimsiz tablonun adını gösteriyor. Sütun menüsünde erişimsiz hedef listede yok (seçili ✓ görünmez); düzenleyen biri bu sütunun hedefini değiştirirse ne olur bilinmiyor.
10. **Salt-okunur kullanıcıda** "Paylaş" düğmesi ve kişi yığını gizlenmiyor; pencerede ne görebileceği bilinmiyor.
11. **Eksik durumlar:** yükleniyor, kaydediliyor/kaydedildi göstergesi, kayıt hatası, çakışma, çevrimdışı, tablo bulunamadı/erişim kaldırıldı, ilk kullanım (hiç tablo yok) tasarımda yok. İhtiyaç tanımı §4 "kaydedilip kaydedilmediğini anlayabilmeli" diyor.
12. **Eksik eylemler:** tablo silme/arşivleme/çoğaltma/sahiplik devri, satır taşıma/sürükleme, çoklu sıralama, sütun süzgeci, sütun dondurma, formül, doğrulama/zorunluluk, çoklu seçim tipi, dosya tipi, dışa/içe aktarma, şablon kaydetme, sürüm/anlık görüntü — tasarımda yok. Satır/sütun silmede onay ve geri al (11e dışında) yok.
13. **Kart önizlemesi ve listeleme:** hangi 3 sütun/satırın gösterileceği, kart sıralaması ("son düzenlenenler" dışındaki `listLabel` değerleri), avatar kesme eşiği bilinmiyor.
14. `backHidden`, `sortLabel`, yeni tablo penceresinin başlık/açıklama/iptal metinleri ve paylaşım hata metinleri örnekte boş — metinler bilinmiyor.
15. **Alt satır özeti:** "6 kişi" farklı kişi mi dolu hücre mi; Görev tipinin özeti; özet süzgeçli görünüme mi tüm tabloya mı ait — bilinmiyor.
16. **Kırıntıda program adı** tabloların program kapsamlı olduğunu ima ediyor; ihtiyaç tanımı bağımsız çekirdek istiyor. Kapsam (program/departman) değişince liste davranışı belirsiz.
17. **Kenar menüsü** `active="sheets"` ile girdi gösteriyor; K14 gereği v1'de gizli.
