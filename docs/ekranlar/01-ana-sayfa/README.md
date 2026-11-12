# 01 · Ana sayfa

**Codex kapısı:** KOŞULLU UYGUN (2026-11-08) — grup bulguları `dogrulama.md` Kapanış bölümünde; ortak kurallar `../ortak-kurallar.md`.

**Artboard'lar:** `Main.dc.html` (`01 · Ana sayfa`, 1440×2700), `Main-Acik.dc.html` (`A1 · Açık tema › Ana sayfa`, yalnız `default: light`)
**Faz:** F1 (sade) / F6 (tam) · **v1:** ✓ (sade) · **Yol haritası bağı:** K1, K2, K3, K6, K7, K13, K14; §4 F1 ve F6 satırları; §6 REPORTING-K01, GAP-036
**Rota (önerilen, K10):** `/` — parametre yok; kapsam kenar menüsünden (K2)

## Özet
Oturum açan kişinin seçili kapsamdaki genel durumunu tek sayfada gösterir: selamlama ve "Silinen kayıtlar", dört görev KPI'ı (Tamamlanma, Açık görev, Gecikmede, Onay bekleyen), "Hızlı işlemler" (Yeni görev, Toplantı oluştur, Kullanıcı davet et, Rapor oluştur), "Son işlemler" akışı, ekip şeridi (kullanıcı/koordinatörlük ve rol sayıları) ve süzülüp sıralanabilen koordinatörlük kartları (görev dağılımı, geciken, kullanıcı, arşiv, son yükleme). Tasarımda rol ayrımı yok; tek artboard içeriği yönetici merceğini düşündürüyor. Koordinatör/üye için yalnız örnek veride kalmış, çizilmeyen "kişisel kısayollar" ve "dikkat kuyrukları" var (`ozellikler.md` §2.7). Ana veri kaynağı yönetici için rapor/pano uçları, koordinatör/üye için mevcut görev uçları (K14, BE-009); "Son işlemler" için kaynak yok (BE-010, statik).

**Faz dağılımı (karar — P6, ürün sahibi 2026-11-08; `../ortak-kurallar.md` §12):** F1 = selamlama + KPI şeridi + hızlı işlemler + nötr "Son işlemler" yer tutucusu; koordinatörlük kartları, ekip şeridi, "Rapor oluştur" ve "Silinen kayıtlar" F6 (F1'de gizli). Satır satır karar: "Uygulama kararı tablosu".

| Bölge | F1 sade | F6 tam | Gerekçe |
|---|---|---|---|
| E-01-01 Selamlama | ✓ bütün mercekler | ✓ | `me` (K1) |
| E-01-02 Silinen kayıtlar | F5 canlı (P36): yönetici, sayaç `deleted_records`, hedef `/silinen-kayitlar` (12); F1'de gizli | ✓ yönetici | P6, P36 |
| E-01-03…07 KPI | ✓ Admin: `reportDashboard` (sunucu sayaçları; GAP-075); Koordinatör/Üye: `countProgramWorkItems` sunucu sayaçları (seçili birim; Üye ve birleşik rolde `assignee_account_id` = ben; kesin, etiket yok; **bağlandı, pin v0.15.0-api, WEB-P WP2a**) | ✓ | P6, P3, P4, K14, BE-003, BE-009 |
| E-01-08…12 Hızlı işlemler | "Yeni görev" canlı (03 formu); "Kullanıcı davet et" devre dışı "F2'de", "Toplantı oluştur" devre dışı "F4'te"; "Rapor oluştur" gizli | ✓ ("Rapor oluştur" F6) | P2, P6 |
| E-01-13…18 Son işlemler | statik nötr yer tutucu, `designStub('BE-010')`; sahte akış yok; "Tümü" devre dışı (01b v1 dışı) | yer tutucu kalır (BE-010 kapanana dek) | P6, §4, K14 |
| E-01-19/20 Ekip şeridi | gizli | ✓ yönetici | P6 (veri `reportDashboard`'da mevcut; faz kararı) |
| E-01-21…38 Koordinatörlükler | gizli | ✓ yönetici; eksik alanlar BE-078 (onayda/iade), BE-079 (avatarlar), BE-025 (son yükleme), arşiv sayısı F5 `archiveFolders` | P6, K3 |
| E-01-39 Alt bilgi | gizli | ✓ yönetici | P6 |
| E-01-40…47 Çizilmeyen öğeler | uygulanmaz | uygulanmaz | tasarımda çizilmiyor; P3 (yeni kuyruk/kısayol icat edilmez) |

## Dosyalar
**Durum: kabul** (2026-11-08, ürün kararı P6; F1 kapsamı KPI + sade özet; F6 satırları F1'de gizli).

| Dosya | Durum | Son güncelleme | Üreten |
|---|---|---|---|
| ozellikler.md | denetlendi | 2026-11-08 | tasarım analisti |
| mekanizma.md | denetlendi | 2026-11-08 | tasarım analisti |
| backend.md | denetlendi | 2026-11-08 | backend analisti |
| eksikler.md | denetlendi | 2026-11-08 | backend analisti |
| dogrulama.md | denetlendi | 2026-11-08 | denetçi (Sonnet) |

## Uygulama kararı tablosu (CX-M-07)

Karar tarihi 2026-11-08; kaynaklar `../ortak-kurallar.md` §1–§12 (P1–P8) ve `../sentez.md` §1 (G2, G3, G5, G15, G21). "F1'de gizli" = bileşen F1 yapısında çizilmez (kesikli çerçeve de yok); Faz sütunu canlıya geçtiği fazı gösterir. Sayaç dili: imleç bitmemişse "yüklenen kayıtlar içinde" (§10, P4).

| E-kimliği | Faz | Davranış (canlı / statik / gizli / devre dışı) | Kabul edilmiş varsayım (öneri / kabul / ret — ortak-kurallar §2) | BE bağı | Bağımlılık | Kabul kanıtı |
|---|---|---|---|---|---|---|
| E-01-01 Selamlama | F1 | canlı, bütün mercekler | **öneri:** adın `full_name` ilk sözcüğü (ozellikler E-01-01) — karar gelene dek **tam `full_name`** gösterilir (sözleşmeye en yakın, §2 en dar güvenli). Sabit tasarım metni kopyalanmaz. | — | 00 `me` sorgusu (`['me']`, §6) | bileşen testi: "Merhaba ‹full_name›" `me` yanıtından; boş ad yok (`full_name` zorunlu) |
| E-01-02 "Silinen kayıtlar" | F5 | F1'de **gizli**; **F5 canlı (P36):** yönetici, sayaç `deleted_records`, hedef `/silinen-kayitlar` (12) | **kabul (P6, P36):** F1'de gizli; F5'te canlanır, hedef 12 Silinen kayıtlar. "Neyi sayar" notu (`deleted_records` şirket geneli hesapları da içerir, G15) geçerli; liste ile uyuşmazlık BE-119. | BE-036 (2) belge, BE-119 | `reportDashboard`; 12 Silinen kayıtlar (W128) | F1 yapısında düğme DOM'da yok (bileşen testi) |
| E-01-03 KPI kart kabı | F1 | canlı (4 kart; tıklama → 03 Görevler) | **kabul (P6, P3):** KPI şeridi F1, ortak `shared/ui` KPI kartı. **öneri:** süzgecin URL'de taşınması (`/gorevler?durum=…`, mekanizma §1) — 03 süzgeç adları kesinleşene dek tıklama 03'e **süzgeçsiz** gider. **kabul (koordinatör, 2026-11-09)** — tıklama `/gorevler?durum=…` (03 kataloğundaki `durum` değeriyle; yukarıdaki "süzgeçsiz" önerisi kapandı); çubuk doluluğu tek dinamik özel özellik `--home-kpi-fill`; kapsam (birim) seçilmemişken bölgede "Kapsam seçin" notu (W51) | — | 03 rota/süzgeç adları | e2e: kart tıklaması 03 rotasını açar; yükleniyor iskeleti, bölge hatası "Yeniden dene" · PR #39 |
| E-01-04 "Tamamlanma" | F1 | canlı | **kabul (P6, G15):** Admin `reportDashboard` `completed_tasks/total_tasks`. **kabul (P3, P4, §10):** Koordinatör = seçili birim, Üye = "bana atananlar" (`assignee_account_ids ∋ me.account_id`, birleşik rolde zorunlu) `countProgramWorkItems` sunucu sayaçları (`department_id`, Üye için `assignee_account_id`; kesin — "yüklenen kayıtlar içinde" etiketi kalktı, WP2a). **kabul (§4):** `total = 0` → "%0" + nötr not ("Henüz görev yok"), "0 görevin 0’ı" yazılmaz. Türkçe ek (’i/’ı/’u/’ü) istemci yardımcısıyla. | BE-003, BE-009, BE-038 (Ü süzgeci) | `reportDashboard` (yalnız `company_admin` + Admin merceği, P1); `countProgramWorkItems` (03 ile aynı süzgeç ve görünürlük, `workItems.counts` anahtarı, §6) | birim: Admin fixture → %; K/Ü fixture (birleşik rol dahil) → sunucu sayacı, `assignee_account_id` Üye'de gider; liste ucu çağrılmaz; K/Ü merceğinde `reportDashboard` **çağrılmaz** (403 yok) |
| E-01-05 "Açık görev" | F1 | canlı | **kabul (G15, (kod)):** Admin `active_tasks` (= total − completed, `onaya_sunuldu`+`iade_edildi` dahil); zamanında = `active_tasks − overdue_tasks`. K/Ü: `countProgramWorkItems` `total − by_status.tamamlandi` (G2, 5 durum; WP2a). Etiket ve sayım E-01-04 ile aynı kural. | BE-003, BE-009, BE-036 (2) | E-01-04 ile aynı | birim: `iade_edildi` açık sayılır |
| E-01-06 "Gecikmede" | F1 | canlı | **kabul (G3, G15):** Admin `overdue_tasks`; K/Ü `countProgramWorkItems.overdue` (sunucu: tamamlanmamış ve `end_on` < bugün; `is_overdue` ile aynı kural, WP2a). Sayı `--danger`. | BE-003, BE-009, BE-036 (1) | E-01-04 ile aynı | birim: tamamlanmış geç görev sayılmaz; % = geciken/açık, açık = 0 → nötr |
| E-01-07 "Onay bekleyen" | F1 | canlı (sayı + çubuk) | **kabul (G15, P5):** Admin `pending_approvals` (GAP-075 sınanmaz); K/Ü `by_status.onaya_sunuldu`. **öneri:** sabit not "Kanıt yüklendi, onay sırasında" — kanıt kuralı görev düzeyinde (G9, P5 "yeni zorunluluk bayrağı yok"), her onaya sunuş kanıt taşımayabilir; karar gelene dek **not satırı boş**. | BE-003, BE-009 | E-01-04 ile aynı | birim: `iade_edildi` onayda sayılmaz; not satırı render edilmez |
| E-01-08 "Hızlı işlemler" başlığı | F1 | canlı (sabit metin) | **kabul (P6):** kart F1'de; içinde yalnız capability'si olan kutucuklar. | — | — | görsel: 2 sütun ızgara |
| E-01-09 "Yeni görev" | F1 | canlı | **kabul (P3, P1, K1):** 03'ün `shared/ui` ortak yeni görev formu açılır (formun ana sayfada mı 03'te mi açıldığı 03 kararını izler); görünürlük `createWorkItem` capability'si (`company_admin` ya da seçili birimde `koordinator`), merceğe değil yetkiye bağlı; salt üyede gizli. Kısayol tuşu yok (E-01-44 ret). **kabul (koordinatör, 2026-11-09)** — görünürlük work `canCreateWorkItem` capability'si (W51) | — | 03 yeni görev formu + `capabilities.ts` (work) | e2e: Admin/Koordinatör'de görünür ve formu açar, salt üyede DOM'da yok; Admin Üye merceğinde de görünür (P1) · PR #39 |
| E-01-10 "Toplantı oluştur" | F4 | devre dışı, faz notu "F4'te" | **kabul (P2, §5):** ekran içi faz dışı eylem açıklamalı devre dışı; `designStub` yok (§3, faz ertelemesi). Görünürlük `company_admin` ya da `koordinator` (backend.md §3). | — | 09c formu (F4) | bileşen: `aria-disabled`, ipucu "F4'te"; tıklama gezinmez |
| E-01-11 "Kullanıcı davet et" | F2 | devre dışı, faz notu "F2'de" | **kabul (P2, §5):** F2'ye kadar devre dışı; `designStub` yok. F2'de 05 ekleme akışına (geçici parola, "davet" değil) bağlanır; görünürlük `company_admin` ya da `koordinator` (yalnız `uye` açar). | BE-013 (davet bağlantısı, F2'de değerlendirilir) | 05 Kullanıcılar ekleme akışı (F2) | bileşen: devre dışı + "F2'de"; salt üyede gizli |
| E-01-12 "Rapor oluştur" | F6 | F1'de **gizli** | **kabul (P6):** raporlar F6 — kutucuk F1'de çizilmez (P6 F6 listesi P2 "devre dışı" genel kuralına göre özeldir). Hedef ekran tasarımda yok → F6'da karar (öneri). | — | F6 rapor/PDF ekranı | F1 yapısında kutucuk yok |
| E-01-13 "Son işlemler" başlığı + "Tümü" | F1 | başlık statik; "Tümü" **devre dışı** | **kabul (P6, §5, K14):** "Tümü" → 01b v1 dışı; açıklamalı devre dışı, `designStub` yok. | BE-030 | 01b (v1 dışı) | bileşen: "Tümü" `aria-disabled`, tıklama gezinmez |
| E-01-14 Akış listesi | F1 | statik — nötr yer tutucu "Henüz işlem geçmişi yok" (`rp-empty`), `designStub('BE-010', …)` | **kabul (P6, §4, G21):** sahte/örnek akış yok; audit okuma ucu yok. **ret:** `listProgramWorkItems` `created_at` + `created_by_full_name` kısmi kaynağı (eksikler §3 — yalnız "Görev oluşturuldu", "son N" kesin değil, yanıltıcı). **öneri:** BE-010 kapanınca son 8–10 kayıt + "Tümü" (mekanizma §5). | BE-010, BE-091 | — | birim: yer tutucuda ad/tarih/sayı/işlem metni yok; `designStub` lint (`tests/lint/design-stub.test.ts`) |
| E-01-15 Akış satırı — nokta | sonra (BE-010) | gizli (yer tutucu satır çizmez) | **kabul (§4, P6):** satır öğeleri veri gelene dek çizilmez. | BE-010 | E-01-14 | F1'de `ol.rp-timeline` satırı yok |
| E-01-16 Akış satırı — kişi | sonra (BE-010) | gizli | **kabul (§4, P6)**; **öneri:** tıklama hedefi (05b kişi mi, ilgili kayıt mı — ozellikler §7/5), BE-010 açılınca karar. | BE-010 | E-01-14 | aynı |
| E-01-17 Akış satırı — tür | sonra (BE-010) | gizli | **kabul (§4, P6)**; tür kümesi audit sözleşmesine bağlı (G21). | BE-010 | E-01-14 | aynı |
| E-01-18 Akış satırı — zaman | sonra (BE-010) | gizli | **kabul (§4, P6)**; **öneri:** dünden eski kayıt biçimi (ozellikler §7/4). | BE-010 | E-01-14 | aynı |
| E-01-19 Ekip toplamı | F6 | F1'de **gizli** | **kabul (P6):** ekip şeridi F6 (veri `reportDashboard`'da olsa da). Kapsam: `total_admins` şirket geneli, diğerleri program (G15) — F6'da olduğu gibi gösterilir mi: öneri. | BE-036 (2) | `reportDashboard` | F1 yapısında bölge yok |
| E-01-20 Rol kartı ×3 | F6 | F1'de **gizli** | **kabul (P6)**; **öneri:** tıklama → 05 rol sekmesi URL süzgeci (mekanizma §1). | BE-011 (05 liste tarafı), BE-036 (2) | 05 rol sekmeleri (F2) | aynı |
| E-01-21 Koordinatörlükler başlığı + ipucu | F6 | F1'de **gizli** | **kabul (P6)**; **öneri:** ipucundaki sayı süzgeç sonrası (mekanizma §5). | — | `reportDashboard.coordinatorship_stats` | aynı |
| E-01-22 "Tümünü gör" | F6 | F1'de **gizli** | **kabul (P6)**; hedef 08 (F2). | — | 08 | aynı |
| E-01-23 Arama | F6 | F1'de **gizli** | **kabul (P6)**; **öneri:** kısa gecikmeli (debounce) süzme (mekanizma §5); Türkçe katlama GAP-036. | — | — | aynı |
| E-01-24 Durum süzgeci | F6 | F1'de **gizli** | **kabul (P6)**; **öneri:** süzgeç sayıları aramadan bağımsız (mekanizma §5). | — | — | aynı |
| E-01-25 "Sırala" düğmesi | F6 | F1'de **gizli** | **kabul (P6)**; **öneri:** ters sırada "↑" (ozellikler E-01-25). | — | — | aynı |
| E-01-26 Sıralama menüsü | F6 | F1'de **gizli** | **kabul (P6)**; **öneri:** menü geçişleri (seçimde `reversed=false`, ters çevirince kapanma; mekanizma §3), eşitlikte ikincil ölçüt ad A→Z `Intl.Collator('tr')` (mekanizma §5). "Son yükleme" ölçütü BE-025 kapanana dek devre dışı. | BE-025 | — | aynı |
| E-01-27 Boş durum | F6 | F1'de **gizli** | **kabul (P6).** | — | — | aynı |
| E-01-28 Koordinatörlük kartı | F6 | F1'de **gizli** | **kabul (P6, P4/K3):** tek toplu uç; koordinatör merceğinde çoklu kart yok. **öneri:** koordinatör merceğinde kartlar gizli mi yalnız seçili birim mi (mekanizma §2) — F6'da karar. 200 satır kesme uyarısı (G15). | BE-036 (3) | `reportDashboard` | aynı |
| E-01-29 Kart — ad | F6 | F1'de **gizli** | **kabul (P6)**; hedef 08b (`department_id`). | — | 08b | aynı |
| E-01-30 Kart — koordinatör(ler) | F6 | F1'de **gizli** | **kabul (P6).** | — | — | aynı |
| E-01-31 Kart — avatar yığını | F6 | F1'de **gizli** | **kabul (P6)**; **öneri:** bütün üyelerin avatarı mı, koordinatörler + üye sayısı mı (ürün kararı, BE-079 koşullu). | BE-079 | — | aynı |
| E-01-32 Kart — görev toplamı | F6 | F1'de **gizli** | **kabul (P6).** | — | — | aynı |
| E-01-33 Kart — durum çubuğu | F6 | F1'de **gizli** | **kabul (P6, P5, G2):** 5 durum 4 dilime "onayda" etiketiyle sığdırılmaz. **öneri:** BE-078 kapanana dek artık dilim nötr renk "onayda/iade" (kayıt "Şimdilik") — F6'da karar. | BE-078 | — | aynı |
| E-01-34 Kart — durum satırı | F6 | F1'de **gizli** | E-01-33 ile aynı. | BE-078 | — | aynı |
| E-01-35 Kart — "geciken" | F6 | F1'de **gizli** | **kabul (P6)**; hedef 03 `department_id` + gecikme. | — | 03 | aynı |
| E-01-36 Kart — "kullanıcı" | F6 | F1'de **gizli** | **kabul (P6)**; **öneri:** `member_count + coordinators.length` (yalnız kod; BE-036 (2) belgelenene dek). | BE-036 (2) | 08b | aynı |
| E-01-37 Kart — "arşiv" | F6 | F1'de **gizli** | **kabul (P6)**; `archiveFolders` (F5) ikinci istek; S3 departman başlığı belirsiz (G18). | — (yeni-4 zorunlu değil) | 06 Arşiv (F5) | aynı |
| E-01-38 Kart — son yükleme | F6 | F1'de **gizli** | **kabul (P6)**; **ret:** `last_activity_at`'ı "son yükleme" diye kullanmak (görev güncellemesidir). BE-025 kapanana dek satır gizli. | BE-025 | — | aynı |
| E-01-39 Alt bilgi | F6 | F1'de **gizli** | **kabul (P6).** | BE-036 (2) | `reportDashboard` | aynı |
| E-01-40 Dikkat kuyrukları | — | uygulanmaz | **ret:** tasarımda çizilmiyor; uygulanmaz (§2.7). | — | — | yok |
| E-01-41 Kuyruk satırı + "Hatırlat" | — | uygulanmaz | **ret:** tasarımda çizilmiyor; uygulanmaz. "Hatırlat" bu ekranda yok; BE-008 tüketicisi 03/03c, burada `designStub` yok. | — (BE-008 03/03c'de) | — | yok |
| E-01-42 Sayfalayıcı | — | uygulanmaz | **ret:** tasarımda çizilmiyor; uygulanmaz. | — | — | yok |
| E-01-43 Kişisel kısayollar | — | uygulanmaz | **ret:** tasarımda çizilmiyor; uygulanmaz — P3 "yeni kuyruk/kısayol icat edilmez". "Yüksek öncelikli = `yuksek`+`acil`" (G5) eşlemesi de **ret** (öğe yok). | — | — | yok |
| E-01-44 Hızlı işlem kısayol tuşu | — | uygulanmaz | **ret:** tasarımda çizilmiyor; uygulanmaz. | — | — | yok |
| E-01-45 Zengin akış satırı | — | uygulanmaz | **ret:** tasarımda çizilmiyor; uygulanmaz (§4 sahte veri de yasak). | — | — | yok |
| E-01-46 "Tümünü göster (‹n›)" | — | uygulanmaz | **ret:** tasarımda çizilmiyor; uygulanmaz. | — | — | yok |
| E-01-47 Üst düzey sayaçlar | — | uygulanmaz | **ret:** tasarımda çizilmiyor; uygulanmaz. Kenar menüsü rozetleri (`lateCount`, `reqCount`) varsayımı burada değil `00-ortak` tablosunda karara bağlanır. | — (rozetler BE-003, 00'da) | 00-ortak | yok |

**Ekran düzeyi varsayımlar (E-kimliksiz, mekanizma.md):**
- Oturum sonrası varsayılan ekran Ana sayfa (§1) — **kabul** (K10 rota `/`; §5 F1'de canlı menü girişi).
- Kapsam değişince yerel süzgeç/sıralama/arama sıfırlanır (§2) — **kabul** (K2, §6); F1'de yerel durum yok, F6 kartları için geçerli.
- Bölge başına iskelet; bölgeler bağımsız yüklenir; bölge içi hata + "Yeniden dene", sayfa düşmez (§6) — **kabul** (P3 ortak bileşen, backend.md §2 hata tablosu).
- KPI sıfırken nötr metin (§6) — **kabul** (§4; E-01-04).
- Son işlemler boşken `rp-empty` (§6) — **kabul** (§4, P6; E-01-14).
- Kart "Son yükleme" hiç yükleme yokken (§6) — F6; BE-025 kapanana dek satır gizli (E-01-38).

Faz açılışında koordinatör doldurur; uygulayıcı yalnız `kabul` satırlarını kodlar.

## Açık sorular (ürün sahibine)
- Koordinatör/üye ana sayfası nasıl görünecek? Tasarımda yalnız yönetici görünümü çizili. Örnek verideki "kişisel kısayollar" (Bana atanan, Bu hafta bitiyor, Yüksek öncelikli gecikenler, Geri gönderilenler) ve "dikkat kuyrukları" (Geciken / Onay / Tarih talebi + "Hatırlat" + sayfalayıcı) çizilecek mi?
- BE-008 ("Hatırlat") güncel işaretlemede çizilmeyen bir öğeye bağlı. Satır kalsın mı, kuyruk bölgesi tasarıma geri mi gelecek?
- "Son işlemler": güncel işaretlemedeki sade biçim (ad + tür + saat) mi, örnek verideki zengin biçim (avatar, rol rozeti, renkli tür, eylem metni) mi? Kaç satır? Satıra tıklayınca kişiye mi kayda mı gidilir? BE-010 kapanana kadar statik örnek akış göstermek kullanıcıyı yanıltır mı (gizlemek bir seçenek)?
- "Silinen kayıtlar" neyi sayar (yalnız görevler mi, toplantı/dosya da mı) ve hangi ekrana gider? (Backend: `deleted_records` görev + toplantı + programa bağlı departman + şirket geneli silinmiş hesapları tek sayıda toplar; tek hedef liste yok, `backend.md` E-01-02.)
- Hızlı işlemlerden faz dışı olanlar (Toplantı oluştur F4, Kullanıcı davet et F2, Rapor oluştur F6) F1'de devre dışı mı görünsün, gizli mi olsun?
- Ekip şeridindeki rol sayıları kişi mi rol satırı mı sayar (örnekte toplam kullanıcı sayısını aşıyor)? Şirket geneli mi seçili program mı? (Backend yanıtı, `backend.md` E-01-19/20: tekil hesap sayılır, bir hesap birden çok rolde olabilir; `total_admins` şirket geneli, diğerleri program kapsamlı. Ürün sahibine kalan: bu karışık kapsamın alt bilgide olduğu gibi gösterilip gösterilmeyeceği.)
- KPI'lar koordinatör merceğinde birim geneli mi, üye merceğinde yalnız "bana atananlar" mı? (Sözleşme yanıtı: koordinatör merceğinde koordinatörü olduğu birimin bütün görevleri, üye merceğinde yalnız kendisine atananlar; birim geneli KPI üye için kurulamaz. Ürün sahibine kalan: üye merceğinde KPI etiketlerinin "Görevlerim" anlamına gelen metni, `eksikler.md` §4/3.)
- Koordinatör merceğinde koordinatörlük kartları gizli mi, yalnız kendi birimleri mi görünür?
