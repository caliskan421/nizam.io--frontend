/**
 * Koordinatörlük kalıcı silme onayından ÖNCE etki okuması (`departmentDeleteImpact`, BE-164).
 * Sonuç üç şeyden biridir: etkiyle kurulmuş onay (`confirm`), satır içi bildirim (`stop`: engel,
 * hata, durum değişti) ya da sessizlik (`quiet`: kapsam/oturum/sahip değişti, istek iptal). Okuma
 * başarısızsa ya da engel varsa onay AÇILMAZ ve DELETE gitmez; kullanıcı Kalıcı sil'e yeniden
 * basarak taze okur. Programlama hataları maskelenmez (ApiError dışı yeniden fırlatılır).
 * `setup` içinde çağrılır (`useQueryClient`, `onScopeDispose`).
 */
import { isCancelledError, useQueryClient } from '@tanstack/vue-query'
import { onScopeDispose, ref, watch, type Ref } from 'vue'

import { ApiError } from '@/shared/errors/api-error'
import { errorText } from '@/shared/i18n'
import { sameScope } from '@/shared/http/mutation'
import { queryKeys } from '@/shared/http/query-keys'
import { useScopeStore } from '@/shared/scope/store'
import { SessionChangedError } from '@/shared/session/query-session'
import type { ConfirmOptions } from '@/shared/ui/confirm'

import { readDepartmentDeleteImpact } from '../api/delete-impact'
import { blockedMessage, impactConfirmBody } from '../model/impact'
import { deletedText } from '../model/messages'
import type { DeletedRow } from '../model/types'

export type ImpactDecision =
  | { kind: 'confirm'; options: ConfirmOptions }
  /** Satır içi bildirim; `refresh`: kayıt artık bu durumda değil, liste yeniden okunur. */
  | { kind: 'stop'; message: string; refresh: boolean }
  | { kind: 'quiet' }

/** Satır içi bildirim yuvası (`RecordNotice` ile aynı şekil; döngüsel içe aktarma olmasın). */
export type NoticeSlot = Ref<{ message: string; departmentsLink: boolean; status?: boolean } | null>

const QUIET: ImpactDecision = { kind: 'quiet' }

function stop(key: Parameters<typeof deletedText>[0], refresh = false): ImpactDecision {
  return { kind: 'stop', message: deletedText(key), refresh }
}

/** Okuma hatası → karar. ApiError dışı (programlama hatası) maskelenmez, yeniden fırlatılır. */
function failureDecision(error: unknown): ImpactDecision {
  if (!(error instanceof ApiError)) throw error
  if (error.status === 404) return stop('impact.gone', true)
  // 401: oturum yaşam döngüsü ele alır (sessiz); 403: yetki yok, yazma yolu da kapalıdır.
  if (error.status === 401) return QUIET
  if (error.status === 403) return stop('impact.forbidden')
  return {
    kind: 'stop',
    message: `${deletedText('impact.failed')} (${errorText(error)})`,
    refresh: false,
  }
}

export function useDeleteImpact() {
  const client = useQueryClient()
  const scope = useScopeStore()
  const reading = ref(false)
  let alive = true
  let departmentId: string | null = null

  function cancel() {
    if (departmentId === null) return
    void client.cancelQueries({
      queryKey: queryKeys.catalog.departmentDeleteImpact(departmentId),
      exact: true,
    })
  }
  // Kapsam değişince bekleyen okuma iptal edilir; sahip sökülünce de.
  watch(() => scope.snapshot, cancel)
  onScopeDispose(() => {
    alive = false
    cancel()
  })

  async function read(row: DeletedRow, base: ConfirmOptions): Promise<ImpactDecision> {
    const before = scope.snapshot
    const outdated = () => !alive || !sameScope(before, scope.snapshot)
    reading.value = true
    departmentId = row.id
    try {
      const impact = await readDepartmentDeleteImpact(client, row.id)
      if (outdated()) return QUIET
      if (!impact.deleted) return stop('impact.notDeleted', true)
      if (impact.permanent_blocked) {
        return { kind: 'stop', message: blockedMessage(impact), refresh: false }
      }
      return { kind: 'confirm', options: { ...base, body: impactConfirmBody(impact) } }
    } catch (error) {
      if (outdated() || isCancelledError(error) || error instanceof SessionChangedError) {
        return QUIET
      }
      return failureDecision(error)
    } finally {
      reading.value = false
      departmentId = null
    }
  }

  /**
   * Onaydan önceki kapı: okuma sürerken "yükleniyor" bildirimi, sonra karar. `null` ≡ onay açılmaz
   * (bildirim yazıldı ya da sessiz); aksi halde etkiyle kurulmuş onay seçenekleri.
   */
  async function gate(
    row: DeletedRow,
    base: ConfirmOptions,
    notice: NoticeSlot,
    afterGone: () => Promise<void>,
  ): Promise<ConfirmOptions | null> {
    notice.value = { message: deletedText('impact.loading'), departmentsLink: false, status: true }
    const decision = await read(row, base)
    notice.value = null
    if (decision.kind === 'confirm') return decision.options
    if (decision.kind === 'stop') {
      notice.value = { message: decision.message, departmentsLink: false }
      if (decision.refresh) await afterGone()
    }
    return null
  }

  return { reading, gate }
}
