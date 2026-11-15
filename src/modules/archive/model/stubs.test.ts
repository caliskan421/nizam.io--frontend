import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import {
  CREATE_TAG,
  FOLDER_SUMMARY,
  MOVE_FILE,
  RESTORE_FILE,
  SEARCH_SCOPE,
  THUMBNAIL,
  UNATTACHED_UPLOAD,
} from './stubs'

const REGISTRY = readFileSync('docs/backend-eksikleri/kayit.md', 'utf8')
const source = readFileSync('src/modules/archive/model/stubs.ts', 'utf8')

describe('arşiv designStub olguları', () => {
  it('kullanılan her BE kimliği kayıtta açık işlev eksiği (tests/lint/design-stub ile aynı denetim)', () => {
    const ids = [...source.matchAll(/designStub\('(BE-\d{3})'/g)].map((m) => m[1]!)
    expect(ids.sort()).toEqual(
      ['BE-024', 'BE-025', 'BE-026', 'BE-069', 'BE-075', 'BE-076', 'BE-077'].sort(),
    )
    for (const id of ids) {
      const line = REGISTRY.split('\n').find((l) => l.startsWith(`| ${id} |`))
      expect(line, id).toBeDefined()
      expect(line, id).toMatch(/\| açık \|?\s*$/)
    }
  })

  it('olgular yalnız "kullanılabilir değil" bilgisidir; sahte sayı/tarih/kişi taşımaz', () => {
    // BE-025 kısmi: görev sayısı/bayt/son yükleme canlandı; yalnız depolama dağılımı kaldı.
    expect(FOLDER_SUMMARY).toEqual({ storageBreakdown: false })
    for (const stub of [UNATTACHED_UPLOAD, CREATE_TAG, MOVE_FILE]) {
      expect(stub).toEqual({ available: false })
    }
    expect(THUMBNAIL).toEqual({ grid: false, fullscreen: false })
    expect(RESTORE_FILE).toEqual({ available: false, permanentDelete: true })
    expect(SEARCH_SCOPE).toEqual({ fileNameOnly: true })
  })
})
