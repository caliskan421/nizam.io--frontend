# WEB-1 yürütme seti — Faz 1 (görevler + sade ana sayfa)

Gereksinim: [`../../architecture/yol-haritasi-web.md`](../../architecture/yol-haritasi-web.md) (K1–K15, §4 F1). **Ekran tespitleri:** [`../../ekranlar/03-gorevler-liste/`](../../ekranlar/03-gorevler-liste/) ve [`../../ekranlar/01-ana-sayfa/`](../../ekranlar/01-ana-sayfa/) — uygulama kararı tabloları **dolu, durum `kabul`** (WEB-0 O5 adım 1b); tek sözleşme [`../../ekranlar/ortak-kurallar.md`](../../ekranlar/ortak-kurallar.md) (§12 P1–P11 bağlayıcı). Backend durumu: [`../../backend-eksikleri/rapor-F0.md`](../../backend-eksikleri/rapor-F0.md) (F1 hiçbir yeni uç beklemez; öncelik sırası orada). Bu klasör F1'i **kim, hangi oturumda, hangi sırayla** uygular sorusunu cevaplar; gereksinim ve tespit burada tekrar yazılmaz. Kalıp [`../web-0/`](../web-0/) ile aynıdır.

**Durum (2026-11-09, Codex K-01):** O1–O4 tamamlandı ve `main`'de — W41–W47 #32–#41, W51 #39, W48 entegrasyon turu #42 `e34a22c`, W61 temizlik #43 `67d31b4`. O5: kapanış belgeleri, görsel doğrulama (main `67d31b4`) ve Codex tur 1 (**UYGUN DEĞİL**, E-01…E-04) yapıldı; düzeltme turu W63 #44 `a3ffe64`, W62 #45 `45957f9`; sonraki düzeltme turları W64 #46, W65 #47, W66 #48, W67 #49; Codex kapısı altı koşum, **son hüküm KOŞULLU UYGUN** (tur 6). **F1 kapandı.** Backend devri artık [`../../backend-eksikleri/rapor-F1.md`](../../backend-eksikleri/rapor-F1.md). Güncel durum ve kanıt: [ilerleme.md](ilerleme.md), hüküm: [`../../reviews/WEB-1-codex.md`](../../reviews/WEB-1-codex.md). Bu dosyanın geri kalanı planın kendisidir (tarihsel).

**Ön koşul (O2 açılmadan):** WEB-0 kapandı — #25 (W22) ve #26 (W31 karar belgesi) `main`'de, CI yeşil, `docs/reviews/WEB-0-codex.md` hükmü UYGUN ya da koşulları kapatılmış.

## Roller

Web-0 ile aynı ([`../web-0/README.md`](../web-0/README.md) "Roller"): koordinatör yalnız plan, istem, birleştirme ve kayıt yapar — kod yazmaz, imza/iskelet commit'i de atmaz (K15, Codex CX-M-06 / CX-F0-Ö-06); paylaşılan bileşen iskeleti bir uygulayıcının (W41) işidir; birleştirme çakışması dışında dosyaya dokunmaz; uygulayıcı kendi worktree'sinde kod + test; nihai kapı Codex `-s read-only` tek koşum → `docs/reviews/WEB-1-codex.md`.

## Oturum haritası

| Oturum | Dosya | İçerik | Uygulayıcılar | Paralellik |
|---|---|---|---|---|
| O1 | — | F1 kabul tabloları (03, 01) — **WEB-0 O5'te tamamlandı** | — | — |
| O2 | [oturum-2-gorevler.md](oturum-2-gorevler.md) | `modules/work` veri katmanı; görev listesi, ayrıntı paneli, alt görevler, yeni görev/durum/silme, dosyalar, notlar | W41 (O2a) → W42–W47 (O2b) | O2a tek; O2b 6 paralel |
| O3 | [oturum-3-ana-sayfa.md](oturum-3-ana-sayfa.md) | Sade ana sayfa (01 F1 satırları) | W51 | tek |
| O4 | [oturum-4-temizlik.md](oturum-4-temizlik.md) | F0'dan devreden temizlik: yazı tipleri, ölçek dışı px → `web-tokens.json`, `tr/ui.ts`, CI metni | W61 | O3 ile paralel olabilir |
| O5 | [oturum-5-kapanis.md](oturum-5-kapanis.md) | `rapor-F1.md`, doğrulama, Codex kapısı, kayıt, F2 hazırlığı | — | sıralı |

Ox ancak O(x-1)'in PR'ları `main`'e birleşip CI yeşilken açılır (O4 hariç: yalnız O2'ye bağlı). O2b, O2a (W41) birleşmeden açılmaz. Yarım kalan oturum aynı dosyayla yeniden açılır, [ilerleme.md](ilerleme.md)'den devam edilir.

### W listesi

| W | Oturum | İş (tek satır) |
|---|---|---|
| W41 | O2a | `modules/work` api + sorgu + mutasyon composable'ları, capability tablosu, rota kataloğu F1 geçişi, alan alan çakışma diyaloğu |
| W42 | O2b | Görev listesi sayfası: tablo, durum sekmeleri, arama/süzgeç/sıralama, "daha fazla yükle", talep bandı |
| W43 | O2b | Ayrıntı paneli: üst bilgi, Özet sekmesi, sekme kabı, ilerleme çizgisi, kopyala/hatırlat/tarih talebi düğmeleri |
| W44 | O2b | Alt görev bloğu (satır içi + panel sekmesi): ekle, tamamla, kişi/tarih/başlık, sil |
| W45 | O2b | Yeni görev formu, durum geçiş menüsü, görev silme (K5'in ilk tam tüketicisi) |
| W46 | O2b | Dosyalar: yükleme (multipart, etiket seçici), liste, indirme bileti, ad değiştir, sil |
| W47 | O2b | Notlar sekmesi: liste, yaz, kendi notunu düzenle/sil |
| W51 | O3 | Sade ana sayfa: selamlama, KPI şeridi, hızlı işlemler, nötr "Son işlemler" |
| W61 | O4 | Yazı tipleri, `metrics.css`/`side-metrics.css` → `design/web-tokens.json`, `ui.*` → `tr/ui.ts`, `ci.yml` hata metni (+ CSS katman sırası düzeltmesi) |
| W48 | O2 (entegrasyon turu) | Gerçek bileşenlerle olay zinciri; 5 entegrasyon kusuru düzeltildi (#42) |
| W62 | O5 (düzeltme) | Codex E-02/E-03/Ö-03: `use-confirm` kapsam/nesil bağı, bileşik yazmada `submit(…, { context })`, `/layers.css` önbellek (#45) |
| W63 | O5 (düzeltme) | Codex E-01/Ö-01/Ö-02 kısmen/K-04 + görsel doğrulama kusurları (#44) |

## Kullanım

1. Yeni Claude Code oturumu, çalışma dizini `NewTeknofestApp/`.
2. Oturum dosyasındaki **Açılış istemi** bloğunu yapıştır.
3. Koordinatör her uygulayıcı isteminin başına [ortak-sozlesme.md](ortak-sozlesme.md) içeriğini **aynen** ekler, altına oturum dosyasındaki W bloğunu ve o W'nin kabul tablosu satırlarını (yalnız `kabul`) yazar.

## Dal ve worktree adları

Dal `web1/<oturum>-<wid>` (ör. `web1/o2-w42`), worktree `nizam.io--frontend-wt-<wid>`. Commit mesajı `WEB-1 <W-ID>: …`. Push ve PR yalnız koordinatör.
