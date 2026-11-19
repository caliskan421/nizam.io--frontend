import { computed, shallowRef, type Ref } from 'vue'

import type { ArchiveFile } from '../../model/types'

/** Reddedilen satır yeniden okuma sürerken eski önbellekten arayüze dönmez. */
export function usePreviewVisibleFiles(
  files: Readonly<Ref<readonly ArchiveFile[]>>,
  refresh: () => Promise<unknown>,
) {
  const denied = shallowRef(new Set<string>())
  const blocked = (id: string) => denied.value.has(id)
  const visible = computed(() => files.value.filter((file) => !blocked(file.file_id)))

  function hide(id: string | undefined): void {
    if (!id || blocked(id)) return
    denied.value = new Set([...denied.value, id])
    void refresh()
  }

  function allowedSelection(selected: Readonly<Ref<ArchiveFile | null>>) {
    return computed(() => {
      const file = selected.value
      return file && !blocked(file.file_id) ? file : null
    })
  }

  return { visible, allowedSelection, hide }
}
