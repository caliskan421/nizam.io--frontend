# <NN> — Mekanizma (nasıl davranıyor)

## 1. Giriş ve gezinme
Ekrana nereden gelinir (kenar menüsü, bağlantı, derin bağlantı), nereye gidilir (öğe → hedef ekran/rota). URL'de taşınan durum (süzgeç, seçili kayıt, sekme).

## 2. Kapsam ve rol etkisi (K1, K2)
Admin / Koordinatör / Üye merceğinde neler görünür, neler gizlenir; kapsam (program, departman) değişince ne olur. Eylem görünürlüğü `istemci-akislari.md` §4'e işaret eder, rol dizesi karşılaştırması yapılmaz.

## 3. Durum makinesi
Ekranın istemci durumu: seçili sekme, açık panel, süzgeçler, sıralama, sayfa; hangileri URL'de, hangileri bellekte, hangileri hatırlanır (K2 depolama istisnası yalnız kapsam + tema).

## 4. Etkileşim akışları
Her yazma eylemi için adım adım: tetikleyici → form/pencere → doğrulama → istek → başarı/hata → ekranın yenilenmesi. Çakışma (409), onay (confirmation_required), bilinmeyen sonuç (K5).

## 5. Liste davranışı
Sayfalama (imleç mi, sayfa mı), tavan, sıralama, arama, süzgeçler; "daha fazla yükle" vs sayfa numarası; sayaçlar nereden.

## 6. Boş / yükleniyor / hata durumları
Tasarımda olanlar + K7 açık durumları (program yok, membership_required, departman yok). Tasarımda olmayanlar "tasarımda yok — K7 varsayılanı" diye yazılır.

## 7. Öğe → davranış tablosu
| Kimlik | Öğe | Olay | Davranış | Bağ (mekanizma §, backend.md satırı) |
|---|---|---|---|---|

## 8. Bağımlılıklar
Ortak bileşenler (`00-ortak`), diğer ekranlara geçişler, paylaşılan durum (seçili program, tema).
