/**
 * Öneri tetikleyicisi (E-10-50/61): imleçten önceki "@sözcük" / "#sözcük" parçası öneri açar;
 * seçim o parçayı "@ad " / "#başlık " ile değiştirir (çipin metni gövdeye yazılır, ayrıca
 * yapılandırılmış `mentions[]`/`refs[]` gider). Saf işlevler: yazma çubuğu yalnız çağırır.
 */
export interface Trigger {
  sign: '@' | '#'
  query: string
  /** İşaretin metindeki konumu. */
  start: number
  /** İmleç (değiştirilecek aralığın sonu). */
  end: number
}

const TRIGGER = /(^|\s)([@#])([^\s@#]*)$/u

export function detectTrigger(text: string, caret: number): Trigger | null {
  const before = text.slice(0, caret)
  const match = TRIGGER.exec(before)
  if (!match) return null
  const query = match[3] ?? ''
  const sign = match[2] as '@' | '#'
  return { sign, query, start: before.length - query.length - 1, end: caret }
}

/** Tetikleyiciyi `token` + boşlukla değiştirir; yeni metin ve imleç konumu. */
export function applySuggestion(
  text: string,
  trigger: Trigger,
  token: string,
): { text: string; caret: number } {
  const tail = text.slice(trigger.end)
  const insert = tail.startsWith(' ') ? token : `${token} `
  const next = `${text.slice(0, trigger.start)}${insert}${tail}`
  return { text: next, caret: trigger.start + insert.length }
}

const fold = (value: string): string => value.toLocaleLowerCase('tr-TR')

/** Aday adı, sorguyla BAŞLAYAN bir sözcük taşıyor mu (boş sorgu hepsini kabul eder). */
export function matches(query: string, label: string): boolean {
  const q = fold(query)
  if (q === '') return true
  return fold(label)
    .split(/\s+/)
    .some((word) => word.startsWith(q))
}

export const MAX_SUGGESTIONS = 20
