// BU DOSYA ÜRETİLMİŞTİR — elle düzenlenmez. `pnpm gen:api` ile yeniden üretilir.
// Kaynak: nizam.io--backend etiket v0.1.0-api (8c8c83b33e90aef4e8e3edd82713fc709c39c518) — docs/api/openapi.yaml (x-nizamio-scope-class, parametreler, security)

export const API_VERSION = "v1" as const

export const OPERATIONS = {
  "GET /.well-known/nizamio-instance": {"operationId":"systemInfo","scope":"S0","csrf":false,"programHeader":false,"departmentHeader":false,"auth":false},
  "GET /healthz/live": {"operationId":"healthLive","scope":"S0","csrf":false,"programHeader":false,"departmentHeader":false,"auth":false},
  "GET /healthz/ready": {"operationId":"healthReady","scope":"S0","csrf":false,"programHeader":false,"departmentHeader":false,"auth":false},
  "GET /v1/admin/users": {"operationId":"listUsers","scope":"S1","csrf":false,"programHeader":false,"departmentHeader":false,"auth":true},
  "POST /v1/admin/users": {"operationId":"createUser","scope":"S1","csrf":true,"programHeader":false,"departmentHeader":false,"auth":true},
  "PATCH /v1/admin/users/{id}": {"operationId":"updateUser","scope":"S1","csrf":true,"programHeader":false,"departmentHeader":false,"auth":true},
  "DELETE /v1/admin/users/{id}": {"operationId":"deleteUser","scope":"S1","csrf":true,"programHeader":false,"departmentHeader":false,"auth":true},
  "POST /v1/auth/login": {"operationId":"login","scope":"S0","csrf":true,"programHeader":false,"departmentHeader":false,"auth":false},
  "POST /v1/auth/logout": {"operationId":"logout","scope":"S1","csrf":true,"programHeader":false,"departmentHeader":false,"auth":true},
  "POST /v1/auth/password": {"operationId":"changePassword","scope":"S1","csrf":true,"programHeader":false,"departmentHeader":false,"auth":true},
  "POST /v1/auth/refresh": {"operationId":"refresh","scope":"S0","csrf":true,"programHeader":false,"departmentHeader":false,"auth":false},
  "GET /v1/departments": {"operationId":"listDepartments","scope":"S1","csrf":false,"programHeader":false,"departmentHeader":false,"auth":true},
  "POST /v1/departments": {"operationId":"createDepartment","scope":"S1","csrf":true,"programHeader":false,"departmentHeader":false,"auth":true},
  "PATCH /v1/departments/{id}": {"operationId":"updateDepartment","scope":"S1","csrf":true,"programHeader":false,"departmentHeader":false,"auth":true},
  "DELETE /v1/departments/{id}": {"operationId":"deleteDepartment","scope":"S1","csrf":true,"programHeader":false,"departmentHeader":false,"auth":true},
  "GET /v1/departments/{id}/assignable": {"operationId":"listAssignable","scope":"S1","csrf":false,"programHeader":false,"departmentHeader":false,"auth":true},
  "POST /v1/departments/{id}/coordinator": {"operationId":"assignCoordinator","scope":"S1","csrf":true,"programHeader":false,"departmentHeader":false,"auth":true},
  "DELETE /v1/departments/{id}/coordinator/{accountId}": {"operationId":"removeCoordinator","scope":"S1","csrf":true,"programHeader":false,"departmentHeader":false,"auth":true},
  "GET /v1/departments/{id}/members": {"operationId":"listMembers","scope":"S1","csrf":false,"programHeader":false,"departmentHeader":false,"auth":true},
  "POST /v1/departments/{id}/memberships": {"operationId":"assignMembership","scope":"S1","csrf":true,"programHeader":false,"departmentHeader":false,"auth":true},
  "PATCH /v1/departments/{id}/memberships/{accountId}": {"operationId":"updateMembershipRole","scope":"S1","csrf":true,"programHeader":false,"departmentHeader":false,"auth":true},
  "DELETE /v1/departments/{id}/memberships/{accountId}": {"operationId":"removeMember","scope":"S1","csrf":true,"programHeader":false,"departmentHeader":false,"auth":true},
  "GET /v1/departments/{id}/task-summary": {"operationId":"taskSummary","scope":"S1","csrf":false,"programHeader":false,"departmentHeader":false,"auth":true},
  "GET /v1/instance/profile": {"operationId":"instanceProfile","scope":"S0","csrf":false,"programHeader":false,"departmentHeader":false,"auth":false},
  "GET /v1/me": {"operationId":"me","scope":"S1","csrf":false,"programHeader":false,"departmentHeader":false,"auth":true},
  "GET /v1/me/departments": {"operationId":"myDepartments","scope":"S1","csrf":false,"programHeader":false,"departmentHeader":false,"auth":true},
  "GET /v1/program": {"operationId":"readProgram","scope":"S2","csrf":false,"programHeader":true,"departmentHeader":false,"auth":true},
  "POST /v1/program/departments": {"operationId":"linkDepartment","scope":"S2","csrf":true,"programHeader":true,"departmentHeader":false,"auth":true},
  "GET /v1/programs": {"operationId":"listPrograms","scope":"S1","csrf":false,"programHeader":false,"departmentHeader":false,"auth":true},
  "POST /v1/programs": {"operationId":"createProgram","scope":"S1","csrf":true,"programHeader":false,"departmentHeader":false,"auth":true},
  "PATCH /v1/programs/{id}": {"operationId":"updateProgram","scope":"S1","csrf":true,"programHeader":false,"departmentHeader":false,"auth":true},
  "DELETE /v1/programs/{id}": {"operationId":"deleteProgram","scope":"S1","csrf":true,"programHeader":false,"departmentHeader":false,"auth":true},
} as const

export type OperationKey = keyof typeof OPERATIONS
export type OperationMeta = (typeof OPERATIONS)[OperationKey]
