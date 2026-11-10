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
 * Aynı anahtarda (`key`, görev) yeni bırakma o anahtarın bekleyenini DEĞİŞTİRİR ve süresini
 * yeniden başlatır (art arda klavye adımları tek istek). Başka anahtar bekleyeni KESMEZ
 * (CX-F3-Ö-01; E-03C-77/100: her bırakma sonrası tam 5 sn iptal penceresi): her anahtarın kendi
 * zamanlayıcısı vardır, her biri kendi süresinde ve tek istekle gider, her biri ayrı iptal
 * edilir. Bildirim (`pending`) tek yuvadır; en dar yorum (P3): görünür olanlar arasında EN SON
 * değişen anahtarı gösterir, "İptal et" GÖSTERİLENİ iptal eder; o gidince (iptal ya da gönderim)
 * önceki bekleyen görünür olur ve o da iptal edilebilir. ✕ yalnız gösterileni gizler. Zaman
 * `Date.now()`/`setTimeout`/`setInterval` ile akar (sahte saatle sınanır).
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

/** Süre sayaçlarını kurar: `delayMs` sonra `fire`, her `TICK_MS`'de `onTick`. */
function arm<P>(
  [key, payload, context]: [string, P, ActionContext],
  delayMs: number,
  hooks: { fire: () => void; onTick: (slot: Slot<P>) => void },
): Slot<P> {
  const slot: Slot<P> = {
    key,
    payload,
    context,
    remainingMs: delayMs,
    totalMs: delayMs,
    visible: true,
    deadline: Date.now() + delayMs,
    timer: setTimeout(hooks.fire, delayMs),
    tick: setInterval(() => {
      slot.remainingMs = Math.max(0, slot.deadline - Date.now())
      hooks.onTick(slot)
    }, TICK_MS),
  }
  return slot
}

export interface DelayedSend<P> {
  /** Bildirimde gösterilen bekleyen (bkz. dosya başı); yoksa `null`. */
  pending: Readonly<Ref<PendingSend<P> | null>>
  /** Anahtarın bekleyeni (gösterilsin ya da gizli olsun); yoksa `null`. */
  peek: (key: string) => PendingSend<P> | null
  schedule: (key: string, payload: P) => void
  /** "İptal et": `key` verilmezse gösterileni, verilirse o anahtarı düşürür; düştüyse `true`. */
  cancel: (key?: string) => boolean
  /** ✕: yalnız gösterilen bildirimi gizler. */
  dismiss: () => void
  /** Bekleyenlerin hepsini hemen gönderir (bağlam bayatsa düşürür). */
  flush: () => Promise<void>
}

/** Anahtar başına bekleyenler ve bildirimde gösterilen tek yuva (bkz. dosya başı). */
function slotBook<P>(state: Ref<PendingSend<P> | null>) {
  /** Ekleme sırası = son değişiklik sırası (yeniden zamanlama sona taşır). */
  const slots = new Map<string, Slot<P>>()

  /** Görünür olanlar arasında en son değişen; hiçbiri görünür değilse en son değişen. */
  function shown(): Slot<P> | null {
    const all = [...slots.values()].reverse()
    return all.find((s) => s.visible) ?? all[0] ?? null
  }

  function refresh(): void {
    const s = shown()
    state.value = s ? { ...s } : null
  }

  function drop(key: string): Slot<P> | null {
    const s = slots.get(key)
    if (!s) return null
    clearTimeout(s.timer)
    clearInterval(s.tick)
    slots.delete(key)
    refresh()
    return s
  }

  function dropAll(): void {
    for (const key of [...slots.keys()]) drop(key)
  }

  return { slots, shown, refresh, drop, dropAll }
}

export function useDelayedSend<P>(options: DelayedSendOptions<P>): DelayedSend<P> {
  const delayMs = options.delayMs ?? DELAYED_SEND_MS
  const store = options.readScope ? null : useScopeStore()
  const readScope = options.readScope ?? (() => store!.snapshot)
  const readGeneration = options.readGeneration ?? (() => authSession.generation)
  const state = shallowRef<PendingSend<P> | null>(null)
  const { slots, shown, refresh, drop, dropAll } = slotBook<P>(state)
  const owner = ownerLife(() => dropAll())

  const valid = (s: Slot<P>): boolean =>
    sameScope(s.context.scope, readScope()) && s.context.generation === readGeneration()

  async function fire(key: string): Promise<void> {
    const s = drop(key)
    if (s && owner.alive() && valid(s)) await options.send(s.payload, s.context)
  }

  function schedule(key: string, payload: P): void {
    if (!owner.alive()) return
    drop(key)
    const context: ActionContext = { scope: { ...readScope() }, generation: readGeneration() }
    const next = arm([key, payload, context], delayMs, {
      fire: () => void fire(key),
      onTick: (s) => {
        if (slots.get(key) === s && shown() === s) state.value = { ...s }
      },
    })
    slots.set(key, next)
    refresh()
  }

  function dismiss(): void {
    const s = shown()
    if (!s) return
    s.visible = false
    refresh()
  }

  // Kapsam ve oturum değişimi: bekleyen gönderimlerin hepsi iptal (istek gitmez).
  const offs = [
    store?.onChange(() => dropAll()),
    authSession.subscribe(() => {
      for (const s of [...slots.values()]) if (!valid(s)) drop(s.key)
    }),
  ]
  if (getCurrentScope()) onScopeDispose(() => offs.forEach((off) => off?.()))

  const pending = readonly(state) as Readonly<Ref<PendingSend<P> | null>>
  return {
    pending,
    peek: (key) => {
      const s = slots.get(key)
      return s ? { ...s } : null
    },
    schedule,
    cancel: (key) => {
      const target = key ?? shown()?.key
      return target !== undefined && drop(target) !== null
    },
    dismiss,
    flush: async () => {
      await Promise.all([...slots.keys()].map((key) => fire(key)))
    },
  }
}
