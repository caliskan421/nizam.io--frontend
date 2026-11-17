# F10 bağımsız doğrulama — v0.26

**Kaynak ve bağımsız kabul tamam; faz kapanışı son başlığın kendi üç CI SUCCESS + MERGED koşuluna bağlıdır.** Terra test/tanık, Sonnet uygulayıcı, Codex koordinatör, Opus bağımsız salt okunur denetçi. Örtüşen yerel koşum sayıları toplanmaz; aşağıdaki kanıtların gerçek/sahte/CI sınırları korunur.

## Ortam

Backend pin `v0.26.0-api`, commit `4d4adc0f9f1890184b5ed210296deb1fde6db886`; BE-P45 yayımlı sözleşmesidir, ayrı backend BE-F8 süreci değildir. İzole Terra projesi `nizamio_web10_w195_1711`: backend28091, kısa oturum28092, PostgreSQL25440. Yalnız bu projenin kaynakları kullanıldı. Fixture/parola/belirteçler rapora taşınmadı.

## Temel veri ve silme semantiği

W191 pin293 işlem/232 hata; altı yeni DeletedSummary alanı, dokuz terim toplamı ve beş yumuşak silme onayı. Terra12 dosyada154 test ve defaults/errors11 test; son delta5 test, build/lint başarılı.390/1440 sahte API üzerinde dört onay pointer ile, iptalde DELETE yok, dosyada DELETE204 ve attachments GET; overflow/pageerror/CSP0. Bu ilk dumanın CSP'si Caddy policy simülasyonuydu, gerçek Caddy/backend değildi. PR177 CI44060513834 bağımsız olarak864 dosya6369 test + gerçek backend15/15 ve üretim imajıyla üç SUCCESS verdi.

W192 dokuz tür kayıt/typed uçlar/birleşik liste/anahtarlar: Terra9 dosyada167 testle kabul etti. Gerçek QueryClient RED'i, dosya restore sonrası aynı programdaki farklı departmanların canlı dosya referansı özetinin bayat kaldığını gösterdi; c9ad652d ile program kapsamlı refSummary yenilendi. Mesajların kendi ek/bağlantı sayacı records dosya çöpünden etkilenmediği için bu yanlış yenilemeler çıkarıldı.

PR178 ilk CI'da869 dosya6502 assertion geçti fakat bir yakalanmamış401 kalite kapısını düşürdü. Terra, başarılı reaction yazması204 ardından around401/refresh401 ile gerçek üretim promise reddini bağımsız RED olarak yakaladı. Sonnet97778ed5 yalnız yazma sonrası mesaj yeniden okumasında beklenen API/oturum hatalarını ele aldı: başarılı yazma korunur, mevcut bağlamda okunamadı bildirimi; kayıp sahip/kapsam/oturumda sessizlik, yazmayı kör tekrar yok. Programlama hataları yeniden fırlatılır. Terra RED ve altı ek regresyon dahil31 test/full typecheck/lint/format başarılı. CI2 **44072465588**, HEADadcf71bf:871 dosya6509 test, üretim imajı ve gerçek backend15/15 başarılı; PR178 mainfe241530 ile birleşti. Eski F9 borç38 ile aynı kök neden olduğu kanıtlanmadı.

## Gerçek API tanıkları — W195

Aşağıdakiler doğrudan gerçek HTTP/PNG/ZIP tanıklarıdır; yeni frontend UI veya Caddy kabulü yerine sunulmaz.

| Tanık | Gözlenen sonuç |
| --- | --- |
| Dosya yaşam döngüsü | PNG yükleme201 → dosya silme204 → yönetici çöp listesi200, üye403, dosya indirme404. Ebeveyn görev silme200 ardından dosya geri yükle409 `records.work_item_deleted`; görev geri yükle200, dosya hâlâ çöpte; dosya geri yükle200 ve indirilen baytlar eşit. Yeniden silme204, ayrı kalıcı silme200. |
| Ad çakışması | Aynı adlı canlı dosya varken eski dosya geri yükle200: `renamed:true`, gerçek `display_name` numaralanmış ad. |
| Beş çocuk ve birleşik liste | Alt görev, görev notu, toplantı notu, gündem ve dosya silindi; yönetici S2 birleşik listede beş kimlik/tür/ebeveyn döndü, not grubu üç tür; üye403. Gerçek ebeveyn türleri `tasks`/`meetings`. |
| Liste parametresi | Beş çocuk GET `limit=200` ile200, birer fixture öğesi.200 kayıt yük/stres kanıtı değildir; birleşik listenin ayrı limit sözleşmesiyle karıştırılmaz. |
| BE-165 arşiv/ZIP | Görev çöpe taşınırken admin S2 ve koordinatör S3 arşiv toplamı4→3→4, dosya var→yok→var. Üç gerçek ZIP bileti/indirme200; PNG giriş ve baytları önce/sonra eşit, görev çöpteyken ZIP'te yok. Doğrudan dosya indirme bu durumda200 (RECORDS-K14), arşiv dışlamasından farklıdır. |

Yerel ham kayıtlar `.git/koordinator/web10-terra-w195/`: `file-api-450aa0bb-9c67-4924-8c32-97e3158ad850.json`, `rename-api-ac283bb9-7a91-4277-a693-8b4b257cbf3b.json`, `combined-api-c00fe647-52bd-497c-90d2-928c16548712.json`, `limit200-0412dfe8-6592-4745-94e6-a183ff7a0f8a.json`, `be165-a29a4646-62f9-4b6c-b22c-2582ed13cd89.json`. İlk agenda fixture yanlış `item_id` okuması ayrı başarısız kayıtta korunur; ürün kusuru sayılmadı.

## UI ve arşiv kabulü

W193 HEADc4483eab: Terra7 dosya81 bağımsız test + gerçek `live-records.spec.ts`3/3 ve build başarılı. Gerçek Caddy2.11.4 testproxy42991→v026 backend28091 (rota sahteleme yok):390/1440 Tümü/sekiz sekme, sarma ve overflow/pageerror/CSP0;1440 dolu üç not türü; root iki Tümü PNG'sini ayrıca inceledi. Ebeveyn linki/restore409→ebeveyn200→çocuk renamed200 ve dönen gerçek yeni adın toast'ta gösterimi ayrı run47cf ile doğrulandı. Boş departman scope=program/CSRF/program başlığı/no department purge200→son listede yok; üç not/gündem purge200→her liste total0. Üye390 erişim reddi ve admin çöpGET0. Ham kanıtlar `.git/koordinator/web10-terra-w193/rapor.md` ve immutable run42b/47cf/226b JSON+PNG'lerdedir. CI üretim imajı ayrıdır.

Bilinmeyen server kind ve türler arası aynı ID yalnız fake bağımsız testte; gerçek backend'de üretilemedi. Ayrı gerçek ek tanık9ddbe4af: Tümü UI karma ebeveyn+dosya batch geri yüklemede POST work-items/restore200, ardından files/restore200; sonraki görev/dosya GET200 hedefi canlı doğruladı. CSV CDP ec70d78d, bilet hedefinde Tümü dokuz tür/Not ve gündem üç tür, program kapsamı ve q filtresini doğruladı; gerçek dosyalar UTF-8 BOM, Türkçe başlık ve üç not/gündem satırı içerdi. Dolu Not ve gündem390 PNG görsel kabul/overflowCSP0. İlk Playwright request-body null yardımcı denemeleri korundu, CDP ayrı başarılı run bu kanıt boşluğunu kapattı; ürün kusuru sayılmadı. Full test veya live-records tekrarlanmadı. W194 b5db1826: Terra7 dosya50 bağımsız test/build geçti; aynı owned Caddy gerçek yeni bundle hash'iyle çalıştı. Koordinatör390 ve admin1440 gerçek pointer ile d1→d2 taşıma200; kaynak listeden çıktı ve hedef görev toast'ı görüldü. İki hedefte dosya indirme200,70 PNG baytı fixture ile eşit; aynı hedef200 ve geçersiz hedef422. Admin ayrı d2→d1 hareketinde CDP hedef JSON gövdesi, kaynak program/departman S3 başlıkları, doğru CSRF, IK yok ve200 yakaladı. Koordinatör ilk helper postDataJSON null ve yanlış CSRF alan adına bakarak kesildi; gerçek başarılı HTTP ve bağımsız dosya/byte son durumu korundu, ürün hatası sayılmadı. Gerçek typing aramasında tek `İ` karakteri uyarı/q, dosya adında olmayan `Hedef` görev başlığı iki sonuç/toplam2, `W195` yükleyen adı yalnız koordinatör dosyası/toplam1 döndürdü; dolu sorgularda search_scope=all. Admin/search ölçümünde overflow/pageerror/CSP0;390/1440 modal PNG'lerini Terra ve root ayrıca inceledi.390 ilk scriptte eksik kalan ölçüm ayrı5d68c019 run ile kapandı: sayfa öncesi dinleyici, gerçek nonce CSP header, violation0/pageerror0/scroll390=viewport390, odak modalda, padding24px/Inter/backdropfixed z50. Ek PNG görsel incelendi, yeni yazma yapılmadı.

Ham arşiv kaydı `.git/koordinator/web10-terra-w194/rapor.md`, move48c416ea/06fb7abd, CDP539a4c93, APIf8c09403 ve search12e2bba2 immutable JSON/PNG'leri. Preview'nin yanıt öncesi korunması, source-completed409, scope/session/owner ve p2 değişmezliği bu gerçek akışta ayrıca ölçülmedi; ilgili50 dar birim/entegrasyon testleri kanıtıdır. Gerçek debounce isteğinin tam sayısı/arama temizleme ayrıca ölçülmedi. Bunlar gerçek tanık gibi sunulmaz.

## Sınırlar

v026 OpenAPI'nin üç eski silme açıklaması yumuşak silmeyle çelişir (`deleteWorkItemSubtask`, `deleteMeetingNote`, `deleteAgendaItem`); etiketin kodu ve ADR-0054 yetkilidir. İstemci üretilen spec'i elle düzeltmedi; backend dokümantasyon borcu raporlanır. GAP-233 önizleme türevi, BE-166 PDF konusu ve BE-F8 bu fazın dışındadır. OS cihaz/VoiceOver/timer ve gerçek200 kayıt stres kanıtı yoktur. Son kaynak için Opus tur2 UYGUN/açıkbulgu0; kendi kapanış CI/merge kapısı ve sahipli kaynak temizliği aşağıdaki son kayıtta izlenir.


## Önceki ortam borcunun temizliği

F9 kapanışındaki Docker ROFS geçmiş sınırlaması F10 ön kontrolünde sürmedi. Root yalnız adıyla tanımlı dört eski W188 exited konteyneri, `nizamio_web9_w188_0615_default` ağını ve tek tüketicisi o DB olan anonim volume'ü inspect ile doğrulayıp kaldırdı; üç işlem EXIT0 (`web10-old-w188-cleanup.txt`). Paylaşılan daemon restart/prune veya ortak imaj silme yapılmadı. W195 gerçek tanık kaynakları denetim tamamlanana kadar açık kaldı; son temizlik ayrı kaydedilecek.


## W197 denetim düzeltmesi

Opus'un not/gündem boşaltmada türler arası Durdur bulgusu Terra tarafından bağımsız RED'e çevrildi: ikinci türün son isteği sürerken durdurma sonrası gündemPOST1/expected0. Root test-onlyb6c8ef73'ü önce commit'ledi. Sonnet5a034a41, sonraki tür isteğinden önce stop guard'ı ekledi; ortak motor/purgeLoop değişmedi. Terra değişmemiş regresyon ve kenar/eski testlerde **5 dosya27 test** ile bağımsız yeşil doğruladı; gündemPOST0 ve3 başarıyı koruyan Durduruldu özeti. Ham `web10-opus01-terra-red.log` ve `web10-w197-terra-green.log`.

Sonnet5a8a9815 ayrıca mevcut görevi UI taşıma hedeflerinden çıkardı, API aynı hedef200 testini korudu; anahtarsız pencerenin çalışmayan resolved/edit_conflict dallarını kaldırdı, query ayrıştırmasını sadeleştirdi.72 dosya586 etkilenen test/type/lint/format/build başarılı; bu sayı diğer yerel koşumlarla toplanmaz. Son kaynak5a8a9815 için Terra4 dosya48 bağımsız arşiv testi, tam pnpm typecheck ve yeni build başarılı. Gerçek Caddy index-vj57UJWN.js SHA-256 `2a08c40553e450a10596a58544238ff74c5193df43a2dbb0df35b2402e9b78a4` yeni dist ile aynı; HTML nonce nedeniyle byte hash'i aynı beklenmez. Gerçek390 koyu modal63b04233: mevcut görev seçeneklerde yok, başka yetkili görev var, global departman aynı ve PATCH0; sayfa öncesi dinleyiciyle nonceCSP/violation0/pageerror0/scroll390=viewport390/odak içeride/padding24px/Inter/backdropfixedz50. Terra ve root JSON+PNG'yi ayrıca inceledi. Ham `.git/koordinator/web10-terra-w197/rapor.md`. Arşiv/dosya b5 gerçek tanıkları yeni kaynağın değişmeyen yollarından ayrı hash ile korunur; yeni yazma/fullsmoke tekrarlanmadı. Opus tur2 bu kaynak/delta ve ham tanıkları kabul etti: UYGUN, açık kaynak bulgusu0. Yeni kapanış başlığının kendi CI/merge koşulu sürer.


## Son sahipli ortam temizliği

Terra W195 denetimden sonra yalnız `nizamio_web10_w195_1711` kaynaklarını kapattı: exact Caddy ve üç backend/DB konteyneri, proje ağı ve tek tüketicisi bu DB olan anonim volume kaldırıldı. Scoped backend-down EXIT0;42990/42991/42992/28091/28092/25440 portlarında dinleyici yok. Ayrı preview PID yoktu; ortak Docker Desktop süreci durdurulmadı. `web10-terra-w195/cleanup-final.md` ve ön/son envanterleri kanıttır. Ham tanıklar ve image cache saklandı; kaynak çalışma ağaçları/dalları birleşme sonrası root tarafından kaldırılır. Eski W188 ve yeni W195 çalışan test kaynağı kalmadı.
