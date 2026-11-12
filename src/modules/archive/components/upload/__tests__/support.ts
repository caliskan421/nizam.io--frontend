// Yükleme penceresi testlerinin ortak kurulumu (W125): arşiv koşum takımı (GERÇEK API istemcisi
// + MSW, gerçek Pinia kapsam deposu, TanStack Query) üstüne standing tohumu ve bir tetikleyici
// düğmeli `v-if` ana bileşen (sayfa sahibinin bağlama biçimi; odak dönüşü sınanır).
import { VueQueryPlugin } from '@tanstack/vue-query'
import { DOMWrapper, mount } from '@vue/test-utils'
import { vi } from 'vitest'
import { defineComponent, h as render, ref } from 'vue'

import type { QueryClient } from '@tanstack/vue-query'

import type { components } from '@/shared/api/schema'
import { i18n } from '@/shared/i18n'
import { STANDING_KEYS } from '@/shared/scope/standing'

import { COORD, harness } from '../../../model/__tests__/harness'
import type { ScopeSelection } from '@/shared/scope/resolve'
import type { UploadTask } from '../../../model/types'
import UploadDialog from '../UploadDialog.vue'

export interface StandingSeed {
  accountId?: string
  companyAdmin?: boolean
  rows?: ReadonlyArray<{
    departmentId: string
    role: components['schemas']['MyDepartment']['role']
  }>
}

export function seedStanding(client: QueryClient, seed: StandingSeed): void {
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

export const TASKS: UploadTask[] = [
  { workItemId: 'w1', title: 'Rapor yaz', departmentId: 'd1' },
  { workItemId: 'w2', title: 'Plan hazırla', departmentId: 'd1' },
  { workItemId: 'w3', title: 'Başka birim işi', departmentId: 'd2' },
]

let defaultStanding: StandingSeed = {}
/** Testin varsayılan standing tohumu (rol dizeleri yalnız `*.test.ts` içinde yazılır; K1). */
export function setDefaultStanding(seed: StandingSeed): void {
  defaultStanding = seed
}

export interface Mounted {
  h: ReturnType<typeof harness>
  wrapper: ReturnType<typeof mount>
  trigger: () => HTMLButtonElement
  events: { closed: number; uploaded: string[] }
  shown: () => boolean
}

/**
 * Tetikleyici düğme + `v-if` UploadDialog. `close` ve `uploaded` sayfa sahibi gibi kapatır
 * (`v-if` söker); `events` sayar.
 */
export function mountDialog(
  props: { tasks?: UploadTask[]; defaultTaskId?: string | null } = {},
  options: { selection?: ScopeSelection; standing?: StandingSeed } = {},
): Mounted {
  const h = harness(options.selection ?? COORD)
  seedStanding(h.queryClient, options.standing ?? defaultStanding)
  const events = { closed: 0, uploaded: [] as string[] }
  const visible = ref(true)
  const Host = defineComponent({
    setup: () => () => [
      render('button', { id: 'trigger', type: 'button' }, 'Dosya yükle'),
      visible.value
        ? render(UploadDialog, {
            tasks: props.tasks ?? TASKS,
            defaultTaskId: props.defaultTaskId ?? null,
            onClose: () => {
              events.closed += 1
              visible.value = false
            },
            onUploaded: (id: string) => events.uploaded.push(id),
          })
        : null,
    ],
  })
  document.body.innerHTML = ''
  const wrapper = mount(Host, {
    attachTo: document.body,
    global: { plugins: [i18n, [VueQueryPlugin, { queryClient: h.queryClient }]] },
  })
  const trigger = () => document.getElementById('trigger') as HTMLButtonElement
  trigger().focus()
  return { h, wrapper, trigger, events, shown: () => visible.value }
}

/** Pencere Teleport ile `body`'dedir. */
export const body = () => new DOMWrapper(document.body)

export function pdf(name = 'rapor.pdf'): File {
  return new File(['abc'], name, { type: 'application/pdf' })
}

/** Gizli dosya girdisine dosya verir (tarayıcı seçimi gibi). */
export async function choose(file: File = pdf()) {
  const input = body().find('[data-testid="upload-file"]')
  Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
  await input.trigger('change')
}

export async function pick(testid: string, value: string) {
  await body().find(`[data-testid="${testid}"]`).setValue(value)
}

/** Tarayıcıda `structuredClone(File)` yine `File`; jsdom'da değil (api/writes.test.ts ile aynı). */
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
