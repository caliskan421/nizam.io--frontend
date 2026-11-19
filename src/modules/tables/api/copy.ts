import { useKeyedOrgMutation } from '@/modules/organization/public'
import { programHeaders, scopeHeaders } from '@/modules/work/public'
import { api } from '@/shared/http'

import type {
  DepartmentCopy,
  PersonalCopy,
  TableCopyRequest,
  TableResult,
  TableSummary,
  TableTarget,
} from '../model/types'

export function useCopyTable(scope: () => TableTarget) {
  const personal = useKeyedOrgMutation<PersonalCopy, TableResult>({
    operation: 'copyTableToPersonal',
    scope,
    send: (vars, ctx) =>
      api.POST('/v1/personal/table-copies', {
        params: { header: { ...programHeaders(vars), 'Idempotency-Key': ctx.idempotencyKey } },
        body: vars.body,
        signal: ctx.signal,
      }),
  })
  const department = useKeyedOrgMutation<DepartmentCopy, TableResult>({
    operation: 'copyTableToCoordinatorship',
    scope,
    send: (vars, ctx) =>
      api.POST('/v1/table-copies', {
        params: { header: { ...scopeHeaders(vars), 'Idempotency-Key': ctx.idempotencyKey } },
        body: vars.body,
        signal: ctx.signal,
      }),
  })
  return (source: TableSummary, name: string) => {
    const { programId, departmentId } = scope()
    const body: TableCopyRequest = {
      mode: 'structure',
      source_table_id: source.id,
      source_space: source.space,
      ...(name ? { name } : {}),
    }
    if (departmentId === null) return personal.submit({ programId, body })
    return department.submit({
      programId,
      departmentId,
      body: { ...body, source_department_id: departmentId },
    })
  }
}
