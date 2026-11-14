/**
 * Pencere açıcı (10c): konuşma ve yazma çubuğu `ChatDialogs`'a bir `DialogRequest` ister; açıcıyı
 * sayfa sahibi (`ChatPage`) sağlar ve `ChatDialogs.request`'e bağlar. `ChatPageContext` sözleşmesi
 * değiştirilmediğinden anahtar burada durur (SAHİPLİK-DIŞI İHTİYAÇ: `ChatPage` `provide`).
 * Sağlanmamışsa tetikleyiciler güvenle hiçbir şey yapmaz.
 */
import { inject, type InjectionKey } from 'vue'

import type { DialogRequest } from '../../model/dialogs'

export type DialogOpener = (request: DialogRequest) => void

export const CHAT_DIALOG_OPENER: InjectionKey<DialogOpener> = Symbol('chat-dialog-opener')

export function useDialogOpener(): DialogOpener {
  return inject(CHAT_DIALOG_OPENER, () => undefined)
}
