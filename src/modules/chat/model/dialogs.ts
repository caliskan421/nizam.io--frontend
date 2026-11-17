/**
 * 10c yedi pencere: adlar ve AÇILIŞ OLGULARI (O2b `ChatDialogs` bunları tüketir). "Mesajı ilet"
 * BE-080 ile canlıdır (W185b): açılış olgusu kaynak mesajdır. Kapanışta odak tetikleyiciye döner
 * (KESİN 27; her kapanış yolu O2b'de birim testlidir).
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
  | { dialog: 'forward'; chatId: string; messageId: string }
  | { dialog: 'taskFromMessage'; chatId: string; messageId: string; seq: number }
  | { dialog: 'poll'; chatId: string }
  /** `tab`: Ekle menüsünden gelen sekme (E-10-54 "Arşivden", E-10-55 "Yeni yükle"); yoksa "Yeni yükle". */
  | { dialog: 'shareFile'; chatId: string; tab?: 'archive' | 'upload' }
