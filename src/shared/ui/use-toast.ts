import { computed, readonly, ref } from 'vue'

import { authSession } from '@/shared/http'
import { ownerLife } from '@/shared/http/mutation/owner'

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
 *
 * **Sahip yaşamı (CX-F1-Ö-07):** etki kapsamı içinde (bileşen/composable kurulumu) alınan örneğin
 * `push`'u o kapsam söküldükten sonra yok sayılır (`null` döner): sökülmüş ekranın geç sonucu
 * kullanıcıya bildirim üretmez. Kapsam dışında (modül düzeyi, `await` sonrası) alınan örnek
 * sahipsizdir ve her zaman ekler — ekranlar bildirimi kurulumda aldıkları örnekle yapar.
 * Bilinçli istisna (sökülmeden sonra da bildirilecek sonuç) yalnız `pushAppNotice` ile.
 */
export function useToast() {
  const life = ownerLife()
  return {
    queue: readonly(queue),
    current: computed(() => queue.value[0] ?? null),
    push: (input: ToastInput): number | null => (life.alive() ? push(input) : null),
    dismiss,
    clear,
  }
}

/**
 * Uygulama düzeyi (sahipsiz) bildirim — Ö-07 politikasının bilinçli istisnası: sahibi sökülse de
 * kullanıcının bilmesi gereken GERÇEK sunucu sonucu (bileşik yazmada ilk yazma başarılı, ardıl
 * adım yapılamadı: ör. "görev oluşturuldu, ek atananlar eklenemedi"). `generation` eylemin oturum
 * neslidir: çıkış / başka hesapla giriş olduysa bildirim gösterilmez (`null`).
 */
export function pushAppNotice(
  input: ToastInput,
  generation: number | null | undefined,
): number | null {
  if (generation != null && generation !== authSession.generation) return null
  return push(input)
}
