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
    case 'collaboration.chat':
      // Yetkili rota `/mesajlar/:chatId`; hedef sıra `mesaj=<seq>` (mevcut `around` okuması).
      return routeLocation('collaboration.chat', { chatId: target.params.chatId }, target.query)
    case 'home':
      return routeLocation('home', {})
  }
}
