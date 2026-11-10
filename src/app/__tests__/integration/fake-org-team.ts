// Sahte backend: ekip (üyelik, koordinatör), kullanıcı/hesap ve departman kataloğu uçları.
// Ayrıntı ve sözleşme notları `fake-org.ts` başlığında.
import { http } from 'msw'

import type { TeamRole } from '@/shared/scope/standing-facts'

import { envelope, fakeOrg as o, json, ORIGIN, type Account, type OrgDb } from './fake-org'

/** Ekip yazması yetkisi: yönetici her birimde; koordinatör yalnız kendi biriminde. */
function canManageTeam(db: OrgDb, me: Account | null, program: string, department: string) {
  if (!me) return false
  return me.admin || o.teamIn(db, me.account_id, program, department) === 'coordinator'
}

/** Kişinin bu birimdeki açık atamaları (onay kapısı + devir). */
function openAssignments(db: OrgDb, program: string, department: string, accountId: string) {
  return db.items.filter(
    (i) =>
      i.program_id === program &&
      i.department_id === department &&
      o.isOpen(i) &&
      i.assignee_account_ids.includes(accountId),
  )
}

/** Açık atamaları işlemi yapana devreder; devredilen görev sayısı. */
function handOver(db: OrgDb, items: ReturnType<typeof openAssignments>, from: string, to: Account) {
  for (const i of items) {
    const ids = i.assignee_account_ids.filter((id) => id !== from)
    if (!ids.includes(to.account_id)) ids.push(to.account_id)
    i.assignee_account_ids = ids
    i.assignees = ids.map((id) => ({ account_id: id, full_name: o.accountName(db, id) }))
  }
  return items.length
}

/**
 * Onay kapısı: açık ataması olan kişide onaysız istek → 409 `confirmation_required` (başlıklar
 * `fields[]`); onaylıysa devir yapılır ve `apply` çalışır.
 */
function gated(
  db: OrgDb,
  me: Account,
  target: { program: string; department: string; accountId: string },
  confirmed: boolean,
  apply: () => void,
) {
  const open = openAssignments(db, target.program, target.department, target.accountId)
  if (open.length > 0 && !confirmed) {
    return envelope(
      'organization.confirmation_required',
      409,
      open.map((i) => ({ field: 'work_item', code: 'organization.task_title', message: i.title })),
    )
  }
  const moved = handOver(db, open, target.accountId, me)
  apply()
  const membership = db.memberships.find(
    (m) =>
      m.account_id === target.accountId &&
      m.program_id === target.program &&
      m.department_id === target.department,
  )
  return json({
    membership_id: membership?.membership_id ?? 'm-silindi',
    unassigned_tasks: moved,
    warning: moved > 0,
  })
}

function removeRow(db: OrgDb, program: string, department: string, accountId: string) {
  db.memberships = db.memberships.filter(
    (m) =>
      !(m.account_id === accountId && m.program_id === program && m.department_id === department),
  )
}

function setTeam(
  db: OrgDb,
  program: string,
  department: string,
  accountId: string,
  team: TeamRole,
) {
  const row = db.memberships.find(
    (m) => m.account_id === accountId && m.program_id === program && m.department_id === department,
  )
  if (row) row.team = team
  else {
    db.memberships.push({
      program_id: program,
      department_id: department,
      account_id: accountId,
      team,
      membership_id: o.next(db, 'm'),
    })
  }
}

function rosterHandlers(db: OrgDb) {
  return [
    http.get(`${ORIGIN}/v1/departments/:id/members`, ({ request, params }) => {
      const me = o.actorOf(db, request)
      const program = o.programOf(request)
      const department = String(params.id)
      const allowed = me && (me.admin || o.teamIn(db, me.account_id, program, department) !== null)
      if (!allowed) return o.forbidden('organization')
      const members = db.memberships
        .filter((m) => m.program_id === program && m.department_id === department)
        .map((m) => ({
          account_id: m.account_id,
          full_name: o.accountName(db, m.account_id),
          membership_id: m.membership_id,
          role: db.roles[m.team],
          status: 'active',
        }))
      return json({ members })
    }),
    http.get(`${ORIGIN}/v1/departments/:id/assignable`, ({ request, params }) => {
      const me = o.actorOf(db, request)
      const program = o.programOf(request)
      const department = String(params.id)
      if (!canManageTeam(db, me, program, department)) return o.forbidden('organization')
      const accounts = db.accounts
        .filter((a) => !a.deleted && o.teamIn(db, a.account_id, program, department) === null)
        .map((a) => ({ account_id: a.account_id, full_name: a.full_name, roles: [] }))
      return json({ accounts })
    }),
  ]
}

function membershipWrites(db: OrgDb) {
  return [
    http.post(`${ORIGIN}/v1/departments/:id/memberships`, async ({ request, params }) => {
      const me = o.actorOf(db, request)
      const program = o.programOf(request)
      const department = String(params.id)
      if (!canManageTeam(db, me, program, department)) return o.forbidden('organization')
      const body = (await request.json()) as { account_id: string; role: string }
      if (o.teamIn(db, body.account_id, program, department) !== null) {
        return envelope('organization.membership_exists', 409)
      }
      setTeam(db, program, department, body.account_id, o.teamOf(db, body.role) ?? 'member')
      const row = db.memberships.at(-1)!
      return json({ ...row, role: body.role }, 201)
    }),
    http.patch(
      `${ORIGIN}/v1/departments/:id/memberships/:accountId`,
      async ({ request, params }) => {
        const me = o.actorOf(db, request)
        const program = o.programOf(request)
        const department = String(params.id)
        if (!me || !me.admin) return o.forbidden('organization')
        const body = (await request.json()) as { role: string; confirm?: boolean }
        const accountId = String(params.accountId)
        const team = o.teamOf(db, body.role) ?? 'member'
        return gated(db, me, { program, department, accountId }, body.confirm === true, () =>
          setTeam(db, program, department, accountId, team),
        )
      },
    ),
    http.delete(`${ORIGIN}/v1/departments/:id/memberships/:accountId`, ({ request, params }) => {
      const me = o.actorOf(db, request)
      const program = o.programOf(request)
      const department = String(params.id)
      if (!me || !canManageTeam(db, me, program, department)) return o.forbidden('organization')
      const accountId = String(params.accountId)
      const confirmed = new URL(request.url).searchParams.get('confirm') === 'true'
      return gated(db, me, { program, department, accountId }, confirmed, () =>
        removeRow(db, program, department, accountId),
      )
    }),
  ]
}

function coordinatorWrites(db: OrgDb) {
  return [
    http.post(`${ORIGIN}/v1/departments/:id/coordinator`, async ({ request, params }) => {
      const me = o.actorOf(db, request)
      const program = o.programOf(request)
      const department = String(params.id)
      if (!me || !me.admin) return o.forbidden('organization')
      const body = (await request.json()) as { account_id: string }
      setTeam(db, program, department, body.account_id, 'coordinator')
      const row = db.memberships.find(
        (m) =>
          m.account_id === body.account_id &&
          m.program_id === program &&
          m.department_id === department,
      )!
      return json({
        account_id: body.account_id,
        department_id: department,
        membership_id: row.membership_id,
        role: db.roles.coordinator,
        changed: true,
      })
    }),
    http.delete(`${ORIGIN}/v1/departments/:id/coordinator/:accountId`, ({ request, params }) => {
      const me = o.actorOf(db, request)
      const program = o.programOf(request)
      const department = String(params.id)
      if (!me || !me.admin) return o.forbidden('organization')
      const accountId = String(params.accountId)
      const confirmed = new URL(request.url).searchParams.get('confirm') === 'true'
      return gated(db, me, { program, department, accountId }, confirmed, () =>
        setTeam(db, program, department, accountId, 'member'),
      )
    }),
  ]
}

function userLabels(db: OrgDb, accountId: string): string[] {
  return o
    .rowsOf(db, accountId)
    .map((m) => `${m.program_id}:${m.department_id}:${db.roles[m.team]}`)
}

function listUsers(db: OrgDb, url: URL) {
  const search = url.searchParams.get('search')?.toLocaleLowerCase('tr-TR') ?? ''
  const order = url.searchParams.get('sort_order') === 'desc' ? -1 : 1
  return db.accounts
    .filter((a) => !a.deleted && a.full_name.toLocaleLowerCase('tr-TR').includes(search))
    .sort((a, b) => order * a.full_name.localeCompare(b.full_name, 'tr'))
    .map((a) => ({
      account_id: a.account_id,
      full_name: a.full_name,
      memberships: userLabels(db, a.account_id),
    }))
}

interface CreateUserBody {
  email: string
  full_name?: string
  program_id: string
  department_id: string
  role?: string
}

function userHandlers(db: OrgDb) {
  const admin = (request: Request) => o.actorOf(db, request)?.admin === true
  return [
    http.get(`${ORIGIN}/v1/admin/users`, ({ request }) =>
      admin(request)
        ? json({ users: listUsers(db, new URL(request.url)) })
        : o.forbidden('organization'),
    ),
    http.post(`${ORIGIN}/v1/admin/users`, async ({ request }) => {
      if (!admin(request)) return o.forbidden('organization')
      const body = (await request.json()) as CreateUserBody
      if (db.accounts.some((a) => a.email === body.email)) {
        return envelope('identity.account_exists', 409)
      }
      const account: Account = {
        account_id: o.next(db, 'u-yeni'),
        full_name: body.full_name ?? body.email,
        email: body.email,
        admin: false,
      }
      db.accounts.push(account)
      const team = o.teamOf(db, body.role) ?? 'member'
      setTeam(db, body.program_id, body.department_id, account.account_id, team)
      const membership = db.memberships.at(-1)!.membership_id
      return json({ account_id: account.account_id, membership_id: membership, created: true }, 201)
    }),
    http.delete(`${ORIGIN}/v1/admin/users/:id`, ({ request, params }) => {
      const me = o.actorOf(db, request)
      if (!me?.admin) return o.forbidden('organization')
      const id = String(params.id)
      for (const m of o.rowsOf(db, id)) {
        handOver(db, openAssignments(db, m.program_id, m.department_id, id), id, me)
      }
      db.memberships = db.memberships.filter((m) => m.account_id !== id)
      const account = db.accounts.find((a) => a.account_id === id)
      if (account) account.deleted = true
      return json({ account_id: id })
    }),
    http.patch(`${ORIGIN}/v1/admin/accounts/:id`, ({ request, params }) =>
      admin(request)
        ? json({ account_id: String(params.id), revoked_sessions: 0 })
        : o.forbidden('organization'),
    ),
  ]
}

function catalogHandlers(db: OrgDb) {
  const admin = (request: Request) => o.actorOf(db, request)?.admin === true
  return [
    http.get(`${ORIGIN}/v1/departments`, ({ request }) =>
      admin(request) ? json({ departments: db.catalog }) : o.forbidden('organization'),
    ),
    http.get(`${ORIGIN}/v1/admin/deleted/departments`, () => json({ departments: [] })),
    http.post(`${ORIGIN}/v1/departments`, async ({ request }) => {
      if (!admin(request)) return o.forbidden('organization')
      const body = (await request.json()) as { name: string; kind: string; code?: string }
      const same = (a?: string, b?: string) =>
        a !== undefined &&
        b !== undefined &&
        a.toLocaleLowerCase('tr') === b.toLocaleLowerCase('tr')
      const clash = db.catalog.find((c) => same(c.name, body.name))
      if (clash) {
        // v0.15 (BE-050): mevcut departman zarfta (kimlik + silinmişlik).
        return envelope('organization.department_exists', 409, [
          {
            field: 'department_id',
            code: 'organization.existing_department',
            message: clash.department_id,
          },
          { field: 'deleted', code: 'organization.existing_department', message: 'false' },
        ])
      }
      if (db.catalog.some((c) => same(c.code, body.code))) {
        return envelope('organization.department_code_conflict', 409)
      }
      const created = { department_id: o.next(db, 'd-yeni'), ...body }
      db.catalog.push(created)
      return json(created, 201)
    }),
    http.post(`${ORIGIN}/v1/program/departments`, async ({ request }) => {
      if (!admin(request)) return o.forbidden('program')
      if (db.failNextLink) {
        db.failNextLink = false
        return envelope('program.department_link_name_exists', 409)
      }
      const program = o.programOf(request)
      const body = (await request.json()) as { department_id: string; display_name?: string }
      const name = db.catalog.find((c) => c.department_id === body.department_id)?.name ?? ''
      const link = { program_id: program, department_id: body.department_id }
      const existing = o.linkOf(db, program, body.department_id)
      const display = existing?.display_name ?? body.display_name ?? name
      if (!existing) db.links.push({ ...link, display_name: display })
      return json({ ...link, display_name: display, copied_member_count: 0 }, 201)
    }),
  ]
}

function catalogEdits(db: OrgDb) {
  const admin = (request: Request) => o.actorOf(db, request)?.admin === true
  return [
    // readProgramDepartment (v0.14, BE-049): görünürlük listProgramDepartments ile aynı; bağsız → 404.
    http.get(`${ORIGIN}/v1/program/departments/:departmentId`, ({ request, params }) => {
      const me = o.actorOf(db, request)
      const program = o.programOf(request)
      if (!me || (!me.admin && o.rowsOf(db, me.account_id, program).length === 0)) {
        return o.forbidden('organization')
      }
      const link = o.linkOf(db, program, String(params.departmentId))
      if (!link) return envelope('program.department_not_found', 404)
      const catalog = db.catalog.find((c) => c.department_id === link.department_id)
      return json({
        department_id: link.department_id,
        display_name: link.display_name,
        kind: catalog?.kind ?? 'koordinatorluk',
        ...(catalog?.code && { code: catalog.code }),
        ...(catalog?.description && { description: catalog.description }),
      })
    }),
    http.patch(`${ORIGIN}/v1/program/departments/:departmentId`, async ({ request, params }) => {
      const link = o.linkOf(db, o.programOf(request), String(params.departmentId))
      if (!admin(request)) return o.forbidden('program')
      if (!link) return envelope('program.department_not_found', 404)
      const body = (await request.json()) as { display_name: string }
      link.display_name = body.display_name
      return json({ ...link, copied_member_count: 0 })
    }),
    http.patch(`${ORIGIN}/v1/departments/:id`, async ({ request, params }) => {
      const found = db.catalog.find((c) => c.department_id === params.id)
      if (!admin(request)) return o.forbidden('organization')
      if (!found) return envelope('organization.department_not_found', 404)
      Object.assign(found, await request.json())
      return json(found)
    }),
  ]
}

export function teamHandlers(db: OrgDb) {
  return [
    ...rosterHandlers(db),
    ...membershipWrites(db),
    ...coordinatorWrites(db),
    ...userHandlers(db),
    ...catalogHandlers(db),
    ...catalogEdits(db),
    http.post(`${ORIGIN}/v1/admin/accounts/:id/unlock`, () =>
      envelope('identity.account_not_locked', 409),
    ),
    http.patch(`${ORIGIN}/v1/admin/users/:id`, ({ params }) =>
      json({ account_id: String(params.id), changed_fields: [] }),
    ),
  ]
}
