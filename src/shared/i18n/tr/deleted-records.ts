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
    filters: {
      range: {
        label: 'Silinme tarihi aralığı',
        today: 'Bugün',
        week: 'Son 7 gün',
        all: 'Tümü',
      },
      actor: {
        label: 'Silen',
        all: 'Tümü',
        unnamed: 'Adı bilinmiyor',
      },
      department: {
        label: 'Koordinatörlük',
        all: 'Tümü',
        unknown: 'Bilinmeyen koordinatörlük',
        unsupported: 'Bu türde koordinatörlük süzgeci yok.',
      },
      search: { label: 'Silinen kayıtlarda ara', placeholder: 'Kayıt ara' },
      clear: 'Filtreleri temizle',
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
      sortHint: 'Sıralamak için tıklayın.',
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
      taskByDepartment: '{department} › Görevler · koordinatörlükle birlikte silindi',
      meeting: '{when} · {department}',
    },
    footer: {
      loaded: '{n} kayıt',
      of: '{m} / {n} kayıt gösteriliyor',
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
        assignees: 'Atananlar',
        place: 'Yer',
        invite: 'Davet',
        departments: 'Koordinatörlükler',
        kind: 'Tür',
        code: 'Kod',
        admin: 'Yetki',
      },
      adminValue: 'Şirket yöneticisi',
      invite: { coordinatorship: 'Koordinatörlük', person: 'Kişiler' },
      together: 'birlikte geri gelecek',
      subtasks: 'Alt görev',
      files: 'Kanıt dosyası',
      notes: 'Yorum',
      dateRequest: 'Tarih talebi',
      unknownAssignee: 'Bilinmeyen kişi',
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
      ownAccount: 'Kendi hesabınız kalıcı silinemez.',
      conflictRetry: 'Kayıt başka bir işlemle çakıştı, yeniden deneyin.',
      dismiss: 'Kapat',
    },
    // Toplu işlem çubuğu ve sonuç özeti (E-12-21/22/23; BE-114).
    bulk: {
      label: 'Seçili kayıtlar',
      selected: '{n} kayıt seçildi',
      restore: 'Geri yükle',
      purge: 'Kalıcı sil',
      clear: 'Seçimi kaldır',
      selectAll: 'Tümünü seç',
      selectRow: '{title} seç',
    },
    batch: {
      restoreTitle: '{n} {kind} geri yüklensin mi?',
      restoreBody: 'Bu işlem seçili {n} kaydı geri yükler.',
      purgeTitle: '{n} {kind} kalıcı olarak silinsin mi?',
      purgeBody: 'Bu işlem geri alınamaz.',
      purgeFiles: 'Görevlerin dosyaları da silinir.',
      chunked: 'Kayıtlar 100’erli gruplar hâlinde işlenir.',
      restored: '{n} kayıt geri yüklendi.',
      purged: '{n} kayıt kalıcı olarak silindi.',
      partial: '{ok} kayıt işlendi, {bad} kayıt işlenemedi.',
      nothing: 'Hiçbir kayıt işlenemedi ({bad} kayıt).',
      interrupted:
        'İşlem yarıda kaldı: {n} kayıt işlendi, kalanının durumu bilinmiyor. Liste yenilendi.',
      generic: 'Bu kayıt işlenemedi.',
      dismiss: 'Kapat',
    },
    // Çöpü boşalt (E-12-06; BE-115): tür adı yazılarak onay, ardından ilerleme/sonuç.
    purgeAll: {
      title: '{n} {kind} kalıcı olarak silinecek',
      titleUnknown: 'Tüm silinmiş {kind} kayıtları kalıcı olarak silinecek',
      scope: {
        gorev:
          'Seçili programdaki bütün silinmiş görevler silinir; ekrandaki süzgeçler dikkate alınmaz.',
        toplanti:
          'Seçili programdaki bütün silinmiş toplantılar silinir; ekrandaki süzgeçler dikkate alınmaz.',
        kullanici:
          'Şirket genelindeki bütün silinmiş hesaplar silinir; ekrandaki süzgeçler dikkate alınmaz. Başka kayıtlarca kullanılan hesaplar silinmez.',
      },
      irreversible: 'Bu işlem geri alınamaz.',
      typeLabel: 'Onaylamak için "{kind}" yazın',
      typePlaceholder: '{kind}',
      confirm: 'Çöpü boşalt',
      cancel: 'Vazgeç',
      confirmTitle: 'Silinmiş {kind} kayıtları kalıcı olarak silinsin mi?',
      confirmBody: 'Bu işlem geri alınamaz. Kayıtlar 50’şerli gruplar hâlinde silinir.',
      running: '{n} kayıt silindi, silme sürüyor',
      runningLeft: '{n} kayıt silindi, {left} kayıt kaldı',
      stop: 'Durdur',
      done: 'Çöp boşaltıldı: {n} kayıt kalıcı olarak silindi.',
      left: '{n} kayıt silindi, {left} kayıt silinemedi.',
      cancelled: 'Durduruldu: {n} kayıt silindi, kalanına dokunulmadı.',
      interrupted:
        'İşlem yarıda kaldı: {n} kayıt silindi, kalanının durumu bilinmiyor. Liste yenilendi.',
      group: '{n} kayıt',
      unsupported:
        'Koordinatörlük türünde çöp boşaltılamaz: uç şirket geneli çalışır ve programa bağlı kayıtları silemez.',
    },
    states: {
      loading: 'Silinen kayıtlar yükleniyor',
      loadFailed: 'Silinen kayıtlar yüklenemedi',
      empty: 'Silinmiş {kind} yok.',
      filteredEmpty: 'Bu filtrelerle kayıt yok.',
    },
    home: {
      button: 'Silinen kayıtlar',
      // Sayı özetin dört terimli toplamıdır (`reportDeletedSummary.total` = pano `deleted_records`);
      // ekrandaki süzgeçli liste sayıları farklı olabilir.
      counterHint:
        'Seçili programdaki silinmiş görev ve toplantıları, programa bağlı silinmiş koordinatörlükleri ve şirket genelindeki silinmiş hesapları sayar; süzgeçli listelerdeki sayılardan farklı olabilir.',
    },
  },
} as const
