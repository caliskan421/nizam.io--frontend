import { expect, it } from 'vitest'

import {
  beginTableCreation,
  finishTableCreation,
  reconcileTableCreation,
  tableCreationKey,
  tableCreationPhase,
} from './create-guard'

it('uçuş ve belirsizlik korumasını hesap, program ve çalışma alanı başına ayırır', async () => {
  const target = { programId: 'guard-test', departmentId: null }
  const key = tableCreationKey('owner', target)
  const ticket = beginTableCreation(key, false)!
  expect(tableCreationPhase(key)).toBe('pending')
  expect(beginTableCreation(key, false)).toBeUndefined()
  expect(await reconcileTableCreation(key, () => Promise.resolve(true))).toBe(false)
  finishTableCreation(key, ticket, true)
  expect(tableCreationPhase(key)).toBe('uncertain')
  expect(tableCreationPhase(tableCreationKey('other', target))).toBeUndefined()
  expect(
    tableCreationPhase(tableCreationKey('owner', { ...target, departmentId: 'd1' })),
  ).toBeUndefined()
  expect(
    tableCreationPhase(tableCreationKey('owner', { ...target, programId: 'other' })),
  ).toBeUndefined()
  expect(await reconcileTableCreation(key, () => Promise.resolve(false))).toBe(false)
  expect(tableCreationPhase(key)).toBe('uncertain')
  expect(await reconcileTableCreation(key, () => Promise.resolve(true))).toBe(true)
  expect(tableCreationPhase(key)).toBeUndefined()
})
