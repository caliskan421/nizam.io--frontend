// Notlar sekmesi testleri: modülün ortak harness'ı (GERÇEK API istemcisi + MSW, gerçek Pinia
// kapsam deposu, TanStack Query) üstüne standing tohumu ve bileşen bağlama.
import { VueQueryPlugin, type QueryClient } from '@tanstack/vue-query'
import { mount, type VueWrapper } from '@vue/test-utils'
import { getActivePinia } from 'pinia'
import type { Component } from 'vue'

import { settleQueries } from '@/shared/http/__tests__/settle'
import { queryKeys } from '@/shared/http/query-keys'
import { useConfirm } from '@/shared/ui/confirm'
import { useToast } from '@/shared/ui'

import { COORD_SCOPE, harness, resetHarness } from '../../../model/__tests__/harness'

export const NOTES_PATH = '/v1/work-items/w1/notes'

/** Sunucu rol dizesi (fikstür verisi; üretim kodu rolü yalnız capabilities'te okur). */
export type ServerRole = 'koordinator' | 'uye'

export interface StandingSeed {
  admin?: boolean
  /** Görevin departmanında (`d2`) ekip satırı. */
  role?: ServerRole | null
  accountId?: string
}

/** `useStanding` önbelleği: `['me']` + `['me','departments']` (oturum kapalı → istek yok). */
export function seedStanding(client: QueryClient, seed: StandingSeed = {}): void {
  const { admin = false, role = null, accountId = 'acc-1' } = seed
  client.setQueryData(queryKeys.me.root(), {
    account_id: accountId,
    full_name: 'Ayşe Yılmaz',
    email: 'ayse@example.test',
    company_admin: admin,
  })
  const departments = role
    ? [{ program_id: 'p1', program_name: 'P', department_id: 'd2', display_name: 'D2', role }]
    : []
  client.setQueryData(queryKeys.me.departments(), { data: { departments }, truncated: false })
}

const wrappers: VueWrapper[] = []
const clients: QueryClient[] = []

export function notesHarness(seed: StandingSeed = {}) {
  const h = harness(COORD_SCOPE)
  seedStanding(h.queryClient, seed)
  clients.push(h.queryClient)
  function mountWith(component: Component, props: Record<string, unknown>) {
    const wrapper = mount(component, {
      props,
      global: { plugins: [getActivePinia()!, [VueQueryPlugin, { queryClient: h.queryClient }]] },
      attachTo: document.body,
    })
    wrappers.push(wrapper)
    return wrapper
  }
  return { ...h, mountWith }
}

/** Her test sonunda: bileşenler, onay/bildirim kuyrukları ve harness sıfırlanır. */
export function resetNotes(): void {
  for (const wrapper of wrappers.splice(0)) wrapper.unmount()
  clients.length = 0
  useConfirm().clear()
  useToast().clear()
  resetHarness()
  document.body.innerHTML = ''
}

/**
 * Ağ + sorgu zinciri yerleşene dek: koşul/olay tabanlı (önbellek olayı + boş durum gözlemi;
 * sabit tur ya da süre tahmini yok — `@/shared/http/__tests__/settle`).
 */
export function settleAll(): Promise<void> {
  return settleQueries(clients)
}

export const toastMessages = () => useToast().queue.value.map((t) => t.message)
