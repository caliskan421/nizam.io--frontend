# WEB-12 bağımsız Opus denetimi

Sonnet uygulama, Terra bağımsız test/gerçek tanık, Codex karar/belge/PR-CI, Opus salt okunur faz sonu denetim. Gerçek CLI claude-opus-5-5 oturum155ffc36-ce78-4bd7-8bf4-8305f2c3ed87; araçlar Read/Glob/Grep/Bash, Edit/Write/Agent/Task/MCP kapalı. Dosya/test/build/Docker/commit/PR yazmadı. Ham rapor anafrontend.git/koordinator/web12-opus-round1-rapor.md.

## Birinci tur — 8b08ea44

Hüküm **KOŞULLU UYGUN**; P0/P1 yok,2P2 ve5P3 bulgu. Faz kapanışı değildir. Kaynak542f+8dtest, rootdocs oturumda güncel kirli haliyle okundu; sözleşme yalnız v028etiketinden.

| Bulgu | Sorun | Takip |
| --- | --- | --- |
| P2-1 | 1440'ta min kolon toplamı kâğıdı aşar, eksenin son kısmı iç kaydırmada gizli | Sonnet sağ eksen asgarisini daraltır; 1440 report-scroll scrollWidth<=clientWidth,390 yerel kaydırma ve son uç erişimi ölçülecek |
| P2-2 | Header/body farklı font ch asgarileri sınırları2.77→20.72px kaydırır | Sonnet e9a09afc rem izleri, daha sonra tüm düzeltmelerle gerçek1px hizalama ölçümü |
| P3-1 | Dikey ok ara satırdaki ilgisiz çubuk ucuyla kesişir | Ön görev başlangıcında açık origin işareti; Native görsel/koordinat doğrular |
| P3-2 | Çok küçük pozitif bayt oranı yüzde0 görünür | Sıfırdan ayrı yüzde<1 ve anlamlı test |
| P3-3 | Error query retry anında isPending false, loading gösterilmez | isFetching/error retry busy durumu ve geciktirilmiş gerçek query testi |
| P3-4 | 06 eski stub açıklamaları güncel metinle çelişebilir | Codex açık F12supersession cümlesini ekledi |
| P3-5 | PDF içindekiler numaraları eksik diye yazılmış; v028GAP239 kapalı | Codex yayımlıetiketi doğruladı: PDFnumaralar var/görsel tanık değil;P51previewnumarasız; açık sınırGAP258 |

Kaynak yön/kapsam/başlıklar/tarih-only/TZ/notbayrakları/K51/sunucusırası/O(V+E)/staleprogramyanıtı/registry15kimlik24kullanım kontrolleri doğru bulundu. Önceki Native taşma0 ölçümü hizalama ve desktop iç kaydırmayı kapsamıyordu; yeni RED kabul edildi. P3ler isteğe bağlı bırakılmayıp dar düzeltmeye alındı. Son kaynak, yeni gerçekdelta ve ikinci salt okunur hüküm bekleniyor. Kendi özellik PR üçCI SUCCESS+MERGED ve kaynak temizliği ayrıca zorunludur.

## Dar düzeltme kaynağı — b911e989

Sonnet e9a09afc rem izleri ve b911e989 sağ eksen0.4baz/origin noktası/küçükpay%<1/retrybusykoruması. Kod ve anlamlı testler değişti; üçNativekorumalıdosya aynıdır. P3-3 verisiz retry bu TanStack sürümünde pending olur, eskiisPendingzatenbusy; yenierror-fetchingkolu savunmadır, önceki gözlenmişhata diye yinelenmez. İlk testtekierror-statevarsayımı düzeltildi. YeniNativegeometri/scroll ve ikinci denetim hükmü beklenir.

## İkinci ve son tur — 79db9523 / b911e989

**Hüküm UYGUN.** İlk7bulgu kapalı; P0/P1/P2açık0. Opus yeni hammetrik/PNG/hash ve kuruluquery-core5.104.1kaynağını salt okunur inceledi. Beşkolon sol/sağ0px,1440içtaşma0,390scrollsonu/sağsınır/origindot doğru. P3retryiddiasının verisizakış için yanlış olduğunu açıkça düzeltti: eskiisPendingzatenbusy. PDFiçindekilerbelgegerçeği ve tüm önceki kanıt sınırları doğru bulundu. Hamsonrapor `web12-opus-round2-rapor.md`, aynıoturum155ffc36.

İki yeni engellemeyen P3: N1 ekerror-fetchingdalı yalnız verili cache'de çalışıp doğru toplamı geçici gizleyebilir; N2CSSyorumundaki hesap16pxrootvarsayar, gerçekroot14px. Koordinatör ikisini de düzeltmeye aldı: Sonnetgereksizdalı kaldırır/mevcutretrytestini korur/verili-cachetazeleme anlam testi ekler; N2sadeceyorum doğru birimle düzelir. Bu öneriye birebir dar delta Native/rootincelemesiyle doğrulanacak; üçüncü Opus turu açılmaz. **UYGUN hükmü b911kaynağına aittir**, sonrakiN1/N2deltası o hükme geriye dönük atfedilmez. ÖzellikPRkendi3CI+MERGED ve kaynaktemizliği bekler.

## N1/N2 kapanışı — 2bd529e3, Native/root

N1gereksizerror-fetchingdalı kalktı; verisizretrypendingyüklenerken cached105Barka planhatası/sonrakiheldfetchboyuncagörünür. Gerçekquerytesti eskiguardmutasyonunda aria-busyRED, sonkaynaktaGREEN. N2yalnızCSSyorumu14pxkökhakikatinedüzeldi; derlenmişCSSbyteaynı. Native2dosya9test/tamtype-build/gerçekadmin390-1440yeniSHA-CSP-taşmakabulü verdi. Koordinatör bu dar öneriyeuygundeltayı kapattı: N1/N2artık açık bırakılmadı. YeniüçüncüOpusdenetimi yapılmadı; OpusUYGUNb911kaynağınaaittir, son2bdbağımsızdelta ayrıNative/rootkanıtıdır. ÖzellikPRCI/merge kapısısonrakiadımdır.
