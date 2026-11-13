# 01 — Mekanizma (nasıl davranıyor)

Kaynak: `../../tasarim/kaynak/Main.dc.html` + `ozellikler.md`. Tasarım bir prototiptir: olay işleyicileri örnek veride boştur (`null` → `() => {}`), yani hedefler ve kurallar aşağıda **etiket, `aria-label` ve sınıf adlarından** çıkarılmıştır. Kesin olmayan her hedef "Varsayım:" ile işaretlidir.

## 1. Giriş ve gezinme

**Giriş:** kenar menüsünde "Ana sayfa" (`Sidebar active="home"`), oturum açılışından sonraki varsayılan ekran (**Varsayım:** yol haritası açıkça söylemiyor), kırıntıdaki program adı (bkz. `00-ortak`).

**Önerilen rota (K10):** `/` (rota kataloğunda tipli ad örn. `home`). Parametre yok. Kapsam rota parametresi değil, kenar menüsü seçicisinden gelir (K2).

**Çıkışlar (öğe → hedef):**

| Kimlik | Öğe | Hedef | Faz / v1 | Not |
|---|---|---|---|---|
| E-01-02 | "Silinen kayıtlar" | → 12 (P36): `/silinen-kayitlar` (F5; yalnız yönetici) | → 12 (P36) | **Varsayım:** `listDeletedWorkItems` ekranı (yönetici). Tasarımda hedef ekran yok → 12 (P36): ayrı ekran, tür segmenti (Görev, Toplantı, Koordinatörlük, Kullanıcı). Sayaç (`deleted_records`) görev, toplantı, departman ve şirket geneli hesapları tek sayıda toplar; tek hedef liste yoktur (`backend.md` E-01-02). |
| E-01-04 | KPI "Tamamlanma" | 03 Görevler, süzgeç "bitti" | F1 | **Varsayım:** süzgeç URL'de (`/gorevler?durum=…`); süzgeç adları 03'ün `mekanizma.md`'siyle hizalanmalı. |
| E-01-05 | KPI "Açık görev" | 03 Görevler, süzgeç "açık" | F1 | aynı varsayım |
| E-01-06 | KPI "Gecikmede" | 03 Görevler, süzgeç "gecikmede" | F1 | aynı varsayım |
| E-01-07 | KPI "Onay bekleyen" | 03 Görevler, süzgeç "onayda" | F1 | aynı varsayım |
| E-01-09 | "Yeni görev" | görev oluşturma formu (03'te) | F1 | **Varsayım:** 03 ekranına gidip formu açar ya da ana sayfada aynı formu açar; 03 analizine bağlı. |
| E-01-10 | "Toplantı oluştur" | 09c toplantı formu | F4 | F4'ten önce devre dışı ya da gizli — §2 ve README açık soru. |
| E-01-11 | "Kullanıcı davet et" | 05 Kullanıcılar, ekleme akışı | F2 | Davet bağlantısı BE-013; F2'deki geçici parola akışına bağlanır. |
| E-01-12 | "Rapor oluştur" | bilinmiyor (rapor/PDF ekranı) | F6 | Tasarımda rapor ekranı yok. |
| E-01-13 | "Tümü" (Son işlemler) | 01b İşlem geçmişi | sonra (K14 v1 dışı) | v1'de gizli ya da devre dışı. |
| E-01-16 | Akış satırı kişi adı | bilinmiyor — 05b Kişisel takip ya da ilgili kayıt | — | ozellikler §7/5. |
| E-01-20 | Rol kartı | 05 Kullanıcılar, ilgili rol sekmesi | F2 | **Varsayım:** rol sekmesi URL süzgeci; BE-011 (program kapsamlı rol sekmeleri). |
| E-01-22 | "Tümünü gör" | 08 Koordinatörlükler | F2 | |
| E-01-29 | Kart adı | 08b Koordinatörlük detayı | F2 | `department_id` rota parametresi. |
| E-01-35 | "geciken" | 03 Görevler, `department_id` + gecikme süzgeci | F1 | K3: departman süzgeci `department_id`. |
| E-01-36 | "kullanıcı" | 08b (kişiler bölümü) | F2 | Tasarımda ad düğmesiyle aynı olay. |
| E-01-37 | "arşiv" | 06 Arşiv, departman süzgeci | F5 (v1 dışı) | F5'e kadar devre dışı. |

**URL'de taşınan durum:** bu ekranda yok (öneri). Süzgeç/sıralama/arama ana sayfada geçicidir (§3).

## 2. Kapsam ve rol etkisi (K1, K2)

**Tasarımda rol ayrımı yok.** Tek artboard var; içerik yönetici merceğini düşündürüyor (Silinen kayıtlar, Kullanıcı davet et, Rapor oluştur, ekip rol sayıları, tüm koordinatörlüklerin kartları). Koordinatör/üye için ayrı ana sayfa çizilmemiş. Örnek veride çizilmeyen "kişisel kısayollar" (E-01-43: Bana atanan, Bu hafta bitiyor, …) ve "dikkat kuyrukları" (E-01-40/41) koordinatör/üye içeriğine uyar, ama hangi mercekte görüneceği tasarımda yazmıyor.

Yol haritası bağlamı: K14 "Koordinatör/üye ana sayfası mevcut uçlarla sade; yönetici panosu mevcut rapor uçlarıyla"; §6 REPORTING-K01 "pano yalnız yönetici"; BE-009 "pano uçları yalnız yönetici".

**Mercek → bölge önerisi (öneri, tasarımda yazmıyor):**

| Bölge | Admin merceği (program kapsamı) | Koordinatör merceği (seçili birim) | Üye merceği (seçili birim) |
|---|---|---|---|
| E-01-01 Selamlama | ✓ | ✓ | ✓ |
| E-01-02 Silinen kayıtlar | ✓ (silinen görevler yalnız yönetici, `istemci-akislari.md` §3) | — | — |
| E-01-03…07 KPI | ✓ program geneli | ✓ birim geneli (koordinatörü olduğu birimin bütün görevleri, `istemci-akislari.md` §2) | ✓ yalnız kendisine atananlar: sunucu üyeye başka görevi döndürmez (`istemci-akislari.md` §2, §4 notu, §9); birim geneli KPI üye için kurulamaz. Yönetici/koordinatör aynı zamanda üyeyse liste birleşimdir; "Üye" merceğinde "bana atananlar" süzgeci istemcidedir (yol haritası K3) |
| E-01-08…12 Hızlı işlemler | ✓ | kısmen | kısmen |
| E-01-13…18 Son işlemler | statik (BE-010) | statik (BE-010) | statik (BE-010) |
| E-01-19/20 Ekip şeridi | ✓ | **Varsayım:** gizli | gizli |
| E-01-21…38 Koordinatörlükler | ✓ | **Varsayım:** gizli ya da yalnız kendi birimi | gizli |
| E-01-39 Alt bilgi | ✓ | gizli | gizli |
| E-01-43 Kısayollar (çizilmeyen) | — | ✓ aday | ✓ aday |

**Eylem görünürlüğü:** düğmelerin (Yeni görev, Toplantı oluştur, Kullanıcı davet et, Rapor oluştur, Silinen kayıtlar) kimde görüneceği rol dizesiyle değil, işlem bazında `istemci-akislari.md` §4 tablosundan ilgili modülün `capabilities.ts` dosyasıyla hesaplanır (K1). Örnek: "Yeni görev" `createWorkItem` satırına bağlıdır. §4'te karşılığı olmayan işlemler (davet, rapor, toplantı) için kural backend analistinin `backend.md` §3'ünde belirlenir.

**Kapsam değişince (K2):** kenar menüsünde program/rol/koordinatörlük değişince tüm ana sayfa sorguları iptal edilir, eski veri gösterilmez, yeni kapsamla yeniden yüklenir; yerel süzgeç/sıralama/arama durumu sıfırlanır (**Varsayım:** sıfırlama; saklamak da mümkün ama K2 yalnız kapsam ve temayı kalıcı kılar).

**Yetki kaybı (K6):** 403 `organization.not_authorized` / `organization.membership_required`, 404 `work.program_scope_invalid` → `me` + `me/departments` geçersizlenir, kapsam yeniden doğrulanır.

## 3. Durum makinesi

| Durum | Değerler | Varsayılan | Nerede tutulur | Not |
|---|---|---|---|---|
| `coordQuery` (E-01-23) | serbest metin | "" | bellek | sayfadan çıkınca sıfır |
| `coordFilter` (E-01-24) | `all` · `late` · `on_track` · `no_coordinator` | `all` | bellek | tek seçim |
| `coordSort.key` (E-01-26) | `late` · `open` · `completion` · `members` · `last_upload` · `name` | `late` | bellek | |
| `coordSort.reversed` | `false` / `true` | `false` | bellek | "Sırayı ters çevir" tersler |
| `sortMenuOpen` (E-01-25/26) | `false` / `true` | `false` | bellek | |
| Kapsam, tema | — | — | `storage-adapter.ts` (K2) | `00-ortak`'ın işi |

**Sıralama menüsü geçişleri (Varsayım: tasarımda yalnız açık/kapalı çizilmiş):**
- kapalı → (tetikleyiciye tıklama / Enter / Space) → açık, odak seçili öğeye.
- açık → (bir ölçüt seçimi) → `key` değişir, `reversed=false` (**Varsayım**), menü kapanır.
- açık → ("Sırayı ters çevir") → `reversed` terslenir, menü kapanır (**Varsayım**).
- açık → (Esc / dışarı tıklama) → kapalı, odak tetikleyiciye döner.

## 4. Etkileşim akışları

Bu ekranda **doğrudan yazma eylemi yoktur.** Tüm düğmeler gezinmedir (§1). Çizilmeyen "Hatırlat" (E-01-41) tek yazma adayıdır; uç yok (BE-008) → uygulanırsa devre dışı düğme + `designStub('BE-008', …)` (K13). K5 yazma protokolü bu ekranda tüketilmez.

## 5. Liste davranışı

**Koordinatörlük kartları (E-01-28):** sayfalama yok; ızgara tüm birimleri gösterir (örnekte 11). Süzgeç, arama, sıralama ve süzgeç sayıları **istemcide**, yüklenmiş tüm satırlar üzerinde.
- Süzgeç kuralları (örnek verideki sayılarla doğrulanmış biçim): "Gecikmesi olan" = `geciken > 0`; "Yolunda" = `geciken = 0`; "Koordinatörsüz" = koordinatörü olmayan birim; "Tümü" = hepsi. Süzgeç sayıları arama metninden bağımsız mı bilinmiyor (**Varsayım:** bağımsız, toplam üzerinden).
- Sıralama: Gecikme (geciken sayısı, çoktan aza) · Açık iş (açık görev, çoktan aza) · Tamamlanma (yüzde, düşükten yükseğe) · Kullanıcı sayısı (çoktan aza) · Son yükleme (yeniden eskiye) · Ad (A→Z). Eşitlikte ikincil ölçüt bilinmiyor — **Varsayım:** ad (A→Z). Ad karşılaştırması Türkçe harf sırasıyla (`Intl.Collator('tr')`); arama Türkçe büyük/küçük harf katlamasıyla (GAP-036, yol haritası §6).
- Başlık ipucu (E-01-21) = seçili ölçütün açıklaması + " · " + görünen kart sayısı (**Varsayım:** süzgeç sonrası sayı).
- Arama: koordinatörlük adında alt dize. Tetikleme anı tasarımda `onChange`; **Varsayım:** girişte kısa gecikmeyle (debounce) süzülür.

**Son işlemler (E-01-14):** satır sınırı ve sayfalama tasarımda yok. Veri kaynağı yok (BE-010) → F1'de bölge **nötr yer tutucu** gösterir: "Henüz işlem geçmişi yok / yakında" + devre dışı "Tümü"; kişi adı, tarih, sayı veya işlem metni içeren sahte örnek akış **yok** (ortak-kurallar §4; CX-M-05). **Varsayım:** gerçek veri bağlandığında son N (ör. 8–10) kayıt + "Tümü".

**KPI sayaçları (E-01-04…07):** türetme ilişkisi örnek veride tutarlıdır: `açık = toplam − biten`; `zamanında = açık − geciken`; Tamamlanma % = biten/toplam; Gecikmede % = geciken/açık; Onay çubuğu = onayda/açık; yüzdeler tam sayıya yuvarlanır. Sayaçların sunucudan mı (pano uçları, yalnız yönetici) yoksa görev listesinden istemcide mi (koordinatör/üye, 200 tavanı → yaklaşık) geleceğini `backend.md` belirler.

**Koordinatörlük kartı sayaçları (E-01-32…38):** birim başına toplam, durum dağılımı (tasarımda 4 dilim; sözleşmede durum kümesi 5 değerli, `iade_edildi` ayrı), geciken, kullanıcı sayısı, arşiv dosya sayısı, son yükleme zamanı. K3 departmanlar arası fan-out'u yasakladığı için bunlar birim başına görev listesi çekilerek **hesaplanamaz**; tek bir toplu uçtan gelmelidir. Yönetici için bu uç mevcuttur: `reportDashboard.coordinatorship_stats` (`backend.md` §1.1). Eksik alanlar (onayda dilimi, üye adları, son yükleme, arşiv sayısı) `eksikler.md`'dedir.

## 6. Boş / yükleniyor / hata durumları

| Durum | Tasarımda | Davranış |
|---|---|---|
| Koordinatörlük süzgeç/arama sonucu boş | var: "Bu filtreyle eşleşen koordinatörlük yok." (E-01-27) | Izgara yerine boş kutu. |
| Hiç koordinatörlük yok (programda departman yok) | tasarımda yok — K7 varsayılanı | "Programa departman katılmamış"; yöneticiye "departman ekle". |
| Program yok | tasarımda yok — K7 varsayılanı | "Program yok"; yöneticiye "program oluştur". |
| `membership_required` | tasarımda yok — K7 varsayılanı | "Departman ataması bekleniyor" (metin istemcide). |
| KPI'lar sıfır (görev yok) | tasarımda yok | **Varsayım:** sayılar "0", "%0", çubuklar boş; not metinleri "0 görevin 0’ı bitti" yerine nötr metin — ürün sahibine sorulacak. |
| Son işlemler boş | tasarımda yok | **Varsayım:** kart içinde `rp-empty` biçimi. |
| Kart "Son yükleme" — hiç yükleme yok | tasarımda yok | bilinmiyor (satır gizlenebilir ya da "—"). |
| Yükleniyor | tasarımda yok | **Varsayım:** bölge başına iskelet (KPI kartları, kart ızgarası); bölgeler bağımsız yüklenir, biri diğerini beklemez. |
| Hata | tasarımda yok | **Varsayım:** bölge başına satır içi hata + "Yeniden dene"; bir bölgenin hatası tüm sayfayı düşürmez. K6 hataları kapsam akışına gider. |

## 7. Öğe → davranış tablosu

| Kimlik | Öğe | Olay | Davranış | Bağ (mekanizma §, backend.md satırı) |
|---|---|---|---|---|
| E-01-01 | Selamlama | yükleme | `me.full_name`'den ad | §2; backend.md §1 E-01-01 |
| E-01-02 | Silinen kayıtlar | tıklama | hedef bilinmiyor (§1) | §1, §2 |
| E-01-03 | KPI kart | tıklama | ilgili süzgeçle 03'e | §1 |
| E-01-04…07 | KPI değerleri | yükleme / kapsam değişimi | sayaç + türetilmiş yüzde/çubuk | §5 |
| E-01-09 | Yeni görev | tıklama | görev oluşturma (yetki §4 `createWorkItem`) | §1, §2 |
| E-01-10 | Toplantı oluştur | tıklama | 09c formu; F4 öncesi devre dışı | §1 |
| E-01-11 | Kullanıcı davet et | tıklama | 05 ekleme akışı; F2 öncesi devre dışı | §1 |
| E-01-12 | Rapor oluştur | tıklama | hedef bilinmiyor; F6 öncesi devre dışı | §1 |
| E-01-13 | Tümü | tıklama | 01b; v1'de gizli/devre dışı (K14) | §1 |
| E-01-14…18 | Son işlemler | yükleme | nötr yer tutucu ("Henüz işlem geçmişi yok / yakında", sahte akış yok; CX-M-05), `designStub('BE-010', …)` | §5 |
| E-01-16 | Kişi adı | tıklama | hedef bilinmiyor | §1 |
| E-01-19 | Ekip toplamı | yükleme | kullanıcı + koordinatörlük sayısı | §2 |
| E-01-20 | Rol kartı | tıklama | 05, rol sekmesi | §1 |
| E-01-21 | Başlık ipucu | süzgeç/sıralama değişimi | metin yeniden hesaplanır | §5 |
| E-01-22 | Tümünü gör | tıklama | 08 | §1 |
| E-01-23 | Arama | giriş | kartları istemcide süzer | §3, §5 |
| E-01-24 | Durum süzgeci | tıklama | `coordFilter` değişir, kartlar süzülür | §3, §5 |
| E-01-25 | Sırala düğmesi | tıklama | menüyü açar/kapatır | §3 |
| E-01-26 | Sıralama seçeneği | tıklama | `coordSort.key` değişir, menü kapanır | §3, §5 |
| E-01-26 | Sırayı ters çevir | tıklama | `coordSort.reversed` terslenir | §3 |
| E-01-27 | Boş durum | süzgeç sonucu 0 | ızgara yerine görünür | §6 |
| E-01-29 | Kart adı | tıklama | 08b | §1 |
| E-01-31 | Avatar | hover / odak | tam ad ipucu | — |
| E-01-33/34 | Durum çubuğu / satırı | yükleme | tasarımda dört dilim; `iade_edildi` için dilim yok (ozellikler §7/10, eksikler `yeni-1`) | §5 |
| E-01-35 | geciken | tıklama | 03, `department_id` + gecikme | §1 |
| E-01-36 | kullanıcı | tıklama | 08b | §1 |
| E-01-37 | arşiv | tıklama | 06 (F5) — v1'de devre dışı | §1 |
| E-01-38 | Son yükleme | yükleme | göreli zaman ("bugün"/"dün"/"‹n› gün önce") | §5 |
| E-01-39 | Alt bilgi | yükleme | E-01-19/20 sayılarından metin | §5 |
| E-01-40…47 | Çizilmeyen öğeler | — | uygulanmaz; karar ürün sahibinde (ozellikler §7/1) | README açık sorular |

## 8. Bağımlılıklar

- **`00-ortak`:** kenar menüsü (`Sidebar`, `active="home"`; "Görevler" rozetleri — E-01-47 ile ilişkisi orada), Kenar-Secici (program/rol/koordinatörlük kapsamı), üst çubuk (gezinme, kırıntı, tarih, tema, bildirim zili, Asistan), tema geçişi, açık durum ekranları (K7).
- **Paylaşılan durum:** seçili kapsam (program, mercek, departman), tema, `me` (ad ve yönetici bayrağı).
- **Ortak bileşen adayları** (`shared/ui`): KPI kartı, bölümlü süzgeç (`rp-seg`), sıralama menüsü (`rp-pop` + `menuitemradio`), avatar yığını + ipucu (`rp-avstack`, `rp-tip`), yığılmış durum çubuğu (`rp-bar` + `rp-seg-*`), zaman çizgisi listesi (`rp-timeline`), boş kutu (`rp-empty`). Durum çubuğu ve renkleri 03/08 ile paylaşılır.
- **Diğer ekranlar:** 03 (KPI ve "geciken" süzgeç adları), 05 (rol sekmeleri), 08/08b, 06 (F5), 09c (F4), 01b (v1 dışı).


---

## 9. F6 — K1 ve Ü1 rol ana sayfaları (P53)

Kaynak: `Koord-Ana.dc.html`, `Uye-Ana.dc.html` (v85). Tasarımda olay işleyicileri örnek veride boştur; hedefler etiket ve bağlantılardan okunmuştur. Karar durumları README "K1"/"Ü1" bölümlerindedir.

### 9.1 Giriş, rota ve sayfa seçimi
- Rota `/` (K10); parametre yok. **Sayfa seçimi:** `company_admin` → yönetici ana sayfası (mercek ne olursa, P1/P53); aksi halde Koordinatör merceği → K1, Üye merceği → Ü1 (**geçici kabul**, W135 varsayımı). Mercek değişince bütün sorgular iptal, yerel durum sıfır (K2).
- **K1'de rapor girişi yok** (P53). Rapor düğmeleri K7 (toplantı) ve K3 (görev) ekranlarındadır; Ü1'de hiçbir rapor yok.
- Kenar menüsü girişlerinden **Birimim, Ekibim, Zaman çizelgem/çizelgesi** hedefleri (K2/K5/K6/Ü3) F6 dışıdır; menüde gizli (§5), sayfa içi bağlantılar açıklamalı devre dışı "sonraki fazda" (`designStub` yok; §3 faz ertelemesi).

### 9.2 Tek yükleme ve türetim (KESİN 21, K3)
- K1: `countProgramWorkItems` (`department_id`) sunucu sayaçları; **aynı süzgeçle** `listProgramWorkItems` (`limit=200`, imleçle devam; en çok N sayfa, aşılırsa "≥"/"yaklaşık" ipucu, sayı uydurulmaz). Ü1: aynı iki uç `assignee_account_id` = ben, `department_id` yok (program geneli). Liste kümesinden: onay bekleyenler (`status = onaya_sunuldu`), atanmamış (`assignee_account_ids = []`, açık), geciken (`is_overdue`), ekip yükü (K1; `assignees[]` ⋈ `listMembers`), kuyruk sıralaması ve takvim (Ü1). Ayrı süzme kodu yazılmaz; yüklemler `work/public.ts` (`assignedSubset`, `isAssignedTo`, `lensAssignee`).
- **Ü1 "Bugünün sırası" anahtarı (geçici kabul):** açık görevler (`status ≠ tamamlandi`); sıra: (1) `iade_edildi`, (2) `is_overdue` (`days_overdue` azalan), (3) `priority` acil > yuksek > orta > dusuk, (4) `end_on` artan; `onaya_sunuldu` olanlar en sona; ilk 5 gösterilir, "Tümü ‹açık sayısı›" 03'e gider. Eşitlikte ad A→Z (`Intl.Collator('tr')`).
- **K1 ekip yükü:** üye başına `açık = devam + onayda + geciken + iade` (atanmış, tamamlanmamış); çubuk dilimi `görev sayısı × %25` (kişi başı 4 görev = %100; tasarım sabiti); sıra: açık azalan, eşitlikte ad. Atanmamış görev kimsenin yüküne girmez.
- **Göreli tarih:** "‹n› gün gecikti" `days_overdue` (sunucu), "‹n› gün kaldı" = `end_on − bugün` (kurulum saat dilimi takvim günü; WORK-K37).
- Pano uçları (`reportDashboard*`) K/Ü merceğinde **çağrılmaz** (403 yok).

### 9.3 Durum makinesi
| Durum | Değerler | Varsayılan | Nerede | Not |
|---|---|---|---|---|
| Ü1 takvim ayı | `YYYY-MM` | bugünün ayı | bellek | ay okları ağsız; kapsam değişince sıfır |
| K1/Ü1 bölge yüklemesi | yükleniyor · hata · boş · dolu | — | sorgu önbelleği | bölgeler bağımsız; biri düşünce sayfa düşmez |

### 9.4 Boş / yükleniyor / hata
| Durum | Davranış |
|---|---|
| Birimde/atamada görev yok | KPI "0", çubuklar boş; kart gövdeleri nötr metin ("Onay bekleyen görev yok", "Atanmamış görev yok", "Dikkat gerektiren görev yok", "Bugün için görev yok"); sahte satır yok (§4) |
| Ekip boş (K1) | "Ekibinde henüz üye yok" |
| Yaklaşan toplantı yok | "Yaklaşan toplantı yok" |
| Tarih talebi yok | "Tarih talebi yok" |
| Bölge hatası | satır içi hata + "Yeniden dene"; K6 hataları kapsam akışına (403 `organization.membership_required` → K7 "Departman ataması bekleniyor") |
| Yükleniyor | bölge başına iskelet; KPI sayaçları ve liste bağımsız |

### 9.5 Yazma eylemleri (K5 protokolü)
K1: "İade et"/"Onayla" (`transitionWorkItem`), "Üstlen" (`addAssignments`), "Ata" ve "Süre uzat" (03 paneli/`DateRequestForm`). Ü1: "Tekrar başla"/"Tamamlandı bildir"/"Göreve başla" (`useOwnStatusWorkItem`/`transitionWorkItem`), "Kanıt yükle" (`attachFile`), "Not yaz" (`addWorkItemNote`). Hepsi 03/06 ortak yazma bileşenleri; yeni yazma kodu yok. Başarıda `workItems`/`gantt`/pano anahtarları geçersiz (ortak-kurallar §6; `shell-counts` dahil).

### 9.6 Öğe → davranış (K1)
| Kimlik | Öğe | Kaynak | Davranış |
|---|---|---|---|
| E-K1-01 | Selamlama | `me.full_name` (`['me']`) | yükleme: ad `me` yanıtından |
| E-K1-02 | Alt başlık | `myDepartments` (`role = koordinator` satırları, `display_name`) + seçili birim | yükleme; birim değişince yeniden |
| E-K1-03 | "Toplantı planla" düğmesi | 09 `capabilities.ts` (K: sahip departman); form 09c (F4) | tıklama 09c formunu açar; salt üyede yok |
| E-K1-04 | "Yeni görev" düğmesi | work `canCreateWorkItem`; 03 ortak formu, departman = seçili birim | tıklama 03'ün yeni görev formunu açar |
| E-K1-05 | Birim satırı kickerı | `countProgramWorkItems.total` (`department_id` = seçili birim) | yükleme / birim değişimi |
| E-K1-06 | "Birimim →" bağlantısı | — | tıklama gezinmez |
| E-K1-07 | Birim özeti şeridi (6 kutu) | `countProgramWorkItems` (`department_id`; sunucu sayaçları) + aynı yüklemdeki `listProgramWorkItems` kümesi (KESİN 21) | tıklama 03'ü süzgeçle açar; bölge hatası "Yeniden dene" |
| E-K1-08 | KPI "açık görev" | `countProgramWorkItems`: `total − by_status.tamamlandi`; `by_status.devam_ediyor/baslanmadi` | `kabul` (E-01-05 kuralı; `iade_edildi`/`onaya_sunuldu` açıktır) |
| E-K1-09 | KPI "geciken" | `countProgramWorkItems.overdue`; "en uzunu" = yüklenen kümede `max(days_overdue)` | sayı `--danger` |
| E-K1-10 | KPI "onay bekleyen" | `by_status.onaya_sunuldu` | geçici kabul — not "Kararını bekliyor" (kanıt kuralı görev düzeyinde, E-01-07 ile aynı: "Kanıtlı" iddiası yok) |
| E-K1-11 | KPI "iade" | `by_status.iade_edildi`; not yüklenen kümeden | geçici kabul — tek iade varsa atanan adı, birden çoksa "‹n› görev"; kod yok (BE-005) |
| E-K1-12 | KPI "atanmamış" | sunucu sayacı yok; yüklenen kümede `assignee_account_ids = []` (açık görevler) | tıklama 03'ü süzgeçsiz açar (03'te atanmamış süzgeci yok) |
| E-K1-13 | KPI "tarih talebi" | `countProgramWorkItems.pending_date_requests` (görev sayısı) | tıklama 03c (`/zaman-cizelgesi`) |
| E-K1-14 | "Onay bekleyen" kart başlığı | `by_status.onaya_sunuldu` | `kabul` — bağlantı `/gorevler?durum=onaya_sunuldu` |
| E-K1-15 | Onay kartı alt yazısı | — (gönderim zamanı alanı yok) | geçici kabul — yalnız "Kararını bekliyor"; "Kanıt yüklendi" ve "en eskisi …" gizli (W134 kayıt bloğuna aday: görev satırında onaya sunuş zamanı) |
| E-K1-16 | Onay satırı | `listProgramWorkItems` (`status = onaya_sunuldu`): `title`, `assignees[].full_name`, `end_on`, `is_overdue`/`days_overdue` | başlık tıklaması 03 panelini açar |
| E-K1-17 | "İade et" / "Onayla" düğmeleri | `transitionWorkItem` (03 durum geçişi; `transitionTargets` yüklemi) | korumalı yazma; başarıda `workItems`, `gantt`, pano anahtarları geçersiz (§6) |
| E-K1-18 | Onay kartı altnotu | — (statik metin) | geçici kabul — yalnız "iade ederken sebep yazman gerekir" kısmı garanti; tarihi bugüne çekme cümlesi 03 onay akışında böyle bir seçenek varsa gösterilir (§4: olmayan davranış vaat edilmez) |
| E-K1-19 | "Atanmamış" kart başlığı | E-K1-12 ile aynı küme | geçici kabul — sayı dinamik; "İkisi de başlamadı" yerine "Sorumlu atanana kadar ekip listesinde görünmez." |
| E-K1-20 | Atanmamış satırı | `title`, `priority`, `end_on` (yüklenen küme) | geçici kabul — kilit rozeti gizli (satırda bağımlılık özeti yok; W134 kayıt bloğuna aday: görev satırında bekleyen bağımlılık özeti); kod `—` |
| E-K1-21 | "Ata" bağlantısı | 03 paneli atama bölümü (`addAssignments`) | tıklama 03 panelini atama kipinde açar |
| E-K1-22 | "Üstlen" düğmesi | `addAssignments` (kendi hesabım); yetki 03 `capabilities.ts` | korumalı yazma |
| E-K1-23 | "Dikkat gerektirenler" kart başlığı | yüklenen kümede `is_overdue`; bağlantı 03c | geçici kabul — "‹n› geciken görev" canlı; "bağımlılık bekliyor" gizli (E-K1-20 ile aynı gerekçe) |
| E-K1-24 | Dikkat satırı | `assignees`, `end_on`, `days_overdue`, `pending_date_request`, `subtask_counts`; "talep reddedildi" için `date-requests/mine` son durum | geçici kabul — "talep reddedildi" yalnız yüklenen talep listesinde eşleşirse; kod `—` |
| E-K1-25 | Dikkat satırı eylemi | 03 paneli; `DateRequestForm` (timeline, F3 canlı) | geçici kabul — "Süre uzat" tarih talebi formunu açar; "Talebi gör" 03 paneli; "Bağımlılıklar" 03 paneli bağımlılık bölümü; yalnız bağımlılıktan kilitli dördüncü tür satır gizli |
| E-K1-26 | "Ekip yükü" kart başlığı | `listMembers` (S2, kendi birimi, tek istek; fan-out değil) | `kabul` — "Ekibim →" (K5) F6 dışı: devre dışı + faz notu |
| E-K1-27 | Ekip yükü alt yazısı ve lejant | yüklenen kümeden | geçici kabul — "‹n› atanmış açık görev · yüke göre sıralı"; "SİS-9 iki kişide" gizli; lejant sabit |
| E-K1-28 | Ekip üyesi satırı | `listMembers` + yüklenen görevlerin `assignees[]` kırılımı (KESİN 21 tek küme) | hover/odak: ipucu |
| E-K1-29 | "Hızlı işlemler" kartı | bkz. E-K1-30…33 | `kabul` (P3: yeni kısayol icat edilmez; çizilen dört kutucuk) |
| E-K1-30 | Hızlı işlem "Yeni görev" | E-K1-04 ile aynı | `kabul` |
| E-K1-31 | Hızlı işlem "Toplantı planla" | E-K1-03 ile aynı | `kabul` |
| E-K1-32 | Hızlı işlem "Ekibe üye ekle" | — | tıklama gezinmez |
| E-K1-33 | Hızlı işlem "Tarih talebi gönder" | 03c + `DateRequestForm` | tıklama 03c |
| E-K1-34 | "Yaklaşan toplantılar" kart başlığı | `listMeetings` (`from` = bugün, `department_id` = seçili birim; kurulum saat dilimi) | `kabul` (P29 `from`/`to`); "Tümü" → 09 liste |
| E-K1-35 | Toplantı satırı | `Meeting.meeting_date`, `title`, `departments[].department_name`, `owner_department_id`, `members_included`, `summary.participant_count` | satır tıklaması 09b |
| E-K1-36 | "Canlı" tarih kutusu ve rozeti | — | `kabul` (P21: sahte Canlı/Bekliyor yok; `conference_status` çizilmez) |
| E-K1-37 | "Anlık toplantı başlat" | — | `kabul` (P21, KR-26: gerçek sağlayıcı W7'de) |
| E-K1-38 | "Tarih taleplerim" kart başlığı | `date-requests/mine` (`useMyDateChangeRequests`) | `kabul` (P18 metin: plan tarihini yönetici değiştirir); "Tümü" → 03c |
| E-K1-39 | Tarih talebi satırı | `DateChangeRequest`: `status`, `old_end_on`, `new_end_on`, `reason`; başlık yüklenen görev kümesinden | satır tıklaması 03c |
| E-K1-40 | "Son etkinlik" akışı | — (audit okuma yok; rol kapsamlı okuma BE-091) | `kabul` (§4, P6): nötr yer tutucu "Henüz işlem geçmişi yok / yakında"; `designStub('BE-010', …)`; sahte akış yok |
| E-K1-41 | Rapor girişi (çizilmeyen) | — | `kabul` (P53): K1'de rapor kutucuğu/menüsü **yok**; koordinatörün raporları yalnız K7 (toplantı) ve K3 (görev) düğmeleri |

### 9.7 Öğe → davranış (Ü1)
| Kimlik | Öğe | Kaynak | Davranış |
|---|---|---|---|
| E-Ü1-01 | Selamlama | `me.full_name` | geçici kabul — tam `full_name` (E-01-01) |
| E-Ü1-02 | Alt başlık | seçili birim adı (`myDepartments.display_name`) + sabit metin | geçici kabul — metin birebir; birim adı kapsam etiketidir, sayaçlar program geneli (bkz. kapsam notu) |
| E-Ü1-03 | "Kanıt yükle" üst düğmesi | 06/07 ortak yükleme penceresi (`attachFile`; görev seçici = bana atananlar; yetki ADR-0030) | tıklama yükleme penceresini açar |
| E-Ü1-04 | "Görev özetim" şeridi (4 kart) | `countProgramWorkItems` (`assignee_account_id` = ben; BE-038 bağlandı); `department_id` yok (program geneli) | tıklama 03; hata "Yeniden dene" |
| E-Ü1-05 | Kart "Açık görev" | `total − by_status.tamamlandi`; `by_status` kırılımı | `kabul` (E-01-05) |
| E-Ü1-06 | Kart "Gecikmede" | `overdue`; yüzde `overdue / açık` yuvarlanır | sayı `--danger` |
| E-Ü1-07 | Kart "Onay bekleyen" | `by_status.onaya_sunuldu` | geçici kabul — not "Koordinatör onayında" (kanıt iddiası yok, E-01-07) |
| E-Ü1-08 | Kart "İade edilen" | `by_status.iade_edildi` | geçici kabul — not "Tekrar başlayabilirsin" (iade sebebi satırda yok; "kanıt eksik" iddiası kaldırıldı; W134 kayıt bloğuna aday: iade sebebinin görev satırında/okuma ucunda yer alması) |
| E-Ü1-09 | "Bugünün sırası" başlığı | aynı yükleme: `listProgramWorkItems` (`assignee_account_id`, `limit=200`) | geçici kabul — istemci sıralama anahtarı: iade_edildi, sonra geciken (`days_overdue` azalan), sonra `priority` (acil > yuksek > orta > dusuk), sonra `end_on`; onaya sunulanlar sona; ilk 5; yüklemeden bağımsız ek istek yok (KESİN 21) |
| E-Ü1-10 | "Tümü ‹n›" bağlantısı | 03 (üye merceği) | tıklama 03 |
| E-Ü1-11 | Kuyruk satırı | `title`, `status`, `subtask_counts`, `department_id`→`myDepartments` adı, `end_on`, `days_overdue` | başlık tıklaması 03 panelini açar |
| E-Ü1-12 | Eylem "Tekrar başla" | `useOwnStatusWorkItem` (`iade_edildi → devam_ediyor`) | korumalı yazma |
| E-Ü1-13 | Eylem "Kanıt yükle" | yükleme penceresi, görev sabit | `kabul` (P35) |
| E-Ü1-14 | Eylem "Tamamlandı bildir" | `transitionWorkItem` (`→ onaya_sunuldu`; `completion_evidence_required` kuralı 03'te) | kanıt yoksa 03'ün hata mesajı |
| E-Ü1-15 | Eylem "Göreve başla" (kilitli) | `transitionWorkItem` (`baslanmadi → devam_ediyor`) | korumalı yazma |
| E-Ü1-16 | Rozet "Onayda" | `status = onaya_sunuldu` | geçici kabul — ipucu "Koordinatör onayında" (koordinatör adı üyeye okunamaz) |
| E-Ü1-17 | Kuyruk altnotu | `completion_evidence_required` | geçici kabul — kilit cümlesi gizli (E-Ü1-15); kanıt cümlesi yalnız o alan `true` olan görev kuyrukta varsa |
| E-Ü1-18 | "Hızlı işlemler" kartı | bkz. E-Ü1-19…22 | `kabul` (P3) |
| E-Ü1-19 | "Kanıt yükle" kutucuğu | E-Ü1-03 ile aynı | geçici kabul — alt satır "Görev seç, dosya ekle" (90 MB gizli) |
| E-Ü1-20 | "Not yaz" kutucuğu | `addWorkItemNote` (03 not formu; görev seçici = bana atananlar) | `kabul` |
| E-Ü1-21 | "Koordinatörüme yaz" kutucuğu | — (10 Mesajlar F7) | tıklama gezinmez |
| E-Ü1-22 | "Toplantı notu ekle" kutucuğu | `listMeetings` en yakın toplantı → 09b not ekleme (09 `capabilities.ts`) | geçici kabul — hedef 09b (Ü5 `Uye-Toplanti` F6 dışı); yaklaşan toplantı yoksa kutucuk devre dışı |
| E-Ü1-23 | "Son bildirimler" kart başlığı | `countUnreadNotifications` (S1, hesap geneli); liste F7 | geçici kabul — "‹n› yeni" canlı; "Tümü" (Ü7) F6 dışı devre dışı; liste F7'de (`listNotifications` mevcut; kayıt BE-002 vazgeçildi → F7) |
| E-Ü1-24 | Bildirim satırları | — (F7) | `kabul` (§4): nötr "Henüz bildirim yok / yakında"; sahte satır yok |
| E-Ü1-25 | "Son tarihlerim · Ekim" takvimi | yüklenen kümede `end_on` (açık görevler) | ok tuşları ay değiştirir |
| E-Ü1-26 | Takvim ızgarası | aynı küme | geçici kabul — hücre `aria-label` "21 Ekim, bugün" / ", geciken son tarih" / ", yaklaşan son tarih"; hafta Pazartesi başlar; TRT takvim günü |
| E-Ü1-27 | Takvim lejantı | aynı küme | `kabul` — geciken = açık ve `is_overdue` görev sayısı; yaklaşan = açık ve `end_on` ≥ bugün görev sayısı |
| E-Ü1-28 | "Yaklaşan toplantılar" kart başlığı | `listMeetings` (`from` = bugün) | `kabul`; "Tümü" → 09 liste |
| E-Ü1-29 | Toplantı satırı | `meeting_date`, `title`, `departments[]`, `members_included` | geçici kabul — kod yerine ad kısaltması; satır tıklaması 09b (Ü5 yerine) |
| E-Ü1-30 | "Koordinatörlüklerim" kart başlığı | `myDepartments` (üyelik satırları) | `kabul` |
| E-Ü1-31 | Koordinatörlük satırı | aynı yükleme kümesinin `department_id` kırılımı (tek istek; fan-out değil) | geçici kabul — "‹n› görev" = o birimdeki açık görevlerim; dilimler başlamadı/devam/onayda/iade; ikinci satır durum özeti ("1 devam · 1 onayda"); "Koordinatör: ‹ad›" gizli (W134 kayıt bloğuna aday: üyeye birim koordinatör adı); kod yerine ad |
| E-Ü1-32 | Kart altnotu | — (statik metin; sözleşme bilgisi) | `kabul` |
| E-Ü1-33 | Rapor girişi (çizilmeyen) | — | `kabul` (P47, REPORTING-K01/K07): üye hiçbir rapor görmez |

### 9.8 01 yönetici sayfası — F6 davranış eklemeleri
- **E-01-12 "Rapor oluştur" (P47, kabul):** küçük yönlendirme menüsü; dört satır: "Dönem sonu raporu" → 06 Arşiv; "İş yükü raporu" → 05 Kullanıcılar; "Toplantı raporu" → toplantı seç (09 listesi); "Görev raporu" → görev seç (03). Ayrı sayfa/rota yok; ağ isteği atmaz; yalnız `company_admin`.
- **01b işlem geçmişi F6 dışı (P46):** "Son işlemler" "Tümü" bağlantısı devre dışı kalır.
- **E-01-28:** kartlar yönetici için program geneli; 200 satır uyarısı gerekmez (v0.15 `reportDashboard` gömülü dizileri kesmez; spec).
