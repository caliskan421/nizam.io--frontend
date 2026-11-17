/**
 * Program rol rozeti (BE-083, MESSAGING-K48): `ChatMessage.sender_role` / `ChatMember.program_role`.
 * Rozet GÖSTERİMDİR; eylem kararı için kullanılmaz (K1, yetki `capabilities.ts`) ve grup rolüyle
 * (`admin`/`founder`) karışmaz. Departman adı dönmez: programın departman listesinden çözülür.
 */
import { chatText } from '../messages'
import { showsProgramRoleBadge } from './capabilities'
import type { ChatProgramRole } from './shared-types'

type DepartmentName = (departmentId: string) => string | null

const departmentNames = (role: ChatProgramRole, nameOf: DepartmentName): string[] =>
  role.department_ids.flatMap((id) => nameOf(id) ?? [])

/** Üye satırı alt yazısı: "<Rol> · <Koordinatörlük>" (çözülemeyen departman adı düşer). */
export function programRoleLine(role: ChatProgramRole, nameOf: DepartmentName): string {
  const label = chatText(`chat.thread.role.${role.role}`)
  const names = departmentNames(role, nameOf)
  return names.length > 0 ? `${label} · ${names.join(', ')}` : label
}

/**
 * Mesaj rozeti: yalnız Admin ve Koordinatör (akışta "Üye" gürültüdür); programdan çıkmış (`none`)
 * ve rolsüz (alan yok: gönderim cevabı, kendi mesajım) rozet taşımaz. `title` koordinatörlükleri söyler.
 */
export function messageBadge(
  programRole: ChatProgramRole | undefined,
  nameOf: DepartmentName,
): { text: string; title: string } | null {
  if (programRole === undefined || !showsProgramRoleBadge(programRole)) return null
  return {
    text: chatText(`chat.thread.role.${programRole.role}`),
    title: programRoleLine(programRole, nameOf),
  }
}
