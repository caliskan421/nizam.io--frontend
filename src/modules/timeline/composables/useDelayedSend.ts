/**
 * Gecikmeli gönderim (03c E-03C-70…72; P8, P18; KESİN 26a): bırakmadan sonra istek `delayMs`
 * (5 sn) BEKLETİLİR. "İptal et" süre içinde isteği HİÇ göndermez; ✕ (`dismiss`) yalnız
 * bildirimi gizler, gönderim sürer. Gönderildikten sonra geri alma YOKTUR (P18).
 *
 * Bekleyen gönderim şu hâllerde İPTAL edilir (istek gitmez): sahip (bileşen) söküldü, kapsam
 * (program / mercek / departman) değişti, oturum değişti (çıkış / başka hesap). Gönderim anında
 * bağlam yeniden denetlenir (olay kaçsa bile), ayrıca bağlam yazma motoruna `context` olarak
 * verilir (motor da gönderim öncesi karşılaştırır).
 *
 * Aynı anahtarda (`key`, görev) yeni bırakma bekleyeni DEĞİŞTİRİR ve süreyi yeniden başlatır
 * (art arda klavye adımları tek istek); başka anahtar bekleyeni HEMEN gönderir (kullanıcının
 * önceki bırakması sessizce düşmez). Zaman `Date.now()`/`setTimeout`/`setInterval` ile akar
 * (sahte saatle sınanır).
 */
import { getCurrentScope, onScopeDispose, readonly, shallowRef, type Ref } from 'vue'

import { authSession } from '@/shared/http'
import type { ActionContext } from '@/shared/http/mutation'
import { ownerLife } from '@/shared/http/mutation/owner'
import type { ScopeSnapshot } from '@/shared/scope/scope'
import { useScopeStore } from '@/shared/scope/store'

export const DELAYED_SEND_MS = 5000
const TICK_MS = 100

export interface PendingSend<P> {
  key: string
  payload: P
  /** Gönderime kalan süre (ms). */
  remainingMs: number
  totalMs: number
  /** ✕ ile gizlendiyse `false` (gönderim sürer). */
  visible: boolean
}

export interface DelayedSendOptions<P> {
  delayMs?: number
  /** Gönderim; `context` yakalanan kapsam + oturum nesli (`submit(vars, { context })`). */
  send: (payload: P, context: ActionContext) => Promise<void>
  /** Sınama kancaları; varsayılan: kapsam deposu ve `authSession`. */
  readScope?: () => ScopeSnapshot
  readGeneration?: () => number
}

interface Slot<P> extends PendingSend<P> {
  deadline: number
  timer: ReturnType<typeof setTimeout>
  tick: ReturnType<typeof setInterval>
  context: ActionContext
}

function sameScope(a: ScopeSnapshot | null, b: ScopeSnapshot): boolean {
  return (
    a !== null &&
    a.programId === b.programId &&
    a.departmentId === b.departmentId &&
    (a.lens ?? null) === (b.lens ?? null)
  )
}

export function useDelayedSend<P>(options: DelayedSendOptions<P>): {
  pending: Readonly<Ref<PendingSend<P> | null>>
  schedule: (key: string, payload: P) => void
  /** "İptal et": bekleyen gönderimi düşürür; bekleyen varsa `true`. */
  cancel: () => boolean
  /** ✕: yalnız bildirimi gizler. */
  dismiss: () => void
  /** Bekleyeni hemen gönderir (bağlam bayatsa düşürür). */
  flush: () => Promise<void>
} {
  const delayMs = options.delayMs ?? DELAYED_SEND_MS
  const store = options.readScope ? null : useScopeStore()
  const readScope = options.readScope ?? (() => store!.snapshot)
  const readGeneration = options.readGeneration ?? (() => authSession.generation)
  const state = shallowRef<PendingSend<P> | null>(null)
  let slot: Slot<P> | null = null

  function stopTimers(s: Slot<P>): void {
    clearTimeout(s.timer)
    clearInterval(s.tick)
  }

  function drop(): Slot<P> | null {
    const s = slot
    if (!s) return null
    stopTimers(s)
    slot = null
    state.value = null
    return s
  }

  function contextValid(s: Slot<P>): boolean {
    return sameScope(s.context.scope, readScope()) && s.context.generation === readGeneration()
  }

  async function fire(): Promise<void> {
    const s = drop()
    if (!s) return
    if (!owner.alive() || !contextValid(s)) return
    await options.send(s.payload, s.context)
  }

  const owner = ownerLife(() => {
    drop()
  })

  function schedule(key: string, payload: P): void {
    if (!owner.alive()) return
    if (slot && slot.key !== key) void fire()
    else if (slot) drop()
    const context: ActionContext = {
      scope: { ...readScope() },
      generation: readGeneration(),
    }
    const deadline = Date.now() + delayMs
    const next: Slot<P> = {
      key,
      payload,
      remainingMs: delayMs,
      totalMs: delayMs,
      visible: true,
      deadline,
      context,
      timer: setTimeout(() => void fire(), delayMs),
      tick: setInterval(() => {
        if (slot !== next) return
        next.remainingMs = Math.max(0, next.deadline - Date.now())
        state.value = { ...next }
      }, TICK_MS),
    }
    slot = next
    state.value = { ...next }
  }

  function cancel(): boolean {
    return drop() !== null
  }

  function dismiss(): void {
    if (!slot) return
    slot.visible = false
    state.value = { ...slot }
  }

  // Kapsam ve oturum değişimi: bekleyen gönderim iptal (istek gitmez).
  const offScope = store ? store.onChange(() => void drop()) : undefined
  const offSession = authSession.subscribe(() => {
    if (slot && !contextValid(slot)) drop()
  })
  if (getCurrentScope()) {
    onScopeDispose(() => {
      offScope?.()
      offSession()
    })
  }

  return {
    pending: readonly(state) as Readonly<Ref<PendingSend<P> | null>>,
    schedule,
    cancel,
    dismiss,
    flush: fire,
  }
}
