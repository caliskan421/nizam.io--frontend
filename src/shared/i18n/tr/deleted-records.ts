// Silinen kayıtlar modülü (12 Silinen kayıtlar; F5; `deletedRecords.*`) metinleri — TEK statik TR
// ağacı (`trDeletedRecords`), `src/shared/i18n/index.ts` `mergeTrees`'e bir kez kayıtlı (KESİN 24).
// Sunucu `message` alanı kullanılmaz (hata kodu → `errors.*` ya da bu ağaçtaki türe özgü metin);
// örnek işletme verisi yoktur (ortak-kurallar §4). vue-i18n özel karakterleri kullanılmaz.

export const trDeletedRecords = {
  deletedRecords: {
    page: {
      title: 'Silinen kayıtlar',
      // E-12-04 / P37: saklama cümlesi yok; sayı yalnız açık sekmenin yüklenen kümesi.
      sub: {
        idle: 'Yalnız yönetici görür',
        loaded: '{n} {kind} · yalnız yönetici görür',
        partial: '{n}+ {kind} · yüklenen kayıtlar içinde · yalnız yönetici görür',
      },
      // E-12-07 / P37.
      retention: 'Silinen kayıtlar bir yönetici kalıcı olarak silene kadar saklanır.',
      // E-12-40 / P44: işlem geçmişi bağlantısı yok.
      trace:
        'Geri yükleme ve kalıcı silme işlem geçmişine kaydedilir. Kalıcı silinen kayıt geri getirilemez.',
      noAccess: 'Bu sayfayı görüntüleme yetkiniz yok.',
      noAccessHome: 'Ana sayfaya dön',
    },
    // Başlık eylemleri: statik, devre dışı (BE-116, BE-115).
    head: {
      csv: 'CSV indir',
      trash: 'Çöpü boşalt',
      soon: 'Yakında',
      soonHint: 'Bu özellik henüz kullanılamıyor.',
    },
    kinds: {
      label: 'Kayıt türü',
      gorev: 'Görev',
      toplanti: 'Toplantı',
      koordinatorluk: 'Koordinatörlük',
      kullanici: 'Kullanıcı',
      altgorev: 'Alt görev',
      dosya: 'Dosya',
      notgundem: 'Not ve gündem',
      disabledHint: 'Bu tür için silinenler listesi henüz yok.',
    },
    // Alt başlıkta ve boş durumda kullanılan küçük harfli tür adları.
    kindNames: {
      gorev: 'görev',
      toplanti: 'toplantı',
      koordinatorluk: 'koordinatörlük',
      kullanici: 'kullanıcı',
    },
    // Koordinatörlük sekmesi: liste şirket genelidir, ana sayfa sayacı yalnız seçili programa
    // bağlı olanları sayar (BE-119); uyuşmazlık düzeltilmez, açıklanır.
    mismatch: {
      departments:
        'Bu liste şirket genelindeki silinmiş koordinatörlükleri gösterir. Ana sayfadaki Silinen kayıtlar sayısı yalnız seçili programa bağlı olanları sayar; iki sayı farklı olabilir.',
      counter:
        'Sayı; seçili programdaki silinmiş görev ve toplantıları, programa bağlı silinmiş koordinatörlükleri ve şirket genelindeki silinmiş hesapları kapsar. Ekrandaki listelerle farklı olabilir.',
    },
    filters: {
      range: {
        label: 'Silinme tarihi aralığı',
        today: 'Bugün',
        week: 'Son 7 gün',
        all: 'Tümü',
        unsupported: 'Kullanıcı kayıtlarında silinme tarihi yok.',
      },
      actor: {
        label: 'Silen',
        all: 'Tümü',
        unknown: 'Bilinmiyor',
        unsupported: 'Yalnız toplantılarda silen bilgisi var.',
      },
      department: {
        label: 'Koordinatörlük',
        all: 'Tümü',
        unknown: 'Bilinmeyen koordinatörlük',
        unsupported: 'Bu türde koordinatörlük süzgeci yok.',
      },
      search: { label: 'Silinen kayıtlarda ara', placeholder: 'Yüklenen kayıtlarda ara' },
      clear: 'Filtreleri temizle',
      loadingRange: 'Aralık için kayıtlar yükleniyor',
    },
    table: {
      label: 'Silinen kayıtlar',
      columns: {
        kind: 'tür',
        record: 'kayıt',
        deletedAt: 'silinme tarihi',
        actor: 'silen',
        actions: 'işlemler',
      },
      sortHint: 'En yeni üstte; sıralama değiştirilemez.',
      today: 'bugün',
      none: '—',
      unknownActor: 'Bilinmiyor',
    },
    row: {
      restore: 'Geri yükle',
      purge: 'Kalıcı sil',
      purgeOf: '{title} kalıcı sil',
    },
    // Satır alt satırı (E-12-28, P44).
    sub: {
      task: '{department} › Görevler',
      meeting: '{when} · {department}',
    },
    footer: {
      loaded: '{n} kayıt yüklendi',
      loadedMore: '{n} kayıt yüklendi, daha var',
      shown: '{m} kayıt gösteriliyor (yüklenen {n} içinde)',
      more: 'Daha fazla yükle',
      moreBusy: 'Yükleniyor',
    },
    panel: {
      title: 'Seçili kayıt',
      empty: 'Bir kayıt seçin',
      missing: 'Kayıt yüklenen sayfalarda yok.',
      fields: {
        actor: 'Silen',
        deletedAt: 'Silinme',
        status: 'Durumu',
        place: 'Yer',
        invite: 'Davet',
        departments: 'Koordinatörlükler',
        kind: 'Tür',
        code: 'Kod',
      },
      invite: { coordinatorship: 'Koordinatörlük', person: 'Kişiler' },
      together: 'birlikte geri gelecek',
      files: 'Kanıt dosyası',
      // Durum adları (03 sözlüğü; geçmiş zaman biçimi istemci metnidir, E-12-47).
      status: {
        baslanmadi: 'Başlanmamıştı',
        devam_ediyor: 'Devam ediyordu',
        onaya_sunuldu: 'Onaya sunulmuştu',
        iade_edildi: 'İade edilmişti',
        tamamlandi: 'Tamamlanmıştı',
      },
    },
    confirm: {
      restoreTitle: '{title} geri yüklensin mi?',
      restoreBody: 'Bu işlem 1 kaydı geri yükler.',
      restoreConfirm: 'Geri yükle',
      purgeTitle: '{title} kalıcı olarak silinsin mi?',
      purgeBody: 'Bu işlem geri alınamaz.',
      purgeFiles: '{n} dosya da silinir.',
      purgeConfirm: 'Kalıcı sil',
      restoreWarning: {
        gorev: 'Koordinatörlüğü silinmişse görev geri yüklenemez.',
        toplanti: 'Canlı konferans geri gelmez.',
        koordinatorluk: 'Üyelik yetkileri geri döner, koordinatörlüğün görevleri dönmez.',
        kullanici: 'Devredilmiş açık görev atamaları geri dönmez.',
      },
    },
    feedback: {
      restored: '{title} geri yüklendi.',
      purged: '{title} kalıcı olarak silindi.',
      purgedFiles: '{title} kalıcı olarak silindi, {n} dosya da silindi.',
      alreadyRestored: 'Kayıt zaten geri yüklenmiş.',
      notFound: 'Kayıt bulunamadı.',
      alreadyGone: 'Kayıt zaten silinmiş.',
      notDeleted: 'Kayıt silinmiş durumda değil.',
      inUse: 'Kalıcı silinemedi: kayıt başka kayıtlarca kullanılıyor.',
      departmentInUse: 'Kalıcı silinemedi: koordinatörlüğün görevleri veya program katılımı var.',
      purgeIncomplete: 'Silme tamamlanamadı, yeniden deneyin.',
      departmentUnavailable:
        'Bu görevin koordinatörlüğü silinmiş ya da programa bağlı değil. Önce Koordinatörlük sekmesinden geri yükleyin.',
      openDepartments: 'Koordinatörlük sekmesini aç',
      writeClosed: 'Yazma şu anda kapalı.',
      dismiss: 'Kapat',
    },
    states: {
      loading: 'Silinen kayıtlar yükleniyor',
      loadFailed: 'Silinen kayıtlar yüklenemedi',
      empty: 'Silinmiş {kind} yok.',
      filteredEmpty: 'Bu filtrelerle kayıt yok.',
      filteredEmptyMore: 'Yüklenen kayıtlarda yok, daha fazla yükle.',
    },
    home: {
      button: 'Silinen kayıtlar',
    },
  },
} as const
