# F10 backend sözleşmesi tüketim raporu

**Kaynak ve bağımsız kabul tamam; kapanışın yürürlüğü son PR’ın kendi üç CI SUCCESS + MERGED koşuludur.** F10, yayımlı BE-P45/v0.26.0-api paketini mevcut arşiv ve silinenler ekranlarına bağlar. Backend'in ayrı BE-F8 süreci ürün sahibinde kalır. Yeni faz/etiket kendiliğinden bu kapsama alınmaz.

## Sözleşme ve davranış

Pin v0.25→v0.26, backend4d4adc0f;293 işlem (+32),372 şema (+24),232 hata (+5), kaldırılan işlem yok. Dokuz silinen kayıt türü, beş çocuk yaşam döngüsü paketi, tek birleşik sunucu listesi ve dosya taşıma geldi. Üretilen istemci spec'ten üretildi; yerel DTO/uydurma uç eklenmedi.

| BE | F10 karşılığı | Kabul durumu |
| --- | --- | --- |
| 075 | Aynı programda yetkili hedef göreve/alt göreve dosya taşıma; kaynak S3, hedef gövdede; anahtarsız ve kör tekrar yok | W194 kaynakta bağlandı; Terra50 test/gerçek taşıma-arama geçti |
| 076 | Dosya yumuşak silme, silinenler dosya görünümü/restore/purge/batch; aynı ad çakışmasının gerçek yeni adı | W193 dosya UI + W194 son stub temizliği + gerçek restore/byte tanığı |
| 077 | Dolu aramada search_scope=all: dosya/görev/yükleyen; tek karakterde ek kapsam backend tarafından daraltılır | W194 kaynakta bağlandı; Terra50 test/gerçek taşıma-arama geçti |
| 109 | Alt görev yaşam döngüsü ve silinmiş ebeveyn uyarısı | W193 bağlandı, Terra gerçek tanığı ve PR179 üç CI başarılı; düzeltme son pakette |
| 110 | Tümü/Not ve gündem tek sunucu birleşik listesi, gerçek özet/toplam, imleç; istemci fan-out yok | W193 bağlandı, Terra gerçek tanığı ve PR179 üç CI başarılı; düzeltme son pakette |
| 111 | Görev notu/toplantı notu/gündem türleri, birleşik görünüm, gerçek ayrı tür yazmaları | W193 bağlandı, Terra gerçek tanığı ve PR179 üç CI başarılı; düzeltme son pakette |
| 115/163 | Tek tür ve üçlü not/gündem boşaltma; departman açık scope=program, şirket geneline sessiz düşüş yok | W193 bağlandı, Terra gerçek tanığı ve PR179 üç CI başarılı; düzeltme son pakette |
| 165 | Çöpteki görev dosyasını arşiv liste/toplam/ZIP'ten dışlama | W194 bağlandı, gerçek S2/S3 liste/toplam ve PNG ZIP tanığı geçti |
| 069 | v1'de görevsiz yükleme yok, görev seçimi zorunlu | P45 kararıyla vazgeçildi; son stub kaldırıldı |
| 112 | Süresiz saklama; otomatik kalıcı silme/kalan gün yok | P45 kararıyla vazgeçildi; süreli saklama vaadi yok |

Tümü'de boşaltmak için bir tür seçilir; bu backend eksiği değildir. Karma seçimde gerçek tür+kimlik kullanılır, ebeveynlerden önce çocuk geri yükleme gönderilmez. Birleşik kayıt döndürmeyen zengin görev alanları/sayaçlar hayal edilmez. Ebeveyn adı erişilemiyorsa opaque kimlik veya bağlantı gösterilmez. Hesap işleminin şirket geneli sınırı onaylarda korunur.

## Kanıt ve PR'lar

| PR | Paket | Sonuç |
| --- | --- | --- |
| [176](https://github.com/caliskan421/nizam.io--frontend/pull/176) | Plan/kapsam | CI44057267798 üç SUCCESS; main7e5be482 |
| [177](https://github.com/caliskan421/nizam.io--frontend/pull/177) | Pin + zorunlu semantik uyum | CI44060513834 üç SUCCESS;864 dosya6369 test +15 gerçek E2E; mainbd22ff83 |
| [178](https://github.com/caliskan421/nizam.io--frontend/pull/178) | Veri katmanı + refSummary etkisi + gerçek chat reread401 düzeltmesi | CI2 44072465588 üç SUCCESS;871 dosya6509 test +15 gerçek E2E; mainfe241530 |
| [179](https://github.com/caliskan421/nizam.io--frontend/pull/179) | Silinenler UI | Üç CI SUCCESS,874 dosya6557 test+15 E2E; P2 öğrenilince birleşmeden durduruldu, son paketle değiştirildi |

Gerçek/sahte/CI ayrımı, başarısız ilk koşumlar ve kapsam sınırları [doğrulama kaydında](dogrulama-F10.md). Opus tur2 kaynak5a8a9815 için **UYGUN/açık kaynak bulgusu0** verdi; [denetim kaydı](../reviews/WEB-10-opus.md). Son pakette kendi üç CI SUCCESS+MERGED olmadan faz tamamlandı denmez. Yeşil PR179 bu yeni kaynağın CI'ı yerine sunulmaz.

## Sayım yöntemi

Başlangıç kayıt163=77 bağlı84 açık2 vazgeçildi. Standart production .ts/.vue yorumlar/tests hariç taramada F9 kapanışında24 stub kimliği/35 kullanım vardır; önceki31→16 sayımı eksikti. W193 ara kaynakta21 kimlik/31 kullanım ve82 bağlı79 açık2 vazgeçildi. Bütünleşikb5db1826 kaynağında aynı collectSources/scanSource yöntemiyle **17 kimlik/26 kullanım**, tarama sorunu0; kayıt **163=86 bağlı73 açık4 vazgeçildi**. F10 dokuz kaydı bağlar, iki kaydı kesin ürün kararıyla vazgeçildi yapar. Dosya/regex ya da test örnekleri bu sayımla karıştırılmadı; Sonnet'in dar12/14 çağrı sayımı nihai metrik değildir.

## Kalanlar ve devir

BE-F8, rol kapsamlı audit/01b, Tablolar tasarım/model hizalaması, Takvim/Kurumsal hafıza, profil/Asistan ve GAP-233 önizleme türevi bu fazın dışındadır. BE-024/025/026, BE-123/127/136, BE-166 ve diğer açık kayıtlar yalnız bu faz için genelleyerek kapatılmaz. Daha yeni backend etiketi otomatik alınmaz. F11 açılmadı; kapsam ayrı kararla seçilir.

v026 OpenAPI deleteWorkItemSubtask/deleteMeetingNote/deleteAgendaItem açıklamalarında eski kalıcı silme/bağ çözme ifadeleri kalmıştır. Etiket kodu ve ADR-0054 soft-delete yetkilidir; istemci üretilen spec'i yamamadı, backend kaynaklarına yazmadı. Bu dokümantasyon borcudur, yeni frontend uç ihtiyacı olarak çoğaltılmadı.


## Son paket ve sonraki adım

W193 silinenler + W194 arşiv + W197 dört somut denetim düzeltmesi + W196 kapanış belgeleri aynı PR'da taşınır. Not/gündem Durdur hatası önce Terra RED, sonra Sonnet dar guard ve bağımsız27 testle kapandı. Mevcut görev UI taşıma hedeflerinden çıkarıldı;48 bağımsız arşiv testi/fulltypecheck/build ve gerçek390 yeni paket tanığı geçti. Değişen kaynak yalnız5a8a9815'tir; root sonraki commitlerde yalnız belge yazar. Son başlığın kendi üç CI SUCCESS ve MERGED koşulu F10'u kapatır. [F11](../yurutme/web-11/README.md) açılmadı, backend BE-F8'e müdahale edilmedi.
