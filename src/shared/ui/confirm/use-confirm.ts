/**
 * Onay diyalogları (K5, ortak-kurallar §7). Uygulama geneli tek kuyruk; kabukta bir kez
 * `<ConfirmHost />` yerleşir ve kuyruğun başını gösterir.
 *
 *  - `confirm(options)` — **genel istemci onayı**: sunucunun onay istemediği etkili eylemler
 *    (görev silme, tarih uçları, nottan görev, `assignMembership`, koordinatör atama…). Kabul →
 *    `true`, vazgeç → `false`; isteği çağıran gönderir.
 *  - `confirmImpact(outcome, options)` — **etkili işlem onayı** (iki aşama): yalnız
 *    organizasyon uçlarının 409 `organization.confirmation_required` sonucu
 *    (`removeCoordinator`, `removeMember`, `updateMembershipRole`). 1) `fields[]` görev
 *    başlıkları listelenir; 2) onayla `outcome.confirm()` (`confirm=true`, yeni eylem) gönderilir,
 *    pencere istek bitene dek kapanmaz. Sonuç döner (vazgeçte `null`); başarıda
 *    `unassigned_tasks > 0` ise bildirim gösterilir. Diğer sonuçlar çağırana (ör. `notifyOutcome`).
 */
import { computed, shallowRef } from 'vue'

import type { MutationOutcome } from '@/shared/http/mutation'

import { useToast } from '../use-toast'
import { confirmText } from './messages'

export type ConfirmTone = 'danger' | 'primary'

export interface ConfirmOptions {
  title: string
  description?: string
  /** Gövde paragrafları (i18n'den çevrilmiş). */
  body?: readonly string[]
  confirmLabel: string
  cancelLabel?: string
  tone?: ConfirmTone
}

export interface ConfirmRequest {
  id: number
  options: ConfirmOptions
  /** Etkili işlem onayında atamadan düşecek görev başlıkları (sunucu verisi). */
  items: readonly string[]
  /** Onaylanan istek sürüyor: düğmeler kapalı, pencere kapatılamaz. */
  busy: boolean
}

interface Entry {
  request: ConfirmRequest
  /** Onayın işi; dönen `settle` pencere kapandıktan SONRA çağrılır (sonuç kapalı pencereyle gelir). */
  onAccept: () => Promise<() => void>
  onCancel: () => void
}

const queue = shallowRef<Entry[]>([])
let nextId = 1

function enqueue(entry: Omit<Entry, 'request'> & Omit<ConfirmRequest, 'id' | 'busy'>): void {
  const { options, items, onAccept, onCancel } = entry
  const request: ConfirmRequest = { id: nextId++, options, items, busy: false }
  queue.value = [...queue.value, { request, onAccept, onCancel }]
}

function remove(id: number): void {
  queue.value = queue.value.filter((e) => e.request.id !== id)
}

function setBusy(id: number, busy: boolean): void {
  queue.value = queue.value.map((e) =>
    e.request.id === id ? { ...e, request: { ...e.request, busy } } : e,
  )
}

async function accept(id: number): Promise<void> {
  const entry = queue.value.find((e) => e.request.id === id)
  if (!entry || entry.request.busy) return
  setBusy(id, true)
  let settle: (() => void) | undefined
  try {
    settle = await entry.onAccept()
  } finally {
    remove(id)
  }
  settle()
}

function cancel(id: number): void {
  const entry = queue.value.find((e) => e.request.id === id)
  if (!entry || entry.request.busy) return
  remove(id)
  entry.onCancel()
}

function confirm(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const onAccept = () => Promise.resolve(() => resolve(true))
    enqueue({ options, items: [], onAccept, onCancel: () => resolve(false) })
  })
}

type ConfirmationRequired<V, D, S> = Extract<
  MutationOutcome<V, D, S>,
  { kind: 'confirmation_required' }
>

/** `MembershipChange.unassigned_tasks` (devredilen aktif atama sayısı); yoksa 0. */
export function unassignedTasks(data: unknown): number {
  if (typeof data !== 'object' || data === null) return 0
  const value = (data as { unassigned_tasks?: unknown }).unassigned_tasks
  return typeof value === 'number' && value > 0 ? value : 0
}

function confirmImpact<V, D, S>(
  outcome: ConfirmationRequired<V, D, S>,
  options: ConfirmOptions,
): Promise<MutationOutcome<V, D, S> | null> {
  return new Promise((resolve) => {
    const onAccept = async () => {
      const result = await outcome.confirm()
      const n = result.kind === 'success' ? unassignedTasks(result.data) : 0
      return () => {
        if (n > 0) useToast().push({ message: confirmText('confirm.impact.result', { n }) })
        resolve(result)
      }
    }
    enqueue({ options, items: outcome.taskTitles, onAccept, onCancel: () => resolve(null) })
  })
}

export function useConfirm() {
  return {
    /** Gösterilen istek (kuyruğun başı). */
    current: computed(() => queue.value[0]?.request ?? null),
    confirm,
    confirmImpact,
    accept,
    cancel,
    /** Testler ve oturum sonu için: bekleyen bütün istekleri vazgeçle kapatır. */
    clear: () => {
      for (const entry of queue.value) if (!entry.request.busy) cancel(entry.request.id)
    },
  }
}
