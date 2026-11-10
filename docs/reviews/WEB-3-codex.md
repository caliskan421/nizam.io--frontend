# WEB-3 (F3) — Codex nihai kapı hükmü

**Son hüküm: KOŞULLU UYGUN** — 2. koşum, kapanış dalı `web3/o4-kapanis` @ `768f22b` (`main` @ `7f8740e`, #65–#75 birleşik). F4 açılmadan kapanması zorunlu, kanıtlanmış bir yetki aşımı veya başka oturum adına yeni yazma açığı saptanmadı.
Koşullar (kabul ölçütleriyle devredildi): **CX-F3-Ö-03** (ARIA alt satır `aria-rowindex`/sıra kalanı), **Ö-04** (sürükleme ön okuması sırasında kapsam değişimi → sıfır PATCH/bildirim/ek geçersizleme) ve **yeni Ö-08** (ortak `useProtectedMutation`: başarı geçersizlemeleri beklenirken sahip sökülürse sonuç `reachesOwner` canlı kalıyor) → **pin aşamasının ilk işi** (F4'ten önce; Ö-08 ortak katmana dokunur). **Ö-07** (gerçek ekran okuyucu), **K-04** (05 odak dönüşü), **E-03C-27/41** görsel nihai kabul (ürün sahibi onayı) → F4 borcu. Pin aşaması ve ürün sahibinin F4 onayı mevcut ön koşullar olarak korunur.
Denetçi: Codex, `codex exec -s read-only` (model `gpt-6.1-sol`, medium), tek ve salt okunur koşum; test/lint/build çalıştırmadı, dosya değiştirmedi.
Kayıt: yürütme `docs/yurutme/web-3/ilerleme.md` (O4); görsel tanık `docs/yurutme/web-3/dogrulama-F3.md`; yönetim deposu satırı kapanışta.

| Koşum | Denetlenen dal/HEAD | Hüküm | Açılan bulgular | Düzeltme |
|---|---|---|---|---|
| 1 | `web3/o4-kapanis` @ `8e582d6` (#65–#73 + kapanış belgeleri) | **KOŞULLU UYGUN** | Engelleyici yok; CX-F3-Ö-01 (gecikmeli gönderim görev başına zamanlayıcı) · Ö-02 (uzantı SVG'de, seçici) · Ö-03 (ARIA tek durak/seviye/indeks) · Ö-04 (`useDateSend` sahip/oturum kapıları) · Ö-05 (panel görünür alanda) · Ö-06 (oturum değişimi senaryosu) · Ö-07 (gerçek ekran okuyucu yok) · K-01 (pano/rozet istisnası) · K-02 (kayıtlar) · K-03 (ilk bağlam) · K-04 (05 odak dönüşü) · K-05 (dört küçük kusur) | **W98** (PR #74 `90cf838`): doğrulama K-1…K-7, Ö-02, Ö-03 (tek sekme durağı, alt görev `aria-level` 3, `aria-rowcount`), Ö-05; K-8 bilinçli kabul · **W99** (PR #75 `7f8740e`): Ö-01 görev başına zamanlayıcı, Ö-04 `useDateSend` sahip/oturum kapıları, K-03 ilk bağlam, Ö-06 sahte sunucu pin hizası + gerçek kardeş kanal senaryosu · K-01, K-02 belge düzeltmeleri |
| 2 | `web3/o4-kapanis` @ `768f22b` (`main` `7f8740e`, #65–#75 birleşik) | **KOŞULLU UYGUN** | Ö-01, Ö-02, Ö-05, Ö-06, K-01, K-03, K-05 kapandı; Ö-03 ve Ö-04 kısmen; Ö-07, K-04 açık; K-02 kısmen (#75 "CI'da/birleşiyor", `rapor-F3.md` başı "yayımlanmadı" ↔ §2, E-03C-27 satırı); **yeni Ö-08** (ortak başarı bekleyişinde sahip yarışı); yeni engelleyici yok | K-02 kalanları → kapanış PR'ı (bu belge): #75 birleşti `7f8740e`, rapor başı düzeltildi, E-03C-27/41 satırları F4 borcu · Ö-03, Ö-04, Ö-08 → pin aşamasının ilk işi (tur 2 kabul ölçütleriyle) · Ö-07, K-04, E-03C-27/41 → F4 borcu |

Düzeltme planı (koordinatör, 2026-11-10): **Tur 1 → W98 + W99** (yukarıda). **Tur 2 → bu PR (yalnız `docs/**`):** K-02 kalanları (`web-3/ilerleme.md` #75 birleşti `7f8740e`; `rapor-F3.md` başındaki "yayımlanmadı" düzeltildi — backend `v0.13.0-api`/`v0.14.0-api`/`v0.15.0-api` yayımlandı, pin bilerek `v0.11.0-api`'de, ürün kararı; 03c README E-03C-27 satırı K-4'ün PR #74 ile düzeldiğini ve görsel nihai kabulün F4 borcu olduğunu söyler, E-03C-41 F4 borcu/görsel onay) ve borçların devri: **Ö-03, Ö-04, Ö-08 → pin aşamasının ilk işi** (F4'ten önce; her biri tur 2'deki kabul ölçütüyle; Ö-08 `use-protected-mutation.ts:149–176` / `outcome.ts:202–217` ortak katmana dokunduğu için pin aşamasında), **Ö-07, K-04, E-03C-27/41 → F4 borcu**. Kayıtlar: `web-3/ilerleme.md` ("F3 KAPANDI 2026-11-10, Codex KOŞULLU UYGUN"), `web-4/ilerleme.md`, `web-4/README.md` ön koşul listesi, `rapor-F3.md` §2.

Aşağıda koşumların tam metni sırayla yer alır (önce tur 2, sonra tur 1).

---

# WEB-3 (F3) — Codex nihai kapı hükmü, tur 2

- **Hüküm: KOŞULLU UYGUN.** F4 açılmadan kapanması zorunlu, kanıtlanmış bir yetki aşımı veya başka oturum adına yeni yazma açığı saptamadım. Koşul: aşağıdaki kısmi/açık bulgular ve yeni Ö-08, kabul ölçütleriyle F4/pin aşamasına aktarılmalı; pin aşaması ve ürün sahibinin F4 onayı mevcut ön koşullar olarak korunmalıdır.
- **HEAD/dal:** `768f22b3340546f405c6b8f86aeff160ab119359` — `web3/o4-kapanis`. Başlangıç ve son `git status --short` boş.
- **Komutlar:** ilk komut grubu `git rev-parse HEAD`, `git log --oneline -15`, `git status --short`; ardından `cat`, `nl -ba`, `sed`, `rg`, `git diff`, `git show`, `git log --first-parent`, `git diff --check`.
- **Dosya değiştirilmedi; test/lint/build çalıştırılmadı.** #74/#75’in üç CI işinin yeşilliği ve birleşik ağaçtaki **406 dosya / 2902 test kullanıcı beyanıdır**. Aşağıdaki test değerlendirmeleri kaynak ve assertion incelemesidir; koşum sonucu değildir.

Kanıt kısaltmaları: **T**=`src/modules/timeline`, **W**=`src/modules/work`, **S**=`src/shared`, **I**=`src/app/__tests__/integration`, **Y3**=`docs/yurutme/web-3`, **E3**=`docs/ekranlar/03c-zaman-cizelgesi/README.md`.

## Tur 1 bulgularının durumu

| Kimlik | Durum | Kanıt | Not |
|---|---|---|---|
| **Ö-01** | **KAPANDI** | `T/composables/useDelayedSend.ts:106,148,153,191`; `useDateChange.ts:163,189`. Testler: `useDelayedSend.test.ts:97` «başka anahtar öncekinin iptal penceresini KESMEZ», `:112` «iki görevde de… sıfır yazma»; `useDateChange.test.ts:305,319,333`. | Assertion’lar süreyi, gönderilen yükleri ve sıfır isteği ölçüyor. Aynı görev kendi ilk `before` değeri üzerinden birleşiyor; başka görevin zamanlayıcısı korunuyor. |
| **Ö-02** | **KAPANDI** | `T/pages/timeline/use-selected-request.ts:29–44`; `GanttBars.vue:60`; `GanttBar.vue:129`. Test: `I/timeline-requests.test.ts:194,209` «yalnız SEÇİLİ görevde sağ uzantı», «Koordinatör kendi biriminde görür; Üye hiç görmez». | Yeni seçici gerçek SVG `path[data-request]` öğesine ulaşıyor; eski panel metniyle kabul sınıfı giderilmiş. Koordinatörün başka birimi için negatif UI senaryosu ayrıca yok; kaynak kapısı görev departmanındaki olguyu kullanıyor. |
| **Ö-03** | **KISMEN** | `GanttRows.vue:139,156,198,214`; `SubtaskRows.vue:46,68`. Test: `I/timeline-a11y.test.ts:38` tüm odaklanabilirleri sayıyor; `:187–192` toplam ve sonraki ana satır indeksini ölçüyor. | Tek durak ve seviye 3 düzeldi. Alt görev satırlarında `aria-rowindex` yok; bloklar DOM’da bütün ana satırlardan sonra geliyor. Sanallaştırılmış açık alt görevlerin tam indeks/sıra tutarlılığı kapanmadı. |
| **Ö-04** | **KISMEN** | `useDateSend.ts:87,110,139,147,150`; testler `useDateChange.test.ts:367,374,381,403`. | Sökülme testleri gerçekten sıfır PATCH, sıfır ek geçersizleme/bildirim ölçüyor. Yarış çakışmasında alan adları bildiriliyor. Ancak `live()` kapsamı karşılaştırmıyor; ön okuma sırasında kapsam değişip sahip yaşarsa tarih uyuşmazlığı dalı eski kapsamda ek okuma/bildirim başlatabiliyor. |
| **Ö-05** | **KAPANDI** | `TimelinePage.vue:72,81`; `use-panel-reveal.ts:85–107`; `timeline.css:79,116`. Test: `use-panel-reveal.test.ts:53,60,67`. | Kullanıcı seçimi kaydırmayı kuruyor; derin bağlantı kurmuyor. Test kaydırma çağrısını ve gerçek `activeElement` değerini ölçüyor. İç kaydırıcı/tam ekran görsel sınırları kayıtlı; bu koşumda yeniden denenmedi. |
| **Ö-06** | **KAPANDI** | `I/timeline-drag.test.ts:226–263`; `harness.ts:119–155`; `fake-org-timeline.ts:197,335,356`. Testler: `fake-org-timeline.test.ts:37,44,54,59`. | Yeni **10b**, gerçek oturum abonesine sahte BroadcastChannel ile ileti ulaştırıyor, başka hesapla girişi tamamlıyor, ikinci gözlemciyle isteği canlı tutuyor ve geç veriyi denetliyor. Gerçek iki tarayıcı sekmesi değildir; iddia bu sınırla kabul edilir. |
| **Ö-07** | **AÇIK** | `Y3/dogrulama-F3.md:162`; `Y3/ilerleme.md:79,84`; `web-4/ilerleme.md:20`. | Gerçek ekran okuyucu kanıtı hâlâ yok. Borç açıkça devredilmiş; DOM/klavye testleri gerçek cihaz kabulünün yerine geçmez. |
| **K-01** | **KAPANDI** | `docs/ekranlar/ortak-kurallar.md:75,83`; `E3:125`; `I/timeline-requests.test.ts:155,174`. | İki talep ucunun pano/rozet istisnası bağlayıcı belgede açık ve sınırlı. Testler rozetin düşmesini de gözlüyor. |
| **K-02** | **KISMEN** | `Y3/ilerleme.md:15,28–30,73`; `rapor-F3.md:3,23,53,77`; `E3:57`; git birleşimleri `90cf838`, `7f8740e`. | Doğrulama ve düzeltme kayıtları eklendi. Buna rağmen #75 hâlâ “CI’da/birleşiyor”; rapor başı “yayımlanmadı” derken §2 yayımlandığını söylüyor; E-27 satırı K-4’ü hâlâ F4 işi gösteriyor. |
| **K-03** | **KAPANDI** | `use-date-actions.ts:100–137,154`; `S/http/mutation/context.ts:12`; `W/components/subtasks/use-subtask-edit.ts:153–177`; `notes/use-note-actions.ts:131,143,157`. | İlk bağlam recursive gönderimlere taşınıyor. Panel testi `SelectedTaskPanel.test.ts:391,399`, work testleri `use-subtask-edit.test.ts:121`, `use-note-actions.test.ts:111` kapsam değişiminden sonra ikinci PATCH’in gitmediğini ölçüyor. Yeni Ö-08 ayrı yaşam penceresidir. |
| **K-04** | **AÇIK** | `organization/pages/UsersPage.vue:66`; `Y3/ilerleme.md:85`; `web-4/ilerleme.md:20`. | 05 panel kapanışında yalnız URL güncelleniyor; odağı satıra döndüren işlem yok. F4 ortak odak borcu korunuyor. |
| **K-05** | **KAPANDI** | `GanttAxis.vue:47`; `panel/outcomes.ts:30`; `GanttRows.vue:185`; `gantt.css:287`; `Y3/dogrulama-F3.md:152–156`. Testler: `GanttAxis.test.ts:51`, `DependencyDialog.test.ts:94,115`, `GanttRows.test.ts:123`. | Tur 1’deki dört küçük kusur için kaynak düzeltmesi mevcut. Seçiciler etiket koordinatını, özgün hata metnini ve boş kod sütununun kaldırılmasını ölçüyor; yeni görsel koşum yapılmadı. |

**Görev başına bekleyenler:** `useDelayedSend.ts:109–130,167–178` uyarınca snack görünür işler arasında en son değişeni gösterir; “İptal et” onu düşürür ve önceki görünür iş ortaya çıkar. ✕ yalnız gösterileni gizler; o iş zamanlayıcısını korur ve süresi dolunca gönderilir. Kapsam değişimi bütün haritayı boşaltır; oturum değişiminde bütün yuvalar dolaşılarak eski nesilliler düşürülür; sökülmede `dropAll()` çalışır. Çoklu kapsam iptali testi var (`useDelayedSend.test.ts:146`); oturum testi yalnız tek yuvalıdır (`:167`), çoklu oturum davranışının kanıtı kaynak döngüsüdür.

**E-03C-42 yetki kapısı:** `use-selected-request.ts:34–40` → `capabilities.ts:69–71,109,142`, koordinatörlüğü seçili görevin departmanından hesaplar. Düz Üye çizim alamaz; Koordinatör yalnız koordine ettiği birimde alır; şirket yöneticisi P1 gereği yetkisini korur. Üye negatif testi sunucu talebi doldurduğu hâlde SVG öğesinin yokluğunu ölçüyor (`timeline-requests.test.ts:217–227`).

## Yeni bulgular

### CX-F3-Ö-08 — Sahip, başarı geçersizlemeleri beklenirken sökülürse sonuç canlı kalabiliyor

**Kaynakla kanıtlanan, bu koşumda yürütülmemiş yarış; F4 içinde kapanabilir.** Bu ortak katmanda tur 1’de görülmemiştir; #74/#75’in getirdiği bir regresyon değildir.

- `S/http/mutation/use-protected-mutation.ts:149–151`, sonucu `mutationFn` biterken sahip durumuyla işaretliyor.
- Ardından `:156–160` başarı geçersizlemelerini bekliyor. Yerel TanStack kaynağı `node_modules/.pnpm/@tanstack+query-core*/node_modules/@tanstack/query-core/src/mutation.ts:346,357,383`, `onSuccess` tamamlanmadan `mutateAsync` sonucunun dönmediğini doğruluyor.
- Sahip **bu bekleme sırasında** sökülürse `submit` dönüşünde yeniden işaretleme yok (`use-protected-mutation.ts:169–176`). `reachesOwner()` yaşamı yeniden okumuyor; yalnız sonuç işaretine bakıyor (`outcome.ts:202–217`).
- Böylece örneğin `W/components/forms/use-status-transition.ts:154` kapısını geçen başarı, sökülmüş ekranın `transitioned` kancasını çağırabilir (`:123–124`); tarih talebi formu da `onSent` çalıştırabilir (`use-date-request-form.ts:101–105`).

**Test boşluğu:** `use-protected-mutation.detached.test.ts:109–125` sahibi **HTTP yanıtından önce** söküyor; başarı sonrası geçersizleme bekleyişindeki pencereyi ölçmüyor.

**Kabul ölçütü:** başarı yanıtını tamamla → geçersizleme GET’ini beklet → sahibi sök → GET’i bırak; ortak uzlaştırma tamamlanmalı, dönen sonuç `reachesOwner=false` olmalı ve ekran kancaları çalışmamalı. Sonuç tüketiciye verilmeden önce sahip durumu yeniden denetlenmeli. Yeni HTTP yazmasını mevcut motor kapısı yine engelliyor (`engine.ts:319–335`).

**Yeni engelleyici bulgu yok.** Ö-03’ün ARIA kalanı ve Ö-04’ün kapsam kalanı yukarıdaki mevcut kimliklerde tutulmuştur.

## Bağımsız sınıf taraması

| Yol / sınıf | Kaynak sonucu |
|---|---|
| **Gecikmeli yeni karar** | Timeline sürükleme ve klavye aynı `stage`/zamanlayıcı yolunda (`useDateChange.ts:156,184`). Gönderim anında sahip, kapsam ve nesil denetleniyor (`useDelayedSend.ts:145–150`); ilk bağlam motora veriliyor. |
| **Çakışma sonrası gönderim** | Timeline paneli ve work not/alt görev akışları ilk bağlamı koruyor. `useActionContext` tek başına sahip koruması değildir; koruma `useProtectedMutation.ts:133–138` ve `engine.ts:319–335` üzerinden sağlanır. |
| **Geç sonuç / ek okuma** | Timeline talep formu ve bağımlılık akışlarında `reachesOwner` var (`use-date-request-form.ts:101`; `use-dependency-dialog.ts:73,87`). Sürükleme ön okumasında kapsam karşılaştırması eksik: Ö-04. Ortak başarı bekleyişinde yeni pencere: Ö-08. |
| **Work durum / dosya yolları** | Durum geçişi `send` dönüşünde sahip işareti denetleniyor (`use-status-transition.ts:153–154`); dosya indirme geç yanıtta canlılığı doğrudan okuyor (`use-file-actions.ts:49–58`). Durum geçişi Ö-08’den etkilenebilir; yeni yazma bypass’ı saptanmadı. |
| **Bileşik yazmalar** | Work oluştur → ek atama `api/items.ts:81–93`; organization oluştur → bağla `api/departments.ts:219–231`; departman ad → katalog `department-edit.ts:131–145` bağlam taşıyor. |
| **Organization / program onayları** | Organization `api/confirm.ts:27–29` ortak onay yolunu; program aktarım `use-transfer.ts:169`, sil/sıfırla `use-program-danger.ts:103,106` onayın bağlamını kullanıyor. Yeni korumasız ardıl yazma örneği saptanmadı. |
| **Uzlaştırma / invalidate** | Timeline `api/mutations.ts:93–96`, organization `api/keyless.ts:89–91` yakalanmış kapsamı kullanıyor; anahtarsız belirsizlikte kör tekrar kapalı. Program aktarımındaki geniş geçersizleme veri katmanında (`api/transfers.ts:75–81`); ekran ek okumasıyla karıştırılmadı. |
| **Diğer zamanlayıcılar** | Work `TasksFilterBar.vue:43,59`, organization `UsersToolbar.vue:64,80`, `PersonPicker.vue:36,41` arama geciktiriyor ve sökülmede temizliyor; HTTP yazma kararı üretmiyor. Panel görünürlük zamanlayıcıları da yazma üretmiyor. |

**Ö-03 kabul ölçütü:** açık alt görevleri ana satırların mantıksal sırasına yerleştirin veya erişilebilir sahipliği açıkça kurun; bütün alt satırlara mutlak `aria-rowindex` verin. İki açık blok ve pencerenin ortasından başlayan sanallaştırmayla bütün render edilmiş satırların indekslerini/sırasını ölçün. Mevcut test yalnız ana satır kaymasını ölçüyor; tur 1’deki “test adı yeterli, seçici eksik” sınıfı burada tamamen kapanmamış.

**Ö-04 kabul ölçütü:** ön GET beklerken sahip bağlı kalsın, kapsam A→B değişsin, farklı tarihli yanıt gelsin; PATCH, ekran bildirimi ve ekranın ek geçersizlemesi sıfır olmalı. Mevcut sökülme testleri bu kapsam senaryosunun yerine geçmiyor. `edit_conflict` için alan adlı bildirim ve panelden yeniden düzenleme yaklaşımı kabul edilebilir; otomatik ikinci yazma yapılmıyor (`useDateSend.ts:116–126`).

## E-03C-27 / 41 önerisi

- **E-03C-27: F4 borcu.** İşlevsel kabul korunabilir; görsel nihai kabul açık kalmalı. Ay etiketi çakışması düzeltildi ve koordinat assertion’ı var (`GanttAxis.test.ts:51–60`), fakat `E3:57` hâlâ kusuru F4 işi gösteriyor; satır güncellenmeli.
- **E-03C-41: F4 borcu.** Kesik gecikme kenarı uygulanmış (`GanttBar.vue:136`); `E3:71` piksel karşılaştırmasının yapılmadığını açıkça kaydediyor. Ürün sahibi görsel onayı olmadan koşulsuz görsel kabul verilmemeli. İkisi de mevcut kanıtla F4 engeli değildir.

## Kabul edilen borçlar (F4 / pin aşamasına)

- **F4:** Ö-03 ARIA sıra/indeks kalanı, Ö-04 kapsam sonrası ek iş kalanı, yeni Ö-08 başarı bekleyişinde sahip yarışı, Ö-07 gerçek ekran okuyucu ve K-04 05 odak dönüşü. Her biri hedef iş ve yukarıdaki ölçütlerle kaydedilmeli; web-4 devri şu anda yalnız Ö-07/K-04’ü açıkça sayıyor (`web-4/ilerleme.md:20`).
- **Görsel:** E-27/41 ürün sahibi onayı; panelin iç kaydırıcı/tam ekran ve çok gruplu büyük veri turu (`Y3/ilerleme.md:86–88`).
- **Pin:** `api-pin.json` hâlâ `v0.11.0-api`; F3’ün bu pinle kapanması kayıtlı ürün kararıyla tutarlı. `v0.15.0-api` geçişi ayrı kapıdan geçmeli ve **F4’ten önce tamamlanmalı** (`web-4/README.md:7`; `rapor-F3.md:23`).

**Belge ↔ git hükmü:** #74=`90cf838`, #75=`7f8740e` birleşmiş ve denetlenen HEAD’in geçmişindedir; kapanış belge commit’i `051f0c7` de ağaçtadır. K-02 kapsamında #75’in bekleme ifadesi, rapordaki yayın çelişkileri ve eski E-27 metni düzeltilmeli; `web-4/ilerleme.md:21` başlığındaki “pin aşaması kapandı” ifadesi de tamamlanmış durum sanılmayacak biçimde yazılmalıdır. F4 ürün onayı kapısı korunuyor (`web-4/README.md:3,7`); yönetim panosu hâlâ eski web durumunu taşıyor ve koordinatör güncellemesi bekliyor.

---

# WEB-3 (F3) — Codex nihai kapı hükmü

- **Hüküm: KOŞULLU UYGUN.** İncelenen kaynakta F4 açılmadan kapatılması zorunlu, kanıtlanmış bir yetki veya oturumlar arası yazma açığı saptamadım. Aşağıdaki önemli bulgular F4 içinde kapanabilir; F3’ün koşulsuz tamamlandığı söylenmemeli, bulgular F4 işlerine açık kabul ölçütleriyle aktarılmalıdır.
- **HEAD/dal:** `8e582d6e4ae6990e13d7a3300a929ea390ce142a` — `web3/o4-kapanis`. Başlangıç ve bitiş `git status --short` boş.
- **PR geçmişi:** #65 `fdeaf3e`, #66 `61c8420`, #67 `b83e2c6`, #68 `846b2d5`, #69 `cebc8a7`, #70 `cc16afb`, #71 `ee6de60`, #72 `be4b8a5`, #73 `dc3f84f`; ardından kapanış belgeleri ve doğrulama birleşimi.
- **Dosya kapsamı:** en az **93 benzersiz dosyada** tam/kısmi okuma ve içerik taraması; kesin toplam sayacı tutulmadı.
- **Komutlar:** ilk eylem istenen üç Git komutuydu. Devamında `git log --first-parent`, `git diff`, pin için `git -C … show`, `rg`, `nl -ba`, `sed`, `cat`, `wc -l`, salt okunur `python3 -c` JSON incelemeleri kullanıldı.
- **Test/lint/build çalıştırılmadı; dosya değiştirilmedi.** Üç CI işinin yeşilliği ve 2856 test geçişi **kullanıcı beyanıdır**; bağımsız CI doğrulaması yapılmadı.
- `../program/` bulunamadı; yönetim belgeleri `../nizam.io--program/program/` altında bulundu. Bu konumun `DURUM.md` kaydı güncel F3 kapanışını içermiyor.

Kanıt kısaltmaları: **T**=`src/modules/timeline`, **S**=`src/shared`, **I**=`src/app/__tests__/integration`, **Y3**=`docs/yurutme/web-3`, **E3**=`docs/ekranlar/03c-zaman-cizelgesi/README.md`. **Spec** satırları çalışma ağacından değil, `v0.11.0-api:docs/api/openapi.yaml` çıktısındandır.

## Madde hükümleri (1–20)

| Madde | Hüküm | Kanıt | Öneri |
|---|---|---|---|
| **1. Capabilities** | **UYGUN** | `T/model/capabilities.ts:69,79,86,99,104,136`: saf olgusal kararlar, yönetici yetkisi korunuyor; tamamlanmışta tutamaç yok. `T/model/face.ts:14`: yüz kapsamdan. `T/components/panel/use-task-panel.ts:59`; `work/model/capabilities.ts:238`: Yeni görev. `I/timeline-faces.test.ts:86`; `capabilities.test.ts:36`: matris kaynakları. | Mevcut gerçek kişilik senaryolarını koruyun; “4×3” başlığını 12 çalıştırılmış UI birleşimi gibi sunmayın. |
| **2. Gantt okuma** | **UYGUN** | `T/api/fetchers.ts:24,33,65`: üç uç, S2/S3 ve görev hedefi. `T/api/queries.ts:48,79,107,135`: dört okuyucunun tamamı `sessionBound` + `signal`. `T/pages/TimelinePage.vue:126,134`; `T/model/ceiling.ts:8`: Admin süzgeci ve ≥200 uyarısı. | BE-019 gelene kadar yaklaşık sayaç etiketini koruyun. |
| **3. K5 yazmalar** | **UYGUN DEĞİL** | `T/api/mutations.ts:61,111,133,154,180,201,218`: altı gerçek uç ve belirsizlik uzlaştırması mevcut. `organization/api/keyless.ts:72`: kör tekrar kapalı. Panel alan çözümü `use-date-actions.ts:103`; fakat sürükleme çakışması `useDateSend.ts:75` yalnız bildiriliyor. Detached ek okuma da mevcut. | Ö-04: sürükleme çakışmasını çözümleyiciye bağlayın; ek okumalara sahip kapısı ekleyin. |
| **4. Gecikmeli gönderim** | **UYGUN DEĞİL** | `useDelayedSend.ts:115,118,144`: ateşleme anında kapsam/nesil/sahip denetimi doğru. Aynı görev birleşiyor. Ancak `:125` başka görevde ilk bekleyeni **hemen gönderiyor**; testi bunu özellikle bekliyor (`useDelayedSend.test.ts:97`). | Ö-01: her değişiklik için tam iptal süresini koruyun. |
| **5. Ö-08** | **UYGUN** | `S/session/query-session.ts:58,64,82`: yanıt öncesi/sonrası damga, iptal ve temizleme. Timeline dört sorgusu sarılı; ortak görev okuyucusu `work/api/queries.ts:89`. | Timeline’a özel gerçek kardeş-sekme senaryosunu tamamlayın; mevcut test kanıtı eksik, Ö-06. |
| **6. Anahtar/geçersizleme** | **UYGUN DEĞİL** | `S/http/query-keys.ts:88,99,103`: ortak anahtarlar doğru. Ancak `:258` talep açma/incelemeyi `report` listesine ekliyor; `ortak-kurallar.md:75,81` work yazmalarını açıkça dışlıyor. `E3:125` aynı çelişkiyi taşıyor. | Rozet gerekçesi teknik olarak makul; **belgelenmiş istisna olmadan uyum sayılmaz**. K-01. |
| **7. P19** | **UYGUN** | `T/model/links.ts:35`: iki uç için görünür görev satırı şartı. `fetchers.ts:35`: koordinatörün birim kümesi. `TimelineToolbar.vue:52,57`: “yakında”, çağrısız erken dönüş; sayfa `export-ready=false` veriyor (`TimelinePage.vue:128`). | Dışa aktarımı pilot geçmeden açmayın. |
| **8. 03d** | **UYGUN** | `use-subtask-summary.ts:23`: kapalıyken kimlik/hedef null. `work/api/queries.ts:110`: ortak anahtar. `rows.ts:153,165`: alt blok boşluğu. `SubtaskRows.vue:68,98`: metin satırları; çubuk/elmas yok. | ARIA hiyerarşisini ayrıca düzeltin, Ö-03. |
| **9. Erişilebilirlik** | **UYGUN DEĞİL** | `GanttRows.vue:124,144,152`: temel roller mevcut; fakat `:186` alt görev düğmesi ikinci sekme durağı oluyor. `SubtaskRows.vue:72`: alt görev de seviye 2. `I/timeline-a11y.test.ts:29` yalnız satırları sayarak kusuru kaçırıyor. | Ö-03; gerçek ekran okuyucu denemesi Ö-07 olarak açık kalmalı. |
| **10. Performans** | **UYGUN** | `GanttView.vue:73`, `GanttRows.vue:53`: pencereleme. `Y3/dogrulama-F3.md:106,110,116`: 262 görev/62 bağ, 21 DOM satırı; pilot karşılaştırma sınırı açıklanmış. Ham `perf-mock260.json` aynı sayıları taşıyor. | Çok gruplu/açık alt görevli büyük küme ölçümünü ekleyin. |
| **11. Sözleşme** | **UYGUN** | Spec `:2279,2448,2525,2658,2688,2751,2763,2810,2859`; `T/model/types.ts:11`; `mutations.ts:116`. Pin dışı alan kullanılmıyor. `completion.go@pin:211,378`: plan ve fiilî bitiş ayrımı. | Talep uzantısının eksik çizimi sözleşme uydurma değil, eksik uygulamadır; Ö-02. |
| **12. Güvenlik/CSP** | **UYGUN** | `deploy/Caddyfile:67`; T’de `eval`, `new Function`, `v-html`, depolama kullanımı bulunmadı. Nesne `:style` bağları mevcut. Yerel Vue runtime `patchStyle:510,543`, `setStyle:584,599` CSSOM özelliklerini kullanıyor. `GanttBar.vue:128,143` gerçek `foreignObject` içeriyor. | “Hiç inline stil yok” demeyin; **nesne bağları + CSSOM** ayrımını koruyun. Chromium ham tanığında CSP 0; diğer tarayıcılar doğrulanmadı. |
| **13. K13** | **UYGUN** | `GanttRows.vue:114`, `use-task-panel.ts:127`: BE-005; `PanelActions.vue:67`: BE-008. `kayit.md:12,15` ikisi de açık. `rapor-F3.md:14` aynı kimlikleri bildiriyor. | BE-052/053/056 yollarına gereksiz stub eklemeyin. |
| **14. Kabul tablosu** | **UYGUN DEĞİL** | `E3:72` kesik talep uzantısını kabul ediyor; kod yalnız panel kutusunu kuruyor (`PanelSummary.vue:65`). `SelectedTaskPanel.test.ts:199,224` bunu “uzantı” adıyla doğruluyor. Diğer örneklem aşağıda. | Ö-02: gerçek çubuk uzantısı ve ona ait test; kabul kanıtının adını düzeltin. |
| **15. Entegrasyon niteliği** | **UYGUN DEĞİL** | `I/harness.ts:147,154,156`: üretim App/router, gerçek bileşenler. `:180,200`: koşul/Query beklemesi. Fakat `:131` BroadcastChannel kapalı; `timeline-drag.test.ts:209` yerel çıkış. Sahte DELETE `fake-org-timeline.ts:333` 204, Spec `:14219` 200. | Ö-06: kardeş sekme ve sahte sözleşme boşluklarını kapatın. |
| **16. K12/mimari** | **DOĞRULANAMADI** | `git diff dea40f8..HEAD -- eslint.config.js` boş; yeni istisna yok. `GanttView.vue` **249 satır**. İçe aktarımlar `public.ts` üzerinden. `work/DetailActions.vue:6` ve `T/use-date-request-form.ts:11` modüller arası karşılıklı bağımlılık oluşturuyor. | Fonksiyon 60/karmaşıklık 12 bu koşumda bağımsız ölçülmedi. Karşılıklı bağımlılığı belgeleyin; yeni paylaşılan mantık eklemeyin. |
| **17. W97b** | **UYGUN** | `use-chip-actions.ts:38,56`, `use-confirm.ts:275`: tek bildirim ve sahip denetimi. `use-department-form.ts:34`: bağlı form davranışı. `SessionPage.vue:26,62`: boşluk doğrulaması, parola kırpılmıyor. `retryDelay:0` taraması yalnız test kaynaklarında; üretim `work/api/http.ts:33` korunmuş. | Gerçek backend e2e geçişi kullanıcı beyanı olarak kalır. |
| **18. Görsel doğrulama** | **DOĞRULANAMADI** | `Y3/dogrulama-F3.md:23,28,37`: gerçek imaj ve A/B ayrımı kayıtlı. 207 PNG ve ham JSON mevcut; matrislerde CSP/pageerror/taşma 0. `:145` açıkça “Düzeltme yapılmadı” diyor. | Tanık bu koşumda yeniden yürütülmedi, PNG’ler görsel olarak incelenmedi. Kusurları F4 işlerine bağlayın. |
| **19. Kapanış belgeleri** | **UYGUN DEĞİL** | `ilerleme.md:11` PR hash’leri first-parent geçmişiyle uyumlu. Ancak `:15,29` görsel doğrulamayı hâlâ bekliyor gösteriyor. `rapor-F3.md:15,27` seçili görev uzantısını uygulanmış varsayıyor. `web-4/README.md:3,7` onay kapısı doğru. | K-02: doğrulama birleşimi sonrası belgeleri güncelleyin; Ö-02’yi kapanmış göstermeyin. |
| **20. Bilerek yapılmayanlar** | **UYGUN DEĞİL** | Dışa aktarım P19 ile kabul; kısa alt görev kayması `ilerleme.md:75`; plan bitişinin salt okunması `use-task-panel.ts:140`. Gerçek ekran okuyucu yokluğu `dogrulama-F3.md:162`; 05 odak borcu `ilerleme.md:72`. | İlk üçü kabul edilebilir. Ekran okuyucu ve odak dönüşünü tamamlanmış kabul ölçütü saymayın. |

**Kabul örneklemi:** 03c’den **33 kimlik** karşılaştırıldı: 02, 03, 05, 10, 11, 13, 14, 22, 23, 24, 25, 27, 28, 30, 32, 33, 36, 37, 40, 42, 45, 47, 51, 53, 57, 58, 59, 64, 65, 66, 70, 71, 82 (`E3:32–112`). Saptanan belirgin eksik **42**; örneklemde ayrıca yasaklanmış `ret/öneri` davranışı saptanmadı. 03 E-03-05/14/54/63 ve 08 E-08-86 bağlantıları kaynak/test düzeyinde mevcut; ilgili README satırları `03:31,40,80,89`, `08:111`.

**Pin çapraz kontrolü — 15’in üzerinde öğe:** üç Gantt ucu/S2–S3 (`Spec:14286,14347,14755`); `Gantt.tasks/links` (`2751`); görev `program_id/department_id/start_on/end_on/planned_end_on` (`2690`); altı `lateness` alanı (`2723`); `pending_date_request.request_id/new_start_on/new_end_on` (`2279`); `expected_dates_revision` (`2448`); uzatma `days=1–90` ve `cascade_count/new_end_on` (`2763`); talep gövdesi ve isteğe bağlı `reason` (`2810`); inceleme `decision` ve `affected_tasks_count` (`2859`); bağımlılık gövdesi/kenarı/listesi (`2658`); alt görev `done/start_on/end_on` (`2525`). İstemci bunları üretilmiş tiplerden tüketiyor.

## Engelleyici bulgular (CX-F3-E-NN) — F4 açılmadan kapanmalı

**Yok.** Aşağıdaki bulguların F4 öncesinde kapatılmasını zorunlu kılacak kanıtlanmış bir yetki aşımı, başka hesapla yeni yazma veya önbelleğe eski oturum verisi kabulü bulunmadı. Bu hüküm F4 ürün sahibi onayının yerine geçmez.

## Önemli bulgular (CX-F3-Ö-NN) — F4 içinde kapanabilir

**CX-F3-Ö-01 — Başka görevde değişiklik, ilk işlemin iptal penceresini kesiyor.**  
A görevini değiştirdikten bir saniye sonra B görevini değiştirmek, A’nın yazmasını hemen başlatır. [useDelayedSend.ts:125](/Users/dogancosman/Desktop/PROJELER/NewTeknofestApp/nizam.io--frontend-wt-o4f3/src/modules/timeline/composables/useDelayedSend.ts:125) ve `useDelayedSend.test.ts:97` bunu kesinleştiriyor; `E3:77,100` bırakma sonrası beş saniye vaat ediyor. Görev başına zamanlayıcı veya ilk pencereyi koruyan sıra kullanın; iki görevde de süre dolmadan iptal → sıfır yazma ölçütünü ekleyin.

**CX-F3-Ö-02 — E-03C-42 çubuk uzantısı uygulanmamış; kabul kanıtı paneli ölçüyor.**  
`TimelinePage.vue:203` Gantt’a seçili görevin `pending_date_request` verisini vermiyor; `GanttBar.vue:29` ilgili prop/geometri taşımıyor. [Kabul satırı:72](/Users/dogancosman/Desktop/PROJELER/NewTeknofestApp/nizam.io--frontend-wt-o4f3/docs/ekranlar/03c-zaman-cizelgesi/README.md:72) kesik uzantı isterken `SelectedTaskPanel.test.ts:202` yalnız `tp-pending` metnini ölçüyor. Seçili görevden alınan veriyi çizime bağlayın; diğer görevde ve üyede çizilmediğini SVG üzerinden doğrulayın. Görsel kayıt da kusuru doğruluyor (`dogrulama-F3.md:150`).

**CX-F3-Ö-03 — Tek sekme durağı ve alt görev hiyerarşisi eksik.**  
Görev satırı ve içindeki aç/kapa düğmesi aynı anda `tabindex=0` alıyor (`GanttRows.vue:152,186`). Alt görevler, ana görevle aynı `aria-level=2` kullanıyor (`SubtaskRows.vue:72`); `aria-rowcount` ana satır düzleminden geliyor (`GanttRows.vue:126`, `rows.ts:154`). Satır içi denetime klavye erişimini koruyan tek durak modeli kurun; alt görev seviyesini/satır sayısını hizalayın. Test tüm odaklanabilir öğeleri saymalı.

**CX-F3-Ö-04 — Sürükleme gönderiminde Ö-07 ve çakışma çözümü eksik.**  
[useDateSend.ts:75](/Users/dogancosman/Desktop/PROJELER/NewTeknofestApp/nizam.io--frontend-wt-o4f3/src/modules/timeline/composables/useDateSend.ts:75), detached sonuçta da `reread` başlatabilir; ön okuma sonrası tarih uyuşmazlığı da sahip denetlemeden ek geçersizleme yapıyor (`:101`). Bildirim sahibinin koruması mevcut, fakat ek okuma yasağı tam değil. Ayrıca yarışta oluşan `edit_conflict` alan çözümleyicisine gitmiyor. `reachesOwner`/canlılık kapısı ekleyin; ortak belirsizlik uzlaştırmasını veri katmanında bırakın.

**CX-F3-Ö-05 — Seçili panel görünür alana getirilmiyor.**  
`TimelinePage.vue:77` yalnız URL güncelliyor; geniş ekranda panel mutlak, dar ekranda Gantt altında (`timeline.css:72,112`). Ham matris `panelInViewport=false`; kayıt `dogrulama-F3.md:149` 390 genişlikte paneli yaklaşık `y=1480` konumunda bildiriyor. Seçim sonrası kontrollü kaydırma ve erişilebilir odak/hedef bağlantısı ekleyin; tutamaç örtmesini yeniden üretmeyin.

**CX-F3-Ö-06 — Entegrasyon kanıtında kapsam ve sözleşme boşlukları.**  
“Kardeş sekme” testi yerel çıkış yapıyor ve başka hesapla giriş tamamlanmadan bitiyor (`timeline-drag.test.ts:204`). Harness BroadcastChannel’ı kapatıyor (`harness.ts:131`). Ayrıca sahte bağımlılık silme 204 döndürüyor (`fake-org-timeline.ts:333`), pin 200 `StatusResult` istiyor; sahte uzatma 1–90 sınırını denetlemiyor (`:192`), bağımlılık ekleme tarih sırasını denetlemiyor (`:303`). Gerçek kardeş ileti kanalıyla yeni hesaba geçişi ve geç yanıtı sınayın; sahte sunucunun bu sınırlarını düzeltin.

**CX-F3-Ö-07 — Gerçek ekran okuyucu kabul kanıtı eksik.**  
`gantt-secimi.md:140` ve `oturum-4-kapanis.md:15` gerçek cihaz denemesi istiyor; `dogrulama-F3.md:162` yapılmadığını dürüstçe söylüyor. Chromium ağacı yararlı destek kanıtıdır, bu ölçütün tamamlanması değildir. F4 içinde VoiceOver/Safari veya NVDA/Firefox turu, özellikle açık alt görevler ve sanallaştırma için tamamlanmalı.

## Küçük bulgular (CX-F3-K-NN)

- **CX-F3-K-01 — Pano istisnası belgelenmemiş.** Rozetin bayat kalmasını düzeltmek kabul edilebilir bir gerekçe; `ortak-kurallar.md:75,81` ve `E3:125` açık istisnayla güncellenmeli. `query-keys.ts:258` açıklaması tek başına bağlayıcı kuralı değiştirmiyor.
- **CX-F3-K-02 — Kapanış kayıtları doğrulama birleşimini izlememiş.** `ilerleme.md:15,29` hâlâ doğrulamayı bekliyor; yeni sekiz kusur `dogrulama-F3.md:149` tablosunda kalmış, F4 iş kimlikleri yok. 03 README’nin `:31,80,89` davranış sütunlarında eski “F3’te/devre dışı/kurulmaz” metinleri de duruyor.
- **CX-F3-K-03 — Çakışma sonrası yeni gönderim ilk bağlamı taşımıyor.** `use-date-actions.ts:115` sonrasında `send(server,next)` çağrısı `:90` üzerinden yeni bağlam yakalıyor; §7’nin ilk bağlamı taşıma kuralına uymuyor. Mevcut sökülme korumasına rağmen aynı sahipte kapsam değişimi için kaynak düzeyinde savunma eksik; ilk `context` korunmalı. Bu akışla fiilî kapsam aşımı bu koşumda doğrulanmadı.
- **CX-F3-K-04 — 05 odak dönüşü borcu sürüyor.** `organization/pages/UsersPage.vue:66` yalnız URL değiştiriyor; `ilerleme.md:72` doğru kaydetmiş. F4 ortak odak işinde kapatılmalı.
- **CX-F3-K-05 — Görsel küçük kusurlar açık.** Bugün etiketi çakışması, bağımlılık alan hatasının genel iletiye düşmesi, bayat F2 boş durum metni ve dar kod sütunu `dogrulama-F3.md:151–156` içinde kayıtlı. Bu koşumda görsel olarak yeniden doğrulanmadı.

## Bağımsız sınıf taraması — yaşam döngüsü / yazma kararı sınıfı

| Sınıf sorusu | Taranan diğer yollar ve sonuç |
|---|---|
| **Bekleyen işlem yeni yazma kararı mı?** | Evet. Zamanlayıcı `useDelayedSend.ts:118` sahibin yaşamını, kapsamı ve nesli kontrol ediyor; yük ilk `context` ile motora gidiyor. Klavye `dateKeyBinding` → `nudge` → aynı planlama yolu (`useGanttKeyboard.ts:135`, `useDateChange.ts:182`); **Ö-01 iki girişte de geçerli**. |
| **401 özdeş tamamlama farklı mı?** | Evet. `S/http/client.ts:139` aynı kimlik/nesilde klon isteği bir kez gönderiyor; kapsam/sahip değişimi özgün isteğin tamamlanmasını engellemiyor. §7 `:93–94` ayrımıyla uyumlu. |
| **Geç sonuç başka yerde ek iş başlatıyor mu?** | Panel Kaydet/onay/red `use-date-actions.ts:96,155`; talep formu `use-date-request-form.ts:101`; bağımlılık ekle/kaldır `use-dependency-dialog.ts:73,87` sonuçta `reachesOwner` kullanıyor. **Ö-04’teki sürükleme göndericisi aynı korumayı taşımıyor.** |
| **Çakışma sonrası yeni karar ilk bağlamı koruyor mu?** | Motor tekrarları koruyor (`engine.ts:349,353`); sürüklemenin ön okuma sonrası yazması `context` geçiriyor (`useDateSend.ts:107`). Panelin alan çözümü sonrası recursive gönderimi geçirmiyor: **K-03**. |
| **Ö-08 aynı sınıftan başka okuyucuda var mı?** | Timeline dört sorgu ve tükettiği görev/dosya/alt görev okuyucuları sarılı. Ortak `session-isolation.test.ts:162,206` gerçekten kardeş mesajı ve başka hesaba geçiş sınıfını kapsıyor; timeline entegrasyonunun kendi iddiası yine **Ö-06** nedeniyle eksik. |
| **Kabul kanıtı yanlış öğeyi başka yerde mi ölçüyor?** | E-42 testi panel metnini; tek durak testi yalnız `role=row` öğelerini ölçüyor. Ö-02/03’teki iki örnek aynı “test adı kabulü karşılıyor, seçici karşılamıyor” sınıfında. Diğer örneklemde ek kesin örnek saptanmadı. |
| **Görsel/erişilebilirlik borcu benzer yerde mi?** | 03c panel görünürlüğü Ö-05; 05 kapanış odağı K-04. E-42 ve açık alt görev hiyerarşisi, Ö-07 gerçek cihaz turuna özellikle eklenmeli. |
| **Belge sapması başka yerde mi?** | Pano istisnası K-01; doğrulama durumu ve uzantı raporu K-02. F4 iskeleti açık ürün onayı kapısını koruyor (`web-4/README.md:3`). |

## Kabul edilen bilerek-yapılmayanlar

- **Dışa aktarım pilotu:** P19 izin veriyor; düğmeler “yakında”, tıklama işlem üretmiyor.
- **Gönderilmiş zincire otomatik geri alma yok:** P18 ile doğru; ters PATCH uydurulmamış.
- **Kapalı alt görevlerde sayaç/çubuk/elmas yok:** BE-051/020 ve fan-out sınırıyla uyumlu.
- **Alt görev bloğunun liste gelince kısa kayması:** kayıtlı, veri doğruluğunu etkilemeyen borç olarak kabul.
- **`planned_end_on` salt okunur, düzenlenen bitiş `end_on`:** pinli tamamlanma/uzatma davranışıyla tutarlı; planı yanlışlıkla ezmiyor.
- **Gerçek ekran okuyucu yokluğu ve 05 odak dönüşü:** tamamlanmış kabul sayılmadı; Ö-07/K-04 olarak devredilebilir.

## F4 (toplantılar) için riskler ve ön koşullar

1. Ürün sahibinin açık F4 onayı alınmalı; bu denetim onay yerine geçmez.
2. Ö-01–Ö-07 ve K-01–K-05 sahip, iş kimliği ve kabul ölçütüyle F4 kaydına aktarılmalı.
3. Gecikmeli yazmanın tam iptal süresi korunmalı; toplantı akışlarına erken `flush` kalıbı taşınmamalı.
4. Yeni karar/ardıl adım ilk `context` ile gönderilmeli; 401 özdeş tamamlama ayrı tutulmalı.
5. Yeni okuyucular ilk günden `sessionBound` ve `signal` taşımalı.
6. Anahtarsız toplantı yazmalarında bilinmeyen sonuç kör tekrara açılmamalı.
7. Pano/rozet geçersizleme istisnası ortak sözleşmede kesinleştirilmeli.
8. Gerçek ekran okuyucu, tüm odaklanabilir öğeler ve panel görünürlüğü kabul turuna eklenmeli.
9. Pin yükselirse yalnız yeni pinin sözleşmesiyle BE yolları güncellenmeli; mevcut “Şimdilik”ler kendiliğinden kaldırılmamalı.
10. Kapanış raporu, görsel tanık ve CI kanıtı aynı üretim koduna bağlanmalı; `dc3f84f..HEAD` üretim kaynak farkı bu koşumda boştur.