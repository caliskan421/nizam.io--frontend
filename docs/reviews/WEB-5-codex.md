# WEB-5 — Codex nihai kapı

Faz: F5 (arşiv + silinen kayıtlar). Codex gpt-6.1-sol medium, `-s read-only`. Hüküm durumu: tur 3 UYGUN; F5 KAPANDI (kapanış PR #118 bekliyor).

## Tur 1 — 2026-11-13, HEAD 44eb5fe

HEAD: `44eb5fefa13d3afebfbf4ceb67d4672704b309f7`

**KOŞULLU UYGUN**

İncelenen yollarda engelleyici yetki, pin veya sahip sökümü kusuru saptamadım. Aşağıdaki iki davranış kusuru ve iki belge/kanıt uyuşmazlığı F5 kapanmadan giderilmeli. Davranış bulguları statik kod akışından çıkarıldı; bu koşumda yeni test yazılmadı veya çalıştırılmadı.

**Davranış bulguları**

- **CX-F5-Ö-01 — Orta: Kapatılan önizleme geç sayfalama yanıtıyla yeniden açılıyor.**  
  Konum: `src/modules/archive/pages/folder/use-file-selection.ts:103–110`.  
  **Tetikleyici → sonuç:** Yüklenen son dosyada “Sonraki” seçilir; sonraki sayfa beklenirken ✕/Esc ile önizleme kapatılır. Yanıt geldiğinde `go()` güncel seçimi denetlemeden `input.select(next.file_id, 'replace')` çağırır; `dosya` URL’ye yeniden yazılır ve panel açılır. Sayfa sahibi hâlâ canlıdır; bunu sökülmüş sahip ihlali olarak sınıflandırmıyorum.  
  **Bağ:** E-06-47/48, URL durumu ve kapanış davranışı.  
  **En küçük sınıf düzeltmesi:** Asenkron gezinmeyi seçim nesline bağlamak; kapatma, seçim veya süzgeç değişiminde eski devamı hükümsüz kılmak.  
  **Doğrulama:** MSW yanıtını kontrol noktasında beklet → Sonraki → kapat → yanıtı bırak; panel kapalı, `dosya` parametresi yok ve odak kartta kalmalı. Sabit süre beklenmemeli.

- **CX-F5-Ö-02 — Orta: Yönetici görev eşlemesi hatası süresiz yükleniyor durumuna dönüşüyor.**  
  Konum: `src/modules/archive/pages/folder/use-folder-data.ts:26–47`; `src/modules/archive/api/admin-tasks.ts:36`.  
  **Tetikleyici → sonuç:** `archiveTasks` başarılıyken `listProgramWorkItems` ilk okuması başarısız olur. `ready=false` kalır; `tasksFailed` yalnız `archiveTasks` hatasını izlediğinden `tasksLoading=true` sürer. Görev klasörleri hata ve yeniden deneme yerine iskelet gösterir.  
  **Bağ:** P33’ün iki kaynaktan kesişimi, E-06-29/37, K7 hata durumu.  
  **En küçük sınıf düzeltmesi:** Kesişimin iki bağımlılığının yüklenme/hata durumlarını birlikte üretmek ve başarısız bağımlılık için yeniden deneme sunmak.  
  **Doğrulama:** İki kaynağı ayrı ayrı başarısız kılmak; hata sonrası iskeletin bitmesini, yeniden denemeyle listenin gelmesini ve doğrulama tamamlanmadan dosya isteği çıkmamasını sınamak.

**Belge ve kanıt bulguları**

- **CX-F5-K-01 — Düşük: Aynı adla yeni anahtar tanığı raporla uyuşmuyor.**  
  Konum: `docs/yurutme/web-5/dogrulama-F5.md:93`.  
  Rapor “yeni anahtar + aynı görünür ad → 201” diyor; kalıcı `web5-w130/shots/api-extra.json` içindeki `yeniAnahtarAyniAd` sonucu **422 `records.too_many_files`**. Bu, backend davranış kusuru değil, belirtilen tanığın yetersizliğidir.  
  **Bağ:** P35 ve kabul kanıtının izlenebilirliği.  
  **Düzeltme/doğrulama:** Rapordaki tanık iddiasını düzeltmek; 201 iddiası korunacaksa dosya tavanına ulaşmamış görevde ayrı, kaynakla eşleşen kanıt göstermek.

- **CX-F5-K-02 — Düşük: Dönem ZIP’inin açık klasörde çalıştığı yazıyor.**  
  Konum: `docs/backend-eksikleri/rapor-F5.md:58`; `docs/backend-eksikleri/kayit.md:127`.  
  Kodda dönem ZIP düğmesi açık klasöre bağlanmamış; `/arsiv` üzerindeki düğme devre dışı. W130 raporu da UI’da bulunmadığını açıkça doğruluyor.  
  **Bağ:** E-06-04, P33, BE-120.  
  **Düzeltme/doğrulama:** Belgelerde kullanılabilir API yoluyla mevcut UI bağlantısını ayırmak; rota bileşimi ve W130 tanığıyla karşılaştırmak. Yeni düğme eklemek bu belge düzeltmesinin gereği değildir.

**Kapsam değerlendirmesi**

- P33/K2 yolu doğru: yönetici `/arsiv` üzerinde S3 arşiv isteği başlatmıyor; departman rotadaki açık klasörden geliyor, kapsam deposuna yazılmıyor. Dosya okuması doğrulanmış görevle sınırlı.
- P34/P35 ve ADR-0030 dosya yetkileri örtüşüyor; W129 yükleme/silme hesabı da hizalı. Anahtarlı tek tekrar ve anahtarsız belirsizlik ayrımı mevcut.
- P36/P37/P41–P45: yalnız yönetici, dört canlı tür, türler için “Tümü” yokluğu, saklama metni, desteklenmeyen alanlar ve `work.department_unavailable` yolu mevcut.
- W127’de silme sürerken panelin tutulması sahip sökümü değildir; kabul edilen çözümü kusur saymadım.
- Raster/20 MiB önizleme ve URL temizliği mevcut. `img-src blob:` görüntü kaynak iznini genişletiyor; script/frame izinlerini genişletmiyor. İncelenen kullanımda SVG/HTML gömme yok.
- KESİN 29 ilişkileri ve entegrasyon kanıtları incelendi; lint eşikleri gevşetilmemiş. İncelenen testlerde sabit gerçek zaman beklemesi saptamadım.

**Kanıt sınırları**

- W127’nin sahte `/v1` üretim/Caddy dumanı ile W130’un gerçek Docker + pinli backend tanığı ayrı değerlendirildi. Her iki matrisin ham sonuçlarında `failures: []`; W130’da 18 senaryo var.
- W130’un test ettiği `ae51649` ile bu HEAD arasında `src`, `deploy` ve pin açısından fark yok. Rapordaki **4024 test** tarihsel kanıttır; güncel uzak CI sonucunu bağımsız doğrulamadım.
- Gerçek VoiceOver ve kullanıcı görsel onayı yapılmamış; otomatik doğrulandı sayılmadı. Yeni onay akışı oluşturulmadı.
- E-06-01…64 ve E-12-01…69 kabul tabloları değerlendirildi; bütün kaynak ve test dosyalarını satır satır kapsadığım iddiasında değilim.
- Dosya değiştirilmedi; çalışma ağacı başlangıç ve bitişte temiz. F5 kapanışı veya “bitti” hükmü verilmedi.

## Koşulların kapanışı

| Bulgu       | Kapanış                                              | Hash / PR |
| ----------- | ---------------------------------------------------- | --------- |
| CX-F5-Ö-01  | W132 PR #116 (geç sayfalama yanıtı seçim nesline bağlanır) | kapandı — `3cd3c90`, main `1248daa` |
| CX-F5-Ö-02  | W132 PR #116 (yönetici görev eşlemesi hata/yeniden deneme + `tasks.error`) | kapandı — `9750cf4`, `74b0f9c`, main `1248daa` |
| CX-F5-K-01  | `web5/o4-kapanis`: dogrulama-F5 tanık iddiası düzeltildi | kapandı — `0d93711` |
| CX-F5-K-02  | `web5/o4-kapanis`: rapor-F5 ve kayit.md BE-120 ifadesi düzeltildi | kapandı — `45193bf` |
| CX-F5-Ö-03  | W133 PR (görev geri yükleme/kalıcı silme `workItems.files` geçersizlemesi + ilişki testi) | kapandı — `f0f1078`, PR #117 |
| CX-F5-Ö-04  | W133 PR (bildirimle Koordinatörlük sekmesine geçişte odak dönüşü) | kapandı — `3e2e9c7`, PR #117 |

## Tur 2 — 2026-11-13, HEAD d889e2a

HEAD: `d889e2a15d72b8c3bc175309faeecb6d03b9ea8c`

**KOŞULLU UYGUN**

İncelenen yollarda engelleyici yetki, pin veya sahip sökümü kusuru saptamadım. Tur 1’in dört koşulu kaynak ve test iddiaları bakımından kapanmış. Aşağıdaki iki küçük bulgu F5 kapanmadan giderilmeli. Bulgular statik kaynak incelemesine dayanıyor; bu koşumda test çalıştırılmadı.

**Tur 1 kapanışları**

| Bulgu | Değerlendirme |
|---|---|
| CX-F5-Ö-01 | **Kapandı.** Bekleyen gezinme seçim nesline bağlı; kapatma ve başka seçim eski devamı hükümsüz kılıyor. `ArchiveFolderPage.races.test.ts` kapatma ve süzgeç değişimini kontrollü yanıtla kapsıyor. |
| CX-F5-Ö-02 | **Kapandı.** Kesişimin iki kaynağının ilk okuma hatası birlikte değerlendiriliyor; hata görünümü ve yeniden deneme bağlı. Testler iki kaynağı ayrı ayrı düşürüyor ve doğrulama öncesinde dosya isteği çıkmadığını denetliyor. |
| CX-F5-K-01 | **Kapandı.** Aynı ad/yeni anahtar iddiası “doğrulanmadı” olarak düzeltildi; ham tanıktaki 422 ile uyumlu. |
| CX-F5-K-02 | **Kapandı.** `rapor-F5.md` ve BE-120 kaydı, çalışan API ile UI’da bulunmayan kullanılabilir yolu açıkça ayırıyor. |

Bu düzeltmelerin incelenen akışlarında yeni regresyon saptamadım.

**CX-F5-Ö-03 — Orta: Görev yaşam döngüsü ortak dosya sorgusunu geçersizlemiyor.**

Konum: `src/shared/http/query-keys.ts:401`; `src/shared/http/query-keys.deleted.test.ts:14`.

- **Tetikleyici → sonuç:** Ortak `workItems.files` girdisi önbellekteyken görev geri yüklenir veya kalıcı silinir. İlişki yalnız dosya yazmalarını ve alt görev silmeyi içerdiğinden bu girdi bayat işaretlenmez; etkin gözlemci yeniden okumaz. Görev ayrıntısının geçersizlenmesi, ayrı çocuk anahtarı kapsamıyor. Dosya okuyucusunun 30 saniyelik tazelik süresi de korunuyor.
- **Bağ:** E-12-35/36’nın bağlı sorguları yenilemesi; `12-silinen-kayitlar/backend.md` §5’in geri yükleme için açıkça istediği `workItems.files` ilişkisi. Mevcut yaşam döngüsü ilişki testi bu kaynağı beklenen kümeden atlamış.
- **En küçük sınıf düzeltmesi:** Görev geri yükleme/kalıcı silme ilişkilerine ortak dosya kaynağını eklemek; ilişki testini tamamlamak.
- **Anlamlı doğrulama:** Taze dosya önbelleği oluştur → yaşam döngüsü yazmasını uygula → pasif girdinin bayat işaretlendiğini, etkin okuyucunun yeniden okuduğunu ve başka program girdisinin etkilenmediğini denetle. Görünür içerik yanlışlığını bu koşumda ayrıca yeniden üretmedim; kesin saptama geçersizleme eksikliğidir.

**CX-F5-Ö-04 — Düşük: Koordinatörlük sekmesine bildirim üzerinden geçiş odağı kaybediyor.**

Konum: `src/modules/deleted-records/pages/DeletedRecordsPage.vue:81`; `src/modules/deleted-records/components/NoticeBar.vue:23`.

- **Tetikleyici → sonuç:** `work.department_unavailable` sonrasında klavyeyle “Koordinatörlük sekmesini aç” seçilir. `dismissNotice()` odaktaki düğmeyi DOM’dan kaldırır; sekme değiştirilir fakat hedef sekmeye odak verilmez. Odak gövdeye düşer.
- **Bağ:** KESİN 27’nin kapanışta mantıklı hedefe odak dönüşü; `work.department_unavailable` kurtarma yolu.
- **En küçük sınıf düzeltmesi:** Bildirim kaldırılarak yapılan gezinmelerde odağı yeni seçili tür düğmesine taşımak; bildirimin kapatma yoluna da kalıcı bir dönüş hedefi vermek.
- **Anlamlı doğrulama:** Gerçek bildirim düğmesini odakla → Enter ile etkinleştir → sekme değişiminden sonra `activeElement` Koordinatörlük düğmesi olmalı. Bildirimi kapatma yolu da sınanmalı. Mevcut O3 testi bu geçişte sekme/kayıt değişimini denetliyor, odağı denetlemiyor.

**Diğer değerlendirmeler**

P33/K2’de açık rota departmanı, yönetici `/arsiv` için S3 isteği yokluğu ve doğrulanmış görevle dosya okuma korunuyor. P34/P35, dört silinen tür, yönetici yetkisi ve ADR-0030 hizasında yeni kusur saptamadım. W127’nin silme sırasında paneli tutması sahip sökümü değildir.

UploadDialog’un anahtarlı tekrar ve sökülmüş sahip kapıları; blob URL’nin seçim değişimi/sökümde serbest bırakılması mevcut. Raster/20 MiB sınırı korunuyor. CSP’de `blob:` görüntü kaynak iznini genişletiyor; script/frame izinlerini genişletmiyor. v0.16/v0.17 alanlarının web pininde kullanıldığına dair bulgu yok. Lint/boyut kuralları değişiklik farkında gevşetilmemiş.

**Belge ve kanıt sınırları**

- W127 MSW/Caddy ve W130 gerçek Docker + pinli backend tanıkları ayrıdır; iki ham matriste de 18 sonuç ve `failures: []` var.
- W130 tanığı `ae51649` kaynağına aittir; Tur 2 kod düzeltmelerinin üretim tanığı sayılmaz. Güncel uzak CI bağımsız doğrulanmadı.
- Gerçek VoiceOver ve kullanıcı görsel onayı yapılmamış; otomatik doğrulandı sayılmadı.
- E-06-01…64 ve E-12-01…69 kabul tabloları değerlendirildi; bütün kaynak, test ve PNG dosyalarını satır satır kapsadığım iddiasında değilim.
- `../program/DURUM.md` bu yerleşimde bulunamadı.
- Dosya değiştirilmedi; başlangıç ve bitiş çalışma ağacı temiz. Push/PR yapılmadı; F5 kapanmış sayılmadı.

## Tur 3 — 2026-11-13, HEAD 848409d

HEAD: `848409d5490fdf942085ef951fb91d7f41a47bbc`

**UYGUN** — Tur 3’ün dar kapsamında yeni somut bulgu veya regresyon saptamadım.

- **CX-F5-Ö-03 kapandı:** `query-keys.ts:405`, görev geri yükleme ve kalıcı silmeyi `workItems.files` geçersizlemesine ekliyor. `query-keys.deleted.test.ts:69–92`, iki işlem için gerçek QueryClient üzerinde etkin okuyucunun yeniden okumasını, pasif girdinin bayatlamasını ve başka programın korunmasını denetliyor. E-12-35/36 ve KESİN 29 bakımından sınıf düzeltmesi yeterli.
- **CX-F5-Ö-04 kapandı:** `DeletedRecordsPage.vue:82–97`, bildirimden Koordinatörlük geçişinde hedef tür düğmesine, kapatmada seçili tür düğmesine odak veriyor. `deleted-records-o3.test.ts:227–257`, iki yolu da `activeElement` ile denetliyor. KESİN 27 bakımından sınıf düzeltmesi yeterli.

Kanıt sınırları:

- Hüküm kaynak ve test iddialarının incelemesine dayanıyor; testler çalıştırılmadı, uzak CI doğrulanmadı.
- Odak testi, odaklanmış yerleşik düğmenin tıklanmasını kullanıyor; gerçek Enter/Space veya VoiceOver tanığı değildir. Kullanıcı görsel onayı doğrulanmış sayılmadı.
- Yeni geniş tarama yapılmadı; tüm F5 dosyalarını kapsadığım iddiasında değilim.
- Dosya değiştirilmedi, push/PR yapılmadı. Başlangıç ve bitiş çalışma ağacı temiz; farkta boşluk hatası yok.
