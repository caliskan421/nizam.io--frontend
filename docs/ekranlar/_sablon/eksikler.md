# <NN> — Backend eksikleri (ne yok)

Her satır bir tasarım öğesidir; backend'de karşılığı yoksa burada durur. Kimlik verme ve `../../backend-eksikleri/kayit.md`'ye taşıma **koordinatöre** aittir; burada mevcut BE-NNN'ye bağlanır ya da `yeni-N` geçici adı kullanılır.

## 1. Mevcut kayıtla eşleşenler
| Kimlik (E-) | Öğe | BE-NNN | Kayıttaki tanım yeterli mi? | Düzeltme önerisi |
|---|---|---|---|---|

## 2. Yeni eksik önerileri
| Geçici ad | Kimlik (E-) | Öğe | Eksik (uç/alan/kural; mümkünse operationId + alan) | Şimdilik (statik / devre dışı / istemcide hesap) | Bağ (GAP/KR/ADR ya da `yeni`) | Boyut | Gerekçe |
|---|---|---|---|---|---|---|---|

## 3. Kısmi karşılıklar
Backend'de var ama tasarımın istediği biçimde değil (ör. imleç var, sayfa numarası yok). Tasarım nasıl uyarlanır, kullanıcıya ne söylenir.

## 4. Yol haritası kararıyla çelişenler
K14 (v1 dışı), K3 (fan-out yasağı), K4 (seçici yok) vb. ile çelişen tasarım öğeleri ve "v1'de ne gösterilir" kararı. Karar değişikliği gerekirse "ürün sahibine soru" olarak yazılır.

## 5. Önerilen backend iş paketleri
Eksikleri gruplar (tek uç/tek modül), sıra ve bağımlılık önerisi — `rapor-F<N>.md` için ham madde.
