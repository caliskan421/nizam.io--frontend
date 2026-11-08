# 01 — Mekanizma (nasıl davranıyor)

Kaynak: `../../tasarim/kaynak/Main.dc.html` + `ozellikler.md`. Tasarım bir prototiptir: olay işleyicileri örnek veride boştur (`null` → `() => {}`), yani hedefler ve kurallar aşağıda **etiket, `aria-label` ve sınıf adlarından** çıkarılmıştır. Kesin olmayan her hedef "Varsayım:" ile işaretlidir.

## 1. Giriş ve gezinme

**Giriş:** kenar menüsünde "Ana sayfa" (`Sidebar active="home"`), oturum açılışından sonraki varsayılan ekran (**Varsayım:** yol haritası açıkça söylemiyor), kırıntıdaki program adı (bkz. `00-ortak`).

**Önerilen rota (K10):** `/` (rota kataloğunda tipli ad örn. `home`). Parametre yok. Kapsam rota parametresi değil, kenar menüsü seçicisinden gelir (K2).

**Çıkışlar (öğe → hedef):**

| Kimlik | Öğe | Hedef | Faz / v1 | Not |
|---|---|---|---|---|
| E-01-02 | "Silinen kayıtlar" | bilinmiyor — silinen görevler listesi olabilir | bilinmiyor | **Varsayım:** `listDeletedWorkItems` ekranı (yönetici). Tasarımda hedef ekran yok. Sayaç (`deleted_records`) görev, toplantı, departman ve şirket geneli hesapları tek sayıda toplar; tek hedef liste yoktur (`backend.md` E-01-02). |
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
