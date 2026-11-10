// `shared/ui` metinleri — statik i18n ağacında (çalışma anında ağaca ekleme yok). Ekran
// metni bileşene prop olarak gelir; burada yalnız ortak bileşenlerin kendi denetimlerinin erişim
// adları, nötr yer tutucular, onay (`confirm.*`) ve çakışma (`conflict.*`) diyalog metinleri durur.
// Erişim yardımcıları `shared/ui/messages.ts`, `confirm/messages.ts`, `conflict/messages.ts`.

/** Ortak bileşen metinleri (`ui.*`). */
export const trUi = {
  ui: {
    modal: { close: 'Kapat' },
    chip: { remove: 'Kaldır' },
    toast: { dismiss: 'Bildirimi kapat' },
    error: { requestId: 'İstek kimliği', retry: 'Yeniden dene' },
    placeholder: { empty: 'Henüz veri yok', soon: 'Yakında' },
    stub: { hint: 'Yakında: sunucu desteği bekleniyor' },
  },
} as const

/**
 * Onay ve yazma sonucu bildirim metinleri (`confirm.*`). Protokol metinleri (`mutation.*`,
 * `tr/mutation.ts`) burada tekrar edilmez. Sunucu `message` alanı kullanıcıya gösterilmez; tek
 * istisna 409 `organization.confirmation_required` zarfındaki görev BAŞLIKLARIDIR (veri;
 * `shared/errors/confirmation.ts`).
 */
export const trConfirm = {
  confirm: {
    cancel: 'Vazgeç',
    impact: {
      items: 'Atamadan düşecek görevler',
      // MembershipChange: `unassigned_tasks` devredilen aktif atama sayısı (ORGANIZATION-K18).
      transferred: '{n} görevdeki atama devredildi.',
      result: 'İşlem tamamlandı; {n} görevdeki atama devredildi.',
    },
    conflict: {
      fields: 'Değişen alanlar',
      // ortak-kurallar §7, K5: alan alan seçim `shared/ui/conflict` (`ConflictDialog`).
      compare: 'Alanları karşılaştır',
    },
  },
} as const

/**
 * Alan alan çakışma seçimi metinleri (`conflict.*`; K5, istemci-akislari §8 "Düzenleme
 * sürümü"). Alan adları ekranın kendi etiketleridir (çağıran çevirir); değerler kaydın
 * kendisidir. Sunucu `message` alanı gösterilmez.
 */
export const trConflict = {
  conflict: {
    title: 'Değişiklikler çakıştı',
    description:
      'Siz düzenlerken kayıt başka biri tarafından değiştirildi. Her alan için kalacak değeri seçin.',
    mine: 'Benim değerim',
    theirs: 'Güncel değer',
    choice: '{field}: kalacak değer',
    empty: '(boş)',
    submit: 'Seçimle kaydet',
    cancel: 'Vazgeç',
  },
} as const
