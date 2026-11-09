/**
 * Onay diyalogları (K5, ortak-kurallar §7). Uygulama geneli tek kuyruk; kabukta bir kez
 * `<ConfirmHost />` yerleşir ve kuyruğun başını gösterir.
 *
 *  - `confirmWrite(options, start, { context? })` — **yazma başlatan istemci onayı**: sunucunun
 *    onay istemediği etkili eylemler (görev/alt görev/dosya/not silme, `subtasks_open`…).
 *    Kabulde `start(context)` kabulle AYNI anda çağrılır; yazma onayın yakaladığı bağlamla
 *    (`submit(vars, { context })`) başlar, pencere yazma bitene dek meşgul kalır. Vazgeç/iptal
 *    → `null`. Boolean dönen (bağlamı tüketiciye bırakan) bir yol YOKTUR: onay → yazma
 *    arasında bağlam atlanamaz (CX-F1-E-02; `confirm-context.test.ts` mimari denetimi).
 *  - `confirmImpact(outcome, options)` — **etkili işlem onayı** (iki aşama): yalnız
 *    organizasyon uçlarının 409 `organization.confirmation_required` sonucu
 *    (`removeCoordinator`, `removeMember`, `updateMembershipRole`). 1) `fields[]` görev
 *    başlıkları listelenir; 2) onayla `outcome.confirm()` (`confirm=true`, yeni eylem) gönderilir,
 *    pencere istek bitene dek kapanmaz. Sonuç döner (vazgeçte `null`); başarıda
 *    `unassigned_tasks > 0` ise bildirim gösterilir. Diğer sonuçlar çağırana (ör. `notifyOutcome`).
 *
 * Yaşam döngüsü (CX-F1-E-02): onay açılırken kapsam (program/departman/mercek), oturum nesli
 * (`AuthSession.generation`) ve hesap yakalanır. Kapsam değişimi, çıkış/oturum sonu/hesap
 * değişimi ve onayı açan bileşenin sökülmesi (`useConfirm()` çağıran kapsamın `onScopeDispose`'u)
 * bekleyen onayı **vazgeç** olarak kapatır (`null`; yazma başlamaz). Onay açan
 * `useConfirm()` kurulumda (etki kapsamında) alınmalıdır; dışarıda alınan örnek onay açamaz
 * (geliştirme/testte hata). Savunma derinliği:
 * kabul anında yakalanan bağlam güncel değilse kabul de vazgeç sayılır. Başlamış HTTP isteği
 * geriye dönük iptal edilmez; meşgul (yazma süren) girdi süpürmeden muaftır — o istek zaten
 * onayın bağlamını taşır ve motor kapısı gönderimden hemen önce denetler.
 */
import { getActivePinia } from 'pinia'
import { computed, getCurrentScope, onScopeDispose, shallowRef } from 'vue'

import { authSession } from '@/shared/http'
import { sameScope, type ActionContext, type MutationOutcome } from '@/shared/http/mutation'
import type { ScopeSnapshot } from '@/shared/scope/scope'
import { useScopeStore } from '@/shared/scope/store'

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

/** Onayın açıldığı an: kapsam (Pinia yoksa `null` ≡ denetlenmez), oturum nesli ve hesap. */
interface ConfirmContext {
  scope: ScopeSnapshot | null
  generation: number
  accountId: string | null
}

interface Entry {
  request: ConfirmRequest
  context: ConfirmContext
  /** Onayın işi; dönen `settle` pencere kapandıktan SONRA çağrılır (sonuç kapalı pencereyle gelir). */
  onAccept: () => Promise<() => void>
  onCancel: () => void
}

type NewEntry = Omit<Entry, 'request' | 'context'> & Omit<ConfirmRequest, 'id' | 'busy'>

const queue = shallowRef<Entry[]>([])
let nextId = 1

function captureContext(): ConfirmContext {
  return {
    scope: getActivePinia() ? { ...useScopeStore().snapshot } : null,
    generation: authSession.generation,
    accountId: authSession.snapshot.accountId,
  }
}

/** Yakalanan bağlam hâlâ güncel mi (kapsam + nesil + hesap). */
function isCurrent(context: ConfirmContext): boolean {
  const now = captureContext()
  if (now.generation !== context.generation || now.accountId !== context.accountId) return false
  return !context.scope || !now.scope || sameScope(context.scope, now.scope)
}

/** Bağlamı bayatlamış bekleyen onayları vazgeçle kapatır (sürmekte olan istek dokunulmaz). */
function sweep(): void {
  for (const entry of queue.value) {
    if (!entry.request.busy && !isCurrent(entry.context)) cancel(entry.request.id)
  }
}

/**
 * Kapsam deposu ve oturum dinleyicisi yalnız kuyruk doluyken bağlıdır; kuyruk boşalınca
 * sökülür (bir sonraki onay o anki Pinia deposuna yeniden bağlanır).
 */
let unbind: (() => void) | null = null

function bindWatchers(): void {
  if (unbind) return
  const offScope = getActivePinia() ? useScopeStore().onChange(sweep) : () => undefined
  const offSession = authSession.subscribe(sweep)
  unbind = () => {
    offScope()
    offSession()
  }
}

function enqueue(entry: NewEntry, context: ConfirmContext = captureContext()): number {
  const { options, items, onAccept, onCancel } = entry
  const request: ConfirmRequest = { id: nextId++, options, items, busy: false }
  queue.value = [...queue.value, { request, context, onAccept, onCancel }]
  bindWatchers()
  return request.id
}

function remove(id: number): void {
  queue.value = queue.value.filter((e) => e.request.id !== id)
  if (queue.value.length === 0 && unbind) {
    unbind()
    unbind = null
  }
}

function setBusy(id: number, busy: boolean): void {
  queue.value = queue.value.map((e) =>
    e.request.id === id ? { ...e, request: { ...e.request, busy } } : e,
  )
}

async function accept(id: number): Promise<void> {
  const entry = queue.value.find((e) => e.request.id === id)
  if (!entry || entry.request.busy) return
  // Savunma derinliği: dinleyici kaçırsa da bayat bağlamda kabul = vazgeç.
  if (!isCurrent(entry.context)) return cancel(id)
  setBusy(id, true)
  let settle: () => void = entry.onCancel
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

/**
 * Onayı açan sahip (etki kapsamı): açtığı onayların kimliklerini tutar (sökülünce iptal) ve
 * yaşayıp yaşamadığını bilir — sökülmüş sahip yeni onay AÇAMAZ (CX-F1-E-02 tur 3: geç yanıt
 * sökülmeden sonra gelirse onay doğmaz).
 */
interface Owner {
  alive: boolean
  track: (id: number) => void
}

/**
 * Onayı açan bir sahip (etki kapsamı) şarttır: sahipsiz onay bileşen sökülünce kapanmaz
 * (CX-F1-E-02). Geliştirme/testte açık hata; üretimde onay hiç açılmaz (yazma başlamaz).
 * Sökülmüş sahip hata değildir (geç yanıt olağandır): açıcı sessizce `null` döner.
 */
function requireOwner(owner: Owner | null): Owner | null {
  if (owner || !import.meta.env.DEV) return owner
  throw new Error(
    'useConfirm(): etki kapsamı dışında alındı — onay sahipsiz kalır; kurulumda (setup) çağırın.',
  )
}

/** Kabulde yazmayı başlatır: onayın yakaladığı bağlam (`submit(vars, { context })`) verilir. */
export type StartWrite<T> = (context: ActionContext) => Promise<T>

export interface ConfirmWriteOptions {
  /**
   * Onayı doğuran İLK eylemin bağlamı (ör. `MutationFailed.context`). Verilirse onay bu
   * bağlamla açılır; açılış anında zaten bayatsa onay hiç açılmaz (sessiz vazgeç, `null`).
   */
  context?: ActionContext
}

/** Onayın bağlamı: verilen ilk eylem bağlamı (güncel değilse `null`) ya da şimdiki an. */
function openContext(given: ActionContext | undefined): ConfirmContext | null {
  const now = captureContext()
  if (!given) return now
  const candidate: ConfirmContext = {
    scope: given.scope ? { ...given.scope } : null,
    generation: given.generation ?? now.generation,
    accountId: now.accountId,
  }
  return isCurrent(candidate) ? candidate : null
}

/**
 * Yazma başlatan onay (CX-F1-E-02): kabulde `start(context)` aynı anda (kabul denetiminin
 * hemen ardından, araya `await` girmeden) çağrılır; yazma onayın yakaladığı bağlamla kurulur ve
 * motor kapısı gönderimden hemen önce bağlamı güncel değerle karşılaştırır — onay ile yazma
 * başlangıcı arasında kapsam/oturum değişse de yeni bağlamda yazma başlamaz. Pencere yazma
 * bitene dek açık (meşgul) kalır. Vazgeç/iptal → `null`; kabul → `start`'ın sonucu.
 */
function confirmWrite<T>(
  options: ConfirmOptions,
  start: StartWrite<T>,
  opts: ConfirmWriteOptions,
  opener: Owner | null,
): Promise<T | null> {
  const owner = requireOwner(opener)
  return new Promise((resolve) => {
    // Sahip açılış anında yaşıyor olmalı (sökülmüş bileşen yeni onay açamaz).
    const context = owner?.alive ? openContext(opts.context) : null
    if (!owner || !context) return resolve(null)
    const onAccept = async () => {
      const value = await start({ scope: context.scope, generation: context.generation })
      return () => resolve(value)
    }
    owner.track(enqueue({ options, items: [], onAccept, onCancel: () => resolve(null) }, context))
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
  opener: Owner | null,
): Promise<MutationOutcome<V, D, S> | null> {
  const owner = requireOwner(opener)
  return new Promise((resolve) => {
    if (!owner?.alive) return resolve(null)
    const onAccept = async () => {
      const result = await outcome.confirm()
      const n = result.kind === 'success' ? unassignedTasks(result.data) : 0
      return () => {
        // Onayı açan sahip söküldüyse etki bildirimi yok (CX-F1-Ö-07).
        if (n > 0 && owner.alive) {
          useToast().push({ message: confirmText('confirm.impact.result', { n }) })
        }
        resolve(result)
      }
    }
    const id = enqueue({
      options,
      items: outcome.taskTitles,
      onAccept,
      onCancel: () => resolve(null),
    })
    owner.track(id)
  })
}

/**
 * Bileşen (ya da etki kapsamı) içinde çağrılırsa bu çağrının açtığı onaylar kapsam kapanınca
 * (bileşen sökülünce) vazgeçle kapanır. Kapsam dışında alınan örnek onay AÇAMAZ
 * (`requireOwner`); yalnız kuyruğu okur/yönetir (kabuk yuvası, testler).
 */
function ownedOpeners(): Owner | null {
  if (!getCurrentScope()) return null
  const owned = new Set<number>()
  const owner: Owner = { alive: true, track: (id) => void owned.add(id) }
  onScopeDispose(() => {
    // Ölüm kaydedilir: sonradan (geç yanıtla) gelen açılış da reddedilir, yalnız mevcutlar değil.
    owner.alive = false
    for (const id of owned) cancel(id)
  })
  return owner
}

export function useConfirm() {
  const owner = ownedOpeners()
  return {
    /** Gösterilen istek (kuyruğun başı). */
    current: computed(() => queue.value[0]?.request ?? null),
    confirmWrite: <T>(
      options: ConfirmOptions,
      start: StartWrite<T>,
      opts: ConfirmWriteOptions = {},
    ) => confirmWrite(options, start, opts, owner),
    confirmImpact: <V, D, S>(outcome: ConfirmationRequired<V, D, S>, options: ConfirmOptions) =>
      confirmImpact(outcome, options, owner),
    accept,
    cancel,
    /** Testler ve oturum sonu için: bekleyen bütün istekleri vazgeçle kapatır. */
    clear: () => {
      for (const entry of queue.value) if (!entry.request.busy) cancel(entry.request.id)
    },
  }
}
