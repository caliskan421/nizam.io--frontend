# 11 — Mekanizma (nasıl davranıyor)

Kapsam notu: modül **v1 dışı** (K14, yol haritası §4 "sonra"); backend'de karşılığı yok (BE-031). Bu dosya, ayrı backend+web fazının gereksinim kaynağıdır; §8.2 backend modülü için veri modeli ve uç ailesi gereksinimini ayrıca listeler. Tasarımda olmayan davranışlar "tasarımda yok" diye işaretlenmiştir; ihtiyaç tanımından (`../../../../nizam.io--program/program/isler/girdi-excel-modulu.md`, "girdi §N") gelenler kaynakla anılır.

## 1. Giriş ve gezinme

- **Giriş:** kenar menüsü "Tablolar" (`00-ortak`, `active="sheets"`; v1'de gizli) → `/tablolar`. Kırıntıdaki "Tablolar" bağlantısı düzenleyiciden listeye döner; program adı bağlantısı program ana sayfasına (hedefi `00-ortak`'ın işi).
- **Liste → düzenleyici:** tablo kartı (E-11-11) → `/tablolar/:tabloId`.
- **Oluşturma → düzenleyici:** "Yeni tablo" (E-11-04 / E-11-08 / E-11-17) → yeni tablo penceresi (E-11-72) → "Tabloyu oluştur" → yeni tablonun düzenleyicisi (**Varsayım:** oluşturma sonrası doğrudan açılır (doğrulanacak: tasarım tuvali / ürün sahibi sorusu)). Şablon kartı (E-11-09) → **Varsayım:** şablon sütunlarıyla doldurulmuş aynı pencere veya doğrudan oluşturma; tasarım hangisi olduğunu göstermiyor (doğrulanacak: ürün sahibi sorusu).
- **Tablolar arası:** bağlı tablolar şeridi çipleri (E-11-24/25) → ilgili tablo; bağlantı hücresi çipi (E-11-43, `title="<hedef> tablosunda aç"`) → hedef tablo + o satır parlatılır (E-11-45, satır `id="shrow-<n>"` + `rp-sh__row--flash`) → önerilen URL `?satir=<satırId>`. Seçici "Tabloyu aç" (E-11-70) → hedef tablo. Kilitli çip/çip (E-11-44, E-11-25 kilitli) → tıklanabilir görünüyor; hedef erişimsiz olduğundan **Varsayım:** gezinme yok, ipucu yeterli (doğrulanacak: eksikler.md §2.7 / ürün sahibi sorusu).
- **Geri/ileri** üst çubukta tarayıcı geçmişiyle (`00-ortak`).
- **URL'de taşınan durum (öneri, K10):** liste `kapsam`, `q`; düzenleyici `q`, `yapilacak`, `sirala`, `satir`. Açık menü/pencere URL'de değil (Paylaş penceresi derin bağlantısı istenirse `?paylas=1` — bilinmiyor). 11e'deki "Geçmiş" paneli açık/kapalı: **Varsayım:** bellekte (doğrulanacak: tasarım tuvali).

## 2. Kapsam ve rol etkisi (K1, K2)

- **Görünürlük tablo erişim listesine bağlıdır**, rol merceğine değil: sahip / düzenler / görür (E-11-21, E-11-71). Liste süzgeci "Oluşturduklarım" = sahibi olduğum, "Benimle paylaşılanlar" = erişim listesinde olduğum, "Tümü" = birleşim. Admin'in erişimsiz tabloları görüp görmediği **bilinmiyor** (paylaşım penceresinde Admin bir "kişi" olarak listeleniyor: "Admin · Sistem koordinatörlüğü").
- **Program kapsamı:** kırıntıda program adı var → **Varsayım:** tablolar seçili programa aittir, kapsam değişince liste o programın tablolarına döner, eski kapsam sorguları iptal edilir (K2) (doğrulanacak: eksikler.md §2.1 / ürün sahibi sorusu). İhtiyaç tanımı bağımsız çekirdek istediğinden backend kararı gerekir. Departman (koordinatörlük) seçimi listeyi süzmüyor (tasarımda departman süzgeci yok).
- **Eylem görünürlüğü** (tablo başına yetenek; modül `capabilities.ts`'inde, sunucu alanından türetilmeli — rol dizesi karşılaştırması yok):
  | Eylem | Sahip | Düzenler | Görür |
  |---|---|---|---|
  | Tabloyu görme, arama, süzme, sıralama, sütun genişliği | ✓ | ✓ | ✓ |
  | Tablo adını değiştirme (E-11-19) | ✓ | **Varsayım:** ✓ (`readonly={{st.ro}}` yalnız görür'de kapalı) (doğrulanacak: eksikler.md §2.3) | — |
  | Hücre düzenleme, satır ekle/sil, sütun ekle/adlandır/tip/taşı/sil | ✓ | ✓ | — (salt-okunur notu E-11-27) |
  | Bağlantı ekleme (E-11-43 "+") | ✓ | ✓ (ve hedef tabloya erişim) | — |
  | Paylaşım: kişi ekleme, rol değiştirme, erişim kaldırma | ✓ | bilinmiyor (yeni tablo ipucu "Paylaş’tan da ekleyebilirsin" herkese mi?) | bilinmiyor (düğme gizlenmiyor) |
  | Sütun kilitleme (11e) | ✓ | "koordinatör" ise ✓ — tanımsız | — |
  | Kilitli sütunu düzenleme (11e) | kilitleyen + koordinatörler (§7 çelişkisi) | aynı | — |
  | Geçmişte geri al (11e) | bilinmiyor; tasarımda başkasının değişikliğinde de var | bilinmiyor | — |
- 11e'deki "koordinatör" tablo içi rol mü program rolü (departman koordinatörü) mü belirsiz; program rolüyse K1 gereği `istemci-akislari.md` §4'e yeni satır gerekir.
- **Referans sütunlarında mevcut erişim kuralları korunur** (girdi §5): Kişi/Koordinatörlük/Görev seçenekleri kullanıcının görebildiği kayıtlarla sınırlı olmalı; görünmeyen görev referansının hücrede nasıl görüneceği tasarımda yok (**Varsayım:** tablo bağlantısındaki kilitli çip deseni (doğrulanacak: eksikler.md §2.6)).
- **K6:** erişim kaldırılırsa (403/404) tablo görünümü düşer, liste geçersizlenir; tasarımda metni yok.

## 3. Durum makinesi

| Durum | Değerler | Yer |
|---|---|---|
| Liste süzgeci | `tumu` \| `benim` \| `paylasilan` | URL |
| Liste araması | metin | URL (gecikmeli) |
| Düzenleyici araması | metin | URL |
| Yapılacak süzgeci | `tumu` \| `acik` \| `tamam` (yalnız Yapılacak sütunu varsa) | URL |
| Sıralama | `{sütunId, artan|azalan}` veya yok — **tek sütun** (çip tek) | URL. Kalıcı mı (tablo ayarı) kişisel mi: bilinmiyor; **Varsayım:** kişisel görünüm durumu (doğrulanacak: ürün sahibi sorusu) |
| Açık açılır öğe | yok \| sütun menüsü(`sütunId`) \| yeni sütun menüsü \| değer seçici(`satırId,sütunId`) \| bağlama seçici(`satırId,sütunId`) — tek seferde bir | bellek |
| Seçici içi arama (`pq`) | metin | bellek |
| Yeni sütun taslağı (`nc`) | ad, tip (varsayılan Metin), bağlantı hedefi | bellek; **Varsayım:** menü kapanınca atılır (doğrulanacak: tasarım tuvali) |
| Sütun genişliği | px; çift tık varsayılan | **K2 depolama yasağı:** yerel depolamaya yazılmaz. Ya sütunun sunucu özelliği (herkes için ortak) ya oturum belleği — bilinmiyor; **Varsayım:** sunucu alanı, tasarım `gtc` tabloyla birlikte geliyor (doğrulanacak: eksikler.md §2.4 / ürün sahibi sorusu) |
| Sürükleme | `resizing` sütunu | bellek |
| Parlatılacak satır | `satırId` | URL `satir`, 1.8 sn sonra temizlenir |
| Pencere | yok \| yeni tablo \| paylaş | bellek |
| Yeni tablo taslağı | ad, sütun listesi (ad+tip), seçili kişiler | bellek |
| Paylaş araması | metin | bellek |
| 11e: geçmiş paneli | açık/kapalı, süzgeç `tumu|benim` | bellek |
| 11e: yorum paneli | `{satırId, sütunId}` | bellek; **Varsayım:** URL'de değil (doğrulanacak: tasarım tuvali) |
| Hücre düzenleme taslağı | odaklı hücre değeri | bellek; odak kaybında kaydedilir |

Sunucu verisi (tablo, sütunlar, satırlar, erişim listesi, bağlar, özetler) TanStack Query'de, `scopedKey()` ile; **Varsayım:** hücre yazımları iyimser güncelleme + uzlaştırma (doğrulanacak: §8.3-a / ürün sahibi sorusu). **Sözleşme notu:** istemci-akislari §8 "İyimser güncelleme yapılmaz" der (görevler için yazılmıştır); tablo modülü için bu kural **açık izinle** değiştirilmelidir, yoksa yazma sonrası yeniden okuma uygulanır (§8.3-a).

## 4. Etkileşim akışları

Ortak yazma ilkesi (girdi §4 + K5): oluşturma yazımları `Idempotency-Key` taşır, güncellemeler `expected_revision` taşır (ADR-0027; güncellemede anahtar yok); çakışma kontrolü için bir sürüm alanı gerekir (tablo/satır/hücre düzeyinde — backend kararı). **Sözleşme notu:** satır düzeyi sürüm, aynı satırın farklı hücrelerini düzenleyen iki kişide gereksiz 409 üretir; hücre düzeyi önerilir (§8.3-c). Hücre/tık başına ayrı yazma hesap başına 60 yazma/dk tavanına çarpar; toplu birleştirme gerekir (§8.3-b). "Değişiklikler otomatik kaydedilir" → kaydet düğmesi yok; kaydediliyor/kaydedildi/hata göstergesi **tasarımda yok** (girdi §4 gerektiriyor — eklenmeli, **Varsayım:** `00-ortak` toast deseni (doğrulanacak: girdi-excel-modulu.md §4 / tasarım tuvali)). 409 sonucu: hücre düzeyinde "başkası değiştirdi" uyarısı + sunucu değerine dönüş/üzerine yazma seçimi (K5 alan alan seçim); "sonuç bilinmiyor" durumunda değer taslak olarak korunur.

### 4.1 Tablo oluşturma (E-11-04/08/17 → E-11-72)
Tetik → pencere: ad (zorunluluk bilinmiyor; boşsa **Varsayım:** "Adsız tablo" (doğrulanacak: tasarım tuvali, yer tutucu)), isteğe bağlı sütunlar (ad + 6 tip), isteğe bağlı kişiler → "Tabloyu oluştur" → oluştur isteği (**Varsayım:** tablo + sütunlar + erişim listesi tek işlemde (doğrulanacak: eksikler.md §2.2)) → başarı: düzenleyiciye geç, liste geçersizlenir → hata: pencerede `b.error` satırı. Sütun verilmezse sunucu/istemci "Ad, Tarih ve Durum" sütunlarını ekler (tipleri bilinmiyor; **Varsayım:** Metin, Tarih, Yapılacak (doğrulanacak: ürün sahibi sorusu)). Seçilen kişilerin rolü bilinmiyor (**Varsayım:** düzenler (doğrulanacak: ürün sahibi sorusu)).
### 4.2 Şablonla başlama (E-11-09)
Şablon sütun listesiyle tablo oluşturur (örn. "İş · Sorumlu · Koordinatörlük · Son tarih · Yapıldı" → Metin, Kişi, Koordinatörlük, Tarih, Yapılacak; tip eşlemesi şablon verisinde olmalı). Pencere açılıp açılmadığı bilinmiyor.
### 4.3 Tablo adını değiştirme (E-11-19)
Yerinde düzenle → odak kaybı/Enter → güncelle isteği → kırıntı ve başlık güncellenir. Boş ad: bilinmiyor (**Varsayım:** önceki ada döner (doğrulanacak: ürün sahibi sorusu)).
### 4.4 Sütun işlemleri (E-11-67, E-11-68)
- **Ekle:** "+" → ad + tip (+ bağlantı hedefi) → "Sütunu ekle" → sona eklenir; mevcut satırlarda boş hücre.
- **Adlandır:** menü içi giriş, `onChange` ile kaydet.
- **Tip değiştir:** seçenek tıkla → anında uygulanır (tasarım). Girdi §3 "dönüştürülemeyen değerler sessizce kaybolmamalı" → **tasarımda uyarı/önizleme yok**; backend dönüşüm sonucunu (dönüşen/dönüşemeyen sayısı) döndürmeli, istemci onay diyaloğu göstermeli (**Varsayım:** K5 `confirmation_required` deseni uygun (doğrulanacak: girdi-excel-modulu.md §3 / eksikler.md §2.4)).
- **Bağlantı hedefini seç/değiştir:** "bağlanacak tablo" listesi; hedef değişince mevcut bağların akıbeti bilinmiyor.
- **Sola/sağa taşı:** bir adım; sürükle-bırak yok.
- **Sil:** tek sütunsa devre dışı; onay yok (tasarım) — **Varsayım:** veri kaybı nedeniyle onay eklenmeli veya geri al (11e) sunulmalı (doğrulanacak: ürün sahibi sorusu).
- **Genişlik:** tutamaçla sürükle (pointer), çift tık varsayılana döner.
### 4.5 Satır işlemleri
- **Yeni satır** (E-11-47): sona boş satır; **Varsayım:** ilk hücreye odak (doğrulanacak: tasarım tuvali).
- **Sil** (E-11-36): hover çöp → anında silinir (onay yok). Silinen satıra gelen bağlar ne olur (hedef tarafta çip kaybolur mu) — bilinmiyor.
- Satır taşıma, çoğaltma, çoklu seçim: tasarımda yok.
### 4.6 Hücre düzenleme
- **Metin:** yaz → odak kaybı/Enter → kaydet. **Tarih:** yerel tarih seçici → değişince kaydet. **Yapılacak:** tık → anında kaydet, yapılacak sayaçları ve alt satır güncellenir (her tık ayrı yazma olursa §8.3-b tavanı).
- **Kişi/Koordinatörlük/Görev** (E-11-69): hücre tık → seçici → ara (Koordinatörlük hariç) → seçenek tık → kaydet + kapan (tekli); "Temizle" → boşalt. Seçenek kaynağı: kişiler = program/şirket kullanıcıları (bilinmiyor; **sözleşme notu:** §8.3-e gizlilik kararı, §8.3-f `full_name` null), koordinatörlükler = program departmanları (arama yok → kısa liste varsayımı), görevler = program görevleri (kapsamı bilinmiyor; `x.hint` kapsam açıklaması olabilir).
- **Tablo bağlantısı** (E-11-70): "+" → hedef tablo satır listesi (çoklu) → seçenek tık seç/bırak (her tık yazma mı, kapanışta toplu mu: bilinmiyor; **Varsayım:** her tık (doğrulanacak: eksikler.md §2.7)) → çipler güncellenir; hedef tablonun geri bağ sayacı (E-11-24) değişir.
### 4.7 Sıralama ve süzme
Sütun menüsü "Artan/Azalan sırala" → sıralama çipi görünür, başlıkta ok → "×" kaldırır. Tip başına sıralama anahtarı: metin (Türkçe harmanlama, GAP-036 ilgili), tarih, boolean, kişi/koordinatörlük/görev **Varsayım:** görünen ad (doğrulanacak: eksikler.md §2.5), bağlantı (bilinmiyor). Yapılacak süzgeci ve arama birlikte uygulanır (**Varsayım:** VE (doğrulanacak: tasarım tuvali)). İstemcide mi sunucuda mı: satır tavanına bağlı (§5).
### 4.8 Paylaşım (E-11-71)
- **Kişi ekle:** ara (ad) → "Ekle" → erişim listesine eklenir (varsayılan rol bilinmiyor; **Varsayım:** "Görür" veya "Düzenler" (doğrulanacak: ürün sahibi sorusu)); açıklama "Eklenen kişiler tabloyu hemen görür" → anında yazma, bildirim gönderilip gönderilmediği bilinmiyor.
- **Rol değiştir:** Düzenler ↔ Görür → anında yazma. Sahip değiştirilemez/kaldırılamaz.
- **Erişimi kaldır:** × → anında (onay yok). Kendi erişimini kaldırma: bilinmiyor.
- **Bağlantıyı kopyala:** tablo URL'si panoya (**Varsayım:** yalnız erişimi olanlar açabilir; bağlantıyla erişim modeli tasarımda yok (doğrulanacak: ürün sahibi sorusu)). Kopyalandı geri bildirimi tasarımda yok.
- Hata: pencere içi kırmızı satır.
### 4.9 Birlikte çalışma (11e — kavram)
- **Canlı varlık:** tabloyu açanlar yığında, düzenleyenin etkin hücresi kişi renginde çerçeve + ad etiketi, yazarken "yazıyor…". Gerçek zamanlı kanal gerektirir → **K8 ile çelişir** (SSE yalnız sohbet). Modül fazında karar: SSE kapsamının genişletilmesi (aynı `fetch` akışı deseni, §10.5 uzlaştırma) veya varlık olmadan kısa aralıklı sorgu tazelemesi. 11b ipucundaki "anında görür" da aynı karara bağlı.
- **Hücre yorumu:** sağ tık → "Yorum ekle" → panel (yorum dizisi + yanıt girişi, `@` ile anma → bildirim) → "Çözüldü" diziyi kapatır; köşe üçgeni yorum varlığını gösterir. Çözülmüş dizinin görünürlüğü, yorum düzenleme/silme bilinmiyor. `@` bildirimi bildirim modülüne (F7) bağlı.
- **Değişiklik geçmişi:** "Geçmiş" anahtarı sağ paneli açar; girdiler kişi/zaman/satır›sütun/eski→yeni; "Benim" süzgeci; "Geri al" tek girdiyi tersine çevirir (girdi §4 "hatalı değişiklikler geri alınabilmeli"). Geri alma sonrasında hücre o arada yeniden değiştiyse davranış bilinmiyor (**Varsayım:** 409 + onay (doğrulanacak: eksikler.md §2.8)). Toplu girdi ("3 satır eklendi") geri alınınca satırlar silinir. "Tüm geçmişi gör" hedefi yok. Hücre hover geçmişi yalnız metinde.
- **Sütun kilidi:** kilitli sütun herkese görünür, yalnız yetkililer düzenler (yetki tanımı çelişkili, ozellikler §7.2); kilitleme eylemi için arayüz yok (**Varsayım:** sütun menüsüne "Sütunu kilitle" eklenir (doğrulanacak: tasarım tuvali / ürün sahibi sorusu)).

## 5. Liste davranışı

- **Tablo listesi:** sayfalama/daha fazla yükle tasarımda yok; kart ızgarası tüm sonuçları gösteriyor. Sıra "son düzenlenenler" (son düzenleme zamanı, azalan) — diğer sıralamalar yok. **Varsayım:** Sayaçlar (E-11-05) sunucudan süzgeç başına sayı olarak gelmeli (doğrulanacak: eksikler.md §2.2; **sözleşme notu:** §8.3-g). Arama sunucu tarafı mı istemci tarafı mı: bilinmiyor; tablo sayısı küçükse istemci.
- **Satırlar:** sayfalama/sanallaştırma tasarımda yok (örnekler 4–6 satır). Girdi §2 örnekleri (günlük ziyaretçi, yemek dağıtımı) yüzlerce–binlerce satır doğurabilir → satır tavanı ve sanal kaydırma kararı gerekir; arama/süzgeç/sıralama/alt özet sunucuda mı istemcide mi buna bağlı. **Varsayım:** Sayaç "`n` satır" süzgeçli görünümün sayısıdır (doğrulanacak: tasarım tuvali).
- **Alt özet** (E-11-48) tip başına hesaplanır; süzgeçli görünüme mi tüm tabloya mı ait — bilinmiyor. **Sözleşme notu:** toplam/özet kalıbı yok (§8.3-g); erişimsiz bağ sütununda "`n` bağlantı" verilemez (§8.3-d).
- **Seçiciler:** kişi/görev seçenekleri aramalı, maks. 260px kaydırma; tavanı ve sunucu araması (ör. `q` ile) gerekebilir. Bağlama seçicisi hedef tablonun tüm satırlarını listeliyor — büyük hedefte sunucu araması gerekir.
- **Paylaş araması:** yazdıkça sonuç (örnek "re" → 1 kişi); en az karakter sayısı bilinmiyor; erişimi olanlar sonuçtan çıkarılır.
- **Geçmiş paneli:** son 4 girdi + "Tüm geçmişi gör"; **Varsayım:** sayfalama imleçli olmalı (doğrulanacak: eksikler.md §2.8).

## 6. Boş / yükleniyor / hata durumları

| Durum | Tasarımda | Not |
|---|---|---|
| Süzgeçte tablo yok | "Bu filtrede tablo yok." (E-11-18) | Şablon bölümü ve "Yeni tablo" kartı yine görünür |
| Hiç tablo yok (ilk kullanım) | tasarımda yok — K7 varsayılanı | **Varsayım:** aynı metin + hızlı başlangıç (doğrulanacak: tasarım tuvali) |
| Tabloda hiç satır yok | tasarımda yok | "Eşleşen satır yok." yalnız arama/süzgeç için; **Varsayım:** boş ızgara + "Yeni satır" (doğrulanacak: tasarım tuvali) |
| Arama/süzgeç sonucu boş | "Eşleşen satır yok." (E-11-46) | |
| Seçici boş | "Eşleşen yok.", "Eşleşen satır yok.", "Eşleşen kişi yok." | |
| Bağlantı hedefi silinmiş | "Tablo bulunamadı" (E-11-43) | Okuyucu için erişimsiz hedefle aynı durum (`available:false`, §8.3-d) |
| Hedefe erişim yok | kilitli çip "🔒 n bağlantı" (E-11-44) | **Sözleşme notu:** ad ve sayı gösterilemez (§9/§10.6 varlık gizleme); tek `available:false` durumu, metin "🔒 Erişimin yok" (§8.3-d) |
| Salt-okunur erişim | not kutusu (E-11-27), girişler readonly/disabled, düzenleme düğmeleri gizli | |
| Yükleniyor (liste, tablo, seçici) | tasarımda yok — K7 varsayılanı | **Varsayım:** kart/satır iskeleti (doğrulanacak: tasarım tuvali) |
| Kaydediliyor / kaydedildi / kayıt hatası | tasarımda yok | Girdi §4 gerektiriyor; eklenmeli |
| Çakışma (409) | tasarımda yok | K5 alan alan seçim |
| Tablo bulunamadı / erişim kaldırıldı (404/403) | tasarımda yok | K6 |
| Program yok / `membership_required` | tasarımda yok — K7 varsayılanı | Tablolar program kapsamlıysa |
| Paylaşım hatası | `b.error` kırmızı satırı (metin bilinmiyor) | |
| Çevrimdışı / gerçek zamanlı kopma | tasarımda yok | 11e kabul edilirse gerekir |

## 7. Öğe → davranış tablosu

| Kimlik | Öğe | Olay | Davranış | Bağ (mekanizma §, backend.md satırı) |
|---|---|---|---|---|
| E-11-01 | Kırıntı | tık | program / Tablolar listesine git | §1 |
| E-11-03 | Alt başlık | — | toplam tablo sayısını gösterir | §5 |
| E-11-04 | Yeni tablo | tık | yeni tablo penceresi | §4.1 |
| E-11-05 | Tablo süzgeci | tık | `kapsam` URL'e yazılır, liste süzülür | §3, §5 |
| E-11-06 | Tablo ara | yazma | `q` URL'e (gecikmeli), liste süzülür | §5 |
| E-11-08 | Boş tablo | tık | yeni tablo penceresi | §4.1 |
| E-11-09 | Şablon kartı | tık | şablonla oluştur | §4.2 |
| E-11-11 | Tablo kartı | tık/Enter | düzenleyiciye git | §1 |
| E-11-15 | Kişi yığını (kart) | hover/odak | ad ipucu | — |
| E-11-17 | Yeni tablo kartı | tık | yeni tablo penceresi | §4.1 |
| E-11-19 | Tablo adı | değişim | adı kaydet | §4.3 |
| E-11-21 | Kişi yığını | tık | Paylaş penceresi | §4.8 |
| E-11-22 | Paylaş | tık | Paylaş penceresi | §4.8 |
| E-11-24 | Gelen bağ çipi | tık | kaynak tabloya git | §1 |
| E-11-25 | Giden bağ çipi | tık | hedef tabloya git (kilitliyse **Varsayım:** yok (doğrulanacak: eksikler.md §2.7)) | §1 |
| E-11-27 | Salt-okunur notu | — | yalnız `görür` erişiminde | §2 |
| E-11-28 | Tabloda ara | yazma | satırları süz | §4.7 |
| E-11-29 | Yapılacak süzgeci | tık | `yapilacak` URL'e, satırları süz | §4.7 |
| E-11-30 | Sıralama çipi × | tık | sıralamayı kaldır | §4.7 |
| E-11-31 | Satır sayacı | veri/süzgeç değişince | "`n` satır" yeniden hesapla (**Varsayım:** süzgeçli görünümün sayısı (doğrulanacak: tasarım tuvali)) | §5, §8.3-g |
| E-11-33 | Sütun başlığı | tık | sütun menüsünü aç/kapat | §4.4 |
| E-11-34 | Genişlik tutamacı | sürükle / çift tık | genişlik değiştir / varsayılana dön | §3, §4.4 |
| E-11-35 | Sütun ekle | tık | yeni sütun menüsü | §4.4 |
| E-11-36 | Satırı sil | tık | satırı sil (onaysız) | §4.5 |
| E-11-37 | Metin hücresi | değişim | hücreyi kaydet | §4.6 |
| E-11-38 | Tarih hücresi | değişim | hücreyi kaydet | §4.6 |
| E-11-39/40/41 | Kişi/Koordinatörlük/Görev hücresi | tık | değer seçici | §4.6 |
| E-11-42 | Yapılacak hücresi | değişim | hücreyi kaydet, sayaçları güncelle | §4.6 |
| E-11-43 | Bağlantı çipi | tık | hedef tabloda satıra git + parlat | §1 |
| E-11-43 | Bağlantı "+" | tık | bağlama seçicisi | §4.6 |
| E-11-44 | Kilitli bağlantı çipi | hover/tık | ipucu; **Varsayım:** gezinme yok (doğrulanacak: eksikler.md §2.7) | §2 |
| E-11-45 | Satır parlaması | sayfa yüklenince | `satir` satırına kaydır + 1.8 sn vurgu | §1, §3 |
| E-11-47 | Yeni satır | tık | boş satır ekle | §4.5 |
| E-11-48 | Alt özet | veri değişince | yeniden hesapla | §5 |
| E-11-49 | Alt ipucu | — | "herkes anında görür" iddiası gerçek zamanlı kararına bağlı | §4.9, §8.3-a |
| E-11-52 | Canlı varlık | gerçek zamanlı olay | yığını güncelle | §4.9 |
| E-11-53 | Geçmiş | tık | geçmiş panelini aç/kapat | §4.9 |
| E-11-55/56 | İmleçler | gerçek zamanlı olay | hücre çerçevesi + ad | §4.9 |
| E-11-57 | Yorum işareti | tık/hover | **Varsayım:** yorum paneli açılır (doğrulanacak: tasarım tuvali) | §4.9 |
| E-11-58 | Kilitli sütun | düzenleme denemesi | engellenir, ipucu | §4.9 |
| E-11-59 | Yorum paneli | yanıt gönder / Çözüldü / @ | yorum ekle / diziyi kapat / bildirim | §4.9 |
| E-11-60 | Geçmiş süzgeci | tık | Tümü/Benim | §4.9 |
| E-11-61 | Geri al | tık | değişikliği tersine çevir | §4.9 |
| E-11-62 | Tüm geçmişi gör | tık | hedef bilinmiyor | §4.9 |
| E-11-64 | Para değerli sütun (11e) | — | görüntü biçimi "4.500 ₺"; tip listesinde yok (karar) | §4.4, §8.2 |
| E-11-65 | Hücre bağlam menüsü | sağ tık | "Yorum ekle" | §4.9 |
| E-11-66 | Hücre geçmişi açılır | hover | hücreye ait değişiklikler (yalnız metinde) | §4.9 |
| E-11-67 | Sütun menüsü öğeleri | tık | adlandır / tip / hedef / sırala / taşı / sil | §4.4, §4.7 |
| E-11-68 | Sütunu ekle | tık | sütun oluştur | §4.4 |
| E-11-69 | Seçici seçeneği / Temizle | tık | değeri yaz / boşalt | §4.6 |
| E-11-70 | Bağlama seçeneği / Tabloyu aç | tık | bağ ekle-kaldır / hedefe git | §4.6, §1 |
| E-11-71 | Paylaş: Ekle / Düzenler-Görür / × / Bağlantıyı kopyala / Kapat | tık | erişim ekle / rol değiştir / kaldır / URL kopyala / kapat | §4.8 |
| E-11-72 | Tabloyu oluştur | tık | tablo oluştur | §4.1 |

## 8. Bağımlılıklar

### 8.1 Ekran bağımlılıkları
- **`00-ortak`:** kenar menüsü girdisi (v1'de gizli, K14), üst çubuk (geri/ileri, kırıntı, tema, bildirim), kapsam seçici (program kapsamı), `t-modal`, `rp-pop`/`rp-menuitem`, `rp-seg`, `rp-av`/`rp-avstack`, `rp-empty`, **Varsayım:** iyimser yazma + toast (doğrulanacak: §8.3-a / ürün sahibi sorusu), etkili işlem onayı diyaloğu (K5; tip dönüşümü için).
- **`shared/http/mutation` (K5):** her hücre/yapı yazımı; idempotency, 409 çözüm, sonuç bilinmiyor.
- **Diğer modüller (referans kaynakları):** kullanıcılar (`05`), koordinatörlükler/departmanlar (`08`), görevler (`03` — görev çipinden göreve gitme tasarımda yok ama beklenir), bildirimler/sohbet SSE (`10`, F7 — `@` anma ve gerçek zamanlı), işlem geçmişi (`01b` — tablo geçmişiyle ilişkisi bilinmiyor).
- **Paylaşılan durum:** seçili program (K2), tema.
- **Program ihtiyacı belgesi örtüşmesi:** girdi §3 tip/doğrulama (tasarım 7 tip, doğrulama/zorunluluk yok), §3 tip değişiminde veri kaybı (tasarımda yok), §4 izin üçlüsü görme/doldurma/yapı değiştirme (tasarım görür/düzenler — "yapıyı değiştirme" ayrı izin değil; "yalnız kendine ayrılmış kayıtları doldurma" yok), §4 kaydedildi göstergesi ve çakışma (yok), §4 geçmiş + geri al (11e var), §5 tablo↔tablo ve uygulama referansları (var: Tablo bağlantısı; Kişi/Koordinatörlük/Görev), §5 canlı/anlık değer/kaynak düzenleme ayrımı (tasarım yalnız canlı referans gösteriyor), §6 süzme/sıralama/gruplama/toplam (gruplama yok, toplam yalnız alt özet), §6 şablon (var, yalnız kullanma; tablodan şablon üretme yok), §6 dönem/yıl bağlamı ve onaylı rapor sürümü (yok), §6 formül/grafik/Excel alışverişi (yok).

### 8.2 Backend modülü gereksinimi (veri modeli + uç aileleri) — BE-031 için
Aşağıdakiler tasarımdan çıkan **gereksinimdir**, şema önerisi değildir; ad/tür kararı backend fazınındır.

**Varlıklar**
1. **Tablo (sheet):** kimlik; kapsam (program kimliği — kırıntı; bağımsız çekirdek isteniyorsa ayrı "çalışma alanı" — karar gerekli); ad (boş olabilir mi?); sahip kullanıcı; oluşturulma; son düzenleme zamanı + son düzenleyen (E-11-16, E-11-20); satır ve sütun sayısı (E-11-14); revizyon (K5); kaynak şablon (isteğe bağlı); silinme/arşiv (tasarımda yok, karar). Liste için önizleme özeti: ilk 3 sütun adı + ilk 3 satırın görüntü değerleri (E-11-12) ve erişimi olan kişilerin kısa listesi (E-11-15) — ayrı alan ya da türetilmiş.
2. **Sütun:** kimlik; tablo; ad; tip `metin | tarih | yapilacak | kisi | koordinatorluk | gorev | tablo_baglantisi` (+ 11e'den aday `sayi/para`; girdi'den aday çoklu seçim, dosya); sıra (taşıma); genişlik px (E-11-34; ortak mı kişisel mi karar); bağlantı tipi için hedef tablo kimliği; kilit (kilitli mi, kilitleyen, kimlerin düzenleyebildiği — 11e); zorunluluk/doğrulama (girdi §3, tasarımda yok); revizyon.
3. **Satır:** kimlik (kalıcı; satır no görüntü sırasıdır — E-11-36 ve "B4" adresi çelişkisi); tablo; sıra konumu; oluşturan/zaman; revizyon; silinme (geri al için yumuşak silme gerekir).
4. **Hücre değeri:** (satır, sütun) → tipli değer: metin `string`; tarih `YYYY-AA-GG`; yapılacak `boolean`; kişi `user_id`; koordinatörlük `department_id`; görev `work_item_id`; tablo bağlantısı `satır kimliği[]` (çoklu). Referans tiplerinde görüntü için çözülmüş özet (ad, baş harf; departman kısaltması; görev kodu+başlığı; bağlı satırın birincil ve ikinci sütun değeri) ve **erişim durumu** (erişimsizse değer yerine sayı — E-11-44). Son değiştiren/zaman (geçmiş + çakışma). Referans davranışı: canlı (tasarım) — girdi §5'teki "anlık değer saklama" seçeneği karar gerektirir.
5. **Erişim (ACL):** (tablo, kullanıcı, rol `sahip | duzenler | gorur`); kişi alt metni için kullanıcının rol + departman özeti (E-11-71, mevcut kullanıcı modülünden). 11e'ye göre aday: departman ve program geneli izinleri; girdi §4'e göre aday: "yalnız kendi satırlarını doldurur" izni ve "yapıyı değiştirme" ayrı izni. Bağlantıyla erişim yok/var — karar.
6. **Tablo bağı (türetilmiş):** bağlantı sütunu (kaynak tablo, sütun) → hedef tablo; geri bağ özeti hedef tarafta "kaynak tablo · sütun · n bağlantı" (E-11-24); erişimsiz kaynaklar için gizli sayım (E-11-26); hedef silinmiş durumu (E-11-43 "Tablo bulunamadı").
7. **Şablon:** kimlik; ad; ikon; sütun tanımları (ad + tip) (E-11-09). Sabit mi kullanıcı tanımlı mı — karar.
8. **Değişiklik kaydı (geçmiş):** kimlik; tablo; aktör; zaman; tür (hücre değişimi, satır ekleme/silme — toplu "3 satır eklendi", sütun işlemleri, paylaşım?); satır/sütun; eski/yeni değer (görüntülenebilir biçimde); geri alınabilir mi + geri alma kaydı. Süzgeç: benim.
9. **Yorum dizisi:** (tablo, satır, sütun) hücreye bağlı; yorumlar (yazar, zaman, gövde, anılan kullanıcılar `@`); çözüldü durumu + çözen/zaman. `@` → bildirim modülüne olay.
10. **Varlık (presence, geçici):** oturumdaki kullanıcı, kişi rengi (sunucu mu istemci mi atar — karar), mod düzenliyor/görüntülüyor, etkin hücre, yazıyor bayrağı. Kalıcı değil.
11. **Alt özet (türetilmiş):** sütun başına tip özeti (dolu sayısı, farklı kişi/departman sayısı, tarih aralığı min–max, yapılacak tamam/toplam, bağlantı toplamı) — sunucu mu istemci mi, satır tavanına bağlı.

**Uç aileleri**
- **Tablolar:** listele (süzgeç `tumu|benim|paylasilan`, `q`, sıra son düzenleme; süzgeç sayaçlarıyla) · getir (yapı + erişim özeti + benim rolüm + bağ özeti) · oluştur (ad, sütunlar, kişiler; şablondan) · yeniden adlandır · sil/arşivle (karar).
- **Sütunlar:** ekle · güncelle (ad, genişlik, kilit) · tip değiştir (dönüşüm önizlemesi/onayı: `confirmation_required` deseni) · bağlantı hedefini değiştir · taşı (sıra) · sil.
- **Satırlar:** listele (sayfalama/sanallaştırma kararı; `q`, yapılacak süzgeci, sıralama sunucudaysa parametreleri) · ekle · sil · (sıra değiştir — tasarımda yok).
- **Hücreler:** tek/toplu değer yaz (revizyon + `Idempotency-Key`; 409 `*.edit_conflict` alan alan) · bağlantı hücresine satır ekle/çıkar.
- **Referans adayları:** kişi ara · departman listesi · görev ara (kapsam kuralları mevcut modüllerle aynı) · hedef tablo satır ara (bağlama seçicisi; birincil + ikinci sütun özeti) · bağlanabilir tablolar listesi (erişimli olanlar).
- **Paylaşım:** erişim listesi · kişi ekle (rol) · rol değiştir · erişim kaldır · paylaşım için kişi ara (erişimi olanlar hariç).
- **Şablonlar:** listele (· oluştur, karar).
- **Geçmiş:** tablo geçmişi (imleçli; `benim` süzgeci) · hücre geçmişi · geri al (çakışmada 409).
- **Yorumlar:** hücre dizisi getir · yorum ekle (anmalar) · çözüldü/yeniden aç · tablo içindeki yorumlu hücrelerin listesi (köşe işareti için).
- **Gerçek zamanlı akış (K8 kararı gerekir):** tablo başına olay akışı (hücre/yapı değişimi, varlık, yorum) + HTTP uzlaştırma; ya da yalnız sorgu tazelemesi.
- **Yetenek alanları:** tablo yanıtında istemcinin yetki hesaplayabileceği alanlar (benim rolüm; kilitli sütunda düzenleyebilir miyim; paylaşımı yönetebilir miyim) — K1 gereği rol dizesi yerine sunucu kanıtı.

### 8.3 Sözleşme notları (denetçi; backend analistinin bulgularının işlenmesi)
Kaynak: `istemci-akislari.md` §8, §9, §10.6, ADR-0027, ADR-0028, `eksikler.md` §2 ve §4. Bunlar tasarım tespitini değiştirmez; modül sözleşmesi yazılırken tasarım davranışının neyle gerildiğini söyler.

- **a) İyimser güncelleme:** `istemci-akislari.md` §8 "İyimser güncelleme yapılmaz; cevap gövdesi yerel durumu tahminle değiştirmek için kullanılmaz" der (gerekçe görev geçiş zinciri; yazılı kapsamı görevlerdir). Tablo düzenleyicisinin "otomatik kayıt" hissi yerel değeri hemen göstermeyi ister; bu, modül sözleşmesinde **açıkça izin verilmedikçe** yapılamaz. Öneri (eksikler §3): yazma yanıtı otoriter hücre temsilini döndürür, yerel durumu o günceller, özet ayrıca tazelenir.
- **b) Yazma bütçesi:** ADR-0028 hesap başına yazma sınıfı 60/dk (pilot adayı sayı; GET/HEAD dışı bütün yöntemler tek kovada). Hücre/tık başına ayrı yazma (odak kaybı, yapılacak tıkı, bağlama seçici tıkı, paylaşım) hızlı girişte 429 `platform.rate_limited` üretir. Öneri: toplu hücre yazımı (eksikler §2.5 `writeTableCells`) ve/veya tablo yazımları için ayrı kova (karar `yeni-1`).
- **c) Sürüm düzeyi:** ADR-0027 kuralı (bayat sürüm ve istenen değer güncelden farklıysa 409; aynı değer 200) satır düzeyinde uygulanırsa iki kişinin aynı satırın farklı hücrelerini düzenlemesi gereksiz 409 üretir. Öneri: hücre düzeyi sürüm (eksikler §2.5).
- **d) Varlık gizleme:** §9 ve §10.6 erişilemeyen kaydın varlığını gizler (404; referans hedefinde 200 `available:false`, §10.8). Erişimsiz hedef tablonun adı (E-11-25 `title`, E-11-44 `title`), bağ sayısı ("🔒 n bağlantı", E-11-48 "n bağlantı", E-11-26 "+N") ve ayrı "Tablo bulunamadı" metni bu kuralla çelişir. Öneri: tek `available:false` durumu, sayı ve ad yok (eksikler §2.7). Gevşetmek ürün kararıdır, ADR'ye yazılır.
- **e) Kişi seçici:** `istemci-akislari.md` §8 son madde "ayrı bir ekip dizini ucu yoktur" der; `listChatCandidates` sohbet kuralıdır (§10.6; üye yalnız birebir yazışabildiklerini görür). Tablo kişi seçicisi ve paylaşım araması **yeni bir dizin yüzüdür**: gizlilik kararı ürün sahibinindir (eksikler `yeni-5`, soru 4).
- **f) `full_name` null:** kişi adı alanları null olabilir (§8; WORK-K79). Kişi hücresi, kişi yığını (E-11-15, E-11-21), paylaşım listesi, geçmiş ve imleç etiketi nötr etiket "Bilinmeyen kişi" ve nötr avatar gösterir; null yazmayı yeniden denetmez, "Yönetici" diye tahmin edilmez.
- **g) Sayaçlar ve toplamlar:** sözleşmede imleçli liste için toplam/sayaç/sayfa kalıbı yoktur (api README §4 "sayfa numarası yoktur"; BE-003). Tasarımın E-11-03, E-11-05, E-11-29, E-11-31 ve E-11-48 değerleri yeni alan (ör. `counts`, `getTableSummary`; eksikler `yeni-10`) ister; o zamana kadar yalnız yüklenen satırlardan **yaklaşık** sayılır.
