/**
 * Grup üyesi satırı olguları (grup rolü → etiket anahtarı ve yönetici eylemi). Salt tablodur:
 * rol dizesi karşılaştırması yok (K1; karar `capabilities.ts`'te: `grantAdmin`, `removeMember`).
 */
import type { ChatTextKey } from '../../messages'
import type { ChatRole } from '../../model/types'

interface MemberRoleRow {
  /** Satırda gösterilen grup rolü etiketi (`member` için yok). */
  label: ChatTextKey | null
  /** Yönetici yetkisi olan çağıranın bu satıra uygulayabileceği eylem. */
  adminAction: 'grant' | 'revoke' | null
}

export const MEMBER_ROLE_ROWS: Readonly<Record<ChatRole, MemberRoleRow>> = {
  admin: { label: 'chat.dialogs.members.admin', adminAction: 'revoke' },
  founder: { label: 'chat.dialogs.members.founder', adminAction: null },
  member: { label: null, adminAction: 'grant' },
}
