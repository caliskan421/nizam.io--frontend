import { inject, type ComputedRef, type InjectionKey } from 'vue'

/** `UiField` → içindeki denetim: kimlik, açıklama bağı ve geçersizlik. */
export interface FieldContext {
  id: string
  describedBy: ComputedRef<string | undefined>
  invalid: ComputedRef<boolean>
}

export const FIELD_CONTEXT: InjectionKey<FieldContext> = Symbol('ui-field')

export function useFieldContext(): FieldContext | null {
  return inject(FIELD_CONTEXT, null)
}
