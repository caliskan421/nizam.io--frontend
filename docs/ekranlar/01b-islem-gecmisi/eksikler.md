# 01b — Backend eksikleri (ne yok)

Her satır bir tasarım öğesidir; backend'de karşılığı yoksa burada durur. Kimlik verme ve `../../backend-eksikleri/kayit.md`'ye taşıma **koordinatöre** aittir; burada mevcut BE-NNN'ye bağlanır ya da `yeni-N` geçici adı kullanılır.

Ekran v1 dışıdır (K14) ve backend'de audit **okuma yüzü yoktur** (GAP-002; audit README §4). Bu dosyanın işlevi web için "şimdilik" kararı değil, ekran kendi backend fazıyla açıldığında **backend gereksinimi** vermektir (§2 + §5). "Şimdilik" sütunu her satırda aynıdır: **ekran yok, menüde yok, Ana sayfa "Tümü" gizli/devre dışı (E-01-13).**

## 1. Mevcut kayıtla eşleşenler
| Kimlik (E-) | Öğe | BE-NNN | Kayıttaki tanım yeterli mi? | Düzeltme önerisi |
|---|---|---|---|---|
| E-01B-06..41 (ekranın tamamı) | İşlem geçmişi ekranı | BE-030 | **Hayır.** "Audit okuma, süzgeç, CSV, görünen-ad sözlüğü" tek L satırı; şunları kapsamıyor: (a) sunucu toplulaştırmaları (toplamlar, faset sayıları, 30 gün × tür histogramı, gün sayaçları), (b) zarfta **eksik kapsam** (work/organization/program/identity kayıtlarında `program_id`/`department_id` NULL — koordinatörlük sütunu ve program süzgeci bunsuz kurulamaz), (c) aktör adı ve hedef nesne çözümü (ad, gidilebilirlik, S3 başlıkları), (d) okuma yetkisi ve kapsam türü kararı, (e) IP/tarayıcı alanının bugünkü kuralla (AUDIT-K02) çelişmesi, (f) saklama/değişmezlik kararı (KR-09, GAP-067). | BE-030 **şemsiye** satır olarak kalsın; altına §2'deki yeni-1…yeni-8 alt kalemleri açılsın (koordinatör BE numarası verir). Bağ sütununa GAP-067 ve GAP-182 eklensin; Boyut L → toplam "L+ (altı uygulama paketi P1–P6, §5)". |
| (01 Ana sayfa) "Son işlemler" | Aynı kaynağın kısa görünümü | BE-010 | Kısmen. Tüketici ekranı kayda geçmiş, ama ana sayfa merceği koordinatör/üye de olabilir → yalnız yönetici okuma yetkisi BE-010'u yönetici dışında kapatmaz. | BE-010 → yeni-1'e bağımlı yazılsın; yönetici dışı mercek için yeni-8 (konu/aktör süzülmüş, rol kapsamlı okuma). |
| (03 Ayrıntı) görev etkinlik çizgisi | Konu = görev süzülmüş okuma | BE-007 | Kısmen. Görev çizgisini görevi gören herkes (atanmış üye dahil) görür; yönetici-yalnız okuma yetmez. | BE-007 → yeni-1 (`subject_kind`+`subject_id` süzgeci) + yeni-8 (görev görünürlüğüyle aynı yetki). |
| (05b) "Etkinlik" sekmesi | Aktör = kişi süzülmüş okuma | BE-015 | Kısmen; 05b görünürlüğü kendi açık sorusu. | BE-015 → yeni-1 (`actor[]` süzgeci). |
| (08b) "son etkinlik" | Departman süzülmüş okuma | BE-018 | Kısmen; departman süzgeci zarfta kapsam boşken çalışmaz. `reportDashboardCoordinatorships.last_activity_at` var ama audit'ten değil (kaynağı belgede yok). | BE-018 → yeni-3 (kapsam tamamlama) + yeni-1 (`department[]`). |

## 2. Yeni eksik önerileri
| Geçici ad | Kimlik (E-) | Öğe | Eksik (uç/alan/kural; mümkünse operationId + alan) | Şimdilik (statik / devre dışı / istemcide hesap) | Bağ (GAP/KR/ADR ya da `yeni`) | Boyut | Gerekçe |
|---|---|---|---|---|---|---|---|
| yeni-1 | E-01B-16, 17, 19, 22, 27..33, 35, 36, 41 | Tablo: satırlar, sayfalama, süzgeçler | **Uç:** `listAuditEntries` (öneri) `GET /v1/audit/entries`. İmleçli (`limit` 50/200, `cursor`, `next_cursor`), sıra `(occurred_at, id)` azalan, sabit. **Süzgeçler** (süzgeç içi VEYA, arası VE): `from`, `to` (RFC 3339; gün sınırı kurulum saat diliminde), `category[]`, `action[]` (eylem kodu), `actor[]` (hesap kimliği; `actor=system` aktörsüz), `department[]` + `department=none` ("Koordinatörlüğe bağlı değil"), `program_id` (kapsam kararına göre), `subject_kind` + `subject_id` (BE-007 için), `q` (eylem görünen adı + hedef adı + aktör adı; Türkçe katlama GAP-036). **Yanıt şeması** aşağıda (Önerilen şema). Yeni hata kodları: 403 `audit.not_authorized`, 422 `audit.input_invalid`, 422 `audit.invalid_cursor`. | Ekran yok (K14) | GAP-002, KR-09 | L | Ekranın ana verisi; BE-007/010/015/018'in ortak tabanı. |
| yeni-2 | E-01B-23, 24, 29, 30, 38 | Tür rozeti, işlem metni, tür/işlem süzgeç seçenekleri | **Uç:** `listAuditActionTypes` (öneri) `GET /v1/audit/action-types` → `[{code, module, category, label, label_group?, hidden_by_default}]`. `audit_action_types` tablosu var (S-B, kod + modül) ama görünen ad, kategori ve gizli bayrağı yok; GAP-002 sözlüğün okuma yüzüyle **birlikte** tanımlanmasını şart koşuyor. Kategori kümesi ürün kararı (§4-3). `hidden_by_default`: `identity.session.rotated` (her belirteç yenilemesi), `identity.download_ticket.redeemed`, `provisioning.license.lease_renewed`, `security.*` ikiz satırları (identity olay tüketicisi aynı olayı ikinci kez yazar). | Ekran yok | GAP-002, GAP-045, GAP-094 | S–M | Ana sayfa ile bu ekranın tür adı/renk çelişkisi (ozellikler §7-5) tek sözlükle çözülür; sözlük sunucuda olursa web ve mobil aynı metni gösterir. |
| yeni-3 | E-01B-17, 26, 33 | Koordinatörlük sütunu ve süzgeci; program kapsamı | **Zarf kapsamının tamamlanması:** work (görev, not, alt görev, tarih talebi… — konu iş kalemi) kayıtları `program_id` + `department_id` yazsın; organization üyelik/koordinatör eylemleri `department_id` (+ ADR-0023 ile program) yazsın; program bağ eylemleri `program_id` + `department_id`. AUDIT-K06 eski satırı doldurmaz → okuma yüzü kapsamı boş eski satırlarda konudan **okuma anında** çözsün (görevin bugünkü departmanı) ve bunu `department_resolved_from: "entry" | "subject"` gibi bir işaretle bildirsin — ya da kurulum öncesi satır olmadığı için (KR-05) yalnız yazım düzeltmesi yeter. | Ekran yok | AUDIT-K06, GAP-094 | M | Bugün yalnız records departman taşır; görev olaylarının koordinatörlüğü zarftan okunamaz. Tasarım "nottan oluşan görev → görevin koordinatörlüğü" gösteriyor. |
| yeni-4 | E-01B-07, 09, 10, 12, 13, 14, 15, 16, 17, 19, 22, 27, 35, 40 | Toplamlar, şerit, faset sayıları, gün sayaçları | **Uç:** `summarizeAuditEntries` (öneri) `GET /v1/audit/summary`, yeni-1 ile aynı süzgeç parametreleri. Yanıt: `total_all` (süzgeçsiz; E-01B-07), `total_matched` (E-01B-35 sağ), `facets: {category:[{key,count}], action:[…], actor:[{account_id, full_name, count}], department:[{department_id|null, name, count}], range:[{key:"today"|"last_7_days"|"last_30_days"|"all", count}]}` (E-01B-40, seçeneklerin "yalnız kaydı olanlar" listesi de buradan), `activity_30d: [{date, total, by_category:{…}}]` × 30 (kurulum saat dilimi, bugün dahil; E-01B-09..14), `days: [{date, count}]` (yüklenen günlerin grup sayacı; E-01B-27). Faset sayısı kendi süzgeci hariç diğer süzgeçlerle mi hesaplanır — kural yazılmalı (öneri: hariç, standart faset). Şeridin tür/kişi süzgecine uyup uymadığı ürün kararı (ozellikler §7-3). | Ekran yok | yeni | M | Bu sayılar yüklenen satırlardan doğru hesaplanamaz (imleçli liste). `occurred_at` indeksi yok (GAP-182) → histogram için indeks gerekir. |
| yeni-5 | E-01B-08 | CSV indir | **Uç:** `exportAuditEntriesCsv` (öneri) `GET /v1/audit/entries.csv`, yeni-1 süzgeçleriyle; `text/csv; charset=utf-8`, `Content-Disposition` (README §6 kalıbı). **İndirme bileti hedef listesine** eklenmeli (ADR-0013; bugün dokuz desen, liste dışı hedef 422 `identity.download_target_invalid`). Satır tavanı + kesilme bildirimi (başlık ya da son satır), dışa aktarım kotası (REPORTING-K10 emsali: kullanıcı başına tek üretim, sunucu slotu), CSV enjeksiyonu koruması (`= + - @` önekli hücreler), sütun kümesi ve ayırıcı (`;` Türkçe Excel uyumu?) ürün kararı. Dışa aktarımın kendisi audit yazmalı (`reporting.report_downloaded` emsali, öneri `audit.export_downloaded`). Eşzamansız dışa aktarım KR-10 ile ertelenmiş → eşzamanlı + tavan. | Ekran yok | KR-10, ADR-0013, yeni | M | Kişisel veri (S-D: aktör) toplu çıktısı; indirme izi gerekir. |
| yeni-6 | E-01B-31 | İşlem ayrıntısı (ikinci satır) | **Kural çelişkisi:** `details` ≤ 300 rune, yalnız kararlı değer (dosya adı, sayılar, kimlikler); serbest metin ve kişisel veri **yasak** (AUDIT-K02, D-0114/12). Tasarımın gösterdiği not metni ve gündem maddesi başlığı zarfta yok ve olmamalı. Öneri: ayrıntı okuma anında konudan çözülsün (`target.name` = görevin/toplantının/gündem maddesinin **bugünkü** başlığı; silinmişse `null`) — tarihsel değer değil, güncel değer olduğu belgelenmeli. Ham `details` (`key=value` biçimi, ör. `copied_members=N`, `kind=task`) istemciye ya yapılandırılmış nesne olarak ya hiç gönderilmemeli. | Ekran yok | AUDIT-K02, GAP-094 | M | Not metnini audit'e yazmak S-C iş verisini değişmez kayda kopyalar; saklama/silme kurallarını bozar. |
| yeni-7 | E-01B-31 (Hesap satırı) | Oturum ayrıntısı "tarayıcı · işletim sistemi · IP" | **Bugün yasak:** istemci kategorisi kapalı küme `web` / `mobile` / `ops`; "ayrıntılı istemci bilgisi taşınmaz" (AUDIT-K02, `domain/audit.go`); `identity.ip.blocked` olayı bile ham IP değil `ip_summary` taşır (events.md). Eklenmesi = yeni kişisel veri (S-D) toplama: AUDIT-K02 değişikliği, `data-classification.md` güncellemesi, KVKK aydınlatma, saklama süresi (K-15) kararı. | Ekran yok; kararsız kalırsa satırda yalnız istemci kategorisi ("Web" / "Mobil") | KR-09, K-15, AUDIT-K02 | M (karar sonrası S) | Ürün sahibi + hukuk kararı; analist önerisi: ilk sürümde yalnız kategori. |
| yeni-8 | (BE-007, BE-010, BE-015) | Yönetici dışı merceklerde audit okuma | `listAuditEntries`'in rol kapsamlı biçimi: konu = görev ise görevi görebilen (istemci-akislari §2 görünürlüğü), koordinatör kendi departmanlarının kayıtları, üye yalnız kendi eylemleri — ürün kararı. Bu ekran (01b) için gerekmez; ilgili ekranların eksiği. | — | KR-09 | M | Okuma yetkisi tek "yönetici" kuralıyla kurulursa BE-007/010/015 yönetici dışında kapanmaz. |

### Önerilen yanıt şeması (yeni-1, taslak — sözleşme değildir)

Mevcut sözleşmenin adlandırma alışkanlığına hizalandı: kimlikler `*_id` düz `string` (sözleşmede `format: uuid` yok), adlar `full_name` / `display_name`, zaman `format: date-time` UTC, liste sarmalayıcı + `next_cursor`, ad çözülemezse `null` (WORK-K83).

```yaml
AuditEntryList:
  type: object
  required: [entries]
  properties:
    entries: { type: array, items: { $ref: '#/components/schemas/AuditEntry' } }
    next_cursor: { type: string }            # yalnız devam varsa
AuditEntry:
  type: object
  required: [entry_id, occurred_at, action, category, outcome, client_category, actor, target]
  properties:
    entry_id:       { type: string }          # audit_entries.id (zaman sıralı)
    occurred_at:    { type: string, format: date-time }
    action:         { type: string }          # kararlı kod, ör. collaboration.note.added
    action_label:   { type: string }          # yeni-2 sözlüğünden; istemci sözlüğü ayrıca çekmezse
    category:       { type: string, enum: [task, file, meeting, message, account, system] }  # küme ürün kararı (§4-3)
    outcome:        { type: string, enum: [succeeded, failed] }
    client_category:{ type: string, enum: [web, mobile, ops] }
    actor:
      type: object
      required: [account_id, full_name]
      properties:
        account_id: { type: string, nullable: true }   # null = sistem/kurulum (aktörsüz)
        full_name:  { type: string, nullable: true }   # WORK-K83 kuralı; silinmiş hesabın adı döner (GAP-049)
    program:
      type: object
      nullable: true
      properties: { program_id: {type: string}, name: {type: string} }
    department:
      type: object
      nullable: true                                  # null = "Koordinatörlüğe bağlı değil" / "—"
      properties: { department_id: {type: string}, display_name: {type: string, nullable: true} }
    target:
      type: object
      required: [kind, id, name, navigable]
      properties:
        kind:          { type: string }               # subject_kind (work_item, meeting, file, chat, account, department, program …; kesin küme koddan)
        id:            { type: string }               # subject_id
        name:          { type: string, nullable: true }   # okuma anındaki güncel ad; silinmiş/kalıcı silinmişte null
        navigable:     { type: boolean }              # hedef canlı ve çağıran görebiliyor
        program_id:    { type: string, nullable: true }   # S2/S3 başlığı için
        department_id: { type: string, nullable: true }   # S3 (görev, dosya) için
        work_item_id:  { type: string, nullable: true }   # dosya → arşiv klasörü (07) için
        chat_id:       { type: string, nullable: true }   # mesaj → sohbet için
    detail:
      type: object
      nullable: true
      description: Yapılandırılmış, kararlı alanlar (sayılar, dosya adı); serbest metin yok (AUDIT-K02).
      additionalProperties: { type: string }
```

Uyum notları: `actor.account_id` = 05b `hesapId` (yeterli; ek kimlik gerekmez). `department` için `display_name` programdaki adla (`ProgramDepartmentLink.display_name`) mı katalog adıyla (`Department.name`) mı — kapsam türüne bağlı (§4-2). `target.kind` küme değerleri sözleşmede bugün tanımlı değil; `data-model.md` §4.9 yalnız "subject_kind" der.

## 3. Kısmi karşılıklar
- **Aktör adı:** `listUsers` (S1) ad verir ama kimlikle toplu okuma yok; satır başına çözüm fan-out olur. → ad audit yanıtında (yeni-1 `actor.full_name`).
- **Departman adı:** `listProgramDepartments` (S2) / `listDepartments` (S1) ad sözlüğü verir, 200 tavanlı, silinmişleri içermez. Seçenek listesi ve sayıları için yetmez (yeni-4).
- **Hedef bağlantısı:** `getWorkItem` (S3), `getMeeting` (S2), `archiveFolders`/`downloadFile` (S3), `getChat` (S2) var; ama görev kayıtları zarfta program/departman taşımadığından istemci başlıkları kuramaz (yeni-1 `target.*_id`, yeni-3).
- **Aylık etkinlik emsali:** `reportSeason.monthly_activity` (`MonthlyActivity`) ve `CoordinatorshipStat.last_activity_at` "etkinlik" sayıları verir ama audit'ten değil, sahip modüllerin `created_at` sayımlarından (D-0161 r1). 30 gün × tür şeridi için kullanılamaz (aylık, tür kümesi farklı, program kapsamlı).
- **Saat dilimi:** `instanceProfile.timezone` var → gün sınırları istemcide doğru kurulabilir; sunucu toplulaştırması da aynı değeri kullanmalı.
- **"Daha fazla göster":** sözleşme genelinde imleç kalıbı var (sayfa numarası yok) — tasarımla uyumlu; ama "N / M kayıt gösteriliyor"daki M imleçli listede yok → yeni-4 `total_matched`.

## 4. Yol haritası kararıyla çelişenler
1. **K14:** ekran v1 dışı, menüde yok; Ana sayfa "Tümü" (E-01-13) v1'de gizli/devre dışı. Değişiklik önerilmiyor.
2. **Kapsam türü (K2 / kapsam başlıkları):** tasarım kırıntısı program adı gösteriyor (S2 ima), ama identity/organization/program/work kayıtlarının `program_id`'si NULL; Hesap olayları programdan bağımsız. **Analist önerisi:** uç **S1 (kuruluş kapsamı)**, yalnız yönetici, isteğe bağlı `program_id` süzgeci (kapsamsız satırları dahil etme bayrağıyla). S2 seçilirse görev ve hesap olayları yeni-3 olmadan görünmez. → ürün sahibine soru.
3. **Kategori kümesi:** tasarım 5 tür (Görev, Dosya, Toplantı, Mesaj, Hesap), Ana sayfa 5 farklı ad (Arşiv, Giriş); backend eylemleri en az 10 önekte (`work`, `records`, `collaboration`, `messaging`, `identity`, `security`, `organization`, `program`, `reporting`, `assistant`, `provisioning`). organization (departman, koordinatör, rol), program (dönem, bağ, aktarım), reporting (PDF indirme), assistant (soru) ve provisioning için tasarımda tür yok. Öneri: Hesap = identity + organization rol/üyelik; yeni "Sistem/Yönetim" türü (renk token'ı gerekir, K9). → ürün sahibine soru.
4. **REPORTING-K01 emsali:** yönetici panosu ve raporlar yalnız şirket yöneticisi (403 `reporting.not_authorized`); yol haritası §6 bunu bağımlılık sayar. Audit okuması için aynı kural tutarlı, ama KR-09/K-15 "kim okur" kararını hukuk teyidine bağlamış → varsayım olarak yazılmaz, karar beklenir.
5. **Değişmezlik notu (E-01B-37, E-01B-07):** "değiştirilemez ve silinemez" metni bugünkü backend'le **doğru değil**: DB düzeyinde zorlanmaz (GAP-067) ve saklama süresi verilirse kayıtlar süpürülür (AUDIT-K07). Metin K-15/GAP-067 kararına göre değişmeli (ör. "uygulama üzerinden değiştirilemez; saklama süresi sonunda silinir").
6. **K9:** "Mesaj" rengi sabit hex (`#5b8def`); "Sistem" türü eklenirse ikinci token. Backend dışı, kayıt için not.

## 5. Önerilen backend iş paketleri
Sıra ve bağımlılık (`rapor-<faz>.md` için ham madde). Tümü **KR-09 / K-15 kararından sonra** açılabilir; karar gelmeden yalnız P0 yürür.

| Sıra | Paket | Kapsam (yeni-N) | Tek cümle | Boyut | Bağımlılık |
|---|---|---|---|---|---|
| P0 | Karar paketi | yeni-7 kararı, §4-2, §4-3, §4-5 | Okuma yetkisi, kapsam türü (S1/S2), kategori kümesi, saklama süresi, IP/tarayıcı toplanıp toplanmayacağı ve değişmezlik metni ürün sahibi + hukukla karara bağlanır. **IP/tarayıcı toplama varsayılan HAYIR** (Codex BE-030 P0). | — (karar) | KR-09, K-15, GAP-067 |
| P1 | Zarf kapsamı ve indeks | yeni-3 (+ `occurred_at` indeksi) | work/organization/program yazımları program+departman kapsamını taşır; `(occurred_at desc, id)` ve süzgeç indeksleri eklenir (GAP-182 kabulü okuma yükü için yeniden değerlendirilir). **Yalnız yeni olaylar kapsamlanır; eski olaylara bugünkü departman tarihsel gerçekmiş gibi doldurulmaz, bilinmeyen kapsam açık (null) kalır** (Codex BE-030 P1). | M | P0 (kapsam türü) |
| P2 | Okuma çekirdeği + sözlük | yeni-1, yeni-2, yeni-6 | `listAuditEntries` (imleç, süzgeçler, aktör adı, hedef çözümü, kapsam/yetki) ve `listAuditActionTypes` (görünen ad, kategori, gizli bayrağı) aynı etikette gelir; okuma yeri ad/hedef çözümü için iş modüllerini okuyabilen katman (ör. reporting, audit'e Sr kenarı var). **Hedefin bugünkü adı tarihsel ad gibi sunulmaz (okuma anındaki ad olduğu belirtilir); hedefe gitme hedefin kendi yetkisine tabidir** (Codex BE-030 P2). | L | P1 |
| P3 | Toplulaştırma | yeni-4 | `summarizeAuditEntries`: süzgeçsiz/süzgeçli toplam, faset sayıları, 30 gün × kategori histogramı ve gün sayaçları kurulum saat diliminde. | M | P2 (süzgeç sözleşmesi ortak) |
| P4 | CSV dışa aktarım | yeni-5 | Süzgeçli CSV ucu, indirme bileti hedef listesine eklenir, kota + satır tavanı + enjeksiyon koruması + dışa aktarım audit'i. | M | P2 |
| P5 | Rol kapsamlı okuma | yeni-8 | Görev/aktör/departman süzülmüş okumanın yönetici dışı merceklere açılması (BE-007, BE-010, BE-015). **Ayrı yetki genişlemesi:** BE-007/010/015 ve ilgili BE-018 tüketicileri bu pakete bağlanır; admin ekranının (01b) açılması onları otomatik kapatmaz (Codex BE-030 P5). | M–L | P2, P0 (yetki kararı) |
| P6 | Oturum ayrıntısı (koşullu) | yeni-7 | Yalnız P0 "toplansın" derse: zarfa IP/kullanıcı aracısı özeti, sınıflandırma ve saklama. **Koşullu; varsayılan açılmaz** — yeni kişisel veri toplama kararı verilmeden IP/kullanıcı aracısı eklenmez (Codex BE-030 P6). | S–M | P0 |

**BE-030 şemsiye kalır, tek L teslim işi olmaz** (Codex BE-030 hükmü): P0 karar, P1–P4 ayrı BE teslimleri, P5 ayrı yetki genişlemesi, P6 koşullu.

GAP-094 (zarfa `reason` alanı, sayıların ayrıntıya yazılmaması, red/başarı eylem adı ayrışması, salt okunur mod audit'i) P1 ile birlikte kapatılırsa okuma yüzü daha tutarlı açılır; bu ekran için zorunlu değildir.
