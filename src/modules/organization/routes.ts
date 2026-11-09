/**
 * Organizasyon modülünün rota tarafı (05, 05b, 08, 08b). Yol, ad, kapsam ve süzgeç
 * SPESİFİKASYONU rota kataloğundadır (`app/routes.catalog.ts`, K10); modül kataloğu içe
 * aktaramaz (sınır kuralı) — burada modülün URL DAVRANIŞI ve sayfa kaydı durur. Süzgeç adları ve
 * değer kümeleri katalogla aynıdır (`routes.catalog.test.ts`); rol değeri taşıyan `rol` kümesi
 * capability dosyasındadır ve katalog onu buradan okur (K1 lint).
 *
 *  - Rota kapısı: dört rota da `company_admin` olgusuyla açılır (P1, P13, P16); yönetici olmayan
 *    doğrudan URL'de ana sayfaya döner (`routing/AdminGate.vue`). Sayfa kapı geçilince yüklenir.
 *  - Kapsam değişimi (05 / 08 satır dışı, 03 kalıbı): 05'te arama (`q`) ve rol sekmesi (`rol`)
 *    korunur, koordinatörlük süzgeci ve `secili` sıfırlanır (imleç URL'de yok, anahtarla düşer);
 *    08'de arama ve görünüm korunur, sıralama varsayılana döner.
 */
import { defineComponent, h, type Component } from 'vue'
import type { RouteRecordRaw } from 'vue-router'

import { USER_ROLE_TABS } from './model/capabilities'
import AdminGate from './routing/AdminGate.vue'

export { USER_ROLE_TABS }

/** Katalog adları ve yolları (katalogla aynı olmak zorunda; router uyuşmazlığı reddeder). */
export const USERS_ROUTE = { name: 'organization.users', path: '/kullanicilar' } as const
export const USER_ROUTE = { name: 'organization.user', path: '/kullanicilar/:accountId' } as const
export const COORDINATORSHIPS_ROUTE = {
  name: 'organization.coordinatorships',
  path: '/koordinatorlukler',
} as const
export const COORDINATORSHIP_ROUTE = {
  name: 'organization.coordinatorship',
  path: '/koordinatorlukler/:departmentId',
} as const

/** 05 süzgeçleri (E-05-06/07/08/13). Sayfa/imleç URL'de taşınmaz (P4). */
export const USERS_QUERY_KEYS = ['rol', 'q', 'koordinatorluk', 'secili'] as const
/** 05b (E-05-53…57, E-05-68). */
export const USER_QUERY_KEYS = ['sekme', 'kart', 'grupla', 'ay'] as const
export const USER_TABS = ['gorevler', 'dosyalar', 'etkinlik', 'hesap'] as const
export const USER_CARDS = ['tamamlanan', 'acik', 'geciken', 'onayda'] as const
export const USER_GROUPINGS = ['son-tarih', 'durum'] as const
/** 08 (E-08-12/13/16): görünüm yalnız `liste` ("Yapı" BE-016); sıralama yalnız ada göre. */
export const COORDINATORSHIPS_QUERY_KEYS = ['gorunum', 'q', 'sirala'] as const
export const COORDINATORSHIPS_VIEWS = ['liste'] as const
export const COORDINATORSHIPS_SORT_FIELDS = ['ad'] as const
/** 08b (E-08-57): Arşiv (F5) / Toplantılar (F4) devre dışı sekmeler URL'de seçilemez. */
export const COORDINATORSHIP_QUERY_KEYS = ['sekme'] as const
export const COORDINATORSHIP_TABS = ['genel', 'uyeler', 'gorevler', 'ayarlar'] as const

const USERS_KEPT_ON_SCOPE_CHANGE = ['q', 'rol'] as const
const COORDINATORSHIPS_KEPT_ON_SCOPE_CHANGE = ['q', 'gorunum'] as const

function keep(
  query: Readonly<Record<string, unknown>>,
  keys: readonly string[],
): Record<string, unknown> {
  const kept: Record<string, unknown> = {}
  for (const key of keys) if (query[key] !== undefined) kept[key] = query[key]
  return kept
}

/** 05 kapsam değişiminden sonraki sorgu (koordinatörlük, `secili`, bilinmeyenler düşer). */
export function usersQueryAfterScopeChange(query: Readonly<Record<string, unknown>>) {
  return keep(query, USERS_KEPT_ON_SCOPE_CHANGE)
}

/** 08 kapsam değişiminden sonraki sorgu (sıralama varsayılana döner). */
export function coordinatorshipsQueryAfterScopeChange(query: Readonly<Record<string, unknown>>) {
  return keep(query, COORDINATORSHIPS_KEPT_ON_SCOPE_CHANGE)
}

/** 05 satırı / 05b "Profili düzenle" (E-05-45): yan paneli açan bağlantı. */
export function usersPanelLocation(accountId: string) {
  return { name: USERS_ROUTE.name, query: { secili: accountId } }
}

/** 05 ad → 05b (E-05-16). */
export function userLocation(accountId: string, query: Record<string, string> = {}) {
  return { name: USER_ROUTE.name, params: { accountId }, query }
}

/** 08 kart → 08b (E-08-29/34/35, `sekme`). */
export function coordinatorshipLocation(departmentId: string, sekme?: string) {
  return {
    name: COORDINATORSHIP_ROUTE.name,
    params: { departmentId },
    query: sekme ? { sekme } : {},
  }
}

/** Sayfayı yönetim kapısının içinde çizen rota bileşeni (sayfa kapıdan sonra yüklenir). */
function gated(name: string, load: () => Promise<{ default: Component }>) {
  return () =>
    load().then(({ default: page }) =>
      defineComponent({
        name,
        setup: () => () => h(AdminGate, null, { default: () => h(page) }),
      }),
    )
}

/** Sayfa kayıtları (katalog `organization.*`; F2'de canlı). */
export const organizationRoutes: RouteRecordRaw[] = [
  {
    path: USERS_ROUTE.path,
    name: USERS_ROUTE.name,
    component: gated('OrganizationUsersRoute', () => import('./pages/UsersPage.vue')),
    meta: { scope: 'S1' },
  },
  {
    path: USER_ROUTE.path,
    name: USER_ROUTE.name,
    component: gated('OrganizationUserRoute', () => import('./pages/UserPage.vue')),
    meta: { scope: 'S2' },
  },
  {
    path: COORDINATORSHIPS_ROUTE.path,
    name: COORDINATORSHIPS_ROUTE.name,
    component: gated(
      'OrganizationCoordinatorshipsRoute',
      () => import('./pages/CoordinatorshipsPage.vue'),
    ),
    meta: { scope: 'S2' },
  },
  {
    path: COORDINATORSHIP_ROUTE.path,
    name: COORDINATORSHIP_ROUTE.name,
    component: gated(
      'OrganizationCoordinatorshipRoute',
      () => import('./pages/CoordinatorshipPage.vue'),
    ),
    meta: { scope: 'S2' },
  },
]
