/**
 * Mesaj penceresinin önbellek bağı: pencere `chats.messages(scope, chatId)` anahtarında DÜZ
 * VERİ olarak durur (`MessageWindow`); yazma yamaları ve SSE olayları aynı pencereyi
 * `setQueryData` ile günceller. Anahtar eylemin YAKALANMIŞ kapsamıyla kurulur: gönderim sırasında
 * kapsam değişse de başka programın penceresine yazılmaz; kapsam bu arada değiştiyse yazma yapılmaz.
 */
import type { QueryClient } from '@tanstack/vue-query'

import { sameScope } from '@/shared/http/mutation'
import { queryKeys } from '@/shared/http/query-keys'
import type { ScopeSnapshot } from '@/shared/scope/scope'

import { emptyWindow, type MessageWindow } from '../model/window'
import type { WindowStore } from '../model/window-io'

export function windowKey(scope: ScopeSnapshot, chatId: string) {
  return queryKeys.chats.messages(scope, chatId)
}

export function readWindow(
  client: QueryClient,
  scope: ScopeSnapshot,
  chatId: string,
): MessageWindow | undefined {
  return client.getQueryData<MessageWindow>(windowKey(scope, chatId))
}

/**
 * Yama: yalnız pencere ÖNBELLEKTE varsa uygulanır (açık olmayan sohbette pencere oluşturulmaz;
 * sonra açıldığında güncel okunur).
 */
export function patchWindow(
  client: QueryClient,
  scope: ScopeSnapshot,
  chatId: string,
  update: (current: MessageWindow) => MessageWindow,
): void {
  const key = windowKey(scope, chatId)
  if (client.getQueryData<MessageWindow>(key) === undefined) return
  client.setQueryData<MessageWindow>(key, (current) => (current ? update(current) : current))
}

/**
 * Okuma adımları için pencere deposu. `alive` yanlışsa (sahip söküldü) ve kapsam yakalanandan
 * farklıysa yazma yapılmaz (KESİN 26a; K2). Pencere yoksa boş pencereyle başlanır (ilk açılış).
 */
export function windowStore(
  client: QueryClient,
  scope: ScopeSnapshot,
  chatId: string,
  current: () => ScopeSnapshot,
  alive: () => boolean = () => true,
): WindowStore {
  const key = windowKey(scope, chatId)
  return {
    get: () => client.getQueryData<MessageWindow>(key) ?? emptyWindow(),
    set: (update) => {
      if (!alive() || !sameScope(scope, current())) return
      client.setQueryData<MessageWindow>(key, (cur) => update(cur ?? emptyWindow()))
    },
  }
}
