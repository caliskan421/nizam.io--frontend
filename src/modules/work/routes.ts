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
 * Sayfa kaydı (`workRoutes`) W42'nin `pages/TasksPage.vue`'su gelince eklenir; `work.tasks`
 * canlı fazda sayfasız kalamaz (router "canlı rotanın sayfası yok" hatası).
 */

/** Katalog adı ve yolu (katalogla aynı olmak zorunda; router uyuşmazlığı reddeder). */
export const TASKS_ROUTE = { name: 'work.tasks', path: '/gorevler' } as const

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
