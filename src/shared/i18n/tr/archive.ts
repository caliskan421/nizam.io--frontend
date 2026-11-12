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
    // 07 sayfa (W123): başlık, meta, arama, erişim kaybı.
    folder: {
      title: 'Klasör',
      loading: 'Klasör yükleniyor',
      error: 'Klasör bilgisi yüklenemedi',
      meta: {
        // E-06-33: kişi adları ve bayt toplamı gizli/statik (BE-025).
        tasks: '{n} görev klasörü',
        tasksMore: '{n}+ görev klasörü',
        files: '{n} dosya',
        bytes: '—',
      },
      upload: 'Yükle',
      search: {
        label: 'Tüm arşivde ara',
        placeholder: 'Tüm arşivde ara…',
        // Yönetici, görev seçilmemiş: arama statik (BE-072).
        needsTask: 'Görev klasörü seçin',
      },
      missing: {
        // K6: klasör yok ya da erişim kaybı.
        title: 'Klasör bulunamadı',
        text: 'Bu klasör yok ya da erişiminiz kalmamış olabilir.',
        back: 'Arşive dön',
      },
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
    tree: {
      label: 'Klasör ağacı',
      kicker: 'koordinatörlükler',
      loadingTasks: 'Görev klasörleri yükleniyor',
      noValue: '—',
    },
    tasks: {
      title: 'Görev klasörleri',
      caption: 'Her görev kendi klasörü',
      fileCount: '{n} dosya',
      empty: 'Bu klasörde dosyalı görev yok',
      loading: 'Görev klasörleri yükleniyor',
    },
    files: {
      title: 'Son eklenen dosyalar',
      tag: { label: 'Etiket', all: 'Tümü' },
      grid: 'Dosyalar',
      list: 'Dosya listesi',
      open: '{name} önizle',
      subtask: 'Alt görev',
      loadMore: 'Daha fazla yükle',
      loading: 'Dosyalar yükleniyor',
      error: 'Dosyalar yüklenemedi',
      retry: 'Yeniden dene',
      empty: {
        title: 'Gösterilecek dosya yok',
        text: 'Seçili görev klasöründe, etikette ya da aramada dosya bulunamadı.',
        selectTaskText: 'Dosyalar seçilen görev klasörüne göre listelenir.',
      },
      column: { name: 'Ad', task: 'Görev', type: 'Tür', size: 'Boyut', tag: 'Etiket' },
    },
    preview: {},
    actions: {},
    upload: {},
    zip: {},
  },
} as const
