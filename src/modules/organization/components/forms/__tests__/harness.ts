// W74 form bileşeni testleri: organizasyon harness'ı (GERÇEK API istemcisi + MSW + Pinia kapsam +
// QueryClient) üstüne standing tohumu (`['me']`, `['me','departments']`, `['programs']`) ve
// bileşen bağlama. Oturum açık olmadığından standing sorguları ağa çıkmaz; tohum okunur.
import { VueQueryPlugin } from '@tanstack/vue-query'
import { mount, type VueWrapper } from '@vue/test-utils'
import { getActivePinia } from 'pinia'
import { expect, vi } from 'vitest'
import { nextTick, type Component } from 'vue'

import { queryKeys } from '@/shared/http/query-keys'
import type { ScopeSelection } from '@/shared/scope/resolve'
import { useToast } from '@/shared/ui'
import { useConfirm } from '@/shared/ui/confirm'

import { harness, resetHarness } from '../../../__tests__/harness'

export const ME = 'acc-me'

export interface WhoSeed {
  companyAdmin?: boolean
  /** Seçili programdaki ekip satırları (sunucu rol dizesi test dosyasından). */
  rows?: ReadonlyArray<{ departmentId: string; role: string }>
}

const wrappers: VueWrapper[] = []

export function formsHarness(selection: ScopeSelection, who: WhoSeed = { companyAdmin: true }) {
  const h = harness(selection)
  const client = h.queryClient
  client.setQueryData(queryKeys.me.root(), {
    account_id: ME,
    company_admin: who.companyAdmin === true,
    email: 'ben@ornek.test',
    full_name: 'Ben',
  })
  client.setQueryData(queryKeys.me.departments(), {
    data: {
      departments: (who.rows ?? []).map((r) => ({
        program_id: selection.programId,
        program_name: 'Program',
        department_id: r.departmentId,
        display_name: `Birim ${r.departmentId}`,
        role: r.role,
      })),
    },
    truncated: false,
  })
  client.setQueryData(queryKeys.programs.all(), { programs: [], truncated: false })

  /** Program departmanları (`listProgramDepartments`) önbellek tohumu. */
  function departments(list: ReadonlyArray<{ id: string; name: string; code?: string }>): void {
    client.setQueryData(queryKeys.departments.all(h.store.snapshot), {
      departments: list.map((d) => ({
        department_id: d.id,
        display_name: d.name,
        ...(d.code ? { code: d.code } : {}),
      })),
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

export function click(selector: string): void {
  const el = $(selector)
  if (!el) throw new Error(`öğe yok: ${selector}`)
  el.click()
}

export function toasts(): string[] {
  return useToast().queue.value.map((t) => t.message)
}

/** Kişi seçicide `accountId` seçeneğini seçer (odak → liste → tık). */
export async function pickPerson(accountId: string): Promise<void> {
  const input = $('[name="person-search"]')
  if (!input) throw new Error('kişi seçici yok')
  input.dispatchEvent(new Event('focus'))
  await vi.waitFor(() => expect($(`[data-account="${accountId}"]`)).not.toBeNull())
  click(`[data-account="${accountId}"]`)
  await nextTick()
}
