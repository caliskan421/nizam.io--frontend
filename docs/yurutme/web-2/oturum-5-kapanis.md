# O5 — Kapanış

## Açılış istemi

```
WEB-2 O5 oturumunu koordinatör olarak yürüt. Giriş: O2–O4 PR'ları main'de, CI yeşil.
Oku: docs/yurutme/web-2/README.md → oturum-5-kapanis.md → ilerleme.md.
Adımları sırayla uygula. Ürün sahibine soru sorma.
```

## Adımlar

1. **Eksik raporu:** `docs/backend-eksikleri/rapor-F2.md` — `rapor-F1.md` üzerine: F2'de eklenen/değişen BE satırları, `backend'de`/`bağlandı`ya geçenler (pin yükseltildiyse), **F3'ün ihtiyaç duyacakları önce** (tespit raporu Paket 0.4 + Paket 3: BE-019, BE-051…059, BE-020). Her paket: amaç, uç/alan önerisi, kabul.
2. **Kabul tabloları:** 05 ve 08 tablolarının "Kabul kanıtı" sütununa PR numaraları; ürün sahibi #13–#18'i cevapladıysa `geçici kabul` → `kabul`/`ret`, README durum satırı güncellenir; 00-ortak E-00-23/24/25 kabul kanıtı. **F3 kabul tablosu:** `docs/ekranlar/03c-zaman-cizelgesi/README.md` (Codex §6 #11–#12; P8 bağlayıcı; cevapsız soru → varsayılan geçici kabul + `ilerleme.md` notu).
3. **Doğrulama:** `main`'de tam kapı (`typecheck`, `lint`, `format:check`, `test`, `build`, `gen:check`) + e2e CI koşumu; 05, 05b, 08, 08b ekranları açık/koyu tema × 1440/1024/390 genişlikte tasarımla yan yana (kanıt özeti, görüntüler git'e girmez); program yönetimi P3 ekranı; yönetici Admin/Koordinatör merceği, koordinatör, üye ile birer tur. **Ek (WEB-1 O5 Codex önerisi):** sahte `/v1` görsel turu yetmez — faz sonunda gerçek imaj tanığı (Docker imajı + Caddy CSP başlığı, gerçek backend) ile iki tema × 390/1024/1440 taşma, hesaplanmış stil ve tüm CSP ihlalleri 0; gerçek yükleme/indirme.
4. **Codex kapısı:** `codex exec -s read-only` tek koşum; istem: F2 kabul ölçütleri (05 ve 08 kabul tablolarının `kabul`/`geçici kabul` satırları, K1/K3/K5/K7/K11/K13 F2 payı, satır dışı varsayımlar), "dosyaları kabuk komutlarıyla oku, ilk eylemde HEAD'i yaz", bilerek yapılmayanlar. Hüküm `docs/reviews/WEB-2-codex.md`; araç izi olmayan çıktı kapı sayılmaz. KOŞULLU ise koşullar kapatılır, gerekirse ikinci tur.
5. **Kayıt:** `ilerleme.md` kapanış satırı; yönetim deposu `program/DURUM.md` tek satır + `gunluk/` satırı (yönetim deposu kuralıyla); `sentez.md` §8 durum satırı.
6. **F3 hazırlığı:** `docs/yurutme/web-3/` iskeleti (kendi SVG Gantt kararı `docs/architecture/gantt-secimi.md`; her W'nin "Tespit" satırı `03c-zaman-cizelgesi/` dosyalarına ve kabul tablosuna bağlanır; entegrasyon turu oturumu dahil).
