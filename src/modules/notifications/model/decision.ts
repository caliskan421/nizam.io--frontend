/**
 * Satır içi karar modeli (BE-146; P88): kabiliyet backend `action.kind`/`state`'inden gelir. Seçili
 * programdan alan TAHMİN EDİLMEZ: görev kararının başlıkları yalnız `Notification.program_id` +
 * `department_id` (üst düzey) ve `subject_ref.id`'dir; eksikse karar buradan verilemez.
 */
import { notificationText, type trNotifications } from '../messages'
import type { NotificationItem } from './types'

type DecisionKey = keyof typeof trNotifications.notifications.rows.decision

const row = (key: DecisionKey, params?: Record<string, string>) =>
  notificationText(`notifications.rows.decision.${key}`, params)

/** Görev kararı için hedef: program ve departman satırın KENDİ alanlarından; eksikse `null`. */
export function taskTarget(item: NotificationItem) {
  const { program_id: programId, department_id: departmentId } = item
  return programId && departmentId ? { programId, departmentId } : null
}

/** `ready`: butonlar etkin; `unavailable`: bağlam eksik (devre dışı + neden); `null`: karar yüzü yok. */
export function decisionOf(item: NotificationItem): 'ready' | 'unavailable' | null {
  const action = item.action
  if (!action || action.state !== 'pending') return null
  if (action.kind === 'review_date_request') return action.request_id ? 'ready' : 'unavailable'
  if (action.kind !== 'approve_task' || item.subject_ref.kind !== 'work_item') return 'unavailable'
  return taskTarget(item) ? 'ready' : 'unavailable'
}

/** Sonuçlanmış karar satırı: sonuç + kim (ben / başka biri); adı olmayan karar sahibi uydurulmaz. */
export function resolvedText(item: NotificationItem, me: string | null): string | null {
  const action = item.action
  if (!action || action.state !== 'resolved') return null
  const resolution = action.resolution
  const outcome = resolution ? row(resolution.outcome) : row('resolved')
  const by = resolution?.decided_by
  if (!by) return outcome
  if (me !== null && by.account_id === me) return row('byMe', { outcome })
  const name = by.full_name?.trim()
  return name ? row('byOther', { outcome, name }) : outcome
}
