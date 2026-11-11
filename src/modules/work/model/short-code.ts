import { designStub } from '@/shared/design-stub'

/** Görev sıra numarası BE-005 ile gelene dek yalnız gerçek birim kodu gösterilir. */
export function workShortCode(code: string | null | undefined): string {
  return code ? designStub('BE-005', code) : ''
}
