/**
 * Görev modülünün rota tarafı. Yol, ad, kapsam ve süzgeç SPESİFİKASYONU rota kataloğundadır
 * (`app/routes.catalog.ts` `work.tasks`, K10); modül kataloğu içe aktaramaz (sınır kuralı),
 * burada yalnız modülün URL DAVRANIŞI durur:
 *
 *  - Kapsam (program / mercek / birim) değişince: arama (`q`), durum sekmesi (`durum`), talep
 *    süzgeci (`talep`) ve sıralama (`sirala`) korunur; koordinatörlük süzgeci ve açık görev
 *    (`gorev`) sıfırlanır (03 README satır dışı varsayım, kabul — K2 yalnız `scoped` sorguları
 *    düşürür). İmleç URL'de yoktur (E-03-39), sonsuz sorgu anahtarıyla zaten düşer.
 *  - Görev bağlantısı (E-03-55 "Kopyala", P7): `/gorevler?gorev=<id>`.
 *
 * Sayfa kaydı `workRoutes` (W42): `work.tasks` → `pages/TasksPage.vue`. Router yol/kapsam
 * uyuşmazlığını reddeder; süzgeç adları ve değer kümeleri katalogla aynıdır
 * (`TASKS_QUERY_KEYS`, `TASKS_STATUS_FILTERS`, `TASKS_SORT_FIELDS` — `routes.catalog.test.ts`).
 */
import type { RouteRecordRaw } from 'vue-router'

/** Katalog adı ve yolu (katalogla aynı olmak zorunda; router uyuşmazlığı reddeder). */
export const TASKS_ROUTE = { name: 'work.tasks', path: '/gorevler' } as const

/** Sorgu dizgisindeki süzgeç adları (katalog `work.tasks.query` ile aynı küme). */
export const TASKS_QUERY_KEYS = [
  'durum',
  'talep',
  'q',
  'koordinatorluk',
  'sirala',
  'gorev',
] as const

/**
 * `durum` değerleri: beş sözleşme durumu (P5, `iade_edildi` dahil) + türetilmiş "Geciken"
 * (`is_overdue`, P5/G3). "Tümü" parametresizdir.
 */
export const TASKS_STATUS_FILTERS = [
  'baslanmadi',
  'devam_ediyor',
  'onaya_sunuldu',
  'iade_edildi',
  'tamamlandi',
  'geciken',
] as const

/** `sirala` alanları (`alan:artan|azalan`; E-03-16, istemci sıralaması BE-040). */
export const TASKS_SORT_FIELDS = ['gorev', 'durum', 'bitis'] as const

/** Görev listesi sayfası (katalog `work.tasks`, S2). */
export const workRoutes: RouteRecordRaw[] = [
  {
    path: TASKS_ROUTE.path,
    name: TASKS_ROUTE.name,
    component: () => import('./pages/TasksPage.vue'),
    meta: { scope: 'S2' },
  },
]

/** Kapsam değişiminde korunan süzgeçler. */
export const TASKS_QUERY_KEPT_ON_SCOPE_CHANGE = ['durum', 'talep', 'q', 'sirala'] as const

/**
 * Kapsam değişiminden sonraki sorgu: yalnız korunan anahtarlar kalır (koordinatörlük,
 * `gorev` ve bilinmeyen anahtarlar düşer).
 */
export function tasksQueryAfterScopeChange(
  query: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  const kept: Record<string, unknown> = {}
  for (const key of TASKS_QUERY_KEPT_ON_SCOPE_CHANGE) {
    if (query[key] !== undefined) kept[key] = query[key]
  }
  return kept
}

/** Görevin paylaşılabilir bağlantısı (E-03-55): `<origin>/gorevler?gorev=<id>`. */
export function taskLink(origin: string, workItemId: string): string {
  const url = new URL(TASKS_ROUTE.path, origin)
  url.searchParams.set('gorev', workItemId)
  return url.toString()
}
