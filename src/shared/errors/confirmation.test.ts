import { describe, expect, it } from 'vitest'

import { extractTaskTitles } from './confirmation'

describe('extractTaskTitles', () => {
  it('yalnız organization.task_title alan kodunun message değeri (görev başlığı) okunur', () => {
    expect(
      extractTaskTitles({
        code: 'organization.confirmation_required',
        message: 'sunucu metni',
        fields: [
          { field: 'work_item', code: 'organization.task_title', message: ' Rapor yaz ' },
          { field: 'role', code: 'organization.input_invalid', message: 'gösterilmez' },
          { field: 'work_item', code: 'organization.task_title', message: '' },
          { field: 'work_item', code: 'organization.task_title' },
          null,
          { field: 'work_item', code: 'organization.task_title', message: 'Sunum' },
        ],
      }),
    ).toEqual(['Rapor yaz', 'Sunum'])
  })

  it('zarf değilse boş', () => {
    expect(extractTaskTitles(null)).toEqual([])
    expect(extractTaskTitles('metin')).toEqual([])
    expect(extractTaskTitles({ code: 'x' })).toEqual([])
    expect(extractTaskTitles({ fields: 'x' })).toEqual([])
  })
})
