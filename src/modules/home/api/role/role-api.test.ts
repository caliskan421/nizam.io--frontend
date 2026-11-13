import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

import {
  COORD_SCOPE,
  http,
  json,
  LIST,
  COUNTS,
  MEMBER_SCOPE,
  mountWith,
  ORIGIN,
  resetAll,
  row,
  sent,
  server,
  settle,
  standingHandlers,
} from '../../__tests__/harness'
import { dayIn } from '../../model/role/dates'
import { ROLE_LOAD_MAX_PAGES, useRoleLoad } from './use-role-load'
import { useRoster } from './use-roster'
import { useToday } from './use-today'
import { useUnreadCount } from './use-unread-count'
import { useUpcomingMeetings } from './use-upcoming-meetings'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(resetAll)
afterAll(() => server.close())

const COORD = {
  companyAdmin: false,
  rows: [{ department_id: 'd1', role: 'koordinator' }],
}

function harness<T>(setup: () => T) {
  let result: T | undefined
  const Probe = defineComponent({
    setup() {
      result = setup()
      return () => h('div')
    },
  })
  return { Probe, get: () => result as T }
}

const EMPTY_COUNTS = {
  total: 0,
  by_status: { baslanmadi: 0, devam_ediyor: 0, onaya_sunuldu: 0, iade_edildi: 0, tamamlandi: 0 },
  overdue: 0,
  pending_date_requests: 0,
}

describe('useRoleLoad — tek yükleme (KESİN 21)', () => {
  it('K1: birim süzgeci; imleç bitene dek sayfalar sürer, atanan süzgeci yok', async () => {
    const a = row('devam_ediyor')
    const b = row('baslanmadi')
    const c = row('onaya_sunuldu')
    server.use(
      ...standingHandlers(COORD),
      http.get(`${ORIGIN}${COUNTS}`, () => json({ ...EMPTY_COUNTS, total: 3 })),
      http.get(`${ORIGIN}${LIST}`, ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor')
        return cursor
          ? json({ items: [c], next_cursor: '' })
          : json({ items: [a, b], next_cursor: 'c2' })
      }),
    )
    const probe = harness(() =>
      useRoleLoad(
        () => 'd1',
        () => null,
      ),
    )
    await mountWith(probe.Probe, COORD_SCOPE)
    await vi.waitFor(() => expect(probe.get().complete.value).toBe(true))
    expect(probe.get().items.value.map((i) => i.work_item_id)).toEqual([
      a.work_item_id,
      b.work_item_id,
      c.work_item_id,
    ])
    const lists = sent(LIST)
    expect(lists).toHaveLength(2)
    expect(lists[0]!.query.get('department_id')).toBe('d1')
    expect(lists[0]!.query.has('assignee_account_id')).toBe(false)
    expect(lists[0]!.query.get('limit')).toBe('200')
    expect(sent(COUNTS)).toHaveLength(1)
    expect(probe.get().counts.data.value?.total).toBe(3)
  })

  it('Ü1: program geneli (department_id yok), assignee_account_id = ben', async () => {
    server.use(
      ...standingHandlers({ companyAdmin: false, rows: [{ department_id: 'd1', role: 'uye' }] }),
      http.get(`${ORIGIN}${COUNTS}`, () => json(EMPTY_COUNTS)),
      http.get(`${ORIGIN}${LIST}`, () => json({ items: [], next_cursor: '' })),
    )
    const probe = harness(() =>
      useRoleLoad(
        () => null,
        () => 'acc-1',
      ),
    )
    await mountWith(probe.Probe, MEMBER_SCOPE)
    await vi.waitFor(() => expect(probe.get().complete.value).toBe(true))
    expect(sent(LIST)[0]!.query.has('department_id')).toBe(false)
    expect(sent(LIST)[0]!.query.getAll('assignee_account_id')).toEqual(['acc-1'])
    expect(sent(COUNTS)[0]!.query.getAll('assignee_account_id')).toEqual(['acc-1'])
  })

  it('imleç bitmezse en çok MAX sayfa; küme tam değil (≥ ipucu), sayı uydurulmaz', async () => {
    let n = 0
    server.use(
      ...standingHandlers(COORD),
      http.get(`${ORIGIN}${COUNTS}`, () => json(EMPTY_COUNTS)),
      http.get(`${ORIGIN}${LIST}`, () => {
        n += 1
        return json({ items: [row('devam_ediyor')], next_cursor: `c${n + 1}` })
      }),
    )
    const probe = harness(() =>
      useRoleLoad(
        () => 'd1',
        () => null,
      ),
    )
    await mountWith(probe.Probe, COORD_SCOPE)
    await vi.waitFor(() => expect(sent(LIST)).toHaveLength(ROLE_LOAD_MAX_PAGES))
    await settle()
    expect(sent(LIST)).toHaveLength(ROLE_LOAD_MAX_PAGES)
    expect(probe.get().complete.value).toBe(false)
    expect(probe.get().loadingMore.value).toBe(false)
  })

  it('kapalıyken istek yok', async () => {
    server.use(...standingHandlers(COORD))
    const probe = harness(() =>
      useRoleLoad(
        () => 'd1',
        () => null,
        false,
      ),
    )
    await mountWith(probe.Probe, COORD_SCOPE)
    expect(sent(LIST)).toHaveLength(0)
    expect(sent(COUNTS)).toHaveLength(0)
  })
})

describe('yardımcı okuyucular', () => {
  it('toplantılar: from = kurulum günü; birim verilirse department_id, verilmezse yok', async () => {
    server.use(
      ...standingHandlers(COORD),
      http.get(`${ORIGIN}/v1/meetings`, () =>
        json({
          items: [
            {
              meeting_id: 'm1',
              program_id: 'p1',
              title: 'Haftalık',
              meeting_date: '2099-01-02T09:00:00Z',
              owner_department_id: 'd1',
              departments: [{ department_id: 'd1', department_name: 'Birim d1' }],
              members_included: false,
              invite_mode: 'coordinatorship',
              place: null,
              created_at: '2026-01-01T00:00:00Z',
              updated_at: '2026-01-01T00:00:00Z',
              created_by_account_id: 'a',
              created_by_role: 'admin',
            },
          ],
          next_cursor: '',
        }),
      ),
    )
    const k1 = harness(() => useUpcomingMeetings(() => 'd1'))
    await mountWith(k1.Probe, COORD_SCOPE)
    await vi.waitFor(() => expect(k1.get().views.value).toHaveLength(1))
    const first = sent('/v1/meetings')[0]!
    expect(first.query.get('from')).toBe(dayIn('Europe/Istanbul', new Date()))
    expect(first.query.get('department_id')).toBe('d1')
    expect(k1.get().views.value[0]).toMatchObject({
      title: 'Haftalık',
      day: '2',
      participants: null,
    })
    expect(k1.get().more.value).toBe(false)

    const u1 = harness(() => useUpcomingMeetings(() => null))
    await mountWith(u1.Probe, MEMBER_SCOPE)
    await vi.waitFor(() => expect(sent('/v1/meetings')).toHaveLength(2))
    expect(sent('/v1/meetings')[1]!.query.has('department_id')).toBe(false)
  })

  it('okunmamış bildirim sayısı (S1, kapsamsız)', async () => {
    server.use(
      ...standingHandlers(COORD),
      http.get(`${ORIGIN}/v1/notifications/unread-count`, () => json({ count: 4 })),
    )
    const probe = harness(() => useUnreadCount())
    await mountWith(probe.Probe, COORD_SCOPE)
    await vi.waitFor(() => expect(probe.get().data.value).toBe(4))
  })

  it('ekip: yalnız canlı hesaplar, rol noktası; tek istek', async () => {
    server.use(
      ...standingHandlers(COORD),
      http.get(`${ORIGIN}/v1/departments/d1/members`, () =>
        json({
          members: [
            {
              account_id: 'a',
              full_name: 'Zeynep',
              membership_id: 'm1',
              role: 'uye',
              status: 'active',
            },
            {
              account_id: 'b',
              full_name: 'Ali',
              membership_id: 'm2',
              role: 'koordinator',
              status: 'active',
            },
            {
              account_id: 'c',
              full_name: 'Silinen',
              membership_id: 'm3',
              role: 'uye',
              status: 'deleted',
            },
          ],
        }),
      ),
    )
    const probe = harness(() => useRoster(() => 'd1'))
    await mountWith(probe.Probe, COORD_SCOPE)
    await vi.waitFor(() => expect(probe.get().members.value).toHaveLength(2))
    expect(probe.get().members.value.map((m) => [m.fullName, m.coordinator])).toEqual([
      ['Ali', true],
      ['Zeynep', false],
    ])
    expect(sent('/v1/departments/d1/members')).toHaveLength(1)
  })

  it('bugün: kurulum profili yokken Europe/Istanbul', async () => {
    server.use(...standingHandlers(COORD))
    const probe = harness(() => useToday(() => new Date('2026-10-20T23:30:00Z')))
    await mountWith(probe.Probe, COORD_SCOPE)
    expect(probe.get().today.value).toBe('2026-10-21')
    expect(probe.get().timeZone.value).toBe('Europe/Istanbul')
  })
})
