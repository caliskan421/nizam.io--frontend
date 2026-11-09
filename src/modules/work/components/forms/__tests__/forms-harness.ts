// W45 form bileşeni testleri: W41 görev harness'ı (GERÇEK API istemcisi + MSW + Pinia kapsam +
// QueryClient) üstüne standing tohumu (`['me']`, `['me','departments']`, `['programs']`) ve
// bileşen bağlama. Oturum açık olmadığından standing sorguları ağa çıkmaz; tohum okunur.
import { VueQueryPlugin } from '@tanstack/vue-query'
import { mount, type VueWrapper } from '@vue/test-utils'
import { getActivePinia } from 'pinia'
import type { Component } from 'vue'

import { queryKeys } from '@/shared/http/query-keys'
import type { ScopeSelection } from '@/shared/scope/resolve'
import { useToast } from '@/shared/ui'
import { useConfirm } from '@/shared/ui/confirm'

import { harness, resetHarness } from '../../../model/__tests__/harness'

export interface TeamRowSeed {
  departmentId: string
  /** Sunucu rol dizesi (test dosyası verir). */
  role: string
  programId?: string
  displayName?: string
}

export interface WhoSeed {
  accountId?: string
  companyAdmin?: boolean
  rows?: readonly TeamRowSeed[]
}

export const ME = 'acc-me'

const wrappers: VueWrapper[] = []

export function formsHarness(selection: ScopeSelection, who: WhoSeed = {}) {
  const h = harness(selection)
  const client = h.queryClient
  client.setQueryData(queryKeys.me.root(), {
    account_id: who.accountId ?? ME,
    company_admin: who.companyAdmin === true,
    email: 'ben@ornek.test',
    full_name: 'Ben',
  })
  client.setQueryData(queryKeys.me.departments(), {
    data: {
      departments: (who.rows ?? []).map((r) => ({
        program_id: r.programId ?? 'p1',
        program_name: 'Program',
        department_id: r.departmentId,
        display_name: r.displayName ?? `Birim ${r.departmentId}`,
        role: r.role,
      })),
    },
    truncated: false,
  })
  client.setQueryData(queryKeys.programs.all(), { programs: [], truncated: false })

  /** Program departmanları (`listProgramDepartments`) tohumu. */
  function departments(list: ReadonlyArray<{ id: string; name: string }>): void {
    client.setQueryData(queryKeys.departments.all(h.store.snapshot), {
      departments: list.map((d) => ({ department_id: d.id, display_name: d.name })),
    })
  }

  function mountIt<P extends Record<string, unknown>>(component: Component, props: P) {
    const wrapper = mount(component, {
      props,
      attachTo: document.body,
      global: { plugins: [getActivePinia()!, [VueQueryPlugin, { queryClient: client }]] },
    })
    wrappers.push(wrapper)
    return wrapper
  }

  return { ...h, departments, mount: mountIt }
}

/** Her test sonunda: bileşenler sökülür, onay/bildirim kuyrukları ve harness sıfırlanır. */
export function resetForms(): void {
  for (const w of wrappers.splice(0)) w.unmount()
  useConfirm().clear()
  useToast().clear()
  resetHarness()
  document.body.innerHTML = ''
}

/** Teleport edilmiş pencere içinde seçici. */
export function $(selector: string): HTMLElement | null {
  return document.body.querySelector<HTMLElement>(selector)
}

export function setValue(selector: string, value: string): void {
  const el = $(selector) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null
  if (!el) throw new Error(`öğe yok: ${selector}`)
  el.value = value
  el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input'))
}
