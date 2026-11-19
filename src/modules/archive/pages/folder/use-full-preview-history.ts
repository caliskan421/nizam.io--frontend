import { onScopeDispose, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'

import type { ArchiveFile, ArchiveTarget } from '../../model/types'

const MARKER = 'archiveFullscreen'

/** Aynı URL'de geçici bir geri adımı. İleri geçmişi izleyiciyi yeniden açmaz. */
export function useFullPreviewHistory<T>() {
  const router = useRouter()
  const history = router.options.history
  const shown = shallowRef<T | null>(null)
  let closing = false

  function open(view: T): void {
    if (shown.value || closing) return
    history.push(router.currentRoute.value.fullPath, { [MARKER]: true })
    shown.value = view
  }

  function close(): void {
    if (!shown.value) return
    shown.value = null
    if (history.state[MARKER] === true) {
      closing = true
      history.go(-1)
    }
  }

  const remove = history.listen((to, from, movement) => {
    closing = false
    shown.value = null
    if (to === from && movement.delta > 0 && history.state[MARKER] === true) {
      // Kapatılmış izleyici bir rota değildir. Gerçek bir ileri hedef varsa oraya geç.
      if (typeof history.state.forward === 'string') history.go(1)
      else history.go(-1)
    }
  })
  watch(
    () => router.currentRoute.value.fullPath,
    () => {
      shown.value = null
    },
  )
  onScopeDispose(remove)
  return { shown, open, close }
}

export function useArchiveFullscreen(
  selectedFile: () => ArchiveFile | null,
  fileTarget: () => ArchiveTarget | null,
  taskTitle: (id: string) => string | null,
) {
  const history = useFullPreviewHistory<{
    file: ArchiveFile
    target: ArchiveTarget
    taskTitle: string | null
    trigger: HTMLElement
  }>()
  return {
    shown: history.shown,
    close: history.close,
    open(trigger: HTMLElement): void {
      const file = selectedFile()
      const target = fileTarget()
      if (file && target)
        history.open({ file, target, taskTitle: taskTitle(file.work_item_id), trigger })
    },
  }
}
