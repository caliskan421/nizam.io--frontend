// Kenar menüsü testleri: sahte kapsam yaşam döngüsü (kabuğun `provide` ettiği nesnenin
// biçimi) + bileşen bağlamı (Pinia, TanStack Query, katalog router'ı).
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { computed, defineComponent, h, reactive, type Component } from 'vue'
import { createMemoryHistory, type Router } from 'vue-router'
import { vi } from 'vitest'

import { createAppRouter } from '@/app/router'
import type { ScopeStep } from '@/shared/scope/resolve'
import type { ScopeLens } from '@/shared/scope/scope'
import type { ScopeStatus } from '@/shared/scope/lifecycle'
import type {
  DepartmentOption,
  LensOption,
  ProgramOption,
  ScopeFacts,
  Standing,
} from '@/shared/scope/standing-facts'
import { useScopeStore } from '@/shared/scope/store'

import { SCOPE_LIFECYCLE_KEY, type ScopeLifecycle } from '../scope-key'

export interface FakeScopeState {
  status: ScopeStatus
  programs: ProgramOption[]
  lenses: LensOption[]
  departments: DepartmentOption[]
  facts: ScopeFacts
  standing: Standing | null
  pending: ScopeStep | null
  programsTruncated: boolean
  departmentsTruncated: boolean
}

export const STANDING: Standing = {
  accountId: 'acc-1',
  fullName: 'Deneme Kişi',
  email: 'kisi@example.test',
  companyAdmin: true,
  rows: [],
}

export function defaultState(): FakeScopeState {
  return {
    status: 'ready',
    programs: [{ programId: 'p1', name: 'Program Bir', year: 2026 }],
    lenses: [{ lens: 'admin', departmentCount: 0 }],
    departments: [],
    facts: { companyAdmin: true, coordinator: false, member: false },
    standing: STANDING,
    pending: null,
    programsTruncated: false,
    departmentsTruncated: false,
  }
}

/** Sahte yaşam döngüsü; `select*` gerçek kapsam deposunu günceller. */
export function createFakeLifecycle(initial: Partial<FakeScopeState> = {}) {
  const state = reactive<FakeScopeState>({ ...defaultState(), ...initial })
  const store = useScopeStore()
  const lifecycle: ScopeLifecycle = {
    programs: computed(() => state.programs),
    lenses: computed(() => state.lenses),
    departments: computed(() => state.departments),
    facts: computed(() => state.facts),
    lensFixed: computed(() => state.lenses.length <= 1),
    status: computed(() => state.status),
    error: computed<unknown>(() => null),
    standing: computed(() => state.standing),
    pending: computed(() => state.pending),
    emptyReason: computed(() => null),
    programsTruncated: computed(() => state.programsTruncated),
    departmentsTruncated: computed(() => state.departmentsTruncated),
    selectProgram: vi.fn((id: string) => store.setProgram(id)),
    selectLens: vi.fn((lens: ScopeLens) => store.setLens(lens)),
    selectDepartment: vi.fn((id: string) => store.setDepartment(id)),
    refreshStanding: vi.fn(),
  }
  return { lifecycle, state, store }
}

export interface SideContext {
  pinia: Pinia
  queryClient: QueryClient
  router: Router
}

export async function sideContext(path = '/oturum'): Promise<SideContext> {
  const pinia = createPinia()
  setActivePinia(pinia)
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })
  const router = createAppRouter(createMemoryHistory())
  await router.push(path)
  return { pinia, queryClient, router }
}

/** Bileşeni sağlanmış yaşam döngüsüyle bağlar (kabuğun `provide` ettiği gibi). */
export function mountWithScope(
  ctx: SideContext,
  lifecycle: ScopeLifecycle,
  component: Component,
  props: Record<string, unknown> = {},
) {
  return mount(component, {
    props,
    global: {
      plugins: [ctx.pinia, [VueQueryPlugin, { queryClient: ctx.queryClient }], ctx.router],
      provide: { [SCOPE_LIFECYCLE_KEY as symbol]: lifecycle },
    },
    attachTo: document.body,
  })
}

/** `setup` fonksiyonunu sağlanmış yaşam döngüsüyle bileşen bağlamında çalıştırır. */
export function setupWithScope<T>(ctx: SideContext, lifecycle: ScopeLifecycle, setup: () => T): T {
  let result: T | undefined
  mountWithScope(
    ctx,
    lifecycle,
    defineComponent({
      setup() {
        result = setup()
        return () => h('div')
      },
    }),
  )
  return result as T
}
