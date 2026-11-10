// W96 bileşen testleri: timeline harness'ı (GERÇEK API istemcisi + MSW + gerçek Pinia/kapsam +
// TanStack Query) üstüne bileşen bağlama. Fikstürler örnek veridir, gerçek veri DEĞİLDİR.
import { VueQueryPlugin } from '@tanstack/vue-query'
import { mount } from '@vue/test-utils'
import { getActivePinia } from 'pinia'
import type { Component } from 'vue'

import type { ScopeSelection } from '@/shared/scope/resolve'

import { harness, resetHarness } from '../../../__tests__/harness'
import type { WorkItemSubtask } from '../subtask-format'

export const SUBTASKS_PATH = '/v1/work-items/w1/subtasks'

/** Görevin KENDİ kapsamı: seçili birim (`d1`) değil `d2` (Gantt başka birimin satırını da taşır). */
export const TASK_TARGET = { programId: 'p1', departmentId: 'd2' }

export function mountSubtask(
  component: Component,
  props: Record<string, unknown>,
  scope: ScopeSelection,
) {
  const h = harness(scope)
  const wrapper = mount(component, {
    props,
    attachTo: document.body,
    global: { plugins: [getActivePinia()!, [VueQueryPlugin, { queryClient: h.queryClient }]] },
  })
  return { ...h, wrapper }
}

export function cleanupSubtask(): void {
  resetHarness()
  document.body.innerHTML = ''
}

export function subtask(over: Partial<WorkItemSubtask> = {}): WorkItemSubtask {
  return {
    subtask_id: 's1',
    title: 'Taslak',
    done: false,
    done_by_full_name: null,
    assignee_full_name: null,
    created_by_account_id: 'acc-9',
    created_by_full_name: null,
    created_at: '2026-11-01T08:00:00Z',
    updated_at: '2026-11-01T08:00:00Z',
    edit_revision: 5,
    ...over,
  } as WorkItemSubtask
}
