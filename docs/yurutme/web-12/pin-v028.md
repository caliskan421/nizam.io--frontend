# WEB-12 pin uyumu — v0.26 → v0.28

İlk uyum kaynağı Sonnet W208 **0797a526**; dar test-sunucusu düzeltmesiyle son kaynak **0113d5f1**: yayımlıv0.28.0-api/45a2237f. KESİN36 ayrı pin paketi: mevcut UI/stub davranışı korunur; yeni06 dağılım ve01f rapor karşılıkları sonraki canlıya alma paketindedir. Backend/mobil/program yazımı ve paket/kilit/CI politikası değişikliği yoktur.

## Sözleşme ve uyum

293→297 operasyon,372→379 şema,232→236 zarf kodu. Yeni uçlar getFileThumbnail(S3), summarizeAuditEntries/listAuditActionTypes/exportAuditEntries(S1); mevcutlistAuditEntries,departmentDeleteImpact,reportSeason/reportSeasonPdf değişti. Üretilmiş üç dosya yalnız gen:api ile, tokenlar aynı pin kaynağıyla üretildi.

Program dönem günleri/konumu required-nullable; WorkItemNote/ReportTaskNote flag-null/shared-false; SeasonReport konum-null/gantt_edges-empty; ArchiveFolderTotals typed/tagged dizileri required. Ortak test üreticileri eklendi; boş toplam üreticisi tür/etiket uydurmaz, dolu senaryolar kendi dosya kümesinden veya açık standart PDF/sonuc fixture'ından tutarlı kovalar verir. Arşiv fake'i resmi KindOf sınıflandırması ve RECORDS-K51 toplam/sıra kurallarını uygular; bunun ayrı değişmez testi vardır.

Dört yeni zarf kodu audit.export_too_large/audit.subject_not_found/audit.summary_unavailable/records.preview_unavailable ve program.invalid_location/invalid_period alan kodları i18n'e eklendi. Yeni giriş alanı veya yeni uç tüketicisi açılmadı. Departman tekil etki okumasında yeni program_id gönderilmediği regresyonla korunur; şirket geneli etki daraltılmaz.

## Kaynak doğrulaması

Sonnet properNode24.22.3 altında fulltype/lint/format/build ve gen:check geçirdi. Hedefli son21 dosya477 test ve son ek F11 dosyasında15 test geçti; örtüşen koşular toplanmaz. İlk lint koşusunda kullanılmayan yerel değişken hatası ve ilk gen:check'te commit edilmemiş API test/varsayılan farkları vardı; son temiz kaynakta bunlar giderildi. Ham geçmiş saklandı; tail çıktısının gerçek süreç kodu yerine yanlış yorumlanması düzeltilip lint gerçekrc0 ile doğrulandı.

Terra v028 izole API tanığı üç rol/iki program dağılım ve program/range/tasks kaynaklarını doğruladı. Ayrı sunucu PDF tanığı kapak/konum/dönem, urgent/shared ve aynı sayfa kenarı için görsel kanıttır; frontend parity değildir. Son pin frontend Native dar/390-1440/CSP kabulü ve bu PR'ın kendi kalite/üretimimajı/gerçekE2E üçSUCCESS kapısı tamamlanmadan MERGED yapılmaz.

**Sınır:** Bu pin, BE025/BE136 canlıya alındı veya F12 bitti demek değildir. Yeni program/range kaynağına göre kapak metni ve yeni PDF ok sınırına göre önizleme notu, son rapor uygulamasında güncellenir; eski ekran davranışı pin PR'ında canlandırılmaz. W210 bağımsızRED testleri ayrı özellik dalındadır, bu pin PR'ına dahil değildir. Üretilmiş thumbnail/audit uçları önceki ürün kapılarını açmaz.


## İlk CI iptali ve bağımsız sıralama düzeltmesi

Root yayımlı foldBreakdown kodunu karşılaştırınca arşiv fake’inde eşit baytta enum gösterim sırasının korunduğunu buldu; gerçek sunucu eşitlikte anahtarın sözlük sırasını kullanır. İlk test örnekleri bu farkı tesadüfen göstermiyordu. Native yeni iki regresyonla image/pdf ve analiz/plan eşit bayt senaryolarında gerçek AssertionError RED verdi (2dosya/200B toplam kontrolleri geçti). Root49b3 test commit’i; Sonnet0113 fake karşılaştırıcıyı ASCII anahtar sırasına düzeltti. MIME sınıflandırması ve üretim UI/API/pin/paket aynı kaldı. Native iki girdi sırası dahil yeni2+eski3 test5/5GREEN verdi.

İlkPR183 CI44268820239/eda9 kaynak düzeltileceği için root tarafından iptal edildi; kör yeniden koşulmadı. Güncellenen HEAD kendi yeni tam CI’ını alır. Native0797 gerçek Caddy tanığı üretim kaynak farkı0 ile korunur; metadata/fake-only düzeltme için aynı UI koşusu tekrarlanmadı. Yeni kaynak üçSUCCESS olmadan MERGED yapılmaz.

## Pin adımı kapandı

PR183 HEADa3d2d928 kendiCI44270489832 üçSUCCESS:895dosya6707test/üretim audit0/imaj/gerçekv028E2E15/15(3.8dk). Bağımsız Native kabulü sonrası HEAD eşleşmeli MERGED1b829e9238b3748a2852301d5993cbe5eefc0aac. Main temizFF; pin adımının önceki bekleme notları tarihçedir. F12 özellik paketi ve kendi CI/merge kapısı ayrıca yürür.
