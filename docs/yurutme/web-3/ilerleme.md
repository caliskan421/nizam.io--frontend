# WEB-3 ilerleme

Koordinatör her oturum kapanışında bir kayıt ekler; sonraki oturum buradan başlar. Uygulayıcılar bu dosyaya yazmaz.

**F3 ürün sahibinin uyarısı/onayı olmadan AÇILMAZ (2026-11-09 talimatı).**

## Durum

| Oturum | Durum | main hash |
|---|---|---|
| O1 — F3 kabul tablosu (03c) | **Geçici kabul — ürün onayı bekliyor** (WEB-2 O5 adım 2, 2026-11-09; Codex §6 #11–#12 varsayılanları, P8 bağlayıcı, kendi SVG Gantt) | kapanış PR'ının birleşme commit'i (aday `main` @ `d52510c` = #51–#63 + yalnız belgeler) |
| O2a — Zaman çizelgesi veri katmanı (W91) | Bekliyor — ürün sahibinin F3 uyarısı/onayı | — |
| O2b — Gantt çekirdeği, çerçeve, panel, sürükleme, 03d (W92–W96) | Bekliyor | — |
| O3 — Entegrasyon turu (W97) | Bekliyor | — |
| O4 — Kapanış | Bekliyor | — |

## Devralınan (WEB-2 O5)

- **Ürün onayı bekleyenler:** F3'e geçiş uyarısı/onayı; Codex §6 #11 (sürüklemenin P8 dışındaki kısmı: panelde ayrı talep düğmesi, admin onay/red, otomatik geri al yok) ve #12 (oklar yalnız görünür uçlar, şerit "görev aralığı", dışa aktarım pilotla) — cevap farklıysa 03c tablosu W91'den önce güncellenir; 03 E-03-14 "Talepleri incele" hedefi (öneri).
- **W97 iş kalemleri** ([oturum-3-entegrasyon.md](oturum-3-entegrasyon.md) (11)–(15)): çip kaldırmada çift bildirim (`use-confirm` devir sayısı); 08 `DepartmentForm` kapsam değişiminde başarı bildirimi; entegrasyon testlerinin yük altında 5 sn'ye yaklaşması; **K-7** giriş formunda istemci doğrulaması yok (boş kimlik bilgisi sunucuya gidiyor); **K-8** 05 yan panel 390 px'te listenin altında açılıyor (görünür alan dışında) — ikisi WEB-2 O5 adım 3 kusurları ([`../web-2/dogrulama-F2.md`](../web-2/dogrulama-F2.md) §5; Codex CX-F2-Ö-03).
- **Codex WEB-2 tur 1 (KOŞULLU UYGUN) koşulları:** CX-F2-Ö-01/Ö-02/K-01/K-03 → W84 (PR #63 `d52510c`, F3 açılmadan); yeni Gantt okuyucuları ilk günden `sessionBound` + signal taşır (`../../reviews/WEB-2-codex.md` "F3 için riskler").
- **Tasarım/ürün kalemleri:** `unlock` simgesi tasarımda yok (`lock`'tan türetildi, P3); W81 aktarım kaynağı seçili program (varsayım).
- **Backend:** `../../backend-eksikleri/rapor-F2.md` §2 — Paket 0.4 (BE-052/051/053/019) ve 3.1 (BE-056) F3 O2a'dan önce bağlanırsa tablo "Şimdilik" yolları canlı alanla güncellenir.
- **Yeni KESİN kurallar:** [ortak-sozlesme.md](ortak-sozlesme.md) 22–27 (iskelet/rota testi gövdeden bağımsız, paylaşılan dosyada ilk işçi, i18n tek ağaç, dal zinciri, `pushAppNotice`/`sessionBound`/`settleQueries`, odak/ARIA dönüşü).

## Kayıtlar

(henüz yok)
