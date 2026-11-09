# WEB-1 (F1) — Codex nihai kapı hükmü

**Son hüküm: `<tur 3 hükmü>`** — 3. koşum, `main` @ `<tur 3 main>` (#32–#45 + `<W64 PR>` birleşik).
Denetçi: Codex, `codex exec -s read-only`, her koşum tek ve salt okunur (tur 1 modeli `gpt-6-astra`).
Kayıt: yürütme `docs/yurutme/web-1/ilerleme.md` (O5); yönetim deposu satırı kapanışta.

| Koşum | Denetlenen `main` | Hüküm | Açılan bulgular | Düzeltme |
|---|---|---|---|---|
| 1 | `67d31b4` (#32–#43 birleşik) | UYGUN DEĞİL | CX-F1-E-01…E-04 (engelleyici); Ö-01…Ö-05; K-01…K-04 | W63 → PR #44 `a3ffe64` (E-01, Ö-01, Ö-02 kısmen, K-04, görsel kusurlar) · W62 → PR #45 `45957f9` (E-02, E-03, Ö-03) · belge K-01/K-02/K-03 kapanış dalı `web1/o5-kapanis` |
| 2 | `45957f9` (#32–#45 birleşik) | UYGUN DEĞİL | E-01, E-03 kapandı; E-04 kod düzeltmeleri uygun (kanıt kapanış PR'ında); **E-02 kısmen** — `subtasks_open` onayı sahipsiz, geç yanıtta bağlam, kabul → mutasyon başlangıcı boşluğu; Ö-06 (yeni) | W64 → `<W64 PR>` (E-02 kalan üç boşluk, Ö-06 etiketi) · K-01…K-03 + E-04 kanıt özeti bu PR |
| 3 | `<tur 3 main>` | `<tur 3 hükmü>` | `<tur 3 bulguları>` | `<tur 3 düzeltme>` |
| — | `67d31b4` | Görsel doğrulama (üretim paketi + üretim CSP'si + Playwright + sahte `/v1`; gerçek backend yok): 53 senaryo, 96 görüntü (88 uygulama + 8 tasarım), iki tema × 1440/1024/390 × Admin/Koordinatör/Üye; kanıt özeti `docs/yurutme/web-1/ilerleme.md` O5 | yüksek 1 (alt görev onay kutusu 2 px, E-03-31), orta 2 (`/gorevler` 390 px'te 10 px yatay taşma; not çakışmasında sınırsız yeniden gönderim), düşük 5; bilinçli fark 22 | 8 kusurun 8'i W63 #44 (yeniden ölçüm: taşma 390/1024/1440 = 0/0/0; CSP ihlali 30 senaryoda 0) |

Düzeltme planı (koordinatör, 2026-11-09): E-01 → W63 (PR #44; `work/model/assignment.ts` tek yüklem — liste, sekme sayaçları, talep sayısı, sayfalayıcı, boş durum ve ana sayfa KPI aynı kümeden) · E-02/E-03 → W62 (PR #45; `use-confirm` kapsam + oturum nesli + hesap bağı; bileşik yazmada `submit(vars, { context })`) · E-04 → görsel doğrulama turu (main `67d31b4`) + W63 #44 (390 px taşma ve diğer 7 görsel kusur) · Ö-01 → W63 · Ö-02 → W63 kısmen, kalan F2 entegrasyon turu (W82) · Ö-03 → W62 (`/layers.css` `no-cache`, duman testinde tüm CSP ihlalleri 0) · Ö-04, Ö-05 → F2 borcu (W82) · K-01, K-02, K-03 → belge, `web1/o5-kapanis` (K-03 eşik ↔ token eşlemesi F2 borcu) · K-04 → W63.

Aşağıda koşumların tam metni sırayla yer alır.

---

# WEB-1 (F1) — Codex nihai kapı hükmü

- **Hüküm: UYGUN DEĞİL.** Üye merceğinin liste süzmesi eksik; istemci onayları ve çok adımlı yazmalar ilk eylemin kapsam/oturum yaşam döngüsünü bütünüyle korumuyor. W41 taşıma düzeltmesi ve W48 entegrasyonu anlamlı ilerleme sağlıyor; aşağıdaki engelleyiciler ve nihai görsel kabul kapanmadan F2 açılmamalı.
- **Denetlenen dal/HEAD:** `main` — `67d31b4b0c52e9f4f6874b8f7c95e20600cf3baf`.
- **PR’lar:** #32 W41, #33 W41b, #34 W42, #35 W41c, #36 W43, #37 W44, #38 W45, #39 W51, #40 W46, #41 W47, #42 W48, #43 W61. Birleşmeler yerel Git geçmişinde doğrulandı.
- **Okuma kapsamı:** Sayımı yapılan work/home + iki ekran grubu + WEB-1 yürütme kümesi **241 dosya / 21.946 satır**; bunlar üzerinde statik tarama ve aşağıdaki ayrıntılı örneklem yapıldı. Ayrıca ortak altyapı, CI/dağıtım ve pinli backend belgeleri okundu; bunlar 241’e dahil değil.
- **Komutlar:** İlk eylem `git rev-parse HEAD`, `git log --oneline -20`, `git status --short`; devamında `git log --merges`, `git diff 2455cd7..HEAD -- eslint.config.js`, `git show`, `git branch --show-current`, `rg`, `nl -ba`, `sed`, `head`, `tail`, `cat`, `ls`, salt okunur `python3 -c` kaynak sayımı/taraması.
- **Sınırlar:** Dosya değiştirilmedi; başlangıç ve bitiş çalışma ağacı temiz. Test/lint/build/audit çalıştırılmadı; CI kanıtının koordinatörde bulunduğu **kullanıcı beyanıdır**. Test hükümleri kaynak tasarımına ilişkindir.
- **Sözleşme:** `v0.11.0-api` → `201689ac72ffcb0c128f163088c8ddf80e9dd7cd`, `git show` ile okundu. Aşağıdaki `BE/spec` ve `BE/akış` atıfları bu etiketin `docs/api/openapi.yaml` ve `istemci-akislari.md` dosyalarıdır.
- **Yönetim yolu:** `../program/` bulunamadı; `../nizam.io--program/program/{DURUM,README}.md` okundu. Aktif WEB-1 FNN kaydı bu dizinde doğrulanamadı.

## Madde hükümleri (1–18)

`W = src/modules/work`, `H = src/modules/home`, `S = src/shared`. **UYGUN**, aksi belirtilmedikçe kaynak incelemesi hükmüdür.

| Madde | Hüküm | Kanıt | Öneri |
|---|---|---|---|
| **1. K3 tek uç** | **UYGUN** | `W/api/fetchers.ts:14` tek `/v1/program/work-items`, tek `department_id`; `W/api/queries.ts:43` imleçli sorgu; `W/components/list/row-view.ts:48,67` talep ve alt görev sayacı yanıttan. | Bu mimariyi koruyun. K3’ün ayrıca istediği Üye merceği süzmesi E-01’de eksik. |
| **2. P4 / liste sınırları** | **UYGUN DEĞİL** | `W/pages/tasks/TasksPager.vue:20` ve `TasksStatusBar.vue:75` kısmi küme etiketli; `rows.ts:30,75` yerel arama/sıralama. Ancak `RequestBand.vue:14,21` tamamlanma bilgisi almadan kesin görünümlü sayı basıyor. | Ö-01: talep bandına da kısmi küme etiketini bağlayın. |
| **3. P5 durum/kanıt/talep** | **UYGUN** | `W/model/types.ts:42,45` kapalı etiket kümesi ve beş durum; `rows.ts:42` sunucu `is_overdue`; `FileUploadDialog.vue:34,45,95` etiketsiz gönderim yok; `SubtaskMenu.vue:63` BE-006 statik; `semantics.test.ts:88` F3/F5 beklentileri. | “Gün kaldı” hesabını gecikme hesabıyla karıştırmayın: `row-view.ts:37` kabul tablosunun izin verdiği kalan-gün hesabıdır. |
| **4. K5 yazma tüketimi** | **UYGUN DEĞİL** | `W/api/{items,subtasks,files,notes}.ts` korumalı yazmaları kullanıyor; `S/http/mutation/revisions.ts:22` doğru gruplar; `ConflictDialog.vue:32` seçimler boş; `use-status-transition.ts:91` açık alt görev onayı. Ancak onay/ardıl adım yaşam döngüsü E-02/E-03’te açık. | İlk kullanıcı eyleminin kapsam ve oturum neslini tüm zincire taşıyın. |
| **5. Kapsam güvenliği** | **UYGUN DEĞİL** | `S/http/client.ts:80` açık kapsam depodan önce gelir; `W/api/scope-race.test.ts:59` kapı ile taşıma arasını gerçekten değiştirir. `S/scope/lifecycle.ts:37` sorguları kaldırır; `use-tasks-url.ts:36` paneli sıfırlar. Ortak onay kuyruğu bunlara bağlı değil. | W41 taşıma devri kapandı; E-02/E-03 tüketici açıklarını kapatın. |
| **6. K1 / capabilities** | **UYGUN** | `W/model/capabilities.ts:97` ve devamı saf olgular; not yazma `:122`, yükleme `:145` yöneticiliği baskın reddeder. Atama `:102` koordinatör olgusuna bağlı; `eslint.config.js:328` rol karşılaştırma kuralı. | **Sözleşme ayrımı:** salt yönetici atama yapamaz; yönetici+koordinatör yapabilir (`BE/akış:140`). Bunu yanlışlıkla tüm yöneticilere yasaklamayın. Persona testindeki erişim açığı Ö-02. |
| **7. K13 / statik öğeler** | **UYGUN** | Kullanılan BE-001/003/005/006/007/008/010/038/040 kayıtları `docs/backend-eksikleri/kayit.md:8` ve devamında açık. `W/components/detail/format.ts:128` çizgiyi gerçek tarihlerden üretir; `H/components/RecentActivity.vue:29` nötrdür. | BE-004 ve BE-091’in bağımlılık olması, mutlaka ayrı stub çağrısı gerektirmez; kayıt/metin tutarlılığı K-02’de temizlenmeli. |
| **8. P6 sade ana sayfa** | **UYGUN** | `H/pages/HomePage.vue:67` yalnız dört F1 bölgesi; `H/model/capabilities.ts:42` yönetici+Admin kapısı; `HomePage.vue:58`, `model/kpi.ts:70` Üye merceğinde atanan süzmesi; `TeamKpis.vue:38` kısmi etiket. | Görev listesiyle aynı mercek davranışını sağlayın; E-01. |
| **9. Dosya / güvenlik / CSP** | **DOĞRULANAMADI** | `download.ts:13` yalnız göreli bilet yolu; `:24` geçici bağlantı `finally` ile kaldırılır. `api/files.ts:85` `gcTime:0`; `use-file-actions.ts:50` reset. Storage taraması yalnız adapter erişimi gösterdi; `api-error.ts:99` sunucu mesajını atar. `KpiCard.vue:47` dinamik stilin gerçek CSP tanığı yok. | Normal kaynak yolu olumlu. Gerçek indirme ve dolu KPI’yı üretim CSP’sinde doğrulayın; Ö-03. |
| **10. K11 formlar** | **UYGUN** | Paket importları yalnız `W/components/forms/`; `new-task-schema.ts:102` gövdeyi yedi sözleşme alanından kurar; `:116` alan eşlemesi, `use-new-task-form.ts:150` ilgili alana hata. `.github/workflows/ci.yml:102` `pnpm audit --prod`. | `departmentId` başlık, `extra` ikinci işlem girdisidir; uydurma API alanı değildir. Audit sonucu bağımsız doğrulanmadı. |
| **11. W48 entegrasyon** | **UYGUN DEĞİL** | `integration/events.test.ts:53,87,127,170,191` istenen beş olay zincirini gerçek bileşenlerle kuruyor. Ancak `harness.ts:144` özel router, `:127` taklit kabuk; `entry.test.ts:31` boş ana sayfadan programatik geçiş. | Tam üretim router/kabuk ve gerçek ana sayfa tıklamasını ekleyin; Ö-02. Panel landmark düzeltmeleri `semantics.test.ts:70` ile kaynakta korunmuş. |
| **12. K12 / mimari** | **UYGUN** | İstenen ESLint diff’i boş; `eslint.config.js:181` 250/400, 60, 12; yeni istisna yok. En uzun work/home Vue dosyası 232 satır. Home→work importlarının tamamı `public` üzerinden. `px-scope.test.ts:29` medya koşullarını istisna tutuyor; `mergeLocaleMessage` taraması boş. | “Px yalnız üretilmiş dosyada” ifadesine medya koşulu istisnasını ekleyin. Tüm depo için mutlak döngüsüzlük doğrulanmadı. |
| **13. Kabul tabloları** | **UYGUN DEĞİL** | Aşağıdaki 20 E-kimliği örneklemi; özellikle E-03-13 etiket eksik, E-03-64 kapsam değişimi güvenli değil. | E-01/E-02/Ö-01’i kapatın; kalan örneklemde ret/öneri kapsamını aşan kesin bir uygulama saptanmadı. |
| **14. Sözleşme uydurma** | **UYGUN** | Aşağıdaki pinli spec karşılaştırmasında uçlar, alanlar, gövdeler ve hata kodları örtüşüyor. `W/model/types.ts:11` sunucu tipleri üretilmiş şemadan. | Pin yükseltmeden yeni backend yetkilerini bu sürüme taşımayın. |
| **15. Test niteliği** | **DOĞRULANAMADI** | Work 91, home 15 test dosyası; doğrudan `it/test(...)` çağrı yerleri 426+50. W48: 5 dosya / 19 test bildirimi; depo toplamı 214 birim test dosyası. `integration/harness.ts:166` gerçek sıfır süreli zamanlayıcı kullanıyor. | Bunlar koşmuş test sayısı veya kapsam yüzdesi değildir. Ö-04: beklemeleri koşul/olay tabanlı yapın, yük altında CI süresini kaydedin. |
| **16. F0 devir kapanışı** | **DOĞRULANAMADI** | W41 yarış düzeltmesi mevcut. W61 fontlar `fonts.css:8`; token taraması `px-scope.test.ts:32`; CI metni `ci.yml:64`; kardeş bayrak testi `auth-session.test.ts:72`; kontrollü kanal `:31`; avatar `program-avatar.ts:93`; zil `topbar.css:148`; giriş `SessionPage.vue:14`. | Kod borçlarının çoğu kapanmış. Açık/koyu × genişlik görsel kabulü ve 390 px taşma E-04 nedeniyle kapanmış sayılamaz. |
| **17. Bilerek yapılmayanlar** | **UYGUN DEĞİL** | Sunucu sırası `rows.ts:76`, KPI’nın ek sayfa çekmemesi `TeamKpis.vue:18` kabul edilebilir. `narrow-nav.ts:17` yalnız aç/kapat yönetiyor; odak/kaydırma davranışı yok. O5 `oturum-5-kapanis.md:15` gerçek e2e ve görsel kabul istiyor. | Sayfalama/sıralama sınırları kabul; kaplama erişilebilirliği Ö-05, sahte yanıtların tam kabul yerine geçirilmesi E-04. |
| **18. CSS katman çözümü** | **DOĞRULANAMADI** | `index.html:7` ilk stil; `public/layers.css:8` sıra; `layers.test.ts:17,28` kaynak koruması; `e2e/layers.spec.ts:15,22` derlenmiş belge/sunulan CSS; `smoke.spec.ts:49` hesaplanmış stil. `Caddyfile:48,60`, `Dockerfile:32` dağıtım uyumlu. | Çözüm kaynakta sağlam; gerçek imaj/dev/üretim koşumu doğrulanmadı. Ö-03’teki kapıyı ekleyin. |

**13 için kabul tablosu örneklemi — 20 E-kimliği**

| E-kimliği | Sonuç | Kod kanıtı |
|---|---|---|
| E-03-07, E-03-08 | Beş durum ve kısmi sayaç etiketi mevcut. | `W/pages/tasks/TasksStatusBar.vue:27,75` |
| E-03-10 | Türkçe yerel arama ve 300 ms gecikme mevcut. | `W/components/list/rows.ts:20`; `TasksFilterBar.vue:30` |
| E-03-11 | Reddedilen canlı kişi süzgeci uygulanmamış; statik. | `TasksFilterBar.vue:77` |
| E-03-12 | Tek departman seçimi; Admin merceğiyle sınırlı. | `W/pages/TasksPage.vue:52,150`; `W/model/target.ts:33` |
| E-03-13 | **Eksik:** talep bandında kısmi küme etiketi yok. | `RequestBand.vue:14,21` |
| E-03-16 | Yerel sıralama var; öneri olan varsayılan bitiş sırası uygulanmamış. | `W/components/list/rows.ts:75` |
| E-03-21 | Alt görev sayacı liste yanıtından. | `W/components/list/row-view.ts:67` |
| E-03-23 | `iade_edildi` ayrı gösteriliyor. | `W/components/list/row-view.ts:11` |
| E-03-35 | Dosya yüklemede alt görev kimliği ve etiket taşınıyor. | `W/api/files.ts:40`; `FileUploadDialog.vue:103` |
| E-03-38, E-03-39 | Tam toplam taklidi yok; imleçli yükleme var. | `TasksPager.vue:20,30` |
| E-03-45 | Dört panel sekmesi ve sayaç bağlantıları mevcut. | `WorkDetailPanel.vue:48` |
| E-03-52 | Etiket seçilmeden yüklenmiyor. | `FileUploadDialog.vue:95` |
| E-03-57 | Form, oluşturma ve kısmi başarı akışı mevcut. | `new-task-schema.ts:102`; `use-new-task-form.ts:162` |
| E-03-64 | **Eksik:** onay kapsam değişimine bağlı iptal edilmiyor. | `DeleteTaskAction.vue:33`; `S/ui/confirm/use-confirm.ts:89` |
| E-01-01 | İlk sözcük önerisi yerine tam ad gösteriliyor. | `H/pages/HomePage.vue:70` |
| E-01-04 | Kaynağa göre KPI ve Üye merceği süzmesi mevcut. | `H/model/kpi.ts:53,64` |
| E-01-12 | F6 rapor bölgesi F1 şablonunda yok. | `H/pages/HomePage.vue:76` |
| E-01-14 | Reddedilen sahte işlem akışı yerine nötr yer tutucu. | `H/components/RecentActivity.vue:29` |

**14 için pinli sözleşme örneklemi — 20 karşılaştırma**

| Uç / alan | Pinli spec kanıtı | İstemci kanıtı / sonuç |
|---|---|---|
| `listProgramWorkItems`, `department_id`, `limit`, `cursor` | `BE/spec:5074,5110` | `W/api/fetchers.ts:21` — uygun |
| `WorkItem.status` beş değer | `BE/spec:2236` | `W/model/types.ts:45` — uygun |
| `program_id`, `department_id` | `BE/spec:2227` | `W/model/target.ts:16` — uygun |
| `assignees`, `assignee_account_ids` | `BE/spec:2239` | `rows.ts:26`; `H/model/kpi.ts:70` — uygun |
| `is_overdue`, `days_overdue` | `BE/spec:2262` | `row-view.ts:34` — uygun |
| `subtask_counts.total/done` | `BE/spec:2277,2585` | `row-view.ts:67` — uygun |
| `pending_date_request.new_end_on` | `BE/spec:2279,2299` | `row-view.ts:48` — uygun |
| `created_at`, `created_by_full_name` | `BE/spec:2302,2312` | `W/components/detail/format.ts:146`; panel veri modeli — uygun |
| Create: başlık/açıklama/öncelik | `BE/spec:2200` | `new-task-schema.ts:102` — uygun |
| Create: tek atanan/tarihler/kanıt bayrağı | `BE/spec:2208` | `new-task-schema.ts:106` — uygun |
| Görev düzenleme sürüm grupları | `BE/spec:2316`; `BE/akış:281` | `S/http/mutation/revisions.ts:22` — uygun |
| Alt görev `done` ve yönetim alanları | `BE/spec:2506,2525` | `W/api/subtasks.ts:65` — uygun |
| Alt görevde yalnız `done` için sürüm gerekmemesi | `BE/spec:2524` | `SUBTASK_REVISION_GROUPS`, `revisions.ts:36` — uygun |
| Not `content`, `edit_revision`, `expected_revision` | `BE/spec:2593,2621,2626` | `W/api/notes.ts:33,56` — uygun; gerçek şema adı `WorkItemNote` |
| `FileRecord.tag`, `subtask_id` | `BE/spec:2935` | `W/model/types.ts:42`; `api/files.ts:40` — uygun |
| Yükleme multipart `file`, query `tag` | `BE/spec:15414,15430` | `W/api/files.ts:24,40` — uygun |
| `addAssignments` S3, IK zorunluluğu yok | `BE/spec:13150` | `W/api/items.ts:50` — uygun |
| İndirme bileti kapsam başlıkları | `BE/spec:4321` | `W/api/files.ts:87` — uygun |
| Dashboard beş KPI alanı | `BE/spec:3211` | `H/model/kpi.ts:53` — uygun |
| `edit_conflict` 409, `subtasks_open` 409, `attachment_required` 422 | Pinli `error-codes.json:947,1071,895` | Çakışma diyaloğu ve `use-status-transition.ts:91` — kod/statü eşleşmesi uygun |

## Engelleyici bulgular (CX-F1-E-NN) — F2 açılmadan kapanmalı

### CX-F1-E-01 — Üye merceğinde görev listesi “bana atananlar”a indirgenmiyor

**Kanıt:** K3 bunu açıkça ister (`docs/architecture/yol-haritasi-web.md:19`). `W/pages/tasks/use-task-list.ts:39` yalnız talep ve arama, `:49` durum süzer; kullanıcı kimliği/atanma koşulu yok. `W/model/target.ts:37` Üye merceğinde yalnız departmanı daraltır.

**Sonuç:** Yönetici Üye merceğine geçtiğinde sunucunun yönetici yetkisiyle döndürdüğü diğer kişilerin görevleri listede kalır. Ana sayfa ise `H/model/kpi.ts:70` ile bunları çıkarır; KPI→liste davranışı ayrışır. Bu, sunucunun yetki genişletmesi değil, istemcinin kabul edilmiş mercek davranışını uygulamamasıdır.

**Düzeltme/kapanış:** Üye merceği temel kümesini atanma olgusuyla daraltın; satırlar ve ilgili sayaçlar aynı kümeyi kullansın. Yönetici+Üye ve birleşik rol için “benim/başkasının görevi” içeren gerçek bileşenli test ekleyin.

### CX-F1-E-02 — İstemci onayı kapsam/oturum değişiminden sonra yaşayabiliyor

**Kanıt:** `S/ui/confirm/use-confirm.ts:50` uygulama geneli kuyruk; `:89` kapsam/nesil kaydetmez. `AppShell.vue:62` host’u sürekli tutar; `S/scope/lifecycle.ts:95` yalnız sorguları temizler. `DeleteTaskAction.vue:35` eski görevi yakalar, `:43` onaydan **sonra** yeni mutasyon başlatır; hook `use-protected-mutation.ts:144` kapsam/nesli o anda alır.

**Kaynak akışından sonuç:** A’da açılan onay, kapsam B’ye geçtikten sonra kabul edilirse eski A hedefiyle yazma başlayabilir; motor bunu B anında oluşturulmuş yeni eylem sayar. Oturum sonu için de kuyruk temizliğinin üretim bağlantısı bulunamadı. Dosya/alt görev/not silmeleri aynı genel onay mekanizmasını tüketiyor.

**Düzeltme/kapanış:** Onayı ilk eylemin kapsamına ve oturum nesline bağlayın; kapsam/hesap değişimi ve bileşen sökülmesinde iptal edin. A→B ve çıkış→başka giriş sonrasında eski onaydan **sıfır yazma** çıktığını gerçek hook/HTTP zincirinde kanıtlayın.

### CX-F1-E-03 — Oluşturma sonrası ek atama ilk eylemin yaşam döngüsünü kaybediyor

**Kanıt:** `S/http/mutation/partial.ts:38` ilk yanıtı bekler, `:43` ardıl adımı koşar. `W/api/items.ts:85` ek atamayı yeni `assign.submit()` ile başlatır; hook yeni kapsam/nesil yakalar. İlk eylemin kapsam/nesli ikinci adıma aktarılmıyor. Retry sonrası yol da `use-new-task-form.ts:185` üzerinden aynı kalıpta.

**Kaynak akışından sonuç:** İlk oluşturma beklerken kapsam/oturum değişirse, geç gelen başarı ikinci yazmayı yeni bağlam altında başlatabilir. Hedef başlığının A kalması, ilk kullanıcı eyleminin artık geçerli olduğunu kanıtlamaz; geçersizleme de ikinci adımın yeni yakaladığı kapsama bağlanır.

**Düzeltme/kapanış:** Tüm bileşik işlem için başlangıç kapsam/nesil bileti kullanın. Değişimde ilk başarıyı koruyup ek atamayı durdurun ve kısmi sonucu bildirin; geciktirilmiş ilk yanıtla kapsam ve hesap değişimi testleri ekleyin.

### CX-F1-E-04 — Nihai görsel kabul kapanışı henüz doğrulanamıyor

**Kanıt:** O5 `docs/yurutme/web-1/oturum-5-kapanis.md:15` iki tema × 1440/1024/390 ve mercek turları ister. W61 kabulü `oturum-4-temizlik.md:30` görsel kanıt ister; `ilerleme.md:10`–`:18` hâlâ bekliyor/boş. Kullanıcı `/gorevler` 390 px taşmasını açık kusur olarak bildirdi; bu denetimde tarayıcıyla yeniden üretilmedi.

**Kapanış:** Taşmayı giderip son HEAD’e bağlı görsel kabul özetini ve CI kanıtını bağlayın. Sahte yanıtlarla yapılan görsel tur kabul edilebilir bir katmandır; gerçek backend e2e’sinin ve üretim imajı tanığının yerini tutmaz.

## Önemli bulgular (CX-F1-Ö-NN) — F2 içinde kapanabilir

### CX-F1-Ö-01 — Talep bandı kısmi sayımı kesinmiş gibi sunuyor

`RequestBand.vue:14` `complete/partial` almaz; `:21` sayı basar. Metin `S/i18n/tr/work.ts:50`: “N tarih değişikliği talebi onay bekliyor”. Sekmelerdeki ayrı etiket, her sayacın etiketlenmesi koşulunu bandın kendi yüzünde karşılamıyor. Banda aynı kısmi-küme bilgisi ve dolu/boş imleç testi ekleyin.

### CX-F1-Ö-02 — W48, tam uygulama entegrasyonu ve yetki reddi tanığı değil

`integration/harness.ts:146` gerçek `workRoutes` kullanıyor ancak üretim `createAppRouter` ve kabuğu kullanmıyor; `:130` yaşam döngüsünün bir kısmını yeniden kuruyor. `entry.test.ts:31` gerçek ana sayfa düğmesine basmıyor.

Ayrıca `personas.test.ts:133` atanmamış üyeyi **salt okunur panel** ile sınarken pinli `BE/akış:162` listede görünmeme ve ayrıntıda 403 ister. Sahte backend `harness.ts:50,54` bu yetkiyi uygulamıyor. Testi yetki düğmelerinin negatif testi olarak adlandırın; ayrıca gerçek 403/liste dışlama ve üretim kabuk/router senaryosu ekleyin.

### CX-F1-Ö-03 — CSS/CSP korumaları doğru yönde, üretim görsel kapısı dar

- İlk dış stil dosyası katman sırasını erkenden kurar: `index.html:7`, `public/layers.css:8`. `style-src 'self'` buna izin verir; nonce gerekmez (`deploy/Caddyfile:60`).
- Vite public dosyası imaja taşınır (`Dockerfile:32`); Caddy onu bir saat önbellekler (`Caddyfile:48`). Gelecekte sıra değişirse eski `/layers.css` bir saat yaşayabilir; yeniden doğrulanan önbellek veya sürümlü ad tercih edin.
- `layers.test.ts` kaynakta kaldırma/sıra sapmasını; `e2e/layers.spec.ts` derlenmiş bağlantı sırasını; `smoke.spec.ts:49` belirli preflight ezilmelerini yakalayacak anlamlı iddialar içeriyor. Negatif ters-çevirme koşumu bu denetimde yapılmadı.
- `e2e/csp-check.ts:36` politika başlığını preview yanıtına enjekte ediyor; gerçek Caddy tarayıcı tanığı değil. Smoke `:43` yalnız **font-src** ihlallerini reddediyor.
- `KpiCard.vue:47` nesne biçimli dinamik stil kullanıyor; yalnız `:style` görülmesi CSP ihlali kanıtı değildir. Dolu KPI’nın hesaplanmış çubuk genişliği ve tüm CSP ihlalleri gerçek tarayıcıda doğrulanamadı.

**Süreç çıkarımı:** Birleşmiş üretim paketinin görsel davranışını erken kontrol eden kapı eksik kalmış. F2’de her UI PR’ı/birleşmiş aday için üretim paketi üzerinde gerçek rota, hesaplanmış stil, yatay taşma ve iki tema kontrolü; faz sonunda da gerçek imaj tanığı zorunlu olmalı.

### CX-F1-Ö-04 — Test beklemeleri bütünüyle deterministik değil

W48 `harness.ts:159` “gerçek zamanlayıcı yok” diyor fakat `:166` `setTimeout(0)` kullanıyor; 80 tur ve üç boş turla yerleşme tahmini yapıyor. `KpiCard.test.ts:29`, `use-tasks-url.test.ts:51` de gerçek sıfır zamanlayıcı içeriyor. Gerçek titreme gözlenmedi; yük altında zaman aşımı riski ölçülmedi.

Açık olay/istek tamamlanma koşullarını bekleyin. `auth-session.test.ts:31` kontrollü Promise dönüşümü olumlu; `e2e/two-tabs.spec.ts:34` gerçek token ömrü beklemesi ayrı ve kabul edilmiş sınır.

### CX-F1-Ö-05 — Dar menünün odak ve kaydırma yaşam döngüsü eksik

`narrow-nav.ts:17` yalnız görünürlük yönetiyor; `AppShell.vue:49` perde ekliyor. Odak dönüşü, arka içeriğin klavye erişimi ve kaydırma kilidi bu uygulamada yok. F2’de dar menüyü erişilebilir kaplama davranışına tamamlayın; 390 px klavye turuyla doğrulayın.

## Küçük bulgular (CX-F1-K-NN)

- **CX-F1-K-01 — Kapanış kayıtları güncel değil.** `docs/yurutme/web-1/ilerleme.md:10` bütün uygulama oturumlarını bekliyor gösteriyor; `README.md:3` eski iskelet durumunda. PR/HEAD/kanıt bağlantılarını güncelleyin; bozuk `../program/` yönlendirmesini düzeltin.
- **CX-F1-K-02 — Alt belgelerde eski sözleşme anlatımı kalmış.** `03-gorevler-liste/backend.md:85` hâlâ iade sekmesi yok diyor; `sentez.md:19` `WorkItem.lateness` diyor, pinli spec alanı doğrudan `is_overdue` (`BE/spec:2262`). Kabul tablosu ve kod doğru yönde; alt metinleri uzlaştırın.
- **CX-F1-K-03 — Px kapısının adı kapsamından geniş.** `px-scope.test.ts:29` bütün medya koşullarını taramadan çıkarıyor; `AppShell.vue:87` gerçek `900px` içeriyor. Belgede istisnayı açık yazın ve medya eşiklerini token değerleriyle ayrıca eşleştirin.
- **CX-F1-K-04 — Bilet temizliği hata yolunda sertleştirilebilir.** `use-file-actions.ts:49` tüketim çağrısı istisna atarsa `:50` reset çalışmaz. `ticket.reset()` için `finally` kullanın. Normal tüketimde geçici DOM bağlantısı kaldırılıyor; “DOM’a hiç girmez” ifadesi `download.ts:29` nedeniyle doğru değil, **kalıcı kalmaz** denmeli.

## Kabul edilen bilerek-yapılmayanlar

- Varsayılan sıralamanın sunucu sırası olması: E-03-16 kararı ve `rows.ts:76` ile uyumlu.
- K/Ü KPI’nın sonraki sayfaları kendiliğinden çekmemesi: `TeamKpis.vue:18,38`; kısmi etiket koşuluyla kabul.
- `SendContext.scope` alanının henüz bulunmaması tek başına hata değil: mevcut W41 tüketicileri hedefi dondurulmuş değişkenlerden başlıklara taşıyor. **E-02/E-03 için erteleme gerekçesi olamaz.**
- Tarih talebi yazmaları/Zaman çizelgesi F3, Arşiv F5, tam ana sayfa F6 ertelemesi kabul; açıklamalı devre dışı/gizli davranış korunuyor.
- O5 görsel düzen karşılaştırmasının sabit sahte yanıtlarla yapılması kabul; gerçek backend/üretim imajı kabulünün yerine geçmesi kabul değil.
- Dar kaplamanın odak dönüşü/kaydırma kilidi eksikliği yalnız açık **F2 borcu** olarak kabul edilebilir; tamamlanmış erişilebilirlik kabulü değildir.
- `e2e/two-tabs.spec.ts` gerçek token süresi beklemesi kabul edilen e2e sınırıdır.

## F2 için riskler ve ön koşullar

1. **E-01–E-04 kapanmadan F2 açılmasın;** düzeltme HEAD’i, PR ve CI kanıtı eşleşsin.
2. Organizasyonun `confirmation_required` akışları başlamadan ortak onay kuyruğu kapsam/hesap yaşam döngüsüne bağlansın.
3. Oluştur+bağla/üyelik gibi çok adımlı işlemler ilk eylemin kapsamını ve neslini korusun; kısmi başarı kaybolmasın.
4. Üye merceği süzmesi liste, KPI ve F2 kişisel takipte ortak davranış olsun.
5. Üretim router/kabuk üzerinden yetki kaybı, kapsam değişimi, çıkış ve bekleyen onay senaryoları eklensin.
6. Üretim paketi/imajında iki tema, 390/1024/1440 genişlik, yatay taşma ve tüm CSP ihlalleri kapısı kurulsun.
7. F2’nin BE eksikleri ve kabul tabloları O5 planındaki şekilde hazırlanıp kayda bağlansın (`oturum-5-kapanis.md:13`).
8. Yönetim menüsü olgu kapısının capability katmanına taşınması F0’dan kalan F2 borcu olarak korunsun (`WEB-0-codex.md:310`).
9. Backend `v0.12.0-api` bilgisi bu denetimin pinini değiştirmez; yükseltme ayrı sözleşme/yetki incelemesiyle yapılsın.
10. Test sayısı başarı veya kapsam kanıtı yerine kullanılmasın; nihai koşum sonuçları ve gerçek görsel kabul ayrı kaydedilsin.

---

---

# WEB-1 (F1) — Codex nihai kapı hükmü — 2. koşum

- **Hüküm: UYGUN DEĞİL.** E-01 ve oluşturma → ek atama kapsamındaki E-03 kaynak incelemesinde kapanmış; E-04 düzeltmeleri olumlu, kabul kanıtının kayda bağlanması bekliyor. E-02’de `subtasks_open` yaşam döngüsü ve kabul → mutasyon başlangıcı arasındaki bağlam boşluğu sürdüğü için F2 kapısı açılamaz.
- **Denetlenen:** `main`, `45957f96aa88044496238446a52e38821bc4bedf`; başlangıç ve bitiş çalışma ağacı temiz.
- **İlk komutlar:** `git rev-parse HEAD`, `git log --oneline -12`, `git status --short`.
- **Diğer komutlar:** `git branch --show-current`, `git diff 67d31b4..HEAD -- eslint.config.js`, `git diff 67d31b4..HEAD --stat`, hedefli `git diff`, pinli sözleşme için `git show`, `rg`, `cat`, `nl -ba`, `sed`, `head`, `tail`.
- Dosya değiştirilmedi; test/lint/build çalıştırılmadı. Test değerlendirmeleri kaynak incelemesidir; tersine çevirme koşumu yapılmadı.
- CI yeşilliği, 53 senaryo / 96 görüntü ve yeniden ölçüm sonuçları **kullanıcı beyanıdır**; dış kanıtlar bağımsız doğrulanmadı.
- İlk koşumun tam metni okundu. `../program/` yok; `../nizam.io--program/program/{DURUM,README}.md` okundu, aktif WEB-1 FNN kaydı doğrulanamadı. Açık PR listesi doğrulanmadı; #44/#45 birleşmeleri yerel geçmişte görüldü.
- Aşağıda `W = src/modules/work`, `H = src/modules/home`, `S = src/shared`.

## E-01…E-04 kapanış tablosu

| Bulgu | Durum | Kanıt dosya:satır | Kalan risk |
|---|---|---|---|
| **E-01 — Üye merceği** | **Kapandı — kaynak düzeyinde** | `W/model/assignment.ts:14`; `W/pages/tasks/use-task-list.ts:50,60,68,79`; `W/pages/TasksPage.vue:78,80,209`; `H/model/kpi.ts:71` | İstemci yalnız yüklenen sayfaları süzer; sunucu imleci ve kısmi etiket korunmalı. |
| **E-02 — Onay yaşam döngüsü** | **Kapanmadı — engelleyici** | `S/ui/confirm/use-confirm.ts:133,148,158,206`; `W/components/forms/use-status-transition.ts:56,91,108` | `subtasks_open` onayı bileşen sahipliği olmadan açılıyor; geç yanıt yeni bağlamda onay doğurabiliyor. Genel kabul sonrası bağlam da mutasyona aktarılmıyor. |
| **E-03 — Oluştur → ek atama** | **Kapandı — kaynak düzeyinde** | `S/http/mutation/engine.ts:236,334,367`; `use-protected-mutation.ts:140,153`; `partial.ts:42`; `W/api/items.ts:80`; `W/components/forms/use-new-task-form.ts:188` | `context` türde isteğe bağlı; gelecekteki bileşik tüketiciler bağlamı atlamamalı. |
| **E-04 — Görsel kabul** | **Kod düzeltmeleri uygun; kanıt kapanışı koşullu** | `W/pages/tasks/tasks.css:42`; `W/components/subtasks/subtasks.css:73`; `W/components/forms/new-task-schema.ts:25`; not/alt görev akışları aşağıda | Gerçek ölçümler ve son adayla eşleşmeleri doğrulanmadı; kapanış PR’ında kalıcı kanıt özeti gerekli. |

**A — E-01 ayrıntısı**

- Satırlar, sekme sayaçları, talep sayısı/bandı, özet, sayfalayıcının yüklenen sayısı ve boş durum aynı **mercekle daraltılmış temel kümeden** türetiliyor. Sekmeler ayrıca arama/talep süzmesini, satırlar ayrıca seçili sekmeyi uygular; bunların sayılarının her durumda eşit olması beklenmez.
- KPI aynı `isAssignedTo` yüklemini `work/public.ts` üzerinden kullanıyor. Farklı sayıda sayfa yüklenmiş ekranların toplamlarının eşitliği garanti edilmez; kısmi etiket bu sınırı belirtir.
- K1/P1 ihlali saptanmadı: liste süzmesi ayrıntı yetkisine dönüşmemiş. Yönetici+Üye merceğinde başkasının görevine derin bağlantı açık kalıyor (`member-lens.test.ts:158`); salt atanmamış üyede liste dışlama ve 403 sınanıyor (`personas.test.ts:138`).
- Süzme kaldırılırsa yönetici fikstüründeki `o1/o2` satırları geri gelir; `member-lens.test.ts:120,121,125,151,172` beklentileri kaynak mantığı gereği bozulur. Bu, sunucunun zaten süzdüğü bir fikstüre dayanan etkisiz test değildir; gerçek koşum doğrulanmadı.
- Pinli `openapi.yaml:5074` yalnız `department_id`, `limit`, `cursor` tanımlar; yeni sunucu süzgeci uydurulmamış.

**B — E-02 ayrıntısı ve gerekli düzeltme**

- Görev/alt görev/dosya/not silme yolları `useConfirm()` çağrısını kurulum sırasında yapıyor: sırasıyla `DeleteTaskAction.vue:27`, `use-subtask-edit.ts:131`, `use-file-actions.ts:31`, `use-note-actions.ts:149`.
- Ortak katman kapsam+nesil+hesap yakalıyor; bekleyen onayı kapsam/oturum değişiminde ve sahibinin sökülmesinde iptal ediyor. Bayat kabul kontrolü de var (`use-confirm.ts:70,79,87,137,209`).
- **Eksik yol:** `confirmCloseSubtasks()` içindeki `useConfirm()` ilk isteğin `await` dönüşünden sonra çağrılıyor (`use-status-transition.ts:57,92,114`). Bu anda aktif Vue etki kapsamı yok; `ownedOpeners()` sahiplik kaydetmiyor (`use-confirm.ts:207`). Panel aynı kapsamda kapatılsa bile onay yaşayabilir ve eski göreve ikinci yazma başlayabilir.
- **Geç yanıt boşluğu:** İlk geçiş A’da gönderilip B’ye geçildikten sonra `work.subtasks_open` gelirse onay **B bağlamını** yakalar. Kabulde `send(current, …)` eski A hedefini yeni mutasyon bağlamıyla gönderir (`use-status-transition.ts:92,109`); ilk eylem bağı korunmaz.
- **Kabul boşluğu:** `accept()` geçerliliği denetledikten sonra `busy=true` yapıp `await entry.onAccept()` bekler. Bu arada kapsam değişirse `sweep/cancel` busy girdiyi atlar; ardından `true` çözülür ve silme tüketicisi güncel bağlamla yeni mutasyon kurar (`use-confirm.ts:137–160`; `DeleteTaskAction.vue:43`). Bu, kaynakta kurulabilen yarış sıralamasıdır; koşumla yeniden üretilmedi.
- Başlamış HTTP isteğini busy durumda geriye dönük iptal etmemek kabul edilebilir. **Henüz başlamamış yazmanın eski onayla yeni bağlamda başlaması kabul edilemez.**
- `confirmImpact` ilk eylemin kapsam/neslini motorun `outcome.confirm()` kapanımıyla koruyor (`engine.ts:278`); üretim tüketicisi taramada bulunmadı. Genel kuyruk ve kapsam iptali testi mevcut (`use-confirm.test.ts:312`).
- Kapanış için onayı kurulumda sahiplenin; ilk geçiş bağlamını geç yanıt/onaylı tekrar boyunca taşıyın; genel onayın bağlamını mutasyon başlangıcına kadar doğrulayın. Sökülme, gecikmiş 409 sonrası A→B/çıkış ve kabul ile gönderim arasındaki değişim için **sıfır ikinci yazma** testleri eklenmeli.

**C — E-03 ayrıntısı**

- İlk gönderim bağlamı yakalanıyor; otomatik tekrar ve manuel retry aynı eylemi koruyor; başarı bağlamı ardıl adıma aktarılıyor. Motor her gönderim öncesi kapsam/nesil denetliyor.
- A→B’de ek atama sıfır, ilk başarı korunmuş kısmi sonuç ve yalnız A geçersizlemesi açıkça sınanıyor (`items.test.ts:190,208–210`). Çıkış→başka hesap ve değişmeyen bağlam testleri de var (`:213,233`); manuel retry yolu `use-new-task-form.test.ts:229`.
- API genişletmesi geriye uyumlu: ikinci `submit` argümanı ve başarıdaki `context` isteğe bağlı. Mevcut tek argümanlı tüketicilerde kaynak düzeyinde kırılma görülmedi; derleme çalıştırılmadı.
- **`created(item)` B’de çağrılması tek başına kusur değil:** ilk başarı gerçek ve korunmalı. Üretim alıcısı program/departman kapsamını denetleyerek panel açıyor (`use-new-task-entry.ts:46,54`); bu bildirim ek atama veya B önbelleğine yazma yapmıyor.

**D — E-04 ayrıntısı**

- Eylem grubunun sarılması/daralması ve checkbox sarmalayıcısının hücreyi doldurması ilgili CSS nedenlerini gideriyor. 390 px taşma=0 ve 18×18 sonuçları yalnız kullanıcı beyanıdır.
- `jitless` ilk şema oluşumundan önce ayarlanmış; zod kullanımı form katmanıyla sınırlı. CSP gevşetilmemiş.
- Notta aynı sürüm durduruluyor; diyalogsuz ikinci tekrar engelleniyor (`use-note-actions.ts:102,110,119`). Alt görevde eşdeğer koruma var (`use-subtask-edit.ts:93,151,154`).
- Sürekli ilerleyen sürümde **iki PATCH** sınırı testlerde açık (`use-note-actions.test.ts:99`; `use-subtask-edit.test.ts:130`). Kullanıcının yeni diyalog kararı sayacı sıfırlar; bu otomatik sonsuz döngü değildir.
- `rg` ile `resolveConflict`, `retry`, `saveNote`, `conflict.resolve`, `resolveDraft` zincirleri tarandı. İncelenen zincirlerde başka sınırsız **otomatik** tekrar bulunmadı; motor tek tekrar, sorgu tekrarı en çok iki (`engine.ts:334`; `W/api/http.ts:29`).
- Sahte yanıtlı üretim görsel turu + gerçek backend CI dumanı **F1 için kabul edilebilir katmanlı kanıttır**; aynı senaryoların tamamını gerçek backend ile yeniden çekmek şart değil.
- Ancak kapanışta aday SHA’sı, görsel matris/yeniden ölçüm özeti, CI run/artefakt bağlantıları ve gerçek **web imajı** işinin sonucu bağlanmalı (`ci.yml:125,129,148`). Mevcut imaj kontrolü HTTP/CSP/nonce tanığıdır; tarayıcı görsel tanığı değildir (`deploy/check-image.sh:40`).

## Ö/K bulguları durumu

| Bulgu | Durum | Kanıt / sınır |
|---|---|---|
| **Ö-01** | **Kapandı** | `RequestBand.vue:28` kısmi etiketi; `TasksPage.vue:159` bağlantısı. |
| **Ö-02** | **Kısmen kapandı; kalanı F2 borcu kabul** | Görünürlük/403 ve gerçek ana sayfa tıklaması düzeldi (`harness.ts:58`; `entry.test.ts:47`). Üretim router/kabuk hâlâ yok (`harness.ts:177,194`); test F2’de `app` düzeyine taşınabilir. |
| **Ö-03** | **Kısmen kapandı; kalanı F2 borcu kabul** | `/layers.css` no-cache; bütün CSP ihlalleri denetleniyor. Preview’a politika enjekte ediliyor (`e2e/csp-check.ts:46`); gerçek Caddy tarayıcı kabulü değil. |
| **Ö-04** | **F2 borcu kabul** | Tahmini yerleşme ve gerçek `setTimeout(0)` sürüyor (`harness.ts:208,216`); “gerçek zamanlayıcı yok” yorumu yanlış. |
| **Ö-05** | **F2 borcu kabul** | Dar menü odak dönüşü/arka içeriği etkisizleştirme/kaydırma kilidi yok (`src/app/shell/narrow-nav.ts:17`). |
| **K-01/K-02/K-03** | **Kapanış PR’ında kapanmalı** | İlerleme hâlâ bekliyor; README eski; `backend.md:85` ve `sentez.md:19` eski anlatımı taşıyor. Medya koşulu istisnası ve token eşleşmesi açık kayda girmeli; sonuncusu bu koşumda yeniden doğrulanamadı. |
| **K-04** | **Kapandı** | `use-file-actions.ts:50` bilet tüketimini `finally` ile temizliyor. |

## Regresyon örneklemi

- **K1/K3:** Yetki ve mercek ayrımı korunmuş; tek liste ucu, departman fan-out yok; pin değişmemiş (`v0.11.0-api`).
- **K5:** İlk bağlamla retry/ardıl adım ve A kapsamındaki geçersizleme uygun; **E-02 nedeniyle bütün yazma yaşam döngüsü uygun sayılamaz**.
- **K11:** vee-validate/zod form katmanında; jitless ayarı CSP ile uyumlu.
- **K12:** `git diff 67d31b4..HEAD -- eslint.config.js` **boş**; yeni lint istisnası yok. Lint başarısı bağımsız doğrulanmadı.
- **Güvenlik:** CSRF ve açık hedef kapsam başlıkları korunmuş (`S/http/client.ts:84,122`); storage taramasında yalnız tercih adapteri erişimi görüldü; desteklenmeyen API sürümü açık hata (`S/instance/store.ts:31`). Çerez/gerçek tarayıcı sonuçları CI beyanı sınırındadır.
- **Diff özeti:** **54 dosya, 1.481 ekleme, 145 silme**.

## Yeni bulgular

- Yeni engelleyici kimlik açılmadı: yukarıdaki onay açıkları **CX-F1-E-02’nin kapanmamış kapsamıdır**.
- **CX-F1-Ö-06 — Dumanın ana sayfa CSP kapsamı olduğundan geniş anlatılıyor.** `smoke.spec.ts:84` giriş sonrası rotanın `/oturum` olduğunu doğruluyor; önceki ihlal kontrolünü `/` diye etiketlemek dolu ana sayfa/KPI tanığı yapmaz. F2’de gerçek `/` gezinmesi, `home-page` ve dolu KPI beklentisi eklenmeli; kapanış kaydı mevcut testi doğru adlandırmalı.

## F2’ye devir: kabul edilen borçlar ve ön koşullar

1. **F2 ön koşulu:** E-02 kod ve sıfır-yazma testleriyle kapanmalı; belge düzeltmesi olarak ertelenemez.
2. **Kapanış PR’ı:** K-01…K-03, E-04 kanıt özeti, aday SHA/CI/imaj eşleşmesi ve bu hüküm kayda bağlanmalı.
3. **F2 içinde:** Üretim router/AppShell ile kapsam, yetki kaybı, çıkış ve onay entegrasyonu; modül sınırına yeni istisna eklenmeden.
4. **F2 içinde:** Gerçek ana sayfa/dolu KPI CSP testi, üretim paketi görsel kapısı ve gerçek Caddy üzerinde tarayıcı tanığı.
5. **F2 içinde:** Koşul/olay temelli test beklemeleri; dar menünün odak ve kaydırma yaşam döngüsü.
6. Yönetim capability taşıması ve F2 kabul/BE devirleri hedef işlere yazılmalı (`oturum-5-kapanis.md:13,14`). Pin yükseltmesi ayrı sözleşme incelemesi olarak kalmalı.

<!-- TUR 3 TAM METNİ BURAYA -->
