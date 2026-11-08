import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { preferences } from '@/shared/preferences'

import { useScopeStore } from './store'

beforeEach(() => {
  preferences.clearAll()
  setActivePinia(createPinia())
})

describe('kapsam deposu', () => {
  it('her değişiklik dinleyiciye tek kez bildirilir; aynı değer bildirim üretmez', () => {
    const scope = useScopeStore()
    const listener = vi.fn()
    scope.onChange(listener)
    scope.commit({ programId: 'p1', lens: 'coordinator', departmentId: 'd1' })
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener.mock.calls[0]?.[0]).toEqual({
      programId: 'p1',
      lens: 'coordinator',
      departmentId: 'd1',
    })
    expect(listener.mock.calls[0]?.[1]).toEqual({ programId: null, lens: null, departmentId: null })
    scope.commit({ programId: 'p1', lens: 'coordinator', departmentId: 'd1' })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('mercek değişimi departmanı sıfırlar, programı korur', () => {
    const scope = useScopeStore()
    scope.commit({ programId: 'p1', lens: 'coordinator', departmentId: 'd1' })
    scope.setLens('member')
    expect(scope.snapshot).toEqual({ programId: 'p1', lens: 'member', departmentId: null })
  })

  it('program değişimi departmanı sıfırlar, merceği korur (yeniden doğrulanacak)', () => {
    const scope = useScopeStore()
    scope.commit({ programId: 'p1', lens: 'member', departmentId: 'd1' })
    scope.setProgram('p2')
    expect(scope.snapshot).toEqual({ programId: 'p2', lens: 'member', departmentId: null })
  })

  it('sorgu anahtarı merceği de ayırır', () => {
    const scope = useScopeStore()
    scope.commit({ programId: 'p1', lens: 'coordinator', departmentId: 'd1' })
    const a = scope.queryKey('work-items')
    scope.commit({ programId: 'p1', lens: 'member', departmentId: 'd1' })
    expect(scope.queryKey('work-items')).not.toEqual(a)
  })

  it('persist yalnız kimlikleri hatırlar; boş basamak düşer; forgetRemembered temayı korur', () => {
    const scope = useScopeStore()
    preferences.write('ui.theme', 'light')
    scope.commit({ programId: 'p1', lens: 'member', departmentId: 'd1' })
    scope.persist()
    expect(scope.remembered()).toEqual({ programId: 'p1', lens: 'member', departmentId: 'd1' })

    scope.setLens('coordinator')
    scope.persist()
    expect(scope.remembered()).toEqual({ programId: 'p1', lens: 'coordinator', departmentId: null })

    scope.forgetRemembered()
    expect(scope.remembered()).toEqual({ programId: null, lens: null, departmentId: null })
    expect(preferences.read('ui.theme')).toBe('light')
  })

  it('reset belleği boşaltır, hatırlananlara dokunmaz', () => {
    const scope = useScopeStore()
    scope.commit({ programId: 'p1', lens: 'admin', departmentId: null })
    scope.persist()
    scope.reset()
    expect(scope.programId).toBeNull()
    expect(scope.remembered().programId).toBe('p1')
  })

  it('onChange aboneliği kaldırılabilir', () => {
    const scope = useScopeStore()
    const listener = vi.fn()
    const off = scope.onChange(listener)
    off()
    scope.setProgram('p1')
    expect(listener).not.toHaveBeenCalled()
  })
})
