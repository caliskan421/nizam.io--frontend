# 11 — Backend eksikleri (ne yok)

Her satır bir tasarım öğesidir; backend'de karşılığı yoksa burada durur. Kimlik verme ve `../../backend-eksikleri/kayit.md`'ye taşıma **koordinatöre** aittir; burada mevcut BE-NNN'ye bağlanır ya da `yeni-N` geçici adı kullanılır.

Okuma notu: modülün tamamı `BE-031`'dir (XL, v1 dışı, K14). Bu dosya BE-031'i **alt iş paketlerine** böler (`yeni-1` … `yeni-15`) ve her paketin sözleşme taslağını mevcut kalıplarla (`backend.md` §6) yazar. Aşağıdaki bütün operationId, yol, alan ve `tables.*` hata kodları **önerilendir** (spec'te yoktur); ad/tür kararı backend fazınındır. Gerçek operationId'ler yalnız "mevcut" diye anıldığında geçer. Kaynak: tasarım (`ozellikler.md`, `mekanizma.md` §8.2), ihtiyaç tanımı (`../../../../nizam.io--program/program/isler/girdi-excel-modulu.md`, "girdi §N").

## 1. Mevcut kayıtla eşleşenler
| Kimlik (E-) | Öğe | BE-NNN | Kayıttaki tanım yeterli mi? | Düzeltme önerisi |
|---|---|---|---|---|
| E-11-01 … E-11-72 | Modülün tamamı | BE-031 | Hayır — tek satır "Yeni modül, XL" devredilemez büyüklükte; kapsam kararı ve gerçek zamanlı çelişkisi satırda yok | BE-031 şemsiye satır olarak kalsın, `Eksik` sütununa "alt paketler: `yeni-1…15` (11-tablolar/eksikler.md §5)" eklensin; koordinatör alt paketlere kimlik verince BE-031 bunlara bağ tutar |
| E-11-41, E-11-69 (Görev) | Görev seçicisinde arama | BE-004 | Kısmen — BE-004 "03 Görevler › Liste arama kutusu" olarak yazılı; aynı eksik (`listProgramWorkItems`'ta `q` yok, GAP-212) tablo seçicisini ve sohbet `#görev` önerisini de etkiliyor | BE-004 `Ekran` sütununa "11 Tablolar görev seçici" ve `Bağ` sütununa GAP-212 eklensin; tek uç değişikliği (`q` parametresi) üç tüketiciyi kapatır |
| E-11-12, E-11-41 | Görev kısa kodu ("ALT-7") — kart önizlemesi ve görev hücresi | BE-005 | Evet (aynı alan) | BE-005 `Ekran` sütununa "11 Tablolar" eklensin; `getChatRefSummary` "kod alanı yok" notu da aynı eksik |
| E-11-39, E-11-71 | Kişi seçici / paylaşım kişi araması; "Rol · Koordinatörlük" alt metni | BE-011 | Kısmen — BE-011 program kapsamlı kullanıcı **listesi**ni yönetici ekranı için ister; tablo, **her rolün** çağırabileceği aramalı bir kişi dizini ister (gizlilik kuralı farklı) | Ayrı paket `yeni-5` (aşağıda); BE-011 ile aynı organization sorgusunu paylaşabilir, `Bağ`'a çapraz atıf |
| E-11-60, E-11-61 | Değişiklik geçmişi | BE-030 / GAP-002, KR-09 | Hayır — BE-030 platform audit okumasıdır; tablo geçmişi modülün **kendi** değişiklik kaydıdır (eski/yeni değer, geri al) ve audit'e bağlanmamalı (audit saklama/yetki kararı GAP-002'de açık) | Bağ kurulmasın; `yeni-11` ayrı paket. Not olarak "audit değil" yazılsın |

## 2. Yeni eksik önerileri
Bu bölüm sözleşme ÖNERİSİDİR; backend onayı olmadan uygulanmaz (CX-M-07).

| Geçici ad | Kimlik (E-) | Öğe | Eksik (uç/alan/kural; mümkünse operationId + alan) | Şimdilik (statik / devre dışı / istemcide hesap) | Bağ (GAP/KR/ADR ya da `yeni`) | Boyut | Gerekçe |
|---|---|---|---|---|---|---|---|
| yeni-1 | E-11-01, E-11-05 (tümü) | Kapsam + modül iskeleti | Kapsam kararı (§2.1), modül adı (`tables`), hata öneki `tables.*`, hesap bütçesi kovası (§2.5), tavanlar (satır/sütun/hücre metni), ADR | v1 dışı, menüde yok | yeni, ADR-0002, ADR-0023, ADR-0028 | S (karar + ADR) | ÜRÜN/ADR önce; "bağımsız çekirdek" kendiliğinden ayrı servis demek değildir. Diğer her paketin kapsam sınıfı ve yetki kuralı buna bağlı |
| yeni-2 | E-11-02…18, 19, 20, 21 (okuma), 27, 72 | Tablo + liste + oluşturma | `listTables`, `getTable`, `createTable`, `updateTable`, `deleteTable` (§2.2) | v1 dışı | yeni | L | Liste kartı önizleme/kişi/sayaçları gömülü olmalı (K3 fan-out yasağı) |
| yeni-3 | E-11-21, 22, 71 | Erişim listesi (sahip/düzenler/görür) | `listTableMembers`, `putTableMember`, `removeTableMember` (§2.3) | v1 dışı | yeni | M | Görünürlüğün tek kaynağı; §9 gizleme |
| yeni-4 | E-11-33, 34, 35, 67, 68 | Sütun yapısı (7 tip, ad, sıra, genişlik, sil) | `createTableColumn`, `updateTableColumn`, `moveTableColumn`, `deleteTableColumn` (§2.4) | v1 dışı | yeni, ADR-0027 | M | Yapı sürümü ayrı grup |
| yeni-5 | E-11-39, 69, 71 | Kişi aday arama (her rol) | `listTablePeopleCandidates` (tablo modülünde, organization portu üzerinden) ya da genel `searchProgramPeople` (organization) — `q`, imleç, rol + departman alt metni; erişim listesindekiler hariç seçeneği | Kişi hücresi ve paylaşım devre dışı | yeni; BE-011; istemci-akislari §8 "ekip dizini yok" | M | Mevcut uçlar yetmez (backend.md §1: `listChatCandidates` sohbet kuralı, `listUsers` yalnız yönetici) |
| yeni-6 | E-11-36, 37, 38, 42, 46, 47 | Satır + hücre (metin, tarih, yapılacak) | `listTableRows`, `createTableRows`, `deleteTableRow`, `writeTableCells` (§2.5) | v1 dışı | yeni, ADR-0027, ADR-0028 | L | Çekirdek veri yolu; çakışma ve otomatik kayıt |
| yeni-7 | E-11-39, 40, 41 | NIZAM referans tipleri (kişi, koordinatörlük, görev) | Yazımda görünürlük doğrulaması; okumada görünürlükle çözüm, `available:false` (§2.6) | Hücreler kimlik yerine "—" | yeni; BE-004/GAP-212 (görev araması); BE-005 (kod) | M | Mevcut erişim kuralları korunmalı (girdi §5) |
| yeni-8 | E-11-23…26, 43, 44, 45, 70 | Tablo bağlantısı + geri bağ | Bağ değeri, hedef satır arama, bağlanabilir tablolar, bağ özeti, gizleme (§2.7) | v1 dışı | yeni; istemci-akislari §9, §10.8 | L | Tablolar arası ilişki + varlık gizleme |
| yeni-9 | E-11-67 (tip değiştir) | Tip dönüşümü önizleme + onay | `previewTableColumnTypeChange`, `changeTableColumnType` (`?confirm=true`, 409 `tables.confirmation_required`) (§2.4) | Tip seçimi yalnız boş sütunda (Varsayım) | yeni; K5; `previewTransfer` emsali | M | Girdi §3 "sessizce kaybettirmemeli"; tasarımda uyarı yok (§4) |
| yeni-10 | E-11-28, 29, 30, 31, 48 | Sunucu tarafı arama/süzme/sıralama + sayaçlar + alt özet | `listTableRows` parametreleri `q`, `todo_column_id`, `todo`, `sort`; `getTableSummary` (§2.5) | Yüklenen satırlarda istemcide (yaklaşık) | yeni; BE-003 emsali | M | İmleçli satırlarda tam sayı ve özet istemcide hesaplanamaz |
| yeni-11 | E-11-53, 60, 61, 62, 66 | Değişiklik kaydı + geri al | `listTableChanges`, `revertTableChange` (§2.8) | v1 dışı | yeni (audit değil; GAP-002 ayrı) | L | Girdi §4 "izleme + geri alma" |
| yeni-12 | E-11-57, 59, 65 | Hücre yorumları + `@` anma bildirimi | `listTableCommentMarkers`, `listTableCellComments`, `addTableCellComment`, `updateTableCommentThread`; olay `tables.comment.mentioned` (§2.9) | v1 dışı | yeni; events.md, ADR-0009; §10.8 bahsetme biçimi | M | Bildirim modülüne yeni tür |
| yeni-13 | E-11-58 | Sütun kilidi | `lockTableColumn` / `unlockTableColumn` + `Column.lock` (§2.4) | v1 dışı | yeni; yetki tanımı ürün kararı | S–M | Yetki modeli çelişkili (ozellikler §7.2) |
| yeni-14 | E-11-49, 52, 55, 56 | Gerçek zamanlı + varlık | `streamTableEvents` + uzlaştırma (`listTableChanges?after_seq`) + varlık (§2.10) | Sorgu tazelemesi; varlık statik/yok | **K8 ile çelişir**; README §6b, ADR-0028 | L | Ürün kararı olmadan başlanmaz |
| yeni-15 | E-11-09 | Şablon kataloğu | `listTableTemplates` (sabit katalog); "tablodan şablon" sonra (§2.2) | Şablon kartları istemcide sabit | yeni | 0–S (ilk aşamada backend zorunlu değil; sabit şablonlar istemcide) | Girdi §6 şablon |
| — | (tasarımda yok) | Kaydediliyor / kaydedildi / kayıt hatası göstergesi | Sunucu eksiği değil: `writeTableCells` yanıtı + "sonuç bilinmiyor" kuralı yeter | Tasarım eklenmeli (§4) | girdi §4, K5 | — | İstemci + tasarım işi |

Not: `yeni-15` sıra numarası tabloda en sonda; ilk aşamada backend zorunlu değildir (sabit şablonlar istemcide), §5'te `yeni-2a`'nın yanında yalnız isteğe bağlı satır olarak tutulur.

### 2.1 Kapsam: iki seçeneğin sözleşme sonuçları (`yeni-1`)

Tasarım program kapsamı ima eder (kırıntıda program adı E-11-01; 11e "programdaki herkes görür"; Görev/Koordinatörlük hücreleri bir programın kayıtlarıdır). İhtiyaç tanımı "NIZAM.IO'dan bağımsız kullanılabilecek çekirdek" ister (girdi §1) ama bağımsızlığın **ürün** bağımsızlığı olduğunu, servis ayrımının teknik karar olduğunu da söyler.

| Konu | A — Program kapsamlı (S2) | B — Bağımsız çekirdek (S1) |
|---|---|---|
| Kapsam sınıfı | Bütün `/v1/tables*` S2: `X-Nizamio-Program` zorunlu; tablo `program_id` taşır; tek tablo isteği **tablonun kendi programıyla** gider (görevlerin `program_id`/`department_id` kuralının eşi, istemci-akislari §2); uyuşmazlık 404 `tables.table_not_found` | `/v1/tables*` S1 (başlık yok sayılır); tablo şirket içinde hesaba aittir. Referans aday uçları ayrıca S2 olur (başlık = sütunun bağlı programı) |
| Görünürlük | Erişim listesi ∩ (seçili programda ekip satırı ∨ `company_admin`). Ekipten çıkan kişi tabloyu kaybeder (K6: 403 `organization.membership_required`; programda satırı yoksa 404 `tables.program_scope_invalid`, `work.program_scope_invalid` emsali — programın varlığı sızmaz) | Yalnız erişim listesi. Programdan çıkmak tabloya erişimi düşürmez; yalnız o programın referans hücreleri `available:false` olur |
| Kişi referansı / paylaşım havuzu | Programın ekibi + şirket yöneticileri (yapısal olarak `listProgramDepartments` genişliğine benzer) | Şirketteki bütün canlı hesaplar → **yeni şirket geneli kişi dizini** (bugün yalnız yöneticiye açık `listUsers`); gizlilik kararı (istemci-akislari §8 "ayrı ekip dizini yok") |
| Koordinatörlük / Görev referansı | Seçili program: `listProgramDepartments` (yeterli), `listProgramWorkItems` (kısmi) — backend.md §1 | Her referans sütunu bir `program_id`'ye bağlanmalı (sütun düzeyi bağ); aday uçları o programın başlığıyla; okuyucunun o programdaki yetkisiyle çözüm. Farklı programlara bağlı sütunlar tek tabloda olabilir — çözüm maliyeti ve kural karmaşıklığı artar |
| Tablo bağlantısı | Yalnız aynı programın tabloları (öneri; programlar arası bağ ayrı karar) | Şirket içinde herhangi iki tablo |
| Dönem/yıl (girdi §6) | Doğal: `Program.year`; "yeni yıl aynı yapı" = yapıyı başka programa kopyala (öneri `copyTable` `target_program_id`); önceki yılın kayıtları kendi programında kalır | Kendi "dönem/çalışma alanı" alanı gerekir; program ile ilişkisi ayrıca tanımlanır |
| Program yaşam döngüsü | `resetProgram`, `deleteProgram` (mevcut) ve programlar arası aktarım tabloların akıbetini tanımlamalı (sil / arşivle / koru) — program README'ye kural | Etkilenmez; yalnız referanslar `available:false` |
| İstemci (K2) | Liste kapsam değişince o programın tablolarına döner, eski sorgular iptal; kırıntı tasarımla aynı | Kapsam değişimi listeyi etkilemez; kırıntıdan program adı düşer (tasarımdan sapma) |
| Modül sınırı (ADR-0002) | Program "diğer modüllerin kayıtlarında açık kapsam" kalıbına uyar | Yeni bir kapsam kavramı (çalışma alanı) — ADR gerekir |

**Öneri (analist):** ilk modül fazı **A** ile; veri modelinde kapsam anahtarı tek alan (`program_id`) olarak tutulur, yetki ve referans çözümü bir "kapsam portu" arkasına konur — böylece B ileride kırıcı değişiklik olmadan (yeni S1 uç ailesi olarak) eklenebilir. Karar ürün sahibinindir (§4 soru 1).

### 2.2 Tablolar ve şablonlar (`yeni-2`, `yeni-15`)
Kapsam sınıfı aşağıda A seçeneğine göre (S2) yazıldı; B'de S1 okunur.

| Önerilen operationId | Yöntem + yol | Gövde / parametre | Yanıt (alan taslağı) | Kural |
|---|---|---|---|---|
| `listTables` | `GET /v1/tables` | `filter` (`all|owned|shared`), `q` (ad, Türkçe katlama — GAP-213 dersi), `limit`, `cursor` | `{items: TableCard[], next_cursor?, counts: {all, owned, shared}}`; sıra `updated_at` azalan, eşitlikte `table_id` | İmleçli 50/200. `counts` sözleşmede **yeni kalıp** (imleçli liste uçlarında bugün toplam/sayaç yoktur — BE-003; yalnız not, alt görev ve tarih talebi listeleri küçük `total` taşır, kalıp değil); alternatif ayrı `countTables` |
| — | `TableCard` | — | `table_id`, `program_id`, `name`, `owner_account_id`, `owner_full_name` (nullable, §8), `my_role` (`sahip|duzenler|gorur`), `row_count`, `column_count`, `updated_at` (RFC 3339 UTC), `updated_by_account_id`, `updated_by_full_name` (nullable), `members_preview[]` (`account_id`, `full_name` nullable; en çok 4) + `members_count`, `preview` (`columns[≤3]` ad, `rows[≤3][≤3]` **görüntü metni**; referans hücreleri okuyucunun yetkisiyle çözülmüş; bağ hücresi `link_count` ya da `available:false`) | Önizleme kuralı (hangi 3 sütun/satır) sunucuda sabitlenir: sütun sırasıyla ilk 3, satır sırasıyla ilk 3 (öneri) |
| `getTable` | `GET /v1/tables/{tableId}` | — | `Table` = `TableCard` + `columns: Column[]`, `structure_revision`, `name_revision`, `created_at`, `created_by_account_id`, `created_by_full_name` (nullable), `capabilities` (§2.3), `links` (§2.7) | Erişimsiz/silinmiş/başka program → 404 `tables.table_not_found` (§9) |
| `createTable` | `POST /v1/tables` | Başlık `Idempotency-Key` (zorunlu). Gövde `{name, template_id?, columns?: [{name, type, link_target_table_id?}], members?: [{account_id, role}]}` | 201 `Table` (tekrar 200) | Ad boşsa "Adsız tablo" sunucuda mı istemcide mi — karar (öneri: boş ad kabul, görüntü istemcide). Sütun verilmezse varsayılan sütunlar (ad + tip listesi ürün kararı: "Ad, Tarih, Durum"). `members[].role` zorunlu (tasarımda rol yok, §4) |
| `updateTable` | `PATCH /v1/tables/{tableId}` | `{name, expected_revision}` (`name_revision`) | `{table_id, name, name_revision, updated_at}` | 409 `tables.edit_conflict` (`fields[0].field = "name"`); düzenler + sahip |
| `deleteTable` | `DELETE /v1/tables/{tableId}` | — | 204 | Yalnız sahip (öneri). Yumuşak silme + geri yükleme (her modülün kendi politikası, ADR-0002). Tasarımda öğe yok (ozellikler §7.12) |
| `copyTable` | `POST /v1/tables/{tableId}/copies` | `Idempotency-Key`; `{name, target_program_id?, include_rows: false}` | 201 `Table` | Girdi §6 "yeni yıl aynı yapı"; tasarımda yok — sonraki faz |
| `listTableTemplates` | `GET /v1/table-templates` | — | `{items: [{template_id, name, icon, columns: [{name, type}]}]}` | Önerilen uç; ilk aşamada backend zorunlu değil — sabit şablonlar istemcide (yeni-15, 0–S). Sunucuda sabit katalog ya da kullanıcı şablonu (`createTableTemplate`) sonra. S1 olabilir |

### 2.3 Erişim listesi ve yetenekler (`yeni-3`)
| Önerilen operationId | Yöntem + yol | Gövde | Yanıt | Kural |
|---|---|---|---|---|
| `listTableMembers` | `GET /v1/tables/{tableId}/members` | — | `{items: [{account_id, full_name (nullable), role (sahip|duzenler|gorur), program_role? (company_admin|coordinator|member), department_display_names[]}], truncated}` | Sayfasız tavan 200 + `truncated` (aday listesi emsali) ya da imleç — erişim listesi büyüyebilir (departman/program paylaşımı gelirse) → imleç önerilir. "Rol · Koordinatörlük" alt metni sunucudan; gören: erişimi olan herkes (görür dahil? — karar §4) |
| `putTableMember` | `PUT /v1/tables/{tableId}/members/{accountId}` | `{role: duzenler|gorur}` | 200 `{account_id, role}` (yeni 201) | Doğal idempotent (`grantChatAdmin` emsali) — `Idempotency-Key` gerekmez. Sahip satırı → 409 `tables.owner_immutable`. Aday kümesi dışı hesap → 422 `tables.input_invalid` + alan `tables.member_ineligible` |
| `removeTableMember` | `DELETE /v1/tables/{tableId}/members/{accountId}` | — | 204 (yoksa yine 204) | Sahip kaldırılamaz (409 `tables.owner_immutable`) |
| `transferTableOwnership` | `POST /v1/tables/{tableId}/owner` | `{account_id, expected_revision}` | 200 | Tasarımda yok; sahip programdan çıkarsa tablo sahipsiz kalmamalı — kural gerekli (yönetici devralır? `organization` hesap silme devri emsali ORGANIZATION-K29) |

`Table.capabilities` (K1: rol dizesi değil sunucu kanıtı): `can_edit_cells`, `can_edit_structure`, `can_manage_members`, `can_delete`, `can_revert_others`, `can_lock_columns`. `my_role` yalnız gösterim (rozet "Görüntüleme", not E-11-27). Girdi §4'ün "yapıyı değiştirme ayrı izin" ve "yalnız kendi satırlarını doldurur" izinleri bu alanlara eklenebilir; tasarımda yok (§4).

Erişim öznesi genişlemesi (11e "İdari işler ve Satış ile paylaşıldı · programdaki herkes görür"): üye satırı `{subject: {kind: account|department|program, id}, role}` olarak tasarlanırsa kişi bazlı v1 kırıcı olmadan genişler. Öneri: ilk pakette yalnız `account`, şema `subject` ile.

### 2.4 Sütun yapısı, tip dönüşümü, kilit (`yeni-4`, `yeni-9`, `yeni-13`)
`Column`: `column_id`, `name`, `type` (`metin|tarih|yapilacak|kisi|koordinatorluk|gorev|tablo_baglantisi`; enum Türkçe — work modülünün `baslanmadi`… geleneği), `position` (sıra; görüntü sırası dizideki yerdir), `width_px` (nullable = varsayılan), `link_target` (yalnız bağ tipinde; §2.7), `lock` (`{locked, locked_by_account_id, can_edit}`; `yeni-13`).

| Önerilen operationId | Yöntem + yol | Gövde | Sürüm / anahtar | Kural ve hata |
|---|---|---|---|---|
| `createTableColumn` | `POST /v1/tables/{tableId}/columns` | `{name, type, link_target_table_id?, after_column_id?}` | `Idempotency-Key` zorunlu; `structure_revision` artar | Tavan aşımı 422 `tables.input_invalid` + `tables.column_limit`; hedef tablo erişimsiz/başka program → 422 alan `tables.link_target_invalid` (hangisi olduğu söylenmez, §10.8 `refs` emsali) |
| `updateTableColumn` | `PATCH /v1/tables/{tableId}/columns/{columnId}` | `{name?, expected_structure_revision}` | yapı grubu | 409 `tables.edit_conflict` `fields[0].field = "structure"` |
| (aynı uç, ayrı grup) | `PATCH …/columns/{columnId}` | `{width_px}` | **sürüm yok**, bilinçli son yazan kazanır (§8 toplantı emsali) | Genişlik ortak mı kişisel mi — ürün kararı; kişiselse ayrı uç `putMyTableColumnWidth` (K2 depolama yasağı nedeniyle sunucuda) |
| `moveTableColumn` | `POST …/columns/{columnId}/move` | `{after_column_id (null = başa), expected_structure_revision}` | yapı grubu | "Sola/sağa taşı" tek adım istemcide `after_column_id`'ye çevrilir |
| `deleteTableColumn` | `DELETE …/columns/{columnId}?expected_structure_revision=N` | — | yapı grubu | Son sütun → 409 `tables.last_column`. Dolu sütun → 409 `tables.confirmation_required` + `?confirm=true` (öneri; tasarımda onay yok). Dolu hücre sayısını `details.filled_count` ile taşımak **mevcut hata kalıbıyla uygulanamaz**: `ErrorEnvelope.details` dizedir (openapi `ErrorEnvelope`), nesne değildir (CX-T-10, CX-S-12). Seçenekler: (a) `fields[]` (`field`, `code`, `message`; sayı ayrıştırılmaz, yalnız hangi alanın onay istediği) ya da (b) **SÖZLEŞME DEĞİŞİKLİĞİ ÖNERİSİ**: `ErrorEnvelope`'a yeni, tipli bir zarf alanı (ör. nesne `meta`); backend onayı gerekir. Yumuşak silme → `revertTableChange` ile geri |
| `previewTableColumnTypeChange` | `POST …/columns/{columnId}/type-change/preview` | `{type, link_target_table_id?}` | okuma niteliğinde (yazma bütçesi tüketir) | `{convertible_count, unconvertible_count, empty_count, samples: [{row_id, value_text}] (≤5)}` (`previewTransfer` emsali) |
| `changeTableColumnType` | `PUT …/columns/{columnId}/type?confirm=true` | `{type, link_target_table_id?, expected_structure_revision}` | yapı grubu | `unconvertible_count > 0` ve `confirm` yok → 409 `tables.confirmation_required` (sayı `details`'te taşınmaz — CX-T-10; sayılar zaten `previewTableColumnTypeChange` yanıtındadır, 409 yalnız kodu taşır). Dönüşmeyen değerler **silinmez**: değişiklik kaydına eski değerle yazılır ve geri alınabilir (`yeni-11`); paket sırası buna göre (§5). Dönüşüm tablosu (metin→tarih ISO ayrıştırma, metin→yapılacak "evet/hayır", herhangi→metin görüntü metni, referans→metin ad) ADR'de |
| `lockTableColumn` / `unlockTableColumn` | `PUT` / `DELETE …/columns/{columnId}/lock` | `{}` | doğal idempotent | Kilitli sütuna yazım → 403 `tables.column_locked` (ayrı kod: istemci kilit ipucunu gösterir). Kimin kilitleyip kimin yazabildiği ürün kararı (ozellikler §7.2) |

### 2.5 Satırlar, hücreler, arama, özet (`yeni-6`, `yeni-10`)
`Row`: `row_id` (kalıcı, opak; görüntüdeki "1..n" ve 11e "B4" **görüntü** adresidir, kimlik değil), `position` (opak sıra anahtarı), `created_at`, `created_by_account_id`, `cells: {<column_id>: Cell}`.
`Cell`: `value` (tipe göre: metin `string`; tarih `YYYY-MM-DD`; yapılacak `boolean`; kisi `{account_id}`; koordinatorluk `{department_id}`; gorev `{work_item_id}`; tablo_baglantisi `{row_ids[]}`), `ref` (okumada çözülmüş özet, §2.6/§2.7), `revision` (hücre sürümü), `updated_at`, `updated_by_account_id`, `has_comments` (`yeni-12`). Boş hücre `null` (alan yok değil).

| Önerilen operationId | Yöntem + yol | Gövde / parametre | Sürüm / anahtar | Kural ve hata |
|---|---|---|---|---|
| `listTableRows` | `GET /v1/tables/{tableId}/rows` | `limit` (50/200), `cursor`, `q`, `todo_column_id` + `todo` (`open|done`), `sort` (`<column_id>:asc|desc`, tek sütun) | — | `{items: Row[], next_cursor?}`. Varsayılan sıra `position`. Sıralama anahtarları: metin Türkçe harmanlama, tarih, boolean, referansın **görüntü adı** (okuyucunun gördüğüyle; görünmeyen en sonda). Geçersiz imleç 422 `tables.invalid_cursor` |
| `createTableRows` | `POST /v1/tables/{tableId}/rows` | `{count: 1..N, after_row_id?, cells?: {...}}` | `Idempotency-Key` zorunlu | 201 `{items: Row[]}` (tekrar 200 aynı satırlar). Tavan 422 `tables.input_invalid` + alan `tables.row_limit` (`tables.column_limit` kalıbı). Toplu ekleme tek değişiklik kaydı ("3 satır eklendi") |
| `deleteTableRow` | `DELETE /v1/tables/{tableId}/rows/{rowId}` | — | sürüm yok (silme), tekrar 204 | Yumuşak silme; geri bağ hedef tarafta düşer (gelen çiplerde sayı azalır), geri alınca döner. Silinmiş satıra yazım 409 `tables.row_deleted` |
| `writeTableCells` | `PATCH /v1/tables/{tableId}/cells` | `{changes: [{row_id, column_id, value, expected_revision}] (1..100)}` | hücre başına `expected_revision`; **atomik** (biri çatışırsa hiçbiri yazılmaz — ADR-0027 "iki grup" kuralının eşi) | 200 `{cells: [{row_id, column_id, value, ref, revision, updated_at}]}`. Bayat + farklı değer → 409 `tables.edit_conflict`, `fields[i].field = "changes[k]"`, Çatışan hücrenin güncel değerini (`current_value`, `current_ref`, `current_revision`, `updated_by_account_id`) `details.conflicts[]` içinde nesne olarak taşımak **mevcut hata kalıbıyla uygulanamaz** (`details` dizedir; CX-T-10, CX-S-12). Seçenekler: (a) `fields[i]` yalnız hangi değişikliğin çatıştığını söyler, güncel değer için istemci ayrı okuma yapar (ADR-0027 kalıbı: 409'dan sonra yeniden oku) ya da (b) **SÖZLEŞME DEĞİŞİKLİĞİ ÖNERİSİ**: tipli `conflicts[]` zarf alanı; backend onayı gerekir. Aynı değer → 200, yazılmaz. Tip uyuşmazlığı 422 alan `tables.invalid_value`; görünmeyen referans 422 alan `tables.reference_unavailable` (§2.6) |
| `getTableSummary` | `GET /v1/tables/{tableId}/summary` | aynı süzgeç parametreleri (`q`, `todo…`) | — | `{row_count, filtered_count, todo: {column_id, open, done}?, columns: {<column_id>: {filled, distinct?, min_date?, max_date?, done?, links?}}}` — E-11-29 sayaçları, E-11-31, E-11-48. Özet süzgeçli görünüme mi tüm tabloya mı ait — ürün kararı (§4); uç ikisini de verebilir |

**Hücre sürümü neden** (satır sürümü değil): ADR-0027 "istenen değer güncelden farklı ve sürüm bayatsa 409" kuralı satır düzeyinde uygulanırsa iki kişinin aynı satırın **farklı** hücrelerini düzenlemesi gereksiz 409 üretir; tablo düzenleyicisinde bu olağan durumdur.

**Hesap bütçesi (ADR-0028):** yazma 60/dk/hesap. Hücre başına anında kayıt (tasarım: odak kaybı, her onay kutusu tıkı, her bağlama tıkı) hızlı veri girişinde tavana çarpar → 429 `platform.rate_limited`. Seçenekler: (a) istemci 1–2 sn birleştirip `writeTableCells` toplu gönderir (öneri; tasarımın "anında" hissini korur), (b) tablo yazımları için ayrı kova (ADR-0028 değişikliği), (c) ikisi. `yeni-1` kararı.

### 2.6 NIZAM referans hücreleri (`yeni-7`)
- **Yazım:** kişi → hesap tablonun kapsamındaki aday kümesinde (A: programın ekibi + yöneticiler) olmalı; koordinatörlük → programa bağlı canlı departman; görev → **yazanın** o an görebildiği görev (`listProgramWorkItems` görünürlüğü). Aksi tek 422 `tables.input_invalid` + alan `tables.reference_unavailable` (hangisi olduğu söylenmez — §10.8 `refs` emsali).
- **Okuma (`Cell.ref`):** her okuyucunun **kendi** yetkisiyle canlı çözülür (`available:false` alan biçimi §10.8 `getChatRefSummary`'den alınır; ama sohbet özeti kaynak erişimine bağlı değildir — okuyucu yetkisine göre gizleme **yeni gizlilik kararıdır**, ADR, yeni-1 kapsamında; CX-T-08, CX-S-05):
  - kisi: `{account_id, full_name (nullable, §8)}` — kişi adı tabloyu görene açık (aday kümesi zaten görünür).
  - koordinatorluk: `{department_id, available, display_name?, code?}` — bağ kalktıysa `available:false`.
  - gorev: `{work_item_id, available, title?, status?, department_id?}` — okuyucu görevi göremiyorsa (atanmamış üye, başka departman) **`available:false`, başlık yok**. Tasarım bu durumu çizmemiş; öneri: bağ hücresindeki kilitli çip deseni (E-11-44) "🔒 Görev". Görev kısa kodu yok (BE-005).
- Girdi §5 "canlı / anlık değer / kaynak düzenleme" ayrımı: tasarım yalnız **canlı** referans gösteriyor; anlık değer saklama ayrı tip ya da sütun seçeneği olarak sonraya.
- **Aday uçları:** kişi `yeni-5` (`listTablePeopleCandidates?q=&cursor=&exclude_members=true`, S2); koordinatörlük mevcut `listProgramDepartments` (yeterli); görev mevcut `listProgramWorkItems` + `q` (BE-004/GAP-212 kapanınca tam; o güne istemci süzmesi).

### 2.7 Tablo bağlantısı ve varlık gizleme (`yeni-8`)
| Önerilen operationId | Yöntem + yol | Parametre | Yanıt |
|---|---|---|---|
| `listLinkableTables` | `GET /v1/tables/linkable?exclude_table_id=` | — | Okuyucunun **düzenler/sahip** ya da en az görür erişimi olduğu, aynı programdaki tablolar `{table_id, name}` (karar: görür yeterli mi) |
| `listTableLinkCandidates` | `GET /v1/tables/{tableId}/columns/{columnId}/link-candidates` | `q`, `limit`, `cursor` | Hedef tablonun satırları `{row_id, display_index?, primary_text, secondary_text}` — hedefe erişim yoksa 404 `tables.table_not_found` |
| (getTable içinde) | `Table.links` | — | `outgoing: [{column_id, target: {available, table_id?, name?}}]`, `incoming: [{source_table_id, source_name, column_id, column_name, link_count}]` |

Bağ hücresi okuması: `ref = {target_available: true, rows: [{row_id, primary_text}]}` ya da `{target_available: false}`.

**§9 varlık gizleme uygulaması** (tasarımla çelişir — §4):
1. Okuyucunun erişimi olmayan hedef tablo **yoktur**: `link_target` / `outgoing[].target` yalnız `{available:false}` döner — **ad yok** (E-11-25'teki kilitli çipte hedef adı, E-11-44 `title`'ındaki "“<hedef>” tablosuna erişimin yok" metni kurulamaz).
2. Kilitli bağ hücresi **sayı taşımaz** ("🔒 2 bağlantı" → "🔒 Erişimin yok"); alt özet satırı (E-11-48) o sütun için "`n` bağlantı" vermez. Gerekçe: sayı hedef tablonun satırlarının varlığını ve hacmini sızdırır; kaynak tablonun verisi olsa da değerin kendisi hedef kimlikleridir.
3. Erişimsiz **kaynak** tablolardan gelen geri bağlar (E-11-26 `backHidden`) hiç dönmez — "+N erişimin olmayan tablo" sayısı da yok.
4. "Hedef silinmiş" (E-11-43 "Tablo bulunamadı") ile "hedefe erişim yok" okuyucu için **aynı** durumdur (`available:false`); ayrım ancak erişimi olan için anlamlıdır ve o da 404 alır. Tasarımın iki ayrı metni tek metne iner.
5. Erişimsiz hedefe yönelik sütunun hedefini değiştirme: düzenleyen kişi yeni hedefi seçebilir; eski bağ değerleri temizlenir → `tables.confirmation_required` (dolu hücre sayısıyla).
Bu kural ürün sahibi gevşetmek isterse (ad görünsün, sayı görünsün) karar ADR'ye yazılmalı; öntanımlı sıkı.

### 2.8 Değişiklik kaydı ve geri al (`yeni-11`)
| Önerilen operationId | Yöntem + yol | Parametre / gövde | Yanıt / kural |
|---|---|---|---|
| `listTableChanges` | `GET /v1/tables/{tableId}/changes` | `actor` (`me`), `row_id`, `column_id` (hücre geçmişi E-11-66), `limit`, `cursor`, `after_seq` (uzlaştırma, §2.10) | `{items: [{change_id, seq, kind (cell_updated|rows_created|rows_deleted|column_created|column_updated|column_type_changed|column_deleted|member_changed|revert), actor_account_id, actor_full_name (nullable), at, row_id?, column_id?, row_label?, column_name?, old_display?, new_display?, count?, revertible, reverted_by_change_id?}], next_cursor?}`. `old/new_display` referanslarda **okuyucunun** yetkisiyle çözülür (görünmeyen görev → "🔒"). En yeniden eskiye |
| `revertTableChange` | `POST /v1/tables/{tableId}/changes/{changeId}/revert?confirm=` | `Idempotency-Key` | 201 yeni `revert` kaydı. Hücre o arada değiştiyse 409 `tables.confirmation_required` → onayla üzerine yaz. Güncel görüntü metnini `details.current_display` ile taşımak **mevcut hata kalıbıyla uygulanamaz** (`details` dize; CX-T-10, CX-S-12): ya `fields[]` + ayrı okuma ya da **SÖZLEŞME DEĞİŞİKLİĞİ ÖNERİSİ** (tipli zarf alanı; backend onayı gerekir). Geri alınamaz tür 409 `tables.change_not_revertible`. Başkasının değişikliğini geri alma `capabilities.can_revert_others` |

Saklama süresi ve "Tüm geçmişi gör" (E-11-62) hedefi karar; audit (GAP-002) ile karıştırılmaz.

### 2.9 Hücre yorumları (`yeni-12`) — aşağıdaki bütün ad, yol ve olay türleri **önerilendir**
- `listTableCommentMarkers` `GET /v1/tables/{tableId}/comment-markers` → `{items: [{row_id, column_id, thread_id, open}]}` (köşe üçgeni; satır okumasında `has_comments` de yeter).
- `listTableCellComments` `GET /v1/tables/{tableId}/rows/{rowId}/cells/{columnId}/comments` → `{thread_id, resolved, resolved_by_account_id?, items: [{comment_id, author_account_id, author_full_name (nullable), at, body, mentions[]}], next_cursor?}`.
- `addTableCellComment` `POST` aynı yol; `Idempotency-Key`; `{body (≤5000, düz metin), mentions: [{kind: "account", target_id}] (≤20)}` — sohbet `mentions` biçimi (§10.8); sunucu metni ayrıştırmaz. Anılan kişi tabloya erişimi yoksa: bildirim gitmez mi, 422 mi — karar (öneri 422 alan `tables.mention_ineligible`).
- `updateTableCommentThread` `PATCH /v1/tables/{tableId}/comment-threads/{threadId}` `{resolved: bool}` (sürümsüz, son yazan kazanır).
- Yorum yazma yetkisi: görür de yazabilir mi — karar.
- **Olay:** `tables.comment.mentioned` (events.md'ye yeni tür; yük `table_id`, `thread_id`, `comment_id`, `mentioned_account_id`; ad/içerik yok — ADR-0009) → notifications kuyruğu. Bildirim tercihi BE-027 ile ortak altyapı.

### 2.10 Gerçek zamanlı (K8 ile çelişki) (`yeni-14`) — `streamTableEvents`, `putTablePresence` ve olay adları **önerilendir**
| Seçenek | Sözleşme | Bedel |
|---|---|---|
| **A — Gerçek zamanlı yok** (K8 korunur) | Ek uç yok. İstemci odakta + 15–30 sn aralıkla `listTableChanges?after_seq=<son>` (ucuz fark okuması) ya da `getTable.updated_at` karşılaştırması; değişiklik varsa ilgili satır sayfası yeniden okunur. Çakışmayı hücre sürümü yakalar | Okuma bütçesi (600/dk) içinde rahat. "Herkes anında görür" ipucu (E-11-49) "birkaç saniye içinde"ye iner; varlık/imleç (E-11-52/55/56) yok |
| **B — Tablo SSE akışı** (sohbet kalıbı) | `streamTableEvents` `GET /v1/tables/{tableId}/stream` (S2), `text/event-stream`, olaylar **içeriksiz**: `cells.changed {table_id, row_ids[], actor_account_id, seq}`, `rows.changed`, `structure.changed`, `members.changed {affected_account_ids}` (erişim kaybı → kapat), `comments.changed`. Uzlaştırma `listTableChanges?after_seq`. `: ping`, 5 dk bütçe, jitter + üstel geri çekilme — §10.5'in aynısı | Akış açılışı yazma bütçesinden düşer; hesap başına 12 akış tavanı sohbet akışıyla **paylaşılır** (birden çok sekme + sohbet). K8 değişikliği gerekir |
| **C — B + varlık** | B'ye ek `presence.changed`; varlık sunucudaki açık akışlardan türetilir (kim bağlı), etkin hücre/yazıyor için `putTablePresence` `PUT /v1/tables/{tableId}/presence` `{mode, row_id?, column_id?, typing}` | Etkin hücre yazımları 60/dk yazma bütçesine çarpar → ayrı kova ya da en çok 5 sn'de bir; kişi rengi sunucu mu istemci mi atar (öneri: istemci, `account_id` karmasından) |

Öneri: modül ilk fazı **A**; B ürün kararıyla ayrı paket; C yalnız 11e kabul edilirse.

## 3. Kısmi karşılıklar
- **Görev seçici** (E-11-41, E-11-69): `listProgramWorkItems` görünürlüğü doğru, ama `q` yok (GAP-212/BE-004) ve kısa kod yok (BE-005). Uyarlama: seçici açılınca ilk sayfa (200) yüklenir, yazdıkça yerelde süzülür, "daha fazla yükle" ile sonraki sayfa; etiket `code` + "—". İmleç bitmediyse kullanıcıya "Yüklenen görevler içinde aranıyor; daha fazla yükleyin" denir — sayfa tavanı (200) toplam tavanı değildir (ortak-kurallar §10) ve metni daraltmak yüklenmemiş kaydı buldurmaz.
- **Koordinatörlük seçici** (E-11-40): `listProgramDepartments` tam karşılık; tek fark kesilmede (`X-Result-Truncated`) "liste eksik" uyarısı. Kısaltma tasarımdaki "ilk 3 harf" yerine önce `code`.
- **Kişi seçici / paylaşım** (E-11-39, E-11-71): yalnız şirket yöneticisi için `listUsers` (`search` var, şirket geneli, `memberships` etiketi kimlik taşır → departman adı ayrıca çözülmeli); koordinatör ve üye için karşılık yok. Uyarlama yok — `yeni-5` gelene kadar devre dışı.
- **Satır numarası, sayaçlar, alt özet** (E-11-29, 31, 36, 48): satırlar imleçli gelirse istemci yalnız yüklenen satırları sayar → "yaklaşık"; tasarım tam sayı gösteriyor → `getTableSummary` (`yeni-10`). Satır numarası görüntü sırasıdır, süzgeç/sıralamayla değişir; kalıcı adres `row_id`.
- **Otomatik kayıt** (E-11-49): sözleşme kalıbı var (sürüm + anahtar + "sonuç bilinmiyor"), ama §8 "iyimser güncelleme yapılmaz" görevler için yazılmış; tablo düzenleyicisi yerel değeri hemen göstermeli. Uyarlama: `writeTableCells` yanıtı otoriter hücre temsilini döndürür (türetilmiş yan etki yalnız özet) → modül sözleşmesi "yanıt gövdesi yerel durumu günceller, özet ayrıca tazelenir" diye **açıkça** yazmalı.

## 4. Yol haritası kararıyla çelişenler
**Yol haritası:**
- **K14** — modül v1 dışı; menüde görünmez. Bu dosya karar değiştirmez.
- **K8** — 11b ipucu "herkes anında görür" ve 11e canlı varlık/imleç gerçek zamanlı ister; K8 yalnız sohbete SSE verir. v1'de konu yok; modül fazında §2.10 seçeneği. Ürün sahibine soru 2.
- **K3** (fan-out yasağı) — kart önizlemesi, kart kişi yığını ve hücre referans çözümü istemci tarafında tablo/hücre başına istekle kurulamaz; liste ve satır yanıtına gömülmeli (§2.2, §2.6).
- **K1** — tablo yetkisi rol merceğinden gelmez; yanıt içi `capabilities` (§2.3). 11e "koordinatör kilidi" program rolüyse §4 tablosuna satır ve `capabilities.ts`'e girdi gerekir.
- **K2** — sütun genişliği (E-11-34) yerel depolamaya yazılamaz; ortak (sunucu alanı) ya da kişisel (sunucu tercihi) — §2.4.

**İhtiyaç tanımı ile tasarımın örtüşmediği noktalar** (ürün sahibi kararı; sözleşme taslağı ikisine de açık bırakıldı):
| Konu | Girdi | Tasarım | Sözleşme sonucu / öneri |
|---|---|---|---|
| Tip değişimi uyarısı | §3: dönüştürülemeyen değerler sessizce kaybolmamalı | Sütun menüsünde tip tıkla → anında uygulanır, uyarı yok (E-11-67) | `previewTableColumnTypeChange` + 409 `tables.confirmation_required` + onay diyaloğu (K5 etkili işlem onayı bileşeni). **Tasarıma onay diyaloğu eklenmeli**; dönüşmeyen değer değişiklik kaydında kalır |
| Kaydediliyor göstergesi | §4: kullanıcı değişikliğin kaydedilip kaydedilmediğini anlayabilmeli; çakışmalar anlaşılır ele alınmalı | Gösterge, kayıt hatası, 409 çözümü yok (ozellikler §7.11) | Sunucu eksiği değil; tasarım eksiği: başlıkta "Kaydediliyor… / Kaydedildi / Kaydedilemedi — yeniden dene" ve hücre düzeyi çakışma seçimi (K5). 429 (§2.5 bütçe) için "bekleniyor" durumu |
| Sayı / para tipi | §3: sayı temel tip | 7 tipte yok; 11e "Bütçe 4.500 ₺" (E-11-64) | Tip listesine `sayi` (ondalık, isteğe bağlı birim/para `TRY`) eklenmesi önerilir; değer JSON'da **dize** ondalık (`"4500.00"`) — kayan nokta yok. Alt özet: toplam. Karar: v1 modül kapsamı mı |
| Evet/hayır, tekli/çoklu seçim, dosya | §3 | Yalnız "Yapılacak" (boolean) var | Seçim tipleri `secim` (`options[]`) sonra; dosya tipi records + **indirme bileti hedef listesine yeni desen** (identity, ADR-0013) — ayrı paket |
| Zorunluluk / doğrulama | §3 | Yok | `Column.required`, `Column.validation` alanları sonraya; şimdiden şemada yer ayrılmaz |
| İzin üçlüsü | §4: görme / doldurma / yapıyı değiştirme; "yalnız kendine ayrılmış kayıtlar" | görür / düzenler | `capabilities` ayrık; satır sahipliği (`row.assignee_account_id`) sonraya |
| Referans davranışı | §5: canlı / anlık değer / kaynağı düzenleme | Yalnız canlı | Canlı ilk; anlık değer ayrı seçenek |
| Gruplama, raporlama, onaylı sürüm, formül, Excel | §6 | Yok (yalnız alt özet ve şablon kullanma) | Sonraki paketler; Excel içe/dışa aktarma bilet hedefi gerektirir |
| Kapsam | §1 bağımsız çekirdek | Program kırıntısı | §2.1 |

**Tasarım analistinin varsayımlarından sözleşme kalıplarıyla çelişenler** (mekanizma.md / ozellikler.md):
1. "Hücre yazımları iyimser güncelleme + uzlaştırma" (mekanizma §3) — §8 görevlerde iyimser güncellemeyi yasaklar; modül sözleşmesi bunu açıkça izin vermeli (§3 son madde).
2. "Her tık yazma" / hücre başına anında kayıt (mekanizma §4.6) — 60/dk yazma bütçesine çarpar (ADR-0028); toplu yazma gerekir.
3. "Çakışma kontrolü tablo/satır/hücre düzeyinde" — satır düzeyi ADR-0027 kuralıyla gereksiz 409 üretir; hücre düzeyi önerildi.
4. "Paylaşım anında yazma, kişi ekle" (create) — `Idempotency-Key`'li POST yerine doğal idempotent `PUT` (`grantChatAdmin` emsali).
5. Kilitli çipte hedef adı ve "🔒 n bağlantı" sayısı, `backHidden` sayısı, ayrı "Tablo bulunamadı" metni — §9/§10.6 varlık gizleme ile çelişir (§2.7).
6. Görünmeyen görev referansı için "kilitli çip deseni" varsayımı doğru yönde, ama tasarım görev başlığını gösterecek biçimde çizilmiş; sunucu başlık döndürmez (§2.6).
7. Liste/satır "sayfalama yok", "sayaçlar sunucudan süzgeç başına" — sözleşmede toplam/sayaç kalıbı yok (BE-003); yeni kalıp gerekir.
8. "Kişi seçenekleri = program/şirket kullanıcıları" — §8 "ayrı ekip dizini ucu yoktur"; yeni dizin yüzü gizlilik kararıdır (`yeni-5`).
9. Kişi adları her yerde dolu varsayılıyor — `full_name` null olabilir (§8).
10. 11e "koordinatör" yetkisi — rol dizesi değil olgu (K1, istemci-akislari §1); tablo içi rol mü program rolü mü belirlenmeden yetenek alanı yazılamaz.

**Ürün sahibine sorular:**
1. **Kapsam:** tablolar program kapsamlı mı (A) yoksa şirket geneli bağımsız çekirdek mi (B)? A ise program sıfırlama/silme/aktarımda tablolara ne olur; "yeni yıl" kopyası istenir mi?
2. **Gerçek zamanlı:** K8 korunup tazeleme mi (A), tablo SSE akışı mı (B), varlık/imleç dahil mi (C)? B/C'de hesap başına 12 akış tavanının sohbetle paylaşılması kabul mü?
3. **Paylaşım modeli:** yalnız kişi mi, departman/program geneli de mi (11e)? "Bağlantıyı kopyala" erişim vermeyen düz URL mi (öneri: evet)? Görür rolündeki kişi erişim listesini görür mü, paylaşabilir mi? Düzenler rolü paylaşabilir mi?
4. **Gizlilik:** erişimsiz hedef tablonun adı ve bağ sayısı gizlensin mi (öneri: evet, §2.7)? Kişi seçicisi programın herkesini her role göstersin mi (üye için de)?
5. **Tipler:** Sayı/Para modülün ilk fazında mı? Varsayılan sütunlar ("Ad, Tarih, Durum") tipleri?
6. **Yetkiler:** sütun kilidini kim koyar/kim yazar; başkasının değişikliğini kim geri alır; tabloyu kim siler; sahip ekipten çıkarsa sahiplik kime geçer?
7. **Tavanlar:** tablo başına satır/sütun üst sınırı (girdi §2 örnekleri binlerce satır doğurur)?
8. **Sütun genişliği** herkes için ortak mı kişisel mi?

## 5. Önerilen backend iş paketleri
BE-031 şemsiyesi altında; sıra bağımlılıkla. Karar sınıfları Codex kapı hükmüyle hizalıdır (EKRANLAR-codex.md §4 BE-031 tablosu): bu paketler backend kabulü değil, öneridir. Boyut backend tahmini (S/M/L). "MVP" = 11, 11b, 11c, 11d (11e hariç) çalışır.

| Sıra | Paket | Tek cümle | Boyut | Bağımlılık | MVP |
|---|---|---|---|---|---|
| 0 | `yeni-1` Kapsam + iskelet ADR'si | Kapsam (A/B), modül adı ve sınırı, `tables.*` hata öneki ve kod kümesi (aşağıda), hücre sürümü + toplu yazma, bütçe kovası, tavanlar ve varlık gizleme kuralını tek ADR'de sabitler. **ÜRÜN/ADR önce**: "bağımsız çekirdek" kendiliğinden ayrı servis demek değildir; kapsam, yaşam döngüsü, yetki, tavan ve yazma bütçesi karar işidir. | S | Ürün soruları 1, 3, 4, 7 | ✓ |
| 1 | `yeni-2a` Tablo çekirdek CRUD (+ `yeni-15` şablon: backend zorunlu değil) | `createTable`/`getTable`/`updateTable`/`deleteTable`, imleçli `listTables` (ad, sahip, `my_role`, zaman alanları; önizleme/sayaç/bağ alanları **yok**), **ilk teslimde sahip yetkisi zorunlu** (ACL sonra gelecek diye ACL'siz açık CRUD yayımlanmaz). Şablon (`yeni-15`) ilk aşamada backend işi değildir: sabit şablonlar istemcide tutulur, boyut 0–S; kullanıcı tanımlı/sunucudan yönetilen katalog ayrı ihtiyaçtır. | M | yalnız yeni-1 | ✓ |
| 2 | `yeni-3` Erişim listesi | Sahip/düzenler/görür ACL'i, `PUT`/`DELETE` üye uçları, `capabilities` alanları ve 404 gizleme. BE işidir; ortak kişi altyapısı mümkündür ama herkese bütün program dizini varsayılmaz. | M | yeni-2a | ✓ |
| 3 | `yeni-4` Sütun yapısı | Yedi tipli sütun ekle/adlandır/taşı/sil ve yapı sürümü; genişlik ayrı grup. BE işidir. | M | yeni-2a | ✓ |
| 3' | `yeni-5` Kişi aday dizini | Her rolün çağırabildiği, `q` ve imleçli, rol + departman alt metinli program kişi araması (organization portu). BE işidir; herkese bütün program dizini varsayılmaz (gizlilik kararı yeni-1'de). | M | yalnız yeni-1 (gizlilik kararı); BE-011 ile ortak sorgu — yeni-2a…yeni-6 ile **paralel** yürür, yeni-7'den önce bitmeli | ✓ |
| 3'' | BE-004 (`q`) + BE-005 (kısa kod) | `listProgramWorkItems`'a `q` ve görev kısa kodu — tablo, görev listesi ve sohbet aynı anda kazanır. | M + M | bağımsız (work modülü); her an paralel | kısmi (olmadan istemci süzmesi) |
| 4 | `yeni-6` + `yeni-11a` Satır + hücre + değişiklik kaydı yazımı | İmleçli satır okuma, toplu satır ekleme (anahtarlı), yumuşak satır silme, hücre sürümlü atomik `writeTableCells` (metin/tarih/yapılacak) ve **aynı transaction'da** `seq`'li değişiklik kaydı yazımı (eski/yeni değer). **Tek çekirdek teslim**: hücre yazımı ve değişiklik kaydı aynı transaction'da; sürüm, 429 ve yarım kayıt davranışı birlikte doğrulanır. | L | yeni-3, yeni-4 | ✓ |
| 5 | `yeni-7` NIZAM referans tipleri | Kişi/koordinatörlük/görev hücrelerinde yazım doğrulaması ve okuyucunun yetkisiyle `available:false`'lu canlı çözüm. Ayrı BE (yeni-8'den bağımsız yetki/yaşam döngüsü). | M | yeni-6, yeni-5 | ✓ |
| 6 | `yeni-10` Sunucu araması + özet | `listTableRows` arama/süzgeç/sıralama parametreleri ve `getTableSummary` (sayaçlar, alt özet). BE işidir. | M | yeni-6, yeni-7 (referans sıralama) | ✓ |
| 7 | `yeni-8` Tablo bağlantısı | Çoklu satır bağı, bağlanabilir tablolar, hedef satır arama, gelen/giden bağ özeti ve §9 gizleme kuralı. Ayrı BE: tablolar arası bağ, NIZAM referanslarından farklı yetki ve yaşam döngüsü taşır. | L | yeni-6, yeni-3 | ✓ |
| 8 | `yeni-2b` Liste önizlemesi + sayaçlar | `listTables`'a `preview` (referans/bağ hücreleri okuyucunun yetkisiyle çözülmüş), `members_preview`/`members_count`, `row_count`/`column_count`, süzgeç `counts` ve `getTable.links` alanlarını ekler (kırıcı olmayan yeni alanlar). | M | yeni-3, yeni-4, yeni-6, yeni-7, yeni-8 | ✓ (o güne kart önizlemesi statik, K13) |
| 9 | `yeni-9` Tip dönüşümü | Önizleme + `confirmation_required` + dönüşmeyen değerin değişiklik kaydında korunması. BE işidir; sayı/ondalık tipinin ilk kapsamı ürünce belirlenir. | M | yeni-4, yeni-11a (kayıpsızlık) | ✓ (yoksa tip değişimi yalnız boş sütunda) |
| 10 | `yeni-11b` Değişiklik kaydı okuma + geri al | `listTableChanges` (hücre/kişi süzgeçli, imleçli, `after_seq`) ve onaylı `revertTableChange`. **Ayrı L**; audit ekranıyla birleştirilmez, araya giren değişikliği sessizce ezemez. | L | yeni-11a | — (11e) |
| 11 | `yeni-12` Hücre yorumları | Yorum dizisi, çözüldü, `@` anma ve `tables.comment.mentioned` olayıyla bildirim. BE + yetki kararı. | M | yeni-6, notifications | — (11e) |
| 12 | `yeni-13` Sütun kilidi | Kilitle/aç ve kilitli sütuna yazımda 403 `tables.column_locked`. BE + yetki kararı: "koordinatör" tablo rolü mü program rolü mü belirlenmeden başlanmaz. | S–M | yeni-4, ürün sorusu 6 | — (11e) |
| 13 | `yeni-14` Gerçek zamanlı | Seçenek A'da yalnız `after_seq` tazelemesi (yeni-11b ile gelir); B/C'de tablo SSE akışı ve varlık. ÜRÜN → BE: gerçek zamanlı uzlaştırma ile canlı imleç/varlık ayrı teslim edilebilir. | L (B/C) | yeni-11b (`seq` okuma), K8 kararı | — |
| sonra | Sayı/para, seçim tipleri, dosya tipi (bilet hedefi), Excel içe/dışa aktarma, tablo kopyalama/dönem, satır sahipliği izni, kullanıcı şablonu | Girdi §3–§6'nın tasarımda olmayan kalanı. | — | ürün kararı | — |

Kritik yol (MVP): `yeni-1` → `yeni-2a` → (`yeni-3` ∥ `yeni-4`) → `yeni-6`+`yeni-11a` → `yeni-7` → (`yeni-10` ∥ `yeni-8` ∥ `yeni-9`) → `yeni-2b`. Paralel kollar: `yeni-5` (`yeni-1`'den sonra başlar, `yeni-7`'den önce biter) ve BE-004/005 (bağımsız). Web tarafı her paketten sonra ilgili artboard'u bağlar; 11e paketleri (`yeni-11b`, `yeni-12`, `yeni-13`, `yeni-14`) MVP'den sonra.

### 5.1 Önerilen `tables.*` hata kodu kümesi (hepsi **önerilen**; `yeni-1` ADR'sinde sabitlenir, `error-codes.json` biçiminde)
| Kod | Durum | `fields[].code` (alan kodları) | Nerede |
|---|---|---|---|
| `tables.input_invalid` | 422 | `tables.invalid_name`, `tables.invalid_type`, `tables.invalid_value`, `tables.reference_unavailable`, `tables.link_target_invalid`, `tables.member_ineligible`, `tables.mention_ineligible`, `tables.column_limit`, `tables.row_limit`, `tables.request_key_required`, `tables.request_key_invalid`, `tables.revision_required`, `tables.revision_invalid` | Bütün yazma uçları (ADR-0027 alan kodu kalıbı) |
| `tables.invalid_cursor` | 422 | `tables.invalid_cursor` | İmleçli listeler |
| `tables.not_authorized` | 403 | — | Tabloyu gören ama eylem yetkisi olmayan (ör. görür rolüyle yazma, sahip olmayanın silmesi, paylaşım yetkisi yok) |
| `tables.column_locked` | 403 | — | Kilitli sütuna yazım (`yeni-13`) |
| `tables.table_not_found` | 404 | — | Erişimsiz / silinmiş / başka programdaki tablo (§9 gizleme) |
| `tables.program_scope_invalid` | 404 | — | Programda ekip satırı yok (A seçeneği; `work.program_scope_invalid` emsali) |
| `tables.row_not_found`, `tables.column_not_found`, `tables.change_not_found`, `tables.comment_not_found` | 404 | — | Alt kaynaklar |
| `tables.edit_conflict` | 409 | `tables.edit_conflict` | Bayat `expected_revision` (ad, yapı, hücre) |
| `tables.idempotency_key_reused` | 409 | — | Aynı `Idempotency-Key` farklı gövde/kapsamla (oluşturma uçları, geri al, yorum) |
| `tables.confirmation_required` | 409 | — (sayılar `details`'te taşınmaz; §2.4 **SÖZLEŞME DEĞİŞİKLİĞİ ÖNERİSİ** notu, CX-T-10) | Tip dönüşümü, dolu sütun silme, bağ hedefi değişimi, çakışan geri al |
| `tables.last_column`, `tables.owner_immutable`, `tables.row_deleted`, `tables.change_not_revertible` | 409 | — | Durum kuralları |
| Ortak kenar kodları | — | — | `platform.*` (ör. `platform.scope_missing`, `platform.conflict_retry`, `platform.rate_limited`), `organization.membership_required`, `identity.*` — README §5 ortak küme |
