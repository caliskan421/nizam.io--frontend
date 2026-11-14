/**
 * Panel kapanışı, odak ve dar ekran davranışı (14 `mekanizma.md` §3.4–3.5; E-14-22…24; KESİN 27).
 *  - Esc ve dış tık (`pointerdown`, yakalama) kapanış İSTEĞİ yayar (`close`); zilin kendi tıklaması
 *    dış sayılmaz (zil açıp kapatır); panelin üstündeki pencerenin (`aria-modal`, ör. onay) içindeki
 *    etkileşim de dış tık sayılmaz.
 *  - Program/birim/mercek, oturum ya da hesap değişimi paneli kapatır (E-14-88).
 *  - Açılışta odak panelin ilk etkin öğesine (yoksa köküne); her kapanışta odak zile (yoksa önceki
 *    odağa) döner — yalnız odak gövdeye düştüyse (başka bir öğeye tıklandıysa dokunulmaz).
 *  - Dar ekranda (≤ `--rp-narrow-max`, P62) tam ekran modal: `aria-modal`, Tab döngüsü panelde,
 *    belge kaydırması kilitli (`rp-scroll-lock`, AppShell).
 */
import { nextTick, onBeforeUnmount, ref, watch, type Ref } from 'vue'

import { useScopeStore } from '@/shared/scope/store'
import { useSessionStore } from '@/shared/session/store'
import { tokenPx } from '@/shared/tokens/css-var'
import { focusableIn, useFocusTrap } from '@/shared/ui'

import { NOTIFICATION_PANEL_ID } from '../model/panel'

const SCROLL_LOCK = 'rp-scroll-lock'

interface DismissOptions {
  open: () => boolean
  root: Ref<HTMLElement | null>
  close: () => void
}

/** Program/birim/mercek, oturum ya da hesap değişimi paneli kapatır (E-14-88). */
function closeOnContextChange(options: DismissOptions): void {
  const scope = useScopeStore()
  const session = useSessionStore()
  watch(
    () => [
      scope.snapshot.programId,
      scope.snapshot.departmentId,
      scope.snapshot.lens,
      session.accountId,
      session.isAuthenticated,
    ],
    () => {
      if (options.open()) options.close()
    },
  )
}

/** Belge dinleyicileri (Esc, dış tık), dar ekran medya sorgusu ve kaydırma kilidi. */
function useDocumentListeners(options: DismissOptions, triggerOf: () => HTMLElement | null) {
  const narrow = ref(false)
  let media: MediaQueryList | null = null
  let locked = false

  const setLock = (on: boolean) => {
    if (on === locked) return
    locked = on
    document.documentElement.classList.toggle(SCROLL_LOCK, on)
  }
  const onMedia = () => {
    narrow.value = media?.matches ?? false
    if (options.open()) setLock(narrow.value)
  }
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && !event.defaultPrevented) options.close()
  }
  const onPointer = (event: Event) => {
    const target = event.target
    if (!(target instanceof Node) || options.root.value?.contains(target)) return
    if (triggerOf()?.contains(target)) return
    // Panelin ÜSTÜNE açılan pencere (onay, çakışma): etkileşimi dış tık değildir; panel açık kalır.
    if (target instanceof Element && target.closest('[aria-modal="true"]') !== null) return
    options.close()
  }
  function attach(): void {
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer, true)
    if (typeof window.matchMedia !== 'function') return
    media = window.matchMedia(`(max-width: ${tokenPx('rp-narrow-max')}px)`)
    media.addEventListener('change', onMedia)
    narrow.value = media.matches
  }
  function detach(): void {
    document.removeEventListener('keydown', onKey)
    document.removeEventListener('pointerdown', onPointer, true)
    media?.removeEventListener('change', onMedia)
    media = null
    setLock(false)
  }
  return { narrow, attach, detach, setLock }
}

export function usePanelDismiss(options: DismissOptions) {
  const trap = useFocusTrap(options.root)
  let trigger: HTMLElement | null = null
  closeOnContextChange(options)
  const dom = useDocumentListeners(options, () => trigger)

  async function onOpened(): Promise<void> {
    const active = document.activeElement
    const previous = active instanceof HTMLElement && active !== document.body ? active : null
    dom.attach()
    await nextTick()
    if (!options.open()) return
    trigger =
      document.querySelector<HTMLElement>(`[aria-controls="${NOTIFICATION_PANEL_ID}"]`) ?? previous
    dom.setLock(dom.narrow.value)
    const root = options.root.value
    const first = root ? focusableIn(root)[0] : undefined
    ;(first ?? root)?.focus()
  }

  async function onClosed(): Promise<void> {
    dom.detach()
    await nextTick()
    const active = document.activeElement
    if ((!active || active === document.body) && trigger?.isConnected) trigger.focus()
    trigger = null
  }

  watch(
    options.open,
    (isOpen, wasOpen) => {
      if (isOpen) return onOpened()
      if (wasOpen) return onClosed()
    },
    { immediate: true },
  )
  onBeforeUnmount(dom.detach)

  const { narrow } = dom
  return { narrow, onKeydown: (event: KeyboardEvent) => narrow.value && trap.onKeydown(event) }
}
