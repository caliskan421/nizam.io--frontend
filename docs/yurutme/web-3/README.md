# WEB-3 yürütme seti — Faz 3 (zaman çizelgesi)

**F3 ürün sahibinin uyarısı/onayı olmadan AÇILMAZ (2026-11-09 talimatı).** Bu klasör yalnız belge hazırlığıdır; koordinatör ürün sahibinden açık "F3'e geç" uyarısı/onayı almadan O2a'yı (W91) başlatmaz, işçi istemi yazmaz, dal açmaz.

Gereksinim: [`../../architecture/yol-haritasi-web.md`](../../architecture/yol-haritasi-web.md) (K1–K15, K4 Gantt; §4 F3 satırı: "Gantt üç yüz, tarih talepleri, uzatma, bağımlılıklar"; 03c, 03d). **Ekran tespiti:** [`../../ekranlar/03c-zaman-cizelgesi/`](../../ekranlar/03c-zaman-cizelgesi/) — uygulama kararı tablosu **dolu, durum `kabul`** (Codex §6 #11–#12 ürün sahibince 2026-11-10'da varsayılanlarla onaylandı → P18–P19; P8 bağlayıcı; yalnız "geçici kabul (koordinatör)" satırları P3 yorumu olarak kalır); tek sözleşme [`../../ekranlar/ortak-kurallar.md`](../../ekranlar/ortak-kurallar.md) (§12 P1–P19 bağlayıcı; **P8 Gantt sürükleme**). Kütüphane kararı: [`../../architecture/gantt-secimi.md`](../../architecture/gantt-secimi.md) — **kendi SVG Gantt** (yedek SVAR). Başka ekranlardaki F3 satırları: 03 E-03-05 (görünüm segmenti), E-03-14 (Talepleri incele — öneri), E-03-54/E-03-63 (tarih talebi), 08 E-08-86 (Zaman çizelgesinde gör) — 03c README "Başka ekranlardaki F3 satırları" paragrafı. Backend durumu: [`../../backend-eksikleri/rapor-F2.md`](../../backend-eksikleri/rapor-F2.md) §2 (F3 yeni uç beklemeden açılabilir; Paket 0.4 ve 3.1 önce). Bu klasör F3'ü **kim, hangi oturumda, hangi sırayla** uygular sorusunu cevaplar; gereksinim ve tespit burada tekrar yazılmaz. Kalıp [`../web-2/`](../web-2/) ile aynıdır.

**Ön koşul (O2a açılmadan):** (1) **ürün sahibinin F3 uyarısı/onayı** — **karşılandı, 2026-11-10**; (2) WEB-2 kapandı — O4 (W82a #59, W82b #60, W82c #61) `main`'de, CI yeşil, `docs/reviews/WEB-2-codex.md` hükmü UYGUN ya da koşulları kapatılmış; (3) **Codex §6 #11–#12 ürün sahibine soruldu** — **karşılandı, 2026-11-10**: varsayılanlarla aynen onaylandı (P18–P19), 03c tablosu güncel; (4) **durum 2026-11-10: backend pini hâlâ `v0.11.0-api`, BE paketleri yayımlanmadı → tablodaki "Şimdilik" yolları geçerli**; backend Paket 0.4 (BE-052/051/053/019) ve 3.1 (BE-056) durumu okunur — pin yükseldiyse tablo "Şimdilik" yolları yerine canlı alanlarla güncellenir.

## Roller

Web-2 ile aynı ([`../web-2/README.md`](../web-2/README.md) "Roller"): koordinatör yalnız plan, istem, birleştirme ve kayıt yapar — kod yazmaz, iskelet commit'i de atmaz (K15); paylaşılan bileşen iskeleti O2a uygulayıcısının (W91) işidir; birleştirme çakışması dışında dosyaya dokunmaz; uygulayıcı kendi worktree'sinde kod + test; nihai kapı Codex `-s read-only` tek koşum → `docs/reviews/WEB-3-codex.md`.

## Oturum haritası

| Oturum | Dosya | İçerik | Uygulayıcılar | Paralellik |
|---|---|---|---|---|
| O1 | — | F3 kabul tablosu (03c) — **WEB-2 O5'te geçici kabul olarak dolduruldu**; ürün sahibi #11–#12'yi 2026-11-10'da onayladı → `kabul` (P18–P19) | — | — |
| O2 | [oturum-2-zaman-cizelgesi.md](oturum-2-zaman-cizelgesi.md) | Zaman çizelgesi veri katmanı + `capabilities.ts` (P8) + rota kataloğu F3 geçişi; kendi SVG Gantt çekirdeği; sayfa çerçevesi; seçili görev paneli ve tarih talebi; sürükleme + gecikmeli gönderim; 03d alt görev | W91 (O2a) → W92–W96 (O2b) | O2a tek; O2b 5 paralel (dal zinciri) |
| O3 | [oturum-3-entegrasyon.md](oturum-3-entegrasyon.md) | Entegrasyon turu (**zorunlu**): gerçek bileşenlerle Gantt ↔ panel ↔ sürükleme ↔ 03 liste; dört kişilik yetki × üç yüz; kapsam/oturum değişimi | W97 | O2b birleştikten sonra, tek |
| O4 | [oturum-4-kapanis.md](oturum-4-kapanis.md) | `rapor-F3.md`, kabul kanıtları, doğrulama (gerçek imaj tanığı), Codex kapısı, kayıt, F4 hazırlığı | — | sıralı |

Ox ancak O(x-1)'in PR'ları `main`'e birleşip CI yeşilken açılır. O2b, O2a (W91) birleşmeden açılmaz. **O3 her fazda zorunludur** (web-1 W48, web-2 W82 dersi: paralel işçiler komşu bileşeni taslakla test etti; W82a gerçek bileşenlerle üç odak/ARIA hatası buldu). Yarım kalan oturum aynı dosyayla yeniden açılır, [ilerleme.md](ilerleme.md)'den devam edilir.

### W listesi

| W | Oturum | İş (tek satır) |
|---|---|---|
| W91 | O2a | Zaman çizelgesi modülü veri katmanı: üç yüz Gantt sorgusu, tarih/bağımlılık/talep yazma sarmalayıcıları, tarih talebi okumaları, `capabilities.ts` (P8 tablo testi), rota `/zaman-cizelgesi` + `CURRENT_PHASE` F3, O2b bileşen iskeleti |
| W92 | O2b | Kendi SVG Gantt çekirdeği: saf hesap katmanı (`timeline.ts`, `rows.ts`, `links.ts`), `GanttView`/`GanttAxis`/`GanttRows`/`GanttBars`/`GanttLinks`, `treegrid` + klavye gezinme, tutamaç çizimi |
| W93 | O2b | Sayfa çerçevesi: başlık + sayaçlar, görünüm segmenti (03 E-03-05 dahil), araç çubuğu (süzgeç, ölçek, dışa aktarım, tam ekran), görev aralığı şeridi, açıklama, tavan uyarısı, boş/yükleniyor/hata; 08 E-08-86 bağlantısı |
| W94 | O2b | Seçili görev paneli: taze okuma, tarih girdileri, Koordinatör "Tarih talebi gönder" / Admin "Kaydet" + "Onayla/Reddet", bağımlılık menüsü, talep uzantısı; 03 E-03-54/E-03-63 aynı formla |
| W95 | O2b | Sürükleme + klavyeyle tarih değişimi (P8 politika), 5 sn gecikmeli gönderim ve geri alınabilir bildirim |
| W96 | O2b | 03d alt görev: "Kapalı" varsayılan, tek satırda isteğe bağlı `listWorkItemSubtasks`; statik/kurulmayan 03d parçaları |
| W97 | O3 | F3 entegrasyon turu (gerçek bileşenler, dört kişilik yetki × üç yüz, kapsam/oturum değişimi, derin bağlantılar) |

## Kullanım

1. **Önce ürün sahibinin F3 uyarısı/onayı** (yukarıdaki kalın not). Onay yoksa dur.
2. Yeni Claude Code oturumu, çalışma dizini `NewTeknofestApp/`.
3. Oturum dosyasındaki **Açılış istemi** bloğunu yapıştır.
4. Koordinatör her uygulayıcı isteminin başına [ortak-sozlesme.md](ortak-sozlesme.md) içeriğini **aynen** ekler, altına oturum dosyasındaki W bloğunu ve o W'nin kabul tablosu satırlarını (yalnız `kabul` / `geçici kabul`) yazar. İstem dosyası depo dışında: `<repo>/.git/worktrees/<wt>/W-PROMPT.md` (web-2 scratchpad dersi).

## Dal ve worktree adları

Dal `web3/<oturum>-<wid>` (ör. `web3/o2-w92`), worktree `nizam.io--frontend-wt-<wid>`. Commit mesajı `WEB-3 <W-ID>: …`. Push ve PR yalnız koordinatör. O2b'de paylaşılan dosya çakışması beklenirse dallar zincirle uyarlanır (her dal bir öncekinin üzerine merge; [ortak-sozlesme.md](ortak-sozlesme.md) KESİN 25).
