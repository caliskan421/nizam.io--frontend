/** Ekle menüsü ve dosya seçimi (E-10-52..58): menü durumu, odak dönüşü, tetikleyiciler. */
import { nextTick, ref, type Ref } from 'vue'

import type { ThreadContext } from '../thread/use-thread'

export type AttachName = 'archive' | 'upload' | 'task' | 'mention' | 'poll'

export function useAttach(
  thread: ThreadContext,
  chatId: () => string,
  text: Ref<string>,
  focusEnd: () => void,
  upload: (file: File) => Promise<void>,
) {
  const menuOpen = ref(false)
  const plusBtn = ref<HTMLButtonElement | null>(null)
  const fileInput = ref<HTMLInputElement | null>(null)

  /** Kapanınca odak Ekle düğmesine döner (KESİN 27); `Tab` ile kapanışta doğal akış sürer. */
  function closeMenu(restoreFocus: boolean): void {
    menuOpen.value = false
    if (restoreFocus) void nextTick(() => plusBtn.value?.focus())
  }

  function onAttach(name: AttachName): void {
    closeMenu(name === 'archive' || name === 'poll')
    if (name === 'archive') {
      thread.openDialog({ dialog: 'shareFile', chatId: chatId(), tab: 'archive' })
    } else if (name === 'poll') thread.openDialog({ dialog: 'poll', chatId: chatId() })
    else if (name === 'upload') fileInput.value?.click()
    else {
      const gap = text.value === '' || /\s$/.test(text.value) ? '' : ' '
      text.value = `${text.value}${gap}${name === 'task' ? '#' : '@'}`
      focusEnd()
    }
  }

  async function onFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (file) await upload(file)
  }

  return { menuOpen, plusBtn, fileInput, closeMenu, onAttach, onFile }
}
