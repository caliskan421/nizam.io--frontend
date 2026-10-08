// schema.d.ts'ten TÜRETİLMİŞ tip takma adları. Modüllerin api/ katmanı yerel tip bildiremez
// (eslint: nizamio/elle-dto-yasagi); ihtiyaç duyduğu takma adı buradan içe aktarır.
// Burada yalnız `components['schemas'][...]` / `paths[...]` dizinlemesi yazılır.
import type { components } from './schema'

type Schemas = components['schemas']

export type MeResponse = Schemas['MeResponse']
export type MyDepartmentList = Schemas['MyDepartmentList']
