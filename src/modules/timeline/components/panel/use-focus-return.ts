/**
 * Panel yaşam döngüsü (KESİN 27, E-03C-57): Esc paneli kapatır (açık menü/pencere Esc'yi
 * kendisi tüketir: `defaultPrevented` ⇒ panel kapanmaz); panel hangi yolla kapanırsa kapansın
 * (✕, Esc, eylem sonrası söküm) odak, panel açılırken odakta olan öğeye (çubuk/satır) döner —
 * panelin içinde ya da gövdede kalmışsa. Öğe yoksa (yeniden çizildi) odağa dokunulmaz.
 */
import { onBeforeUnmount, onMounted, type Ref } from 'vue'

export function usePanelLifecycle(root: Ref<HTMLElement | null>, close: () => void): void {
  const active = document.activeElement
  const opener = active instanceof HTMLElement && active !== document.body ? active : null

  function onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || event.defaultPrevented) return
    event.preventDefault()
    close()
  }

  onMounted(() => document.addEventListener('keydown', onKeydown))
  onBeforeUnmount(() => {
    document.removeEventListener('keydown', onKeydown)
    const current = document.activeElement
    const stranded = !current || current === document.body || root.value?.contains(current)
    if (stranded && opener?.isConnected && !root.value?.contains(opener)) opener.focus()
  })
}
