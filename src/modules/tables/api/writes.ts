import { useKeyedOrgMutation } from '@/modules/organization/public'
import { programHeaders, scopeHeaders } from '@/modules/work/public'
import { api } from '@/shared/http'

import { serializeTableCommand } from '../model/cell-value'
import type {
  DepartmentWrite,
  PersonalWrite,
  TableResult,
  TableTarget,
  TableWrite,
} from '../model/types'

export function useTableWrite(scope: () => TableTarget) {
  const personal = useKeyedOrgMutation<PersonalWrite, TableResult>({
    operation: 'applyPersonalTableOperation',
    scope,
    invalidation: (vars) => ({
      tableId: vars.tableID,
      skipTableDetail: vars.command.kind === 'delete_table',
    }),
    send: (vars, ctx) =>
      api.POST('/v1/personal/tables/{tableID}/operations', {
        params: {
          header: { ...programHeaders(vars), 'Idempotency-Key': ctx.idempotencyKey },
          path: { tableID: vars.tableID },
        },
        body: vars.command,
        bodySerializer: () => serializeTableCommand(vars.command, vars.decimal),
        signal: ctx.signal,
      }),
  })
  const department = useKeyedOrgMutation<DepartmentWrite, TableResult>({
    operation: 'applyTableOperation',
    scope,
    invalidation: (vars) => ({
      tableId: vars.tableID,
      skipTableDetail: vars.command.kind === 'delete_table',
    }),
    send: (vars, ctx) =>
      api.POST('/v1/tables/{tableID}/operations', {
        params: {
          header: { ...scopeHeaders(vars), 'Idempotency-Key': ctx.idempotencyKey },
          path: { tableID: vars.tableID },
        },
        body: vars.command,
        bodySerializer: () => serializeTableCommand(vars.command, vars.decimal),
        signal: ctx.signal,
      }),
  })
  return (vars: TableWrite) => {
    const { programId, departmentId } = scope()
    return departmentId === null
      ? personal.submit({ programId, ...vars })
      : department.submit({ programId, departmentId, ...vars })
  }
}
