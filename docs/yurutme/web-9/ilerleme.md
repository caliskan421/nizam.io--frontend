# WEB-9 ilerleme

Koordinatör her oturum kapanışında bir kayıt ekler; sonraki oturum buradan başlar. Uygulayıcılar bu dosyaya yazmaz (ham kaynak `.git/koordinator/f5-notlar.md` ve `web9-kararlar.md`).

**F9 AÇILDI — karar 2026-11-16 (P77), yürütme 2026-11-17; kapsam 2026-11-17'de v0.25'i de içerecek biçimde güncellendi (P84).** Kapsam [README](README.md)'de. F8 [KAPANDI](../web-8/ilerleme.md) (main `a48a3e78`; devreden borçlar web-8 ilerleme #1–#38). Main pini **v0.25.0-api** (W182 PR #170, main `2bd788f3`).

## Durum

| Oturum | Durum | main hash |
| --- | --- | --- |
| O1 W181 | **KAPANDI** — PR #169, CI43985113355 üç iş SUCCESS, Opus O1 UYGUN | `099dfe6e` |
| O2a W182 (pin v0.25) | **KAPANDI** — PR #170, CI43988603878 attempt2 üçSUCCESS; Terra build/24test/4pixel karşılaştırması başarılı | `2bd788f3` |
| O2b W183 ‖ W184, sonra W185b ‖ W185 | W183 PR171 ve W184 PR172 üç CI ile birleşti; W185b PR173 düzeltmeli CI, W185 kaynak tamam ve bağımsız Terra kabulünde | `abfc7916` (W184) |
| O3 W186 | Sohbet App entegrasyonu ve iki regresyon tamam; bildirim birleşimi ve son kabul sürüyor | — |
| O4 W187 ‖ W188, Opus denetim + Codex koordinatör kapanışı | W187 kayıt hazırlığı, W188 izole backend preflight hazır; nihai tanık ve Opus bekler | — |

## Kararlar

| # | Konu | Durum |
| --- | --- | --- |
| P77 | F9 = pin yükseltmesi + sohbet/bildirim canlıya alma; yeni ekran yok | **KESİN** (ürün sahibi 2026-11-16) |
| P78 | Hız politikası (P76) varsayılan: etkilenen testler yerelde, tam paket CI'da, tek duman 390+1440 koyu, gerçek backend e2e yalnız CI + tanık işçisi, eşzamanlı ≤ 2 işçi, Opus denetim ≤ 2 tur | kullanıcı süreç tercihi |
| P79 | Model ajandası: **2026-11-17 güncellemesi** işçi Sonnet, test Terra (gpt-6.1-terra), denetçi Opus, koordinasyon Codex; eski Haiku/Astra atamaları geçersiz | kullanıcı güncellemesi |
| P80 | Pin tek PR (KESİN 36 kalıbı): `v0.23.0-api` → **`v0.25.0-api`** (P84 ile v0.24'ten yükseltildi); UI değişmez | geçici kabul |
| P81 | Canlıya alma = KESİN 35; kısmi satır `bağlandı` olmaz; kalanlar BE-147 (GAP-246), BE-150…153 | geçici kabul (P84 ile güncel; v0.24'te kalan 027/029/080/160 ve kısmi 028/085/156 v0.25 ile `tam`) |
| P82 | SSE yalnız `shared/sse`; bildirimlerde SSE yok; sohbet mesajı bildirim zinciri SSE'den ayrı | geçici kabul |
| P83 | O2b bölme (≤ 2 eşzamanlı): W183 sohbet A, W184 sohbet B, **W185b sohbet C (yeni, öneri)**, W185 bildirimler | geçici kabul; matris §2–§4 (W181 önerisi) |
| P84 | **Kapsam güncellemesi:** F9 v0.25'i de kapsar; tek pin v0.23→v0.25; v0.25 karşılıkları F10'a bırakılmaz | **KESİN** (kullanıcı 2026-11-17) |
| P85 | Yönetici ana Codex; Sonnet uygulayıcı, Terra test, Opus bağımsız denetim | kullanıcı rol talimatı |
| P86 | Mevcut görev detayında kaynak mesaj bağlantısı W184; bildirim panelinde sessize alınanlar W185; BE027 kapanış W185 | koordinatör kapsam uygulaması |

## Kayıtlar

### O1 (2026-11-17)

- **W181** (`web9/o1-w181`): web-9 belgeleri (README, ortak sözleşme KESİN 1–37, ilerleme, oturum-1-keşif, pin-yukseltme-v025, canlıya alma matrisi), ekran 10/14 README F9 ekleri, `kayit.md` Bağ hedefleri, ortak-kurallar §12 P77–P84 (+ P79 model düzeltmesi), yol haritası F9 AÇILDI. Keşif: backend `v0.25.0-api` (`58856bbc`) etiketi bulundu; v0.24'ün bıraktığı BE-027/029/080/160 ve kısmi 028/085/156 ile BE-148/149/154 v0.25'te karşılandı. Matris: **28 satır, 23 tam / 0 kısmi / 5 kalır**.
- İlk taslak v0.24 hedefliydi; P84 ile atıldı (SIGINT; önceki düzenlemeler korundu, `pin-yukseltme-v024.md` hiç üretilmedi).

## Borç devri

Web-8 ilerleme #1–#38 F9 W'lerine otomatik taşınmaz. F9 ile ilgili: #38 (`platform.unauthenticated` işlenmemiş red; chat-writes geç 401 sınıfı; sohbet/bildirim W'lerinde yeniden görülebilir), 01f sanallaştırma (#16, F9 dışı), ADR-0041 ŞY aktör kararı ve E-03C-22 (karar bekler). Yeni borç F9 ilerledikçe numaralanır (#39'dan).

### O1 koordinatör kabulü (2026-11-17)

Sonnet W181: 656dba77 (yalnız 11 belge); Terra prettier ve 100 hedefli test başarılı. Koordinatör ee33b13/3939d3e ile kapsam, rol ve sahiplik düzeltmeleri; Opus tur1 KOŞULLU UYGUN → tur2 **UYGUN** (3939d3e, yalnız O1; final F9 kapısı değil). Düşük metin kalıntıları koordinatörce temizlendi; kaynak/pin değişmedi. PR #169 CI ve merge bekliyor; W182 bundan sonra başlar.

### O2a teknik teslimi (2026-11-17; henüz kapanmadı)

Sonnet W182 beş commit: pin/generated (261 uç, 227 hata kodu), ortak defaults, sohbet ve bildirim tip/fixture uyumu, güncel e2e/README pin referansları. Gen:check/typecheck/lint, 162 dosyada1412 hedefli test ve tests/lint157 başarılı; stub31 değişmedi, canlıya alma yok. K1/K2/K3/K5 aynı fixture dosyalarını paylaştığından tek uyum commitinde; davranış testleri sınıfları ayrı doğrular. `poll.anonymous` spec'te opsiyonel, generator default nedeniyle required tipliyor; W182 eski gönderim gövdesini dar cast+omission testiyle korur. W185b anonim anketi bağlarken explicit alanla bu geçici cast kaldırılır. Build ve tek390/1440koyu karşılaştırmalı duman Terra'ya atandı. Nihai doğrulama/CI/merge gelmeden O2a kapandı sayılmaz.

### O2b W183 teknik kabul hazırlığı (2026-11-17)

Sonnet kaynak teslimi236d8629: BE081/082/086/160/162 stub'ları ve eski yolları kaldırıldı, BE027 yalnız liste yüzü (kapanışW185). Ortak query-keys b7bffb42 W184'e devredildi. Typecheck/lint/format/build ve79dosya760test başarılı; son ikon ekinde173ilgili test başarılı. Root kayıt/ekran belgelerini güncelledi; duman ve ek negatifler bağımsız Terra'da. O2b henüz kapanmadı.

### Yeni doğrulama borcu #39

PR170 ilk CI koşusunda reports-lifecycle.test.ts:88 boot/login gerçek localhost80'e çıkarak client.network_error verdi (1/6011test). Test/harness değişmemiş; Terra iki ayrı dar koşuda7/7PASS, kesin interceptor/yük/sıra kök nedeni bulunamadı. Tek failed rerun sonrası attempt2 üçCIişiSUCCESS vePRmerged. Kalıcı düzeltildi iddiası yok; yinelenirse MSW request:start/fetch kimliği/sunucu ömrüyle deterministik teşhis gerekir. Eski401borç38'den ayrıdır.

### W183 bağımsız regresyon ve düzeltme (2026-11-17)

Terra explicit `?mesaj=55` hedefinin server first_unread_seq6 açılışıyla ezildiğini stateful uygulama testinde yakaladı; test694ba3be ile kaydedildi. Sonnet b54081a7 ile tek hedef ayrıştırıcısı ve açık mesaj önceliğini ekledi;16dosya77ilgili test/typecheck/lint/format geçti. Geç A→B yanıt testi yeşil; yeni getterler shared query anahtarlarına dokunmadı. Görsel duman ve bağımsız final kontrol hâlâ Terra'da; CI/PR gelmeden bu teslim kapanmış sayılmaz.

### W183 bağımsız son kabul (2026-11-17; PR/CI bekler)

Sonnet95bac896 ilk unread inişini center yaparak sticky tarih/okunmamış ilk iniş örtüşmesini giderdi. Terra build ve gerçek Chromium sahte/v025 dumanında390(253–283 tarih/515–545unread),1440(200–230/489–519) dikdörtgenlerini ayrık ölçtü ve PNG'leri gördü; CSP/overflow/pageerror0. Derin hedef55 korundu, alıntı2/beforezinciriyok her iki genişlikte görüldü.390ilkpointermesaj satırına düşüpikinciquote'aulaştı;ilkhedefkaymasınınsebebibelirsiz,ürünkusuruiddiasıyok. Source95 ve önceki42test kırmızı→yeşil kanıtı saklandı.

Terra tarihselF8yok/F9bağlandı guard'ını yalnıztestdosyasında sürüm/faz/tamF9matris/stubyok şartıyla düzeltti; BE027 parantezli yüzeyID'si de desteklenir.40ilgilitest+lint/formatPASS. F8tarihselmatris değişmedi, unsupported/aynı-eski pin/stubnegatifleri korunur. Bu kabul seçili sahteUI/istemci kanıtıdır; gerçekCaddy/backendtanığı CI+W188'dedir.

### W184 birleşik teknik kabul hazırlığı (2026-11-17)

İlk Sonnet24cef7df9commit; read API/mutation ve SSE, rol/üye/mesaj bilgisi/paylaşılanlar, iki yönlü görev kaynağı bağlantısı,11yeni test dosyasında56yeni test. W183 branch ile üç kaynak çatışması bad6e3bd'de Sonnet tarafından birleştirildi, notify_levels tek fake kaynak oldu. Koordinatörler GroupInfo bilgisi4b26e5c6; eski görünür grup tiklerinin bayatlığı120mesajlı kırmızı→yeşil regresyonla21106559'da bounded okundu metadata taramasına geçti. W183 hedef/visualfixleri ve tarihselF8guard sonradan alındı. BE028/083/084/085 kayıtları bağlı, BE027açık; final bağımsız Terra+CI bekler.

### W184 bağımsız kabul (2026-11-17; PR/CI bekler)

Terra b2107de2/source7b16b973 üzerinde83hedeflitest,25yaşam döngüsü ve20read-state/window kontrolünü (örtüşen koşumlar) geçirdi; build/lint/formatPASS. true→null grupokundu ve pendingread sırasında scope/session/sökülme negatifleri için test patch'i eklendi.390/1440koyu GroupInfo/iki dosya kaynağı/görev listesi/NotifyPUT/ownreceipts/Tab-focus dumanı; CSP/overflow/pageerror0, PNG gözle incelendi. Sahte work verisinde görev detayı açılmadığından source-link bağımsız görsel dumanı kanıt dışı; actualrouter/around ve negatifler entegrasyondaPASS, ilkSonnetdumanındaUIvardı. **W188 gerçekbackend tanığı görevden kaynağa linkin390/1440pointer açılışını ayrıca kanıtlayacak.**120mesaj UI focus ayrıca ölçülmedi; model içerik/pencere korunması testlidir.

### W183 PR kapanışı ve W185b teslimi (2026-11-17)

W183 PR #171, CI44001071112 üçSUCCESS ile main b69c6e9c oldu. W184 PR #172 bağımsız kabul sonrası5040a0d2 başlığında CI44003202106 sürüyor. W185b39083b96 kaynak teslimi BE029/080/161 ve son sohbet stub kaldırmasını içerir;51yeni test, type/lint/format/buildPASS. Sonnet geniş koşumdaki1791/1792 sonucunda tek devralınan F8guard hatası parent5040a0d2 merge'iyle güncel teste taşındı; yeni kabul henüz verilmedi. Terra dar test ve390/1440 dumanına başladı. W185 merkezi query-keys sahipliği a1e7fdea checkpoint'inden devralındı; bildirim uygulaması paralel sürüyor.

### W184 gerçek backend CI seçici düzeltmesi (2026-11-17)

CI44003202106 kalite ve imaj SUCCESS; gerçek backend dumanında e2e/chat.spec.ts sendMessage eski kısmi “Gönder” seçicisi iki yeni “Gönderildi” receipt düğmesiyle birlikte üç öğe eşleştirdi. Terra testi mevcut chat-composer içinde exact Gönder ile sınırlandırdı; assertion/ürün davranışı değişmedi. ESLint/format ve Playwright tek-test keşfiPASS; yerelde gerçekbackend tekrarlanmadı. Root bu kesin nedenli test düzeltmesini PR172'ye ekledi; yeni üç CI sonucu beklenir, kırmızı koşumda merge yapılmadı.

### W185b bağımsız kabul (2026-11-17; PR/CI bekler)

Terra özellik kaynağı `39083b96`, birleşik `ceff95f1` üzerinde hedefli 66 test, ek 17 test (örtüşen koşumlar) ve kayıt denetimi 40 test geçirdi; typecheck/lint/format/build başarılı. İki yeni arşiv geç-yanıt testi, kapsam değişimi/söküm sonrasında yeni kapsamın cache'inin değişmediğini ve ek okuma başlamadığını doğrular. Gerçek başarılı yanıtın yakalanmış eski cache'e işlenmesi ortak mutation sözleşmesidir; ilk yanlış test varsayımının kırmızısı ürün bulgusu sayılmaz. Arşive özgü oturum değişimi ayrıca sınanmadı.

390/1440 koyu üretim paketi dumanında gerçek pointer ile iletme, anonim anket ve tek multipart arşiv isteği çalıştı; metin alanları dosyadan önce, CSRF ve Idempotency-Key mevcut. CSP/overflow/pageerror sıfır; PNG'ler incelendi. Root da 390 arşiv formunun görüntüsünü inceledi. Bu sahte API/Caddy simülasyonu kanıtıdır; gerçek backend atomik davranışı, aynı anahtarla tekrar ve multipart baytları W188'de doğrulanacak. Üç CI kapısı ve parent PR172 birleşmesi beklenir.

### W184 kapanışı ve W185b tekrar denemesi düzeltmeleri (2026-11-17)

W184 PR #172, `64db4eca` için CI44005439139 üç SUCCESS sonrasında main `abfc7916` olarak birleşti. Temiz W184 worktree ve yerel dal kaldırıldı.

W186 Terra gerçek App/router entegrasyonu, arşiv isteği sunucuda tamamlanıp yanıt kaybolduktan sonra aynı anahtarla 200 dönen tekrarda mesajın açık pencereye eklenmediğini gösterdi. Kırmızı test W185b'ye `892a6494` ile alındı. Sonnet `67bbf0d0` ortak sohbet `withEffects` yolunda retry/confirm ardıllarına gerçek başarı efektini uyguladı; motorun anahtar, oturum, kapsam ve sahip kapıları değişmedi. Terra 19 hedefli test ve motor/korumalı mutasyon 43 testle ilk hatanın düzeldiğini doğruladı.

Terra ek regresyonunda gönderim sürerken dışarıdan değiştirilen giriş nesnesinin yerel efekti değiştirdiğini buldu (`6c18efda`); gerçek UI'nın aynı nesneyi değiştirdiği ayrıca gösterilmedi. Sonnet `261af5fe`, mevcut toPlainVars yardımcı işleviyle ilk veri kopyasını yakaladı; aynı kopya ilk/tekrar/onay efektlerinde kullanılır. File/Blob semantiği ve korumalı motor korunur. Sonnet 11 dosyada97 test,158 diyalog testi/type/lint/format/build başarılı; son bağımsız dar kontrol Terra'dadır. İlk düzeltmenin geniş koşumunda chat-window açık mesaj testi5s zaman aşımı verdi, tek başına iki kez11/11 geçti; kesin kök neden kanıtlanmadı. PR173'ün eski başlığı üç CI'da başarılı olsa da yeni kusur nedeniyle birleştirilmedi; düzeltmeli başlık için yeniden üç CI gerekir.

Terra son bağımsız kontrolde `261af5fe` üzerinde App3 + effects6 = iki dosyada9 testi geçirdi; iki ayrı kırmızı regresyon yeşil. Kaynak diff'i yalnız await öncesi mevcut toPlainVars kopyası ve dar export; motor kapıları değişmedi. Bu yardımcı plain nesneleri kopyalar; File/Blob/FormData/Date mevcut semantik gereği referans olarak taşınır, değişebilir opaque içeriklerin dondurulduğu iddiası yoktur. Root yeni PR173 başlığını CI'a gönderir.

### W185 birleşik teknik teslimi (2026-11-17; bağımsız kabul sürüyor)

Sonnet kaynak `1100f522`: 18 tür zengin/güvenli sözlük, server filtre/cursor, iki ayrı sayaç, satır içi karar ve konu/grup eylemleri, panel içinde sessize alınanlar, cold çapraz program typed hedef. P88 mevcut protected mutation ve RevertReasonDialog kullanır; global aktör matrisi değişmedi. S1 bildirim yazmaları kapsamsız hesap işlemi olarak program geçişinden bağımsız, oturum kapısına bağlıdır. Sonnet124 dosyada983test ve type/full-lint/format/build başarılı. Sahte390/1440 dumanı avatar taşmasını düzeltti; gerçek backend değil. Root W185b45ec1191'i temiz merge ederek `24d256db` bütünleşik kaynağını Terra'ya verdi. BE027 ve bildirim10 kaydı bağlandı; bağımsız kabul/CI/gerçek tanık tamamlandı anlamına gelmez. Yeni BE kimliği atanmadı.

W188 backend preflight: `nizamio_web9_w188_0615`, etiket58856bbc, port28089/28090/25439, iki profile200, izole seed hazır. Nihai frontend/UI tanığı henüz yapılmadı.
