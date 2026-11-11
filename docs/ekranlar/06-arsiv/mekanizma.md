# 06 — Mekanizma (nasıl davranıyor)

Öğe kimlikleri `ozellikler.md` ile aynıdır. Uç adları yalnız yön göstermek içindir; eşleme `backend.md`'nin işidir.

## 1. Giriş ve gezinme
- **Giriş:** kenar menüsü "İçerik" grubundaki "Arşiv" öğesi (`active="archive"`, `00-ortak`) → `/arsiv` (06). Derin bağlantı `/arsiv/:klasorId` doğrudan 07'yi açar.
- **06 → 07:** klasör kartı (E-06-10) → `/arsiv/:klasorId`. "‹N› koordinatörlük daha" (E-06-16) → aynı sayfada kalan kartları açar (Varsayım: yerinde genişletme; ayrı sayfa çizilmemiş).
- **07 içi:** ağaç düzey 0 düğümü (E-06-28) → başka koordinatörlüğe geçiş (`/arsiv/:klasorId`), seçilen düğüm açılır, diğerleri kapanır (örnekte yalnız seçili açık). Birden çok düzey 0 düğüm yalnız yönetici merceğinde vardır; koordinatörde tek düğüm (başlıktaki departman), üyede tek sanal düğüm (`klasorId = "my-tasks"`). Düzey 1 düğümü (E-06-29) ve görev klasörü kartı (E-06-37) → Varsayım: `?gorev=:id` ile dosya ızgarası o göreve süzülür; doğrulanacak (ozellikler §7.11).
- **07 → 06:** kırıntıdaki "Arşiv" (E-06-25) veya tarayıcı geri. Kırıntıdaki program adı → bilinmiyor (Varsayım: ana sayfa; `00-ortak` belirler).
- **07 → görev:** önizlemedeki "Görev" bağlantısı (E-06-52) → görev ayrıntısı (03 ekranı, görev listesi + ayrıntı paneli rotası; K10 kataloğundaki tipli ad).
- **Etiket satırı** (E-06-18) → Varsayım: etikete süzülmüş dosya görünümü (`?etiket=`); hedef çizilmemiş.
- **URL'de taşınan durum (K10 önerisi):** 06: `q`, `tur`, `sirala`. 07: `klasorId` (yol), `gorev`, `etiket`, `gorunum`, `dosya` (önizlenen dosya), `q`. Önizleme seçimi URL'de olursa paylaşılabilir ve geri tuşuyla dönülebilir.
- **Klavye:** "/" arama kutusuna odak (E-06-06 `t-kbd` ipucu); 07'de önceki/sonraki dosya için ok tuşları Varsayım (tasarımda yalnız düğme).

## 2. Kapsam ve rol etkisi (K1, K2)
- Ekran seçili **program** kapsamında çalışır (kırıntıdaki program adı). Kapsam değişince arşiv sorguları iptal edilir, eski veri gösterilmez; 07'de açık klasör yeni kapsamda yoksa 06'ya dönülür (Varsayım; K6 ile uyumlu).
- **Yönetici merceği:** programdaki bütün koordinatörlük klasörleri (çok düğümlü ağaç yalnız burada); "Tümünü indir" (dönem tam ZIP'i) yalnız yöneticidir (`istemci-akislari.md` §3). Pin v0.15/ADR-0030: şirket yöneticisi ekip satırı/atama aranmadan doğru görev kapsamında yükleyebilir; K ve atanmış Ü yetkisi korunur. Yönetici arşivinin doğru dosya/görev departmanını bulma sorunu BE-072 olarak ayrıca açıktır.
- **Koordinatör merceği:** yalnız `X-Nizamio-Department` başlığındaki **tek** departman (sunucu başlık dışı koordinatörlükleri döndürmez; kaynak: modül README RECORDS-K18 + kod `archiveFolders`, openapi yalnız "koordinatörlük başına dosya özeti" der). Birden çok koordinatörlüğü olan hesap departmanı kenar menüsünden değiştirir, klasörler birleştirilmez. Ağaç tek düğümlüdür; yükleme açık (koşulları §4).
- **Üye merceği:** sunucu üyeye **tek sanal klasör** döndürür (`folder_id = "my-tasks"`, `is_virtual = true`; `archiveFolders` özeti, §3). Tasarım üye görünümü çizmemiş. Varsayım: üye 06'da tek kart görür ya da doğrudan 07'ye yönlendirilir — ürün sahibine soru (README).
- **Dosya eylemleri** (indir, yeniden adlandır, sil, yükle) görünürlüğü işlem bazında `istemci-akislari.md` §4 tablosundan, arşiv modülünün tek `capabilities.ts` dosyasında hesaplanır; rol dizesi karşılaştırması yapılmaz. Özellikle: silme yalnız yükleyene açıktır (yükleyen ŞY ekip satırından muaftır; diğer yükleyende ilgili ekip satırı gerekir); yeniden adlandırma yönetici, koordinatör ya da yükleyene (§4 satırları) → önizlenen dosyanın yükleyen kimliği gerekir. "Etiketi değiştir", "Başka klasöre taşı", "yeni etiket oluştur" §4'te yoktur → görünürlük kuralı backend analistine bırakılır.
- Gizleme güvenlik değildir: 403/404 sonrası K6 akışı (me + me/departments geçersizleme). Görünmeyen dosya için sunucu 404 `records.file_not_found` döner (`istemci-akislari.md` §9) → "dosya bulunamadı/erişim yok" tek metin.

## 3. Durum makinesi
| Durum | Ekran | Nerede tutulur | Not |
|---|---|---|---|
| Arama metni (`q`) | 06, 07 | URL | yazarken gecikmeli (debounce) sorgu — Varsayım |
| Dosya türü (`tur`: tümü/görsel/belge/pdf) | 06 | URL | varsayılan "Tümü"; sözleşme `mime_category` kümesi `belge, tablo, gorsel, arsiv, metin` — PDF ayrı kategori değil (`belge` içinde); `tur` değerlerinin sözleşmeye eşlemesi ürün kararı (eksikler yeni-10) |
| Sıralama (`sirala`) | 06 | URL | varsayılan "Son yükleme" |
| Klasör kartı genişletme ("daha") | 06 | bellek | |
| Yeni etiket formu (ad, renk) | 06 | bellek (form) | varsayılan renk bilinmiyor (örnekte "Sarı" seçili) |
| Açık klasör (`klasorId`) | 07 | URL yolu | |
| Ağaçta açık düğümler | 07 | bellek | seçili koordinatörlük her zaman açık |
| Görev klasörü süzgeci (`gorev`) | 07 | URL | Varsayım |
| Etiket süzgeci (`etiket`) | 07 | URL | varsayılan "Tümü" |
| Görünüm (`gorunum`: ızgara/liste) | 07 | URL | varsayılan ızgara; kalıcı hatırlama **yok** (K2 depolama istisnası yalnız kapsam + tema) |
| Seçili dosya (`dosya`) | 07 | URL | ilk girişte ilk dosya seçili (örnekte "1 / ‹N›") — Varsayım |
| Önizleme açık/kapalı | 07 | bellek (veya `dosya` yokluğu) | kapalı hali çizilmemiş |
| Tam ekran önizleme | 07 | bellek | çizilmemiş |

Hiçbir arşiv durumu `localStorage`'a yazılmaz.

## 4. Etkileşim akışları
Tüm yazmalar K5 yazma protokolünden geçer (`shared/http/mutation`: 409 çakışma, 429 `Retry-After`, "sonuç bilinmiyor"). Arşiv yazmalarının hiçbirinde `expected_revision` yoktur; `Idempotency-Key` yalnız yüklemede (`attachFile`) vardır, yeniden adlandırma ve silmede **yoktur** (ayrıntı `backend.md` §2).

### 4.1 İndirme ve ZIP (E-06-04, E-06-34, E-06-56)
1. "Tümünü indir" (06) → dönem tam ZIP'i (yalnız yönetici); "Klasörü ZIP olarak indir" (07) → klasör ZIP'i; "İndir" (önizleme) → tek dosya.
2. İndirmeler **bilet ile** yapılır (`istemci-akislari.md` §3 → backend README §6): istemci önce bilet alır, sonra tarayıcı indirmesini başlatır; belirteç URL'ye/depoya konmaz.
3. Bekleme: düğmede yükleniyor hali (çizilmemiş — Varsayım: düğme devre dışı + döner gösterge).
4. Hata: kota aşımı (kullanıcı başına dışa aktarım kotası) → 429 `Retry-After` metni, otomatik tekrar yok; 403 → K6; 404 → dosya yok bildirimi (yalnız tek dosya hedefinde `records.file_not_found`; ZIP uçlarının sözleşmesinde 404 yok).
5. Seçili dosyaları ZIP (`archiveSelectionZip`, en çok 100) sözleşmede var ama tasarımda çoklu seçim yok → kullanılmaz (backend analisti not etsin).

### 4.2 Yükleme (E-06-05, E-06-35, E-06-62)
1. Tetikleyici "Dosya yükle"/"Yükle" → yükleme penceresi (çizilmemiş).
2. Gerekli girdiler (sözleşmeden bilinen): hedef görev, **etiket (zorunlu)**, dosya(lar). 07'de hedef klasör bağlamdan gelir; görev seçimi Varsayım: `?gorev` varsa ön dolu.
3. Doğrulama: istemci boyut/sayı ön denetimi (sınırlar `backend.md`); sunucu kodları `records.tag_required`, `records.tag_invalid`, `records.too_large`, `records.too_many_files`, `records.name_invalid`, `records.content_rejected`, `records.transfer_active` → alan/üst bildirim.
4. Başarı → klasör özeti, dosya listesi, ağaç sayaçları ve depolama özeti yenilenir; yeni dosya ızgaranın başına gelir ("son eklenen").
5. 403 `records.not_authorized` (ör. yönetici) → düğme zaten gizli olmalı; gelirse K6.
6. 06'dan görevsiz yükleme BE-025'e bağlı; o kapanana dek K13 (statik/devre dışı) — karar `eksikler.md`.

### 4.3 Yeniden adlandırma (E-06-57)
Tetikleyici → ad girişi (çizilmemiş) → boş/uzunluk denetimi → istek (K5; `renameFile` revizyon taşımaz, `Idempotency-Key` yok — son yazan kazanır) → başarı: önizleme adı + ızgara kartı güncellenir → hata: `records.name_invalid`; 409 yalnız ad/taşınma çakışmasıdır: `records.name_taken` (aynı görevde bu ad var → alanda hata) ve `records.moved` (dosya bu arada silindi/taşındı → yeniden oku + bildir); ortak `platform.conflict_retry` tek tekrar. Revizyon çakışması (`*.edit_conflict`) yoktur; K5 "alan alan seçim" uygulanmaz.

### 4.4 Silme (E-06-60)
Tetikleyici → onay diyaloğu (çizilmemiş; Varsayım: ortak onay bileşeni, dosya adı metinde) → istek → başarı: dosya listeden çıkar, önizleme bir sonraki dosyaya geçer (yoksa kapanır), sayaçlar yenilenir. Silme **kalıcıdır**: metadata ve depolama nesnesi birlikte kaldırılır (openapi `deleteFile` özeti, RECORDS-K16); geri alma ve dosya düzeyinde "Silinenler" yoktur (E-06-63; yalnız görev düzeyinde `listDeletedWorkItems`). Onay metni "geri alınamaz" demeli. Silme yalnız yükleyene açıktır; ikinci silme 404 `records.file_not_found` (zaten silinmiş say). `Idempotency-Key` ve revizyon yok.

### 4.5 Etiketi değiştir (E-06-58) ve taşı (E-06-59)
Tetikleyiciler var, pencere yok. Sözleşmede karşılıkları bu tespitte görülmedi (§4 tablosunda yok) → backend analisti doğrular; yoksa K13 devre dışı.

### 4.6 Yeni etiket oluşturma (E-06-19…E-06-21)
Ad + renk → "Oluştur" → etiket listesine eklenir. Backend etiket kümesi kapalı (BE-024) → v1'de form devre dışı/statik (K13); karar `eksikler.md`.

### 4.7 Silinenler / geri yükleme (E-06-63)
Yol haritası F5 kapsamında; tasarımda yok. Akış tanımlanamaz → ürün sahibine soru.

## 5. Liste davranışı
- **Klasör kartları (06):** ilk 12 kart + "‹N› koordinatörlük daha". Toplam sayı (E-06-08) ve kalan (E-06-16) aynı kaynaktan. Sıralama varsayılan "Son yükleme" (en yeni üstte — Varsayım). Boş klasörler soluk ama listede.
- **Ağaç (07):** düzey 0 sunucunun döndürdüğü koordinatörlükler — yönetici: hepsi; koordinatör: yalnız başlıktaki tek departman; üye: tek sanal klasör (sayaç = dosya sayısı), düzey 1 yalnız açık koordinatörlüğün görev klasörleri (sayaç = dosya sayısı). Düzey 1 verisi açılınca yüklenir — Varsayım (tembel yükleme).
- **Görev klasörleri (07):** açık koordinatörlüğün dosyası olan görevleri; sıralama bilinmiyor (örnekte ağaçla aynı sıra).
- **Son eklenen dosyalar (07):** yükleme zamanına göre azalan; etiket süzgeci (ve `gorev`, `q`) uygulanır. Sözleşmede dosya listesi **imleçli**; tasarımda sayfalama/daha fazla yükle yok → Varsayım: ızgara sonunda "daha fazla yükle" (03'teki kalıpla aynı) — doğrulanacak. Sayaç (E-06-38) imleçli listede toplam vermiyorsa klasör özetindeki dosya sayısından gelir (backend analisti).
- **Önizleme sırası "‹i› / ‹N›":** yüklenmiş ve süzülmüş liste üzerinde; sonraki sayfaya geçiş gerekiyorsa önce yükler (Varsayım).
- **Arama:** 06 ve 07 kutusu "tüm arşiv" kapsamlıdır. Sunucu araması olup olmadığı `backend.md`'de; yoksa istemcide yalnız yüklenmiş satırlar (03'teki BE-004 kalıbı).
- **Depolama özeti (06):** toplam bayt + dosya sayısı; en büyük 3 klasör + "Diğer ‹N› klasör". İstemcide klasör özetlerinden türetilebilir (Varsayım; özet uçta boyut alanı yoksa BE-025).
- **Göreli zaman** "‹N› gün": son yükleme zamanından bugüne gün farkı; kaynak alan yoksa BE-025.

## 6. Boş / yükleniyor / hata durumları
Tasarımda yalnız **boş klasör kartı** (E-06-15: soluk, "Henüz dosya yok", "0 B", "—") var. Diğerleri: tasarımda yok — K7 varsayılanı.
- Yükleniyor: klasör ızgarası, ağaç, dosya ızgarası ve önizleme için iskelet (tasarımda yok).
- Boş arşiv (hiç dosya yok): tasarımda yok — Varsayım: klasör kartları boş halleriyle + depolama "0 B · 0 dosya".
- Boş klasör (07, hiç dosya yok): tasarımda yok — görev klasörleri ve dosya ızgarası yerine boş metin; önizleme gizli.
- Süzgeç/arama sonuçsuz: tasarımda yok.
- Önizlenemeyen dosya (DOC/PDF, küçük resim yok): tasarımda yok — tür rozeti + tarama deseni (BE-026).
- K7: "program yok", "departman ataması bekleniyor" (`membership_required`), "programa departman katılmamış" — kabuk düzeyinde (`00-ortak`).
- Hata: liste yüklenemedi → bölüm içinde tekrar dene; 403/404 → K6; 429 → `Retry-After` metni.

## 7. Öğe → davranış tablosu
| Kimlik | Öğe | Olay | Davranış | Bağ (mekanizma §, backend.md satırı) |
|---|---|---|---|---|
| E-06-01 | Kırıntı (06) | tıklama (program) | bilinmiyor (kabuk) | §1, `00-ortak` |
| E-06-02/03 | Başlık, alt başlık | — | statik metin | — |
| E-06-04 | Tümünü indir | tıklama | dönem tam ZIP (bilet); yalnız yönetici görür | §4.1, §2 |
| E-06-05 | Dosya yükle | tıklama | yükleme penceresi; yönetici merceğinde gizli | §4.2, §2 |
| E-06-06 | Arama (06) | yazma, "/" | `q` URL'ye; sonuç görünümü belirsiz | §5, §1 |
| E-06-07 | Tür segmenti | tıklama | `tur` URL'ye; neyi süzdüğü belirsiz; sözleşmede PDF kategorisi yok (`belge` içinde) | §3, ozellikler §7.3 |
| E-06-08 | Bölüm sayacı | yükleme | klasör toplamı | §5 |
| E-06-09 | Sırala | tıklama | menü (çizilmemiş); `sirala` URL'ye | §3 |
| E-06-10 | Klasör kartı | tıklama | `/arsiv/:klasorId` | §1 |
| E-06-11 | "grup" rozeti | — | koşullu gösterim; kaynak bilinmiyor | ozellikler §7.8 |
| E-06-12/13/14 | Kart meta, boyut, son yükleme | yükleme | klasör özetinden; göreli gün hesabı | §5 |
| E-06-15 | Boş klasör | — | soluk kart | §6 |
| E-06-16 | "‹N› koordinatörlük daha" | tıklama | kalan kartları göster | §5 |
| E-06-17 | Etiketler başlığı | — | statik | — |
| E-06-18 | Etiket satırı | tıklama | Varsayım: etikete süzülmüş görünüm | §1 |
| E-06-19/20/21 | Yeni etiket formu | gönderme | etiket oluştur; kapalı küme → K13 | §4.6 |
| E-06-22/23/24 | Depolama özeti | yükleme | toplam, çubuk, ilk 3 + diğer | §5 |
| E-06-25 | Kırıntı (07) | tıklama "Arşiv" | `/arsiv` | §1 |
| E-06-26 | Üst çubuk araması | yazma | tüm arşiv araması (`q`) | §5 |
| E-06-27 | Ağaç paneli | — | koordinatörlük listesi | §5 |
| E-06-28 | Düzey 0 düğüm | tıklama | klasöre geç, düğümü aç; çok düğüm yalnız yönetici, koordinatör/üye tek düğüm | §1, §2 |
| E-06-29 | Düzey 1 düğüm | tıklama | Varsayım: `?gorev=` süzgeci | §1 |
| E-06-30 | Seçili düğüm | — | `aria-current` | §3 |
| E-06-31/32/33 | Klasör başlığı, rozet, meta | yükleme | klasör özetinden | §5 |
| E-06-34 | ZIP indir | tıklama | klasör ZIP (bilet, kota) | §4.1 |
| E-06-35 | Yükle (07) | tıklama | yükleme penceresi, hedef klasör bağlamdan | §4.2 |
| E-06-36 | Görev klasörleri başlığı | — | statik | — |
| E-06-37 | Görev klasörü kartı | tıklama | Varsayım: `?gorev=` süzgeci | §1 |
| E-06-38 | Son eklenen başlık + sayaç | yükleme | dosya sayısı | §5 |
| E-06-39 | Etiket segmenti | tıklama | `etiket` URL'ye, liste süzülür | §3, §5 |
| E-06-40 | Görünüm segmenti | tıklama | `gorunum` URL'ye; liste görünümü çizilmemiş | §3 |
| E-06-41 | Dosya kartı | tıklama | seçili dosya → önizleme (`dosya` URL'ye) | §3 |
| E-06-42/43/44 | Tür rozeti, etiket noktası, alt görev | yükleme | dosya alanlarından | §5 |
| E-06-45 | Seçili dosya | — | halka + `aria-pressed` | §3 |
| E-06-46 | Önizleme sırası | yükleme | süzülmüş listedeki konum | §5 |
| E-06-47 | Önceki/sonraki | tıklama | komşu dosyayı seç | §3, §5 |
| E-06-48 | Kapat | tıklama | önizlemeyi kapat (`dosya` kaldır) | §3 |
| E-06-49/50 | Önizleme alanı, tam ekran | yükleme / tıklama | içerik gösterimi (BE-026); tam ekran çizilmemiş | §6 |
| E-06-51 | Ad + tür·boyut | yükleme | dosya alanlarından | — |
| E-06-52 | Görev bağlantısı | tıklama | görev ayrıntısına git (03) | §1 |
| E-06-53/54/55 | Etiket, yükleyen, tarih | yükleme | dosya alanlarından; tarih yerel saatle | — |
| E-06-56 | İndir | tıklama | tek dosya indirme (bilet) | §4.1 |
| E-06-57 | Yeniden adlandır | tıklama | §4 görünürlüğü; adlandırma akışı; revizyon/Idempotency-Key yok, 409 yalnız `records.name_taken`/`records.moved` | §4.3, §2 |
| E-06-58 | Etiketi değiştir | tıklama | karşılık bilinmiyor | §4.5 |
| E-06-59 | Başka klasöre taşı | tıklama | karşılık bilinmiyor | §4.5 |
| E-06-60 | Dosyayı sil | tıklama | §4 görünürlüğü (yalnız yükleyen); onay ("geri alınamaz") → kalıcı sil | §4.4, §2 |
| E-06-61 | Liste görünümü | — | çizilmemiş | §3 |
| E-06-62 | Yükleme penceresi | — | çizilmemiş | §4.2 |
| E-06-63 | Silinenler/geri yükleme | — | çizilmemiş | §4.7 |
| E-06-64 | Onay/adlandırma/etiket/taşıma pencereleri | — | çizilmemiş | §4.3–§4.5 |

## 8. Bağımlılıklar
- `00-ortak`: kenar menüsü ("Arşiv" öğesi), üst çubuk (geri/ileri, kırıntı bileşeni, tema, bildirim), Kenar-Secici kapsamı (program/rol/koordinatörlük), K7 açık durum ekranları, ortak onay diyaloğu.
- `shared/ui`: `rp-seg` segment, `rp-folder` kart, `rp-sheet` panel, `rp-dl`, `rp-bar`, `rp-menuitem`, `t-input`/`t-btn`/`t-iconbtn`, `t-kbd`, `t-hatch`.
- `shared/http/mutation` (K5) ve indirme bileti yardımcısı (bilet → tarayıcı indirmesi; 03 görev ayrıntısındaki dosya indirme ile ortak olmalı).
- `03-gorevler-liste`: görev ayrıntısı hedefi (E-06-52); görev dosyaları (`listWorkItemFiles`) ile aynı dosya varlığı — yükleme/adlandırma/silme sonrası görev ayrıntısı sorguları da geçersizlenmeli.
- `10-mesajlar`: "görev arşivine kaydet" (BE-029) bu arşive yazar.
- Paylaşılan durum: seçili program (kırıntı + sorgu kapsamı), tema.
