import type { RouteRecordRaw } from 'vue-router'

/** Rota adları/yolları katalogla (`app/routes.catalog.ts`) AYNIDIR; router sapmayı hata sayar. */
export const ARCHIVE_ROUTE = { name: 'archive.folders', path: '/arsiv' } as const
export const ARCHIVE_FOLDER_ROUTE = {
  name: 'archive.folder',
  path: '/arsiv/:klasorId',
} as const

/** 06 süzgeçleri (`q`, `tur`, `sirala`) ve 07 süzgeçleri (K10 rota satırları). */
export const ARCHIVE_QUERY_KEYS = ['q', 'tur', 'sirala'] as const
export const ARCHIVE_FOLDER_QUERY_KEYS = ['gorev', 'etiket', 'gorunum', 'dosya', 'q'] as const

export const archiveRoutes: RouteRecordRaw[] = [
  {
    ...ARCHIVE_ROUTE,
    component: () => import('./pages/ArchivePage.vue'),
    meta: { scope: 'S3' },
  },
  {
    ...ARCHIVE_FOLDER_ROUTE,
    component: () => import('./pages/ArchiveFolderPage.vue'),
    meta: { scope: 'S3' },
  },
]
