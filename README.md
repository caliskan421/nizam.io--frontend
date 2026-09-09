# NIZAM.IO — Frontend (Web)

Bu depo, NIZAM.IO ürününün **web istemcisi** için ayrılmıştır. **Bu depoda henüz uygulama
kodu yoktur** — ne çerçeve iskeleti, ne `package.json`, ne de build yapılandırması. Bu
dört yönetişim dosyası (`README.md`, `CLAUDE.md`, `AGENTS.md`, `.gitignore`) deponun ilk
içeriğidir.

## Mevcut durum

- **Faz 3** (iskelet ve risk pilotları) backend'de tamamlanmış, **G3 ön-kabul** teknik
  olarak geçmiştir (bağımsız denetim [REV-0018](../project-control/verification/reviews/REV-0018-g3-on-kabul-ve-kayit-tutarliligi.md)
  §7, 5/5 koşulsuz uygun) — ancak **ürün sahibinin kişisel G3 kabulü henüz verilmemiştir.**
- **Faz 4 (modül dikey dilimleri) başlatılmamıştır.** [D-0068](../project-control/decision-register.md#d-0068)
  ve [D-0057](../project-control/decision-register.md#d-0057) gereği frontend ve mobil, Faz 3'te
  hiç kod almadı; Faz 3'ün tamamı backend'de (`nizam.io--backend`) yürütüldü.
- Aktif yönetim iş paketi [WP-340](../project-control/work/active/WP-340-faz4-oncesi-toparlama.md)
  (Faz 4 öncesi toparlama) kapsamında bu depo **ilk kez açılmıştır**; WP-340 bir Faz 4
  paketi değildir ve Faz 4'ü başlatmaz ([D-0078](../project-control/decision-register.md#d-0078)).
  Faz 4 dilimleri (WP-4xx) ürün sahibinin kişisel G3 kabulü ve açık talimatı olmadan
  açılmaz.
- **Teknoloji seçimi (framework) henüz karara bağlanmamıştır.** Backend için D-0068 ile
  Go yığını seçildi; frontend/mobil için eşdeğer bir teknoloji kararı yoktur. Bu depoda
  hayalî bir mimari, çalışmayan bir komut veya var olmayan bir dizin **tarif edilmez**.

## Uygulanmış / plânlanan ayrımı

**Uygulanmış:** yok. Bu depoda yalnız bu dört yönetişim dosyası vardır.

**Plânlanan (Faz 4 dilimleriyle, henüz uygulanmadı):**

- Web istemcisinin, backend'in `/v1` uçlarını [C2 — API ve hata sözleşmesi](../project-control/contracts/api/api-and-error-contract.md)
  ve [errors/README.md](../project-control/contracts/errors/README.md) kararlı hata zarfıyla tüketmesi.
- Kimlik/kapsam sınıflarının (S0–S3) [C1 — Kimlik, instance ve kapsam sınıfı](../project-control/contracts/api/identity-and-scope.md)
  sözlüğüne göre uygulanması; kapsam (program/departman) her istekte **açık** taşınır,
  örtük varsayılana düşme yoktur.
- [C6 — Sürüm uyumluluk beyanı](../project-control/contracts/compatibility/README.md) ile
  tanımlı API sürümü/uyumluluk ekseninin istemci tarafında gözetilmesi ([ADR-0008](../project-control/architecture/decisions/ADR-0008-api-surumu-ve-destek-penceresi.md)
  — kırıcı değişiklik açık hata verir, sessiz düşüş yoktur).
- Eski Teknofest web istemcisinde ([`references/teknofest/`](../project-control/references/teknofest/README.md)
  üzerinden davranış kanıtı olarak incelenen `SRC-TF-FE`, sabit commit `1485936`)
  bugün kanıtlı davranışların ([capability-inventory.md](../project-control/product/capability-inventory.md))
  ilgili Faz 4 diliminde PARITY/CORRECTION/NEW sınıflarıyla yeniden değerlendirilip taşınması.

Hiçbiri henüz uygulanmadı; hiçbir dosya, dizin veya komut bu depoda mevcut değildir.

## Temel akış (plânlanan — henüz uygulanmadı)

Kullanıcı tarayıcıdan web istemcisine bağlanır → giriş (`/v1/auth/login`, S0/S1) →
kimlik/kapsam bilgisiyle program/departman seçimi (S2/S3, kapsam açık taşınır) → iş
kalemi/organizasyon akışları backend'in ilgili modül uçlarını çağırır → hata durumunda
C2 kararlı hata zarfı kullanıcıya yansıtılır. Bu akış **tasarım niyetidir**; hiçbir adımı
bu depoda kodlanmamıştır.

## Depo düzeni

Şu an yalnız:

```text
README.md
CLAUDE.md
AGENTS.md
.gitignore
```

Framework seçimi yapıldığında iskelet ve bağımlılık dosyaları ilgili Faz 4 iş paketinin
yazılabilir alanında eklenir.

## Bağımlılıklar

- **`nizam.io--backend`** — API sağlayıcısı; bu depoyla aynı üst dizinin kardeşidir
  (`../nizam.io--backend/README.md`).
- **Sözleşmeler** — `../project-control/contracts/` (C1 kimlik/kapsam, C2 API/hata, C6
  uyumluluk; ayrıca [contracts/README.md](../project-control/contracts/README.md) tam
  liste).
- **Framework/teknoloji seçimi** — bekliyor; ilgili Faz 4 iş paketinde kararlaştırılır.

## Çalıştırma ve test komutları

**Henüz yok.** Bu depoda çalıştırılabilir hiçbir kod, script veya bağımlılık dosyası
yoktur; bu nedenle kurulum, çalıştırma, test veya lint komutu **uydurulmamıştır**.

## Yapılandırma

**Henüz yok.** Ortam değişkeni, `.env` şeması veya config dosyası tanımlanmamıştır.

## CI

**Henüz yok.** İlk kod dilimiyle birlikte eklenir (bkz. backend `nizam.io--backend/.github/workflows/verify.yml`
yalnız CI'nın nasıl anlatıldığına örnektir — bu depoya kopyalanmaz, framework seçimiyle
yeniden yazılır).

## Bilinen sınırlar

- Framework/teknoloji seçimi yok → hiçbir kod yazılamaz.
- Mobil ile ortak davranış tutarlılığı ([product/scope.md](../project-control/product/scope.md)
  madde 4 — "ortak web ve mobil deneyim") henüz doğrulanacak bir uygulama yok.
- Eski Teknofest frontend'i (`SRC-TF-FE`) yalnız davranış kanıtıdır; hedef mimariyi
  belirlemez ve kodu doğrudan kopyalanmaz (V2 §2.2, §7.1; [references/teknofest/README.md](../project-control/references/teknofest/README.md)).

## Yönetim kayıtlarına erişim

Bu depo kod ve depo-yerel belgeyi taşır; **yönetişim kayıtları** (karar kaydı, durum,
sözleşmeler, ADR'ler) `NIZAM.IO` yönetim deposunda `project-control/` altında yaşar ve
bu ürün deposunun **kardeşi** olarak yerleşir:

```text
NIZAM.IO/
├── project-control/        ← yönetim kayıtları (bu depo değil)
├── nizam.io--backend/
├── nizam.io--frontend/      ← bu depo
└── nizam.io--mobile/
```

Bu README'deki `../project-control/...` bağlantıları bu yerleşime göredir. **Bağımsız
checkout'ta** (yalnız bu depo klonlanırsa) yönetim deposu ayrıca ve aynı üst dizine
kardeş olarak alınmalıdır; aksi halde bağlantılar çözülmez.

**Sürüm ilişkisi** — bu README'nin yazıldığı anda:

| Depo | Commit |
|---|---|
| `NIZAM.IO` yönetim deposu | `433f1f2` |
| `nizam.io--backend` | `08ef2ac` |
| `nizam.io--frontend` (bu depo) | ilk commit: `git log -1` (WP-340, 2026-09-09) |

Güncel değerler `git -C <depo> log -1 --format=%h` ile alınır; bu tablo yalnız yazım
anının anlık görüntüsüdür, kendisi yetkili kayıt değildir.
