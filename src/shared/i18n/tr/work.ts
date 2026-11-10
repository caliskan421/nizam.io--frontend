// Görev modülü (`work.*`, `workForms.*` ve ekran/bileşen metinleri) metinleri — statik i18n ağacında (`src/shared/i18n/index.ts`); çalışma anında ağaca
// ekleme yok. Erişim yardımcıları kaynak modülün `messages.ts` dosyasındadır.

// Kaynak: `src/modules/work/model/`.
export const trWork = {
  work: {
    create: {
      // ortak-kurallar §7, CX-S-03: ilk yanıtın gerçek durumu söylenir; ilk atanan korunur.
      partial: 'Görev oluşturuldu, ek atama yapılamadı.',
    },
  },
} as const

/**
 * Görev listesi sayfa metinleri (`tasksPage.*`; 03 `ozellikler.md` §2.2–2.5, §2.8). Sunucu
 * metni kullanılmaz.
 * "Yüklenen kayıtlar içinde" etiketi imleç bitmemişken her sayacın yanında (ortak-kurallar §10).
 */
export const trTasksPage = {
  tasksPage: {
    title: 'Görevler',
    summary: {
      tasks: '{n} görev',
      tasksPartial: '{n}+ görev',
      departments: '{n} koordinatörlük',
      people: '{n} kişi',
      peoplePartial: '{n}+ kişi',
    },
    partial: 'yüklenen kayıtlar içinde',
    view: {
      label: 'Görünüm',
      list: 'Liste',
      timeline: 'Zaman çizelgesi',
    },
    create: 'Yeni görev',
    tabs: {
      label: 'Kayıtlı görünümler',
      tumu: 'Tümü',
      baslanmadi: 'Başlamadı',
      devam_ediyor: 'Devam ediyor',
      geciken: 'Geciken',
      onaya_sunuldu: 'Onay bekleyen',
      iade_edildi: 'Geri gönderildi',
      tamamlandi: 'Tamamlanan',
    },
    requests: {
      filterLabel: 'Tarih talebi filtresi',
      filter: 'Tarih talebi',
      band: 'Bekleyen tarih değişikliği talepleri',
      bandTitle: '{n} tarih değişikliği talebi onay bekliyor',
      review: 'Talepleri incele',
    },
    search: {
      label: 'Görev ara',
      placeholder: 'Başlık, kimlik veya kişi…',
    },
    person: {
      label: 'Kişi',
      stub: 'Kişi süzgeci henüz kullanılamıyor',
    },
    department: {
      label: 'Koordinatörlük',
      menu: 'Koordinatörlük seç',
      all: 'Tüm koordinatörlükler',
    },
    pager: {
      complete: '{n} görev',
      partial: '{n} görev yüklendi · daha fazlası var',
      loadedOfTotal: '{n} / {total} görev yüklendi',
      more: 'Daha fazla yükle',
      loadingMore: 'Yükleniyor…',
    },
    empty: {
      title: 'Bu kapsamda görev yok',
      text: 'Seçili program ve koordinatörlükte henüz görev tanımlanmamış.',
      filteredTitle: 'Süzgeçlerle eşleşen görev yok',
      filteredText: 'Arama ya da süzgeçleri değiştirip yeniden deneyin.',
      clear: 'Süzgeçleri temizle',
    },
    error: 'Görevler yüklenemedi',
  },
} as const

/**
 * Görev tablosu metinleri (`taskList.*`; 03 `ozellikler.md` §2.6–2.7). Sunucu metni
 * kullanılmaz.
 */
export const trTaskList = {
  taskList: {
    table: 'Görevler',
    column: { gorev: 'görev', durum: 'durum', bitis: 'bitiş', kisi: 'kişi' },
    sortHint: '{column} sütununa göre sırala',
    status: {
      baslanmadi: 'Başlamadı',
      devam_ediyor: 'Devam ediyor',
      onaya_sunuldu: 'Onay bekliyor',
      iade_edildi: 'Geri gönderildi',
      tamamlandi: 'Tamamlandı',
    },
    overdue: '{n} gün gecikti',
    remaining: '{n} gün kaldı',
    request: 'Talep · {day}',
    requestTitle: 'Bitiş {from} → {to} talep edildi',
    unknownPerson: 'Bilinmeyen kişi',
    morePeople: '+{n}',
    morePeopleLabel: '{n} kişi daha: {names}',
    subtasks: 'Alt görevler',
    subtasksNone: '+ alt',
    loading: 'Görevler yükleniyor',
  },
} as const

/**
 * Ayrıntı paneli metinleri (`workDetail.*`; 03 `ozellikler.md` E-03-41…56). Sunucu `message`
 * alanı kullanılmaz (hata metni kod → `errors.*`).
 */
export const trWorkDetail = {
  workDetail: {
    panel: 'Görev ayrıntısı',
    loading: 'Görev yükleniyor',
    close: 'Paneli kapat',
    // useWorkItemTarget null (Admin merceği, görev yüklenen listede yok): istek atılmaz.
    scopeUnknown: 'Görevin kapsamı bilinmiyor; görevi listeden açın.',
    tabs: {
      label: 'Görev ayrıntısı sekmeleri',
      summary: 'Özet',
      subtasks: 'Alt görevler',
      files: 'Dosyalar',
      notes: 'Notlar',
    },
    summary: {
      assignee: 'Atanan',
      creator: 'Oluşturan',
      created: 'Tanımlandı',
      range: 'Tarih aralığı',
      evidence: 'Kanıt dosyası',
      evidenceNone: 'Yok',
      // E-03-50: Arşiv (06/07) F5; bağlantı devre dışı + faz notu (P2, §5).
      archiveLater: 'Arşivde bu görevin klasörü F5’te açılacak',
      unknownPerson: 'Bilinmeyen kişi',
      none: '—',
    },
    timeline: {
      title: 'ilerleme',
      created: 'Görev tanımlandı',
      start: 'Planlanan başlangıç',
      endPassed: 'Plan bitişi geçti',
      overdue: '{n} gündür gecikmede',
      completed: 'Görev tamamlandı',
      today: 'bugün',
      // E-03-51, BE-007: etkinlik geçmişi (audit) yok — nötr yer tutucu, sahte akış yok (§4).
      activity: 'Etkinlik geçmişi henüz gösterilemiyor.',
    },
    status: {
      readonly: 'salt okunur',
      label: 'Durum',
      baslanmadi: 'Başlamadı',
      devam_ediyor: 'Devam ediyor',
      onaya_sunuldu: 'Onay bekliyor',
      iade_edildi: 'Geri gönderildi',
      tamamlandi: 'Tamamlandı',
    },
    actions: {
      label: 'Görev eylemleri',
      upload: 'Kanıt dosyası yükle',
      remind: 'Atanana hatırlat',
      // E-03-54: uç var, akış F3 (P5, §5) — faz notu, stub değil.
      dateRequest: 'Tarih değişikliği iste',
      copy: 'Kopyala',
      copied: 'Görev bağlantısı panoya kopyalandı.',
      copyFailed: 'Görev bağlantısı kopyalanamadı.',
    },
  },
} as const

// Kaynak: `src/modules/work/components/forms/`.
export const trWorkForms = {
  workForms: {
    status: {
      baslanmadi: 'Başlamadı',
      devam_ediyor: 'Devam ediyor',
      onaya_sunuldu: 'Onay bekliyor',
      iade_edildi: 'Geri gönderildi',
      tamamlandi: 'Tamamlandı',
    },
    priority: {
      dusuk: 'Düşük',
      orta: 'Orta',
      yuksek: 'Yüksek',
      acil: 'Acil',
    },
    create: {
      title: 'Yeni görev',
      submit: 'Oluştur',
      cancel: 'Vazgeç',
      done: 'Görev oluşturuldu.',
      field: {
        title: 'Başlık',
        department: 'Koordinatörlük',
        departmentPlaceholder: 'Koordinatörlük seçin',
        assignee: 'Atanan',
        assigneeNone: 'Atanmasın',
        extra: 'Ek atananlar',
        extraHint: 'Görev oluşturulduktan sonra ayrıca atanır.',
        startOn: 'Başlangıç',
        endOn: 'Bitiş',
        priority: 'Öncelik',
        description: 'Açıklama',
        evidence: 'Tamamlamak için kanıt dosyası gerekli',
      },
      members: {
        loading: 'Kişiler yükleniyor…',
        failed: 'Kişi listesi okunamadı.',
      },
      error: {
        title: 'Başlık gerekli.',
        department: 'Koordinatörlük seçin.',
        date: 'Tarih seçin.',
        range: 'Bitiş, başlangıçtan önce olamaz.',
      },
      noDepartment: 'Görev açabileceğiniz bir koordinatörlük yok.',
    },
    transition: {
      menu: 'Durumu değiştir',
      current: 'Durum: {status}',
      evidence: 'Önce kanıt dosyası yükleyin.',
      subtasks: {
        title: 'Açık alt görevler kapatılsın mı?',
        body: 'Görev tamamlanırken açık alt görevler de sizin adınıza kapatılır.',
        confirm: 'Kapat ve tamamla',
      },
      reason: {
        title: 'Tamamlanmış görevi geri al',
        description: 'Görev yeniden "Devam ediyor" durumuna döner.',
        label: 'Gerekçe',
        error: 'En az 3 karakterlik bir gerekçe yazın.',
        submit: 'Geri al',
      },
    },
    remove: {
      action: 'Görevi sil',
      title: 'Görev silinsin mi?',
      body: '"{title}" görevi listeden kaldırılır.',
      confirm: 'Sil',
      done: 'Görev silindi.',
    },
  },
} as const

// Kaynak: `src/modules/work/components/subtasks/`.
export const trSubtasks = {
  subtasks: {
    kicker: 'alt görevler',
    head: 'alt görevler · {done}/{total}',
    caption: 'Kişi ve tarih isteğe bağlıdır.',
    rowsLabel: '{title} alt görevleri',
    progress: 'Tamamlanan alt görevler',
    loading: 'Alt görevler yükleniyor…',
    empty: 'Henüz alt görev yok.',
    add: {
      placeholder: 'Alt görev ekle ve Enter’a bas',
      label: '{title} için alt görev ekle',
      submit: 'Ekle',
    },
    row: {
      done: '{title} tamamlandı',
      open: 'Görev detayında aç',
      menu: '{title} seçenekleri',
      titleInput: 'Alt görev başlığı',
      person: 'Kişi',
      personNone: 'Kişi yok',
      unknownPerson: 'Bilinmeyen kişi',
      dateNone: 'Tarih yok',
    },
    date: {
      label: 'Alt görev tarihleri',
      start: 'başlangıç',
      end: 'bitiş',
      clear: 'Tarihi kaldır',
      ok: 'Tamam',
      pair: 'Başlangıç ve bitiş birlikte girilir.',
      order: 'Bitiş, başlangıçtan önce olamaz.',
    },
    menu: {
      required: 'zorunlu alanlar',
      person: 'Kişi ataması',
      dates: 'Tarih aralığı',
      evidence: 'Kanıt dosyası (arşiv)',
      rename: 'Başlığı düzenle',
      remove: 'Alt görevi sil',
    },
    confirm: {
      title: 'Alt görev silinsin mi?',
      body: '“{title}” kalıcı olarak silinir; bağlı dosyalar görevde kalır.',
      ok: 'Sil',
    },
    field: {
      title: 'Başlık',
      assignee: 'Kişi',
      start: 'Başlangıç',
      end: 'Bitiş',
    },
  },
} as const

// Kaynak: `src/modules/work/components/notes/`.
export const trNotes = {
  work: {
    notes: {
      list: 'Notlar',
      loading: 'Notlar yükleniyor…',
      empty: 'Henüz not yok',
      emptyWriter: 'Göreve ilk notu siz ekleyin.',
      composer: 'Not yaz',
      placeholder: 'Göreve not yaz…',
      add: 'Not ekle',
      editor: 'Notu düzenle',
      save: 'Kaydet',
      cancel: 'Vazgeç',
      edit: 'Düzenle',
      remove: 'Sil',
      edited: 'düzenlendi',
      unknownAuthor: 'Adı bilinmeyen kişi',
      field: 'Not',
      confirmTitle: 'Not silinsin mi?',
      confirmBody: 'Not bu görevden kaldırılır.',
      confirmAccept: 'Notu sil',
    },
  },
} as const

// Kaynak: `src/modules/work/components/files/`.
export const trWorkFiles = {
  workFiles: {
    tag: {
      ister: 'İster',
      plan: 'Plan',
      girdi: 'Girdi',
      analiz: 'Analiz',
      cikti: 'Çıktı',
      sonuc: 'Sonuç',
    },
    size: { b: '{n} B', kb: '{n} KB', mb: '{n} MB', gb: '{n} GB' },
    unknownPerson: 'Bilinmeyen kişi',
    subtaskLinked: 'alt göreve bağlı',
    upload: {
      task: 'Kanıt dosyası yükle',
      subtask: 'Alt görev kanıtı yükle',
      description: 'Yükleme görevin durumunu değiştirmez.',
      file: 'Dosya',
      fileRequired: 'Dosya seçin.',
      tag: 'Etiket',
      tagPlaceholder: 'Etiket seçin',
      tagRequired: 'Etiket seçin.',
      submit: 'Yükle',
      cancel: 'Vazgeç',
    },
    tab: {
      upload: 'Dosya yükle',
      loading: 'Dosyalar yükleniyor…',
      empty: 'Henüz dosya yok',
      emptyText: 'Göreve yüklenen dosyalar burada listelenir.',
      evidence: 'Kanıt dosyası',
      evidenceRequired: 'gerekli',
      none: 'Yok',
      archive: 'Arşivde aç',
      archivePhase: "Arşiv bağlantısı F5'te açılacak.",
    },
    row: {
      download: 'İndir',
      downloadOf: '{name} dosyasını indir',
      rename: 'Adını değiştir',
      renameOf: '{name} dosyasının adını değiştir',
      remove: 'Dosyayı sil',
      removeOf: '{name} dosyasını sil',
      name: 'Dosya adı',
      nameRequired: 'Dosya adı boş olamaz.',
      save: 'Kaydet',
      cancel: 'Vazgeç',
      downloadInvalid: 'İndirme bağlantısı açılamadı.',
    },
    remove: {
      title: 'Dosya silinsin mi?',
      body: 'Dosya kalıcı olarak silinir; bu işlem geri alınamaz.',
      confirm: 'Sil',
    },
    slot: {
      upload: 'Kanıt yükle',
      none: 'Kanıt yok',
      more: '{name} +{n}',
      loading: 'Kanıt',
    },
  },
} as const
