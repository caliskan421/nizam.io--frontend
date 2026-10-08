import { createI18n } from 'vue-i18n'

import type { ApiError } from '@/shared/errors/api-error'

import { trErrors } from './tr/errors'
import { trTerms } from './tr/terms'

/** "a.b" anahtarlarını vue-i18n'in iç içe ileti ağacına çevirir. */
export function nest(flat: Record<string, string>): Record<string, unknown> {
  const tree: Record<string, unknown> = {}
  for (const [key, text] of Object.entries(flat)) {
    const parts = key.split('.')
    let node = tree
    for (const part of parts.slice(0, -1)) {
      const next = (node[part] ??= {})
      if (typeof next !== 'object') throw new Error(`i18n: anahtar çakışması: ${key}`)
      node = next as Record<string, unknown>
    }
    node[parts[parts.length - 1]!] = text
  }
  return tree
}

export const messages = {
  tr: { errors: nest(trErrors), ...trTerms },
}

/** v1 yalnız TR; altyapı çok dilli (platform.md §5 web sorusu 6). */
export const i18n = createI18n({
  legacy: false,
  locale: 'tr',
  fallbackLocale: 'tr',
  messages,
  missingWarn: import.meta.env.DEV,
  fallbackWarn: false,
})

/** Kullanıcıya gösterilecek hata metni; bilinmeyen kod (yeni etiket) genel metne düşer. */
export function errorText(error: Pick<ApiError, 'messageKey'>): string {
  const g = i18n.global
  return g.te(error.messageKey) ? g.t(error.messageKey) : g.t('errors.platform.internal')
}
