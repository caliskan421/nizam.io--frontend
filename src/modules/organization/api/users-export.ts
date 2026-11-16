/**
 * Kullanıcı CSV dışa aktarma (BE-014, `exportUsersCsv`; S1, yalnız ŞY). Ortak bilet akışı
 * (`shared/download`): bilet hedefi `GET /v1/admin/users/export?...` ve sorgu dizesi `listUsers`
 * süzgeçleriyle bire bire aynıdır (ekranın yüklenmiş sayfası ya da seçim kullanılmaz). Hata
 * (422 `organization.export_too_large`, 429 `organization.export_in_progress`, 503
 * `organization.capacity_full`) tüketimde sınıflandırılır; otomatik tekrar yoktur. Kapsam başlığı
 * etkisizdir (program süzgeci parametreyle gider).
 */
import { readonly, ref } from 'vue'

import {
  useDownloadFlow,
  useDownloadLife,
  type DownloadResult,
  type DownloadTarget,
} from '@/shared/download'

import type { UserListFilters } from '../model/types'

export function usersExportTarget(filters: UserListFilters): DownloadTarget {
  const query = new URLSearchParams()
  const search = filters.search?.trim()
  if (filters.role) query.set('role', filters.role)
  if (search) query.set('search', search)
  if (filters.programId) query.set('program_id', filters.programId)
  if (filters.departmentId) query.set('department_id', filters.departmentId)
  query.set('sort_by', 'name')
  query.set('sort_order', filters.sortOrder)
  return {
    method: 'GET',
    path: `/v1/admin/users/export?${query}`,
    headers: {},
    fallbackName: 'kullanicilar.csv',
  }
}

/** Eylem kapsam/oturum değişiminde ve sahip sökülünce iptal edilir (bilet tüketilmez, dosya kaydedilmez). */
export function useUsersExport() {
  const flow = useDownloadFlow<UserListFilters>(usersExportTarget)
  const life = useDownloadLife()
  const busy = ref(false)

  async function run(filters: UserListFilters): Promise<DownloadResult<UserListFilters>> {
    if (busy.value) return { kind: 'disposed' }
    busy.value = true
    try {
      return await flow.start(filters, life.begin())
    } finally {
      busy.value = false
    }
  }
  return { run, busy: readonly(busy) }
}
