import { flushPromises, mount } from '@vue/test-utils'
import { computed } from 'vue'
import { describe, expect, it, vi } from 'vitest'

import UsersExportButton from './UsersExportButton.vue'
import { USERS_VIEW, type UsersView } from './use-users-view'

const run = vi.hoisted(() => vi.fn())
const busy = vi.hoisted(() => ({ value: false }))
vi.mock('../../api', () => ({ useUsersExport: () => ({ run, busy }) }))

const filters = { search: 'ada', sortOrder: 'asc' as const, role: null }
const view = { exportFilters: computed(() => filters) } as unknown as UsersView
const mountButton = (provide = true) =>
  mount(UsersExportButton, { global: { provide: provide ? { [USERS_VIEW as symbol]: view } : {} } })

describe('UsersExportButton (BE-014)', () => {
  it('sends the on-screen filters and shows the saved name', async () => {
    run.mockResolvedValueOnce({ kind: 'saved', fileName: 'k.csv' })
    const w = mountButton()
    await w.get('[data-testid="users-export"]').trigger('click')
    await flushPromises()
    expect(run).toHaveBeenCalledWith(filters)
    expect(w.text()).toContain('k.csv indirildi')
  })
  it('shows a code-derived message, never the server text', async () => {
    run.mockResolvedValueOnce({
      kind: 'failed',
      error: {
        code: 'organization.export_too_large',
        messageKey: 'errors.organization.export_too_large',
      },
      retryAfter: null,
    })
    const w = mountButton()
    await w.get('[data-testid="users-export"]').trigger('click')
    await flushPromises()
    expect(w.get('[data-testid="users-export-error"]').text()).toContain('çok büyük')
  })
  it('is disabled without a users view and while busy', () => {
    expect(mountButton(false).get('button').attributes('disabled')).toBeDefined()
    busy.value = true
    expect(mountButton().get('button').attributes('disabled')).toBeDefined()
    busy.value = false
  })
})
