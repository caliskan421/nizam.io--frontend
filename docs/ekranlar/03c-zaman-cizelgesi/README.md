# 03c · Görevler › Zaman çizelgesi

**Codex kapısı:** KOŞULLU UYGUN (2026-11-08) — grup bulguları `dogrulama.md` Kapanış bölümünde; ortak kurallar `../ortak-kurallar.md`.

**Artboard'lar:** `Gorevler-Zaman.dc.html` (`03c · Görevler › Zaman çizelgesi`), `Gorevler-AltGorev.dc.html` (`03d · Görevler › Alt görevler ve zaman çizelgesi`)
**Faz:** F3 · **v1:** ✓ · **Yol haritası bağı:** K4 (Gantt üç yüz, 200 tavanı, F0 kütüphane pilotu), K5 (tarih yazma protokolü), K10 (rota), K13 (statik eksik), §4 F3 satırı, §6 ADR-0024 (alt görev Gantt dışı)
**Rota (önerilen, K10):** `/zaman-cizelgesi` — tipli parametreler (**Varsayım:** bu adlarla (doğrulanacak: K10 `routes.catalog.ts`)): `durum` (`tumu|acik|geciken|biten`), `departman` (kimlik listesi), `olcek` (`gun|hafta|ay`), `secili` (görev kimliği), `altgorev` (`kapali|tumu`). Görev listesiyle (`/gorevler`) aynı başlık bloğunu paylaşır; "Liste / Zaman çizelgesi" segmenti iki rota arasında geçiştir.

## Özet
Programın görevlerini zaman ekseninde çubuk olarak gösteren Gantt ekranı: üstte görevler başlığı ve sayaçlar, süzgeç/ölçek/dışa aktarım araç çubuğu, sezonun tamamını gösteren yoğunluk şeridi ve açıklama satırı; altında koordinatörlüğe göre gruplanmış, açılıp kapanan satırlar, durum renkli çubuklar, gecikme/geç bitiş taşmaları, bağımlılık simgesi ve bugün çizgisi. Bir çubuk seçilince sağ altta tarih düzenleme paneli açılır (tarih talebi gönder, atanana hatırlat); çubuk uçları sürüklenerek tarih değiştirilir ve geri alınabilir bildirim çıkar. 03d, alt görevlerin çubuk içinde ilerleme çizgisi ve bitiş işaretiyle, istenince girintili ince satırlar olarak gösterilmesini tanımlar (ADR-0024 nedeniyle statik, BE-020). Tasarım tek bir yüz çizer (koordinatör izlenimli); K4'e göre yüz kapsamdan türetilir — Admin `adminGantt`, Koordinatör `coordinatorGantt`, Üye `memberGantt`, birleşik rolde koordinatör — ve görünür bir yüz seçici yoktur. Ana veri kaynağı seçili yüzün Gantt ucudur (ilk 200 kalem; tam 200'de "sınıra ulaşmış olabilir" uyarısı, BE-019).

## Dosyalar
| Dosya | Durum | Son güncelleme | Üreten |
|---|---|---|---|
| ozellikler.md | denetlendi | 2026-11-08 | tasarım analisti |
| mekanizma.md | denetlendi | 2026-11-08 | tasarım analisti |
| backend.md | denetlendi | 2026-11-08 | backend analisti |
| eksikler.md | denetlendi | 2026-11-08 | backend analisti |
| dogrulama.md | denetlendi | 2026-11-08 | denetçi (Sonnet) |

## Uygulama kararı tablosu (CX-M-07)

Karar tarihi 2026-11-09 (WEB-2 O5 adım 2). Kaynaklar: `../ortak-kurallar.md` §1–§7, §9, §10, §12 (**P8 bağlayıcı**: koordinatör sürüklemesi talep, admin doğrudan, üye sürükleyemez, "İptal et" = gönderim öncesi 5 sn gecikme); `../../architecture/gantt-secimi.md` (**kendi SVG Gantt** — karar 2026-11-08; `model/timeline.ts`, `rows.ts`, `links.ts`, `GanttView`/`GanttAxis`/`GanttRows`/`GanttBars`/`GanttLinks`, `useEdgeDrag`, `useGanttKeyboard`); `backend.md` §1–§3; `eksikler.md`; `../../backend-eksikleri/kayit.md`, `../../backend-eksikleri/rapor-F2.md` §2; `../../reviews/EKRANLAR-codex.md` §6 #11–#12. Uygulayıcılar: `../../yurutme/web-3/` (W91–W97). Kısaltmalar: A/K/Ü = Admin (`adminGantt`) / Koordinatör (`coordinatorGantt`) / Üye (`memberGantt`) yüzü — yüz kapsamdan türetilir, görünür yüz seçici yok (K4); birleşik rolde koordinatör.

**Durum: geçici kabul — ürün onayı bekliyor.** Codex §6 #11 (Gantt sürükleme, geri alma, rol yüzleri) ve #12 (oklar, sezon şeridi, dışa aktarım) **ürün sahibine henüz sorulmadı**. #11'in sürükleme kısmı P8 ile zaten bağlayıcıdır (`kabul — P8`); #11'in kalanı ve #12, Codex'in önerdiği varsayılanlarla **geçici kabul**dür: #11 — mevcut yetkisi olan doğrudan tarih düzenler, ayrı düğme talep açar, üye düzenlemez; gönderilmiş zincir değişikliğine otomatik "geri al" yok · #12 — yalnız görünür uçlar arasında gerçek oklar; izinli bağımlılık eylemleri; şerit "görev aralığı" etiketiyle (sezon değil); dışa aktarım pilotla doğrulanır, hazır değilse devre dışı. "**geçici kabul (koordinatör)**" satırları tasarımın çizmediği ya da çeliştiği (ozellikler §7) noktalarda en dar P3 yorumudur. Uygulayıcı `geçici kabul` satırlarını `kabul` gibi kodlar; ürün sahibi farklı cevaplarsa tablo F3 O2a'dan (W91) önce güncellenir. **F3, ürün sahibinin uyarısı/onayı olmadan açılmaz** (2026-11-09 talimatı; `../../yurutme/web-3/README.md`).

| E-kimliği | Faz | Davranış (canlı / statik / gizli / devre dışı) | Kabul edilmiş varsayım (öneri / kabul / ret — ortak-kurallar §2) | BE bağı | Bağımlılık | Kabul kanıtı |
|---|---|---|---|---|---|---|
| E-03C-01 Kırıntı | F3 | canlı — "‹program› / Görevler / Zaman çizelgesi"; "Görevler" → `/gorevler` | kabul — §5, §6 (program adı `['programs']`'tan, `readProgram` yok, CX-T-02) | — | W91 katalog, W93 | ek `readProgram` yok (msw) |
| E-03C-02 Başlık + sayaçlar | F3 | canlı — "N görev · N bitti · N gecikmede" yüklü Gantt yanıtından; tam 200'de "en az"/"yüklenen kayıtlar içinde" etiketi; liste (03) alt satırı ayrı kalır | kabul — §10, K4 (200 tavanı); kabul — gecikme = `lateness.is_overdue` (istemcide, `overdue=true` parametresi kullanılmaz — eksikler §3) | BE-019, BE-036 (1) | W93 | 200 kalemde yaklaşık etiket testi; tamamlanmış geç görev "gecikmede" sayılmaz |
| E-03C-03 Görünüm segmenti | F3 | canlı — "Liste" ↔ "Zaman çizelgesi" iki rota arası geçiş; 03 E-03-05 "Zaman çizelgesi" F3'te canlı olur (aynı bileşen) | kabul — §5 (F3); **geçici kabul (koordinatör)** — geçişte kapsam korunur, süzgeç taşınmaz (03 E-03-05 öneri satırı F3'te kabul) | — | W12 `UiSegmented`, W93 | iki yönlü gezinme + `aria-pressed` testi |
| E-03C-04 Yeni görev | F3 | canlı — work `NewTaskDialog` (`work/public.ts`); görünürlük `canCreateWorkItem`; üye yüzünde gizli | kabul — P1, P3 (03 formu) | — | W45, W93 | Gantt sorgusu oluşturmadan sonra geçersizlenir testi |
| E-03C-05 Koordinatörlük süzgeci | F3 | Admin yüzünde canlı — **tek** departman seçimi (`listProgramDepartments`), sayı yok; Koordinatör/Üye yüzünde gizli (departman kenar menüsünden) | kabul — P4 (çoklu süzgeç yok, K3); ret — tasarımdaki çoklu seçim sayacı (BE-058 koşullu) | BE-058 | W93 | Admin: tek seçim; K/Ü: DOM'da yok |
| E-03C-06 Durum süzgeci | F3 | canlı — Tümü / Açık (tamamlanmamış hepsi) / Geciken (`lateness.is_overdue`) / Biten (`tamamlandi`); istemcide, sayaçsız; URL `durum` | **geçici kabul (koordinatör)** — "Açık" = `status ≠ tamamlandi` (ozellikler §7-8 varsayımı); kabul — `overdue=true` parametresi kullanılmaz (GAP-053) | BE-036 (1) | W91 katalog, W93 | dört değer süzme testi |
| E-03C-07 Ölçek etiketi | F3 | canlı — "Gün ölçeği" / "Hafta ölçeği" / "Ay ölçeği"; URL `olcek` | kabul — `gantt-secimi.md` §7 (gün 21 px / hafta / ay) | — | W92, W93 | üç ölçek etiketi testi |
| E-03C-08 Uzaklaştır | F3 | canlı — en geniş ölçekte (ay) devre dışı | kabul — ozellikler varsayımı | — | W93 | sınırda `aria-disabled` |
| E-03C-09 Yakınlaştır | F3 | canlı — en dar ölçekte (gün) devre dışı | kabul — ozellikler varsayımı | — | W93 | sınırda `aria-disabled` |
| E-03C-10 PDF olarak dışa aktar | F3 | istemcide SVG katmanından üretim pilotla doğrulanırsa canlı; hazır değilse devre dışı "yakında" (stub yok — sunucu çıktısı istenmedikçe BE-057 bağlanmaz) | **geçici kabul (Codex §6 #12)** — dışa aktarım pilotla doğrulanır, hazır değilse devre dışı; `gantt-secimi.md` §7 (kütüphanesiz, SVG'den) | BE-057 (koşullu) | W93 | üretim CSP'sinde ihlal 0; devre dışıysa tık istek/indirme yok |
| E-03C-11 Görsel olarak indir | F3 | E-03C-10 ile aynı | **geçici kabul (Codex §6 #12)** | BE-057 (koşullu) | W93 | aynı |
| E-03C-12 Tam ekran | F3 | canlı — Fullscreen API; çıkış Esc + düğme (`aria-pressed`) | **geçici kabul (koordinatör)** — çıkış hali çizilmemiş, P3 | — | W93 | giriş/çıkış testi |
| E-03C-13 Alt görev gösterimi (03d) | F3 | "Kapalı" canlı (varsayılan); "Tümünü aç" devre dışı (fan-out, K3); URL `altgorev` yalnız `kapali` | kabul — K3 (görev başına okuma fan-out), ADR-0024; ret — "Tümünü aç" (sunucu alanı yok) | BE-020, BE-051 | W96 | "Tümünü aç" tık istek atmaz |
| E-03C-14 Şerit kabı ve etiketi | F3 | canlı — etiket "görev aralığı ‹gün Ay› – ‹gün Ay›" (yüklü görevlerin en erken başlangıç – en geç bitişi); `Program.year` varsa ayrıca yıl; "sezon" denmez | kabul (eksikler yeni-4) + **geçici kabul (Codex §6 #12)** — görev aralığına doğru etiket | — (yeni-4 ürün kararı, kayıt yok) | W93 | "sezon" sözcüğü yok testi; `aria-label` aralık |
| E-03C-15 Yoğunluk histogramı | F3 | canlı — haftalık görev sayısı yüklü yanıttan; tam 200'de yaklaşık | kabul — §10, K4 | BE-019 | W93 | hafta sayımı birim testi |
| E-03C-16 Görünen aralık çerçevesi | F3 | canlı — Gantt kaydırma konumunu yansıtır; tıklayınca o konuma kaydırır; sürükleme yok | **geçici kabul (koordinatör)** — sürüklenebilirlik çizilmemiş (§7-5), P3 en dar | — | W93 | kaydırma ↔ çerçeve eşleme testi |
| E-03C-17 Bugün işareti (şerit) | F3 | canlı — kurulum saat dilimiyle bugün | kabul — rapor-F1 §3 madde 4 (gün sınırı kurulum saat dilimi) | BE-036 (1) | W93 | sahte saat testi |
| E-03C-18 "Baktığın yer" işareti | F3 | canlı — kaydırma konumu | kabul | — | W93 | kaydırma testi |
| E-03C-19 03c açıklaması | F3 | canlı — beş durum + "Geç bitti" + "Tarih talebi"; renkler çubuk paletiyle (`--gp-*`) eşlenir | kabul — P5 (beş durum, `iade_edildi` = "Geri gönderildi"); **geçici kabul (koordinatör)** — açıklama ↔ çubuk renk farkı (§7-10) çubuk paletine eşlenir, tuvale geri bildirim | — | W93 | renk token eşleme testi; ham renk yok |
| E-03C-20 03d açıklaması | F3 | gizli (03d satırları statik/tek satır; açıklama yalnız E-03C-33 açıkken anlamlı) | **geçici kabul (koordinatör)** — ADR-0024, BE-020 | BE-020 | W96 | DOM'da yok |
| E-03C-21 Sol sütun başlığı | F3 | canlı (sabit "görev") | — | — | W92 | görsel |
| E-03C-22 Yalnız kodları göster | F3 | gizli — görev kodu yok (BE-005); kod sütunu kurulmadığından düğme anlamsız | kabul — §4 (sahte kod yok) | BE-005 | W92 | DOM'da yok |
| E-03C-23 Ay satırı | F3 | canlı | kabul — `gantt-secimi.md` §7 `GanttAxis` | — | W92 | ay genişliği = gün oranı testi |
| E-03C-24 Hafta satırı | F3 | canlı — pazartesi gün numarası; bugünün haftası vurgulu | kabul | — | W92 | hafta başı birim testi |
| E-03C-25 Gün ölçeği başlığı | F3 | canlı (gün ölçeğinde) | kabul | — | W92 | hafta sonu gölgesi testi |
| E-03C-26 Izgara çizgileri | F3 | canlı | — | — | W92 | görsel |
| E-03C-27 Bugün çizgisi ve etiketi | F3 | canlı — 03c biçimi ("bugün"); 03d biçimi kullanılmaz | **geçici kabul (koordinatör)** — iki artboard farkında 03c esas (§7-14) | — | W92 | sahte saat konum testi |
| E-03C-28 Grup başlığı | F3 | canlı — koordinatörlük adı `listProgramDepartments` ⋈ `department_id` (bütün yüzlerde ad çözümü, CX-T-03); "bitti / toplam" yüklü yanıttan; aç/kapa `aria-expanded`, klavye →/← | kabul — CX-T-03 (eksikler yeni-3: yeni BE yok); kabul — `gantt-secimi.md` §7 `treegrid` | — | W92 | aç/kapa klavye testi; ad çözümü ek uç yok |
| E-03C-29 Grup izi | F3 | canlı — özet çubuk (grup aralığı + bitti oranı + gecikme varsa işaret) | **geçici kabul (koordinatör)** — ozellikler §7-3 "hesaplanıp çizilmeyen" varsayımı | — | W92 | grup aralığı birim testi |
| E-03C-30 Görev kodu | F3 | Admin yüzünde `ProgramDepartment.code` + statik sıra "‹KOD›-—" (`designStub('BE-005')`); kodsuz birimde ve K/Ü'de sütun boş | kabul — 03 E-03-41 kalıbı, CX-T-03 | BE-005 | W92 | stub lint; kodsuz birimde boş |
| E-03C-31 Durum noktası | F3 | canlı — durum rengi; gecikme/geç bitişte yarım `--danger`; `title` + ekran okuyucu metni (renk tek başına taşımaz) | kabul — P5; **geçici kabul (koordinatör)** — durum metni `aria` ile (§7-21) | — | W92 | 5 durum + gecikme `aria-label` testi |
| E-03C-32 Görev başlığı | F3 | canlı — tıklama satırı seçer, seçili görev panelini açar (URL `secili`) | **geçici kabul (koordinatör)** — hedef panel (§7-16); tam ayrıntı E-03C-56 ile 03'te | — | W92, W94 | seçim → URL `secili` testi |
| E-03C-33 Alt görev aç/kapa (03d) | F3 | canlı yalnız **tek** satırda isteğe bağlı — açılınca o görev için `listWorkItemSubtasks` (tek kayıt, fan-out değil); sayaç "b/t" açılınca; Gantt'ta sayaç yok | kabul — eksikler §3 (tek satır isteğe bağlı okuma); kabul — K3 ("Tümünü aç" yok) | BE-020, BE-051 | W96 | açılışta tek istek; kapalı satırda istek yok |
| E-03C-34 Satır alt yazısı (03d) | F3 | gizli — 03c tek satır biçimi esas | **geçici kabul (koordinatör)** — §7-12 03c biçimi | — | W92 | DOM'da yok |
| E-03C-35 Satır arka planı | F3 | canlı — hover + seçili | — | — | W92 | görsel |
| E-03C-36 Görev çubuğu | F3 | canlı — `start_on` → planlanan bitiş (`planned_end_on`, boşsa `end_on`); durum dolgusu `--gp-*`; SVG katmanı | kabul — K4, `gantt-secimi.md` §7 `timeline.ts` | — | W92 | geometri birim testleri (boş `planned_end_on`) |
| E-03C-37 Bağımlılık simgesi / okları | F3 | oklar canlı — **yalnız görünür iki uç arasında** (`links[]`); simge görevin `target` olduğu bağda; koordinatör yüzünde birim dışı bağ çizilmez; üye yüzünde oklar gösterilir, ekleme/kaldırma yok; bağımlılık ekle/kaldır Admin + Koordinatör (seçili görev panelindeki menüden, P3) | **geçici kabul (Codex §6 #12)** — yalnız görünür uçlar arasında gerçek oklar, izinli bağımlılık eylemleri; kabul — WORK-K36 | BE-059 (koşullu) | W92 (`links.ts`), W94 (eylemler) | görünmeyen uca ok yok testi; üye yüzünde eylem yok |
| E-03C-38 Çubuk metni | F3 | canlı — 03c: görev başlığı | kabul — §7-12 03c biçimi | — | W92 | kesilme testi |
| E-03C-39 Süre | F3 | canlı — ölçeğe göre birim (gün "g" / hafta "hf" / ay "ay") | **geçici kabul (koordinatör)** — gün/ay birimi çizilmemiş, P3 | — | W92 | üç ölçek birim testi |
| E-03C-40 Taşma bölümü ve ayırıcı | F3 | canlı — gecikmede uç = bugün; geç bitişte uç = `completed_on` | kabul — backend.md §1 | BE-036 (1) | W92 | iki durum geometri testi |
| E-03C-41 Gecikme işareti | F3 | canlı — 03c biçimi (kesik `--danger` kenar); 03d biçimi kullanılmaz | **geçici kabul (koordinatör)** — §7-7 03c esas | — | W92 | gecikmede kenar sınıfı |
| E-03C-42 Tarih talebi uzantısı | F3 | **yalnız seçili görevde** `getWorkItem.pending_date_request`'ten kesik uzantı; diğer satırlarda yok; görünürlük: Admin her görev, Koordinatör kendi biriminde, Üye hiç | kabul — P5 (okuma göstergesi canlı), §6 "kim görür"; kabul — K3 (ek talep listesiyle birleştirme yok) | BE-052 | W94 | seçili görevde uzantı, diğerinde yok; üyede hiç yok |
| E-03C-43 Kırpılmış çubuk (03d) | F3 | canlı — görünen aralıktan önce başlayan çubukta düz sol köşe | kabul | — | W92 | geometri testi |
| E-03C-44 Alt görev ilerleme çizgisi (03d) | F3 | yalnız açılmış tek satırda (E-03C-33 okumasından); kapalı satırlarda yok | kabul — eksikler §3; ADR-0024 | BE-051, BE-020 | W96 | kapalı satırda çizgi yok |
| E-03C-45 Tarihli alt görev bitiş işareti (03d) | F3 | statik — çizilmez (Gantt'ta tarihli alt görev yok); açılmış satırda alt görev tarihi metin olarak (E-03C-52) | kabul — ADR-0024; §4 (sahte elmas yok) | BE-020 | W96 | DOM'da elmas yok |
| E-03C-46 Alt görev sayaç çipi (03d) | F3 | yalnız açılmış tek satırda | kabul — eksikler §3 | BE-051 | W96 | kapalı satırda çip yok |
| E-03C-47 Seçim halkası ve sürükleme tutamaçları | F3 | canlı — seçili satırda; **Koordinatör** tutamaçla bırakınca `requestDateChange` (talep; "değişiklik onaya gider"); **Admin** `extendWorkItem` (yalnız bitiş ileri 1–90 gün) ya da `updateWorkItem` (`expected_dates_revision`, önce `getWorkItem`); **Üye** tutamaçsız; klavye Shift/Alt+Shift+→/←; bırakmadan sonra 5 sn gecikmeli gönderim | **kabul — P8** (bağlayıcı); kabul — K5 (kör tekrar yok, sonuç bilinmiyorsa Gantt + `getWorkItem` yeniden okunur); kabul — `gantt-secimi.md` §7 `useEdgeDrag`/`useGanttKeyboard` | BE-053, BE-056 | W91 (`capabilities.ts` P8), W95 | yüz × eylem tablo testi; üyede tutamaç yok; gecikme içinde iptal → istek 0; sahte saat |
| E-03C-48 Ağaç çizgisi (03d) | F3 | yalnız açılmış tek satırda | kabul | — | W96 | görsel |
| E-03C-49 Alt görev durum dairesi (03d) | F3 | yalnız açılmış tek satırda; salt okuma | kabul | — | W96 | `aria-label` testi |
| E-03C-50 Alt görev başlığı (03d) | F3 | yalnız açılmış tek satırda | kabul | — | W96 | biten üstü çizili |
| E-03C-51 İnce alt görev çubuğu (03d) | F3 | statik — çizilmez (ADR-0024) | kabul — ADR-0024, §4 | BE-020 | W96 | DOM'da yok |
| E-03C-52 Alt görev tarih yazısı (03d) | F3 | canlı metin — `listWorkItemSubtasks` `start_on`/`end_on` varsa | kabul — eksikler §3 | — | W96 | tarihli/tarihsiz testi |
| E-03C-53 Tarihsiz alt görev (03d) | F3 | canlı metin "Tarih yok" ("ana görev süresince" yazılmaz) | **geçici kabul (koordinatör)** — §7-19 çelişkisinde sözleşmeye uy | BE-020 | W96 | metin testi |
| E-03C-54 Panel üst satırı | F3 | canlı — "‹KOD›-— · ‹koordinatörlük›" (kod E-03C-30 kuralı) | kabul — CX-T-03 | BE-005 | W94 | render |
| E-03C-55 Panel başlığı | F3 | canlı | — | — | W94 | iki satır kesme |
| E-03C-56 Liste görünümünde aç | F3 | canlı → `/gorevler?secili=‹id›` (03 ayrıntı paneli) | kabul — ozellikler varsayımı, 03 E-03-19 | — | W42 rota, W94 | bağlantı parametresi testi |
| E-03C-57 Kapat | F3 | canlı — ✕ + Esc; odak çubuğa döner | kabul — P3; ozellikler varsayımı (Esc) | — | W94 | odak dönüşü testi |
| E-03C-58 Başlangıç girdisi | F3 | canlı — Admin düzenler (Kaydet → `updateWorkItem`, `expected_dates_revision`); Koordinatör düzenler (Tarih talebi gönder → `requestDateChange`); Üye salt okuma; panel açılışında taze `getWorkItem` | **kabul — P8**; **geçici kabul (Codex §6 #11)** — mevcut yetkisi olan doğrudan, ayrı düğme talep açar, üye düzenlemez | BE-053 | W94 | yüz × düzenlenebilirlik testi |
| E-03C-59 Bitiş girdisi | F3 | E-03C-58 ile aynı; gecikmede kenar `--danger` | **kabul — P8**; **geçici kabul (Codex §6 #11)** | BE-053 | W94 | aynı |
| E-03C-60 Durum | F3 | canlı | kabul — P5 | — | W94 | 5 değer |
| E-03C-61 Gecikme | F3 | canlı — gecikmede "N gün"; gecikmiyorsa satır çizilmez | kabul — §4 (boş satır üretilmez) | BE-036 (1) | W94 | gecikmesiz satır yok testi |
| E-03C-62 Kanıt dosyası | F3 | canlı — `listWorkItemFiles` `files.length` (anahtar `scoped(['work-items', id, 'files'])`, 03 ile aynı); 403'te "—" | kabul — §6 (03/03c/06 aynı anahtar) | — | W94 | 403 → "—" testi; ek anahtar yok |
| E-03C-63 Yardım metni | F3 | yüze göre — Koordinatör "…Değişiklik onaya gider."; Admin "…Değişiklik hemen uygulanır."; Üye gizli | **kabul — P8** (metin koordinatörde kalır); **geçici kabul (koordinatör)** — admin metni | — | W94 | üç yüz metin testi |
| E-03C-64 Tarih talebi gönder | F3 | Koordinatör yüzünde canlı (`requestDateChange`; `pending_date_request` doluysa gizli); Admin yüzünde yerine "Kaydet" (doğrudan) + bekleyen talep varsa "Onayla" / "Reddet" (`reviewDateChangeRequest`); Üye gizli. 03 E-03-54/E-03-63 aynı form bileşeniyle F3'te canlı | **kabul — P8, P5** (tarih talebi yazmaları F3'te canlı); **geçici kabul (Codex §6 #11)** — admin paneli doğrudan kaydet + onay/red (tasarımda yok, P3); kabul — K5 kör tekrar yok | BE-056, BE-054 | W94 | talep gönder → `['date-requests']` + Gantt + görev geçersizlenir; çift gönderim yok (düğme kilitli); 409 `work.date_request_pending_exists` iletisi (talep zaten var, panel yeniden okunur) |
| E-03C-65 Atanana hatırlat | F3 | devre dışı — `designStub('BE-008')` | kabul — 03 E-03-53 kalıbı (BE-008 açık) | BE-008 | W94 | stub lint |
| E-03C-66 Diğer işlemler | F3 | canlı menü — "Bağımlılık ekle" / "Bağımlılığı kaldır" (Admin + Koordinatör), "Liste görünümünde aç"; üyede gizli | **geçici kabul (koordinatör)** — içerik çizilmemiş (P3); **geçici kabul (Codex §6 #12)** izinli bağımlılık eylemleri | — | W94 | üyede menü yok; ekle → Gantt yeniden okunur |
| E-03C-67 Bildirim simgesi | F3 | canlı (gecikmeli gönderim bildirimi) | kabul — P8 | — | W95 | görsel |
| E-03C-68 Bildirim başlığı | F3 | yüze göre — Admin "‹KOD› süresi N gün uzatıldı" / "tarihleri değişti"; Koordinatör "‹KOD› için tarih talebi gönderiliyor" | **kabul — P8**; **geçici kabul (koordinatör)** — metinler (§7-1) | BE-005 | W95 | iki yüz metin testi |
| E-03C-69 Tarih değişimi satırı | F3 | canlı — eski → yeni aralık + "bitiş ±N gün" | kabul | — | W95 | fark hesabı birim testi |
| E-03C-70 İptal et | F3 | canlı — **gönderim öncesi 5 sn gecikme** içinde iptal (istek gitmez); gönderildikten sonra geri alma **yok** (talep geri çekme ve zincir geri alma uçsuz) | **kabul — P8**; **geçici kabul (Codex §6 #11)** — gönderilmiş zincire otomatik geri al yok | BE-054, BE-055 (koşullu) | W95 | süre içinde iptal → istek 0; süre sonunda tek istek (sahte saat) |
| E-03C-71 Bildirimi kapat | F3 | canlı — kapatma gönderimi **iptal etmez** (gönderim sürer) | **geçici kabul (koordinatör)** — kapat ≠ iptal | — | W95 | kapat → istek 1 testi |
| E-03C-72 Geri sayım çubuğu | F3 | canlı — 5 sn; `prefers-reduced-motion`'da animasyonsuz | kabul — P8 | — | W95 | azaltılmış hareket testi |
| E-03C-73 Kapalı çubuk ipucu (03d) | F3 | gizli — kapalı satırda alt görev verisi yok (fan-out) | kabul — K3 | BE-020, BE-051 | W96 | DOM'da yok |
| E-03C-74 Kart başlığı ve ilerleme (03d) | F3 | kurulmaz — alt görev kartı 03 ayrıntı panelinde (W44); 03c'de "Liste görünümünde aç" (E-03C-56) | **geçici kabul (koordinatör)** — tek alt görev yüzeyi 03 | — | W44 | — |
| E-03C-75 Alt görev satırı (03d kart) | F3 | kurulmaz (E-03C-74) | aynı | — | W44 | — |
| E-03C-76 Kişi hapı (03d kart) | F3 | kurulmaz (E-03C-74) | aynı | — | W44 | — |
| E-03C-77 Tarih hapı "Gantt'ta" (03d kart) | F3 | kurulmaz — Gantt'ta alt görev çubuğu yok | kabul — ADR-0024, §4 | BE-020 | — | — |
| E-03C-78 Tarih ekle (03d kart) | F3 | kurulmaz (E-03C-74; 03 E-03-34 tarih seçici) | aynı | — | W44 | — |
| E-03C-79 Kanıt zorunlu (03d kart) | F3 | kurulmaz (E-03C-74) | kabul — P5 (yeni zorunluluk bayrağı yok) | BE-006 | — | — |
| E-03C-80 Alt görev ekle (03d kart) | F3 | kurulmaz (E-03C-74) | aynı | — | W44 | — |
| E-03C-81 Kart alt metni (03d kart) | F3 | kurulmaz (E-03C-74) | aynı | BE-020 | — | — |
| E-03C-82 Tavan uyarısı | F3 | canlı — yanıt tam 200 kalemse araç çubuğu ile tablo arasında "Liste sınıra ulaşmış olabilir; süzgeçle daraltın" (`t-*` uyarı) | kabul — K4, §10 | BE-019 | W93 | 199/200 kalem testi |
| E-03C-83 Boş / yükleniyor / hata | F3 | canlı — iskelet satırlar; bölge içi "Yeniden dene"; boş → `rp-empty`; departman katılmamış → K7 durumu | kabul — K7, mekanizma §6 | — | W93 | üç durum testi |

**Başka ekranlardaki F3 satırları (bu tabloya bağlı):** 03 E-03-05 "Zaman çizelgesi" segmenti F3'te canlı (E-03C-03); 03 E-03-54 "Tarih değişikliği iste" ve E-03-63 talep formu F3'te canlı — E-03C-64 ile aynı form bileşeni, koordinatörde, `pending_date_request` doluysa gizli (P5, P8); 03 E-03-14 "Talepleri incele" (yalnız yönetici) — **öneri:** hedef `/zaman-cizelgesi` + bekleyen talepli görev seçimi; hedef tasarımda yok, F3 O1'de ürün onayıyla kesinleşir (o zamana dek devre dışı kalır); 08 E-08-86 "Zaman çizelgesinde gör" F3'te canlı → `/zaman-cizelgesi?departman=‹id›` (Admin yüzü tek departman süzgeci, E-03C-05). Bu satırların "Kabul kanıtı" sütunları kendi README'lerinde F3 kapanışında güncellenir.

**Satır dışı varsayımlar:**

| Varsayım | Karar | Kaynak |
|---|---|---|
| Yüz kapsamdan türetilir: Admin merceği → `adminGantt` (S2), Koordinatör → `coordinatorGantt` (S3), Üye → `memberGantt` (S3); birleşik rolde koordinatör; görünür yüz seçici yok; şirket yöneticisi Koordinatör merceğinde **yetkisini korur** (P1) — sürükleme politikası yüzden değil `capabilities.ts`'ten (yetki olgusu) | kabul — K4, P1, P8 | backend.md §1, §3 |
| Sürükleme / tarih yazma politikası `modules/<zaman çizelgesi>/model/capabilities.ts`'te tablo testiyle (yüz × rol × `company_admin`): Koordinatör `requestDateChange`; Admin `extendWorkItem` (bitiş ileri 1–90 gün) / `updateWorkItem` (`expected_dates_revision`, önce `getWorkItem` — BE-053); Üye yok | kabul — P8 (sözleşme koordinatöre doğrudan izin verir; ürün tercihi) | ortak-kurallar §12 P8, `gantt-secimi.md` §7 |
| Tarih uçlarında `Idempotency-Key` yok (BE-056): sonuç bilinmiyorsa kör tekrar yok; Gantt + `getWorkItem` + `['date-requests']` yeniden okunur; düğme istek sürerken kilitli | kabul — K5, §7 | eksikler yeni-7 |
| Tarih uçlarında 409 `organization.confirmation_required` yok; bağımlı kayma `cascade_count` / `affected_tasks_count` ile **sonradan** bildirilir, onay diyaloğu açılmaz | kabul — §7 | backend.md §2 notu, eksikler §4 |
| Sorgu anahtarları: `scoped(['gantt', face])`, `scoped(['date-requests', filters])`, görev/dosya anahtarları 03 ile ortak (§6); tarih ve bağımlılık uçları Gantt + görev listesini geçersizler; pano (`report.dashboard`) work yazmalarıyla geçersizlenmez (§6 ayrımı) | kabul — §6 | ortak-kurallar §6 |
| 200 tavanı: imleç ve kesilme sinyali yok → tam 200'de uyarı, sayaçlar ve histogram "yüklenen kayıtlar içinde" | kabul — K4, §10 | BE-019 |
| Seçili görev paneli açılışında taze `getWorkItem` (+ dosya sayısı `listWorkItemFiles`); panel ile Gantt satırı arasında fan-out yok (yalnız kullanıcının seçtiği tek kayıt, §9) | kabul — K3, §9 | eksikler §3 |
| Sürükleme gecikmesi (5 sn) içinde kapsam değişir, oturum kapanır ya da sayfa sökülürse bekleyen gönderim **iptal edilir** (istek gitmez); gönderim başladıysa sonuç Ö-07 politikasıyla (`../ortak-kurallar.md` §7) yalnız canlı sahibe bildirilir | **geçici kabul (koordinatör)** — K2, §7 Ö-07/Ö-08 | WEB-2 W82b (15)–(16) |
| Erişilebilirlik: `treegrid`, dolaşan `tabindex`, klavye (↑↓ PageUp/Down Home/End, →← aç/kapa, Enter seç, Shift+→/← bitiş, Alt+Shift+→/← başlangıç), `aria-live` duyurusu; ekran okuyucu gerçek cihaz denemesi F3 kabul kanıtına eklenir | kabul — `gantt-secimi.md` §7, §8 | gantt-secimi.md |
| Kapsam (program/departman) değişince Gantt, seçili görev ve bekleyen gecikmeli gönderim düşer; ölçek ve durum süzgeci korunur | kabul (03 kalıbı) | K2, §6 |

Uygulayıcı yalnız `kabul` ve **geçici kabul** satırlarını kodlar; `öneri` kodlanmaz, `ret` uygulanmaz.

## Açık sorular (ürün sahibine)
- Çubuk sürükleme sonucu doğrudan değişiklik mi (`extendWorkItem`/`updateWorkItem`, bildirim "süresi uzatıldı · İptal et"), yoksa onaya giden tarih talebi mi (panel metni "Değişiklik onaya gider")? Tasarım ikisini birden gösteriyor; yüz başına (Admin / Koordinatör) hangisi? (ozellikler §7-1)
- "İptal et" (geri al) neyi geri alır? Koordinatörün açtığı tarih talebini silme yetkisi yok (`istemci-akislari.md` §4: inceleme/silme yalnız yönetici); uzatma ucu yalnız pozitif gün alır. Geri alma istemci tarafı gecikmeli gönderim mi olmalı? (ozellikler §7-2)
- Bağımlılık okları tasarımda çizilmemiş, yalnız çubukta "Bağımlılığı var" simgesi var. Oklar çizilecek mi (K4 pilotu ok yeteneğini şart koşuyor), bağımlılık ekleme/kaldırma Gantt'tan yapılacak mı? (ozellikler §7-4)
- Üye yüzü ve Admin yüzü tasarımda yok: üyede sürükleme/tarih paneli kapalı mı, admin panelinde "Tarih talebi gönder" yerine ne var (doğrudan kaydet, bekleyen talebi onayla/reddet)? (mekanizma §2)
- 03d'deki alt görev satırları/çubukları ve "ana görevin dışına taşmaz" kuralı ADR-0024 ile çelişir; v1'de statik gösterim mi, tamamen gizleme mi? (BE-020)
- "Atanana hatırlat", "PDF olarak dışa aktar", "Görsel olarak indir", sezon şeridi: v1'de etkin mi statik mi? (ozellikler §7)
