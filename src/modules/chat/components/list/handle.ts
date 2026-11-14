/** `ChatListPane`'in dışa açtığı odak işleri (`defineExpose`); sayfa kabuğu bunlarla odağı geri verir. */
export interface ChatListHandle {
  /** Geri/kapanış sonrası odak o konuşma satırına döner; satır yoksa `false`. */
  focusRow(chatId: string): boolean
  focusCreate(): boolean
  focusSearch(): boolean
}
