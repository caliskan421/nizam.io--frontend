# WEB-0 ilerleme

Koordinatör her oturum kapanışında bir kayıt ekler; sonraki oturum buradan başlar. Uygulayıcılar bu dosyaya yazmaz.

## Durum

| Oturum | Durum | main hash |
|---|---|---|
| O1 — Belgeler | Açık PR (`web0/o1-belgeler`) | — |
| O1b — Ekran tespitleri | Tamamlandı, aynı dalda commit bekliyor | — |
| O2 — Temel | Bekliyor (ön koşul: `sentez.md` §4 soru 1–5) | — |
| O3 — Kabuk | Bekliyor | — |
| O4 — Gantt pilotu | Bekliyor | — |
| O5 — Kapanış | Bekliyor | — |

## Kayıtlar

### 2026-11-08 — O1
- Yol haritası (K1–K15) Codex 3 tur + ürün sahibi kararlarıyla kabul; tasarım kopyası `docs/tasarim/kaynak/` (sürüm `1794118532-71ae`); eksik kaydı BE-001…BE-035 tohumlandı.
- Ürün sahibi kararları: v1 = F0–F4; yeni modül ekranları v1 dışı ve menüde gizli; departman v1'de düz; koordinatör/üye ana sayfası sade; tasarım birebir, eksik statik + faz başı eksik raporu.
- Sonraki adım: PR → CI yeşil → birleştir → O2 açılış istemi.

### 2026-11-08 — O1b (ekran tespitleri)
- `docs/ekranlar/`: 11 ekran grubu × 6 dosya; tasarım analisti → backend analisti → Sonnet denetçi (hepsi `denetlendi`) → Codex kapısı `gpt-6-astra` (`docs/reviews/EKRANLAR-codex.md`, **KOŞULLU UYGUN**) → Codex bulguları grup dosyalarına işlendi; `ortak-kurallar.md` (tek sözleşme) ve `sentez.md` (kararlar) yazıldı.
- Eksik kaydı: BE-001…031 düzeltildi (BE-008 açık, BE-023 vazgeçildi, BE-025 bölündü), BE-036…BE-106 eklendi; devir raporu `docs/backend-eksikleri/rapor-tespit-2026-11-08.md`.
- Yürütme seti bu plana bağlandı: `ortak-sozlesme.md` 2a, O2–O5 istemleri ekran gruplarına ve kabul tablolarına referans veriyor; K15 "tek satırlık bağlama" istisnası kaldırıldı (Codex CX-M-06).
- Açık: ürün sahibi `sentez.md` §4 soru 1–5 (F0/F1 engelleri); yol haritası Y1/Y2/Y3/Y9/Y11/Y12 metin onayı; bu setin commit/PR'ı.
- Sonraki adım: soru 1–5 cevapları → `00-ortak` kabul tablosu → O1+O1b PR → CI yeşil → O2.
