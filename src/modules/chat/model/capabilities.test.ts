import { describe, expect, it } from 'vitest'

import type { Standing } from '@/shared/scope/standing-facts'

import { msg } from '../__tests__/fixtures'
import {
  memberRoleFacts,
  canChooseSource,
  canCreateGroup,
  canCreateTaskFromMessage,
  chatCapabilities,
  coordinatorDepartments,
  messageFacts,
  taskTargetDepartments,
  type ChatActor,
  type ChatFacts,
} from './capabilities'

const row = (programId: string, departmentId: string, role: 'coordinator' | 'member') => ({
  programId,
  programName: 'P',
  departmentId,
  displayName: departmentId,
  role,
})

const standing = (over: Partial<Standing>): Standing => ({
  accountId: 'me',
  fullName: 'Ben',
  email: 'b@x.test',
  companyAdmin: false,
  rows: [],
  ...over,
})

const ADMIN: ChatActor = { standing: standing({ companyAdmin: true }), programId: 'p1' }
const COORD: ChatActor = {
  standing: standing({ rows: [row('p1', 'd1', 'coordinator'), row('p2', 'd9', 'coordinator')] }),
  programId: 'p1',
}
const MEMBER: ChatActor = {
  standing: standing({ rows: [row('p1', 'd1', 'member')] }),
  programId: 'p1',
}
const NOBODY: ChatActor = { standing: null, programId: 'p1' }

const group = (role: 'admin' | 'founder' | 'member', over: Partial<ChatFacts> = {}): ChatFacts => ({
  kind: 'group',
  role,
  autoKind: null,
  source: 'none',
  ...over,
})
const DIRECT: ChatFacts = { kind: 'direct', role: 'member', autoKind: null, source: 'none' }

describe('program rolü (mercekten bağımsız)', () => {
  it('grup kurma: programda rolü olan herkes; rolsüz ya da program yok → hayır', () => {
    expect([ADMIN, COORD, MEMBER].map(canCreateGroup)).toEqual([true, true, true])
    expect(canCreateGroup(NOBODY)).toBe(false)
    expect(canCreateGroup({ ...MEMBER, programId: 'p9' })).toBe(false)
    expect(canCreateGroup({ ...MEMBER, programId: null })).toBe(false)
  })

  it('kaynak seçimi ve mesajdan görev: yalnız ŞY ve koordinatör (getChat.role değil)', () => {
    expect([ADMIN, COORD, MEMBER].map(canChooseSource)).toEqual([true, true, false])
    expect([ADMIN, COORD, MEMBER].map(canCreateTaskFromMessage)).toEqual([true, true, false])
  })

  it('koordinatör yalnız SEÇİLİ programın koordinatörlükleri; başka program sayılmaz', () => {
    expect(coordinatorDepartments(COORD)).toEqual(['d1'])
    expect(coordinatorDepartments({ ...COORD, programId: 'p2' })).toEqual(['d9'])
    expect(coordinatorDepartments(MEMBER)).toEqual([])
  })

  it('hedef koordinatörlük çipleri: ŞY hepsi, K yalnız koordinatörü olduğu, Ü hiçbiri', () => {
    const all = ['d1', 'd2', 'd3']
    expect(taskTargetDepartments(ADMIN, all)).toEqual(all)
    expect(taskTargetDepartments(COORD, all)).toEqual(['d1'])
    expect(taskTargetDepartments(MEMBER, all)).toEqual([])
  })
})

describe('grup rolü: üye yönetimi, ad, silme, sabitleme, @herkes', () => {
  it('üye (member): yönetim yok; birebirde sabitleme iki tarafa açık', () => {
    const caps = chatCapabilities(MEMBER, group('member'))
    expect(caps).toMatchObject({
      renameGroup: false,
      addMembers: false,
      grantAdmin: false,
      deleteGroup: false,
      mentionAll: false,
      pin: false,
      createPoll: true,
    })
    const direct = chatCapabilities(MEMBER, DIRECT)
    expect(direct).toMatchObject({ pin: true, createPoll: false, mentionAll: false })
    expect(direct.renameGroup).toBe(false)
  })

  it('kurucu (founder): ekler/çıkarır/adlandırır/siler/sabitler; yönetici yapamaz; başkasının mesajını silemez', () => {
    const caps = chatCapabilities(MEMBER, group('founder'))
    expect(caps).toMatchObject({
      renameGroup: true,
      addMembers: true,
      deleteGroup: true,
      pin: true,
      mentionAll: true,
      grantAdmin: false,
      changeSource: false,
    })
    expect(caps.deleteMessage(messageFacts(msg(1, { sender_account_id: 'u2' })))).toBe(false)
    expect(caps.deleteMessage(messageFacts(msg(1, { sender_account_id: 'me' })))).toBe(true)
  })

  it('yönetici (admin): her mesajı siler, yönetici yapar; kaynak ayarı yalnız ŞY/K ile', () => {
    const caps = chatCapabilities(COORD, group('admin'))
    expect(caps.deleteMessage(messageFacts(msg(1, { sender_account_id: 'u2' })))).toBe(true)
    expect(caps).toMatchObject({ grantAdmin: true, changeSource: true })
    // Üyenin kurduğu grupta ŞY yönetici DEĞİLDİR (rol getChat'ten gelir): founder/member davranır.
    const adminAsMember = chatCapabilities(ADMIN, group('member'))
    expect(adminAsMember.addMembers).toBe(false)
    expect(adminAsMember.deleteMessage(messageFacts(msg(1)))).toBe(false)
  })

  it('kendiliğinden grupta (auto_kind) ad değişmez', () => {
    expect(chatCapabilities(ADMIN, group('admin', { autoKind: 'general' })).renameGroup).toBe(false)
    expect(chatCapabilities(ADMIN, group('admin')).renameGroup).toBe(true)
  })

  it('kaynaktan gelen üye çıkarılamaz ve ayrılamaz (from_source)', () => {
    const caps = chatCapabilities(ADMIN, group('admin'))
    expect(caps.removeMember({ fromSource: true })).toBe(false)
    expect(caps.removeMember({ fromSource: false })).toBe(true)
    expect(caps.leaveGroup({ fromSource: true })).toBe(false)
    expect(caps.leaveGroup({ fromSource: false })).toBe(true)
    expect(chatCapabilities(ADMIN, DIRECT).leaveGroup({ fromSource: false })).toBe(false)
    expect(chatCapabilities(MEMBER, group('member')).removeMember({ fromSource: false })).toBe(
      false,
    )
  })
})

describe('mesaj eylemleri', () => {
  const caps = chatCapabilities(MEMBER, group('member'))
  const poll = (closed: boolean, closesAt: string | null = null) =>
    msg(2, {
      sender_account_id: 'me',
      poll: {
        closed_at: closed ? '2026-11-14T09:00:00Z' : null,
        closes_at: closesAt,
        multi: false,
        results: [],
      },
    })

  it('düzenle: yalnız gönderen ve anket değil', () => {
    expect(caps.editMessage(messageFacts(msg(1, { sender_account_id: 'me' })))).toBe(true)
    expect(caps.editMessage(messageFacts(msg(1, { sender_account_id: 'u2' })))).toBe(false)
    expect(caps.editMessage(messageFacts(poll(false)))).toBe(false)
  })

  it('anket: oy yalnız açıkken; bitir yalnız açan ve açıkken; süresi geçen kapalı sayılır', () => {
    const now = Date.parse('2026-11-14T12:00:00Z')
    expect(caps.vote(messageFacts(poll(false), now))).toBe(true)
    expect(caps.vote(messageFacts(poll(true), now))).toBe(false)
    expect(caps.vote(messageFacts(poll(false, '2026-11-14T11:00:00Z'), now))).toBe(false)
    expect(caps.vote(messageFacts(poll(false, '2026-11-14T13:00:00Z'), now))).toBe(true)
    expect(caps.closePoll(messageFacts(poll(false), now))).toBe(true)
    expect(caps.closePoll(messageFacts({ ...poll(false), sender_account_id: 'u2' }, now))).toBe(
      false,
    )
    expect(caps.vote(messageFacts(msg(1)))).toBe(false)
  })

  it('göreve dönüştür program rolüne bağlı; ikinci görev uyarısı task_ids doluyken', () => {
    const withTask = messageFacts(msg(1, { task_ids: ['w1'] }))
    expect(chatCapabilities(MEMBER, group('admin')).createTask(withTask)).toBe(false)
    expect(chatCapabilities(COORD, group('member')).createTask(withTask)).toBe(true)
    expect(chatCapabilities(COORD, group('member')).warnSecondTask(withTask)).toBe(true)
    expect(chatCapabilities(COORD, group('member')).warnSecondTask(messageFacts(msg(1)))).toBe(
      false,
    )
    expect(chatCapabilities(MEMBER, group('admin')).warnSecondTask(withTask)).toBe(false)
  })

  it('standing yokken hiçbir mesaj eylemi açık değil', () => {
    const none = chatCapabilities(NOBODY, group('member'))
    expect(none.editMessage(messageFacts(msg(1, { sender_account_id: 'me' })))).toBe(false)
    expect(none.deleteMessage(messageFacts(msg(1, { sender_account_id: 'me' })))).toBe(false)
  })
})

describe('üye satırı olguları (grup rolü)', () => {
  it('rozet ve yönetici eylemi: üye → yap, yönetici → al, kurucu → yok', () => {
    expect(memberRoleFacts('member')).toEqual({ badge: null, adminAction: 'grant' })
    expect(memberRoleFacts('admin')).toEqual({ badge: 'admin', adminAction: 'revoke' })
    expect(memberRoleFacts('founder')).toEqual({ badge: 'founder', adminAction: null })
  })
})
