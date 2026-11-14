# O4 — Kapanış (iskelet, bekliyor)

**Durum (2026-11-14):** bekliyor.

## Planlanan akış

| Adım | İş | İşçi / rol | Durum |
| ---- | -- | ---------- | ----- |
| 1 | Belgeler: `rapor-F7` (F7'de bağlanan uçlar, BE-142…BE-159 / BE-160… durumları, öneri sırası), ilerleme, oturum-3, 10/14/00 kabul kanıtları, yol haritası §4, tasarım README notu | W161 (Sonnet 5.5) | bekliyor |
| 2 | `dogrulama-F7.md`: gerçek Docker üretim imajı + Caddy CSP + gerçek backend (pin `v0.15.0-api`); SSE gerçek akış, 429/çakışma, üç rol × 390/1024/1440 × iki tema, `KUSUR n:` listesi | W162 (Sonnet 5.5) | bekliyor |
| 3 | Nihai kapı: Codex salt okunur, 2–3 tur; hüküm `docs/reviews/WEB-7-codex.md` | Codex | bekliyor |
| 4 | Koşullar işçiyle kapatılır; gerekirse sonraki tur | işçi + koordinatör | bekliyor |
| 5 | Kapanış PR, MERGED ve kayıt (ilerleme, `../program/DURUM.md` yönetim deposu kuralıyla) | koordinatör | bekliyor |

Roller ve kural: web-6 kalıbı ([oturum-4-kapanis](../web-6/oturum-4-kapanis.md)). Gerçek cihaz/kullanıcı onayı otomatik geçti sayılmaz; yapılamayan kanıt baştan "yapılamadı" yazılır (KESİN 32).
