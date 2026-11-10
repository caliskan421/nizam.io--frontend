// W94 panel testleri: timeline harness'ı (GERÇEK API istemcisi + MSW + Pinia kapsam +
// QueryClient) üstüne standing tohumu (`['me']`, `['me','departments']`) ve bileşen bağlama.
// Oturum açık olmadığından standing sorguları ağa çıkmaz; önbellek tohumu okunur. Fikstürler
// örnek veridir, gerçek veri DEĞİLDİR.
import { VueQueryPlugin } from '@tanstack/vue-query'
import { mount, type VueWrapper } from '@vue/test-utils'
import { getActivePinia } from 'pinia'
import type { Component } from 'vue'

import { queryKeys } from '@/shared/http/query-keys'
import type { ScopeSelection } from '@/shared/scope/resolve'
import { useToast } from '@/shared/ui'
import { useConfirm } from '@/shared/ui/confirm'

import { harness, resetHarness } from '../../../__tests__/harness'

export interface WhoSeed {
  companyAdmin?: boolean
  /** Ekip satırları: `[departman, sunucu rol dizesi]` (test dosyası verir). */
  rows?: ReadonlyArray<readonly [string, string]>
}

const wrappers: VueWrapper[] = []

export function panelHarness(selection: ScopeSelection, who: WhoSeed = {}) {
  const h = harness(selection)
  const client = h.queryClient
  client.setQueryData(queryKeys.me.root(), {
    account_id: 'acc-me',
    company_admin: who.companyAdmin === true,
    email: 'ben@ornek.test',
    full_name: 'Ben',
  })
  client.setQueryData(queryKeys.me.departments(), {
    data: {
      departments: (who.rows ?? []).map(([departmentId, role]) => ({
        program_id: 'p1',
        program_name: 'Program',
        department_id: departmentId,
        display_name: `Birim ${departmentId}`,
        role,
      })),
    },
    truncated: false,
  })
  client.setQueryData(queryKeys.programs.all(), { programs: [], truncated: false })
  client.setQueryData(queryKeys.departments.all(h.store.snapshot), {
    departments: [{ department_id: 'd2', display_name: 'Altyapı', code: 'ALT' }],
  })

  function mountIt<P extends Record<string, unknown>>(component: Component, props: P) {
    const wrapper = mount(component, {
      props,
      attachTo: document.body,
      global: { plugins: [getActivePinia()!, [VueQueryPlugin, { queryClient: client }]] },
    })
    wrappers.push(wrapper)
    return wrapper
  }

  return { ...h, mount: mountIt }
}

/** Her test sonunda: bileşenler sökülür, onay/bildirim kuyrukları ve harness sıfırlanır. */
export function resetPanel(): void {
  for (const w of wrappers.splice(0)) w.unmount()
  useConfirm().clear()
  useToast().clear()
  resetHarness()
  document.body.innerHTML = ''
}

/** Teleport edilmiş pencere dahil belge içinde seçici. */
export function $(selector: string): HTMLElement | null {
  return document.body.querySelector<HTMLElement>(selector)
}

export function setValue(selector: string, value: string): void {
  const el = $(selector) as HTMLInputElement | HTMLSelectElement | null
  if (!el) throw new Error(`öğe yok: ${selector}`)
  el.value = value
  el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input'))
}

export const PROGRAM = 'p1'
