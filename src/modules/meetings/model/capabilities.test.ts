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
    const participant = meetingCapabilities(actor(false), 'p', meeting)
    expect([
      participant.manage,
      participant.manageParticipants,
      participant.editNote(note),
    ]).toEqual([false, false, true])
    expect(participant.editNote({ ...note, converted: true })).toBe(false)
    expect(coordinator.editNote(note)).toBe(false)
    expect(coordinator.deleteNote({ ...note, converted: true })).toBe(true)
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
