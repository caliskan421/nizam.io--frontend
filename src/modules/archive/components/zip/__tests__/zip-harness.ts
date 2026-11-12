// ZIP düğmeleri bileşen testleri: GERÇEK API istemcisi + MSW (arşiv harness'ının sunucusu),
// gerçek Pinia kapsam deposu, TanStack Query. Oturum deposu test dosyasında `vi.mock` ile
// taklit edilir (standing okunsun diye). Blob kaydı (`URL.createObjectURL` + bağlantı tıklaması)
// gözlenir.
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { expect, vi } from 'vitest'
import type { Component } from 'vue'

import type { ScopeSelection } from '@/shared/scope/resolve'
import { useScopeStore } from '@/shared/scope/store'

import { http, HttpResponse, json, ORIGIN, standing } from '../../../model/__tests__/harness'

export const TARGET = { programId: 'p1', departmentId: 'd7' }

const mounted: VueWrapper[] = []

export function unmountAll(): void {
  for (const wrapper of mounted.splice(0)) wrapper.unmount()
  document.body.innerHTML = ''
}

/** Kaydedilen indirme adları (bağlantı tıklaması) ve blob sayacı. */
export function spySaves() {
  const saved: string[] = []
  Object.assign(URL, { createObjectURL: () => 'blob:zip', revokeObjectURL: () => undefined })
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    saved.push(this.download)
  })
  return saved
}

export function ticketOk() {
  return http.post(`${ORIGIN}/v1/download-tickets`, () =>
    json({ ticket: 'tk_1', url: '/v1/downloads/tk_1', expires_at: '2026-11-12T12:01:00Z' }, 201),
  )
}

export function zipBody(headers: HeadersInit = {}) {
  return http.get(`${ORIGIN}/v1/downloads/tk_1`, () =>
    HttpResponse.arrayBuffer(new Uint8Array([80, 75]).buffer, {
      headers: { 'Content-Type': 'application/zip', ...headers },
    }),
  )
}

export interface Who {
  admin?: boolean
  /** [program, departman, rol] satırları. */
  rows?: ReadonlyArray<readonly [string, string, string]>
}

export function standingHandlers(who: Who) {
  return standing({ admin: who.admin, rows: who.rows })
}

export async function mountZip(
  component: Component,
  props: Record<string, unknown>,
  selection: ScopeSelection,
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retryDelay: 0, retry: false }, mutations: { retry: false } },
  })
  const pinia = createPinia()
  setActivePinia(pinia)
  useScopeStore().commit(selection)
  const wrapper = mount(component, {
    props,
    attachTo: document.body,
    global: { plugins: [pinia, [VueQueryPlugin, { queryClient }]] },
  })
  mounted.push(wrapper)
  await vi.waitFor(() => expect(queryClient.isFetching()).toBe(0))
  await flushPromises()
  return { wrapper, queryClient }
}
