/**
 * Liste araması (E-10-05): kutu metni anında, sunucuya giden terim 300 ms gecikmeli (Enter
 * gecikmeyi atlar). Terim URL'de taşınmaz. Bekleyen gecikmeli gönderim sahip sökülmesinde, program
 * ve oturum değişiminde İPTAL edilir (KESİN 26a: istek gitmez) ve kutu temizlenir.
 */
import { onScopeDispose, ref, watch } from 'vue'

import { useScopeStore } from '@/shared/scope/store'
import { useSessionStore } from '@/shared/session/store'

export const CHAT_SEARCH_DEBOUNCE_MS = 300
export const CHAT_SEARCH_MAX = 100

export function useChatSearch() {
  const text = ref('')
  const term = ref('')
  let timer: ReturnType<typeof setTimeout> | null = null

  const cancel = (): void => {
    if (timer !== null) clearTimeout(timer)
    timer = null
  }
  const clean = (value: string): string => value.trim().slice(0, CHAT_SEARCH_MAX)

  function flush(): void {
    cancel()
    term.value = clean(text.value)
  }
  function reset(): void {
    cancel()
    text.value = ''
    term.value = ''
  }

  watch(text, (value) => {
    cancel()
    if (clean(value) === term.value) return
    timer = setTimeout(() => {
      timer = null
      term.value = clean(value)
    }, CHAT_SEARCH_DEBOUNCE_MS)
  })

  const scope = useScopeStore()
  const session = useSessionStore()
  watch(() => [scope.programId, session.accountId, session.status], reset)
  onScopeDispose(cancel)

  return { text, term, flush, reset }
}
