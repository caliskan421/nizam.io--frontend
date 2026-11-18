# WEB-11 — mevcut ekranlarda hazır sözleşme eksikleri

**F11 ana paket tamamlandı — 2026-11-17.** PR181, kendi CI44157077907 kalite/imaj/gerçek E2E üç SUCCESS (893 dosya6692 test,15/15 E2E) sonrası7ef529b5 ile birleşti; main doğrulandı ve faz kaynakları temizlendi. 2026-11-18 kullanıcı geliştirme bağımlılığı borcu ve sonraki faz eşlemesi için takip işi açtı. Son kaynak `f7729476`; Terra gerçek390/1440 kabulü başarılı, Opus son kaynak hükmü UYGUN/açık bulgu0. Ürün sahibi: «F11’e devam et»; kapsam seçimi: **«Mevcut ekranlardaki hazır eksikleri tamamla»**. Önceki «açılmadı» kaydı bu talimatla aşılmıştır. F10 PR180 ile kapandı: main `984a1a37`, kendi CI44082578155 kalite/imaj/gerçek backend üç SUCCESS; 884 dosya6639 test ve15/15 gerçek E2E.

Codex yönetici/karar/belge/PR-CI; Sonnet uygulama ve somut düzeltme; Terra bağımsız test ve gerçek tanık; Opus salt okunur bağımsız denetim. Kullanıcının doğrudan CLI tercihi ve en fazla iki eşzamanlı işçi korunur.

## Kaynak ve sınır

Tek sözleşme mevcut pin **v0.26.0-api / `4d4adc0f`**. F11 başlangıcında daha yeni etiket yoktu;18 Kasım eşlemesinde yayımlı v027/v028 görüldü. Bu takipte pin yükseltilmez; yeni sözleşme F12 önerisinde değerlendirilir. Ayrı backend BE-F8, backend/mobil/program yazımı kapsam dışındadır. Yeni sayfa/artboard, audit/01b, Tablolar, profil, Takvim, Kurumsal hafıza, Asistan ve yeni rol panelleri başlatılmaz.

Tamamlanan paket **BE-164: mevcut 12 Silinen kayıtlar koordinatörlük tekil kalıcı silme onayında `departmentDeleteImpact`**. Şirket genelindeki etkiler program filtresiyle daraltılmaz; yükleme/hata/sıfır birbirinden ayrılır. Kalıcı engeller ve önizlemenin anlık olduğu gösterilir. Onay olmadan DELETE yoktur; mevcut korumalı mutasyon ve sahip/oturum/kapsam kapıları korunur. 08'de katalog silme eylemi mevcut değildir; bu faz o ekrana yeni silme düğmesi eklemez. Toplu işlemlerde satır başına N önizleme yapılmaz; kapsam uyarıları gerçek etkiyi anlatır.

Aynı paket, departman geri yüklemenin ADR-0043 zincirine aykırı «görevleri dönmez» metnini düzeltir; sözleşmenin döndürdüğü gerçek sonuç ve bağımsız kanıtla gerekli önbellek etkileri tamamlanır. Kapsam genişlemesi somut sözleşme/ekran kanıtıyla ilerleme kaydına yazılır; hazır uç bulunması tek başına yeni eylem yetkisi değildir.

## İş sırası ve kapılar

1. W198 Codex: yayımlı sözleşme/mevcut ekran eşlemesi, Sonnet salt okunur uygulanabilirlik, Terra bağımsız risk ve test planı; açık kapsam kaydı.
2. W199 Sonnet: etki okuması ve mevcut onaya bağlama, zorunlu yaşam döngüsü metin/önbellek uyumu; kesin sahiplik özel istemde.
3. W200 Terra: bağımsız dar testler, 390/1440 koyu üretim paketi+CSP ve gerçek v0.26 backend tanığı. Sahte/gerçek/CI kanıtları ayrı tutulur.
4. Opus salt okunur son denetim; gerekiyorsa Sonnet dar düzeltme ve Terra doğrulama.
5. Codex rapor/kayıt/PR-CI: her PR kendi üç SUCCESS ve kabul sonrası MERGED; ana ağacın doğrulanması ve yalnız faza ait kaynakların temizliği.

Yerelde etkilenen testler/typecheck/değişen lint-format/build; tam test paketi ve gerçek E2E CI'da. Ana PR kapanış kapısı tamamdır; yeni takip işi kendi bağımsız kabul ve PR/CI kapılarını ayrıca karşılar. [F11 raporu](../../backend-eksikleri/rapor-F11.md), [bağımsız doğrulama](../../backend-eksikleri/dogrulama-F11.md), [Opus](../../reviews/WEB-11-opus.md). [İlerleme](ilerleme.md), [kabul matrisi](canliya-alma-matrisi.md).


**Ana PR181 tarihçesi — CI güvenlik deltası:** Uygulama kabulü f7729476 olarak korunur. CI1 44151554996'da893/6692 test geçti, üretim audit kırmızı oldu. Sonnet cedc7106 yalnız Vue Router4.6.5 manifest/kilit düzeltmesiyle savunmasız üretim araç zincirini kaldırdı; Terra W203 bağımsız87 test/tam tip-build/gerçek üçrol390-1440 gezinme ve prod audit0 kabulü verdi. PR181 kapanışında dev audit borcu değişmeden sürdü;18 Kasım takip düzeltmesi aşağıdadır. Bu paket değişikliği önceki Opus uygulama hükmünün kapsamına eklenmez. Ayrıntılar [ilerlemede](../../yurutme/web-11/ilerleme.md); bu HEAD kendi CI44157077907 üç SUCCESS ile PR181’de birleşti.


## 2026-11-18 takip yetkisi

Kullanıcı «F11’den kalanları tamamla, eşleştir; sonra F12» dedi. Geliştirme bağımlılıklarının15 denetim bulgusu için yayımlı güvenli güncellemeler ve dar transitif sürüm düzeltmeleri hazırlanıyor; ayrıntı ve kapanmayan resmi yama sınırı [takip kaydında](gelistirme-bagimliliklari.md). Üretim denetimi0 olarak korunur; yayımlanmamış yama, ignore/audit gevşetmesi veya sahte sürüm kullanılmaz. Açık72 kayıt yayımlıv026/v027/v028 ile [eşleştirildi](../web-12/sozlesme-eslestirmesi.md); [F12 kapsam önerisi](../web-12/README.md) uygulama başlangıcı değildir. Pin bu takipte v026 kalır.
