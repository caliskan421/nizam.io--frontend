import { TOKENS, type TokenName } from './tokens.gen'

/** Token'ın CSS başvurusu: `cssVar('bg-surface')` → `var(--bg-surface)`. Ad üretilmiş listeden denetlenir. */
export function cssVar(name: TokenName): string {
  return `var(--${name})`
}

/**
 * Temasız px token'ının sayı değeri (ör. medya sorgusu için `tokenPx('rp-narrow-max')` → 900).
 * Değer px değilse ya da temaya göre değişiyorsa hata: sessiz varsayılan yok.
 */
export function tokenPx(name: TokenName): number {
  const { dark, light } = TOKENS[name]
  const match = /^(\d+(?:\.\d+)?)px$/.exec(dark)
  if (dark !== light || !match) throw new Error(`tokenPx: '${name}' temasız px değil (${dark})`)
  return Number(match[1])
}
