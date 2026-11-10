/**
 * Satır seçilince yan panelin görünür alana getirilmesi (F2 görsel doğrulaması K-8). Dar
 * yerleşimde (`--rp-narrow-max` altı) panel listenin ALTINDA açılır; kullanıcı eyleminden sonra
 * panele kaydırılır ve odak panele (adlandırılmış alana) taşınır. Geniş yerleşimde panel zaten
 * yan sütundadır: kaydırma/odak yok. Derin bağlantıyla (`secili`) açılışta odak çalınmaz — yalnız
 * `reveal()` çağrılan kullanıcı eylemi tetikler. Kaydırma `prefers-reduced-motion`'a uyar.
 */
import { nextTick, type Ref } from 'vue'

import { tokenPx } from '@/shared/tokens/css-var'

export function usePanelReveal(aside: Ref<HTMLElement | null>) {
  async function reveal(): Promise<void> {
    await nextTick()
    const el = aside.value
    if (!el || typeof window.matchMedia !== 'function') return
    if (!window.matchMedia(`(max-width: ${tokenPx('rp-narrow-max')}px)`).matches) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView?.({ block: 'start', behavior: reduced ? 'auto' : 'smooth' })
    el.focus({ preventScroll: true })
  }
  return { reveal }
}
