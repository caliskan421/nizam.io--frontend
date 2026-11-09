# 05 · Kullanıcılar

**Codex kapısı:** KOŞULLU UYGUN (2026-11-08) — grup bulguları `dogrulama.md` Kapanış bölümünde; ortak kurallar `../ortak-kurallar.md`.

**Artboard'lar:** `Kullanicilar.dc.html` (`05 · Kullanıcılar`), `Kullanici-KisiselTakip.dc.html` (`05b · Kullanıcı › Kişisel takip`)
**Faz:** F2 · **v1:** ✓ · **Yol haritası bağı:** K1 (rol yalnız gösterim), K2 (kapsam), K3 (görev listesi tek uç, fan-out yasak), K5 (yazma protokolü), K6, K7, K10, K13 (eksik statik), K14; §4 F2 satırı ("Kullanıcılar, kişisel takip")
**Rota (önerilen, K10):**
- `/kullanicilar` — süzgeçler sorgu dizgisinde: `rol` (`tumu` | `admin` | `koordinator` | `uye`), `q` (arama), `koordinatorluk` (departman kimliği), `sayfa` (tamsayı), `secili` (hesap kimliği; yan paneli açar).
- `/kullanicilar/:hesapId` — kişisel takip; `sekme` (`gorevler` | `dosyalar` | `etkinlik` | `hesap`), `kart` (`tamamlanan` | `acik` | `geciken` | `onayda`), `grupla` (`son-tarih` | `durum`), `ay` (`YYYY-MM`, takvim kartı).
- **Varsayım:** parametre adları öneridir; rota kataloğu (F0) son sözü söyler.

## Özet
Kullanıcılar ekranı, şirketteki kişileri tek tabloda listeler (ad, e-posta, rol rozetleri, koordinatörlük atamaları), rol sekmesi + arama + koordinatörlük süzgeciyle daraltır ve satır seçilince sağdaki yan panelde kişinin rollerini ve koordinatörlük atamalarını düzenletir; hesap işlemleri (şifre sıfırlama bağlantısı, kilitleme, silme) aynı panelin menüsündedir. Kişisel takip (05b) bir kişinin görevlerini dört özet kartı, son tarihe/duruma göre gruplanmış görev tablosu, aylık son tarih takvimi ve durum dağılımıyla gösterir; Dosyalar, Etkinlik ve Hesap ve roller sekmelerinin içeriği tasarımda yoktur. Tasarım ekranı yönetici (Admin merceği) gözüyle çizer; Koordinatör/Üye merceğinde neyin görüneceği tasarımda yoktur ve eylem görünürlüğü `istemci-akislari.md` §4 yöntemine göre işlem bazında hesaplanmalıdır (kullanıcı yönetimi işlemleri o tabloda henüz satır olarak yok — backend analisti doğrulamalı). Ana veri: kullanıcı/hesap listesi, ekip üyelikleri (program, departman, rol) ve kişinin atandığı görevler. İlgili açık eksikler: BE-011 (program kapsamlı liste/sayaç), BE-012 (kilitle), BE-013 (sıfırlama/davet bağlantısı), BE-014 (dışa aktar), BE-015 (Etkinlik sekmesi).

Öğe kimlikleri: `E-05-01…E-05-38` → 05 Kullanıcılar; `E-05-40…E-05-75` → 05b Kişisel takip (`E-05-39` kullanılmadı).

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

Karar tarihi 2026-11-09 (WEB-1 O5 adım 2). Kaynaklar: `../ortak-kurallar.md` §1–§5, §7, §9, §10, §12 (P1–P7); `../sentez.md` §1 G13, G16; `../../backend-eksikleri/kayit.md`; W22 devirleri (`../00-ortak/README.md` satır dışı tablo). **"geçici kabul"** = Codex §6 #13–#16 önerilen varsayılanı; ürün sahibi cevaplayana dek uygulayıcı bunu `kabul` gibi kodlar, cevap farklıysa tablo F2 O2a'dan (W71) önce güncellenir. Uygulayıcılar: `../../yurutme/web-2/`. Kısaltmalar: ŞY = `me.company_admin`.

| E-kimliği | Faz | Davranış (canlı / statik / gizli / devre dışı) | Kabul edilmiş varsayım (öneri / kabul / ret — ortak-kurallar §2) | BE bağı | Bağımlılık | Kabul kanıtı |
|---|---|---|---|---|---|---|
| E-05-01 Kırıntı | F2 | canlı — "‹program› / Kullanıcılar" (kabuk) | kabul — §5, E-00-35 (program adı `['programs']`'tan, ek istek yok) | — | W22 kabuk, W71 katalog | kırıntı rota kataloğundan; ek `readProgram` yok |
| E-05-02 Başlık | F2 | canlı (sabit metin) | — | — | — | görsel karşılaştırma |
| E-05-03 Alt başlık "‹N› kullanıcı" | F2 | canlı — yüklenen kullanıcı sayısı; imleç bitmediyse "‹n›+" / "yüklenen kayıtlar içinde"; toplam yazılmaz | kabul — §10, P4 kalıbı; **geçici kabul (ürün onayı bekliyor)** — #14 liste şirket genelidir (S1) | BE-011, BE-045 | W71 `['users', …]` sonsuz sorgu | `next_cursor` dolu/boş iki msw testi (etiket var/yok) |
| E-05-04 Dışa aktar | F2 | devre dışı — `designStub('BE-014')` | kabul — §3 (uç yok) | BE-014 | W15 design-stub | stub lint; tık istek atmaz |
| E-05-05 Kullanıcı davet et | F2 | canlı — metin **"Kullanıcı oluştur"**; P3 minimum form (`createUser`: e-posta, ad, departman = seçili programın birimi, rol `koordinator`/`uye`); ŞY'de ikinci adım "Geçici parola belirle" (`updateAccount {password, force_password_change: true}`); 409 `organization.transfer_available` → "mevcut hesabı bu departmana ekle" + `transfer_account_id` | **geçici kabul (ürün onayı bekliyor)** — #15 davet değil oluşturma, yöneticinin belirlediği geçici parola; kabul — P3, K11 (vee-validate + zod); ret — e-posta daveti (uç yok) | BE-013, BE-036 (5) | W74 form kalıbı, W71 mutasyonlar; 01 E-01-11 bu akışa bağlanır | e-posta/ad alan hataları forma (422 `identity.*`); parola yanıtta beklenmez; 409 aktarım akışı msw testi |
| E-05-06 Rol sekmeleri | F2 | "Tümü", "Koordinatör", "Üye" canlı — yüklenen kümede istemci süzmesi, **seçili programın** `memberships` etiketlerine göre; sayaçlar "yüklenen kayıtlar içinde"; "Admin" sekmesi devre dışı `designStub('BE-042')` | **geçici kabul (ürün onayı bekliyor)** — #14 seçili program üyelikleri açık etiketlenir; ret — sunucu `role` süzgeci ("herhangi bir programda", G16 → seçili program sanılır); kabul — URL `rol` W71 katalog geçişinde (K1 lint: değer kümesi capability dosyasında) | BE-011, BE-042 | W71 katalog, W12 `UiSegmented` | etiket ayrıştırma testi (`program:departman:rol`, ayrıştırılamayan yok sayılır); Admin sekmesi stub lint |
| E-05-07 Arama | F2 | canlı — sunucu `search` (yalnız ad, Türkçe katlamalı); ~300 ms gecikme; URL `q`; yer tutucu **"Ad…"** | kabul — P5 kalıbı (sözleşmeye uy; e-posta aranmaz); kabul — gecikme 03 E-03-10 sabitiyle aynı | BE-041 | W71 | gecikmeli istek + imleç sıfırlama testi |
| E-05-08 Koordinatörlük süzgeci | F2 | canlı — **tek seçim**; seçenekler `listProgramDepartments` (G13); seçiliyken tablo `listMembers(D)` (tek istek, ≤200, `X-Result-Truncated` → "liste eksik olabilir"); arama/sıralama o kümede istemcide; URL `koordinatorluk` | **geçici kabul (ürün onayı bekliyor)** — eksikler §3 kısmi karşılık; kabul — P4/K3 (çoklu seçim yok, fan-out yok) | BE-011 | W71 `scoped(['departments'])`, `members` anahtarı | msw istek sayısı = 1; truncated uyarısı testi |
| E-05-09 Tümünü seç | F2 | gizli | kabul — P7 kalıbı (toplu uç yok) | — | — | DOM'da kutu yok |
| E-05-10 Sıralama "kullanıcı ↑" | F2 | canlı — `sort_by=name&sort_order=asc` açıkça; yön değişiminde imleç sıfırlanır; 422 `organization.invalid_sort` → varsayılan sıra; `aria-sort` | **geçici kabul** — değer kümesi kod okumasıdır (BE-036 belge); diğer sütunlar sıralanmaz | BE-036 (4) | W71 | yön değişimi → yeni sorgu, eski imleç kullanılmaz testi |
| E-05-11 "roller" başlığı | F2 | canlı (sabit) | — | — | — | görsel |
| E-05-12 "koordinatörlük" başlığı | F2 | canlı (sabit; son sütun "Ayrıntı" `rp-sr`) | — | — | — | görsel |
| E-05-13 Kullanıcı satırı | F2 | canlı — `KnownUser`; tıklama yan paneli açar (URL `secili`) | kabul — K10 (panel durumu URL'de) | — | W71 katalog | derin bağlantı testi (yüklü sayfada varsa panel açık) |
| E-05-14 Satır seç kutusu | F2 | gizli (ızgara sütunu boş, hizalama korunur) | kabul — P7 kalıbı | — | — | DOM'da kutu yok |
| E-05-15 Avatar | F2 | canlı — `full_name` baş harfleri, renksiz | — | — | W12 | baş harf testi |
| E-05-16 Ad | F2 | canlı — bağlantı → 05b `/kullanicilar/:accountId` | kabul — K10 | — | W76 | gezinme testi |
| E-05-17 E-posta | F2 | gizli (satır çizilmez) | kabul — BE-041 Şimdilik; §4 (sahte e-posta yok) | BE-041 | — | DOM'da e-posta satırı yok |
| E-05-18 İlk rol rozeti | F2 | canlı — seçili programdaki rol(ler)den, sıra Koordinatör → Üye; **Admin rozeti çizilmez** | kabul — K1 (rol yalnız gösterim); **geçici kabul** — #13 Admin ayrı olgudur, okunamıyor | BE-042 | — | birleşik rol (aynı programda K + Ü) render testi |
| E-05-19 Ek rol rozeti "+n" | F2 | canlı — `title` kalan roller | — | — | — | +n testi |
| E-05-20 Koordinatörlük hücresi | F2 | canlı — seçili programın etiketleri → `display_name` (G13); boşsa "Atanmamış"; çözülemeyen kimlik gösterilmez | kabul — G13, G16; **geçici kabul** — #14 başka programın satırları gösterilmez | BE-011 | W71 departman sözlüğü | çok programlı hesap testi |
| E-05-21 Ayrıntı aç | F2 | canlı — yan paneli açar; derin bağlantıda kişi yüklü sayfada yoksa panel kapalı + bilgi | kabul — BE-043 Şimdilik | BE-043 | W75 | yüklü değil → panel kapalı testi |
| E-05-22 Aralık metni | F2 | statik — "‹ilk›–‹son› / ‹toplam›" kurulmaz; yerine yüklenen sayı; `designStub('BE-011')` | kabul — P4, §10 (03 E-03-38 kalıbı) | BE-011 | W15 design-stub | toplam metni üretilmez testi |
| E-05-23 Sayfa düğmeleri | F2 | numaralı sayfalayıcı gizli; **"Daha fazla yükle"** canlı (`next_cursor`, `limit` 200) | kabul — P4 kalıbı; imleç URL'de taşınmaz | BE-011 | W71 sonsuz sorgu | imleç bitince düğme gizli |
| E-05-24 Sayfa boyutu | F2 | gizli | kabul — P4 kalıbı | BE-011 | — | metin DOM'da yok |
| E-05-25 Avatar (büyük) | F2 | canlı — `--violet` zemin (tasarım tokenı, herkese aynı) | **geçici kabul** — renk atama kuralı tasarımda yok; tek token | — | W11 token | görsel |
| E-05-26 Ad | F2 | canlı | — | — | — | render |
| E-05-27 Alt satır | F2 | canlı — "‹ilk birim› · ‹rol›", çok birimde "‹ilk› +n" | **geçici kabul** — #13 çip başına rol | — | — | çok birim testi |
| E-05-28 Paneli kapat | F2 | canlı — URL `secili` silinir, tablo tam genişlik | kabul — 03 E-03-43 kalıbı | — | — | kapat → URL testi |
| E-05-29 Görev özeti şeridi | F2 | canlı — açık / geciken / onayda; 05b ile **aynı sorgu** (`listProgramWorkItems` tek uç, sonuna dek sayfalama, `assignee_account_ids` istemci süzmesi); çekim sürerken "yüklenen kayıtlar içinde"; tık → 05b `kart=acik` | **geçici kabul (ürün onayı bekliyor)** — #14 kişisel takip yalnız çağıranın yetkili görev kümesi; kabul — §9 (tek ucun sayfalaması fan-out değil); `reportWorkload` ekran verisi olarak kullanılmaz | BE-038, BE-003 | W76 sorgu, §6 görev anahtarı | `iade_edildi` açık sayılır; tamamlanmış geç görev gecikmede sayılmaz |
| E-05-30 Profil ve kişisel iş takibi | F2 | canlı → 05b | kabul — K10 | — | W76 | gezinme |
| E-05-31 Roller (3 onay kartı) | F2 | **Admin** kartı devre dışı `designStub('BE-042')` (mevcut değer okunamaz); **Koordinatör / Üye** kartları çiplerden türetilen salt gösterim (devre dışı, "koordinatörlük çiplerinden") | **geçici kabul (ürün onayı bekliyor)** — #13 Admin anahtarı ayrı, Koordinatör/Üye çip rolüdür; kabul — K1; ret — kişiye bağlı bağımsız rol kutuları (backend modeliyle örtüşmez, backend.md §6) | BE-042 | W75 | Admin kartı tık → istek yok; K/Ü kartı çiplerle tutarlı testi |
| E-05-32 Koordinatörlük çipleri | F2 | canlı — çip = (birim, rol); rol seçici yalnız ŞY (`updateMembershipRole`, 409 `organization.confirmation_required` → ortak onay → `confirm: true` gövdede); X → `removeMember` (ya da yalnız koordinatörlük bırakılıyorsa `removeCoordinator`, `?confirm=true`); her işlem **anında** ve kendi sonucuyla; kendi satırında kaldırma gizli | **geçici kabul (ürün onayı bekliyor)** — #13 çipte tek üyelik rolü, çip işlemleri ayrı onay ve sonuç; kabul — §7 (`confirmation_required` organizasyon uçlarında), K5 (iyimser yok) | — | W71 mutasyonlar, W22 onay | onay iki biçim (gövde / sorgu) testi; GAP-089 422 iletisi |
| E-05-33 "+ Ekle" | F2 | canlı — seçici `listProgramDepartments` − kişinin birimleri + rol; `assignMembership` anında; boş liste → K7 "departman ekle" metni | **geçici kabul** — #13; kabul — §7 (`assignMembership` onay istemez) | — | W71, W22 K7 | 409 `organization.membership_exists` → "zaten ekipte" + liste yeniden okunur |
| E-05-34 Şifre sıfırlama bağlantısı | F2 | devre dışı — `designStub('BE-013')` | **geçici kabul** — #15 bağlantı yok; yerine satır dışı "Geçici parola belirle" (aşağıda) | BE-013 | W15 design-stub | stub lint; tık istek atmaz |
| E-05-35 Hesabı kilitle | F2 | devre dışı — `designStub('BE-012')`; kilitli göstergesi yok | **geçici kabul (ürün onayı bekliyor)** — #15 durum okunamıyorsa kilitle/aç anahtarı tahmin edilmez | BE-012, BE-044 | W15 | stub lint |
| E-05-36 Kullanıcıyı sil | F2 | canlı — ŞY; istemci yıkıcı onay ("açık görevleri size devredilir"); kendi satırında gizli; başarıda panel kapanır, liste yeniden okunur | kabul — §7 (`deleteUser` onay kapısı yok → istemci onayı), backend.md §6 (ORGANIZATION-K29) | — | W22 onay, W71 | iptal → istek yok; 409 `organization.last_admin` iletisi |
| E-05-37 Vazgeç | F2 | gizli | **geçici kabul** — #13 toplu taslak yok (çip işlemleri anında) | — | — | DOM'da yok |
| E-05-38 Kaydet | F2 | gizli | **geçici kabul (ürün onayı bekliyor)** — #13 toplu atomik Kaydet vaat edilmez; ret — dört uca ayrışan toplu Kaydet (05/yeni-8, kayda alınmadı) | — | — | DOM'da yok |
| E-05-40 Kırıntı (3 düzey) | F2 | canlı — kişi adı liste önbelleğinden ya da görevlerin `assignees[].full_name`'inden; yoksa "Bilinmeyen kişi" | kabul — BE-043 Şimdilik, G4 | BE-043 | W76 | yenilemede ad kaynağı testi |
| E-05-41 Avatar (çok büyük) | F2 | canlı (`--violet`, E-05-25 ile aynı) | **geçici kabul** — E-05-25 | — | — | görsel |
| E-05-42 Ad | F2 | canlı (E-05-40 kaynağı); belge başlığı "RoketPortal — ‹ad›" | kabul — P9 | BE-043 | — | başlık testi |
| E-05-43 Rol rozeti | F2 | canlı — seçili programdaki rol(ler), ilk + "+n" (E-05-18 kalıbı); Admin yok | kabul — K1; **geçici kabul** — #13 | BE-042 | — | birleşik rol testi |
| E-05-44 Alt satır | F2 | birim adı canlı; e-posta parçası gizli | kabul — BE-041 Şimdilik | BE-041 | — | e-posta DOM'da yok |
| E-05-45 Profili düzenle | F2 | canlı — 05 yan paneline gider (`/kullanicilar?secili=‹id›`) | **geçici kabul (ürün onayı bekliyor)** — #16 profil düzenleme yönetim paneline gider; **öneri** — ad/e-posta düzenleme formu (`updateUser`, son yazan kazanır) | — | W75 | gezinme testi |
| E-05-46 Mesaj | F7 | devre dışı "F7'de" | **geçici kabul** — #16 ilgili fazı bekler; kabul — P2 (ekran içi faz dışı devre dışı), stub yok (§3) | — | 10 grubu | `aria-disabled` + faz notu |
| E-05-47 Kişisel rapor | F6 | devre dışı "F6'da" | **geçici kabul** — #16 Rapor ilgili fazı bekler (`reportWorkloadPdf` mevcut ama F6 kalıbı, P6); stub yok | — | F6 | `aria-disabled` + faz notu |
| E-05-48 Görev ata | F2 | canlı — W45 `NewTaskDialog`, atanan = bu kişi ön dolu; hedef departman **açık seçilir** (kişinin seçili programdaki birimleri, tekse dolu); görünürlük work `canCreateWorkItem` | **geçici kabul (ürün onayı bekliyor)** — #16 hedef departman açık seçilir; kabul — P1 | — | W45 form (`modules/work/public.ts`), W76 | çok birimli kişide seçim zorunlu testi; salt üyede gizli |
| E-05-49 Tamamlanma | F2 | canlı — `tamamlandi / toplam` (E-05-29 sorgusu); `total = 0` → "%0" + nötr not | kabul — 01 E-01-04 kalıbı (§4, §10) | BE-038 | W76 | Türkçe ek testi; yaklaşık etiket |
| E-05-50 Açık görev | F2 | canlı — `toplam − tamamlandi` (`iade_edildi` dahil); varsayılan seçili kart (`kart=acik`) | kabul — 01 E-01-05 kalıbı, G2 | BE-038 | W76 | `iade_edildi` açık sayılır testi |
| E-05-51 Gecikmede | F2 | canlı — açık ∧ `is_overdue`; % = geciken/açık | kabul — 01 E-01-06 kalıbı, G3 | BE-038, BE-036 (1) | W76 | tamamlanmış geç görev sayılmaz |
| E-05-52 Onay bekleyen | F2 | canlı — `status = onaya_sunuldu`; **not satırı boş** ("Kanıt yüklendi…" yazılmaz) | kabul — 01 E-01-07 kalıbı (P5) | BE-038 | W76 | not satırı render edilmez |
| E-05-53 Görevler sekmesi | F2 | canlı — sayaç seçili kartın satır sayısı | **geçici kabul** — ozellikler varsayımı (kart E-05-50 ile aynı sayı) | — | W12 sekme | `tablist`/`tabpanel` + `aria-controls` |
| E-05-54 Dosyalar sekmesi | F2 | sekme görünür, **sayaç yok**; içerik nötr yer tutucu `designStub('BE-046')` | **geçici kabul (ürün onayı bekliyor)** — #16 "Dosyalar" anlamı kararlaşana dek sayı yok | BE-046 | W15 | sayaç DOM'da yok; stub lint |
| E-05-55 Etkinlik sekmesi | F2 | içerik nötr yer tutucu `designStub('BE-015')`; sahte akış yok | kabul — §4; **geçici kabul** — #16 | BE-015, BE-091 | W15 | sahte olay yok testi |
| E-05-56 Hesap ve roller sekmesi | F2 | canlı — 05 yan panel bileşeni (E-05-31…36) gömülü, aynı kurallarla | **geçici kabul** — #16 profil/rol yönetimi tek yerde | — | W75 bileşeni | aynı bileşen testi |
| E-05-57 Gruplama | F2 | canlı — "Son tarihe göre" (Gecikmede / Bu hafta / Sonra; hafta = pazartesi–pazar, kurulum saat dilimi) · "Duruma göre" (5 durum, P5); URL `grupla` | **geçici kabul** — ozellikler §7-13 varsayımı; kabul — P5 | — | W76 | hafta sınırı birim testi |
| E-05-58 Liste başlığı | F2 | canlı — seçili karta göre "‹Kart› · ‹n› görev" | **geçici kabul** — ozellikler varsayımı | — | — | kart değişimi testi |
| E-05-59 Başlık satırı | F2 | canlı (sıralama yok) | — | — | — | görsel |
| E-05-60 Grup satırı | F2 | canlı — grup adı + sayı | — | — | — | sayım testi |
| E-05-61 Durum noktası | F2 | canlı — 5 durum; `iade_edildi` `rp-dot--back` | kabul — P5, G2 (03 E-03-23 kalıbı) | — | W11 token | 5 değer testi |
| E-05-62 Görev başlığı | F2 | canlı → `/gorevler?gorev=‹id›` (03 paneli) | kabul — K10, 03 E-03-19 | — | 03 (W42/W43) | bağlantı testi |
| E-05-63 Görev anahtarı | F2 | kısmi — "‹KOD›-—" (önek `ProgramDepartment.code`, sıra statik) | kabul — G13, 03 E-03-41 kalıbı | BE-005 | — | kodlu/kodsuz testi |
| E-05-64 Durum | F2 | canlı — 5 durum ("Geri gönderildi" dahil) | kabul — P5 | — | — | 5 değer testi |
| E-05-65 Bitiş | F2 | canlı — `end_on` + "gün gecikti" (`days_overdue`, sunucu) / "gün kaldı" (istemci, kurulum saat dilimi) | kabul — 03 E-03-25 kalıbı, G3 | BE-036 (1) | — | üç durum testi |
| E-05-66 Kanıt | F2 | statik nötr "—"; stub yok | kabul — §3 (BE değil: `istemci-akislari.md` §7 kararı korunur, Codex `05:yeni-6`); tuvale geri bildirim | — | — | satır başına `listWorkItemFiles` isteği yok (msw) |
| E-05-67 Görevi aç | F2 | canlı (E-05-62 hedefi) | — | — | — | odakta görünür |
| E-05-68 Takvim başlığı | F2 | canlı — "Son tarihler · ‹Ay›"; URL `ay` | — | — | W71 katalog | ay değişimi testi |
| E-05-69 Önceki / sonraki ay | F2 | canlı | — | — | — | klavye testi |
| E-05-70 Gün başlıkları | F2 | canlı (pazartesi başlar) | — | — | — | görsel |
| E-05-71 Gün hücresi | F2 | canlı — `end_on` ayına düşen açık görevler; kaçırılan = `is_overdue`; bugün kurulum saat dilimi; gün tıklaması yok | **geçici kabul** — ozellikler §7-12 (açık görevler; tek nokta) | BE-036 (1) | — | `aria-label` testi |
| E-05-72 Lejant | F2 | canlı | — | — | — | görsel |
| E-05-73 Durum dağılımı başlığı | F2 | canlı | — | — | — | görsel |
| E-05-74 Yığılmış çubuk | F2 | canlı — açık görevlerin 4 durumu (başlamadı, devam, onayda, **geri gönderildi** ayrı dilim) | kabul — P5 (5 durum sözlüğü; `iade_edildi` gizlenmez) | — | W11 token | `aria-label` 4 durumla |
| E-05-75 Durum listesi | F2 | canlı — aynı 4 satır | kabul — P5 | — | — | sayım testi |

**Satır dışı varsayımlar:**

| Varsayım | Karar | Kaynak |
|---|---|---|
| Ekran (05 ve 05b) yalnız `company_admin` olgusuyla açılır; mercekten bağımsız (Koordinatör merceğindeki yönetici de görür, `listUsers` 403 dönmez); yönetici olmayanda menüde yok, doğrudan URL rota kapısında ana sayfaya döner | kabul — P1, G16, E-00-23; **geçici kabul (ürün onayı bekliyor)** — #14 koordinatöre admin ekranı taklidi yok | ortak-kurallar §1, §12 |
| Koordinatör için kendi ekibi görünümü (`listMembers` + `listAssignable`) | öneri — F2'de kurulmaz; ürün #14 cevabıyla ayrı tanım | eksikler §3 |
| Liste kapsamı şirket genelidir (S1); koordinatörlük hücresi, çipler, rol sekmeleri seçili programdan | **geçici kabul (ürün onayı bekliyor)** — #14 | eksikler §4, G16 |
| Liste altında "Ekibi olmayan hesaplar listelenmez" notu | **geçici kabul** — BE-045 Şimdilik (koşullu, #14) | kayit BE-045 |
| "Geçici parola belirle" yan panel menü öğesi (ŞY; `updateAccount {password, force_password_change: true}`; parola alanı K11 doğrulamalı, yanıt `revoked_sessions`) | **geçici kabul (ürün onayı bekliyor)** — #15; kabul — P3 (çizilmemiş parça, ortak bileşenle minimum) | kayit BE-013 Şimdilik |
| "Giriş kilidini kaldır" yan panel menü öğesi (ŞY, `unlockAccount`); her zaman görünür, 409 `identity.account_not_locked` → "Hesap kilitli değil" bilgisi | **geçici kabul** — #15 durum tahmin edilmez; kayıt BE-044 Şimdilik | kayit BE-044 |
| Silinmiş kullanıcılar (`listDeletedAccounts`/`restoreAccount`) | **geçici kabul** — #15 ayrı yönetim akışı; F2'de kurulmaz | Codex §6 #15 |
| Kullanıcı/üyelik yazmaları `Idempotency-Key`/`expected_revision` almaz: sonuç bilinmiyorsa kör tekrar yok, liste yeniden okunur; 409 `identity.account_exists` / `organization.membership_exists` "zaten uygulanmış olabilir" diye yorumlanır | kabul | §7, backend.md §2 |
| Eylem görünürlüğü `modules/organization/model/capabilities.ts`'te (organization README §4 "Rol" sütunu ve ORGANIZATION-K* kaynak gösterilerek); hedef = çağıran ise yıkıcı eylemler gizli | kabul — K1 istisnası (BE-036 madde 5 kapanana dek) | backend.md §3, CX-F0-K-03 |
| Yönetim grubu kapısı `menu.ts` boolean olgusundan organizasyon `capabilities.ts`'e taşınır | kabul (WEB-0 devri, CX-F0-K-03) | `../../yurutme/web-0/ilerleme.md` O3 |
| `organization.users` / `organization.user` rotaları "programa departman katılmamış" açık durumundan muaf (`NO_DEPARTMENT_EXEMPT_ROUTES`) — yönetici kullanıcı oluşturup departman bağlayabilmeli | kabul (W22 devri, F2 açılışında) | `../00-ortak/README.md` satır dışı |
| Kapsam değişince arama korunur; koordinatörlük süzgeci, `secili`, imleç sıfırlanır | kabul (03 kalıbı) | K2, §6 |
| Yükleniyor → iskelet satırlar; hata → bölge içi "Yeniden dene"; boş → `rp-empty` | kabul | K7, §4 |

Uygulayıcı yalnız `kabul` ve **geçici kabul** satırlarını kodlar; `öneri` kodlanmaz, `ret` uygulanmaz.

## Açık sorular (ürün sahibine)
- **Rol modeli:** Tasarımda roller (Admin / Koordinatör / Üye) kişiye bağlı onay kutuları, koordinatörlük ise ayrı bir çip listesi. Backend'de Koordinatör/Üye bir **(program, departman) üyeliğinin** rolüdür; Admin `company_admin`'dir. "Koordinatör" kutusu hangi departmanda koordinatörlük verir? Çip başına rol mü seçilmeli? (bkz. ozellikler §7-1)
- **Liste kapsamı:** Liste şirket geneli mi, seçili program mı? Rol sekmesi sayıları hangi programa göre? (BE-011)
- **"Kullanıcı davet et":** E-posta daveti yok (BE-013). v1'de bu düğme mevcut "kullanıcı oluştur + geçici parola" formunu mu açsın? Form tasarımda yok.
- **Durum sütunu yok:** Tabloda hesap durumu (aktif / kilitli / silinmiş) gösterilmiyor; "Hesabı kilitle" var ama kilit açma ve kilitli göstergesi yok. Eklenmeli mi?
- **Silinmiş kullanıcılar:** Backend'de silinenler/geri yükleme var; tasarımda karşılığı yok. v1'de gerekli mi?
- **05b erişimi:** Koordinatör kendi departmanındaki üyenin kişisel takibini görebilir mi? Üye kendi sayfasını görür mü?
- **05b başlık eylemleri:** "Mesaj" (F7, v1 dışı), "Kişisel rapor" (biçimi bilinmiyor, F6?), "Görev ata" (hangi departmanda?), "Profili düzenle" (05 yan paneliyle aynı mı?) — v1'de hangileri etkin?
