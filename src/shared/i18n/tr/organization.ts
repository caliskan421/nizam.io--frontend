// Organizasyon ekranlarının (05 Kullanıcılar, 08 Koordinatörlükler) TR metinleri. Her uygulayıcı
// yalnız kendi alt ağacını ekler (WEB-2 O2b); kök anahtarlar çakışmaz.

// Kaynak: `src/modules/organization/components/forms/` (W74; P3 — formlar tasarımda çizilmemiş).
export const trOrgForms = {
  orgForms: {
    common: {
      cancel: 'Vazgeç',
      close: 'Kapat',
      saving: 'Kaydediliyor…',
    },
    kind: {
      koordinatorluk: 'Koordinatörlük',
      calisma_grubu: 'Çalışma grubu',
    },
    role: {
      coordinator: 'Koordinatör',
      member: 'Üye',
    },
    department: {
      createTitle: 'Yeni koordinatörlük',
      createDescription: 'Birim şirket kataloğuna eklenir ve seçili programa bağlanır.',
      editTitle: 'Koordinatörlüğü düzenle',
      field: {
        name: 'Ad',
        kind: 'Tür',
        code: 'Kod',
        codeHint: '2–10 büyük harf ya da rakam (isteğe bağlı).',
        description: 'Açıklama',
        displayName: 'Bu programdaki ad',
        displayNameHint: 'Boş bırakılırsa katalog adı kullanılır.',
      },
      error: {
        name: 'Ad gerekli.',
        code: 'Kod yalnız A–Z ve 0–9 içeren 2–10 karakter olmalı.',
        codeRequired: 'Mevcut kod boşaltılamaz.',
        displayName: 'Programdaki ad 2–120 karakter olmalı.',
      },
      submitCreate: 'Oluştur',
      submitEdit: 'Kaydet',
      created: 'Koordinatörlük oluşturuldu ve programa eklendi.',
      partial:
        'Departman kataloğa eklendi ancak programa bağlanamadı. Programa eklemeyi yeniden deneyin.',
      exists: {
        title: 'Bu adla bir departman zaten var.',
        searching: 'Mevcut departman aranıyor…',
        found: 'Mevcut "{name}" departmanını bu programa ekleyebilirsiniz.',
        linked: '"{name}" bu programda zaten var.',
        deleted: '"{name}" silinmiş bir departman; önce geri yüklenmesi gerekir.',
        notFound: 'Eşleşen departman listede bulunamadı.',
      },
      link: {
        submit: 'Bu programa ekle',
        done: 'Departman bu programa eklendi.',
      },
      edit: {
        loading: 'Kayıt okunuyor…',
        missing: 'Bu koordinatörlük seçili programda bulunamadı.',
        catalogTitle: 'Katalog bilgileri',
        catalogWarning: 'Bu değişiklik tüm sezonlarda geçerlidir.',
        nameDone: 'Programdaki ad güncellendi.',
        catalogDone: 'Katalog bilgileri güncellendi.',
        nameFailed: 'Programdaki ad güncellenemedi.',
        catalogFailed: 'Katalog bilgileri güncellenemedi.',
        noChange: 'Değişiklik yok.',
      },
    },
    picker: {
      placeholder: 'Ad ile arayın',
      loading: 'Aranıyor…',
      failed: 'Kişi listesi okunamadı.',
      retry: 'Yeniden dene',
      empty: 'Eşleşen kişi yok.',
      more: 'Daha fazla yükle',
      truncated: 'Liste eksik olabilir; aramayı daraltın.',
      clear: 'Seçimi kaldır',
      results: 'Kişiler',
      selected: 'Seçili: {name}',
    },
    coordinator: {
      title: 'Koordinatör ata',
      field: 'Kişi',
      submit: 'Ata',
      done: 'Koordinatör atandı.',
      required: 'Bir kişi seçin.',
    },
    member: {
      title: 'Üye ekle',
      field: 'Kişi',
      role: 'Rol',
      submit: 'Ekle',
      done: 'Üye eklendi.',
      required: 'Bir kişi seçin.',
    },
    user: {
      title: 'Kullanıcı oluştur',
      description: 'Hesap açılır ve seçili programdaki birime eklenir.',
      field: {
        email: 'E-posta',
        fullName: 'Ad soyad',
        department: 'Koordinatörlük',
        departmentPlaceholder: 'Koordinatörlük seçin',
        role: 'Rol',
      },
      error: {
        email: 'Geçerli bir e-posta adresi yazın.',
        department: 'Koordinatörlük seçin.',
      },
      noDepartment: 'Seçili programda henüz koordinatörlük yok; önce bir koordinatörlük ekleyin.',
      submit: 'Oluştur',
      done: 'Kullanıcı oluşturuldu. Geçici parolasını belirleyebilirsiniz.',
      exists: 'Bu e-posta ile kayıtlı bir hesap var; liste yenilendi.',
      transfer: {
        title: 'Bu e-posta başka bir hesapta kayıtlı.',
        body: 'Mevcut hesabı bu koordinatörlüğe aktarmak şu an mümkün değil: aktarılacak hesabın kimliği sunucudan gelmiyor.',
        action: 'Mevcut hesabı bu birime ekle',
      },
    },
    password: {
      title: 'Geçici parola belirle',
      description:
        'Kullanıcı ilk girişte parolasını değiştirmek zorunda kalır. Parolayı kullanıcıya siz iletirsiniz.',
      field: 'Geçici parola',
      required: 'Parola gerekli.',
      submit: 'Belirle',
      done: 'Geçici parola belirlendi.',
      doneRevoked: 'Geçici parola belirlendi; {count} oturum kapatıldı.',
    },
  },
} as const
