# WEB-2 yürütme seti — Faz 2 (kullanıcılar + koordinatörlükler + program yönetimi)

Gereksinim: [`../../architecture/yol-haritasi-web.md`](../../architecture/yol-haritasi-web.md) (K1–K15, §4 F2 satırı: "Kullanıcılar, kişisel takip, koordinatörlükler (düz), departman/üyelik/koordinatör, programlar ("Teknofest ve sezon"), katılım bağı, dönem aktarımı, sıfırlama"). **Ekran tespitleri:** [`../../ekranlar/05-kullanicilar/`](../../ekranlar/05-kullanicilar/) ve [`../../ekranlar/08-koordinatorlukler/`](../../ekranlar/08-koordinatorlukler/) — uygulama kararı tabloları **dolu, durum `geçici kabul`** (WEB-1 O5 adım 2; Codex §6 #13–#18 önerilen varsayılanları, ürün onayı bekliyor); tek sözleşme [`../../ekranlar/ortak-kurallar.md`](../../ekranlar/ortak-kurallar.md) (§12 P1–P11 bağlayıcı). Kabuk devirleri: [`../../ekranlar/00-ortak/README.md`](../../ekranlar/00-ortak/README.md) E-00-23/24/25 ve satır dışı tablo (W22). Backend durumu: [`../../backend-eksikleri/rapor-F1.md`](../../backend-eksikleri/rapor-F1.md) §2 (F2 hiçbir yeni uç beklemez; öncelik sırası orada). Bu klasör F2'yi **kim, hangi oturumda, hangi sırayla** uygular sorusunu cevaplar; gereksinim ve tespit burada tekrar yazılmaz. Kalıp [`../web-1/`](../web-1/) ile aynıdır.

**Ön koşul (O2a açılmadan):** WEB-1 kapandı — W48 (O2 entegrasyon turu) ve W61 (O4 temizlik) `main`'de, CI yeşil, `docs/reviews/WEB-1-codex.md` hükmü UYGUN ya da koşulları kapatılmış. **Ürün sahibi #13–#18'i farklı cevaplarsa** 05/08 kabul tabloları O2a'dan önce güncellenir; cevap gelmediyse geçici kabulle ilerlenir. WEB-1 O5 düzeltme turu (W63 #44, W62 #45) da `main`'de olmalı: W71 ve sonrası `use-confirm` kapsam/nesil bağına, bileşik yazmada `submit(…, { context })` altyapısına ve `work/public.ts` atanan yüklemine dayanır ([ortak-sozlesme.md](ortak-sozlesme.md) KESİN 17–21).

## Roller

Web-1 ile aynı ([`../web-1/README.md`](../web-1/README.md) "Roller"): koordinatör yalnız plan, istem, birleştirme ve kayıt yapar — kod yazmaz, iskelet commit'i de atmaz (K15, CX-F0-Ö-06); paylaşılan bileşen iskeleti O2a uygulayıcısının (W71) işidir; birleştirme çakışması dışında dosyaya dokunmaz; uygulayıcı kendi worktree'sinde kod + test; nihai kapı Codex `-s read-only` tek koşum → `docs/reviews/WEB-2-codex.md`.

## Oturum haritası

| Oturum | Dosya | İçerik | Uygulayıcılar | Paralellik |
|---|---|---|---|---|
| O1 | — | F2 kabul tabloları (05, 08) — **WEB-1 O5'te tamamlandı** (geçici kabul) | — | — |
| O2 | [oturum-2-organizasyon.md](oturum-2-organizasyon.md) | `modules/organization` veri katmanı + capabilities + rota kataloğu F2 geçişi; 08 liste, 08b detay, formlar; 05 liste + yan panel; 05b kişisel takip | W71 (O2a) → W72–W76 (O2b) | O2a tek; O2b 5 paralel |
| O3 | [oturum-3-program.md](oturum-3-program.md) | Program yönetimi ("Teknofest ve sezon"): program oluştur/düzenle, departman bağla, dönem aktarımı, sıfırlama | W81 | O2a'dan sonra; O2b ile paralel olabilir |
| O4 | [oturum-4-entegrasyon.md](oturum-4-entegrasyon.md) | Entegrasyon turu: gerçek bileşenlerle olay zinciri, kapsam değişimi, mercek × yetki, açık durumlar | W82 | O2b + O3 birleştikten sonra, tek |
| O5 | [oturum-5-kapanis.md](oturum-5-kapanis.md) | `rapor-F2.md`, doğrulama, Codex kapısı, kayıt, F3 hazırlığı | — | sıralı |

Ox ancak O(x-1)'in PR'ları `main`'e birleşip CI yeşilken açılır (O3 yalnız O2a'ya bağlı). O2b, O2a (W71) birleşmeden açılmaz. **O4 her fazda zorunludur** (web-1 W48 dersi: paralel işçiler komşu bileşeni taslakla test etti). Yarım kalan oturum aynı dosyayla yeniden açılır, [ilerleme.md](ilerleme.md)'den devam edilir.

### W listesi

| W | Oturum | İş (tek satır) |
|---|---|---|
| W71 | O2a | `modules/organization` api + sorgu + mutasyon composable'ları, `capabilities.ts` (Yönetim grubu kapısı dahil), rota kataloğu F2 geçişi, `NO_DEPARTMENT_EXEMPT_ROUTES`, O2b bileşen iskeleti |
| W72 | O2b | 08 Koordinatörlükler liste: yapı sağlığı şeridi, araç çubuğu, kart ızgarası, kart menüsü, boş durumlar |
| W73 | O2b | 08b Koordinatörlük detayı: başlık, sekmeler, KPI şeridi, Hakkında, Ekip, Üyeler sekmesi, Dikkat gerektirenler, Kısayollar |
| W74 | O2b | Organizasyon formları: yeni koordinatörlük (oluştur + bağla, K7), düzenle (ad / katalog), koordinatör ata, üye ekle (kişi seçici), kullanıcı oluştur + geçici parola |
| W75 | O2b | 05 Kullanıcılar: tablo, rol sekmeleri, arama, koordinatörlük süzgeci, "Daha fazla yükle", yan panel (çipler, roller, hesap eylemleri) |
| W76 | O2b | 05b Kişisel takip: başlık, özet kartları, sekmeler, gruplu görev tablosu, takvim, durum dağılımı |
| W81 | O3 | "Teknofest ve sezon": program listesi/oluştur/düzenle, departman bağla, dönem aktarımı (önizle → aktar), sıfırlama — P3 minimum |
| W82 | O4 | F2 entegrasyon turu (gerçek bileşenler, dört kişilik yetki, kapsam değişimi, derin bağlantılar) |

## Kullanım

1. Yeni Claude Code oturumu, çalışma dizini `NewTeknofestApp/`.
2. Oturum dosyasındaki **Açılış istemi** bloğunu yapıştır.
3. Koordinatör her uygulayıcı isteminin başına [ortak-sozlesme.md](ortak-sozlesme.md) içeriğini **aynen** ekler, altına oturum dosyasındaki W bloğunu ve o W'nin kabul tablosu satırlarını (yalnız `kabul` / `geçici kabul`) yazar.

## Dal ve worktree adları

Dal `web2/<oturum>-<wid>` (ör. `web2/o2-w72`), worktree `nizam.io--frontend-wt-<wid>`. Commit mesajı `WEB-2 <W-ID>: …`. Push ve PR yalnız koordinatör.
