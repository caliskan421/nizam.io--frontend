import type { DownloadTarget } from '@/shared/download'

import type { AuditQuery } from './types'

export function auditExportTarget(filters: AuditQuery): DownloadTarget {
  const query = new URLSearchParams()
  for (const [key, values] of Object.entries(filters)) {
    for (const value of Array.isArray(values) ? values : [values]) {
      if (typeof value === 'string' && value) query.append(key, value)
    }
  }
  return {
    method: 'GET',
    path: `/v1/audit/export?${query}`,
    headers: {},
    fallbackName: 'islem-gecmisi.csv',
  }
}
