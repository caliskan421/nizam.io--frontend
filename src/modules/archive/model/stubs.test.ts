import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import {
  ADMIN_FOLDER_LEVEL,
  CREATE_TAG,
  FILTERED_TOTAL,
  FOLDER_SUMMARY,
  MOVE_FILE,
  RESTORE_FILE,
  RETAG_FILE,
  SEARCH_SCOPE,
  THUMBNAIL,
  UNATTACHED_UPLOAD,
  UPLOADER_NAME_IN_LIST,
  UPLOAD_DATE,
} from './stubs'

const REGISTRY = readFileSync('docs/backend-eksikleri/kayit.md', 'utf8')
const source = readFileSync('src/modules/archive/model/stubs.ts', 'utf8')

describe('arşiv designStub olguları', () => {
  it('kullanılan her BE kimliği kayıtta açık işlev eksiği (tests/lint/design-stub ile aynı denetim)', () => {
    const ids = [...source.matchAll(/designStub\('(BE-\d{3})'/g)].map((m) => m[1]!)
    expect(ids.sort()).toEqual(
      [
        'BE-024',
        'BE-025',
        'BE-026',
        'BE-069',
        'BE-070',
        'BE-071',
        'BE-072',
        'BE-073',
        'BE-074',
        'BE-075',
        'BE-076',
        'BE-077',
      ].sort(),
    )
    for (const id of ids) {
      const line = REGISTRY.split('\n').find((l) => l.startsWith(`| ${id} |`))
      expect(line, id).toBeDefined()
      expect(line, id).toMatch(/\| açık \|?\s*$/)
    }
  })

  it('olgular yalnız "kullanılabilir değil" bilgisidir; sahte sayı/tarih/kişi taşımaz', () => {
    expect(ADMIN_FOLDER_LEVEL).toMatchObject({ recentFiles: false, globalSearch: false })
    expect(ADMIN_FOLDER_LEVEL.emptyKey).toBe('archive.shared.selectTask')
    expect(FOLDER_SUMMARY).toEqual({
      taskCount: false,
      totalBytes: false,
      lastUploadedAt: false,
      storageBreakdown: false,
    })
    for (const stub of [
      UNATTACHED_UPLOAD,
      UPLOAD_DATE,
      UPLOADER_NAME_IN_LIST,
      FILTERED_TOTAL,
      CREATE_TAG,
      RETAG_FILE,
      MOVE_FILE,
    ]) {
      expect(stub).toEqual({ available: false })
    }
    expect(THUMBNAIL).toEqual({ grid: false, fullscreen: false })
    expect(RESTORE_FILE).toEqual({ available: false, permanentDelete: true })
    expect(SEARCH_SCOPE).toEqual({ fileNameOnly: true })
  })
})
