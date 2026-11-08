/**
 * Alan alan çakışma çözümü (K5; istemci-akislari §8; `shared/http/mutation/revisions.ts`).
 *
 * 409 `*.edit_conflict` sonrası istemci otomatik tekrar etmez: kendi taslağını (`draft`), ilk
 * okuduğu tabanı (`base`) ve sunucunun yeni değerini (`server`) ayrı tutar; YALNIZ gerçekten
 * çakışan alanları (`conflictingFields`) kullanıcıya seçtirir, diğerleri kendiliğinden birleşir.
 * Seçim sonrası yeni gövde `resolveDraft` ile kurulur ve YENİ TABANLA (sunucunun kaydı; yeni
 * sürüm) yeni bir eylem olarak gönderilir — tekrar değil.
 */
import { conflictingFields } from '@/shared/http/mutation'

export type ConflictChoice = 'mine' | 'theirs'

/** Diyalogda bir satır: alan anahtarı, ekran etiketi ve iki değerin gösterimi. */
export interface ConflictField {
  field: string
  label: string
  mine: string
  theirs: string
}

export type ConflictChoices = Readonly<Record<string, ConflictChoice>>

type Values = Readonly<Record<string, unknown>>

export interface ConflictInput {
  base: Values
  draft: Values
  server: Values
  /** Alan → ekran etiketi; listede olmayan alan çakışmaya girmez. */
  labels: Readonly<Record<string, string>>
  /** Değerin gösterimi (tarih biçimi, enum etiketi…); varsayılan `String`. */
  format?: (field: string, value: unknown) => string
}

function defaultFormat(_field: string, value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return value === null || value === undefined ? '' : JSON.stringify(value)
}

/** Seçtirilecek satırlar (yalnız gerçek çakışmalar, `labels` sırasıyla). */
export function conflictRows(input: ConflictInput): ConflictField[] {
  const fields = Object.keys(input.labels)
  const format = input.format ?? defaultFormat
  return conflictingFields(input.base, input.draft, input.server, fields).map((field) => ({
    field,
    label: input.labels[field] ?? field,
    mine: format(field, input.draft[field]),
    theirs: format(field, input.server[field]),
  }))
}

/** Her satır için seçim yapıldı mı. */
export function allChosen(rows: readonly ConflictField[], choices: ConflictChoices): boolean {
  return rows.every((row) => choices[row.field] === 'mine' || choices[row.field] === 'theirs')
}

/**
 * Yeniden gönderilecek değişiklikler: taslaktaki her alan korunur, yalnız "güncel değer"
 * seçilen alanlar düşer (sunucunun değeri kalır). Taslakta olup sunucuyla zaten aynı olan alan
 * da düşer (yazılacak fark yok).
 */
export function resolveDraft<D extends object>(
  draft: D,
  server: Values,
  choices: ConflictChoices,
): Partial<D> {
  const out: Record<string, unknown> = {}
  for (const [field, value] of Object.entries(draft)) {
    if (choices[field] === 'theirs') continue
    if (Object.is(value, server[field])) continue
    out[field] = value
  }
  return out as Partial<D>
}
