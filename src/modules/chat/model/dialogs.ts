/**
 * 10c yedi pencere: adlar ve AÇILIŞ OLGULARI (O2b `ChatDialogs` bunları tüketir). "Mesajı ilet"
 * kodlanmaz (BE-080: uç yok → menü öğesi devre dışı + stub, pencere açılmaz). Kapanışta odak
 * tetikleyiciye döner (KESİN 27; her kapanış yolu O2b'de birim testlidir).
 */
export const CHAT_DIALOGS = [
  'groupInfo',
  'messageInfo',
  'newGroup',
  'forward',
  'taskFromMessage',
  'poll',
  'shareFile',
] as const

export type ChatDialogName = (typeof CHAT_DIALOGS)[number]

/** Açılabilir pencere isteği; her pencere yalnız kendi olgusunu taşır. */
export type DialogRequest =
  | { dialog: 'groupInfo'; chatId: string }
  | { dialog: 'messageInfo'; chatId: string; messageId: string }
  | { dialog: 'newGroup'; mode: 'group' | 'direct' }
  | { dialog: 'taskFromMessage'; chatId: string; messageId: string; seq: number }
  | { dialog: 'poll'; chatId: string }
  | { dialog: 'shareFile'; chatId: string }

/** `forward` açılabilir değildir (BE-080). */
export function isOpenable(name: ChatDialogName): boolean {
  return name !== 'forward'
}
