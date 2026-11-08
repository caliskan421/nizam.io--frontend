# EKRANLAR tespit seti — Codex kapı hükmü

**Denetçi:** Codex `gpt-6-astra` (`gpt-6.1-astra` bu ChatGPT hesabında desteklenmiyor), `codex exec -s read-only`, tek koşum, 2026-11-08.
**Denetlenen:** `docs/ekranlar/` (kök README + 11 grup × 6 dosya) + sözleşme, yol haritası, BE kaydı, WEB-0 yürütme seti.
**Hüküm:** KOŞULLU UYGUN. Koordinatörün uyguladığı/reddettiği kararlar: [`../ekranlar/sentez.md`](../ekranlar/sentez.md) §7.

---

# EKRANLAR tespit seti — Codex hükmü

- **Hüküm: KOŞULLU UYGUN.** Set, tasarım envanteri ve uygulayıcı hazırlığı için güçlü bir temel. Ancak aşağıdaki F0/F1 engelleri giderilmeden **tek başına uygulanabilir gereksinim** kabul edilmemeli. Sonnet’in “denetlendi” hükmü, ürün kararlarının alınmış veya bütün dosyaların tutarlı olduğu anlamına gelmiyor.
- **Denetlenen:** 67 hedef dosya: kök README ve 11 grubun altışar dosyası. Ayrıca altı şablon; bağlı tasarım kopyaları, yol haritası, BE kaydı, WEB-0 yürütme seti, API sözleşmesi ve ilgili modül/ADR/GAP belgeleri incelendi. Gruplar: **00, 01, 01b, 03, 03c, 05, 06, 08, 09, 10, 11**.
- **Örneklem:** Backend eşlemelerinde geçen gerçek operationId’lerden, `20261108` tohumuyla seçilmiş **18 işlem**; ayrıca risk odaklı alan, yetki, hata ve sürüm kontrolleri.
- **Sınır:** Canlı sunucu davranışı ve açık PR/CI durumu doğrulanamadı. `docs/ekranlar/` çalışma ağacında izlenmeyen içerik olarak görünüyor. Bu rapor faz kapanışı veya CI kabulü değildir. Hiçbir dosya değiştirilmedi.

**Kaynak gösterimi:** Aşağıdaki `00/…`, `03/…` gibi kısaltmalar sırasıyla `docs/ekranlar/00-ortak/…`, `03-gorevler-liste/…` ve yukarıdaki grup klasörlerini belirtir. `O` = `../nizam.io--backend/docs/api/openapi.yaml`; `İ` = aynı dizindeki `istemci-akislari.md`. Satırlar mevcut çalışma kopyasınındır.

## 1. Mimari ve süreç

| Bulgu | Önem | Kanıt ve hüküm | Somut öneri |
|---|---|---|---|
| **CX-M-01** | Önemli | Altı dosyalı ayrım kullanışlı: görünüm, davranış, veri, eksik ve denetim birbirinden ayrılıyor. Ancak `docs/ekranlar/README.md:73` durumları “denetlendi”; örneğin `00/README.md:13` dosyaları hâlâ “taslak”. | Durumu tek yerden yönetin. **Denetlendi**, **karar bekliyor**, **uygulamaya kabul** birbirinden ayrı olsun; kabul eden, kaynak sürümü ve açık engeller yazılsın. |
| **CX-M-02** | **Engelleyici — F0/F1** | `Varsayım:` işareti, uygulama yetkisi gibi kullanılabiliyor. `00/mekanizma.md:55` ilk departmanı seçmeyi varsayıyor; K2 bunu birden çok seçenek olduğunda kabul etmiyor. | Her uygulama etkili varsayımı “öneri / kabul edilmiş karar / reddedildi” durumuna bağlayın. Uygulayıcı, işaretli varsayımı kendiliğinden kesinleştirmesin. |
| **CX-M-03** | Önemli | Kök README:59, eksikler dosyasındaki **her öğeye** `designStub` istiyor. Oysa belge eksikleri, çizilmeyen öğeler, faz ertelemeleri ve ürün seçenekleri de bu dosyalarda. | Stub yalnız uygulanmış arayüzdeki **kabul edilmiş işlev eksikliğine** bağlansın. Belge işi, gizlenen modül ve vazgeçilen tasarım için zorunlu stub olmasın. |
| **CX-M-04** | **Engelleyici — işletmeye geçiş** | `docs/yurutme/web-0/ortak-sozlesme.md` okuma sırası hâlâ doğrudan tuvale gidiyor; ekran setini referans almıyor. Mevcut yürütme istemleri yeni tespitleri atlayabilir. | Ortak isteme ilgili ekran grubunu, kabul edilmiş kararları ve ortak sorgu sözleşmesini ekleyin. Tuvali görsel doğrulama kaynağı olarak koruyun. |
| **CX-M-05** | Önemli | K13 ile temel yaklaşım uyumlu. Fakat `01/mekanizma.md:90` “statik örnek akış” öneriyor. Kullanıcı bunu gerçek işlem geçmişi sanabilir. | Statik eksik, sahte işletme verisi olmamalı: nötr yer tutucu, devre dışı eylem ve açık açıklama kullanın. Örnek kişiler/sayılar yalnız geliştirme gösteriminde kalsın. |
| **CX-M-06** | Önemli | K15 koordinatörün kod yazmamasını söylüyor. `docs/yurutme/web-0/README.md:9`, “tek satırlık bağlama” istisnası tanıyor. | Özellik bağlama işini de uygulayıcıya verin; koordinatörün birleştirme sorumluluğu ile özellik geliştirmesini ayırın. Bu denetim, uygulayıcı çalışmasının yerine geçmez. |
| **CX-M-07** | Önemli | Sorgu anahtarları, capability kuralları ve hata davranışları gruplarda tekrar edilmiş; tekrarlar şimdiden ayrışmış. `11/eksikler.md:56` sonrasındaki ayrıntılı API taslağı da tespit kapsamını aşıyor. | Yedinci bir dosyayı her gruba eklemeyin. Ortak kuralları tek sözleşmede tutun; grup README’sine kısa **uygulama kararı tablosu** ekleyin. Önerilen API’leri backend onayı gelene kadar açıkça öneri sayın. |
| **CX-M-08** | Küçük | E-kimliği yaklaşımı doğru; fakat `00/ozellikler.md:87` civarındaki E-00-40, `00/backend.md:20` içinde E-00-31 diye geçiyor. Kök README:16 “dört şablon” diyor; altı var. | Kimlik tanımı yalnız özellikler dosyasında olsun; diğer dosyalardaki başvurular otomatik kontrol edilsin. Kullanılmayan numaralar yeniden atanmasın. |
| **CX-M-09** | Önemli | Denetim kayıtları güncel dosyaların gerisinde. Örneğin `10/dogrulama.md:25`, `peer_read_seq` yerini yanlış buluyor; `10/backend.md:22` bunu artık zarf alanı olarak doğru yazıyor. | Sonnet bulgularını yeniden kopyalamayın; kapanış kanıtı ve denetlenen içerik sürümü ekleyin. |
| **CX-M-10** | Önemli | Oturum talimatındaki `../program/` yolu bu çalışma düzeninde yok; kayıtlar `../nizam.io--program/program/` altında. WEB-0 ilerleme belgesi O1 için hâlâ PR/CI/birleştirme kapısı gösteriyor. | Kaynak yollarını ve yürütme başlangıç noktasını netleştirin. Bu seti sürümlü PR’a alın; belgelerin kabulü ile kodun CI kabulünü ayrı tutun. |

**Eksik olan yeni bir dosya türü değil, kararların uygulamaya aktarılmasıdır.** Grup README’sindeki tablo şu bilgileri taşımalı: E-kimliği, faz, canlı/statik/gizli davranış, kabul edilmiş varsayım, BE bağı, bağımlılık ve kabul kanıtı. Görsel kabulte açık/koyu tema, dar ekran, klavye, boş/yükleniyor/hata ve uzun metin durumları da bulunmalı.

## 2. Gruplar arası tutarsızlıklar

| Bulgu | Önem | Dosya A ↔ dosya B | Hüküm |
|---|---|---|---|
| **CX-T-01** | **Engelleyici — ortak veri katmanı** | `03/backend.md:104` ↔ `03c/backend.md:82` ↔ `06/backend.md:81` | Aynı `listWorkItemFiles` önbelleği sırasıyla `records/files`, `records/work-item-files`, `records/workItemFiles` diye tanımlanmış; üçü de ortak olduğunu söylüyor. Tek anahtar fabrikası ve ortak geçersizleme listesi gerekli. |
| **CX-T-02** | Önemli | `00/backend.md:19` ↔ `03c/backend.md:27`, `01b/backend.md:13` | Kabuk `readProgram` kullanmıyor; diğerleri kabuğun zaten okuduğunu varsayıyor. Ad için mevcut `listPrograms` verisini kullanın veya ayrı okumayı açıkça sahiplenin. |
| **CX-T-03** | Önemli | `03/backend.md:14` ↔ `03c/backend.md:20` | Departman kodu/adı çözümü bütün uygun roller için `listProgramDepartments` ile mümkün. Gantt’ta bunu yalnız Admin yüzüne bağlamak gereksiz kısıt. **Ad çözümü**, **kapsam seçimi** değildir. |
| **CX-T-04** | **Engelleyici — F0** | `00/mekanizma.md:35` ↔ `00/eksikler.md:41`; ayrıca `05/mekanizma.md:34` | Mercek ile gerçek yetki karışıyor. Şirket yöneticisi Koordinatör merceğine geçtiğinde `company_admin` kaybolmaz; bu yüzden koşulsuz “Koordinatör merceğinde listUsers 403” doğru değildir. |
| **CX-T-05** | Önemli | `00/mekanizma.md:80` ↔ `08/backend.md:25`, `05/eksikler.md:48` | Bir yerde tam sayfalama fan-out yasağına bağlanıyor; diğerlerinde doğru biçimde aynı ucun sayfalaması sayılıyor. K3’ün yasağı departmanları ayrı çağrılarla birleştirerek görev listesi kurmaktır. |
| **CX-T-06** | Önemli | `08/eksikler.md:51` ↔ `09/backend.md:42` | Toplu koordinatör atamasında N yazma K3 gerekçesiyle yasaklanmış; katılımcı eklemede N yazma kabul edilmiş. K3 toplu yazma yasağı değildir. Atomiklik, kısmi başarı ve kota ayrı ürün/teknik kararlardır. |
| **CX-T-07** | Önemli | `00/README.md:20` ↔ `06/eksikler.md:46`, `10/eksikler.md:65` | Arşiv/Mesajlar için ortak kabuk “gizli mi?” diye sorarken gruplar “gizli” kararını verilmiş sayıyor. Tek faz-görünürlük matrisi gerekli. |
| **CX-T-08** | Önemli | `10/eksikler.md:66` ↔ `11/backend.md:20`, `11/backend.md:73` | Sohbet referansı, kaynak göreve erişim yok diye kapanmaz; sohbet üyelerine özet paylaşılır. Tablolar bunu “kaynağa erişemeyene available:false” emsali olarak yanlış kullanıyor. Tablolar için ayrı gizlilik kararı alınmalı. |
| **CX-T-09** | Önemli | `05/backend.md:59` ↔ `03/backend.md:116`, `11/backend.md:68` | `confirmation_required` yalnız kaldırmada değildir: `updateMembershipRole` da döndürür. Buna karşılık `assignMembership` onay emsali değildir. |
| **CX-T-10** | Önemli | `08/eksikler.md:26` ↔ `11/eksikler.md:91`, `105`, `142` | İlk dosya `ErrorEnvelope.details` alanının dize olduğunu doğru söylüyor; Tablolar taslağı aynı alanı nesne olarak kullanıyor. Yeni hata biçimi gerekiyorsa açık sözleşme değişikliği tasarlanmalı. |
| **CX-T-11** | Önemli | `01/backend.md:13` ↔ aynı dosya:22; karşılaştırma `03/backend.md:10` | Üye merceği için istemci atanan süzgeci doğru eklenmiş, fakat satır sonunda “liste zaten yalnız atananlardır” kalmış. Birleşik rolde yanlış; son cümle kaldırılmalı. |

**Çelişki bulmadığım noktalar:** Kapsam başlıklarının adları genel olarak doğru: `X-Nizamio-Program`, `X-Nizamio-Department`. Beş görev durumu doğru kaydedilmiş; sorun bazı çizimlerin `iade_edildi` durumunu temsil etmemesi. `member_count` konusunda 01 ve 08 aynı kod gözlemini aktarıyor; farklı backend gerçeği yok, **sözleşmede anlam güvencesi eksik**.

**Birleştirme adayları:**

- `00:yeni-3`, `01:yeni-5`, BE-003/009 ve `08:yeni-8`: görev sayaçları ailesi; aynı yetki ve süzgeç tanımlarıyla paketlenmeli.
- `03:yeni-1` ve `05:yeni-5`: aynı atanan süzgeci; tek backend işi.
- `01:yeni-3` diye anılan son-yükleme ihtiyacı, mevcut BE-025 ve 08’deki aynı gösterim: tek klasör özeti işi. Dosya düzeyindeki `06:yeni-1` bununla aynı alan değildir.
- `05:yeni-10`, `08:yeni-4`, `09:yeni-15`: ortak istemci akışı/yetki belgeleme paketi; modül bazında kabul ölçütleri korunmalı.
- `08:yeni-1` ile `09:yeni-12`: ekip özeti için ortak veri üretimi mümkün. BE-011’in kullanıcı yönetimi kapsamıyla körlemesine birleştirmeyin.
- Toplantı, tablo ve sohbet kişi seçicileri ortak altyapı kullanabilir; **görünür aday kümeleri farklıdır**, tek sınırsız kişi dizini diye birleştirilmemeli.

## 3. Sözleşme doğruluğu

Rastgele örneklemin sonucu aşağıdadır. “Doğru”, belirtilen eşlemenin doğrulandığını ifade eder; dosyanın tamamına verilmiş kabul değildir. İstemci akışlarının toplantı/organizasyon işlemlerini kapsamadığı yerlerde bu eksiklik ayrıca değerlendirildi.

| Örnek | Eşleme kaynağı | Doğrulanan gerçek |
|---|---|---|
| `listPrograms` | `11/backend.md:10` | S1, `ProgramList`; `O:4514`. |
| `createWorkItemSubtask` | `03/backend.md:44` | S3, işlem anahtarı, 200/201; `O:13780`, İ §8. |
| `issueDownloadTicket` | `06/backend.md:39` | POST, CSRF, bilete kapsam aktarımı; `O:4318`, İ §9. |
| `archiveFolders` | `01/backend.md:11` | Program ve departman başlıkları; `O:15945`, İ §3. |
| `permanentDeleteWorkItem` | `00/backend.md:95` | S2, `work.program_scope_invalid`; `O:15329`. |
| `listWorkItems` | `00/backend.md:94` | S3, limit/cursor; `O:12503`, İ §2–3. |
| `coordinatorGantt` | `08/backend.md:42` | S3; `O:14286`, İ §3. |
| `previewTransfer` | `11/backend.md:68` | POST önizleme işlemi mevcut; `O:7553`. Bu, `assignMembership` için onay kanıtı değildir. |
| `setChatReaction` | `10/backend.md:54` | Dört tür, PUT, 204; `O:9754`, İ §10.10. |
| `deleteWorkItem` | `03/backend.md:43` | S3, `confirmation_required` yok; `O:12920`, İ §4. |
| `listWorkItemSubtasks` | `06/backend.md:22` | S3, alt görev listesi; `O:13712`, İ §3–4. |
| `adminListDeletedMeetings` | `01/backend.md:20` | Yönetici yaşam döngüsü yolu, S2; `O:10817`. |
| `deleteWorkItemSubtask` | `03/backend.md:47` | S3; dosya bağının boşaltılması akışla uyumlu; `O:13967`, İ §3. |
| `deleteWorkItemNote` | `03/backend.md:52` | S3, `work.note_not_yours`; `O:13634`, İ §4. |
| `listMembers` | `01/backend.md:30` | S2 + departman yol kimliği; `O:5649`. Üye görünürlüğü ayrıca modül kuralıdır. |
| `joinConference` | `09/backend.md:44` | S2, token yanıtı, disabled/not_active/provider hataları; `O:11586`. |
| `createGroupChat` | `10/backend.md:64` | S2, işlem anahtarı, 200/201; `O:8033`, İ §8 ve §10. |
| `removeMember` | `08/backend.md:69` | S2, `confirm` sorgusu ve 409 onay; `O:5919`. |

Ek doğrulamada `WorkItem.assignee_account_ids` alanının **mevcut ve geriye uyumluluk için korunduğunu** gördüm (`O:2239`). Bu alanı kullanan ana sayfa süzgeci yanlış değildir.

| Bulgu | Önem | İddia → gerçek ve düzeltme |
|---|---|---|
| **CX-S-01** | Önemli | `03/backend.md:83`: toplam 200’ü aşınca sayaç yaklaşık deniyor. **200 sayfa boyutu tavanıdır.** İmleç bitene kadar görünür küme yüklenmişse 200’den fazla satır da sayılabilir. İ §2:90–93. Sonuç, yüklenen kümenin tamamlığına bağlanmalı. |
| **CX-S-02** | Önemli — F1 | `03/backend.md:39`: işlem anahtarı “form açılışında” üretiliyor. İ:306–310, **form gönderimi/kullanıcı eylemi başına** üretmeyi ve tekrarında aynı gövdeyi korumayı söylüyor. Formdaki yeni eylem ile ağ tekrarı ayrılmalı. |
| **CX-S-03** | Önemli — F1 | `03/backend.md:111`: ikinci atama başarısızsa görev atamasız kalır deniyor. İlk `createWorkItem` isteği atanan taşıyorsa o atama korunur; yalnız ilk istekte atanan verilmemişse atamasızdır. Kısmi başarı metni gerçek ilk yanıtı kullanmalı. |
| **CX-S-04** | Önemli | `11/backend.md:68`: `assignMembership` onay emsali verilmiş. `O:5727` işleminde `Confirm` ve ilgili hata yok; `updateMembershipRole` işleminde var (`O:5825`). |
| **CX-S-05** | Önemli | `11/backend.md:20,73`: görünmeyen kaynak → `available:false` emsali yanlış. İ:565–575 ve MESSAGING-K31, hedefin yok/aktarılmış/bağı kalkmış olmasıyla sohbet üyeliğini ayırır. Kaynak göreve erişim eksikliği, paylaşılan özeti otomatik kapatmaz. |
| **CX-S-06** | Önemli | `06/backend.md:37–38`: `provisioning.write_not_allowed` için “dönem yazıma kapalı” yazıyor. Bu kurulumun yazma iznidir; program/dönem durumu değildir. `10/backend.md:44` doğru biçimde salt okunur kurulum der. |
| **CX-S-07** | Önemli | `01b/backend.md:39`: her yazma ucunda `audit.entry_rejected` bulunduğu ve bunun eksiksiz kayıt kanıtı olduğu söyleniyor. `sendChatTyping` (`O:10288`) karşı örnektir. AUDIT-K01, **audit yazan işlemin transaction davranışını** tanımlar; her yazmanın kaydedildiğini kanıtlamaz. |
| **CX-S-08** | Önemli | `09/backend.md:46`: “her uçta” audit hatası ve yazmalarda ortak provisioning hatası genellemesi var. Örneğin konferansa katılmanın yanıt listesi bu genellemeyi taşımıyor. Ortak hata tabloları işlem bazında geçerli olmalı. |
| **CX-S-09** | Önemli | `10/backend.md:48`: `messaging.not_authorized`, hem karşı tarafın programdan çıkmasını hem yetkisiz `@herkes` kullanımını kapsadığı hâlde ikisinde de “kişi ayrıldı” denip yazma alanı kapanıyor. Yetkisiz bahsetme, sohbetin tamamını kapatmamalı; İ §10.6/10.8. |
| **CX-S-10** | **Engelleyici — F0 oturum davranışı** | `00/backend.md:38`: başarısız logout sonrasında sunucu oturumunun belirteç süresiyle düşeceği varsayılıyor. Bellekteki erişim belirtecini silmek, HttpOnly yenileme çerezinin iptal edildiğini kanıtlamaz; API README:61–75. Yerel temizleme yapılabilir, fakat sunucu çıkışı başarısız/bilinmiyor olarak modellenmeli ve sessiz yenilemeyle tekrar oturum açılmamalı. |
| **CX-S-11** | Önemli | `06/eksikler.md:54`: `archiveUploaders` dizelerini nesnelere çevirmek “kırıcı değil” denmiş. Mevcut öğe tipi `string` (`O:3053–3060`). Bu tip değişikliği kırıcıdır; ek paralel alan veya sürümlü geçiş gerekir. |
| **CX-S-12** | Önemli | `11/eksikler.md:91,105,142`: `details.filled_count/conflicts/current_display` önerileri mevcut zarfla uyumlu değil; `O:272–273` dize tanımlar. Gelecek öneri olabilir, mevcut hata kalıbı olarak uygulanamaz. |
| **CX-S-13** | Küçük | `01/backend.md:57`: push kayıt uçları “hepsi okuma/okundu” diye nitelenmiş. `registerPushTarget/unregisterPushTarget` yazmadır. “Hatırlatma üreten uç yok” sonucu bundan bağımsız olarak geçerli. |

`listUsers` için şirket yöneticisi kısıtı **ORGANIZATION-K33’te açık** (`internal/modules/organization/README.md:63`); yalnız 403 kodundan çıkarılmamalı. API akış belgesine taşınması belge işidir. Benzer biçimde `member_count`, gecikme ve rapor sayaçlarının anlamlarını kod gözleminden sözleşme garantisine yükseltmek gerekir.

## 4. Eksik kaydı kararları

**Sınıflar:** **BE** gerçek işlev/veri eksiği; **BELGE** mevcut davranışın sözleşmede eksik anlatımı; **ÜRÜN** önce karar gerekir; **TASARIM** tuval mevcut sözleşmeye uymalı. Boyutlar yaklaşık paket boyutudur, takvim taahhüdü değildir. Bu tablodaki öneriler **önemli**; v1 dışı olanlar F1 engeli değildir.

| Öneri / kaynak | Karar | Gerekçe | Boyut |
|---|---|---|---|
| **BE-003**, `00/eksikler.md:22`, `03/eksikler.md:52` | BE; kapsamı açık alt işlere böl | Çekirdek: görünür görev toplamı, beş durum, geciken, görünür bekleyen tarih talebi. Süzgeçlerin sayaçlara etkisi tanımlansın. Arama/sıralama/aday dizini aynı BE’ye yığılmasın. | Çekirdek M; sorgu ailesi M–L |
| **BE-008**, `01/README.md:35` | **Kapatma; tüketicilerini düzelt** | Ana sayfa işaretlemesinde yok, fakat `Gorevler-Liste.dc.html:256` ve `Gorevler-Zaman.dc.html:168` düğmeyi çiziyor. “Ana sayfadan çıkarıldı” ≠ “üründen vazgeçildi”. | S–M; kota/alıcı kuralına bağlı |
| **BE-023**, `09/eksikler.md:51` | Backend eksiği statüsünü düzelt; W7 web işi olarak izle | Konferans uçları ve `conference_available` var. Video özelliğinden vazgeçildiği sonucu çıkmaz. Üretimde gerçekten açık olduğu bu denetimde doğrulanmadı. | Web entegrasyonu ayrı |
| **BE-025**, `06/eksikler.md:10`, `01/eksikler.md` | Böl | Bağsız yükleme ayrı veri/yetki modeli; klasör boyutu/son yükleme ayrı özet işi. Görev seçtirerek yükleme mevcut uçla mümkün. | Bağsız L; özet S–M |
| **BE-025 → GAP-108** | Bağı kaldır/düzelt | `known-gaps.md:702` bağsız yükleme veya klasör son-yükleme alanını tanımlamıyor. Etiket kararı BE-024’e; pptx/arama sorunları ilgili ayrı düzeltmelere bağlanabilir. | BELGE S |
| `00:yeni-1` | ÜRÜN; varsayılan yeni BE açma | Rozet okunmamış **sohbet** saysın. Mesaj sayısı ancak ayrıca istenirse. | Koşullu S |
| `00:yeni-2` | BELGE + koşullu BE | Web uyumluluk politikası gerekli. `api_version` kapısı mevcut; ürün sürümüyle API etiketinin minörünü eşitleyen kural uydurulmamalı. | S–M |
| `00:yeni-3`, `01:yeni-5` | BE-003/009 ile birleştir | Mercek, görünürlük ve “bana atanan” kapsamı ortak tanımlansın. Öncelik/hafta gibi ek sayaçlar ikinci kapsam olsun. | M |
| `01:yeni-1` | BE + TASARIM | Onay/iade ayrımı için alan gerekir; dört dilime beş durumu yanlış etiketle sığdırmayın. | S |
| `01:yeni-2` | ÜRÜN → koşullu BE | Bütün üyelerin avatarı şartsa özet gerekir; koordinatör avatarı ve açık üye sayısı alternatifi var. | S–M |
| `01:yeni-4` | Zorunlu BE değil | Dosya sayısı mevcut arşiv yüzünden alınabiliyor; tek pano yanıtına ekleme optimizasyon. S3 sorunu ayrıca çözülmeli. | S |
| `01:yeni-6/7` | Önce BELGE | Alan anlamları açıklansın. REPORTING-K03’ün ayrı alt liste uçlarını mı gömülü dizileri mi kapsadığı netleştirilmeden gömülü pano için kesilme garantisi varsayılmasın. | S; davranış farkı çıkarsa ayrı BE |
| `03:yeni-1`, `05:yeni-5` | Bir BE | Atanan süzgeci ortak; aday seçenek kümesi ayrıca yetkiyle tanımlansın. | S–M |
| `03:yeni-2` | BE | Sunucu sıralaması, imleç ve süzgeç ekseni birlikte ele alınmalı. | S–M |
| `03:yeni-3/5` | ÜRÜN | “Kopyala” varsayılan bağlantı kopyalama; toplu eylem varsayılan kapsam dışı. Çoğaltma istenirse alt görev/dosya/atama kapsamı belirlenmeli. | Çoğaltma M; toplu M–L |
| `03:yeni-4`, BE-006 | Önce TASARIM/ÜRÜN | Mevcut kanıt kuralı herhangi dosyadır. Ayrı kanıt işareti ve üç zorunluluk bayrağı kendiliğinden backend gereksinimi olmaz. BE-006 genişlerse ADR-0024 etkisi ayrı yazılmalı. | Belge/tasarım S; davranış M |
| `03:yeni-6` | BELGE | `is_overdue/days_overdue`, tamamlanmış işler ve gün sınırı tanımlansın. | S |
| `03c:yeni-1/2` | BE; öncelikleri farklı | Talep uzantısını bütün satırlarda çizmek yeni alan ister. `dates_revision` ise seçili görev okumasıyla bugün edinilebilir; kolaylık/güvenli etkileşim iyileştirmesi. | S + S |
| `03c:yeni-3/4` | 3: yeni BE açma; 4: ÜRÜN | Departman adı mevcut sözlükten çözülür. Görev tarih aralığına “sezon aralığı” denmemeli; gerçek sezon sınırı ayrıca ürün kararıdır. | 0 / koşullu S |
| `03c:yeni-5/6/7` | Ayrı BE’ler; önce ÜRÜN | Talep geri çekme, zincirli geri alma ve tekrar güvenliği farklı sözleşmelerdir. Tek “tarih güvenliği S” işi fazla küçük. | S–M / L / M |
| `03c:yeni-8/9/10`, BE-019/020 | Böl ve koşullandır | Dışa aktarım istemcide olabilir. Çoklu Gantt ve çapraz birim bağları yetkiyi genişletmemeli. BE-019 kesilme/hata görünürlüğü; BE-020 sayaç ile tarihli alt görev modelini ayırsın. | S–M / M–L |
| `05:yeni-1/2/3/4/9` | Kullanıcı okuma ailesi; BE-011/012 bağlantılı | E-posta, admin olgusu, tekil okuma, kilit durumu ve ekip satırsız hesap kapsamı gerçek ihtiyaçlar. Önce “Tümü”nün anlamı kararlaştırılsın; tek dev kabul ölçütü yapılmasın. | Toplam M |
| `05:yeni-6/7` | 6: mevcut kararı koru; 7: ÜRÜN → BE | Görev listesine dosya sayısı eklenmeyeceği açık. “Kişinin dosyaları”, yükledikleri mi atandığı görevlerin dosyaları mı netleşmeli. | 0 / M |
| `05:yeni-8/10` | 8: önce tasarımı düzelt; 10: BELGE + olası veri ihtiyacı | Çip başına işlem, atomik toplu Kaydet ihtiyacını kaldırabilir. Koordinatörün hedef hesap üzerindeki yetkisi mevcut veriden hesaplanamıyorsa yalnız belge yetmez. | S / S–M |
| BE-013 | Açıklamayı düzelt | Yönetici kendi belirlediği geçici parolayı `updateAccount` ile atayabilir; `createUser` parolayı döndürmez. Koordinatör için aynı teslim akışı mevcut sayılmamalı. | BELGE S |
| `06:yeni-1/2/3` | BE; F5 öncelikli | Yükleme zamanı, yükleyen adı ve özellikle yönetici klasör süzmesi/S3 yönlendirmesi. Mevcut string dizisini nesneye çevirmeyi “eklemeli” saymayın. | S / S / M |
| `06:yeni-4/5/7` | ÜRÜN → ayrı BE | Etiket değiştirme, dosya taşıma, dosya çöp kutusu ayrı davranışlar. Taşıma iki görevin kanıt durumunu etkiler. | S / M / M–L |
| `06:yeni-6/8/9/10` | 6 BE veya metin düzeltme; 8 BELGE; 9 BE; 10 TASARIM | Arama vaadi mevcut dosya adı aramasına insin; sıralama belgelenmeli; süzülmüş toplam yok; PDF mevcut bağımsız kategori değil. | M / S / S–M / S |
| `06:yeni-11/12` | ÜRÜN; hemen BE açma | “Grup” departman türü olabilir; hiyerarşi varsaymayın. Kişi adları koordinatör mü yükleyen mi bilinmeden alan tasarlamayın. | Karardan sonra |
| `08:yeni-1/8`, `09:yeni-12` | Özet ailesi; yetkileri ayrı tut | Üye merceğine bütün birim iş sayaçlarını açmayın. Ekip sayısı ile görünür görev sayısı aynı yetki konusu değildir. | M |
| `08:yeni-2/3` | BE | Açıklama okuması ile oluştur/bağla çakışmasının güvenli çözümü ayrı işler. Hata mesajından kimlik ayrıştırma çözüm değildir. | S / M |
| `08:yeni-4/5` | BELGE + TASARIM | Yetki tablosu ve ASCII kod kuralı belgelensin; Türkçe örnek kodları kabul edilmiş sunucu biçimi sanmayın. | S |
| `08:yeni-6/7/9/10` | ÜRÜN; 9 önce doğrulama | Toplu atama atomikliği, yapı kopyalama ve üye ekip görünürlüğü ayrı kararlar. `meeting_count=0` kod gözlemi için uç bazlı anlam/test talep edin; gerçek sıfır diye sunmayın. | M / M / S–M / M |
| `09:yeni-1/2/8` | BE; 2’yi BE-021’e bağla | Satır özetleri, toplantı süzgeç/toplamları ve not süzgeç/toplamları ayrı kaynaklar. | S–M |
| `09:yeni-3`, BE-022 | W7’ye bağlı koşullu BE | Liste konferans durumu ve bağlı kişi sayısı ayrı alanlar; F4 engeli yapılmamalı. | S–M |
| `09:yeni-4/5/6/7/13` | Okuma zenginleştirmeleri | Kod/silinmişlik, oluşturan/işaretleyen/silen adı; katılımcı rol-birim gruplaması ayrıca ürün anlamı ister. | S; gruplama M |
| `09:yeni-9` | BE; F4 önemli | Dönüşmüş görevin S3 başlığını kuracak departman bilgisi gerekli. Kısa görev kodu bu bağlantının önkoşulu değildir. | S–M |
| `09:yeni-10/11/14/15` | 10 koşullu BE; 11 BE; 14 BE; 15 BELGE | Toplu ekleme atomik olmak zorunda değil. Aday yetkisi, işlem anahtarı ve akış belgelemesi ayrı kabul ölçütleri taşımalı. | M / M / M / S |
| `10:yeni-1/3/4/7/8/9` | BE; farklı alt işler | Süzgeç, okundu imleci, program rol bilgisi, paylaşılan içerik listesi, çift yönlü görev bağı ve önizleme türü birbirinden ayrılmalı. | S–M; bütün aile L |
| `10:yeni-2/5/6/10/11` | ÜRÜN/TASARIM | Varsayılan: mevcut sistem grupları, dört tepki, isimli anket; kullanıcı sohbet sabitlemesi ve başka hesap gözüyle okuma yok. | Yeni özellik onaylanırsa S–L |
| BE-027/028/029 | Yeniden boyutlandır/böl | Sohbet bildirimi yokken sessize alma yalnız tercih alanı değildir. 028: grup okundu bilgisi ve iletme ayrı. 029: arşive birleşik kayıt atomikliği ve admin yükleme yasağı çözülmeli. | 027 L; 028 M+M; 029 M |

**BE-030 — şemsiye kalsın, tek L teslim işi olmasın** (`01b/eksikler.md:102–114`):

| Paket | Karar | Gerekçe | Boyut |
|---|---|---|---|
| P0 | Önce karar | Yetki, kuruluş/program kapsamı, kategori, saklama ve metin doğruluğu; IP/tarayıcı toplama varsayılan **hayır**. | Karar |
| P1 | BE | Yeni olayların kapsamı ve indeksler. Eski olaylara bugünkü departmanı tarihsel gerçekmiş gibi doldurmayın; bilinmeyen kapsam açık kalsın. | M |
| P2 | BE | Okuma + sözlük + hedef çözümü birlikte. Hedefin bugünkü adı tarihsel ad gibi sunulmasın; hedefe gitme kendi yetkisine tabi olsun. | L |
| P3 | BE | Aynı süzgeç semantiğiyle toplam/faset/histogram. | M |
| P4 | BE | Süzgeçli CSV, tavan/kota, bilet ve güvenli hücre çıktısı. | M |
| P5 | Ayrı yetki genişlemesi | BE-007/010/015 ve ilgili BE-018 tüketicileri bu pakete bağlansın; admin ekranının açılması onları otomatik kapatmaz. | M–L |
| P6 | Koşullu; varsayılan açma | Yeni kişisel veri toplama kararı verilmeden IP/kullanıcı aracısı eklenmesin. | S–M |

**BE-031 — XL şemsiye ve önerilen bölünme doğru yönde; 15 öneri backend kabulü değildir** (`11/eksikler.md:19–33`, `214–236`):

| Öneri | Karar | Gerekçe | Boyut |
|---|---|---|---|
| yeni-1 | ÜRÜN/ADR önce | Kapsam, yaşam döngüsü, yetki, tavan, yazma bütçesi. “Bağımsız çekirdek” kendiliğinden ayrı servis demek değildir. | S |
| yeni-2 | 2a/2b ayrımı koru | Çekirdek CRUD ile önizleme/sayaç zenginleştirmesi ayrı. İlk teslimde sahip yetkisi zorunlu; ACL sonradan gelecek diye açık CRUD yayımlanamaz. | M+M |
| yeni-3/4/5 | BE | ACL, sütun yapısı, yetkili kişi adayları. Ortak kişi altyapısı mümkündür; herkese bütün program dizini varsayılmaz. | M+M+M |
| yeni-6 + yeni-11a | Bir çekirdek teslim | Hücre yazımı ve değişiklik kaydı aynı transaction’da; sürüm/429/yarım kayıt davranışı birlikte doğrulanmalı. | L |
| yeni-7/8 | Ayrı BE | NIZAM referansları ile tablolar arası bağlar farklı yetki ve yaşam döngüsü taşır. | M / L |
| yeni-9/10 | BE | Kayıpsız tip dönüşümü; sunucu arama/sıralama/özet. Sayı/ondalık tipinin ilk kapsamı ürünce belirlenmeli. | M+M |
| yeni-11b | Ayrı BE | Geçmiş okuma ve geri alma; araya giren değişikliği sessizce ezemez. Audit ekranıyla birleştirmeyin. | L |
| yeni-12/13 | BE + yetki kararı | Yorum/bahsetme bildirimi ve sütun kilidi. “Koordinatör”ün tablo rolü mü program rolü mü olduğu belirlenmeli. | M / S–M |
| yeni-14 | ÜRÜN → BE | Gerçek zamanlı uzlaştırma ile canlı imleç/varlık ayrı teslim edilebilir. | L |
| yeni-15 | İlk aşamada backend zorunlu değil | Sabit şablonlar istemcide tutulabilir; kullanıcı tanımlı/sunucudan yönetilen katalog ayrı ihtiyaçtır. | 0–S |

## 5. Yol haritası etkisi

| Karar | Hüküm | Gerekçe |
|---|---|---|
| **K6 hata kodları** | **Değiştir** | `program.not_found`, `reporting.not_authorized` eklenmeli. Ancak her 403/404’ü kapsam kaybı saymayın: kaynak silinmesi, eylem yasağı ve program görünürlüğü kaybı ayrılmalı. `00/eksikler.md:38`. |
| **K1 kaynak istisnası** | **Değiştir** | Yalnız toplantılar için dar istisna yetmez. Organization, records, reporting ve chat kuralları için de kaynak matrisi gerekiyor. Nihai hedef İ §4’ü genişletmek; geçişte sürümlü modül kural kimlikleri kullanılabilir. |
| **01 yönetici panosunun F1’e çekilmesi** | **Ürün sahibine sor** | Mevcut `reportDashboard` pek çok bölgeyi karşılıyor; “uç yok, F6 gerekir” gerekçesi yanlış. Varsayılanım: F1 KPI + sade özet; tam kart/akış/rapor deneyimi F6. Uç varlığı tek başına faz kapsamını büyütmez. |
| **K3 çoklu koordinatörlük süzgeci** | **Değiştirme** | v1 tek seçim; mevcut sözleşmeyle uyumlu. Çoklu seçim için görünürlükle kesişen sunucu süzgeci ayrıca istenebilir. K3’e sayfalama/N+1/toplu yazma ayrımını açıklayan not ekleyin. |
| **K4 / ADR-0024 / 03d** | **Değiştirme** | Alt görev tarihlerini gerçek zamanlama ve ana göreve taşmama kuralına dönüştürmeyin. Sayaçlar gerçek olabilir; alt görev çubukları nötr/devre dışı kalmalı. Aktif zamanlama ayrı ürün ve backend ADR kararıdır. |
| **K8 Tablolar gerçek zamanlı** | **Şimdi değiştirme; modül fazında ürün sahibine sor** | v1 dışında. İleride yalnız yenilemeyle teslim edilecekse “herkes anında görür” vaadi kaldırılmalı; canlı ortak çalışma istenirse K8 açıkça genişletilmeli. |
| **K14 Arşiv/Mesajlar görünürlüğü** | **Ürün sahibine sor; varsayılan gizli** | Gruplar arasında karar ayrışmış. Ana menüde gizli; mevcut ekran içindeki faz dışı eylemler gerekiyorsa açıklamalı devre dışı. Yardım/Asistan/zil için de aynı matrisi kullanın. |
| **F3 tarih talebi düğmeleri F1’de** | **Fazı değiştirme; görünürlüğü netleştir** | Okuma göstergesi mevcut veriden gelebilir. Talep gönder/onayla F3’e kadar devre dışı olsun. “Talepleri incele” düğmesini sessizce başka filtre eylemine dönüştürmeyin. |
| **F5 silinenler/geri yükleme** | **Değiştir — kapsam açıklaması** | Görev geri yükleme ile dosya geri yükleme ayrılmalı. `deleteFile` kalıcı; dosya çöp kutusu mevcut özellik değildir. `06/eksikler.md:24`. |

## 6. Ürün sahibi soruları

Aşağıdaki varsayılanlar **öneridir; verilmiş karar sayılmamalıdır**. İlk beş kararın uygulayıcıya açıkça iletilmesi F0/F1 için gereklidir; sonraki fazların soruları F1’i bekletmemeli.

1. **[F0 engeli] Mercek ve yönetim menüsü nasıl ilişkilenecek?** Varsayılan: yetki `company_admin`/üyelik olgularından; mercek içerik kapsamını seçer. Yönetici mercek değiştirince yönetim yetkisini kaybetmez. Çok seçenek varsa ilk departmana sessiz geçiş yok. Kaynak: `00/mekanizma.md:35,55`, `00/eksikler.md:41`.
2. **[F0 engeli] Faz dışı menüler ve düğmeler nasıl görünecek?** Varsayılan: Arşiv, Mesajlar, Asistan ve hedefsiz Yardım gizli; zil paneli yoksa anlamsız tıklanabilir kontrol bırakılmasın. Ekran içi gelecekteki eylemler açıklamalı devre dışı olabilir. Kaynak: `00/README.md:20–24`, `01/README.md:38`, `08/README.md:23`.
3. **[F1 engeli] Çizilmemiş görev formları ve sade ana sayfa nasıl üretilecek?** Varsayılan: kabul edilmiş ortak bileşenlerle minimum form/panel tasarımı; üye “bana atananlar”, koordinatör seçili birim işleri, admin mevcut KPI’lar. Yeni kuyruk/kısayol tasarımı kendiliğinden eklenmesin. Kaynak: `03/README.md:22`, `01/README.md:34`.
4. **[F1 engeli] Liste sınırları nasıl anlatılacak?** Varsayılan: tek departman seçimi, “Daha fazla yükle”, yüklenen sonuçlarda arama/sıralama ve açık kapsam etiketi. Tam toplam/sayfa numarası taklidi yok. Kaynak: `03/README.md:20–21`, `03/eksikler.md:43–44`.
5. **[F1 engeli] Kanıt, durumlar ve tarih taleplerinde hangi davranış korunacak?** Varsayılan: beş durum; herhangi uygun dosya kanıt; yüklemede etiket seçimi; tarih talebi yazmaları F3. Yeni zorunluluk bayrakları ve ayrı kanıt türü eklenmesin. Kaynak: `03/eksikler.md:24,45–46`, `01/ozellikler.md:162`.
6. **Dar menüde kapsam ve tercihler?** Varsayılan: kapsam seçimi dar görünümde erişilebilir; tek seçenek salt gösterim; daraltma yalnız oturum belleğinde, kalıcılık istenirse izinli tercihlere açıkça eklenir. Kaynak: `00/README.md:25–27`.
7. **F1 yönetici ana sayfası ne kadar genişlesin?** Varsayılan: KPI ve sade özet; tam koordinatörlük kartları F6. Rol sayaçlarının kesişebileceği ve admin sayısının şirket genelinden geldiği açıklansın. Kaynak: `01/README.md:19–21,39–41`.
8. **Son işlemler ve silinen kayıtlar neye götürsün?** Varsayılan: sahte akış yok; nötr eksik alanı. Birleşik silinenler hedefi yokken karma sayacı görev çöp kutusuna bağlamayın. Gerçek akış geldiğinde sade biçim, sınırlı satır ve yetkili hedefe bağlantı. Kaynak: `01/README.md:36–37`.
9. **“Kopyala”, toplu seçim ve öncelik gösterimi?** Varsayılan: bağlantıyı kopyala; toplu seçim kontrolleri gizli; öncelik form/detayda mevcut veriyle, yeni liste sütunu ancak tasarım kararıyla. Kaynak: `03/README.md:23–25`.
10. **Hatırlat özelliği ürün kapsamında mı?** Varsayılan: kayıt açık, düğmeler devre dışı; alıcı, tekrar sıklığı ve bildirim kanalı kararı olmadan etkinleştirme yok. Kaynak: `01/README.md:35`, `03c/README.md:25`.
11. **Gantt sürükleme, geri alma ve rol yüzleri?** Varsayılan: mevcut yetkisi olan doğrudan tarih düzenler; ayrı düğme talep açar; üye düzenlemez. Gönderilmiş zincir değişikliğine otomatik “geri al” yok. Kaynak: `03c/README.md:20–24`.
12. **Gantt okları, sezon şeridi ve dışa aktarım?** Varsayılan: yalnız görünür uçlar arasında gerçek oklar; izinli bağımlılık eylemleri; görev aralığına doğru etiket; dışa aktarım pilotla doğrulanır, hazır değilse devre dışı. Kaynak: `03c/README.md:22,25`.
13. **Kullanıcı rol düzenleme ve Kaydet modeli?** Varsayılan: şirket Admin anahtarı ayrı; program/departman çipinde tek üyelik rolü; çip işlemleri ayrı onay ve sonuçla uygulanır. Toplu atomik Kaydet vaat edilmez. Kaynak: `05/README.md:25`, `05/eksikler.md:46–47`.
14. **Kullanıcı listesi kapsamı ve erişimi?** Varsayılan: yöneticiye şirket listesi; seçili program üyelikleri açık etiketlenir. Koordinatör için aynı admin ekranını taklit etmeyin; kişisel takip yalnız yetkili görev kümesini gösterir. Kaynak: `05/README.md:26,30`, `05/eksikler.md:52`.
15. **Davet, kilit ve silinen kullanıcı akışları?** Varsayılan: “Kullanıcı oluştur”; yönetici belirlediği geçici parola akışı. Durum okunamıyorsa kilitle/aç anahtarı tahmin edilmez. Silinenler ayrı yönetim akışı olarak tasarlanır. Kaynak: `05/README.md:27–29`.
16. **05b eylemleri ve dosyaları?** Varsayılan: görev atamada hedef departman açık seçilir; profil düzenleme yönetim paneline gider; Mesaj/Rapor/Etkinlik ilgili fazı bekler. “Dosyalar” yükledikleri mi görev dosyaları mı kararlaştırılana kadar sayı yok. Kaynak: `05/README.md:31`, `05/eksikler.md:27,48–50`.
17. **Koordinatörlük ekranı kimlere ve nasıl açılsın?** Varsayılan: yönetim ekranı yöneticide; koordinatör için kendi birimi görünümü ayrıca tanımlanır; üyeye ekip yönetimi yok. v1 düz ızgara, sahte üst birim başlığı yok. Kaynak: `08/README.md:20–21`.
18. **08’in eksik formları ve “sezona kopyala”?** Varsayılan: ortak bileşenlerle tasarlanmış form; yapı kopyalama ile görev aktarımı ayrı eylemler. Kopyala düğmesi taşıma yapmasın. Kaynak: `08/README.md:22,24`.
19. **Arşiv yükleme, etiket ve dosya yaşam döngüsü?** Varsayılan: görev seçerek yükle; mevcut altı etiket; kalıcı silme açıkça belirtilir; dosya geri yükleme ayrıca istenirse yeni kapsam. Kaynak: `06/README.md:21–23`.
20. **Arşivde grup/kişi/“Kurumsal hafıza” ne demek?** Varsayılan: “Dosya arşivi”; belirsiz grup rozeti ve kişi satırı gösterilmez. Tek klasörlü rol doğrudan kendi klasörüne gidebilir. Kaynak: `06/README.md:24–26`.
21. **Toplantı videosu F4’te nasıl görünmeli?** Varsayılan: video şeridi ve sahte Canlı/Bekliyor durumları gizli; W7’de gerçek sağlayıcı durumu bağlanır; kullanıcıya sağlayıcı markası gösterilmez. Kaynak: `09/README.md:20,24`.
22. **Toplantı seçicileri, düzenleme ve dosyalar?** Varsayılan: ortak kişi seçici ve oluşturmayla tutarlı düzenleme formu; departman değiştirme admin yetkisiyle; toplantı dosyası yeni kapsam olmadan eklenmez. Kaynak: `09/README.md:21–23`.
23. **Toplantı tarih/not sınırı ve filtreler?** Varsayılan: sözleşmeyle uyumlu tarih kuralı; “yalnız ileri” yanlış metni düzeltilir. Not sınırı belgelenir; tarih filtresi tasarlanırsa BE-021 kapsamına alınır. Kaynak: `09/README.md:25`, `09/eksikler.md:54`.
24. **Sohbet paylaşımı ve başka kişinin gözünden okuma?** Varsayılan: mevcut sohbet paylaşım semantiği; özetin sohbet üyelerine açıldığı kullanıcıya anlatılır. Mor “Okuyan” şeridi tuval açıklaması, ürün yetkisi değildir. Kaynak: `10/README.md:20`, `10/eksikler.md:66`.
25. **Sohbet grupları, tepki, anket, okundu ve sessize alma?** Varsayılan: mevcut gruplar/dört tepki/isimli anket; grup okundu tiki yok; çalışmayan sessize alma kontrolü yok. Ayrı bildirim ürünü kararı gerekirse BE-027 genişletilir. Kaynak: `10/README.md:21–24`, `10/eksikler.md:23,27`.
26. **Sohbetten toplantı/görev ve çevrimiçi metinleri?** Varsayılan: toplantı formuna açık aktarım, adaylar yeniden doğrulanır; dönüşmüş görev bağlantısı work yetkisiyle açılır; kaynak izi yokken vaat edilmez; mevcut erişim/çevrimiçi metinleri kullanılır. Kaynak: `10/README.md:25–27`.
27. **Audit ekranının yetkisi, kapsamı ve saklaması?** Varsayılan: ilk teslim yönetici/kuruluş kapsamı, program süzgeci ve kapsamı bilinmeyen kayıt ayrımı; saklama süresi ürünün ilgili karar sürecinde kesinleşir. F1 engeli değil. Kaynak: `01b/README.md:20–22`.
28. **Audit ayrıntısı, kategoriler, CSV ve filtreler?** Varsayılan: yeni IP/tarayıcı toplama yok; kategori sözlüğü ortak; hedef kendi yetkisiyle açılır; CSV etkin süzgecin tamamını tanımlı tavanla dışa aktarır; yinelenen filtreler sadeleşir. Çizilmeyen KPI zorunlu sayılmaz. Kaynak: `01b/README.md:23–26`, `01b/eksikler.md:95–98`.
29. **Tabloların kapsamı ve yaşam döngüsü?** Varsayılan: ilk entegrasyon program kapsamlı; silme/aktarım/sahip ayrılması açık kurallarla. Bağımsız kullanılabilirlik teknik sınır olarak korunsun; ilk sürüme ikinci kapsam modeli eklenmesin. Kaynak: `11/README.md:20`, `11/eksikler.md:204`.
30. **Tablo paylaşımı ve gizlilik?** Varsayılan: kişi bazlı ACL; düz URL erişim vermez; paylaşımı sahip yönetir; erişimsiz hedef adı/sayısı gizli; kişi adayları yetkili kümeyle sınırlı. Kaynak: `11/README.md:21,27`, `11/eksikler.md:206–207`.
31. **Tablolarda canlı çalışma ne kadar gerekli?** Varsayılan: önce güvenilir kayıt/çakışma/uzlaştırma; anlık ortaklık ürün vaadi korunacaksa SSE eklenir; imleç/varlık sonraki teslim olabilir. Kaynak: `11/README.md:22`.
32. **Tablo tipleri, kilit, dönüşüm ve yönetim eylemleri?** Varsayılan: sayı/ondalık ilk çekirdekte; veri kaybettiren dönüşüme önizleme/onay; kilit tablo yetkisiyle; sahiplik devri tanımlı. Excel, çoğaltma ve kullanıcı şablonu ayrı kapsam. Satır/sütun tavanı ve genişliğin ortak/kişisel oluşu ayrıca sabitlenir. Kaynak: `11/README.md:23–26`, `11/eksikler.md:208–211`.

## 7. İşletme sırası ve riskler

| Sıra / grup | İlk üç risk |
|---|---|
| **1 — 00 Ortak / F0** | Mercek–yetki–kapsam karışması; başarısız logout/yenileme davranışı; faz görünürlüğü ve ortak sorgu anahtarları. |
| **2 — 03 Görevler / F1** | İmleçli kümenin tam toplam sanılması; sürüm/işlem anahtarı/atama kısmi başarısı; tasarlanmamış formlar ve admin baskın not/dosya yasağı. |
| **3 — 01 Sade / F1** | Birleşik rolde “bana atananlar” filtresi; yaklaşık sayacı kesin sunma; sahte geçmiş ve kapsamı belirsiz silinenler bağlantısı. |
| **4 — 08 Koordinatörlükler / F2** | Katalog departmanı–program bağı ayrımı; oluştur/bağla iki adımının yarım kalması; rol düşürme/çıkarma etkisi ve kopyala–taşı farkı. |
| **5 — 05 Kullanıcılar / F2** | Kişiye global Koordinatör rolü verme yanılgısı; parola/admin/kilit olgularının okunamaması; toplu Kaydet’in atomik sanılması. |
| **6 — 03c Gantt / F3** | 200 kesilmesi ve görünmeyen bağlar; tarih yazımı/çift uzatma/geri alma; ADR-0024 dışı alt görev davranışı. **Kütüphane pilotu ise F0’da kalır.** |
| **7 — 09 Toplantılar / F4** | Departman-temelli görünürlük ile katılımcı listesini karıştırma; anahtarsız oluşturmalarda tekrar; dönüşmüş görevin kapsam yönlendirmesi ve video fazı. |
| **8 — 06 Arşiv / F5** | Admin S3 başlığı/klasör süzmesi; dosya silmeyi geri alınabilir sanma; yükleme/etiket/taşıma ile kanıt ilişkisinin bozulması. |
| **9 — 01b Geçmiş + 01 tam / v1 sonrası** | Okuma yetkisi ve saklama kararı; eksik tarihsel kapsamı uydurma; ad/hedef çözümü ve büyük toplam/CSV maliyeti. |
| **10 — 10 Mesajlar / F7** | Sohbet paylaşımı ile kaynak erişimini karıştırma; okunma imleci/SSE uzlaştırması; bildirim, iletme ve birleşik yüklemeyi var sayma. |
| **11 — 11 Tablolar / ayrı modül fazı** | ACL/kapsamın belirsizliği; hücre sürümü, bütçe ve kayıpsızlık; referans gizliliği, geri alma ve gerçek zamanlı ortak çalışma. |

**F0 başlamadan mutlaka netleşmeli:**

- CX-M-04: yürütme istemlerinin yeni seti gerçekten okutması; kabul edilmiş kaynak sürümü.
- CX-T-04 ve CX-M-02: mercek/capability, ilk kapsam seçimi ve yetki kaybı davranışı.
- CX-T-01: ortak anahtar üretimi ve kapsam değişiminde iptal/önbellek temizliği.
- CX-S-10: logout başarısızlığının açık durumu.
- Faz görünürlük matrisi; statik öğenin sahte veri üretmemesi.
- API ana sürüm kapısı ve desteklenmeyen minör/etiket karşılaştırmalarının yapılmaması.
- Mevcut WEB-0 PR/CI/birleştirme kapısının gerçekleştiğinin doğrulanması.

**F1 başlamadan mutlaka netleşmeli:**

- Görev oluşturma/detay/not/dosya/durum menüsünün çizilmemiş bölümleri için kabul edilmiş tasarım yaklaşımı.
- Tek departman, imleç ve yüklenen küme üzerindeki süzgeç/sayaç sunumu.
- Beş durum, kanıt etiketi, admin not/dosya yasağı ve birleşik rol davranışı.
- İşlem anahtarının eylem başına üretimi; ek atama başarısızlığının kısmi başarı olarak sunulması.
- Sade ana sayfanın rol bazlı kapsamı; F3/F5/F7 bağlantılarının davranışı.
- Kullanılacak stub’ların kalıcı BE kimlikleri. **BE-003 gibi yeni endpoint’lerin bitmesi, dürüst sınırlı gösterim kabul edilmişse F1’in başlaması için zorunlu değildir.**

## 8. Reddettiğin öneriler

| Öneri | Neden katılmıyorum? |
|---|---|
| **“Ana sayfada çizilmiyor; BE-008 kapansın.”** | Diğer iki tuvalde Hatırlat var. Tüketici kapsamı düzeltilmeli; ürünün tamamı adına vazgeçme kararı verilemez. |
| **“Video uçları var; video işi vazgeçildi.”** | Backend eksiğinin kalkmasıyla web entegrasyonu/W7 ertelemesi farklıdır. |
| **“Admin panosu mevcut; tam ana sayfa F1’e alınmalı.”** | Teknik olanak doğru; faz kapsamını genişletme gerekçesi tek başına yeterli değil. |
| **“Her N istek K3’e aykırı.”** | Aynı ucun sayfalaması, kullanıcıyla açılan tek detay, N+1 zenginleştirme ve toplu mutasyon ayrı sorunlardır. `08/eksikler.md:51` genellemesi reddedilmeli. |
| **“Admin arşivi için ilk departmanı teknik kapsam seçelim.”** | `06/eksikler.md:47` önerisi K2’yi gizlice aşar ve gerçek dosyanın S3 yönlendirmesini çözmez. F5 öncesi sözleşme açıklığı gerekir. |
| **“cascade_count=0 ise ters güncelleme güvenli geri aldır.”** | `03c/eksikler.md:22`: araya giren değişiklik, yan etkiler ve sürüm hâlâ önemlidir. Bu, garantili undo değildir. |
| **“200’den sonrası yaklaşık; 4×200’den sonra aramayı daralt.”** | Sayfa tavanı toplam tavan değildir. Sunucu araması yoksa metni daraltmak yüklenmemiş kaydı buldurmaz (`11/backend.md:48`). |
| **“Eksikteki her satır stub; örnek akış da gösterilebilir.”** | Belge/ürün kararına stub gerekmez; sahte işlem geçmişi kullanıcıya gerçek diye gösterilemez. |
| **“Sohbetin kilitli referans kuralını Tablolar’a taşıyalım.”** | Atıf yapılan sohbet kuralı öyle çalışmıyor. Tablolar için daha dar gizlilik seçilebilir, fakat yeni ürün kararı olarak. |
| **“Arşiv zenginleştirmesinin tamamı kırıcı değil.”** | String öğeyi nesneye çevirmek tip değişikliğidir. `details` alanını nesne saymak da mevcut sözleşmeye uymaz. |
| **“Sunucu ürün minörünü API pin minörüyle karşılaştıralım.”** | `00/eksikler.md:21` için tanımlanmış eşdeğerlik yok; geliştirici uyarısı bile yanlış uyumsuzluk üretebilir. |
| **“Sonnet açık bulgularının tamamı hâlâ açık.”** | Güncel dosyalarda düzeltilmiş örnekler var. Denetim kaydı güncellenmeli; eski bulgu yeni hata diye tekrar raporlanmamalı. |