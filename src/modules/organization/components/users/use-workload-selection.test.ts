import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

import { settleQueries } from '@/shared/http/__tests__/settle'
import { queryKeys } from '@/shared/http/query-keys'

import { resetHarness, server } from '../../__tests__/harness'
import { ADMIN_ME, baseHandlers, mountWith, unmountAll } from './__tests__/users-harness'
import { useWorkloadSelection, type WorkloadSelection } from './use-workload-selection'

vi.mock('@/shared/session/store', () => ({ useSessionStore: () => ({ isAuthenticated: true }) }))

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  unmountAll()
  resetHarness()
})
afterAll(() => server.close())

async function mountSelection(
  fixture = ADMIN_ME,
  selection = { programId: 'p1' as string | null, lens: 'admin' as const, departmentId: null },
) {
  server.use(...baseHandlers(fixture))
  let captured!: WorkloadSelection
  const host = defineComponent({
    setup() {
      captured = useWorkloadSelection()
      return () => h('div')
    },
  })
  const mounted = await mountWith(host, {}, { selection })
  return { ...mounted, selection: captured }
}

describe('useWorkloadSelection (E-13-60…62)', () => {
  it('seçim bellekte Set: işaretle, kaldır, topluca ekle/çıkar, temizle', async () => {
    const { selection } = await mountSelection()
    selection.toggle('u1')
    selection.toggle('u2')
    expect(selection.ids.value).toEqual(['u1', 'u2'])
    expect(selection.count.value).toBe(2)
    selection.toggle('u1')
    expect(selection.isSelected('u1')).toBe(false)
    selection.setMany(['u1', 'u3', 'u2'], true)
    expect(selection.ids.value.sort()).toEqual(['u1', 'u2', 'u3'])
    selection.setMany(['u1', 'u2'], false)
    expect(selection.ids.value).toEqual(['u3'])
    selection.clear()
    expect(selection.count.value).toBe(0)
  })

  it('rapor eylemi yalnız şirket yöneticisinde açık (canExportWorkload)', async () => {
    const admin = await mountSelection()
    await vi.waitFor(() => expect(admin.selection.enabled.value).toBe(true))
    expect(admin.selection.enabled.value).toBe(true)
    unmountAll()
    const member = await mountSelection({
      accountId: 'me',
      companyAdmin: false,
      rows: [{ department_id: 'd1', role: 'koordinator' }],
    })
    await settleQueries(member.queryClient)
    // Standing yüklendi (koordinatör satırı var) ve yine de eylem kapalı.
    expect(member.queryClient.getQueryData(queryKeys.me.root())).toBeDefined()
    expect(member.selection.enabled.value).toBe(false)
  })

  it('seçilemeyen satır: program seçiliyken program etiketi yok; program yoksa bilgi yok → etkin', async () => {
    const withProgram = await mountSelection()
    const label = { programId: 'p1', departmentId: 'd1', role: 'member' as const }
    expect(withProgram.selection.canPick({ labels: [label] })).toBe(true)
    expect(withProgram.selection.canPick({ labels: [] })).toBe(false)
    unmountAll()
    const noProgram = await mountSelection(ADMIN_ME, {
      programId: null,
      lens: 'admin',
      departmentId: null,
    })
    expect(noProgram.selection.programReady.value).toBe(false)
    expect(noProgram.selection.canPick({ labels: [] })).toBe(true)
  })

  it('kapsam (program) değişince seçim temizlenir', async () => {
    const { selection, store } = await mountSelection()
    selection.toggle('u1')
    store.commit({ programId: 'p2', lens: 'admin', departmentId: null })
    expect(selection.count.value).toBe(0)
  })

  it('sahip sökülünce kapsam dinleyicisi bırakılır (sızıntı yok)', async () => {
    const { selection, store, wrapper } = await mountSelection()
    wrapper.unmount()
    selection.toggle('u1')
    store.commit({ programId: 'p2', lens: 'admin', departmentId: null })
    expect(selection.count.value).toBe(1)
  })
})
