// identity modülünün API yüzü. Tipler yalnız üretilmiş schema.d.ts'ten türetilir (elle DTO yok).
import type { components } from '@/shared/api/schema'
import { api, unwrap } from '@/shared/http'

export type Me = components['schemas']['MeResponse']
export type MyDepartmentList = components['schemas']['MyDepartmentList']

export function fetchMyDepartments(): Promise<MyDepartmentList> {
  return unwrap(api.GET('/v1/me/departments'))
}
