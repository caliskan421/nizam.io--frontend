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
  },
} as const
