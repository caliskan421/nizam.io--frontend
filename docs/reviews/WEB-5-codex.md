# WEB-5 — Codex nihai kapı

Faz: F5 (arşiv + silinen kayıtlar). Codex gpt-6.1-sol medium, `-s read-only`. Hüküm durumu: tur 1 KOŞULLU UYGUN; koşulların kapanışı bekliyor; F5 henüz KAPANMADI.

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
| CX-F5-Ö-01  | W132 PR (geç sayfalama yanıtı seçim nesline bağlanır) | bekliyor  |
| CX-F5-Ö-02  | W132 PR (yönetici görev eşlemesi hata/yeniden deneme) | bekliyor  |
| CX-F5-K-01  | `web5/o4-kapanis`: dogrulama-F5 tanık iddiası düzeltildi | bekliyor (hash koordinatörden) |
| CX-F5-K-02  | `web5/o4-kapanis`: rapor-F5 ve kayit.md BE-120 ifadesi düzeltildi | bekliyor (hash koordinatörden) |

Tur 2 hükmü: bekliyor.
