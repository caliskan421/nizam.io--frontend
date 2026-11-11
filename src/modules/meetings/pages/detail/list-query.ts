import type { LocationQuery, LocationQueryRaw } from 'vue-router'

/** Detaydan listeye yalnız listeye ait filtreler taşınır. */
export function listQuery(query: LocationQuery): LocationQueryRaw {
  const result: LocationQueryRaw = {}
  for (const key of ['zaman', 'koordinatorluk', 'from', 'to'] as const) {
    const value = query[key]
    if (typeof value === 'string') result[key] = value
  }
  return result
}
