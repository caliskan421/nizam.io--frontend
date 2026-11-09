# WEB-2 (F2) — Codex nihai kapı hükmü

**Son hüküm: KOŞULLU UYGUN** — 2. koşum, kapanış dalı `web2/o5-kapanis` @ `8a282e8` (`main` @ `d52510c`, #51–#63 birleşik). Tek koşul (Ö-03 kayıt cümlesi) bu PR'da kapatıldı; F3 devirleri `docs/yurutme/web-3/`.
Koşullar: CX-F2-Ö-01…Ö-03 F3 açılmadan / F3 içinde kapatılır; "Ö-07/Ö-08 tamamen kapandı" ve "bütün görsel kusurlar kapandı" ifadeleri kanıt sınırına göre düzeltilir (bu PR).
Denetçi: Codex, `codex exec -s read-only`, tek ve salt okunur koşum; test/lint/build çalıştırmadı, dosya değiştirmedi.
Kayıt: yürütme `docs/yurutme/web-2/ilerleme.md` (O5); görsel tanık `docs/yurutme/web-2/dogrulama-F2.md`; yönetim deposu satırı kapanışta.

| Koşum | Denetlenen dal/HEAD | Hüküm | Açılan bulgular | Düzeltme |
|---|---|---|---|---|
| 1 | kapanış dalı `9a18ee8` (main `d036208`, #51–#62 birleşik) | **KOŞULLU UYGUN** | Engelleyici yok; CX-F2-Ö-01 (Ö-08 okuyucu katmanı: organizasyon `queryFn`'leri ve kabuk `department-code.ts` `sessionBound`/signal'siz) · Ö-02 (program `redactPassword` sökülmüş sahip işaretini düşürüyor) · Ö-03 (görsel tanık `7ee18fe` imajı; "hepsi kapandı" K-7/K-8 ile çelişiyor) · K-01 (`useToast` kurulum istisnaları) · K-02 (E-05-05 satırı, BE-036(4) sıralama değer kümesi, `reports.ts` yorumu) · K-03 (kesilmiş liste `complete`) · K-04 (Ö-07 metninde önbellek uzlaştırması ayrımı) | Ö-01, Ö-02, K-01, K-03 (ve K-02'nin `reports.ts` yorumu) → **W84** (PR #63 `d52510c`) · Ö-03 → bu PR belge düzeltmesi + #62 sonrası hedefli gerçek imaj tanığı (gerçek imaj yeniden tanığı (adım 3b): main `d036208` → `nizamio-web-o5f2b:d036208` + Caddy kenarı + gerçek backend; 52 ölçüm (390/1024/1440 × koyu/açık) taşma 0, CSP 0, `pageerror` 0; K-1 zorunlu parola akışı uçtan uca (yanlış mevcut parolada `POST /v1/auth/password` 1, refresh 0; parolalar DOM/depo/önbellek/adres çubuğunda yok), K-2 üç formda 6/6, K-3 390 px kırpılma 0, K-6 uyarı görünüyor (`page.route` başlığıyla), K-4/K-5 doğrulandı; yeni kusur yok — ayrıntı `dogrulama-F2.md` §9) · K-02, K-04 → bu PR |
| 2 | kapanış dalı `8a282e8` (main `d52510c`, #51–#63 birleşik) | **KOŞULLU UYGUN** | Ö-01, Ö-02, K-01…K-04 kaynakta kapandı; Ö-03 koşullu — `ilerleme.md` adım 3 paragrafı eski tanığı güncel durum gibi anlatıyordu; yeni işlevsel bulgu yok | kayıt cümlesi bu PR'da düzeltildi; F3 devirleri W97 (11)–(15), ürün/tasarım kararları `web-3/ilerleme.md` |

Düzeltme planı (koordinatör, 2026-11-10): **Ö-01/Ö-02/K-01/K-03 kod → W84** (PR #63 `d52510c`): organizasyon okuyucuları (`users.ts`, `reports.ts`, `departments.ts`, `members.ts`) ve kabuk `department-code.ts` `sessionBound` + signal, gecikmiş GET/tekrar senaryoları ve yeni hesabın olumlu doğrulaması; `program/api/programs.ts` `redactPassword` `isDetached/markDetached` kalıbıyla; ortak yardımcıların `useToast` istisnası (setup'ta yakalanan bildirici ya da açık belge); `complete` hesabına `!truncated`. **Ö-03 → bu PR:** `ilerleme.md` adım 3 paragrafı kusur bazlı tabloya çevrildi (K-1…K-6 #62, K-7/K-8 F3 W97'ye devredildi); #62 sonrası etkilenen akışlar gerçek imajda yeniden tanıklanır → gerçek imaj yeniden tanığı (adım 3b): main `d036208` → `nizamio-web-o5f2b:d036208` + Caddy kenarı + gerçek backend; 52 ölçüm (390/1024/1440 × koyu/açık) taşma 0, CSP 0, `pageerror` 0; K-1 zorunlu parola akışı uçtan uca (yanlış mevcut parolada `POST /v1/auth/password` 1, refresh 0; parolalar DOM/depo/önbellek/adres çubuğunda yok), K-2 üç formda 6/6, K-3 390 px kırpılma 0, K-6 uyarı görünüyor (`page.route` başlığıyla), K-4/K-5 doğrulandı; yeni kusur yok — ayrıntı `dogrulama-F2.md` §9. **K-02, K-04 → bu PR:** E-05-05 satırı BE-107 ile daraltıldı; `kayit.md` BE-036 madde 4 ve `rapor-F2.md`'ye `listUsers` sıralama değer kümesi notu; `ortak-kurallar.md` §7 Ö-07 metninde ortak önbellek uzlaştırması ile sökülmüş ekranın ek okuma/UI akışı/bildirim başlatmaması ayrıldı, pano `staleTime` periyodik yenileme değildir. "Ö-07/Ö-08 tamamen kapandı" ifadeleri "W82b ile kapandı; okuyucu katmanı W84 ile tamamlandı" biçimine çevrildi.

Aşağıda koşumların tam metni sırayla yer alır.

---

# WEB-2 (F2) — Codex nihai kapı hükmü

- **Hüküm: KOŞULLU UYGUN.** İncelenen kaynaklarda F3 açılmadan kapatılması zorunlu somut bir engelleyici saptamadım; yetki kapıları, temel yazma protokolü ve üretim bileşenleriyle entegrasyon düzeni uygundur. Koşul: aşağıdaki Ö-01–Ö-03 bulguları F3 içinde kapatılmalı; “Ö-07/Ö-08 tamamen kapandı” ve “bütün görsel kusurlar kapandı” ifadeleri mevcut kanıt sınırına göre düzeltilmelidir.
- **HEAD:** `9a18ee89da705a0249a2bd5c30d6a93112a2a0ef` · **Dal:** `web2/o5-kapanis`. Başlangıç ve bitiş `git status --short` çıktıları boş.
- **PR geçmişi:** #51 `f91f195`, #52 `f0453c5`, #53 `376b404`, #54 `981e6d5`, #55 `1d5359c`, #56 `7ea788a`, #57 `b0451e4`, #58 `a639d3f`, #59 `b1ac19c`, #60 `7ee18fe`, #61 `08e6956`, **#62 `d036208`**. #62, istemdeki teslim listesine ek olarak denetlenen HEAD’dedir. Kapanış dalındaki merge topolojisi nedeniyle #61/#62 ayrıca `origin/main --first-parent` üzerinden doğrulandı.
- **Okuma kapsamı:** Sayımı yapılan içerik taraması **333 dosya**; buna ek kök kurallar, kabul tabloları, önceki kapı, CI ve pinli backend kaynakları hedefli okundu. 333, tüm ek okumaların tekilleştirilmiş toplamı değildir.
- **Komutlar:** İlk işlem tam olarak `git rev-parse HEAD`, `git log --oneline -25`, `git status --short`; devamında `git log --first-parent`, `git show`, `git diff 86ee67e..HEAD -- eslint.config.js`, `rg`, `nl -ba`, `sed`, `cat` ve salt okunur Node içerik/şema çıkarımı kullanıldı. **Test/lint/build çalıştırılmadı; dosya değiştirilmedi.**
- **Kanıt sınırı:** #51–#61 CI yeşilliği ve 1639→2316 test sayısı **kullanıcı beyanıdır**. CI işlerinin tanımları okundu; koşum sonuçları ve #62’nin CI sonucu bağımsız doğrulanmadı.
- `../program/` bu worktree konumunda yok; yönetim belgeleri `../nizam.io--program/program/` altında bulundu. Backend karşılaştırması çalışma ağacına değil, **`v0.11.0-api` → `201689ac72ffcb0c128f163088c8ddf80e9dd7cd`** etiketine yapıldı.

Kanıt yollarını kısaltmak için: **O**=`src/modules/organization`, **P**=`src/modules/program`, **S**=`src/shared`, **I**=`src/app/__tests__/integration`, **Y2/Y3**=`docs/yurutme/web-2/` ve `web-3/`. Aşağıdaki UYGUN hükümleri kaynak incelemesidir; testlerin geçtiği iddiası değildir.

## Madde hükümleri (1–16)

| Madde | Hüküm | Kanıt | Öneri |
|---|---|---|---|
| **1. K1 / capabilities** | **UYGUN** | `O/model/capabilities.ts:75,83,159,168`; `P/model/capabilities.ts:27,31`; `O/routing/AdminGate.vue:19,32`; `P/routing/ProgramGate.vue:18,31`; `src/app/shell/side/menu.ts:27,50`. Dört kişilik senaryoları `I/personas.test.ts:77,95,127`. Yönetici olmayanın sayfa slotu kurulmadığından sayfanın yönetici okumaları başlamıyor. | Yetki hesabını aynı merkezde tutun. `UsersToolbar.vue:42` içindeki `'admin'` karşılaştırması yetki değil URL sekmesi/stub seçimi; bunu rol üzerinden yetkilendirme ihlali saymıyorum. |
| **2. K3 / liste sınırları** | **UYGUN** | `O/api/users.ts:93` sonsuz imleç; `O/components/users/use-users-view.ts:55` birbirini dışlayan kullanıcı/tek-birim kaynakları; `O/api/reports.ts:53` departman+pano birleşimi; `O/api/work.ts:17,33` tek görev ucu ve `assignedSubset`; `UsersTable.vue:152`, `detail/MembersPanel.vue:89` kesilme uyarıları. | K-03’teki kesilmiş küme için `complete` etiketini düzeltin. Departman fan-out’u saptanmadı; bütün programı sayfalamanın maliyetini izleyin. |
| **3. K5 yazma protokolü** | **UYGUN** | 14 organizasyon yazması `O/api/{departments,members,users}.ts` üzerinden `keyless.ts:61` → `useProtectedMutation`. `keyless.ts:72` bilinmeyen sonuçta `retry:null`; `members.ts:164,181,199` iki onay biçimi; `departments.ts:213,225` bileşik bağlam; `P/components/use-program-danger.ts:103,106` istemci onayı; `P/api/transfers.ts:66,69`, `P/components/use-transfer.ts:149,169` anahtar/fingerprint ve bayat önizlemede durma. | Sahip işaretinin programdaki kopyalanmasına ilişkin Ö-02’yi kapatın. “Her `useToast` yalnız setup’ta” ifadesinin ortak yardımcı istisnalarını belgeleyin. |
| **4. Ö-08 kapanışı** | **UYGUN DEĞİL** | `S/session/query-session.ts:54,76` iki koruma mevcut; `S/scope/lifecycle.ts:174` bağlanıyor; `standing.ts:74,78,82` signal taşıyor. Fakat `O/api/users.ts:106`, `reports.ts:38`, `departments.ts:60,82,104`, `members.ts:74` **sessionBound kullanmıyor**. Kabuk `department-code.ts:37` signal da iletmiyor. | Ö-01: eksik okuyucuları tamamlayın; tam kapanış iddiasını o zamana kadar daraltın. |
| **5. Ö-07 kapanışı** | **UYGUN DEĞİL** | `S/http/mutation/outcome.ts:199` işaret `WeakSet` içinde; organizasyon `keyless.ts:49` ve `users.ts:209` koruyor. **`P/api/programs.ts:108` yeni nesne üretirken korumuyor.** Mevcut tehlikeli işlem tüketicisi `use-program-danger.ts:88` ayrıca yaşam denetliyor. | Ö-02: `redactPassword` işareti korusun; işaretli başarısız/bilinmeyen sonuç için regresyon ekleyin. Mevcut tüketicide bildirim sızıntısı kanıtlanmadı. |
| **6. Güvenlik** | **DOĞRULANAMADI** | Kaynak korumaları uygun: `O/api/users.ts:218` gcTime/reset/redaksiyon; `TemporaryPasswordDialog.vue:47,71` alan temizliği; `S/session/auth-session.ts:70` bellek belirteci; `S/preferences/keys.ts:9` dört izinli anahtar; `S/errors/api-error.ts:99` sunucu mesajını atmıyor, normalizasyonda dışarıda bırakıyor. CSP `deploy/Caddyfile:67`; işler `.github/workflows/ci.yml:23,104,148`. | Kalıcı parola sızıntısı saptanmadı; çalışma zamanı yokluğu ve CI yeşilliği bu koşumda kanıtlanmadı. `TrackingCards.vue:45` ve `TrackingAside.vue:124` dinamik `:style` kullanıyor; “hiç satır içi stil yok” denemez, tek başına CSP ihlali de kanıtlamaz. |
| **7. K11 formlar** | **UYGUN** | `O/components/forms/department-schema.ts:51,75,88`; `user-schema.ts:29`; `form-kit.ts:25,60`; `P/model/program-form.ts:28,56,89`. Parola istemcide yalnız boşluk kontrolü, sunucu alan hataları `TemporaryPasswordDialog.vue:86`; program tehlike formunda `use-program-danger.ts:42`. | Form alanları spec’in tamamıyla birebir değildir; kabul edilen kullanımın altkümesidir. Örneğin katalog düzenlemede `name`, kullanıcı oluşturmada `company_admin`, aktarımda `reverses_transfer_id` sunulmuyor. Bunu sözleşme ihlali saymıyorum. Aktarım, ayrı zod formundan ziyade seçim/önizleme modeliyle korunuyor. |
| **8. Sözleşme uydurma** | **UYGUN** | Etiketten 26 uç karşılaştırıldı; aşağıdaki döküm. `O/api/users.ts:132` yalnız kodu tanıyor. Pinli `internal/composition/errors.go:149` kimliği **message** içine koyuyor; tipli sözleşme alanı yok. Sıralama pinli `usecase/usecase.go:286` içinde `name/created_at`, `asc/desc`. | BE-107 doğru. BE-036(4) kayıt metnine sıralama enum eksikliğini açıkça ekleyin; mevcut kayıt yalnız yetki/ekipsiz hesapları anlatıyor (`kayit.md:43`). |
| **9. K13 / P12–P17** | **UYGUN** | Stub taramasındaki 13 kimlik `kayit.md:8,12,18–25,49,53,114` üzerinde açık. `use-chip-actions.ts:79,89,99` ayrı anlık işlemler; `UserPanel.vue:26,85` toplu Kaydet yok; `CoordinatorshipGrid.vue:20` düz ızgara; `PersonalTracking.vue:212` nötr dosya/etkinlik içeriği; `DetailTabs.vue:58`, `ShortcutsCard.vue:63` faz notları. | Etkinlik için özel kabul satırı nötr yer tutucudur (`05 README:87`); genel “bütün faz dışı sekmeler disabled” yorumuyla değiştirmeyin. Yapı kopyası kurulmamış; görev aktarımı ayrı. |
| **10. Kabul tabloları** | **UYGUN** | Aşağıdaki 26 E-kimliği örneklemesi; PR atıfları git geçmişiyle uyumlu. E-05-05’in canlı aktarım anlatımı `05 README:129` tarafından BE-107 ile daraltılıyor. Ret/öneri olup etkinleştirilmiş kullanıcı eylemi örneklemde bulunmadı. | E-05-05 satırının kendisine de “teklif tanınır, aktarım devre dışı; BE-107” yazın. Genel O2b PR aralıklarını mümkünse tek PR’a indirin. |
| **11. Entegrasyon turu** | **UYGUN** | `I/harness.ts:141–153` gerçek session, App ve router; bileşen stub’u yok. `coordinatorships.test.ts:50,104,126,152,168`; `users.test.ts:119,152,184` TASLAK tüketicilerinin gerçek akışları. Üç düzeltme: `UserChip.test.ts:38`, `MemberRow.test.ts:23`, `PersonPicker.test.ts:65`. Bekleme `harness.ts:175,195`, `S/http/__tests__/settle.ts:44`. | Entegrasyon harness’inde çalışan `setTimeout(0)` döngüsü bulunmadı. Yük altında süreyi ölçüp dosyaları bölün; gerekirse yalnız ilgili entegrasyon grubuna gerekçeli timeout verin, sabit uyku eklemeyin. |
| **12. K12 / mimari** | **DOĞRULANAMADI** | İstenen ESLint diff’i boş; `eslint.config.js:181` eşikler değişmemiş. O/P kaynak Vue dosyalarının ham satır sayısı bile 250’yi aşmıyor. Taranan modüller arası importlar `public` üzerinden; modül→app eşleşmesi yok. `S/tokens/media-thresholds.test.ts:31,50` medya eşlemesi mevcut. | Fonksiyon 60/karmaşıklık 12 kapılarının geçtiği yalnız CI beyanı; tam dosya düzeyinde döngü grafiği bağımsız doğrulanmadı. Modül bağlantıları home→work, organization→home/work, program→organization/home/work yönünde. |
| **13. Koordinatör kararları** | **UYGUN** | `S/http/query-keys.ts:245,421` organizasyon yazmaları için program panosu; work ayrımı korunmuş. `work/pages/tasks/use-new-task-entry.ts:50,61` ön değer; `work/components/forms/use-task-departments.ts:32,39` yetkili hedef süzmesi. `S/ui/use-toast.ts:77` kısmi sonuç nesil kapısı. | Üç karar kabul edilebilir. URL ön değeri yetki vermiyor; form seçenekleri ve sunucu denetimi sürüyor. Pano politikası “60 saniyede kesin yenilenir” diye anlatılmamalı. |
| **14. Görsel doğrulama** | **DOĞRULANAMADI** | `Y2/dogrulama-F2.md:14–19,64–74` gerçek imaj/backend/yükleme-indirme tanığını **belgeliyor**. Fakat HEAD `7ee18fe` (`:3`); ham betik/PNG dizini bu worktree’de yok. `:124–127` sapmaları açıkça anlatıyor. | #62 sonrası etkilenen akışlara hedefli gerçek imaj tanığı ve kalıcı kanıt bağlantısı ekleyin. 264 satırın koordinatör/üye kısmı yönetim ekranı görüntüsü değil, beklenen rota reddidir (`:53`). |
| **15. Kapanış belgeleri** | **UYGUN DEĞİL** | PR/hash kayıtları uyumlu; F3 geçici kabul `03c README:25`, ürün kapısı `Y3/README.md:3,7` doğru. Ancak `Y2/ilerleme.md:91` “hepsi kapandı” derken aynı paragraf giriş doğrulaması/yan panelin dokunulmadığını söylüyor. K-7/K-8 `dogrulama-F2.md:103,104`; Y3 devir listesinde yok (`Y3/ilerleme.md:19–23`). | Ö-03: kusur bazında kapandı/ertelendi/yeniden doğrulanmadı durumu ve hedef iş ekleyin. |
| **16. Bilerek yapılmayanlar** | **UYGUN** | Çift bildirim, bağlı form ve timeout `Y3/oturum-3-entegrasyon.md:20`; ikon ve aktarım kaynağı `Y3/ilerleme.md:21`. Aktarım altkümesi `P/api/transfers.ts:42,67`; katalog eşlemesi `O/components/forms/department-create.ts:119`. | Aşağıdaki sınırlarla kabul. Bunları tamamlanmış özellik olarak göstermeyin; görsel kanıt eksikliği ayrı kalsın. |

**Pinli sözleşme örneklemesi — 26 uç.** Satırlar `git show v0.11.0-api:docs/api/openapi.yaml` çıktısınındır; backend çalışma ağacındaki satırlarla karıştırılmamalıdır.

| İstemci kanıtı | Pinli spec karşılığı |
|---|---|
| `O/api/users.ts:58,143,163,181,193,223` | `listUsers:6329`, `createUser:6400`, `updateUser:6496`, `deleteUser:6591`, `unlockAccount:6910`, `updateAccount:6748` |
| `O/api/departments.ts:55,79,139,156,175,191` | `listProgramDepartments:4902`, `listDepartments:5347`, `createDepartment:5407`, `linkDepartment:4983`, `renameDepartmentLink:5179`, `updateDepartment:5494` |
| `O/api/members.ts:44,132,145,159,177,195` | `listMembers:5649`, `assignMembership:5727`, `assignCoordinator:6079`, `updateMembershipRole:5825`, `removeMember:5919`, `removeCoordinator:6173` |
| `P/api/programs.ts:79,94,135,145` | `createProgram:4572`, `updateProgram:4658`, `deleteProgram:4745`, `resetProgram:7462` |
| `P/api/transfers.ts:55,65,96`; `O/api/reports.ts:26` | `previewTransfer:7553`, `transferWorkItems:7647`, `listTransfers:7748`, `reportDashboard:16778` |

Yöntem/yol, program başlığı, `confirm` konumu, gövde alanları, aktarım anahtarı ve fingerprint karşılaştırıldı. `X-Result-Truncated`, kullanıcı/departman/üye listelerinde tanımlı; **reportDashboard için tanımlı değil**. `listUsers.sort_by/sort_order` spec’te yalnız string; değer kümesi pinli backend kodundan doğrulandı. Varsayılanlar `created_at` ve `asc`; istemci açıkça `name` ve yön gönderiyor.

**Kabul örneklemesi — 26 E-kimliği.**

| E-kimlikleri | Kaynak karşılığı ve sonuç |
|---|---|
| E-05-04, 05 | `pages/users/UsersHead.vue:24,30`: dışa aktar devre dışı, oluştur eylemi canlı. |
| E-05-06, 07 | `pages/users/UsersToolbar.vue:39,61`: Admin sekmesi stub, 300 ms arama. |
| E-05-08, 10 | `components/users/use-users-view.ts:55,85`: tek birim kaynağı, yön değişimi. |
| E-05-23, 24 | `components/users/UsersTable.vue:138`: daha fazla yükle; numaralı/boyut seçicili sayfalayıcı yok. |
| E-05-28, 30 | `components/users/UserPanel.vue:74,87`: kapat ve kişisel takibe bağlantı. |
| E-05-32, 33 | `components/users/use-chip-actions.ts:79,89,99`: rol, kaldırma ve ekleme ayrı yazmalar. |
| E-05-37, 38 | `components/users/UserPanel.vue:61`: toplu Vazgeç/Kaydet yok. |
| E-05-46, 47 | `components/tracking/TrackingHead.vue:53,147`: F7/F6 açıklamalı devre dışı. |
| E-05-54, 55 | `components/tracking/PersonalTracking.vue:212`: nötr dosya/etkinlik içeriği. |
| E-08-24, 27 | `components/coordinatorships/CoordinatorshipGrid.vue:20`: grup başlıksız düz kartlar. |
| E-08-59, 79 | `components/detail/MembersPanel.vue:54,56,78`: gerçek ekip, ekleme, rol/kaldırma. |
| E-08-61, 62 | `components/detail/DetailTabs.vue:58`: faz dışı sekmeler ve faz notları. |
| E-08-86, 88 | `components/detail/ShortcutsCard.vue:28,40,63`: F3/F4 bağlantıları devre dışı. |

## Engelleyici bulgular (CX-F2-E-NN)

**Yok.** İncelenen eksik sarmalların yanında merkezi sorgu iptal/temizliği, program sonucunda ise tüketici yaşam denetimi bulunuyor. Bu kanıttan gerçekleşmiş hesaplar arası veri sızıntısı, yetkisiz yazma veya yeni yazmanın sahip söküldükten sonra başladığı sonucu çıkarılamaz.

## Önemli bulgular (CX-F2-Ö-NN)

**CX-F2-Ö-01 — Ö-08’in okuyucu katmanı eksik tamamlanmış.**

- Organizasyonun altı `queryFn` konumu sarmalsız: `users.ts:106`, `reports.ts:38`, `departments.ts:60,82,104`, `members.ts:74`. Kabuk `department-code.ts:37` ayrıca signal tüketmiyor. `badges.ts:67,102` de taramada kalan okuyucular; faz etkinliği ayrı değerlendirilmeli.
- Merkezi `bindSessionQueries` koruması var (`S/session/query-session.ts:89`); eksik olan belgede vaat edilen ikinci katmandır. Bu nedenle F3 içinde kapanabilir.
- **Kapanış:** okuyucuları `sessionBound` ile sarın, signal’i uç çağrısına taşıyın; organizasyon listesi ve kabuk departman kodu için gecikmiş GET/tekrar senaryolarını ekleyin.
- `session-isolation.test.ts:34` doğrudan MSW işleyicisi kullanımı testi anlamsızlaştırmıyor: gerçek oturum, yaşam döngüsü ve önbellek denetleniyor (`:197`). Ancak iptal, sahte fetch tarafından uygulanıyor; gerçek ağ/tarayıcı iptal davranışı kanıtı değildir. Ayrıca eski veri yokluğu kontrolü yeni `me` verisinin mutlaka varlığını şart koşmuyor (`:193`). Yeni hesabın verisinin olumlu doğrulamasını da ekleyin.

**CX-F2-Ö-02 — Program parola redaksiyonu sökülmüş sahip işaretini düşürüyor.**

- [programs.ts:108](/Users/dogancosman/Desktop/PROJELER/NewTeknofestApp/nizam.io--frontend-wt-o5f2/src/modules/program/api/programs.ts:108) nesneyi yayıp yenisini döndürüyor; `WeakSet` işareti kopyalanmaz (`S/http/mutation/outcome.ts:199`).
- Organizasyon `redactDraft` ve yeni zorunlu parola değişimi aynı sorunu doğru çözmüş (`O/api/users.ts:211`, `src/app/password/use-change-password.ts:40`).
- Mevcut `useProgramDanger.finish` ayrıca `dialog.alive()` denetliyor (`:88`); dolayısıyla bugün kullanıcıya geç bildirim çıktığı kanıtlanmış değil.
- **Kapanış:** aynı `isDetached/markDetached` kalıbını kullanın; redaksiyon sonrası `reachesOwner=false` ve bildirim yokluğunu sabitleyin.

**CX-F2-Ö-03 — Görsel kapanış kaydı son kodun tanığı değil; iki kusurun devri eksik.**

- Tanık `7ee18fe` imajına ait (`Y2/dogrulama-F2.md:3,15`); #62 sonrası parola/odak/dar ekran düzeltmelerinin gerçek imajda yeniden gözlendiğine dair kayıt yok.
- “Hepsi kapandı” ifadesi K-7/K-8 ile çelişiyor (`Y2/ilerleme.md:91`). K-7 giriş doğrulaması ve K-8 dar ekranda panel keşfedilebilirliği, okunan Y3 devir listesine taşınmamış.
- **Kapanış:** her kusura durum, düzeltme commit’i veya F3 işi ve yeniden doğrulama sonucu ekleyin. #62 sonrası yalnız etkilenen akışları gerçek imajda tekrar tanıklayın; kanıtı geçici scratchpad dışında saklayın.

## Küçük bulgular (CX-F2-K-NN)

- **CX-F2-K-01 — “useToast yalnız kurulumda” ifadesi mutlak doğru değil.** `S/ui/confirm/notify.ts:51` ve `use-confirm.ts:259` sonuç sonrası `useToast()` alıyor. Birincisi detached sonucu, ikincisi sahip yaşamını önceden denetliyor; bunları yeni kanıtlanmış bildirim sızıntısı saymıyorum. Ortak yardımcı istisnasını açık yazın veya setup’ta yakalanmış bildirici kullanın.
- **CX-F2-K-02 — Kabul/kayıt metni geriden geliyor.** E-05-05 satırı canlı aktarım vaat ediyor (`05 README:38`), dipnot doğru biçimde BE-107 ile devre dışı diyor (`:129`). BE-036(4) sıralama enum eksikliğini adlandırmıyor (`kayit.md:43`). `O/api/reports.ts:5` de artık yanlış olan “yazma sonrası geçersizleme yok” yorumunu taşıyor.
- **CX-F2-K-03 — Kesilmiş liste “complete” sayılabiliyor.** `use-users-view.ts:114` roster yanıtı varsa `complete=true`; `users.ts:122` yalnız imlece bakıyor. Kesilme uyarısı mevcut olsa da `UsersToolbar.vue:93` “yüklenen kayıtlar içinde” etiketini kaldırıyor. `complete` hesabına `!truncated` ekleyin veya etiket kararını iki bayrakla verin.
- **CX-F2-K-04 — Ö-07 metninde ekran tepkisi/önbellek uzlaştırması ayrımı eksik.** `ortak-kurallar.md:95` genel olarak “yeniden okuma üretmez” diyor; motor başarı geçersizlemesini sürdürüyor (`use-protected-mutation.ts:147,156`), anahtarsız belirsizlikte de yeniden okuma var (`O/api/keyless.ts:72`). Ortak önbellek uzlaştırmasının sürmesi ile sökülmüş ekranın ek okuma/UI akışı başlatmamasını ayrı tanımlayın.

## Kabul edilen bilerek-yapılmayanlar

- **Çip kaldırmada iki bildirim:** veri/yetki kusuru değil; W97(11)’e somut devredilmiş.
- **08 DepartmentForm bağlı kalırken kapsam değişiminde başarı bildirimi:** yeni yazma bağlam koruması sürüyor; bildirim politikasının netleştirilmesi W97(12)’de kabul edilebilir.
- **Türetilmiş unlock simgesi:** P3 kapsamındaki minimum tasarım kararı; tasarım geri bildirimi olarak kalabilir.
- **Aktarım kaynağının seçili program olması, ters aktarım/readTransfer yüzünün bulunmaması:** ileri aktarım altkümesi açıkça sunulduğu sürece kabul. Kaynak varsayımının ürün teyidi Y3’te kayıtlı.
- **Engel/uyarıların sayı olarak gösterilmesi:** minimum yüz için kabul; yürütülebilirlik önizleme modelinden hesaplanıyor (`P/components/use-transfer.ts:136`).
- **department_exists eşleşmesinin yüklenen katalogla sınırlı olması:** BE-050 sınırı; kimlik uydurmama doğru.
- **Work yazmalarının panoyu geçersizlememesi:** kayıtlı politika olarak kabul. `staleTime=60_000` periyodik yenileme değildir; odak/refetch olmadan görünür veri daha uzun süre eski kalabilir.
- **Yerel Docker tanığının sınırları:** önceden çalışan backend, TLS’siz kenar eşdeğeri, sahte uçlu B katmanı, eksik tasarım açık tema karşılaştırması dürüstçe belirtilmiş. Bunlar tam üretim kurulum provası sayılmaz.

## F3 için riskler ve ön koşullar

1. **Ürün sahibinin açık F3 onayı** gereklidir; mevcut iskelet bunu doğru söylüyor (`Y3/README.md:3`). Bu hüküm o onayın yerine geçmez.
2. Ö-01–Ö-03’ü F3 işlerine açık kabul ölçütleriyle ekleyin; yeni Gantt okuyucuları ilk günden `sessionBound` ve signal taşısın.
3. P8: koordinatör sürüklemesi talep, yönetici doğrudan yazma, üye salt okuma; yönetici Koordinatör merceği ayrıca test edilsin.
4. Beş saniyelik gecikme sırasında kapsam/oturum/sahip değişimi gönderimi iptal etsin; bildirim kapatma ile iptal ayrımı korunsun.
5. BE-056 kapanmadan anahtarsız tarih uçlarında kör tekrar yapılmasın; belirsiz sonuç Gantt ve seçili görev yeniden okunarak uzlaştırılsın.
6. BE-052/051/053/019 yoksa seçili görev ek okumaları ve 200 kayıt tavanı açık gösterilsin; departman fan-out’u eklenmesin.
7. Kendi SVG Gantt’ta yalnız görünür uçlar arasında ok çizilsin; şerit gerçek sezon sınırı gibi sunulmasın.
8. Klavye tarih düzenleme, odak dönüşü, büyük liste ve CSP davranışı gerçek üretim imajında tanıklansın; dışa aktarım pilot geçmeden etkinleştirilmesin.
9. W97 timeout riski ölçülerek çözülsün; sabit uyku veya kapsamı daraltılmış sahte bileşenlerle yeşile çevrilmesin.
10. F3 kapanışında CI kanıtı, son uygulama commit’i ve görsel tanık aynı sürüme bağlansın; K-7/K-8 dahil devredilen kusurlar kaybolmasın.

---

# WEB-2 (F2) — Codex nihai kapı hükmü — 2. koşum

- **Hüküm: KOŞULLU UYGUN.** Ö-01/Ö-02 ve K-01…K-04 kaynak düzeyinde karşılanmış; incelenen değişikliklerde yeni işlevsel engelleyici saptamadım. Tek kalan koşul, Ö-03 kaydındaki yeniden tanık çelişkisinin F2 kapanış PR’ında düzeltilmesidir.
- **Denetlenen:** `web2/o5-kapanis` @ `8a282e87bdbad79d78d26af44b74fb704ca3307a`; başlangıç/bitiş çalışma ağacı temiz.
- **Komutlar:** İlk işlem `git rev-parse HEAD`, `git log --oneline -12`, `git status --short`; ardından `git log --first-parent`, `git diff`, `rg`, `nl -ba`, `sed`, `cat`, `ls`. Test/lint/build çalıştırılmadı; dosya değiştirilmedi.
- Yol kısaltmaları: **O**=`src/modules/organization`, **P**=`src/modules/program`, **S**=`src/shared`, **Y2/Y3**=`docs/yurutme/web-2` / `web-3`.

## Ö-01…Ö-03 ve K-01…K-04 kapanış tablosu

| Bulgu | Durum | Kanıt dosya:satır | Kalan risk |
|---|---|---|---|
| Ö-01 | Kaynakta kapandı | `O/api/users.ts:108`; `departments.ts:62,85,108`; `members.ts:76`; `reports.ts:42`; `src/app/shell/side/department-code.ts:42`; `badges.ts:69,104` | İstenen tüm `queryFn` taramasında sarmalsız tanım yok. Çalışma zamanı bu koşumda doğrulanmadı. |
| Ö-02 | Kapandı | `P/api/programs.ts:114`; `P/api/programs.test.ts:148` | Yeni nesne `isDetached→markDetached` ile işareti koruyor; taslaksız sonuç aynı nesne. Test geçişi bağımsız doğrulanmadı. |
| Ö-03 | Koşullu | `Y2/ilerleme.md:94,98,104`; `Y2/dogrulama-F2.md:161`; `Y3/oturum-3-entegrasyon.md:20` | Kusur tablosu, #62 tanığı ve devir mevcut; `ilerleme.md:94` hâlâ “henüz yeniden gözlenmedi” diyor. |
| K-01 | Belgeyle kapandı | `S/ui/confirm/notify.ts:16,38,54`; `S/ui/confirm/use-confirm.ts:28,263` | Sonuç sonrası `useToast()` sürüyor; detached/owner denetimi önce yapılıyor. Ortak yardımcı istisnası açık. |
| K-02 | Kapandı | `docs/ekranlar/05-kullanicilar/README.md:38`; `docs/backend-eksikleri/kayit.md:43`; `O/api/reports.ts:5` | BE-107 aktarımı devre dışı; BE-036(4) enum eksiği açık. Backend eksikleri kapanmış sayılmıyor. |
| K-03 | Kapandı | `O/api/users.ts:123`; `O/components/users/use-users-view.ts:114`; `O/api/users.test.ts:88` | Liste ve tek-birim kipinde kesilmiş küme `complete=false`; test kaynakları iki kipi de kapsıyor. |
| K-04 | Kapandı | `docs/ekranlar/ortak-kurallar.md:80,95` | Ortak önbellek uzlaştırması ile sökülmüş ekranın ek okuma/UI/bildirim başlatması ayrılmış; `staleTime` periyodik yenileme sayılmıyor. |

Ö-01’de signal uç çağrısına taşınıyor: `O/api/users.ts:68,81,84`, `departments.ts:86,119`, `members.ts:47,57`, `reports.ts:29`; ortak departman zinciri `O/api/http.ts:34` → `S/scope/standing.ts:177`; kabuk sayaçları `badges.ts:33,37`.

Yeni testler anlamlı: `O/api/users.session.test.ts:56,80` merkezi iptal bağını kurmadan gecikmiş GET ve duraklatılmış tekrar sırasında acc-1→acc-2 geçişini, boş önbelleği ve yalnız eski Bearer çağrısını denetliyor. `department-code.test.ts:110,129` aynı kapıyı enjekte edilen okuyucuyla sınayıp signal varlığını doğruluyor; gerçek ağ iptalinin kanıtı değil.

`S/scope/session-isolation.test.ts:201,217,244` yeni hesabın `me` verisinin gerçekten önbellekte bulunmasını ve acc-2 okumasını şart koşuyor. Ö-02 testi sökülme sonrası bilinmeyen sonuçta boş parola, detached işareti, `reachesOwner=false` ve bildirim yokluğunu birlikte denetliyor.

## Regresyon ve kayıt

- `git diff d036208..HEAD -- eslint.config.js` **boş**. `origin/main --first-parent` üzerinde #63 `d52510c`, ardından #62 `d036208` mevcut.
- W82b merkezi bağlama korunmuş: `S/scope/lifecycle.ts:174`, `S/session/query-session.ts:76`. W67 aynı kimlikle özgün isteği tamamlama kuralı korunmuş: `S/http/client.ts:117,139`.
- K5 motoru ve anahtarsız bilinmeyen sonuç uzlaştırması değişmemiş: `O/api/keyless.ts:61,72`. W84 okuyucu sarmalları mevcut anahtar/etkinlik/sayfalama düzenini koruyor; incelenen farklarda yazma protokolünü bozan değişiklik yok.
- #62 gerçek imaj tanığı `Y2/dogrulama-F2.md:165` ile `d036208`/Caddy/backend’e bağlı; K-1…K-6 sonuçları satır 174–184’te. K-6’nın `page.route` müdahalesi açıkça belirtilmiş; bu tanık **W84/denetlenen HEAD tanığı değildir**.
- 52 ölçüm ve sıfır taşma/CSP/pageerror sonuçları kayıtlı koordinatör beyanıdır. Ham betik bu worktree’de yok; görüntüler depo dışında (`:196`). Sonuçlar bağımsız **doğrulanamadı**.
- CI yeşilliği, 348 dosya/2349 test ve düzeltmeler geri alınınca kırmızı sonucu **kullanıcı/işçi beyanıdır**.
- `../program/` yok; yönetim kaydı `../nizam.io--program/program/` üzerinden okundu. Bu rapor ve kapanış hash’i kayda koordinatörce işlenmeli.

## Yeni bulgular (varsa)

Yeni işlevsel bulgu yok. **Ö-03 kayıt artığı:** `Y2/ilerleme.md:94` eski tanığı güncel durum gibi anlatıyor; “ilk tanık 7ee18fe; #62 yeniden tanığı §9” şeklinde düzeltilmeli. Bu koşul **F2 kapanış PR’ında**, F3 açılmadan kapanır.

## F3'e devir

- **W97 (11–15):** çip kaldırmada çift bildirim; bağlı `DepartmentForm` kapsam değişimi sonrası bildirim; entegrasyon testlerinin süre sınırı; **K-7** giriş formu istemci doğrulaması; **K-8** dar ekranda yan panel görünürlüğü (`Y3/oturum-3-entegrasyon.md:20`).
- **Ürün/tasarım:** `unlock` simgesi, W81 aktarım kaynağı varsayımı ve §6 #11–#12 kararları (`Y3/ilerleme.md:19,22`).
- **Ürün sahibi açıkça onaylamadan F3 başlamaz** (`Y3/README.md:3`).

