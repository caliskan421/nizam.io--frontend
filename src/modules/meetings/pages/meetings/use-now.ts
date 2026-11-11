import { onScopeDispose, shallowRef } from 'vue'

/** Takvim günü değişimini kurulum saat dilimiyle hesaplayan tüketicileri dakikada tazeler. */
export function useNow() {
  const now = shallowRef(new Date())
  const timer = setInterval(() => {
    now.value = new Date()
  }, 60_000)
  onScopeDispose(() => clearInterval(timer))
  return now
}
