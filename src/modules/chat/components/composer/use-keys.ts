/**
 * Yazma alanı klavyesi ve öneri seçimi (E-10-59..61): Enter gönderir; Shift+Enter, bileşim
 * (`isComposing`) ve dokunmatik giriş (`pointer: coarse`) yeni satır; Esc düzenlemeyi bırakır.
 * Öneri açıkken ↑/↓ gezinir, Enter/Tab seçer, Esc kapatır (odak alanda kalır).
 */
import type { ComputedRef, Ref } from 'vue'

import type { ThreadContext } from '../thread/use-thread'
import { chipsOf } from './drafts'
import { applySuggestion } from './suggest'
import type { useSuggest } from './use-suggest'

const coarse = (): boolean =>
  typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches

export interface KeysInput {
  thread: ThreadContext
  text: Ref<string>
  editing: ComputedRef<boolean>
  suggest: ReturnType<typeof useSuggest>
  showSuggest: ComputedRef<boolean>
  setCaret: (at: number) => void
  submit: () => Promise<void>
  cancelEdit: () => void
}

export function useKeys(input: KeysInput) {
  const { suggest, thread, text } = input

  function pick(index: number): void {
    const option = suggest.options.value[index]
    const trigger = suggest.trigger.value
    if (!option || !trigger) return
    const next = applySuggestion(text.value, trigger, option.token)
    text.value = next.text
    const chips = chipsOf(thread.draftKey.value)
    if (option.mention) chips.mentions.push({ token: option.token, mention: option.mention })
    if (option.task) {
      chips.refs.push({ token: option.token, kind: 'task', targetId: option.task.targetId })
    }
    input.setCaret(next.caret)
  }

  function onSuggestKey(event: KeyboardEvent): boolean {
    if (!input.showSuggest.value) return false
    const { key } = event
    if (key === 'ArrowDown' || key === 'ArrowUp') suggest.move(key === 'ArrowDown' ? 1 : -1)
    else if ((key === 'Enter' || key === 'Tab') && suggest.options.value.length > 0) {
      pick(suggest.index.value)
    } else if (key === 'Escape') suggest.dismiss()
    else return false
    event.preventDefault()
    return true
  }

  function onKeydown(event: KeyboardEvent): void {
    if (onSuggestKey(event)) return
    if (event.key === 'Escape' && input.editing.value) {
      event.preventDefault()
      input.cancelEdit()
      return
    }
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing || coarse()) return
    event.preventDefault()
    void input.submit()
  }

  return { pick, onKeydown }
}
