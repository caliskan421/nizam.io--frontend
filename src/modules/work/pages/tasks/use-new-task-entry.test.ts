import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

import { useScopeStore } from '@/shared/scope/store'

import { workItem } from '../../model/__tests__/harness'
import { useNewTaskEntry, type NewTaskEntryDeps } from './use-new-task-entry'

afterEach(() => {
  document.body.innerHTML = ''
})

async function setup(path: string, over: Partial<NewTaskEntryDeps> = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit({ programId: 'p1', lens: 'admin', departmentId: null })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/gorevler', name: 'work.tasks', component: { render: () => null } }],
  })
  await router.push(path)
  const ready = ref(false)
  const open = vi.fn<(workItemId: string) => void>()
  const deps = {
    ready: () => ready.value,
    canCreate: () => true,
    listDepartment: () => null,
    normalizeUrl: vi.fn(),
    open,
    ...over,
  }
  let entry!: ReturnType<typeof useNewTaskEntry>
  mount(
    defineComponent({
      setup() {
        entry = useNewTaskEntry(deps)
        return () => h('div')
      },
    }),
    { global: { plugins: [pinia, router] } },
  )
  return { entry, deps, ready, open }
}

describe('useNewTaskEntry (W48)', () => {
  it('?yeni=1: yetki olguları gelince bir kez form açılır ve URL temizlenir', async () => {
    const { entry, deps, ready } = await setup('/gorevler?yeni=1')
    expect(entry.creating.value).toBe(false)
    expect(deps.normalizeUrl).not.toHaveBeenCalled()
    ready.value = true
    await flushPromises()
    expect(entry.creating.value).toBe(true)
    expect(deps.normalizeUrl).toHaveBeenCalledTimes(1)
    entry.close()
    expect(entry.creating.value).toBe(false)
  })

  it('yetkisizde parametre yok sayılır (form yok), URL yine temizlenir', async () => {
    const { entry, deps, ready } = await setup('/gorevler?yeni=1', { canCreate: () => false })
    ready.value = true
    await flushPromises()
    expect(entry.creating.value).toBe(false)
    expect(deps.normalizeUrl).toHaveBeenCalledTimes(1)
  })

  it('parametresiz: dokunulmaz', async () => {
    const { entry, deps, ready } = await setup('/gorevler')
    ready.value = true
    await flushPromises()
    expect(entry.creating.value).toBe(false)
    expect(deps.normalizeUrl).not.toHaveBeenCalled()
  })

  it('created: yalnız listenin kapsamındaki görev panelde açılır', async () => {
    const { entry, open } = await setup('/gorevler', { listDepartment: () => 'd2' })
    entry.created(workItem({ work_item_id: 'w1', department_id: 'd2' }))
    entry.created(workItem({ work_item_id: 'w2', department_id: 'd1' }))
    entry.created(workItem({ work_item_id: 'w3', department_id: 'd2', program_id: 'p9' }))
    expect(open.mock.calls).toEqual([['w1']])
  })
})
