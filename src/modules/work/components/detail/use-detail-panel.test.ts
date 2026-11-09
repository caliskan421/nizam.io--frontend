import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { useInstanceStore } from '@/shared/instance/store'
import { useToast } from '@/shared/ui'

import { useWorkItemList } from '../../api'
import {
  ADMIN_SCOPE,
  COORD_SCOPE,
  errorEnvelope,
  harness,
  http,
  json,
  ORIGIN,
  resetHarness,
  sent,
  server,
  workItem,
} from '../../model/__tests__/harness'
import type { WorkDetailCloseReason } from '../index'
import { seedStanding } from './__tests__/fixtures'
import { useDetailPanel } from './use-detail-panel'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  resetHarness()
  useToast().clear()
})
afterAll(() => server.close())

function departments() {
  return http.get(`${ORIGIN}/v1/program/departments`, () => json({ departments: [] }))
}

describe('useDetailPanel', () => {
  it('standing yokken olgular dar: not okuma isteği atılmaz; gelince atılır (s.143)', async () => {
    server.use(
      departments(),
      http.get(`${ORIGIN}/v1/work-items/w1`, () => json(workItem({ department_id: 'd1' }))),
      http.get(`${ORIGIN}/v1/work-items/w1/files`, () => json({ files: [] })),
      http.get(`${ORIGIN}/v1/work-items/w1/notes`, () => json({ notes: [], total: 5 })),
    )
    const h = harness(COORD_SCOPE)
    const panel = h.run(() => useDetailPanel(() => 'w1', vi.fn()))
    await vi.waitFor(() => expect(panel.item.value).not.toBeNull())
    await vi.waitFor(() => expect(panel.files.value).toEqual([]))
    expect(panel.facts.value).toMatchObject({ coordinator: false, member: false })
    expect(sent('GET', '/v1/work-items/w1/notes')).toHaveLength(0)
    expect(panel.notesTotal.value).toBeUndefined()

    seedStanding(h.queryClient, false, [{ department: 'd1', role: 'koordinator' }])
    await vi.waitFor(() => expect(panel.notesTotal.value).toBe(5))
    expect(panel.facts.value?.coordinator).toBe(true)
  })

  it('saat dilimi kurulum profilinden, yoksa Europe/Istanbul', () => {
    server.use(
      departments(),
      http.get(`${ORIGIN}/v1/work-items/w1`, () => json(workItem())),
    )
    const h = harness(COORD_SCOPE)
    const panel = h.run(() => useDetailPanel(() => 'w1', vi.fn()))
    expect(panel.timeZone.value).toBe('Europe/Istanbul')
    const instance = useInstanceStore()
    instance.profile = { timezone: 'UTC' } as typeof instance.profile
    expect(panel.timeZone.value).toBe('UTC')
  })

  it('Admin: liste okunurken bekler (istek yok, kapanış yok); satır gelince hedef görevin kapsamı', async () => {
    let release: () => void = () => undefined
    const gate = new Promise<void>((resolve) => (release = resolve))
    server.use(
      departments(),
      http.get(`${ORIGIN}/v1/program/work-items`, async () => {
        await gate
        return json({ items: [workItem({ department_id: 'd2' })] })
      }),
      http.get(`${ORIGIN}/v1/work-items/w1`, () => json(workItem({ department_id: 'd2' }))),
    )
    const h = harness(ADMIN_SCOPE)
    const close = vi.fn()
    h.run(() => useWorkItemList(null))
    const panel = h.run(() => useDetailPanel(() => 'w1', close))
    await h.flush()
    expect(sent('GET', '/v1/work-items/w1')).toHaveLength(0)
    expect(close).not.toHaveBeenCalled()

    release()
    await vi.waitFor(() => expect(panel.item.value?.department_id).toBe('d2'))
    expect(sent('GET', '/v1/work-items/w1')[0]!.headers.get('X-Nizamio-Department')).toBe('d2')
    expect(close).not.toHaveBeenCalled()
  })

  it('404 bir kez kapatır; görev değişince bekçi sıfırlanır', async () => {
    server.use(
      departments(),
      http.get(`${ORIGIN}/v1/work-items/:id`, () => errorEnvelope('work.item_not_found', 404)),
    )
    const h = harness(COORD_SCOPE)
    const close = vi.fn<(reason: WorkDetailCloseReason) => void>()
    const id = ref('w1')
    h.run(() => useDetailPanel(() => id.value, close))
    await vi.waitFor(() => expect(close).toHaveBeenCalledTimes(1))
    expect(close).toHaveBeenCalledWith('not_found')
    expect(useToast().queue.value).toHaveLength(1)

    id.value = 'w2'
    await vi.waitFor(() => expect(close).toHaveBeenCalledTimes(2))
  })
})
