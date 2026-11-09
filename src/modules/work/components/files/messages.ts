/**
 * Dosyalar bileşenlerinin ekran metinleri (`workFiles.*`; W46). Sunucu `message` alanı
 * gösterilmez: hata metni kod → `errors.*` (`shared/i18n` `errorText`, `shared/ui/confirm`
 * `outcomeText`). Anahtarlar ilk kullanımda vue-i18n ağacına eklenir.
 */
import { i18n } from '@/shared/i18n'

export const trWorkFiles = {
  workFiles: {
    tag: {
      ister: 'İster',
      plan: 'Plan',
      girdi: 'Girdi',
      analiz: 'Analiz',
      cikti: 'Çıktı',
      sonuc: 'Sonuç',
    },
    size: { b: '{n} B', kb: '{n} KB', mb: '{n} MB', gb: '{n} GB' },
    unknownPerson: 'Bilinmeyen kişi',
    subtaskLinked: 'alt göreve bağlı',
    upload: {
      task: 'Kanıt dosyası yükle',
      subtask: 'Alt görev kanıtı yükle',
      description: 'Yükleme görevin durumunu değiştirmez.',
      file: 'Dosya',
      fileRequired: 'Dosya seçin.',
      tag: 'Etiket',
      tagPlaceholder: 'Etiket seçin',
      tagRequired: 'Etiket seçin.',
      submit: 'Yükle',
      cancel: 'Vazgeç',
    },
    tab: {
      upload: 'Dosya yükle',
      loading: 'Dosyalar yükleniyor…',
      empty: 'Henüz dosya yok',
      emptyText: 'Göreve yüklenen dosyalar burada listelenir.',
      evidence: 'Kanıt dosyası',
      evidenceRequired: 'gerekli',
      none: 'Yok',
      archive: 'Arşivde aç',
      archivePhase: "Arşiv bağlantısı F5'te açılacak.",
    },
    row: {
      download: 'İndir',
      downloadOf: '{name} dosyasını indir',
      rename: 'Adını değiştir',
      renameOf: '{name} dosyasının adını değiştir',
      remove: 'Dosyayı sil',
      removeOf: '{name} dosyasını sil',
      name: 'Dosya adı',
      nameRequired: 'Dosya adı boş olamaz.',
      save: 'Kaydet',
      cancel: 'Vazgeç',
      downloadInvalid: 'İndirme bağlantısı açılamadı.',
    },
    remove: {
      title: 'Dosya silinsin mi?',
      body: 'Dosya kalıcı olarak silinir; bu işlem geri alınamaz.',
      confirm: 'Sil',
    },
    slot: {
      upload: 'Kanıt yükle',
      none: 'Kanıt yok',
      more: '{name} +{n}',
      loading: 'Kanıt',
    },
  },
} as const

let merged = false

function ensureMerged(): void {
  if (merged) return
  i18n.global.mergeLocaleMessage('tr', trWorkFiles)
  merged = true
}

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type FilesTextKey = Leaves<typeof trWorkFiles>

/** `workFiles.*` metni (TR). */
export function filesText(key: FilesTextKey, params?: Record<string, string | number>): string {
  ensureMerged()
  return params ? i18n.global.t(key, params) : i18n.global.t(key)
}
