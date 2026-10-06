# CLAUDE.md — nizam.io--frontend (web istemcisi)

Bu depo NIZAM.IO'nun web istemcisidir. Süreç kaydı **bu depodadır** (PR + CI); yönetim
deposundaki eski kayıt sistemine (`project-control`) bağlı değildir.

## Okuma sırası (oturum başı)

1. `../program/DURUM.md` — aktif faz ve sıradaki tek iş (yönetim deposu `NIZAM.IO/program/`).
2. `../program/fazlar/FNN-*.md` — aktif web fazının amacı, kapsamı, kabul ölçütü.
3. Backend API sözleşmesi (tek kaynak): `../nizam.io--backend/docs/api/`
   - `openapi.yaml` — uçlar, şemalar, kapsam başlıkları, hata yanıtları
   - `error-codes.json` — hata kodu → HTTP durumu → `fields[]` → mesaj anahtarı
   - `README.md` — sürüm ve etiket ilkesi
4. Bu depodaki `README.md` (komutlar, dizin düzeni) ve açık PR'lar.

Spec her zaman bir **backend etiketinden** okunur (ilk pin: `v0.1.0-api`). Etiketsiz
`main` spec'inden tip üretilmez.

## Kurallar

- **Sözleşme tek taraflıdır:** backend `docs/api/` yetkilidir. Bu depoda spec'in yerel
  kopyası düzenlenmez; uyuşmazlıkta backend'de iş açılır, istemci uydurmaz.
- **Kapsam açık taşınır:** S2 uçlarda `X-Nizamio-Program`, S3'te ek olarak
  `X-Nizamio-Department` zorunlu; örtük varsayılan kapsam yoktur.
- **Yazma istekleri** `X-Requested-With` başlığını taşır (CSRF).
- **Belirteçler:** erişim belirteci yalnız bellekte; yenileme HttpOnly çerezde. Hiçbir
  belirteç `localStorage`/`sessionStorage`'a yazılmaz.
- **Hata zarfı:** `{code, message, request_id, fields[]}`; kullanıcı metni `code`'dan
  i18n anahtarıyla üretilir, `message` gösterilmez.
- **Uyumsuzluk açık hatadır:** `GET /v1/instance/profile` `api_version` desteklenmiyorsa
  sessiz düşüş yok, "güncelleme gerekli" ekranı.
- Eski Teknofest web kodu kopyalanmaz.
- Backend veya yönetim deposuna bu depodan yazılmaz.

## Teslim

Her değişiklik PR ile gelir; şablon `.github/pull_request_template.md`. "Bitti" yalnız
CI yeşil + kabul ölçütü kanıtıyla söylenir. Dilim sonunda Codex tek koşum (salt okunur)
hükmü `docs/reviews/` altına yazılır; faz kapanışı `../program/DURUM.md`'ye işlenir.
Ürün sahibine oturum içinde soru sorulmaz; kırmızı karar faz dosyasındaki varsayılanla
ilerler ve DURUM.md'ye yazılır.
