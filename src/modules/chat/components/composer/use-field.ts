/**
 * Yazma alanı durumu: sohbet başına bellek taslağı (K2) ya da düzenleme gövdesi, imleç, otomatik
 * boyut ve "yazıyor" sinyali (en çok 3 sn'de bir; düzenlemede gönderilmez).
 */
import { computed, nextTick, ref } from 'vue'

import { useTypingSignal } from '../../api/typing'
import type { ThreadContext } from '../thread/use-thread'
import { chatDrafts } from './drafts'

export function useField(thread: ThreadContext, chatId: () => string, onEdited: () => void) {
  const typing = useTypingSignal()
  const field = ref<HTMLTextAreaElement | null>(null)
  const caret = ref(0)
  const draft = computed(() => chatDrafts.get(thread.draftKey.value))
  const edit = computed(() => chatDrafts.getEdit(thread.draftKey.value))
  const text = computed({
    get: () => edit.value?.body ?? draft.value?.body ?? '',
    set: (value: string) => {
      if (edit.value) chatDrafts.setEditBody(thread.draftKey.value, value)
      else chatDrafts.setBody(thread.draftKey.value, value)
    },
  })

  function resize(): void {
    const el = field.value
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }
  function setCaret(at: number): void {
    void nextTick(() => {
      const el = field.value
      if (!el) return
      el.focus()
      el.setSelectionRange(at, at)
      caret.value = at
      resize()
    })
  }

  function onInput(event: Event): void {
    const el = event.target as HTMLTextAreaElement
    text.value = el.value
    caret.value = el.selectionStart
    onEdited()
    resize()
    if (!edit.value && el.value.trim() !== '') {
      void typing.notify({ programId: thread.programId.value, chatId: chatId() })
    }
  }

  return {
    field,
    caret,
    draft,
    edit,
    text,
    resize,
    setCaret,
    focusEnd: () => setCaret(text.value.length),
    onInput,
    syncCaret: () => void (caret.value = field.value?.selectionStart ?? 0),
  }
}
