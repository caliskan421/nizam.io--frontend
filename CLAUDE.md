# CLAUDE.md — nizam.io--frontend

Bu dosya, bu depoda çalışan Claude oturumları için geçerlidir. Yetkili süreç protokolü
(`gecis-v2.md`, "V2") burada **kopyalanmaz**; yalnız işaret edilir. V2'nin hiçbir hükmü
bu dosyayla sessizce geçersiz kılınmaz.

## 1. Platform sınırı

Bu depoda **kod yalnız aktif bir Faz 4 iş paketinin (WP-4xx) yazılabilir alanı
belirttiği ölçüde yazılır.** Böyle bir kart yoksa hiçbir kod, iskelet, bağımlılık
dosyası veya build yapılandırması yazılmaz — bu depo bugün itibarıyla dört yönetişim
dosyasından ibarettir (bkz. `README.md`).

Faz 4 henüz başlatılmamıştır ([D-0068](../project-control/decision-register.md#d-0068),
[D-0078](../project-control/decision-register.md#d-0078)). WP-340 (bu depoyu açan paket)
bir Faz 4 paketi **değildir** ve Faz 4'ü açmaz.

## 2. Okunacak kayıtlar (sıra)

Kod yazmadan önce, göreli yol + bağımsız checkout notu (`README.md` §"Yönetim
kayıtlarına erişim") ile:

1. [`../project-control/START-HERE.md`](../project-control/START-HERE.md) — oturum giriş noktası, okuma sırası, yetki sınırları, durma koşulları.
2. [`../project-control/STATE.md`](../project-control/STATE.md) — güncel faz, aktif iş paketi.
3. Aktif iş paketi (`../project-control/work/active/`) — yalnız onaylı kart kapsamında çalışılır. Kart yoksa bu depoda kod yazılmaz.
4. İlgili sözleşmeler: [C1 kimlik/kapsam](../project-control/contracts/api/identity-and-scope.md),
   [C2 API/hata](../project-control/contracts/api/api-and-error-contract.md),
   [errors/README.md](../project-control/contracts/errors/README.md),
   [C6 uyumluluk](../project-control/contracts/compatibility/README.md).
5. İlgili ADR'ler ve `../project-control/decision-register.md` içindeki açık kararlar.

Bağımsız checkout'ta yönetim deposu (`NIZAM.IO/project-control`) bu deponun üst
dizinine kardeş olarak ayrıca alınmalıdır; alınmazsa yukarıdaki bağlantılar çözülmez.

## 3. Yazılabilir alan

Aktif iş paketinin kartı **§8 (Değiştirilebilecek dosya veya alanlar)** neyi, hangi
yazarın değiştirebileceğini tanımlar. Kart dışında hiçbir dosya değiştirilmez. Bugün
için yazılabilir alan yalnız bu dört dosyadır ve kart olmadığı sürece **kapalıdır**.

## 4. Doğrulama ve teslim kuralları

Her teslim V2 §15.3 biçimini karşılar (özetle; tam metin `gecis-v2.md`'dedir, burada
kopyalanmaz): iş/gereksinim kimlikleri, incelenen/değiştirilen sürüm, kullanıcı
davranışındaki sonuç, değişen kod/migration/sözleşme, çalıştırılan doğrulamalar ve kanıt
konumu, açık riskler, yeni bulunan davranış, sonraki somut adım. **"Bitti", "çalışıyor"
veya yalnız test sayısı teslim kabul edilmez.**

Üretici ve bağımsız denetçi aynı ajan/bağlam olamaz (V2 §5, §22). Kanıtsız `PARITY`
sınıfı verilmez; kanıt yoksa `UNRESOLVED` kalır ve ilerlemez.

## 5. Yapılmayacaklar

- Backend'in API/hata sözleşmesini (C1/C2/C6) **tek taraflı** değiştirmek veya bu
  depoda yerel bir kopyasını tutmak — sözleşme değişikliği `project-control/`'de karar
  gerektirir.
- Eski Teknofest frontend kodunu (`SRC-TF-FE`) doğrudan kopyalamak. O kod yalnız
  davranış kanıtıdır ([references/teknofest/README.md](../project-control/references/teknofest/README.md));
  hedef mimariyi belirlemez (V2 §2.2, §3.1/6, §7.1).
- Kart olmadan iskelet, bağımlılık dosyası veya CI yapılandırması eklemek.
- `project-control/` veya `nizam.io--backend` dosyalarına bu depodan yazmak.
- Kaynak depolara (`sources.md`) herhangi bir yazma işlemi (branch, commit, stash,
  checkout, temizlik).
