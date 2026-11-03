# CLAUDE.md — nizam.io--frontend (web istemcisi)

Bu depo NIZAM.IO'nun web istemcisidir. Süreç kaydı **bu depodadır** (PR + CI); yönetim
deposundaki eski kayıt sistemine (`project-control`) bağlı değildir.

## Okuma sırası (oturum başı)

1. `../program/DURUM.md` — aktif iş ve sıradaki tek adım (yönetim deposu `NIZAM.IO/program/`).
2. `../program/isler/FNN-*.md` — aktif web işinin amacı, kapsamı, kabul ölçütü.
3. Backend API sözleşmesi (tek kaynak): `../nizam.io--backend/docs/api/`
   - `openapi.yaml` — uçlar, şemalar, kapsam başlıkları, hata yanıtları
   - `error-codes.json` — hata kodu → HTTP durumu → `fields[]` → mesaj anahtarı
   - `README.md` — sürüm ve etiket ilkesi
4. Bu depodaki `README.md` (komutlar, dizin düzeni), `src/CLAUDE.md` (kaynak haritası) ve açık PR'lar.

Pin kuralı tek yerde: kök [`../README.md`](../README.md) (tek cümle) ve backend
`docs/api/README.md` §8; güncel pin `api-pin.json`.

## Kurallar

- **Sözleşme tek taraflıdır:** backend `docs/api/` yetkilidir. Bu depoda spec'in yerel
  kopyası düzenlenmez; uyuşmazlıkta backend'de iş açılır, istemci uydurmaz.
- Sözleşme ayrıntıları (kapsam başlıkları, hata zarfı, sayfalama, sürüm):
  `../nizam.io--backend/docs/api/README.md`.
- **Yazma istekleri** `X-Requested-With` başlığını taşır (CSRF).
- **Belirteçler:** erişim belirteci yalnız bellekte; yenileme HttpOnly çerezde. Hiçbir
  belirteç `localStorage`/`sessionStorage`'a yazılmaz.
- **Uyumsuzluk açık hatadır:** `GET /v1/instance/profile` `api_version` desteklenmiyorsa
  sessiz düşüş yok, "güncelleme gerekli" ekranı.
- Eski Teknofest web kodu kopyalanmaz.
- Backend veya yönetim deposuna bu depodan yazılmaz.

## Teslim

Her değişiklik PR ile gelir; şablon `.github/pull_request_template.md`. "Bitti" yalnız
CI yeşil + kabul ölçütü kanıtıyla söylenir. Faz sonunda Codex tek koşum (salt okunur)
hükmü `docs/reviews/` altına yazılır; faz kapanışı `../program/DURUM.md`'ye işlenir.
Oturum protokolü ve kırmızı karar kuralı: `../program/README.md`.
