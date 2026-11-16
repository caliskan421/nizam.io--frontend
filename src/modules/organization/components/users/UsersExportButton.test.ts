import { flushPromises, mount } from '@vue/test-utils'
import { computed } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    run.mockReset()
  })
  afterEach(() => vi.useRealTimers())

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

  // CX-F8-Ö-01: tüketim hatasında Retry-After → "Bekleyin (N s)"; otomatik tekrar yok.
  it.each([
    ['organization.export_in_progress', 9],
    ['organization.capacity_full', 30],
  ])(
    '%s + Retry-After %i: süre sayacı, düğme kilitli, süre bitince açılır; tekrar yok',
    async (code, wait) => {
      run.mockResolvedValueOnce({
        kind: 'failed',
        error: { code, messageKey: `errors.${code}` },
        retryAfter: wait,
      })
      const w = mountButton()
      const button = w.get('[data-testid="users-export"]')
      await button.trigger('click')
      await flushPromises()
      expect(w.get('[data-testid="users-export-error"]').text()).toBe(`Bekleyin (${wait} s)`)
      expect(button.attributes('disabled')).toBeDefined()
      vi.advanceTimersByTime(1000)
      await flushPromises()
      expect(w.get('[data-testid="users-export-error"]').text()).toBe(`Bekleyin (${wait - 1} s)`)
      vi.advanceTimersByTime((wait - 1) * 1000)
      await flushPromises()
      expect(w.find('[data-testid="users-export-error"]').exists()).toBe(false)
      expect(button.attributes('disabled')).toBeUndefined()
      expect(run).toHaveBeenCalledTimes(1)
    },
  )
  it('Retry-After yok: sayaç yok, süresiz ortak metin, düğme açık', async () => {
    run.mockResolvedValueOnce({
      kind: 'failed',
      error: {
        code: 'organization.capacity_full',
        messageKey: 'errors.organization.capacity_full',
      },
      retryAfter: null,
    })
    const w = mountButton()
    await w.get('[data-testid="users-export"]').trigger('click')
    await flushPromises()
    expect(w.get('[data-testid="users-export-error"]').text()).toMatch(/kapasitesi dolu/)
    expect(w.get('[data-testid="users-export"]').attributes('disabled')).toBeUndefined()
  })
})
