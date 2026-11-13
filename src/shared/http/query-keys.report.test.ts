// F6 rapor okuyucuları (W136): `report.*` anahtar ailesi ve geçersizleme ilişkileri (KESİN 29).
// `docs/ekranlar/13-raporlar/backend.md` §5 + ortak-kurallar §6: görev/toplantı yazmaları kendi
// rapor ayrıntısını ve programın panosunu/dönem raporunu yeniden okutur; başka programa ve
// ilgisiz kayda dokunulmaz (K2).
import { QueryClient, type QueryKey } from '@tanstack/vue-query'
import { describe, expect, it } from 'vitest'

import type { ScopeSnapshot } from '@/shared/scope/scope'

import {
  invalidationFilters,
  isScopedQueryKey,
  queryKeys,
  resourcesInvalidatedBy,
  type InvalidationContext,
  type OperationId,
} from './query-keys'

const S: ScopeSnapshot = { programId: 'p1', departmentId: null }
const COORD: ScopeSnapshot = { programId: 'p1', departmentId: 'd9' }
const OTHER: ScopeSnapshot = { programId: 'p2', departmentId: null }

function hits(
  operation: OperationId,
  keys: QueryKey[],
  ctx: InvalidationContext = {},
  scope: ScopeSnapshot = S,
): QueryKey[] {
  const client = new QueryClient()
  for (const key of keys) client.setQueryData(key, 1)
  for (const filter of invalidationFilters(operation, scope, ctx)) {
    void client.invalidateQueries(filter)
  }
  return keys.filter((key) => client.getQueryState(key)?.isInvalidated)
}

describe('report.* anahtar ailesi', () => {
  it('hepsi kapsamlıdır (kapsam değişince düşer, K2)', () => {
    for (const key of [
      queryKeys.report.season(S),
      queryKeys.report.workload(S),
      queryKeys.report.meeting(S, 'm1'),
      queryKeys.report.task(S, 't1'),
    ]) {
      expect(isScopedQueryKey(key)).toBe(true)
    }
  })

  it('anahtar biçimi: dashboard mevcut adıyla, yenileri aynı aile altında', () => {
    const root = ['nizamio', { program: 'p1', department: null }]
    expect(queryKeys.report.dashboard(S)).toEqual([...root, 'report', 'dashboard'])
    expect(queryKeys.report.season(S)).toEqual([...root, 'report', 'season'])
    expect(queryKeys.report.workload(S)).toEqual([...root, 'report', 'workload'])
    expect(queryKeys.report.meeting(S, 'm1')).toEqual([...root, 'report', 'meeting', 'm1'])
    expect(queryKeys.report.task(S, 't1')).toEqual([...root, 'report', 'task', 't1'])
  })

  it('kayıt kimliği anahtarı ayırır', () => {
    expect(queryKeys.report.task(S, 'a')).not.toEqual(queryKeys.report.task(S, 'b'))
    expect(queryKeys.report.meeting(S, 'a')).not.toEqual(queryKeys.report.task(S, 'a'))
  })
})

describe('görev yazmaları', () => {
  const season = queryKeys.report.season(S)
  const dash = queryKeys.report.dashboard(S)
  const workload = queryKeys.report.workload(S)
  const t1 = queryKeys.report.task(S, 't1')
  const t2 = queryKeys.report.task(S, 't2')
  const m1 = queryKeys.report.meeting(S, 'm1')

  it('hedef görev biliniyorsa yalnız o görevin raporu + pano + dönem + iş yükü yenilenir', () => {
    expect(
      hits('updateWorkItem', [dash, season, workload, t1, t2, m1], { workItemId: 't1' }),
    ).toEqual([dash, season, workload, t1])
  })

  it('hedef verilmezse programdaki bütün görev raporları yenilenir', () => {
    expect(hits('transitionWorkItem', [t1, t2, m1])).toEqual([t1, t2])
  })

  it('görev notu yalnız görev rapor ayrıntısını yeniler (pano/dönem notu saymaz)', () => {
    expect(hits('addWorkItemNote', [dash, season, t1, t2], { workItemId: 't1' })).toEqual([t1])
    expect(resourcesInvalidatedBy('addWorkItemNote')).not.toContain('report')
  })

  it('başka programın raporlarına dokunulmaz (K2); mercek/birimden bağımsız', () => {
    const otherTask = queryKeys.report.task(OTHER, 't1')
    const otherSeason = queryKeys.report.season(OTHER)
    const lens = queryKeys.report.task(COORD, 't1')
    expect(
      hits('updateWorkItem', [t1, lens, otherTask, otherSeason], { workItemId: 't1' }),
    ).toEqual([t1, lens])
  })

  it('programsız eylemde geçersizleme yok', () => {
    expect(
      hits(
        'updateWorkItem',
        [t1, season],
        { workItemId: 't1' },
        { programId: null, departmentId: null },
      ),
    ).toEqual([])
  })
})

describe('toplantı yazmaları', () => {
  const season = queryKeys.report.season(S)
  const m1 = queryKeys.report.meeting(S, 'm1')
  const m2 = queryKeys.report.meeting(S, 'm2')
  const t1 = queryKeys.report.task(S, 't1')

  it('hedef toplantı biliniyorsa yalnız o toplantının raporu + dönem raporu yenilenir', () => {
    expect(hits('addMeetingNote', [season, m1, m2, t1], { meetingId: 'm1' })).toEqual([season, m1])
  })

  it('hedef verilmezse programdaki bütün toplantı raporları yenilenir', () => {
    expect(hits('deleteMeeting', [m1, m2, t1])).toEqual([m1, m2])
  })

  it('nottan göreve dönüştürme hem toplantı hem görev raporunu yeniler', () => {
    expect(hits('convertNoteToTask', [m1, t1], { meetingId: 'm1' })).toEqual([m1, t1])
  })

  it('konferans başlat/bitir rapora girmez', () => {
    for (const op of ['startConference', 'endConference'] as const) {
      expect(resourcesInvalidatedBy(op)).not.toContain('report.meeting')
      expect(resourcesInvalidatedBy(op)).not.toContain('report')
    }
  })

  it('departman adı ve üyelik değişimi toplantı raporunu yeniler (künye/katılımcı rolü)', () => {
    expect(hits('updateDepartment', [m1])).toEqual([m1])
    expect(hits('assignMembership', [m1])).toEqual([m1])
  })
})
