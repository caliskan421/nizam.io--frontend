import { expect, it, vi } from 'vitest'

import { ApiError } from '@/shared/errors/api-error'

import { createThumbnailQueue } from './thumbnail-queue'

function pendingImage() {
  let finish!: (image: Blob) => void
  const reading = new Promise<Blob>((resolve) => {
    finish = resolve
  })
  return { reading, finish }
}

it('iki eşzamanlı okuma yapar ve beklerken iptal edilen isteği göndermez', async () => {
  const queue = createThumbnailQueue()
  const signal = new AbortController().signal
  const disposed = new AbortController()
  const image = new Blob()
  const first = pendingImage()
  const second = pendingImage()
  const skipped = vi.fn(() => Promise.resolve(image))
  const live = vi.fn(() => Promise.resolve(image))

  const firstRead = queue(signal, () => first.reading)
  const secondRead = queue(signal, () => second.reading)
  const aborted = queue(disposed.signal, skipped)
  const nextRead = queue(signal, live)
  await Promise.resolve()
  expect(live).not.toHaveBeenCalled()
  disposed.abort()

  first.finish(image)
  second.finish(image)
  await expect(aborted).resolves.toBeNull()
  expect(skipped).not.toHaveBeenCalled()
  await expect(nextRead).resolves.toBe(image)
  await Promise.all([firstRead, secondRead])
})

it('429 sonrasında Retry-After boyunca yeni istek göndermez', async () => {
  const queue = createThumbnailQueue()
  const signal = new AbortController().signal
  const image = new Blob()
  const read = vi.fn(() => Promise.resolve(image))
  const clock = vi.spyOn(Date, 'now').mockReturnValue(1000)
  try {
    await expect(
      queue(signal, () =>
        Promise.reject(new ApiError({ code: 'records.busy', status: 429, retryAfter: 60 })),
      ),
    ).rejects.toMatchObject({ status: 429 })
    clock.mockReturnValue(60_999)
    await expect(queue(signal, read)).resolves.toBeNull()
    expect(read).not.toHaveBeenCalled()
    clock.mockReturnValue(61_000)
    await expect(queue(signal, read)).resolves.toBe(image)
  } finally {
    clock.mockRestore()
  }
})
