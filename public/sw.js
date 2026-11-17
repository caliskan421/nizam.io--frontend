/*
 * Web Push service worker (14 Bildirimler, E-14-74…76; P58). YALNIZ `push` ve `notificationclick`
 * dinler: `fetch`/önbellek yok, `skipWaiting` yok (açık sekme bozulmaz). Kayıt, kullanıcı
 * "Bildirimleri aç"a bastıktan sonra yapılır (src/modules/notifications/api/push-client.ts).
 *
 * Push yükü METİNSİZDİR (ADR-0009): `{type, subject_ref: {kind, id}, notification_id}`. Başlık
 * sabit, gövde `type` sözlüğünden GENEL cümledir (aktör/başlık/kod/tarih yok). Aşağıdaki sözlük ve
 * hedef eşlemesi `src/modules/notifications/model/{dictionary,target}.ts` ile `trNotifications.rows`
 * cümlelerinin KOPYASIDIR (service worker paket dışıdır, içe aktaramaz); sapmayı
 * `src/modules/notifications/__tests__/sw.test.ts` yakalar. Okundu İŞARETLENMEZ: service worker oturum
 * belirteci taşımaz; okundu portal açılınca satır tıklamasıyla olur.
 */
'use strict'

const TITLE = 'RoketPortal'
const FALLBACK_TEXT = 'Yeni bildirim'
const TYPE_TEXT = {
  'work.item.created': 'Yeni görev oluşturuldu',
  'work.item.transitioned': 'Bir görevin durumu değişti',
  'work.item.assignment_changed': 'Bir görevin ataması değişti',
  'work.item.date_changed': 'Bir görevin tarihi değişti',
  'work.date_change.requested': 'Yeni tarih talebi',
  'work.date_change.reviewed': 'Tarih talebi sonuçlandı',
  'work.task.reminder': 'Bir görev için hatırlatma var',
  'collaboration.meeting.created': 'Yeni toplantı',
  'collaboration.meeting.updated': 'Toplantı üyelere açıldı',
  'organization.membership.assigned': 'Ekibe yeni üye atandı',
  'organization.membership.removed': 'Ekipten üye çıkarıldı',
  'organization.membership.role_changed': 'Ekipte üye rolü değişti',
  'program.transfer.completed': 'Görev aktarımı tamamlandı',
  'messaging.message.mentioned': 'Bir sohbette senden bahsedildi',
  'messaging.message.sent': 'Sohbette yeni mesaj var',
  'collaboration.meeting.reminder': 'Toplantı hatırlatması',
  'collaboration.meeting.rescheduled': 'Toplantının saati değişti',
  'work.digest.daily': 'Günlük özetin hazır',
}
// Rota kataloğundaki `id` kuralıyla aynı: geçersiz kimlik gezinme üretmez (`/` açılır).
const ID_VALUE = /^[A-Za-z0-9_-]{1,128}$/

function isRecord(value) {
  return typeof value === 'object' && value !== null
}

function readPayload(event) {
  if (!event.data) return {}
  try {
    const parsed = event.data.json()
    return isRecord(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function bodyText(type) {
  return typeof type === 'string' && Object.hasOwn(TYPE_TEXT, type)
    ? TYPE_TEXT[type]
    : FALLBACK_TEXT
}

/**
 * `subject_ref` → portal yolu (E-14-76); hedef yoksa `/`. membership/bilinmeyen: `/`. Sohbet
 * `/mesajlar/<id>` (push yükünde `seq` yok: ilk okunmamışa panel satırı götürür); günlük özet
 * (`program`) ana sayfa. Program kapsamı yük taşımaz: seçili programda bulunamazsa ilgili ekranın
 * kendi "bulunamadı" akışı çalışır (program geçişini yalnız panel satırı yapar).
 */
function targetPath(ref) {
  if (!isRecord(ref) || typeof ref.id !== 'string' || !ID_VALUE.test(ref.id)) return '/'
  if (ref.kind === 'work_item') return '/gorevler?gorev=' + encodeURIComponent(ref.id)
  if (ref.kind === 'meeting') return '/toplantilar/' + encodeURIComponent(ref.id)
  if (ref.kind === 'chat') return '/mesajlar/' + encodeURIComponent(ref.id)
  return '/'
}

self.addEventListener('push', (event) => {
  const payload = readPayload(event)
  const options = {
    body: bodyText(payload.type),
    data: { type: payload.type, subject_ref: payload.subject_ref },
  }
  if (typeof payload.notification_id === 'string' && payload.notification_id !== '') {
    options.tag = payload.notification_id
  }
  event.waitUntil(self.registration.showNotification(TITLE, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const data = isRecord(event.notification.data) ? event.notification.data : {}
  const url = new URL(targetPath(data.subject_ref), self.location.origin).href
  event.waitUntil(openTarget(url))
})

async function openTarget(url) {
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
  const open = windows.find((client) => new URL(client.url).origin === self.location.origin)
  if (open) {
    try {
      const focused = await open.focus()
      await (focused ?? open).navigate(url)
      return
    } catch {
      // Denetlenmeyen sekme `navigate` edemez: yeni pencere hedefi açar.
    }
  }
  await self.clients.openWindow(url)
}
