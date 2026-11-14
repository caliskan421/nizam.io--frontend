# WEB-6 — Codex nihai kapı

Faz: F6 (raporlar, yönetici panosu, K1/Ü1, rol menüleri). Codex gpt-6.1-sol medium, `-s read-only`. Hüküm durumu: **tur 1 KOŞULLU UYGUN → tur 2 KOŞULLU UYGUN → tur 3 (nihai) UYGUN; F6 KAPANDI** (kapanış PR'ı ile birleşir; kapanış PR'ının CI'sı ve birleşme adımı ayrıca tamamlanır). Ham çıktılar koordinatör kaydındadır (`.git/koordinator/web6-codex-tur{1,2,3}.md`, yerel).

## Tur 1 — 2026-11-14, HEAD 633d9d2

HEAD: `633d9d22f7be472e417e75d583658231b0cf1fa2`

**KOŞULLU UYGUN**

İncelenen akışlarda engelleyici yetki sızıntısı, API/token pini uyumsuzluğu veya oturum değişiminden sonra dosya kaydetme kusuru saptanmadı. Aşağıdaki davranış ve doğrulama sorunları kapanıştan önce giderilmeli. Bu hüküm "F6 kapandı" anlamına gelmez. Codex dosya değiştirmedi, test yazmadı, push/PR yapmadı; çalışma ağacı temiz kaldı.

## Bulgular

| Bulgu | Önem | Konum | Bağ | Atanan | Durum |
| --- | --- | --- | --- | --- | --- |
| CX-F6-E-01 Kayıt değişince devam eden rapor sonucu yeni kayda taşınabiliyor | Orta | `src/modules/reports/components/ReportActionButton.vue:100`, `src/modules/reports/pages/MeetingReportPage.vue:87` | E-13-47/68/74, KESİN 26 | W146 | kapandı (W146) |
| CX-F6-E-02 Hesaba ait bekleme sayacı sonraki hesaba kalıyor | Orta | `src/modules/reports/model/gate.ts:98`, `src/modules/reports/api/cancellation.ts:25` | REPORTING-K09/K10, E-13-69/70 | W146 | kapandı (W146) |
| CX-F6-E-03 Ü1 eksik kümeyi tam küme gibi sunuyor | Orta | `src/modules/home/api/role/use-role-load.ts:16`, `src/modules/home/pages/MemberHomePage.vue:132` | P4, ortak-kurallar §10, KESİN 21; E-Ü1-09/10/25–27/31 | W147 | kapandı (W147) |
| CX-F6-E-04 K1 kişi başı açık görev sayısı başlamamış atamaları dışlıyor | Orta | `src/modules/home/model/k1/team.ts:65` | E-K1-08/27/28, KESİN 21 | W147 | kapandı (W147) |
| CX-F6-E-05 Ağır önizlemenin 429 yanıtı ortak bekleme politikasına katılmıyor | Orta | `src/modules/reports/api/queries.ts:58`, `src/modules/reports/pages/SeasonReportPage.vue:82` | REPORTING-K10, E-13-39/40/69/70 | W146 | kapandı (W146) |
| CX-F6-E-06 01g'de 404, kabul edilen kayıp-kayıt akışını işletmiyor | Orta | `src/modules/reports/pages/MeetingReportPage.vue:98`, `src/app/__tests__/integration/reports-meeting.test.ts:163` | E-13-73, 13 mekanizma §2 | W146 | kapandı (W146) |
| CX-F6-K-01 Yeni testte gerçek zaman beklemesi var | Düşük | `src/modules/home/components/k1/use-role-writes.test.ts:149` | KESİN 11/26(c) | W147 | kapandı (W147) |
| CX-F6-K-02 Belge ve kanıt sınırları (CI/HEAD bağı, gerçek e2e, 404 URL'si) | Orta | `docs/yurutme/web-6/oturum-4-kapanis.md:25`, `docs/backend-eksikleri/rapor-F6.md` §7, W142/W144/W145 kayıtları | kanıt izlenebilirliği | W148 (+ koordinatör CI) | W148 kapandı; HEAD CI → kapanış PR CI'sı ile kapanır |
| KUSUR 4 yorumu: mercek liste/sayaç süzgeci doğrulanmalı | — (karar kaydı yetmez) | Ü/K merceğinde 03 listesi/sayaç | P1/P53 | W147 | kapandı (W147) |

### Bulgu ayrıntıları

**CX-F6-E-01.** A toplantısının önizlemesinde PDF başlatılıp aynı rota kaydı üzerinden B toplantısına geçildiğinde araç çubuğu ve rapor düğmesi yeniden kullanılabiliyor. `targetId` değişimi sürmekte olan indirmeyi iptal etmiyor; bekleyen sonuç B ekranında A'nın dosyasını kaydedip başarı/hata durumunu gösterebiliyor (izleyici, istek sürerken sıfırlamayı özellikle atlıyor). Hesaplar arası sızıntı değil.
*En küçük sınıf düzeltmesi:* kayıt kimliğini eylem sahibinin yaşamına bağlamak; kimlik değişince eski kiralamayı iptal etmek ve eski sonucun yeni durumu yayımlamasını engellemek; tek bağlama noktası yetmez. *Doğrulama:* A bileti beklerken ve A tüketimi beklerken ayrı ayrı B'ye geç; ilkinde tüketim, ikincisinde kaydetme/bildirim olmamalı; B'nin bağımsız indirmesi çalışmalı.

**CX-F6-E-02.** A hesabı `Retry-After: 60` aldıktan sonra çıkış ve B girişi yapılırsa sekme genelindeki `reportGate.cooldown` korunuyor. Oturum dinleyicisi yalnız mevcut kiralamayı iptal ediyor; sayacı temizleyen `reset()` için üretim bağlantısı yok (çağrılar testlerde).
*Düzeltme:* ortak kapının yaşamını hesap/oturum nesline bağlamak; gerçek hesap/oturum değişiminde kilit, kuyruk ve sayacı temizlemek; token refresh tetiklememeli. *Doğrulama:* sahte saatle A'da 60 sn sayaç, çıkış/B girişi sonrası B'de sıfır; aynı hesabın refresh'inde korunmalı.

**CX-F6-E-03.** Ü1 yüklemesi beş sayfada duruyor; sonraki sayfa hatasında da kısmi veri kalabiliyor. `complete/loadingMore` bilgisi kuyruk, takvim ve koordinatörlük kırılımına taşınmıyor: kesin sunucu özeti daha yüksekken kuyruk "Tümü N", takvim lejantı ve birim sayıları yalnız yüklenenleri kesin toplam gibi gösteriyor; sonraki sayfadaki öncelikli görev "Bugünün sırası"na giremiyor.
*Düzeltme:* tamlık ve devam-yükleme hatasını bütün istemci türevlerine taşımak; kısmi kümede açık kapsam etiketi ve devam/yeniden deneme yolu. *Doğrulama:* altıncı sayfada acil/gecikmiş görev ve ikinci sayfa hatası; hiçbir kısmi toplam kesin gösterilmemeli.

**CX-F6-E-04.** Bir kişiye yalnız zamanında, `baslanmadi` görev atanmışsa kart başlığındaki "atanmış açık görev" artıyor ama kişinin satırı **0 açık** gösteriyor: `open`, açık görev kümesinden değil dört renk diliminin toplamından hesaplanıyor; sıralama da bu eksik sayıya dayanıyor.
*Düzeltme:* açık toplamı aynı açık-atama kümesinden hesaplanmalı; çizilmeyen durum toplamdan düşmemeli. *Doğrulama:* başlamamış, devam, onayda, iade, tamamlanmış atamalarla toplam ve sıra; çoklu atama korunmalı.

**CX-F6-E-05.** `reportSeason` 429 + `Retry-After` döndürdüğünde kiralama bırakılıp genel, hemen etkin "Yeniden dene" gösteriliyor; ortak sayaç başlamıyor, PDF düğmesi yeniden açılıyor. İndirme yolundaki başlıklı bekleme aynı üretim korumasındaki JSON yolunda uygulanmıyor.
*Düzeltme:* ağır okuma hatasını ortak rapor sınıflandırmasına ve bekleme politikasına bağlamak. *Doğrulama:* başlıklı 429'da önizleme tekrarı ve PDF düğmesi sayaç boyunca kapalı; başlıksız yanıtta sayaç yok; süre bitince otomatik istek yok.

**CX-F6-E-06.** Silinmiş/kapsam dışı toplantının önizleme GET'i `reporting.not_found` aldığında sayfa genel hata ve tekrar düğmesiyle kalıyor; sayfayı kapatma, listeyi tazeleme ve bulunamadı bildirimi yolu yok. Mevcut entegrasyon testi yalnız hata metnini bekleyerek bu davranışı sabitliyor.
*Düzeltme:* önizleme ve indirme yüzeylerinde kayıp-kayıt sonucunu ortak politikayla ele almak; 404'ü geçici hata tekrarından ayırmak. *Doğrulama:* ilk açılışta ve sonradan silindiğinde 404; önizleme kapanmalı, liste yenilenmeli, tek bildirim çıkmalı.

**CX-F6-K-01.** Sökülmüş sahibin geç sonucu kontrol edilmeden önce gerçek `setTimeout(..., 50)` bekleniyor; bu, işlemin tamamlandığını kanıtlamıyor. *Düzeltme:* sabit süre yerine gerçek işlemin tamamlanması ve ortak yerleşme araçları; geciktirilmiş yanıt tamamlandıktan sonra bildirim yokluğu doğrulanmalı.

**CX-F6-K-02 (belge ve kanıt sınırları).**
- Bu HEAD için bağımsız CI sonucu doğrulanmadı; işçi test sayıları güncel HEAD'in yeşil CI kanıtı değildir.
- W144 gerçek Docker/backend tanığı `a3b31e3` kaynaklıdır; W142 sahte `/v1` provası ve W145 dumanı ayrı kanıttır.
- Gerçek backend'de düşen `smoke`/`two-tabs` için neden belirlenmemiştir; yeni F6 regresyonu veya başarılı gerçek e2e diye sınıflandırılmadı.
- W145 390 px ham kaydında HTTP **404 konsol hatası** var; URL kaydedilmediğinden kaynak belirlenemiyor.
- Gerçek 503 kapasite tanığı, VoiceOver ve kullanıcı görsel onayı yok; otomatik doğrulanmış sayılmadı.
- `../program/` belirtilen komşulukta bulunamadı; bütün dosyaların satır satır, bütün PNG'lerin görsel olarak kapsandığı iddiası yok.

*En küçük kanıt düzeltmesi:* kapanış HEAD'ine bağlı CI sonuçlarını iliştirmek; gerçek e2e başarısızlıklarını ve 404 isteğinin URL'sini ayrı tanıklarla açıklamak. Yeni kullanıcı onay akışı gerekmiyor.

### KUSUR 4 yorumu (W144)

Yöneticinin başka birim panelini açması ve rapor düğmesini görmesi **yetki sızıntısı değildir**; P1 bunu korur. Ancak program geneli **listeyi** aynı gerekçeyle onaylamak doğru olmaz: P1/P53 içerik merceğini ayrıca tanımlar. Ham izde mercek K/Ü iken liste/sayaç istekleri süzgeçsiz; mevcut kaynakta mercek süzgeçleri bulunuyor. Bu fark çözülmeden "ürün kararı bekler" kaydı davranış doğrulaması yerine geçmez. Sınıf düzeltmesi yetkiyi kısmak değil, liste/sayaç merceğini korumaktır → **W147**. W142'nin önbellekten hedef bulma düzeltmesi sıcak bağlantıyı karşılıyor; soğuk bağlantının hedef çözümünü bütünüyle çözmüş sayılmaz. ZIP onayı, düğme genişlikleri, dosya boyutu, iade gerekçesi ve kâğıt/token farkları yeniden bulgu yazılmadı; W144 KUSUR 2/5b kusur sayılmıyor.

### Bağımsız sınıf taraması (özet)

- **Yetki:** capability hesabı programdaki koordinatör olgusuna ve `company_admin`'e bağlı; üye rapor eylemi görmüyor; koordinatörün dönem/iş yükü/önizleme girişleri kapalı. W144 ham API kaydı: kendi görev/toplantısında 200, başka birimde 404, üyede 403. Koordinatör iş yükü denemelerinden biri 429 olduğundan o çağrı 403 kanıtı sayılmadı.
- **Bilet:** program başlığı, CSRF, POST hedefinde `member_ids`, anahtarsız bilet üretimi ve tek kullanımlı tüketim sözleşmeyle uyumlu; söküm/kapsam/oturum iptali için kod ve test tanıkları var; yeni bulgular kayıt değişimi ve sayaç yaşamıyla sınırlı.
- **Modül/faz:** bağlamalar `public.ts` üzerinden; doğrudan `reports → work` bağı kaldırılmış (mevcut sınır testi dolaylı döngüsüzlüğü kanıtlamıyor, çalışma kusuru çıkarılmadı); iki rapor rotasının gövdesi mevcut; `/raporlar` ve menü öğesi yok.
- **Pin:** backend pini `v0.15.0-api`; token kaynak blob'u `75d4a46f14e97718c2de934d34f60580352bcc93` ile eşleşti; `generate()` çıktıları üç üretilmiş token dosyasıyla birebir aynı; üretim kaynaklarında ham hex yok; lint sınırlarında O4 gevşetmesi yok.

## Koşulların kapanışı

Atamalar: **W146** (E-01, E-02, E-05, E-06; reports), **W147** (E-03, E-04, K-01, KUSUR 4 mercek liste/sayaç süzgeci; home/work), **W148** (K-02: `smoke`/`two-tabs` gerçek backend nedeni; 390 px 404 URL'si W147 dumanında yakalanır). W146 (#132, main `6c7a66c`) ve W148 (#131) main'de (`4859b81`); W146 varsayımları kabul: 404 → `collaboration.meetings` geçersizlenir, `report.meeting` geçersizlenmez (döngü önlenir). W146 4617 test; duman 429/404 rotaları 0/0/0 (kanıt `.git/koordinator/web6-w146/`). W148: K-02'nin nedeni **test donanımı**: `global-setup` her koşumda yeni program yaratır; 2 programlı DB'de program seçici kendiliğinden açılır ve saydam `side-scrim` tıklamaları yakalar — istemci/backend kusuru değil. Tohum idempotent yapıldı; gerçek backend e2e 5/5 yeşil (taze DB + yeniden kullanım); README fixture notu. 

| Bulgu | Kapanış | Hash / PR |
| --- | --- | --- |
| CX-F6-E-01 | W146 | kapandı — W146 PR #132, `a10e6fd` (düğme kimliği `kind` + `targetId` + `memberIds`; değişince iptal + epoch; bağlama noktalarının hepsi tek bileşen), main `6c7a66c` |
| CX-F6-E-02 | W146 | kapandı — W146 PR #132, `8f39011` (`bindGateToSession`; hesap/nesil değişiminde reset, refresh korur; `gate-session.test`) |
| CX-F6-E-03 | W147 | kapandı — W147 PR #133, `0158c07` (`useRoleLoad` partial/scope/loaded/loadMore; `ScopeNote` "Yalnız ilk N görev yüklendi" + Devam et/Yeniden dene; Ü1 "Tümü N" sunucu sayacından, yoksa "≥N"; takvim/kırılım/K1 şerit-ekip yükü-dikkat kuyruğu kısmi kümede "≥"; `role-partial.test`, `ScopeNote.test`; tavan 5 sayfa korunur, aşmak kullanıcı eylemi) |
| CX-F6-E-04 | W147 | kapandı — W147 PR #133, `9a5f4b6` (K1 kişi başı açık = açık-atama kümesi, `baslanmadi` dahil; sıralama; `k1-model.test`) |
| CX-F6-E-05 | W146 | kapandı — W146 PR #132, `227e832` (ortak `applyCooldown`; başlıklı 429 sayaç; başlıksız 429/503/500 sayaç yok; 01f tekrar + PDF kapalı; otomatik istek yok) |
| CX-F6-E-06 | W146 | kapandı — W146 PR #132, `f9b9df1` (`useMeetingGone`: 404 → toplantı listesine `replace`, `meetings.all` geçersiz, tek bildirim; 01g araç çubuğu PDF düğmesine eksik 404 işleyicisi; 500 kapatmaz) |
| CX-F6-K-01 | W147 | kapandı — W147 PR #133, `917fbb9` (`setTimeout(50)` kalktı; `settleQueries`) |
| CX-F6-K-02 | W148 (+ koordinatör: CI/HEAD bağı) | kapandı (neden) — W148 PR #131, `e9b838a`/`148f2ef`; "HEAD CI sonucu" satırı kapanış PR CI'sı ile kapanır |
| KUSUR 4 mercek listesi | W147 | kapandı (doğrulama) — W147: süzgeç kaynakta zaten vardı, kod değişmedi; tanık `home-lens-filter.test.ts` (5) |

### W147 sonucu (PR #133, main `47739fe`)

- **KUSUR 4:** süzgeç kaynakta **zaten var**, kod değişmedi. Tanık `home-lens-filter.test.ts` (5 test): `company_admin` koordinatör merceğinde 03 liste/sayaç/rozet istekleri `department_id=X`, üye merceğinde `assignee_account_id=ben`; **Düzeltme (tur 2 K-09):** "W144 ham izi eski imajdan" açıklaması geçersizdir; W144 betiği gezinme sonrası Admin merceğine dönmüştü (aşağıda). P53 metniyle çelişki yok. Derin bağlantı: admin merceğinde panel açılır (görevin kendi birim başlığıyla); koordinatör merceğinde seçili birimden çözülür → sunucu 404 → panel kapanır (P1 korunur). Kalan **açık UX sorusu** yalnız: yönetici merceğinde başka birimin görevini derin bağlantıyla açabilmesi istenir mi.
- **K-02 390 px konsol 404:** `GET /v1/work-items/w3` — duman betiğinin sahte `/v1`'inde tanımsız uç (K1 "Süre uzat" talep satırı görev ayrıntısı); ürün hatası değil, kapandı.
- Varsayım kabul: tavan 5 sayfa korunur. CI notu: `archive/api/lifecycle.test.ts` 5 sn zaman aşımıyla bir kez düştü (W147 dışı), rerun yeşil.

**Bütün tur 1 koşulları (E-01…06, K-01, K-02) kapandı.** K-02'nin "HEAD CI sonucu" ayağı kapanış PR CI'sı ile kapanır.

## Tur 2 — 2026-11-14, HEAD d98b409

HEAD: `d98b4095e27c737d55c09fcae7520d9d2afbea8e`

**KOŞULLU UYGUN.** İncelenen yollarda engelleyici yetki sızıntısı, pin uyumsuzluğu veya oturum değişiminden sonra dosya kaydetme kusuru saptanmadı. İki davranış boşluğu ve bir kanıt açıklaması kapanıştan önce giderilmeli. **F6 kapanmış sayılmaz.** Codex dosya değiştirmedi, test yazmadı/koşmadı (corepack salt okunur ortamda önbellek oluşturamadı; güncel HEAD için test/CI yeşil iddiası yok), push/PR yapmadı.

### Tur 1 kapanışlarının denetimi (kod ve test gövdeleri; bu turda test koşumu değil)

| Bulgu | Tur 2 sonucu |
| --- | --- |
| E-01 | Kayıt kimliği değişiminde iptal ve eski sonuç yayımını kesen epoch var; bilet/tüketim beklerken A→B ve B'nin bağımsız indirmesi testleri anlamlı |
| E-02 | `bindGateToSession` hem indirme hem ağır okuyucuda bağlı; sahte saatli hesap değişimi, kilit/kuyruk temizliği ve refresh korunumu testleri anlamlı (üretim bağı kaynakta ayrıca doğrulandı) |
| E-03 | Ü1 ikinci sayfa hatası, altıncı sayfadaki öncelikli görev, devam yolu ve sayaç yokluğunda `≥` testleri anlamlı; K1 birleşik hata boşluğu E-07'de |
| E-04 | Açık toplam `mine.length` üzerinden; başlamamış, sıra, tamamlananların dışlanması, çoklu atama testleri eski hesabı yakalar |
| E-05 | `applyCooldown` ortak; başlıklı/başlıksız yanıtlar, bitimde otomatik istek olmaması, aynı sayfada tekrar/PDF kilidi sınanıyor; yeniden açılış boşluğu E-08'de |
| E-06 | İlk GET 404, sonradan yeniden okumada 404 ve PDF tüketiminde 404 için kapatma yolu var; 500 ayrı; `useMeetingGone` listeyi geçersizleyip `replace` + bildirim işletiyor |
| K-01 | Sabit 50 ms bekleme kalktı; test uçuşta olduğunu, yanıt salındıktan sonra bittiğini ve bildirim çıkmadığını denetliyor |
| K-02 | W148 neden kaydı ve ham yeşil koşum (`expected=5`, `unexpected=0`, `skipped=0`, `flaky=0`); idempotent tohum yeni program eklemiyor; güncel HEAD CI bağı ayrı kapanış koşulu |

### Yeni bulgular

| Bulgu | Önem | Konum | Bağ | Atanan | Durum |
| --- | --- | --- | --- | --- | --- |
| CX-F6-E-07 K1 sayaç hatası kısmi listeyi sürdürme yolunu da kapatıyor | Orta | `src/modules/home/pages/CoordinatorHomePage.vue:88`, `src/modules/home/components/k1/UnitStrip.vue:155` | P4, ortak-kurallar §10, KESİN 21; E-K1-07/14 | W149 | kapandı (W149) |
| CX-F6-E-08 Önizlemeyi yeniden açmak ortak 429 beklemesini aşabiliyor | Orta | `src/modules/reports/api/queries.ts:69`, `src/modules/reports/model/gate.ts:71` | REPORTING-K10, E-13-40/69/70 | W149 | kapandı (W149) |
| CX-F6-K-09 W144 KUSUR 4 izinin "eski imaj" açıklaması doğru kanıtlanmış değil | Orta | `docs/backend-eksikleri/rapor-F6.md` (~satır 76), `web6-w144/betik/pw.mjs:18`, `deeplink7.mjs:18–21` | P1/P53, kanıt izlenebilirliği | W143 | kapandı (W143 `4d52719`) |

**CX-F6-E-07.** Sayaç ilk okumada başarısız olurken görev listesi ilk sayfayı yükleyip sonraki sayfada hata alır veya beş sayfa tavanına ulaşırsa `summary=null` olur ve listeyi sürdüren tek etkileşimli `ScopeNote` gizlenir; diğer kartlardaki notlar `compact` olduğundan eylem sunmaz. Görünen "Yeniden dene" yalnız sayaç sorgusunu yeniler; ayrıca onay kartı `approvals.length` değerini kesin sayı gösterir. *Düzeltme:* liste kapsamını ve devam/yeniden deneme eylemini sayaç başarısından bağımsız çizmek; kesin sayaç yoksa kısmi türevleri alt sınır olarak göstermek. *Doğrulama:* K1'de sayaç hatası + sonraki sayfa hatası ve sayaç hatası + beş sayfa tavanı ayrı sınanmalı; liste eylemi görünmeli, aynı imleci sürdürmeli (mevcut `role-partial.test.ts` K1 senaryosu başarılı sayaç kullanıyor).

**CX-F6-E-08.** 01f başlıklı 429 aldıktan sonra sayaç sürerken "Kapat" → Arşiv → "Önizle" yapılırsa yeni gözlemde sorgu etkin ve bayattır; `acquireWhenFree()` yalnız mevcut kiralamaya bakar, `cooldown` denetlemez; PDF düğmesi "Bekleyin" gösterirken ikinci ağır GET başlayabilir. *Düzeltme:* ağır okuyucunun başlatılmasını da ortak bekleme politikasına bağlamak; sayacın bitmesi kendiliğinden istek başlatmamalı. *Doğrulama:* sahte saatle 60 sn'lik 429 sonrası önizlemeyi söküp yeniden aç; süre dolmadan GET sayısı artmamalı, dolunca da otomatik istek olmamalı, açık yeniden deneme tek istek üretmeli.

**CX-F6-K-09.** W144 betiği K/Ü merceğini seçip mercek/kabuk kaydını alıyor, ardından `page.goto` yapıyor; ortak başlangıç betiği yeni belgede yönetici personasının `scope.lens=admin` tercihini yeniden yazıp departmanı kaldırıyor. Rapor, gezinme öncesi K/Ü etiketini ve gezinme sonrası Admin isteklerini birleştirmişti: süzgeçsiz istekler K/Ü davranışının tanığı değildir. `a3b31e3…HEAD` arasında ilgili liste/rozet/hedef dosyalarında fark da yok; "eski imaj" gerekçesi geçersiz. *Düzeltme (yapıldı):* [rapor-F6 §5](../backend-eksikleri/rapor-F6.md), ilerleme ve bu belgede açıklama düzeltildi; `dogrulama-F6.md` W144'ündür, dokunulmadı; W144 §4 K/Ü merceği kanıtı sayılmaz. *Kalan borç:* gerçek backend'de mercek parametreleri, tercihleri yeniden yazmayan başlangıçla, gezinme SONRASI kayıt ([ilerleme #23](../yurutme/web-6/ilerleme.md)).

### KUSUR 4 değerlendirmesi (tur 2)

`home-lens-filter.test.ts`, yönetici K merceğinde `department_id`, Ü merceğinde `assignee_account_id=ben` parametrelerini liste ve sayaç isteklerinde denetliyor; parametreler kalkarsa test kırılır — **liste/sayaç merceği için anlamlı tanık**. Ancak **sahte sunucudur**, gerçek backend tanığı değildir ve yönetici Ü merceğinde dolu veriyle sayısal liste/rozet eşitliğini ayrıca kanıtlamaz. Yönetici sayfasının/menüsünün korunması ve rapor düğmesi P1/P53 ile tutarlı; başka birim panelinin açılması yetki sızıntısı değildir. Soğuk bağlantıda hedef birimin bulunamayıp seçili birime düşmesi **hedef/kapsam çözümleme UX borcudur** (önbellek düzeltmesi bunu bütünüyle kapatmaz); yönetici yetkisini daraltmak çözüm değildir ([ilerleme #22](../yurutme/web-6/ilerleme.md), [web-7 soru 6](../yurutme/web-7/README.md)).

### Kanıt sınırları (tur 2)

- Ham dumanlar (W146 12, W147 32 kayıt) "bütün konsol hataları sıfır" diye **sunulmamalı**: W147'de `GET /v1/work-items/w3` 404 sahte uç eksiğidir; kısmi küme senaryolarındaki 500'ler kasıtlıdır. Doğru ifade: "konsol: sahte uç 404 + kasıtlı 500; CSP/pageerror 0".
- Güncel HEAD için test/CI yeşil iddiası yok; HEAD CI sonucu kapanış PR'ında. Codex test koşmadı (corepack salt okunur).
- W144 gerçek Docker/backend matrisi, W148 gerçek e2e koşumu ve sahte `/v1` dumanları farklı kanıtlardır. Gerçek 503 kapasite tanığı, VoiceOver ve kullanıcı görsel onayı yok. `../program/` bulunamadı; satır satır/PNG kapsamı iddiası yok.
- Sınıf taraması (yetki, bilet/yaşam, modül/faz, pin) yeni somut kusur çıkarmadı; sınır testi dolaylı bütün import döngülerini kanıtlamıyor.

Atama: **W149** (E-07, E-08). K-09 belge düzeltmesi W143 `4d52719` ile yapıldı.

### W149 sonucu (PR #134, main `c18d4ab`, CI ilk koşumda yeşil)

E-07 `037548e` ve E-08 `c464cad` kapandı. Kapı 664 dosya / 4633 test; duman K1 sayaç hatası senaryosu + 01f × 3 genişlik × iki tema: taşma, CSP, pageerror 0; konsol listelendi (kasıtlı 500'ler, sahte uç 404: `work-items/w3`, `reports/dashboard`) — "konsol hatası 0" diye sunulmaz. Kanıt `.git/koordinator/web6-w149/` (yerel). **Uygulama notu:** sayaç denetimi `useReportSeason` içindedir, `acquireWhenFree` değişmedi; gelecekte eklenecek ağır okuyucu aynı denetimi kendisi yapmalıdır. **Tur 2 koşullarının hepsi kapandı.**

| Bulgu | Kapanış | Hash / PR |
| --- | --- | --- |
| CX-F6-E-07 | W149 | kapandı — W149 PR #134, `037548e` (`UnitStrip` ScopeNote sayaç durumundan bağımsız; "Yeniden dene" sayaç, ScopeNote eylemi liste, aynı imleç; `ApprovalsCard` kesin sayaç yokken "≥N"; `role-partial.test` K1 iki senaryo: sayaç hatası + 2. sayfa hatası / + 5 sayfa tavanı), main `c18d4ab` |
| CX-F6-E-08 | W149 | kapandı — W149 PR #134, `c464cad` (`useReportSeason` `gate.cooldown>0` iken ağa çıkmaz, istemci kaynaklı sayaçlı `export_in_progress`; Kapat → Arşiv → Önizle ikinci GET yok; sayaç bitince otomatik istek yok, "Yeniden dene" tek istek; `queries.test` + `reports-season-preview` entegrasyon) |
| CX-F6-K-09 | W143 belge düzeltmesi | kapandı — W143 `4d52719` |

## Tur 3 (nihai) — 2026-11-14, HEAD 0c56f7d

HEAD: `0c56f7d73220b2a16b953de5f90d4bcd2c52324f`

**UYGUN — Tur 3 nihai salt okunur hükmü.**

İncelenen kapsamda F6 kapanışını engelleyen yeni yetki, pin veya yaşam döngüsü kusuru saptanmadı. Tur 2 koşulları kapanmış. **Codex notu (aynen):** bu hüküm, güncel HEAD'in CI'sının doğrulandığı veya F6'nın süreç bakımından kapandığı anlamına gelmez; kapanış PR'ının CI ve birleşme adımları ayrıca tamamlanmalıdır. Codex dosya değiştirmedi, uygulama/test yazmadı, test veya geri-alma deneyi koşmadı, push/PR yapmadı; çalışma ağacı temiz kaldı.

### Tur 2 kapanışlarının doğrulanması (kod ve test gövdesi denetimi)

| Bulgu | Kod ve test değerlendirmesi |
| --- | --- |
| E-07 kapandı | `UnitStrip.vue:156` kapsam notunu sayaç başarısından bağımsız çiziyor; `CoordinatorHomePage.vue:174` kesin sayaç yokken kısmi onay sayısını `≥N` gösteriyor; `role-partial.test.ts:192` ve `:227` sayaç hatası + ikinci sayfa hatası ve beş sayfa tavanını ayrı kuruyor, `c2`/`c6` imlecinden devamı, sayaç sorgusundan bağımsızlığı ve yeni görevlerin görünmesini denetliyor; düzeltme geri alınırsa beklentiler kırılır |
| E-08 kapandı | `queries.ts:81` ve `:84` hem kilide girmeden önce hem sıradan çıktıktan sonra beklemeyi denetliyor (ikinci yolda kiralama bırakılıyor); `queries.test.ts:143` ve `reports-season-preview.test.ts:65` söküp yeniden açılışta GET sayısının artmamasını, süre sonunda otomatik istek olmamasını ve açık yeniden denemenin tek istek üretmesini sınıyor |
| K-09 kapandı | `rapor-F6.md` §5 ve ilerleme doğru açıklamayı taşıyor; ham `pw.mjs:18–31` her yeni belgede persona tercihini yeniden yazıyor, `deeplink7.mjs:18–21` K/Ü kaydından sonra `page.goto` yapıyor; W144'ün bu izi K/Ü merceğinin tanığı değildir, "eski imaj" açıklaması kullanılmaz |

### W149 regresyon taraması ve bağımsız sınıflar

- **Yaşam döngüsü:** W149 indirme yeniden düzenlemesini, kayıt değişimi iptalini veya `bindGateToSession` bağlarını değiştirmiyor; `useReportDownloads`, `applyCooldown`, `useMeetingGone`, `sessionBound` ve sinyal zincirinde önceki kapanışları yeniden açacak regresyon yok; yeni bekleme hatası ağı kullanmıyor ve sayacı yeniden başlatmıyor.
- **Kısmi kümeler:** `useRoleLoad` ve `ScopeNote` devam yolu korunmuş; E-07 düzeltmesi sayaç hatasında bu yolu erişilebilir yapıyor, K1/Ü1'in mevcut kapsam etiketlerini kaldırmıyor.
- **Yetki:** üyede rapor eylemleri gizli; koordinatörde dönem/iş yükü ve önizleme kapalı; görev/toplantı PDF görünürlüğü seçili programdaki koordinatörlük olgularına bağlı; yönetici merceği yetkiyi kaldırmıyor; REPORTING-K01/K07 ile yeni uyumsuzluk yok.
- **Bilet:** program başlığı, CSRF, POST hedefinde `member_ids`, anahtarsız üretim ve hemen tüketim korunmuş; bilet sonucu sıfırlanıyor; iptal edilen tüketim dosya kaydetmiyor.
- **Modül/faz:** bağlamalar `public.ts` üzerinden; doğrudan `reports → work` bağı yok; iki rapor rotasının gövdesi mevcut; `/raporlar` ve menü öğesi yok; açıklamasız gövdesiz parça yok.
- **Pin:** backend pini `v0.15.0-api`; token kopyasının blob'u `75d4a46f14e97718c2de934d34f60580352bcc93`; salt okunur `generate()` karşılaştırmasında üç üretilmiş dosya birebir eşleşti; W149 lint/boyut kurallarını gevşetmiyor.

### KUSUR 4 nihai yorumu

`home-lens-filter.test.ts:65–118`, gerçek router/kabuk üzerinden koordinatör liste ve sayaçlarında `department_id`, üye merceğinde `assignee_account_id=ben` gönderimini denetliyor; süzgeçsiz isteğe dönüş bu beklentileri kırar. **Liste/sayaç merceğini kanıtlıyor; gerçek backend tanığı değildir.** Yöneticinin kendi yetkisiyle başka birim kaydını açması ve rapor düğmesini görmesi P1/P53'e aykırı değildir. Soğuk `?gorev=` bağlantısında hedefin seçili birime düşmesi **hedef kapsamını çözümleme sınıfında UX borcudur**: `work/api/queries.ts:227–230` yalnız yüklenmiş/önbellekteki satırlardan gerçek birimi bulabiliyor. Yetki sızıntısı veya W149 regresyonu sayılmaz; kapanış sonrası borç ([ilerleme #22](../yurutme/web-6/ilerleme.md)).

### Yeni bulgu — kapanış sonrası borç

| Bulgu | Önem | Konum | Bağ | Durum |
| --- | --- | --- | --- | --- |
| CX-F6-K-10 Ham duman kanıtının üzerine yazılması | Düşük | `.git/koordinator/web6-w149/duman-k1.mjs:113`, `duman-01f.mjs:78` | KESİN 17/30, kanıt izlenebilirliği | **kapanış sonrası borç** ([ilerleme #25](../yurutme/web-6/ilerleme.md)); F6 kapanışını engellemez |

İki betik aynı `results.json`'a yazıyor; dosyada yalnız 01f'nin 12 kaydı var, K1 ölçümleri ham kayıttan doğrulanamıyor (K1 PNG'sinde sayaç hatası, kapsam notu, yeniden deneme ve `≥` görülebiliyor). Ürün davranış kusuru değildir. *Düzeltme:* senaryo başına ayrı sonuç dosyası ve HEAD/koşum kimliği. *Doğrulama:* iki duman sırayla koşunca iki senaryonun ölçümleri de kalıcı kalmalı. Öneri: [web-7](../yurutme/web-7/README.md) ortak sözleşme/KESİN kuralı — "duman betikleri senaryo başına ayrı results dosyası".

### Kanıt sınırları (tur 3)

- Güncel HEAD için test/CI yeşil iddiası yok (GitHub API bağlantısı kurulamadı); **HEAD CI kapanış PR'ındadır**.
- W144 gerçek Docker/backend matrisi, W148 gerçek e2e neden/yeniden kullanım kaydı ve sahte `/v1` dumanları ayrı kanıttır; idempotent tohum eşleşen tek programı yeniden kullanır, kirli DB'de açık hata verir.
- Gerçek backend'de gezinme **sonrası** K/Ü mercek-parametre tanığı eksik ([ilerleme #23](../yurutme/web-6/ilerleme.md)). Gerçek 503 kapasite, VoiceOver ve kullanıcı görsel onayı doğrulanmış sayılmadı.
- Kasıtlı 500'ler ve sahte uç 404'leri nedeniyle dumanlar "konsol hatası sıfır" diye genellenemez.
- Bildirilmiş ZIP, dosya boyutu, iade gerekçesi ve tasarım sapmaları kapanış sonrası borçtur. `acquireWhenFree`'ın gelecekteki okuyuculara bekleme politikasını kendiliğinden uygulamaması mevcut F6 kusuru değildir.
- `../program/` belirtilen konumda yoktu; satır satır/PNG kapsamı iddiası yok.

## Koşulların kapanışı (özet)

| Tur | Hüküm | HEAD | Koşullar |
| --- | --- | --- | --- |
| 1 | KOŞULLU UYGUN | `633d9d2` | E-01, E-02, E-05, E-06 (W146 #132), E-03, E-04, K-01 (W147 #133), K-02 (W148 #131) — kapandı |
| 2 | KOŞULLU UYGUN | `d98b409` | E-07, E-08 (W149 #134), K-09 (W143 `4d52719`) — kapandı |
| 3 (nihai) | **UYGUN** | `0c56f7d` | koşul yok; CX-F6-K-10 kapanış sonrası borç |

**F6 KAPANDI.** Süreç bakımından kapanış, kapanış PR'ının CI'sı yeşil olup birleşince tamamlanır; kapanış PR'ı: bekliyor.
