# 12 — Mekanizma (nasıl davranıyor)

Kararlar: P36, P37, P41 (`../ortak-kurallar.md` §12). Ortak kurallar (mercek≠yetki, varsayım durumları, statik≠sahte veri, sayfa tavanı, yazma protokolü) yeniden yazılmaz: `../ortak-kurallar.md` §1, §2, §4, §7, §9, §10.

## 1. Giriş ve gezinme
- **Giriş:** ana sayfa E-01-02 "Silinen kayıtlar ‹n›" düğmesi (yalnız yönetici; F5'te canlı, P36/P6 düzeltmesi) → `/silinen-kayitlar`. Kenar menüsünde ayrı giriş yoktur (tasarım Sidebar `active="home"`; doğrulandı: Sidebar'ın hiçbir rol varyantında "Silinen kayıtlar" öğesi yok). Derin bağlantı yönetici dışına açılırsa §2.
- **Çıkış:** ekranın başka ekrana bağlantısı yoktur (konum yolu ilk parçası hariç). "Koordinatörlük" türü geri yükleme sonrası 08'e bağlantı verilmez (bildirim yeterli).
- **URL'de taşınan durum:** `tur` (`gorev` | `toplanti` | `koordinatorluk` | `kullanici`; yoksa `gorev`; kayıtsız değer → `gorev`), `q`, `koordinatorluk` (departman kimliği), `kayit` (seçili kayıt kimliği; tür değişince düşer), `aralik` (`bugun` | `7gun` | `tumu`; öneri), `silen` (hesap kimliği; öneri). Devre dışı türler (`altgorev`, `dosya`, `notgundem`) URL değeri olarak **tanınmaz** (→ `gorev`). Tipli parametreler `routes.catalog.ts` kaydına W128 ile girer (K10).

## 2. Kapsam ve rol etkisi (K1, K2)
- **Yalnız şirket yöneticisi** (P36): `me.company_admin`. Mercek (Admin/Koordinatör/Üye kartı) yetki değildir; Koordinatör/Üye merceğindeki yönetici de ekranı görür ve ana sayfa düğmesi kalır (`../ortak-kurallar.md` §1, P1).
- Yönetici olmayan rota doğrudan açarsa: sayfa içeriği yüklenmez, "Bu sayfayı görüntüleme yetkiniz yok" durumu (K7 yetki durumu; menüde yok, ana sayfaya dön bağlantısı). Sunucu 403 (`work.not_authorized`, `organization.not_authorized`, `collaboration.not_authorized`) aynı duruma düşer ve K6 (`me` + `me/departments` geçersiz) tetiklenir.
- **Kapsam:** Görev, Toplantı ve Koordinatörlük uçları S2 (`X-Nizamio-Program`: seçili program; **Koordinatörlük listesi şirket geneli**, başlık yalnız zorunluluk içindir); Kullanıcı ucu S1 (program başlığı yok). Program değişince `scoped(...)` anahtarları düşer ve liste baştan yüklenir; Kullanıcı listesi düşmez (hesap geneli). Program yoksa K7 "program yok" durumu.
- Eylem görünürlüğü `capabilities.ts` (`company_admin` olgusu); rol dizesi karşılaştırması yok.

## 3. Durum makinesi
- **Bellekte:** seçili satırların (E-12-37) "açık menü" durumu, açık onay penceresi, uçuştaki eylemler.
- **URL'de:** `tur`, `q`, `koordinatorluk`, `kayit`, `aralik`, `silen` (§1).
- **Hatırlanmaz:** süzgeçler ve seçim oturum/URL dışında saklanmaz (K2 depolama istisnası yalnız kapsam + tema).
- **Tür değişimi:** önceki türün listesi sorgu önbelleğinde kalır (aynı anahtar); `kayit` ve `silen` temizlenir; `q` ve `aralik` korunur; `koordinatorluk` yalnız Görev/Toplantı'da anlamlıdır (Koordinatörlük/Kullanıcı'ya geçişte temizlenir). Odak segmentte kalır.
- **Seçili kayıt (E-12-37):** `kayit` listede yoksa (silindi, yüklenmedi) panel boş durumu ("Bir kayıt seçin"); kayıt yüklenen sayfalardan çıkmışsa sessizce temizlenmez, "Kayıt yüklenen sayfalarda yok" ipucu.
- **Eylem durumu:** satırda uçuş sırasında düğmeler `aria-disabled`; başarıda satır listeden düşer (yeniden okuma, iyimser güncelleme yok — §7/K5); seçili satır düştüyse `kayit` temizlenir ve odak sıradaki satıra, yoksa segmente gider.

## 4. Etkileşim akışları
**Ortak yazma protokolü** (`useProtectedMutation`, `../ortak-kurallar.md` §7): `X-Requested-With`; **`Idempotency-Key` ve `expected_revision` yok** (altı uçta parametre yok, `backend.md` çerçeve). Eylem bağlamı + oturum neslini taşır; sahip sökülürse ek iş başlamaz. 429 → `Retry-After` metni, otomatik tekrar yok.

**Geri yükle (tek kayıt):**
1. Tetikleyici: satır "Geri yükle" (E-12-35) ya da panel (E-12-53).
2. `shared/ui/confirm` onayı (E-12-58): "‹ad› geri yüklensin mi?" + türe özgü uyarı — Görev: "Silinmiş koordinatörlüğe bağlıysa geri yüklenemez"; Kullanıcı: "Devredilmiş açık görev atamaları geri dönmez"; Toplantı: "Canlı konferans geri gelmez"; Koordinatörlük: "Üyelik yetkileri geri döner, görevleri dönmez".
3. İstek: türe göre `restoreWorkItem` / `restoreMeeting` / `restoreDepartment` / `restoreAccount` (id yolda).
4. Başarı 200: toast "‹ad› geri yüklendi"; kendi listesi + bağlı sorgular geçersiz (`backend.md` §5); satır düşer.
5. Hatalar: 409 `*.not_deleted` → "Kayıt zaten geri yüklenmiş" + liste yenile (başarı gibi); 409 `work.department_unavailable` → "Bu görevin koordinatörlüğü silinmiş ya da programa bağlı değil. Önce Koordinatörlük sekmesinden geri yükleyin" (+ sekmeye geçiş bağlantısı); 404 `*_not_found` → "Kayıt bulunamadı" + liste yenile; 409 `platform.conflict_retry` → motor tek tekrar; 409 `provisioning.write_not_allowed` → yazma kapalı bildirimi; 403 → K6; 5xx/ağ → "sonuç bilinmiyor" (K5): liste yeniden okunur, kayıt hâlâ listedeyse "geri yüklenemedi, yeniden deneyin", yoksa başarı.

**Kalıcı sil (tek kayıt):**
1. Tetikleyici: çöp simgesi (E-12-36) ya da panel (E-12-53).
2. Onay (E-12-59, `alertdialog`, kırmızı düğme): "‹ad› kalıcı olarak silinsin mi? Bu işlem geri alınamaz." Görev: "‹file_count› dosya da silinir." Ek onay yazısı yok.
3. İstek: `permanentDeleteWorkItem` / `permanentDeleteMeeting` / `permanentDeleteDepartment` / `permanentDeleteAccount`.
4. Başarı 200: toast (görevde `files_deleted` sayısı); liste + bağlı sorgular geçersiz.
5. Hatalar: 404 `*_not_found` (ikinci istek/yarış) → başarı gibi, liste yenile; 409 `*.permanent_requires_deleted` → "Kayıt silinmiş durumda değil" + yenile; 409 `work.constraint_violation` / `organization.department_in_use` / `identity.account_referenced` → "Kalıcı silinemedi: kayıt başka kayıtlarca kullanılıyor" (departmanda "görevleri veya program katılımı var"); 500 (görevde ek temizliği hatası: görev silinmiş kalır, GAP-052) → "Silme tamamlanamadı, yeniden deneyin" + yenile; diğerleri geri yükle ile aynı.

**Arama / süzgeç / aralık:** hepsi **istemci süzgeci**dir (yüklenen küme); sunucuya `q`, süzgeç ya da sıra gitmez. Arama yazma gecikmeli (URL `q`); süzgeç değişince yüklenen küme korunur, ek istek yalnız aralık eşiğine ulaşmak için ("Daha fazla yükle" ile aynı uç).
**Aralık (öneri):** "Bugün"/"Son 7 gün" → sıra `deleted_at DESC` olduğundan, aralığın alt sınırından eski bir satır görünene ya da imleç bitene kadar sayfa yüklenir (üst sınır 5 ardışık sayfa, sonra "Daha fazla yükle" elle); "Tümü" ek yükleme yapmaz. Hesapta (silinme tarihi yok) menü devre dışı. Tavan 200/sayfa (`../ortak-kurallar.md` §10).

**Satır seçimi ve panel:** tıklama/Enter satırı seçer (`kayit`), panel liste öğesinden dolar (ek istek yok; görev için `getWorkItem` çağrılmaz — silinmişte 409 `work.item_deleted`). Seçim onay kutusu değildir (kutular gizli).

## 5. Liste davranışı
- **Sayfalama:** imleç (`next_cursor`), sayfa boyu 50 varsayılan, istemci 1…200 gönderir (`backend.md` çerçeve); "Daha fazla yükle" (P4); numaralı sayfalayıcı yok; toplam yok (BE-110).
- **Sıra:** sunucu sırası olduğu gibi: Görev/Koordinatörlük/Toplantı `deleted_at` azalan (kod kaynaklı, sözleşmede yazmıyor); Kullanıcı **oluşturma** tarihi azalan (silinme sırası değil — "silinme tarihi" sütunu hesapta bulunmadığından tutarsızlık görünmez). İstemci yeniden sıralamaz (kısmi küme yanıltır); sıralama düğmeleri devre dışı gösterge (E-12-31).
- **Sayaçlar:** etkin tür için yüklenen sayı; bitmediyse "‹n›+" ve "yüklenen kayıtlar içinde" (§10). Ana sayfa `deleted_records` bu sayılarla eşleşmek zorunda değildir (departman listesi şirket geneli; BE-119) — ekranda eşitlik iddiası yapılmaz.
- **Ana sayfa sayacı → ekran:** düğmedeki n yalnız bilgidir.
- **Süzgeç boşluğu:** E-12-61.

## 6. Boş / yükleniyor / hata durumları
Tasarımda yalnız şablon yer tutucuları vardır; aşağıdakiler "tasarımda yok — K7 varsayılanı" (öneri):
- **Yükleniyor:** ilk yükleme iskeleti; "Daha fazla yükle" düğmesinde meşgul durum.
- **Boş (hiç silinmiş kayıt yok):** "Silinmiş ‹tür› yok." (E-12-60).
- **Süzgeç sonucu boş:** E-12-61.
- **Hata:** okuma hatası → `UiErrorState` + yeniden dene (liste yerinde); 403 → §2; 404 `work.program_scope_invalid` → K6 + program yok durumu; 429 → `Retry-After`.
- **Program yok / üyelik yok (K7):** yönetici için "program oluştur" yönlendirmesi (Görev/Toplantı/Koordinatörlük S2 başlığı ister); Kullanıcı sekmesi S1 olduğundan program yokken de çalışır.
- **Panel:** seçim yoksa "Bir kayıt seçin"; çoklu seçim yok.
- **Kısmi küme:** `X-Result-Truncated` (Koordinatörlük, Kullanıcı) yalnız ipucu; imleç esas.

## 7. Öğe → davranış tablosu
| Kimlik | Öğe | Olay | Davranış | Bağ (mekanizma §, backend.md satırı) |
|---|---|---|---|---|
| E-12-01 | Üst çubuk | — | canlı (ortak) — `00-ortak`; bu grupta yeniden tanımlanmaz | backend.md (—) |
| E-12-02 | Konum yolu | tıklama (ilk parça) | canlı — "‹program adı› / Silinen kayıtlar"; ilk parça program ekranına bağlantı yoksa düz metin | backend.md (—) |
| E-12-03 | Sayfa başlığı | — | canlı — H1 "Silinen kayıtlar" | backend.md (—) |
| E-12-04 | Alt başlık | — | canlı — "‹N› ‹tür› · yalnız yönetici görür"; N yüklenen sayı (imleç bitmediyse "‹n›+", "yüklenen kayıtlar içinde"); saklama cümlesi yok | backend.md (BE-110, BE-119) |
| E-12-05 | CSV indir | tıklama (etkisiz) | devre dışı (statik) — açıklamalı "yakında"; tetiklenmez | backend.md (BE-116) |
| E-12-06 | Çöpü boşalt | tıklama (etkisiz) | devre dışı (statik) — açıklamalı "yakında" | backend.md (BE-115) |
| E-12-07 | Saklama notu | — | canlı (sabit metin) — "Silinen kayıtlar bir yönetici kalıcı olarak silene kadar saklanır."; ikinci cümle ("bağlı alt görevleri… birlikte döner") ve gün sayısı yok | backend.md (BE-112) |
| E-12-08 | Tür segmenti | seçim | canlı — `UiSegmented`/ortak çip bileşeni; etkin türün sayacı yüklenen sayı ("‹n›" / bitmediyse "‹n›+"); etkin olmayan türde sayı gösterilmez; URL `tur` | backend.md (BE-110) |
| E-12-09 | "Tümü" seçeneği | — | gizli — dört ucun birleşik listesi yapılmaz (K3, ortak-kurallar §9); varsayılan sekme Görev | backend.md (BE-110) |
| E-12-10 | Görev seçeneği | seçim | canlı — `listDeletedWorkItems`; varsayılan sekme | backend.md (—) |
| E-12-11 | Alt görev seçeneği | tıklama (etkisiz) | devre dışı (statik) — uç yok (alt görev silme kalıcı); sayı yok | backend.md (BE-109) |
| E-12-12 | Dosya seçeneği | tıklama (etkisiz) | devre dışı (statik) — dosya çöp kutusu yok | backend.md (BE-076) |
| E-12-13 | Toplantı seçeneği | seçim | canlı — `listDeletedMeetings`; 09 `DeletedMeetings` ile veri/anahtar paylaşılır | backend.md (—) |
| E-12-14 | Kullanıcı seçeneği | seçim | canlı — `listDeletedAccounts` (hesap; S1) | backend.md (BE-118) |
| E-12-15 | Not ve gündem seçeneği | tıklama (etkisiz) | devre dışı (statik) — uç yok (toplantı notu kalıcı silinir) | backend.md (BE-111) |
| E-12-16 | Koordinatörlük seçeneği (tasarımda yok) | seçim | canlı — `listDeletedDepartments`; ortak çip/segment bileşeniyle en sade biçim (P3), konum Toplantı'dan sonra; sayı kuralı E-12-08 | backend.md (BE-119) |
| E-12-17 | Silinme tarihi aralığı | seçim / menü açma | canlı (istemci) — Bugün / Son 7 gün / Tümü; `deleted_at DESC` sırasından yararlanıp eşik aşılana kadar sayfa yükler; menü öğesi sayıları gizli; hesap ve Koordinatörlük'te `deleted_at` boş olabileceğinden hesapta devre dışı; etiket "Tümü" (gün sayısı yok); URL `aralik` | backend.md (BE-117, BE-118) |
| E-12-18 | Silen süzgeci | seçim | canlı yalnız Toplantı (adaylar yüklenen kümedeki `deleted_by`; `null` = "Bilinmiyor"); Görev/Koordinatörlük/Kullanıcı'da devre dışı (alan yok) | backend.md (BE-108, BE-117) |
| E-12-19 | Koordinatörlük süzgeci | seçim | canlı (istemci, yüklenen küme) — Görev (`department_id`) ve Toplantı (`owner_department_id`/`departments[]`); tek seçim; Koordinatörlük ve Kullanıcı'da gizli/devre dışı; URL `koordinatorluk` | backend.md (BE-117) |
| E-12-20 | Arama | yazma (gecikmeli) | canlı (istemci, yüklenen küme) — Türkçe katlamalı; yer tutucu "Yüklenen kayıtlarda ara"; URL `q` | backend.md (BE-117, BE-004) |
| E-12-21 | Toplu işlem çubuğu | — | gizli — toplu uç yok (P7 kalıbı) | backend.md (BE-114) |
| E-12-22 | Satır seçim kutusu | — | gizli (toplu seçim) | backend.md (BE-114) |
| E-12-23 | Tümünü seç | — | gizli | backend.md (BE-114) |
| E-12-24 | Tablo ve başlık satırı | yatay kaydırma | canlı — `role=table`; sütunlar tür, kayıt, silinme tarihi, silen, işlemler (seçim ve kalan süre sütunları yok → ızgara yeniden hesaplanır) | backend.md (—) |
| E-12-25 | Tür rozeti hücresi | — | canlı — tür etiketi + ortak token rengi (Görev `--violet`, Toplantı `--accent-text`, Kullanıcı `--danger`; Koordinatörlük için yeni renk icat edilmez) | backend.md (—) |
| E-12-26 | Kayıt: kod | — | gizli — `DeletedWorkItem`'da kod yok | backend.md (BE-005) |
| E-12-27 | Kayıt: başlık | — | canlı — `title` / `name` / `full_name`; kısaltmalı | backend.md (—) |
| E-12-28 | Kayıt: alt satır | — | canlı (türetilmiş) — görev "‹departman adı› › Görevler"; toplantı "‹tarih saat› · ‹sahip koordinatörlük›"; koordinatörlük `kind`; kullanıcı yok | backend.md (—) |
| E-12-29 | Kayıt: uyarı rozeti | — | gizli — veri yok (sahte uyarı üretilmez) | backend.md (BE-108) |
| E-12-30 | Silinme tarihi hücresi | — | canlı — `deleted_at` (kurulum saat dilimi) "gg.aa.yyyy" + "SS:DD" + "bugün"; `title` uzun biçim, "kalıcı silinme" parçası yok; hesapta ve boş tarihte "—" | backend.md (BE-118) |
| E-12-31 | Silinme tarihi başlığı (sıralama) | tıklama (etkisiz) | devre dışı gösterge — yalnız varsayılan "en yeni üstte" (`aria-sort=descending`); ters çevirme yok (sunucu `sort` yok) | backend.md (BE-117) |
| E-12-32 | Silen hücresi | — | canlı yalnız Toplantı (`deleted_by.full_name`, baş harfler istemcide; boş → "Bilinmiyor"); diğer türlerde "—" | backend.md (BE-108) |
| E-12-33 | Kalan süre sütunu | — | gizli — saklama süresi yok | backend.md (BE-112) |
| E-12-34 | Kalan süre başlığı (sıralama) | — | gizli | backend.md (BE-112) |
| E-12-35 | Satır "Geri yükle" | tıklama | canlı — onay (E-12-58) → tür uç; `useProtectedMutation`; başarıda tür listesi + bağlı sorgular geçersiz (backend §5) | backend.md (—) |
| E-12-36 | Satır "Kalıcı sil" | tıklama | canlı — onay (E-12-59) → tür uç; geri alınamaz | backend.md (—) |
| E-12-37 | Seçili satır | tıklama / Enter / ok tuşları | canlı — satır tıklaması/Enter paneli doldurur; URL `kayit`; ilk yüklemede seçim yok ("Bir kayıt seçin") | backend.md (—) |
| E-12-38 | Sayaç satırı | — | canlı — "‹n› kayıt yüklendi" (+ "daha var"); süzgeçliyse "‹m› kayıt gösteriliyor (yüklenen ‹n› içinde)"; "x / y" yok | backend.md (BE-110) |
| E-12-39 | "Daha fazla" düğmesi | tıklama | canlı — etiket "Daha fazla yükle" (P4; tasarım metni "Daha fazla göster"), imleç sonraki sayfa; bitince gizli | backend.md (—) |
| E-12-40 | İz kaydı notu | — | canlı (sabit metin) — restore/purge audit satırı yazılır (kanıt: `audit.entry_rejected` 500); "işlem geçmişi" bağlantısı yok | backend.md (—) |
| E-12-41 | Panel kartı ve tür rozeti | — | canlı — seçili satırın türü | backend.md (—) |
| E-12-42 | Panel başlığı | — | canlı — kod yok; ad | backend.md (BE-005) |
| E-12-43 | Panel konum satırı | — | canlı (türetilmiş) — görevde departman adı "› Görevler"; toplantıda sahip koordinatörlük | backend.md (—) |
| E-12-44 | Panel: Silen | — | canlı yalnız Toplantı; diğerlerinde satır gizli | backend.md (BE-108) |
| E-12-45 | Panel: Silinme | — | canlı — `deleted_at`; hesapta satır gizli | backend.md (BE-118) |
| E-12-46 | Panel: Kalıcı silinme | — | gizli | backend.md (BE-112) |
| E-12-47 | Panel: Durumu | — | canlı yalnız Görev (`status` adı); "· %40" yüzdesi gizli | backend.md (BE-113) |
| E-12-48 | Panel: Atananlar | — | gizli — liste öğesinde yok; `getWorkItem` silinmişte 409 `work.item_deleted` | backend.md (BE-113) |
| E-12-49 | Birlikte geri gelecek: Alt görev | — | gizli — sayı yok (WORK-K74) | backend.md (BE-113) |
| E-12-50 | Birlikte geri gelecek: Kanıt dosyası | — | canlı yalnız Görev (`file_count`); satır tek kalırsa başlık "birlikte geri gelecek" korunur | backend.md (—) |
| E-12-51 | Birlikte geri gelecek: Yorum | — | gizli | backend.md (BE-113) |
| E-12-52 | Birlikte geri gelecek: Tarih talebi | — | gizli | backend.md (BE-113) |
| E-12-53 | Panel eylemleri | tıklama | canlı — "Geri yükle" (birincil), "Kalıcı sil"; satır eylemleriyle aynı akış | backend.md (—) |
| E-12-54 | Panel boş durumu | — | canlı — "Bir kayıt seçin" (K7 varsayılanı; tasarımda yok) | backend.md (—) |
| E-12-55 | "Yakında kalıcı silinecek" kartı | — | gizli | backend.md (BE-112) |
| E-12-56 | Yakında kartı satırları | — | gizli | backend.md (BE-112) |
| E-12-57 | Yakında kartı alt cümlesi | — | gizli | backend.md (BE-112) |
| E-12-58 | Geri yükleme onayı | eylem tetikleme | canlı — `shared/ui/confirm` (`alertdialog`): ne olacağı, etkilenen kayıt (1), türe özgü uyarı (hesapta atamalar dönmez, toplantıda konferans dönmez, departmanın görevleri dönmez); onay düğmesi birincil | backend.md (—) |
| E-12-59 | Kalıcı silme onayı | eylem tetikleme | canlı — `shared/ui/confirm`: geri alınamaz; görevde "‹file_count› dosya da silinir"; onay düğmesi kırmızı | backend.md (—) |
| E-12-60 | Boş durum | — | canlı — "Silinmiş ‹tür› yok."; neden/ne zaman cümlesi yok | backend.md (—) |
| E-12-61 | Süzgeç sonucu boş | tıklama | canlı — "Bu filtrelerle kayıt yok." + "Filtreleri temizle"; imleç bitmediyse "Yüklenen kayıtlarda yok, daha fazla yükle" | backend.md (—) |
| E-12-62 | Yükleniyor / hata | — | canlı — `UiErrorState` (yeniden dene), iskelet/yükleniyor; 403 K6 | backend.md (—) |
| E-12-63 | Ana sayfadan giriş (E-01-02) | tıklama | canlı F5 — yalnız yönetici; sayaç `deleted_records`; hedef `/silinen-kayitlar`; P6 düzeltmesi | backend.md (BE-119) |
| E-12-64 | Kenar menüsü girişi | — | gizli (hiç yok) — tasarım Sidebar `active="home"` | backend.md (—) |
| E-12-65 | Gün grubu başlığı (01c) | — | yok — 01d seçildi | backend.md (—) |
| E-12-66 | Satır alanları: Görev | — | canlı — backend.md §4 sütunu | backend.md (BE-113) |
| E-12-67 | Satır alanları: Toplantı | — | canlı — backend.md §4 sütunu | backend.md (BE-108) |
| E-12-68 | Satır alanları: Koordinatörlük | — | canlı — backend.md §4 sütunu | backend.md (BE-119) |
| E-12-69 | Satır alanları: Kullanıcı | — | canlı — backend.md §4 sütunu (silinme tarihi/silen yok) | backend.md (BE-118) |

## 8. Bağımlılıklar
- **Ortak bileşenler:** `shared/ui/confirm` (onay), `UiSegmented`/`UiChip` (tür seçici, P3), `UiMenu` (aralık ve süzgeç menüleri), `UiBadge`, `UiErrorState`, `UiEmptyState`, `useToast`, `useProtectedMutation`.
- **Diğer ekranlar:** 01 ana sayfa E-01-02 (giriş, sayaç `reportDashboard`); **09** `DeletedMeetings` (Toplantı türü aynı uç/anahtar `queryKeys.meetings.deleted`; ortak model/satır bileşeni mümkünse paylaşılır, kopya yazılmaz — W128 kararı); 08 (Koordinatörlük geri yükleme sonrası `departments`/`catalog`/`me` yenilenir); 05 (Kullanıcı geri yükleme sonrası `users`); 03 (görev listesi/Gantt/rozetler).
- **Paylaşılan durum:** seçili program (`scoped`), `instanceProfile` saat dilimi, `me.company_admin`.
- **Yeni sorgu anahtarları / geçersizleme:** `backend.md` §5; `query-keys.ts` değişikliği W128'in işi (bu belgede kod yazılmaz).
- **Belge bağımlılıkları:** `../ortak-kurallar.md` §6'ya "silinen listeleri" satırı ve pano geçersizleme listesinin genişlemesi, P41 satırı (koordinatör/W120), `docs/ekranlar/README.md` tablosu (W120).
