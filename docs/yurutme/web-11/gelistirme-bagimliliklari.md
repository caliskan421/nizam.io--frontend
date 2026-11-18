# F11 takip — geliştirme bağımlılıkları ve F12 eşlemesi

2026-11-18 kullanıcı «F11’den kalanları tamamla, eşleştir; sonra F12’ye geçeriz» dedi. Ana özellik paketi PR181/7ef529b5 ile kapanmıştı; bu ayrı takip PR’ı geliştirme araçlarının kalan güvenlik borcunu ele alır. API pinv026, uygulama/şema/CI davranışı bu işte değişmez. F12 uygulaması başlamaz.

## Başlangıç ve karar

Dondurulmuş ana kaynakta tam `pnpm audit --json`15 bulgu:2critical6high7moderate,14 benzersiz advisory. `picomatch` aynı GHSA’nın iki sürüm yolunda sayılır. Üretim `pnpm audit --prod`0 bulgu/68 bağımlılık; kalanlar geliştirme ağacındadır. Tüm ağaç temiz diye raporlanmaz.

Sonnet W205 aynı major içindeki resmi yükseltmeleri hazırladı: eslint10.15.0, eslint-plugin-boundaries7.4.4, typescript-eslint8.73.0, jsdom30.1.3; dedupe ortak TypeScript ESLint utils çözümünü günceller. Ara b6cb7984 kaynağında tam denetim4 bulgu/3 advisory (2moderate2high), kritik0: bu **11 bulgu azaltımıdır**,3 bulgu kaldı veya12 bulgu kapandı denmez. Handlebars4.7.10 ve Undici8.12.4 yayımlı güvenli sürümlerdir. Üretim kilit kapanımı67 paket olarak aynıdır (audit’in proje dahil68 sayısından farklı ölçü).

İki orta bulgu js-beautify altındaki glob13 ve editorconfig3→minimatch10 yolundadır. Koordinatör yalnız parent-scoped `js-beautify>glob:14.0.6` ve `js-beautify>editorconfig:4.0.1` exact overrides kararını verdi. Bunlar gerçek yayımlı paket değişimleridir; ignore/audit muafiyeti değildir. Glob major matcher/Windows edge değişiklikleri ve EditorConfig4 null-prototype/Node22 alt sınırı bilinir. Tüketilen hasMagic/globSync/parseSync API’leri durur; yalnız çıkış koduna değil gerçek CLI seçimi ve biçimlenmiş çıktıya bakan bağımsız karşılaştırma gerekir. Global minimatch veya picomatch override yoktur. Ana projeler yeni güvenli js-beautify bağımlılık aralığını yayımlayınca iki override kaldırılıp kilit yeniden doğrulanmalıdır; açık upstream PR2561/2569 yayımlanmış sürüm yerine sayılmaz.

## Kapanmayan resmi yama sınırı

GHSA-fc5q-39xc-vjpf için18 Kasım resmi advisory’de patched version **None**, registry latest4.0.7. Picomatch2.3.2 ve4.0.7 geliştirme araçlarında kalır. Üst yollar yalnız audit JSON örnekleriyle sınırlandırılmaz: tinyglobby/fdir4.x, micromatch2.x ve **@boundaries/elements’in tam4.0.7 pini** ayrıca izlenir. Resmi yama yayımlanınca bütün üst yolların gerçek güvenli sürüme çözüldüğü pnpm why/kilit/audit ile doğrulanmalı; @boundaries/elements için üst paket yayını veya o gün gerçek yamalı sürüme dar scoped düzeltme ayrıca gerekir. Sahte sürüm, yayımlanmamış fork/PR, audit ignore veya test/lint kaldırımı kullanılmaz. Bu iki yüksek bulgu çözülmüş/waived sayılmaz; yayımlı gerçek düzeltme bekleyen açık bağımlılık borcudur. Üretim bağımlılık denetimi0 olarak kalmalıdır.

## Bağımsız kanıt ve kabul kapıları

Sonnet ara b6cb7984 için15 dosya250 hedefli test, type/lint/format/build geçirdi. Bunlar eski Node24.9’da çalıştı; jsdom’un mevcut ve yeni engine koşulu24.15+ olduğu için desteklenen runtime uyumu sayılmaz. Koordinatör resmi Node24.22.3 arşivini SHASUMS256 ile doğrulayıp yalnız kendi araç önbelleğine indirdi; sistem Node kurulumu değiştirilmedi. Son kaynak bağımsız kontrolü bu runtime’ı kullanır.

Terra ilk izole örneği genişleterek16/16 hazırlık kontrolü geçirdi: brace/extglob, iç içe EditorConfig, CRLF/son newline, literal unset davranışı, null-prototype alan erişimi ve node_modules/.git dışlama dahil gerçek CLI çıktısı byte eşitti. Bu hazırlık glob13.0.7/editorconfig3.0.2 tabanına aittir; son checkout ve gerçek13.0.6 taban tanığının yerine sayılmaz. Son kaynakta daha geniş brace/extglob/ignore/nested-config/eol/newline karşılaştırması, VTU/jsdom/MSW/sınır negatif testleri, frozen install, fulltype/lint/build ve tam/prod audit gerekir. Windows/UNC yerel native tanığı yoktur. Son bağımsız sonuç, Opus yalnız bu takip paketi hükmü ve kendi PR üç SUCCESS+MERGED kapısı henüz beklenir; ana F11 f772 kaynak hükmü yeni manifest deltası denetimi yerine sayılmaz. Yeni arayüz/üretim bağımlılığı değişmediği doğrulanırsa önceki gerçek F11 tanıkları korunur; yeni kaynağın CI gerçek backend E2E’si ayrıca zorunludur.

## Açık kayıt eşlemesi ve sonraki faz

[72/72 eşleme](../web-12/sozlesme-eslestirmesi.md) kayıt kümesiyle birebir doğrulandı. Altı mevcut yüzey adayı, beş kısmi/belirsiz,22 backend kalan ve39 ürün/yeni ekran/önceki karar kapısı ana triyajıdır; teslim sözü veya bağlandı durumu değildir. [F12 önerisi](../web-12/README.md): yayımlıv028 pin/uyum, BE025 depolama dağılımı ve BE136 dönem raporunun karşılanan parçaları. Küçük resim BE026 önceki P45/GAP233 kapsam kararı nedeniyle ayrıca seçilmeden açılmaz. Registry87 bağlı72 açık4 vazgeçildi korunur.

Resmi kaynaklar: [picomatch advisory](https://github.com/advisories/GHSA-fc5q-39xc-vjpf), [glob advisory](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4), [minimatch advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249), [glob14 değişiklikleri](https://github.com/isaacs/node-glob/blob/v14.0.6/changelog.md), [EditorConfig4 değişiklikleri](https://github.com/editorconfig/editorconfig-core-js/releases/tag/v4.0.0), [Handlebars4.7.10](https://github.com/handlebars-lang/handlebars.js/releases/tag/v4.7.10), [Undici8.12.4](https://github.com/nodejs/undici/releases/tag/v8.12.4).


## Son aday kaynak — 3fe72a7d

Sonnet ikinci manifest/kilit commit’i3fe72a7d, b6cb7984 üzerine yalnız iki onaylı parent-scoped exact override ekler. Tam audit **469 bağımlılıkta2 HIGH/1 advisory,0 critical/0 moderate,muted[]**; başlangıç15 bulgudan13’ü giderildi. Kalan2 bulgu aynı yamalanmamış picomatch advisory’sinin iki sürüm yoludur. Üretim audit68 bağımlılık/0 bulgu ve67 paketlik üretim kapanımı aynıdır. Handlebars kaldırılmadı: @boundaries/elements üzerinden4.7.10’a yükseldi.

Node24.22.3 ile Sonnet frozen install,fulltype/lint/format/build ve11 dosya86 test başarılı; wrapper.html gerçek tüketicileri ve MSW oturum/hata akışları seçildi. Uygulama/public/e2e/scripts/CI/API pin farkı0. Terra bağımsız son kaynak kontrolü aşağıdaki kontrollü karşılaştırmayla kabul edildi. Bu yeni takip paketinin Opus tur2 hükmü KOŞULLU UYGUN, açık kaynak P1/P2 yok; Native ve kendi CI koşulları korunur. Kendi PR/CI henüz açılmadı.


Ara b6cb7984 commit başlığındaki «12 bulgu» sayımı hatalıdır; doğru ara azaltım11 ve son toplam azaltım13’tür. Kanıt SHA’larını korumak için commit geçmişi yeniden yazılmadı; bu düzeltme PR açıklamasına da taşınır.


## Bağımsız son checkout tanığı ve ilk test kırmızısı

Terra W2063fe72a7d gerçek checkout’unda, gerçek ana kaynak13.0.6/editorconfig3.0.2 ile aday14.0.6/4.0.1 CLI karşılaştırması16/16 PASS; geçici13.0.7 ön tanığı son kanıt yerine sayılmadı. Frozen üretim kapanımı67=67; bütün picomatch üst yolları (tam pinli boundaries/elements, language-core, fdir/tinyglobby, vite/vitest ve micromatch) why kaydına alındı.

İlk12 dosya98 test grubunda97 PASS/1 oturum testi5000ms timeout oldu; kırmızı ham kanıt korundu. Aynı session-next dosyası desteklenen Node24.22.3 altında adayda4/4 ve eski7ef ana kaynakta4/4 tek başına geçti. Bu sonuç timeout’un nedenini veya değişiklikten bağımsızlığını kanıtlamaz. Kontrol gruplu karşılaştırma ve açık çıkış kodlu tip/lint doğrulaması sonrası bağımsız nihai hüküm verilir; test timeout/config değiştirilmez, kör tekrar veya hata gizleme yok. Kendi tam CI ve gerçek E2E kapısı ayrıca zorunludur.


## Bağımsız son kapı — 2026-11-18

Daemon kesintisinden sonra önceki Terra ham kayıtları korunup yeni Terra tarafından tamamlandı; kaynak aynı3fe72a7d. Vitest önbelleğinden çıkarılan açık12 dosya listesiyle baseline7ef ve aday3fe **sırayla**, aynı Node24.22.3/varsayılan test ayarlarıyla karşılaştırıldı: her ikisi12/12 dosya98/98 test,rc0. İlk koşunun tam komut listesi kayıp olduğu için bunun orijinal grupla birebir aynı olduğu iddia edilmez. Aday fulltype ve lint ayrı rc0 ile doğrulandı; önceki format/build başarı kayıtları korundu. İlk5000ms timeout tekrar üretilmedi; nedeni veya değişiklikle ilgisizliği kanıtlanmadı. Test/config/timeout değiştirilmedi, ilk kırmızı gizlenmedi. Bağımsız kaynak kapısı bu kanıtla kabul edildi; kendi Linux tam CI sonucu ayrıca zorunludur.

Opus ayrı takip oturumu tur1/tur2: KOŞULLU UYGUN; bir P2 izleme ve beş P3 gözlem belge/izleme kapsamıyla kapandı veya kapsam dışı olarak açıkça kaydedildi. Tur2 yeni P1/P2 yok; merge koşulları Native son kabul ve PR’ın kendi üç SUCCESS’idir. Native kapısı yukarıdaki sonuçla karşılandı; CI henüz beklenir. [Takip denetimi](../../reviews/WEB-11-takip-opus.md).
