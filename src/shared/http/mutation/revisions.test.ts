import { describe, expect, it } from 'vitest'

import {
  NOTE_REVISION_GROUPS,
  SUBTASK_REVISION_GROUPS,
  WORK_ITEM_REVISION_GROUPS,
  conflictingFields,
  withExpectedRevisions,
} from './revisions'

const base = {
  title: 'A',
  priority: 'orta',
  end_on: '2026-11-10',
  edit_revision: 3,
  dates_revision: 7,
}

describe('withExpectedRevisions', () => {
  it('yalnız gövdede alanı olan grubun sürümü eklenir', () => {
    expect(withExpectedRevisions({ title: 'B' }, base, WORK_ITEM_REVISION_GROUPS)).toEqual({
      title: 'B',
      expected_revision: 3,
    })
    expect(
      withExpectedRevisions({ end_on: '2026-11-12' }, base, WORK_ITEM_REVISION_GROUPS),
    ).toEqual({ end_on: '2026-11-12', expected_dates_revision: 7 })
    expect(
      withExpectedRevisions(
        { title: 'B', start_on: '2026-11-02' },
        base,
        WORK_ITEM_REVISION_GROUPS,
      ),
    ).toEqual({
      title: 'B',
      start_on: '2026-11-02',
      expected_revision: 3,
      expected_dates_revision: 7,
    })
  })

  it('alt görevde yalnız done gönderilirse sürüm eklenmez; notta content her zaman', () => {
    expect(withExpectedRevisions({ done: true }, base, SUBTASK_REVISION_GROUPS)).toEqual({
      done: true,
    })
    expect(withExpectedRevisions({ content: 'x' }, base, NOTE_REVISION_GROUPS)).toEqual({
      content: 'x',
      expected_revision: 3,
    })
  })

  it('tabanda sürüm yoksa programlama hatası', () => {
    expect(() => withExpectedRevisions({ title: 'B' }, {}, WORK_ITEM_REVISION_GROUPS)).toThrow(
      /edit_revision/,
    )
  })
})

describe('conflictingFields', () => {
  it('yalnız iki tarafın da değiştirdiği ve farklı olduğu alanlar', () => {
    const draft = { title: 'Benim', priority: 'yuksek', end_on: '2026-11-11' }
    const server = { title: 'Onun', priority: 'orta', end_on: '2026-11-11' }
    expect(conflictingFields(base, draft, server)).toEqual(['title'])
  })

  it('alan listesi verilebilir; taslakta olmayan alan sayılmaz', () => {
    expect(
      conflictingFields(base, { title: 'B' }, { title: 'C', priority: 'acil' }, [
        'title',
        'priority',
      ]),
    ).toEqual(['title'])
  })
})
