# O5 — Kapanış

## Açılış istemi

```
WEB-0 O5 oturumunu koordinatör olarak yürüt. Giriş: O3 PR'ları ve O4 karar belgesi main'de, CI yeşil.
Oku: docs/yurutme/web-0/README.md → oturum-5-kapanis.md → ilerleme.md.
Adımları sırayla uygula. Ürün sahibine soru sorma.
```

## Adımlar

1. **Eksik raporu:** `docs/backend-eksikleri/rapor-F0.md` — F0'da eklenen/değişen BE satırları; backend için iş paketleri (modül başına grup, boyut, önerilen sıra, ilgili GAP/KR), **F1'in ihtiyaç duyacakları önce** (BE-003…BE-010). Rapor ürün sahibinin paralel backend ajanına doğrudan verilebilecek biçimde yazılır (her paket: amaç, uç/alan önerisi, kabul).
2. **Doğrulama:** `main`'de tam kapı (`typecheck`, `lint`, `format:check`, `test`, `build`, `gen:check`) + e2e CI koşumu; açık/koyu tema ve 1440/1024/390 genişlikte kabuk ekran görüntüleri tasarımla yan yana (kanıt özeti, görüntüler git'e girmez).
3. **Codex kapısı:** `codex exec -s read-only` tek koşum; istem: F0 kabul ölçütleri (yol haritası K1–K13'ün F0 payı), "dosyaları kabuk komutlarıyla oku, ilk eylemde HEAD'i yaz", bilerek yapılmayanlar. Hüküm `docs/reviews/WEB-0-codex.md`; araç izi olmayan çıktı kapı sayılmaz. KOŞULLU ise koşullar kapatılır, gerekirse ikinci tur.
4. **Kayıt:** `ilerleme.md` kapanış satırı; yönetim deposu `program/DURUM.md` tek satır + `gunluk/` satırı (yönetim deposu kuralıyla, kayıt kilidi); yol haritası durumu.
5. **F1 hazırlığı:** `docs/yurutme/web-1/` iskeleti (F1 oturumları), BE raporundaki "backend'de" satırlarının pin yükseltme planı.
