import { i18n } from '@/shared/i18n'
import { trTaskList } from '@/shared/i18n/tr/work'

export { trTaskList }

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type TaskListTextKey = Leaves<typeof trTaskList>

/** `taskList.*` metni (TR). */
export function taskListText(
  key: TaskListTextKey,
  params: Record<string, string | number> = {},
): string {
  return i18n.global.t(key, params)
}
