# O2 — Zaman çizelgesi (W91 → W92–W96)

**F3 ürün sahibinin uyarısı/onayı olmadan açılmaz (2026-11-09 talimatı).** Açılış istemi yalnız onaydan sonra yapıştırılır.

## Açılış istemi

```
WEB-3 O2 oturumunu koordinatör olarak yürüt.
Önce doğrula: ürün sahibi F3'e geçiş uyarısı/onayı verdi mi? Vermediyse DUR.
Oku: docs/yurutme/web-3/README.md → ortak-sozlesme.md → oturum-2-zaman-cizelgesi.md → ilerleme.md
→ docs/ekranlar/ortak-kurallar.md (tamamı, §12 — P8) → docs/ekranlar/03c-zaman-cizelgesi/ (README kabul tablosu → mekanizma → backend → eksikler → ozellikler)
→ docs/architecture/gantt-secimi.md (§1, §7, §8) → docs/ekranlar/03-gorevler-liste/README.md (E-03-05/14/54/63) → docs/backend-eksikleri/rapor-F2.md §2.
Giriş: WEB-2 kapalı (W82a/b/c main'de, WEB-2-codex hükmü), CI yeşil; 03c kabul tablosu ürün cevabıyla güncel (Codex §6 #11–#12 2026-11-10'da onaylandı → P18–P19; F3 açık).
O2a: W91'i başlat (bileşen iskeleti dahil); dönüşte kapı, PR, birleştir. Sonra O2b: W92–W96 paralel (paylaşılan dosyalar için ilk işçi kuralı ve dal zinciri, KESİN 23/25).
Kod yazma. Dönüşte kapıları worktree'de koş, YENİ-EKSİK'e BE kimliği ver ve kayit.md'ye işle, TASLAK satırlarını ilerleme.md'ye (W97 girdisi),
her W için ayrı PR, CI yeşilse birleştir (O2b sırası: W92 → W93 → W94 → W95 → W96). Ürün sahibine soru sorma. Kapanışta ilerleme.md.
```

**Modül adı (varsayım):** `src/modules/timeline/**` — `gantt-secimi.md` §7 "`modules/work` (ya da zaman çizelgesi modülü)" seçeneğinden ayrı modül; koordinatör açılışta değiştirebilir. Görev sorguları/formu yalnız `work/public.ts` üzerinden; 03 tarafındaki dosyalara dokunan W, istemde adı geçen tek dosyayla sınırlıdır.

**Bileşen iskeleti (W91'in işi; O2b'den önce birleşir — koordinatör kod yazmaz, K15):** `src/modules/timeline/components/index.ts` — O2b bileşenlerinin adları ve prop/emit tipleri, boş gövdeli yer tutucularla: `GanttView`, `GanttAxis`, `GanttRows`, `GanttBars` (tutamaç çizer, `edge-drag` olayını yayar), `GanttLinks` (W92); `TimelineHead`, `TimelineToolbar`, `RangeStrip`, `TimelineLegend` (W93); `SelectedTaskPanel`, `DateRequestForm` (03 E-03-54/63 de kullanır; `work/public.ts`'e dışa açımı W94 isteminde) (W94); `DateChangeSnack` (W95); `SubtaskRows` (W96). İskelet sözleşme testi **bileşeni bağlamaz**, derlenmiş `props`/`emits` bildirimlerini denetler; rota testi yer tutucu sayfa beklemez (KESİN 22). Her W yalnız kendi bileşeninin gövdesini doldurur; `index.ts`'e satır ekleyemez.

**Hepsi için ortak kabul kaynağı:** `docs/ekranlar/03c-zaman-cizelgesi/README.md` uygulama kararı tablosu — W bloğundaki E-kimliklerinin **`kabul` / `geçici kabul`** satırlarındaki "Kabul kanıtı" sütunu, o W'nin kabul ölçütüdür (burada tekrar yazılmaz). Satır dışı varsayımlar tablosu bütün O2b W'lerini bağlar. Tablonun "Bağımlılık" sütunundaki W adı satırın sahibidir.

## W91 — Zaman çizelgesi veri katmanı (O2a)

- **Sahip:** `src/modules/timeline/**` (yeni: `api/**`, `model/**` — `capabilities.ts` dahil, `routes.ts`, `public.ts`, `components/index.ts` iskeleti, i18n tek ağaç `trTimeline` kökü — KESİN 24), `src/app/routes.catalog.ts` (F3 rota satırı `/zaman-cizelgesi`, `CURRENT_PHASE` F2 → F3, `durum`/`departman`/`olcek`/`secili`/`altgorev` parametreleri), `src/app/router.ts` yalnız `timelineRoutes` kaydı, `src/shared/http/query-keys.ts` yalnız `gantt` ve `date-requests` anahtarları (`ortak-kurallar.md` §6 adlarıyla).
- **Tespit:** `03c-zaman-cizelgesi/backend.md` §1 (okuma), §2 (yazma), §3 (eylem görünürlüğü), §5 (anahtarlar), §6 (sözleşme notları); `eksikler.md` §3, §4; kabul tablosu **satır dışı varsayımlar** (yüz türetme, P8 politika, kör tekrar yok, onay diyaloğu yok, 200 tavanı, kapsam değişimi, gecikmeli gönderim iptali); `ortak-kurallar.md` §1, §6, §7 (Ö-07/Ö-08), §9, §10, §12 P1/P8; `gantt-secimi.md` §7 "Sürükleme politikası".
- **İş:** üç yüz Gantt sorgusu (`adminGantt` S2, `coordinatorGantt` S3, `memberGantt` S3; yüz kapsamdan türetilir, birleşik rolde koordinatör; `scoped(['gantt', face])`; `sessionBound` + `signal`, KESİN 26); ad çözümü `listProgramDepartments` (mevcut `scoped(['departments'])`); tek görev okumaları (`getWorkItem`, `listWorkItemFiles`, `listWorkItemSubtasks`, `listDependencies`) work `public.ts`'ten; tarih talebi okumaları (`listDateChangeRequests` S1, `myDateChangeRequests`) `scoped(['date-requests', filters])`; yazma sarmalayıcıları (`updateWorkItem` tarih alanları + `expected_dates_revision`, `extendWorkItem`, `requestDateChange`, `reviewDateChangeRequest`, `addDependency`, `removeDependency`) — anahtarsız uçlarda kör tekrar yok, sonuç bilinmiyorsa Gantt + görev + talep yeniden okunur; `capabilities.ts` (P8: yüz × rol × `company_admin` tablo testi; yetki olgusu mercekten bağımsız, P1); tavan tespiti (tam 200); iskelet.
- **Eksikler (BE):** BE-019, BE-052, BE-053, BE-056 (veri katmanında stub yok; "Şimdilik" yolları).
- **Kabul:** her uç için msw testi (kapsam S2/S3 doğru, görevin kendi kapsamı başlıklarda); P8 capability tablo testi (Koordinatör → talep, Admin → doğrudan, Üye → yok; Koordinatör merceğindeki yönetici yetkisini korur); sonuç bilinmiyor → tekrar yok + geçersizleme testi; kapsam/oturum değişiminde Gantt sorguları düşer (Ö-08); **"gövde dolunca iskelet/rota testi kırılır mı?" cevabı rapora** (KESİN 22).

## W92 — Kendi SVG Gantt çekirdeği (O2b)

- **Sahip:** `src/modules/timeline/model/{timeline,rows,links}.ts` (+ testleri), `src/modules/timeline/components/gantt/**` (`GanttView`, `GanttAxis`, `GanttRows`, `GanttBars`, `GanttLinks` gövdeleri), `src/modules/timeline/composables/useGanttKeyboard.ts` (gezinme kısmı).
- **Tespit:** 03c kabul tablosu E-03C-21…32, 34…41, 43 (E-03C-37'nin okuma kısmı; E-03C-33 W96'da); `mekanizma.md` çizim bölümleri; `ozellikler.md` §1 Gantt ölçüsü, §7-3/7/10/11/12/14/21; `gantt-secimi.md` §7 (dosya bölümü, `treegrid`, dolaşan `tabindex`, sanallaştırma), §8 (ekran okuyucu riski). Tasarım: `Gorevler-Zaman.dc.html`.
- **İş:** saf hesap (aralık, ölçek gün/hafta/ay, tarih↔x, plan + taşma geometrisi, `planned_end_on` boş = `end_on`, bugün; grup → görev düzlemi, satır ofsetleri; satır → ok dizini); çizim (ay/hafta/gün başlığı, ızgara, bugün çizgisi, grup başlığı + özet iz, kod/durum/başlık sütunu, çubuk + taşma + gecikme kenarı, kırpılmış çubuk, oklar yalnız görünür uçlar arasında); tutamaçları seçili satırda çizer ve `edge-drag` olayını yayar (politika W95'te); klavye gezinme (↑↓ PageUp/Down Home/End, →← aç/kapa, Enter seç).
- **Eksikler (BE):** BE-005 (kod sütunu), BE-019, BE-059 (koşullu).
- **Kabul:** E-03C-21…32, 34…41, 43 kabul kanıtları; geometri birim testleri; 250 görev + 60 bağda kaydırma (pilot ölçümüyle karşılaştırma, `gantt-secimi.md` §4); üretim CSP'sinde satır içi `style` yok (CSP ihlali 0); açık/koyu tema; ekran okuyucu gerçek cihaz denemesi rapora (yapılamadıysa gerekçe).

## W93 — Sayfa çerçevesi (O2b)

- **Sahip:** `src/modules/timeline/pages/TimelinePage.vue` (+ `pages/timeline/**`), `src/modules/timeline/components/frame/**` (`TimelineHead`, `TimelineToolbar`, `RangeStrip`, `TimelineLegend` gövdeleri); 03 tarafında **yalnız** görünüm segmentinin "Zaman çizelgesi" düğmesini canlı yapan tek dosya (yolu koordinatör istemde verir) ve 08 E-08-86 kısayol dosyası.
- **Tespit:** E-03C-01…19, 82, 83; 03 E-03-05; 08 E-08-86; `mekanizma.md` §1 (başlık bloğu, geçiş), §6 (durumlar); `eksikler.md` yeni-4 (görev aralığı); `ozellikler.md` §7-5/6/8/9/23/25. Tasarım: `Gorevler-Zaman.dc.html`.
- **İş:** kabul tablosundaki satırlar (kırıntı, başlık + yaklaşık sayaçlar, segment iki rota arası, Yeni görev — work `NewTaskDialog`, Admin tek departman süzgeci, durum süzgeci, ölçek ±, dışa aktarım pilotla ya da devre dışı, tam ekran, görev aralığı şeridi + histogram + çerçeve, açıklama, tavan uyarısı, boş/yükleniyor/hata, departman katılmamış K7).
- **Eksikler (BE):** BE-019, BE-036 (1), BE-057 (koşullu), BE-058 (koşullu).
- **Kabul:** E-03C-01…19, 82, 83 kabul kanıtları; 03 E-03-05 ve 08 E-08-86 kabul kanıtı satırları kendi README'lerinde F3 sütunuyla güncellenmeye hazır (O4); açık/koyu tema; 390/1024/1440 taşma 0.

## W94 — Seçili görev paneli ve tarih talebi (O2b; K5 tüketicisi)

- **Sahip:** `src/modules/timeline/components/panel/**` (`SelectedTaskPanel`, `DateRequestForm` gövdeleri); 03 tarafında **yalnız** E-03-54 düğmesini canlı yapıp `DateRequestForm`'u açan tek dosya (yolu koordinatör istemde verir; form `timeline/public.ts` üzerinden — modül sınırı).
- **Tespit:** E-03C-42, 54…66 (+ E-03C-37 eylemler); 03 E-03-54, E-03-63 (ve E-03-14 öneri — kodlanmaz, ürün onayıyla); `backend.md` §2 hata kodu sütunu (`work.date_request_pending_exists`, `work.date_request_already_reviewed`, `work.date_request_invalid`, `work.dependency_cycle`); `backend.md` §3; `ortak-kurallar.md` §7, §12 P5/P8.
- **İş:** panel (taze `getWorkItem` + dosya sayısı; talep uzantısı yalnız seçili görevde; Kapat + Esc + odak dönüşü — KESİN 27); Koordinatör "Tarih talebi gönder" (`requestDateChange`, gerekçe isteğe bağlı; bekleyen varsa gizli); Admin "Kaydet" (`updateWorkItem`, `expected_dates_revision`) + bekleyen talepte "Onayla/Reddet" (`reviewDateChangeRequest`); Üye salt okuma; "Diğer işlemler" bağımlılık ekle/kaldır (Admin + Koordinatör); Hatırlat `designStub('BE-008')`; aynı form 03 E-03-54/63'te.
- **Eksikler (BE):** BE-005, BE-008, BE-052, BE-053, BE-054 (koşullu), BE-056.
- **Kabul:** E-03C-42, 54…66 kabul kanıtları; anahtarsız uçta çift gönderim yok (düğme istek sürerken kilitli); `cascade_count`/`affected_tasks_count` sonradan bildirilir, onay diyaloğu yok; 03 E-03-54/63 gerçek formla testi; yüz × görünürlük testleri.

## W95 — Sürükleme, klavyeyle tarih değişimi, gecikmeli gönderim (O2b)

- **Sahip:** `src/modules/timeline/composables/useEdgeDrag.ts`, `src/modules/timeline/composables/useDelayedSend.ts` (ad varsayım), `useGanttKeyboard.ts`'in tarih değiştirme kısmı (W92 ile dal zinciri — KESİN 25), `src/modules/timeline/components/snack/**` (`DateChangeSnack` gövdesi).
- **Tespit:** E-03C-47, 67…72; `ortak-kurallar.md` §12 **P8** (bağlayıcı), §7 (Ö-07, eylem bağlamı); `gantt-secimi.md` §7 (`useEdgeDrag`, Shift/Alt+Shift+→/←, `aria-live`); `eksikler.md` yeni-5/6/7; Codex §6 #11 (geçici kabul: gönderilmiş zincire otomatik geri al yok).
- **İş:** işaretçi yakalama + güne yapışma + bırakma; P8 politika (`capabilities.ts`'ten): Koordinatör → `requestDateChange`, Admin → `extendWorkItem` (yalnız bitiş ileri 1–90) ya da `updateWorkItem` (önce `getWorkItem`), Üye → tutamaç yok; **5 sn gecikmeli gönderim** — "İptal et" süre içinde isteği hiç göndermez, ✕ gönderimi iptal etmez; gecikme sahip sökülmesi, kapsam ve oturum değişiminde iptal (KESİN 26); yüze göre bildirim metni; `prefers-reduced-motion`.
- **Eksikler (BE):** BE-053, BE-054 (koşullu), BE-055 (koşullu), BE-056.
- **Kabul:** E-03C-47, 67…72 kabul kanıtları; sahte saatle süre içinde iptal → istek 0, süre sonunda tek istek; kapsam değişimi / çıkış / söküm sırasında bekleyen gönderim → istek 0; klavyeyle tarih değişimi aynı yoldan; üyede tutamaç ve klavye tarih kısayolu yok.

## W96 — 03d alt görev (O2b)

- **Sahip:** `src/modules/timeline/components/subtasks/**` (`SubtaskRows` gövdesi).
- **Tespit:** E-03C-13, 20, 33, 44…53, 73 (E-03C-74…81 kurulmaz — tek alt görev yüzeyi 03 W44); `eksikler.md` §1 BE-020 bölünmesi, §3 "Alt görevler"; ADR-0024; `ozellikler.md` §7-12/19. Tasarım: `Gorevler-AltGorev.dc.html`.
- **İş:** "Kapalı" varsayılan, "Tümünü aç" devre dışı (K3); tek satırda isteğe bağlı `listWorkItemSubtasks` (work `public.ts`; anahtar 03 ile ortak) → ağaç çizgisi, durum dairesi, başlık, tarih metni, "Tarih yok", ilerleme çizgisi + sayaç çipi yalnız açılmış satırda; tarihli alt görev çubuğu/elması çizilmez (§4).
- **Eksikler (BE):** BE-020, BE-051.
- **Kabul:** E-03C-13, 20, 33, 44…53, 73 kabul kanıtları; açılışta tek istek, kapalı satırda istek 0 (msw); sahte elmas/çubuk yok.
