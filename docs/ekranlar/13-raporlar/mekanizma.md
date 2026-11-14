# 13 — Mekanizma (nasıl davranıyor)

Ortak kural başvuruları: `../ortak-kurallar.md` §1 (mercek ≠ yetki), §2 (varsayım durumları), §3 (`designStub`), §4 (statik ≠ sahte veri), §6 (sorgu anahtarları), §7 (yazma protokolü; bu grupta yazma yoktur, yalnız okuma ve indirme), §10. Karar numaraları `P46–P53` (`../ortak-kurallar.md` §12'ye W135 işler). Sözleşme gerçekleri `backend.md`'de; burada **davranış** vardır.

## 1. Giriş ve gezinme

| Tetikleyici ekran | Giriş | Hedef | URL'de taşınan durum |
|---|---|---|---|
| 06 Arşiv başlığı | "Dönem sonu raporu (PDF)" | indirme (rota yok) | — |
| 06 Arşiv başlığı | "Bölüm seç…" | pencere (rota yok, bellek durumu) | — |
| 06 Arşiv başlığı | "Önizle" | `/arsiv/donem-raporu` (01f) | yok |
| 01f | "PDF indir" / "Kapat" | indirme / `/arsiv` | — |
| 09b / K7 başlığı | "Toplantı raporu (PDF)" | indirme | — |
| 09b başlığı (yalnız ŞY) | "Önizle" | `/toplantilar/:meetingId/rapor` (01g) | rota parametresi tipli `meetingId` |
| 01g | "PDF indir" / "Toplantıya git" / "Kapat" | indirme / `/toplantilar/:meetingId` / önceki ekran (yoksa `/toplantilar/:meetingId`) | — |
| 03/K3 görev paneli | "Görev raporu (PDF)" | indirme | panel `secili` URL durumu 03 grubundadır, değişmez |
| 05 Kullanıcılar | "İş yükü raporu (PDF)" / "Seçilenlerin iş yükü (PDF) · N" | indirme | seçim URL'de **taşınmaz** (bellek) |
| 05b | "Kişisel rapor" | indirme (`member_ids: [hesap]`) | — |
| 01 Ana sayfa | "Rapor oluştur" menüsü | `/arsiv` · `/kullanicilar` · `/toplantilar` · `/gorevler` | yok |

- Yeni rotalar yalnız iki tanedir (K10): `/arsiv/donem-raporu` ve `/toplantilar/:meetingId/rapor`; ikisi de **yalnız şirket yöneticisi** için tanımlıdır (rota koruması `me.company_admin`); K/Ü adresi yazarsa K7 "erişim yok" durumu. `/raporlar` rotası yoktur (E-13-76).
- Arşiv'den 01f'ye gidiş ve dönüş: 01f "Kapat" ve tarayıcı geri tuşu `/arsiv`'e döner; odak "Önizle" bağlantısına gider (KESİN 27). 01g'den 09b'ye aynı kural: odak 09b başlığındaki "Önizle" bağlantısına döner.
- Rapor düğmeleri **rota değiştirmez**; indirme tarayıcıda dosya kaydıdır.

## 2. Kapsam ve rol etkisi (K1, K2; P1, P47)

**Yetki sunucu olgularından** (`me.company_admin`, `me/departments` rolleri); mercek yalnız içerik kapsamını seçer. `istemci-akislari.md` §4 işlem tablosunda rapor satırı yoktur; kural reporting README §3 (REPORTING-K01/K07) ve openapi'den kodlanır (P30 emsali: `capabilities.ts` istisnası yazılır; `dogrulama.md` #10).

| Eylem | Şirket yöneticisi (her merceğinde) | Koordinatör | Üye |
|---|---|---|---|
| Dönem PDF + bölüm seçimi + ZIP + 01f önizleme | görür | **yok** (06 K/Ü için atlanır, P40) | yok |
| İş yükü PDF + satır seçimi + kişisel rapor | görür | yok (05 ona açılmaz, P13) | yok |
| Toplantı PDF | görür | görür **yalnız** koordine ettiği birimin sahip/dahil toplantısında | yok |
| Toplantı önizleme 01g | görür | **yok** (`reportMeetingDetail` 403, REPORTING-K01) | yok |
| Görev PDF | görür | görür **yalnız** koordine ettiği birimin görevinde | yok |
| 01 "Rapor oluştur" menüsü | görür (dört seçenek) | yok (K1'de kutucuk yok, P53) | yok |

- **Mercek ≠ yetki:** yönetici K veya Ü merceğine geçince de rapor düğmeleri kalır (yetki `company_admin`'dir, P1); mercek yalnız hangi toplantı/görev listesinin gösterildiğini seçer. Gerçek koordinatör kendi birim merceğinde yalnız iki düğmeyi (K7, K3) görür.
- **Düğme görünürlüğü hesabı:** `canDownloadTaskReport(görev) = company_admin || coordinates(görev.department_id)`; `canDownloadMeetingReport(toplantı) = company_admin || coordinates(owner ∪ dahil departmanlar)` (kaynak: `meetings` toplantı `departments`; backend REPORTING-K07: koordine ettiği departmanlardan **herhangi biri** kaynağın departmanlarındaysa yeter). Sunucu nihai karardır; yanlış pozitif 403 kartı alır (E-13-73).
- **Kapsam yeniden doğrulama:** program/departman değişince rapor durumu (düğme durumu, seçim, pencere, önizleme sorguları) iptal edilir ve sıfırlanır (K2); uçuştaki bilet isteği iptal edilir, bilet tüketilmez (`disposed`).
- **Yetki düşmesi / kapsam dışı:** `reporting.not_authorized` 403 (slot bekleyen isteğin yetkisi kalktıysa da gelir; PDF ve audit üretilmez) → `['me']`, `['me','departments']` geçersizlenir (K6), düğme gizlenir, kartta ortak "yetkiniz yok" metni. `reporting.not_found` 404 (görev/toplantı silinmiş ya da kapsam dışı; iç kod sızmaz) → panel/sayfa kapanır, ilgili liste ve ayrıntı sorguları tazelenir, "Kayıt bulunamadı" bildirimi. 404 `program.not_found` → K6. Üyede düğme hiç çizilmez; ele geçirilen URL 403 alır.

## 3. Durum makinesi

### 3.1 Düğme durumları (tek ortak bileşen, dört yerde aynı)
`idle → issuing (POST download-tickets) → redeeming (GET downloads/{ticket}, blob) → saved | failed(kind) | cooldown(N)`.

- `idle`: normal etiket.
- `issuing` / `redeeming`: düğme "Hazırlanıyor…", `aria-busy="true"`, tekrar tıklama yok sayılır; "İptal" `AbortController` ile okumayı keser (bilet tüketildiyse sunucu üretimi sürebilir; istemci dosyayı kaydetmez). Belirsiz ilerleme şeridi + "ilerleme yakında" (statik, BE-131); sayaç/yüzde yok.
- **Hesap başına tek eşzamanlı üretim:** sunucu kuralıdır (429 `reporting.export_in_progress`); istemci buna ek olarak **bu sekmedeki bütün rapor düğmelerini** tek paylaşılan kilit (`reportGate`) altında tutar: biri `issuing/redeeming` iken diğerleri kilitli (01h "Bu sırada diğer rapor düğmeleri kilitli"). Başka sekme/cihaz sunucudan 429 alır.
- `saved`: "‹dosya adı› indirildi · ‹boyut›" bildirimi, kendiliğinden kapanır, düğme `idle`.
- `failed`: hata türüne göre kart (E-13-69…73); otomatik tekrar **yok**.
- `cooldown(N)`: yalnız `Retry-After` taşıyan yanıtlarda: düğme "Bekleyin (N s)" ve devre dışı; sayaç saniyede 1 azalır, 0'da `idle`; **bitince indirme kendiliğinden başlamaz** (kullanıcı yeniden tıklar). Sayaç değeri başlıktaki tam sayıdır (`rateLimitMessage` ile aynı kaynak); başlık yoksa sayaç gösterilmez (503 `capacity_full`, E-13-71).
- Zaman aşımı: istemci tarafında sert zaman aşımı **yoktur** (slot bekleme ≤ 12 sn + render süresi; büyük dönemde uzun, GAP-044); kullanıcı "İptal" ile keser.
- Sahip (bileşen) sökülürse: bilet beklenirken **tüketilmez**; bilet alındıysa tüketim iptal edilir, bildirim gösterilmez (`../ortak-kurallar.md` §7 sahip yaşamı).

### 3.2 Bölüm seçimi penceresi (statik; E-13-03…06)
Durum bellekte: `sections: Set` (açılışta **hepsi** seçili), `departments` ("Tümü" seçili; çipler devre dışı "yakında"). Ana bölümün kutusu kendi alt kutularını toplu işaretler/kaldırır (kısmi seçimde ana kutu `indeterminate`); "Kapak ve içindekiler" kilitli. **Hepsi seçili** ⇒ "Seçilenleri indir (PDF)" etkin ve düz `reportSeasonPdf` indirmesini başlatır (E-13-02 ile aynı bilet akışı; pencere kapanır; durum kartı ana düğmede görünür). **Bir kutu kaldırılırsa** ⇒ "Seçilenleri indir" devre dışı + "yakında" rozeti (`designStub('BE-122')`), pencere yalnız kapatılabilir; sahte "kısmi PDF" üretilmez. Seçim açılışlar arasında **hatırlanmaz**.

### 3.3 ZIP (E-13-09…11)
Düğme `designStub('BE-120')` ile devre dışı kalır (yönetici `archiveFullZip`'i S3 başlığı olmadan çağıramaz; "ilk departman" kapsamı reddedildi, P33). Onay penceresi (E-13-10) bileşeni kodlanır ama düğme açılana dek ulaşılamaz; açılınca akış: "Dönem arşivi (ZIP)" → onay → "Hazırla ve indir" → F5 `useArchiveDownload`/`zip-status` akışı (bilet → ZIP akışı; 422 `records.too_many_files`/`records.too_large`, 429 `platform.rate_limited`/`records.busy`, akış ortasında kopma "tekrar deneyin", GAP-041). Penceredeki dosya sayısı/boyut `archiveFolders` toplamından BE-120 sonrası hesaplanır (öneri); klasör ağacı satırları yalnız BE-124 sonrası.

### 3.4 Önizleme ekranları (01f, 01g)
`loading → ready | error(kind) | empty`. 01f için `reportSeason` tek ağır istek; 01g için `reportMeetingDetail` hafif. Bölge içi hata + "Yeniden dene" (ağ/5xx); 403/404 ortak kural (§2). Yükleme: kâğıt iskeleti (başlık bandı ve KPI kutuları gri blok; sahte değer yok), 01f için "Rapor hazırlanıyor…" metni (slot bekleyebilir).

## 4. Etkileşim akışları

1. **Dönem sonu PDF (E-13-02, 16):** tıklama → `reportGate` boşsa kilitle → `issueDownloadTicket` (`POST /v1/download-tickets`; başlıklar `X-Requested-With`, `X-Nizamio-Program`; gövde `{method:"GET", path:"/v1/reports/season/pdf"}`) → hemen `redeemDownloadTicket` (`GET /v1/downloads/{ticket}`, `parseAs: blob`) → `Content-Disposition` `filename=` ile kaydet (ASCII; yedek `donem-raporu.pdf`; `safeFileName`) → "indirildi" bildirimi → kilidi bırak. Ortak yardımcı `archive/api/downloads.ts` kalıbı `shared`'a taşınır (`backend.md` §6).
2. **Toplantı PDF (E-13-41, 44):** aynı akış, `path: /v1/reports/meetings/{id}/pdf`; `id` kodlanır, ham sorgu yok. Düğme toplantı yüklenince (silinmemiş) görünür; gündemi olup notu olmayan toplantıda da etkin.
3. **Görev PDF (E-13-55, 56):** `path: /v1/reports/tasks/{id}/pdf`. Panel kapanır/başka görev açılırsa düğmenin sahibi sökülür ve **KESİN 26'ya göre** uçuştaki akış iptal edilir: bilet isteği beklerken bilet **tüketilmez**; tüketim sürerken dosya **kaydedilmez**; bildirim gösterilmez; hesap başına kilit bırakılır (yeni rapor başlatılabilir). Aynı kural bütün rapor düğmeleri için geçerlidir (06, 09b/K7, 05/05b): sökülmüş ekranın geç sonucu ekrana özgü iş başlatmaz. Kapsam/hesap değişimi ve kardeş sekme çıkışı da aynı yoldan iptal eder (§2). Kanıt: `reports-task.test` "panel kapanınca uçuştaki istek bilet tüketmez, bildirim yok (sahip söküldü)", `reports-lifecycle.test` (W142; W142 varsayım 5, kabul). *Önceki metin "uçuştaki istek iptal edilmez" diyordu; F6 O3'te düzeltildi (W143).*
4. **İş yükü PDF (E-13-59…64):** POST bilet: gövde `{method:"POST", path:"/v1/reports/workload", body:{member_ids:[…]}}`; seçim yokken `body: {"member_ids": []}` (boş/yok = bütün üyeler; bilet POST hedefi **boş olmayan JSON nesnesi** ister — `{}` de geçerlidir, açık boş dizi niyeti belli eder; `dogrulama.md` #9). Sunucu `member_ids`'i slottan önce doğrular: ekipte olmayan/silinmiş hesap → 422 `reporting.input_invalid` (`fields[member_ids]`) → seçimdeki geçersiz kimlikler temizlenir, "Seçim güncellendi, yeniden deneyin" iletisi.
5. **01f açılışı (E-13-13…40):** rota `/arsiv/donem-raporu` → yetki kapısı → `reportGate` üzerinden `reportSeason` (`GET /v1/reports/season`, S2) → bölümler çizilir; sayfa açıkken odakta/yeniden bağlanmada **otomatik tazeleme yok**; yeniden açılış taze okur (`staleTime: 0`); ekranda "Oluşturulma ‹generated_at›". PDF indirmesi ve önizleme okuması aynı `reportGate`'ten geçer (aynı anda yalnız biri; JSON da hesap başına tek eşzamanlı üretim korumasındadır, REPORTING-K10).
6. **01g açılışı:** `reportMeetingDetail` (`GET /v1/reports/meetings/{id}`, S2, hafif); not akışı `created_at` sırasıyla; K için rota yok.
7. **"Rapor oluştur" menüsü (E-13-65):** düğme menüyü açar (`aria-haspopup`, `aria-expanded`); öğe → `router.push`; Esc/dış tıklama kapatır, odak düğmeye döner. "Toplantıyı seç"/"görevi seç" yalnız ilgili liste ekranına gider.
8. **Odak dönüşü (E-13-75, KESİN 27):** modal kapanınca (Vazgeç/Esc/dış tıklama/indirme tamam) odak tetikleyiciye; durum kartlarında odak çalınmaz (`role="status"`); 429 sayacı bitince odak değişmez.

## 5. Liste davranışı (05 satır seçimi)
- Seçim **bellekte** `Set<hesap kimliği>`; URL'e yazılmaz; sayfa/süzgeç/arama değişince korunur, program/kapsam değişince temizlenir. "Tümünü seç" yalnız o an görünen sayfanın seçilebilir satırlarını işaretler (sayfalama 05 grubundadır); ikinci basış hepsini kaldırır.
- Seçilemeyen satır: seçili programın iş yükünde olmayan hesap (backend iş yükü üyesi = canlı departman kadrosu + canlı departmana atanmış hesaplar, silinmiş hesap hariç); istemci bunu satırdaki program üyelikleri etiketinden çıkarır (P13) — bilgi yoksa kutu etkin kalır, 422 yukarıdaki gibi karşılanır.
- Düğme etiketi: `selected.size > 0` ⇒ "Seçilenlerin iş yükü (PDF) · N"; `0` ⇒ "İş yükü raporu (PDF)" (sayı yok, E-13-59). Çubuk: "N üye seçili · Seçimi temizle". Gövde sınırı ≤ 64 KiB (kimlik başına ~40 bayt ≈ 1500 kimlik); aşım (nadir) 413/422 → "Daha az üye seçin".

## 6. Boş / yükleniyor / hata durumları
- **Tasarımda var:** durum kartları (E-13-68…72). **Tasarımda yok → K7 varsayılanı:** 403/404/422/bilet/500/altyapı-503 kartları (E-13-73), 01f/01g yükleniyor/hata/boş, 429 `platform.rate_limited` (E-13-70).
- **Boş dönem (sıfır zarf, REPORTING-K08):** 01f yine çizilir: sayılar 0, tasarım boş metinleri ("Koordinatörlük verisi bulunamadı.", "Görev bulunamadı.", "Aktivite verisi bulunamadı."); Gantt/İş yükü yer tutucuları aynı. PDF yine indirilebilir.
- **Boş toplantı:** gündem/not yoksa "Gündem girilmemiş." / "Not girilmemiş."; "Göreve dönüştürülenler" tablosu çizilmez.
- **Kesme:** dönem/iş yükü JSON'unda `X-Result-Truncated` tanımsızdır (BE-132); 01f'de kesme bandı yok (dashboard alt listeleri bu grupta kullanılmaz).
- Hata metni yalnız i18n'den; sunucu `message` gösterilmez.

## 7. Öğe → davranış tablosu
| Kimlik | Öğe | Olay | Davranış | Bağ |
|---|---|---|---|---|
| E-13-01 | Eylem şeridi | düzen | sıra ve "Önizle" konumu; 390 px'te yığılır (E-13-12) | §1 |
| E-13-02 | Dönem sonu raporu (PDF) | tıklama | §4.1 bilet akışı; durum §3.1 | backend §1.1, §2 |
| E-13-03 | Bölüm seç… | tıklama | pencereyi açar; odak pencereye | §3.2 |
| E-13-04 | Bölüm seçimi penceresi | kutu/düğme | statik seçim; hepsi seçili ⇒ düz indirme; aksi devre dışı "yakında" | §3.2 |
| E-13-05 | Koordinatörlük çipleri | tıklama | devre dışı "yakında"; yalnız "Tümü" seçili | §3.2 |
| E-13-06 | Pencere özeti | görüntü | koordinatörlük sayısı canlı; sayfa tahmini yok | §3.2 |
| E-13-07 | Dosya adı/boyut/sayfa satırı | — | çizilmez | — |
| E-13-08 | Önizle | tıklama | `/arsiv/donem-raporu` | §1 |
| E-13-09 | Dönem arşivi (ZIP) | tıklama | devre dışı (BE-120) | §3.3 |
| E-13-10 | ZIP onay penceresi | tıklama | BE-120 sonrası; "Hazırla ve indir" ZIP akışı | §3.3 |
| E-13-11 | ZIP denetim rozeti | — | çizilmez | §3.3, dogrulama |
| E-13-12 | Dar ekran | görüntü | yığın düzen; bölüm seçimi tam ekran modal | §1 |
| E-13-13 | 01f rota/kabuk | gezinme | yalnız ŞY; K/Ü → erişim yok; kırıntı Arşiv | §1, §2 |
| E-13-14 | Başlık | görüntü | "Önizleme" | §3.4 |
| E-13-15 | Araç çubuğu | tıklama | yakınlaştırma %50–%200 (adım 25, CSS ölçek); sayfa göstergesi/yazdır yok | §3.4 |
| E-13-16 | PDF indir | tıklama | = E-13-02 | §4.1 |
| E-13-17 | Kapat | tıklama | `/arsiv`; odak Önizle | §1 |
| E-13-18 | Alt not | görüntü | sabit metin | — |
| E-13-19 | Kâğıt teması | görüntü | her temada açık kâğıt | ozellikler §1 |
| E-13-20…23 | Kapak | görüntü | `reportSeason` alanları; gizlenenler çizilmez | backend §1.2 |
| E-13-24 | İçindekiler | tıklama | sayfa içi kaydırma + odak bölüm başlığına | §4.5 |
| E-13-25…27 | Özet, dağılım, karşılaştırma | görüntü | canlı | backend §1.2 |
| E-13-28 | Gantt | görüntü | statik yer tutucu (`designStub`) | eksikler |
| E-13-29, 30 | Aylık aktivite, tarih talepleri | görüntü/hover | canlı; grafik çubuğu `title` ay + dört sayı | backend §1.2 |
| E-13-31 | İş yükü | görüntü | statik yer tutucu | eksikler |
| E-13-32, 33 | Bölüm bandı, görev tablosu | görüntü | canlı (`tasks` bölümlenir); sıra `created_at` artan; boş bölüm "Bu koordinatörlükte görev yok." | backend §1.2 |
| E-13-34…36 | Detay kartları, toplantılar, dosyalar | görüntü | statik yer tutucu | eksikler |
| E-13-37 | Ek | görüntü | sabit metin | — |
| E-13-38 | Sayfa iskeleti | görüntü | üst bilgi/altlık, sayfa numarası yok | — |
| E-13-39 | 01f durumları | görüntü | §3.4, §6 | — |
| E-13-40 | Tazeleme kuralı | kural | `reportGate`, `staleTime: 0`, otomatik tazeleme yok | §4.5 |
| E-13-41 | Toplantı raporu (PDF) | tıklama | §4.2 | backend §1.3 |
| E-13-42 | İpucu | hover/odak | `title` | — |
| E-13-43 | Önizle (01g) | tıklama | yalnız ŞY | §1 |
| E-13-44 | K7 düğmesi | tıklama | §4.2, K için | §2 |
| E-13-45 | Silinmiş toplantı | — | düğme yok | — |
| E-13-46 | 01g rota/kabuk | gezinme | yalnız ŞY | §1 |
| E-13-47 | 01g araç çubuğu | tıklama | PDF indir = E-13-41; Toplantıya git; Kapat | §1 |
| E-13-48…52 | Künye, katılımcı, gündem, not akışı, dönüştürülenler | görüntü | canlı (`reportMeetingDetail`) | backend §1.3 |
| E-13-53 | 01g altlığı | görüntü | önizleme günü | — |
| E-13-54 | Tetikleyiciler kartı | — | uygulanmaz | — |
| E-13-55, E-13-56 | Görev raporu düğmesi | tıklama | §4.3 | backend §1.4 |
| E-13-57 | Görev önizlemesi | — | uygulanmaz | — |
| E-13-58 | Silinmiş görev | — | düğme yok | — |
| E-13-59 | İş yükü düğmesi | tıklama | §4.4, §5 | backend §1.5 |
| E-13-60 | Onay kutuları | tıklama | §5 | — |
| E-13-61 | Seçim çubuğu | tıklama | "Seçimi temizle" | §5 |
| E-13-62 | Seçilemeyen satır | görüntü | devre dışı kutu + ipucu | §5 |
| E-13-63 | İş yükü kâğıt önizlemesi | — | uygulanmaz | — |
| E-13-64 | Kişisel rapor | tıklama | `member_ids: [hesap]` | §4.4 |
| E-13-65 | Rapor oluştur menüsü | tıklama | §4.7 | — |
| E-13-66 | K1/Ü1 | — | çizilmez | §2 |
| E-13-67 | Koordinatör varsayılanı kartı | — | uygulanmaz | — |
| E-13-68 | Hazırlanıyor | durum | §3.1 | — |
| E-13-69 | 429 export_in_progress | durum | §3.1 `cooldown`; pin'de `Retry-After` = 1 | backend §3 |
| E-13-70 | 429 rate_limited | durum | `cooldown` | backend §3 |
| E-13-71 | 503 capacity_full | durum | sayaç yok, "Yeniden dene" | backend §3 |
| E-13-72 | İndirildi | durum | bildirim | §3.1 |
| E-13-73 | Diğer hatalar | durum | §2, backend §3 | backend §3 |
| E-13-74 | Bilet kuralı | kural | tıklamada üret, saklama | §4.1 |
| E-13-75 | Odak dönüşü | kural | §4.8 | — |
| E-13-76…79 | Uygulanmayanlar | — | yok | — |
| E-13-80 | Üye | — | çizilmez; URL 403 | §2 |
| E-13-81…85 | Birim raporu, HTML, tarih aralığı, CSV/XLSX, son raporlar | — | çizilmez | eksikler |
| E-13-86 | Gantt dışa aktarımı | — | bu gruba ait değil | — |

## 8. Bağımlılıklar
- **Ortak bileşenler:** `shared/ui` modal/menü/bildirim, `shared/http/mutation` (`useProtectedMutation`, `rateLimitMessage`), indirme bileti yardımcısı (`archive/api/downloads.ts` → `shared`), `designStub`/`DesignStub`.
- **Diğer ekranlar:** 06 (başlık, ZIP düğmesi F5 `PeriodZipButton`), 09 (09b başlığı, K7), 03/K3 (panel şeridi), 05 (satır seçimi, 05b), 01 (Rapor oluştur menüsü; E-01-12 W135), 00-ortak (kenar menü: Raporlar öğesi **yok**).
- **Paylaşılan durum:** seçili program (K2), `me.company_admin`, `me/departments`, `instanceProfile.timezone` (tarih biçimi), tema.
