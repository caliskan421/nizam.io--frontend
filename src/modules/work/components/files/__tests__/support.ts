// Dosyalar bileşen testlerinin ortak kurulumu (W46): görev modülü koşum takımı (GERÇEK API
// istemcisi + MSW, gerçek Pinia kapsam deposu, TanStack Query) üstüne standing tohumu ve
// bileşen bağlama. Standing sorguları oturum açık değilken istek atmaz; tohum önbellekten okunur.
import { VueQueryPlugin, type QueryClient } from '@tanstack/vue-query'
import { DOMWrapper, mount } from '@vue/test-utils'
import { vi } from 'vitest'
import type { Component } from 'vue'

import { settleQueries } from '@/shared/http/__tests__/settle'
import type { ScopeSelection } from '@/shared/scope/resolve'
import { STANDING_KEYS } from '@/shared/scope/standing'

import { COORD_SCOPE, harness, workItem } from '../../../model/__tests__/harness'
import type { MyDepartment, WorkItemFile } from '../../../model/types'

export interface StandingSeed {
  accountId?: string
  companyAdmin?: boolean
  /** Seçili programdaki (p1) ekip satırları: departman → sunucu rolü. */
  rows?: ReadonlyArray<{ departmentId: string; role: MyDepartment['role'] }>
}

/** `useStanding()` önbelleğine `me` + `me/departments` yazar. */
export function seedStanding(client: QueryClient, seed: StandingSeed | null): void {
  if (seed === null) return
  client.setQueryData(STANDING_KEYS.me, {
    account_id: seed.accountId ?? 'acc-1',
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

export const item = workItem()

export function fileItem(over: Partial<WorkItemFile> = {}): WorkItemFile {
  return {
    file_id: 'f1',
    work_item_id: 'w1',
    display_name: 'rapor.pdf',
    content_type: 'application/pdf',
    size_bytes: 2048,
    tag: 'sonuc',
    uploaded_by_account_id: 'acc-1',
    uploaded_by_full_name: 'Ayşe',
    ...over,
  }
}

/**
 * Bileşeni koşum takımıyla `document.body`'ye bağlar. `Teleport` GERÇEKTİR (saplama pencere
 * gövdesini her çizimde yeniden kurar): pencere içeriği `body()` ile aranır.
 */
export function mountWith(
  component: Component,
  props: Record<string, unknown>,
  options: { selection?: ScopeSelection; standing: StandingSeed | null },
) {
  const h = harness(options.selection ?? COORD_SCOPE)
  seedStanding(h.queryClient, options.standing)
  const wrapper = mount(component, {
    props,
    attachTo: document.body,
    global: {
      plugins: [[VueQueryPlugin, { queryClient: h.queryClient }]],
    },
  })
  return { h, wrapper }
}

/**
 * Tarayıcıda `structuredClone(File)` yine `File` döndürür; jsdom'da değil (bkz.
 * `api/files.test.ts`). Yazma motoru gövdeyi dondururken tarayıcı davranışı korunur.
 */
export function stubBrowserClone(): void {
  const nativeClone = globalThis.structuredClone
  const clone = (value: unknown): unknown => {
    if (value instanceof Blob) return value
    if (Array.isArray(value)) return value.map(clone)
    if (
      value !== null &&
      typeof value === 'object' &&
      Object.getPrototypeOf(value) === Object.prototype
    ) {
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, clone(v)]))
    }
    return nativeClone(value)
  }
  vi.stubGlobal('structuredClone', clone)
}

/** Bağlantı tıklamalarını yakalar (jsdom gezinme yapmaz); tıklanan `href`'ler döner. */
export function captureLinkClicks(): { hrefs: string[]; downloads: string[] } {
  const hrefs: string[] = []
  const downloads: string[] = []
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    hrefs.push(this.getAttribute('href') ?? '')
    downloads.push(this.download)
  })
  return { hrefs, downloads }
}

/**
 * Sorgu ve yazmalar yerleşene dek bekler: koşul/olay tabanlı (önbellek olayı + boş durum
 * gözlemi; sabit tur ya da süre tahmini yok) — `@/shared/http/__tests__/settle`.
 */
export function settle(client: QueryClient): Promise<void> {
  return settleQueries(client)
}

/** Belge gövdesi (ışınlanan pencere içeriği dahil). */
export function body(): DOMWrapper<HTMLElement> {
  return new DOMWrapper(document.body)
}
