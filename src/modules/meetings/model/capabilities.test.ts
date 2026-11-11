import { describe, expect, it } from 'vitest'
import type { Standing } from '@/shared/scope/standing-facts'
import { meetingCapabilities } from './capabilities'

const row = {
  programId: 'p',
  programName: 'P',
  departmentId: 'd',
  displayName: 'D',
  role: 'coordinator' as const,
}
const actor = (admin: boolean, rows: Standing['rows'] = []): Standing => ({
  accountId: 'a',
  fullName: '',
  email: '',
  companyAdmin: admin,
  rows,
})
const meeting = {
  inviteMode: 'coordinatorship' as const,
  ownerDepartmentId: 'd',
  departmentIds: ['d'],
  createdByAccountId: 'a',
  membersIncluded: true,
  participant: false,
  viewerRole: 'member' as const,
}
const note = { authorAccountId: 'a', authorRole: 'member', converted: false }

describe('meeting capabilities', () => {
  it('distinguishes admin, linked coordinator and participant', () => {
    const admin = meetingCapabilities(actor(true), 'p', meeting)
    expect([admin.manage, admin.manageParticipants, admin.deleted]).toEqual([true, false, true])
    const coordinator = meetingCapabilities(actor(false, [row]), 'p', meeting)
    expect([coordinator.manage, coordinator.manageParticipants, coordinator.deleted]).toEqual([
      true,
      true,
      false,
    ])
    const participant = meetingCapabilities(
      actor(false, [{ ...row, departmentId: 'other', role: 'member' }]),
      'p',
      { ...meeting, participant: true },
    )
    expect([
      participant.manage,
      participant.manageParticipants,
      participant.editNote(note),
    ]).toEqual([false, false, true])
    expect(participant.editNote({ ...note, converted: true })).toBe(false)
    expect(coordinator.editNote(note)).toBe(false)
    expect(coordinator.deleteNote({ ...note, converted: true })).toBe(true)
  })
  it('applies visibility to both invitation modes and requires a program row for participants', () => {
    const member = { ...row, role: 'member' as const }
    const foreign = { ...row, departmentId: 'other' }
    for (const inviteMode of ['coordinatorship', 'person'] as const) {
      const facts = { ...meeting, inviteMode, createdByAccountId: 'b' }
      expect(meetingCapabilities(actor(true), 'p', facts).visible).toBe(true)
      expect(meetingCapabilities(actor(false), 'p', { ...facts, participant: true }).visible).toBe(
        false,
      )
      expect(meetingCapabilities(actor(false, [foreign]), 'p', facts).visible).toBe(false)
      expect(
        meetingCapabilities(actor(false, [foreign]), 'p', { ...facts, participant: true }).visible,
      ).toBe(true)
      expect(meetingCapabilities(actor(false, [row]), 'p', facts).visible).toBe(
        inviteMode === 'coordinatorship',
      )
      expect(meetingCapabilities(actor(false, [member]), 'p', facts).visible).toBe(
        inviteMode === 'coordinatorship',
      )
      expect(
        meetingCapabilities(actor(false, [member]), 'p', { ...facts, membersIncluded: false })
          .visible,
      ).toBe(false)
      expect(meetingCapabilities(actor(false), 'p', facts).editNote(note)).toBe(false)
    }
    const lost = { ...meeting, inviteMode: 'person' as const, participant: true }
    expect(meetingCapabilities(actor(false, [member]), 'p', lost).visible).toBe(true)
    expect(meetingCapabilities(actor(false, [member]), 'p', lost).manage).toBe(false)
    expect(
      meetingCapabilities(actor(false, [member]), 'p', { ...lost, participant: false }).visible,
    ).toBe(false)
  })
  it('requires the creator to retain owner coordination in person mode', () => {
    const person = { ...meeting, inviteMode: 'person' as const }
    expect(meetingCapabilities(actor(false, [row]), 'p', person).manage).toBe(true)
    expect(
      meetingCapabilities(actor(false, [row]), 'p', { ...person, createdByAccountId: 'b' }).manage,
    ).toBe(false)
    expect(meetingCapabilities(actor(false), 'p', person).manage).toBe(false)
    expect(meetingCapabilities(actor(false, [row]), 'other', person).manage).toBe(false)
    expect(meetingCapabilities(actor(true), 'p', person).manageParticipants).toBe(true)
    expect(
      meetingCapabilities(actor(true), 'p', person).convertNote({ ...note, converted: true }),
    ).toBe(false)
  })
})
