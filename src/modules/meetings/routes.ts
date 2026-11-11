import type { RouteRecordRaw } from 'vue-router'

export const MEETINGS_ROUTE = { name: 'collaboration.meetings', path: '/toplantilar' } as const
export const MEETING_ROUTE = {
  name: 'collaboration.meeting',
  path: '/toplantilar/:meetingId',
} as const
export const MEETINGS_QUERY_KEYS = ['zaman', 'koordinatorluk', 'from', 'to'] as const
export const MEETING_QUERY_KEYS = ['notlar'] as const
export const meetingsRoutes: RouteRecordRaw[] = [
  { ...MEETINGS_ROUTE, component: () => import('./pages/MeetingsPage.vue'), meta: { scope: 'S2' } },
  {
    ...MEETING_ROUTE,
    component: () => import('./pages/MeetingDetailPage.vue'),
    meta: { scope: 'S2' },
  },
]
