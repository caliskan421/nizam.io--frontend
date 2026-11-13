// Ana sayfa (`home.*`) metinleri — statik i18n ağacında (`src/shared/i18n/index.ts`); çalışma anında ağaca
// ekleme yok. Erişim yardımcıları kaynak modülün `messages.ts` dosyasındadır.

/**
 * Ana sayfa metinleri (`home.*`; 01 `ozellikler.md` §4). Sunucu metni kullanılmaz; kişi adı,
 * sayı ve tarih yalnız gerçek veriden gelir (ortak-kurallar §4). `{…}` yer
 * tutucuları vue-i18n biçimindedir.
 */
export const trHome = {
  home: {
    greeting: 'Merhaba {name}',
    kpi: {
      region: 'Görev özeti',
      completion: 'Tamamlanma',
      open: 'Açık görev',
      overdue: 'Gecikmede',
      pending: 'Onay bekleyen',
      completionValue: '%{p}',
      completionNote: '{total} görevin {done}{suffix} bitti',
      openNote: '{n} tanesi zamanında ilerliyor',
      overdueNote: 'Açık görevlerin %{q}{suffix}',
      noTasks: 'Henüz görev yok',
      noOpen: 'Açık görev yok',
      partial: 'Sayılar yüklenen kayıtlar içinde',
      error: 'Görev özeti yüklenemedi',
      selectTitle: 'Kapsam seçin',
      selectText: 'Görev özeti için kenar menüsünden koordinatörlük seçin.',
    },
    quick: {
      title: 'Hızlı işlemler',
      newTask: 'Yeni görev',
      meeting: 'Toplantı oluştur',
      invite: 'Kullanıcı davet et',
      phase: { F2: 'F2’de', F4: 'F4’te' },
      disabled: '{label} — {phase} açılacak',
    },
    recent: {
      title: 'Son işlemler',
      all: 'Tümü',
      allDisabled: 'İşlem geçmişi bu sürümde yok',
      empty: 'Henüz işlem geçmişi yok',
    },
    // "Rapor oluştur" yönlendirme menüsü (E-01-12; P47): yalnız gezinme, ağ isteği yok.
    report: {
      tile: 'Rapor oluştur',
      menu: 'Rapor türü',
      season: 'Dönem sonu raporu (PDF)',
      seasonWhere: 'Arşiv',
      workload: 'İş yükü raporu (PDF)',
      workloadWhere: 'Kullanıcılar',
      meeting: 'Toplantı raporu',
      meetingWhere: 'toplantıyı seç',
      task: 'Görev raporu',
      taskWhere: 'görevi seç',
    },
    // Ekip şeridi (E-01-19/20) ve alt bilgi (E-01-39).
    team: {
      title: 'ekip',
      users: 'kullanıcı · {n} koordinatörlük',
      hint: 'Yöneticiler şirket geneli, diğerleri bu program için sayılır.',
      roles: 'Roller',
      admin: 'Admin',
      coordinator: 'Koordinatör',
      member: 'Üye',
      roleLink: '{label}: {n} kullanıcıyı gör',
      error: 'Ekip özeti yüklenemedi',
    },
    footer: {
      line: '{coordinatorships} koordinatörlük · {users} kullanıcı ({admins} admin, {coordinators} koordinatör, {members} üye)',
    },
    // Koordinatörlükler (E-01-21…38).
    coords: {
      title: 'Koordinatörlükler',
      hint: '{sort} · {n} koordinatörlük',
      all: 'Tümünü gör',
      search: 'Koordinatörlük ara',
      statusFilter: 'Durum filtresi',
      filter: {
        all: 'Tümü',
        late: 'Gecikmesi olan',
        on_track: 'Yolunda',
        no_coordinator: 'Koordinatörsüz',
      },
      sortButton: 'Sırala: {label}',
      sortMenu: 'Sıralama',
      flip: 'Sırayı ters çevir',
      sortDown: '↓',
      sortUp: '↑',
      sort: {
        late: { label: 'Gecikme', hint: 'En çok gecikmesi olandan aza' },
        open: { label: 'Açık iş', hint: 'En çok açık işi olandan aza' },
        completion: { label: 'Tamamlanma', hint: 'Tamamlanma oranı en düşükten yükseğe' },
        members: { label: 'Kullanıcı sayısı', hint: 'En kalabalıktan en küçüğe' },
        last_upload: { label: 'Son yükleme', hint: 'En son dosya yükleneden eskiye' },
        name: { label: 'Ad', hint: 'A’dan Z’ye' },
      },
      lastUploadOff: 'Son yükleme bu sürümde yok',
      empty: 'Bu filtreyle eşleşen koordinatörlük yok.',
      none: 'Programa departman katılmamış',
      error: 'Koordinatörlükler yüklenemedi',
      card: {
        noLead: 'Koordinatör atanmamış',
        tasks: 'görev',
        done: '%{p} bitti',
        statusLine: '{todo} başlamadı · {doing} devam · {review} onayda/iade · {done} bitti',
        late: 'geciken',
        users: 'kullanıcı',
        archive: 'arşiv',
        moreMembers: '+{n} üye',
        lateLink: '{name}: geciken görevler',
        usersLink: '{name}: kişiler',
        archiveLink: '{name}: arşiv dosyaları',
      },
    },
  },
} as const
