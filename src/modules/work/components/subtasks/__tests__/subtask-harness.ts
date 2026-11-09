// Alt görev bileşen testleri: W41 düzeneği (GERÇEK API istemcisi + MSW + gerçek Pinia kapsam
// deposu + TanStack Query) üstüne bileşen bağlama ve yetki olguları (standing) tohumu. Standing
// sorguları oturum yokken kapalıdır; önbelleğe yazılan değer `useStanding()`'den aynen okunur.
import { VueQueryPlugin } from '@tanstack/vue-query'
import { mount, type VueWrapper } from '@vue/test-utils'
import { getActivePinia } from 'pinia'
import { vi } from 'vitest'
import type { Component } from 'vue'

import { STANDING_KEYS } from '@/shared/scope/standing'
import type { ScopeSelection } from '@/shared/scope/resolve'
import { useConfirm } from '@/shared/ui/confirm'
import { useToast } from '@/shared/ui'

import { harness, resetHarness } from '../../../model/__tests__/harness'

export const ME = 'acc-1'

export interface Actor {
  admin?: boolean
  /** Görevin departmanındaki (`d2`) ekip satırının sunucu rolü. */
  role?: 'koordinator' | 'uye'
  accountId?: string
}

/** Bileşeni gerçek düzenekte bağlar; standing olguları önbelleğe tohumlanır. */
export function mountSubtasks(
  component: Component,
  props: Record<string, unknown>,
  actor: Actor,
  scope: ScopeSelection,
) {
  const h = harness(scope)
  const departments = actor.role
    ? [
        {
          program_id: 'p1',
          program_name: 'Program',
          department_id: 'd2',
          display_name: 'Birim',
          role: actor.role,
        },
      ]
    : []
  h.queryClient.setQueryData(STANDING_KEYS.me, {
    account_id: actor.accountId ?? ME,
    email: 'kisi@example.test',
    full_name: 'Deneme Kişi',
    company_admin: actor.admin === true,
  })
  h.queryClient.setQueryData(STANDING_KEYS.myDepartments, {
    data: { departments },
    truncated: false,
  })
  const wrapper = mount(component, {
    props,
    attachTo: document.body,
    global: {
      plugins: [getActivePinia()!, [VueQueryPlugin, { queryClient: h.queryClient }]],
      // Kanıt yuvası W46'nın bileşenidir (kendi testleri orada); burada yalnız yeri denetlenir.
      stubs: { SubtaskFileSlot: true },
    },
  })
  return { ...h, wrapper }
}

/** Test sonu: bağlı bileşenler, onay kuyruğu, bildirimler ve kayıtlar temizlenir. */
export function cleanupSubtasks(): void {
  useConfirm().clear()
  useToast().clear()
  resetHarness()
  document.body.innerHTML = ''
}

/** Kontrollü yanıt: test `release()` çağırana dek istek askıda kalır (gerçek bekleme yok). */
export function deferred() {
  let release: () => void = () => undefined
  const gate = new Promise<void>((resolve) => (release = resolve))
  return { gate, release: () => release() }
}

/** Alt görev listesi yüklendi (yükleniyor satırı kalktı). */
export async function listLoaded(wrapper: VueWrapper): Promise<void> {
  await vi.waitFor(() => {
    if (wrapper.find('[role="status"]').exists()) throw new Error('alt görevler yükleniyor')
  })
}
