/**
 * Akış kaydırması (mekanizma §5): ilk yüklemede okunmamış ayırıcıya (yoksa en alta) iner; yeni
 * mesajda otomatik kaydırma YALNIZ en alttayken; üste eski sayfa eklenince görünür konum korunur.
 * Karar `scroll.ts`'tedir (saf); burada yalnız ölçü okuma/yazma ve tetikler vardır.
 */
import { nextTick, ref, watch, type Ref } from 'vue'

import type { ChatMessage } from '../../model/types'
import { atBottom, nearTop, planScroll, type ScrollPlan, type ScrollSnapshot } from './scroll'

function snapshot(el: HTMLElement, items: readonly ChatMessage[]): ScrollSnapshot {
  return {
    top: el.scrollTop,
    height: el.scrollHeight,
    client: el.clientHeight,
    firstSeq: items[0]?.seq ?? null,
    lastSeq: items.at(-1)?.seq ?? null,
  }
}

export interface ScrollFollowInput {
  list: Ref<HTMLElement | null>
  items: () => readonly ChatMessage[]
  chatId: () => string
  /** Okunmamış çapası çözüldü mü (ilk iniş ayırıcıya mı en alta mı karar verir). */
  ready: () => boolean
  /** İlk yüklemede inilecek öğe seçicisi (okunmamış ayırıcı); yoksa en alt. */
  initialTarget: () => string | null
  hasOlder: () => boolean
  hasNewer: () => boolean
  loadOlder: () => Promise<void>
  loadNewer: () => Promise<void>
}

/** Tek uçuşlu sayfa yükleyici: yükleniyor işareti + yeniden girişi engeller. */
function useLoader(available: () => boolean, load: () => Promise<void>) {
  const loading = ref(false)
  async function run(): Promise<void> {
    if (loading.value || !available()) return
    loading.value = true
    try {
      await load()
    } finally {
      loading.value = false
    }
  }
  return { loading, run }
}

export function useScrollFollow(input: ScrollFollowInput) {
  const older = useLoader(input.hasOlder, input.loadOlder)
  const newer = useLoader(input.hasNewer, input.loadNewer)
  let before: ScrollSnapshot | null = null
  let settledFor: string | null = null

  watch(
    input.items,
    () => {
      before = input.list.value ? snapshot(input.list.value, input.items()) : null
    },
    { flush: 'pre' },
  )

  function initial(el: HTMLElement): void {
    const selector = input.initialTarget()
    const target = selector ? el.querySelector<HTMLElement>(selector) : null
    if (target) target.scrollIntoView?.({ block: 'start' })
    else el.scrollTop = el.scrollHeight
    settledFor = input.chatId()
  }

  watch(
    () => [input.items(), input.ready()] as const,
    async () => {
      await nextTick()
      const el = input.list.value
      if (!el || input.items().length === 0 || !input.ready()) return
      if (settledFor !== input.chatId()) return initial(el)
      const plan: ScrollPlan = before
        ? planScroll(before, snapshot(el, input.items()))
        : { kind: 'keep' }
      if (plan.kind === 'bottom') el.scrollTop = el.scrollHeight
      else if (plan.kind === 'shift') el.scrollTop += plan.by
    },
    { flush: 'post' },
  )
  watch(input.chatId, () => {
    settledFor = null
  })

  /** `scroll` olayı: üstte eski, altta (pencere sonu değilse) yeni sayfa kendiliğinden yüklenir. */
  function onScroll(): void {
    const el = input.list.value
    if (!el) return
    const s = snapshot(el, input.items())
    if (nearTop(s)) void older.run()
    if (atBottom(s)) void newer.run()
  }

  return {
    loadingOlder: older.loading,
    loadingNewer: newer.loading,
    older: older.run,
    newer: newer.run,
    onScroll,
    /** Kendi gönderimimden sonra en alta in. */
    toBottom(): void {
      const el = input.list.value
      if (el) el.scrollTop = el.scrollHeight
    },
  }
}
