import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  collectTokens,
  generate,
  gitBlobId,
  SOURCE_COPY,
  verifyPin,
  WEB_TOKENS,
  type SourceFile,
  type WebFile,
} from '../../../scripts/gen-tokens'

const root = process.cwd()
const copy = readFileSync(resolve(root, SOURCE_COPY))
const pin = (
  JSON.parse(readFileSync(resolve(root, 'api-pin.json'), 'utf8')) as { designTokens: unknown }
).designTokens as { repo: string; commit: string; path: string; blob: string }
const source = JSON.parse(copy.toString('utf8')) as SourceFile
const web = JSON.parse(readFileSync(resolve(root, WEB_TOKENS), 'utf8')) as WebFile

const clone = <T>(value: T): T => structuredClone(value)

describe('tasarım sistemi kopyası ve pin (api-pin.json designTokens)', () => {
  it('git blob kimliği `git hash-object` ile aynı hesaplanır', () => {
    // printf hello | git hash-object --stdin
    expect(gitBlobId(new TextEncoder().encode('hello'))).toBe(
      'b6fc4c620b67d95f953a5c1c1230aaab5db5a1b0',
    )
  })

  it('depodaki kopya pinle uyuşur; pin kaynak commit ve yolu taşır', () => {
    const { repo, commit, path, blob } = pin
    expect(verifyPin(pin, copy)).toEqual({ repo, commit, path, blob })
    expect(pin.commit).toMatch(/^[0-9a-f]{40}$/)
    expect(pin.path).toBe('docs/design/design sytem/tokens.json')
  })

  it('kopyada tek bayt değişirse üretim durur (blob uyuşmazlığı)', () => {
    const tampered = Buffer.from(copy)
    tampered[tampered.length - 2] = tampered[tampered.length - 2]! ^ 1
    expect(() => verifyPin(pin, tampered)).toThrow(/blob [0-9a-f]{40} ≠ pin/)
  })

  it('pin yanlış blob gösterirse üretim durur', () => {
    expect(() => verifyPin({ ...pin, blob: '0'.repeat(40) }, copy)).toThrow(/≠ pin/)
  })

  it('eksik ya da biçimsiz pin reddedilir', () => {
    expect(() => verifyPin(undefined, copy)).toThrow(/designTokens/)
    expect(() => verifyPin({ ...pin, commit: 'main' }, copy)).toThrow(/designTokens/)
  })
})

describe('gen:tokens çıktıları', () => {
  it('commit edilmiş üretilmiş dosyalar kaynaktan yeniden üretilenle birebir aynı', () => {
    for (const [file, content] of Object.entries(generate(root))) {
      expect(readFileSync(resolve(root, file), 'utf8'), file).toBe(content)
    }
  })

  it('kaynaktaki bir ad web dosyasında tekrar tanımlanamaz', () => {
    const w = clone(web)
    w.groups.color!.tokens.push({ name: 'bg-base', value: '#000000' })
    expect(() => collectTokens(source, w)).toThrow(/iki kez tanımlı/)
  })

  it('çözülemeyen başvuru, temasızdan temalıya başvuru ve döngü reddedilir', () => {
    const unknown = clone(web)
    unknown.groups.color!.tokens.push({ name: 'x-ref', value: { dark: '{yok}', light: '{yok}' } })
    expect(() => collectTokens(source, unknown)).toThrow(/çözülemeyen/)

    const frozen = clone(web)
    frozen.groups.color!.tokens.push({ name: 'x-static', value: '{bg-base}' })
    expect(() => collectTokens(source, frozen)).toThrow(/temalı/)

    const cycle = clone(web)
    cycle.groups.color!.tokens.push(
      { name: 'x-a', value: '{x-b}' },
      { name: 'x-b', value: '{x-a}' },
    )
    expect(() => collectTokens(source, cycle)).toThrow(/döngüsel/)
  })

  it('CSS bildirimini kıracak değer ve geçersiz ad reddedilir', () => {
    const unsafe = clone(web)
    unsafe.groups.color!.tokens.push({ name: 'x-bad', value: 'red; } body { color: red' })
    expect(() => collectTokens(source, unsafe)).toThrow(/güvensiz/)

    const badName = clone(web)
    badName.groups.color!.tokens.push({ name: 'X_Bad', value: '#000000' })
    expect(() => collectTokens(source, badName)).toThrow(/geçersiz ad/)
  })
})
