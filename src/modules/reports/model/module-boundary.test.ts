// Modül döngüsü koruması (W142 KUSUR 4): work, reports'u bağlar (`DetailActions` → `TaskReportButton`);
// reports work'e geri bağlanmaz (work ↔ reports döngüsü). Ortak okuyucular shared'dadır.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const ROOT = resolve(process.cwd(), 'src/modules/reports')

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sources(path)
    return /\.(ts|vue)$/.test(name) && !/\.test\.ts$/.test(name) && !path.includes('__tests__')
      ? [path]
      : []
  })
}

describe('reports modülü sınırı', () => {
  it('work modülünden içe aktarma yok (döngü kırıldı)', () => {
    const offenders = sources(ROOT).filter((file) =>
      /from '@\/modules\/work(\/|')/.test(readFileSync(file, 'utf8')),
    )
    expect(offenders).toEqual([])
  })
})
