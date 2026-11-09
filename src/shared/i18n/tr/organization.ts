// Organizasyon modülü ekran metinleri — statik TR ağacı. Her O2b uygulayıcısı yalnız kendi
// ekranının alt ağacını ekler (mevcut satırların yeri değişmez). Erişim yardımcıları kaynak
// bileşen dizinindeki `messages.ts` dosyalarındadır. Sunucu `message` alanı kullanılmaz.

/**
 * Modülün tek ağacı: kök `organization`, her ekran kendi alt ağacında. `users` = 05 · Kullanıcılar
 * (`organization.users.*`; W75, E-05-01…38 + satır dışı hesap eylemleri). Kaynak:
 * `docs/ekranlar/05-kullanicilar/README.md` kabul tablosu ve `Kullanicilar.dc.html`.
 * "Yüklenen kayıtlar içinde" etiketi imleç bitmemişken her sayacın yanında (ortak-kurallar §10).
 */
export const trOrganization = {
  organization: {
    users: {
      title: 'Kullanıcılar',
      summary: {
        complete: '{n} kullanıcı · roller ve koordinatörlük atamaları',
        partial: '{n}+ kullanıcı · yüklenen kayıtlar içinde',
        loading: 'Kullanıcılar yükleniyor…',
      },
      partial: 'yüklenen kayıtlar içinde',
      export: 'Dışa aktar',
      create: 'Kullanıcı oluştur',
      tabs: {
        label: 'Rol',
        tumu: 'Tümü',
        admin: 'Admin',
        koordinator: 'Koordinatör',
        uye: 'Üye',
      },
      search: {
        label: 'Kullanıcı ara',
        placeholder: 'Ad…',
      },
      department: {
        label: 'Koordinatörlük',
        menu: 'Koordinatörlük süzgeci',
        all: 'Tüm koordinatörlükler',
        noProgram: 'Program seçilmedi',
        truncated: 'Koordinatörlük listesi sınıra ulaşmış olabilir.',
      },
      table: {
        label: 'Kullanıcılar',
        user: 'kullanıcı',
        roles: 'roller',
        coordinatorship: 'koordinatörlük',
        detail: 'Ayrıntı',
        sortAsc: 'kullanıcı ↑',
        sortDesc: 'kullanıcı ↓',
        sortHint: 'Ada göre sırala',
        unassigned: 'Atanmamış',
        open: '{name} ayrıntısını aç',
        profile: 'Profil ve kişisel iş takibi',
        loading: 'Kullanıcılar yükleniyor',
        error: 'Kullanıcılar yüklenemedi.',
        truncated: 'Liste eksik olabilir: sunucu sonucu sınırladı.',
        noTeam: 'Ekibi olmayan hesaplar listelenmez.',
      },
      pager: {
        complete: '{n} kullanıcı',
        partial: '{n} kullanıcı yüklendi',
        more: 'Daha fazla yükle',
        loadingMore: 'Yükleniyor…',
      },
      empty: {
        title: 'Kullanıcı yok',
        text: 'Ekibi olan kullanıcı bulunamadı.',
        filteredTitle: 'Sonuç yok',
        filteredText: 'Süzgeçlere uyan kullanıcı yok.',
        clear: 'Süzgeçleri temizle',
      },
      deepLink: {
        missing: 'Seçili kullanıcı yüklenen listede yok; panel açılmadı.',
      },
      roles: {
        coordinator: 'Koordinatör',
        member: 'Üye',
      },
      panel: {
        label: 'Seçili kullanıcı',
        close: 'Paneli kapat',
        noTeam: 'Bu programda ekibi yok',
        missing: 'Kullanıcı bilgisi yüklenen listede bulunamadı.',
        summary: {
          label: 'Görev özeti',
          open: 'açık',
          overdue: 'geciken',
          approval: 'onayda',
          partial: 'yüklenen kayıtlar içinde',
        },
        profile: 'Profil ve kişisel iş takibi',
        rolesTitle: 'roller',
        rolesNote: 'Koordinatör ve Üye, koordinatörlük çiplerinden türetilir.',
        role: {
          admin: 'Admin',
          adminDesc: 'Tüm koordinatörlükleri, kullanıcıları ve sezonu yönetir.',
          adminUnknown: 'Mevcut değer okunamıyor.',
          coordinator: 'Koordinatör',
          coordinatorDesc: 'Koordinatörlüğünde görev atar, dosyaları onaylar.',
          member: 'Üye',
          memberDesc: 'Atanan görevleri yürütür, kanıt dosyası yükler.',
        },
        chips: {
          title: 'koordinatörlük',
          remove: '{name} atamasını kaldır',
          roleMenu: '{name} rolü',
          add: 'Ekle',
          addTitle: 'Koordinatörlük ekle',
          department: 'Koordinatörlük',
          departmentPlaceholder: 'Koordinatörlük seçin',
          roleLabel: 'Rol',
          submit: 'Ekle',
          cancel: 'Vazgeç',
          none: 'Bu programa eklenebilecek koordinatörlük yok.',
          goCoordinatorships: 'Koordinatörlük ekle',
          added: 'Koordinatörlüğe eklendi.',
          roleChanged: 'Rol güncellendi.',
          removed: 'Koordinatörlükten çıkarıldı.',
          noProgram: 'Program seçilmedi.',
        },
        impact: {
          roleTitle: 'Rolü değiştir',
          roleBody: 'Bu değişiklik aşağıdaki görevlerin atamalarını etkiler.',
          roleConfirm: 'Rolü değiştir',
          removeTitle: 'Koordinatörlükten çıkar',
          removeBody: 'Kişinin aşağıdaki görevlerdeki ataması size devredilir.',
          removeConfirm: 'Çıkar',
        },
        account: {
          resetLink: 'Şifre sıfırlama bağlantısı',
          lock: 'Hesabı kilitle',
          temporaryPassword: 'Geçici parola belirle',
          unlock: 'Giriş kilidini kaldır',
          unlocked: 'Giriş kilidi kaldırıldı.',
          delete: 'Kullanıcıyı sil',
          deleteTitle: 'Kullanıcıyı sil',
          deleteBody: '{name} silinecek. Açık görevleri size devredilir.',
          deleteConfirm: 'Sil',
          deleted: 'Kullanıcı silindi.',
        },
      },
    },
  },
} as const
