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
    // W124 — 07 sağ panel: önizleme (E-06-45…55).
    preview: {
      region: 'Dosya önizleme',
      title: 'Önizleme',
      position: '{position} / {total}',
      positionMore: '{position} / {total}+',
      positionUnknown: '{position} / {position}+',
      previous: 'Önceki dosya',
      next: 'Sonraki dosya',
      close: 'Önizlemeyi kapat',
      area: 'Görsel önizleme alanı',
      loading: 'Önizleme yükleniyor…',
      failed: 'Önizleme yüklenemedi.',
      retry: 'Yeniden dene',
      unavailable: 'Bu dosya türü için önizleme yok.',
      tooLarge: 'Dosya önizleme için çok büyük.',
      fullscreen: 'Tam ekran aç',
      image: '{name} önizlemesi',
      typeAndSize: '{type} · {size}',
      task: 'Görev',
      subtask: 'Alt görev',
      tag: 'Etiket',
      uploader: 'Yükleyen',
      date: 'Tarih',
      openTask: '{title} görevini aç',
      taskUntitled: 'Görevi aç',
      noValue: '—',
    },
    // W124 — dosya eylemleri: indir, yeniden adlandır, sil (E-06-56…60, 64).
    actions: {
      label: 'Dosya eylemleri',
      download: 'İndir',
      downloading: 'İndiriliyor…',
      downloadSaved: '{name} indirildi.',
      downloadRetryAfter: 'Çok fazla indirme isteği. {seconds} saniye sonra yeniden deneyin.',
      downloadInterrupted: 'İndirme yarım kaldıysa yeniden deneyin.',
      rename: 'Yeniden adlandır',
      retag: 'Etiketi değiştir',
      move: 'Başka klasöre taşı',
      remove: 'Dosyayı sil',
      renameTitle: 'Dosyayı yeniden adlandır',
      renameDescription: 'Yeni ad aynı görevdeki diğer dosyalarla çakışmamalıdır.',
      renameLabel: 'Dosya adı',
      renameSave: 'Kaydet',
      renameCancel: 'Vazgeç',
      renameRequired: 'Dosya adı boş olamaz.',
      renameTooLong: 'Dosya adı en çok {max} karakter olabilir.',
      renamed: 'Dosya adı güncellendi.',
      removeTitle: 'Dosya silinsin mi?',
      removeBody: 'Bu işlem geri alınamaz.',
      removeConfirm: 'Dosyayı sil',
      removed: 'Dosya silindi.',
      removedAlready: 'Dosya zaten silinmiş.',
    },
    upload: {},
    zip: {},
  },
} as const
