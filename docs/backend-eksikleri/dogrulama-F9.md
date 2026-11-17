# F9 gerçek backend doğrulaması — W188

**Ara kayıt; nihai tanık devam ediyor.** Test/tanık Terra, raporu kaynak kanıttan aktaran koordinatör Codex. Sonnet uygulaması ve Opus statik denetimi bu gerçek tanığın yerine geçmez.

## Ortam ve kaynak

Backend `v0.25.0-api`, `58856bbc185fe2a7124a3baeeb8178ef5ccd47ab`; frontend bütünleşik kaynak `94fe0a3a5535ee5f3ccc078aa8daf78988c13e51` (bildirim1100f522 + sohbet261af5fe). Üretim derlemesi başarılı. İzole proje `nizamio_web9_w188_0615`, portlar28089/28090/25439; frontend test sunucusu42889.

Gerçek `caddy:2.11.4-alpine` container'ı kullanıldı. Test Caddyfile'ına backend proxy handle'ları eklidir; bu tanık CI'ın üretim web imajı kanıtı olarak sunulmaz. API ve tarayıcı gerçek backend'e bağlandı; MSW, route mock veya fulfill yoktur. Önceki kaynak envanteri ve yalnız bu projeye ait kaynaklar yerel kanıt dizininde tutuldu. Diğer Docker projelerine/imajlara müdahale edilmedi.

## Tamamlanan gerçek tanıklar

| Yüzey                      | İşlem ve sonuç                                                                                                                                                                                                                                                 | Kanıt                                                 |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Görevden kaynak mesaja     | 390/1440 koyu, görev detayındaki linke gerçek pointer; typed sohbet/mesaj=3, GET around=3 ve hedef görünür. S3 program/departman başlıkları doğru; CSP header, ihlal/overflow/pageerror sıfır.                                                                 | source-ui-caddy.json, caddy-source-task/chat PNG'leri |
| İki programlı soğuk hedef  | Eski program seçiliyken yeni oturum; gerçek tarih bildirimi pointer ile açıldı, ikinci programa geçildi, hedef görev GET200 ve başlıklar bildirim kapsamıyla eşleşti.                                                                                          | cold-ui.json, cold-before/after.png                   |
| Satır içi tarih kararı     | Yönetici gerçek pending review_date_request satırından Onayla; S1 review POST200, liste/sayaç refetch, “Onaylandı · sen”.                                                                                                                                      | inline-date-ui.json ve PNG                            |
| Satır içi görev onayı      | Yönetici normal departman üyeliği de taşırken pending approve_task; satır pointer Onayla → transitions200, doğru S3 başlıkları, liste/sayaç refetch.                                                                                                           | inline-approve-ui-3.json, approval-resolution.json    |
| Karar yetkileri            | Üye onayı403, koordinatör onayı200; gerekçesiz iade422/gerekçeli200. Koordinatör tarih talebi201, kendi incelemesi403, yönetici incelemesi200 ve tekrar409.                                                                                                    | action-witness-3.json                                 |
| Sohbet bildirim tercihleri | all gerçek mesaj bildirimi; mentions düz mesaj8sn görünmedi, hesap anması geldi; none anması8sn görünmedi. Chat read204 sonrası zil4→3 ve grup is_read=true. Negatif gözlem süreyle sınırlı.                                                                   | notification-witness.json                             |
| Grup/mention/kaldır        | İki düz mesaj count2 grup; dismiss204 tüm grubu kaldırdı. İki anma ayrı null-group satırlarıdır. none iken sohbet unread_count13 kaldı.                                                                                                                        | notification-group-2.json                             |
| Sohbet read-all            | 204, bu program sohbetlerine ait okunmamış bildirim kalmadı; count24→17, awaiting0→0.                                                                                                                                                                          | pins-readall.json                                     |
| İletme                     | İki hedef201; aynı anahtar200 ve aynı iki sonuç. Olmayan hedef404, yinelenen hedef422, anket422. Mevcut ama üyeye erişilemeyen grup GET404; erişilebilir+erişilemeyen hedef forward404 ve erişilebilir hedefin tam mesaj listesi değişmedi.                    | api-witness.json, forward-forbidden.json              |
| Arşive kaydetme            | Geçerli PNG multipart201, aynı anahtar/client_message_id ile200 ve aynı mesaj/dosya kimlikleri. Aynı580 bayt gerçek gönderimde alan ofsetleri68/202/321/409: üç metin ardından dosya. İki çağrı sonrası sohbet7→8, görev dosyaları2→3; tek mesaj/dosya oluştu. | archive-witness.json, archive-wire-count-2.json       |
| Anonim anket               | Üç rol geçmişinde voters boş, oy veren üye mine doğru/diğerleri false. Sabitlenmiş anket üç rolde de gizli seçmen ve doğru mine.                                                                                                                               | api-witness.json, pins-readall.json                   |
| Konu sessize alma          | PUT/list/DELETE204/200/204; mute list limit0/101 için422.                                                                                                                                                                                                      | api-witness.json                                      |

Görev onayında ilk refetch geçici “Durum başka yolla değişti” gösterdi. Sonraki gerçek API okuması completed ve yönetici kararı döndürdü; olay kapanışı asenkrondur. Anında otomatik UI metni güncellendiği iddia edilmez. NOTIFICATIONS-K03/K04 gereği kapsam üyesi olmayan yönetici görev bildirimini almaz; tarih talebi istisnadır. Görev onay tanığında global yönetici rolü korunup normal departman üyeliği eklendi.

## Başarısız denemeler ve kanıt sınırları

İlk arşiv text/plain fixture'ı records.content_rejected422 aldı; geçerli PNG ile başarılı tekrar ayrı dosyadadır. Karar denemelerinde kanıt zorunluluğu/eksik işlem anahtarı ve bildirim UI denemelerinde üyelik/seçici zamanlaması kaynaklı ilk başarısızlıklar korunur; ürün kusuru olarak etiketlenmedi. İlk8sn grup/mention gözleminde teslim görülmedi,20sn sınırlı koşumda görüldü; kesin genel zamanlama nedeni iddia edilmez.

Henüz bu ara kaydın kanıtlamadıkları: tüm shared/receipts/Koordinatörler UI ayrıntıları, görünmez referans422, anonim oluşturma replay gövdesinin ayrıca mahremiyet incelemesi, null/forbidden/deleted kaynak linkinin gerçek UI negatifleri. Sahte/unit kapsamı gerçek tanık olarak sunulmaz. W189 sonrası liste dışında kalan sohbetin history unread yedeği ayrıca dar kontrol bekler.

500 gerçek mute kaydı tavanı,200 grup saklama süpürmesi, gerçek timer/push teslimi, OS notificationclick, Safari/iOS/VoiceOver ve CDN arkası SSE çalıştırılmadı. Bu alanlar otomatik tamamlanmış sayılmaz.

Ham JSON/PNG/betikler yerel frontend `.git/koordinator/web9-terra-w188/` dizininde; parola/belirteç rapora taşınmadı. Son owned-resource temizliği ve aşağıdaki ek CI tanığı bekleniyor.

## W189 ek doğrulama ve yerel ortam sınırı

İlk denetim düzeltmesi4a274180 üzerinde Terra aynı QueryClient ile yeniden girişte bayat çapa kırmızısını buldu;610e9df6 testinden sonra Sonnet3c4312c2 her liste dışı girişte mevcut kuyruğun limit1 geçmiş okumasını kullandı. Aynı ziyaret boyunca yerel çapa donuk kalır, sonraki girişte taze veri alınır. Terra56 testle önceki regresyonu doğruladı; metadata isteği uçuşta program değişince eski sıra dönmesi için ayrıca d91a9a2b kırmızısı eklendi, 12711e3b ile dar kapı düzeltildi.

Gerçek sparse test verisi hazırlandı: hedef ilk50 sohbet listesinde yok, geçmiş ilk okunmamış sıra1;50 daha yeni mesajlı grup var. Grup oluşturma429 Retry-After ile sınırlı tamamlandı. Fakat yeni gerçek UI girişinde backend500 döndü; owned postgres günlük okuması Docker daemon'dan read-only file system hatası verdi. Bu çevre engeli ürün kusuru diye sunulmadı ve4a için390/1440 gerçek UI kabulü verilmedi. Önceki94fe0a3a gerçek tanıkları bu denemeyle karıştırılmadı.

Terra'nın eklediği `e2e/chat-sparse.spec.ts` temiz CI backend'inde çalışacaktır:51 izole grup/mesaj, ilk50 dışında hedef ve server unread kontrolü,390→1440 aynı giriş, gerçek başka sohbet satırı ve SPA geri dönüşte aynı QueryClient ile taze null history yanıtından sonra eski ayırıcının yokluğu. Yeni history isteği/yanıtı ve DOM render bariyeri beklenir; meşru reconcile before okumaları yasaklanmaz. Finally yalnız kendi gruplarını kaldırır;429 yeniden denemeleri aynı anahtar/gövde ve Retry-After ile sınırlıdır. Yerelde discovery/type/lint/format başarılı; **ilk gerçek yürütme ve seed/cleanup sonucu henüz CI'da beklenmektedir.**

Bu CI e2e, gerçek v0.25 backend ile tarayıcı işlev kanıtıdır; vite preview üzerinde CSP gözlemcisinin sıfır raporlaması tek başına uygulanmış Caddy politikası kanıtı değildir. Gerçek Caddy tanığı yukarıdaki yerel kaynak sürümüne, üretim imajı kapısı ayrı CI işine aittir.

### Son kaynak için bağımsız dar kabul

Terra final84f9cff6 (üretim değişikliği30bfc952) üzerinde7 dosyada67 testi ve final build'i geçirdi. Metadata kapsam/sohbet/owner/kuyruk/oturum, aynı önbellekle1→null/150 dönüşü, bekleyen metadata sırasında erken read ve açık mesaj hedefi testleri yeşil.

Final üretim paketiyle sahte API gerçek DOM dumanı390→1440 aynı girişte genel ayırıcıyı, wheel sonrası read isteğini ve başka sohbet satırı/pointer→SPA geri dönüşünde ayırıcı yokluğunu doğruladı. Overflow/pageerror sıfır; PNG'ler incelendi. Bu koşuda CSP uygulanmadı; sıfır sayacından gerçek politika veya Caddy sonucu çıkarılmaz. İlk sahte after pagination yanlışı düzeltilerek son koşum alındı, ürün kusuru sayılmadı. Ham kanıt `web9-terra-w189-final/smoke.json`, PNG ve rapordadır.
