/**
 * Sayfa odak yardımcıları (KESİN 27): satır düşünce, bildirim/özet/seçim kalkınca odak gövdeye
 * düşmez; sırasıyla komşu satıra, tür düğmesine ya da "tümünü seç" kutusuna döner.
 */
import { nextTick, ref } from 'vue'

export function usePageFocus() {
  const column = ref<HTMLElement | null>(null)
  let focusIndex = -1

  const rowsOf = () => [...(column.value?.querySelectorAll<HTMLElement>('[data-record-key]') ?? [])]
  const kindsOf = () => column.value?.querySelector('[data-testid="dr-kinds"]') ?? null

  /** Eylemi başlatan satırın sırası: satır düşünce odak oraya (yoksa sona, o da yoksa segmente). */
  const remember = (index: number) => {
    focusIndex = index
  }
  async function afterRemoval(): Promise<void> {
    await nextTick()
    const rows = rowsOf()
    const target =
      rows[Math.min(Math.max(focusIndex, 0), rows.length - 1)] ??
      kindsOf()?.querySelector<HTMLElement>('[aria-pressed="true"]')
    target?.focus()
  }
  /** Verilen (yoksa seçili) tür düğmesine döner. */
  async function toKindButton(kind?: string): Promise<void> {
    await nextTick()
    const kinds = kindsOf()
    const target = kind
      ? kinds?.querySelector<HTMLElement>(`[data-kind="${kind}"]`)
      : kinds?.querySelector<HTMLElement>('[aria-pressed="true"]')
    target?.focus()
  }
  /** Çöpü boşalt paneli kapanınca odak başlık düğmesine döner. */
  async function toTrashButton(): Promise<void> {
    await nextTick()
    column.value?.querySelector<HTMLElement>('[data-testid="dr-empty-trash"]')?.focus()
  }
  async function toSelectAll(): Promise<void> {
    await nextTick()
    column.value?.querySelector<HTMLElement>('[data-testid="dr-select-all"]')?.focus()
  }
  return { column, remember, afterRemoval, toKindButton, toSelectAll, toTrashButton }
}
