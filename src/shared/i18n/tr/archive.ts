// Arşiv modülü (06 Arşiv, 07 Arşiv › Klasör; F5; `archive.*`) metinleri — TEK statik TR ağacı
// (`trArchive`), `src/shared/i18n/index.ts` `mergeTrees`'e bir kez kayıtlı; çalışma anında ağaca
// ekleme yok (KESİN 24). Her O2b uygulayıcısı yalnız kendi alt dalını doldurur: `folders`
// (W122), `folder`/`tree`/`tasks`/`files` (W123), `preview`/`actions` (W124), `upload` (W125),
// `zip` (W126); ikinci kök ağaç ya da dosya açılmaz. W121 yalnız ortak parçaları (sayfa
// başlıkları, tür/segment adları, yönetici boş durumu) yazar. Sunucu `message` alanı kullanılmaz
// (hata kodu → `errors.*`); örnek işletme verisi yoktur (ortak-kurallar §4). Etiket adları
// (P34) `modules/archive/model/tags.ts` sözlüğündedir (tek kaynak).

export const trArchive = {
  archive: {
    page: {
      title: 'Arşiv',
      // P38: "Kurumsal hafıza" kullanılmaz (BE-033 ad çakışması).
      subtitle: 'Görevlere yüklenen dosyalar',
    },
    folder: {
      title: 'Klasör',
    },
    shared: {
      kind: {
        label: 'Dosya türü',
        tumu: 'Tümü',
        gorsel: 'Görsel',
        belge: 'Belge',
      },
      view: {
        label: 'Görünüm',
        izgara: 'Izgara',
        liste: 'Liste',
      },
      sort: {
        ad: 'Ada göre',
        dosya: 'Dosya sayısına göre',
        // Klasör "Son yükleme" sırası için alan yok (BE-025): seçenek devre dışı.
        sonYukleme: 'Son yükleme',
      },
      // Yönetici merceği (P33, BE-072): klasör düzeyi "Son eklenen dosyalar" ve "Tüm arşivde ara".
      selectTask: 'Görev klasörü seçin',
      // Yönetici görev listesi 200 tavanında kesildi: kesişim eksik olabilir.
      tasksTruncated: 'Görev listesi kesildi: bazı görev klasörleri gösterilemiyor.',
      unknownUploader: 'Bilinmeyen kişi',
      noValue: '—',
    },
    // Dosya türü rozeti adları (`model/mime.ts` `typeBadge`).
    type: {
      IMG: 'Resim',
      PDF: 'PDF',
      DOC: 'Belge',
      XLS: 'Tablo',
      PPT: 'Sunum',
      TXT: 'Metin',
      ZIP: 'Sıkıştırılmış',
      DOSYA: 'Dosya',
    },
    // O2b alt dalları: sahibi W gövdesini doldururken buraya ekler.
    folders: {},
    tree: {},
    tasks: {},
    files: {},
    preview: {},
    actions: {},
    upload: {},
    zip: {},
  },
} as const
