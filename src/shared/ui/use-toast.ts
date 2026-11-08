import { computed, readonly, ref } from 'vue'

export type ToastTone = 'neutral' | 'danger'

export interface ToastInput {
  /** Kullanıcıya gösterilecek, i18n'den çevrilmiş metin (sunucu `message` alanı asla). */
  message: string
  tone?: ToastTone
  /** Otomatik kapanma (ms); 0 → kullanıcı kapatana dek kalır. */
  timeout?: number
}

export interface Toast {
  id: number
  message: string
  tone: ToastTone
  timeout: number
}

export const DEFAULT_TOAST_TIMEOUT = 4000

const queue = ref<Toast[]>([])
let nextId = 1

function push(input: ToastInput): number {
  const tone = input.tone ?? 'neutral'
  const last = queue.value[queue.value.length - 1]
  if (last && last.message === input.message && last.tone === tone) return last.id
  const toast: Toast = {
    id: nextId++,
    message: input.message,
    tone,
    timeout: input.timeout ?? DEFAULT_TOAST_TIMEOUT,
  }
  queue.value = [...queue.value, toast]
  return toast.id
}

function dismiss(id: number): void {
  queue.value = queue.value.filter((toast) => toast.id !== id)
}

function clear(): void {
  queue.value = []
}

/**
 * Uygulama geneli bildirim kuyruğu (tek örnek). Aynı anda bir bildirim görünür (`current`,
 * `rp-toast`); sıradaki, öncekinin kapanmasını bekler. Art arda aynı metin tekrar eklenmez.
 */
export function useToast() {
  return {
    queue: readonly(queue),
    current: computed(() => queue.value[0] ?? null),
    push,
    dismiss,
    clear,
  }
}
