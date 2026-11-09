import { i18n } from '@/shared/i18n'
import { trTimeline } from '@/shared/i18n/tr/timeline'

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

/** `timeline.page.*` ve `timeline.frame.*` anahtarları (W93 alt ağaçları; tür denetimli). */
export type TimelineFrameTextKey = Leaves<
  Pick<(typeof trTimeline)['timeline'], 'page' | 'frame'>,
  'timeline.'
>

/** Zaman çizelgesi çerçevesi metni (TR; tek statik ağaç `trTimeline`). */
export function frameText(
  key: TimelineFrameTextKey,
  params: Record<string, string | number> = {},
): string {
  return i18n.global.t(key, params)
}
