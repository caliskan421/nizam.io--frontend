/**
 * Önizleme paneli kapanınca odağın dönüşü (KESİN 27). Panel, bir dosya kartı seçilince kurulur:
 * kurulum anındaki `document.activeElement` (kartın kendisi) tetikleyici sayılır. Kapanışta
 * (Esc, ✕, silme/ad değişimi sonrası) odak sırayla: tetikleyici hâlâ belgedeyse o; değilse aynı
 * dosyanın kartı (`[data-file-id]`); o da yoksa listedeki ilk dosya kartı (komşu); hiçbiri yoksa
 * belgenin ana bölgesi. Gövdeye (`body`) düşmez. Kartın `data-file-id` taşıması `FileGrid` /
 * `FileList` (W123) sözleşmesidir; tetikleyici DOM'da kalıyorsa yalnız ona güvenilir.
 */
import { nextTick } from 'vue'

const MAIN = 'main, [role="main"]'

export function useReturnFocus(fileId: () => string) {
  const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null

  function target(): HTMLElement | null {
    if (opener && opener !== document.body && opener.isConnected) return opener
    const same = document.querySelector<HTMLElement>(`[data-file-id="${CSS.escape(fileId())}"]`)
    if (same) return same
    const neighbour = document.querySelector<HTMLElement>('[data-file-id]')
    if (neighbour) return neighbour
    const main = document.querySelector<HTMLElement>(MAIN)
    if (main && main.tabIndex < 0) main.tabIndex = -1
    return main
  }

  /** Panel kaldırıldıktan sonra odağı taşır (çağıran olayı yaydıktan sonra). */
  async function restore(): Promise<void> {
    await nextTick()
    target()?.focus()
  }

  return { restore }
}
