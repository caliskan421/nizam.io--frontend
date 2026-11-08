import { describe, expect, it } from 'vitest'

import { createFakeLifecycle, setupWithScope, sideContext } from './__tests__/fake-lifecycle'
import { useSideScope } from './scope-view'

describe('kapsam kartı görünüm modeli', () => {
  it('yükleniyor / boş: kart yok (E-00-11)', async () => {
    const ctx = await sideContext()
    const { lifecycle, state } = createFakeLifecycle({ status: 'loading' })
    const scope = setupWithScope(ctx, lifecycle, () => useSideScope())
    expect(scope.visible.value).toBe(false)
    state.status = 'empty'
    expect(scope.visible.value).toBe(false)
    state.status = 'selecting'
    expect(scope.visible.value).toBe(true)
  })

  it('Admin merceğinde koordinatörlük kartı yok; Koordinatör + birimde var', async () => {
    const ctx = await sideContext()
    const { lifecycle, state, store } = createFakeLifecycle({
      lenses: [
        { lens: 'admin', departmentCount: 0 },
        { lens: 'coordinator', departmentCount: 1 },
      ],
    })
    store.commit({ programId: 'p1', lens: 'admin', departmentId: null })
    const scope = setupWithScope(ctx, lifecycle, () => useSideScope())
    expect(scope.program.value?.name).toBe('Program Bir')
    expect(scope.avatar.value?.initials).toBe('PB')
    expect(scope.showLens.value).toBe(true)
    expect(scope.showDepartment.value).toBe(false)
    expect(scope.lensFixed.value).toBe(false)

    state.departments = [{ departmentId: 'd1', displayName: 'Sistem' }]
    store.commit({ programId: 'p1', lens: 'coordinator', departmentId: 'd1' })
    expect(scope.showDepartment.value).toBe(true)
    expect(scope.department.value?.displayName).toBe('Sistem')
  })

  it('tek mercek: Rol kartı salt gösterim (P11)', async () => {
    const ctx = await sideContext()
    const { lifecycle } = createFakeLifecycle()
    const scope = setupWithScope(ctx, lifecycle, () => useSideScope())
    expect(scope.lensFixed.value).toBe(true)
  })
})
