// Organizasyon ekranları metinleri — statik TR ağacı. Her O2b uygulayıcısı yalnız kendi alt
// ağacını ekler (W72: `coordinatorships.*`). Sunucu `message` alanı kullanılmaz; kişi adı, sayı ve
// tarih yalnız gerçek veriden gelir (ortak-kurallar §4). `{…}` yer tutucuları vue-i18n biçimindedir.

/**
 * 08 Koordinatörlükler liste (`coordinatorships.*`; 08 `ozellikler.md` §2.1–§2.7, README kabul
 * tablosu E-08-01…45). Tasarımdaki "Dosya yüklenmemiş" / "Henüz dosya yüklenmedi" metinleri
 * yazılmaz: `last_activity_at` görev hareketidir (E-08-11, E-08-37).
 */
export const trCoordinatorships = {
  coordinatorships: {
    head: {
      title: 'Koordinatörlükler',
      count: '{n} koordinatörlük',
      countTruncated: '{n} koordinatörlük (sınıra ulaşmış olabilir)',
      people: '{n} kişi',
      peopleHint: 'Program ekibi ve şirket yöneticileri dahil',
      season: '{year} sezonu',
      editStructure: 'Yapıyı düzenle',
      create: 'Yeni koordinatörlük',
      more: 'Diğer işlemler',
      copySeason: 'Sezona kopyala',
      copySeasonNote: 'Yapı kopyası henüz yok; görev aktarımı Teknofest ve sezon ekranında.',
    },
    health: {
      region: 'Yapı sağlığı',
      noLead: 'koordinatörsüz birim',
      noMembers: 'üyesi olmayan',
      noMembersNote: 'Üye rolünde kimse yok',
      noTasks: 'bu sezon görevsiz',
      quiet: '30+ gündür sessiz',
      quietNote: 'Görev hareketi yok ya da 30 günden eski',
      error: 'Yapı sağlığı yüklenemedi',
    },
    toolbar: {
      view: 'Görünüm',
      list: 'Liste',
      tree: 'Yapı',
      search: 'Koordinatörlük, kod veya koordinatör ara',
      searchPlaceholder: 'Koordinatörlük, kod veya koordinatör ara…',
      sort: 'Sırala: Ada göre',
      sortMenu: 'Sıralama',
      asc: 'Ada göre (A → Z)',
      desc: 'Ada göre (Z → A)',
    },
    card: {
      grid: 'Koordinatörlük kartları',
      actions: '{name} işlemleri',
      assign: 'Koordinatör ata',
      leadMore: '{name} +{n}',
      members: 'üye',
      tasks: 'görev',
      archive: 'arşiv',
      archivePhase: 'Arşiv F5’te açılacak',
      membersLink: '{name} üyeleri: {n}',
      tasksLink: '{name} görevleri: {n}',
      noLead: 'Koordinatör atanmamış',
      active: 'Son görev hareketi {when}',
      quiet: 'Sessiz · son görev hareketi {when}',
      never: 'Sessiz · görev hareketi yok',
      noStats: 'Sayılar alınamadı',
      today: 'bugün',
      yesterday: 'dün',
      daysAgo: '{n} gün önce',
      open: 'Sayfasını aç',
      settings: 'Ayarları düzenle',
      createTask: 'Görev ata',
      parent: 'Üst birimi değiştir',
      deactivate: 'Pasifleştir',
    },
    empty: {
      filteredTitle: 'Bu filtrelerle eşleşen koordinatörlük yok.',
      clear: 'Süzgeçleri temizle',
      noneTitle: 'Programa departman katılmamış',
      noneText:
        'Bu programa henüz koordinatörlük bağlanmadı. Yeni koordinatörlük oluştur; aynı adla bir departman zaten varsa form mevcut departmanı bu programa eklemeyi önerir.',
    },
    footer: {
      hint: 'Karttaki sayılara tıklayarak birimin üyelerine, görevlerine veya arşivine geç',
      count: '{shown} / {total} koordinatörlük gösteriliyor',
    },
    loading: 'Koordinatörlükler yükleniyor',
    error: 'Koordinatörlükler yüklenemedi',
  },
} as const
