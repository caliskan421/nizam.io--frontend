import { describe, expect, it } from 'vitest'

import * as publicApi from './public'

describe('deleted-records public yüzü', () => {
  it('rota, tür sabitleri, capability ve metin yardımcısı dışa açık; iç bileşenler değil', () => {
    expect(Object.keys(publicApi).sort()).toEqual(
      [
        'DEFAULT_KIND',
        'DEFAULT_RANGE',
        'DELETED_KINDS',
        'DELETED_RANGES',
        'DELETED_RECORDS_CAPABILITY_ACTIONS',
        'DELETED_RECORDS_CAPABILITY_SOURCES',
        'DELETED_RECORDS_QUERY_KEYS',
        'DELETED_RECORDS_ROUTE',
        'DISABLED_KINDS',
        'deletedRecordsCapabilities',
        'deletedRecordsRoutes',
        'deletedText',
        'isDeletedKind',
        'isDeletedRange',
        'parseKind',
      ].sort(),
    )
  })
})
