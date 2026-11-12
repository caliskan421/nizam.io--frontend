import {
  createRouter,
  createWebHistory,
  type RouteComponent,
  type RouteRecordRaw,
  type Router,
  type RouterHistory,
} from 'vue-router'

import {
  activeMenuKey,
  CURRENT_PHASE,
  isRouteName,
  liveRouteNames,
  type Phase,
  type RouteName,
  routeSpec,
} from '@/app/routes.catalog'
import { archiveRoutes } from '@/modules/archive/public'
import { homeRoutes } from '@/modules/home/public'
import { meetingsRoutes } from '@/modules/meetings/public'
import { identityRoutes } from '@/modules/identity/public'
import { organizationRoutes } from '@/modules/organization/public'
import { programRoutes } from '@/modules/program/public'
import { timelineRoutes } from '@/modules/timeline/public'
import { workRoutes } from '@/modules/work/public'

// Router'ın tek kaynağı rota kataloğudur (K10): yol, ad, kapsam ve faz katalogdan gelir;
// modüller katalog adına bağlı sayfa bileşenini verir (`modules/<m>/routes.ts`); modülün
// yazdığı yol/kapsam katalogla aynı olmak zorundadır (sapma hatadır).
// Yalnız etkin fazda `canli` rotalar kaydedilir; gizli rotanın yolu bilinmeyen yol gibi ana
// sayfaya düşer.

type ViewLoader = RouteComponent | (() => Promise<RouteComponent>)

/**
 * Sayfa kayıtları (ad → bileşen). Yeni modül buraya `public.ts`'iyle eklenir. Ana sayfa (`home`)
 * 01 modülünün sayfasıdır (`modules/home`, W51; F0 yer tutucusunun yerine).
 */
export const MODULE_ROUTES: readonly RouteRecordRaw[] = [
  ...homeRoutes,
  ...identityRoutes,
  ...workRoutes,
  ...organizationRoutes,
  ...programRoutes,
  ...timelineRoutes,
  ...meetingsRoutes,
  ...archiveRoutes,
]

function moduleViews(records: readonly RouteRecordRaw[]): Map<RouteName, ViewLoader> {
  const views = new Map<RouteName, ViewLoader>()
  for (const record of records) {
    if (!isRouteName(record.name)) {
      throw new Error(`modül rotası katalogda yok: ${String(record.name)}`)
    }
    if (views.has(record.name)) throw new Error(`modül rotası iki kez: ${record.name}`)
    if (!record.component) throw new Error(`modül rotası bileşensiz: ${record.name}`)
    if (record.path !== routeSpec(record.name).path) {
      throw new Error(`modül rotası yolu katalogla uyuşmuyor: ${record.name}`)
    }
    const declared = record.meta?.scope
    if (declared && declared !== routeSpec(record.name).scope) {
      throw new Error(`modül rotası kapsamı katalogla uyuşmuyor: ${record.name}`)
    }
    views.set(record.name, record.component)
  }
  return views
}

function toRecord(name: RouteName, view: ViewLoader | undefined): RouteRecordRaw {
  const spec = routeSpec(name)
  const meta = { scope: spec.scope, title: spec.title, menuKey: activeMenuKey(name) }
  if (view) return { path: spec.path, name, component: view, meta }
  throw new Error(`canlı rotanın sayfası yok: ${name}`)
}

/** Katalogdan rota kayıtları; tutarsızlık (katalog dışı ad, bileşensiz canlı rota) hatadır. */
export function buildRoutes(
  phase: Phase = CURRENT_PHASE,
  records: readonly RouteRecordRaw[] = MODULE_ROUTES,
): RouteRecordRaw[] {
  const views = moduleViews(records)
  const live = liveRouteNames(phase).map((name) => toRecord(name, views.get(name)))
  return [...live, { path: '/:pathMatch(.*)*', redirect: { name: 'home' } }]
}

export function createAppRouter(history: RouterHistory = createWebHistory()): Router {
  return createRouter({ history, routes: buildRoutes() })
}
