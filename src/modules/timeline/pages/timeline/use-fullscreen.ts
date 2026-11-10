/**
 * Tam ekran (E-03C-12): Gantt alanını (araç çubuğu dahil — çıkış düğmesi orada) tam ekrana alır.
 * Fullscreen API varsa kullanılır; yoksa (ör. iPhone Safari) aynı sınıfla sayfayı örten CSS
 * kipi — işlev her ortamda aynıdır. Çıkış: Esc (yerel ya da CSS kipinde pencere dinleyicisi) ve
 * araç çubuğu düğmesi. Çıkışta odak tam ekran düğmesine döner (KESİN 27). Sayfa sökülürse
 * çıkılır. Çıkış hali tasarımda çizilmemiş: P3 en sade (geçici kabul).
 */
import { nextTick, onScopeDispose, ref, type Ref } from 'vue'

export const FULLSCREEN_TRIGGER = '[data-action="fullscreen"]'

export function useFullscreen(target: Ref<HTMLElement | null>) {
  const active = ref(false)

  function native(): boolean {
    return document.fullscreenElement !== null && document.fullscreenElement !== undefined
  }

  function restoreFocus(): void {
    void nextTick(() => target.value?.querySelector<HTMLElement>(FULLSCREEN_TRIGGER)?.focus())
  }

  function onKeydown(event: KeyboardEvent): void {
    // Yerel kipte Esc'i tarayıcı işler (`fullscreenchange`); CSS kipinde biz.
    if (event.key === 'Escape' && active.value && !native()) leave()
  }

  function onChange(): void {
    // Tarayıcı yerel kipten çıktı (Esc / sistem): durum ve odak eşitlenir.
    if (active.value && usedNative && !native()) leave()
  }

  let usedNative = false

  function enter(): void {
    const el = target.value
    if (!el || active.value) return
    active.value = true
    usedNative = false
    window.addEventListener('keydown', onKeydown)
    document.addEventListener('fullscreenchange', onChange)
    const request = el.requestFullscreen?.bind(el)
    if (request) {
      usedNative = true
      void Promise.resolve(request()).catch(() => {
        // İzin verilmedi: CSS kipi sürer.
        usedNative = false
      })
    }
  }

  function leave(): void {
    if (!active.value) return
    active.value = false
    window.removeEventListener('keydown', onKeydown)
    document.removeEventListener('fullscreenchange', onChange)
    if (native() && typeof document.exitFullscreen === 'function') {
      void Promise.resolve(document.exitFullscreen()).catch(() => {})
    }
    usedNative = false
    restoreFocus()
  }

  function set(value: boolean): void {
    if (value) enter()
    else leave()
  }

  onScopeDispose(() => {
    window.removeEventListener('keydown', onKeydown)
    document.removeEventListener('fullscreenchange', onChange)
    if (active.value && native() && typeof document.exitFullscreen === 'function') {
      void Promise.resolve(document.exitFullscreen()).catch(() => {})
    }
  })

  return { active, set }
}
