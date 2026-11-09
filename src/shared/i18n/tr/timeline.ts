// Zaman çizelgesi modülü (03c; `timeline.*`) metinleri — TEK statik TR ağacı (`trTimeline`),
// `src/shared/i18n/index.ts` `mergeTrees`'e bir kez kayıtlı; çalışma anında ağaca ekleme yok
// (KESİN 24). Her O2b uygulayıcısı yalnız kendi alt dalını ekler (W92 `gantt`, W93 `frame`/`page`,
// W94 `panel`, W95 `snack`, W96 `subtasks`); ikinci kök ağaç ya da dosya açılmaz. Sunucu
// `message` alanı kullanılmaz (hata kodu → `errors.*`); örnek veri yoktur (ortak-kurallar §4).

export const trTimeline = {
  timeline: {
    page: {
      title: 'Zaman çizelgesi',
    },
    // W94 — seçili görev paneli, tarih talebi formu, bağımlılık penceresi (E-03C-42, 54…66).
    panel: {
      label: 'Seçili görev',
      loading: 'Görev bilgileri yükleniyor.',
      loadFailed: 'Görev bilgileri okunamadı.',
      retry: 'Yeniden dene',
      openInList: 'Liste görünümünde aç',
      close: 'Kapat',
      start: 'başlangıç',
      end: 'bitiş',
      datePlaceholder: 'gg.aa.yyyy',
      status: 'Durum',
      overdue: 'Gecikme',
      overdueDays: '{n} gün',
      evidence: 'Kanıt dosyası',
      evidenceCount: '{n} dosya',
      evidenceUnknown: '—',
      statuses: {
        baslanmadi: 'Başlamadı',
        devam_ediyor: 'Devam ediyor',
        onaya_sunuldu: 'Onay bekliyor',
        iade_edildi: 'Geri gönderildi',
        tamamlandi: 'Tamamlandı',
      },
      help: {
        request:
          'Çubuğun uçlarını sürükleyerek de tarih değiştirebilirsin. Değişiklik onaya gider.',
        direct:
          'Çubuğun uçlarını sürükleyerek de tarih değiştirebilirsin. Değişiklik hemen uygulanır.',
      },
      pending: {
        title: 'Bekleyen tarih talebi',
        range: '{start} → {end}',
      },
      actions: {
        save: 'Kaydet',
        requestDate: 'Tarih talebi gönder',
        approve: 'Onayla',
        reject: 'Reddet',
        remind: 'Atanana hatırlat',
        more: 'Diğer işlemler',
        addDependency: 'Bağımlılık ekle',
        removeDependency: 'Bağımlılığı kaldır',
        menu: 'Görev işlemleri',
      },
      errors: {
        dateInvalid: 'Tarihi gg.aa.yyyy biçiminde girin.',
        order: 'Bitiş, başlangıçtan önce olamaz.',
        unchanged: 'Tarihler değişmedi.',
        loading: 'Görev bilgileri yüklenince kaydedebilirsin.',
        pendingExists: 'Bu görevde bekleyen bir tarih talebi zaten var; panel yeniden okundu.',
        alreadyReviewed: 'Talep zaten karara bağlanmış; panel yeniden okundu.',
      },
      done: {
        saved: 'Tarihler kaydedildi.',
        approved: 'Tarih talebi onaylandı.',
        rejected: 'Tarih talebi reddedildi.',
        cascade: '{n} bağımlı görevin tarihi de kaydı.',
        dependencyAdded: 'Bağımlılık eklendi.',
        dependencyRemoved: 'Bağımlılık kaldırıldı.',
      },
      request: {
        title: 'Tarih talebi gönder',
        description: 'Talep yöneticiye iletilir; onaylanınca tarihler değişir.',
        current: 'Geçerli tarihler: {range}',
        start: 'Yeni başlangıç',
        end: 'Yeni bitiş',
        reason: 'Gerekçe',
        reasonHint: 'İsteğe bağlı.',
        submit: 'Gönder',
        cancel: 'Vazgeç',
        sent: 'Tarih talebi gönderildi.',
      },
      dependency: {
        addTitle: 'Bağımlılık ekle',
        addDescription: 'Bu görev, seçtiğin görev bitmeden başlayamaz.',
        predecessor: 'Önce bitmesi gereken görev',
        predecessorPlaceholder: 'Görev seçin',
        noCandidates: 'Seçilebilecek başka görev yok.',
        submit: 'Ekle',
        removeTitle: 'Bağımlılığı kaldır',
        removeDescription: 'Bu görevin önce bitmesi beklenen görevleri.',
        empty: 'Bu görevin ön görevi yok.',
        remove: 'Kaldır',
        removeFor: '{title} bağımlılığını kaldır',
        loadFailed: 'Bağımlılıklar okunamadı.',
        otherScope: 'Başka kapsamdaki görev',
        cancel: 'Kapat',
      },
    },
  },
} as const
