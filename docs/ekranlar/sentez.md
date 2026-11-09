# Ekran tespitleri — koordinatör sentezi

**Durum:** tamamlandı (tespit) · **Tarih:** 2026-11-08 · **Kapsam:** 11 grup, 66 dosya + ortak kurallar, ~7.700 satır · **Pin:** `v0.11.0-api`
**Üretim:** tasarım analisti (Opus) → backend analisti (Opus) → bağımsız denetçi (Sonnet) → **Codex kapısı** (`gpt-6-astra`, salt okunur; hüküm **KOŞULLU UYGUN**, [`../reviews/EKRANLAR-codex.md`](../reviews/EKRANLAR-codex.md)) → Codex kararlarının grup dosyalarına işlenmesi (§7).
**Çıktılar:** grup dosyaları (`denetlendi`), [`ortak-kurallar.md`](ortak-kurallar.md), eksik kaydı `../backend-eksikleri/kayit.md` (BE-001…035 düzeltildi, **BE-036…BE-106** eklendi), backend devir raporu [`../backend-eksikleri/rapor-tespit-2026-11-08.md`](../backend-eksikleri/rapor-tespit-2026-11-08.md), yürütme sözleşmesi `../yurutme/web-0/ortak-sozlesme.md` adım 2a.

Bu belge grupların **üstündeki** kararları toplar. Grup içi ayrıntı: `ortak-kurallar.md` → grup `README.md` (uygulama kararı tablosu) → `mekanizma.md` → `backend.md` → `eksikler.md` → `ozellikler.md` → `dogrulama.md`.

**Codex'in koşulu:** set tasarım envanteri ve uygulayıcı hazırlığı için güçlü temel; ancak §4'teki ilk beş ürün kararı verilip grup README'lerindeki uygulama kararı tabloları doldurulmadan tek başına uygulanabilir gereksinim sayılmaz. `denetlendi` = tespit tamam; `kabul` faz açılışında verilir.

## 1. Sözleşme gerçekleri (tüm gruplar için bağlayıcı)

Analist varsayımlarıyla çelişip denetçi/Codex tarafından sözleşmeden doğrulanan ve her uygulayıcının bilmesi gereken gerçekler. Ortak davranış kuralları `ortak-kurallar.md`'de; burada yalnız sözleşme olguları.

| # | Gerçek | Kaynak | Gruplar |
|---|---|---|---|
| G1 | Kapsam başlıkları `X-Nizamio-Program` / `X-Nizamio-Department`; sınıflar S0–S3 | `istemci-akislari.md` §2 | hepsi |
| G2 | Görev durumu **5** değer, `iade_edildi` ayrı; tasarım 4 çiziyor | `WorkItem.status` | 01, 03, 03c, 05 |
| G3 | "Geciken" sunucudan: görev listesinde/ayrıntıda doğrudan `WorkItem.is_overdue`, `days_overdue` (iç içe `lateness` nesnesi yalnız Gantt yanıtında: `GanttTask.lateness` → `Lateness`); tanımı openapi'de yok (BE-036 belge). Admin Gantt `overdue` parametresi tamamlanmış geç görevi de döndürür (GAP-053) → istemcide süz | `WorkItem.is_overdue` / `days_overdue` (pinli `v0.11.0-api` `openapi.yaml` s.2262, 2264); 03c: `GanttTask.lateness` (s.2719, `Lateness` s.2721) — Codex CX-F1-K-02 | 01, 03, 03c, 05, 08 |
| G4 | Görev çok atananlı (`assignees[]`); `createWorkItem` tek atanan + `addAssignments` (yalnız koordinatör, §4 s.140 → yönetici formunda tek atama alanı); ek atama başarısızsa ilk atanan korunur | openapi | 03, 03c, 09 |
| G5 | `WorkItem.priority` zorunlu `dusuk/orta/yuksek/acil` | openapi | 01, 03 |
| G6 | `listProgramWorkItems` yanıtında `subtask_counts`, `pending_date_request` var (satır başına ek istek yok). Yok: durum süzgeci, toplam, sıralama, atanan süzgeci, arama (BE-003, BE-004, BE-038, BE-040) | openapi | 03, 05, 01 |
| G7 | 409 `organization.confirmation_required` yalnız organizasyon uçlarında: `removeCoordinator`, `removeMember`, `updateMembershipRole`. `assignMembership`, `assignCoordinator`, görev silme, tarih uçları, nottan görev: **yok** → istemci onay diyaloğu | error-codes, openapi | 03, 03c, 05, 08, 09, 11 |
| G8 | Tarih: koordinatör kendi departmanında `updateWorkItem`/`extendWorkItem` ile **doğrudan** değiştirir, talep zorunlu değil; `extendWorkItem` 1–90 gün ileri; tarih uçları Idempotency-Key/sürüm almaz; bağımlı kayması sessiz (`cascade_count`); geri alma garantisi yok | §4, §6 | 03, 03c |
| G9 | Alt görev: kişi yalnız ana göreve atananlardan (422 `work.subtask_assignee_not_assigned`); 409 `work.subtasks_open` → `close_subtasks:true`; kanıt kuralı görev düzeyinde, herhangi dosya (422 `work.attachment_required`) | §7 | 03, 03c |
| G10 | Dosya yükleme doğrudan multipart, bilet yok; `attachFile` zorunlu `tag` (kapalı küme); tür kümesi `belge/tablo/gorsel/arsiv/metin`; `renameFile` sürümsüz; `deleteFile` kalıcı (RECORDS-K16); `provisioning.write_not_allowed` = kurulum salt okunur (dönem durumu değil) | records | 03, 06, 10 |
| G11 | Yazma istekleri `X-Requested-With` taşır (CLAUDE.md); `attachFile` istemese de mutation katmanı istisnasız ekler | CLAUDE.md | hepsi |
| G12 | İyimser güncelleme §8'de yasak | §8 | 03, 11 |
| G13 | `me/departments` satırı `program_id, program_name, department_id, display_name, role`; `MyDepartment` kodsuz; `ProgramDepartment.code` isteğe bağlı; departman adı/kodu çözümü **bütün rollerde** `listProgramDepartments` ile (ad çözümü ≠ kapsam seçimi) | openapi | 00, 03, 03c, 05, 08 |
| G14 | `membership_required`: `listPrograms` 403, `myDepartments` 200 boş/null → K7 "departman ataması bekleniyor" ekranı `listPrograms` 403'üyle | openapi | 00 |
| G15 | Admin panosu `reportDashboard`: KPI, `overdue_tasks`, `pending_date_changes` (GAP-075: test yok), ekip sayıları, `coordinatorship_stats`; yalnız yönetici (REPORTING-K01). Alt liste uçları 200'de kesilir + `X-Result-Truncated` (REPORTING-K03; gömülü dizileri kapsayıp kapsamadığı belirsiz, openapi'de başlık tanımsız → BE-036). `member_count` koordinatörleri saymaz (kod gözlemi) | reporting | 00, 01, 08 |
| G16 | `listUsers` yalnız şirket yöneticisi (ORGANIZATION-K33; yetki `company_admin` olgusuna bağlı, merceğe değil); satırda e-posta/`company_admin` yok; `memberships` dizesi `program:departman:rol`; `createUser`/`reset_password` parola **döndürmez** (GAP-024) | organization | 05, 08, 11 |
| G17 | Departman: `kind` zorunlu; kod kuralı `^[A-Z0-9]{2,10}$` (ORGANIZATION-K10, openapi'de yok); ad iki kavram (`renameDepartmentLink` / `updateDepartment`); oluştur + bağla iki adım, atomik değil; `expected_revision` yok | organization | 08 |
| G18 | Arşiv uçları S3 + departman başlığı; `FileListItem`/`ArchiveTask` `department_id` taşımaz → **yönetici 07 Klasör ekranını kuramıyor**; teknik departman seçimi K2'yi aşar (Codex reddi) → sözleşme açıklığı BE-0xx (06/yeni-3). Koordinatöre tek departman, üye `my-tasks` | records | 06, 01 |
| G19 | Toplantı: üye yalnız `members_included` + departmanı bağlı toplantıları görür (K19/K45); `department_ids` ≥1; toplantı/gündem PATCH sürümsüz; not düzenleme `expected_revision` + `collaboration.edit_conflict`; nottan görev gövdesinde `priority`, `assignee_account_ids`; dönüşmüş not kilidi yalnız üye yazarı (GAP-070); katılımcı ekleme koordinatör rolü ister (K21); not 5000 rune (openapi'de yok); video sağlayıcı kurulum profiline bağlı (GAP-133) | meetings | 09 |
| G20 | Sohbet: paylaşılan özet **her üyeye açık** (MESSAGING-K31/K32) — "kilitli kart" sözleşmenin tersi, Tablolar'a emsal de değil; `auto_kind` yalnız `department`/`general`; tepki 4 tür; düz metin; grupta yalnız `role==admin` siler; sohbet bildirim üretmez (ADR-0026); `messaging.not_authorized` iki durum (karşı taraf ayrıldı / yetkisiz `@herkes`), ikincisi sohbeti kapatmaz | messaging | 10, 00, 11 |
| G21 | Audit okuma ucu **yok**; `details` ≤300 kararlı değer (AUDIT-K02); IP tutulmuyor; work/identity/org/program kayıtlarında kapsam NULL; değişmezlik DB'de zorlanmıyor (GAP-067); `audit.entry_rejected` her yazmanın kaydedildiğini kanıtlamaz (`sendChatTyping` karşı örnek) | audit | 01, 01b, 03, 05, 08 |
| G22 | Tablolar modülü sözleşmede **yok**; `ErrorEnvelope.details` dizedir (nesne önerileri sözleşme değişikliğidir); `archiveUploaders` öğe tipi `string` (nesneye çevirmek kırıcı) | openapi | 11, 06 |

## 2. Yol haritası değişiklik kararları (Codex hükmüyle)

Yol haritası ürün sahibi kabulüdür; bu tablo **önerilen metni** verir, dosya bu oturumda değiştirilmemiştir.

| # | Karar | Hüküm | Önerilen değişiklik |
|---|---|---|---|
| Y1 | K6 yetki kaybı kodları | **Değiştir** | + 404 `program.not_found`, 403 `reporting.not_authorized`, 403 `work.not_authorized` (Gantt). Not: her 403/404 kapsam kaybı değildir — kaynak silinmesi, eylem yasağı ve program görünürlüğü kaybı ayrılır; `organization.not_authorized` yöneticilik kaybıdır (27 org ucu) |
| Y2 | K5 yazma protokolü | **Değiştir** | + "`confirmation_required` yalnız organizasyon uçlarında (`removeCoordinator`, `removeMember`, `updateMembershipRole`); diğer silme/tarih onayları istemci diyaloğu. Idempotency-Key kullanıcı eylemi başına" |
| Y3 | K1 eylem görünürlüğü kaynağı | **Değiştir (geniş)** | `istemci-akislari.md` §4 toplantı, organizasyon (departman/ekip/bağ, kullanıcı/hesap/üyelik), records ve reporting işlemlerini kapsamıyor → geçişte modül README kural kimlikleri (meetings §4, ORGANIZATION-K*, RECORDS-K*) sürümlü kaynak; nihai hedef §4 genişletmesi (BE-036 belge paketi) |
| Y4 | §4 F1/F6 ana sayfa | **Ürün sahibine sor** (soru 7) | Teknik olarak yönetici panosu `reportDashboard` ile F1'de kurulabilir; Codex varsayılanı: F1 = KPI + sade özet, tam koordinatörlük kartları/akış/rapor F6 ("uç varlığı faz kapsamını büyütmez"). Koordinatör önerisi de kaydedildi (01/eksikler.md §4) |
| Y5 | K3 tek `department_id` | **Değiştirme** | v1 tek seçim. K3'e not: yasak = departmanları ayrı çağrılarla birleştirmek; sayfalama, tek kayıt okuması, kullanıcı eylemiyle N yazma yasak değil (`ortak-kurallar.md` §9) |
| Y6 | K4 / ADR-0024 / 03d | **Değiştirme** | Alt görev sayaçları gerçek (BE-051), çubuklar nötr/devre dışı; aktif zamanlama ayrı ürün + backend ADR. Oklar `links`'ten çizilir (veri var). **K4 kararı (W31, 2026-11-08):** kendi SVG Gantt, yedek SVAR Vue Gantt (`../architecture/gantt-secimi.md`); Y6 hükmü değişmez |
| Y7 | K8 Tablolar gerçek zamanlı | **Şimdi değiştirme** | v1 dışı; modül ADR'sinde karar (BE-093…106 paketi yeni-1). Yalnız yenilemeyle teslim edilecekse "herkes anında görür" vaadi tuvalden kalkar |
| Y8 | K14 faz görünürlüğü | **Ürün sahibine sor** (soru 2); varsayılan **gizli** | Menü girişleri (Arşiv, Mesajlar, Asistan, hedefsiz Yardım) gizli; ekran içi faz dışı eylemler açıklamalı devre dışı; zil paneli yoksa tıklanabilir kontrol yok. Matris: `ortak-kurallar.md` §5 |
| Y9 | K2 depolama istisnası | **Değiştir (küçük)** | Daraltma durumu oturum belleğinde; kalıcılık istenirse `sidebar_collapsed` izinli anahtar |
| Y10 | F3 tarih talebi düğmeleri F1'de | **Fazı değiştirme; görünürlük netleştir** | Okuma göstergesi (`pending_date_request`) F1'de canlı; talep gönder/onayla F3'e kadar devre dışı; "Talepleri incele" sessizce başka süzgece dönüştürülmez |
| Y11 | F5 kapsamı | **Değiştir (kapsam açıklaması)** | Görev geri yükleme (var) ile dosya geri yükleme (yok, `deleteFile` kalıcı) ayrılır; dosya çöp kutusu yeni kapsam (BE-0xx, 06/yeni-7) |
| Y12 | K13 designStub + statik | **Değiştir (netleştirme)** | Stub yalnız kabul edilmiş işlev eksikliğine; statik öğe sahte işletme verisi üretmez (`ortak-kurallar.md` §3–§4) |
| Y13 | K15 "tek satırlık bağlama" istisnası (`yurutme/web-0/README.md`) | **Değiştir (öneri, CX-M-06)** | Özellik bağlama da uygulayıcıya; koordinatör yalnız birleştirme/çakışma |
| Y14 | K9 token | **Değiştirme** | Tuvale geri bildirim (§6): sabit hex renkler token'a |

## 3. Backend eksik kaydı — yapılan değişiklikler

Uygulandı: [`../backend-eksikleri/kayit.md`](../backend-eksikleri/kayit.md) (güncelleme notu dosyanın başında) ve devir raporu [`rapor-tespit-2026-11-08.md`](../backend-eksikleri/rapor-tespit-2026-11-08.md). Sınıflandırma Codex §4'e göre: **BE** ve **BELGE** kayda girdi; **ÜRÜN** ve **TASARIM** kalemleri kayda girmedi, raporda ayrı başlıkta.

| Değişiklik | Sonuç |
|---|---|
| Mevcut satırlar | 30 satır düzeltildi (BE-001…031, BE-014 hariç). **BE-008 açık kalır** (Hatırlat 03/03c'de çizili; "ana sayfadan çıkarıldı ≠ vazgeçildi" — Codex reddi). **BE-023 vazgeçildi** (backend eksiği değil; W7 web entegrasyonu; GAP-133). **BE-025 bölündü**: klasör özeti (S–M) / göreve bağsız yükleme → BE-069 (L); GAP-108 bağı BE-024'e taşındı. BE-003 çekirdek sayaç satırı (00/yeni-3, 01/yeni-5, 08/yeni-8, BE-009 birleşti). BE-020'den BE-051 (`subtask_counts`), BE-028'den BE-080 (iletme) ayrıldı. BE-027 M→L (bildirimin kendisi, ADR-0026) |
| Yeni satırlar | **BE-036…BE-106** (71), faz sırasıyla; 20'si koşullu (Bağ sütununda Codex §6 soru numarası) |
| Belge paketi | **BE-036** "S (belge)", 11 madde: §3/§4 eksik satırları (toplantı, organizasyon, kullanıcı/hesap/üyelik), `is_overdue` tanımı, `member_count`/`completion_rate`/`last_activity_at` anlamları, `listUsers` ŞY-only, departman kod kuralı, not 5000, `X-Result-Truncated`, arşiv sıralaması, web uyumluluk politikası |
| Sorgu ailesi | BE-038 atanan süzgeci (03/yeni-1 + 05/yeni-5), BE-039 aday dizini, BE-040 sıralama; BE-004 arama (= GAP-212) |
| Şemsiyeler | BE-030 audit → BE-087…092 (P1–P6; P0 karar, P6 koşullu varsayılan açılmaz); BE-031 tablolar → BE-093…106 (yeni-1 ADR önce; 2a/2b; 6+11a tek çekirdek; 11b ayrı; 15 backend zorunlu değil) |
| Kayda girmeyen | 18 ürün kalemi, 13 tuval kalemi, 5 "BE değil" kalemi — raporda §4.1/§4.3/§5. Logout/K6 kodları BE değil, yol haritası (Y1) ve `ortak-kurallar.md` §8 |

## 4. Ürün sahibi soruları

Tam liste (32 soru, her biri önerilen varsayılan cevapla): [`../reviews/EKRANLAR-codex.md`](../reviews/EKRANLAR-codex.md) §6.

**Cevaplandı (2026-11-08, ürün sahibi):** aşağıdaki 1–5 ve #7, #9 (Kopyala/toplu), #11 (Gantt sürükleme) → bağlayıcı metin [`ortak-kurallar.md`](ortak-kurallar.md) §12 (P1–P8). Özet: P1 yetki korunur · P2 menüde gizli · P3 ortak bileşenlerle minimum · P4 "daha fazla yükle" + tek departman · P5 sözleşmeye uy (5 durum, herhangi dosya kanıt, tarih talebi yazmaları F3) · P6 F1 = KPI + sade özet, kartlar F6 · P7 Kopyala = bağlantı, toplu gizli · P8 koordinatörde talep, adminde doğrudan. Kalan sorular ilgili fazın açılışında sorulur.

**F0/F1 başlamadan cevaplanmalı (Codex §6 #1–#5):**
1. Mercek ↔ Yönetim menüsü: yetki `company_admin`/üyelikten, mercek yalnız kapsam; çok seçenekte sessiz ilk departman yok. (varsayılan: `ortak-kurallar.md` §1)
2. Faz dışı menü/düğmeler: gizli mi devre dışı mı? (varsayılan: menü gizli, ekran içi eylem açıklamalı devre dışı — §5 matrisi)
3. Çizilmemiş görev formları ve sade ana sayfa nasıl üretilecek? (varsayılan: ortak bileşenlerle minimum form; üye "bana atananlar", koordinatör seçili birim, admin KPI)
4. Liste sınırları: tek departman, "Daha fazla yükle", yüklenen kümede arama/sıralama, tam toplam/sayfa numarası taklidi yok. (varsayılan: evet)
5. Kanıt/durum/tarih talebi: beş durum; herhangi dosya kanıt; yüklemede etiket seçimi; tarih talebi yazmaları F3. (varsayılan: evet; yeni zorunluluk bayrağı yok)

**F1 kapsamı ve 03 ayrıntıları (#7–#10):** yönetici ana sayfası ne kadar geniş (Y4); Son işlemler/silinenler hedefi (sahte akış yok); "Kopyala" = bağlantı, toplu seçim gizli; Hatırlat kayıt açık düğme devre dışı.

**F2–F4 (#11–#23):** Gantt sürükleme doğrudan mı talep mi (varsayılan: yetkisi olan doğrudan, talep ayrı düğme, üye düzenlemez; otomatik geri al yok); kullanıcı rol düzenleme çip başına; `listUsers` ŞY, koordinatör taklit etmez; davet = geçici parola; 08 koordinatör görünümü ayrı tanım; "sezona kopyala" ≠ taşı; video şeridi F4'te gizli, sağlayıcı markası yok; not sınırı belgelenir, "yalnız ileri" metni düzelir.

**v1 dışı (#19–#20, #24–#32):** arşiv yükleme/etiket/çöp kutusu; sohbet paylaşım semantiği (K31/K32 korunur, kilitli kart yok); tablolar kapsam (program), ACL kişi bazlı, erişimsiz hedef gizli, gerçek zamanlı önce uzlaştırma; audit yetki/saklama/IP (varsayılan IP yok).

## 5. İşletme sırası ve riskler

| Sıra | Grup | Faz | Başlamadan netleşmeli | İlk 3 risk (Codex §7) |
|---|---|---|---|---|
| 1 | 00-ortak | F0 | soru 1–2; Y1, Y9; ortak sorgu anahtarı fabrikası; logout modeli | mercek–yetki–kapsam karışması; başarısız logout/yenileme; faz görünürlüğü + ortak anahtarlar |
| 2 | 03-gorevler-liste | F1 | soru 3–5; G2–G12 | imleçli kümenin tam toplam sanılması; sürüm/anahtar/atama kısmi başarısı; çizilmemiş formlar |
| 3 | 01-ana-sayfa | F1 | soru 7–8; Y4 | birleşik rolde "bana atananlar"; yaklaşık sayacı kesin sunma; sahte geçmiş/silinenler bağlantısı |
| 4 | 08-koordinatorlukler | F2 | #17–#18 | katalog–program bağı ayrımı; oluştur/bağla yarım kalması; kopyala–taşı farkı |
| 5 | 05-kullanicilar | F2 | #13–#16 | global Koordinatör rolü yanılgısı; parola/admin/kilit okunamaması; toplu Kaydet atomik sanılması |
| 6 | 03c-zaman-cizelgesi | F3 (pilot F0) | #11–#12 | 200 kesilmesi, görünmeyen bağlar; çift uzatma/geri alma; ADR-0024 dışı alt görev |
| 7 | 09-toplantilar | F4 | #21–#23; Y3 | departman görünürlüğü ↔ katılımcı listesi; anahtarsız oluşturma tekrarı; dönüşmüş görev kapsam yönlendirmesi |
| 8 | 06-arsiv | F5 | #19–#20; BE (06/yeni-3) **engelleyici** | admin S3 başlığı; dosya silme geri alınamaz; yükleme/etiket/taşıma ↔ kanıt |
| 9 | 01b + 01 tam | sonra | #27–#28 | okuma yetkisi/saklama; tarihsel kapsam uydurma; CSV maliyeti |
| 10 | 10-mesajlar | F7 | #24–#26 | paylaşım ↔ kaynak erişimi; okundu imleci/SSE; bildirim/iletme/birleşik yükleme yok |
| 11 | 11-tablolar | ayrı modül | #29–#32 | ACL/kapsam; hücre sürümü/bütçe; referans gizliliği/geri alma/gerçek zamanlı |

F0 öncesi ayrıca (Codex §7): yürütme istemleri yeni seti okutuyor (ortak-sozlesme 2a ✔); kabul edilmiş kaynak sürümü; WEB-0 O1 PR/CI/birleştirme kapısının gerçekleştiği; API ana sürüm kapısı dışında minör karşılaştırma yapılmaması.

## 6. Tuvale geri bildirim (tasarım ↔ sözleşme)

Tasarımın sözleşmeye uyması önerilen yerler (13 kalem, raporda §5): 4→5 görev durumu; "kilitli kart / n kişi kilitli görür"; "Koordinatörler" sistem grubu; 6 emoji → 4 tür; "tarih yalnız ileri alınabilir"; Türkçe harfli departman kodları; not sayacı 2000 → 5000; "Kişiler" davet modu; arşivde "PDF" kategorisi; "sezon aralığı" etiketi; alt görev çubukları/"ana görev dışına taşmaz"; kalın yazı; "görevin geçmişinde kaynak mesaj".
Tutarsızlıklar: tür adları/renkleri 01 ≠ 01b; sabit hex (rol renkleri, "Mesaj"); 08b 9 kişi / 6 kutu; 06/07 düğüm sayısı; dar menüde kapsam kartları (Kenar-Secici ↔ Sidebar); 05 rol toplamı > kullanıcı sayısı.
Çizilmemiş ama gereken: yeni görev formu, durum geçiş menüsü, toplu işlem, yeni koordinatörlük formu, toplantı düzenle/kişi seçici, yükleme penceresi, davet formu, Admin/Üye Gantt yüzleri, koordinatör/üye ana sayfası, 08b ve 05b sekme içerikleri.

## 7. Codex kararlarının uygulanma durumu

| Codex bulgusu | Karar | Nerede |
|---|---|---|
| CX-M-01 durum modeli | uygulandı | README durum değerleri (`denetlendi` / `karar bekliyor` / `kabul`); grup README tabloları `denetlendi` |
| CX-M-02 varsayım ≠ yetki | uygulandı | `ortak-kurallar.md` §2; README kuralı; 00/mekanizma "Karar" işaretleri |
| CX-M-03 designStub sınırı | uygulandı | `ortak-kurallar.md` §3; README; 03/08 eksikler stub → devre dışı |
| CX-M-04 yürütme istemi | uygulandı | `yurutme/web-0/ortak-sozlesme.md` adım 2a |
| CX-M-05 statik ≠ sahte veri | uygulandı | `ortak-kurallar.md` §4; 01/mekanizma, BE-010 |
| CX-M-06 K15 istisnası | **öneri olarak kaydedildi** (Y13) | yol haritası/yürütme ürün sahibi kabulü |
| CX-M-07 ortak sözleşme + karar tablosu | uygulandı | `ortak-kurallar.md`; `_sablon/README.md` + 11 grup README "Uygulama kararı tablosu" (boş, faz açılışında dolar) |
| CX-M-08 kimlik | uygulandı | E-00-40; README "altı şablon" |
| CX-M-09 denetim kaydı | uygulandı | 11 `dogrulama.md` "Kapanış" + sonradan düzeltilenler |
| CX-M-10 `../program/` yolu, PR kapısı | **koordinatör notu** | CLAUDE.md yolu bu oturumda değişmedi (ürün sahibi); set commit/PR bekliyor |
| CX-T-01 sorgu anahtarı | uygulandı | `ortak-kurallar.md` §6; 03/03c/06 backend.md |
| CX-T-02 readProgram | uygulandı | 00/01b/03c backend.md → `['programs']` |
| CX-T-03 departman adı çözümü | uygulandı | 03c backend.md |
| CX-T-04 mercek ≠ yetki | uygulandı | `ortak-kurallar.md` §1; 00/05 dosyaları |
| CX-T-05/06 fan-out sınırı | uygulandı | `ortak-kurallar.md` §9; 00/08 dosyaları |
| CX-T-07 faz görünürlük matrisi | uygulandı (varsayılan gizli, ürün onayı bekliyor) | `ortak-kurallar.md` §5 |
| CX-T-08/CX-S-05 sohbet emsali | uygulandı | 11 backend.md |
| CX-T-09/CX-S-04 confirmation kümesi | uygulandı | `ortak-kurallar.md` §7; 05/08/11 dosyaları |
| CX-T-10/CX-S-12 `details` dize | uygulandı | 11 eksikler.md "sözleşme değişikliği önerisi" |
| CX-T-11, CX-S-01/02/03/06/07/08/09/10/11/13 | uygulandı | ilgili backend.md/eksikler.md (bulgu kimliği parantezde) |
| §4 eksik kaydı kararları | uygulandı | `kayit.md` BE-036…106, `rapor-tespit-2026-11-08.md` |
| §5 yol haritası | önerilen metin §2'de; dosya değişmedi | ürün sahibi kabulü |
| §8 reddedilenler (BE-008, video, admin panosu F1, K3 genellemesi, teknik departman, cascade undo, 200 yaklaşık, sahte akış, kilitli kart emsali, kırıcı değil, minör karşılaştırma, bayat denetim) | **hepsi kabul edildi** ve işlendi | ilgili dosyalar |

**Reddedilen / ertelenen koordinatör önerileri:** "yönetici panosu F1'e çekilsin" (ürün sorusuna döndü); "Arşiv/Mesajlar devre dışı görünsün" (Codex varsayılanı gizli; ürün sorusu); BE-008 ve BE-023 ilk önerileri (Codex metniyle değiştirildi).

## 8. Sonraki oturum için giriş

1. Ürün sahibi §4'teki ilk beş soruyu cevaplar; koordinatör cevapları `ortak-kurallar.md` §1/§5'e ve ilgili grup README uygulama kararı tablolarına `kabul`/`ret` olarak işler → grup durumu `kabul`.
2. Yol haritası Y1, Y2, Y3, Y9, Y11, Y12 metinleri ürün sahibi onayıyla `yol-haritasi-web.md`'ye girer.
3. Bu klasör + `kayit.md` + `rapor-tespit-2026-11-08.md` + `EKRANLAR-codex.md` + `ortak-sozlesme.md` değişikliği tek PR olarak (`web0/o1-belgeler` dalı üstüne ya da ayrı dal) açılır; CI yeşil → birleştirme.
4. WEB-0 O2 açılış istemi `ortak-sozlesme.md` 2a ile yenilenir; uygulayıcılara 00-ortak grubu ve `ortak-kurallar.md` verilir.

**Durum (2026-11-08):** WEB-0 O2–O4 tamamlandı (O2 #19–#23, O3 #24–#25, O4 #26 karar belgesi); O5 kapanış açık (Codex kapısı, ekran görüntüsü doğrulaması) — `../yurutme/web-0/ilerleme.md`.

**F0 kapandı** (Codex KOŞULLU UYGUN, 3. koşum; PR `#31`) — `../reviews/WEB-0-codex.md`; sonraki WEB-1 (`../yurutme/web-1/`).

**F1: O2/O3 tamam (2026-11-09)**, entegrasyon (W48) + temizlik (W61) + Codex kapısı sürüyor — `../yurutme/web-1/ilerleme.md`; F2 kabul tabloları (05, 08) **geçici kabul** (ürün soruları #13–#18 bekliyor), yürütme seti `../yurutme/web-2/`.
