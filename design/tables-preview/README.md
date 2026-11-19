# Tablolar tasarım önizlemesi

- Paylaşım ve yönetici maketi 11, 11b ve 11c çizimlerine dayanır. Birlikte çalışma maketi 11e dışa aktarımından türetilmiştir. İleri akışlar, 18 Kasım 2026 tarihli RoketPortal tasarım eklerinden alınmıştır. 11d bağlantı çizimi örnek verili bir referans olarak uyarlanmıştır.
- Bu HTML parçaları yalnız Vue uygulamasının oturumlu Tablolar önizleme rotasında kullanılır. Özgün dışa aktarımlardaki betikler ayrı modüllere taşındı, görünüm stilleri uygulama CSP’siyle uyumlu yerel varlıklardır. Maketlerin CSS’i Shadow DOM içinde kalır.
- Örnekler uygulamanın hesap ve programını okumaz. Rol, program, tema, yazma ve paylaşım etkileşimleri maket belleğindedir. Kaynak artboard’lar ve özgün dışa aktarımlar ayrı olarak korunur.
