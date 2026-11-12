# 12 · Silinen kayıtlar

**Tespit durumu:** W119 (WEB-5 O1), 2026-11-12 · bağımsız denetçi ve Codex kapısı bekliyor (`dogrulama.md`). Ortak kurallar `../ortak-kurallar.md`.

**Artboard'lar:** `Silinen-Kayitlar-Tarih.dc.html` (`01d · Silinen kayıtlar › seçilen · silinme tarihi sütunu`, **seçilen**), `Silinen-Kayitlar.dc.html` (`01c · … önceki seçenek · günlük gruplar`, yalnız fark notu), `Sablon-KayitListesi.dc.html` (`Şablon · Kayıt listesi sayfası`)
**Faz:** F5 · **v1:** — (v1 = F0–F4; F5 ekranı) · **Yol haritası bağı:** K1, K2, K3, K5, K7, K10, K13; §4 F5 satırı ("silinenler/geri yükleme"); `../ortak-kurallar.md` §12 P36, P37, P41
**Rota (önerilen, K10):** `/silinen-kayitlar` — tipli süzgeçler: `tur` (`gorev` | `toplanti` | `koordinatorluk` | `kullanici`; varsayılan `gorev`), `q` (arama), `koordinatorluk` (departman kimliği, tekil), `kayit` (seçili kayıt kimliği), `aralik` (`bugun` | `7gun` | `tumu`, öneri), `silen` (hesap kimliği, yalnız `tur=toplanti`, öneri). Kenar menüsünde giriş **yok** (tasarım Sidebar `active="home"`); giriş ana sayfa E-01-02 düğmesidir.

## Özet
Şirket yöneticisinin silinmiş kayıtları türüne göre listelediği, tek tek geri yüklediği ya da kalıcı sildiği ekran. Pin `v0.15.0-api`'de **dört canlı tür** vardır: Görev, Toplantı, Koordinatörlük (silinen departman; P41) ve Kullanıcı (hesap); her biri ayrı imleçli uçtur ve birleştirilmez (fan-out yasağı). Tasarımdaki Alt görev, Dosya, Not ve gündem türleri, "Çöpü boşalt", "CSV indir", toplu seçim/işlem, "kalan süre" ve "Yakında kalıcı silinecek" kartı backend'de karşılıksızdır ve gizli ya da devre dışıdır. Sağ panel seçili satırın alanlarını yalnız liste öğesinden gösterir. Ana sayfadaki "Silinen kayıtlar ‹n›" sayacı (`deleted_records`) buraya götürür. Yetki yalnız `me.company_admin` olgusundan (K1). Ana veri: `listDeletedWorkItems`, `listDeletedMeetings`, `listDeletedDepartments`, `listDeletedAccounts` + `restore*` / `permanentDelete*`.

## Dosyalar
| Dosya | Durum | Son güncelleme | Üreten |
|---|---|---|---|
| ozellikler.md | taslak | 2026-11-12 | tasarım analisti (W119) |
| mekanizma.md | taslak | 2026-11-12 | tasarım analisti (W119) |
| backend.md | taslak | 2026-11-12 | backend analisti (W119) |
| eksikler.md | taslak | 2026-11-12 | backend analisti (W119) |
| dogrulama.md | öz denetim; bağımsız denetçi bekliyor | 2026-11-12 | W119 |

## Uygulama kararı tablosu (CX-M-07)
Faz açılışında koordinatör doldurur; uygulayıcı yalnız `kabul` satırlarını kodlar (`../ortak-kurallar.md` §2). Bu tablo W119 tarafından **taslak** olarak doldurulmuştur: `kabul (P36/P37/P41/P4/...)` ürün sahibi kararı, `öneri` kodlanmaz (en dar güvenli davranış: gizli/devre dışı + "karar bekliyor"), `ret` kodlanmaz. Kaynaklar: `../ortak-kurallar.md` §1–§7, §9, §10, §12; `backend.md` (pin `v0.15.0-api`); `eksikler.md`; `mekanizma.md`; `../../backend-eksikleri/kayit.md` (BE-108…BE-119). Uygulayıcı: W128. Kabul kanıtı sütunu **planlanan** test dosyalarıdır (henüz yok): `DeletedRecordsPage.test.ts`, `DeletedRecordRow.test.ts`, `DeletedDetailPanel.test.ts`, `model/deleted-list.test.ts`, `deleted-actions.test.ts`, `deleted-routes.test.ts`, `query-keys.test.ts`, `HomeAdminDeleted.test.ts`.

| E-kimliği | Faz | Davranış (canlı / statik / gizli / devre dışı) | Kabul edilmiş varsayım (öneri / kabul / ret) | BE bağı | Bağımlılık | Kabul kanıtı |
|---|---|---|---|---|---|---|
| E-12-01 Üst çubuk | F5 | canlı (ortak) — `00-ortak`; bu grupta yeniden tanımlanmaz | kabul (00-ortak) | — | W128 | DeletedRecordsPage.test.ts (kabuk içinde render) |
| E-12-02 Konum yolu | F5 | canlı — "‹program adı› / Silinen kayıtlar"; ilk parça program ekranına bağlantı yoksa düz metin | kabul (00-ortak) | — | W128 | DeletedRecordsPage.test.ts |
| E-12-03 Sayfa başlığı | F5 | canlı — H1 "Silinen kayıtlar" | kabul (P36) | — | W128 | DeletedRecordsPage.test.ts |
| E-12-04 Alt başlık | F5 | canlı — "‹N› ‹tür› · yalnız yönetici görür"; N yüklenen sayı (imleç bitmediyse "‹n›+", "yüklenen kayıtlar içinde"); saklama cümlesi yok | kabul (P37); kabul — ortak-kurallar §10 | BE-110, BE-119 | W128 | model/deleted-list.test.ts |
| E-12-05 CSV indir | F5 | devre dışı (statik) — açıklamalı "yakında"; tetiklenmez | kabul (P36) | BE-116 | W128 | DeletedRecordsPage.test.ts |
| E-12-06 Çöpü boşalt | F5 | devre dışı (statik) — açıklamalı "yakında" | kabul (P36) | BE-115 | W128 | DeletedRecordsPage.test.ts |
| E-12-07 Saklama notu | F5 | canlı (sabit metin) — "Silinen kayıtlar bir yönetici kalıcı olarak silene kadar saklanır."; ikinci cümle ("bağlı alt görevleri… birlikte döner") ve gün sayısı yok | kabul (P37) | BE-112 | W128 | DeletedRecordsPage.test.ts |
| E-12-08 Tür segmenti | F5 | canlı — `UiSegmented`/ortak çip bileşeni; etkin türün sayacı yüklenen sayı ("‹n›" / bitmediyse "‹n›+"); etkin olmayan türde sayı gösterilmez; URL `tur` | öneri | BE-110 | W128 | model/deleted-list.test.ts; deleted-routes.test.ts |
| E-12-09 "Tümü" seçeneği | F5 | gizli — dört ucun birleşik listesi yapılmaz (K3, ortak-kurallar §9); varsayılan sekme Görev | öneri | BE-110 | W128 | DeletedRecordsPage.test.ts (DOM'da yok) |
| E-12-10 Görev seçeneği | F5 | canlı — `listDeletedWorkItems`; varsayılan sekme | kabul (P36) | — | W128 | DeletedRecordsPage.test.ts; model/deleted-list.test.ts |
| E-12-11 Alt görev seçeneği | F5 | devre dışı (statik) — uç yok (alt görev silme kalıcı); sayı yok | kabul (P36) | BE-109 | W128 | DeletedRecordsPage.test.ts |
| E-12-12 Dosya seçeneği | F5 | devre dışı (statik) — dosya çöp kutusu yok | kabul (P36) | BE-076 | W128 | DeletedRecordsPage.test.ts |
| E-12-13 Toplantı seçeneği | F5 | canlı — `listDeletedMeetings`; 09 `DeletedMeetings` ile veri/anahtar paylaşılır | kabul (P36) | — | W128 | DeletedRecordsPage.test.ts; model/deleted-list.test.ts |
| E-12-14 Kullanıcı seçeneği | F5 | canlı — `listDeletedAccounts` (hesap; S1) | kabul (P36) | BE-118 | W128 | DeletedRecordsPage.test.ts; model/deleted-list.test.ts |
| E-12-15 Not ve gündem seçeneği | F5 | devre dışı (statik) — uç yok (toplantı notu kalıcı silinir) | kabul (P36) | BE-111 | W128 | DeletedRecordsPage.test.ts |
| E-12-16 Koordinatörlük seçeneği (tasarımda yok) | F5 | canlı — `listDeletedDepartments`; ortak çip/segment bileşeniyle en sade biçim (P3), konum Toplantı'dan sonra; sayı kuralı E-12-08 | **kabul** (P41) | BE-119 | W128 | DeletedRecordsPage.test.ts; model/deleted-list.test.ts |
| E-12-17 Silinme tarihi aralığı | F5 | canlı (istemci) — Bugün / Son 7 gün / Tümü; `deleted_at DESC` sırasından yararlanıp eşik aşılana kadar sayfa yükler; menü öğesi sayıları gizli; hesap ve Koordinatörlük'te `deleted_at` boş olabileceğinden hesapta devre dışı; etiket "Tümü" (gün sayısı yok); URL `aralik` | öneri | BE-117, BE-118 | W128 | model/deleted-list.test.ts; deleted-routes.test.ts |
| E-12-18 Silen süzgeci | F5 | canlı yalnız Toplantı (adaylar yüklenen kümedeki `deleted_by`; `null` = "Bilinmiyor"); Görev/Koordinatörlük/Kullanıcı'da devre dışı (alan yok) | kabul (P36) | BE-108, BE-117 | W128 | model/deleted-list.test.ts |
| E-12-19 Koordinatörlük süzgeci | F5 | canlı (istemci, yüklenen küme) — Görev (`department_id`) ve Toplantı (`owner_department_id`/`departments[]`); tek seçim; Koordinatörlük ve Kullanıcı'da gizli/devre dışı; URL `koordinatorluk` | kabul (P36); kabul — P4 | BE-117 | W128 | model/deleted-list.test.ts; deleted-routes.test.ts |
| E-12-20 Arama | F5 | canlı (istemci, yüklenen küme) — Türkçe katlamalı; yer tutucu "Yüklenen kayıtlarda ara"; URL `q` | kabul (P36) | BE-117, BE-004 | W128 | model/deleted-list.test.ts |
| E-12-21 Toplu işlem çubuğu | F5 | gizli — toplu uç yok (P7 kalıbı) | kabul (P36) | BE-114 | W128 | DeletedRecordsPage.test.ts (DOM'da yok) |
| E-12-22 Satır seçim kutusu | F5 | gizli (toplu seçim) | kabul (P36) | BE-114 | W128 | DeletedRecordRow.test.ts (DOM'da yok) |
| E-12-23 Tümünü seç | F5 | gizli | kabul (P36) | BE-114 | W128 | DeletedRecordsPage.test.ts |
| E-12-24 Tablo ve başlık satırı | F5 | canlı — `role=table`; sütunlar tür, kayıt, silinme tarihi, silen, işlemler (seçim ve kalan süre sütunları yok → ızgara yeniden hesaplanır) | kabul (P36); kabul (P37) | — | W128 | DeletedRecordsPage.test.ts |
| E-12-25 Tür rozeti hücresi | F5 | canlı — tür etiketi + ortak token rengi (Görev `--violet`, Toplantı `--accent-text`, Kullanıcı `--danger`; Koordinatörlük için yeni renk icat edilmez) | kabul (P36); kabul (P41) | — | W128 | DeletedRecordRow.test.ts |
| E-12-26 Kayıt: kod | F5 | gizli — `DeletedWorkItem`'da kod yok | kabul (P36) | BE-005 | W128 | DeletedRecordRow.test.ts |
| E-12-27 Kayıt: başlık | F5 | canlı — `title` / `name` / `full_name`; kısaltmalı | kabul (P36) | — | W128 | DeletedRecordRow.test.ts |
| E-12-28 Kayıt: alt satır | F5 | canlı (türetilmiş) — görev "‹departman adı› › Görevler"; toplantı "‹tarih saat› · ‹sahip koordinatörlük›"; koordinatörlük `kind`; kullanıcı yok | öneri | — | W128 | DeletedRecordRow.test.ts |
| E-12-29 Kayıt: uyarı rozeti | F5 | gizli — veri yok (sahte uyarı üretilmez) | kabul — ortak-kurallar §4 | BE-108 | W128 | DeletedRecordRow.test.ts |
| E-12-30 Silinme tarihi hücresi | F5 | canlı — `deleted_at` (kurulum saat dilimi) "gg.aa.yyyy" + "SS:DD" + "bugün"; `title` uzun biçim, "kalıcı silinme" parçası yok; hesapta ve boş tarihte "—" | kabul (P37); kabul (P36) | BE-118 | W128 | DeletedRecordRow.test.ts |
| E-12-31 Silinme tarihi başlığı (sıralama) | F5 | devre dışı gösterge — yalnız varsayılan "en yeni üstte" (`aria-sort=descending`); ters çevirme yok (sunucu `sort` yok) | kabul (P36) | BE-117 | W128 | DeletedRecordRow.test.ts |
| E-12-32 Silen hücresi | F5 | canlı yalnız Toplantı (`deleted_by.full_name`, baş harfler istemcide; boş → "Bilinmiyor"); diğer türlerde "—" | kabul (P36) | BE-108 | W128 | DeletedRecordRow.test.ts |
| E-12-33 Kalan süre sütunu | F5 | gizli — saklama süresi yok | kabul (P37) | BE-112 | W128 | DeletedRecordsPage.test.ts |
| E-12-34 Kalan süre başlığı (sıralama) | F5 | gizli | kabul (P37) | BE-112 | W128 | DeletedRecordsPage.test.ts |
| E-12-35 Satır "Geri yükle" | F5 | canlı — onay (E-12-58) → tür uç; `useProtectedMutation`; başarıda tür listesi + bağlı sorgular geçersiz (backend §5) | kabul (P36) | — | W128 | deleted-actions.test.ts |
| E-12-36 Satır "Kalıcı sil" | F5 | canlı — onay (E-12-59) → tür uç; geri alınamaz | kabul (P36) | — | W128 | deleted-actions.test.ts |
| E-12-37 Seçili satır | F5 | canlı — satır tıklaması/Enter paneli doldurur; URL `kayit`; ilk yüklemede seçim yok ("Bir kayıt seçin") | kabul (P36) | — | W128 | DeletedRecordRow.test.ts; DeletedDetailPanel.test.ts |
| E-12-38 Sayaç satırı | F5 | canlı — "‹n› kayıt yüklendi" (+ "daha var"); süzgeçliyse "‹m› kayıt gösteriliyor (yüklenen ‹n› içinde)"; "x / y" yok | kabul — ortak-kurallar §10 | BE-110 | W128 | model/deleted-list.test.ts |
| E-12-39 "Daha fazla" düğmesi | F5 | canlı — etiket "Daha fazla yükle" (P4; tasarım metni "Daha fazla göster"), imleç sonraki sayfa; bitince gizli | kabul (P4) | — | W128 | model/deleted-list.test.ts |
| E-12-40 İz kaydı notu | F5 | canlı (sabit metin) — restore/purge audit satırı yazılır (kanıt: `audit.entry_rejected` 500); "işlem geçmişi" bağlantısı yok | öneri | — | W128 | DeletedRecordsPage.test.ts |
| E-12-41 Panel kartı ve tür rozeti | F5 | canlı — seçili satırın türü | kabul (P36) | — | W128 | DeletedDetailPanel.test.ts |
| E-12-42 Panel başlığı | F5 | canlı — kod yok; ad | kabul (P36) | BE-005 | W128 | DeletedDetailPanel.test.ts |
| E-12-43 Panel konum satırı | F5 | canlı (türetilmiş) — görevde departman adı "› Görevler"; toplantıda sahip koordinatörlük | kabul (P36) | — | W128 | DeletedDetailPanel.test.ts |
| E-12-44 Panel: Silen | F5 | canlı yalnız Toplantı; diğerlerinde satır gizli | kabul (P36) | BE-108 | W128 | DeletedDetailPanel.test.ts |
| E-12-45 Panel: Silinme | F5 | canlı — `deleted_at`; hesapta satır gizli | kabul (P36) | BE-118 | W128 | DeletedDetailPanel.test.ts |
| E-12-46 Panel: Kalıcı silinme | F5 | gizli | kabul (P37) | BE-112 | W128 | DeletedDetailPanel.test.ts |
| E-12-47 Panel: Durumu | F5 | canlı yalnız Görev (`status` adı); "· %40" yüzdesi gizli | kabul (P36) | BE-113 | W128 | DeletedDetailPanel.test.ts |
| E-12-48 Panel: Atananlar | F5 | gizli — liste öğesinde yok; `getWorkItem` silinmişte 409 `work.item_deleted` | kabul (P36) | BE-113 | W128 | DeletedDetailPanel.test.ts |
| E-12-49 Birlikte geri gelecek: Alt görev | F5 | gizli — sayı yok (WORK-K74) | kabul (P36) | BE-113 | W128 | DeletedDetailPanel.test.ts |
| E-12-50 Birlikte geri gelecek: Kanıt dosyası | F5 | canlı yalnız Görev (`file_count`); satır tek kalırsa başlık "birlikte geri gelecek" korunur | kabul (P36) | — | W128 | DeletedDetailPanel.test.ts |
| E-12-51 Birlikte geri gelecek: Yorum | F5 | gizli | kabul (P36) | BE-113 | W128 | DeletedDetailPanel.test.ts |
| E-12-52 Birlikte geri gelecek: Tarih talebi | F5 | gizli | kabul (P36) | BE-113 | W128 | DeletedDetailPanel.test.ts |
| E-12-53 Panel eylemleri | F5 | canlı — "Geri yükle" (birincil), "Kalıcı sil"; satır eylemleriyle aynı akış | kabul (P36) | — | W128 | DeletedDetailPanel.test.ts; deleted-actions.test.ts |
| E-12-54 Panel boş durumu | F5 | canlı — "Bir kayıt seçin" (K7 varsayılanı; tasarımda yok) | öneri | — | W128 | DeletedDetailPanel.test.ts |
| E-12-55 "Yakında kalıcı silinecek" kartı | F5 | gizli | kabul (P37) | BE-112 | W128 | DeletedRecordsPage.test.ts |
| E-12-56 Yakında kartı satırları | F5 | gizli | kabul (P37) | BE-112 | W128 | DeletedRecordsPage.test.ts |
| E-12-57 Yakında kartı alt cümlesi | F5 | gizli | kabul (P37) | BE-112 | W128 | DeletedRecordsPage.test.ts |
| E-12-58 Geri yükleme onayı | F5 | canlı — `shared/ui/confirm` (`alertdialog`): ne olacağı, etkilenen kayıt (1), türe özgü uyarı (hesapta atamalar dönmez, toplantıda konferans dönmez, departmanın görevleri dönmez); onay düğmesi birincil | kabul (P36) | — | W128 | deleted-actions.test.ts |
| E-12-59 Kalıcı silme onayı | F5 | canlı — `shared/ui/confirm`: geri alınamaz; görevde "‹file_count› dosya da silinir"; onay düğmesi kırmızı | kabul (P36) | — | W128 | deleted-actions.test.ts |
| E-12-60 Boş durum | F5 | canlı — "Silinmiş ‹tür› yok."; neden/ne zaman cümlesi yok | öneri | — | W128 | DeletedRecordsPage.test.ts |
| E-12-61 Süzgeç sonucu boş | F5 | canlı — "Bu filtrelerle kayıt yok." + "Filtreleri temizle"; imleç bitmediyse "Yüklenen kayıtlarda yok, daha fazla yükle" | öneri | — | W128 | model/deleted-list.test.ts |
| E-12-62 Yükleniyor / hata | F5 | canlı — `UiErrorState` (yeniden dene), iskelet/yükleniyor; 403 K6 | öneri | — | W128 | DeletedRecordsPage.test.ts |
| E-12-63 Ana sayfadan giriş (E-01-02) | F5 | canlı F5 — yalnız yönetici; sayaç `deleted_records`; hedef `/silinen-kayitlar`; P6 düzeltmesi | kabul (P36) | BE-119 | W128 | HomeAdminDeleted.test.ts |
| E-12-64 Kenar menüsü girişi | F5 | gizli (hiç yok) — tasarım Sidebar `active="home"` | kabul (P36) | — | W128 | deleted-routes.test.ts |
| E-12-65 Gün grubu başlığı (01c) | F5 | yok — 01d seçildi | **ret** (01d seçildi) | — | W128 | — |
| E-12-66 Satır alanları: Görev | F5 | canlı — backend.md §4 sütunu | kabul (P36) | BE-113 | W128 | DeletedRecordRow.test.ts |
| E-12-67 Satır alanları: Toplantı | F5 | canlı — backend.md §4 sütunu | kabul (P36) | BE-108 | W128 | DeletedRecordRow.test.ts |
| E-12-68 Satır alanları: Koordinatörlük | F5 | canlı — backend.md §4 sütunu | **kabul** (P41) | BE-119 | W128 | DeletedRecordRow.test.ts |
| E-12-69 Satır alanları: Kullanıcı | F5 | canlı — backend.md §4 sütunu (silinme tarihi/silen yok) | kabul (P36) | BE-118 | W128 | DeletedRecordRow.test.ts |

## Açık sorular (ürün sahibine)
Hepsinin önerilen cevabı vardır (`öneri` satırları):
1. **"Tümü" sekmesi (E-12-09):** yapılsın mı? Öneri: **hayır**; dört uç birleştirilmez, varsayılan sekme Görev.
2. **Tür sayaçları (E-12-08):** yalnız açık sekmede "‹n›/‹n›+"; diğer sekmelerde sayı yok. Öneri: **evet** (sunucu sayacı BE-110'a kadar).
3. **Tarih aralığı menüsü (E-12-17):** istemci süzgeci olarak canlı (sayfa yükleyerek) mi, yoksa devre dışı mı? Öneri: **canlı**, menü sayıları gizli, hesapta devre dışı.
4. **Alt satır biçimleri (E-12-28):** görev "‹departman› › Görevler", toplantı "‹tarih saat› · ‹sahip koordinatörlük›", koordinatörlük `kind`. Öneri: **onay**.
5. **İz kaydı cümlesi (E-12-40):** "işlem geçmişine kaydedilir" korunsun mu (01b ekranı v1 dışı, bağlantı yok)? Öneri: **koru, bağlantısız**.
6. **Boş / süzgeç boş / hata metinleri ve panel boş durumu (E-12-54, 60–62):** tasarımda çizilmemiş. Öneri: yukarıdaki sade metinler.
7. **Saklama politikası (BE-112):** otomatik temizlik istenir mi, kaç gün? (P37: şimdi yok.) Öneri: karar F5 sonrası.
8. **Silinen alt görev / not-gündem / dosya (BE-109, BE-111, BE-076):** v1 sonrası model işi olarak ertelensin mi? Öneri: **evet**.
