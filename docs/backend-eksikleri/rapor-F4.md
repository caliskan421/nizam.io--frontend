# Backend devir raporu — F4 (WEB-4), 2026-11-11

**Durum:** kapanış hazırlığı; nihai kapı ve kapanış PR'ı bekleniyor. **Web pini:** `v0.15.0-api`, F4 boyunca yükseltilmedi. F5 açılmadı; aşağıdaki arşiv paketi yalnız sonraki fazın ihtiyaç devridir.

Kaynaklar: [kayıt](kayit.md), [F3 raporu](rapor-F3.md), [tespit paketleri](rapor-tespit-2026-11-08.md), [O1 yeterlilik](../yurutme/web-4/o1-backend-yeterlilik.md), [09 kabul tablosu](../ekranlar/09-toplantilar/README.md), [F4 ilerleme](../yurutme/web-4/ilerleme.md). Uç/alan önerileri sözleşme yayımlanana ve web pini yükselene kadar uygulama yetkisi değildir.

## 1. Sonraki fazın ihtiyaçları — önce arşiv

**BE-072 F5 engelleyicisidir.** Yönetici merceğinde keyfî ilk departmanı teknik başlık seçmek K2'yi aşar ve kabul edilmez. F5 başlatma onayı ayrıca gerekir; bu rapor ve hazırlık iskeleti onay yerine geçmez.

| Sıra / paket | Amaç ve BE | Uç / alan önerisi | Kabul |
|---|---|---|---|
| 1 · 5.1 | Yönetici arşivi kapsamı — BE-072 | Yönetici için açık S2 sözleşmesi veya doğru `department_id` alanları ve klasör süzgeci; `archiveAttachments`, `archiveTasks`, dosya işlemleri birlikte | Departman seçmeden program klasörü açılır; her dosya/görev doğru kapsamda okunur, indirilir ve yetkili eylem uygulanır; kapsam dışı erişim kapalı kalır |
| 2 · 5.2 | Dosya zamanı ve yükleyen adı — BE-070, BE-071 | Dosya listesine `created_at` ve nullable `uploaded_by_full_name`; uploaders için kırıcı olmayan ad alanı/yüzü | Satır başına kişi/görev fan-out olmadan tarih/ad; null kişi nötr, mevcut uploader kimliği sözleşmesi korunur |
| 3 · 5.3 | Klasör özeti ve süzülmüş toplam — BE-025, BE-073 | `ArchiveFolder` görev sayısı/bayt/son yükleme; dosya listesinde filtrelenmiş toplam | Klasör özeti ile dosya kümesi tutarlı; toplam için bütün dosyalar indirilmez; görünürlük toplamları da sınırlar |
| 4 · 5.4 | Etiket — BE-024, koşullu BE-074 | Ürün kararı sürerken kapalı `ister/plan/girdi/analiz/cikti/sonuc` kümesi; serbest etiket/etiket değiştirme ancak ayrı sözleşmeyle | Kapalı küme doğru Türkçe adlarla; desteklenmeyen oluştur/değiştir eylemi çalışıyor gösterilmez |
| 5 · 5.5 | Önizleme — BE-026 | Yetkili, boyutu sınırlı küçük resim/önizleme türevi ve bilet hedefi | Liste tam boy dosyaları fan-out ile indirmez; yetki ve güvenli içerik türü korunur |
| 6 · 5.6 | Koşullu arşiv — BE-069, BE-075, BE-076, BE-077 | Göreve bağsız yükleme/taşıma/silinenler/geniş arama ve ürün kapsamı tespit Paket 5.6 ile kararlaştırılır | Kalıcı dosya silme geri alınabilir diye gösterilmez; var olmayan taşıma/geri yükleme ucu uydurulmaz |

06 kabul tablosundaki varsayılanlar **geçici kabul (koordinatör)** olarak hazırlanır; ürün sahibi kararı sayılmaz. BE-072 çözülmeden F5 uygulaması hazır değildir. Backend paketinin kendi kapısı/etiketi gerekir.

## 2. F4'te değişen durumlar

| Kalem | Sonuç |
|---|---|
| Yeni BE kimliği | 0; W101–W109 yeni backend eksiği bildirmedi. Özel kişi seçicinin açılmış çizim eksikliği backend eksiği değildir |
| BE-060 | **Bağlandı**, v0.15 `Meeting.summary` (K70), W102/#90; satır başına detay fan-out yok |
| BE-021 | v0.15 `department_id/from/to` canlı; tarih sınırları dahil ve kurulum saat diliminde. Sekme toplamı/tarih sırası pinde yok; tüm sayfalar yüklenirken `n+`, tamamlanınca kesin sayım/sıra |
| BE-063 | v0.15 `deleted_by` canlı; diğer ad/kod alanları nötr veya mevcut katılımcı/departman verisiyle. Tam karşılandı denmez |
| BE-064 | v0.15 `Participant.teams` canlı; düz liste korunur. Çok ekipli gruplama ürün kararı açık; veri varlığı grup görünümünü onaylamaz |
| BE-067 | ŞY program filtreli listUsers; K yalnız koordine ettiği departmanların listMembers birleşimi, tekilleştirme ve kesilme uyarısı. Tam program aday kapsamı pinde yok |
| BE-068 | Oluşturma/gündem/katılımcı anahtarsız; belirsiz sonuçta kör tekrar yok. Bileşik katılımcı serisi ilk bağlamı taşır ve belirsizlikte durur |
| BE-061 / BE-065 | Not sayaçları yüklenen kümeden; dönüşmüş görev etiketi bağlantısız. Alan yokken görev departmanı tahmin edilmez |
| BE-036 | Pinli meetings README yetki kaynağı (P30); belge paketi bütünü kapanmış sayılmaz |

## 3. Yayımlanmış yeni backend etiketi ile web bağlantısını ayırma

`v0.16.0-api` uzak etiketi 2026-11-11'de doğrulandı; kaynak karşılaştırması `git diff v0.15.0-api v0.16.0-api -- docs/api/openapi.yaml` ve yeni etiketin meetings README'sidir. **Aşağıdaki alanlar web'in v0.15 pininde yoktur; F4 bunları tüketmez.** Yeni etiketin varlığı pin yükseltme yetkisi değildir.

| BE | v0.16 sözleşmesindeki karşılık | Web için sonraki adım |
|---|---|---|
| BE-021 | K79: `when`, `sort`, `total`, `tab_counts` | Ayrı pin yükseltmesinde sayfa/sekme/gece sınırı/filtre toplamı testleri; tüm sayfaları toplama yolunu ancak bu aşamada değiştir |
| BE-061 | K80: not `converted/author`, `total/counts` | Sunucu filtre ve sayaçları; URL ve yazar olgusu testleri |
| BE-063 | K81: `department_code`, `deleted`, `created_by_full_name`, `checked_by_full_name` | Nullable alanlar ve silinmiş departman kopyası; canlı departman kodundan farkını koru |
| BE-065 | K82: `converted_work_item_department_id` | Görev yetkisini ayrıca doğrula; null/eski dönüşüm ve sonradan aktarım (GAP-222) sınırını göster |
| BE-067 | K83: `listMeetingParticipantCandidates` | K/ŞY gerçek aday kümesi, sayfalama, mevcut katılımcı kilidi; eski kapsam uyarısını yalnız yeterli sözleşme bağlanınca kaldır |
| BE-068 | K84: üç oluşturma ucunda optional Idempotency-Key | Eylem başına anahtar, aynı anahtarlı izinli tek tekrar, fingerprint/yan etki/yaşam döngüsü; v0.15 uçlarına şimdiden anahtar ekleme |

BE-060 zaten v0.15'te karşılandığı için yeni etiketi beklememiştir. BE-064 gruplama ve koşullu toplu ekleme/video ürün kararları yeni alanlarla kendiliğinden kapanmaz. BE-036 toplantı belge ilerlemesi ayrı incelenir; diğer maddeler açık kalır.

## 4. F4 doğrulama ve kalan borçlar

W107 gerçek bileşen turunda 403/404 sonrası güvenli listeye dönüş ve not silme sonrası odak kusurları giderildi; kapsam/oturum/söküm yarışları sınandı. W108 aktarım mercek/geç409, 05 odak, G1/G2; W109 gerçek Gantt tutamaç/klavye/gözlemci temizliği ve ek alt görev/pano entegrasyonu tamamladı. `total_admins` UI'da gösterilmez; yalnız kart ve gerçek sorgu/önbellek değişimi kanıtlıdır.

O4 gerçek Docker/backend tanığı, G4 429, nihai Codex hükmü ve kapanış PR'ı henüz bekleniyor; sonuçlar kapanışta buraya bağlanacak. Gerçek VoiceOver ve E-03C-27/41 ürün sahibi görsel onayı otomatik doğrulanmış sayılmaz.

Video şeridi, Canlı/Bekliyor, 09d/09e ve sağlayıcı adı P21/P22 gereği gizlidir; dosya F4 dışıdır. F5 bu raporla açılmaz.
