# O1 — Backend yeterlilik kararı (W100)

2026-11-11 · Ürün sahibi F4 geçişini bu oturumda onayladı. Ana pin **v0.15.0-api**, değiştirilmedi. Aşağıdaki sonuçlar backend deposunda `git show v0.15.0-api:docs/api/openapi.yaml` ve `git show v0.15.0-api:internal/modules/meetings/README.md` üzerinden doğrulandı. `v0.16.0-api` etiketi yerelde var; aşağıdaki yetenekler yalnız v0.15 kanıtıdır.

## S3 — özel kişi seçici ve adaylar

P23 özel kişi seçici kararını korur. `docs/tasarim/kaynak/Toplanti-Formlar.dc.html` Kişiler kip düğmesini, `Toplanti-Detay.dc.html` Ekle düğmesini çiziyor; toplantıya özgü seçicinin açılmış yüzü kaynakta bulunamadı. Ortak seçiciye sessiz dönüş yetkisi yok: özel yüzün görünümü belirsiz ve ürün kararı tam görsel kanıtla uygulanamıyor.

K21 adayın canlı hesap ve seçili programda ekip satırı olmasını ister. OpenAPI `listUsers` (`GET /v1/admin/users`, S1) yalnız şirket yöneticisine açık; `program_id` süzgeci ve imleçle program ekibindeki canlı hesaplar aday yapılabilir. `listMembers` (`GET /v1/departments/{id}/members`, S2) ŞY veya seçili programda o departmanın koordinatörüne açık; koordinatör yalnız kendi koordine ettiği departmanların ekiplerini okuyabilir, hesap kimliğine göre tekilleştirmeli ve `X-Result-Truncated` varsa eksikliği göstermelidir. Bu güvenli sınırlı seçim mevcut kabulün sınırı içinde uygulanabilir; yönetici için yeterli, koordinatörün başka departmanlardaki uygun adayları için yetersizdir (BE-067). Aday kaynağı erişimi genişletmez; gönderimde sunucu yeniden doğrular. Koordinatör için tam kişi seçimi BE-067 çözülene kadar eksiktir; sahte aday veya yetkisiz istek yok.

## S4 — person kipi ve yetki

OpenAPI `CreateMeetingRequest`, `UpdateMeetingRequest`; meetings README K16/K19/K21/K73/K74: kuruluşta `invite_mode: person`, tam bir sahip `department_ids`, isteğe bağlı `participant_ids` gönderilir; `members_included: true` yasak. Kip değişmez; person PATCH'inde `department_ids` ve `members_included: true` yasak. ŞY veya sahip departmanın K'si oluşturur. `person` yönetimi ŞY veya **oluşturan ve sahip departmanı hâlâ koordine eden** kişiye aittir; koordinatörlüğü kaybeden katılımcı üye düzeyine iner, katılımcı değilse görünürlük maskesi uygulanır. Departman bağı başkalarına görünürlük vermez. İki kipte de katılımcı toplantıyı görür ve not yazabilir; `coordinatorship` katılımcısı için departman bağı gerekmez. `coordinatorship` katılımcı yönetimi yalnız bağlı K'ye açıktır (K olmayan ŞY dahil reddedilir); `person` için ŞY ve yukarıdaki oluşturan yönetir. Gündem, toplantı yazımı ve nottan görev person yönetimiyle sınanır; hedef departmanda K34 ayrıca uygulanır. İstemci gizlemesi güvenlik değildir; 403/404 sunucu sonucudur. K16/K21/K26 için GAP-069 test sınırı sürer.

## S9 — liste filtreleri

OpenAPI `listMeetings` ve K71: `department_id`, `from`, `to` isteğe bağlıdır; tarih `YYYY-MM-DD`, iki uç dahil, kurulum saat dilimi takvim günüdür. Filtreler görünürlükle AND daraltır; olmayan/görünmeyen departman boş sayfa, geçersiz aralık 422. İmleç aynı filtrelerle kullanılır; sıra `created_at`, `id` en yeni önce, toplantı tarihi değil. Tarih sırası ve toplam sunucuda yok: ilgili filtre kümesinin bütün sayfaları alınmadan kesin sayı/sıra söylenmez (BE-021). `summary` K70 ve katılımcı `teams` K72 pinli yanıtta vardır; video F4'te gizlidir.

## Sonuç ve W101'e kesin yön

F4 geçişi onaylıdır; pinli API kişi kipini, görünürlük/yazma matrisini ve tarih/departman filtrelerini destekler. **Tam koordinatör aday kapsamı ve P23 seçicisinin çizimi eksik:** bu kapsam için BE-067 ve aşağıdaki tasarım referansı eksikliği çözülmeden tam uygunluk iddia edilmez. W101 ayrı capability olguları kurmalı: `coordinatorship` bağlı K ve `person` sahip K olan oluşturanı ayırmalı, katılımcı görünürlüğünü iki kipte sınamalı; `viewer_role` tek başına tüm katılımcı yönetim ayrımının yerine geçmez. Admin adayları `listUsers?program_id=…`, K adayları yalnız yetkili `listMembers` alt kümesi; kesilme ve kısmi kapsam açık gösterilir. `listMeetings` filtreleri sorgu anahtarı ve her imleç isteğine taşınır, filtre değişince imleç sıfırlanır. W107 bu matris, gerçek özel seçici ve URL/filtre etkileşimini taslaksız sınar.

Tasarım referansı eksik (backend BE değil): 09c / 09b P23 özel kişi seçicinin açılmış yüzü bulunamadı. S3 UI kabulü açıktır; ortak seçiciye sessiz geçilmez. S4/S9, BE-067 kapsam sınırıyla yeterlidir. W101 veri katmanı görseli beklemeden hazırlanabilir; O1 PR kapısı açık kalır.

## Pinli alanlar

OpenAPI `Meeting.summary` K70 `agenda_total`, `agenda_checked`, `note_count`, `participant_count`; `Participant.teams` K72 departman/rol; silinen liste `deleted_by` K77 ad/kimlik (eski satırda null) taşır. BE-060 backend ihtiyacı karşılandı (W102 bağlantısı bekliyor); BE-063 silen adıyla kısmen karşılandı; departman kodu/silinmişliği ile açan ve işaretleyen adları açık. BE-064 ekip verisiyle kısmen karşılandı; çok ekipli ve boş ekipli gruplama kararı açık. Her iki kayıt açık kalır.

## Denetim ve açık kapı

Node 24.9.0 ile aynı kilit ve paket tanımlı ana çalışma ağacının kurulu bağımlılıkları kullanıldı: `pnpm lint`, değişen belgelerde `pnpm exec prettier --check` ve `git diff --check` geçti. Önceki çevrimdışı kurulum `@primeuix/themes` 2.0.3 önbellekte olmadığı için başarısızdı; varsayılan Node 22.12.0 gereken 24 sürümünün altındaydı. Önceki GitHub erişim hatası tarihsel; bu oturumda koordinatör GitHub API ve `git ls-remote` erişimini doğruladı. Commit sonucu teslimde bildirilir; PR/CI açık ve F4 kapanmış değildir.
