// Kabuk (kenar menüsü `side.*`, üst çubuk `topbar.*`) metinleri — statik i18n ağacında (`src/shared/i18n/index.ts`); çalışma anında ağaca
// ekleme yok. Erişim yardımcıları kaynak modülün `messages.ts` dosyasındadır.

/**
 * Kenar menüsü metinleri (`side.*`; 00-ortak `ozellikler.md` §4 etiket sözlüğü). Sunucu metni
 * kullanılmaz. `{…}` yer tutucuları
 * vue-i18n biçimindedir.
 */
export const trSide = {
  side: {
    // P9: ürün adı sabittir; `instanceProfile.display_name` kullanılmaz.
    brand: 'RoketPortal',
    collapse: 'Menüyü daralt',
    expand: 'Menüyü genişlet',
    mainMenu: 'Ana menü',
    closeMenu: 'Menüyü kapat',
    card: {
      program: 'Program',
      lens: 'Rol',
      department: 'Koordinatörlük',
      programName: 'Program: {name}',
      lensName: 'Rol: {name}',
      departmentName: 'Koordinatörlük: {name}',
      choose: 'Seçin',
    },
    menu: {
      program: 'Program seç',
      lens: 'Rol seç',
      department: 'Koordinatörlük seç',
      season: '{year} sezonu',
      truncated: 'Liste kısaltıldı',
      coordinatorHead: 'Koordinatör olduğun birimler',
      memberHead: 'Üye olduğun birimler',
    },
    lens: { admin: 'Admin', coordinator: 'Koordinatör', member: 'Üye' },
    group: { takip: 'Takip', icerik: 'İçerik', yonetim: 'Yönetim' },
    phase: { F0: 'F0’da', F1: 'F1’de', F2: 'F2’de', F3: 'F3’te', F4: 'F4’te', F5: 'F5’te', F6: 'F6’da' },
    disabled: '{title} — {phase} açılacak',
    badge: {
      overdue: '{n} geciken görev',
      dates: '{n} tarih değişikliği talebi bekliyor',
    },
    logout: 'Çıkış yap',
  },
} as const

/**
 * Üst çubuk metinleri (`topbar.*`; 00-ortak `ozellikler.md` §4 "Üst çubuk" sözlüğü). Sunucu
 * metni kullanılmaz.
 */
export const trTopbar = {
  topbar: {
    history: 'Gezinme geçmişi',
    back: 'Geri',
    forward: 'İleri',
    crumbs: 'Konum',
    // Dar ekran (≤ 900 px) kenar menüsü kaplaması.
    menu: 'Menü',
    theme: 'Temayı değiştir',
    bell: 'Bildirimler',
    bellUnread: 'Bildirimler, {n} okunmamış',
    // ortak-kurallar §5: zil paneli F7'ye kadar devre dışı (sayaç canlı).
    bellPanelLater: 'Bildirim paneli F7’de açılacak',
  },
} as const
