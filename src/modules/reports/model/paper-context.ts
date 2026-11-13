/**
 * Kâğıt bağlamı: dönem raporunun her sayfasında tekrarlanan program adı, kısa ad ve oluşturulma
 * anı (kurulum saat diliminde). Program yılı `Program.year`'dan (`useStanding().programs`), kısa ad
 * `short_name` (yoksa baş harfler; BE-001 bağlandı). Konum alanı yoktur (gizli, E-13-20).
 */
import { initials, instantDate, instantDateTime, upper } from './format'

export interface PaperContext {
  program: string
  programUpper: string
  mark: string
  year: number | null
  /** `gg.aa.yyyy ss:dd`; an geçersizse `null`. */
  generatedAt: string | null
  /** Önizlemenin açıldığı gün (`gg.aa.yyyy`; altlık). */
  today: string | null
  timeZone: string
}

export function paperContext(input: {
  program: string
  shortName: string | null
  year: number | null
  generatedAt: string | null
  now: Date
  timeZone: string
}): PaperContext {
  return {
    program: input.program,
    programUpper: upper(input.program),
    mark: input.shortName ?? initials(input.program),
    year: input.year,
    generatedAt: input.generatedAt ? instantDateTime(input.generatedAt, input.timeZone) : null,
    today: instantDate(input.now.toISOString(), input.timeZone),
    timeZone: input.timeZone,
  }
}
