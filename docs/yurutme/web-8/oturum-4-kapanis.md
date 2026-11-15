# O4 — Kapanış (iskelet)

**Durum (2026-11-15):** başlamadı. F8 kapanışı O2a/O2b/O3 birleşik main + CI yeşil gerektirir.

## Planlanan akış

| Adım | İş | İşçi / rol | Durum |
| ---- | -- | ---------- | ----- |
| 1 | Belgeler: `rapor-F8` (pin envanteri: bağlanan / kısmen / değişmedi; canlanan E-satırları; kalan BE), ilerleme, oturum-3/4 sonuçları, ekran README "F8 uygulama kanıtı", `WEB-8-codex` iskeleti, `web-9` iskeleti (F9 adayları), yol haritası §4, tasarım README notu | W177 | bekliyor |
| 2 | `dogrulama-F8.md`: gerçek Docker üretim imajı + Caddy CSP + gerçek backend **`v0.23.0-api` imajı** (e2e/backend `up.sh` etiketi pinle birlikte, P73); P33 yolu yok kanıtı, ZIP/CSV bilet indirme, rapor bölüm seçimi, silinenler toplu, toplantı katılımcı adayları, görev kodu, 3 rol × 390/1024/1440 × iki tema, `KUSUR n:` listesi | W178 | bekliyor |
| 3 | Kusur düzeltmeleri (W179…) | işçi | gerekirse |
| 4 | Codex tur 1…3 (`gpt-6.1-sol` medium `-s read-only`; ilk eylem HEAD, araç izi); sınıf soruları: yetki/kapsam sızıntısı (P33 kaldırıldı), bilet hedefi, `Idempotency-Key` yaşam döngüsü, pin ↔ fixture uyumu | Codex | bekliyor |
| 5 | Kapanış belge PR'ı, CI SUCCESS ve MERGED | koordinatör | bekliyor |

## Kapanış ölçütü

Kapanış kaydı "F8 KAPANDI" yalnız CI SUCCESS + MERGED + Codex hükmü sonrası yazılır; kanıtlanamayanlar (VoiceOver, görsel onay, CDN arkası SSE vb.) açıkça "yapılamadı" kalır, otomatik tamamlanmış sayılmaz (KESİN 32).
