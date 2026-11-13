/**
 * Ana sayfa modülünün rota tarafı. Yol, ad, kapsam SPESİFİKASYONU rota kataloğundadır
 * (`app/routes.catalog.ts` `home`, K10; modül kataloğu içe aktaramaz — sınır kuralı). Router
 * yol/kapsam uyuşmazlığını reddeder. Rota S1'dir: kapsam kabukta seçilir; sayfa kapsamlı (S2)
 * okumaları kapsam tamken bağlar.
 */
import type { RouteRecordRaw } from 'vue-router'

/** Katalog adı ve yolu (katalogla aynı olmak zorunda). */
export const HOME_ROUTE = { name: 'home', path: '/' } as const

/**
 * 01 ana sayfa (katalog `home`, S1; W51): `HomeRoute` sayfa seçicisi — yönetici sayfası,
 * koordinatör K1 ya da üye Ü1 (P53; W140).
 */
export const homeRoutes: RouteRecordRaw[] = [
  {
    path: HOME_ROUTE.path,
    name: HOME_ROUTE.name,
    component: () => import('./pages/HomeRoute.vue'),
    meta: { scope: 'S1' },
  },
]
