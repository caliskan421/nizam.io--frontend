# 09 · Toplantılar

**Codex kapısı:** KOŞULLU UYGUN (2026-11-08) — grup bulguları `dogrulama.md` Kapanış bölümünde; ortak kurallar `../ortak-kurallar.md`.

**Artboard'lar:** `Toplantilar.dc.html` (`09 · Toplantılar`), `Toplanti-Detay.dc.html` (`09b · Toplantı › Haftalık koordinasyon`), `Toplanti-Formlar.dc.html` (`09c · Toplantı › Pencereler`), `Toplanti-Gorusme.dc.html` (`09d · Toplantı › Görüşme (tam ekran)`), `Toplanti-Kucuk.dc.html` (`09e · Toplantı › Küçültülmüş görüşme`)
**Faz:** F4 · **v1:** ✓ (09d/09e **statik**, KR-26) · **Yol haritası bağı:** K1, K2, K5, K7, K10, K13, K14; §4 F4 satırı ("Liste, detay, gündem, notlar, nottan görev, silinenler; video (W7) ayrı"); §6 KR-26
**Rota (önerilen, K10):** `/toplantilar` — tipli süzgeçler: `zaman` (`yaklasan` | `gecmis` | `silinenler`), `koordinatorluk` (departman kimliği, tekil); `/toplantilar/:meetingId` — `meetingId` (kimlik), isteğe bağlı `notlar` (`tumu` | `gorev` | `benim`). 09d/09e için v1'de rota yok (statik; bkz. `mekanizma.md` §1).

## Özet
Seçili programın ("sezon") toplantılarını gün gruplarına ayrılmış bir liste olarak gösterir (yaklaşan / geçmiş / silinenler), her satırda tarih kutusu, sahip + davetli koordinatörlük kodları, gündem / not / katılımcı sayaçları vardır. Detay sayfası gündem maddelerini (işaretlenebilir, eklenebilir), toplantı notlarını (yazma, süzme, düzenleme/silme, nottan görev oluşturma), katılımcıları koordinatörlüğe göre gruplu olarak, bağlı koordinatörlükleri ve bilgi kartını gösterir; üstte görüntülü konferans şeridi bulunur. Pencereler: yeni toplantı, göreve dönüştür, silme onayı, silinen toplantılar (yalnız admin). Görüşme ekranları (tam ekran ve küçültülmüş pencere) video modülüne aittir; F4'te statik (BE-023, faz sırası kararı; backend video uçları vardır, sağlayıcı kurulum profiline bağlıdır: `livekit` varsayılan, profil 2'de `none`, GAP-133 karar bekliyor). Admin sezondaki tüm toplantıları görür; koordinatör bağlı olduğu koordinatörlüklerin toplantılarını görür; üye yalnız "Üyeler dahil" açık ve departmanı bağlı toplantıları görür, katılımcı olmak yetmez (kural kaynağı meetings README K19/K45; `istemci-akislari.md` toplantıyı kapsamaz, bkz. `backend.md` §3). Ana veri kaynağı: toplantı modülü (`listMeetings`, `getMeeting`, not ve katılımcı uçları — eşleme `backend.md`'nin işi).

## Dosyalar
| Dosya | Durum | Son güncelleme | Üreten |
|---|---|---|---|
| ozellikler.md | denetlendi | 2026-11-08 | tasarım analisti |
| mekanizma.md | denetlendi | 2026-11-08 | tasarım analisti |
| backend.md | denetlendi | 2026-11-08 | backend analisti |
| eksikler.md | denetlendi | 2026-11-08 | backend analisti |
| dogrulama.md | denetlendi | 2026-11-08 | denetçi (Sonnet) |

## Uygulama kararı tablosu (CX-M-07)

Karar tarihi 2026-11-10 (WEB-3 O4 adım 2). **Durum: geçici kabul — ürün sahibi F4 sorularını (aşağıda F4-S1…S10) henüz cevaplamadı;** Codex §6 #21–#23 ve README "Açık sorular" cevapsızdır, her biri önerilen varsayılanla **geçici kabul (koordinatör)** olarak kodlanır, ürün sahibi farklı cevaplarsa ilgili satır güncellenir (03c kalıbı). Kaynaklar: `../ortak-kurallar.md` §1–§7, §9, §10, §12 (P1–P20; toplantıyı ilgilendiren özel karar yok); `backend.md` §1–§6; `eksikler.md`; `mekanizma.md`; `../../backend-eksikleri/kayit.md`, `../../backend-eksikleri/rapor-F3.md` §4; `../../reviews/EKRANLAR-codex.md` §6 #21–#23. Uygulayıcılar: `../../yurutme/web-4/` (W101–W107). Kısaltmalar: ŞY = şirket yöneticisi (`me.company_admin`), K = toplantıya bağlı departmanın koordinatörü, Ü = üye; yetki **olgudan** (`capabilities.ts`, K1), rol dizesinden değil; mercek ≠ yetki (P1). Toplantı uçlarının tamamı S2 (yalnız program başlığı). **K1 kaynağı:** `istemci-akislari.md` toplantıyı kapsamaz; yetki kuralı meetings README §3/§4'ten alınır (F4-S10, geçici kabul).

| E-kimliği | Faz | Davranış (canlı / statik / gizli / devre dışı) | Kabul edilmiş varsayım (öneri / kabul / ret — ortak-kurallar §2) | BE bağı | Bağımlılık | Kabul kanıtı |
|---|---|---|---|---|---|---|
| E-09-01 Sayfa başlığı | F4 | canlı — "Toplantılar" | kabul | — | W102 | render |
| E-09-02 Alt başlık | F4 | canlı — "‹program adı› · N yaklaşan, M geçmiş toplantı · ‹mercek cümlesi›"; sayılar yüklenen listeden (tavan/sayfa sürerken "en az"/"yüklenen kayıtlar içinde"); cümle yalnız gösterim | kabul — §10 (sayfa tavanı ≠ toplam), K3; kabul — mercek cümlesi yetki değildir (§1) | BE-021, yeni-2 | W101, W102 | tüm sayfalar yüklenmeden "en az" etiketi testi; üç mercek cümlesi testi |
| E-09-03 Yeni toplantı | F4 | canlı — yalnız `isAdmin` ya da seçili programda ≥ 1 `coordOf`; Ü'de gizli; E-09-66 penceresini açar | kabul — K1 (meetings README §4, K16) | — | W101 `capabilities`, W106 | üç rol görünürlük testi; Ü'de DOM'da yok |
| E-09-04 Zaman sekmeleri | F4 | canlı — Yaklaşan (varsayılan) / Geçmiş + sayaç; URL `zaman`; sayaç bütün imleç sayfaları (200'lük) yüklenince kesin, sürerken "n+" | kabul — K10; kabul — BE-021 "Şimdilik" (bütün sayfalar yüklenir, istemcide `meeting_date` ≥ / < bugün bölünür, kurulum saat dilimi `instanceProfile`) | BE-021 | W101, W102 | bölme + sayaç birim testi; gün sınırı sahte saat testi; "Bugün"deki geçmiş saatli toplantı → varsayım: aynı gün → Yaklaşan (**geçici kabul**, `mekanizma.md` §3) |
| E-09-05 "Silinenler" sekmesi | F4 | canlı — yalnız `isAdmin`; sayaç yüklenen kadar (sunucu toplamı yok); diğerlerinde DOM'da yok | kabul — K1 (K22, K23); kabul — `title` metni | BE-021 | W101, W106 | admin dışı DOM'da yok testi |
| E-09-06 Koordinatörlük süzgeci | F4 | canlı — **tek** departman (`listProgramDepartments`), istemcide `departments[].department_id` süzme; URL `koordinatorluk`; sayı yok | kabul — P4 benzeri (çoklu süzgeç yok, K3); **geçici kabul (koordinatör)** — menü tasarlanmamış (P3): 03c E-03C-05 kalıbı, `shared/ui` menü | BE-021 | W102 | tek seçim + URL testi; odak dönüşü (KESİN 27) |
| E-09-07 Kod açıklaması | F4 | canlı (sabit metin) | kabul | — | W102 | görsel |
| E-09-08 Gün grubu başlığı | F4 | canlı — "Bugün" / "Bu hafta" / "Gelecek hafta" + daha ilerisi/geçmiş için gün ya da ay grupları; kurulum saat diliminde gün; hafta Pazartesi başlangıçlı | kabul — `backend.md` §4; **geçici kabul (koordinatör)** — çizilmeyen ileri/geçmiş grup başlıkları ("26 Ekim – 1 Kasım" biçiminde aralık / ay) (mekanizma §5) | BE-021 | W102 | gruplama birim testi (sahte saat, ay/yıl sınırı) |
| E-09-09 Toplantı satırı | F4 | canlı — satırın tamamı bağlantı → `/toplantilar/:meetingId` | kabul — K10 | — | W102 | bağlantı + klavye testi |
| E-09-10 Tarih kutusu | F4 | canlı — gün/ay kısaltması/saat (kurulum saat dilimi); `live` / `due` durumları **gizli** (sahte Canlı/Bekliyor yok) | **geçici kabul (koordinatör) — F4-S1**; kabul — §4 (statik ≠ sahte veri) | BE-062 (koşullu) | W102 | `data-state` yalnız normal; Canlı/Bekliyor DOM'da yok |
| E-09-11 Toplantı başlığı | F4 | canlı — tek satır kesilir | kabul | — | W102 | kesilme |
| E-09-12 Koordinatörlük kodları | F4 | canlı — `department_id` → `listProgramDepartments.code`; sahip önde (`owner_department_id`, dizi sırasına güvenilmez); kodsuz/silinmiş departmanda ad baş harfleri, ad `title`; "silinmiş" işareti yok | kabul — `backend.md` §4; kabul — fan-out yok | BE-063 (09/yeni-4) | W101, W102 | sahip önde testi; kodsuz/silinmiş → baş harf |
| E-09-13 Koordinatörlük satırı | F4 | canlı — tek: "‹ad›"; çok: "‹sahip adı› + N koordinatörlük" (`departments.length − 1`) | kabul | — | W102 | iki biçim testi |
| E-09-14 Gündem sayacı | F4 | **statik** — satır başına `getMeeting` fan-out yasak; sayaç yerine nötr "—" (`designStub('BE-060')`); 900 px altında zaten gizli | kabul — K3, §3, §4 | BE-060 | W102 | stub lint; fan-out testi (liste yüklenirken ek istek yok) |
| E-09-15 Not sayacı | F4 | statik — E-09-14 ile aynı | kabul | BE-060 | W102 | aynı |
| E-09-16 Katılımcı sayacı | F4 | statik — E-09-14 ile aynı | kabul | BE-060 | W102 | aynı |
| E-09-17 Satır oku | F4 | canlı (süs, `aria-hidden`) | kabul | — | W102 | — |
| E-09-18 Kural notu | F4 | canlı — metin düzeltilir: "Bugünden önceki günlere toplantı açılamaz." ("tarih yalnız ileri alınabilir" kaldırılır) | **geçici kabul (koordinatör) — F4-S7** (sunucu K17: yalnız bugünden önceki gün reddedilir; "yalnız ileri" doğru değil, istemci ek kural koymaz) | — | W102 | metin testi; "yalnız ileri" yok |
| E-09-19 Alt sayaç | F4 | canlı — "N yaklaşan/geçmiş toplantı" (sekmeye göre, yüklenenden) | **geçici kabul (koordinatör)** — sekmeye göre metin bilinmiyor, E-09-04 sayacıyla aynı kaynak | BE-021 | W102 | iki sekme metin testi |
| E-09-20 Üst satır (kicker) | F4 | canlı — "Bugün · 21 Ekim 2026 Çarşamba · 14:00"; göreli gün yalnız bugün/yarın, diğerinde tam tarih | **geçici kabul (koordinatör)** — göreli gün dışı biçim çizilmemiş | — | W103 | sahte saat testi |
| E-09-21 Toplantı başlığı | F4 | canlı — h1; kırıntıda da | kabul | — | W103 | render |
| E-09-22 Kodlar + sayı | F4 | canlı — kodlar (ilki koyu, "Sahip koordinatörlük") + "N koordinatörlük davetli" | kabul — E-09-12 kuralları | BE-063 | W103 | render |
| E-09-23 "Üyeler dahil" | F4 | canlı — yalnız `members_included` açıkken hap | kabul — K19 | — | W103 | iki durum testi |
| E-09-24 Düzenle | F4 | canlı — `isAdmin` ya da bağlı K; Ü'de gizli; yeni toplantı formunun dolu hâli (başlık, tarih+saat, "Üyeler dahil"); `updateMeeting` **sürümsüz, son yazan kazanır** (yarış metni yok) | **geçici kabul (koordinatör) — F4-S5** (form tasarlanmamış, P3 en sade); kabul — K1 (K16) | — | W101, W106 | yetki tablo testi; PATCH yalnız değişen alanlar; Ü'de yok |
| E-09-25 Diğer işlemler | F4 | canlı menü — "Tarihi ileri al" (düzenle formunun tarih alanını açar, sunucu kuralı kadar), "Sil" (E-09-81); yetkisizde gizli | **geçici kabul (koordinatör)** — menü tasarlanmamış (P3); "yalnız ileri" istemci kuralı yok (S7) | — | W103, W106 | menü + odak dönüşü testi |
| E-09-26 Konferans şeridi | F4 | **gizli** (statik değil) — "Canlı" hapı ve süre dahil hiçbir şerit çizilmez | **geçici kabul (koordinatör) — F4-S1** (Codex #21 varsayılanı: sahte Canlı/Bekliyor yok; `conference.status` bağlanmaz — KR-26, W7) | BE-022, BE-023 (vazgeçildi: backend eksiği değil) | W103 | DOM'da yok; `startConference`/`joinConference` isteği yok |
| E-09-27 Bağlı sayısı ve yüzler | F4 | gizli (E-09-26) | **geçici kabul (koordinatör) — F4-S1** | BE-022 | W103 | DOM'da yok |
| E-09-28 Bilgi satırı | F4 | gizli (E-09-26) | **geçici kabul (koordinatör) — F4-S1** | — | W103 | DOM'da yok |
| E-09-29 "Konferansı bitir" | F4 | gizli | **geçici kabul (koordinatör) — F4-S1** | BE-023 | W103 | DOM'da yok |
| E-09-30 "Katıl" | F4 | gizli | **geçici kabul (koordinatör) — F4-S1** | BE-023 | W103 | DOM'da yok |
| E-09-31 Gündem kartı + ilerleme | F4 | canlı — `agenda.filter(is_checked).length / agenda.length` (detayda tam, ≤ 50) | kabul | — | W103 | oran testi; `data-all` durumu |
| E-09-32 Gündem maddesi | F4 | canlı — onay kutusu `updateAgendaItem` (`is_checked`), sürümsüz son yazan kazanır; Ü'de salt okunur; başarısızlıkta kutu eski hâline döner + hata kodu bildirimi (sunucu `message` yok) | kabul — K1 (K26), K5; **geçici kabul (koordinatör)** — başarısızlıkta geri dönüş (mekanizma §4.7) | — | W103 | üç rol testi; hata → geri dönüş |
| E-09-33 İşaretleyen bilgisi | F4 | canlı — `checked_by_account_id` → `participants[].full_name` ("Ad S." + `checked_at` saat); katılımcı değilse "Bilinmeyen kişi" | kabul — `backend.md` §4, `istemci-akislari.md` §8 null ad kuralı | BE-063 (09/yeni-6) | W103 | katılımcı/katılımcı olmayan testi |
| E-09-34 Madde işlemleri | F4 | canlı menü — "Düzenle" (başlık satır içi), "Sil" (kalıcı, onaysız değil: `confirm`); yetkiliye | **geçici kabul (koordinatör)** — menü tasarlanmamış (P3) | — | W103 | menü + silme + odak |
| E-09-35 Madde ekleme | F4 | canlı — Enter ile gönder, 1–300 rune, boşsa gitmez; 50 maddede 422 `collaboration.agenda_limit_reached` → giriş devre dışı + ileti; **`Idempotency-Key` yok: sonuç bilinmiyorsa otomatik tekrar yok**, gündem yeniden okunur | kabul — K5 (istisna `eksikler.md` §4, yeni-14); kabul — iyimser güncelleme yok | BE-068 | W103 | sonuç bilinmiyor → tek istek; sayaç 300; 50 sınırı |
| E-09-36 Notlar kart başlığı | F4 | canlı — "Notlar" + yüklenen not sayısı ("n+" imleç doluyken) | kabul — §10 | BE-061 | W104 | sayaç testi |
| E-09-37 Not süzgeci | F4 | canlı — Tümü / Göreve dönüşen / Benim; **istemcide**, yüklenen notlardan; `next_cursor` doluysa sayaçlar "50+" gibi yaklaşık; URL `notlar` | kabul — `backend.md` §4; kabul — K10 | BE-061 (09/yeni-8) | W104 | üç süzgeç + yaklaşık sayaç testi |
| E-09-38 Not yazma alanı | F4 | canlı — Ü dahil toplantıyı gören herkes; `addMeetingNote` **`Idempotency-Key` zorunlu** (eylem başına bir anahtar, 200/201 başarı); sayaç "N / 5000" | **geçici kabul (koordinatör) — F4-S8** (tasarım 2000, sunucu 5000 rune; sözleşmeden sıkı kalınmaz); kabul — K5 | — | W104 | 200/201 aynı anahtar testi; çift gönderim yok; sayaç 5000 |
| E-09-39 Not öğesi | F4 | canlı — yazar (`author_name`), rol rozeti (`author_role`; null → rozet yok), saat, "· düzenlendi" (`edit_revision > 1`) | kabul — `backend.md` §4 | — | W104 | null rol + düzenlendi testi |
| E-09-40 Göreve dönüştü bağlantısı | F4 | "Göreve dönüştü" etiketi **bağlantısız**; kod (`‹KOD›-—`, BE-005) ve ek bilgi (atanan/tarih) gösterilmez; BE-065 gelene dek bağlantı açılamaz | kabul — `eksikler.md` yeni-9 "Şimdilik" | BE-065, BE-005 | W104 | bağlantı DOM'da yok; stub lint |
| E-09-41 "Göreve dönüştür" | F4 | canlı — `isAdmin` ya da bağlı K (K32), `converted_to_work_item_id = null` iken; E-09-74 penceresini açar | kabul — K1 (K32) | — | W101, W104 | yetki × dönüşmüş testi |
| E-09-42 Kilit notu | F4 | canlı — yalnız Ü yazarında ve dönüşmüş notta (K29); ŞY/K yazar düzenleyebilir (GAP-070) | kabul — `backend.md` §3 | — | W104 | üç rol testi |
| E-09-43 Not işlemleri | F4 | canlı menü — izinlere göre "Düzenle"/"Sil"; Düzenle `expected_revision` ile (409 `collaboration.edit_conflict` → notu yeniden oku, taslak korunur, iki sürüm kullanıcıya gösterilir); `author_role = null` (eski not) için düğme gösterilir, sunucu yanıtına bırakılır; Ü dönüşmüş notu silemez (409 `note_converted`) | kabul — K1 (K28/K29), K5; **geçici kabul (koordinatör)** — menü tasarlanmamış (P3); null rol varsayımı (`eksikler.md` §6) | — | W104 | 409 edit_conflict uzlaştırma testi; üç rol |
| E-09-44 "Daha fazla not göster" | F4 | canlı — sayısız "Daha fazla not göster" (kalan bilinmez); `next_cursor` boşsa gizli; ilk sayfa detaydan tohumlanır | kabul — `backend.md` §4 (yeni-8) | BE-061 | W104 | imleç testi |
| E-09-45 Katılımcılar + "Ekle" | F4 | canlı — yalnız bağlı K (K21; koordinatör olmayan ŞY reddedilir → gizli); kişi seçici ortak bileşenle (adaylar: K için kendi `coordOf` departmanlarının üyeleri, `listMembers`); **seçilen her kişi için sıralı ayrı istek**, başarısızlar toplanır | **geçici kabul (koordinatör) — F4-S3** (kişi seçici tasarlanmamış, P3); kabul — K1 (K21), K3 (fan-out departman başına, yalnız `coordOf`) | BE-066, BE-067 (koşullu/öncelikli) | W101, W105 | yetki testi; kısmi başarı → E-09-46 |
| E-09-46 Eklenemeyenler uyarısı | F4 | canlı — "N kişi eklenemedi" + kişi başına tek metin ("sezona üye değil ya da hesap silinmiş" — neden ayrımı yok, K21/422 `participant_invalid`); kapatılabilir, bellekte | kabul — `eksikler.md` yeni-10 "Şimdilik" | BE-066 | W105 | kısmi başarı testi |
| E-09-47 Koordinatörlük grubu | F4 | **gizli** — katılımcı rolü/departmanı yok → tek düz liste ("Katılımcılar N") | kabul — `eksikler.md` yeni-7 "Şimdilik" | BE-064 (koşullu) | W105 | grup başlığı DOM'da yok |
| E-09-48 Katılımcı satırı | F4 | canlı — avatar + ad; çıkar (x) yalnız bağlı K; kısa rol ve canlı nokta **yok**; onaysız çıkarma, başarıda `getMeeting` yenilenir | **geçici kabul (koordinatör)** — çıkar onaysız (mekanizma §4.13); kabul — K1 | BE-022, BE-064 | W105 | çıkar + yetki testi |
| E-09-49 Üye aç/kapa | F4 | gizli (E-09-47) | kabul — yeni-7 | BE-064 | W105 | DOM'da yok |
| E-09-50 Kart alt notu | F4 | canlı (sabit metin) | kabul | — | W105 | render |
| E-09-51 Koordinatörlükler "Değiştir" | F4 | canlı — **yalnız `isAdmin`**; K için gizli (devre dışı göstermek yanıltır); küme düzenleme penceresi `updateMeeting.department_ids` (ilki sahip) | **geçici kabul (koordinatör) — F4-S5**; kabul — K1 (K16) | — | W105, W106 | K'de DOM'da yok; admin PATCH testi |
| E-09-52 Koordinatörlük satırı | F4 | canlı — "‹KOD› · ‹ad› · Sahip" (E-09-12 kuralları) | kabul | BE-063 | W105 | render |
| E-09-53 Kart alt notu | F4 | canlı — "İlk koordinatörlük sahiptir. Bir koordinatörlük silinse de adı bu toplantıda kalır." (ad kopyası; kod silinmişte yok) | kabul | BE-063 | W105 | render |
| E-09-54 Bilgi listesi | F4 | canlı — "Açan" (`created_by_account_id` katılımcıysa ad, değilse rol etiketi + "Bilinmeyen kişi"), "Oluşturulma" (`GG.AA.YYYY`), "Kimler görür" (`members_included`'a göre cümle), "Rolün" (`viewer_role` + `me`/`myDepartments` birleşimi), "Konferans" satırı **gizli** | **geçici kabul (koordinatör) — F4-S2** (sağlayıcı adı gösterilmez); kabul — `backend.md` §4 | BE-063 (09/yeni-5) | W105 | "Açan" iki durum testi; sağlayıcı adı DOM'da yok |
| E-09-55…65 Görüşme (09d) / küçük pencere (09e) | F4 | **gizli, rota yok** — tam ekran, karo şeridi, denetim çubuğu, yan panel, küçük pencere ve gezinme ipucu çizilmez; `/toplantilar/…` altında görüşme rotası yok | **geçici kabul (koordinatör) — F4-S1** (KR-26, W7); kabul — K14 | BE-022, BE-023 | — | rota kataloğunda yok; DOM'da yok |
| E-09-66 Pencere başlığı | F4 | canlı — "Yeni toplantı" / "‹program› sezonuna bağlı bir toplantı aç." (✕, Esc) | kabul — P3 ortak modal | — | W106 | odak tuzağı + dönüş (KESİN 27) |
| E-09-67 Başlık girişi | F4 | canlı — 1–255 rune, sayaç "N / 255" | kabul — K11, K17 | — | W106 | doğrulama testi |
| E-09-68 Tarih + saat | F4 | canlı — "Tarih" `GG.AA.YYYY` + "Saat" `HH:MM`; ipucu "Bugünden önceki günler seçilemez."; gönderimde kurulum saat dilimiyle `date-time`; sunucu 422 satır içi | kabul — `backend.md` §6; **geçici kabul (koordinatör) — F4-S7** (tarih seçici görseli yok: metin girişi, 03c `date-input` kalıbı) | — | W106 | geçmiş gün istek atmaz; saat dilimi testi |
| E-09-69 Davet biçimi | F4 | "Koordinatörlük" biçimi canlı; **"Kişiler" biçimi kurulmaz** (görünürlük departmandan gelir; `participant_ids` erişim vermez) | **geçici kabul (koordinatör) — F4-S4**; ret — "Kişiler" görünürlük modu (sözleşmede yok, K19) | BE-067 | W106 | "Kişiler" DOM'da yok |
| E-09-70 Koordinatörlük çipleri | F4 | canlı — `aria-pressed` çipler, ad; **üye sayısı yok** (statik "—" değil, çipte gösterilmez); K için ilk çip yalnız `coordOf`; seçim sırası = sahip (ilk seçilen); ŞY serbest | kabul — K1 (K16); **geçici kabul (koordinatör)** — seçim sırası sahip, ilk çip belirgin (mekanizma §4.1); `eksikler.md` yeni-12 "Şimdilik" | BE-048 | W106 | K kısıtı; sahip sırası; sayı DOM'da yok |
| E-09-71 "Tüm üyelere de davet gönder" | F4 | canlı — `members_included` (E-09-23 ile aynı alan; üye görünürlüğü + üyelere bildirim) | kabul — `eksikler.md` §3 | — | W106 | gövde testi |
| E-09-72 Davet özeti | F4 | **gizli** — "N kişi davet edilecek" ve "sen de katılımcı olursun" doğrulanamıyor (departman sayıları yok, açanın otomatik katılımcılığı sözleşmede yok) | kabul — `eksikler.md` §6 (doğrulanamadı); §4 (sahte sayı yok) | BE-048 | W106 | DOM'da yok |
| E-09-73 Alt düğmeler | F4 | canlı — "Vazgeç", "Toplantıyı oluştur"; **`Idempotency-Key` yok: sonuç bilinmiyorsa otomatik tekrar yok**, taslak korunur, liste/detay yeniden okunur, karar kullanıcıya; başarıda detay sayfası; 422/403 kodları → satır içi | kabul — K5 (istisna yeni-14), K11 | BE-068 | W106 | çift gönderim kilidi; sonuç bilinmiyor testi |
| E-09-74 Göreve dönüştür başlığı | F4 | canlı — "Göreve dönüştür" / "‹toplantı› · ‹yazar›'nun notu" | kabul | — | W104 | render |
| E-09-75 Not alıntısı | F4 | canlı (salt okunur) | kabul | — | W104 | render |
| E-09-76 Görev başlığı | F4 | canlı — 1–255, boşsa sunucu notun ilk 100 karakterini kullanır (ipucu); alan not metninden önceden doldurulur | kabul — K11 | — | W104 | boş başlık gövdede yok testi |
| E-09-77 Hedef koordinatörlük | F4 | canlı — ŞY: `listProgramDepartments` tamamı; K: `coordOf` ∩ toplantıya bağlı (K34); `department_id` **her zaman gönderilir** | kabul — K1 (K34); kabul — `eksikler.md` §6 | — | W104 | seçenek kümesi testi; gövdede `department_id` |
| E-09-78 Başlangıç / Bitiş | F4 | canlı — `YYYY-MM-DD`; istemci ön denetimi: bitiş ≥ başlangıç, başlangıç ≥ bugün; atanan alanı yok | kabul — K11, `backend.md` §2 | — | W104 | satır içi hata + `aria-invalid` |
| E-09-79 Bilgi kutusu | F4 | canlı (sabit metin) — "Not bir kez dönüştürülebilir" | kabul | — | W104 | render |
| E-09-80 Alt düğmeler | F4 | canlı — "Vazgeç", "Görevi oluştur" (hatada `aria-disabled`); uç atomik (K36); `priority`/`assignee_account_ids` gönderilmez (görev atamasız, öncelik `orta`); başarıda not "Göreve dönüştü" + `['work','program-list']` geçersizlenir; tekrar → 409 `collaboration.note_converted` ile korunur | kabul — K36; K5 (anahtar yok, `note_converted` korur) | — | W104 | tek istek; 409 testi; geçersizleme testi |
| E-09-81 Silme onayı | F4 | canlı — `alertdialog` "Toplantı silinsin mi?"; "canlı konferans hemen kapanır" cümlesi **gösterilmez** (video verisi yok); başarıda listeye dön; 404 (yarış kaybı) → başarı gibi liste | **geçici kabul (koordinatör) — F4-S1** (konferans cümlesi); kabul — K1, K40 | — | W106 | onay + odak dönüşü; 404 → liste |
| E-09-82 Silinenler kartı | F4 | canlı — yalnız `isAdmin`; `listDeletedMeetings` (imleç, "Daha fazla yükle") | kabul — K1 (K22) | — | W106 | admin dışı yok testi |
| E-09-83 Silinen satırı | F4 | canlı — başlık + "‹sahip kodu› · ‹gün ay› · sildi, ‹GG.AA›" (**silen adı yok** — `deleted_by` yok → yalnız tarih); "Geri yükle" (`restoreMeeting`; 409 `not_deleted` → yenile); kalıcı sil ikonu → onay penceresi | **geçici kabul (koordinatör)** — kalıcı sil onay penceresi `alertdialog` + E-09-84 metni (mekanizma §4.5); kabul — `eksikler.md` yeni-13 "Şimdilik" | BE-063 (silen adı) | W106 | geri yükle + 409 testi; silen adı DOM'da yok |
| E-09-84 Kalıcı silme notu | F4 | canlı (sabit metin); `permanentDeleteMeeting` 409 `permanent_requires_deleted` | kabul | — | W106 | render |

**Satır dışı varsayımlar:**

| Varsayım | Karar | Kaynak |
|---|---|---|
| Yetki kaynağı: toplantı eylem görünürlüğü `modules/meetings/model/capabilities.ts`'te olgulardan (`me.company_admin`, `myDepartments` rolü, toplantının `departments[]`, `viewer_role`) kurulur; kural kimlikleri meetings README §3/§4 (K16, K19, K21, K22, K26, K28, K29, K32, K34, K45); tablo testli | **geçici kabul (koordinatör) — F4-S10**; kabul — K1, P1 | `backend.md` §3 |
| Sorgu anahtarları: `scopedKey(programId, ['meetings', 'list'])` (sonsuz imleç), `['meetings','deleted']`, `['meetings','detail',id]`, `['meetings','notes',id]` (ilk sayfa detaydan tohumlanır); `['work','program-list']` yalnız `convertNoteToTask` ile geçersizlenir; kapsam değişince hepsi iptal (K2) | kabul — §6 | `backend.md` §5 |
| Liste: `created_at DESC` gelir; yaklaşan/geçmiş bölme ve sayaç yalnız bütün imleç sayfaları (200'lük) yüklenince kesin, sürerken "n+"/"yüklenen kayıtlar içinde" | kabul — K3, §10 | `eksikler.md` §3 |
| Gün sınırı ve "Bugün/Bu hafta": `instanceProfile.timezone` (kurulum saat dilimi), hafta Pazartesi başlangıçlı | kabul — rapor-F1 §3 madde 4 | `backend.md` §4 |
| İyimser güncelleme yok; her yazmadan sonra detay yeniden okunur | kabul — `istemci-akislari.md` §8 | `backend.md` §5 |
| `Idempotency-Key` yalnız `addMeetingNote`'ta; `createMeeting`, `addAgendaItem`, `addMeetingParticipant`, `convertNoteToTask` anahtarsız → sonuç bilinmiyorsa kör tekrar yok, yeniden okuma + kullanıcı kararı | kabul — K5 (istisna yeni-14) | `eksikler.md` §4 |
| `updateMeeting` ve `updateAgendaItem` sürümsüz (son yazan kazanır); `updateMeetingNote` `expected_revision` zorunlu (409 `collaboration.edit_conflict`) | kabul | `backend.md` §6 |
| Sunucu `message` alanı kullanıcıya gösterilmez; hata kodu → i18n; `organization.confirmation_required` toplantı uçlarında yok | kabul — KESİN 7, 8 | `backend.md` §2 |
| Departman sırası: `owner_department_id` sahip; `departments[]` dizi sırasına güvenilmez | kabul | `backend.md` §4, `eksikler.md` §6 |
| Kapsam (program) değişince detay sayfası, yeni kapsamda toplantı görünmüyorsa K6 durumuna düşer; açık pencere ve taslaklar düşer | kabul — K2, K6 | `mekanizma.md` §2 |
| Kullanıcıya sağlayıcı adı ("LiveKit") ve üretimde video açıklığı hakkında iddia gösterilmez | **geçici kabul (koordinatör) — F4-S2** | `backend.md` §6 |

Uygulayıcı yalnız `kabul` ve **geçici kabul** satırlarını kodlar; `öneri` kodlanmaz, `ret` uygulanmaz.

## Açık sorular (ürün sahibine)

Cevap gelene dek her biri **geçici kabul (koordinatör)** olarak önerilen varsayılanla kodlanır (Codex §6 #21–#23 ve ekran README soruları). Cevapla ilgili satırlar güncellenir.

| Kod | Soru | Önerilen varsayılan (kodlanan) | Kaynak |
|---|---|---|---|
| F4-S1 | Konferans şeridi (Canlı, süre, "6 / 25 kişi bağlı", Katıl, Konferansı bitir), listedeki Canlı/Bekliyor ve 09d/09e F4'te statik mi gösterilsin, gizli mi? | **Gizli**: şerit, sahte Canlı/Bekliyor, silme cümlesindeki "konferans kapanır" ve görüşme rotaları çizilmez; W7'de gerçek sağlayıcı durumu bağlanır | Codex #21; README (eski) 1; E-09-10, 26–30, 55–65, 81 |
| F4-S2 | Bilgi kartında "Konferans: LiveKit" gibi sağlayıcı adı kullanıcıya gösterilsin mi? | Hayır; "Konferans" satırı kurulmaz | Codex #21; E-09-54 |
| F4-S3 | Katılımcı ekleme ve yeni toplantıdaki kişi seçici hangi bileşen? | Ortak `shared/ui` seçici (P3, en sade); adaylar K için kendi departmanlarının üyeleri (`listMembers`), ŞY seçemez (K21) | Codex #22; E-09-45 |
| F4-S4 | "Kişiler — yalnız seçtiğin kişiler" davet biçimi kurulsun mu? | Hayır (görünürlük departmandan gelir; kişi eklemek 09b "Ekle"dedir) | Codex #22; E-09-69 |
| F4-S5 | Toplantı "Düzenle" formu ve gündem maddesi düzenleme: yeni toplantı formuyla aynı mı; koordinatörlük kümesini kim değiştirir? | Aynı alanlar (başlık, tarih+saat, "Üyeler dahil"); koordinatörlük kümesi yalnız ŞY, K'ya gizli | Codex #22; E-09-24, 34, 51 |
| F4-S6 | Toplantıya dosya eklenmesi F4 kapsamında mı? | Hayır (yeni kapsam olmadan eklenmez) | Codex #22; README (eski) 4 |
| F4-S7 | Tarih kuralı metni: "tarih yalnız ileri alınabilir" yanlış (sunucu yalnız bugünden önceki günü reddeder) — düzeltilsin mi? | Evet: "Bugünden önceki günlere toplantı açılamaz."; istemci ek kural koymaz | Codex #23; E-09-18, 25, 68 |
| F4-S8 | Not sınırı: tasarım "0 / 2000", sunucu 5000 rune. | Sayaç "N / 5000" (sözleşme esas) | Codex #23; E-09-38 |
| F4-S9 | Listede tarih süzgeci gerekli mi? | Hayır (tasarımda yok); gerekirse BE-021 kapsamına alınır | Codex #23; README (eski) 6; E-09-06 |
| F4-S10 | `istemci-akislari.md` toplantıyı kapsamıyor; eylem görünürlüğü meetings README §3/§4'ten kodlansın, yol haritasına bu istisna yazılsın mı? | Evet (sözleşme dışı çıkarım yok; BE-036 madde 7 belge paketi gelince kaynak değişir) | `eksikler.md` §4 (K1); BE-036 |
