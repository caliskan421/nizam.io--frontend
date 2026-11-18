# F12 keşif — 72 açık kayıt bağımsız yayımlı sözleşme eşlemesi (2026-11-18)

**F12 uygulama güncellemesi:** Aşağıdaki72satır ilk keşif anının eşlemesidir; aday sözcüğü tarihsel sınıflamadır. Pin183 v028'e birleşti. Mevcut06 dağılım ve01f dönem/konum/not/ok tüketimi542f2ee3 ile hazır, bağımsız gerçek kabul tamam; geniş BE025/123/136 kalan gereksinimleriyle açık/kısmi kalır. Final Opus/özellikCI-merge beklenir. Yeni faz/diğer adaylar başlatılmaz.

**Kapsam seçimi değildir.** Referans frontend main 7ef529b5, pin v0.26; yerel yayımlı backend tags v0.26/v0.27/v0.28, `docs/api/openapi.yaml` + error-codes ve etiketli ilgili README. Backend plan-BE8 yalnız yön gösterir, planı yayımlı kanıt yerine koymadım. 72/72 açık satır aşağıda tek tek: A28 mevcut yüz aday; K kısmi; Ü27 yayımlı ama ürün kapılı; Ü yeni ekran/ürün kapısı; B backend açığı veya ayrıca kanıt gerekir. B/Ü beraber olabilir. Her satırdaki v26→v28 yok ifadesi ilgili delta taramasıdır; bütün eski sözleşmenin her sözcüğüne yönelik mutlak yokluk garantisi değildir.

## Yayımlı delta ve pin riski

v26 293 op/372 schema → v27 294/372: yalnız `getFileThumbnail` S3 (BE-026), 422 records.preview_unavailable; png/jpeg/pdf JPEG türev, 404 kapsam/görünürlük, 429 rate/busy, blob ömrü ve `img-src blob:`. v28 297/379: `summarizeAuditEntries`, `listAuditActionTypes`, `exportAuditEntries`; mevcut `listAuditEntries`, `departmentDeleteImpact`, `reportSeason`, `reportSeasonPdf` değişti. Hiç operasyon kaldırılmadı. v28 7 yeni şema: AuditCategory, AuditCountBucket, AuditSummary, AuditActionType, AuditActionTypeList, ArchiveStorageType, ArchiveStorageTag. `AuditEntry` 5 yeni required-nullable/durum alanı category/work_item_id/target_name/client_ip/client_agent; Program period_start_on/end_on/location required, WorkItemNote flag/shared required, ArchiveFolderTotals by_type/by_tag required, ReportTaskNote flag/shared required, SeasonReport program_location/gantt_edges required; create/update isteminde yeni alanlar opsiyonel. SeasonPeriod.source enum genişlemesi (tag ADR gerekçesi) ve SeasonTaskDetail recent_notes değişimi var. Üretim tip/default/fixture uyumu pin PR'ında gerçek şemayla sağlanmalı, eski istemci uydurmaz.

Hata listesi tag diff: v27 `records.preview_unavailable` 422; v28 `audit.export_too_large` 422, `audit.subject_not_found` 404, `audit.summary_unavailable` 503 ve program.input_invalid fields program.invalid_location/invalid_period. Her uçtaki mevcut 401/403/404/409/422/429/503/Retry-After ayrıca korunur. Audit: S1 program_id query zorunluluğu yönetici dışı; görev görünürlüğü ve null hedef/yalnız admin IP; `summary` fasetleri kendi filtresini dışlar, 30gün zaman filtresinden bağımsız; export bilet/10000/rol kapsamı. Bunlar UI/fixture hata/oturum test kapılarıdır.

**BE-164 kapalı:** v28 `departmentDeleteImpact?program_id` daraltır, mevcut F11 tekil kalıcı silme şirket geneli olduğundan program filtresi buraya taşınırsa yanıltır. BE-163 `purgeAllDepartments?scope=program` aday kümesi, tekil silme hâlen bütün programları etkiler. Yeni alanın başka ürün kullanımını ayrıca seçmek gerekir; kapalı satırı otomatik yeniden açma yok.

**Önerilen ilk paket (kesin değil):** v26→v28 tek pin/üretilmiş tip+zorunlu alan/enum/hata/fixture uyumu; ardından mevcut 06 storage breakdown BE-025 ve mevcut 01f dönem raporu BE-136 yalnız karşılanan kısımları, ayrı işçi sınırlarıyla. BE-026 thumbnail yayımlı olsa da P45 GAP-233 dışarıda kararı nedeniyle ayrıca ürün/kapsam kararı olmadan alınmaz. Pencere/rol kuralları hazırsa 03 görev etkinliği BE-007 ve 01 son işlemler BE-010/091 küçük ayrı paket; bunlar yeni 01b audit ekranını zorunlu kılmaz. 08b birim PDF BE-128 ve 01b audit BE-030/087–092 ayrı ürün/ekran kapsam kararı gerektirir. P21/W7 konferans, Tablolar, Ü7 ve yeni paneller kapsam seçilmeden açılmaz. Teknik pin ve ürün kapsamı kararı root'a aittir.

## Satır bazında matris

| Kayıt | Mevcut ekran / öğe | Karar | Yayımlı durum, gereken sözleşme ve kapı |
|---|---|---|---|
| BE-004 | 03 Görevler › Liste — Arama kutusu | B | v26/v27/v28 görev listesi q/aday dizini/sort talepleri delta değil; ilgili sözleşme alanı yok. Yeni backend işi; 03 mevcut ekran. |
| BE-006 | 03 Alt görev formu — Alt görev başına "kanıt zorunlu" | Ü | Alt görev kanıt/takvim davranışı ADR-0024 ve açık ürün kararı gerektirir; v28 delta çözmüyor. Mevcut form/Gantt, ürün kapısı. |
| BE-007 | 03 Ayrıntı paneli — İlerleme / etkinlik zaman çizgisi | A28 | listAuditEntries?program_id&work_item_id, görev görünürlüğü, yok/erişimsiz 404 audit.subject_not_found; 03 mevcut panel etkinlik aday, rol/scope testleri şart. |
| BE-009 | 01 Ana sayfa — Koordinatör/üye KPI ve kuyrukları | B | v26 core work counts var; mevcut K/Ü KPI/özel kuyruk ihtiyaçları için v28 audit delta yeni pano sayacı getirmez; kalan talepler ayrıştırılmalı. |
| BE-010 | 01 Ana sayfa — "Son işlemler" akışı | A28 | listAuditEntries program/limit=10 + rol kapsamı; K/Ü mevcut ana sayfa etkinlik kartı aday, F12 kapsam kararı gerekir. |
| BE-013 | 05 Kullanıcılar — Şifre sıfırlama bağlantısı / davet bağlantısı | B | Parola güncelleme var; davet/e-posta bağlantısı v28 delta değil, backend ve teslim politikası gerekli. |
| BE-015 | 05b Kişisel takip — "Etkinlik" sekmesi | A28 | listAuditEntries rol kapsamlı/kendi eylemleri; 05b etkinlik tüketimi aday; kişi başına kapsamı ürün/yetkiyle doğrula, tüm geçmiş vaadi yok. |
| BE-016 | 08 Koordinatörlükler — Üst birim ağacı, "Yapı" görünümü, alt birimler | Ü | Hiyerarşi/aktif-pasif/birleştirme/toplu taşıma v28 delta değil; v1 düz ve ürün kararları geçerli; backend+ürün işi. |
| BE-017 | 08 Koordinatörlükler — Aktif/pasif, pasifleştir, birleştir, toplu üye taşı | Ü | Hiyerarşi/aktif-pasif/birleştirme/toplu taşıma v28 delta değil; v1 düz ve ürün kararları geçerli; backend+ürün işi. |
| BE-018 | 08b Koordinatörlük detayı — Görünürlük ayarı, kuruluş tarihi, son etkinlik | K28 | listAuditEntries department ile birim etkinliği kısmen aday; görünürlük/tarihsel kuruluş GAP-240 açık, 08b ekranı ve rol yetkisi gerekir. |
| BE-020 | 03d Alt görevli Gantt — Tarihli alt görev çubukları, "ana görevin dışına taşmaz" | Ü | Alt görev kanıt/takvim davranışı ADR-0024 ve açık ürün kararı gerektirir; v28 delta çözmüyor. Mevcut form/Gantt, ürün kapısı. |
| BE-022 | 09b Toplantı detayı — Canlı bağlı kişi sayısı | Ü | v26 MeetingSummary.connected_count/conference_status ve konferans özeti mevcut; P21/W7 konferans görünürlük kapısı; “bekliyor” enumdan türetilmez. |
| BE-024 | 06 Arşiv — Özel etiket oluşturma | B | records tag kapalı küme; özel etiket renk/ad/listesi v28 delta değil, backend gerekli. |
| BE-025 | 06 Arşiv, 07 Klasör, 01 Ana sayfa, 08 Koordinatörlükler — Klasör kartı özeti, depolama özeti, son yükleme zamanı | A28 | F12 mevcut06 by_type/by_tag dağılımı tüketir, runtimeBE025 stub kalktı; yükleme olay geçmişi/GAP240 ve geniş kayıt ayrı/açık. |
| BE-026 | 07 Klasör — Dosya önizleme/küçük resim | Ü27 | getFileThumbnail S3 Bearer + program/departman, JPEG PNG/JPEG/PDF, 422 records.preview_unavailable ikon fallback; 07 mevcut grid; P45 GAP-233 dışarıda kararı nedeniyle yeni ürün/kapsam onayı gerekli; 429/404/blob iptal-güvenlik şart. |
| BE-030 | 01b İşlem geçmişi — Ekranın tamamı | Ü28 | Audit şemsiye: v28 listAuditEntries/summary/action-types/export rol kapsamlı; ayrı 01b ekran tasarımı/kapsam kararı gerekir; alt satırları ayrı değerlendir. |
| BE-031 | 11–11e Tablolar — Modülün tamamı | Ü | Tablolar şemsiye: v26+ tables uçları mevcut (listTables/getTable/applyTableOperation vd); yeni 11–11e modül/ürün kapısı, alt özellikler tam eşit değil. |
| BE-032 | Kenar menüsü — Takvim | Ü | Takvim/kurumsal hafıza/simülasyon/bütçe modülleri v28 delta değil; yeni ekran + ürün kapsamı, gereken backend sözleşmesi ayrı. |
| BE-033 | Kenar menüsü — Kurumsal hafıza | Ü | Takvim/kurumsal hafıza/simülasyon/bütçe modülleri v28 delta değil; yeni ekran + ürün kapsamı, gereken backend sözleşmesi ayrı. |
| BE-034 | Kenar menüsü — Simülasyon (beta) | Ü | Takvim/kurumsal hafıza/simülasyon/bütçe modülleri v28 delta değil; yeni ekran + ürün kapsamı, gereken backend sözleşmesi ayrı. |
| BE-035 | Prototip — Bütçe, talep → onay zinciri, satın alma | Ü | Takvim/kurumsal hafıza/simülasyon/bütçe modülleri v28 delta değil; yeni ekran + ürün kapsamı, gereken backend sözleşmesi ayrı. |
| BE-036 | 03, 01, 05, 08, 09, 06, Kabuk — Belge paketi (sözleşmede yazmayan alan anlamları ve kurallar) | K | Eski 11 maddelik belge paketi: bazıları zaten önceki pinle belgeli; v28 tek diff tümünü kapatmaz. Madde madde güncel sözleşme/kanıt ayrı kontrol; kod işi varsayma. |
| BE-037 | Kabuk (güncelleme gerekli kapısı) — "Güncelleme gerekli" ekranı | B | InstanceProfile minimum_web_version v28 delta değil; sürüm politikası/alanı gerekli, api_version ana sürüm kapısı mevcut. |
| BE-039 | 03 Görevler › Liste — Kişi süzgecinin seçenek listesi | B | v26/v27/v28 görev listesi q/aday dizini/sort talepleri delta değil; ilgili sözleşme alanı yok. Yeni backend işi; 03 mevcut ekran. |
| BE-040 | 03 Görevler › Liste — Sıralama düğmeleri (görev · durum · bitiş) | B | v26/v27/v28 görev listesi q/aday dizini/sort talepleri delta değil; ilgili sözleşme alanı yok. Yeni backend işi; 03 mevcut ekran. |
| BE-046 | 05b Kişisel takip — Dosyalar sekmesi ve sayacı | B | Kişi bazlı S2 dosya, manageable yetkisi, yönetici dışı program ekip özeti tam talepleri v28 delta değil; mevcut parçalar tam kapsam değildir. |
| BE-047 | 05 Kullanıcılar, 08b Üyeler — Koordinatör için hesap/üyelik eylemlerinin görünürlüğü | B | Kişi bazlı S2 dosya, manageable yetkisi, yönetici dışı program ekip özeti tam talepleri v28 delta değil; mevcut parçalar tam kapsam değildir. |
| BE-048 | 08 Koordinatörlükler (K/Ü), 09c kişi seçici çipleri — Birim kartında koordinatörler + üye sayısı; "N kişi davet edilecek" | B | Kişi bazlı S2 dosya, manageable yetkisi, yönetici dışı program ekip özeti tam talepleri v28 delta değil; mevcut parçalar tam kapsam değildir. |
| BE-054 | 03c Zaman çizelgesi — "İptal et" — bekleyen talebi geri çekme | B | Talep geri çekme/zincir geri alma/Gantt export/çok departmanlı görünüm/çapraz oklar v28 delta değil; farklı endpoint/ürün yetki kararı gerekir. |
| BE-055 | 03c Zaman çizelgesi — Uzatmanın / zincirin geri alınması | B | Talep geri çekme/zincir geri alma/Gantt export/çok departmanlı görünüm/çapraz oklar v28 delta değil; farklı endpoint/ürün yetki kararı gerekir. |
| BE-057 | 03c Zaman çizelgesi — Gantt PDF / görsel dışa aktarım | B | Talep geri çekme/zincir geri alma/Gantt export/çok departmanlı görünüm/çapraz oklar v28 delta değil; farklı endpoint/ürün yetki kararı gerekir. |
| BE-058 | 03c Zaman çizelgesi — Koordinatörün birden çok departmanı tek Gantt'ta | B | Talep geri çekme/zincir geri alma/Gantt export/çok departmanlı görünüm/çapraz oklar v28 delta değil; farklı endpoint/ürün yetki kararı gerekir. |
| BE-059 | 03c Zaman çizelgesi — Koordinatör yüzünde departmanlar arası bağ okları | B | Talep geri çekme/zincir geri alma/Gantt export/çok departmanlı görünüm/çapraz oklar v28 delta değil; farklı endpoint/ürün yetki kararı gerekir. |
| BE-062 | 09 Toplantılar — Listede "Canlı" / "Bekliyor" durumu | Ü | v26 MeetingSummary.connected_count/conference_status ve konferans özeti mevcut; P21/W7 konferans görünürlük kapısı; “bekliyor” enumdan türetilmez. |
| BE-064 | 09b — Katılımcı rolü ve departmanı | Ü | Participant.teams[] v26'da var; çok departmanlı gruplama ürün/tasarım kararı gerekiyor, v28 ile otomatik kapanmaz. |
| BE-066 | 09c Toplantı formu — Çoklu katılımcı ekleme ve kişi bazında neden | B | Toplu katılımcı ve kişi bazlı neden v28 delta değil; mevcut tekil uç ve kısmi başarısızlık ayrı değerlendirme. |
| BE-078 | 01 Ana sayfa (koordinatörlük kartları) — Kart durum çubuğu ve satırı: "onayda" / "iade" | B | CoordinatorshipStat istenen durum sayaçları/tüm üye avatar kümesi v28 delta değil; mevcut coordinators/member_count bu kapsamın tamamı değil. |
| BE-079 | 01 Ana sayfa (koordinatörlük kartları) — Kart avatar yığını: birimin bütün kullanıcıları | B | CoordinatorshipStat istenen durum sayaçları/tüm üye avatar kümesi v28 delta değil; mevcut coordinators/member_count bu kapsamın tamamı değil. |
| BE-087 | 01b İşlem geçmişi — Koordinatörlük sütunu/süzgeci; program kapsamı | Ü28 | AuditEntry program_id/department_id önce de vardı; v28 work_item_id + yeni olay zarfı/indeks, eskiye backfill yok. 01b ekran kapısı; tarihsel kapsam tamamı iddia edilemez. |
| BE-088 | 01b İşlem geçmişi — Tablo, tür rozeti, işlem metni, ayrıntı | Ü28 | listAuditEntries + listAuditActionTypes v28; görünen ad istemci sözlüğü, target_name bugünkü ve nullable; 01b yeni ekran/ürün kapısı. |
| BE-089 | 01b İşlem geçmişi — Toplamlar, şerit, faset sayıları, gün sayaçları | Ü28 | summarizeAuditEntries v28 total/facets/activity_30d; 503 audit.summary_unavailable Retry-After, faset/zaman kuralları; 01b kapısı. |
| BE-090 | 01b İşlem geçmişi — CSV indir | Ü28 | exportAuditEntries v28 S1 rol kapsamlı, bilet, 10000 üstü 422 audit.export_too_large, IP yalnız admin; 01b yeni ekran kapısı. |
| BE-091 | 03 ayrıntı paneli, 01 Ana sayfa, 05b, 08b — Yönetici dışı merceklerde etkinlik/geçmiş | A28 | listAuditEntries S1 program_id query rol kapsamında, work_item_id görev görünürlüğü; 007/010/015/018 mevcut yüzleri aday, 01b açılması şart değil. |
| BE-092 | 01b İşlem geçmişi — Oturum ayrıntısı "tarayıcı · işletim sistemi · IP" | Ü28 | AuditEntry.client_ip/client_agent nullable, yalnız admin ve yeni kayıt; P6 01b ürün/ekran + kişisel veri sunum kapısı. |
| BE-093 | 11 Tablolar — Tablo listesi, oluşturma, tablo okuma | Ü | v26 listTables/createTable/getTable/applyTableOperation; delete/update komut motorunda, isimler eşit değil; yeni tablo modülü kapsamı seçilmeli. |
| BE-094 | 11 Tablolar — Erişim listesi (sahip/düzenler/görür) | Ü | v26 tablo grant/ekip paylaşımı komutları ve capabilities; ACL kapsamı TABLES-K01/02 ile karşılaştır; yeni tablo modülü kapısı. |
| BE-095 | 11 Tablolar — Sütun yapısı (7 tip, ad, sıra, genişlik, sil) | Ü | v26 applyTableOperation sütun komutları ve schema version; istenen yedi tip birebir varsayma; yeni tablo modülü. |
| BE-096 | 11 Tablolar — Kişi aday arama | Ü/B | v26 referans görünürlüğü var; istenen özgül yetkili kişi aday arama ucu kanıtlanmadı. Yeni tablo modülü + eksik dizin değerlendirmesi. |
| BE-097 | 11 Tablolar — Satır + hücre yazımı, otomatik kayıt | Ü | v26 applyTableOperation set_cells/satır komutları, CAS/atomic değişim; istenen ayrı uç adları gerçek değil. Yeni tablo modülü kapısı. |
| BE-098 | 11 Tablolar — NIZAM referans tipleri (kişi, koordinatörlük, görev) | Ü | v26 TABLES-K07/K14 referans görünürlük/redaction; ayrı ürün gizlilik ve yeni tablo modülü kararı. |
| BE-099 | 11 Tablolar — Sunucu arama/süzme/sıralama + sayaçlar + alt özet | Ü | v26 tablo query/filter/sort/summary komutlarını tagged OpenAPI ile ayrıntılı eşleştir; ayrı uç isimleri varsayma, tablo modülü kapısı. |
| BE-100 | 11 Tablolar — Tablo bağlantısı + geri bağ | Ü/K | v26 table_reference tipi var; çoklu satır bağı/geri bağ/arama eşdeğerliği kanıtlanmadı, tablo modülü+eksik parça değerlendirmesi. |
| BE-101 | 11 Tablolar — Liste kartı önizlemesi, kişi ve sayaçlar | Ü/K | v26 listTables/getTable mevcut; preview/count kart alanları tam taleple aynı mı şema bazında kontrol; yeni tablo modülü. |
| BE-102 | 11 Tablolar — Tip dönüşümü önizleme + onay | Ü/K | v26 tablo tip dönüşümü var; önizleme/onay ve kayıp veri semantiğini 11 tasarımıyla ayrı eşleştir, tablo modülü kapısı. |
| BE-103 | 11e Tablolar — Değişiklik kaydı okuma + geri al | Ü/K | v26 getTableChanges ve sınırlı kendi set_cells undo; genel geri alma/redo yok (TABLES-K27), yeni tablo modülü kapısı. |
| BE-104 | 11e Tablolar — Hücre yorumları + `@` anma bildirimi | Ü/B | v26 getTableComments ve yorum komutları var; @bahsetme/bildirim yok (tables README), tablo modülü ve backend kalan. |
| BE-105 | 11e Tablolar — Sütun kilidi | Ü/K | v26 sütun şema/kilit iddialarını applyTableOperation ile alan bazında doğrula; yeni tablo modülü, ayrı 403 semantiği varsayma. |
| BE-106 | 11b/11e Tablolar — Gerçek zamanlı ortak çalışma + varlık | Ü | v26 streamTableChanges + presence, seq/snapshot; yeni tablo modülü ve SSE yetki/reconnect tasarımı ürün kapısı. |
| BE-123 | 13 Raporlar (01f dönem sonu raporu) — Dönem sonu PDF'inin 01f içeriği: kapak, içindekiler, özet, Gantt, koordinatörlük bölümleri, ek | K28 | F12 gantt_edges readonly öncü→bağımlı tüketimi/erişilebilir çiftler var, runtimeBE123 stub kalktı; PDF aynı sayfa kenarları görsel tanıklı, sunucu PDF içindekiler numaraları v028ile var (görsel doğrulanmadı/P51önizleme numarasız), yalnız sayfalar arası sınırGAP258 açık. |
| BE-126 | 13 Raporlar (dönem raporu) — "HTML sürüm" düğmesi | B | HTML çıktı formatı v28 delta değil; 01e/01h uygulanmayan yüz, yeni ürün kapsamı+backend. |
| BE-127 | 13 Raporlar (dönem/iş yükü/birim raporları) — "Rapor kapsamı": tarih aralığı ve koordinatörlük süzgeci | K28 | reportSeason/reportSeasonPdf from/to v28; department_ids daha önce var; diğer raporlara yayılım yok, mevcut 01f + çizilmeyen kapsam yüzü için karar. |
| BE-128 | 13 Raporlar, 08b Koordinatörlük — Koordinatör için "Birim raporu (PDF)" | Ü28 | reportSeasonPdf/reportSeason REPORTING-K24 koordinatör kendi birimleri; 08b mevcut gizli giriş için ürün/rol-görünürlük ve bilet testleriyle aday. |
| BE-129 | 13 Raporlar (iş yükü) — "CSV / XLSX" dışa aktarım | B | İş yükü CSV/XLSX export v28 delta değil; backend + ilgili yüz gerekir. |
| BE-130 | 13 Raporlar — "Son raporlar" listesi | K28 | listAuditEntries action_code=reporting.report_downloaded ile son indirmeler mümkün; mevcut raporlar akışında ayrı son raporlar listesi için ekran/ürün kararı; tam rapor üretim geçmişi değildir. |
| BE-131 | 13 Raporlar (indirme durum kartları) — "Rapor hazırlanıyor…" — ilerleme yakında | B | Rapor async iş/progress/iptal/boyut modeli v28 delta değil; backend gerekli. |
| BE-136 | 13 Raporlar (01f dönem sonu raporu önizleme) — Kapak dönem aralığı, dosya/toplantı/görev detayı bölümleri, iş yükü özeti, "ortalama kayma", "en çok talep alan görevler" | A28 | F12 mevcut01f dönemkaynağı/konum/notflag-shared/gantt tüketimi uygulandı; program/not yazma formları kapsam dışı, sayfa-boyut tahmini/görevPDFdosyaları nedeniyle geniş kayıt açık. |
| BE-147 | 14 Bildirimler (zil paneli) — "Onayladın · Geri al" | Ü | Karar geri alma GAP-246 kabul edilmiş sınır, P18 ile ürün kararı; v28 delta değil. |
| BE-150 | 14 Bildirimler (zil paneli) — Tablo taşıma önerisi satırı ("Geç"/"Taşı") ve tablo hücre değişikliği bildirimi | Ü/B | Tablo taşıma öneri komutları v26+ mevcut olabilir; tablo yorum @mention/hücre bildirimleri TABLES README yok; profil/bildirim + yeni tablo kapsamı ve backend kalan. |
| BE-151 | 14 Bildirimler › Profilim tercihleri (F7 dışı) — Olay başına tercih matrisi (portal içi / tarayıcı / e-posta) ve e-posta kanalı | Ü/B | v26 notification preferences/push register var; olay×kanal/e-posta, cihaz listesi/test/teslim veya sessiz saat taleplerinin tamamı v28 delta değil; Ü7 profil ve ürün/backend kapısı. |
| BE-152 | 14 Bildirimler › Web Push / Profilim cihazlar — Cihaz listesi, "Deneme gönder", "30 gündür ulaşılamıyor" ve otomatik kaldırma | Ü/B | v26 notification preferences/push register var; olay×kanal/e-posta, cihaz listesi/test/teslim veya sessiz saat taleplerinin tamamı v28 delta değil; Ü7 profil ve ürün/backend kapısı. |
| BE-153 | 14 Bildirimler › Sessiz saatler — Sessiz saatler (22:00 – 08:00 ve hafta sonu) ve zilde ay simgesi | Ü/B | v26 notification preferences/push register var; olay×kanal/e-posta, cihaz listesi/test/teslim veya sessiz saat taleplerinin tamamı v28 delta değil; Ü7 profil ve ürün/backend kapısı. |
| BE-166 | 13 Raporlar — Görev PDF'inde kod ve dosya sayısı | B | Görev PDF kod/dosya sayısı v28 OpenAPI endpoint delta değil; v28 tagged pdf/renderer.go Renderer.Task başlık/durum/tarih/kişi/not basar, kod veya dosya sayısı basmaz; backend eksiği sürer (statik kod kanıtı, yeni PDF gerçek tanığı değil). |

## Takip düzeltmesi ve ayrık sayım

**P45/GAP-233:** ortak-kurallar §F10 (satır 313) kesin ürün kararında önizleme türevi o P45 kapsamı dışında bırakıldı. v0.27 GAP-233'ün ayrıca yayımlanması ve BE-F8 planında v0.27'nin taban yapılması (plan-be8.md: kapsam A audit/B rapor-arşiv, thumbnail işi ayrı GAP-233) sunucu sözleşmesinin hazır olduğunu gösterir; frontend F12'ye alma ya da önceki ürün kararını geçersiz kılma yetkisi tek başına değildir. BE-026 `Ü27` = yayımlı ama ürün/kapsam kapılı; öncelikli otomatik aday önerisi geri çekildi. BE-025 dağılım ve BE-136 yeni rapor alanları **yalnız karşılanan kısımlar için aday**, tüm BE satırlarını bağlı sayma/kapama vaadi değildir.

Birincil triyaj sınıfları birbirini dışlar; 72 benzersiz açık satır, eksik veya tekrarlı kimlik yok (doğrudan `kayit.md` Durum `açık` kümesiyle set karşılaştırması). Bu sayılar teslim garantisi değil, ilk karar kapısıdır:

- **Mevcut yüzeyde yayımlı tüketim adayı — 6:** BE-007, 010, 015, 025, 091, 136. BE-025/136 yalnız kısmi; BE-015 kişi kapsamı/rol eşleşmesi ayrıca doğrulanır.
- **Kısmi/belirsiz; madde veya artefakt bazında doğrulama — 5:** BE-018, 036, 123, 127, 130. Backend veya ürün kapısı bu incelemenin sonucuna göre ayrıca çıkabilir.
- **Sözleşmede talebin tamamı gösterilmeyen/backend kalan — 22:** BE-004, 009, 013, 024, 037, 039, 040, 046, 047, 048, 054, 055, 057, 058, 059, 066, 078, 079, 126, 129, 131, 166. Bazılarında ek ürün kararı da gereklidir; 009 mevcut sayaçların kalan ihtiyaçla ayrıştırılması gerekir.
- **Ürün/yeni ekran/önceki karar kapısı — 39:** BE-006, 016, 017, 020, 022, 026, 030–035, 062, 064, 087–090, 092–106, 128, 147, 150–153. Aralıklar dahil sayıldığında 39; bazı tablo/profil özelliklerinde backend eksikleri de vardır. 091 ve 087 ayrı satırlardır; 164 zaten kapalıdır.

## BE-036 belge paketi — 11 madde

1. WorkItem gecikme tanımı: v0.15 öncesi kayıt notu madde 1–4 belgeli; v28 `openapi`/istemci akışında gün sınırı/tamamlanmış semantiğini tanım satırına karşı ayrı teyit edin, eski listeyi kör kapatmayın.
2. Dashboard/CoordinatorshipStat sayaç tanımları: v0.15 belge notu var; toplam `member_count`, görev durumları, rol kesişimi ve `deleted_records` tek tek alan tanımları olarak karşılaştırılmalı.
3. Dashboard `X-Result-Truncated`: v0.15 belge notu var; gömülü dizilerin kapsamı ve gerçek yanıt başlığı doğrulanmalı.
4. `listUsers` yalnız ŞY, sıralama adları/varsayılanları v28 `openapi` UserSortBy/UserSortOrder ve istemci-akislari §3'te belgeli; enum bilinçli eklenmemiş (kırıcı). **Kayıttaki “ekipsiz hesap listelenmez” artık yanlış:** v0.14+ ve pinli v0.26 da süzgeçsiz tüm canlı hesaplar dahil der. Kayıt metni güncellemesi gerekir; backend eksiği diye tekrar açılmamalı.
5. Kullanıcı/hesap/üyelik: istemci-akislari §3 kullanıcı satırı ve §4 yetki matrisi var; eski talebin bütün alt durumlarıyla tamlık henüz tek tek teyit edilmedi.
6. Departman/ekip/bağ/koordinatör: §3 katalog ve ekip, §4 eylem görünürlüğü var; bütün ayrıntıların tamlığı ayrı denetlenmeli.
7. Toplantı: §3 listMeetings `when`/sort ve §3 form başlık 255/gündem300 sınırları belgeli; kayıt v0.16 kısmı doğrulanır.
8. **Not 5000 bağlama bağlı:** istemci-akislari toplantı notunu 5000 der; `WorkNoteRequest.content` v0.15+ ve pinli v0.26 şemasında da10000 rune der. Tek genel “not 5000” düzeltmesi yanıltır; tür bazında belge/tasarım uyumu gerekir.
9. `CreateDepartmentRequest.code` pattern açıklamada açık, `pattern` keyword yok (büyük harfe normalize sonrası kontrol); bu bilinçli modelleme mi ve `UpdateDepartmentRequest` eşdeğerliği tag şemasında kontrol edilmeli; description var diye keyword talebi otomatik kapanmaz.
10. `archiveAttachments` filtre/sort/limit §3 ve OpenAPI parametrelerinde; bütün varsayılanlar/sort enumları özgül sorgu bazında karşılaştırılmalı.
11. Web asgari sürüm eşlemesi: `InstanceProfile` minimum web alanı yok, BE-037 ürün/politika/backend kararı hâlâ açık. Bu yüzden BE-036 bütününü kapatmak için dayanak yok.

## Tablolar BE-093–106: yayımlı yüz ve kalan ayrım

v28 aynı v26 tablo sözleşmesini taşır. `listTables/createTable/getTable/applyTableOperation`, kişisel eşdeğerleri, `getTableChanges/getTableComments`, `streamTableChanges`, `set/leaveTablePresence`, tablo proje/öneri uçları vardır; satır/sütun/hücre ve paylaşım ayrı varsayımsal REST uçları değil `TableOperation` discriminator komutlarıdır. `grant/revoke`, add/rename/resize/delete/move column, add/delete/move row, `set_cells`, comment ve `undo_cells` gerçek komutlardır; owner/editor/viewer, 409 schema/cell CAS ve idempotency kuralları uygulanır.

- BE-093/094/095/097/098/106: çekirdek, grant, kolon, satır/hücre, referans redaction ve stream/presence yayımlı; tam tasarım eşlemesi ve 11–11e yeni modül kapsamı hâlâ gerekir, otomatik bağlantı değil.
- BE-096: `listTablePeopleCandidates` adlı uç yok; mevcut başka aday uçlarının yetki/kişisel+departman kapsamı eşdeğerliği kanıtlanmadı, fan-out/dizin uydurulmaz.
- BE-099/100/101: `getTable` sayfalı satır + referans ve tablo listesi var; talep edilen sunucu query/alt özet, çoklu satır geri bağ veya liste kartı preview/count özellikleri birebir eşleşme kanıtı ayrı gerektirir. Tablo referansı var demek tüm BE-100 değildir.
- BE-102: `convert_column` kayıpsız atomik; tek kayıplı değer 409 `tables.conversion_lossy` ve count, **istenen kayıplı veriyi koruyan önizleme/onayla dönüşüm değildir**.
- BE-103: getTableChanges + `undo_cells` yalnız kendi `set_cells`, pencere sınırı; genel değişiklik geçmişi geri alma/redo değildir.
- BE-104: yorum get/add/edit/delete var, etiketli tables README açıkça thread/@mention/bildirim yok der.
- BE-105: şema komutlarında `expected_schema` CAS var; istenen kullanıcıya dönük sütun lock/unlock ve `tables.column_locked` sözleşmesi görülmedi; CAS'ı kilit diye sunmayın.

**BE-166:** `v0.28.0-api:internal/modules/reporting/adapter/pdf/renderer.go` `Renderer.Task` başlık/açıklama/durum/öncelik/tarih/birim/oluşturan/atanan/not çiziyor; kod veya dosya sayısı çizme erişimi yok. Backend şablon açığı tagged source düzeyinde doğrulandı; yeni gerçek PDF çıktısı üretilmedi.
