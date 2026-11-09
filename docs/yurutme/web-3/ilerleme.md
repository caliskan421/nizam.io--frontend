# WEB-3 ilerleme

Koordinatör her oturum kapanışında bir kayıt ekler; sonraki oturum buradan başlar. Uygulayıcılar bu dosyaya yazmaz.

**F3 ürün sahibinin onayıyla 2026-11-10'da AÇILDI** (2026-11-09 talimatındaki ön koşul karşılandı).

## Durum

| Oturum | Durum | main hash |
|---|---|---|
| O1 — F3 kabul tablosu (03c) | **Tamam — kabul** (2026-11-10: Codex §6 #11–#12 → P18–P19; P8 bağlayıcı, kendi SVG Gantt) | kapanış PR'ının birleşme commit'i (aday `main` @ `d52510c` = #51–#63 + yalnız belgeler) |
| O2a — Zaman çizelgesi veri katmanı (W91) | **Başladı** (2026-11-10, dal `web3/o2-w91`) | — |
| O2b — Gantt çekirdeği, çerçeve, panel, sürükleme, 03d (W92–W96) | Bekliyor | — |
| O3 — Entegrasyon turu (W97) | Bekliyor | — |
| O4 — Kapanış | Bekliyor | — |

## Devralınan (WEB-2 O5)

- **Ürün onayı (kapandı 2026-11-10):** F3 geçişi, Codex §6 #11 (P18) ve #12 (P19) onaylandı. **Hâlâ açık:** 03 E-03-14 "Talepleri incele" hedefi (öneri).
- **W97 iş kalemleri** ([oturum-3-entegrasyon.md](oturum-3-entegrasyon.md) (11)–(15)): çip kaldırmada çift bildirim (`use-confirm` devir sayısı); 08 `DepartmentForm` kapsam değişiminde başarı bildirimi; entegrasyon testlerinin yük altında 5 sn'ye yaklaşması; **K-7** giriş formunda istemci doğrulaması yok (boş kimlik bilgisi sunucuya gidiyor); **K-8** 05 yan panel 390 px'te listenin altında açılıyor (görünür alan dışında) — ikisi WEB-2 O5 adım 3 kusurları ([`../web-2/dogrulama-F2.md`](../web-2/dogrulama-F2.md) §5; Codex CX-F2-Ö-03).
- **Codex WEB-2 tur 1 (KOŞULLU UYGUN) koşulları:** CX-F2-Ö-01/Ö-02/K-01/K-03 → W84 (PR #63 `d52510c`, F3 açılmadan); yeni Gantt okuyucuları ilk günden `sessionBound` + signal taşır (`../../reviews/WEB-2-codex.md` "F3 için riskler").
- **Tasarım/ürün kalemleri:** `unlock` simgesi tasarımda yok (`lock`'tan türetildi, P3); W81 aktarım kaynağı seçili program (varsayım).
- **Backend:** `../../backend-eksikleri/rapor-F2.md` §2 — Paket 0.4 (BE-052/051/053/019) ve 3.1 (BE-056) F3 O2a'dan önce bağlanırsa tablo "Şimdilik" yolları canlı alanla güncellenir.
- **Yeni KESİN kurallar:** [ortak-sozlesme.md](ortak-sozlesme.md) 22–27 (iskelet/rota testi gövdeden bağımsız, paylaşılan dosyada ilk işçi, i18n tek ağaç, dal zinciri, `pushAppNotice`/`sessionBound`/`settleQueries`, odak/ARIA dönüşü).

## Kayıtlar

### O1 — 2026-11-10 (belge işçisi, dal `web3/o1-kararlar`, taban main `dea40f8`)

- **Kararlar:** ürün sahibi Codex §6 #11 ve #12'yi önerilen varsayılanlarla aynen onayladı → `ortak-kurallar.md` §12 **P18** (tarih düzenleme/talep/iptal 5 sn/otomatik geri al yok) ve **P19** (görünür uçlar arası oklar, bağımlılık eylemleri Admin + Koordinatör, "görev aralığı" şeridi, dışa aktarım pilotla/devre dışı "yakında").
- **03c tablosu:** "geçici kabul (Codex §6 #11/#12)" → "kabul — P18/P19"; durum paragrafı onaylandı olarak yeniden yazıldı. 21 satır "geçici kabul (koordinatör)" (P3 yorumu) olduğu gibi kaldı.
- **F3 açıldı** (2026-11-10): ön koşul (1) ve (3) karşılandı.
- **Backend pini:** hâlâ `v0.11.0-api`; Paket 0.4 / 3.1 BE paketleri yayımlanmadı → 03c "Şimdilik" yolları geçerli.
- **O2a:** W91 başladı (dal `web3/o2-w91`).
