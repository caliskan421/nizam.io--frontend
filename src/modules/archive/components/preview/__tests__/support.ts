// Önizleme/eylem bileşen testlerinin ortak kurulumu (W124): arşiv koşum takımı (GERÇEK API
// istemcisi + MSW, gerçek Pinia kapsam deposu, TanStack Query) üstüne standing tohumu, onay
// kuyruğu (ConfirmHost) ve nesne URL taklidi.
import { VueQueryPlugin, type QueryClient } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { vi } from 'vitest'
import { defineComponent, h, type Component } from 'vue'

import type { ScopeSelection } from '@/shared/scope/resolve'
import { STANDING_KEYS } from '@/shared/scope/standing'
import { ConfirmHost } from '@/shared/ui/confirm'

import { COORD, archiveFile, harness } from '../../../model/__tests__/harness'
import type { ArchiveFile } from '../../../model/types'

export interface StandingSeed {
  accountId?: string
  companyAdmin?: boolean
  rows?: ReadonlyArray<{ departmentId: string; role: 'koordinator' | 'uye' }>
}

/** `useStanding()` önbelleğine `me` + `me/departments` yazar (oturum kapalıyken istek atılmaz). */
export function seedStanding(client: QueryClient, seed: StandingSeed | null): void {
  if (seed === null) return
  client.setQueryData(STANDING_KEYS.me, {
    account_id: seed.accountId ?? 'me-1',
    email: 'ben@ornek.test',
    full_name: 'Ben',
    company_admin: seed.companyAdmin ?? false,
  })
  client.setQueryData(STANDING_KEYS.myDepartments, {
    truncated: false,
    data: {
      departments: (seed.rows ?? []).map((row) => ({
        program_id: 'p1',
        program_name: 'Program',
        department_id: row.departmentId,
        display_name: 'Birim',
        role: row.role,
      })),
    },
  })
}

export const target = { programId: 'p1', departmentId: 'd1' }

export function file(over: Partial<ArchiveFile> = {}): ArchiveFile {
  return archiveFile(over)
}

/** Açıkça bağlanmış onay kuyruğu + bileşen (onay penceresi gerçek `ConfirmHost`'tan çıkar). */
function withHost(component: Component) {
  return defineComponent({
    inheritAttrs: false,
    setup:
      (_, { attrs }) =>
      () => [h(component, attrs), h(ConfirmHost)],
  })
}

export function mountWith(
  component: Component,
  props: Record<string, unknown>,
  options: { selection?: ScopeSelection; standing: StandingSeed | null; confirm?: boolean },
) {
  const harnessed = harness(options.selection ?? COORD)
  seedStanding(harnessed.queryClient, options.standing)
  const wrapper = mount(options.confirm ? withHost(component) : component, {
    props,
    attachTo: document.body,
    global: { plugins: [[VueQueryPlugin, { queryClient: harnessed.queryClient }]] },
  })
  return { h: harnessed, wrapper }
}

/** Nesne URL'leri ve indirme bağlantısı taklidi; üretilen/serbest bırakılan URL'ler döner. */
export function stubObjectUrls() {
  const created: string[] = []
  const revoked: string[] = []
  Object.assign(URL, {
    createObjectURL: () => {
      const url = `blob:onizleme-${created.length + 1}`
      created.push(url)
      return url
    },
    revokeObjectURL: (url: string) => revoked.push(url),
  })
  const clicked: string[] = []
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    clicked.push(this.download)
  })
  return { created, revoked, clicked }
}

export const body = () => document.body
