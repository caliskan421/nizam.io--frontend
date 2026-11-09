import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import {
  COORD_SCOPE,
  http,
  json,
  ORIGIN,
  server,
  subtask,
  workItem,
} from '../../model/__tests__/harness'
import type { WorkItemSubtask } from '../../model/types'
import SubtaskTab from './SubtaskTab.vue'
import { cleanupSubtasks, listLoaded, mountSubtasks } from './__tests__/subtask-harness'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => cleanupSubtasks())
afterAll(() => server.close())

const PATH = '/v1/work-items/w1/subtasks'

async function setup(rows: WorkItemSubtask[], role: 'koordinator' | 'uye' = 'koordinator') {
  server.use(http.get(`${ORIGIN}${PATH}`, () => json({ subtasks: rows, total: rows.length })))
  const { wrapper } = mountSubtasks(SubtaskTab, { item: workItem() }, { role }, COORD_SCOPE)
  await listLoaded(wrapper)
  return wrapper
}

describe('SubtaskTab (E-03-60)', () => {
  it('sayaç + ilerleme çubuğu (satır içi stil yok) + panel satırları + "+ ekle"', async () => {
    const w = await setup([subtask(), subtask({ subtask_id: 's2', done: true })])
    expect(w.get('[data-testid="subtask-count"]').text()).toBe('1/2')
    expect(w.get('[data-testid="subtask-count"]').attributes('data-all')).toBe('false')
    const bar = w.get<HTMLProgressElement>('progress')
    expect([bar.element.value, bar.element.max]).toEqual([1, 2])
    expect(bar.attributes('style')).toBeUndefined()
    expect(w.findAll('.rp-dsub:not(.rp-dsub--add)')).toHaveLength(2)
    expect(w.find('.rp-dsub--add [data-testid="subtask-add-input"]').exists()).toBe(true)
    expect(w.find('.rp-dsubs__miss').exists()).toBe(false)
  })

  it('hepsi bitince vurgu; alt görev yokken çubuk yok, üyeye "Henüz alt görev yok."', async () => {
    const done = await setup([subtask({ done: true })])
    expect(done.get('[data-testid="subtask-count"]').attributes('data-all')).toBe('true')
    done.unmount()
    const empty = await setup([], 'uye')
    expect(empty.find('progress').exists()).toBe(false)
    expect(empty.get('[data-testid="subtasks-empty"]').text()).toBe('Henüz alt görev yok.')
  })
})
