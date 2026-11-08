import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { createFakeLifecycle, setupWithScope, sideContext } from './__tests__/fake-lifecycle'
import { useDepartmentCode } from './department-code'

async function boot(
  fetcher: () => Promise<{ department_id: string; display_name: string; code?: string }[]>,
  active = true,
) {
  const ctx = await sideContext()
  const { lifecycle, store } = createFakeLifecycle({
    lenses: [{ lens: 'coordinator', departmentCount: 1 }],
    departments: [{ departmentId: 'd1', displayName: 'Sistem koordinatörlüğü' }],
  })
  store.commit({ programId: 'p1', lens: 'coordinator', departmentId: 'd1' })
  const result = setupWithScope(ctx, lifecycle, () => useDepartmentCode(ref(active), fetcher))
  await flushPromises()
  return { ...result, ctx, store }
}

describe('dar menü birim kodu (E-00-40)', () => {
  it('ProgramDepartment.code department_id ile eşlenir; anahtar scoped departments', async () => {
    const fetcher = vi.fn(() =>
      Promise.resolve([
        { department_id: 'd0', display_name: 'Başka', code: 'BAŞ' },
        { department_id: 'd1', display_name: 'Sistem koordinatörlüğü', code: 'SİS' },
      ]),
    )
    const { code, ctx, store } = await boot(fetcher)
    expect(code.value).toBe('SİS')
    expect(ctx.queryClient.getQueryData([...store.queryKey('departments')])).toHaveLength(2)
  })

  it('kod yoksa ya da okuma başarısızsa baş harf', async () => {
    const none = await boot(() => Promise.resolve([{ department_id: 'd1', display_name: 'x' }]))
    expect(none.code.value).toBe('SK')
    const failed = await boot(() => Promise.reject(new Error('403')))
    expect(failed.code.value).toBe('SK')
  })

  it('etkin değilken istenmez', async () => {
    const fetcher = vi.fn(() => Promise.resolve([]))
    const { code } = await boot(fetcher, false)
    expect(fetcher).not.toHaveBeenCalled()
    expect(code.value).toBe('SK')
  })
})
