import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
  COORD_SCOPE,
  errorEnvelope,
  http,
  json,
  ORIGIN,
  sent,
  server,
  subtask,
  workItem,
} from '../../model/__tests__/harness'
import SubtaskList from './SubtaskList.vue'
import { cleanupSubtasks, listLoaded, mountSubtasks } from './__tests__/subtask-harness'

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => cleanupSubtasks())
afterAll(() => server.close())

const PATH = '/v1/work-items/w1/subtasks'
const item = workItem({
  assignees: [
    { account_id: 'acc-1', full_name: 'Ayşe' },
    { account_id: 'acc-2', full_name: 'Burak' },
  ],
})

function setup() {
  return mountSubtasks(
    SubtaskList,
    { item, variant: 'block' },
    { role: 'koordinator' },
    COORD_SCOPE,
  ).wrapper
}

describe('SubtaskList', () => {
  it('okuma hatası: hata kutusu + yeniden dene', async () => {
    let calls = 0
    server.use(
      http.get(`${ORIGIN}${PATH}`, () =>
        ++calls === 1
          ? errorEnvelope('work.not_authorized', 403)
          : json({ subtasks: [subtask()], total: 1 }),
      ),
    )
    const w = setup()
    await vi.waitFor(() => expect(w.find('[role="alert"]').exists()).toBe(true))
    await w.get('[role="alert"] button').trigger('click')
    await vi.waitFor(() => expect(w.find('[data-testid="subtask-s1"]').exists()).toBe(true))
  })

  it('aynı anda tek açılır: başka satırın menüsü tarih açılırını kapatır', async () => {
    server.use(
      http.get(`${ORIGIN}${PATH}`, () =>
        json({ subtasks: [subtask(), subtask({ subtask_id: 's2', title: 'İkinci' })], total: 2 }),
      ),
    )
    const w = setup()
    await listLoaded(w)
    await w.get('[data-testid="subtask-s1"] [data-testid="subtask-dates"]').trigger('click')
    expect(w.findAll('[data-testid="subtask-dates-pop"]')).toHaveLength(1)
    await w.get('[data-testid="subtask-s2"] [data-testid="subtask-menu"]').trigger('click')
    expect(w.find('[data-testid="subtask-dates-pop"]').exists()).toBe(false)
    expect(w.findAll('[role="menu"]')).toHaveLength(1)
  })

  it('kişi değişikliği expected_revision ile; 409 edit_conflict → alan seçim diyaloğu', async () => {
    let reads = 0
    server.use(
      http.get(`${ORIGIN}${PATH}`, () =>
        json({
          subtasks: [
            ++reads === 1
              ? subtask({ assignee_account_id: 'acc-1', edit_revision: 6 })
              : subtask({ edit_revision: 7 }),
          ],
          total: 1,
        }),
      ),
      http.patch(`${ORIGIN}${PATH}/s1`, () =>
        errorEnvelope('work.edit_conflict', 409, [{ field: 'expected_revision', code: 'x' }]),
      ),
    )
    const w = setup()
    await listLoaded(w)
    await w.get('[data-testid="subtask-person"]').setValue('acc-2')
    await vi.waitFor(() =>
      expect(document.querySelector('[data-testid="conflict-fields"]')).not.toBeNull(),
    )
    expect(sent('PATCH', `${PATH}/s1`)[0]!.body).toEqual({
      assignee_account_id: 'acc-2',
      expected_revision: 6,
    })
    expect(document.querySelector('[data-testid="conflict-mine"]')?.textContent).toBe('Burak')
  })
})
