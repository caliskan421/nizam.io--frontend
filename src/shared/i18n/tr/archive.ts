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
    folders: {
      search: {
        label: 'Tüm arşivde ara',
        // BE-077: arama yalnız dosya adında; kişi/görev/etiket araması vaadi yok.
        placeholder: 'Dosya adı ara…',
        shortcut: 'Aramaya git',
      },
      coordinatorships: {
        title: 'Koordinatörlükler',
        loading: 'Koordinatörlükler yükleniyor',
        empty: 'Gösterilecek koordinatörlük yok',
        emptyText: 'Bu programda arşivde görünür bir klasör bulunmuyor.',
        error: 'Koordinatörlükler yüklenemedi',
        errorText: 'Klasör listesi alınamadı. Bağlantınızı kontrol edip yeniden deneyin.',
        retry: 'Yeniden dene',
        more: '{count} koordinatörlük daha',
        less: 'Daha az göster',
        truncated: 'Koordinatörlük listesi kesildi: bazı klasörler gösterilemiyor.',
      },
      sort: {
        button: 'Sırala: {field}',
        menu: 'Klasör sırası',
        adArtan: 'Ada göre (A → Z)',
        adAzalan: 'Ada göre (Z → A)',
        dosyaAzalan: 'Dosya sayısı (çoktan aza)',
        dosyaArtan: 'Dosya sayısı (azdan çoğa)',
        sonYukleme: 'Son yükleme',
        short: {
          adArtan: 'Ada göre',
          adAzalan: 'Ada göre (ters)',
          dosyaAzalan: 'Dosya sayısı',
          dosyaArtan: 'Dosya sayısı (ters)',
        },
      },
      card: {
        emptyFolder: 'Henüz dosya yok',
        files: '{count} dosya',
        size: 'Boyut',
        lastUpload: 'Son yükleme',
      },
      tags: {
        title: 'Etiketler',
        caption: 'dosya türünü anlatır',
        list: 'Dosya etiketleri',
      },
      newTag: {
        kicker: 'yeni etiket',
        name: 'Etiket adı',
        placeholder: 'Etiket adı',
        colors: 'Etiket rengi',
        violet: 'Mor',
        gold: 'Sarı',
        green: 'Yeşil',
        red: 'Kırmızı',
        gray: 'Gri',
        create: 'Oluştur',
        // BE-024: etiket kümesi kapalı; form ağ isteği atmaz.
        hint: 'Etiketler sabit bir kümeden seçilir; yeni etiket şimdilik oluşturulamıyor.',
      },
      storage: {
        kicker: 'depolama',
        files: 'dosya',
        total: 'Toplam boyut',
        breakdown: 'Dağılım',
        bar: 'Depolama dağılımı bilinmiyor',
      },
      actions: {
        upload: 'Dosya yükle',
        // BE-072 / BE-121: yönetici 06'da klasör seçmeden yükleyemez; seçici arşiv görevleriyle sınırlı.
        uploadNeedsFolder: 'Yüklemek için önce bir koordinatörlük klasörü açın.',
        uploadNoTasks: 'Yüklenebilecek görev bulunamadı.',
      },
      noFolders: 'Görüntülenecek klasör yok',
      noFoldersText: 'Bu kapsamda arşiv klasörünüz bulunmuyor.',
      redirecting: 'Klasörünüz açılıyor',
    },
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
      error: 'Görev klasörleri yüklenemedi',
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
    upload: {
      title: 'Dosya yükle',
      description: 'Dosya, seçtiğiniz görevin arşivine eklenir.',
      task: {
        label: 'Görev',
        placeholder: 'Görev seçin',
        // BE-121: arşiv görev listesi yalnız dosyası olan görevleri verir.
        hint: 'Yalnız arşivde görünen görevler listelenir; henüz dosyası olmayan bir görev burada yoktur.',
        required: 'Görev seçin.',
        none: 'Dosya yükleyebileceğiniz görev yok. Henüz dosyası olmayan görevler bu listede görünmez.',
      },
      tag: {
        label: 'Etiket',
        placeholder: 'Etiket seçin',
        required: 'Etiket seçin.',
      },
      subtask: {
        label: 'Alt görev (isteğe bağlı)',
        none: 'Alt görev yok',
        loading: 'Alt görevler yükleniyor…',
        unavailable: 'Alt görevler okunamadı; dosya göreve eklenir.',
      },
      file: {
        label: 'Dosya',
        choose: 'Dosya seç',
        change: 'Başka dosya seç',
        drop: 'Dosyayı buraya bırakın ya da seçin.',
        dropActive: 'Bırakın.',
        required: 'Dosya seçin.',
        firstOnly: 'Tek seferde bir dosya yüklenir; ilk dosya alındı.',
        selected: 'Seçilen dosya: {name} ({size})',
      },
      progress: 'Yükleniyor…',
      cancel: 'Vazgeç',
      submit: 'Yükle',
    },
    zip: {
      folder: {
        label: 'Klasörü ZIP olarak indir',
        busy: 'ZIP hazırlanıyor…',
        saved: 'ZIP indirildi. Dosya eksik ya da açılmıyorsa tekrar deneyin.',
        tooLarge: 'Bu klasör tek ZIP için çok büyük; görevlerden tek tek indirin.',
      },
      period: {
        label: 'Dönem arşivi (ZIP)',
        busy: 'ZIP hazırlanıyor…',
        saved: 'ZIP indirildi. Dosya eksik ya da açılmıyorsa tekrar deneyin.',
        tooLarge: 'Dönem arşivi tek ZIP için çok büyük; klasörleri ayrı ayrı indirin.',
        // BE-120: `archiveFullZip` S3 (departman başlığı ister); yönetici /arsiv'te departman seçili değil.
        unavailable:
          "Dönem ZIP'i bu görünümde henüz indirilemiyor; bir klasörü açıp klasör ZIP'ini kullanın.",
      },
      // Akış ortasında kopma: gövde yarım kalmış olabilir (GAP-041).
      partial: 'Bağlantı kesildi; indirme yarım kalmış olabilir. Tekrar deneyin.',
    },
  },
} as const
