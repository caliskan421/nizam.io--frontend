import { inject, ref, type InjectionKey, type Ref } from 'vue'

/** Üzerinde durulan satır anahtarı: sol sütun ile çubuk katmanı aynı hover'ı paylaşır (E-03C-35). */
export const GANTT_HOVER: InjectionKey<Ref<string | null>> = Symbol('gantt-hover')

/** Sağlayıcı yoksa (bileşen tek başına) yerel, paylaşılmayan bir değer. */
export function useGanttHover(): Ref<string | null> {
  return inject(GANTT_HOVER, null) ?? ref<string | null>(null)
}

/** Ölçülemeyen ortamda (test) varsayılan görünür alan. */
export const VIEW_FALLBACK = { width: 1200, height: 800 }
