// Arşiv › önizleme › "Başka göreve taşı" penceresi metinleri (W194; `archive.actions.move*`).
// `archive.ts` bu nesneyi `actions` dalına açar (tek statik ağaç; ikinci kök yok, KESİN 24).
// Sunucu `message` alanı kullanılmaz; hata metinleri `errors.*`.

export const trArchiveMove = {
  moveTitle: 'Dosyayı başka göreve taşı',
  moveDescription:
    'Dosya, seçtiğiniz görevin arşivine taşınır; aynı adlı dosya varsa adı numaralanır.',
  moveDepartmentLabel: 'Hedef departman',
  moveTaskLabel: 'Hedef görev',
  moveTaskPlaceholder: 'Görev seçin',
  moveTaskRequired: 'Hedef görev seçin.',
  moveTaskNone: 'Dosyayı taşıyabileceğiniz başka görev yok.',
  moveTaskTruncated: 'Görev listesi kesildi: bazı görevler burada görünmüyor.',
  moveTaskLoading: 'Görevler yükleniyor…',
  moveTaskError: 'Görevler okunamadı. Pencereyi kapatıp yeniden deneyin.',
  moveSubtaskLabel: 'Alt görev (isteğe bağlı)',
  moveSubtaskNone: 'Alt görev yok',
  moveSubtaskLoading: 'Alt görevler yükleniyor…',
  moveSubtaskUnavailable: 'Alt görevler okunamadı; dosya göreve eklenir.',
  moveSubmit: 'Taşı',
  moveCancel: 'Vazgeç',
  moved: 'Dosya “{task}” görevine taşındı.',
  movedRenamed: 'Dosya “{task}” görevine “{name}” adıyla taşındı.',
  moveTargetInvalid: 'Hedef görev artık seçilemiyor. Başka bir görev seçin.',
  moveFallbackTask: 'seçilen',
} as const
