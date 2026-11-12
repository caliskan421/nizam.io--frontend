import { describe, expect, it } from 'vitest'

import {
  ARCHIVE_FOLDER_QUERY_KEYS,
  ARCHIVE_FOLDER_ROUTE,
  ARCHIVE_QUERY_KEYS,
  ARCHIVE_ROUTE,
  archiveRoutes,
} from './routes'

describe('arşiv rotaları', () => {
  it('iki S3 rota kayıtlı; sayfa gövdesinden bağımsız (KESİN 22)', () => {
    expect(archiveRoutes.map(({ name, path, meta }) => ({ name, path, meta }))).toEqual([
      { ...ARCHIVE_ROUTE, meta: { scope: 'S3' } },
      { ...ARCHIVE_FOLDER_ROUTE, meta: { scope: 'S3' } },
    ])
    expect(archiveRoutes.every((route) => typeof route.component === 'function')).toBe(true)
  })

  it('URL süzgeç adları K10 satırlarındaki gibi', () => {
    expect(ARCHIVE_QUERY_KEYS).toEqual(['q', 'tur', 'sirala'])
    expect(ARCHIVE_FOLDER_QUERY_KEYS).toEqual(['gorev', 'etiket', 'gorunum', 'dosya', 'q'])
  })
})
