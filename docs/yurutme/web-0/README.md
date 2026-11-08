# WEB-0 yürütme seti — Faz 0 (temel + kabuk)

Gereksinim: [`../../architecture/yol-haritasi-web.md`](../../architecture/yol-haritasi-web.md) (K1–K15, §4 F0). Bu klasör F0'ı **kim, hangi oturumda, hangi sırayla** uygular sorusunu cevaplar; gereksinim burada tekrar yazılmaz. Kalıp mobil `docs/yurutme/mob-ui-0/` ile aynıdır.

## Roller

| Rol | Model | Yapar | Yapmaz |
|---|---|---|---|
| Koordinatör | oturumu açan ana model | Plan, uygulayıcı istemi, birleştirme, denetim, PR/CI, kayıt (`ilerleme.md`, eksik kaydı kimlikleri) | Özellik kodu yazmaz (birleştirme çakışması ve tek satırlık bağlama hariç) |
| Uygulayıcı | Opus/Sonnet alt ajan, kendi worktree'si | Kendi dosyalarında kod + test + eksik kaydı satır önerisi | Alt ajan açmaz, push/PR yapmaz, başka uygulayıcının dosyasına dokunmaz |
| Nihai kapı | Codex `-s read-only`, tek koşum | O5'te F0 hükmü → `docs/reviews/WEB-0-codex.md` | — |

## Oturum haritası

| Oturum | Dosya | İçerik | Uygulayıcılar | Paralellik |
|---|---|---|---|---|
| O1 | (bu PR) | Yol haritası, eksik kaydı, tasarım kopyası, yürütme seti | — | koordinatör |
| O2 | [oturum-2-temel.md](oturum-2-temel.md) | Token geçişi, `shared/ui` çekirdeği, kapsam + standing + capability, yazma protokolü, kapılar + design-stub + rota kataloğu | W11–W15 | 5 paralel |
| O3 | [oturum-3-kabuk.md](oturum-3-kabuk.md) | Kenar menüsü + Kenar-Secici, üst çubuk + tema, açık durumlar, etkili işlem onayı diyaloğu | W21–W22 | 2 paralel |
| O4 | [oturum-4-gantt-pilot.md](oturum-4-gantt-pilot.md) | Gantt kütüphane pilotu (ayrı çıkış ölçütü) | W31 | O3 ile paralel olabilir |
| O5 | [oturum-5-kapanis.md](oturum-5-kapanis.md) | Eksik raporu, Codex kapısı, yönetim deposu satırı | — | sıralı |

Ox ancak O(x-1)'in PR'ları `main`'e birleşip CI yeşilken açılır (O4 hariç: yalnız O2'ye bağlı). Yarım kalan oturum aynı dosyayla yeniden açılır, [ilerleme.md](ilerleme.md)'den devam edilir.

## Kullanım

1. Yeni Claude Code oturumu, çalışma dizini `NewTeknofestApp/`.
2. Oturum dosyasındaki **Açılış istemi** bloğunu yapıştır.
3. Koordinatör her uygulayıcı isteminin başına [ortak-sozlesme.md](ortak-sozlesme.md) içeriğini **aynen** ekler.

## Dal ve worktree adları

Dal `web0/<oturum>-<wid>` (ör. `web0/o2-w11`), worktree `nizam.io--frontend-wt-<wid>`. Commit mesajı `WEB-0 <W-ID>: …`. Push ve PR yalnız koordinatör.
