# WEB-6 — Codex nihai kapı

Faz: F6 (raporlar, yönetici panosu, K1/Ü1, rol menüleri). Codex gpt-6.1-sol medium, `-s read-only`. Hüküm durumu: **tur 1 KOŞULLU UYGUN; tur 2 bekliyor; F6 KAPANMADI.** Ham çıktı koordinatör kaydındadır (`.git/koordinator/web6-codex-tur1.md`, yerel).

## Tur 1 — 2026-11-14, HEAD 633d9d2

HEAD: `633d9d22f7be472e417e75d583658231b0cf1fa2`

**KOŞULLU UYGUN**

İncelenen akışlarda engelleyici yetki sızıntısı, API/token pini uyumsuzluğu veya oturum değişiminden sonra dosya kaydetme kusuru saptanmadı. Aşağıdaki davranış ve doğrulama sorunları kapanıştan önce giderilmeli. Bu hüküm "F6 kapandı" anlamına gelmez. Codex dosya değiştirmedi, test yazmadı, push/PR yapmadı; çalışma ağacı temiz kaldı.

## Bulgular

| Bulgu | Önem | Konum | Bağ | Atanan | Durum |
| --- | --- | --- | --- | --- | --- |
| CX-F6-E-01 Kayıt değişince devam eden rapor sonucu yeni kayda taşınabiliyor | Orta | `src/modules/reports/components/ReportActionButton.vue:100`, `src/modules/reports/pages/MeetingReportPage.vue:87` | E-13-47/68/74, KESİN 26 | W146 | kapandı (W146) |
| CX-F6-E-02 Hesaba ait bekleme sayacı sonraki hesaba kalıyor | Orta | `src/modules/reports/model/gate.ts:98`, `src/modules/reports/api/cancellation.ts:25` | REPORTING-K09/K10, E-13-69/70 | W146 | kapandı (W146) |
| CX-F6-E-03 Ü1 eksik kümeyi tam küme gibi sunuyor | Orta | `src/modules/home/api/role/use-role-load.ts:16`, `src/modules/home/pages/MemberHomePage.vue:132` | P4, ortak-kurallar §10, KESİN 21; E-Ü1-09/10/25–27/31 | W147 | açık |
| CX-F6-E-04 K1 kişi başı açık görev sayısı başlamamış atamaları dışlıyor | Orta | `src/modules/home/model/k1/team.ts:65` | E-K1-08/27/28, KESİN 21 | W147 | açık |
| CX-F6-E-05 Ağır önizlemenin 429 yanıtı ortak bekleme politikasına katılmıyor | Orta | `src/modules/reports/api/queries.ts:58`, `src/modules/reports/pages/SeasonReportPage.vue:82` | REPORTING-K10, E-13-39/40/69/70 | W146 | kapandı (W146) |
| CX-F6-E-06 01g'de 404, kabul edilen kayıp-kayıt akışını işletmiyor | Orta | `src/modules/reports/pages/MeetingReportPage.vue:98`, `src/app/__tests__/integration/reports-meeting.test.ts:163` | E-13-73, 13 mekanizma §2 | W146 | kapandı (W146) |
| CX-F6-K-01 Yeni testte gerçek zaman beklemesi var | Düşük | `src/modules/home/components/k1/use-role-writes.test.ts:149` | KESİN 11/26(c) | W147 | açık |
| CX-F6-K-02 Belge ve kanıt sınırları (CI/HEAD bağı, gerçek e2e, 404 URL'si) | Orta | `docs/yurutme/web-6/oturum-4-kapanis.md:25`, `docs/backend-eksikleri/rapor-F6.md` §7, W142/W144/W145 kayıtları | kanıt izlenebilirliği | W148 (+ koordinatör CI) | W148 kapandı; HEAD CI → kapanış PR CI'sı ile kapanır |
| KUSUR 4 yorumu: mercek liste/sayaç süzgeci doğrulanmalı | — (karar kaydı yetmez) | Ü/K merceğinde 03 listesi/sayaç | P1/P53 | W147 | açık |

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

Atamalar: **W146** (E-01, E-02, E-05, E-06; reports), **W147** (E-03, E-04, K-01, KUSUR 4 mercek liste/sayaç süzgeci; home/work), **W148** (K-02: `smoke`/`two-tabs` gerçek backend nedeni; 390 px 404 URL'si W147 dumanında yakalanır). W146 (#132, main `6c7a66c`) ve W148 (#131) main'de (`4859b81`); W146 varsayımları kabul: 404 → `collaboration.meetings` geçersizlenir, `report.meeting` geçersizlenmez (döngü önlenir). W146 4617 test; duman 429/404 rotaları 0/0/0 (kanıt `.git/koordinator/web6-w146/`). W148: K-02'nin nedeni **test donanımı**: `global-setup` her koşumda yeni program yaratır; 2 programlı DB'de program seçici kendiliğinden açılır ve saydam `side-scrim` tıklamaları yakalar — istemci/backend kusuru değil. Tohum idempotent yapıldı; gerçek backend e2e 5/5 yeşil (taze DB + yeniden kullanım); README fixture notu. W147 (E-03, E-04, K-01, KUSUR 4) bekliyor.

| Bulgu | Kapanış | Hash / PR |
| --- | --- | --- |
| CX-F6-E-01 | W146 | kapandı — W146 PR #132, `a10e6fd` (düğme kimliği `kind` + `targetId` + `memberIds`; değişince iptal + epoch; bağlama noktalarının hepsi tek bileşen), main `6c7a66c` |
| CX-F6-E-02 | W146 | kapandı — W146 PR #132, `8f39011` (`bindGateToSession`; hesap/nesil değişiminde reset, refresh korur; `gate-session.test`) |
| CX-F6-E-03 | W147 | açık |
| CX-F6-E-04 | W147 | açık |
| CX-F6-E-05 | W146 | kapandı — W146 PR #132, `227e832` (ortak `applyCooldown`; başlıklı 429 sayaç; başlıksız 429/503/500 sayaç yok; 01f tekrar + PDF kapalı; otomatik istek yok) |
| CX-F6-E-06 | W146 | kapandı — W146 PR #132, `f9b9df1` (`useMeetingGone`: 404 → toplantı listesine `replace`, `meetings.all` geçersiz, tek bildirim; 01g araç çubuğu PDF düğmesine eksik 404 işleyicisi; 500 kapatmaz) |
| CX-F6-K-01 | W147 | açık |
| CX-F6-K-02 | W148 (+ koordinatör: CI/HEAD bağı) | kapandı (neden) — W148 PR #131, `e9b838a`/`148f2ef`; "HEAD CI sonucu" satırı kapanış PR CI'sı ile kapanır |
| KUSUR 4 mercek listesi | W147 | açık |

## Tur 2

**Bekliyor.** W146/W147/W148 birleşip bulgu durumları işlendikten sonra koşar.
