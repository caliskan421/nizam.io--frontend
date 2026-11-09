# 08 · Koordinatörlükler

**Codex kapısı:** KOŞULLU UYGUN (2026-11-08) — grup bulguları `dogrulama.md` Kapanış bölümünde; ortak kurallar `../ortak-kurallar.md`.

**Artboard'lar:** `Koordinatorlukler.dc.html` (`08 · Koordinatörlükler`, 1440×1700), `Koordinatorluk-Detay.dc.html` (`08b · Koordinatörlük › Altyapı ve tesisat`, 1440×1500)
**Faz:** F2 · **v1:** ✓ (düz liste) · **Yol haritası bağı:** K1, K2, K5, K6, K7, K13, K14 (departmanlar v1'de düz liste — hiyerarşi, aktif/pasif, birleştirme sonra), §4 F2 satırı ("koordinatörlükler (düz), departman/üyelik/koordinatör")
**Rota (önerilen, K10):** `/koordinatorlukler` — süzgeç parametreleri: `gorunum` (`liste` | `yapi`), `q` (metin), `sirala` (değer kümesi bilinmiyor); `/koordinatorlukler/:departmentId` — `departmentId` (kimlik), `sekme` (`genel` | `uyeler` | `gorevler` | `arsiv` | `toplantilar` | `ayarlar`). Varsayım: parametre adları rota kataloğunda kesinleşir.

## Özet
Programa bağlı koordinatörlüklerin (backend'de departman) kart ızgarası ve tek bir koordinatörlüğün ayrıntı sayfası. Liste ekranı birim başına kod, ad, koordinatör(ler), üye/görev/arşiv sayıları ve son etkinlik bayrağını; üstte "yapı sağlığı" uyarı şeritlerini, toplu işlem çubuğunu ve Liste/Yapı görünümünü gösterir. Ayrıntı ekranı sekmeli (Genel bakış, Üyeler, Görevler, Arşiv, Toplantılar, Ayarlar); Genel bakış'ta KPI şeridi, Hakkında, Alt birimler, Ekip, Dikkat gerektirenler, Kısayollar ve Son etkinlik kartları vardır. Tasarım yönetici (Admin) merceğiyle çizilmiştir (yeni koordinatörlük, birleştir, pasifleştir); Koordinatör ve Üye merceğinde ne görüneceği tasarımda yoktur. Ana veri kaynağı seçili programa bağlı departmanlar, onların ekip (üyelik/koordinatör) satırları ve görev sayılarıdır. K14 gereği v1'de üst birim/alt birim hiyerarşisi, "Yapı" görünümü, aktif/pasif, birleştirme ve toplu üye taşıma statiktir (BE-016, BE-017); görünürlük ve kuruluş tarihi statiktir (BE-018); son etkinlik yalnız yönetici merceğinde canlı (`last_activity_at`, görev hareketi), diğer merceklerde statiktir (BE-018).

**Durum: geçici kabul** (2026-11-09; ürün soruları #13–#18 bekliyor — Codex §6 önerilen varsayılanları geçici kabul edildi, `../../yurutme/web-1/ilerleme.md` O5 kaydı).

## Dosyalar
| Dosya | Durum | Son güncelleme | Üreten |
|---|---|---|---|
| ozellikler.md | denetlendi | 2026-11-08 | tasarım analisti |
| mekanizma.md | denetlendi | 2026-11-08 | tasarım analisti |
| backend.md | denetlendi | 2026-11-08 | backend analisti |
| eksikler.md | denetlendi | 2026-11-08 | backend analisti |
| dogrulama.md | denetlendi | 2026-11-08 | denetçi (Sonnet) |

## Uygulama kararı tablosu (CX-M-07)

Karar tarihi 2026-11-09 (WEB-1 O5 adım 2). Kaynaklar: `../ortak-kurallar.md` §1–§5, §7, §9, §10, §12 (P1–P7); `../sentez.md` §1 G13, G17; `../../backend-eksikleri/kayit.md`; W22 devirleri (`../00-ortak/README.md` satır dışı tablo). **"geçici kabul"** = Codex §6 #17–#18 önerilen varsayılanı; ürün sahibi cevaplayana dek uygulayıcı bunu `kabul` gibi kodlar, cevap farklıysa tablo F2 O2a'dan (W71) önce güncellenir. Uygulayıcılar: `../../yurutme/web-2/`. Ekran yalnız şirket yöneticisi içindir (satır dışı tablo); veri kaynağı `listProgramDepartments` ⋈ `reportDashboard` (`department_id`; birim başına istek yok, K3). Kısaltmalar: ŞY = `me.company_admin`.

| E-kimliği | Faz | Davranış (canlı / statik / gizli / devre dışı) | Kabul edilmiş varsayım (öneri / kabul / ret — ortak-kurallar §2) | BE bağı | Bağımlılık | Kabul kanıtı |
|---|---|---|---|---|---|---|
| E-08-01 Kırıntı | F2 | canlı — "‹program› / Koordinatörlükler" | kabul — §5, E-00-35 | — | W22, W71 katalog | ek `readProgram` yok |
| E-08-02 Başlık | F2 | canlı (sabit) | — | — | — | görsel |
| E-08-03 Alt satır | F2 | "‹N› koordinatörlük" canlı (`departments.length`, kesilmede "sınıra ulaşmış olabilir"); "‹N› kişi" canlı `total_users` + "yöneticiler dahil" ipucu; "‹YYYY› sezonu" program kaydında yıl varsa (`['programs']`), yoksa parça gizli; **"üst birim" parçası çizilmez** | **geçici kabul (ürün onayı bekliyor)** — #17 düz ızgara, sahte üst birim yok; kabul — K14, G15 (`total_users` kapsamı), BE-036 (2) | BE-016, BE-036 (2) | W71, W72 | parça var/yok testleri; ek istek yok |
| E-08-04 Yapıyı düzenle | F2 | devre dışı — `designStub('BE-016')` | kabul — K14 (hiyerarşi v1'de yok), §3 | BE-016 | W15 | stub lint |
| E-08-05 Yeni koordinatörlük | F2 | canlı (ŞY) — P3 form: ad, tür (`kind` zorunlu), kod (zod `^[A-Z0-9]{2,10}$`, büyük harfe çevrilir), açıklama; `createDepartment` → `linkDepartment` iki adım, adım adım sonuç; 409 `organization.department_exists` → "mevcut departmanı bu programa ekle" (`listDepartments`/`listDeletedDepartments` ad eşleşmesi, `tr` katlama); sonuç bilinmiyorsa kör tekrar yok, liste yeniden okunur | **geçici kabul (ürün onayı bekliyor)** — #18 ortak bileşenlerle tasarlanmış form; kabul — G17, K7, K11, §7 | BE-050, BE-036 (6, 9) | W74 form, W71 mutasyonlar | adım 1 ok / adım 2 hata kısmi başarı metni; `department_code_conflict` alan hatası; Türkçe harfli kod reddi (istemci) |
| E-08-06 Diğer işlemler | F2 | menü canlı; "Sezona kopyala" **devre dışı** + açıklama ("yapı kopyası henüz yok; görev aktarımı Teknofest ve sezon ekranında"); "Roller" çizilmez | **geçici kabul (ürün onayı bekliyor)** — #18 yapı kopyası ile görev aktarımı ayrı eylemler, Kopyala taşıma yapmaz; stub yok (§3: ürün kararı bekleyen seçenek, 08/yeni-7 kayda alınmadı) | — | W81 (görev aktarımı) | "Sezona kopyala" `transferWorkItems` çağırmaz testi |
| E-08-07 Yapı sağlığı şeridi | F2 | canlı (ŞY) | kabul — backend.md ana karar (rapor tek çağrı) | — | W72 | 4 kutu render |
| E-08-08 Koordinatörsüz birim | F2 | canlı — `coordinators.length = 0` sayısı; **not satırı boş** (iş kuralı bilinmiyor) | kabul — 01 E-01-07 kalıbı (anlamı bilinmeyen sabit not yazılmaz) | — | W72 | sayım testi; not render edilmez |
| E-08-09 Üyesi olmayan | F2 | canlı — `member_count = 0` (yalnız `uye`) | kabul — backend.md §4 | BE-036 (2) | W72 | sayım testi |
| E-08-10 Bu sezon görevsiz | F2 | canlı — `total_tasks = 0` sayısı + adlar | kabul | — | W72 | ad listesi testi |
| E-08-11 30+ gündür sessiz | F2 | canlı — `last_activity_at` null ya da 30 günden eski; not metni görev hareketine uyarlanır ("Dosya yüklenmemiş" yazılmaz) | **geçici kabul** — sözleşmeye uy (P5 kalıbı; alan görev hareketidir, dosya değil); tuvale geri bildirim | BE-018, BE-036 (2) | W72 | null + 31 gün testi |
| E-08-12 Görünüm seçici | F2 | "Liste" canlı (basılı); "Yapı" devre dışı `designStub('BE-016')`; URL `gorunum` yalnız `liste` | kabul — K14, §3 | BE-016 | W12 `UiSegmented`, W71 katalog | stub lint |
| E-08-13 Arama | F2 | canlı — istemci (`display_name`, `code`, koordinatör adları; `tr` katlama, ~300 ms); URL `q`; yer tutucu "Koordinatörlük, kod veya koordinatör ara…" | kabul — backend.md §4 (üye adları fan-out olur → "kişi" yalnız koordinatör) | — | W72 | "İ/ı" katlama testi |
| E-08-14 Durum seçici (Aktif/Pasif) | F2 | gizli | kabul — K14 (aktif/pasif v1 sonrası); §4 (sahte sayaç yok) | BE-017 | — | DOM'da yok |
| E-08-15 Üst birim süzgeci | F2 | gizli | **geçici kabul** — #17 sahte üst birim yok; kabul — K14 | BE-016 | — | DOM'da yok |
| E-08-16 Sıralama | F2 | canlı — yalnız "Ada göre" (`Intl.Collator('tr')`) + yön; URL `sirala` W71 katalogda | **geçici kabul** — seçenek kümesi tasarımda yok, en dar küme; **öneri** — görev/üye sayısına göre | — | W71, W72 | Türkçe sıralama testi |
| E-08-17 Seçim sayısı | F2 | gizli | kabul — P7 kalıbı (toplu seçim gizli; toplu uç yok) | — | — | DOM'da yok |
| E-08-18 Koordinatör ata (toplu) | F2 | gizli | kabul — P7 kalıbı; tekil atama kartta (E-08-33); toplu atomiklik ürün kararı (CX-T-06, 08/yeni-6 kayda alınmadı) | — | — | DOM'da yok |
| E-08-19 Üye taşı | F2 | gizli | kabul — P7 kalıbı, K14 | BE-017 | — | DOM'da yok |
| E-08-20 Üst birime bağla | F2 | gizli | kabul — P7 kalıbı, K14 | BE-016 | — | DOM'da yok |
| E-08-21 Birleştir | F2 | gizli | kabul — P7 kalıbı, K14 | BE-017 | — | DOM'da yok |
| E-08-22 Pasifleştir | F2 | gizli | kabul — P7 kalıbı, K14 | BE-017 | — | DOM'da yok |
| E-08-23 Seçimi temizle | F2 | gizli | kabul — P7 kalıbı | — | — | DOM'da yok |
| E-08-24 Grup başlığı | F2 | gizli — tek düz ızgara | **geçici kabul (ürün onayı bekliyor)** — #17 v1 düz ızgara, sahte üst birim başlığı yok; kabul — K14 | BE-016 | — | DOM'da grup başlığı yok |
| E-08-25 Tümünü seç / Seçimi kaldır | F2 | gizli | kabul — P7 kalıbı | — | — | DOM'da yok |
| E-08-26 Buraya ekle | F2 | gizli | **geçici kabul** — #17; kabul — K14 | BE-016 | — | DOM'da yok |
| E-08-27 Kart | F2 | canlı | — | — | W72 | render |
| E-08-28 Kod rozeti | F2 | canlı — `code`; kodsuzda ad baş harfleri (gösterim kuralı, stub değil) | kabul — G13, G17; ret — tasarımdaki Türkçe harfli örnek kodlar | BE-036 (9) | W72 | kodlu/kodsuz testi |
| E-08-29 Birim adı | F2 | canlı — `display_name` → 08b | kabul — G13, K10 | — | W73 | gezinme |
| E-08-30 Alt satır | F2 | açıklama canlı (`CoordinatorshipStat.description`, katalog alanı); alt birim parçası çizilmez | kabul — K14; **geçici kabul** — #17 | BE-016, BE-049 | W72 | açıklamasız birimde satır yok |
| E-08-31 Seçim kutusu | F2 | gizli | kabul — P7 kalıbı | — | — | DOM'da yok |
| E-08-32 Koordinatör yığını | F2 | canlı — en çok 3 avatar + ipucu; "‹ilk ad› +n" | kabul | — | W72 | çoklu koordinatör testi |
| E-08-33 "Koordinatör ata" | F2 | canlı (ŞY; yalnız koordinatörsüz kartta) — kişi seçici (`listUsers` `search`, imleçli) → `assignCoordinator`; 409 `organization.membership_exists` → "zaten ekipte" + liste yeniden okunur | **geçici kabul** — #18 ortak bileşenlerle form; kabul — §7 (atamada onay kapısı yok), P3 | BE-036 (6) | W74 kişi seçici, W71 | 422 `department_not_linked` → K7 metni |
| E-08-34 Üye sayısı | F2 | canlı — `member_count` (yalnız `uye`) → 08b `sekme=uyeler` | kabul — backend.md §3 (kart ≠ Ekip sayısı, bilinçli) | BE-036 (2) | W73 | gezinme |
| E-08-35 Görev sayısı | F2 | canlı — `total_tasks` → 08b `sekme=gorevler` | kabul | — | W73 | gezinme |
| E-08-36 Arşiv sayısı | F5 | devre dışı hücre, değer "—", ipucu "F5'te"; tık gezinmez | kabul — P2 (ekran içi faz dışı devre dışı), stub yok (§3) | BE-025 | 06 (F5) | `aria-disabled` |
| E-08-37 Durum bayrağı | F2 | "Koordinatör atanmamış" canlı; son etkinlik "Son görev hareketi ‹göreli›" / "Sessiz · son görev hareketi ‹göreli›"; "Henüz dosya yüklenmedi" yazılmaz | **geçici kabul** — E-08-11 ile aynı; kabul — öncelik koordinatörsüz > sessiz > normal | BE-018 | W72 | öncelik testi |
| E-08-38 Kart işlem menüsü | F2 | "Sayfasını aç", "Ayarları düzenle" (→ 08b `sekme=ayarlar`), "Görev ata" (W45 formu, departman ön seçili) canlı; "Üst birimi değiştir" devre dışı `designStub('BE-016')`; "Pasifleştir" devre dışı `designStub('BE-017')` | kabul — P1, K14, §3 | BE-016, BE-017 | W73, W45 | stub lint; menü klavye testi |
| E-08-39 Boş durum | F2 | canlı — süzgeç sonucu boş → `rp-empty` + "süzgeçleri temizle"; programda hiç birim yok → "programa departman katılmamış" + "Yeni koordinatörlük" / "mevcut departmanı ekle" | kabul — K7, W22 devri (yöneticide tespit hazır, `DepartmentGap`) | — | W72, W74 | iki boş durum testi |
| E-08-40 Yapı açıklaması | F2 | gizli ("Yapı" devre dışı) | kabul — K14 | BE-016 | — | DOM'da yok |
| E-08-41 Üst birim düğümü | F2 | gizli | kabul — K14 | BE-016 | — | DOM'da yok |
| E-08-42 Koordinatörlük düğümü | F2 | gizli | kabul — K14 | BE-016 | — | DOM'da yok |
| E-08-43 Alt birim düğümü | F2 | gizli | kabul — K14 | BE-016 | — | DOM'da yok |
| E-08-44 İpucu | F2 | canlı (sabit metin) | — | — | — | görsel |
| E-08-45 Sayım satırı | F2 | canlı — "‹n› / ‹m› koordinatörlük gösteriliyor" | kabul | — | W72 | süzgeç sonrası sayım |
| E-08-46 Rol/yetki özeti (`perms`) | — | uygulanmaz | ret — tasarımda çizilmiyor | — | — | — |
| E-08-50 Kırıntı | F2 | canlı — "‹program› / Koordinatörlükler / ‹birim›" | kabul — K10 | — | W73 | gezinme |
| E-08-51 Büyük kod rozeti | F2 | canlı (E-08-28 kuralı) | kabul — G17 | — | W73 | render |
| E-08-52 Başlık | F2 | canlı — `listProgramDepartments`'tan seçim; listede yoksa "Bu koordinatörlük seçili programda yok" | kabul — BE-049 Şimdilik | BE-049 | W73 | derin bağlantı + yok testi |
| E-08-53 Alt satır | F2 | "‹N› kişi" canlı (`listMembers`, `status = active`); üst/alt birim ve "Aktif" çizilmez | kabul — K14; **geçici kabul** — #17 | BE-016, BE-017 | W73 | kişi sayısı testi |
| E-08-54 Ekibe mesaj | F7 | devre dışı "F7'de" | kabul — P2, §5 (ekran içi faz dışı), stub yok | — | 10 grubu | `aria-disabled` + faz notu |
| E-08-55 Görev ata | F2 | canlı — W45 `NewTaskDialog`, departman ön seçili; görünürlük work `canCreateWorkItem` | kabul — P1, P3 | — | W45, W73 | form departmanı testi |
| E-08-56 Diğer işlemler | F2 | "Düzenle" canlı (E-08-63 formu); "Birleştir", "Pasifleştir" devre dışı `designStub('BE-017')` | kabul — K14, §3; **öneri** — "Programdan çıkar" (`unlinkDepartment`) tasarımda yok | BE-017 | W73, W74 | stub lint |
| E-08-57 Sekme şeridi | F2 | canlı — URL `sekme`; sekme klavye gezinmesi | kabul — K10 | — | W12 sekme, W71 katalog | `tablist`/`tabpanel` + `aria-controls` |
| E-08-58 Genel bakış | F2 | canlı | — | — | W73 | — |
| E-08-59 Üyeler | F2 | canlı — sayaç `listMembers`; P3 minimum liste: ad (→ 05b), rol rozeti, `status = deleted` soluk; ŞY: üye ekle, rol değiştir (`updateMembershipRole`, onay gövdede), çıkar (`removeMember`, `?confirm=true`); kendi satırında gizli | **geçici kabul (ürün onayı bekliyor)** — #18 ortak bileşenlerle; #17 üyeye ekip yönetimi yok; kabul — §7 | BE-047 | W73, W74 | onay iki biçim testi; `confirmation_required` görev başlıkları |
| E-08-60 Görevler | F2 | canlı — sayaç `total_tasks`; içerik sade özet + "Görevlerde aç" (`/gorevler?koordinatorluk=‹id›`) | **geçici kabul** — #18 / P3 minimum (03 listesi gömülmez; tek liste yüzeyi 03) | — | W42 rota, W73 | bağlantı parametresi testi |
| E-08-61 Arşiv | F5 | devre dışı sekme "F5'te"; sayı yok | kabul — P2, §5 | BE-025 | 06 (F5) | `aria-disabled` |
| E-08-62 Toplantılar | F4 | devre dışı sekme "F4'te"; sayı yok | kabul — P2, §5; `meeting_count` kullanılmaz (dashboard'da 0, 08/yeni-9) | BE-021 | 09 (F4) | `aria-disabled` |
| E-08-63 Ayarlar | F2 | canlı (ŞY) — P3 düzenleme formu: programdaki ad (`renameDepartmentLink`) ve katalog kod/açıklama/tür (`updateDepartment`, "bu değişiklik tüm sezonlarda geçerli" uyarısı); son yazan kazanır, form açılışında taze okuma; görünürlük ayarı çizilmez | **geçici kabul (ürün onayı bekliyor)** — #18; kabul — G17 (ad iki kavram, `expected_revision` yok) | BE-018 | W74 | iki uç ayrı sonuç testi; 409 `program.department_link_name_exists` |
| E-08-64 KPI şeridi | F2 | canlı | — | — | W73 | 5 hücre render |
| E-08-65 Açık görev | F2 | canlı — `total_tasks − completed_tasks`; not "‹T› görevin ‹D›’si bitti" | kabul — backend.md §1 (rapor `onaya_sunuldu`/`iade_edildi`'yi ayrı saymaz; açık = toplam − biten) | BE-036 (2) | W73 | Türkçe ek testi |
| E-08-66 Geciken | F2 | sayı `overdue_tasks` canlı; "En uzunu ‹G› gün" `listProgramWorkItems?department_id=` tek uç sonuna dek sayfalama, sürerken "yüklenen kayıtlar içinde" | kabul — §9, §10 | BE-003, BE-036 (1) | W71 görev sorgusu, W73 | yaklaşık etiket testi |
| E-08-67 Tamamlanma | F2 | canlı — birim `completion_rate`; "Sezon ortalaması" `reportDashboard` `completed_tasks / total_tasks` | **geçici kabul** — `completion_rate` 0–100 ölçeği (kod okuması, BE-036 (2)) | BE-036 (2) | W73 | ölçek testi |
| E-08-68 Tarih talebi | F2 | canlı — `pending_date_request != null` sayısı (E-08-66 ile aynı sorgu); not = ilk görev başlığı | kabul — P5 (okuma göstergesi canlı) | BE-003 | W73 | sayım testi |
| E-08-69 Arşiv KPI | F5 | devre dışı hücre "—" + "F5'te" | kabul — P2 | BE-025 | 06 (F5) | `aria-disabled` |
| E-08-70 Hakkında + Düzenle | F2 | canlı — "Düzenle" E-08-63 formunu açar | **geçici kabul** — #18 | — | W74 | gezinme |
| E-08-71 Açıklama | F2 | canlı (ŞY, `description`); boşsa satır çizilmez | kabul — BE-049 Şimdilik (yalnız ŞY okur) | BE-049 | W73 | boş açıklama testi |
| E-08-72 Üst birim | F2 | gizli | kabul — K14; **geçici kabul** — #17 | BE-016 | — | DOM'da yok |
| E-08-73 Kuruluş | F2 | statik "—" — `designStub('BE-018')` | kabul — §3, §4 (sahte tarih yok) | BE-018 | W15 | stub lint |
| E-08-74 Arşiv klasörü | F5 | devre dışı bağlantı "F5'te" | kabul — P2 | BE-025 | 07 (F5) | tıklanamaz + faz notu |
| E-08-75 Görünürlük | F2 | statik "—" — `designStub('BE-018')` | kabul — §3, §4 | BE-018 | W15 | stub lint |
| E-08-76 Alt birimler başlığı + "Alt birim ekle" | F2 | gizli (kart çizilmez) | kabul — K14; **geçici kabul** — #17 | BE-016 | — | DOM'da yok |
| E-08-77 Alt birim satırı | F2 | gizli | kabul — K14 | BE-016 | — | DOM'da yok |
| E-08-78 Ekip başlığı | F2 | canlı — "Ekip ‹N›" (`listMembers`, koordinatör dahil) | kabul — backend.md §3 | — | W73 | sayım testi |
| E-08-79 Üye ekle | F2 | canlı (ŞY) — kişi seçici (`listUsers`) + rol → `assignMembership`; 409 `membership_exists` → "zaten ekipte" | **geçici kabul** — #18; kabul — §7 (onay kapısı yok) | — | W74 | 422 `department_not_linked` → K7 |
| E-08-80 Tüm üyeler | F2 | canlı → 08b `sekme=uyeler` | kabul — eksikler §1 (eksik doğurmaz) | — | W73 | gezinme |
| E-08-81 Üye kutucuğu | F2 | canlı — ilk 6 (koordinatörler önce, sonra ad `tr`); ad → 05b; "Koordinatör" rozeti; "‹N› açık iş" E-08-66 sorgusundan (yaklaşık etiketiyle); alt birim etiketi çizilmez | **geçici kabul** — kesme kuralı tasarımda yok (6 kutu); kabul — K14 | BE-016 | W73, W76 | kesme + sıra testi |
| E-08-82 Dikkat gerektirenler + "Tümü" | F2 | canlı — "Tümü" → `/gorevler?koordinatorluk=‹id›&durum=geciken` | kabul — 03 kataloğu (W42) | — | W42 | bağlantı testi |
| E-08-83 Dikkat satırı | F2 | canlı — geciken görevler `days_overdue` azalan, ilk 3; kısa kod "‹KOD›-—"; "tarih talebi var" ekiyle | kabul — backend.md §1 (istemci sıralama, tek uç sayfalama), 03 E-03-41 kalıbı | BE-005 | W73 | sıra + kesme testi |
| E-08-84 Kısayollar | F2 | canlı | — | — | W73 | render |
| E-08-85 Görevlerde aç | F2 | canlı → `/gorevler?koordinatorluk=‹id›` | kabul | — | W42 | bağlantı testi |
| E-08-86 Zaman çizelgesinde gör | F3 | devre dışı "F3'te" | kabul — P2, §5 | — | 03c (F3) | `aria-disabled` |
| E-08-87 Arşiv klasörü | F5 | devre dışı "F5'te" | kabul — P2 | BE-025 | 07 (F5) | `aria-disabled` |
| E-08-88 Toplantı planla | F4 | devre dışı "F4'te" | kabul — P2 | — | 09 (F4) | `aria-disabled` |
| E-08-89 Birim raporu (PDF) | F6 | gizli | kabul — P6 kalıbı (raporlar F6; 01 E-01-12); uç yok, kayda gerek yok (eksikler §1) | — | F6 | DOM'da yok |
| E-08-90 Son etkinlik | F2 | statik nötr yer tutucu — `designStub('BE-018')`; sahte akış yok | kabul — §4, BE-018 Şimdilik | BE-018, BE-091 | W15 | sahte olay yok testi |

**Satır dışı varsayımlar:**

| Varsayım | Karar | Kaynak |
|---|---|---|
| 08 ve 08b yalnız `company_admin` olgusuyla açılır (mercekten bağımsız); yönetici olmayanda menüde yok, doğrudan URL rota kapısında ana sayfaya döner | **geçici kabul (ürün onayı bekliyor)** — #17 yönetim ekranı yöneticide; kabul — P1, E-00-24 | Codex §6 #17 |
| Koordinatör için kendi birimi görünümü | öneri — #17 "ayrıca tanımlanır"; F2'de kurulmaz (BE-048 bağlanınca ya da ürün cevabıyla) | kayit BE-048 |
| Üyeye ekip yönetimi / ekip görme yok | **geçici kabul** — #17; BE 08/yeni-10 kayda alınmadı (ürün) | Codex §6 #17 |
| Veri kaynağı ŞY: `listProgramDepartments` ⋈ `reportDashboard` (`coordinatorship_stats[]`); birim başına `listMembers`/`listProgramWorkItems` ile kart doldurulmaz; 08b'de seçili tek birim için `listMembers` + `listProgramWorkItems?department_id=` (kullanıcının açtığı tek kayıt) | kabul — K3, §9 | backend.md ana karar |
| `X-Result-Truncated` (departman listesi, rapor, `listMembers`) → "liste eksik olabilir" uyarısı | kabul | GAP-027, §10 |
| Departman/ekip yazmaları `Idempotency-Key`/`expected_revision` almaz: son yazan kazanır, sonuç bilinmiyorsa kör tekrar yok, liste yeniden okunur; onay parametresi iki biçim (`?confirm=true` sorguda, `updateMembershipRole` gövdede) | kabul | §7, G17, backend.md §6 |
| Eylem görünürlüğü `modules/organization/model/capabilities.ts`'te (backend.md §3 tablosu, ORGANIZATION-K08/K14/K15/K16, PROGRAM-K04, REPORTING-K01 kaynak gösterilerek) | kabul — K1 istisnası (BE-036 madde 6 kapanana dek) | backend.md §3 |
| Yönetim grubu kapısı `menu.ts` boolean olgusundan organizasyon `capabilities.ts`'e taşınır | kabul (WEB-0 devri, CX-F0-K-03) | `../../yurutme/web-0/ilerleme.md` O3 |
| `organization.coordinatorships` / `organization.coordinatorship` (ve program yönetimi rotası) "programa departman katılmamış" açık durumundan muaf (`NO_DEPARTMENT_EXEMPT_ROUTES`); yönetici departmansız programda 08'e girip birim ekleyebilir | kabul (W22 devri, F2 açılışında) | `../00-ortak/README.md` satır dışı |
| Yöneticide "programa departman katılmamış" tespiti (`DepartmentGap`, `listProgramDepartments`) hazır; 08 boş durumu (E-08-39) aynı sorguyu kullanır, ikinci istek yok | kabul (W22/W23 devri) | `src/app/states/resolve.ts` |
| "Sezona kopyala" (yapı kopyası) ile görev aktarımı (`previewTransfer` → `transferWorkItems`) ayrı eylemler; aktarım "Teknofest ve sezon" ekranında | **geçici kabul (ürün onayı bekliyor)** — #18 | Codex §6 #18 |
| Kapsam (program) değişince arama/görünüm korunur, sıralama varsayılana döner; 08b'de birim yeni programda yoksa E-08-52 iletisi | kabul (03 kalıbı) | K2, §6 |
| Yükleniyor → kart iskeleti; hata → bölge içi "Yeniden dene"; rapor 403 olmaz (yalnız ŞY) | kabul | K7, REPORTING-K01 |

Uygulayıcı yalnız `kabul` ve **geçici kabul** satırlarını kodlar; `öneri` kodlanmaz, `ret` uygulanmaz.

## Açık sorular (ürün sahibine)
- Koordinatör ve Üye merceğinde bu ekran (kenar menüsündeki "Koordinatörlükler") görünür mü; görünürse yalnız kendi birim(ler)i mi, programın tüm birimleri mi listelenir? Tasarım yalnız yönetici merceğini çizer.
- Hiyerarşi v1'de yokken liste ekranındaki üst birim grupları (`<birim adı>` vb.) nasıl gösterilecek: tek düz ızgara mı, grup başlıkları statik örnek olarak mı? (K14 "düz liste" → bu analiz düz ızgarayı varsayar.)
- "Yeni koordinatörlük" formu, Üyeler / Görevler / Arşiv / Toplantılar / Ayarlar sekmelerinin içeriği, üye çıkarma, koordinatör kaldırma ve programa departman bağlama arayüzü tasarımda çizilmemiş. Bunlar tasarım ekibinden mi gelecek, yoksa mevcut `t-*`/`rp-*` bileşenleriyle uygulayıcı mı kuracak?
- Ayrıntıdaki "Arşiv" sekmesi/kısayolu ve karttaki "arşiv" sayısı F5'e (v1 dışı) bağlı; "Ekibe mesaj" F7'ye (v1 dışı) bağlı; "Birim raporu (PDF)" F6'ya bağlı. v1'de gizlensin mi, devre dışı mı gösterilsin?
- "Diğer işlemler: sezona kopyala, roller" menüsü — "sezona kopyala" F2'deki dönem aktarımı mıdır?
