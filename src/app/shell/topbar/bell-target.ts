/**
 * Bildirim hedefi (modül betimi) → tipli rota konumu. Modül `app/` rota kataloğunu içe
 * aktaramadığı için panel `navigate(target)` yayar, kabuk burada `routeLocation` ile çevirir
 * (canlı olmayan rota üretilmez; geçersiz kimlik hatadır).
 */
import { routeLocation, type CatalogLocation } from '@/app/routes.catalog'
import type { NotificationTarget } from '@/modules/notifications/public'

export function bellTargetLocation(target: NotificationTarget): CatalogLocation {
  switch (target.route) {
    case 'work.tasks':
      return routeLocation('work.tasks', {}, { gorev: target.query.gorev })
    case 'collaboration.meeting':
      return routeLocation('collaboration.meeting', { meetingId: target.params.meetingId })
    case 'home':
      return routeLocation('home', {})
  }
}
