import { createI18n } from 'vue-i18n'

import type { ApiError } from '@/shared/errors/api-error'

import { trErrors } from './tr/errors'
import { trMutation } from './tr/mutation'
import { trTerms } from './tr/terms'
import { trHome } from './tr/home'
import { trSide, trTopbar } from './tr/shell'
import { trStates } from './tr/states'
import { trConfirm, trConflict, trUi } from './tr/ui'
import {
  trNotes,
  trSubtasks,
  trTaskList,
  trTasksPage,
  trWork,
  trWorkDetail,
  trWorkFiles,
  trWorkForms,
} from './tr/work'

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

type Tree = { readonly [key: string]: string | Tree }
type MessageTree = { [key: string]: string | MessageTree }

/**
 * İleti ağaçlarını derin birleştirir (aynı kök, ör. `work.*`, birden çok dosyadan gelir). Aynı
 * yaprak iki kez tanımlanırsa ya da yaprak ile dal çakışırsa hata: sessiz üzerine yazma yok.
 */
export function mergeTrees(...trees: Tree[]): MessageTree {
  const out: MessageTree = {}
  const into = (target: MessageTree, source: Tree, path: string) => {
    for (const [key, value] of Object.entries(source)) {
      const prev = target[key]
      const where = `${path}${key}`
      if (typeof value === 'string' || typeof prev === 'string') {
        if (prev !== undefined) throw new Error(`i18n: anahtar çakışması: ${where}`)
        target[key] = value
        continue
      }
      const node = prev ?? (target[key] = {})
      into(node, value, `${where}.`)
    }
  }
  for (const tree of trees) into(out, tree, '')
  return out
}

/** Statik TR ağacı: çalışma anında ağaca ileti eklenmez (tek kaynak bu dosya). */
export const messages = {
  tr: mergeTrees(
    { errors: nest(trErrors) as Tree },
    trTerms,
    trMutation,
    trUi,
    trConfirm,
    trConflict,
    trSide,
    trTopbar,
    trStates,
    trHome,
    trWork,
    trTasksPage,
    trTaskList,
    trWorkDetail,
    trWorkForms,
    trSubtasks,
    trNotes,
    trWorkFiles,
  ),
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
