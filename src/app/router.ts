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
import { identityRoutes } from '@/modules/identity/public'

// Router'ın tek kaynağı rota kataloğudur (K10): yol, ad, kapsam ve faz katalogdan gelir;
// modüller katalog adına bağlı sayfa bileşenini verir (`modules/<m>/routes.ts`); modülün
// yazdığı yol/kapsam katalogla aynı olmak zorundadır (sapma hatadır).
// Yalnız etkin fazda `canli` rotalar kaydedilir; gizli rotanın yolu bilinmeyen yol gibi ana
// sayfaya düşer.

type ViewLoader = RouteComponent | (() => Promise<RouteComponent>)

/** Modüllerin verdiği sayfa kayıtları (ad → bileşen). Yeni modül buraya `public.ts`'iyle eklenir. */
export const MODULE_ROUTES: readonly RouteRecordRaw[] = [...identityRoutes]

/**
 * Sayfası henüz bağlanmamış canlı rotanın geçici yönlendirmesi. F0'da ana sayfa içeriği
 * (01 grubu) yok; oturum sayfasına gider. F1'de 01 bağlanınca satır kalkar.
 */
export const INTERIM_REDIRECTS: Partial<Record<RouteName, RouteName>> = {
  home: 'identity.session',
}

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
  const target = INTERIM_REDIRECTS[name]
  if (target) return { path: spec.path, name, redirect: { name: target }, meta }
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
