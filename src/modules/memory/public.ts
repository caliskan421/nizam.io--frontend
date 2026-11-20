import type { RouteRecordRaw } from 'vue-router'

export { addExperienceTaskNotes } from './api/memory'
export { default as MemoryNoteAction } from './components/MemoryNoteAction.vue'
export { useMemoryQueries } from './model/queries'
export { default as MemorySuggestions } from './components/MemorySuggestions.vue'

export const memoryRoutes: RouteRecordRaw[] = [
  {
    name: 'memory',
    path: '/kurumsal-hafiza',
    component: () => import('./pages/MemoryPage.vue'),
    meta: { scope: 'S2' },
  },
]
