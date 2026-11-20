import { computed, ref, watch } from 'vue'
import { useRoute, useRouter, type LocationQuery, type LocationQueryRaw } from 'vue-router'

import { localDayStart, shiftDay, validDay } from './format'
import { AUDIT_CATEGORIES, type AuditCategory, type AuditQuery } from './types'

const ID = /^[A-Za-z0-9_-]{1,128}$/
const ACTION = /^[a-z0-9_]+(\.[a-z0-9_]+)+$/

function values(query: LocationQuery, key: string, accept: (value: string) => boolean): string[] {
  const raw = query[key]
  return [
    ...new Set(
      (Array.isArray(raw) ? raw : [raw]).filter(
        (entry): entry is string => typeof entry === 'string' && accept(entry),
      ),
    ),
  ].slice(0, 10)
}

export function auditFilters(query: LocationQuery) {
  const from = values(query, 'from', validDay)[0] ?? ''
  const to = values(query, 'to', validDay)[0] ?? ''
  const q = typeof query.q === 'string' ? query.q.trim() : ''
  const categories = values(query, 'tur', Boolean)
  return {
    from,
    to,
    q,
    actor: values(query, 'yapan', (value) => ID.test(value)),
    department: values(query, 'koord', (value) => ID.test(value)),
    category: AUDIT_CATEGORIES.filter((value) => categories.includes(value)),
    action_code: values(query, 'islem', (value) => value.length <= 96 && ACTION.test(value)),
  }
}

export function queryAudit(
  programId: string,
  selection: ReturnType<typeof auditFilters>,
  zone: string,
): AuditQuery {
  const { from, to, q, ...facets } = selection
  return {
    program_id: programId,
    ...(from ? { from: localDayStart(from, zone) } : {}),
    ...(to ? { to: localDayStart(shiftDay(to, 1), zone) } : {}),
    ...(q ? { q } : {}),
    ...Object.fromEntries(Object.entries(facets).filter(([, entries]) => entries.length)),
  }
}

export function useAuditFilters(programId: () => string | null, zone: () => string) {
  const route = useRoute()
  const router = useRouter()
  const selected = computed(() => auditFilters(route.query))
  const search = ref(selected.value.q)
  watch(
    () => selected.value.q,
    (q) => {
      search.value = q
    },
  )
  const invalid = computed(() => {
    const { from, to, q } = selected.value
    return (from && to && from > to) || (q && ([...q].length < 2 || [...q].length > 100))
  })
  const query = computed(() => {
    const id = programId()
    return id && !invalid.value ? queryAudit(id, selected.value, zone()) : null
  })

  function update(patch: LocationQueryRaw): void {
    void router.replace({ query: { ...route.query, ...patch } })
  }

  function toggle(
    key: 'tur' | 'islem' | 'yapan' | 'koord',
    list: readonly string[],
    value: string,
  ): void {
    if (!list.includes(value) && list.length >= 10) return
    update({
      [key]: list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value],
    })
  }

  let anchor = ''
  function chooseDay(day: string, extend: boolean): void {
    if (!extend || !anchor) anchor = day
    const [from, to] = [anchor, day].sort()
    update({ from, to })
  }

  return {
    selected,
    search,
    query,
    invalid,
    update,
    toggle,
    chooseDay,
    clear: () => {
      search.value = ''
      anchor = ''
      void router.replace({ query: {} })
    },
  }
}

export type AuditSelection = ReturnType<typeof auditFilters>
export type { AuditCategory }
