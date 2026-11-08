# WEB-0 (F0) — Codex nihai kapı hükmü

**Son hüküm: UYGUN DEĞİL** — 1. koşum, `main` @ `9b41171` (#19–#26 birleşik).
Denetçi: Codex, `codex exec -s read-only`, her koşum tek ve salt okunur.
Kayıt: yürütme `docs/yurutme/web-0/ilerleme.md` (O5); yönetim deposu satırı kapanışta.

| Koşum | Denetlenen `main` | Hüküm | Açılan bulgular | Düzeltme |
|---|---|---|---|---|
| 1 | `9b41171` | UYGUN DEĞİL | CX-F0-E-01…E-05 (engelleyici); Ö-01…Ö-05; K-01…K-03 | düzeltme PR'ları: <doldurulacak> |

Düzeltme planı (koordinatör, 2026-11-08): E-01/E-02/Ö-01/Ö-03 → W16 (mutasyon) · E-03 → W17 (oturum nesli) · E-04 → W23 (K7 gerçek rota + satırsız admin) · E-05/Ö-04 → belge, `web0/o5-kapanis` · Ö-02/Ö-05/K-01 → F1 W61 borcu · K-02 → ürün sahibi (CLAUDE.md yolları) · K-03 → F2.

Aşağıda koşumların tam metni sırayla yer alır.

---

# WEB-0 (F0) — Codex nihai kapı hükmü — 1. koşum

- Hüküm: **UYGUN DEĞİL**. Korumalı mutasyonların K6 yenilemesine bağlanmaması, tekrar gönderiminde kapsamın sabitlenmemesi, devam eden refresh’in çıkışı geri alabilmesi ve K7 ekranlarının gerçek F0 akışında erişilememesi engelleyicidir. Ayrıca HEAD için yeşil CI/üretim eşitliği ve W31’in ham pilot kanıtları doğrulanamadığından nihai kapanış verilemez.
- Denetlenen: `9b41171d6c7a9a8c82e24a99fdadd7244941a445`.
- Birleşmiş teslim PR’ları: **#19 W14, #20 W11, #21 W12, #22 W13, #23 W15, #24 W21, #25 W22, #26 W31**. Başlangıç bağlamındaki #19–#24 listesi eksiktir.
- Okunan: **89 dosyanın tam veya ilgili kısımları**; genel `rg` taramaları ve dosya envanteri ayrıca. Backend okumaları `v0.11.0-api` etiketinden; etiket çözümü `201689ac72ffcb0c128f163088c8ddf80e9dd7cd`.
- Komutlar: `git rev-parse`, `git log`, `git status`, `git show`, `git ls-tree`, `git branch`, `git hash-object`; `cat`, `nl -ba`, `rg`, `grep`, `sed`, `head`, `tail`, `wc -l`. **Test, lint, build ve `gen:check` çalıştırılmadı; dosya değiştirilmedi.** Başlangıç ve bitiş `git status` çıktıları boştu.
- `../program/` bulunamadı; önceki incelemenin gösterdiği `../nizam.io--program/program/` okundu. Oradaki pano eski web HEAD’ini gösteriyor; WEB-0 kapanış kanıtı değildir (`DURUM.md:4`).

İlk iki komutun çıktısı:

```text
$ git rev-parse HEAD
9b41171d6c7a9a8c82e24a99fdadd7244941a445

$ git log --oneline -12
9b41171 Merge pull request #25 from caliskan421/web0/o3-w22
d3daed4 Merge remote-tracking branch 'origin/main' into web0/o3-w22
538a32f WEB-0 W22: e2e depolama denetimi izinli anahtarlar (K2)
04cabce Merge pull request #26 from caliskan421/web0/o4-gantt-karar
e94c780 WEB-0 W31: Gantt kütüphane pilotu karar belgesi (docs/architecture/gantt-secimi.md)
798e345 Merge remote-tracking branch 'origin/main' into web0/o3-w22
520efb0 WEB-0 W22: üst çubuk, tema, K7 açık durumlar, onay diyalogları, AppShell
5adbeee Merge pull request #24 from caliskan421/web0/o3-w21
1f00046 WEB-0 W21: lifecycle testi zamanlama
31e0ea4 WEB-0 W21: 0.0.0 sürüm etiketi gizli
b96bf23 WEB-0 W21: scoped anahtarlar (W14) + VITE_APP_VERSION
9d4c04c Merge remote-tracking branch 'origin/main' into web0/o3-w21
```

## Madde hükümleri (1–17)

**UYGUN**, aşağıda kaynak incelemesi hükmüdür; çalıştırılmış test veya yeşil CI anlamına gelmez. Backend satırları belirtilen etikete aittir.

| Madde | Hüküm | Kanıt | Öneri |
|---|---|---|---|
| **1. K1 mercek ≠ yetki** | **UYGUN** | `src/shared/scope/standing-facts.ts:164`: yetki girdisinde mercek yok; `companyAdmin` korunuyor. `src/modules/work/model/capabilities.ts:38`: dört işlem olgulardan hesaplanıyor. `eslint.config.js:53`, `tests/lint/gates.test.ts:119`: izinli dosyalar ve negatif vakalar var. | Menüdeki boolean kapıyı F2 capability katmanına taşıyın; mevcut hali mercekten yetki türetmiyor. |
| **2. K2 kapsam** | **UYGUN** | `src/shared/scope/resolve.ts:53`: geçerli/hatırlanan seçim, ardından yalnız tek seçenekte otomatik seçim. `lifecycle.ts:36`: kapsamlı sorgular iptal ve siliniyor. `src/shared/preferences/keys.ts:8`: dört anahtar; `AppShell.vue:23`: daraltma bellekte. `eslint.config.js:272`: tek storage istisnası. | Ağ isteğinin gerçekten kesilmesini de `AbortSignal` aktarımıyla tamamlayın; mevcut önbellek temizliği ayrı bir güvencedir. |
| **3. K5 yazma** | **UYGUN DEĞİL** | `engine.ts:86`, `:164`, `:249`: eylem anahtarı, tek conflict tekrarı, 429 ayrımı doğru. `:23`: onay kümesi doğru; `partial.ts:38`: ilk yanıt korunuyor. Ancak `use-protected-mutation.ts:62` kapsamı başarı anında, `client.ts:85` istek anında okuyor. | **E-02**: kapsamı eyleme sabitleyin. Gövde ve tekrar süresi açıkları için Ö-01. |
| **4. K6 yetki kaybı** | **UYGUN DEĞİL** | Altı kod `authority-loss.ts:14` içinde; odak yenilemesi `lifecycle.ts:66` içinde. Fakat `lifecycle.ts:56` yalnız mutasyon `error` olayını izliyor; `use-protected-mutation.ts:56` hatayı sonuç olarak döndürüyor. | **E-01**: korumalı mutasyon sonucunu standing yenilemesine bağlayın. |
| **5. Çıkış** | **UYGUN DEĞİL** | `sign-out.ts:47`: sonuçtan sonra token/kapsam temizliği; `auth-session.ts:171`, `:276`: yeni refresh ve kardeş token engeli. `App.vue:30` uyarıyı gerçekten bağlıyor. Ancak devam eden refresh `auth-session.ts:211` üzerinden yeniden `establish()` çağırabiliyor. | **E-03**: eski uçuşun sonucunu oturum nesliyle geçersizleştirin. |
| **6. K7 açık durumlar** | **UYGUN DEĞİL** | Metinler `states/messages.ts:10`; sürüm kapısı `instance/store.ts:31`. `router.ts:37` ana sayfayı S0 oturuma yönlendiriyor; `states/resolve.ts:39` S0’da durumları atlıyor. Departmansızlık `no_lens`’e bağlanmış (`:27`), admin merceği ise her zaman ekleniyor (`standing-facts.ts:136`). | **E-04**: gerçek F0 rotasında gösterin; departmansız programı doğru veriyle saptayın. |
| **7. K9 görsel sistem** | **UYGUN DEĞİL** | Blob `2e1521ab9fe632f81f418ed085d5ba0330c35bc6` pinle eşleşti. Tema ve değişken kapsam testleri `tokens.test.ts:74`, `:103`; koyu başlangıç `providers.ts:16`. Buna karşılık `ui/styles/metrics.css:10`, `side-metrics.css:10` ayrı ham px kaynakları; test bunları açıkça muaf tutuyor (`ui/styles.test.ts:39`). | Ö-02: ölçüleri web token kaynağına taşıyın. Mevcut denetim depo genelinde mutlak px yasağı değildir. |
| **8. K10 rota kataloğu** | **UYGUN** | `router.ts:70` kayıtları katalogdan üretiyor. `routes.catalog.ts:104`: Görevler F0’da devre dışı; `:6`: v1 dışı modüller dışarıda. `menu.ts:50` görünür girdileri grupluyor. | K7 için geçici ana sayfa yönlendirmesini düzeltin; faz matrisi korunmalı. |
| **9. K12 kapılar** | **UYGUN** | `eslint.config.js:181`: 250/400, 60, 12. `:190`: üç gerekçeli fonksiyon istisnası. `package.json:15`: `--max-warnings=0`. `tests/lint/gates.test.ts:44`: eşik testleri mevcut; üretim kaynak taramasında `eslint-disable` bulunmadı. | İstisnalar dosya düzeyinde; gelecekte aynı dosyaya eklenen işlevleri de gevşettiklerini unutmayın. |
| **10. K13 designStub** | **UYGUN** | `kayit.md:8`, `:10`: BE-001/003 açık; `badges.ts:85`: sayı yerine `null`. `tests/lint/design-stub.test.ts:50`, `:84`: durum ve gerçek kaynak tutarlılığı denetleniyor. | Test kodunun varlığı doğrulandı; çalışma sonucu CI’dan alınmalı. |
| **11. Güvenlik değişmezleri** | **UYGUN** | Token özel bellek alanında; storage erişimi `storage-adapter.ts:33` ile sınırlı. `errors/confirmation.ts:20` yalnız görev başlığı kodunu alıyor; `ConfirmDialog.vue:90` kaçışlı metin olarak çiziyor. `deploy/Caddyfile:60`, `providers.ts:24`: nonce zinciri var; kaynak taramasında inline stil/eval bulunmadı. | `organization.task_title` **veri istisnası kabul edilebilir**; genel hata mesajı istisnasına dönüştürülmemeli. Çalışma anı CSP sonucu doğrulanamadı; çıkış yarışı E-03 ayrıca geçerlidir. |
| **12. Sözleşme uydurma yok** | **DOĞRULANAMADI** | Örnek uçlar pinli spec’te bulundu: `openapi.yaml:4170`, `:4447`, `:4514`, `:4902`, `:16778`, `:16404`, `:4114`. İlgili alanlar `:456`, `:2326`, `:3201` ile uyumlu. `GanttTask` `:2688`; pilot kaynağı elde yok. | Örneklem uygun; bütün kullanım ve pilot alan eşleşmesi için tam doğrulama iddiası verilmiyor. |
| **13. Mimari sınırlar / üretim** | **DOĞRULANAMADI** | Sınır kuralları `eslint.config.js:393`, negatif testler `architecture.test.ts:24`. `query-keys.ts:18` yalnız temel `scope.ts`’yi alıyor; bu dosyada geri HTTP importu yok. Üretim kapısı `.github/workflows/ci.yml:56`. | Belirtilen doğrudan scope/query-keys döngüsü kaldırılmış. Bütün grafiğin döngüsüzlüğü ve `gen:check` eşitliği bu koşumda doğrulanmadı. |
| **14. Test kanıtı** | **UYGUN DEĞİL** | **96 birim/lint test dosyası + 2 e2e spec** var. K6 testi gerçek sarmalayıcı yerine reddeden mutasyon kuruyor (`lifecycle.test.ts:238`); K7 testi üretimde olmayan HomeStub bağlıyor (`shell.lifecycle.test.ts:43`). `engine.test.ts:256` 30 ms gerçek zaman sınırı kullanıyor. | E-01/E-04 için gerçek bağlama testleri; Ö-03 için deterministik zamanlama. Geçen test sayısı ve coverage yüzdesi doğrulanamadı. |
| **15. W31 pilotu** | **DOĞRULANAMADI** | `gantt-secimi.md:39`, `:89`: ölçüm ve puan tabloları var; `:133`: P8 eşlemesi uygun. `:157` ham kanıta işaret ediyor; HEAD’in `pilot/` ağacı boş. `:3` hâlâ “Öneri”; yol haritası `:20` seçim öncesi metni taşıyor. | **E-05**: ayrı pilot commit’i/kanıt konumu ve koordinatör kararı sağlanmalı. Pilotun main’e girmemesi uygundur. |
| **16. Tespit setine uyum** | **UYGUN DEĞİL** | K7 bağlama açığına ek olarak `00-ortak/README.md:40` Admin rozeti için F0’da elle doğrulama isterken `badges.ts:55` F0 çağrısını kapatıyor. Ret edilen ilk seçim uygulanmamış; faz dışı öğeler gizli. | Rozet ertelemesini kabul tablosuyla uzlaştırın; K7 kabulünü gerçek rotayla kanıtlayın. |
| **17. Bilerek yapılmayanlar** | **UYGUN DEĞİL** | `ui/messages.ts:21` çalışma anı TR kaydı; `menu.ts:47` olgu kapısı; `App.vue:30` çıkış uyarısı mevcut. Ölçü borcu `metrics.css:6`; eski CI mesajı `ci.yml:64`; rozet ertelemesi `badges.ts:4`. | Listedeki işler topluca kabul edilemez: aşağıdaki kabul/borç ayrımı uygulanmalı. |

## Engelleyici bulgular (CX-F0-E-NN) — F1 açılmadan kapanmalı

### CX-F0-E-01 — Korumalı mutasyonlar K6 yenilemesini tetiklemiyor

`runAction()` 403/404’ü `{kind:'failed', error}` olarak döndürüyor (`src/shared/http/mutation/engine.ts:253`). TanStack açısından bu başarılı bir sonuç; hook da başarı dışı sonuçta çıkıyor (`use-protected-mutation.ts:60`). Dinleyicinin beklediği `error` olayı oluşmuyor (`src/shared/scope/lifecycle.ts:56`).

**Düzeltme:** Yetki kaybını normalize sonuç üzerinden ortak katmanda yayınlayın/geçersizleyin. Altı kodu gerçek `useProtectedMutation` → HTTP → standing → kapsam zincirinde sınayın; mevcut reddeden yapay mutasyon testi bu bağı kanıtlamıyor (`lifecycle.test.ts:238`).

### CX-F0-E-02 — Tekrar edilen eylemin kapsamı korunmuyor

A programında sonuç bilinmiyor oluştuktan sonra B’ye geçilip `retry()` seçilirse anahtar ve gövde A’dan kalır; HTTP başlığı güncel B kapsamından üretilir (`engine.ts:201`, `client.ts:85`). Başarı geçersizlemesi de gönderim kapsamını değil o andaki kapsamı kullanır (`use-protected-mutation.ts:62`).

Pinli sözleşme aynı anahtarın farklı kapsamla tekrarını istemci hatası sayar (`istemci-akislari.md`, §8). **Düzeltme:** Hesap/kapsamı eylem oluşturulurken yakalayın; tekrarın özgün kapsamda güvenle yapılmasını veya kapsam değişince engellenmesini sağlayın. Başarı geçersizlemesi aynı yakalanmış kapsamı kullanmalı.

### CX-F0-E-03 — Devam eden refresh çıkışı geri alabilir

Olası sıra: refresh başlar → logout başarısız olur ve `clear({serverUnverified:true})` çalışır → eski refresh 200 döner → `establish()` token’ı uygular ve uyarı bayrağını kapatır (`auth-session.ts:140`, `:204`, `:211`, `:297`).

**Düzeltme:** Çıkışta oturum neslini değiştirin; eski nesilde başlayan refresh/login yanıtlarını uygulamayın. Gecikmiş refresh yanıtı ve kilitte bekleyen refresh için test ekleyin. Yeni çağrı başındaki bayrak kontrolü tek başına yeterli değildir.

### CX-F0-E-04 — K7 bileşenleri var, üretim bağlantısı eksik

F0’ın ana sayfası `/oturum`’a yönleniyor; S0 rotası K7’yi atlıyor (`router.ts:37`, `states/resolve.ts:39`). Test bu yönlendirmeyi HomeStub ile değiştiriyor (`shell.lifecycle.test.ts:43`).

Ayrıca `no_lens → no-department` eşlemesi, satırsız admini yakalamaz: admin merceği mevcut olduğu için çözüm `ready` olur (`standing-facts.ts:136`, `resolve.ts:83`).

**Düzeltme:** F0’da gerçek bir kabuk ana içeriği sağlayın. Program departmanlarının boşluğunu uygun sözleşme verisiyle ayırt edin; gerçek router ile program yok, üyelik bekliyor ve departman yok akışlarını kanıtlayın.

### CX-F0-E-05 — W31 karar ve kanıt zinciri kapanmamış

Karar belgesi ham ölçüm, ekran görüntüsü ve pilot kaynaklarına işaret ediyor; denetlenen HEAD bunları içermiyor ve belgede sabit pilot commit’i bulunmuyor (`gantt-secimi.md:4`, `:157`). Belge hâlâ öneri; W31 çıkışı koordinatör kararının K4’e işlenmesini istiyor (`oturum-4-gantt-pilot.md:18`).

**Düzeltme:** Pilot kodunu main’e almadan, değişmez commit/artifact bağlantısı ve ölçüm kanıtını erişilebilir yapın; karar kaydını tamamlayın. Gerçek ekran okuyucu denenmemiş olması belgede açıkça belirtilmiş ve F3 kabulüne bırakılabilir (`gantt-secimi.md:140`).

**Ek kapanış koşulu:** Düzeltilmiş HEAD için CI run/sonuç kanıtı, üretim diff=0 ve kabul senaryoları gerekir. Workflow tanımı (`ci.yml:56`) bunların başarıyla çalıştığını kanıtlamaz.

## Önemli bulgular (CX-F0-Ö-NN) — F1 içinde kapanabilir

- **CX-F0-Ö-01 — Tekrar nesnesinin bütünlüğü:** `freezeVars()` klonlama başarısızsa özgün değişebilir nesneyi döndürüyor (`engine.ts:77`); sonuçtaki `draft` da aynı nesneye erişim veriyor (`:198`). Ayrıca 24 saat kontrolü tekrarın çağrıldığı anda değil önceki sonuç üretilirken yapılıyor (`:193`). Desteklenmeyen gövdeleri açıkça reddedin/uygun biçimde kopyalayın; tekrar çağrısında süreyi yeniden kontrol edin.
- **CX-F0-Ö-02 — Token kaynağı parçalı:** `metrics.css` ve `side-metrics.css` geçici bağımsız ölçü kaynakları olarak kalmış (`:6`). Bunları `design/web-tokens.json`’a taşıyın; görünüm testlerini yeni modülleri de kapsayacak şekilde genişletin.
- **CX-F0-Ö-03 — Zamanlamaya duyarlı testler:** `engine.test.ts:256` ağ/503/timeout ayrımına aynı 30 ms sınırı uyguluyor; yoğun CI’da yanlış “timeout” sonucu riski var. `lifecycle.test.ts:269` negatif iddia için 20 ms bekliyor. Gerçekleşmiş titreme doğrulanmadı; risk kaynakta açık. Kontrollü Promise ve sahte saat kullanın.
- **CX-F0-Ö-04 — Rozet kabulü ile uygulama farklı:** Kabul tablosu F0 Admin rozet doğrulamasını istiyor (`00-ortak/README.md:40`); uygulama F1’e erteliyor (`badges.ts:55`). Sahte sayı üretilmemesi doğru; erteleme için kabul tablosunu açıkça güncelleyin veya istenen F0 kanıtını sağlayın.
- **CX-F0-Ö-05 — Görsel eşitlik kanıtlanmadı:** Token’lar Inter/Poppins/Geist Mono tanımlıyor (`tokens.gen.css:6`), fakat incelenen stil girişinde font yüklemesi yok (`main.css:5`). Sistem fontu geçici çalışabilir; “tasarım birebir” ve 272/76 px taşmasızlık kabulü için fontlar ve tarayıcı görüntüleriyle doğrulama gerekir.

## Küçük bulgular (CX-F0-K-NN)

- **CX-F0-K-01:** CI hata metni hâlâ eski `tokens.json` adını kullanıyor (`.github/workflows/ci.yml:64`).
- **CX-F0-K-02:** Oturum okuma yolları gerçek çalışma düzeniyle uyuşmuyor (`CLAUDE.md:9`); README de eski iskelet durumunu anlatıyor (`README.md:3`). Güncel yolları ve F0 durumunu tekilleştirin.
- **CX-F0-K-03:** Yönetim grubu olgu kontrolü doğru, fakat modül capability dosyasında değil (`menu.ts:47`). F2’de organizasyon yetkileri eklenirken merkezi capability’ye taşınmalı.

## Kabul edilen bilerek-yapılmayanlar

- **Pilot kodunun main’e alınmaması:** W31’in açık gereği; korunmalı. Ham kanıtın erişilebilir olması ayrı koşuldur.
- **`ui.*` anahtarlarının çalışma anında eklenmesi:** Mevcut tek dil TR için kabul; metinler istemcide ve tipli anahtarlarla erişiliyor (`ui/messages.ts:21`).
- **Yönetim grubunun boolean olgu kapısı:** F0 için kabul; merceğe bağlı değil (`menu.ts:47`).
- **SessionPage içine ayrıca çıkış uyarısı koyulmaması:** Kabul; uyarı uygulama kökünde zaten bağlı (`App.vue:30`). Bu artık eksik teslim değildir.
- **Faz dışı menüler/panellerin gizli veya devre dışı olması:** P2 ile uyumlu; backend eksiği diye sahte veri üretilmiyor.
- **Sistem fontu ve ölçü dosyaları:** Yalnız açık teknik/görsel borç olarak ertelenebilir; tamamlanmış K9 kabulü sayılmaz.
- **Görev rozetlerinin F0’da hesaplanmaması:** Kabul tablosuyla uzlaştırılmadan kabul edilmiş erteleme sayılamaz.

## F1 için riskler ve ön koşullar

1. E-01–E-05 kapansın; düzeltilmiş HEAD için yeşil CI ve üretim eşitliği sunulsun.
2. İlk yazma tüketicisi, kapsam değişimi sırasında gönderim/tekrar/başarı senaryolarını kapsasın.
3. Yetki kaybı testleri gerçek korumalı mutasyon katmanından geçsin.
4. K7 testleri üretim router’ını değiştirmeden çalışsın.
5. Çıkış, devam eden refresh ve gecikmiş yanıtlarla sınansın.
6. Görev listesi K3 gereği tek uçtan kurulsun; departman fan-out yapılmasın.
7. Sayaçlar tamamlanmamış sayfalama için “yüklenen kayıtlar içinde” olarak etiketlensin; BE-003 taklit edilmesin.
8. Kısmi başarıda ilk oluşturma/atama korunsun; düzenleme çatışmaları gerçek sürüm gruplarıyla çözülsün.
9. F1 sade ana sayfa P3/P6 sınırında kalsın; tarih talebi gönderimi F3’e kadar devre dışı olsun.
10. Font, tema ve 272/76 px kabuk kabulü gerçek tarayıcıda doğrulansın; test dosyası sayısı görsel kabulün yerine geçmesin.