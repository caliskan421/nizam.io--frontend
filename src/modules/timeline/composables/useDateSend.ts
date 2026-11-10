/**
 * Bekleyen tarih değişikliğinin GÖNDERİMİ (P8; `backend.md` §2): `DateChange` yükünü yazma
 * eylemine çevirir, sonucu bildirir. Politika kararı `useDateChange`'de verilmiştir (`write`);
 * burada yalnız uç çağrısı vardır.
 *
 *  - `request` → `requestDateChange`; `extend` → `extendWorkItem`; `update` → `updateWorkItem`.
 *    Üçü de kullanıcının GÖRDÜĞÜ `dates_revision`'ı (Gantt satırı; BE-053) `expected_dates_revision`
 *    olarak taşır: ön `getWorkItem` okuması YOK. Arada tarih değiştiyse 409 `work.edit_conflict`
 *    (alan alan bildirim, yeniden okuma).
 *  - `extend` ve `request` eylem başına `Idempotency-Key` taşır; sonuç bilinmiyorsa aynı anahtarla
 *    tek tekrar (BE-056, `api/mutations.ts`). `update` anahtarsızdır (sürüm korur): kör tekrar
 *    yok, sarmalayıcı yeniden okur. 409'lar ve çakışmada ek olarak yeniden okunur.
 *  - Yaşam döngüsü (CX-F3-Ö-04, ortak-kurallar §7 Ö-07): sahibi sökülmüş sürüklemenin sonucu
 *    (`reachesOwner`) ya da taze okuması bildirim ve ek geçersizleme üretmez; ön okuma sonrası
 *    kapsam/oturum değişmişse de ek okuma başlamaz. Belirsiz sonucun uzlaştırması veri
 *    katmanında (`useTimelineMutation`) kalır; burada yalnız 409/çakışma sonrası okuma vardır.
 *  - Yarışta oluşan `work.edit_conflict`: panelin kullandığı alan çözümleyicisinin satır
 *    hesabı (`conflictRows`; taban = sürüklemenin `before`'u, taslak = `after`, sunucu = güncel
 *    görev) çakışan ALANLARI adıyla bildirir. Çözüm diyaloğu (`useConflictResolver`) burada
 *    AÇILMAZ: sürükleme bırakmasından 5 sn sonra, kullanıcı başka işteyken kendiliğinden bir
 *    seçim penceresi çıkması ve onun ardından yeni yazma, yeni bir karar olurdu; diyalog
 *    sahibi görev panelidir (güncel görev yeniden okunur, kullanıcı oradan Kaydet ile çözer).
 *  - Bildirim: başarı özel metin (yüze göre), diğer sonuçlar ortak `notifyOutcome`. `useToast`
 *    kurulumda alınır (sahip sökülünce bildirim düşer; KESİN 26a).
 */
import { useQueryClient, type QueryClient } from '@tanstack/vue-query'

import { authSession } from '@/shared/http'
import { ownerLife, reachesOwner, sameScope, type OwnerLife } from '@/shared/http/mutation'
import { conflictRows } from '@/shared/ui/conflict'

import type { ActionContext, MutationOutcome } from '@/shared/http/mutation'
import { queryKeys } from '@/shared/http/query-keys'
import type { ScopeSnapshot } from '@/shared/scope/scope'
import { useScopeStore } from '@/shared/scope/store'
import { useToast } from '@/shared/ui'
import { notifyOutcome } from '@/shared/ui/confirm'

import { conflictFormat, conflictLabels, serverItem } from '../components/panel/use-date-actions'
import { useExtendWorkItem, useRequestDateChange, useUpdateWorkItemDates } from '../api'
import type { DatePolicy, DateWrite } from '../model/capabilities'
import type { DayRange } from '../model/date-change'
import { dragText } from './drag-messages'

/** Bekleyen değişikliğin yükü. */
export interface DateChange {
  workItemId: string
  title: string
  policy: DatePolicy
  write: DateWrite
  before: DayRange
  after: DayRange
  /** Sürüklemenin başladığı andaki Gantt satırı `dates_revision`'ı (BE-053; birleşen bırakmalarda ilki). */
  datesRevision: number
  /** Görevin KENDİ kapsamı. */
  target: { programId: string; departmentId: string }
}

type Outcome = MutationOutcome<unknown, unknown, unknown>
type Toast = ReturnType<typeof useToast>

interface Deps {
  client: QueryClient
  toast: Toast
  requestDate: ReturnType<typeof useRequestDateChange>
  extend: ReturnType<typeof useExtendWorkItem>
  update: ReturnType<typeof useUpdateWorkItemDates>
  owner: OwnerLife
  /** Güncel etki kapsamı (eylemin yakalanmış kapsamıyla karşılaştırılır; Ö-04). */
  readScope: () => ScopeSnapshot
}

function reread(client: QueryClient, scope: ScopeSnapshot, workItemId: string): void {
  void client.invalidateQueries({ queryKey: queryKeys.gantt.all(scope) })
  void client.invalidateQueries({ queryKey: queryKeys.dateRequests.all(scope) })
  void client.invalidateQueries({
    queryKey: queryKeys.workItems.item(scope, workItemId),
    exact: true,
  })
}

function successText({ write, title }: DateChange, data: unknown): string {
  if (write.kind === 'request') return dragText('timeline.drag.sent.requested', { title })
  if (write.kind === 'update') return dragText('timeline.drag.sent.changed', { title })
  const count = (data as { cascade_count?: number } | undefined)?.cascade_count ?? 0
  const key = count > 0 ? 'timeline.drag.sent.extendedCascade' : 'timeline.drag.sent.extended'
  return dragText(key, { title, days: write.days, count })
}

/**
 * Ek okuma/bildirim yalnız sahip yaşıyorsa, eylemin oturumu sürüyorsa VE kapsam eylemin
 * yakalanmış kapsamıyla aynıysa (Ö-07, CX-F3-Ö-04): ön okuma sırasında kapsam A→B olduysa
 * sahip bağlı kalsa da eski kapsam adına yazma/bildirim/okuma başlamaz.
 */
const live = (deps: Deps, context: ActionContext): boolean =>
  deps.owner.alive() &&
  (context.generation === null || context.generation === authSession.generation) &&
  (!context.scope || sameScope(context.scope, deps.readScope()))

/** Güncel görev elde ise çakışan alan adları (yoksa boş). */
function conflictFieldNames(change: DateChange, server: unknown): string[] {
  const item = serverItem(server)
  if (!item || change.write.kind !== 'update') return []
  const { before, after } = change
  return conflictRows({
    base: { start_on: before.start, end_on: before.end },
    draft: { start_on: after.start, end_on: after.end },
    server: { start_on: item.start_on, end_on: item.end_on },
    labels: conflictLabels(),
    format: conflictFormat,
  }).map((row) => row.label)
}

const needsReread = (o: Outcome): boolean =>
  o.kind === 'edit_conflict' ||
  o.kind === 'conflict_retry' ||
  (o.kind === 'failed' && o.error.status === 409)

function settle(deps: Deps, change: DateChange, context: ActionContext, outcome: Outcome): void {
  if (!reachesOwner(outcome)) return
  if (outcome.kind === 'success') {
    deps.toast.push({ message: successText(change, outcome.data) })
    return
  }
  const fields = outcome.kind === 'edit_conflict' ? conflictFieldNames(change, outcome.server) : []
  if (fields.length > 0) {
    const message = dragText('timeline.drag.editConflict', {
      title: change.title,
      fields: fields.join(', '),
    })
    deps.toast.push({ message, tone: 'danger', timeout: 0 })
  } else {
    notifyOutcome(outcome)
  }
  if (needsReread(outcome) && context.scope && live(deps, context))
    reread(deps.client, context.scope, change.workItemId)
}

/** `updateWorkItem` yolu: sürümlü yazma (sürüm = kullanıcının gördüğü Gantt satırı sürümü). */
async function sendUpdate(
  deps: Deps,
  change: DateChange,
  context: ActionContext,
  dates: { start_on: string; end_on: string },
): Promise<void> {
  const { target, workItemId, datesRevision } = change
  const vars = { target, workItemId, base: { dates_revision: datesRevision }, dates }
  settle(deps, change, context, await deps.update.submit(vars, { context }))
}

async function dispatch(deps: Deps, change: DateChange, context: ActionContext): Promise<void> {
  const { write, target, workItemId } = change
  const opts = { context }
  if (write.kind === 'update') {
    return sendUpdate(deps, change, context, { start_on: write.start_on, end_on: write.end_on })
  }
  const outcome =
    write.kind === 'request'
      ? await deps.requestDate.submit(
          {
            target,
            workItemId,
            newStartOn: write.newStartOn,
            newEndOn: write.newEndOn,
            expectedDatesRevision: change.datesRevision,
          },
          opts,
        )
      : await deps.extend.submit(
          { target, workItemId, days: write.days, expectedDatesRevision: change.datesRevision },
          opts,
        )
  settle(deps, change, context, outcome)
}

export function useDateSend(): (change: DateChange, context: ActionContext) => Promise<void> {
  const scopeStore = useScopeStore()
  const deps: Deps = {
    client: useQueryClient(),
    toast: useToast(),
    requestDate: useRequestDateChange(),
    extend: useExtendWorkItem(),
    update: useUpdateWorkItemDates(),
    owner: ownerLife(),
    readScope: () => scopeStore.snapshot,
  }
  return (change, context) => dispatch(deps, change, context)
}
