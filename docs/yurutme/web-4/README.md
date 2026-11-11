# WEB-4 yürütme seti — Faz 4 (toplantılar)

**F4 geçişi ürün sahibince 2026-11-11 bu oturumda onaylandı.** O1 yeterlilik ve sınırlar: [o1-backend-yeterlilik.md](o1-backend-yeterlilik.md).

Gereksinim: [`../../architecture/yol-haritasi-web.md`](../../architecture/yol-haritasi-web.md) (K1–K15; §4 F4 satırı: "Liste, detay, gündem, notlar, nottan görev, silinenler; video (W7) ayrı"; §6 KR-26). **Ekran tespiti:** [`../../ekranlar/09-toplantilar/`](../../ekranlar/09-toplantilar/) — uygulama kararı tablosu **dolu (E-09-01…84)**, F4-S1…S10 **ürün sahibi kararı (2026-11-10, P21–P30)**: video şeridi/Canlı-Bekliyor/09d-09e gizli, sağlayıcı adı yok, tasarımdaki özel kişi seçici, "Kişiler" davet modu kurulur, düzenle = oluşturma alanları, dosya yok, tarih metni düzeltilir, not 5000, liste tarih süzgeci bağlanır, yetki kaynağı meetings README; tek sözleşme [`../../ekranlar/ortak-kurallar.md`](../../ekranlar/ortak-kurallar.md) (§12 P1–P31; toplantı kararları P21–P30). Başka ekranlardaki F4 satırları: 01 ana sayfa "yaklaşan toplantılar" (BE-009 notu, F4 kapsamı dışı; kabul tablosu satırı yok), 10 sohbetten toplantı (F7). Backend durumu: [`../../backend-eksikleri/rapor-F3.md`](../../backend-eksikleri/rapor-F3.md) §4 (F4 yeni uç beklemeden açılabilir; Paket 4.1 + BELGE önce). Bu klasör F4'ü **kim, hangi oturumda, hangi sırayla** uygular sorusunu cevaplar; gereksinim ve tespit burada tekrar yazılmaz. Kalıp [`../web-3/`](../web-3/) ile aynıdır.

**Ön koşul (O2a açılmadan):** (1) **ürün sahibinin F4 uyarısı/onayı** (2026-11-11 verildi); (2) WEB-3 kapandı — O1–O3 (#65–#73) `main`'de, `docs/yurutme/web-3/dogrulama-F3.md` ve `docs/reviews/WEB-3-codex.md` Codex kapısı **KOŞULLU UYGUN** (tur 2, HEAD `768f22b`, F3 KAPANDI 2026-11-10); koşullar pin aşamasına devredildi, F4 borçları (Ö-07, K-04, E-03C-27/41) F4 içinde izlenir; (3) **F4-S1…S10 ürün sahibince cevaplandı (2026-11-10)** — `../../ekranlar/ortak-kurallar.md` §12 P21–P30; 09 tablosu güncellendi (S3 tasarımdaki özel kişi seçici, S4 "Kişiler" daveti kurulur, S9 liste tarih süzgeci bağlanır); (4) **F4 ön koşulu: pin aşaması kapanmış olmalı — KARŞILANDI (PİN AŞAMASI KAPANDI 2026-11-10, Codex tur 2 KOŞULLU UYGUN, HEAD `1bd80b6`; `../../reviews/WEB-P-codex.md`, kayıt `ilerleme.md` "Pin aşaması"; F4'e devredilenler orada).** Pin aşamasının ilk işi (yapıldı: WP0 #78) Codex F3 devri: Ö-03 (ARIA `aria-rowindex`/sıra), Ö-04 (sürükleme ön okumasında kapsam değişimi → sıfır PATCH/bildirim/ek geçersizleme), Ö-08 (ortak `useProtectedMutation` başarı bekleyişinde sahip yarışı, `reachesOwner`); kabul ölçütleri `../../reviews/WEB-3-codex.md` tur 2.** Backend `v0.13.0-api`, `v0.14.0-api`, `v0.15.0-api` yayımlandı (F0/F1/F2 paketleri: BE-003/038/001/036, BE-041…045/011/012/049/050, BE-052/051/053/019/056/107); ürün sahibi kararı (2026-11-10): F3 `v0.11.0-api` ile kapanır, pin yükseltmesi F3 kapandıktan sonra **F4'ten önce ayrı aşama** olarak yapılır (F0–F3 modüllerine dokunur, kendi Codex kapısı; web adımları `../../backend-eksikleri/rapor-F3.md` §2). Backend notları: kesilme `X-Result-Truncated` başlığından (tam 200'de başlık yok); uzatma tekrarında `replayed:true` ve `dates_revision` ilk sonucun sürümü; aktarım kimliği `fields[field=account_id]` eşleşmesinin `message` değerinden. Pin aşaması kapandıktan sonra `api-pin.json` yeniden okunur; Paket 4.1 (BE-021) / BELGE (BE-036 madde 7) yayımlandıysa **09 kabul tablosunun "Şimdilik" yolları pin aşamasından sonra yeniden okunur** ve canlı alanla güncellenir.

## Roller

Web-3 ile aynı ([`../web-3/README.md`](../web-3/README.md) "Roller"): koordinatör yalnız plan, istem, birleştirme ve kayıt yapar — kod yazmaz, iskelet commit'i de atmaz (K15); paylaşılan bileşen iskeleti O2a uygulayıcısının (W101) işidir; birleştirme çakışması dışında dosyaya dokunmaz; uygulayıcı kendi worktree'sinde kod + test; nihai kapı Codex `-s read-only` tek koşum → `docs/reviews/WEB-4-codex.md`.

## Oturum haritası

| Oturum | Dosya | İçerik | Uygulayıcılar | Paralellik |
|---|---|---|---|---|
| O1 | — | F4 kabul tablosu (09) — **WEB-3 O4'te geçici kabul olarak dolduruldu**; ürün sahibi F4-S1…S10'u cevaplarsa `kabul`/`ret` | — | — |
| O2 | [oturum-2-toplantilar.md](oturum-2-toplantilar.md) | Toplantılar veri katmanı + `capabilities.ts` (meetings README yetkisi) + rota kataloğu F4 geçişi; liste; detay çerçevesi + gündem; notlar + nottan görev; katılımcılar + koordinatörlükler + bilgi kartı; pencereler (yeni toplantı, düzenle, silme, silinenler) | W101 (O2a) → W102–W106 (O2b) | O2a tek; O2b 5 paralel (dal zinciri) |
| O3 | [oturum-3-entegrasyon.md](oturum-3-entegrasyon.md) | Entegrasyon turu (**zorunlu**): gerçek bileşenlerle liste ↔ detay ↔ pencereler ↔ 03 görev; üç rol (ŞY, K, Ü) × görünürlük; kapsam/oturum değişimi; yazma güvenliği (anahtarsız uçlar) | W107 | O2b birleştikten sonra, tek |
| O4 | [oturum-4-kapanis.md](oturum-4-kapanis.md) | `rapor-F4.md`, kabul kanıtları, doğrulama (gerçek imaj tanığı), Codex kapısı, kayıt, F5 hazırlığı | — | sıralı |

Ox ancak O(x-1)'in PR'ları `main`'e birleşip CI yeşilken açılır. O2b, O2a (W101) birleşmeden açılmaz. **O3 her fazda zorunludur** (web-1 W48, web-2 W82, web-3 W97 dersi: web-3 entegrasyon turu 4 hata buldu — bayat rozet, 390 px örtme, bağlanmamış 03d bileşenleri, çift kaynak alan). Yarım kalan oturum aynı dosyayla yeniden açılır, [ilerleme.md](ilerleme.md)'den devam edilir.

### W listesi

| W | Oturum | İş (tek satır) |
|---|---|---|
| W101 | O2a | `src/modules/meetings` veri katmanı: `listMeetings` (sonsuz imleç, bütün sayfaları yükleme yardımcısı), `getMeeting`, `listMeetingNotes`, `listDeletedMeetings`, yazma sarmalayıcıları (toplantı, gündem, not, katılımcı, nottan görev; anahtarsız uçlarda kör tekrar yok, `addMeetingNote` `Idempotency-Key`), `capabilities.ts` (K1, tablo testi), zaman bölme/gün gruplama modeli, rota `/toplantilar` + `/toplantilar/:meetingId` + menü + `CURRENT_PHASE` F4, O2b bileşen iskeleti, `trMeetings` i18n ağacı |
| W102 | O2b | Liste sayfası: başlık + alt başlık, zaman sekmeleri + sayaçlar, koordinatörlük süzgeci, gün grupları, satır (tarih kutusu, kodlar, K70 `summary` sayaçları), kural notu, boş/yükleniyor/hata |
| W103 | O2b | Detay çerçevesi (başlık, kicker, kodlar, "Üyeler dahil", Düzenle/Diğer işlemler tetikleyicileri) ve Gündem kartı (işaretle, ekle, düzenle/sil) |
| W104 | O2b | Notlar kartı (yaz, süzgeç, düzenle/sil, "daha fazla") ve nottan görev penceresi (E-09-74…80) |
| W105 | O2b | Katılımcılar kartı (K72 ekip verisi, ekle, çıkar, kısmi başarı uyarısı), Koordinatörlükler kartı, Bilgi kartı |
| W106 | O2b | Pencereler: yeni toplantı, düzenle (+ koordinatörlük kümesi), silme onayı, Silinenler sekmesi/kartı (geri yükle, kalıcı sil) |
| W107 | O3 | F4 entegrasyon turu (gerçek person rolleri, URL/filtre ve özel seçici dahil, kapsam/oturum değişimi) |

## Kullanım

1. **F4 onayı verildi** (2026-11-11); O1 yeterlilik sonucunu ve açık sınırları oku.
2. Yeni Claude Code oturumu, çalışma dizini `NewTeknofestApp/`.
3. Oturum dosyasındaki **Açılış istemi** bloğunu yapıştır.
4. Koordinatör her uygulayıcı isteminin başına [ortak-sozlesme.md](ortak-sozlesme.md) içeriğini **aynen** ekler, altına oturum dosyasındaki W bloğunu ve o W'nin kabul tablosu satırlarını (yalnız `kabul` / `geçici kabul`) yazar. İstem dosyası depo dışında: `<repo>/.git/worktrees/<wt>/W-PROMPT.md`.

## Dal ve worktree adları

Dal `web4/<oturum>-<wid>` (ör. `web4/o2-w102`), worktree `nizam.io--frontend-wt-<wid>`. Commit mesajı `WEB-4 <W-ID>: …`. Push ve PR yalnız koordinatör. O2b'de paylaşılan dosya çakışması beklenirse dallar zincirle uyarlanır (her dal bir öncekinin üzerine merge; [ortak-sozlesme.md](ortak-sozlesme.md) KESİN 25).
