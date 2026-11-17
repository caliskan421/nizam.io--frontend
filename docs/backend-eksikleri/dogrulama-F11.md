# F11 bağımsız doğrulama

**Son f7729476 kaynağı için Terra bağımsız kabul verdi.** İlk gerçek UI koşusu modal taşması nedeniyle başarısızdı; başarısız kanıt aşağıda korunur. Kayıtlar ana frontend `.git/koordinator/web11-*` altında tutulur. API kaynak etiketi v0.26.0-api4d4adc0f; ilk uygulama test noktası d0a924cc, son kaynak dab0a05a’dır.

| Kanıt | Kaynak ve yöntem | Sonuç / sınır |
| --- | --- | --- |
| İlk cache RED | Terra gerçek QueryClient, üç departman/iki program;569a847d test | 5 assertion RED +2 sınır PASS; program dışı dosya yazması ve ilgisiz cache korunur. Üretim düzeltmesinden sonra7/7 PASS |
| Kısmi409 RED | Terra gerçek hook+MSW;99a9c92e test | Sonuç failed ve tekDELETE kalırken cache tazeleme assertion RED; ön kapı engeli negatif PASS. Düzeltmeden sonra2/2 PASS |
| Test tipi düzeltmeleri | İlk RED arşiv facet `files`→`attachments`; MSW3 listen seçeneği `onUnhandledFrame` | Beklentiler değiştirilmedi. Tam typecheck önce bu fixture tiplerini yakaladı; d0a924cc üzerinde `pnpm typecheck` PASS ve iki regresyon dosyası9/9 PASS |
| Sonnet yerel kapılar | İlk75 dosya840 test; dar takip171 dosya1432 ve246 dosya2141 test | Koşular örtüşür, toplam diye toplanmaz. Lint/format/build PASS. İptal edilen geniş related koşusu başarı sayılmaz; root yalnız kendi runner'ını durdurdu |
| Terra final dar | d0a924cc8 dosya70 test; gerçek modül/ortak onay, yeni handoff/impact/query/outcome | PASS; iki önceki RED dosyası9/9 ayrı kanıt. Tam paket CI'da |
| Gerçek v026 API | İzole W200; iki program, aktif/tamamlanmış/önceden silinmiş/zincir görevler, dosya/üyeler/toplantı; tablo engeli | Etki S1, üye403, silinmişte GET, doğru restore ve bağı kalkmış program, tablo409 fields ve scope=program aday/şirket geneli sonuç PASS. İlk unlink betiği204'ü200 bekledi, aynı fixture üzerinde devamla düzeltildi |
| Gerçek Caddy UI ilk koşu | d0a924cc, run09cece0f-79f3-4eee-85ff-48398dab75d6;390/1440 gerçek pointer | Yükleme/iptal DELETE0/odak, engel tazeGET/DELETE0, restore200+2 görev toast, tekDELETE200+4 görev1 dosya ve CSRF/program başlığı PASS. Uzun başlık modalı390'da730/356,1440'ta730/558 taşıdı; kabul VERİLMEDİ |
| CSP/derleme ayrımı | Aynı ilk koşuda yerel/sunulan JS SHA256 a7ba3f2eb01c6cf909953b97cafcd9684349828d1e86a288a5ed50836a25cad0 | Eşit; CSP/pageerror0. Üretim dist + gerçek Caddy test vekili + gerçek backend; üretim frontend konteyner imajı tanığı değildir |
| Üye erişimi | Ayrı gerçek390 UI | Yetkisiz sayfa ve0 admin/impact GET, pageerror0. İlk harness locator hatası yeniden doğru testid ile düzeltildi; ürün hatası sayılmadı |

Null program adı, gecikmeli yanıt, oturum/sahip kaybı ve okuma-onay mikro görev yarışı birim/MSW testleridir; gerçek ağ yarışı diye sunulmaz. İlk iki görsel fixture kalıcı işlemlerle tüketildi; W201 düzeltmesi sonrası yeni fixture ve yeni HEAD/koşum kimliğiyle görsel delta gerekir. Bu ilk koşum sırasında görsel delta ve son Opus/PR kapıları bekliyordu; son delta sonucu aşağıdadır. Backend/Caddy yalnız sahip olunan W200 projesidir; kabul sonrasında kaynaklar adlarıyla temizlenecek, ortak daemon restart/prune yapılmayacaktır.


## Son görsel delta ve bağımsız kabul

Kaynak **dab0a05ae7384d2b908c18dc4fe7efcf050d3c06**, Terra `final-delta-rapor.md`: full `pnpm typecheck` (`vue-tsc --build --force`), build ve6 delta dosyasında43/43 test PASS. Opus bulgularının Sonnet yerel12 dosya111 test ve ayrı8 handoff sonucu örtüşür; toplam diye toplanmaz.

Yeni gerçek fixture ve run **4bc87f39-ae3d-4390-b910-b618d46eb7b4** için390 ve1440 JSON'larında her11 kontrol başarılıdır.390 modal356/356, başlık ve gövde308/308;1440 modal558/558, başlık ve gövde510/510. Uzun tek parça departman ve program adları tam görünür, yatay taşma0, footer erişilir; CSP/pageerror0. Root her iki PNG'yi inceledi. Ek390x600 gerçek modal kaydırma0→154 ve footer görünürlüğü geçti; ilk iki harness varsayımı düzeltilmiş, ürün hatası değildir.

Yeni varlık `index-DclJvX2h.js`, yerel/sunulan SHA256 **2d80c4c5ab196ab2de95973c107cbdbb6478df9c39c9d546d42759b02cfc842e** eşittir. Gerçek S1 impact başlıksız, iptalde DELETE0/odak, engelde iki taze GET/DELETE0, restore200 ve2 görev bildirimi, tek kalıcı DELETE200/CSRF/S2/4 görev1 dosya sonucu doğrulandı. İlk başarısız fixture yeniden kullanılmadı; yeni fixture'da uzun program adı da sunucudan gerçek veridir. Yeni fixture kurulumunda geçersiz yıl422 reddi sonrası geçerli2027 kullanıldı; başarısız hazırlık gizlenmedi.

**Kabul sınırı:** üretim dist + üretim CSP politikalı gerçek Caddy test vekili ve gerçekv026 backend. Üretim frontend konteyner imajı ve tam E2E kendi CI kapılarıdır. Kısmi409 yarışı, null ad, programlama istisnası,401/429 ve oturum/sahip geç yanıtları birim/MSW kanıtıdır; gerçek ağ yarışı diye sunulmaz. Son görsel kabul ilk kırmızıyı düzeltir; eski ölçüm/PNG'ler değiştirilmedi. Son Opus hükmü ve PR'ın kendi CI/MERGED kanıtı ayrıca gerekir.


## G1 ve son sözleşme sayacı kabulü

G1 kaynak769669d4: MSW hata/yenileme sonrasında satır yoksa URL seçimi temizlenir, odak body'ye düşmez, danger toast ve tekDELETE korunur; satır varsa seçim korunur. Terra4 dosya30 test PASS. Aynı son bundle gerçek390/1440 uzun ad/GET/iptal/odak/taşma0/CSP0/pageerror0 koşusu run6f840293-28cb-43df-bc53-5ad405b53e7c, yerel/sunulan SHA2566fb0dc0c46be511ed7b0e3583b7a1aa99738c04178a10fc430323556ad9f9c69 eşittir. G1'in geç kapsam/oturum/sahip yenileme koruması yalnız kod incelemesine dayanır; ayırt eden runtime testi iddia edilmez.

**Kesin son kaynak f7729476e81abe3847320db3d35518836147f4b0:** Terra2 dosya36/36 bağımsız PASS ve build PASS; Sonnet aynı kaynak tam `pnpm typecheck` PASS. Kaynak farkı yalnız başarı bildiriminde eksik kapsamlı üyelik sayacının çıkarılması ve ilgili test/sözlük düzeltmesidir; API/şema değişmez. Başarı alanı `memberships_deleted` program bağı kaldırılırken silinenleri içermediğinden toplam olarak sunulmaz.

Yeni gerçek run7c5ab117-f834-4efe-9522-4389215fb0b4:390 etki önizlemesinde1 kişi; iptaldeDELETE0/odak dönüşü; tek kalıcı DELETE200/CSRF/S2 ile sunucu sonucu work0/files0/program_links2/memberships0. Başarı toast'ı yalnız «0 görev,0 dosya,2 program bağı» gösterir, yanlış0 üyelik iddiası yoktur; satır kaybolur.1440 gerçek uzun ad/GET/iptal/odak ve iki genişlikte modal/başlık/gövde/belge taşması0/CSP0/pageerror0 geçer. Son varlık index-CXpDVv2d.js yerel/sunulan SHA256 **3ce87bbed41261a85021f3ce7328f8e60947a16194168913424463e236cfa5dd** eşittir. Root ham sonuçları ve görsel kanıtı incelemiştir.

Ana gerçek API zinciri ve4bc87f39 tam silme/restore/engel200 kanıtı korunur: son G1 farkı hata/yenileme seçimi-odak yoludur; son bildirim farkı kısmi üyelik sayacını toplam gibi göstermemektir. Değişmeyen normal yolların önceki gerçek tanığı bu dar delta incelemesiyle devralınır, bütün tanık tekrar edilmiş gibi sunulmaz. Son üretim kaynak ağacı kabul edilmiştir; tam test/üretim imajı/gerçek E2E kendi PR CI'ında koşacak.


## Son bağımsız hüküm ve koordinatör tutarlılık kontrolü

Opus f7729476 için UYGUN/açık kaynak bulgusu0 verdi; F1–F4 ve G1 kapalıdır. [Denetim kaydı](../reviews/WEB-11-opus.md). Root son metadata/registry kontrolünde2 dosya64 test PASS; standart collectSources/scanSource üretimTS/Vue (testler ve yorumlar hariç) taramasında17 benzersiz runtime stub kimliği26 kullanım/sorun0, kayıt163=87 bağlı72 açık4 vazgeçildi. İlk son kontrol denemesinde root COREPACK_HOME ortam değişkenini atladı; varsayılan önbellek izin hatası kaynak hatası değildi. Doğru kullanıcı önbelleğiyle64 test geçti, ilk hata logu korunur. Metadata commit'inden önce/sonra kabul edilenf772 ile src/public/e2e/pin/paket/kilit diff0 şartı uygulanır. Tam kalite/üretim imajı/gerçek E2E kendi PR CI'ında koşacak; sonuç PR gövdesi ve koordinasyon kapanış kaydına yazılacak.


## CI1 bağımlılık kırmızısı ve W202/W203 güvenlik düzeltmesi

PR181 ilk **44151554996** koşusunda 893 dosya/6692 test ve tip/lint/format/build geçti; değiştirilmemiş `pnpm audit --prod` GHSA-fc5q-39xc-vjpf nedeniyle kırmızı, imaj/E2E atlandı. Kör tekrar yapılmadı. Sonnet W202 `cedc7106` yalnız package.json/pnpm-lock.yaml değiştirir: Vue Router ^5.4.0 yerine resmi, tam 4.6.5. Uygulama elle tanımlı rotalar kullandığından v5 dosya rota araç zinciri gerekmiyor; savunmasız üretim yolu kaldırıldı. Audit ignore/override/CI gevşetmesi yok; picomatch yamalandı iddiası yok.

Terra W203 aynı cedc kaynağında frozen install, tam typecheck/build ve rota/history/session/scope ile mevcut F11 impact/handoff/G1/outcome **11 dosya87 test** bağımsız PASS; üretim audit exit0,68 bağımlılık,0 bulgu,muted[] ve üretimde picomatch yolu yok. Gerçek v026/Caddy test vekili run2d98dc77-42d4-4ef4-9a47-9d1907708899:390/1440 admin deep link/geri-ileri/seçim/impact-iptal/odak; üye/koordinatör yetki reddi/adminGET0; ikinci program kapsam geçişi; taşma/CSP/pageerror0. Son JS index-ZXdQgTFz.js yerel/sunulan SHA256 bcfca572f18e65e602489d375ef7ce58e250c1d6fee6aa4849d8d3dda032cee0 eşit. İlk scope betiği goto sırasında eski programı yeniden yazdığı için yanlış kırmızıydı; gerçek SPA tıklamasıyla düzeltilmiş tanık korundu.

Root tam audit baseline/candidate kıyasında aynı14 advisory ve15 bulgu (2critical6high7moderate) gördü; geliştirme borcu devam eder, yeni bulgu eklenmedi. Tam ağacın temizliği iddia edilmez. W202 teslimindeki “W201 base'de yok” ifadesi yanlıştı: f772,63dd'nin atasıdır; Terra mevcut F11 testlerini de çalıştırdı. Sonnet uygulama/Terra bağımsız doğrulama/root karar-belge-PR rolleri korunur. Opus üç turlu f772 uygulama hükmü değişmeyen uygulama koduna aittir; yeni paket deltası Opus tarafından denetlendi sayılmaz. Yeni kaynak kendi CI2 kalite/üretim imajı/gerçek E2E üç SUCCESS olmadan birleşmez.
