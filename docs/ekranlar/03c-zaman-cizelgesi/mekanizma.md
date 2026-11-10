# 03c — Mekanizma (nasıl davranıyor)

Öğe kimlikleri `ozellikler.md` ile aynıdır (`E-03C-NN`). Uç adları yalnız yol haritası ve `istemci-akislari.md`'de geçtiği kadarıyla anılır; eşleme `backend.md`'nin işidir.

## 1. Giriş ve gezinme

- **Giriş:** Görevler başlığındaki görünüm segmenti (E-03C-03, "Zaman çizelgesi") listeden (03, `/gorevler`) buraya geçirir; kenar menüsünde ayrı "Zaman çizelgesi" öğesi yok (kenar menüsü "Görevler" etkin kalır, `active="tasks"`). Derin bağlantı K10 rotası `/zaman-cizelgesi` (**Varsayım:** rota adı bu biçimde kalır (doğrulanacak: K10 `routes.catalog.ts`, ürün sahibi sorusu)).
- **Çıkış:**
  - Segment "Liste" → `/gorevler`; süzgeçlerin iki görünüm arasında taşınması bilinmiyor (**Varsayım:** departman ve durum taşınır, ölçek taşınmaz (doğrulanacak: ürün sahibi sorusu; 03 grubunun `mekanizma.md` §3'üyle uyum)).
  - Kırıntı "Görevler" → `/gorevler`.
  - Satır başlığı (E-03C-32) → **Varsayım:** satırı seçer ve paneli açar; bağlantı biçimi yeni sekmede açılabilirlik için `href` ayrıntı rotası taşır (doğrulanacak: tasarım tuvali — bağlantı hedefi çizilmemiş; ürün sahibi sorusu).
  - Paneldeki "Liste görünümünde aç" (E-03C-56) → `/gorevler` + seçili görev ayrıntı paneli açık (**Varsayım:** `?secili=<id>` parametresiyle (doğrulanacak: K10 `routes.catalog.ts`, 03 grubunun rota parametreleri)).
  - "Yeni görev" (E-03C-04) → 03 grubunun oluşturma formu; oluşturma sonrası Gantt sorgusu tazelenir.
- **URL'de taşınan durum:** **Varsayım:** `durum`, `departman`, `olcek`, `secili`, `altgorev` URL'de taşınır; görünen tarih aralığı/kaydırma konumu taşınmaz, açılışta bugün ortalanır (doğrulanacak: K10 `routes.catalog.ts`, ürün sahibi sorusu).

## 2. Kapsam ve rol etkisi (K1, K2, K4)

**Yüz seçimi (K4):** görünür seçici yoktur. Yüz kenar menüsündeki kapsam merceğinden türetilir: Admin merceği → `adminGantt` (departmansız program kapsamı); Koordinatör merceği → `coordinatorGantt` (seçili departman); Üye merceği → `memberGantt` (seçili departmandaki atandığı görevler); birleşik rolde koordinatör yüzü. Rol dizesi karşılaştırması yapılmaz; mercek K2 kapsam durumundan, eylemler `istemci-akislari.md` §4'ten modülün `capabilities.ts` dosyasında hesaplanır.

**Tasarımda yüz ayrımı yok** — tek çizim vardır ve koordinatör izlenimlidir (panelde "Tarih talebi gönder", "Değişiklik onaya gider"). Aşağıdaki ayrım tasarımdan değil kararlardan çıkarılmıştır; her satır doğrulanmalıdır:

| Öğe | Admin yüzü | Koordinatör yüzü | Üye yüzü |
|---|---|---|---|
| Koordinatörlük süzgeci (E-03C-05) | **Varsayım:** programın departmanları; tek uç, istemcide süzme (K3 fan-out yasağı) (doğrulanacak: openapi `GanttTask.department_id`, ürün sahibi sorusu) | **Varsayım:** gizli ya da tek seçenek — uç tek departman döndürür (GAP-053 notu: çoklu koordinatörlük seçimi yok); departman değişimi kenar menüsünden (doğrulanacak: ürün sahibi sorusu) | **Varsayım:** gizli (doğrulanacak: ürün sahibi sorusu) |
| Gruplama (E-03C-28) | Departmana göre çok grup | Tek grup (**Varsayım:** grup başlığı gizlenir ya da tek grup açık (doğrulanacak: tasarım tuvali — yalnız çok gruplu hal çizili; ürün sahibi sorusu)) | **Varsayım:** tek grup ya da grupsuz (doğrulanacak: ürün sahibi sorusu) |
| Durum süzgeci "Geciken" (E-03C-06) | `adminGantt?overdue=true` var ama kullanılmaz: yalnız bitiş gününe bakar, tamamlanmış geç görevi de döndürür (GAP-053); istemcide `lateness.is_overdue` ile süzülür | istemcide (`lateness.is_overdue`) | istemcide (`lateness.is_overdue`) |
| Çubuk sürükleme, panel tarih girdileri (E-03C-47, 58, 59) | Görünürlük §4 "Görev … düzenle, süre uzat" satırı: doğrudan `updateWorkItem` / `extendWorkItem` | aynı satır (yalnız kendi departmanı): koordinatör de doğrudan değiştirebilir (§4 satır 1, §6 madde 4) — talep zorunlu değildir | §4'e göre yok → tutamaç çizilmez, girdiler salt okunur (**Varsayım:** gizleme/salt okunur biçimi (doğrulanacak: `istemci-akislari.md` §4 satır 1, tasarım tuvali — üye yüzü çizilmemiş)) |
| "Tarih talebi gönder" (E-03C-64) | §4: talep açma yönetici sütununda yok → gizli; yerine ne konacağı tasarımda yok (**Varsayım:** "Kaydet" doğrudan değişiklik; bekleyen talep varsa incele/onayla/reddet (doğrulanacak: `istemci-akislari.md` §6, ürün sahibi sorusu)) | §4/§6: görünür (talep zorunlu yol değil, doğrudan değişiklik de yetkili — ürün kararı, `eksikler.md` §4); görevde bekleyen talep varsa gizli (`istemci-akislari.md` §6, GAP-204 durumu) | gizli |
| Tarih talebi uzantısı (E-03C-42) | görünür (§6: yönetici her görevde görür) | yalnız koordinatörü olduğu departman görevlerinde | hiç görünmez (§6) |

Kaynak notu (E-03C-42): `pending_date_request` Gantt satırında **yoktur** (`GanttTask` taşımaz); yalnız seçili görevin `getWorkItem` okumasından gelir. Satır başına uzantı çizimi veri gelene dek yapılamaz (`eksikler.md` yeni-1); görünürlük kuralı yukarıdaki gibi `getWorkItem` cevabına uygulanır.

| Bağımlılık simgesi/okları (E-03C-37) | görünür; departmanlar arası ok yalnız bu yüzde (`cross_department`) | görünür; yalnız kendi departmanı içi bağlar (başka departmana giden bağ hiç gelmez, WORK-K36) | `istemci-akislari.md` §3: `listDependencies` üyeye kapalı, ama `memberGantt.links` kendi görevleri arasında **dolu** gelir (WORK-K36, `gantt.go`); üye yüzünde simge/ok gösterilsin mi ürün kararı (`eksikler.md` §4) |
| "Atanana hatırlat", "Diğer işlemler" (E-03C-65, 66) | bilinmiyor | bilinmiyor | **Varsayım:** gizli (doğrulanacak: ürün sahibi sorusu) |
| "Yeni görev" (E-03C-04) | §4 "Görev aç" | §4 "Görev aç" | gizli |
| Alt görev satırları (E-03C-33…53) | statik (ADR-0024, BE-020); açma her yüzde aynı | aynı | aynı |

**Kapsam değişimi (K2, K6):** kenar menüsünde program/mercek/departman değişince eski Gantt sorgusu iptal edilir, veri görünmez olur, seçili görev ve panel kapanır, açık alt görev satırları sıfırlanır; ölçek korunur (**Varsayım:** ölçek kapsamdan bağımsızdır (doğrulanacak: ürün sahibi sorusu)). K6 listesindeki 403 `organization.not_authorized` / `membership_required` ya da 404 `work.program_scope_invalid` K6 akışına gider. Gantt uçlarının kendi 403'ü `work.not_authorized`'dır (yüz uyuşmazlığı: koordinatör olmayan `coordinatorGantt` çağırırsa, yönetici olmayan `adminGantt` çağırırsa; başka programdaki ekip satırı `memberGantt`'a yetmez, WORK-K69); bu kodun K6 listesinde olmadığı `dogrulama.md`'de not edilmiştir.

## 3. Durum makinesi

| Durum | Değerler | Nerede tutulur |
|---|---|---|
| Yüz | `admin | koordinator | uye` | Türetilmiş (K2 kapsam durumu); saklanmaz |
| Durum süzgeci | `tumu` (varsayılan) `acik` `geciken` `biten` | **Varsayım:** URL (doğrulanacak: K10 `routes.catalog.ts`) |
| Koordinatörlük süzgeci | departman kimlikleri kümesi; boş = tümü | **Varsayım:** URL (doğrulanacak: K10 `routes.catalog.ts`); yalnız admin yüzünde anlamlı |
| Ölçek | `gun | hafta` (varsayılan, 03c); **Varsayım:** `ay` seviyesi de var (doğrulanacak: tasarım tuvali — yalnız hafta ve gün çizili) | **Varsayım:** URL (doğrulanacak: K10 `routes.catalog.ts`); K2 depolama istisnası ölçeği kapsamaz → hatırlanmaz |
| Görünen aralık / yatay kaydırma | başlangıç günü | bellek |
| Grup açık/kapalı | departman kimliği → bool; **Varsayım:** varsayılan hepsi açık (doğrulanacak: tasarım tuvali — örnekte ilk açık, diğerleri kapalı; ürün sahibi sorusu) | bellek |
| Alt görev gösterimi | `kapali` (varsayılan) `| tumu` + görev başına açık küme | **Varsayım:** segment URL'de (doğrulanacak: K10 `routes.catalog.ts`); tekil açılış bellekte |
| Yalnız kodlar | bool, varsayılan kapalı | bellek |
| Seçili görev | görev kimliği ya da yok | **Varsayım:** URL `secili` (doğrulanacak: K10 `routes.catalog.ts`) |
| Sürükleme | `bos → surukleniyor(uç, gün farkı) → onay/gönderim → bildirim(5 sn) → bos` | bellek |
| Panel düzenleme taslağı | başlangıç/bitiş metni, doğrulama hatası | bellek; "sonuç bilinmiyor"da korunur (K5) |
| Tam ekran | bool | bellek (**Varsayım:** Fullscreen API (doğrulanacak: tasarım tuvali — çıkış hali çizilmemiş)) |

Geçişler: süzgeç ya da ölçek değişince seçim korunur, seçili görev süzgeç dışına düşerse panel kapanır (**Varsayım:** (doğrulanacak: ürün sahibi sorusu)). "Tümünü aç" tüm görevleri açık kümeye alır; **Varsayım:** tekil kapatma segmenti "Kapalı"ya döndürmez (doğrulanacak: tasarım tuvali — segment karma hali çizilmemiş).

## 4. Etkileşim akışları

### 4.1 Ölçek ve gezinme
Yakınlaştır/Uzaklaştır (E-03C-08/09) ölçeği gün ↔ hafta ↔ ay arasında değiştirir (**Varsayım:** üç seviye (doğrulanacak: tasarım tuvali — yalnız hafta ve gün çizili; ürün sahibi sorusu)). Ölçek değişince başlık satırları (E-03C-23/24/25), ızgara (E-03C-26) ve süre birimi (E-03C-39) yeniden çizilir, bugün ya da seçili görev görünür alanda kalır (**Varsayım:** (doğrulanacak: tasarım tuvali, ürün sahibi sorusu)). Yatay kaydırma sezon şeridindeki "Baktığın yer" (E-03C-18) ve çerçeveyi (E-03C-16) günceller. Şeride tıklayıp/sürükleyip gezinme bilinmiyor (`ozellikler.md` §7-5).

### 4.2 Satır seçme ve panel
Çubuğa (**Varsayım:** satıra da (doğrulanacak: tasarım tuvali — yalnız açık panel çizili)) tıklama → satır seçilir (E-03C-35 arka plan, E-03C-47 halka + tutamaç) → panel (E-03C-54…66) seçili görevin değerleriyle dolar. Durum ve gecikme günü panelde Gantt satırından (`status`, `lateness`); görev kodu, departman adı, atanan adları, bekleyen talep, alt görev sayacı ve tarih sürümü Gantt satırında **yoktur** (`GanttTask` dar şemadır, `backend.md` Ana bulgular) — panel bunları seçili görev için `getWorkItem` + departman listesinden doldurur; "Kanıt dosyası N dosya" yalnız ayrıntıda dosya listesinden sayılabilir (`istemci-akislari.md` §7). Panel açıldığında tek görev için ek okuma gerekir (**Varsayım:** kısa yükleniyor hali (doğrulanacak: tasarım tuvali — panel yükleniyor hali çizilmemiş); `backend.md` eşlemeyi verir). ✕ paneli kapatır, seçim kalkar.

### 4.3 Tarih değiştirme — panel girdileri
1. Kullanıcı `gg.aa.yyyy` biçiminde başlangıç/bitiş girer. İstemci doğrulaması: geçerli tarih, başlangıç ≤ bitiş (**Varsayım:** (doğrulanacak: openapi `updateWorkItem`/`requestDateChange` gövde kuralları, `backend.md`)).
2. Gecikmedeki görevde bitiş girdisi kırmızı kenarlıdır (E-03C-59); bu bir doğrulama hatası değil durum göstergesidir.
3. "Tarih talebi gönder" (E-03C-64) → `istemci-akislari.md` §6 akışı: koordinatör talep açar; görev başına tek bekleyen talep (409 `work.date_request_pending_exists`). Gönderim: `requestDateChange` ne `Idempotency-Key` ne sürüm alır (K5'in bu uçta karşılığı yok); sonuç bilinmiyorsa kör tekrar yapılmaz, görev yeniden okunur, taslak korunur (`backend.md` §2, `eksikler.md` yeni-7).
4. Başarı → seçili görev (`getWorkItem`) ve Gantt yeniden okunur (talep uçları görev taşımaz, §6/§8); bekleyen talep uzantısı (E-03C-42) yalnız seçili görev için `getWorkItem.pending_date_request`'ten çizilir (Gantt satırı taşımaz); "Tarih talebi gönder" bekleyen talep varken gizlenir.
5. Admin yüzünde talep yerine doğrudan değişiklik (§6 madde 4) — buton metni/akışı tasarımda yok. Koordinatör için de doğrudan `updateWorkItem` yolu sözleşmede açıktır; "Değişiklik onaya gider" metni zorunluluğu değil ürün tercihini anlatır (ürün sahibi kararı, `eksikler.md` §4).

### 4.4 Tarih değiştirme — çubuk sürükleme
1. Yalnız seçili çubukta iki tutamaç görünür (E-03C-47); başlangıç ya da **planlanan** bitiş ucu sürüklenir. Çubuğun tamamını kaydırma tasarımda yok (**Varsayım:** v1'de olmayacak (doğrulanacak: ürün sahibi sorusu)).
2. **Varsayım:** sürükleme gün birimine yapışır, hafta ölçeğinde de gün (doğrulanacak: tasarım tuvali, ürün sahibi sorusu). Sürükleme sırasında önizleme ve tarih ipucu tasarımda yok.
3. Bırakınca tasarım iki şey gösterir (çelişki, `ozellikler.md` §7-1/§7-2): panel "Değişiklik onaya gider" (→ 4.3 talep akışı) ve bildirim "`<KOD>` süresi N gün uzatıldı · eski → yeni · bitiş +N gün · İptal et" (doğrudan uzatma). Uzatma ucu bitişi gün sayısı kadar öteler ve bağımlılara yayar; yalnız bitiş ileri ve 1–90 gün için uygundur. Başlangıç değişimi ya da kısaltma için uygun yol doğrudan `updateWorkItem`'dır (`expected_dates_revision` zorunlu, `backend.md` §2). Koordinatör sürüklemesinin talep mi doğrudan mı olacağı ürün kararıdır; sözleşme ikisine de izin verir.
4. Bildirim 5 sn kalır (E-03C-72); "İptal et" ile geri alma yolu bilinmiyor. Seçenek — **Varsayım:** (doğrulanacak: ürün sahibi sorusu, `dogrulama.md` koordinatör kararı 2): istek bildirim süresi bitene kadar istemcide bekletilir, "İptal et" isteği hiç göndermez; sayfa/kapsam değişirse bekleyen istek gönderilir ya da atılır (karar gerekir).
5. Hata: 409 `work.edit_conflict` (yalnız `updateWorkItem`) → K5 alan alan seçim; 409 `work.item_completed` / `work.stale_completion` / `platform.conflict_retry` → görev yeniden okunur; 422 → tutamaç eski yerine döner, hata iletisi. Bağımlı kayması için onay diyaloğu **yoktur**: 409 `organization.confirmation_required` hiçbir tarih ucunda dönmez (yalnız organization üyelik/koordinatör uçlarında); zincir kayması sessizdir, sonradan `ExtendResult.cascade_count` / `ReviewResult.affected_tasks_count` olarak bildirilir (bildirimde "N bağımlı görev de kaydı" satırı tasarımda yok, eklenip eklenmeyeceği ürün kararı).
6. Üye yüzünde tutamaç yok.

### 4.5 Gruplar ve alt görevler
- Grup başlığına tıklama (E-03C-28) açar/kapatır; kapalı grupta görev satırları gizlenir.
- 03d kuralları (tasarım notu, birebir davranış):
  1. **Varsayılan kapalı:** her görev tek satır; alt görevler çubuk dibindeki ilerleme çizgisi (E-03C-44) ve tarihli alt görev elmasları (E-03C-45) ile okunur, satır eklemez.
  2. **Görev görev ya da hepsi:** satırdaki `b/t` düğmesi (E-03C-33) yalnız o görevi, "Tümünü aç" (E-03C-13) hepsini açar; açık satırlar ince (30 px) ve girintilidir.
  3. **Tarih isteğe bağlı:** tarihli alt görev ince çubukla (E-03C-51), tarihsiz "Tarih yok · ana görev süresince" (E-03C-53) ile görünür.
  4. **Ana görevin dışına taşmaz:** alt görev tarihi ana görev aralığında seçilir; taşacaksa önce ana görev için tarih talebi istenir.
- Kapalı çubuğun üzerine gelince ipucu (E-03C-73) alt görev listesini gösterir; tıklama satırı açar.
- **ADR-0024 / BE-020:** alt görev Gantt dışıdır; Gantt yanıtında alt görev yoktur, alt görev tarih sınırı doğrulaması yoktur. v1'de alt görev satırları/çubukları/elmaslar **statik** (`designStub('BE-020', …)`), sürükleme kapalı. İlerleme çizgisi ve `b/t` sayacı için veri kaynağı `backend.md`'de belirlenir.

### 4.6 Diğer eylemler
- **Atanana hatırlat (E-03C-65):** davranış ve uç bilinmiyor.
- **PDF / görsel indir (E-03C-10/11):** çıktı kapsamı (görünen aralık mı tümü mü) bilinmiyor; **Varsayım:** istemcide görünür alanın dışa aktarımı (doğrulanacak: ürün sahibi sorusu).
- **Tam ekran (E-03C-12):** **Varsayım:** Gantt kabını tam ekrana alır (doğrulanacak: tasarım tuvali).
- **Yalnız kodları göster (E-03C-22):** **Varsayım:** sol sütunu daraltır (doğrulanacak: tasarım tuvali — açık hali çizilmemiş).
- **Bağımlılık ekleme/kaldırma:** F3 kapsamında (§4 F3 satırı) ama tasarımda arayüzü yok.

## 5. Liste davranışı

- **Sayfalama yok.** Üç yüz de ilk 200 kalemi döndürür, imleç yoktur; kesilme sunucu başlığıyla bildirilir: `X-Result-Truncated: true` (BE-019, pin v0.15.0-api) → tavan uyarısı (E-03C-82). Tam 200 kalem başlıksızsa kesilme YOKTUR, uyarı çıkmaz (kalem sayısından çıkarım yapılmaz).
- **Sıralama:** tasarım grupta görev kodu sırası izlenimi veriyor (örnekte sıra kod numarasına göre); kesin kural bilinmiyor. **Varsayım:** grup içinde başlangıç günü, eşitlikte kod (doğrulanacak: ürün sahibi sorusu; openapi Gantt yanıt sırası).
- **Süzme istemcide** (`adminGantt?overdue=true` kullanılmaz: tamamlanmış geç görevi de döndürür, GAP-053; "Geciken" = `lateness.is_overdue`, `backend.md` §4). Süzme 200 kalemlik kümenin içinde yapılır; tavan uyarısı süzgeçten bağımsız ham yanıt sayısına bakar.
- **Sayaçlar:** alt satır (E-03C-02), grup sayaçları (E-03C-28), sezon histogramı (E-03C-15) yüklenmiş kalemden istemcide hesaplanır (**Varsayım:** (doğrulanacak: openapi `Gantt.tasks`, ürün sahibi sorusu — 200 tavanında doğru sayı kaynağı)). 200 tavanında eksik sayım riski vardır (`ozellikler.md` §7-9).
- **Arama:** tasarımda yok.
- **Boyut:** 200+ satır + açılmış alt görev satırları — satır sanallaştırma gerekir (§8 pilot listesi).

## 6. Boş / yükleniyor / hata durumları

Tasarımda hiçbiri yok — K7 varsayılanı:
- **Yükleniyor:** iskelet satırlar (**Varsayım:** 03 listesindekiyle aynı bileşen (doğrulanacak: `00-ortak`/`03-gorevler-liste` `mekanizma.md` §6)); başlık ve araç çubuğu görünür.
- **Boş (hiç görev yok):** tasarımda yok — K7 varsayılanı; admin/koordinatör için "Yeni görev" çağrısı.
- **Süzgeç sonucu boş:** tasarımda yok — **Varsayım:** süzgeci temizle çağrısı (doğrulanacak: ürün sahibi sorusu).
- **Tarihi olmayan görev:** Gantt'ta çizilemez; tasarımda yok. GAP-053: tarihi okunamayan kalem yanıttan düşer — istemci bilemez. Alan kuralı: `GanttTask.planned_end_on` ve `completed_on` "yok" iken **boş dizge** gelir (null değil; backend `work/usecase/gantt.go`); `start_on`/`end_on` her zaman dolu `YYYY-MM-DD` dizgesidir. İstemci boş dizgeyi "yok" sayar.
- **Program yok / `membership_required` / programa departman katılmamış:** K7 açık durum ekranları (`00-ortak`).
- **Hata:** K6 yetki kaybı akışı; diğer hatalar ortak hata durumu.
- **Tavan:** E-03C-82.
- **Kısmi veri:** GAP-053'e göre atama ya da bağımlılık okuması başarısız olursa ilgili bölüm sessizce boş gelir — istemci ayırt edemez; not düşülür, gösterim yok.

## 7. Öğe → davranış tablosu

| Kimlik | Öğe | Olay | Davranış | Bağ (mekanizma §, backend.md satırı) |
|---|---|---|---|---|
| E-03C-01 | Kırıntı | tıklama | "Görevler" → `/gorevler`; program → bilinmiyor | §1; `00-ortak` |
| E-03C-02 | Başlık sayaçları | yükleme | yüklü kalemlerden hesap | §5 |
| E-03C-03 | Görünüm segmenti | tıklama | `/gorevler` ↔ `/zaman-cizelgesi` | §1 |
| E-03C-04 | Yeni görev | tıklama | 03 oluşturma formu; sonra tazele | §1, §2 |
| E-03C-05 | Koordinatörlük süzgeci | seçim | istemcide departman süzme (admin) | §2, §5 |
| E-03C-06 | Durum süzgeci | tıklama | istemcide durum/gecikme süzme | §3, §5 |
| E-03C-07 | Ölçek etiketi | ölçek değişimi | metni günceller | §4.1 |
| E-03C-08 | Uzaklaştır | tıklama | ölçeği bir üst seviyeye | §4.1 |
| E-03C-09 | Yakınlaştır | tıklama | ölçeği bir alt seviyeye | §4.1 |
| E-03C-10 | PDF | tıklama | dışa aktarım (bilinmiyor) | §4.6 |
| E-03C-11 | Görsel indir | tıklama | dışa aktarım (bilinmiyor) | §4.6 |
| E-03C-12 | Tam ekran | tıklama | Gantt kabı tam ekran | §4.6 |
| E-03C-13 | Alt görev gösterimi | tıklama | hepsini aç/kapat (statik veri) | §4.5; BE-020 |
| E-03C-14 | Sezon şeridi | yükleme | sezon aralığını çizer | §4.1 |
| E-03C-15 | Yoğunluk histogramı | yükleme | haftalık görev sayısı | §5 |
| E-03C-16 | Görünen aralık çerçevesi | kaydırma/ölçek | konum/genişlik güncellenir | §4.1 |
| E-03C-17 | Bugün işareti (şerit) | yükleme | bugün konumu | §4.1 |
| E-03C-18 | Baktığın yer | kaydırma | konum güncellenir | §4.1 |
| E-03C-19 | 03c açıklaması | — | statik | — |
| E-03C-20 | 03d açıklaması | — | statik | — |
| E-03C-21 | Sol sütun başlığı | — | statik | — |
| E-03C-22 | Yalnız kodlar | tıklama | sol sütunu daraltır | §4.6 |
| E-03C-23 | Ay satırı | ölçek/kaydırma | yeniden çizim | §4.1 |
| E-03C-24 | Hafta satırı | ölçek/kaydırma | yeniden çizim; bugünün haftası vurgulu | §4.1 |
| E-03C-25 | Gün ölçeği başlığı | ölçek = gün | yeniden çizim; hafta sonu gölgesi | §4.1 |
| E-03C-26 | Izgara | ölçek | yeniden çizim | §4.1 |
| E-03C-27 | Bugün çizgisi | yükleme | bugün konumu | §4.1 |
| E-03C-28 | Grup başlığı | tıklama | aç/kapat | §4.5 |
| E-03C-29 | Grup izi | — | boş (özet çubuk belirsiz) | `ozellikler.md` §7-3 |
| E-03C-30 | Görev kodu | — | gösterim; Gantt yanıtında kod yok (BE-005) → şimdilik departman kodu (yüze göre yoksa `—`) + `—` sıra | `ozellikler.md` §7-15; `backend.md` §1 |
| E-03C-31 | Durum noktası | hover | `title` ipucu | — |
| E-03C-32 | Görev başlığı | tıklama | seç + panel (**Varsayım:** (doğrulanacak: tasarım tuvali)) | §4.2 |
| E-03C-33 | Alt görev düğmesi | tıklama | o görevi aç/kapat | §4.5; BE-020 |
| E-03C-34 | Satır alt yazısı | — | gösterim | — |
| E-03C-35 | Satır arka planı | hover/seçim | renk | §4.2 |
| E-03C-36 | Görev çubuğu | tıklama | seç + panel | §4.2 |
| E-03C-37 | Bağımlılık simgesi | — | gösterim (`links`; üye yüzünde dolu gelir, gösterim ürün kararı) | §2, §4.6 |
| E-03C-38 | Çubuk metni | — | gösterim | — |
| E-03C-39 | Süre | ölçek | birim | §4.1 |
| E-03C-40 | Taşma bölümü | yükleme | gecikme/geç bitiş hesabı | — |
| E-03C-41 | Gecikme işareti | yükleme | gecikme hesabı | `ozellikler.md` §7-7 |
| E-03C-42 | Tarih talebi uzantısı | yükleme | yalnız seçili görevde (`getWorkItem.pending_date_request`) çizilir (yüze göre); Gantt satırında veri yok | §2, §4.3 |
| E-03C-43 | Kırpılmış çubuk | kaydırma | görünen aralık öncesi başlangıç | §4.1 |
| E-03C-44 | İlerleme çizgisi | yükleme | alt görev oranı | §4.5; BE-020 |
| E-03C-45 | Alt görev elması | hover | `title` | §4.5; BE-020 |
| E-03C-46 | Alt görev çipi | — | gösterim | §4.5 |
| E-03C-47 | Sürükleme tutamaçları | sürükle-bırak | tarih değişikliği | §4.4 |
| E-03C-48 | Ağaç çizgisi | — | dekor | §4.5 |
| E-03C-49 | Alt görev durumu | — | gösterim (değiştirme 03 kartında) | §4.5; BE-020 |
| E-03C-50 | Alt görev başlığı | — | gösterim | §4.5 |
| E-03C-51 | İnce alt görev çubuğu | — | statik, sürükleme yok | §4.5; BE-020 |
| E-03C-52 | Alt görev tarih yazısı | — | gösterim | §4.5 |
| E-03C-53 | Tarihsiz alt görev | — | gösterim | §4.5 |
| E-03C-54 | Panel üst satırı | — | gösterim | §4.2 |
| E-03C-55 | Panel başlığı | — | gösterim | §4.2 |
| E-03C-56 | Liste görünümünde aç | tıklama | `/gorevler` + ayrıntı | §1 |
| E-03C-57 | Panel kapat | tıklama | seçimi kaldır | §4.2 |
| E-03C-58 | Başlangıç girdisi | değişim | taslak + doğrulama | §4.3 |
| E-03C-59 | Bitiş girdisi | değişim | taslak + doğrulama | §4.3 |
| E-03C-60 | Durum | — | gösterim | §4.2 |
| E-03C-61 | Gecikme | — | gösterim | §4.2 |
| E-03C-62 | Kanıt dosyası | panel açılışı | tek görev dosya sayısı | §4.2 |
| E-03C-63 | Yardım metni | — | yüze göre metin | §2 |
| E-03C-64 | Tarih talebi gönder | tıklama | talep akışı (K5) | §4.3; `istemci-akislari.md` §6 |
| E-03C-65 | Atanana hatırlat | tıklama | bilinmiyor | §4.6 |
| E-03C-66 | Diğer işlemler | tıklama | menü (içerik bilinmiyor) | §4.6 |
| E-03C-67 | Bildirim simgesi | — | gösterim | §4.4 |
| E-03C-68 | Bildirim başlığı | — | değişiklik özeti | §4.4 |
| E-03C-69 | Tarih değişimi satırı | — | eski → yeni + fark | §4.4 |
| E-03C-70 | İptal et | tıklama | geri alma (yol bilinmiyor) | §4.4 |
| E-03C-71 | Bildirim kapat | tıklama | bildirimi kapat | §4.4 |
| E-03C-72 | Geri sayım | zaman | 5 sn sonra kapanır | §4.4 |
| E-03C-73 | Kapalı çubuk ipucu | hover / tıklama | özet; tıklama satırı açar | §4.5 |
| E-03C-74…81 | Tanımlama kartı | — | 03 grubu ayrıntı paneli; burada yalnız Gantt'a yansıma | §4.5; `03-gorevler-liste` |
| E-03C-82 | Tavan uyarısı | yanıt = 200 | uyarı gösterilir | §5; BE-019 |
| E-03C-83 | Boş/yükleniyor/hata | — | K7 varsayılanı | §6 |

## 8. Bağımlılıklar

**Ortak (`00-ortak`):** kenar menüsü (Görevler etkin; Görevler öğesindeki "tarih değişikliği talebi bekliyor" rozeti ortak kabukta), Kenar-Secici kapsam kartları (yüzü belirler, K2/K4), üst çubuk (geri/ileri, kırıntı, tema, bildirim), tema geçişi (`--gp-*` iki tema), K7 açık durum ekranları, K5 yazma protokolü ve etkili işlem onayı diyaloğu, `designStub`.

**Görevler listesi (`03-gorevler-liste`):** başlık bloğu (`rp-head`, görünüm segmenti, "Yeni görev"), oluşturma formu, görev ayrıntı paneli ve alt görev bölümü (03d tanımlama kartı), durum etiketleri ve renkleri, "Atanana hatırlat" (aynı ikon 03'te de var), süzgeç bileşenleri. Panelden "Liste görünümünde aç" hedefi.

**Paylaşılan durum:** seçili program/mercek/departman (K2), tema. Gantt sorgusu `scopedKey()` ile kapsam anahtarlı; görev yazımları (03'teki tarih/durum değişiklikleri) Gantt sorgusunu da geçersizler.

**Kararlar:** K4, K5, K13; ADR-0024 (alt görev Gantt dışı); BE-019 (tavan), BE-020 (alt görev çubukları); GAP-053, GAP-204.

### 8.1 F0 Gantt kütüphane pilotu — tasarımın istediği yetenekler

Pilot (K4) aşağıdakileri karşılayan kütüphaneyi seçer; tutmayan madde için kendi SVG'miz değerlendirilir. "Tasarım" sütunu yeteneğin hangi öğeden geldiğini söyler.

| # | Yetenek | Tasarım kaynağı | Zorunluluk |
|---|---|---|---|
| 1 | **Bağımlılık okları** (bitiş→başlangıç), görünen aralık/kapalı grup dışındaki uca giden ok (departmanlar arası bağlantı), ok olmadan yalnız simge gösterebilme | E-03C-37; F3 kapsamı "bağımlılıklar"; K4 | zorunlu (ok çizimi tasarımda yok ama K4 şartı). Veri: `links`; departmanlar arası ok yalnız Admin yüzünde (`backend.md` §6 pilot tablosu) |
| 2 | **200+ satır** akıcı kaydırma (tavanı aşan gelecek sayfalı yanıt + açılmış alt görev satırları; satır sanallaştırma, yatay+dikey) | §5; BE-019 | zorunlu |
| 3 | **Satır açılma / ağaç:** iki düzey gruplama (koordinatörlük grubu → görev → alt görev), farklı satır yüksekliği (40 / 44 / 30 px), tek tek ve "tümünü aç" | E-03C-28, 33, 48; 03d kural 2 | zorunlu |
| 4 | **Erişilebilirlik:** `role="grid"`/`row`/`gridcell` (03d modeli), `aria-expanded`, `aria-level`, klavyeyle satırlar arası gezinme, klavyeyle tarih değiştirme alternatifi, ekran okuyucuya durum metni, odak halkası | `ozellikler.md` §6, §7-21 | zorunlu |
| 5 | **Ölçek:** gün / hafta / (ay) ve ± ile geçiş; iki satırlı başlık (ay + hafta günü, ya da gün etiketi), hafta sonu gölgesi, haftalık ızgara | E-03C-07…09, 23–26 | zorunlu |
| 6 | **Bugün çizgisi** tüm satırları kesen + etiketli | E-03C-27 | zorunlu |
| 7 | **Özel çubuk çizimi** (şablon/slot): iki parçalı dolgu (plan + taşma), ayırıcı çizgi, kesik kenar, iç metin + süre, ön simge, dip ilerleme çizgisi, elmas işaretler, çubuk sonrası çip/uzantı (tarih talebi), sol kırpılmış köşe | E-03C-36…46 | zorunlu |
| 8 | **Uç sürükleme** (başlangıç ve planlanan bitiş ayrı), güne yapışma, bırakınca olay (iptal edilebilir); yüze/satıra göre kapatılabilme; tüm çubuğu kaydırmayı kapatabilme | E-03C-47; §4.4 | zorunlu |
| 9 | **Yapışkan sol sütun** (300 px, daraltılabilir: "yalnız kodlar") ve yapışkan başlık | E-03C-22; `ozellikler.md` §7-11 | zorunlu |
| 10 | **Tema:** renkler tamamen CSS değişkenlerinden (`--gp-*`, `--border-*`, `--accent-*`), kütüphane kendi stilini dayatmamalı (K9: görünüm bizde); koyu/açık anında geçiş | `ozellikler.md` §1, §5 | zorunlu |
| 11 | **CSP nonce** uyumu (satır içi stil/script enjekte etmemesi ya da nonce alması), **lisans** (ticari kullanım) | K4 | zorunlu |
| 12 | **Kaydırma konumu olayı** (görünen aralık başlangıç/bitişi) — sezon şeridi ve "Baktığın yer" için; programatik kaydırma (bugüne/seçiliye git) | E-03C-16, 18 | zorunlu |
| 13 | **Satır seçimi + hover olayı** (ipucu, panel) ve özel ipucu içeriği | E-03C-35, 73 | zorunlu |
| 14 | **Dışa aktarım** (PDF / PNG) yerleşik ya da DOM/SVG'den istemcide üretilebilir yapı | E-03C-10, 11 | isteğe bağlı (v1 kararı açık) |
| 15 | Tam ekran kabında doğru yeniden boyutlanma | E-03C-12 | isteğe bağlı |
| 16 | `prefers-reduced-motion` saygısı (açılma/kaydırma animasyonu) | `ozellikler.md` §6 | isteğe bağlı |
| 17 | Vue 3 + TS uyumu, ağaç sarsma, paket boyutu; sanallaştırılmış satırlarla oklar birlikte çalışmalı | K12, §3 mimari | zorunlu |
