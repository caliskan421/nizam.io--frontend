import { describe, expect, it } from 'vitest'

import {
  EXPORT_FALLBACK_NAME,
  exportKinds,
  EXPORT_MAX_ROWS,
  EXPORT_PATH,
  exportQuery,
  exportTarget,
} from './export'

const base = { programId: 'p1', kind: 'gorev' as const, query: {} }

describe('CSV bilet hedefi (BE-116; hedef sorgu dizesiyle bire bir)', () => {
  it('tür eşlemesi sözleşme değerleriyle sabit; tavan 10 000', () => {
    expect(exportKinds('gorev')).toBe('tasks')
    expect(exportKinds('toplanti')).toBe('meetings')
    expect(exportKinds('koordinatorluk')).toBe('departments')
    expect(exportKinds('kullanici')).toBe('accounts')
    expect(exportKinds('altgorev')).toBe('subtasks')
    expect(exportKinds('dosya')).toBe('files')
    // Birleşik görünümler açık liste gönderir; `notes` ayrı tür değildir (iki kez sayılmaz).
    expect(exportKinds('notgundem')).toBe('task_notes,meeting_notes,agenda_items')
    expect(exportKinds('tumu')).toBe(
      'tasks,subtasks,files,meetings,task_notes,meeting_notes,agenda_items,departments,accounts',
    )
    expect(EXPORT_MAX_ROWS).toBe(10_000)
    expect(EXPORT_PATH).toBe('/v1/admin/deleted/export')
  })

  it('süzgeçsiz: yalnız etkin tür ve departman kapsamı program', () => {
    expect(exportQuery(base)).toBe('kinds=tasks&scope=program')
    expect(exportTarget(base)).toEqual({
      method: 'GET',
      path: '/v1/admin/deleted/export?kinds=tasks&scope=program',
      headers: { 'X-Nizamio-Program': 'p1' },
      fallbackName: EXPORT_FALLBACK_NAME,
    })
  })

  it('ekran süzgeçleri sabit sırayla aynen gider; sıra (sort/order) CSV’ye taşınmaz', () => {
    const request = {
      programId: 'p1',
      kind: 'toplanti' as const,
      query: {
        q: 'fuar & şölen',
        deleted_from: '2026-11-11T21:00:00Z',
        deleted_by: 'a7',
        department_id: 'd1',
        sort: 'name' as const,
        order: 'asc' as const,
      },
    }
    expect(exportQuery(request)).toBe(
      'kinds=meetings&scope=program&q=fuar+%26+%C5%9F%C3%B6len&deleted_from=2026-11-11T21%3A00%3A00Z&deleted_by=a7&department_id=d1',
    )
  })

  it('koordinatörlük türünde department_id gitmez (sunucu yok sayar)', () => {
    const request = {
      programId: 'p1',
      kind: 'koordinatorluk' as const,
      query: { department_id: 'd1', q: 'x' },
    }
    expect(exportQuery(request)).toBe('kinds=departments&scope=program&q=x')
  })

  it('dört tür dört ayrı hedef (birleşik liste yok)', () => {
    const paths = (['gorev', 'toplanti', 'koordinatorluk', 'kullanici'] as const).map(
      (kind) => exportTarget({ ...base, kind }).path,
    )
    expect(new Set(paths).size).toBe(4)
  })
})
