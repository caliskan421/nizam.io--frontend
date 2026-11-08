/**
 * Alt görev düzenleme eylemleri (K5; `ortak-kurallar.md` §7; 03 `mekanizma.md` §4-4…9).
 *
 *  - Kapat/aç (E-03-31): `{done}` — sürüm yok; İYİMSER GÜNCELLEME YOK: istek sürerken satır
 *    bekleme durumundadır, görünen değer yalnız yeniden okunan listeden gelir.
 *  - Kişi / tarih / başlık (E-03-32…34): `expected_revision` (W41 sarmalayıcısı). 409
 *    `work.edit_conflict` → `shared/ui/conflict` alan alan seçim → sunucu kaydı yeni tabanla
 *    YENİ eylem (otomatik tekrar yok).
 *  - Sil (E-03-36/64): istemci onayı (`useConfirm`; `confirmation_required` bu uçta yok).
 *  - Bu uçlar `Idempotency-Key` almaz: sonuç bilinmiyor / başarısızlıkta liste yeniden okunur
 *    (sunucu tek doğru), metin `notifyOutcome` (hata kodu → i18n).
 */
import { shallowRef } from 'vue'

import type { MutationOutcome } from '@/shared/http/mutation'
import { notifyOutcome, useConfirm } from '@/shared/ui/confirm'
import { resolveDraft, useConflictResolver } from '@/shared/ui/conflict'

import { useDeleteSubtask, useUpdateSubtask } from '../../api'
import type {
  UpdateSubtaskBody,
  UpdateSubtaskInput,
  WorkItem,
  WorkItemSubtask,
  WorkTarget,
} from '../../model/types'
import { subtaskText } from './messages'
import { fullDate, keepDatePair, subtaskValues } from './subtask-format'

type AnyOutcome = MutationOutcome<unknown, unknown, unknown>
type UpdateOutcome = MutationOutcome<UpdateSubtaskInput, WorkItemSubtask, WorkItemSubtask | null>

export interface SubtaskEditDeps {
  item: () => WorkItem
  target: () => WorkTarget
  /** Listeyi sunucudan yeniden okur (grup kendi anahtarını yazmaz; sorgunun `refetch`'i). */
  reload: () => unknown
}

function conflictLabels(): Record<string, string> {
  return {
    title: subtaskText('subtasks.field.title'),
    assignee_account_id: subtaskText('subtasks.field.assignee'),
    start_on: subtaskText('subtasks.field.start'),
    end_on: subtaskText('subtasks.field.end'),
  }
}

/** Çakışma satırında değerin gösterimi: tarih `GG.AA.YYYY`, kişi adı (ana görev atananı). */
function conflictFormat(item: () => WorkItem) {
  return (field: string, value: unknown): string => {
    const text = typeof value === 'string' ? value : ''
    if (field === 'start_on' || field === 'end_on') return fullDate(text)
    if (field !== 'assignee_account_id' || text === '') return text
    const person = item().assignees.find((a) => a.account_id === text)
    return person?.full_name ?? subtaskText('subtasks.row.unknownPerson')
  }
}

/**
 * 409 `edit_conflict`: yalnız gerçek çakışan alanlar sorulur (`shared/ui/conflict`); seçim
 * sonrası gönderilecek değişiklik, vazgeçte ya da yazılacak fark kalmadıysa `null`.
 */
function useConflictFlow(item: () => WorkItem) {
  const conflict = useConflictResolver()
  const format = conflictFormat(item)

  async function resolve(
    base: WorkItemSubtask,
    changes: UpdateSubtaskBody,
    server: WorkItemSubtask,
  ): Promise<UpdateSubtaskBody | null> {
    const theirs = subtaskValues(server)
    const choices = await conflict.resolve({
      base: subtaskValues(base),
      draft: changes,
      server: theirs,
      labels: conflictLabels(),
      format,
    })
    if (choices === null) return null
    const next = keepDatePair(resolveDraft(changes, theirs, choices), server)
    return Object.keys(next).length === 0 ? null : next
  }

  return { conflict, resolve }
}

/** İstek süren satırlar (bekleme durumu); aynı satıra ikinci yazma başlatılmaz. */
function usePendingRows() {
  const ids = shallowRef<ReadonlySet<string>>(new Set())

  function mark(id: string, on: boolean): void {
    const next = new Set(ids.value)
    if (on) next.add(id)
    else next.delete(id)
    ids.value = next
  }

  async function run(id: string, work: () => Promise<void>): Promise<void> {
    if (ids.value.has(id)) return
    mark(id, true)
    try {
      await work()
    } finally {
      mark(id, false)
    }
  }

  return { has: (id: string) => ids.value.has(id), run }
}

export function useSubtaskEdit(deps: SubtaskEditDeps) {
  const update = useUpdateSubtask()
  const del = useDeleteSubtask()
  const { conflict, resolve } = useConflictFlow(deps.item)
  const { confirm } = useConfirm()
  const pending = usePendingRows()

  function report(outcome: AnyOutcome | null): void {
    if (outcome === null || outcome.kind === 'success') return
    notifyOutcome(outcome)
    void deps.reload()
  }

  async function send(
    base: WorkItemSubtask,
    changes: UpdateSubtaskBody,
  ): Promise<UpdateOutcome | null> {
    const workItemId = deps.item().work_item_id
    // Yazma değişkeni dondurulur (`structuredClone`): sorgu/props vekilleri düz kopyaya çevrilir.
    const vars = { target: { ...deps.target() }, workItemId, base: { ...base }, changes }
    const outcome = await update.submit(vars)
    if (outcome.kind !== 'edit_conflict' || outcome.server === null) return outcome
    // Sunucu sürümü ilerlemediyse yeniden göndermek aynı çakışmayı doğurur: bildirilir.
    if (outcome.server.edit_revision === base.edit_revision) return outcome
    const next = await resolve(base, changes, outcome.server)
    return next === null ? null : send(outcome.server, next)
  }

  /** Kişi / tarih / başlık / `done` yazması; satır istek boyunca beklemede. */
  function patch(subtask: WorkItemSubtask, changes: UpdateSubtaskBody): Promise<void> {
    return pending.run(subtask.subtask_id, async () => report(await send(subtask, changes)))
  }

  /** E-03-31: kapat / yeniden aç (iyimser değil). */
  function toggle(subtask: WorkItemSubtask): Promise<void> {
    return patch(subtask, { done: !subtask.done })
  }

  /** E-03-36/64: onay → `deleteWorkItemSubtask`. */
  async function remove(subtask: WorkItemSubtask): Promise<void> {
    const accepted = await confirm({
      title: subtaskText('subtasks.confirm.title'),
      body: [subtaskText('subtasks.confirm.body', { title: subtask.title })],
      confirmLabel: subtaskText('subtasks.confirm.ok'),
      tone: 'danger',
    })
    if (!accepted) return
    const ref = { target: { ...deps.target() }, workItemId: deps.item().work_item_id }
    await pending.run(subtask.subtask_id, async () =>
      report(await del.submit({ ...ref, subtaskId: subtask.subtask_id })),
    )
  }

  return { isPending: pending.has, patch, toggle, remove, conflict }
}
