# Backend devir raporu — F6 (WEB-6), 2026-11-14

**Durum:** F6 kodu main'de (#119–#128, son kod `a3b31e3`); gerçek sunucu tanığı (W144), Codex nihai kapısı ve kapanış PR'ı **bekliyor** (F6 henüz KAPANMADI). Web pini `v0.15.0-api` (F6 boyunca yükseltilmedi). **"Backend dursun" kuralı (P46) geçerli kaldı: F6 için backend paketi açılmadı**; bu raporun bütün satırları açık eksiktir ve ekranda statik/devre dışı/gizli çalışır. Bu rapor F7'yi veya pin yükseltmesini açmaz.

Kaynaklar: [kayıt](kayit.md) (BE-120, BE-122…BE-141), [13 Raporlar tespiti](../ekranlar/13-raporlar/README.md), [01 ana sayfa](../ekranlar/01-ana-sayfa/README.md), [ortak-kurallar §12 P46–P53](../ekranlar/ortak-kurallar.md), [F6 ilerleme](../yurutme/web-6/ilerleme.md), [F5 raporu](rapor-F5.md), [gerçek sunucu tanığı](../yurutme/web-6/dogrulama-F6.md) (W144; bu belge yazılırken henüz birleşmedi). Uç/alan önerileri sözleşme yayımlanana ve web pini yükselene kadar uygulama yetkisi değildir.

## 1. F6'da bağlanan uçlar (pin `v0.15.0-api`)

| Uç (`operationId`)                                                 | Web'de nerede                                                                                                                                        | Not                                                                                                                                                                                                                  |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `issueDownloadTicket` (`POST /v1/download-tickets`) + `redeemDownloadTicket` (`GET /v1/downloads/{ticket}`) | `src/shared/download/` (W136; F5 arşiv akışı genelleştirildi): dört PDF'in ortak bilet akışı, POST gövdeli hedef, program/departman başlığı, CSRF, iptal | Bilet her tıklamada yeni üretilir, hemen tüketilir (ADR-0013, E-13-74). Gerçek sunucuda bilet gövdesi ve `Content-Disposition` adı **henüz doğrulanmadı** (W144 bekliyor)                                              |
| `reportSeasonPdf`                                                  | 06 Arşiv "Dönem sonu raporu (PDF)" ve 01f "PDF indir"; bölüm seçimi penceresinde hepsi seçiliyken "Seçilenleri indir" (W138)                         | Parametresiz tam rapor; bölüm/süzgeç parametresi yok (BE-122)                                                                                                                                                        |
| `reportSeason` (JSON)                                              | 01f `/arsiv/donem-raporu` önizleme (W138)                                                                                                            | Yalnız sayfa açılınca okunur; odakta/yeniden bağlanmada otomatik tazeleme kapalı; PDF indirmesi ile aynı `reportGate`'ten geçer (hesap başına tek eşzamanlı üretim). Boş dönem sıfır zarfı çizilir                  |
| `reportMeetingDetail` / `reportMeetingPdf`                         | 01g `/toplantilar/:id/rapor` (yalnız ŞY); 09b ve K7 "Toplantı raporu (PDF)" (ŞY + sahip/dahil departman koordinatörü) (W138)                         | Önizleme "göreve dönüştürülenler" tablosu NOT + GÖREV (başlık); DURUM sütunu gizli (BE-125)                                                                                                                          |
| `reportTaskPdf`                                                    | 03 ve K3 görev ayrıntı paneli "Görev raporu (PDF)" (W138)                                                                                            | Yalnız ŞY + görevin birim koordinatörü; üye görmez. `reportTaskDetail` için okuma kancası (`useReportTaskDetail`) veri katmanında var, **hiçbir ekran kullanmıyor** (P52)                                            |
| `reportWorkloadPdf` (POST, bilet gövdeli `member_ids`)             | 05 Kullanıcılar çoklu seçim ve 05b "Kişisel rapor" (W139)                                                                                            | Seçim yoksa boş `member_ids` = bütün üyeler; ekip dışı kimlik 422 `reporting.input_invalid` → seçim temizlenir. `reportWorkload` (JSON) çağrılmaz (P52)                                                              |
| `reportDashboard` (F6 alanları)                                    | 01 yönetici ana sayfası (W137): ekip şeridi `total_*`, koordinatörlük kartları `coordinatorship_stats`; K1/Ü1'de kullanılmaz (K/Ü'ye 403)            | Tek okuma (ikinci istek yok); `reportDashboardCoordinatorships/Tasks/Meetings` kullanılmaz (P52). K1/Ü1 verisi mevcut görev/toplantı/tarih talebi uçlarından tek yüklemle istemcide türetilir (KESİN 21, W140)       |

Yetki gerçeği (pin): rapor uçları yalnız şirket yöneticisine; toplantı ve görev PDF'i ek olarak sahip/dahil departman koordinatörüne (REPORTING-K01/K07); üyeye hiçbiri. Web bu olguyu `modules/reports/model/capabilities.ts` ile hesaplar; mercek yetki vermez (P1).

## 2. Kayıt durumu: BE-120 ve BE-122…BE-141

Hepsi `kayit.md`'de `açık`. "designStub" sütunu kodda `designStub('BE-NNN')` işareti olup olmadığını söyler (kod: `src/modules/reports/model/stubs.ts`, `src/modules/home/model/role/stubs.ts`; kayıt ↔ kod tutarlılığını `stubs.test` denetler).

| BE     | Konu                                                          | Ekranda ne olur                                                                                                                | designStub                          |
| ------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- |
| BE-120 | Dönem ZIP'i yönetici başlığı                                  | 06 Arşiv "Dönem arşivi (ZIP)" devre dışı + açıklama; onay penceresi (E-13-10) **kodlanmadı** (düğme devre dışı, ulaşılamaz; W138)                          | evet (`PERIOD_ZIP`)                 |
| BE-122 | Dönem PDF bölüm seçimi + koordinatörlük süzgeci               | "Bölüm seç…" penceresi çizilir; hepsi seçili = düz indirme (canlı); kutu kalkınca "Seçilenleri indir" devre dışı + "yakında"; çipler devre dışı | evet (`SECTION_SELECTION`)          |
| BE-123 | Dönem PDF şablonu 01f'ye göre yeniden yazım                   | 01f Gantt ve görev detay/toplantı/dosya bölümleri statik yer tutucu; önizleme alt notu PDF şablonunun daha sade olduğunu söyler | evet (`SEASON_TEMPLATE`)            |
| BE-124 | ZIP içine raporlar (klasör yapısı)                            | ZIP düğmesi devre dışı (BE-120); onay penceresinde klasör ağacı satırları çizilmez                                              | hayır                               |
| BE-125 | Toplantı PDF'ine "göreve dönüştürülenler" tablosu             | 01g tablosu NOT + GÖREV (başlık); DURUM sütunu gizli; PDF mevcut hâliyle iner                                                  | hayır (`meeting-view.ts` yorum bağı) |
| BE-126 | HTML rapor                                                    | Çizilmez (ekranı uygulanmayan 01e/01h kartında)                                                                                | hayır                               |
| BE-127 | Tarih aralığı + departman süzgeci (rapor kapsamı)             | Çizilmez; yalnız bölüm penceresindeki çipler statik (BE-122)                                                                   | hayır                               |
| BE-128 | Koordinatör birim raporu                                      | Gizli (08b E-08-89 gizli kalır)                                                                                                | hayır                               |
| BE-129 | CSV/XLSX                                                      | Çizilmez                                                                                                                       | hayır                               |
| BE-130 | "Son raporlar" listesi (audit okuma)                          | Çizilmez; sahte liste yok                                                                                                      | hayır                               |
| BE-131 | Asenkron üretim, ilerleme, boyut tahmini                      | "Hazırlanıyor…" durumunda belirsiz şerit + "ilerleme yakında" rozeti; sayaç/yüzde yok                                          | evet (`REPORT_PROGRESS`)            |
| BE-132 | `SeasonReport`/`WorkloadReport` kesme bildirimi               | 01f tam okur; zaman aşımı/hata kartı + "Yeniden dene"                                                                          | hayır                               |
| BE-133 | Dağılım anahtar kümesi şemada (belge eksiği)                  | İstemci sabit anahtar sırası kullanır, eksik anahtarı 0 sayar                                                                  | hayır (belge eksiği, §3 stub değil) |
| BE-134 | İş yükü JSON'unda üye başı sayaç ve `total` belgesi           | 01f iş yükü bölümü statik yer tutucu; 05'te `reportWorkload` okunmaz (P52)                                                     | evet (`PaperStub`, kimlik BE-134)   |
| BE-135 | `Retry-After` doğruluğu (429 sabit 1 sn, 503 başlıksız)       | Sayı yalnız başlık varsa gösterilir; 503'te "biraz sonra", otomatik tekrar yok                                                 | hayır (`failure.ts` yorum bağı)     |
| BE-136 | 01f dönem JSON'unda eksik alanlar                             | Kapak dönem aralığı, dosya/toplantı/görev detayı, iş yükü özeti, "ortalama kayma" gizli/statik; sayfa numarası ve "x / y" yok  | evet (`SEASON_DETAIL_FIELDS`)       |
| BE-137 | Görev satırında `file_count` + `submitted_at` (K1/Ü1)         | Alan gizli (E-K1-15/16, E-Ü1-11)                                                                                               | evet                                |
| BE-138 | Satırda bekleyen bağımlılık özeti (kilit rozeti)              | Kilit çizilmez; engel sunucu hatasıyla bildirilir                                                                              | evet                                |
| BE-139 | İade sebebi okuma                                             | Metin gizli, nötr not; K1'de iade gerekçesi yok (E-K1-17/18 borcu)                                                             | evet                                |
| BE-140 | Tarih talebi zamanları + yönetici karar notu                  | Gizli (E-K1-39)                                                                                                                | evet                                |
| BE-141 | Üyeye birim koordinatör adı (`MyDepartment.coordinators[]`)   | Gizli (E-Ü1-21/31)                                                                                                             | evet                                |

Önceki fazlardan F6 ekranlarının dayandığı açık kayıtlar: BE-005 (görev kısa kodu; 01f/01g/K1'de kod yok), BE-010 (01 "Son işlemler" nötr yer tutucu), BE-025 ("Son yükleme"), BE-057 (Gantt dışa aktarım; rapor ailesi değil), BE-072 (yönetici arşiv sayısı `—`), BE-078/BE-079 (01 koordinatörlük kartı "onayda/iade" dilimi ve avatar yığını). Hiçbiri F6'da kapanmadı.

## 3. P45 ertelenenler ve "backend dursun"

- **P45 (F5, karar bekler):** BE-112/109/111/076 F6'da da değişmedi; ekranlar ([12](../ekranlar/12-silinen-kayitlar/README.md), 07) F5 davranışında kaldı. Kullanıcı kararı gelmeden backend paketine girmez ([rapor-F5 "Karar bekler"](rapor-F5.md)).
- **"Backend dursun" (P46, 2026-11-13):** F6 için hiçbir BE paketi açılmadı, hiçbir istemci uç/alan uydurmadı; kayıt satırları yalnız yazıldı. BE-120 F5'ten beri açık; BE-122…BE-141 F6'da yazıldı. **Bu bilinçli bir sınırdır**: F6'nın "statik/devre dışı" görünen parçaları hata değil karardır.
- Pin yükseltmesi ve v0.16/v0.17 farkı hâlâ [F5 raporu §3](rapor-F5.md) ve [pin yükseltme planı](../yurutme/web-5/pin-yukseltme-plani.md)'ndadır; F6 buna dokunmadı.

## 4. Tasarım–kod farkları (backend eksiği değil)

- **Oturum kartı (E-00-47):** tasarımda "Profilim" düğmesi; web'de rol halkası + "‹rol› · ‹e-posta›", tıklanamaz (profil sayfası F6 dışı; W141). Profil sayfası F7 adayıdır.
- **Kâğıt genişliği ve tipografi (01f/01g):** W138 bildirimi: web'de kâğıt 880 px, tasarım 820; gövde 10,5 pt için token yok. Bu belge yazılırken kodda ölçü/token **doğrulanamadı** (CSS taraması 880/820/10,5 bulmadı; değer W138 çıktısından alındı) — W144 görsel karşılaştırması bağlayıcıdır.
- **390 px bölüm penceresi (E-13-12):** W138'de tam ekran değildi; W142 KUSUR 5 ile düzeltildi (`e3448b3`: tam ekran, yapışık alt şerit, Esc odağı tetikleyiciye). **Kalan sapma:** 390 px'te "ZIP" ve "Dosya yükle" düğmeleri tam genişlikte değil (geçici kabul).
- **01h/01e/A5 uygulanmayanlar:** 01e ve A5 rapor merkezi, sekmeler (Dönem raporu · İş yükü · Görev raporları · Toplantı raporları), iş yükü tablosu/görev raporları listesi/toplantı raporları listesi/"Rapor kuralları", "Tetikleyiciler" kartı (E-13-54; W142 KUSUR 2 üretime sızmıştı, kaldırıldı), 01i/01h içindeki HTML sürüm, kapsam kartı, CSV/XLSX, "Son raporlar" (P47, P51, P52).
- **01h/01i metin sapmaları:** 429/503 örnek süreleri ("27 saniye", "15 sn") sunucudan gelmez (BE-135); tuvalde kalan iki not önemsiz sayıldı ve bekler: 01h hücre kicker'ında "sekmesi" ifadesi (sekme uygulanmıyor) ve 01i penceresindeki "kayda geçer" (ZIP indirmesinin audit yazdığı pinde doğrulanamadı, E-13-11); ilerleme "prototip/tuval notları".
- **Dosya boyutu (E-13-72):** "‹ad› indirildi · ‹boyut›" tasarım metni; web yalnız ad gösterir (`{name} indirildi`), boyut ve sayfa sayısı gizli. W136 borç bildirimi: `Blob.size` ile boyut gösterimi kurulmadı (borç; kabul tablosu E-13-72 'gerçek blob' diyor).
- **Rol menüsü:** Takvim ve Kurumsal hafıza menüde gizli (F6 dışı); koordinatör/üye menüsünde "Zaman çizelgesi" korunur (E-00-46, v85 `Sidebar` Takvim getirmişti). Birim/Mesajlar/Tablolar koordinatör menüsünde docs gereği gizli (E-00-44).

## 5. Gerçek sunucu tanığı (W144)

**Bekliyor.** `dogrulama-F6.md` (gerçek üretim imajı + Caddy CSP + pinli backend Docker; dört PDF akışı, 429 `export_in_progress` gerçek `Retry-After`, K için 403/404, üye için düğme yokluğu, 01f/01g gerçek JSON, K1/Ü1, üç rol × 390/1024/1440 × iki tema, yönetici üye merceğinde başka birimin görevine `?gorev=` derin bağlantı, tasarım farkları ve `KUSUR n:` listesi) W144 tarafından ayrı dalda yazılır; sonucu bu bölüme **işlenmedi** (doğrulanamadı). W142'nin e2e'si ve 54 karelik duman ölçümü **sahte** `/v1` ile alındı, gerçek sunucu kanıtı değildir.

## 6. Öneri sırası (backend açıldığında)

1. **BE-122** (dönem PDF `sections` + `department_ids`; S) — web'de pencere hazır, tek parametreyle açılır.
2. **BE-123** (dönem PDF şablonu 01f'ye göre; L) — önizleme ile indirilen PDF arasındaki farkı kapatır; BE-136 alanlarıyla birlikte düşünülmeli.
3. **BE-124** (ZIP içine raporlar; M) — BE-120 (yönetici başlıksız ZIP) ile **aynı pakette**; ZIP onay penceresi (E-13-10) ancak o zaman ulaşılır.
4. **BE-125** (toplantı PDF'inde dönüştürülenler + `converted_task_status`; S) — küçük, 01g DURUM sütununu açar.
5. Sonra: BE-135 (`Retry-After` doğruluğu; S), BE-133 (belge eksiği; S), BE-136/BE-134/BE-132 (JSON alanları ve kesme), BE-131 (asenkron üretim; L), BE-127/BE-128/BE-126/BE-129/BE-130 (kapsam, birim raporu, HTML, CSV, geçmiş).
6. **K1/Ü1 satır alanları** (BE-137…BE-141; her biri S–M) ayrı, küçük bir "rol ana sayfası" paketidir; BE-005 (görev kodu) ile birlikte alınırsa K1/Ü1, 01f ve 01g'de kod görünür.

Sıra BE-072/BE-119 gibi F5 önceliklerinin yerine geçmez; ürün sahibi sıralaması [F5 raporu §1](rapor-F5.md) ile birleştirilir.

## 7. F6 doğrulama ve kalan borçlar

**Süreç.** O1 tespit ve kararlar (W135 #119, WT1 açık tema v85 #121, W134 #120), O2a W136 veri katmanı (#122), O2b W141 (#123), W139 (#124), W137 (#125), W138 (#126), W140 (#127), O3 W142 entegrasyon (#128, birleşti `a3b31e3`). Ayrıntı ve hash'ler: [ilerleme](../yurutme/web-6/ilerleme.md). Son tam paket (W142, #128): 658 dosya / 4590 test; entegrasyon 97 test (reports-\* 65, home-\* 22, menu-roles-shell 10; bu belge yazılırken yeniden koşuldu, hepsi geçti); `e2e/reports.spec.ts` 3/3 sahte `/v1` ile.

**W142 kusurları** (düzeltildi, test sabitledi): 1 `ReportActionButton` kilitli/devre dışıyken yuva etiketi (`95fe33f`); 2 01g "Tetikleyiciler" notu üretimde (`79a0972`); 3 `?gorev=` ile başka birimin görevi 404 (`4435b5e`); 4 `work ↔ reports` modül döngüsü (`2d00088`); 5 390 px bölüm penceresi (`e3448b3`).

**Kalan borçlar:** gerçek cihaz ekran okuyucu (W136–W142); gerçek sunucu bilet tanığı (W144); E-13-72 dosya boyutu; yönetici üye merceğinde başka birim görevine derin bağlantı (`reports-task.test` "mercek ≠ yetki" ikinci yarısı çıkarıldı, araştırılmadı); E-13-10 ZIP onayı (BE-120/124 ile); 390 px ZIP/yükle düğmesi genişliği; E-K1-17/18 iade gerekçesi (BE-139); kâğıt 880/10,5 pt; gerçek backend e2e ilk CI koşumu. Tam liste: [ilerleme "F7'ye devredilenler / borçlar"](../yurutme/web-6/ilerleme.md).
