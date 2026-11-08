# 10 — Özellikler (ne görünüyor)

Kaynak: `../../tasarim/kaynak/Mesajlar.dc.html`, `Mesajlar-Uye.dc.html`, `Mesajlar-Pencereler.dc.html`, `Mesajlar-Acik.dc.html` (sürüm `1794118532-71ae`). Örnek veriler gerçek değildir; aşağıdaki metinler biçim kanıtıdır, değerler kopyalanmaz. Üç dosyanın `renderVals()` işlevi yalnız `theme` döndürür; örnek içerik işaretlemenin içine gömülüdür.

Sütun "Görünür" kısaltmaları: **10** = Genel grup (yönetici merceği, `Mesajlar.dc.html`), **10b** = üye görünümü, **10c** = pencereler, **css** = yalnız stil dosyasında tanımlı, işaretlemede örneği yok.

## 1. Yerleşim

- Tuval: 1440 × 1100 (10, 10b, A3); 10c 1440 × 2500, pencereler üç sütunlu `rp-stage` ızgarasında (tuval sahnesi; uygulamada sahne yoktur).
- İskelet: `rp-page` → `rp-side` (kenar menüsü, `dc-import name="Sidebar" active="messages"`, 272 px) + `rp-main` → `rp-topbar` (00-ortak) + `rp-msgapp`.
- `rp-msgapp`: son geçerli kural iki sütun — `grid-template-columns: 340px minmax(0,1fr)`; üst kenarlık `--border-subtle`. Stilde önceki sürümlerden kalan üç sütunlu düzen (`320px 1fr 300px`, `rp-msgapp--two` 340 px sağ panel, `rp-dpanel`) **ezilmiştir**; sağ üye paneli bu tasarımda yoktur (üyeler Grup bilgisi penceresinde, E-10-62).
- Sol sütun `rp-clist` (`section aria-label="Konuşmalar"`): `rp-clist__head` (başlık, arama, sekmeler; sabit) + `rp-clist__scroll` (kayan liste).
- Sağ sütun `rp-thread` (`section aria-label="<ad> grubu"`): `rp-thread__head` (64 px, `--bg-surface`) → (10b'de `rp-viewer`) → `rp-pinbar` (sabit mesaj şeridi, z-index 4) → `rp-chat` (kayan akış, noktalı arka plan deseni %3) → `rp-cbar` (yazma çubuğu).
- Balon genişliği: `rp-row__col` en çok `min(620px, 72vw)`; balon en az 120 px. Yazma alanı 44–160 px yükseklik. Öneri listesi 440 px, ekle menüsü 300 px, mesaj menüsü 230 px.
- Pencereler `t-modal` (`t-modal__head/body/foot`); form alanları `rp-field`, `rp-inrow` (etiket + sayaç), `t-input`, `t-select`, `rp-seg`, `rp-chipbtn`, `rp-switch`, `t-chip`.

## 2. Bölgeler ve öğeler

### 2.1 Kabuk bağımlılıkları (`00-ortak`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-10-01 | Kenar menüsü, "Mesajlar" etkin | menü | `active="messages"` | etkin öğe | — | 00-ortak; okunmamış göstergesi kenar menüsünde var mı, Sidebar dosyasında doğrulanmalı |
| E-10-02 | Üst çubuk | gezinme + kırıntı + tema + zil | Geri / İleri (ileri devre dışı); kırıntı `<Program adı> / Mesajlar / <Sohbet adı>` (son öğe `strong`); zil `aria-label="Bildirimler, 2 okunmamış"` + kırmızı nokta | İleri `disabled` | program adı, seçili sohbet adı | 00-ortak; kırıntının son öğesini bu ekran verir |

### 2.2 Konuşma listesi başı (`rp-clist__head`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-10-03 | Başlık | metin | "Mesajlar" (`rp-h1`, 22/28) | — | — | 10, 10b |
| E-10-04 | Yeni konuşma düğmesi | simge düğme (kalem) | `aria-label="Yeni konuşma veya grup"` | hover | — | Yeni grup penceresini açar (E-10-76) |
| E-10-05 | Arama | giriş | yer tutucu "Ara: kişi, grup ya da mesaj"; 40 px, yuvarlak (20 px) | boş | metin | büyüteç simgesi solda |
| E-10-06 | Süzgeç sekmeleri | sekme (`role="tablist"`, `aria-label="Konuşma filtresi"`) | "Tümü", "Okunmamış", "Gruplar", "Kişiler" | seçili sekme koyu dolgu (`--ink` zemin), hover | — | yatay kaydırmalı, kaydırma çubuğu gizli |
| E-10-07 | Okunmamış sekme sayacı | sayaç (`rp-ctabs__n`) | tam sayı, 17 px yeşil hap, tabular-nums | seçili sekmede ters renk | okunmamış **konuşma** sayısı (Varsayım, §7) | 10'da 4, 10b'de 2 (örnek) |

### 2.3 Konuşma satırı (`rp-conv`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-10-08 | Konuşma satırı | liste satırı (`button`) | 44 px avatar + gövde; satırlar arası ince ayırıcı | hover `--bg-raised`; seçili `aria-current="true"` → `--bg-overlay` zemin + avatarda dairesel "mürekkep" dolgu (0,1 sn `rpWipeIn/Out`, `prefers-reduced-motion` ile kapalı); `:focus-visible` halka | — | sıra: sistem grupları üstte, sonra son etkinliğe göre (Varsayım, §7) |
| E-10-09 | Konuşma avatarı | avatar (`rp-cav`) | 4 tür: **sistem grubu** (`--sys`, tek harf: "G", "K"), **koordinatörlük grubu** (`--code`, 3 harf mono büyük harf: "SİS", "EĞİ"), **serbest grup** (`--grp`, 2 baş harf), **kişi** (2 baş harf). Grup türlerinde boşluklu ince halka (`outline`) | seçilide halka `--ink` | ad / koordinatörlük kodu / baş harfler | hepsi yuvarlak; grup ↔ kişi ayrımı yalnız halkadan |
| E-10-10 | Konuşma adı | metin | 14 px kalın, tek satır kırpılır | — | grup adı / kişi tam adı | |
| E-10-11 | Son etkinlik zamanı | metin | bugün "SS:dd", dün "Dün", daha eski "G Aaa" (ör. "19 Eki") | — | son mesaj zamanı | daha eski yıl biçimi bilinmiyor |
| E-10-12 | Son mesaj önizlemesi | metin | grupta "Sen: …" / "<Ad>: …" öneki; birebirde karşı tarafın mesajı öneksiz, kendi mesajın "Sen: …"; uzun metin "…" ile kırpılır; `#ALT-7` gibi görev kodu düz metin | okunmamışsa kalın (600), değilse normal | son mesajın gönderen ilk adı + gövde | silinmiş son mesajın görünümü tasarımda yok |
| E-10-13 | Sabit (iğne) simgesi | simge | 13 px soluk iğne | — | konuşma sabitlenmiş / sistem grubu | yalnız sistem grubu ve koordinatörlük gruplarının satırlarında görünüyor (10 ve 10b'de örneklenmiş) — anlamı belirsiz, §7 |
| E-10-14 | Okunmamış sayı rozeti | rozet (`rp-ubadge`) | yeşil hap, 20 px, tabular-nums | yoksa gizli | okunmamış mesaj sayısı | |
| E-10-15 | Bahsetme rozeti | rozet (`rp-ubadge--at`) | "@" | — | okunmamışlar arasında beni (ya da koordinatörlüğümü / herkesi) anan mesaj var | sayı yerine "@" gösterir; ikisi birlikte örneklenmemiş |
| E-10-16 | Sessiz konuşma rozeti | rozet (`rp-ubadge--mute`) | sayı | önceki kuralda gri; son kural ("hepsi yeşil") ile normal rozetle **aynı** görünür | okunmamış sayı | §7: sessiz ayrımı görsel olarak kaybolmuş |
| E-10-17 | Birebir okundu tiki (listede) | simge | çift tik, 15 px, `--accent-text` rengi, zamanın solunda | yalnız son mesaj benimse | karşı taraf son mesajımı okudu | yalnız birebirde örnekli; okunmamış hâli (gri tik / tek tik) çizilmemiş |

### 2.4 Sohbet başlığı ve şeritler
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-10-18 | Başlık düğmesi | düğme (`rp-thead`) | 40 px avatar + ad (15 px kalın) | hover `--bg-raised`; `aria-label="<ad> bilgisi"` | sohbet adı, avatar türü | Grup bilgisi penceresini açar (E-10-62; 10c "başlığa dokununca") |
| E-10-19 | Başlık alt satırı | metin (`rp-cap`) | 10: "<Ad> yazıyor…"; 10b: "Sistem grubu · bilgi ve üyeler için dokun" | yazıyor varsa onu, yoksa tür + ipucu | yazan kişinin ilk adı; sohbet türü | birebir için (çevrimiçi / son görülme) tasarımda yok |
| E-10-20 | Konuşma bilgisi düğmesi | simge düğme (ⓘ) | `aria-label="Konuşma bilgisi"` | hover | — | E-10-18 ile aynı hedef (Varsayım) |
| E-10-21 | Görüntüleyen şeridi | bilgi şeridi (`rp-viewer`, mor) | "**Okuyan: <Ad Soyad>** · <Rol>, <Koordinatörlük>. Aynı mesajlar onun yetkisiyle gösteriliyor (MSG-043)." | — | okuyan kişi, rolü, birimi | yalnız 10b; ürün mü tuval notu mu belirsiz, §7 |
| E-10-22 | Sabit mesaj şeridi | şerit (`rp-pinbar`) | sol 3 px yeşil işaret; üstte "Sabitlenen mesaj <i>/<n>" (12 px), altta mesaj metni tek satır | — | sabit mesaj sayısı, sıradaki sabit mesajın düz metni | tıklamanın mesaja gitmesi çizilmemiş (Varsayım: gider) |
| E-10-23 | Sonraki sabit | simge düğme (aşağı ok) | `aria-label="Sonraki"` 32 px | — | — | sabitler arasında döner |

### 2.5 Mesaj akışı (`rp-chat`, `aria-label="Mesajlar"`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-10-24 | Gün ayırıcı | çip (`rp-sepchip`) | "Dün", "Bugün" (daha eskisi bilinmiyor) | kayarken üstte yapışkan, bulanık zemin | mesaj günü | |
| E-10-25 | Okunmamış ayırıcı | çip (`rp-sepchip--new`, yeşil) | "<n> okunmamış mesaj" | yapışkan değil | sohbete girişte okunmamış sayı | ilk okunmamış mesajın üstünde |
| E-10-26 | Gelen mesaj satırı | satır (`rp-row--them`) | solda 32 px avatar (yalnız ardışık grubun **son** mesajında görünür), balon `--ink` %7 karışım, köşe 18/18/18/4 + sol alt kuyruk | ardışık grubun ilki `--first` (12 px üst boşluk, ad gösterilir), sonuncusu `--last`; hover'da araçlar | — | tepki varsa avatar 28 px yukarı kayar |
| E-10-27 | Giden mesaj satırı | satır (`rp-row--me`) | sağa yaslı, avatarsız, balon `--accent-text` %17 karışım, köşe 18/18/4/18 + sağ alt kuyruk; araçlar balonun solunda | aynı | — | |
| E-10-28 | Gönderen adı + rol rozeti | metin + rozet | ad 13 px `--accent-text`; rozet büyük harf 9,5 px çerçeveli: "Admin", "Koordinatör" | üye için rozet yok (örnekte rozetsiz kişi) | gönderenin adı, bu programdaki rolü | yalnız grupta ve ardışık grubun ilk mesajında |
| E-10-29 | Alıntı (yanıtlanan mesaj) | blok (`rp-bub__quote`) | sol 3 px çizgi; üstte kalın yazar adı, altında tek satır kırpılmış metin (bahsetme ve görev çipleri küçültülmüş hâlde) | CSS'te `cursor:pointer` (asıl mesaja gider); işaretlemede `span` | yanıtlanan mesajın yazarı ve metni | silinmiş mesaj alıntısı ("silinmiş mesaj") çizilmemiş |
| E-10-30 | Mesaj metni | paragraf | 14/21, `pre-wrap`; kalın parça (`strong`) içerebilir | — | gövde | metin biçimlendirme (kalın) nasıl girilir bilinmiyor, §7; sözleşmede mesaj düz metindir (§7.20) |
| E-10-31 | Bahsetme çipi | satır içi (`rp-mention`) | "@herkes", "@<Koordinatörlük adı>", "@<Ad Soyad>"; mor zemin | beni kapsıyorsa `--me` (daha koyu mor; 10b'de "@herkes") | hedef: herkes / koordinatörlük / kişi | |
| E-10-32 | Görev referans çipi | satır içi düğme (`rp-tref`) | "#<KOD>-<n>" mono, turuncu (`#ff9142`) çerçeve; `title="Görevi aç"` | hover koyulaşır | görev kısa kodu | kısa kod backend'de yok (BE-005); alıntı içinde küçük, tıklanamaz |
| E-10-33 | Dosya eki kartı | kart düğme (`rp-att`) | 32 px tür kutusu ("XLSX"), dosya adı kalın tek satır | hover | dosya türü kısaltması, adı | boyut gösterilmiyor; ek ile arşivden paylaşılan dosya görsel olarak ayrışmıyor |
| E-10-34 | Kilitli dosya kartı | kart (`rp-att--lock`, kesik çerçeve) | kilit simgesi + "Dosya gösterilemiyor"; `title="Klasörü görme yetkin yok"` | tıklanamaz | — | yalnız 10b (aynı mesaj 10'da XLSX kartı); sözleşmede karşılığı yok (§7.16) |
| E-10-35 | Anket kartı | kart (`rp-att--poll`, `role="group" aria-label="Anket"`) | çubuk grafik simgesi + kalın soru; meta "Çoklu seçim · isimli · son <G Ay YYYY SS:dd>"; seçenek satırları (yüzde çubuğu, sağda "%<n>"), oyum ✓ + kalın + koyu çerçeve; altta "<n> kişi oy verdi" | seçenek hover; `:disabled` (kapanmış anket) CSS'te var | soru, tür (tek/çoklu), isimli/anonim, son tarih, seçenek başına yüzde, oyum, toplam oy veren | kapanmış anket görünümü çizilmemiş |
| E-10-36 | Mesaj meta satırı | metin (`rp-bub__meta`) | [iğne simgesi] "SS:dd"; düzenlenmişse "düzenlendi · SS:dd" | — | saat, sabit mi, düzenlendi mi | |
| E-10-37 | Okundu tiki (giden) | simge (`rp-tick`, çift tik) | soluk renk; `title="<okuyan> / <üye> kişi okudu"` | grupta renk değişimi yok; birebirde renkli (Varsayım, E-10-17'den) | okuyan sayısı / üye sayısı | yalnız kendi mesajında; 10c'de "✓✓ ya da menüden" Mesaj bilgisi'ni açar |
| E-10-38 | Tepki çipleri | düğme (`rp-react`, `aria-pressed`) | "<emoji> <sayı>", 24 px hap | benim tepkim `aria-pressed="true"` (koyu çerçeve) | tür başına sayı, benim seçimim | tepki verenlerin adları gösterilmiyor |
| E-10-39 | Satır araçları | araç çubuğu (`role="toolbar"`, `aria-label="Mesaj işlemleri"`) | üç yuvarlak düğme: "Tepki ver" (gülen yüz), "Yanıtla", "Diğer" (…, `aria-expanded`) | yalnız hover / `:focus-within` / menü açıkken görünür (opacity) | — | gelen mesajda balonun sağında, gidende solunda |
| E-10-40 | Tepki seçici | açılır (`rp-emojipop`, `role="menu"`) | 6 emoji: 👍 ❤️ 😂 🎉 🙏 ✅ | seçili `aria-pressed` | — | 10'da "Diğer" `aria-expanded="true"` iken tepki seçici açık çizilmiş (§7) |
| E-10-41 | Mesaj menüsü | menü (`rp-msgmenu`, `role="menu"`, 230 px) | sırayla: Yanıtla, İlet, Sabitle, Mesaj bilgisi, Bağlantıyı kopyala, Düzenle, Sil (kırmızı); altta not "“Göreve dönüştür” yalnız görev açma yetkisi olanlara görünür." | — | — | 10b'de **kendi** mesajı için açık. Yanıtla öğesi E-10-39 ile aynı eylem. Sil yetkisi için §7.7 |
| E-10-42 | İlet | menü öğesi | "İlet" | — | — | E-10-81 penceresi |
| E-10-43 | Sabitle | menü öğesi | "Sabitle" | sabitliyse "Sabitlemeyi kaldır" çizilmemiş | — | |
| E-10-44 | Mesaj bilgisi | menü öğesi | "Mesaj bilgisi" | — | — | E-10-72 penceresi; başkasının mesajında görünür mü bilinmiyor |
| E-10-45 | Bağlantıyı kopyala | menü öğesi | "Bağlantıyı kopyala" | — | — | kopyalandı geri bildirimi çizilmemiş |
| E-10-46 | Düzenle | menü öğesi | "Düzenle" | — | — | düzenleme kipi: CSS `rp-row--edit` (balona altın halka); yazma alanı görünümü çizilmemiş |
| E-10-47 | Sil | menü öğesi (tehlike) | "Sil" | — | — | onay penceresi ve silinmiş mesaj görünümü çizilmemiş |
| E-10-48 | Göreve dönüştür | menü öğesi (çizilmemiş) | "Göreve dönüştür" (yalnız E-10-41 notunda) | yetkiye bağlı | — | E-10-86 penceresi |
| E-10-49 | Odak vurgusu | durum (css) | `rp-row--focus`: balona 2 px altın halka, kuyruk gizli | — | — | alıntıya / sabite / bağlantıya gidince hedef mesaj (Varsayım) |

### 2.6 Yazma çubuğu (`rp-cbar`)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-10-50 | Görev önerisi listesi | açılır (`rp-suggest`, `role="listbox"`, `aria-label="Görev önerileri"`) | satır: kod çipi ("ELE-4"), görev başlığı, sağda "<n> kişi kilitli görür"; altta ⓘ "Kart her okuyana kendi yetkisiyle gösterilir; görme yetkisi olmayan kilitli kart görür." | seçili satır `aria-selected` (koyu zemin) | görev kodu, başlık, bu sohbette görevi göremeyecek üye sayısı | `#` yazınca açılır (yazılan metin "#ele"); "<n> kişi kilitli görür" ve alt bilgi sözleşmede yok (§7.16) |
| E-10-51 | Yanıt bağlamı | şerit (`rp-cbar__ctx`) | sol renkli işaret; "<Ad Soyad> kişisine yanıt" (yeşil kalın) + alıntı tek satır; "Vazgeç" (✕) | — | yanıtlanan mesaj yazarı ve metni | |
| E-10-52 | Ekle düğmesi | yuvarlak düğme (+) | `aria-label="Ekle"` 44 px | açıkken `aria-expanded="true"` → 45° döner, yeşil | — | |
| E-10-53 | Ekle menüsü | menü (`rp-plusmenu`, `role="menu"`, 300 px) | 5 öğe, her biri renkli 32 px simge + başlık + açıklama | — | — | 10b'de açık |
| E-10-54 | Arşivden dosya | menü öğesi | "Arşivden dosya" / "Kopyalanmaz, bağlantı olarak paylaşılır" | — | — | E-10-101 "Arşivden" sekmesi |
| E-10-55 | Yeni dosya yükle | menü öğesi | "Yeni dosya yükle" / "İstersen bir görevin arşivine de kaydet" | — | — | E-10-101 "Yeni yükle" sekmesi |
| E-10-56 | Görev kartı | menü öğesi | "Görev kartı" / "# yazarak da ekleyebilirsin" | — | — | E-10-50'yi açar (Varsayım) |
| E-10-57 | Kişi ya da grup an | menü öğesi | "Kişi ya da grup an" / "@ yazarak da ekleyebilirsin" | — | — | E-10-61'i açar (Varsayım) |
| E-10-58 | Anket | menü öğesi | "Anket" / "Tek ya da çoklu seçim, son tarihli" | — | — | E-10-93 penceresi; birebirde gizlenmeli mi bilinmiyor |
| E-10-59 | Metin alanı | çok satırlı giriş (`rp-cbar__ta`) | yer tutucu "Mesaj yaz…  @ ile kişi, # ile görev kartı"; 22 px yuvarlak, 44–160 px; yazılan `#token` çip olarak işlenir | odakta yeşil çerçeve | taslak metin | işaretlemede `div`; emoji düğmesi **yok** |
| E-10-60 | Gönder | yuvarlak düğme (yeşil) | `aria-label="Gönder"` | boşken devre dışı durumu çizilmemiş | — | |
| E-10-61 | Bahsetme önerisi listesi | açılır (çizilmemiş) | — | — | kişi / koordinatörlük / herkes | Varsayım: E-10-50 ile aynı `rp-suggest` bileşeni |

## 3. Pencereler, menüler, açılır paneller

Hepsi `Mesajlar-Pencereler.dc.html`'de, `t-modal`; kapanış: başlıkta "Kapat" (✕) ve altta "Vazgeç". Esc / dış tıklama davranışı tasarımda yok (Varsayım: ortak `t-modal` davranışı).

### 3.1 Grup bilgisi — tetikleyici: başlığa dokununca (E-10-18, E-10-20)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-10-62 | Grup bilgisi penceresi | pencere | başlık "Grup bilgisi"; 60 px avatar + grup adı (17 px) | — | ad, avatar türü | açıklama satırı boş |
| E-10-63 | Grup adını düzenle | simge düğme (kalem, 28 px) | `aria-label="Grup adını düzenle"` | sistem grubunda gizli mi bilinmiyor | — | düzenleme kipi çizilmemiş |
| E-10-64 | Grup alt bilgisi | metin | "Grup · <n> üye · kuran <Ad Soyad>" | — | tür, üye sayısı, kurucu | sistem grubunda metin bilinmiyor |
| E-10-65 | Sessize al | hızlı eylem (`rp-qact`) | zil simgesi + "Sessize al" | etkin hâl `rp-qact--on` (altın) CSS'te | — | süre seçimi çizilmemiş |
| E-10-66 | Üye ekle | hızlı eylem | "Üye ekle" | — | — | aday seçimi çizilmemiş (Varsayım: E-10-78 benzeri) |
| E-10-67 | Toplantı planla | hızlı eylem | "Toplantı planla" | — | — | 09 Toplantılar'a geçiş (Varsayım) |
| E-10-68 | Bilgi sekmeleri | sekme (`rp-ctabs`) | "Üyeler <n>", "Dosyalar <n>", "Görevler <n>", "Sabitli <n>" | seçili koyu | sayaçlar | yalnız Üyeler içeriği çizilmiş; sayaç 0 iken de görünür |
| E-10-69 | Üye satırı | liste satırı (`rp-person`) | 32 px baş harf avatarı; ad; alt satır "<Rol> · <Koordinatörlük>"; sağda "Mesaj" bağlantısı; kendisi "<Ad> (sen)", bağlantısız | — | ad, program rolü, birimi | grup yöneticisi işareti ve "çıkar" düğmesi yok |
| E-10-70 | Yalnız @bahsedilince bildir | anahtar (`role="switch"`) | "Yalnız @bahsedilince bildir" | `aria-checked` | kişisel bildirim tercihi | BE-027 |
| E-10-71 | Gruptan ayrıl | bağlantı düğme (kırmızı) | "Gruptan ayrıl" | sistem grubunda gizli mi bilinmiyor | — | onay çizilmemiş |

### 3.2 Mesaj bilgisi — tetikleyici: ✓✓ (E-10-37) ya da menü (E-10-44)
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-10-72 | Mesaj bilgisi penceresi | pencere | başlık "Mesaj bilgisi", açıklama sohbet adı; önizleme balonu: "Sen", metin, "bugün SS:dd" | — | mesaj, tarih | anketli mesajda önizleme yalnız gövde |
| E-10-73 | Okudu listesi | liste | ✓✓ (yeşil) "Okudu" + sayaç; satır: avatar, ad, sağda "en son bunu okudu" | — | okuyanlar | "en son bunu okudu" her satırda aynı; anlamı §7 |
| E-10-74 | Henüz okumadı listesi | liste | ✓ (soluk) "Henüz okumadı" + sayaç; satırlar; "ve <n> kişi daha" | — | okumayanlar, ilk birkaçı + kalan sayısı | |
| E-10-75 | Açıklama | metin | "Okundu bilgisi her kişinin son okuduğu mesaja göre hesaplanır. Sohbette yalnız mesajın altındaki ✓✓ işareti görünür." | — | — | |

### 3.3 Yeni grup — tetikleyici: E-10-04
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-10-76 | Yeni grup penceresi + tür seçimi | pencere + segment | başlık "Yeni grup", açıklama "Serbest grup: adı ve üyeleri sen belirlersin."; segment "Birebir" / "Grup" | "Grup" basılı | — | "Birebir" görünümü çizilmemiş |
| E-10-77 | Grup adı | giriş + sayaç | etiket "Grup adı", sayaç "<n> / 80" | — | — | sözleşme sınırı 100 (§7.19) |
| E-10-78 | Üyeler | çip listesi + arama | etiket "Üyeler", sayaç "<n> + sen"; `t-chip` + "<Ad> çıkar" ✕; arama "Sezon üyelerinde ara…" | — | seçilen kişiler | aday listesi açılır görünümü çizilmemiş |
| E-10-79 | Sistem grupları bilgi kutusu | bilgi | "Genel, Koordinatörler ve koordinatörlük grupları sistemde hazır gelir; üyeleri organizasyon yapısından otomatik eklenir ve çıkar." | — | — | "Koordinatörler" sistem grubu sözleşmede yok (§7.17) |
| E-10-80 | Alt düğmeler | düğme | "Vazgeç" (ghost), "Grubu oluştur" (primary) | devre dışı durumu çizilmemiş | — | kaynak (koordinatörlük) seçimi yok |

### 3.4 Mesajı ilet — tetikleyici: E-10-42
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-10-81 | İlet penceresi | pencere | başlık "Mesajı ilet", açıklama "<Gönderen> · <Sohbet> · SS:dd"; alıntı (`rp-quote`) | — | iletilen mesaj | |
| E-10-82 | Alıcı seçimi | arama + onay kutulu liste | "Nereye?" + "<n> seçili"; arama "Kişi ya da grup ara"; satır: onay kutusu, 32 px simge, ad, alt satır "Grup · <n> kişi" / "Birebir" / "Sistem grubu · <n>" | işaretli / değil | hedef sohbetler | çoklu seçim |
| E-10-83 | İletme notu | giriş | "Not ekle", yer tutucu "İsteğe bağlı" | — | — | |
| E-10-84 | Yetki notu | metin | "İletilen mesajdaki #<KOD> kartı her alıcıya kendi yetkisiyle gösterilir." | — | — | sözleşme tersi: özet her üyeye açık (§7.16) |
| E-10-85 | Alt düğmeler | düğme | "Vazgeç", "İlet" | — | — | iletilmiş mesajın görünümü yalnız CSS'te (`rp-bub__fwd`, italik) |

### 3.5 Mesajdan görev oluştur — tetikleyici: E-10-48
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-10-86 | Görev penceresi | pencere | başlık "Mesajdan görev oluştur", açıklama "<Gönderen> · <Sohbet> · SS:dd"; alıntı | — | kaynak mesaj | |
| E-10-87 | Görev başlığı | giriş + sayaç | "<n> / 255"; ipucu "Boş bırakırsan mesajın ilk 100 karakteri kullanılır." | — | — | |
| E-10-88 | Hedef koordinatörlük | tek seçimli çipler | "Hedef koordinatörlük"; ipucu "Görev açma yetkisi bugünkü kuralla aynı: admin her birime, koordinatör yalnız kendi birimine açar." | seçili `aria-pressed` | açılabilir birimler | |
| E-10-89 | Atanan | çipler | "Atanan"; örnekte mesaj yazarı seçili | seçili | atanabilir kişiler | çoklu mu tek mi bilinmiyor |
| E-10-90 | Başlangıç / Bitiş | iki giriş | "GG.AA.YYYY" | — | — | tarih seçici çizilmemiş; öncelik alanı yok |
| E-10-91 | Bağ bilgi kutusu | bilgi | "Mesaj ile görev birbirine bağlanır: mesajın altında görev kartı, görevin geçmişinde kaynak mesaj görünür. Görev, mesajdaki işaret ve denetim kaydı birlikte yazılır." | — | — | §7.6 (görev kartı çelişkisi), §7.18 (görevde kaynak mesaj yok) |
| E-10-92 | Alt düğmeler | düğme | "Vazgeç", "Görevi oluştur" | — | — | |

### 3.6 Anket oluştur — tetikleyici: E-10-58
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-10-93 | Anket penceresi | pencere | başlık "Anket oluştur", açıklama "<Sohbet> grubuna gönderilecek" | — | — | |
| E-10-94 | Soru | giriş + sayaç | "Soru", "<n> / 200" | — | — | |
| E-10-95 | Seçenekler | giriş listesi | "Seçenekler", "<n> / 10"; her satırda "Seçeneği sil" (çöp); "+ Seçenek ekle" bağlantısı | — | — | en az kaç seçenek gösterilmiyor |
| E-10-96 | Seçim türü | segment | "Seçim": "Tek" / "Çoklu" | basılı | — | |
| E-10-97 | Oy görünürlüğü | segment | "Oylar": "İsimli" / "Anonim" | basılı | — | §7 (sözleşmede anonim yok) |
| E-10-98 | Son tarih | giriş | "GG.AA.YYYY SS:dd"; ipucu "Son tarihten sonra oy verilemez, sonuçlar herkese açılır." | — | — | isteğe bağlı mı bilinmiyor |
| E-10-99 | Anonim notu | metin | "Anonim ankette kimin neyi seçtiği kimseye, anketi açana bile gösterilmez." | — | — | |
| E-10-100 | Alt düğmeler | düğme | "Vazgeç", "Anketi gönder" | — | — | |

### 3.7 Dosya paylaş — tetikleyici: E-10-54 / E-10-55
| Kimlik | Öğe | Tür | Metin / biçim | Durumlar | Gösterilen veri (şekil) | Not |
|---|---|---|---|---|---|---|
| E-10-101 | Dosya paylaş penceresi + kaynak | pencere + segment | başlık "Dosya paylaş", açıklama "<Sohbet> grubuna"; segment "Arşivden" / "Yeni yükle" | "Yeni yükle" basılı | — | "Arşivden" içeriği çizilmemiş |
| E-10-102 | Bırakma alanı | yükleme alanı (kesik çerçeve) | seçili dosya "**<ad>** · <boyut> KB"; "Başka dosya için sürükle bırak ya da seç" | dosya seçili | ad, boyut | boş hâl, ilerleme, hata çizilmemiş; çoklu dosya bilinmiyor |
| E-10-103 | Görev arşivine de kaydet | anahtar | "Bir görevin arşivine de kaydet" / "Dosya görevin klasörüne düşer; mesaj o dosyayı gösterir." | `aria-checked="true"` | — | BE-029 |
| E-10-104 | Görev seçimi | seçim (`t-select`) | "Görev"; seçenek "<KOD> · <Başlık>" | anahtar kapalıyken gizli (Varsayım) | yükleme yapılabilen görevler | |
| E-10-105 | Etiket | tek seçimli çipler | "Etiket": "Güncel durum verisi" (gri nokta), "Sonuç dosyası" (yeşil nokta) | seçili | arşiv etiketi | 06 Arşiv etiket kümesiyle aynı mı doğrulanmalı |
| E-10-106 | Arşivden notu | metin | "“Arşivden” sekmesinde seçilen dosyalar kopyalanmaz, arşivdeki asıl dosyaya bağlantı olarak paylaşılır; okuyan, klasörü görme yetkisi varsa açabilir." | — | — | E-10-34 ile bağlantılı; sözleşmede paylaşılan dosyayı her üye indirir (§7.16) |
| E-10-107 | Alt düğmeler | düğme | "Vazgeç", "Gönder" | — | — | |

## 4. Metinler ve etiket sözlüğü

- **Sohbet türleri (alt yazılar):** "Sistem grubu", "Grup", "Birebir"; sistem grupları "Genel", "Koordinatörler" (tasarım metni; sözleşmede yalnız "Genel", §7.17); koordinatörlük grubu adı = koordinatörlük adı, avatarı 3 harfli kod.
- **Roller (balon rozeti, üye satırı):** "Admin", "Koordinatör", "Üye" (üyede balon rozeti yok).
- **Zaman:** liste "SS:dd" / "Dün" / "G Aaa" ("19 Eki"); gün ayırıcı "Dün" / "Bugün"; meta "SS:dd", "düzenlendi · SS:dd"; Mesaj bilgisi "bugün SS:dd"; anket "son G Ayyy YYYY SS:dd" ("son 25 Ekim 2026 18:00"); metin içi aralık "27 Ekim–2 Kasım" (en çizgi); form girişleri "GG.AA.YYYY" ve "GG.AA.YYYY SS:dd".
- **Sayılar:** "<n> okunmamış mesaj", "<n> kişi oy verdi", "%<n>" (yüzde işareti önde), "<okuyan> / <üye> kişi okudu", "Sabitlenen mesaj <i>/<n>", "ve <n> kişi daha", "<n> seçili", "<n> + sen", "<n> / 80", "<n> / 200", "<n> / 255", "<n> / 10", "<n> KB", "<n> kişi kilitli görür"; rozetler tabular-nums.
- **Öneki:** "Sen: …", "<İlk ad>: …"; yazıyor "<İlk ad> yazıyor…".
- **Yanıt bağlamı:** "<Ad Soyad> kişisine yanıt".
- **Kilit / yetki metinleri:** "Dosya gösterilemiyor", "Klasörü görme yetkin yok", "Kart her okuyana kendi yetkisiyle gösterilir; görme yetkisi olmayan kilitli kart görür." (sözleşme tersi, §7.16), "“Göreve dönüştür” yalnız görev açma yetkisi olanlara görünür."
- **Tasarımda olmayan, sözleşmede tanımlı metinler** (`istemci-akislari.md` §10.6): "Bu kişiyle doğrudan yazışamazsınız: …", "Bu kişi artık programda değil; mesaj gönderilemez.", "Liste ilk 200 kişiyle sınırlı" — mekanizma §6'da.

## 5. Açık tema farkı

`Mesajlar-Acik.dc.html` yalnız `default: light` ile farklıdır (diff tek satır): **yalnız token**. Dikkat: `#ff9142` (görev çipi) ve ekle menüsündeki `#5b8def`, `#e07a5f` sabit renklerdir, token değildir; açık temada karşıtlıkları ayrıca denetlenmeli.

## 6. Erişilebilirlik ipuçları

- Bölgeler: `section aria-label="Konuşmalar"`, `section aria-label="<ad> grubu"`, `div aria-label="Mesajlar"`; kırıntı `nav aria-label="Konum"`.
- Liste: satırlar `button` + `aria-current="true"` (seçili); sekmeler `role="tablist"`/`tab` + `aria-selected`; `:focus-visible` halkası (`--focus-ring`).
- Mesaj: araçlar `role="toolbar"` ve `:focus-within` ile görünür (klavyeyle erişilebilir); "Diğer" ve "+" `aria-expanded`; menüler `role="menu"`/`menuitem`; tepki çipleri `aria-pressed`; anket `role="group" aria-label="Anket"`.
- Öneriler `role="listbox"` + `role="option"` + `aria-selected` (ok tuşlarıyla gezinme beklenir, çizilmemiş).
- Pencereler `role="dialog"` + `aria-label`; anahtarlar `role="switch"` + `aria-checked`; segmentler `aria-pressed`; çip silme "<Ad> çıkar".
- Avatarlar `aria-hidden="true"`; animasyon `prefers-reduced-motion` ile kapanır.
- Eksikler: okundu tiki yalnız `title` (ekran okuyucuya metin yok, odaklanamaz `span`); anket seçeneklerinde `aria-pressed` yok; alıntı bloğu tıklanabilir stilli ama `span`; zil etiketi sayıyı metinde taşıyor ("Bildirimler, 2 okunmamış") — konuşma rozetlerinde eşdeğer etiket yok; yeni mesajların duyurulması (`aria-live`) tasarımda yok.

## 7. Tasarımda belirsiz / çelişkili

1. **Görüntüleyen şeridi (E-10-21, 10b):** "Okuyan: … (MSG-043)" bir ürün özelliği (yöneticinin üye gözünden bakması) mi, yoksa artboard açıklaması mı belirsiz. 10b'nin içeriği gerçekten üyenin kendi oturumudur (kendi mesajı sağda, "Sen:" önekleri). Varsayım: tuval açıklamasıdır, uygulamaya girmez — ürün sahibine soru.
2. **Grupta okundu tiki ve "kim okudu" (E-10-37, E-10-72–75):** tasarım grupta "<okuyan> / <üye> kişi okudu" ve okuyan listesi gösteriyor; sözleşme tiki yalnız birebirde veriyor (§10.4, BE-028). Grupta tikin görsel durumu (renk) de tanımsız.
3. **Tepki kümesi (E-10-40):** tasarımda 6 emoji; sözleşmede 4 tür (`like`, `heart`, `check`, `star`) ve kişi başına tek tepki. Tasarımda 😂 🎉 🙏 var, ⭐ yok.
4. **Sessiz rozeti (E-10-16):** stil sırasında sonraki kural tüm rozetleri yeşile çeviriyor; sessiz konuşma görsel olarak ayrışmıyor. Hangisi kasıtlı bilinmiyor. "Okunmamış" sekme sayacı örneklerde sessiz konuşmayı saymıyor gibi (10: 5 okunmamışlı konuşmadan sessiz olan hariç 4; 10b: 2) — Varsayım: sayaç = sessiz olmayan okunmamış konuşma sayısı.
5. **Liste iğne simgesi (E-10-13):** yalnız sistem / koordinatörlük gruplarında. "Kullanıcı konuşmayı sabitledi" mi, "sistem grubu her zaman üstte" mi belirsiz; sabitleme eylemi tasarımda yok.
6. **Mesajdan görevin izi:** E-10-91 "mesajın altında görev kartı" diyor; stil yorumu "görev kartı yok" ve `rp-att--task` / `rp-tid` sınıfları örneksiz. Dönüştürülmüş mesajın görünümü bilinmiyor.
7. **Mesaj menüsü kapsamı (E-10-41):** yalnız kendi mesajı için çizilmiş. Başkasının mesajında Düzenle / Sil gizlenir mi, "Mesaj bilgisi" görünür mü bilinmiyor. **Sözleşme notu:** Düzenle yalnız gönderende (anket mesajı hiç düzenlenmez); Sil gönderende ya da grupta `getChat.role == admin` olanda (§10.7 M-10). Kurucu (`founder`) başkasının mesajını silemez, üyenin kurduğu grupta yönetici yoktur, şirket yöneticisi bile değil (MESSAGING-K07). Sabitle herkese açık çizilmiş; sözleşmede birebirde iki taraf, grupta yönetici/kurucu.
8. **10'da "Diğer" açık ama tepki seçici açık:** `aria-expanded="true"` olan "Diğer" düğmesinin yanında menü değil tepki seçici çizilmiş; tetikleyici ↔ açılır eşlemesi tutarsız (Varsayım: tepki seçici "Tepki ver"e, menü "Diğer"e bağlıdır).
9. **Anonim anket (E-10-97, E-10-99):** sözleşmede oy verenler her zaman görünür (§10.10). Ayrıca anketin ayrı açıklaması yok; soru = mesaj gövdesi. 10'daki anket mesajında hem gövde metni hem ayrı soru var — sözleşmeyle çelişir (§10.7 "ayrı açıklama metni yok").
10. **Emoji / metin biçimi:** yazma çubuğunda emoji düğmesi yok; mesaj metninde kalın parça var ama biçimlendirme aracı yok. **Sözleşme notu:** mesaj düz metindir, biçimlendirme yoktur (MESSAGING-K08); kalın gösterim uygulanmaz, `strong` örnek veri sayılır (§7.20).
11. **Çizilmemiş durumlar:** silinmiş mesaj, silinmiş mesaj alıntısı, iletilmiş mesaj (yalnız CSS `rp-bub__fwd`), düzenleme kipi, gönderiliyor / gönderilemedi, kapanmış anket, kilitli görev çipi (stilde `rp-tcard--lock` var, örneği yok), sohbet içi arama sonuçları (stilde `rp-sres`, `rp-hl` var, örneği yok), birebir sohbet görünümü, çevrimiçi / son görülme, "neden yazamıyorum", yazma alanının kapalı hâli, boş liste / boş sohbet / yükleniyor / hata, Üye ekle penceresi, sessize alma süresi, silme onayı, Grup bilgisi'nin Dosyalar / Görevler / Sabitli sekmeleri, Yeni grup "Birebir" kipi, Dosya paylaş "Arşivden" kipi.
12. **Stilde ölü kurallar:** `rp-dpanel`, `rp-msgapp--two`, `rp-seen`, `rp-msgtools`, `rp-tcard`, `rp-fcard`, `rp-poll`, `rp-typing`, `rp-compose*`, `rp-menu2` örneksiz ve sonraki kurallarca ezilmiş / kullanılmıyor; uygulamaya taşınmaz.
13. **Örnek veri tutarsızlığı (etkisiz):** İlet penceresindeki alıntı "#ALT-14" diyor, akıştaki aynı mesaj "#ALT-7". Değerler örnektir; yalnız "alıntıda görev çipi düz metin olarak geçer" biçimi alınır.
14. **"Konuşma bilgisi" (E-10-20) ile başlık düğmesi (E-10-18):** ikisi aynı pencereyi mi açar, ⓘ farklı bir panel mi bilinmiyor.
15. **Okunmamış ayırıcı ve "Okudu" satırı:** "en son bunu okudu" her okuyan için aynı yazılmış; "son okuduğu mesaj bu" mu, "bunu ve sonrasını okudu" mu anlamı belirsiz.
16. **Okuyana göre kilitli kart (E-10-34, E-10-50, E-10-84, E-10-106, §4 kilit metinleri):** tasarım "kart her okuyana kendi yetkisiyle gösterilir; yetkisi olmayan kilitli kart görür" ve görev önerisinde "<n> kişi kilitli görür" diyor. **Sözleşme notu: tersi.** Sohbete paylaşılan görev / koordinatörlük / dosya özeti her sohbet üyesine açıktır (`getChatRefSummary`, MESSAGING-K31; `TestF59S10GorevOzetiYetkisizUyeyeAcik`), paylaşılan dosyayı her üye indirir (`downloadChatSharedFile`, MESSAGING-K32). Tek "görünmez" durum `available: false` (hedef artık yok / aktarılmış). Gönderen yalnız o gün görebildiğini paylaşabilir (yoksa 422 `refs`). "<n> kişi kilitli görür" değeri hesaplanamaz. Kilitli kart ürün kararı olarak istenirse MESSAGING-K31/K32 değişir (`eksikler.md` §4).
17. **"Koordinatörler" sistem grubu (E-10-09, E-10-13, E-10-79):** tasarım "Genel" yanında "Koordinatörler" sistem grubu çiziyor. **Sözleşme notu:** kendiliğinden gruplar yalnız "Genel" (`auto_kind = general`) ve bağlı her koordinatörlük (`auto_kind = department`); `auto_kind` başka değer almaz. Koordinatörleri toplayan grup elle kurulan serbest gruptur.
18. **Görevde kaynak mesaj izi (E-10-91):** tasarım "görevin geçmişinde kaynak mesaj görünür" diyor. **Sözleşme notu:** `WorkItem`'da kaynak mesaj alanı yok; bağ yalnız mesaj tarafında (`ChatMessage.task_ids`), görev etkinlik geçmişi de yok (BE-007). Mesajın altındaki "görev kartı" da sözleşmede yok: dönüştürülen görev sohbette paylaşılmış sayılmaz (§10.9), kart özeti üretilmez.
19. **Grup adı sınırı (E-10-77):** tasarım sayacı "<n> / 80". **Sözleşme notu:** `createGroupChat.name` tek satır, en çok 100 karakter (MESSAGING-K08); istemci 80'de keserse sözleşmeye uygundur, daha sıkıdır. Aynı şekilde anket sorusu tasarımda 200, sözleşmede gövde sınırı 5.000; seçenek metni 100.
20. **Düz metin (E-10-30, E-10-59):** bkz. §7.10; bahsetme ve görev çipi gövdede metin olarak, ayrıca yapılandırılmış `mentions[]` / `refs[]` listesiyle gider (konum alanı yok).
