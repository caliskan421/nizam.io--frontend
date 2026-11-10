# WEB-P (pin aşaması, `v0.15.0-api`) — Codex nihai kapı hükmü

**Son hüküm: KOŞULLU UYGUN** — 2. koşum, `main` @ `1bd80b6` (#77–#86 birleşik). Tur 1'in tek engelleyici bulgusu CX-P-E-01 (rerun/retry/confirm dönüşlerinde sahip yaşamı denetlenmiyor) kapandı; F4 açılışını engelleyen yeni somut açık saptanmadı.
Koşullar (tur 2 "F4'e devredilenler"; F4 içinde kapatılır):
- **Ö-02:** yalnız mercek değişiminde ve eski 409 sonradan geldiğinde aktarım teklifi düşmeli; sıfır ikinci POST ile birlikte eski teklifin görünmemesi ölçülmeli.
- **Ö-05 / K-04:** gerçek 390/1024/1440 yerleşiminde tutamaç hit-test'i, klavye/odak kabulü ve gerçek watcher/scope temizleme testleri.
- **K-02:** kalan çelişkili kabul metinleri temizlenmeli; `dogrulama-pin.md` eski G-3 kaydı yeni doğrulama kanıtıyla ilişkilendirilmeli.
- **Ö-03 ek güvence:** alt görev yaz→satırı kapat/aç ve Admin değiştir→pano sayısı senaryoları.
- **Ayrı kapsam kararı (koşul değil):** work uçlarına genel "tek tekrar" politikası K5'in zorunlu kapanış koşulu değildir; istenirse F4'te kapsamı açıkça belirlenir.
- **Gerçek ekran okuyucu / cihaz kabulü** hâlâ doğrulanmamıştır (F3'ten devralınan Ö-07).
Denetçi: Codex, `codex exec -s read-only` (model `gpt-6.1-sol`, medium), her koşum tek ve salt okunur; test/lint/build çalıştırmadı, dosya değiştirmedi.
Kayıt: yürütme `docs/yurutme/web-4/ilerleme.md` ("Pin aşaması"); görsel tanık `docs/yurutme/web-4/dogrulama-pin.md`; bağlanan BE satırları `docs/backend-eksikleri/rapor-F3.md` §2.

| Koşum | Denetlenen dal/HEAD | Hüküm | Açılan bulgular | Düzeltme |
|---|---|---|---|---|
| 1 | `main` @ `0cba31a` (#77–#84 birleşik: WP1, WP0, WP2d, WP2a, WPf, WP2b, WP2c, WP3) | **UYGUN DEĞİL** | **CX-P-E-01** (engelleyici: `rerun`/`retry`/`confirm` dönüşlerinde sahip yaşamı denetlenmiyor) · Ö-01 (BE-050 tek tekrar) · Ö-02 (BE-107 aktarım bağlam/gövde) · Ö-03 (geçersizleme: alt görev→Gantt, `updateUser`→report) · Ö-04 (`useDateSend` bildirim önce kapsam sonra) · Ö-05 (G-3 panel tutamaç) · K-01 (§6 belge) · K-02 (eskimiş kanıt/yorum) · K-03 (çift sayaç + zaman tabanlı test) | **WP4a** (PR #86 → `c6a5fe0`, birleşim `1bd80b6`): E-01, Ö-01, Ö-02, Ö-04 · **WP4b** (PR #85 → `4413119`): Ö-03, Ö-05, K-01, K-02, K-03 |
| 2 | `main` @ `1bd80b6` (#77–#86 birleşik) | **KOŞULLU UYGUN** | E-01, Ö-01, Ö-03, Ö-04, K-01, K-03 kapandı; Ö-02, Ö-05, K-02 kısmen; K-04 (temizleme testi hedefini ölçmüyor) yeni küçük bulgu; WP4a gözlemi (work anahtarlı tekrar sınırsız) K5 ihlali değil; yeni engelleyici yok | Kapanış PR'ı (bu belge, yalnız `docs/**`): Ö-02, Ö-05/K-04, K-02 kalanı, Ö-03 ek senaryolar → F4 devri; work tekrar politikası ayrı kapsam kararı; VoiceOver/gerçek cihaz → F4 borcu |

Düzeltme planı (koordinatör, 2026-11-10): **Tur 1 → WP4b (#85) + WP4a (#86)** (yukarıda). **Tur 2 → kapanış PR'ı (`webp/kapanis`, yalnız `docs/**`):** hüküm, F4 devri, ürün sahibi F4 kararları (`docs/ekranlar/ortak-kurallar.md` §12 P21–P31) ve `web-4/ilerleme.md` "Pin aşaması" kaydı. **PİN AŞAMASI KAPANDI 2026-11-10.**

Aşağıda koşumların tam metni sırayla yer alır (önce tur 2, sonra tur 1).

---

# WEB-P (pin aşaması) — Codex nihai kapı hükmü, tur 2

- **Hüküm: KOŞULLU UYGUN.** F4 açılışını engelleyen CX-P-E-01 kapanmıştır; incelenen düzeltmelerde F4 öncesinde kapanması zorunlu yeni somut açık saptamadım. Ö-02’nin mercek/geç teklif boşluğu, Ö-05’in doğrulama eksikleri ve kalan küçük bulgular F4 içinde kapatılmalıdır.
- **HEAD:** `1bd80b60b19d2d5b64518071822934c8eba96e5c`.
- **Komutlar:** İlk olarak `git rev-parse HEAD`, `git log --oneline -12`, `git status --short`; ardından `cat`, `nl -ba`, `sed`, `rg`, `git diff 0cba31a..HEAD`, `git diff --check`, backend etiketi için `git show v0.15.0-api:docs/api/istemci-akislari.md`. Başlangıç ve bitiş çalışma ağacı temiz; diff denetimi çıktısız.
- **Dosya değiştirilmedi; test/lint/build çalıştırılmadı.** PR başına üç yeşil CI işi, WP4a **3035**, WP4b **3026** test: **kullanıcı beyanı**. Aşağıdaki test değerlendirmeleri kaynak/assertion incelemesidir.
- Tur 1 hükmü ve istemi okundu. `../program/` bulunmuyor; alternatif `../nizam.io--program/program/DURUM.md` güncel WEB-P durumunu taşımıyor.

Kanıt kısaltmaları: **S**=`src/shared`, **O**=`src/modules/organization`, **T**=`src/modules/timeline`, **W**=`src/modules/work`, **I**=`src/app/__tests__/integration`, **D**=`docs/ekranlar`. Satırlar incelenen HEAD’e aittir.

## Tur 1 bulgularının durumu — tablo

| Bulgu | Durum | Kanıt ve testin ölçtüğü |
|---|---|---|
| **E-01** | **KAPANDI** | `S/http/mutation/use-protected-mutation.ts:168–170` artık `rerun` dönüşünde yaşamı denetliyor; `O/api/keyless.ts:124–147` onay sonrası sertleştirmeyi de `finish` ile tamamlıyor. `use-protected-mutation.detached.test.ts:213,239` başarı→geçersizleme beklemesi→söküm penceresini **retry/confirm ayrı ayrı** kuruyor; uzlaştırmanın tamamlanmasını, `reachesOwner=false`, bildirim ve toast yokluğunu ölçüyor. `O/api/members.test.ts:183` gerçek anahtarsız onay sarmalamasını ayrıca kapsıyor. |
| **Ö-01** | **KAPANDI** | `O/api/keyless.ts:60–102` her `submit` sonucuna ayrı tekrar sarmalı kuruyor; ikinci belirsizlikte yakalanmış kapsamda geçersizleme ve `retry:null` var. `O/api/departments.ts:218,239` iki ucu kullanıyor; `department-create.ts:99–103` belirsiz bağ adımını koruyor. `departments.test.ts:266,284` iki POST, aynı anahtar, `retry:null` ve bağda yeniden okumayı ölçüyor. `I/pin-koordinatorluk.test.ts:144` ve devamındaki üç senaryo bileşik bağ kaybını ve oluşturma sınırını UI üzerinden kapsıyor. |
| **Ö-02** | **KISMEN** | `UserCreateDialog.vue:127–130,151` ilk normalize gövdeyi ve `failed.context`’i saklayıp taşıyor. `UserCreateDialog.test.ts:219` ikinci gövdenin yalnız `transfer_account_id` ilavesiyle aynı olduğunu gerçekten ölçüyor. Ancak `use-transfer-offer.ts:53–70` **lens’i karşılaştırmıyor/izlemiyor**; geç gelen teklif ataması da yeniden doğrulanmıyor. Ayrıntı aşağıda. |
| **Ö-03** | **KAPANDI** | `S/http/query-keys.ts:283,357–360` `updateUser→report` ve alt görev→Gantt bağlantılarını ekliyor. `query-keys.test.ts:260` üç alt görev işleminin gerçek Gantt filtresini vurduğunu ölçüyor; Admin için üyelik assertion’ı var. Test **yaz→kapat/aç ekran akışını veya pano sayısının değişmesini ölçmüyor**; harita düzeltmesini doğruluyor. |
| **Ö-04** | **KAPANDI** | `T/composables/useDateSend.ts:123` yaşam/bağlam denetimini bildirimlerden önce yapıyor. `useDateChange.test.ts:413` çakışma GET’ini bekletiyor, sahip bağlıyken merceği değiştiriyor ve sıfır toast/ek geçersizleme ölçüyor; hedeflenen yarış penceresini gerçekten kapsıyor. |
| **Ö-05** | **KISMEN** | `T/pages/timeline/use-panel-reveal.ts:92–110,135–143` kaydırma sonrası ve derin bağlantıda koruma getiriyor. `use-panel-reveal.test.ts:83,108` sahte geometrilerde kaydırma çağrısını ve odak çalınmamasını ölçüyor. **Gerçek 390/1024/1440 yerleşimi, tutamaç hit-test’i ve klavye erişimi doğrulanmış değil**; temizleme testi de hedefini ölçmüyor (K-04). |
| **K-01** | **KAPANDI** | `D/ortak-kurallar.md:83–90` görev/tarih/devir kapsamını, dışarıda kalanları ve etkin okuma maliyetini belgeliyor; kod kümesi `S/http/query-keys.ts:363–367` ile uyumlu. `query-keys.test.ts:251,274` kapsam ve program sınırını ölçüyor; gerçek ağ maliyeti ölçümü değil. |
| **K-02** | **KISMEN** | Hedeflenen 05 satırları, timeline yorumları ve kök README düzelmiş. Fakat `D/05-kullanicilar/README.md:39` canlı sunucu rol süzgecinin yanında hâlâ “ret — sunucu role süzgeci”; `:40` e-posta aramasının yanında “e-posta aranmaz”; `:55` canlı toplamın yanında “toplam metni üretilmez testi” yazıyor. `D/ortak-kurallar.md:81` eski pano yasağını yeni kapsamın hemen üstünde koruyor. |
| **K-03** | **KAPANDI** | `O/api/users.ts:142–159` departman seçiliyken programlı ikinci sorguyu kapatıp tek okumayı kullanıyor. `users.test.ts:179` **tam bir GET**, parametreler ve sayaç sonucunu ölçüyor. H-4 testi `:119–130` artık `settleQueries`, tam iki okuma, sıfır uçuş ve devam hatası durumunu ölçüyor; sabit 150 ms bekleme kaldırılmış. |

**Ö-02’nin kalan somut kapsamı:**

- **Yalnız mercek değişimi:** `use-transfer-offer.ts:53–70` program/departman aynı kalırken `lens` değişimini görmez. Ortak form kapanışı da yalnız program/departmanı izler (`form-kit.ts:88–92`).
- “Mercek” testi `UserCreateDialog.test.ts:211–216` hem lens’i **hem departmanı** değiştirir; yalnız mercek senaryosunu kanıtlamaz.
- **Geç teklif:** İlk POST beklerken kapsam değişirse watcher o anda `bound=null` görür. Ardından eski 409 gelir ve `UserCreateDialog.vue:151` eski teklifi doğrulamasız atar; watcher `bound` atamasını izlemiyor.
- Motor `sameScope` içinde lens’i de karşılaştırdığı için bu durum **yeni kapsamda ikinci POST bypass’ı değildir** (`S/http/mutation/engine.ts:118–123,319–335`). Kalan kusur eski teklifin yeni bağlamda görünmesi/yeniden belirmesidir.
- Kapanış: teklif atanırken ve tüketilirken geçerliliği denetleyin; yalnız-lens değişimi ve bekletilmiş 409 sırasında kapsam değişimini test edin.

**Ö-01’in sınır kapsamı:** Global sayaç yok; sınır her `submit` sonucunun devam zincirine bağlıdır. İki uç ve bileşik bağ adımı ayrı anahtarlarını korur; UI tekrar sırasında kilitlenip dönen sonucu değiştirir (`S/ui/confirm/UiOutcomeNotice.vue:39–46`). Eski `retry` fonksiyonunu yeniden çağrılamaz yapan tüketim kilidi bulunmuyor; mevcut UI akışında bunun üçüncü gönderime dönüştüğü kanıtlanmadığından yeni açık saymadım.

## Yeni bulgular (CX-P-…, tur 1 numaralarından devam)

**CX-P-K-04 — Panel dinleyicisi temizleme testi temizlemeyi ölçmüyor.**

- `T/pages/timeline/use-panel-reveal.test.ts:97–105` “seçim kalkınca dinleyiciler bırakılır” diyor; fakat seçimi `null` yapmıyor, sahip scope’unu durdurmuyor, yalnız DOM’u kaldırıyor.
- Üretim dinleyicisi `use-panel-reveal.ts:102` zaten `!panel.isConnected` durumunda çıkar. Dolayısıyla dinleyici sızsa bile test geçebilir.
- Ayrıca assertion yalnız yatay `ganttScrollBy`’a bakıyor; aynı geometri önceki testte **dikey `window.scrollBy`** seçiyor (`test.ts:92–94`).
- Kapanış: bağlı DOM’da seçimi kaldırma ve scope sökümünü ayrı ölçün; ölçüm/scroll casuslarıyla callback’in çalışmadığını doğrulayın. Bekleyen `settled()` sırasında seçim değişimini de kapsayın.
- **Önem:** küçük test kanıtı açığı; bu inceleme çalışma zamanında dinleyici sızıntısı kanıtlamıyor.

**WP4a gözlemi — work anahtarlı tekrarları: K5 ile doğrudan çelişmiyor.**

- K5 tablosundaki **tek tekrar** ifadesi `platform.conflict_retry` içindir; “sonuç bilinmiyor” için taslak/anahtar koruma ister (`docs/architecture/yol-haritasi-web.md:21`).
- Pinli backend `istemci-akislari.md:462–468` aynı anahtar/gövdeyle yeniden denemeyi ve 24 saat sınırını tarif eder; genel bir **bir kullanıcı tekrarı** sınırı koymaz.
- Work uçları doğrudan ortak motoru kullanıyor: `W/api/subtasks.ts:29`, `notes.ts:25`, `files.ts:33`; motor her belirsizlikte aynı eylemden yeni devam üretir (`engine.ts:227–245`). Alt görev UI’si bunu açıkça yeniden kullanır (`use-subtask-add.ts:41–58`).
- Dolayısıyla BE-050/056’ya özel **tek tekrar→yeniden oku** kabulünü bütün work uçlarına genelleştirmiyorum. **F4 öncesi engel yok; zorunlu K5 ihlali olarak F4’e de yazılmamalı.** Ortak ürün politikası istenirse F4 içinde kapsamı açıkça belirlenebilir.
- “Çift kayıt riski yok” ifadesi mutlak kullanılmamalı: pinli sözleşme kalıcı silinen not/alt görev/dosyanın anahtarının da silindiğini ve tekrarın kaynağı yeniden oluşturabileceğini açıkça kabul ediyor (`:467–468`).

## Bağımsız sınıf taraması

| Sınıf | Yeniden inceleme sonucu |
|---|---|
| **Yeni yazma kararı / sahip yaşamı** | `engine.ts:319–355` ilk gönderim, kullanıcı tekrarı, onay ve conflict tekrarından önce sahip/kapsam/nesil kapısını koruyor. E-01 düzeltmesi bu kapıyı kaldırmıyor; tüketiciye dönüşte ek yaşam denetimi getiriyor. |
| **401 özdeş tamamlama** | `S/http/client.ts:139–147` özgün Request klonunu yalnız Authorization değiştirerek gönderiyor; nesil ve hesap eşitliği şart. Yeni `rerun` denetimi bu taşıyıcı yoluna müdahale etmiyor. `client.retry.test.ts:137,202` kapsam değişirken özdeşliği ve en fazla iki isteği ölçüyor. |
| **Anahtarsız belirsizlik / onay** | `O/api/keyless.ts:135–147` kör tekrarı düşürüyor, ortak yeniden okumayı sürdürüyor ve onay dönüşünü yaşam denetiminden geçiriyor. Ortak uzlaştırma ile ekran bildiriminin ayrımı korunmuş. |
| **Koordinatörlük bileşik yazması** | `O/api/departments.ts:302–313` ilk bağlamı ardıl adıma taşıyor. `department-create.ts:99–103` kayıp bağ yanıtını yeni anahtarlı teklif yerine mevcut sonuca bağlıyor. Yeni korumasız ardıl POST saptamadım. |
| **Kullanıcı aktarımı** | Gövde/bağlam korunmuş; Ö-02’deki yalnız-lens ve geç teklif boşluğu sürüyor. Motor kapsam kapısı ikinci POST’u koruyor. |
| **Hesap/Admin onayı** | `UserRoleCards.vue:51–68`, `UserAccountActions.vue:75–83` onay bağlamını `submit`’e taşıyor. İncelenen devamlarında yeni bağlam yakalama bypass’ı saptamadım. |
| **Timeline geç sonuç** | `useDateSend.ts:123` ekran etkilerinden önce bağlamı denetliyor. BE-056 sarmalı `T/api/mutations.ts:133–143` tek tekrar, yeniden okuma, `retry:null` ve son sahip kontrolünü koruyor. |
| **Panel performans / odak** | Dinleyiciler pasif; scroll başına geometri ölçmek yerine 160 ms durulma kullanıyor (`use-panel-reveal.ts:99–106`). Yüzen panel yolu odak çağırmıyor; dar panel kullanıcı seçiminde odaklanıyor (`:35–37`). Ölçülmüş performans sonucu yok; gerçek yerleşim/klavye kabulü ve K-04 açık. |
| **Okuyucu / oturum** | `rg queryFn` taramasında ilgili API sorguları `sessionBound` kalıbını koruyor; yardımcı `S/session/query-session.ts:58–66` geç yanıtı nesil+hesapla reddediyor. Program formunun doğrudan okuyucusu kapanış/söküm iptalini koruyor (`use-program-form.ts:46–79`). |
| **Geçersizleme / liste ilerlemesi** | Gantt ve report eksikleri eklenmiş; `shell-counts` filtresi korunmuş (`query-keys.ts:511–518`). Kullanıcı boş sayfa ilerlemesi hata veya ardışık boş sayfa sınırında duruyor (`O/api/users.ts:210–215`). |
| **Sunucu metni** | `S/errors/api-error.ts:29–32,122–124` veri taşımasını aynı iki alan koduyla sınırlıyor; düzeltmeler yeni metin geçişi eklemiyor. |

## F4'e devredilenler

- **Ö-02:** yalnız mercek değişiminde ve eski 409 sonradan geldiğinde teklif düşmeli; sıfır ikinci POST ile birlikte **eski teklifin görünmemesi** ölçülmeli.
- **Ö-05 / K-04:** gerçek 390/1024/1440 yerleşiminde tutamaç hit-test’i, klavye/odak kabulü ve gerçek watcher/scope temizleme testleri tamamlanmalı.
- **K-02:** kalan çelişkili kabul metinleri temizlenmeli; `dogrulama-pin.md:104–110` içindeki eski G-3 kaydı yeni doğrulama kanıtıyla ilişkilendirilmeli.
- **Ö-03 ek güvence:** alt görev yaz→satırı kapat/aç ve Admin değiştir→pano sayısı senaryoları eklenmeli; mevcut testler haritayı ölçüyor.
- Work tekrarlarına genel tek tekrar politikası getirmek **ayrı bir kapsam kararıdır**; mevcut K5’in zorunlu kapanış koşulu değildir.
- Gerçek ekran okuyucu/cihaz kabulü hâlâ doğrulanmamıştır (`docs/yurutme/web-4/dogrulama-pin.md:118`).

---

# WEB-P (pin aşaması) — Codex nihai kapı hükmü

- Hüküm: **UYGUN DEĞİL.** Ö-08’in ilk `submit` yolu düzelmiş, ancak dışarı verilen `retry`/`confirm` devamlarında aynı başarı geçersizlemesi yarışı sürmektedir; açıkça F4 öncesine devredilmiş bu koşul nedeniyle CX-P-E-01 kapanmalıdır. Diğer bulgular F4 içinde kapanabilir.
- **HEAD:** `0cba31a24d6a7c55a9fb8b7f96e7abdcdcdaa0d5`; başlangıçta ve sonda `git status --short` boş.
- **Komutlar:** İlk olarak istenen üç Git komutu; ardından `git log --first-parent f3b78b2..HEAD`, `git diff`, `git show`, `rg` (`rg "200" src`, `queryFn`, `designStub` dahil), `cat`, `nl -ba`, `sed`; ölçüm JSON’larına salt okunur Python incelemesi.
- **Dosya değiştirilmedi; test/lint/build çalıştırılmadı.** PR başına üç yeşil CI işi ve 414 dosya / 3020 testin iki koşusu **kullanıcı beyanıdır**. Aşağıdaki test hükümleri assertion incelemesidir.
- `../program/` bulunamadı; `../nizam.io--program/program/DURUM.md` bulundu, ancak güncel WEB-P kaydı taşımıyor. İnceleme teslim edilen PR zinciri ve depo kayıtlarına dayandı.

Kanıt kısaltmaları: **S**=`src/shared`, **O**=`src/modules/organization`, **T**=`src/modules/timeline`, **W**=`src/modules/work`, **I**=`src/app/__tests__/integration`, **D**=`docs/yurutme/web-4/dogrulama-pin.md`. **B**=`../nizam.io--backend/docs/api/openapi.yaml` dosyasının **`v0.15.0-api` etiketi üzerinden `git show` ile okunan** satırlarıdır.

## Madde hükümleri (1–12) — tablo

| # | Hüküm | Kanıt ve değerlendirme | Öneri |
|---|---|---|---|
| 1 | **UYGUN DEĞİL** | Ö-03 kapalı: `T/components/gantt/GanttRows.vue:107,147,235`, `subtasks/SubtaskRows.vue:95`; test `GanttRows.subrows.test.ts:81,101` iki açık blokta bütün DOM sırasını ve pencere ortasındaki mutlak indeksleri ölçüyor. Ö-04’ün ön GET yolu kaldırılmış: `T/composables/useDateSend.ts:146`; test `useDateChange.test.ts:125` ön GET olmamasını ve satır sürümünü ölçüyor. Ö-08 ilk `submit` için kapalı; devamlar için **E-01** açık. | E-01’i F4 açılmadan kapatın. Ö-04’ün kaldırılan senaryosunu yeni akışın yarışlarıyla tamamlayın. |
| 2 | **UYGUN** — uç/alan eşlemesi | Aşağıdaki karşılaştırma bütün 18 `bağlandı` kimliğini ve ≥25 alanı kapsıyor. `api-pin.json:3`, `scripts/gen-api.ts:35,43` etiket kaynağını koruyor. Kalan işlevsel stub kimlikleri kayıtla uyumlu; protokol kusurları 3/12’de ayrıca değerlendirildi. | `bağlandı` durumunu bütün davranış ölçütlerinin geçtiği anlamında kullanmayın; açık bulguları ilişkilendirin. |
| 3 | **UYGUN DEĞİL** | BE-056: aynı anahtarla bir tekrar, sonra `retry:null` ve yeniden okuma var (`T/api/mutations.ts:133–143`); testler `mutations.test.ts:211,333,356`. BE-050’de tekrar sınırı ve bileşik bağ adımı eksik (**Ö-01**). Motor tekrar öncesinde sahip/kapsam/nesil denetliyor (`S/http/mutation/engine.ts:319–355`); bu yoldan sökülmüş sahip adına yeni yazma bypass’ı saptanmadı. | Ö-01; ayrıca E-01. |
| 4 | **UYGUN** | Üç Gantt yüzü `unwrapList` kullanıyor (`T/api/fetchers.ts:27–40`); başlık `S/http/truncation.ts:32` üzerinden okunuyor. Kullanıcı/katalog/ekip/program listeleri de ortak kesilme yardımcılarını kullanıyor (`O/api/users.ts:72`, `departments.ts:144`, `members.ts:54`, `S/scope/standing.ts:78`). `rg "200" src` taramasında çalışan tam-200 sezgisi bulunmadı; eski yorumlar kaldı. `I/pin-zaman.test.ts:50,61` 200/201 ayrımını ölçüyor. | Eski yorumları düzeltin; **K-02**. |
| 5 | **UYGUN** — davranış | K/Ü `program_id` ile; Tümü/Admin departman süzgeci yokken kapsamsız (`O/components/users/use-users-view.ts:55–77`). Sayaçlar `role_counts`’tan (`O/api/users.ts:114–157`). H-4 hata sonrası duruyor, sınır son 20 ardışık boş sayfada (`:208–239`); imleç bitmezse kullanıcı devam edebiliyor. Başka kanıtlı otomatik sonsuz döngü saptanmadı. Kabul tablosu eski davranışları da taşıyor. | **K-02/K-03**; uzun dolu zincir ardından boş sayfa ve manuel devamı da ölçün. |
| 6 | **UYGUN DEĞİL** | H-1 düzeltmesi `counts` ve `shell-counts`’ı kapsıyor (`S/http/query-keys.ts:505–512`); `users.detail` kullanıcı önekiyle yenileniyor (`:68,405–420,488`). Ancak yeni alanların bazı geçersizlemeleri eksik (**Ö-03**). Admin pano istisnası kodda genişlemiş (`:357–362`), bağlayıcı §6 hâlâ yalnız iki uca izin veriyor (**K-01**). | Ö-03 ve K-01. Sınırsız fan-out kanıtı yok; ayrı rozet/sayaç okumaları ve etkin pano maliyeti mevcut. |
| 7 | **UYGUN** | `value` yalnız iki alan kodunda taşınıyor (`S/errors/api-error.ts:29–32,122–124`); diğer mesajlar atılıyor. Test `S/http/client.test.ts:351–376` üçüncü kodda sızmamasını ölçüyor. Aktarım adı Vue metin interpolasyonuyla gösteriliyor (`O/components/forms/UserCreateDialog.vue:208–214`); bu sözleşmedeki kişi verisidir, sunucu hata açıklaması değildir. | İzin listesini dar tutun; yorumdaki “yalnız eylem değişkeni” ifadesini adın gösterimini de açıklayacak şekilde düzeltin. |
| 8 | **UYGUN** | Şirket yöneticisi ve kendisi olmayan hedef kapıları `O/model/capabilities.ts:199,201`; kapatma onayın bağlamını geçiriyor (`UserAccountActions.vue:75–83`), Admin değişimi de geçiriyor (`UserRoleCards.vue:51–68`). Kapatma bütün oturumları iptal eder, açma eski oturumları geri getirmez: B:7759–7764,7834–7837. Testler `UserAccountActions.test.ts:104,141`, `UserRoleCards.test.ts:54,96`. | Bu turda gerçek oturum iptalini bağımsız çalıştırmadığım için sunucu etkisini sözleşme kanıtı olarak değerlendirin. |
| 9 | **UYGUN** | Üretim `queryFn` taramasında yeni sayaç, kullanıcı ve departman okuyucuları `sessionBound` + `signal` taşıyor: `W/api/queries.ts:124`, `O/api/users.ts:128,184,262`, `departments.ts:116`, `src/app/shell/side/badges.ts:114,152`. Kapı eski neslin geç yanıtını reddediyor (`S/session/query-session.ts:58–66`). | Yeni okuyucularda aynı kalıbı koruyun. Mutasyon içindeki doğrudan `readCurrent` okumalarını bununla karıştırmayın. |
| 10 | **UYGUN** | `e2e/backend/up.sh:60–73` her beklenen FROM için tam bir eşleşme ve runtime digest eşitliği istiyor; `:85–93` BuildKit pinini ve sonraki denetimi koruyor. Etiketteki Dockerfile:19,40 iki tabanı digest’le sabitliyor. Go pini artık backend etiketi tarafından belirleniyor; kayan etikete dönüş yok. | `README.md`’deki eski “FROM yeniden yazılır” açıklamasını güncelleyin. |
| 11 | **DOĞRULANAMADI** — bağımsız görsel kabul | Ham dört `olcum-*.json` dosyasında 48’er, toplam 192 kayıt; taşma/CSP/pageerror/hatalı API toplamları 0. Bunların **60’ı yönetim rotasından `/` yönlendirmesi**, dolayısıyla 192 ayrı ekran kabulü değildir; D:75 bunu açıklıyor. Görüntülere görsel inceleme uygulanmadı. G-1/2/4 kabul edilebilir borç; G-3 etkileşim kusuru (**Ö-05**). | Matrisin yönlendirme sınırını koruyun; G-3’ü “yalnız görsel” kabul etmeyin. |
| 12 | **UYGUN DEĞİL** | Yeni kullanıcı aktarımı ilk eylemin gövde/bağlamını saklamıyor (**Ö-02**). Koordinatörlük ardıl adımı ilk bağlamı taşıyor (`O/api/departments.ts:300–313`); timeline motor kapılarını kullanıyor. Ortak sonuç yaşamındaki E-01 devam ediyor. | E-01’i önce; Ö-02 ve aşağıdaki sınıf bulgularını F4 içinde kapatın. |

**Pinli sözleşme karşılaştırması — bütün bağlı BE’ler:**

| BE | Denetlenen uç/alanlar | Pinli kaynak → tüketici |
|---|---|---|
| 001 | Program `short_name`, `color`; güncellemede açık `null` | B:551–561,605–613 → `src/modules/program/model/program-form.ts:86–114`, `src/app/shell/side/program-avatar.ts:74–77` |
| 003 | `countProgramWorkItems`: `total`, `by_status` ve beş durum, `overdue`, `pending_date_requests` | B:2665–2699,5682–5705 → `W/api/fetchers.ts:60–73`, `src/app/shell/side/badges.ts:56–72` |
| 038 | `assignee_account_id` dizisi, `department_id`; liste/sayaç aynı süzgeç | B:248–265,5686–5714 → `W/api/fetchers.ts:33–73`, `O/api/work.ts:8–10` |
| 011/045 | `listUsers`: `program_id`, `department_id`, `total`, `next_cursor`, `role_counts.{all,company_admin,koordinator,uye}`; ekipsiz canlı hesaplar | B:919–944,7022–7039 → `O/api/users.ts:64–103,114–157,189–224` |
| 041/042/044 | `KnownUser.email`, `company_admin`, `account_status`, `login_locked`, `memberships`; `search`, `role` | B:862–888,173–189 → `O/components/users/user-rows.ts:41–49`, `O/api/users.ts:75–81` |
| 043 | `readUser`, `account_id`, `full_name` ve listeyle ortak alanlar | B:7208;862–893 → `O/api/users.ts:248–285`, `components/tracking/use-person-profile.ts:54–62` |
| 012 | `disableAccount`/`enableAccount`; `account_status`, `changed`, `revoked_sessions` | B:846–861,7755,7830 → `O/api/users.ts:375–395`, `UserAccountActions.vue:72–93` |
| 049 | `readProgramDepartment`: `department_id`, `display_name`, `code`, `description`, `kind` | B:2712–2729,5776 → `O/api/departments.ts:92–118`, `components/detail/CoordinatorshipDetail.vue:49–53` |
| 050 | `createDepartment`/`linkDepartment`, `Idempotency-Key`, `department_id`, `deleted`, `display_name`, `copy_members_from_program_id` | B:5469–5487,6082–6095 → `O/api/departments.ts:205–255`; tekrar protokolü Ö-01 |
| 051/052/053 | Gantt `subtask_counts.{total,done}`, `pending_date_request.{request_id,new_start_on,new_end_on}`, `dates_revision` | B:3115–3145 → `T/components/subtasks/use-subtask-summary.ts:36–39`, `gantt/GanttBars.vue:63–70`, `composables/useDateSend.ts:146–148` |
| 019 | Üç Gantt ucunda `X-Result-Truncated` | B:15264,15336,15780 → `T/api/fetchers.ts:27–40`, `queries.ts:62` |
| 056 | `days`, `expected_dates_revision`, `new_end_on`, `cascade_count`, `dates_revision`, `replayed`; talepte yeni tarihler | B:3195–3224,15393–15407,15837–15850 → `T/api/mutations.ts:180–230` |
| 107 | `fields.account_id`, `fields.user_full_name`, `transfer_account_id`; aynı gövdeyle aktarım | B:7106–7120 → `O/api/users.ts:299–303,320`; gövde/bağlam devamı Ö-02 |

Kalan gerçek stub kimlikleri: **005,006,007,008,010,013,014,015,016,017,018,040,046**. Pinli sözleşmede bu kimliklerin istediği kısa sıra kodu, alt görev zorunlulukları, ilgili geçmiş/hatırlatma/davet/dışa aktarma ve özel dosya yüzlerinin karşılığı bulunmadı; mevcut başka dosya/rapor uçları aynı işlev sayılmadı. `kayit.md` satırları açık; `bağlandı` kimliklerinde çalışan stub kalmamış. **BE-003 çekirdek bağlantısı**, aynı kayıt satırında anılan fakat pinde bulunmayan `CoordinatorshipStat.max_days_overdue/pending_date_changes` alanlarının da bağlandığı anlamına gelmiyor (B:3593–3640).

## Engelleyici bulgular (CX-P-E-NN) — F4 açılmadan kapanmalı

**CX-P-E-01 — Ö-08 düzeltmesi `retry`/`confirm` sonuç dönüşlerini kapsamıyor.**

- `S/http/mutation/use-protected-mutation.ts:177–179` yalnız yeni `submit` dönüşünde yaşamı yeniden denetliyor. **`:166` içindeki `rerun` doğrudan `mutation.mutateAsync(action)` döndürüyor.**
- `engine.ts:242–245` belirsiz sonuç tekrarını, `:284–291` onay devamını bu `rerun` üzerinden dışarı veriyor. Başarı sonucu `mutationFn` içinde işaretlendikten sonra `onSuccess` geçersizlemeyi bekliyor (`use-protected-mutation.ts:149–160`).
- **Kaynakla kanıtlanan senaryo:** `retry()`/`confirm()` → başarı yanıtı → geçersizleme bekler → sahip sökülür → geçersizleme tamamlanır. Sonuç yeniden işaretlenmeden döner; `reachesOwner` yalnız WeakSet’e baktığından **true kalabilir** (`outcome.ts:199–217`). `O/api/keyless.ts:85` onay sarmalaması da başarı dönüşünde son yaşam denetimi yapmıyor.
- Yeni test `use-protected-mutation.detached.test.ts:158–183` doğru pencereyi **ilk `submit` için** ölçüyor; devamları ölçmüyor.
- **Kapanış:** yaşam denetimini `rerun` dahil bütün tüketici dönüşlerine uygulayın; aynı bekletme senaryosunu `retry` ve `confirm` için ölçün: uzlaştırma tamam, `reachesOwner=false`, ekran devamı/bildirim yok.
- **Neden engelleyici:** `docs/reviews/WEB-3-codex.md:4,13` ve `docs/backend-eksikleri/rapor-F3.md:25`, bu ortak katman koşulunu açıkça pin aşamasına/F4 öncesine koyuyor. Yeni yazmanın motor kapısını aşması iddia edilmiyor.

## Önemli bulgular (CX-P-Ö-NN) — F4 içinde kapanabilir

**CX-P-Ö-01 — BE-050’nin “tek tekrar, sonra yeniden oku” protokolü tamamlanmamış.**

- `engine.ts:241–245` her belirsiz sonuçta tekrar fonksiyonu üretiyor; `O/api/departments.ts:218,239` bunu sınırlayan sarmalayıcı kullanmıyor. `department-link.ts:57` ve `use-department-form.ts:41–57` yeniden belirsiz sonucu tekrar bildirime koyuyor; kullanıcı üçüncü ve sonraki gönderimleri yapabiliyor.
- Bileşik **oluştur başarılı → bağ yanıtı kayıp** yolunda `department-create.ts:90–97`, `result.steps` içindeki belirsiz bağ sonucunu kullanmadan yeni bağ teklifi sunuyor. `department-link.ts:68` sonraki gönderimde yeni anahtar üretiyor.
- `I/pin-koordinatorluk.test.ts:117–126` bu bileşik pencereyi test etmiyor; açıklaması mevcut departman üzerinden ayrı bağlama yoluna geçtiğini söylüyor.
- **Kapanış:** her adımın anahtarını/sonucunu koruyun; aynı anahtarla en fazla bir tekrar, ikinci belirsizlikte yeniden okuma ve `retry:null`. Hem oluşturma hem bileşik bağ kaybını ölçün.

**CX-P-Ö-02 — BE-107 aktarım teklifi ilk gövde ve bağlama bağlı değil.**

- `UserCreateDialog.vue:79` yalnız hesap/ad teklifini saklıyor; `:104–107` yalnız e-posta değişince düşürüyor. Aktarımda `:166` güncel formu tekrar doğruluyor; `:121–133` güncel program ve değerlerle **bağlamsız yeni `submit`** çağırıyor.
- Böylece tekliften sonra departman/rol/ad değişirse B:7116–7117’deki **aynı gövde** korunmuyor. Mercek değişimi de ortak form kapanışında izlenmiyor (`form-kit.ts:88–92`); ilk kapsam yerine yeni kapsam yakalanabiliyor.
- Test `UserCreateDialog.test.ts:138–140` yalnız e-postanın eşitliğini denetliyor.
- **Kapanış:** teklifin ilk normalize gövdesini ve `failed.context`’ini saklayın; ortak `confirmWrite(...,{context})` ile gönderin. Gövde/bağlam değişince teklif düşmeli; kapsam değişiminde sıfır ikinci POST ölçülmeli.

**CX-P-Ö-03 — Yeni bağlı alanlar için geçersizleme haritasında iki eksik var.**

- Kapalı Gantt alt görev sayacı satırın `subtask_counts`’ına dönüyor (`T/components/subtasks/use-subtask-summary.ts:36–39`); alt görev yazmaları Gantt’ı geçersizlemiyor (`S/http/query-keys.ts:344–354`). Güncel açık sayaç kapanınca eski satır sayacına dönebilir; kısa süre içinde Gantt’a dönüş de eski önbelleği kullanabilir.
- Admin kartı `updateUser {company_admin}` yazıyor (`UserRoleCards.vue:66`); `report` listesi `updateUser` içermiyor (`query-keys.ts:272–286,357–362`). Panodaki `total_admins` şirket yöneticiliğine bağlıdır (B:3707–3709).
- **Kapanış:** bu türevlerin geçersizlemesini ekleyin; alt görev yaz→kapat/aç ve Admin yetkisi değiştir→pano senaryolarını ölçün.

**CX-P-Ö-04 — Timeline kapsam kontrolü bildirimlerden sonra çalışıyor.**

- `useDateSend.ts:95–98` doğru kapsam/nesil kontrolünü tanımlıyor; fakat `settle():119–136` bunu yalnız ek geçersizlemeye uyguluyor. Başarı ve çakışma bildirimleri önce üretiliyor.
- Örneğin PATCH çakışması sonrası `readCurrent` beklerken sahip bağlı kalıp kapsam değişirse eski görevin alan adlı bildirimi yeni kapsamda görünebilir (`engine.ts:275,394–399`; `useToast` yalnız sahip yaşamını denetliyor: `S/ui/use-toast.ts:65`).
- **Kapanış:** ekran sonuçlarını tüketmeden önce bağlamı denetleyin; ortak uzlaştırmayı koruyun. Bekletilmiş çakışma GET’i sırasında A→B senaryosunda sıfır ekran bildirimi ölçün.

**CX-P-Ö-05 — G-3 etkileşim kusurudur.**

- D:110 tutamacın panel tarafından örtüldüğünü açıkça kaydediyor; panel üst katmanda ve görünür alana sabit (`T/pages/timeline/timeline.css:79–93`).
- Kaydırma geçici çözümü olduğu için F4 engeli saymıyorum; ancak doğrudan tarih düzenleme erişimini etkiliyor.
- **Kapanış:** seçili çubuğun tutamaçlarını panel dışında tutun veya eşdeğer erişilebilir eylemi görünür kılın; 390/1024/1440 ve klavyeyle doğrulayın.

## Küçük bulgular (CX-P-K-NN)

- **CX-P-K-01 — §6 belgesi kodla çelişiyor.** `docs/ekranlar/ortak-kurallar.md:75,81,83` yalnız iki görev ucunu istisna sayarken kod bütün görev/tarih yazmalarını kapsıyor. D:42 gerekçeyi kaydediyor ama bağlayıcı belgeyi değiştirmiyor. İstisnanın kapsamını ve etkin pano okuma maliyetini tek yerde güncelleyin.
- **CX-P-K-02 — Kabul kanıtları ve yorumlar eskimiş.** 05 README:41 hâlâ `listMembers` ve istemci süzmesi; :50 e-posta yokluğu; :54 panelin kapanması; :64 Admin tıklamasında istek olmaması testlerini anlatıyor. Timeline `components/index.ts:114`, `frame/TimelineHead.vue:13` tam-200 sezgisini yorumda sürdürüyor; kök README eski pin/yeniden yazma açıklaması taşıyor. Güncel davranış ve test dosyalarıyla eşleyin.
- **CX-P-K-03 — Sayaçlarda gereksiz çift okuma ve zaman tabanlı test.** Departman seçiliyken `O/api/users.ts:119–150` aynı parametreli iki sayacı farklı anahtarla okuyor; “tek okuma yeter” yorumuna rağmen iki sorgu etkin. `users.test.ts:118` gerçek 150 ms bekliyor; ortak yerleşme araçlarıyla değiştirin ve H-4’ün durmuş durumunu doğrudan ölçün.

## Bağımsız sınıf taraması

| Sınıf | Sonuç |
|---|---|
| Belirsiz sonuçtan yeni gönderim | BE-056 aynı eylemi koruyor; BE-050’nin sınırı/ardıl sonuç yönetimi Ö-01. Her gerçek gönderim motorun sahip/kapsam/nesil kapısından geçiyor. |
| Sökülmüş sahipte yeni yazma | `engine.ts:319–355` engelliyor. `retry`/`confirm` taşıyıcıdaki 401 tekrarıyla karıştırılmadı; sonuç yaşamı E-01 ayrı kusur. |
| Taşıyıcının özdeş isteği tamamlaması | `S/http/client.ts:133–147`: aynı Request klonu, yalnız Authorization değişir, nesil ve hesap eşitliği aranır. §7’deki bilinçli istisnayla uyumlu. |
| Kullanıcı onayından yeni karar | Hesap kapatma ve Admin değişimi ortak bağlamı taşıyor. Aktarım teklifi bu kalıbı atlıyor: Ö-02. |
| Koordinatörlük bileşik yazması | Oluştur→bağla ilk bağlamı taşıyor; kapsam değişince motor ardıl isteği kesiyor. Belirsiz bağ sonucunun UI devamı Ö-01. |
| Timeline geç sonuç | Satır sürümüyle ön GET kaldırılmış; kapsam değişiminden sonraki bildirim penceresi Ö-04. |
| Program kısa ad/renk | Üç hâlli güncelleme doğru; okuma loader’ı signal ve kapanış iptali kullanıyor (`program/components/use-program-form.ts:46–79`). Yeni korumasız ardıl yazma saptanmadı. |
| Anahtarsız belirsizlik | `O/api/keyless.ts:74–85`: kör tekrar düşürülüyor, yakalanmış kapsamda ortak yeniden okuma sürüyor. |

## F4 (toplantılar) için riskler

- **F4 açılışı:** önce CX-P-E-01 kapanmalı; düzeltmenin kanıtı `submit`, `retry`, `confirm` sonuçlarını ayrı ölçmeli.
- Toplantıdaki katılımcı, onay ve çok adımlı yazmalar Ö-02’deki güncel bağlamı yeniden yakalama kalıbını taşımamalı.
- `MeetingSummary` gibi yeni türev alanlar için yazma→liste/ayrıntı/sayaç geçersizleme haritası birlikte kurulmalı; Ö-03 aynı sınıfın mevcut örneğidir.
- Gerçek ekran okuyucu, 05 odak dönüşü ve E-03C-27/41 ürün sahibi görsel kabulü hâlâ devralınmış borçtur; D:118 bunların yapılmadığını dürüstçe kaydediyor.
- Ham ölçüm kayıtları raporun sayısal matrisini destekliyor; bağımsız görsel kabul veya CI çalıştırma kanıtı yerine geçmiyor.