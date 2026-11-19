# WEB-13 — Tablolar

**Durum:** Temel Tablolar modülü frontend ana dalına alındı. Yönetici görünümü ve paylaşım penceresi tasarım aşamasında. Koordinatör Astra, uygulama Sol, bağımsız test Terra, son denetim Opus.

| Teslim | Kullanıcı davranışı | Birleşme ve kanıt |
| --- | --- | --- |
| F13A | Kişisel veya koordinatörlük alanını seçme, tabloları listeleme, boş tablo oluşturma ve ayrıntısını açma | [PR 185](https://github.com/caliskan421/nizam.io--frontend/pull/185), ana dal `f34b44e9`, [üç başarılı CI işi](https://github.com/caliskan421/nizam.io--frontend/actions/runs/44451288960) |
| F13B/C | Altı temel hücre türünü düzenleme, satır/sütun yönetimi, tür dönüşümü ve onaylı silme. Sürüm çatışmasında taslağı koruma | [PR 186](https://github.com/caliskan421/nizam.io--frontend/pull/186), ana dal `c380ac81`, [üç başarılı CI işi](https://github.com/caliskan421/nizam.io--frontend/actions/runs/44456529853) |

## Tasarım kararı

Şirket yöneticisi seçili programdaki koordinatörlük tablolarını birime göre bulup okuyabilmeli. Kişisel tablolar bu genel görünümün dışında kalır. Yazmak için ayrıca düzenleme yetkisi gerekir. Paylaşımı tablo sahibi yönetir. Kişiye verilen iznin kaldırılması yalnız o izin kaynağını kaldırır.

Yerel etkileşimli prototip çalışma alanında `output/tablolar-yonetici-paylasim/index.html` yolunda bulunur. Chromium’da 390 ve 1440 pikselde oluşturma, yönetici araması, rol verme/kaldırma, program ve kişisel alan ayrımı, klavye odağı sınandı. Prototip örnek veri kullanır. Bu akışların gerçek sisteme alınması [backend iş kartına](../../backend-eksikleri/rapor-F13.md) bağlıdır.

[İlerleme ve doğrulama](ilerleme.md) · [WEB-14 açılışı](../web-14/README.md)
