// identity modülünün API yüzü. Tipler yalnız üretilmiş schema.d.ts kökenlidir
// (@/shared/api/types); bu dizinde yerel tip bildirimi yasaktır (elle DTO yok).
import type { MeResponse, MyDepartmentList } from '@/shared/api/types'
import { api, unwrap } from '@/shared/http'

export type { MeResponse, MyDepartmentList }

export function fetchMyDepartments(): Promise<MyDepartmentList> {
  return unwrap(api.GET('/v1/me/departments'))
}
