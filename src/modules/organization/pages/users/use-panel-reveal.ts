/**
 * Satır seçilince yan panelin görünür alana getirilmesi (F2 görsel doğrulaması K-8). Panel dar
 * ekranda — ve yan sütuna sığmayan ara genişliklerde — listenin ALTINA sarar (esnek yerleşim,
 * medya koşulundan bağımsız); kullanıcı eyleminden sonra panele kaydırılır ve odak panele
 * (adlandırılmış alana) taşınır. Panel liste ile yan yana duruyorsa (üstleri hizalı) kaydırma ve
 * odak taşıma yok. Derin bağlantıyla (`secili`) açılışta odak çalınmaz — yalnız `reveal()`
 * çağrılan kullanıcı eylemi tetikler. Kaydırma `prefers-reduced-motion`'a uyar.
 */
import { nextTick, type Ref } from 'vue'

/** Panel kardeş liste sütununun ALTINDA mı (yan yana değil)? */
function isStacked(aside: HTMLElement): boolean {
  const column = aside.previousElementSibling
  if (!column) return false
  return aside.getBoundingClientRect().top - column.getBoundingClientRect().top > 1
}

export function usePanelReveal(aside: Ref<HTMLElement | null>) {
  async function reveal(): Promise<void> {
    await nextTick()
    const el = aside.value
    if (!el || !isStacked(el)) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    el.scrollIntoView?.({ block: 'start', behavior: reduced ? 'auto' : 'smooth' })
    el.focus({ preventScroll: true })
  }
  return { reveal }
}
