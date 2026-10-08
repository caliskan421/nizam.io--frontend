# WEB-1a (F06) — Codex nihai kapı hükmü

**Son hüküm: UYGUN** — 4. koşum, `main` @ `cfbb708` (CI run `37788190257` success).
Denetçi: Codex `gpt-5.6-sol` (medium), `codex exec -s read-only`, her koşum tek ve salt okunur.
Kayıt: program F06 (`../program/fazlar/F06-web-1a-iskelet.md`); bu depoda `project-control` yoktur.

| Koşum | Denetlenen `main` | Hüküm | Açılan bulgular | Düzeltme |
|---|---|---|---|---|
| 1 | `045b099` | UYGUN DEĞİL | CX-Ö-01…05, CX-K-01 | PR #6 → `71d0b34` |
| 2 (r1) | `71d0b34` | UYGUN DEĞİL | CX-Ö-04 kısmen; CX-r1-Ö-01 (yeni) | PR #7 → `5b291aa` |
| 3 (r2) | `5b291aa` | UYGUN DEĞİL | CX-r2-Ö-01 (yeni) | PR #8 → `cfbb708` |
| 4 (r3) | `cfbb708` | **UYGUN** | yok | — |

Koordinatörce kabul edilen ve denetçiye bildirilen varsayımlar/sapmalar:
- Aynı origin tek güven alanıdır (sekmeler arası kanal, `docs/refresh-coordination.md`).
- Kapsam 10 sapması: ilk yönetici `cmd/setup` yerine geçici e2e bootstrap aracıyla kurulur (backend `v0.1.0-api` sahte merkezde aktivasyon kodu yalnız test harness'ında üretilebiliyor); araç üretim çıktısına girmez (CI izolasyon denetimi).
- Backend `build/Dockerfile` taban imajlarının kalıcı digest pini backend'e (program F23) devredildi; e2e geçici kopyada digest'li `FROM` kullanır.

Aşağıda dört koşumun tam metni sırayla yer alır.

---

# WEB-1a Codex nihai kapı hükmü

- Hüküm: **UYGUN DEĞİL**
- Denetlenen: `main` @ `045b0993323e5304574c68981d1e9d2ab7f1911a`
- Taban: `901fc52`; beş squash commit doğrulandı, çalışma ağacı temizdi.
- CI run `37779040212` başarısı kullanıcı tarafından verilmiş kanıttır; CI’ya erişilmedi ve testler salt-okunur talimat nedeniyle yeniden koşturulmadı.
- Gerekçe: Beş önemli bulgu ve kapsam maddesi 10’daki açık sapma. Engelleyici bulgu yoktur.

## Bulgular

| Kimlik | Dosya:satır | Açıklama | Önerilen düzeltme |
|---|---|---|---|
| **CX-Ö-01 Önemli** | `src/shared/session/coordination.ts:15,29-37`; `src/shared/session/auth-session.ts:220-245` | `nizamio:session` sabit adlı kanalın iletileri çalışma zamanında doğrulanmadan uygulanıyor. Aynı origin’deki herhangi bir bağlam sahte `logout` gönderebilir veya seçtiği `token/accountId/expiresAt/issuedAt` değerleriyle oturumu zehirleyebilir. Ham bearer token aynı origin’de kanala katılan bütün bağlamlara yayınlanıyor. Kalıcı depolama sızıntısı yoktur; risk bellek içi kanalın güven sınırıdır. | En azından sıkı mesaj şeması, sürüm, tür/uzunluk/zaman sınırı ve hesap tutarlılığı doğrulaması ekleyin; bozuk iletileri yok sayan negatif testler yazın. Mümkünse bearer token yayınlamayan koordinasyon tasarımı kullanın veya bütün aynı-origin içeriğinin aynı güven alanı olduğunu açık güvenlik varsayımı yapıp untrusted içeriği ayrı origin’e taşıyın. |
| **CX-Ö-02 Önemli** | `src/shared/http/client.test.ts:108-146`; `tests/support/fake-backend.ts:57-69,131-166` | “İKİ SEKME” testi gerçek sekme, Web Locks, BroadcastChannel veya yenileme çerezi kullanmıyor. Özel FIFO promise kilidi ve her refresh’i başarılı yapan sahte backend kullanıyor; rotasyon, eski çerezin 10 saniyelik toleransı ve tekrar kullanımda toplu iptal modellenmiyor. Test yalnız uygulama algoritmasının sahte modelde tek refresh yaptığını kanıtlıyor. | Aynı tarayıcı bağlamında iki gerçek sayfa ile, etiketli gerçek backend’e karşı eşzamanlı 401 testi ekleyin. Refresh sayısını ve oturumların düşmediğini doğrulayın; Web Locks olmayan yol için 10 saniye içi/dışı tekrar kullanımı ve toplu iptali ayrıca sınayın. |
| **CX-Ö-03 Önemli** | `e2e/backend/up.sh:106-109`; `e2e/backend/bootstrap/main.go:65-84`; `e2e/backend/bootstrap.Dockerfile:11-16` | Faz maddesi 10 ilk yöneticinin backend `cmd/setup` ile kurulmasını istiyor; hat ise ayrı `nizamio-e2e-bootstrap` ikilisiyle doğrudan `Provisioning().Activate` ve `Root.Bootstrap` çağırıyor. Böylece `cmd/setup`’ın digest doğrulaması ve tam `Root.Setup` zinciri sınanmıyor. Ayrı bootstrap ikilisi üretim runtime imajına kopyalanmıyor ve görülen kaynakta üretim sırrı yok; üretime sızma kanıtı bulunmadı. Ancak kapsam şartı karşılanmıyor. | Faz tanımını bu sapmayı açıkça kabul edecek biçimde değiştirmeden kapatmayın. Tercihen backend’de test amaçlı güvenli aktivasyon imkânı sağlayıp gerçek `/usr/local/bin/setup` ikilisini çalıştırın ve digest/tamamlama raporunu doğrulayın. |
| **CX-Ö-04 Önemli** | `.github/workflows/ci.yml:28-34,47,117-123,136,160`; `e2e/backend/compose.yaml:8`; `.github/workflows/ci.yml:98` | GitHub eylemleri yalnız hareketli büyük sürüm etiketlerine (`@v7`, `@v6`), Postgres ise `postgres:16` etiketine sabitlenmiş. Bunlar değişmez tedarik zinciri pinleri değildir. `pull_request_target` yoktur, izin `contents: read` ve `BACKEND_DEPLOY_KEY` yalnız iki backend checkout adımında referanslanmıştır; bu taraflarda sızıntı yolu görülmedi. | Tüm `uses:` girdilerini doğrulanmış commit SHA’larına, servis/build imajlarını digest’e sabitleyin; okunabilirlik için sürüm yorumunu yanında tutun. |
| **CX-Ö-05 Önemli** | `eslint.config.js:78-86`; `tests/lint/architecture.test.ts:86-109` | Elle DTO kapısı yalnız `interface` ve doğrudan tip literalini yakalıyor. `type X = Record<...>`, tuple/mapped type, primitive birleşimi veya `class X` gibi elle DTO biçimleri kapıdan geçebilir. Mevcut modül API’sinde elle DTO görülmedi, fakat kabul ölçütündeki lint güvencesi tam kanıtlanmıyor. | `modules/**/api` içindeki yerel veri tipi bildirimlerini kapsamlı biçimde reddedin veya yalnız `schema.d.ts` kökenli tür türetimlerine izin veren AST kuralı yazın. Kaçış biçimlerinin her biri için negatif test ekleyin. |
| **CX-K-01 Küçük** | `src/shared/session/store.ts:27-34`; `src/shared/session/auth-session.ts:131-134` | Açılıştaki refresh ağ/5xx hatasında yorum “oturum hakkında hüküm yok/anonim gösterilir” diyor, fakat `expire()` çağrısı durumu `ended` yapıyor. Bu, belgelenen geçici-hata davranışıyla uyuşmuyor. | Başlangıç geçici hatası için ayrı `unavailable`/`anonymous` davranışı tanımlayın veya yorum ve UI sözleşmesini `ended` sonucuna göre düzeltip test ekleyin. |

## Kabul ölçütleri

| Ölçüt | Kanıt (dosya/test) | Sonuç |
|---|---|---|
| CI: strict typecheck, lint, Vitest, üretim farkı, build ve Playwright | `.github/workflows/ci.yml:23-171`; koordinatörce doğrulanmış run `37779040212` | **Kanıtlandı** |
| Erişim belirteci `localStorage`/`sessionStorage`’a yazılmaz | `auth-session.ts:59-68`; `client.test.ts:387-409`; `architecture.test.ts:72-84`; `smoke.spec.ts:8-14,40-53` | **Kanıtlandı** |
| IndexedDB, JS çerezi, URL veya log’a token sızıntısı yok | `src/` genel araması; token yalnız `AuthSession.#token` ve Authorization başlığında | **Kanıtlandı** |
| İki sekmede eşzamanlı 401 → tek refresh birim testi | `client.test.ts:108-126` | **Kanıtlandı — yalnız sahte model düzeyinde** |
| Gerçek tarayıcı/backend üzerinde sekmeler arası tek refresh ve rotasyon davranışı | Mevcut Playwright testi tek sayfa; sahte backend çerez rotasyonu modellemiyor | **Kanıtlanmadı** |
| Refresh döngüsü yok, özgün istek yalnız bir kez tekrarlanır | `client.ts:38-41,115-125`; `client.test.ts:148-202` | **Kanıtlandı** |
| Refresh 401’de oturum temizliği; 429/5xx’de otomatik tekrar yok | `auth-session.ts:169-195`; `client.test.ts:148-171,205-232` | **Kanıtlandı** |
| CSRF başlığı bütün mevcut yazma yöntemlerinde; login/refresh/logout dahil | `client.ts:41,77-80`; `auth-session.ts:157-163`; `client.test.ts:81-92,313-327`; `smoke.spec.ts:57-63` | **Kanıtlandı** |
| S2/S3 kapsam başlıkları zorunlu, eksikse istek gönderilmez | `client.ts:82-93`; `client.test.ts:329-344`; ilk sözleşme diliminde gerçek S3 uç yok | **Kanıtlandı** |
| Operasyon/kapsam haritası pinli spec’ten üretilir | `scripts/gen-api.ts:91-118`; `operations.gen.ts:1-39`; `operations.test.ts:15-29` | **Kanıtlandı** |
| TanStack Query anahtarları program/departmana göre ayrışır | `scope.ts:8-26`; `scope/store.ts:38-45`; `store.test.ts:79-96` | **Kanıtlandı** |
| Hata zarfı normalizasyonu; sunucu `message` alanı gösterilmez; 429 `Retry-After` | `api-error.ts:18-47,67-114`; `client.test.ts:205-310`; `i18n/index.ts:38-42` | **Kanıtlandı** |
| Elle DTO yok ve lint kapısı kaçışı engelliyor | Mevcut kaynak temiz; `eslint.config.js:78-86`, negatif testler yalnız iki sözdizimini kapsıyor | **Kanıtlanmadı** |
| Mimari sınır kuralı ve negatif testleri | `eslint.config.js:89-142`; `architecture.test.ts:23-70` | **Kanıtlandı** |
| `gen:api` etiketli backend’den üretir ve CI diff=0 ister | `api-pin.json:1-6`; `scripts/gen-api.ts:18-44`; `.github/workflows/ci.yml:42-71` | **Kanıtlandı** |
| Playwright dumanı gerçek etiketli backend’e karşıdır | `.github/workflows/ci.yml:91-171`; `e2e/backend/up.sh:32-47,100-128`; `smoke.spec.ts:17-68` | **Kanıtlandı** |
| İlk yönetici backend `cmd/setup` ile oluşturulur | `up.sh:106-109`; özel `bootstrap/main.go` kullanılıyor | **Kanıtlanmadı** |

## Kapsam maddeleri 1–12

| No | Kapsam | Durum | Kanıt / not |
|---:|---|---|---|
| 1 | Vue 3.5, TypeScript strict, Vite, pnpm, Node LTS | **Var** | `package.json`, `tsconfig.app.json`, `.nvmrc` |
| 2 | Katman düzeni ve ESLint sınır kuralı | **Var** | `src/app`, `src/shared`, `src/modules/identity`; `eslint.config.js` |
| 3 | Etiketli OpenAPI tip üretimi ve CI diff kapısı | **Var** | `api-pin.json`, `scripts/gen-api.ts`, `schema.d.ts`, CI |
| 4 | HTTP katmanı, kimlik, CSRF, kapsam, refresh, hata | **Var** | `src/shared/http/*`, `session/*`, `errors/*`; CX-Ö-01/02 koşulları var |
| 5 | Pinia oturum deposu, sessiz refresh, parola bayrağı, çıkış | **Var** | `src/shared/session/store.ts`, `store.test.ts` |
| 6 | Kapsam deposu ve ayrışmış sorgu anahtarları | **Var** | `src/shared/scope/*`, `store.test.ts:79-96` |
| 7 | vue-i18n ve hata kataloğundan TR tablo | **Var** | `error-codes.gen.ts`, `src/shared/i18n/*` |
| 8 | Tasarım token’ları, açık/koyu, CSS ve PrimeVue preset | **Var** | `tokens/tokens.json`, `scripts/gen-tokens.ts`, `src/shared/tokens/*` |
| 9 | Vite aynı-origin proxy ve `.env.development` | **Var** | `vite.config.ts:7-28`, `.env.development` |
| 10 | API fixture ve ilk yöneticinin backend `cmd/setup` ile kurulması | **Yok** | Fixture API çağrılarıyla kuruluyor; ilk yönetici özel composition bootstrap ikilisiyle oluşturuluyor |
| 11 | CI kalite işi ve gerçek backend Playwright dumanı | **Var** | `.github/workflows/ci.yml`; doğrulanmış run `37779040212` |
| 12 | PR şablonu | **Var** | `.github/pull_request_template.md` |

---

# WEB-1a Codex nihai kapı hükmü — 2. koşum (r1)

- Hüküm: **UYGUN DEĞİL**
- Denetlenen: `main` @ `71d0b34954eb8a0a34cc4c39ec04af7f5d9d3b2c`
- Taban: `045b099`; aradaki tek squash commit PR #6’dır.
- Çalışma ağacı temizdir; `git diff --check 045b099 71d0b34` hata vermedi.
- CI run `37783360065` başarısı koordinatör kanıtı olarak kabul edildi; CI’ya erişilmedi, salt-okunur talimat gereği testler yeniden çalıştırılmadı.
- Gerekçe: CX-Ö-04 tam kapanmamıştır ve iki-sekme tek-refresh güvencesini geçerli bir backend yapılandırmasında bozan yeni bir önemli bulgu vardır.

## 1. koşum bulgularının kapanışı

| Kimlik | Durum | Kanıt |
|---|---|---|
| **CX-Ö-01** | **Kapandı** | Kanal iletileri sürüm, tam alan kümesi, tür, uzunluk, biçim ve zaman açısından doğrulanıyor: `src/shared/session/messages.ts:37-136`; negatif test: **“parseSessionMessage — sıkı şema”**, `src/shared/session/messages.test.ts:19-57`. Farklı hesap token’ı ve logout’u reddediliyor: `auth-session.ts:249-270`; testler **“oturum başka hesaptayken…”**, **“logout yalnız aynı hesap…”**, `messages.test.ts:105-129`. `sync-request` hesap taşımadan gelir ve taze, kimlikli her bağlam yanıt olarak token yayınlar: `messages.ts:29-33,130-132`, `auth-session.ts:253-258`; yani herhangi bir aynı-origin bağlam bu yanıtı isteyebilir. Koordinatörce kabul edilen **“aynı origin tek güven alanıdır”** varsayımı altında bu açık bulgu sayılmadı. |
| **CX-Ö-02** | **Kapandı** | Gerçek iki sayfa/gerçek backend senaryosu iki 401’i, tek refresh’i ve iki oturumun sürmesini denetliyor: test **“iki sekme, eşzamanlı 401 → tek refresh, iki oturum da geçerli”**, `e2e/two-tabs.spec.ts:18-86`. Birim modelinde rotasyon, 10 saniye içi red ve pay dışı toplu iptal var: `tests/support/fake-backend.ts:175-211`; testler `client.test.ts:111-212`. Kilitsiz eşzamanlı yol ayrıca `client.test.ts:154-177` ile kapsanıyor. Aşağıdaki yeni bulgu farklı bir yapılandırma sınırıdır. |
| **CX-Ö-03** | **Kapandı** | Madde 10 sapması koordinatörce kabul edilmiştir. Backend etiketi sınırı doğrular: `README.md` (`v0.1.0-api`):114-120. Araç açıkça geçici olarak belgelenmiş: frontend `README.md:82-89`. CI, frontend `dist/` paketini ve backend çalışma imajındaki tam ikili kümesini denetliyor: `e2e/backend/check-isolation.sh:10-32`, `.github/workflows/ci.yml:88-89,151-152`. Koordinatörce doğrulanan CI koşumu bu adımları başarıyla tamamlamıştır. |
| **CX-Ö-04** | **Kısmen** | Actions girdileri SHA’ya, Postgres ile e2e-bootstrap tabanları digest’e sabitlenmiş: `.github/workflows/ci.yml:28-34,47,101,120-126,139,166`; `e2e/backend/compose.yaml:8`; `e2e/backend/bootstrap.Dockerfile:5,13`. Ancak gerçek backend e2e imajı hâlâ etiketli Dockerfile ile canlı kuruluyor: `e2e/backend/up.sh:45-49`; bu Dockerfile’ın `FROM golang:${GO_VERSION}-bookworm` ve `FROM gcr.io/distroless/static-debian12:nonroot` girdileri digest taşımıyor: backend `build/Dockerfile` (`v0.1.0-api`):18,39. Ayrıca Dockerfile frontend seçicisi `# syntax=docker/dockerfile:1` de hareketlidir: `e2e/backend/bootstrap.Dockerfile:1`. Etiket Dockerfile metnini sabitler, çözümlenen taban manifestlerini sabitlemez. |
| **CX-Ö-05** | **Kapandı** | Kural artık interface, bütün type alias’lar, class/class expression, enum, namespace, literal/tuple/mapped/template tipleri ve yaygın yardımcı tipleri reddediyor: `eslint.config.js:78-103`. Negatif matris ve izin verilen üretilmiş-tip yolu: test grubu **“elle DTO yasağı (src/modules/**/api)”**, `tests/lint/architecture.test.ts:86-141`. Mevcut modül API yüzü yalnız `@/shared/api/types` kullanıyor: `src/modules/identity/api/index.ts:1-9`. |
| **CX-K-01** | **Kapandı** | Ayrı `unavailable` durumu ve yeniden denenebilir bootstrap yolu var: `src/shared/session/auth-session.ts:9-14,137-146`; `src/shared/session/store.ts:27-38`; UI yeniden deneme düğmesi `SessionPage.vue:63-70`. Testler: **“açılışta refresh 5xx → unavailable…”** ve **“açılışta ağ hatası → unavailable”**, `store.test.ts:49-66`. |

## Yeni bulgular

| Kimlik | Önem | Kanıt |
|---|---|---|
| **CX-r1-Ö-01** | **Önemli** | Kanal, `expiresAt` değerini koşulsuz olarak en fazla 7 gün ilerisiyle sınırlar ve daha uzun ömürlü token iletisini reddeder: `src/shared/session/messages.ts:42-45,101-108`; sınır testi `messages.test.ts:45-47`. Buna karşılık pinli backend `NIZAMIO_SESSION_TTL` için yalnız 1 dakikalık alt sınır koyar, üst sınır koymaz: backend `internal/platform/config/schema.go` (`v0.1.0-api`):272-279; tek ek değişmez access TTL’nin refresh TTL’den kısa olmasıdır: `internal/composition/identity.go`:264-276. Dolayısıyla örneğin geçerli `SESSION_TTL=8d`, `SESSION_REFRESH_TTL=9d` kurulumunda ilk sekmenin yenilediği token ikinci sekmece reddedilir; ikinci sekme kilidi aldıktan sonra `auth-session.ts:168-185` yoluyla ikinci refresh’i gönderir. Bu, kapsam 4’teki “eşzamanlı iki 401 → tek refresh” güvencesini geçerli backend yapılandırmasında bozar. Mevcut e2e yalnız `SESSION_TTL=1m` kullanır: `e2e/backend/up.sh:112-143`; bu sınır için regresyon testi yoktur. |

## Kabul ölçütleri

| Kabul ölçütü | Sonuç | Kanıt |
|---|---|---|
| CI yeşil: strict typecheck, lint, Vitest, üretim diff’i, build ve gerçek-backend Playwright | **Kanıtlandı** | Koordinatörce doğrulanan run `37783360065`; iş tanımları `.github/workflows/ci.yml:23-177`. CX-Ö-04 tedarik girdisi açığı ayrıca geçerlidir. |
| Token `localStorage`/`sessionStorage`’a yazılmaz | **Kanıtlandı** | `auth-session.ts:55-63`; test **“giriş, refresh ve çıkış boyunca…”**, `client.test.ts:453-469`; lint yasağı `eslint.config.js:17-37,73-76`. |
| İki sekmede eşzamanlı 401 → tek refresh | **Kısmen** | Varsayılan/kısa TTL için gerçek e2e ve birim testleri var: `two-tabs.spec.ts:18-86`, `client.test.ts:111-177`. Geçerli TTL > 7 gün yapılandırmasında CX-r1-Ö-01 nedeniyle garanti bozulur. |
| Elle yazılmış DTO yok; lint kapısı kaçışları engeller | **Kanıtlandı** | `eslint.config.js:78-103`; `architecture.test.ts:86-141`; mevcut API kaynağı `src/modules/identity/api/index.ts:1-9`. |

## Kapsam 1–12

| No | Kapsam | Durum | Kısa kanıt/not |
|---:|---|---|---|
| 1 | Vue 3.5, TypeScript strict, Vite, pnpm, Node LTS | **Var** | `package.json:6-8,27-63`, `.nvmrc`, `tsconfig.app.json`. |
| 2 | Katman düzeni ve ESLint sınır kuralı | **Var** | `src/app`, `src/shared`, `src/modules`; `eslint.config.js:107-159`; negatif mimari testleri. |
| 3 | Etiketli OpenAPI tip üretimi ve CI diff kapısı | **Var** | `api-pin.json:1-6`; `scripts/gen-api.ts:18-44,91-118`; CI `ci.yml:42-71`. |
| 4 | HTTP, kimlik, CSRF, kapsam, refresh ve hata | **Kısmen** | Temel katman ve testler var; TTL > 7 gün halinde CX-r1-Ö-01 tek-refresh güvencesini bozar. |
| 5 | Pinia oturum deposu, sessiz refresh, parola bayrağı, çıkış | **Var** | `src/shared/session/store.ts:15-76`; `unavailable` testleri `store.test.ts:49-66`. |
| 6 | Kapsam deposu ve ayrışmış sorgu anahtarları | **Var** | `src/shared/scope/scope.ts:1-26`; `scope/store.ts`; kapsam testleri. |
| 7 | vue-i18n ve hata kataloğundan TR tablo | **Var** | `src/shared/i18n`; `error-codes.gen.ts`; katalog tamlık testleri. |
| 8 | Tasarım token’ları, açık/koyu, CSS ve PrimeVue preset | **Var** | `tokens/tokens.json`; `scripts/gen-tokens.ts`; `src/shared/tokens`. |
| 9 | Vite aynı-origin proxy ve `.env.development` | **Var** | `vite.config.ts`; `.env.development`; README `46-50`. |
| 10 | API fixture ve ilk yönetici | **Var — sapma kabul edilmiş** | API fixture `e2e/global-setup.ts`; geçici bootstrap ve izolasyon `README.md:82-91`, `check-isolation.sh:10-32`. |
| 11 | CI kalite işi ve gerçek backend Playwright | **Kısmen** | İşler ve koordinatörce doğrulanan run mevcut; gerçek backend imajının tabanları digest’e sabit değil (CX-Ö-04). |
| 12 | PR şablonu | **Var** | `.github/pull_request_template.md:1-21`; D-0174 sonrası faz ifadesi güncel. |

---

# WEB-1a Codex nihai kapı hükmü — 3. koşum (r2)

- **Hüküm: UYGUN DEĞİL**
- Denetlenen: `main` @ `5b291aa7412378975a646ded3de5ece1578dc9ac`
- Taban: `71d0b34`; aradaki tek squash commit PR #7’dir.
- Çalışma ağacı temizdir; `git diff --check 71d0b34 5b291aa` ve değişen kabuk betiklerinde `bash -n` başarılıdır.
- CI run `37786199812` iki işinin başarısı koordinatör kanıtı olarak kabul edildi; CI’ya erişilmedi ve salt-okunur kısıt nedeniyle testler yeniden çalıştırılmadı.
- Önceki iki açık bulgu kapanmıştır. Ancak diff, paylaşılan Docker daemon’ında NIZAM.IO’ya ait olmayan kanonik imaj etiketlerini değiştiren yeni bir **Önemli** bulgu getirmiştir. Bu nedenle UYGUN hükmü verilemez.

## Açık iki bulgunun kapanışı

| Kimlik | Durum | Kanıt |
|---|---|---|
| **CX-Ö-04** | **Kapandı — frontend düzeyinde geçici güvence; kalıcı pin F23’e devredilmiş** | Bootstrap Dockerfile syntax, Go ve distroless girdileri digest’lidir: `e2e/backend/bootstrap.Dockerfile:1,6,14`. Backend tabanları digest’le çekilip `--pull=false` ile kullanılıyor; syntax frontend’i `BUILDKIT_SYNTAX` ile digest’e sabitleniyor: `e2e/backend/up.sh:53-86`. Runtime katman öneki ve Go yerel etiketinin pinli imaj kimliği doğrulanıyor: `e2e/backend/check-base-pins.sh:8-16,18-38`. Bildirilen CI günlüğündeki yalnız pinli syntax için uzaktan `resolve`, Go/distroless için yalnız `load metadata` görünmesi betiğin `:20-38` mantığıyla tutarlıdır. Backend Dockerfile’ına kalıcı digest eklenmesi README’de F23’e devredilmiştir: `README.md:98-102`. |
| **CX-r1-Ö-01** | **Kapandı** | `expiresAt` artık üst sınırla değil, gelecekte olma ve güvenli tamsayı şartıyla doğrulanıyor: `src/shared/session/messages.ts:99-108`. Backend etiketinde `SESSION_TTL` yalnız bir dakikalık alt sınır taşır: backend `internal/platform/config/schema.go` (`v0.1.0-api`):272-279. 30/365 günlük ileti testleri: **“uzun ömürlü belirteç … kabul edilir”**, `src/shared/session/messages.test.ts:20-26`. 15 dakika, 30 gün ve 365 gün için iki sekmede tek refresh regresyonu: **“İKİ SEKME eşzamanlı 401 → tek refresh … oturum ömrü %s”**, `src/shared/http/client.test.ts:111-139`. |

## Diff’in getirdiği yeni bulgular

| Kimlik | Önem | Kanıt |
|---|---|---|
| **CX-r2-Ö-01** | **Önemli — açık** | `pin_local`, digest’li imajları Docker daemon’ındaki genel `golang:1.26.0-bookworm` ve `gcr.io/distroless/static-debian12:nonroot` etiketlerine yeniden etiketliyor: `e2e/backend/up.sh:59-76`. Betiğin varsayılan çalışma kipi yereldir: `e2e/backend/up.sh:20`; dolayısıyla bu yalnız yalıtılmış CI koşucusuna özgü değildir. `down.sh` yalnız NIZAM.IO konteynerlerini/Compose projesini kaldırır; genel etiketleri geri yüklemez: `e2e/backend/down.sh:1-8`. Böylece ortak Docker daemon’ında başka projelerin kullanabileceği kanonik etiketler kalıcı olarak değiştirilir ve `AGENTS.md:10-12` içindeki “yalnız adıyla belirtilen NIZAM.IO kaynaklarına dokunma” sınırı aşılır. Etiket yarışması ayrıca yerel paralel derlemelerin taban seçimini etkileyebilir. Çözüm, etiketli backend kaynak ağacının geçici kopyasındaki Dockerfile `FROM` girdilerini doğrudan digest’li hale getirmek veya yalnız NIZAM.IO ad alanlı geçici imaj adları kullanmaktır. |

Kapanmış önceki bulgularda diff kaynaklı başka regresyon saptanmadı.

## Kabul ölçütleri

| Kabul ölçütü | Sonuç | Kısa kanıt |
|---|---|---|
| CI: strict typecheck, lint, Vitest, üretim diff’i, build ve gerçek-backend Playwright | **Kanıtlandı** | Koordinatörce doğrulanan run `37786199812`; işler `.github/workflows/ci.yml:23-177`. |
| Token `localStorage`/`sessionStorage`’a yazılmaz | **Kanıtlandı** | `eslint.config.js:17-37,73-76`; test `src/shared/http/client.test.ts:462-476`; gerçek tarayıcı `e2e/smoke.spec.ts:8-14,40-53`. |
| İki sekmede eşzamanlı 401 → tek refresh | **Kanıtlandı** | Gerçek backend/tarayıcı: `e2e/two-tabs.spec.ts:18-86`; uzun TTL regresyon matrisi: `src/shared/http/client.test.ts:111-139`. |
| Elle DTO yok; lint kaçışları engeller | **Kanıtlandı** | `eslint.config.js:78-103`; test grubu **“elle DTO yasağı”**, `tests/lint/architecture.test.ts:86-141`. |

## Kapsam 1–12

| No | Kapsam | Durum | Kısa kanıt/not |
|---:|---|---|---|
| 1 | Vue 3.5, TypeScript strict, Vite, pnpm, Node LTS | **Var** | `package.json:6-8,27-63`; `tsconfig.app.json:2-13`; `.nvmrc`. |
| 2 | Katman düzeni ve ESLint sınır kuralı | **Var** | `src/app`, `src/shared`, `src/modules`; `eslint.config.js:107-159`. |
| 3 | Etiketli OpenAPI tip üretimi ve CI diff kapısı | **Var** | `api-pin.json:1-6`; `scripts/gen-api.ts:18-48,91-124`; CI `:42-71`. |
| 4 | HTTP, kimlik, CSRF, kapsam, refresh ve hata | **Var** | `src/shared/http/client.ts:56-125`; uzun TTL sorunu kapanmıştır. |
| 5 | Pinia oturum deposu, sessiz refresh, parola bayrağı, çıkış | **Var** | `src/shared/session/store.ts:15-76`. |
| 6 | Kapsam deposu ve ayrışmış sorgu anahtarları | **Var** | `src/shared/scope/scope.ts:7-26`; `store.ts:19-45`. |
| 7 | vue-i18n ve hata kataloğundan TR tablo | **Var** | `src/shared/i18n`; `src/shared/api/error-codes.gen.ts`. |
| 8 | Tasarım token’ları, açık/koyu, CSS ve PrimeVue preset | **Var** | `tokens/tokens.json`; `scripts/gen-tokens.ts`; `src/shared/tokens`. |
| 9 | Vite aynı-origin proxy ve `.env.development` | **Var** | `vite.config.ts`; `.env.development`. |
| 10 | API fixture ve ilk yönetici | **Var — kabul edilmiş sapma** | `e2e/global-setup.ts`; geçici bootstrap/izolasyon `README.md:82-91`. |
| 11 | CI kalite işi ve gerçek backend Playwright | **Kısmen** | CI ve testler mevcut; yerel e2e taban pinleme yöntemi paylaşılan-makine sınırını ihlal ediyor: **CX-r2-Ö-01**. |
| 12 | PR şablonu | **Var** | `.github/pull_request_template.md:1-21`. |

---

# WEB-1a Codex nihai kapı hükmü — 4. koşum (r3)

- **Hüküm: UYGUN**
- Denetlenen: `main` @ `cfbb708e5cacbb2b0aa02477fe3243066b8ae549`
- Taban: `5b291aa`; aradaki tek squash commit PR #8’dir.
- Çalışma ağacı temizdir; `git diff --check` ve değişen kabuk betiklerinde `bash -n` başarılıdır.
- CI run `37788190257` iki işinin başarısı koordinatör kanıtı olarak kabul edildi; CI’ya erişilmedi ve testler yeniden çalıştırılmadı.

## CX-r2-Ö-01 kapanışı

| Kimlik | Durum | Kanıt |
|---|---|---|
| **CX-r2-Ö-01** | **Kapandı** | Genel `golang`/`distroless` etiketlerini oluşturan `docker tag` yolu kaldırılmıştır. Betik yalnız geçici backend kopyasındaki iki `FROM` satırını digest’li referanslarla değiştirir ve yalnız `nizamio-web-e2e/*` imajlarını üretir: [up.sh:46](../../e2e/backend/up.sh), [up.sh:70](../../e2e/backend/up.sh), [up.sh:83](../../e2e/backend/up.sh), [up.sh:86](../../e2e/backend/up.sh). Denetim, geçici Dockerfile’daki bütün `FROM` girdilerinin digest’li olduğunu, BuildKit günlüğünde iki pinli referansın bulunduğunu ve runtime katmanlarının pinli distroless tabanıyla başladığını doğrular: [check-base-pins.sh:11](../../e2e/backend/check-base-pins.sh), [check-base-pins.sh:19](../../e2e/backend/check-base-pins.sh), [check-base-pins.sh:31](../../e2e/backend/check-base-pins.sh). Bildirilen BuildKit günlüğündeki digest’li iki `FROM` çözümlemesi bu mantıkla tutarlıdır. CI ayrıca yorum dışı imaj etiketleme/silme komutlarını reddeder: [ci.yml:88](../../.github/workflows/ci.yml). Yerel grep sonucu: **0 yasak imaj mutasyonu**. |

## Diff’in getirdiği yeni bulgular

**Yok.** Kapanmış önceki bulgularda regresyon saptanmadı.

## Kabul ölçütleri

| Kabul ölçütü | Sonuç | Kısa kanıt |
|---|---|---|
| CI: strict typecheck, lint, Vitest, üretim diff’i, build ve gerçek-backend Playwright | **Kanıtlandı** | Koordinatörce doğrulanan run `37788190257`, iki iş success; iş tanımları `.github/workflows/ci.yml`. |
| Token kalıcı tarayıcı depolarına yazılmaz | **Kanıtlandı** | Önceki koşum kanıtları geçerli; bu diff oturum kodunu değiştirmiyor. |
| İki sekmede eşzamanlı 401 → tek refresh | **Kanıtlandı** | `e2e/two-tabs.spec.ts` ve uzun TTL birim matrisi; bu diff ilgili kodu değiştirmiyor. |
| Elle DTO yok; lint kaçışları engeller | **Kanıtlandı** | `eslint.config.js` ve `tests/lint/architecture.test.ts`; bu diff ilgili yüzeyi değiştirmiyor. |

## Kapsam 1–12

| No | Kapsam | Durum | Kısa kanıt/not |
|---:|---|---|---|
| 1 | Vue 3.5, TS strict, Vite, pnpm, Node LTS | **Var** | `package.json`, `tsconfig.app.json`, `.nvmrc` |
| 2 | Katman düzeni ve ESLint sınır kuralı | **Var** | `src/app`, `src/shared`, `src/modules`, `eslint.config.js` |
| 3 | Etiketli OpenAPI üretimi ve CI diff kapısı | **Var** | `api-pin.json`, `scripts/gen-api.ts`, CI |
| 4 | HTTP, kimlik, CSRF, kapsam, refresh ve hata | **Var** | `src/shared/http`, `session`, `scope`, `errors` |
| 5 | Pinia oturum deposu ve oturum yaşam döngüsü | **Var** | `src/shared/session/store.ts` |
| 6 | Kapsam deposu ve ayrışmış sorgu anahtarları | **Var** | `src/shared/scope` |
| 7 | vue-i18n ve üretilen TR hata tablosu | **Var** | `src/shared/i18n`, `error-codes.gen.ts` |
| 8 | Tasarım token’ları ve PrimeVue preset | **Var** | `tokens/tokens.json`, `src/shared/tokens` |
| 9 | Aynı-origin Vite proxy | **Var** | `vite.config.ts`, `.env.development` |
| 10 | API fixture ve ilk yönetici | **Var — kabul edilmiş sapma** | `e2e/global-setup.ts`; geçici bootstrap izolasyonu |
| 11 | CI ve gerçek-backend Playwright | **Var** | Run `37788190257`; digest’li geçici `FROM` dönüşümü, genel Docker etiketi mutasyonu yok |
| 12 | PR şablonu | **Var** | `.github/pull_request_template.md` |

**Engelleyici veya Önemli açık bulgu yoktur.**

---

