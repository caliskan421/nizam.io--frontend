/**
 * SSE olayı → okuma planı (istemci-akislari §10.5, 10 `backend.md` §5.1). Olaylar İÇERİKSİZDİR:
 * yalnız "bu sohbette değişiklik var"; içerik HTTP'den alınır. Bu dosya saf karardır (hangi
 * sorgu geçersizlenir / hangi yerel işlem yapılır); uygulaması `api/stream.ts`'tedir.
 *
 *  message.created  → açık sohbette `after=<yerel üst seq>`; liste + rozet
 *  message.updated  → mesaj yerelde varsa `around=<yerel seq>`; sabitler; yoksa okuma yok
 *  message.deleted  → yerel kayıt `message_id` ile KALDIRILIR (okuma yok); liste, sabit, ref'ler
 *  read.updated     → birebirde `peer_read_seq` (açık sohbet son okuma); liste + rozet
 *  member.changed   → üyeler, ayrıntı, liste, adaylar; kendi hesabım etkilendiyse erişim yeniden denetlenir (404 → kapanır)
 *  chat.changed     → liste, ayrıntı; kendi hesabım etkilendiyse erişim yeniden denetlenir (404 → kapanır)
 *  typing           → yalnız arayüz (kısa ömürlü `ref`), önbelleğe yazılmaz
 */
import type { CoalescedEvent } from '@/shared/sse'

export interface EventPlan {
  /** Açık sohbet bu olayın sohbeti mi (pencere okumaları yalnız o zaman). */
  open: boolean
  /** Açık sohbette yeni mesajlar: `after=<üst seq>`. */
  readNewer: boolean
  /** Yerelde var olan bu mesajların `around=<seq>` okuması (`message.updated`). */
  refreshMessageIds: string[]
  /** Yerelden doğrudan kaldırılacak mesajlar (`message.deleted`). */
  removeMessageIds: string[]
  /** Birebirde açık sohbetin `peer_read_seq` yenilenir. */
  refreshPeerRead: boolean
  invalidateList: boolean
  invalidateOverview: boolean
  invalidateDetail: boolean
  invalidateMembers: boolean
  invalidateCandidates: boolean
  invalidatePins: boolean
  invalidateRefs: boolean
  /**
   * `affected_account_ids` kendi hesabımı içeriyor: sohbete giriş MI düşüş MÜ olay söylemez;
   * açık sohbetin `getChat` okuması 404 `messaging.chat_not_found` verirse sohbet kapatılır.
   */
  recheckAccess: boolean
}

export interface PlanContext {
  /** Açık sohbet (`/mesajlar/:chatId`) ya da `null`. */
  openChatId: string | null
  meAccountId: string | null
  /** Yerel pencerede bulunan mesaj kimlikleri. */
  hasLocal: (messageId: string) => boolean
}

const NONE: EventPlan = {
  open: false,
  readNewer: false,
  refreshMessageIds: [],
  removeMessageIds: [],
  refreshPeerRead: false,
  invalidateList: false,
  invalidateOverview: false,
  invalidateDetail: false,
  invalidateMembers: false,
  invalidateCandidates: false,
  invalidatePins: false,
  invalidateRefs: false,
  recheckAccess: false,
}

export function planFor(event: CoalescedEvent, ctx: PlanContext): EventPlan {
  const open = ctx.openChatId !== null && ctx.openChatId === event.chatId
  const base: EventPlan = { ...NONE, open }
  switch (event.name) {
    case 'message.created':
      return {
        ...base,
        readNewer: open,
        invalidateList: true,
        invalidateOverview: true,
        invalidateRefs: true,
      }
    case 'message.updated':
      return {
        ...base,
        refreshMessageIds: open ? event.messageIds.filter(ctx.hasLocal) : [],
        invalidatePins: true,
        invalidateList: true,
      }
    case 'message.deleted':
      return {
        ...base,
        removeMessageIds: event.messageIds,
        invalidateList: true,
        invalidateOverview: true,
        invalidatePins: true,
        invalidateRefs: true,
      }
    case 'read.updated':
      return { ...base, refreshPeerRead: open, invalidateList: true, invalidateOverview: true }
    case 'member.changed':
      return {
        ...base,
        invalidateMembers: true,
        invalidateDetail: true,
        invalidateList: true,
        invalidateCandidates: true,
        recheckAccess: open && includesMe(event, ctx),
      }
    case 'chat.changed':
      return {
        ...base,
        invalidateList: true,
        invalidateDetail: true,
        recheckAccess: open && includesMe(event, ctx),
      }
    default:
      return base
  }
}

/** `affected_account_ids` kendi hesabımı içeriyorsa sohbete giriş/düşüş söylenir. */
function includesMe(event: CoalescedEvent, ctx: PlanContext): boolean {
  return ctx.meAccountId !== null && event.affectedAccountIds.includes(ctx.meAccountId)
}
