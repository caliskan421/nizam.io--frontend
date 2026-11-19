import { computed, nextTick, ref, type ComputedRef } from 'vue'

import { reconcileTableCreation, tableCreationKey, tableCreationPhase } from '../model/create-guard'
import type { TableSummary, TableTarget } from '../model/types'

interface Options {
  target: ComputedRef<TableTarget | null>
  account: () => string | null
  listReady: () => boolean
  hasSource: (item: TableSummary) => boolean
  reload: () => Promise<boolean>
}

export function useTableCreatePanel(options: Options) {
  const formOpen = ref(false)
  const source = ref<TableSummary | null>(null)
  const refreshing = ref(false)
  const guardKey = computed(() =>
    options.target.value ? tableCreationKey(options.account(), options.target.value) : '',
  )
  const held = computed(() => tableCreationPhase(guardKey.value))
  const canCreate = computed(() => !!options.target.value && options.listReady() && !held.value)
  let trigger = 'tables-create-trigger'

  function reset() {
    formOpen.value = false
    source.value = null
  }

  function showCreate(element = 'tables-create-trigger') {
    if (!canCreate.value || formOpen.value) return
    trigger = element
    formOpen.value = true
  }

  function showTemplate(item: TableSummary) {
    if (!options.hasSource(item) || !canCreate.value || formOpen.value) return
    source.value = item
    showCreate('tables-template-' + item.id)
  }

  async function closeCreate() {
    reset()
    await nextTick()
    const element =
      document.getElementById(trigger) ?? document.getElementById('tables-blank-trigger')
    element?.focus()
  }

  async function refreshCreationList() {
    if (refreshing.value || !guardKey.value) return false
    refreshing.value = true
    try {
      return await reconcileTableCreation(guardKey.value, options.reload)
    } finally {
      refreshing.value = false
    }
  }

  return {
    held,
    refreshing,
    guardKey,
    canCreate,
    formOpen,
    source,
    reset,
    showCreate,
    showTemplate,
    closeCreate,
    refreshCreationList,
  }
}
