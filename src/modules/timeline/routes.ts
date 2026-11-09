/**
 * Zaman çizelgesi modülünün rota tarafı. Yol, ad, kapsam ve süzgeç SPESİFİKASYONU rota
 * kataloğundadır (`app/routes.catalog.ts` `work.timeline`, K10); modül kataloğu içe aktaramaz
 * (sınır kuralı), burada yalnız sayfa kaydı ve modülün URL DAVRANIŞI durur. Rota S2'dir
 * (program kapsamı; Koordinatör/Üye yüzünde departman); katalogla uyuşmazlığı router reddeder.
 *
 *  - Süzgeçler: `durum` (tumu|acik|geciken|biten), `departman` (Admin yüzünde tek departman),
 *    `olcek` (gun|hafta|ay), `secili` (görev kimliği), `altgorev` (yalnız `kapali`).
 *  - Kapsam (program / mercek / birim) değişince Gantt, seçili görev ve bekleyen gecikmeli
 *    gönderim düşer; ölçek ve durum süzgeci korunur (03c satır dışı varsayım 8): `departman`
 *    ve `secili` sıfırlanır.
 */
import type { RouteRecordRaw } from 'vue-router'

/** Katalog adı ve yolu (katalogla aynı olmak zorunda; router uyuşmazlığı reddeder). */
export const TIMELINE_ROUTE = { name: 'work.timeline', path: '/zaman-cizelgesi' } as const

/** Sayfanın okuduğu süzgeç adları (katalog `work.timeline.query` ile aynı küme). */
export const TIMELINE_QUERY_KEYS = ['durum', 'departman', 'olcek', 'secili', 'altgorev'] as const

/** Kapsam değişiminde korunan süzgeçler. */
export const TIMELINE_QUERY_KEPT_ON_SCOPE_CHANGE = ['durum', 'olcek', 'altgorev'] as const

/** Kapsam değişiminden sonraki sorgu: yalnız korunan anahtarlar kalır. */
export function timelineQueryAfterScopeChange(
  query: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  const kept: Record<string, unknown> = {}
  for (const key of TIMELINE_QUERY_KEPT_ON_SCOPE_CHANGE) {
    if (query[key] !== undefined) kept[key] = query[key]
  }
  return kept
}

/** Zaman çizelgesi sayfası (katalog `work.timeline`, S2). */
export const timelineRoutes: RouteRecordRaw[] = [
  {
    path: TIMELINE_ROUTE.path,
    name: TIMELINE_ROUTE.name,
    component: () => import('./pages/TimelinePage.vue'),
    meta: { scope: 'S2' },
  },
]
