import { computed, type ComputedRef } from 'vue'

import { ApiError } from '@/shared/errors/api-error'

import { useTables } from '../api/tables'
import type { TableTarget } from '../model/types'

export function useTableCatalog(
  target: ComputedRef<TableTarget | null>,
  isList: ComputedRef<boolean>,
) {
  const list = useTables(target, isList)
  const templates = useTables(target, isList, true)
  const listError = computed(() => (list.error.value instanceof ApiError ? list.error.value : null))
  const templateError = computed(() =>
    templates.error.value instanceof ApiError ? templates.error.value : null,
  )
  const listItems = computed(() => list.data.value?.pages.flatMap((page) => page.items) ?? [])
  const templateItems = computed(
    () =>
      templates.data.value?.pages
        .flatMap((page) => page.items)
        .filter((item) => item.is_template) ?? [],
  )
  const recoverSource = () => void Promise.all([list.refetch(), templates.refetch()])
  return { list, templates, listError, templateError, listItems, templateItems, recoverSource }
}
