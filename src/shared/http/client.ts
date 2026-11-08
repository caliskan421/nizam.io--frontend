import createClient, { type Client, type Middleware } from 'openapi-fetch'

import { OPERATIONS, type OperationKey, type OperationMeta } from '@/shared/api/operations.gen'
import type { paths } from '@/shared/api/schema'
import { ApiError, clientError } from '@/shared/errors/api-error'
import type { AuthSession } from '@/shared/session/auth-session'
import type { ScopeSnapshot } from '@/shared/scope/scope'

/** Ara katmanın kendisi eklediği başlıklar; çağıranın vermesi gerekmez. */
type InjectedHeader = 'X-Requested-With' | 'X-Nizamio-Program' | 'X-Nizamio-Department'

type OmitInjected<P> = P extends { header?: infer H }
  ? Omit<P, 'header'> & {
      header?: Omit<NonNullable<H>, InjectedHeader> &
        Partial<Pick<NonNullable<H>, Extract<keyof NonNullable<H>, InjectedHeader>>>
    }
  : P

type WithInjectedHeaders<Op> = Op extends { parameters: infer P }
  ? Omit<Op, 'parameters'> & { parameters: OmitInjected<P> }
  : Op

/**
 * Üretilmiş `paths` tipinin, CSRF ve kapsam başlıkları isteğe bağlı kılınmış hâli. Gövde ve
 * yanıt tipleri aynen schema.d.ts'ten gelir; bu yalnız ara katmanın eklediği başlıkları
 * çağıranın yükünden alır (tip türetimidir, elle DTO değildir).
 */
export type ClientPaths = {
  [Path in keyof paths]: {
    [Method in keyof paths[Path]]: WithInjectedHeaders<paths[Path][Method]>
  }
}

export type ApiClient = Client<ClientPaths>

export const CSRF_HEADER_VALUE = 'XMLHttpRequest'

/** Refresh denenmeyecek uçlar: 401'leri oturum hakkında hükümdür, döngü yapmaz. */
const NO_REFRESH: ReadonlySet<string> = new Set(['login', 'refresh', 'logout'])

const WRITE_METHODS: ReadonlySet<string> = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export interface ApiClientDeps {
  baseUrl: string
  session: AuthSession
  /** İstek anında aktif kapsamı verir (Pinia kapsam deposu). */
  scope: () => ScopeSnapshot
  fetch?: (input: Request) => Promise<Response>
}

const PROGRAM_HEADER = 'X-Nizamio-Program'
const DEPARTMENT_HEADER = 'X-Nizamio-Department'

/** Çağıranın verdiği kapsam başlıklarını okur ve siler; hiçbiri yoksa null. */
function takeExplicitScope(headers: Headers): ScopeSnapshot | null {
  const programId = headers.get(PROGRAM_HEADER) || null
  const departmentId = headers.get(DEPARTMENT_HEADER) || null
  headers.delete(PROGRAM_HEADER)
  headers.delete(DEPARTMENT_HEADER)
  return programId === null && departmentId === null ? null : { programId, departmentId }
}

/**
 * Kapsam başlıkları (3. ara katman). İki kaynak, ASLA karışmaz:
 *  - **İsteğe özel kapsam:** çağıran `X-Nizamio-Program` (+ `X-Nizamio-Department`) başlığını
 *    verdiyse başlıklar aynen o değerden yazılır, depo okunmaz. Korumalı yazma eylemin
 *    yakaladığı kapsamı, tek göreve ait istek görevin kendi `program_id`/`department_id`'sini
 *    burada verir (istemci-akislari §2). Böylece gönderim kapısı (`engine.ts` `blockedSend`)
 *    ile ara katman arasında kapsam değişse de başlık eylemin kapsamıdır (W16 devri,
 *    CX-F0-E-06 kalan mikro görev boşluğu).
 *  - **Depo kapsamı:** başlık verilmediyse S2/S3'te istek anındaki `deps.scope()`.
 * Kapsam sınıfı başlık istemeyen uçta (S0/S1) yalnız açıkça verilen başlık gider (ör.
 * `issueDownloadTicket`: kapsam bilete yazılır). Eksik kapsamda istek gönderilmez.
 */
function applyScopeHeaders(
  headers: Headers,
  meta: OperationMeta,
  readScope: () => ScopeSnapshot,
): void {
  const explicit = takeExplicitScope(headers)
  const scopedOperation = meta.programHeader || meta.departmentHeader
  if (!scopedOperation && !explicit) return

  const scope = explicit ?? readScope()
  if (!scope.programId || (meta.departmentHeader && !scope.departmentId)) {
    throw clientError('client.scope_missing')
  }
  headers.set(PROGRAM_HEADER, scope.programId)
  const withDepartment = meta.departmentHeader || explicit !== null
  if (withDepartment && scope.departmentId) headers.set(DEPARTMENT_HEADER, scope.departmentId)
}

export function operationMeta(method: string, schemaPath: string): OperationMeta | undefined {
  const key = `${method.toUpperCase()} ${schemaPath}`
  return Object.hasOwn(OPERATIONS, key) ? OPERATIONS[key as OperationKey] : undefined
}

/**
 * openapi-fetch istemcisi + ara katmanlar:
 *  1. Sözleşme kapısı: uç operations.gen.ts'te yoksa istek gönderilmez (client.unknown_operation).
 *  2. CSRF: bütün yazmalarda `X-Requested-With`.
 *  3. Kapsam: S2 → `X-Nizamio-Program`, S3 → ek `X-Nizamio-Department`; kapsam yoksa
 *     istek gönderilmez (client.scope_missing). Çağıranın verdiği isteğe özel kapsam depo
 *     kapsamının önüne geçer (`applyScopeHeaders`). S0/S1'de yalnız açıkça verilen başlık.
 *  4. Kimlik: `Authorization: Bearer <bellekteki belirteç>` (S0 uçlarda gönderilmez).
 *  5. 401 → tek uçuş refresh → orijinal istek BİR kez tekrarlanır. Refresh/login/logout
 *     uçlarında refresh denenmez.
 *  6. 403 `identity.force_password_change_required` → oturumda zorunlu parola değişimi bayrağı.
 */
export function createApiClient(deps: ApiClientDeps): ApiClient {
  const doFetch = deps.fetch ?? ((input: Request) => globalThis.fetch(input))
  /** Tekrar için isteğin gönderilmeden önceki kopyası (gövde akışı tüketilmeden). */
  const pending = new Map<string, { clone: Request; token: string | null; meta: OperationMeta }>()

  const middleware: Middleware = {
    onRequest({ request, schemaPath, id }) {
      const meta = operationMeta(request.method, schemaPath)
      if (!meta) throw clientError('client.unknown_operation')

      const headers = request.headers
      if (WRITE_METHODS.has(request.method.toUpperCase())) {
        headers.set('X-Requested-With', CSRF_HEADER_VALUE)
      }

      applyScopeHeaders(headers, meta, deps.scope)

      const token = meta.auth ? deps.session.token : null
      if (token) headers.set('Authorization', `Bearer ${token}`)
      else headers.delete('Authorization')

      pending.set(id, { clone: request.clone(), token, meta })
      return request
    },

    async onResponse({ response, id }) {
      const entry = pending.get(id)
      pending.delete(id)
      if (!entry) return response

      if (response.status === 403) {
        const code = await peekCode(response)
        if (code === 'identity.force_password_change_required')
          deps.session.markForcePasswordChange()
        return response
      }

      if (response.status !== 401 || !entry.meta.auth || NO_REFRESH.has(entry.meta.operationId)) {
        return response
      }

      const outcome = await deps.session.refresh(entry.token)
      if (outcome !== 'ok' || !deps.session.token) return response

      // Orijinal istek yeni belirteçle bir kez tekrarlanır; ikinci 401 olduğu gibi döner.
      const retry = new Request(entry.clone)
      retry.headers.set('Authorization', `Bearer ${deps.session.token}`)
      return doFetch(retry)
    },

    onError({ error, id }) {
      pending.delete(id)
      if (error instanceof ApiError) return error
      return clientError('client.network_error', { cause: error })
    },
  }

  const client = createClient<ClientPaths>({
    baseUrl: deps.baseUrl,
    fetch: doFetch,
    credentials: 'same-origin',
  })
  client.use(middleware)
  return client
}

async function peekCode(response: Response): Promise<string | null> {
  try {
    const body: unknown = await response.clone().json()
    if (typeof body === 'object' && body !== null && 'code' in body) {
      const code = body.code
      return typeof code === 'string' ? code : null
    }
  } catch {
    // JSON değil: kod yok.
  }
  return null
}
