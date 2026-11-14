import { i18n } from '@/shared/i18n'
import { trNotifications } from '@/shared/i18n/tr/notifications'

export { trNotifications }

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type NotificationTextKey = Leaves<typeof trNotifications>

/** `notifications.*` metni (TR). Sunucu `message` alanı kullanılmaz. */
export function notificationText(
  key: NotificationTextKey,
  params: Record<string, string | number> = {},
): string {
  return i18n.global.t(key, params)
}
