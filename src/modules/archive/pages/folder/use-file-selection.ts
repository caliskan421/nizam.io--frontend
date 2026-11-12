/**
 * Önizlenen dosya (`?dosya`) mantığı:
 *  - Seçili dosya yüklenen sayfalarda aranır (derin bağlantı için sonraki sayfalar yüklenir;
 *    yerleşmiş listede yoksa param düşer).
 *  - Önceki/sonraki komşu dosyayı seçer; listenin sonunda devam varsa önce bir sayfa yükler.
 *  - Silinince (liste yeniden okununca dosya kaybolur ya da `deleted` gelir) önizleme kapanır;
 *    odak komşu karta (yoksa dosya başlığına) gider. Komşu, son anlık görüntüden alınır.
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
  /** Silme uçuşta: seçili dosya listeden düşse de panel (ve sonucu) açık kalır. */
  holding?: Ref<boolean>
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
function useListedSnapshot(input: Input) {
  let known: readonly ArchiveFile[] = []
  watch(
    [input.files, input.fileId],
    () => {
      // Yalnız seçili dosya gerçekten listedeyken (silme sürerken tutulan panel sayılmaz).
      if (input.files.value.some((f) => f.file_id === input.fileId.value)) known = input.files.value
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
  let last: ArchiveFile | null = null
  const selected = computed(() => {
    const found = files.value.find((f) => f.file_id === fileId.value) ?? null
    if (found) last = found
    return found ?? (input.holding?.value && last?.file_id === fileId.value ? last : null)
  })
  const snapshot = useListedSnapshot(input)
  /** Uçuştaki derin bağlantı aramaları (sayaç: eski devam yenisini silmesin). */
  const seeking = ref(0)
  /**
   * Seçim nesli (CX-F5-Ö-01): kapatma, silinme, başka dosya/süzgeç (`?dosya` değişimi) nesli
   * artırır; sayfa beklerken başlayan asenkron gezinme çözülünce nesil değiştiyse hükümsüzdür
   * (seçim, URL yazımı, panel, odak değişmez).
   */
  let generation = 0
  watch(fileId, () => generation++, { flush: 'sync' })

  function dropTo(id: string): void {
    // Koordinatör kararı: silinince önizleme KAPANIR; odak komşu karta (yoksa dosya başlığına).
    const next = snapshot.neighbor(id)
    generation++
    void input.select(null, 'replace')
    focusFile(input.root.value, next?.file_id ?? null)
  }

  watch(
    [fileId, files, input.hasMore, input.settled, selected],
    () => {
      const id = fileId.value
      if (id === null || selected.value !== null || !input.settled.value) return
      if (snapshot.wasListed(id)) return dropTo(id)
      if (input.hasMore.value && !input.fetchingMore.value) {
        seeking.value++
        void input.loadMore().finally(() => seeking.value--)
      } else if (!input.hasMore.value && seeking.value === 0) {
        void input.select(null, 'replace')
      }
    },
    { flush: 'post' },
  )

  function close(): void {
    const id = fileId.value
    generation++
    void input.select(null, 'push')
    focusFile(input.root.value, id)
  }

  async function go(direction: 'previous' | 'next'): Promise<void> {
    const to = adjacentFile(files.value, fileId.value, direction)
    if (to) return void input.select(to.file_id, 'replace')
    if (direction === 'next' && input.hasMore.value) {
      const before = files.value.length
      const token = generation
      await input.loadMore()
      if (token !== generation) return
      const next = files.value[before]
      if (next) void input.select(next.file_id, 'replace')
    }
  }

  return {
    selected,
    position: computed(() => filePosition(files.value, fileId.value)),
    close,
    previous: () => go('previous'),
    next: () => go('next'),
    /** `FilePreview` `deleted`: liste henüz yenilenmemiş olabilir; komşu anlık görüntüden. */
    removed: dropTo,
  }
}
