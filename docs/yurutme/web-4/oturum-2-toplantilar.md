# O2 — Toplantılar (W101 → W102–W106)

**F4 geçişi 2026-11-11 onaylandı.** O1 raporunu uygulayıcıya aktar.

## Açılış istemi

```
WEB-4 O2 oturumunu koordinatör olarak yürüt.
Ürün sahibi F4 geçişini onayladı; O1 açık sınırlarını izle.
Oku: docs/yurutme/web-4/README.md → ortak-sozlesme.md → oturum-2-toplantilar.md → ilerleme.md
→ docs/ekranlar/ortak-kurallar.md (tamamı, §12) → docs/ekranlar/09-toplantilar/ (README kabul tablosu → mekanizma → backend → eksikler → ozellikler)
→ docs/backend-eksikleri/rapor-F3.md §4 → docs/yurutme/web-3/ilerleme.md (W97a hataları, dersler).
Giriş: WEB-3 kapalı (O1–O3 main'de, WEB-3-codex hükmü), CI yeşil; 09 kabul tablosu güncel (F4-S1…S10 cevaplandıysa tablo güncellenmiş).
O2a: W101'i başlat (bileşen iskeleti dahil); dönüşte kapı, PR, birleştir. Sonra O2b: W102–W106 paralel (paylaşılan dosyalar için ilk işçi kuralı ve dal zinciri, KESİN 23/25).
Kod yazma. Dönüşte kapıları worktree'de koş, YENİ-EKSİK'e BE kimliği ver ve kayit.md'ye işle, TASLAK satırlarını ilerleme.md'ye (W107 girdisi),
her W için ayrı PR, CI yeşilse birleştir (O2b sırası: W102 → W103 → W104 → W105 → W106). Ürün sahibine soru sorma. Kapanışta ilerleme.md.
```

**Modül adı (varsayım):** `src/modules/meetings/**`; görev sorguları ve nottan görev sonrası geçersizleme yalnız `work/public.ts` anahtarı üzerinden. 03 tarafındaki dosyalara dokunan W, istemde adı geçen tek dosyayla sınırlıdır.

**Bileşen iskeleti (W101'in işi; O2b'den önce birleşir — koordinatör kod yazmaz, K15):** `src/modules/meetings/components/index.ts` — O2b bileşenlerinin adları ve prop/emit tipleri, boş gövdeli yer tutucularla (adlar W101 raporuyla kesinleşir; **KESİN 28: bağlama noktaları — sayfa ↔ kart ↔ pencere — iskeletle adıyla tanımlanır**). İskelet sözleşme testi **bileşeni bağlamaz**, derlenmiş `props`/`emits` bildirimlerini denetler; rota testi yer tutucu sayfa beklemez (KESİN 22).

**Hepsi için ortak kabul kaynağı:** `docs/ekranlar/09-toplantilar/README.md` uygulama kararı tablosu — W bloğundaki E-kimliklerinin **`kabul` / `geçici kabul`** satırlarındaki "Kabul kanıtı" sütunu, o W'nin kabul ölçütüdür (burada tekrar yazılmaz). Satır dışı varsayımlar tablosu bütün O2b W'lerini bağlar. Tablonun "Bağımlılık" sütunundaki W adı satırın sahibidir. Video (09d/09e, konferans şeridi, Canlı/Bekliyor) **kurulmaz** (F4-S1).

## W101 — Toplantılar veri katmanı (O2a)

- **Sahip:** `src/modules/meetings/**` (yeni: `api/**`, `model/**` — `capabilities.ts` dahil, `routes.ts`, `public.ts`, `components/index.ts` iskeleti, i18n tek ağaç `trMeetings` kökü — KESİN 24), `src/app/routes.catalog.ts` (F4 rota satırları `/toplantilar`, `/toplantilar/:meetingId`; `zaman`, `koordinatorluk`, `from`, `to`, `notlar` parametreleri; `CURRENT_PHASE` F3 → F4), `src/app/router.ts` yalnız `meetingsRoutes` kaydı, `src/shared/http/query-keys.ts` yalnız `meetings` anahtarları (`09/backend.md` §5 adlarıyla; ilişki listesi KESİN 29).
- **Tespit:** `09/backend.md` §1 (okuma), §2 (yazma), §3 (eylem görünürlüğü), §4 (türetilenler), §5 (anahtarlar), §6 (sözleşme notları); `eksikler.md` §3, §4, §6; kabul tablosu **satır dışı varsayımlar**; `ortak-kurallar.md` §1, §6, §7 (Ö-07/Ö-08), §9, §10, §12 P1; web-3 `timeline/api`, `capabilities.ts` kalıbı.
- **İş:** `listMeetings` `department_id`/`from`/`to` filtreleri sorgu anahtarında ve her imleç isteğinde; filtre değişince imleç sıfırlanır; sonsuz imleç + "bütün sayfaları yükle" yardımcısı (200'lük, sürerken "n+"); `getMeeting` (ilk not sayfası detaydan tohumlanır), `listMeetingNotes`, `listDeletedMeetings` (S2, `sessionBound` + `signal`, KESİN 26); yazma sarmalayıcıları (`createMeeting`, `updateMeeting`, `deleteMeeting`, `restoreMeeting`, `permanentDeleteMeeting`, gündem 3 yazım, `addMeetingNote` (`Idempotency-Key`, eylem başına), `updateMeetingNote` (`expected_revision`, 409 `edit_conflict`), `deleteMeetingNote`, `convertNoteToTask`, katılımcı 2 yazım) — anahtarsız uçlarda kör tekrar yok, sonuç bilinmiyorsa liste/detay yeniden okunur; `capabilities.ts` (K1; meetings README §3/§4 kural kimlikleriyle; olgu = `company_admin`, `myDepartments`, `invite_mode`, `owner_department_id`, `created_by_account_id`, katılımcılık ve `viewer_role`; K73/K74 kip ayrımı; tablo testi: ŞY × K × Ü × bağlı/bağlı değil × yazar/başka × dönüşmüş); zaman bölme + gün gruplama modeli (kurulum saat dilimi); departman kodu çözümü (`listProgramDepartments` ⋈ `department_id`, sahip önde); iskelet.
- **Eksikler (BE):** BE-021, BE-060, BE-061, BE-063, BE-065, BE-067, BE-068 (veri katmanında stub yok; "Şimdilik" yolları); BE-062/BE-022/BE-023 kurulmaz.
- **Kabul:** her uç için msw testi (S2: yalnız program başlığı); capability tablo testi (üç rol); kapsam/oturum değişiminde sorgular düşer (Ö-08); anahtarsız uçlarda "sonuç bilinmiyor → tek istek"; **"gövde dolunca iskelet/rota testi kırılır mı?" cevabı rapora** (KESİN 22).

## W102 — Liste sayfası (O2b)

- **Sahip:** `src/modules/meetings/pages/MeetingsPage.vue` (+ `pages/meetings/**`), `src/modules/meetings/components/list/**` (başlık, sekmeler, süzgeç, gün grubu, satır gövdeleri); 01/10 tarafında dosya yok.
- **Tespit:** E-09-01…19 (+ E-09-03/05 görünürlüğü); `mekanizma.md` §1, §5, §6; `eksikler.md` yeni-1/2/3; `ozellikler.md` §2.1–2.3, §7. Tasarım: `Toplantilar.dc.html`.
- **İş:** kabul tablosundaki satırlar (başlık/alt başlık, zaman sekmeleri URL `zaman`, koordinatörlük süzgeci URL `koordinatorluk`, E-09-06a tarih süzgeci URL `from`/`to` ve API bağlama, gün grupları, satır, `summary` sayaçları, kural notu düzeltilmiş metin, alt sayaç, boş/yükleniyor/hata, K6/K7 durumları).
- **Eksikler (BE):** BE-021, BE-060, BE-062 (gizli).
- **Kabul:** E-09-01…19 kabul kanıtları; satır başına ek istek yok (fan-out testi); Canlı/Bekliyor DOM'da yok; açık/koyu tema; 390/1024/1440 taşma 0.

## W103 — Detay çerçevesi ve Gündem (O2b)

- **Sahip:** `src/modules/meetings/pages/MeetingDetailPage.vue` (+ `pages/detail/**`), `src/modules/meetings/components/agenda/**`, detay başlığı bileşenleri.
- **Tespit:** E-09-20…35 (E-09-26…30 gizli); `mekanizma.md` §4.2–4.4, 4.6–4.8; `eksikler.md` yeni-6/14. Tasarım: `Toplanti-Detay.dc.html`.
- **İş:** detay başlığı (kicker, kodlar, "Üyeler dahil", Düzenle/Diğer işlemler tetikleyicileri — pencereler W106), Gündem kartı (ilerleme, işaretle, işaretleyen, ekle, madde menüsü: düzenle/sil), konferans şeridi **çizilmez**.
- **Eksikler (BE):** BE-063, BE-068.
- **Kabul:** E-09-20…35 kabul kanıtları; gündem eklemede sonuç bilinmiyor → tek istek + yeniden okuma; Ü'de salt okunur; menü/odak dönüşü testleri (KESİN 27).

## W104 — Notlar ve nottan görev (O2b)

- **Sahip:** `src/modules/meetings/components/notes/**`, `src/modules/meetings/components/convert/**` (E-09-74…80 penceresi).
- **Tespit:** E-09-36…44, 74…80; `backend.md` §2 (notlar, `convertNoteToTask`), §3; `eksikler.md` yeni-8/9; `mekanizma.md` §4.9–4.11.
- **İş:** not kartı (yaz — `Idempotency-Key`, süzgeç istemcide, öğe, düzenle `expected_revision` uzlaştırma, sil, daha fazla), göreve dönüştür penceresi (başlık, hedef koordinatörlük, tarihler; `department_id` her zaman), dönüşmüş etiketi bağlantısız (BE-065).
- **Eksikler (BE):** BE-061, BE-065, BE-005.
- **Kabul:** E-09-36…44, 74…80 kabul kanıtları; 409 `edit_conflict` uzlaştırma testi; 409 `note_converted`; dönüştürme sonrası `queryKeys.workItems.all(scope)` (liste, sayaç ve menü rozeti öneki) geçersizlenir; üç rol kilit testi (E-09-42).

## W105 — Katılımcılar, koordinatörlükler, bilgi kartı (O2b)

- **Sahip:** `src/modules/meetings/components/people/**` (katılımcı kartı + kişi seçici bileşeni), `components/side/**` (koordinatörlükler + bilgi).
- **Tespit:** E-09-45…54; `backend.md` §1 (katılımcılar), §2 (ekle/çıkar); `eksikler.md` yeni-5/7/10/11/12; `mekanizma.md` §4.12–4.14.
- **İş:** düz katılımcı listesi (K72 ekip verisi var; gruplama kararı açık), "Ekle" (P23 özel kişi seçici (açılmış çizim bulunamadı); ŞY `listUsers` program filtresi, K `listMembers` yalnız `coordOf`, BE-067 sınırı ve kesilme açık), sıralı ayrı istekler + kısmi başarı uyarısı, çıkar, Koordinatörlükler kartı ("Değiştir" yalnız coordinatorship kipinde ŞY — pencere W106), Bilgi kartı (Açan, Oluşturulma, Kimler görür, Rolün).
- **Eksikler (BE):** BE-063, BE-064 (koşullu), BE-066, BE-067, BE-048.
- **Kabul:** E-09-45…54 kabul kanıtları; K'da "Değiştir" DOM'da yok; kısmi başarı testi; sağlayıcı adı DOM'da yok.

## W106 — Pencereler ve Silinenler (O2b)

- **Sahip:** `src/modules/meetings/components/forms/**` (yeni toplantı, düzenle, koordinatörlük kümesi), `components/deleted/**` (silme onayı, Silinenler kartı/sekmesi).
- **Tespit:** E-09-03, 05, 24, 25, 51, 66…73, 81…84; `backend.md` §2; `mekanizma.md` §4.1–4.5, 4.14; `eksikler.md` yeni-13/14. Tasarım: `Toplanti-Formlar.dc.html`.
- **İş:** yeni toplantı (başlık, tarih+saat, kip seçimi; person kuruluşunda bir sahip departman ve seçilen katılımcılar; `members_included: true` person'da yasak, `Idempotency-Key` yok → kör tekrar yok), düzenle formu (P25, sürümsüz PATCH; person kip/departman değişmez ve `members_included: true` yasak), koordinatörlük kümesi (yalnız coordinatorship kipinde ŞY), silme `alertdialog` (konferans cümlesi yok), Silinenler (yalnız ŞY; geri yükle, kalıcı sil onayı).
- **Eksikler (BE):** BE-063, BE-067, BE-068.
- **Kabul:** E-09-03, 05, 24, 25, 51, 66…73, 81…84 kabul kanıtları; geçmiş gün istek atmaz; çift gönderim kilidi; odak dönüşü (KESİN 27); 404 silme → başarı gibi liste.
