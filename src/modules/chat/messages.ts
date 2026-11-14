import { i18n } from '@/shared/i18n'
import { trChat } from '@/shared/i18n/tr/chat'

export { trChat }

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type ChatTextKey = Leaves<typeof trChat>

/** `chat.*` metni (TR). Sunucu `message` alanı kullanılmaz. */
export function chatText(key: ChatTextKey, params: Record<string, string | number> = {}): string {
  return i18n.global.t(key, params)
}
