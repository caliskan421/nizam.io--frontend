# 13 — Backend eksikleri (ne yok)

Her satır bir tasarım öğesidir; backend'de karşılığı yoksa burada durur. Yeni kimlikler **BE-122…BE-136** olarak `../../backend-eksikleri/kayit.md` sonuna yazıldı (W134; koordinatör kimlik bloğu, `web6-kararlar.md`). Kararlar `P46–P53`: **"Backend dursun" (P46):** F6'da backend paketi açılmaz; bütün eksikler kayıtta `açık` kalır, ekranda statik/devre dışı/gizli çalışır (`../ortak-kurallar.md` §3, §4). `designStub` yalnız uygulanmış arayüzde var olan kabul edilmiş işlev eksiğine bağlanır: **stub sütunu** her satırda söylenir.

## 1. Mevcut kayıtla eşleşenler
| Kimlik (E-) | Öğe | BE-NNN / GAP | Kayıttaki tanım yeterli mi? | Düzeltme önerisi |
|---|---|---|---|---|
| E-13-09, E-13-10, E-13-11 | Dönem arşivi ZIP (yönetici başlıksız) | BE-120 | Evet: `archiveFullZip` S3, yönetici başlıksız çağıramaz; `designStub('BE-120')` mevcut | Ek: P49 ile düğme adı "Dönem arşivi (ZIP)"; ZIP'te raporlar yok → yeni BE-124; ZIP audit'i doğrulanamadı (dogrulama #6) |
| E-13-33, E-13-51, E-13-52 | Görev kısa kodu / sıra numarası | BE-005 | Evet (kod/sıra yok) | Ek kapsam: `reportMeetingDetail.notes[].converted_task_*` ve `ReportTask` da kod taşısın; kapanana dek kod sütunu gizli |
| E-13-28, E-13-86 | Gantt | BE-057 | Kısmen: dışa aktarım ucu (03c); dönem PDF'inde Gantt sayfası da bu eksiğe bağlanır | BE-057 satırına "dönem PDF Gantt sayfası (13 Raporlar, BE-123)" bağı (koordinatör) |
| E-13-32 | Kart/bölüm durum çubuğu (onayda/iade) | BE-078 | Evet; bu grupta `tasks` istemci sayımıyla çözülür, BE-078'e dokunmaz | Ek gerekmez |
| E-13-32 | Bölüm üye adları | BE-079 | Evet (`members: ReportPerson[]`) | Dönem raporu `coordinatorship_performance` için de geçerli |
| E-13-27, E-13-32 | Departman `meeting_count` | GAP-221 (pin belgesi; `kayit.md`'de satır yok) | Pin belgesinde bilinen sınır | Bu grupta **dönem raporundan** okunur (dolu); pano `meeting_count`'u 0'dır → kullanılmaz. Kayıt satırı gerekmez |
| E-13-81 | Koordinatör birim raporu (08b E-08-89) | 08 README: "uç yok, kayda gerek yok" | Artık **kayıt gerekir** | Yeni BE-128; 08 README E-08-89 satırı koordinatörce BE-128'e bağlanır (bu işçi 08'e dokunmaz) |
| E-13-85 | Son raporlar (audit okuma) | BE-030, BE-091 | Kısmen: audit okuma P1–P6 şemsiyesi | Yeni BE-130 ek tüketici; BE-091 bağı |
| E-13-31, E-13-34…36 | Dönem raporu JSON zenginliği | BE-036 (belge paketi) | Hayır: alanlar yok (belge değil) | Yeni BE-136 |
| E-13-26, E-13-62 | Dağılım anahtarları, `total` anlamı | BE-036 (belge paketi, madde 2/3) | Kısmen: `meeting_count`/`deleted_records` anlamı yazılı; dağılım anahtar kümesi ve `total` yazılı değil | Yeni BE-133 (belge), BE-134 |

## 2. Yeni eksik önerileri
Son sütun `kayit.md` kimliğidir. "Stub" sütunu: ekranda var olan kabul edilmiş işlev eksiği için `designStub`; yoksa "—".

| Geçici ad | Kimlik (E-) | Öğe | Eksik (uç/alan/kural) | Şimdilik (statik / devre dışı / gizli) | Stub | Bağ | Boyut | Gerekçe | Kimlik |
|---|---|---|---|---|---|---|---|---|---|
| yeni-1 | E-13-03, 04, 05 | Dönem PDF bölüm seçimi ve koordinatörlük süzgeci | `reportSeasonPdf` parametresiz; `sections` (kapalı küme: özet, gantt, genel, koordinatörlük bölümleri + alt kümeler, ek) ve `department_ids` yok; "içindekiler seçilenleri listeler" kuralı da | pencere çizilir, hepsi seçili = düz indirme canlı; kutu kaldırılınca "Seçilenleri indir" devre dışı "yakında" | `designStub('BE-122')` | P48 | M | ürün sahibi kararı: tam rapor varsayılan, bölüm seçimi pencerede | BE-122 |
| yeni-2 | E-13-14…38 | Dönem PDF şablonunun 01f'ye göre yeniden yazımı | v0.15 `season.go` (DejaVu, dokuz bölümlü sade tablo) → hedef: kapak bandı + KPI, tıklanabilir içindekiler/yer imi, yönetici özeti dağılımları, Gantt sayfası, Teknofest geneli, koordinatörlük bölümleri (görev tablosu, görev detay kartları, notlar+bayrak, tarih talepleri, toplantılar, dosya grupları), iş yükü, ek sözlük; eski Teknofest R1 v2 içeriği referans (`RAPOR-eski-raporlar.md` §1) | mevcut PDF indirilir; önizleme hedef düzenin canlı bölümlerini çizer ve "indirilen PDF daha sade olabilir" notu | `designStub('BE-123')` yalnız Gantt yer tutucusunda (E-13-28) | P48, P51; BE-122, BE-136, BE-057; GAP-044 | L | hedef rapor tasarım dilidir | BE-123 |
| yeni-3 | E-13-09, 10 | ZIP içine raporlar | `archiveFullZip` yalnız dosya ağacı; hedef (eski R3): kök `<Program>-Donem-Arsivi-YYYY-MM-DD/`, `00-Genel/Donem-Raporu.pdf`, `NN-<koordinatörlük>/` (kendi raporu + `Dosyalar/<görev>/…`), `EKSIK-DOSYALAR.txt`, `HATA.txt`; birim raporu BE-128 ile | ZIP devre dışı (BE-120); onay penceresinde ağaç satırları yok | `designStub('BE-120')` (BE-124 ayrı stub almaz) | P49; BE-120, BE-123, BE-128 | M–L | ürün sahibi kararı: raporlu dönem arşivi | BE-124 |
| yeni-4 | E-13-52 | Toplantı PDF "göreve dönüştürülenler" | v0.15 `meeting.go` not başlığında "· Göreve dönüştürüldü" yazar; 01g'deki tablo (NOT · GÖREV · DURUM) ve "→ görev" satırı yok; JSON'da görev durumu/kodu yok (`converted_task_status`, kod önerisi) | önizleme tablosu NOT + GÖREV başlığıyla canlı, DURUM gizli | — | P50; BE-005 | S | ürün sahibi kararı (P50) | BE-125 |
| yeni-5 | E-13-82 | HTML sürüm rapor | `format`/HTML uç yok (eski R2 etkileşimli HTML; ZIP içi `Donem-Raporu.html`) | çizilmez (01e/01h dar ekranı uygulanmıyor) | — | P51; BE-123 | L | tasarımda çizildi, uç yok | BE-126 |
| yeni-6 | E-13-83 | Tarih aralığı ve departman süzgeci | hiçbir rapor ucunda `from`/`to`/`department_id` yok (dönem = program tamamı) | çizilmez (01e "Rapor kapsamı" kartı yok); yalnız bölüm penceresindeki çipler statik (BE-122) | — | P51; BE-122, BE-128 | M | "bu ay"/"yalnız ALT" raporu | BE-127 |
| yeni-7 | E-13-81 | Koordinatör birim raporu | REPORTING-K01: pano/iş yükü/dönem yalnız ŞY; K için kendi departmanı iş yükü/özet PDF'i yok (08b E-08-89, 01h K bağlamı) | gizli | — | P51; E-08-89; BE-127 | M | 08b "Birim raporu (PDF)" | BE-128 |
| yeni-8 | E-13-84 | CSV/XLSX dışa aktarım | yalnız PDF; `format` yok | çizilmez (iş yükü sekmesi uygulanmıyor) | — | P51 | S–M | 01h "CSV / XLSX yakında" | BE-129 |
| yeni-9 | E-13-85 | Son raporlar / rapor geçmişi | `reporting.report_downloaded` audit yazılıyor ama okuma ucu yok | çizilmez; sahte liste yok (§4) | — | P51; BE-030, BE-091 | S–M | 01e "Son raporlar" kartı | BE-130 |
| yeni-10 | E-13-68 | Asenkron üretim / ilerleme / boyut tahmini | PDF senkron, bellekte; ilerleme, iptal, iş kuyruğu, tahmini boyut yok | "ilerleme yakında" rozeti, belirsiz şerit; sayaç yok | `designStub('BE-131')` | P51; GAP-044 | L | 01h "Rapor hazırlanıyor… ilerleme yakında" | BE-131 |
| yeni-11 | E-13-39, 40 | Dönem/iş yükü JSON kesme/sayfalama bildirimi | `SeasonReport.tasks`/`WorkloadReport.members` tam küme; `X-Result-Truncated`/imleç tanımsız (20000 görevde büyük yanıt) | 01f tam okur; zaman aşımı/hata kartı | — | P51 (aday 6); GAP-044 | S–M | büyük programda sessiz riskler | BE-132 |
| yeni-12 | E-13-26 | Dağılım anahtar kümesi şemada | `task_status_distribution`/`priority_distribution` `additionalProperties`; kod beş durumu/dört önceliği (0 dahil) **daima** döndürüyor (doğrulandı) → şemaya `enum`/`required` | istemci sabit anahtar sırası | — (belge) | BE-036 (belge paketi) | S (belge) | şema ↔ davranış | BE-133 |
| yeni-13 | E-13-31, 59 | İş yükü JSON sayaçları ve `total` anlamı | `reportWorkload`'da üye başına açık/geciken/tamamlanan/onayda sayaç ve üye süzgeci yok (PDF'te var); `total` = üye sayısı (kodda `len(members)`), `reportDashboardTasks.total` kesme öncesi sayı (kodda `len(views)`) — şemada anlam yok | 01f iş yükü yer tutucu; 05'te `reportWorkload` okunmaz (P52) | `designStub('BE-134')` (01f iş yükü bölümü) | P51 (aday 8); BE-036 | S–M | 01f iş yükü tablosu | BE-134 |
| yeni-14 | E-13-69, 71 | 503 `capacity_full` ve 429 `export_in_progress` `Retry-After` | 503'te `Retry-After` yok (slot bekleme tavanı 12 sn); 429 `export_in_progress` `Retry-After` kodda sabit 1 sn (gerçek kalan süre değil) → tasarım "(15 sn)"/"27 saniye" sunucudan gelmez; öneri: 503'e başlık, 429'a gerçek kalan süre ya da belge | sayı yalnız başlık varsa gösterilir | — | REPORTING-K10 | S | durum kartı doğruluğu | BE-135 |
| yeni-15 | E-13-06, 07, 20…23, 25, 27, 29, 30, 32…36, 38 | 01f önizleme için dönem JSON alanları | `SeasonReport`'ta: program dönem aralığı ve konum, koordinatörlük başına dosya sayısı/boyut ve dosya listesi, görev açıklaması/bağımlılık adı/not (bayrak, paylaşılan)/tarih talebi ayrıntısı, toplantı listesi + gündem/not, iş yükü özeti, "ortalama kayma", "en çok talep alan görevler", gündem toplamı (a/b), toplam dosya boyutu, aylık aktiviteye not/dosya/tarih talebi, sayfa/boyut tahmini yok | ilgili bölümler statik yer tutucu (sahte veri yok) | `designStub('BE-136')` (E-13-34, 35, 36) | P48; P51; BE-005, BE-079; GAP-221 | L | 01f hedef içerik | BE-136 |

## 3. Kısmi karşılıklar
- **Önizleme ↔ PDF farkı (BE-123/BE-136):** 01f hedef PDF içeriğini çizer; canlı veri yalnız `reportSeason`'ın taşıdığı kadardır, indirilen v0.15 PDF'i daha sadedir. Kullanıcıya önizleme alt notuyla söylenir (E-13-18); bölüm yer tutucuları sahte değer göstermez.
- **Toplantı notu dönüşümü:** PDF'te rozet var (`· Göreve dönüştürüldü`), tablo yok; önizleme (JSON) başlıkla canlı, durum yok (BE-125).
- **Bölüm seçimi:** "tam rapor" = çalışan tek davranış; seçim varyantı yok (BE-122).
- **İş yükü:** PDF tam (kişi KPI + görev tablosu + gruplar); JSON'da özet sayaç yok → 01f'de iş yükü bölümü statik.
- **Birim raporu:** yalnız ŞY'ye `reportWorkload`/dönem; K için "birim raporu" yok; K'nin yalnız tek görev/toplantı PDF'i vardır.
- **Koordinatör görev PDF'i dosya listesi içermez** (tasarım 01h kâğıdında DOSYALAR bölümü var): BE-123'e benzer ayrı PDF şablon işi; ayrı kimlik açılmadı, `BE-136`'nın "görev PDF" notu olarak izlenir.

## 4. Yol haritası kararıyla çelişenler
- **K14 / P47:** Raporlar sayfası ve menü girişi v1/F6 dışıdır (ürün sahibi kararı); çizilmiş 01e/A5 ve sekmeleri uygulanmaz.
- **K3 (fan-out):** 01f'de ikinci ağır JSON (`reportWorkload`) ve görev başına `reportTaskDetail` toplu okuması yapılmaz; tek ağır okuma `reportSeason` (§9: kullanıcının açtığı tek kayıt ek okuması izinli, toplu değil).
- **Kapsam (P46):** F6'da backend paketi açılmaz; BE-122…BE-136 `açık` kalır, "rapor-F6.md"ye yazılır (koordinatör).
- **P38:** 01i hücre A'daki "Kurumsal hafıza · …" alt başlığı yürürlükte değildir.

## 5. Önerilen backend iş paketleri (rapor-F6 için ham madde; backend dursun)
1. **Rapor pdf şablonu (L):** BE-123 (+ BE-122, BE-136, BE-057 Gantt) — dönem PDF'i 01f'ye; en büyük kalem; bölüm seçimi ve JSON zenginliği birlikte tasarlanmalı.
2. **ZIP (M–L):** BE-120 (yönetici başlıksız) + BE-124 (raporlar) + BE-128 (birim raporu) birlikte.
3. **Toplantı/görev PDF küçük işler (S):** BE-125 (+ BE-005 kod), görev PDF'ine dosya listesi (BE-136 notu).
4. **Sözleşme doğruluğu (S):** BE-135 (`Retry-After`), BE-133 (şema), BE-134 (JSON sayaç/`total` belgesi), BE-132 (kesme).
5. **Ek biçimler (L, sonra):** BE-126 HTML, BE-129 CSV/XLSX, BE-130 son raporlar (audit okuma P1–P6 ile), BE-131 asenkron üretim, BE-127 tarih aralığı/departman süzgeci.
Sıra önerisi: 4 → 3 → 1 (+2 paralel) → 5.

## 6. E-kimliği kapsam dizini (hangi E-13 satırı hangi kayda dayanır)
| Kimlik | Öğe | Karar | BE bağı |
|---|---|---|---|
| E-13-01 | 06 başlık eylem şeridi | kabul (P47, P49) | BE-120 |
| E-13-02 | "Dönem sonu raporu (PDF)" düğmesi | kabul (P47, P48) | — |
| E-13-03 | "Bölüm seç…" düğmesi (bitişik ikon düğme) | kabul (P48) | BE-122 |
| E-13-04 | Bölüm seçimi penceresi | kabul (P48) | BE-122, BE-123 |
| E-13-05 | Koordinatörlük süzgeci çipleri ("Tümü" + kodlar) | geçici kabul (koordinatör varsayılanı: çip kaynağı) | BE-122 |
| E-13-06 | Pencere özeti ("≈ 14 sayfa · 11 koordinatörlük") | geçici kabul | BE-136 |
| E-13-07 | Dosya adı / boyut / sayfa bilgi satırı ("donem-raporu-…pdf · 2,4 MB · 14 sayfa") | kabul (§4) | BE-136 |
| E-13-08 | "Önizle (01f)" bağlantısı | kabul (P47) | — |
| E-13-09 | "Dönem arşivi (ZIP)" düğmesi | kabul (P49) | BE-120, BE-124 |
| E-13-10 | ZIP onay penceresi (01h) | geçici kabul | BE-120, BE-124 |
| E-13-11 | ZIP "Kayda geçer (denetim)" rozeti | geçici kabul (doğrulanamadı) | BE-120 |
| E-13-12 | Dar ekran 390 px (Arşiv eylemleri, bölüm seçimi) | geçici kabul (ortak duyarlı kurallar) | — |
| E-13-13 | 01f rota, kabuk ve kırıntı | geçici kabul (rota önerisi, K10) | — |
| E-13-14 | Başlık ve alt başlık | geçici kabul | BE-123 |
| E-13-15 | Önizleme araç çubuğu (sayfa, yakınlaştırma, yazdır) | geçici kabul (yakınlaştırma); öneri (yazdır) | — |
| E-13-16 | "PDF indir" (primary) | kabul (P47) | — |
| E-13-17 | "Kapat" bağlantısı | kabul | — |
| E-13-18 | Önizleme alt notu | geçici kabul | BE-123 |
| E-13-19 | Kâğıt teması | geçici kabul (01h kural kartı) | — |
| E-13-20 | Kapak bandı | geçici kabul | BE-136 |
| E-13-21 | Kapak "DÖNEMİN ÖZETİ" tarih aralığı | kabul (§4) | BE-136 |
| E-13-22 | Kapak KPI kartları (8) | geçici kabul | BE-136 |
| E-13-23 | Kapak kapsam notu ve amblem | geçici kabul | — |
| E-13-24 | İçindekiler | geçici kabul | BE-136 |
| E-13-25 | Yönetici özeti bandı ve KPI (8) | geçici kabul | BE-136 |
| E-13-26 | Durum ve öncelik dağılımı | kabul (P48) | BE-133 |
| E-13-27 | Koordinatörlük karşılaştırması tablosu | geçici kabul | BE-136 |
| E-13-28 | Gantt — görev zaman çizelgesi bölümü | öneri (canlı çizim kodlanmaz) | BE-123, BE-057 |
| E-13-29 | Teknofest geneli bandı ve aylık aktivite | geçici kabul | BE-136 |
| E-13-30 | Tarih değişikliği talepleri | geçici kabul | BE-136 |
| E-13-31 | İş yükü bölümü (ilk 8 / N kişi) | öneri (reportWorkload tek ardışık okuma ürün kararı bekler) | BE-134 |
| E-13-32 | Koordinatörlük bölümü: bant, künye, KPI, durum şeridi | geçici kabul | BE-136, BE-079 |
| E-13-33 | Görev tablosu | geçici kabul | BE-005, BE-136 |
| E-13-34 | Görev detay kartları (açıklama, bağımlılık, notlar, tarih talepleri, dosyalar) | öneri | BE-123, BE-136 |
| E-13-35 | Toplantılar (bölüm başına kartlar) | geçici kabul (P52) | BE-136 |
| E-13-36 | Dosyalar (etikete göre gruplu tablo) | geçici kabul | BE-136 |
| E-13-37 | Ek: sözlük ve kurallar | geçici kabul | BE-123 |
| E-13-38 | Sayfa iskeleti (üst bilgi, altlık, sayfa x/y) | geçici kabul | — |
| E-13-39 | 01f durumları (yükleniyor, boş dönem, hata) | geçici kabul (K7 varsayılanı) | BE-132, BE-135 |
| E-13-40 | Veri tazeleme ve ağır okuma kuralı | geçici kabul (P52) | BE-131, BE-132 |
| E-13-41 | 09b başlık: "Toplantı raporu (PDF)" | kabul (P47, P50) | — |
| E-13-42 | 09b düğme ipucu | kabul | — |
| E-13-43 | "Önizle (01g)" bağlantısı | kabul (P47) | — |
| E-13-44 | K7 "Toplantı raporu (PDF)" düğmesi | kabul (P47) | — |
| E-13-45 | Silinmiş toplantı | geçici kabul | — |
| E-13-46 | 01g rota, kabuk ve kırıntı | geçici kabul (rota önerisi) | — |
| E-13-47 | 01g araç çubuğu | geçici kabul | — |
| E-13-48 | Künye bandı | kabul (P50) | — |
| E-13-49 | Katılımcılar ve "Koordinatörlük üyeleri de dahil" rozeti | kabul (P50) | — |
| E-13-50 | Gündem "a/b görüşüldü" ve maddeler | kabul (P50) | — |
| E-13-51 | Notlar — zaman akışı | kabul (P50) | BE-005 |
| E-13-52 | "Göreve dönüştürülenler" tablosu (NOT · GÖREV · DURUM) | kabul (P50) | BE-125, BE-005 |
| E-13-53 | 01g altlığı ("Sayfa 1 / 1 · RoketPortal · tarih") | geçici kabul | — |
| E-13-54 | "Tetikleyiciler 3" kartı (Raporlar › Toplantı raporları sekmesi) | ret (P47, P52) | — |
| E-13-55 | 03 görev ayrıntı paneli: "Görev raporu (PDF)" | kabul (P47) | — |
| E-13-56 | K3 görev paneli: "Görev raporu (PDF)" | kabul (P47) | — |
| E-13-57 | Görev raporu önizlemesi (01h kâğıdı, "Görev raporu önizlemesi (01h)" bağlantısı) | ret (P52) | — |
| E-13-58 | Silinmiş görev | geçici kabul | — |
| E-13-59 | 05 başlık: "İş yükü raporu (PDF)" / "Seçilenlerin iş yükü (PDF) · N" | kabul (P47) | — |
| E-13-60 | Satır başı onay kutuları ve "Tümünü seç" | geçici kabul (seçim kapsamı) | — |
| E-13-61 | Seçim çubuğu ("N üye seçili · Seçimi temizle") | geçici kabul | — |
| E-13-62 | Seçilemeyen satırlar (ekip dışı hesap) | geçici kabul (doğrulanacak: ekip üyeliği satır alanı) | — |
| E-13-63 | İş yükü PDF kâğıt önizlemesi (01h/01i) | ret (P52) | — |
| E-13-64 | 05b "Kişisel rapor" (E-05-47) | geçici kabul | — |
| E-13-65 | 01 "Rapor oluştur" yönlendirme menüsü | kabul (P47) | — |
| E-13-66 | K1/Ü1 ve K/Ü mercekleri: rapor girişi | kabul (P53, P1) | — |
| E-13-67 | "Koordinatör varsayılanı (karar ister)" kartı | ret (P53) | — |
| E-13-68 | "Rapor hazırlanıyor…" durumu | kabul (P47); geçici kabul (iptal) | BE-131 |
| E-13-69 | 429 `reporting.export_in_progress` kartı | geçici kabul | BE-135 |
| E-13-70 | 429 `platform.rate_limited` kartı | geçici kabul (K7 varsayılanı) | — |
| E-13-71 | 503 `reporting.capacity_full` kartı | geçici kabul | BE-135 |
| E-13-72 | "İndirildi" bildirimi | geçici kabul | — |
| E-13-73 | Diğer hatalar | geçici kabul (K7 varsayılanı) | — |
| E-13-74 | Bilet kuralı | kabul (ADR-0013) | — |
| E-13-75 | Odak dönüşü | kabul (KESİN 27) | — |
| E-13-76 | Kenar menüsünde "Raporlar" öğesi ve `/raporlar` rotası | ret (P47) | — |
| E-13-77 | 01e / A5 rapor merkezi (`Raporlar`, `Raporlar-Acik`) | ret (P47, P52) | — |
| E-13-78 | Sekmeler (Dönem raporu · İş yükü · Görev raporları · Toplantı raporları) ve 01h sekme içerikleri | ret (P52) | — |
| E-13-79 | Pano/liste/detay JSON uçları rapor eylemlerinde | ret (P52) | — |
| E-13-80 | Üye: hiçbir rapor eylemi | kabul (P47; REPORTING-K01/K07) | — |
| E-13-81 | Koordinatör "Birim raporu (PDF)" (08b E-08-89, 01h koordinatör bağlamı) | kabul (P51) | BE-128 |
| E-13-82 | "HTML sürüm" düğmesi | kabul (P51 — yer yok) | BE-126 |
| E-13-83 | Tarih aralığı ve koordinatörlük süzgeci (01e "Rapor kapsamı" kartı) | kabul (P51 — yer yok) | BE-127 |
| E-13-84 | "CSV / XLSX" (01h iş yükü sekmesi) | kabul (P51 — yer yok) | BE-129 |
| E-13-85 | "Son raporlar" kartı (01e) | kabul (P51 — yer yok; §4) | BE-130 |
| E-13-86 | 03c/K6 Gantt "Dışa aktar (PDF)" ve 05b/08b diğer rapor düğmeleri | kabul (P19) | BE-057 |
