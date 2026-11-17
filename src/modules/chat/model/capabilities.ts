/**
 * Sohbet eylem görünürlüğü (10 `backend.md` §3; istemci-akislari §10; messaging README §4 uç→rol).
 * İKİ rol kavramı vardır ve karıştırılmaz:
 *  - **program rolü** (`me.company_admin`; `me/departments` satırı, seçili programda `coordinator`):
 *    grup kurma kaynağı seçimi, mesajdan görev, hedef koordinatörlük çipleri;
 *  - **grup rolü** (`getChat.role` = `admin` | `founder` | `member`): sabitleme, silme, üye
 *    yönetimi, `@herkes`, ad/kaynak.
 * Mercek bu olguları DEĞİŞTİRMEZ (mercek ≠ yetki, P1): yönetici Üye merceğinde de ŞY'dir.
 * Rol dizesi karşılaştırması yalnız bu dosyada (K1). Gizleme güvenlik değildir: 403/404 gerçek
 * sonuçtur; sözleşme dışı eylem (iletme, sessize alma …) `stubs.ts`'tedir.
 */
import type { Standing } from '@/shared/scope/standing-facts'

import type { ChatProgramRole } from './shared-types'
import type { ChatAutoKind, ChatKind, ChatMessage, ChatRole, ChatSource } from './types'

export interface ChatFacts {
  kind: ChatKind
  /** `getChat.role`; birebirde `member`. Liste satırında yoktur (`getChat` okunur). */
  role: ChatRole
  autoKind: ChatAutoKind
  source: ChatSource
}

export interface ChatActor {
  standing: Standing | null
  programId: string | null
}

const GROUP_MANAGER: readonly ChatRole[] = ['admin', 'founder']

/** Seçili programdaki koordinatörlük kimlikleri (program rolü; mercekten bağımsız). */
export function coordinatorDepartments(actor: ChatActor): string[] {
  return [
    ...new Set(
      actor.standing?.rows
        .filter((row) => row.programId === actor.programId && row.role === 'coordinator')
        .map((row) => row.departmentId) ?? [],
    ),
  ].sort()
}

function isCompanyAdmin(actor: ChatActor): boolean {
  return actor.standing?.companyAdmin === true
}

/** Programda rolü olan herkes (ŞY, K, Ü) grup kurabilir (MESSAGING-K06). */
export function canCreateGroup(actor: ChatActor): boolean {
  if (actor.standing === null || actor.programId === null) return false
  return isCompanyAdmin(actor) || actor.standing.rows.some((r) => r.programId === actor.programId)
}

/** Kaynak (`source`) seçimi yalnız ŞY ve koordinatör (§10.1; Ü için yalnız elle üye). */
export function canChooseSource(actor: ChatActor): boolean {
  return isCompanyAdmin(actor) || coordinatorDepartments(actor).length > 0
}

/** Mesajdan görev: ŞY ya da koordinatör (program rolü; `getChat.role` DEĞİL, §10.9). */
export function canCreateTaskFromMessage(actor: ChatActor): boolean {
  return canChooseSource(actor)
}

/** Hedef koordinatörlük çipleri: ŞY hepsini, koordinatör yalnız koordinatörü olduklarını görür. */
export function taskTargetDepartments(
  actor: ChatActor,
  programDepartmentIds: readonly string[],
): string[] {
  if (isCompanyAdmin(actor)) return [...programDepartmentIds]
  const own = new Set(coordinatorDepartments(actor))
  return programDepartmentIds.filter((id) => own.has(id))
}

export interface MessageFacts {
  senderAccountId: string
  hasPoll: boolean
  pollClosed: boolean
  pinned: boolean
  taskIds: readonly string[]
}

export function messageFacts(message: ChatMessage, nowMs: number = Date.now()): MessageFacts {
  const poll = message.poll
  const expired = poll?.closes_at != null && Date.parse(poll.closes_at) <= nowMs
  return {
    senderAccountId: message.sender_account_id,
    hasPoll: poll !== null,
    pollClosed: poll !== null && (poll.closed_at !== null || expired),
    pinned: message.pinned_at !== null,
    taskIds: message.task_ids,
  }
}

export interface ChatCapabilities {
  /** Grup adı: yönetici/kurucu; kendiliğinden gruplarda (`auto_kind`) ad değişmez (Varsayım). */
  renameGroup: boolean
  /** Kaynak ayarı: grup yöneticisi + program rolü ŞY/K ("kapat + aç", MESSAGING-K04/K07). */
  changeSource: boolean
  addMembers: boolean
  /** Başkasını çıkarma: yönetici/kurucu ve hedef kaynaktan gelmiyorsa. */
  removeMember: (target: { fromSource: boolean }) => boolean
  /** Gruptan ayrılma: grup + kendi satırı kaynaktan gelmiyorsa. */
  leaveGroup: (self: { fromSource: boolean }) => boolean
  grantAdmin: boolean
  deleteGroup: boolean
  /** `@herkes` önerisi: yalnız grupta ve yönetici/kurucuya (birebirde 422, yetkisizde 403). */
  mentionAll: boolean
  /** Anket oluşturma menü öğesi: yalnız grup (birebirde gizli). */
  createPoll: boolean
  pin: boolean
  editMessage: (m: MessageFacts) => boolean
  /** Sil: gönderen; grupta YÖNETİCİ her mesajı (kurucu başkasınınkini silemez, K07). */
  deleteMessage: (m: MessageFacts) => boolean
  vote: (m: MessageFacts) => boolean
  closePoll: (m: MessageFacts) => boolean
  createTask: (m: MessageFacts) => boolean
  /** Aynı mesajdan ikinci görev engellenmez ama istemci göndermeden önce uyarır. */
  warnSecondTask: (m: MessageFacts) => boolean
}

export function chatCapabilities(actor: ChatActor, chat: ChatFacts): ChatCapabilities {
  const me = actor.standing?.accountId ?? null
  const group = chat.kind === 'group'
  const manager = group && GROUP_MANAGER.includes(chat.role)
  const mine = (m: MessageFacts) => me !== null && m.senderAccountId === me
  const taskRole = canCreateTaskFromMessage(actor)
  return {
    renameGroup: manager && chat.autoKind === null,
    changeSource: group && chat.role === 'admin' && canChooseSource(actor),
    addMembers: manager,
    removeMember: (target) => manager && !target.fromSource,
    leaveGroup: (self) => group && !self.fromSource,
    grantAdmin: group && chat.role === 'admin',
    deleteGroup: manager,
    mentionAll: manager,
    createPoll: group,
    pin: chat.kind === 'direct' || manager,
    editMessage: (m) => mine(m) && !m.hasPoll,
    deleteMessage: (m) => mine(m) || (group && chat.role === 'admin'),
    vote: (m) => m.hasPoll && !m.pollClosed,
    closePoll: (m) => mine(m) && m.hasPoll && !m.pollClosed,
    createTask: () => taskRole,
    warnSecondTask: (m) => taskRole && m.taskIds.length > 0,
  }
}

/** Üye satırı olguları (grup rolü; mercek etkisiz): rozet gösterilir mi ve yönetici eylemi. */
export interface MemberRoleFacts {
  /** Satırda grup rolü rozeti ("Yönetici"/"Kurucu"); düz üyede yok. */
  badge: 'admin' | 'founder' | null
  /** Yönetici yetkisi olan çağıranın bu satıra uygulayabileceği eylem (kurucuya yok). */
  adminAction: 'grant' | 'revoke' | null
}

export function memberRoleFacts(role: ChatRole): MemberRoleFacts {
  if (role === 'admin') return { badge: 'admin', adminAction: 'revoke' }
  if (role === 'founder') return { badge: 'founder', adminAction: null }
  return { badge: null, adminAction: 'grant' }
}

/**
 * Akışta program rolü rozeti çizilir mi (BE-083, MESSAGING-K48): yalnız Admin ve Koordinatör;
 * rozet GÖSTERİMDİR, eylem kararı için kullanılmaz (K1) ve grup rolüyle karışmaz.
 */
export function showsProgramRoleBadge(role: ChatProgramRole): boolean {
  return role.role === 'company_admin' || role.role === 'coordinator'
}
