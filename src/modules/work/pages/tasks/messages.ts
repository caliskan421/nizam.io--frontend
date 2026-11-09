import { i18n } from '@/shared/i18n'
import { trTasksPage } from '@/shared/i18n/tr/work'

export { trTasksPage }

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type TasksPageTextKey = Leaves<typeof trTasksPage>

/** `tasksPage.*` metni (TR). */
export function tasksText(
  key: TasksPageTextKey,
  params: Record<string, string | number> = {},
): string {
  return i18n.global.t(key, params)
}
