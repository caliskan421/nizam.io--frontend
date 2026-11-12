/**
 * Önizlenen dosya (`?dosya`) mantığı:
 *  - Seçili dosya yüklenen sayfalarda aranır (derin bağlantı için sonraki sayfalar yüklenir;
 *    yerleşmiş listede yoksa param düşer).
 *  - Önceki/sonraki komşu dosyayı seçer; listenin sonunda devam varsa önce bir sayfa yükler.
 *  - Silinince (liste yeniden okununca dosya kaybolur ya da `deleted` gelir) komşuya geçer,
 *    komşu yoksa kapanır. Komşu, dosyanın listede göründüğü son anlık görüntüden alınır.
 *  - Kapanışta odak dosya kartına döner; kart yoksa dosya başlığına (KESİN 27).
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

/** Seçili dosyanın listede göründüğü son liste (silinince komşu buradan bulunur). */
function useListedSnapshot(input: Input, selected: Ref<ArchiveFile | null>) {
  let known: readonly ArchiveFile[] = []
  watch(
    [input.files, input.fileId],
    () => {
      if (selected.value !== null) known = input.files.value
    },
    { immediate: true, flush: 'sync' },
  )
  return {
    wasListed: (id: string) => known.some((f) => f.file_id === id),
    /** `id`'den sonraki, yoksa önceki dosya (güncel listede hâlâ bulunan). */
    neighbor(id: string): ArchiveFile | null {
      const alive = (f: ArchiveFile | null) =>
        f !== null && input.files.value.some((g) => g.file_id === f.file_id) ? f : null
      return alive(adjacentFile(known, id, 'next')) ?? alive(adjacentFile(known, id, 'previous'))
    },
  }
}

export function useFileSelection(input: Input) {
  const { files, fileId } = input
  const selected = computed(() => files.value.find((f) => f.file_id === fileId.value) ?? null)
  const position = computed(() => filePosition(files.value, fileId.value))
  const snapshot = useListedSnapshot(input, selected)
  const seeking = ref(false)

  function dropTo(id: string): void {
    const next = snapshot.neighbor(id)
    void input.select(next?.file_id ?? null, 'replace')
    if (!next) focusFile(input.root.value, null)
  }

  watch(
    [fileId, files, input.hasMore, input.settled],
    () => {
      const id = fileId.value
      if (id === null || selected.value !== null || !input.settled.value) return
      if (snapshot.wasListed(id)) return dropTo(id)
      if (input.hasMore.value && !input.fetchingMore.value) {
        seeking.value = true
        void input.loadMore().finally(() => (seeking.value = false))
      } else if (!input.hasMore.value && !seeking.value) {
        void input.select(null, 'replace')
      }
    },
    { flush: 'post' },
  )

  function close(): void {
    const id = fileId.value
    void input.select(null, 'push')
    focusFile(input.root.value, id)
  }

  async function go(direction: 'previous' | 'next'): Promise<void> {
    const to = adjacentFile(files.value, fileId.value, direction)
    if (to) return void input.select(to.file_id, 'replace')
    if (direction === 'next' && input.hasMore.value) {
      const before = files.value.length
      await input.loadMore()
      const next = files.value[before]
      if (next) void input.select(next.file_id, 'replace')
    }
  }

  return {
    selected,
    position,
    close,
    previous: () => go('previous'),
    next: () => go('next'),
    /** `FilePreview` `deleted`: liste henüz yenilenmemiş olabilir; komşu anlık görüntüden. */
    removed: dropTo,
  }
}
