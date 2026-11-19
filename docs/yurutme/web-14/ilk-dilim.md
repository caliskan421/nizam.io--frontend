# WEB-F14 ilk dilim · Tablo listesi ve şablondan oluşturma

**Durum** · Salt okunur keşif ve uygulama iş kartı. Taban frontend `c380ac81`, F13A/B/C birleşik, ana dal temiz ve pin `v0.28.0-api`. Bu kart ile uygulama dalı açılmadı. Astra koordinasyon, Sol uygulama, Terra bağımsız kabul, Opus salt okunur son denetim.

## Teslim tanımı

11 numaralı liste çizimindeki **Hızlı başlangıç**, **Boş tablo**, şablon kartları ve mevcut tablo kartları erişilebilen gerçek verilerle çalışır. Şablon tıklandığında kişi ad seçimini yapar ve mevcut çalışma alanında yalnız sütun yapısını içeren yeni tablo oluşturur. Boş tablo yolu ve F13 düzenleme, arama dışı kullanıcı davranışları korunur. Hızlı başlangıcın canlı şablonları etkin alandaki şablon listesiyle sınırlıdır. Alan değiştirilerek diğer alandaki şablonlara ulaşılır, bu dilim alan/programlar arası hedef seçici eklemez. Yeni rota açılmaz. Şablondan bir tablo yapabilme, kullanıcıyı kaynak tablonun sahibi yapmaz.

Mevcut yönetici/koordinatör yetki modeli uygulanır. Program geneli yönetici okuması, etkili rol, paylaşım listesi ve aday dizini backend ekibine devredilmiş kapsam olarak kalır. Yönetici tasarım prototipi bu dilime alınmaz. Paylaşım düzenleme, projeler, tam veri kopyası, alan/programlar arası kopyalama, taşıma, öneri, referans/ek yazımı, SSE, presence, yorum ve geri alma ayrı dilimlerdir. Sahip için `set_template` mevcut bir komuttur. İlk dilimde son kullanıcıya şablon işaretleme kontrolü eklenmez, canlı kabul fikstürü sahibi adına komutla hazırlanır.

## Ekran ve sözleşme

| Yüzey | Sözleşme ve bağlama | Kullanıcı davranışı |
| --- | --- | --- |
| 11 · Çalışma alanı ve kart listesi | F13 `listPersonalTables` GET `/v1/personal/tables` S2 veya `listTables` GET `/v1/tables` S3, `items/next_cursor`. Sahip karşılaştırması `owner_id` ile mevcut hesap. | Kişisel ve Koordinatörlük seçimi sürer. Çizimin Tümü/Oluşturduklarım/Benimle paylaşılanlar bölümü etkin alanın yüklenen kartlarına uygulanır. Üçüncü seçenek doğrudan ve ekip yoluyla erişebildiği sahip olmadığı tabloları kapsar. Arama yüklenen tablo adlarında çalışır. İmleç varken “Daha fazla tablo” eylemi filtre sonucunda da korunur, boş metin henüz yüklenmemiş sonuçları kesin dışlamaz. |
| 11 · Hızlı başlangıç | Aynı iki liste ucu, ayrı `template=true` sorgusu. `Table.is_template` ve sunucu ACL; S2’de yalnız program, S3’te seçili departman. | Boş tablo kartı F13 oluşturma formuna bağlanır. Şablon kartı yalnız sunucudan gelen ad ile gösterilir. Yükleniyor, boş, erişim/hata ve yeniden dene durumları normal tablo listesinden ayrı. Şablon listesi sayfalıdır. |
| Şablondan oluştur penceresi | Yapı kopyası `copyTableToPersonal` POST `/v1/personal/table-copies` S2 veya `copyTableToCoordinatorship` POST `/v1/table-copies` S3. Gövde `{source_table_id,source_space,mode:"structure"}` ve gerekiyorsa `source_department_id`, isteğe bağlı `name`. Şablon ve hedef etkin alanda olduğundan `source_program_id` ve `project_id` gönderilmez. | Kaynak adı ve hedef kapsam görünür. Ad boş bırakılırsa `name` alanı atlanır ve sunucu kaynak adını seçer, girilen ad F13 doğrulamasıyla gider. Kopya yalnız sütunları içerir. Kaynağın satırları, hücreleri, ekleri, paylaşım izinleri, proje bağı, geçmişi ve şablon işareti kopyalanmaz. Hedefin sahibi kopyalayan hesaptır. |
| Sonuç ve hata | 201 yeni, aynı anahtar/gövde tekrarı 200 ve `replayed`. Başarıda `TableResult.table_id`. 403 gerçek izin, 404 kayıp veya görünmeyen kaynak/kapsam için aynı güvenli hal, 422 doğrulama, 429 bekleme. | Yalnız güncel eylemin makbuzu ile hedef liste yenilenir ve yeni detay açılır. Kaynak erişimi değişmişse eşdeğer güvenli hata ve şablon listesini yeniden okuma. Belirsiz ilk sonuçta donmuş yük ve aynı anahtarla bir açık tekrar. İkinci sonuç başarı dışındaysa form kilitli kalır. Yeni işlem yalnız hedef liste taze okunduktan ve eski form kapatıldıktan sonra ayrı kullanıcı eylemiyle başlar. |

Şablon bayrağı tek başına okuma yetkisi vermez. Yapı kopyası okuma yetkisi bulunan viewer hesabıyla mümkündür, tam kopya için bu çıkarım yapılmaz. `TableCopyRequest` genel yapı kopyasıdır ve komut düzeyinde “hâlâ şablon” önkoşulu taşımaz. Liste taze okunarak işareti kaldırılan kaynak sonraki seçimlerden düşer. İşaret değişiminin seçim ile komut arasındaki anda atomik olarak reddedileceği varsayılmaz. Erişim ise kopyalama anında sunucuda yeniden denetlenir.

Kartın başlık, ikon ve yerleşimi 11 çizimine uyar. `TableList` avatar, son düzenleme zamanı, hücre/sütun önizlemesi, toplam/süzgeç sayaçları ve çağıranın etkin tablo rolünü döndürmez. Kartta yalnız doğrulanabilen sahip bilgisi ve şablon niteliği kullanılır. Örnek çizimdeki “Görev listesi”, “Etkinlik planı” ve “Envanter” ürünün gömülü hazır şablonları sayılmaz. Liste açılırken kart başına detay isteği gönderilmez. Sütun adı için ayrı detay önizlemesi ve sunucu toplamı/sıralaması bu dilim dışında.

## Uygulama ve kabul matrisi

| Adım | Dosya adayları | Kabul kanıtı |
| --- | --- | --- |
| A · Liste çizimi ve kapsam | `src/modules/tables/pages/TablesPage.vue`, `components/TableCards.vue`, `components/TableTemplates.vue`, `pages/tables.css`, `api/tables.ts`, `src/shared/http/query-keys.ts` | Normal ve şablon sorgu anahtarı ve imleci ayrılır, ortak kapsam geçersizleme öneki korunur. Eksik kapsamda iki istek de çıkmaz. S2/S3 başlıkları, 2. sayfa, sadece yüklenen ada/sahipliğe göre süzme, geç yanıt ve oturum/kapsam değişimi hedefli MSW. |
| B · Sütun yapısını kopyalama | `src/modules/tables/api/copy.ts`, `model/types.ts`, `components/CopyTableForm.vue`, `TablesPage.vue`, ortak hedef liste invalidation eşlemesi | Üretilmiş `TableCopyRequest/TableResult`, ortak CSRF ve anahtarlı koruma. Form kapanınca/scope değişince geç sonuç yeni ekrana geçmez. MSW 201/200, aynı gövde/anahtar, kayıp kaynak 404, 403, belirsiz tekrar 409 ve liste yenileme başarısızken form kilidi. F13 Boş tablo regresyonu. |
| C · Bağımsız gerçek kabul | Terra ayrı QA alanı. Yayımlı v0.28 ile sahip, listeye erişimli viewer ve erişimsiz hesap. Aynı programda kişisel ve birim fikstürleri. | Sahip şablon bayrağı koyar, görünür viewer sunucu listesinden yapı kopyalar, erişimsiz veya yetkisi yeni kalkan hesap sonucu alamaz. İki alanın doğru başlıkları, kopyada sütun türü/sırası ve boş satırlar, kopya sahipliği, kaynak ve izinlerin değişmemesi, 1440/390 koyu/açık, klavye odağı, CSP/pageerror ve taşma. |

Yalnız ihtiyaç olan dar testler ve gerekli type/lint/format/build yerelde. PR kendi HEAD’iyle tam CI üç SUCCESS, Terra kanıtı ve Opus hükmü üzerinden kapanır. Geniş BE-031 ve tablo eksik kayıtları yalnız kabul edilen alt davranışlara göre güncellenir.

## Kaynaklar

- [11 liste çizimi](../../tasarim/kaynak/Tablolar.dc.html) · [11 ekran envanteri](../../ekranlar/11-tablolar/README.md) · [F13 kartı](../web-13/README.md) · [API pini](../../../api-pin.json)
- [v0.28 OpenAPI](https://github.com/caliskan421/nizam.io--backend/blob/v0.28.0-api/docs/api/openapi.yaml) · [TABLES-K16](https://github.com/caliskan421/nizam.io--backend/blob/v0.28.0-api/internal/modules/tables/README.md)
