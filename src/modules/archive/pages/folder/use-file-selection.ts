/**
 * Önizlenen dosya (`?dosya`) mantığı: seçili dosya yüklenen sayfalarda aranır (derin bağlantı
 * için sonraki sayfalar yüklenir; yerleşmiş listede yoksa param düşer), önceki/sonraki komşu
 * dosyayı seçer (listenin sonunda devam varsa önce bir sayfa yükler), silinince komşuya geçer
 * (yoksa kapanır). Kapanışta odak dosya kartına döner; kart yoksa dosya başlığına (KESİN 27).
 */
import { computed, nextTick, ref, watch, type Ref } from 'vue'

import { adjacentFile, filePosition } from '../../model/preview'
import type { ArchiveFile } from '../../model/types'

interface Input {
  root: Ref<HTMLElement | null>
  files: Ref<readonly ArchiveFile[]>
  hasMore: Ref<boolean>
  loadMore: () => Promise<void>
  fetchingMore: Ref<boolean>
  settled: Ref<boolean>
  fileId: Ref<string | null>
  select: (id: string | null, mode: 'push' | 'replace') => unknown
}

/** Odağı dosya kartına, yoksa dosya başlığına taşır (gövdeye düşmez). */
function focusFile(root: HTMLElement | null, id: string | null): void {
  void nextTick(() => {
    if (!root) return
    const card =
      id === null ? null : root.querySelector<HTMLElement>(`[data-file-id="${CSS.escape(id)}"]`)
    const target = card ?? root.querySelector<HTMLElement>('#arch-files-title')
    if (target && !card) target.tabIndex = -1
    target?.focus()
  })
}

/**
 * Derin bağlantı: seçili dosya yüklenen sayfalarda yoksa sonraki sayfa yüklenir; liste yerleşmiş
 * ve devam yoksa `dosya` parametresi düşer.
 */
function watchSeek(input: Input, selected: Ref<ArchiveFile | null>): void {
  const seeking = ref(false)
  watch(
    [input.fileId, input.files, input.hasMore, input.settled],
    () => {
      if (input.fileId.value === null || selected.value !== null || !input.settled.value) return
      if (input.hasMore.value && !input.fetchingMore.value) {
        seeking.value = true
        void input.loadMore().finally(() => (seeking.value = false))
      } else if (!input.hasMore.value && !seeking.value) {
        void input.select(null, 'replace')
      }
    },
    { flush: 'post' },
  )
}

export function useFileSelection(input: Input) {
  const { files, fileId } = input
  const selected = computed(() => files.value.find((f) => f.file_id === fileId.value) ?? null)
  const position = computed(() => filePosition(files.value, fileId.value))
  // Silme sonrası liste yeniden okunmuş olabilir: komşu, dosyanın listede göründüğü son
  // anlık görüntüden alınır.
  let known: readonly ArchiveFile[] = []
  watch(
    [files, fileId],
    () => {
      if (selected.value !== null) known = files.value
    },
    { immediate: true, flush: 'sync' },
  )

  watchSeek(input, selected)

  function close(): void {
    const id = fileId.value
    void input.select(null, 'push')
    focusFile(input.root.value, id)
  }

  async function go(direction: 'previous' | 'next'): Promise<void> {
    const to = adjacentFile(files.value, fileId.value, direction)
    if (to) {
      void input.select(to.file_id, 'replace')
      return
    }
    if (direction === 'next' && input.hasMore.value) {
      const before = files.value.length
      await input.loadMore()
      const next = files.value[before]
      if (next) void input.select(next.file_id, 'replace')
    }
  }

  function removed(id: string): void {
    const list = files.value.some((f) => f.file_id === id) ? files.value : known
    const neighbor = adjacentFile(list, id, 'next') ?? adjacentFile(list, id, 'previous')
    void input.select(neighbor?.file_id ?? null, 'replace')
    if (!neighbor) focusFile(input.root.value, null)
  }

  return {
    selected,
    position,
    close,
    previous: () => go('previous'),
    next: () => go('next'),
    removed,
  }
}
