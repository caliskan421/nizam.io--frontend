import { afterEach, describe, expect, it } from 'vitest'

import type { ScopeSelection } from '@/shared/scope/resolve'

import { ADMIN_SCOPE, COORD_SCOPE, harness, resetHarness } from '../../model/__tests__/harness'
import { fileItem, item, seedStanding, type StandingSeed } from './__tests__/support'
import { useFileAccess } from './use-file-access'

afterEach(() => resetHarness())

const COORDINATOR: StandingSeed = {
  accountId: 'acc-7',
  rows: [{ departmentId: 'd2', role: 'koordinator' }],
}
const ASSIGNED: StandingSeed = { accountId: 'acc-1', rows: [{ departmentId: 'd2', role: 'uye' }] }
const UNASSIGNED: StandingSeed = {
  accountId: 'acc-5',
  rows: [{ departmentId: 'd2', role: 'uye' }],
}
const ADMIN: StandingSeed = { accountId: 'acc-9', companyAdmin: true }
const ADMIN_COORD: StandingSeed = { ...COORDINATOR, companyAdmin: true }

function access(seed: StandingSeed | null, selection: ScopeSelection = COORD_SCOPE) {
  const h = harness(selection)
  seedStanding(h.queryClient, seed)
  return h.run(() => useFileAccess(item))
}

const own = fileItem({ uploaded_by_account_id: 'acc-7' })
const mine = fileItem({ uploaded_by_account_id: 'acc-1' })
const other = fileItem({ uploaded_by_account_id: 'acc-3' })

describe('dosya eylem görünürlüğü (istemci-akislari §4 s.148–s.150)', () => {
  it('koordinatör: yükler, her dosyanın adını değiştirir, yalnız kendi yüklediğini siler', () => {
    const a = access(COORDINATOR)
    expect(a.canUpload.value).toBe(true)
    expect(a.canRename(other)).toBe(true)
    expect(a.canDelete(other)).toBe(false)
    expect(a.canDelete(own)).toBe(true)
  })

  it('atanmış üye: yükler; yalnız kendi dosyasının adını değiştirir ve siler', () => {
    const a = access(ASSIGNED)
    expect(a.canUpload.value).toBe(true)
    expect(a.canRename(mine)).toBe(true)
    expect(a.canDelete(mine)).toBe(true)
    expect(a.canRename(other)).toBe(false)
    expect(a.canDelete(other)).toBe(false)
  })

  it('atanmamış üye yükleyemez', () => {
    expect(access(UNASSIGNED).canUpload.value).toBe(false)
  })

  it('yönetici: ekip satırı/atama olmadan yükler (ADR-0030); ad değiştirir, yalnız kendi dosyasını siler', () => {
    const a = access(ADMIN, ADMIN_SCOPE)
    expect(a.canUpload.value).toBe(true)
    expect(a.canRename(other)).toBe(true)
    expect(a.canDelete(other)).toBe(false) // başkasının dosyasını yönetici silemez
    // Yükleyen yönetici ekip satırı olmadan siler (s.150, RECORDS-K10); mercek yetki değildir (P1).
    expect(a.canDelete(fileItem({ uploaded_by_account_id: ADMIN.accountId }))).toBe(true)
    expect(access(ADMIN_COORD, COORD_SCOPE).canUpload.value).toBe(true)
  })

  it('standing yoksa her eylem gizli (en dar güvenli davranış)', () => {
    const a = access(null)
    expect(a.canUpload.value).toBe(false)
    expect(a.canRename(other)).toBe(false)
    expect(a.canDelete(mine)).toBe(false)
  })
})
