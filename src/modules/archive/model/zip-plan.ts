/**
 * Dönem arşivi ZIP'inin onay penceresi içeriği (E-13-10; 01h): kök klasör adı ve klasör ağacı
 * satırları (`include_reports=true` düzeni, RECORDS-K43 / BE-124):
 *
 *   <Program>-Donem-Arsivi-YYYY-MM-DD/
 *     00-Genel/Donem-Raporu.pdf
 *     NN-<Departman>/Koordinatorluk-Raporu.pdf + Dosyalar/<görev>/<dosya>
 *     EKSIK-DOSYALAR.txt (yalnız eksik nesne varsa)
 *     NOT.txt (40'tan fazla departmanda ayrı birim PDF'i yerine)
 *
 * Adlar ASCII'ye indirgenmiş ÖNİZLEMEDİR (gerçek ad sunucudan, `Content-Disposition`); sayılar
 * `programArchiveFolders` yanıtındandır, sahte değer yoktur. Departmanlar ada göre (tr-TR)
 * numaralanır.
 */
import type { ArchiveFolder } from './types'

/** Bu sayının üstünde birim raporları ayrı PDF değil `NOT.txt` ile anılır (sözleşme). */
export const REPORT_PDF_DEPARTMENT_LIMIT = 40

const ASCII: Readonly<Record<string, string>> = {
  ç: 'c',
  Ç: 'C',
  ğ: 'g',
  Ğ: 'G',
  ı: 'i',
  İ: 'I',
  ö: 'o',
  Ö: 'O',
  ş: 's',
  Ş: 'S',
  ü: 'u',
  Ü: 'U',
}

/** Klasör adı parçası: Türkçe harfler ASCII, ayraçlar tek `-`. */
export function zipSlug(name: string): string {
  return name
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, (c) => ASCII[c] ?? c)
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Kurulum saat diliminde bugünün tarihi (`YYYY-MM-DD`). */
export function zipDate(now: Date, timeZone: string | null | undefined): string {
  const format = (zone: string) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now)
  try {
    return format(timeZone ?? 'Europe/Istanbul')
  } catch {
    return format('Europe/Istanbul')
  }
}

export interface ZipDepartmentRow {
  /** `NN-Ad` klasör adı (sonda `/` yok). */
  folder: string
  files: number
}

export interface ZipPlan {
  root: string
  departments: ZipDepartmentRow[]
  /** `false`: koordinatörlük sayısı sınırı aştı → birim raporları yerine `NOT.txt`. */
  unitReports: boolean
}

const collator = new Intl.Collator('tr-TR', { sensitivity: 'base' })

export function zipPlan(
  programName: string,
  date: string,
  folders: readonly Pick<ArchiveFolder, 'name' | 'file_count' | 'is_virtual'>[],
): ZipPlan {
  const real = folders.filter((f) => !f.is_virtual).sort((a, b) => collator.compare(a.name, b.name))
  const width = Math.max(2, String(real.length).length)
  return {
    root: `${zipSlug(programName) || 'Program'}-Donem-Arsivi-${date}`,
    departments: real.map((f, i) => ({
      folder: `${String(i + 1).padStart(width, '0')}-${zipSlug(f.name) || 'Koordinatorluk'}`,
      files: f.file_count,
    })),
    unitReports: real.length <= REPORT_PDF_DEPARTMENT_LIMIT,
  }
}
