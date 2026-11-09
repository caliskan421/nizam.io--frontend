/**
 * W45 form bileşenlerinin ekran metinleri (`workForms.*`): yeni görev (E-03-57), durum menüsü
 * (E-03-44/58), görev silme (E-03-56/64). Sunucu `message` alanı gösterilmez; hata metni kod →
 * `errors.*` (`shared/i18n`). Durum adları E-03-23 tasarım metni (`iade_edildi` = "Geri
 * gönderildi", P5).
 */
import { i18n } from '@/shared/i18n'
import { trWorkForms } from '@/shared/i18n/tr/work'

import type { WorkItemPriority, WorkItemStatus } from '../../model/types'

export { trWorkForms }

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type WorkFormsTextKey = Leaves<typeof trWorkForms>

/** `workForms.*` metni (TR). */
export function formsText(key: WorkFormsTextKey, params?: Record<string, string | number>): string {
  return params ? i18n.global.t(key, params) : i18n.global.t(key)
}

/** Durum adı (E-03-23). */
export function statusLabel(status: WorkItemStatus): string {
  return formsText(`workForms.status.${status}`)
}

/** Öncelik adı (`CreateWorkItemRequest.priority`). */
export function priorityLabel(priority: WorkItemPriority): string {
  return formsText(`workForms.priority.${priority}`)
}
